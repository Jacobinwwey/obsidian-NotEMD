const fs = require('fs');
const path = require('path');

const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';
const marker = '<!-- notemd-settings-discovery-guide -->';
const MAX_LOCALES_PER_RUN = 8;
const MAX_CONTEXT_TOKENS = 30000;
const TRANSLATION_MAX_TOKENS = 2200;
const protectedTokens = ['Notemd', 'Obsidian', 'Mermaid', 'Vault', 'PPI', 'PNG', 'SVG', 'PDF', '★ Favorites'];
const source = `${marker}
## Settings discovery, diagram history, CircuitikZ, and safe batch folders

The Notemd settings page provides field-aware fuzzy search, large category navigation, a collapsible discovery toolbar, and per-setting favorites stored for the current Vault. Click **★ Favorites** to open a dedicated list; each entry jumps to its setting and can be removed without leaving the settings page.

- Diagram history is stored at Vault scope, ordered newest first, searchable and paginated in groups of 20. Removing a history record does not delete generated files.
- Diagram preview export PPI defaults to 300 and accepts 72-600. It controls PNG rasterization only; SVG and PDF remain vector-based.
- Also export complete Mermaid visuals optionally writes Mermaid source, SVG, and manifest companions; Mermaid remains available in Drawnix previews when it is disabled.
- Preferred diagram type and preferred source format are separate choices.
- Desktop users can open the optional CircuitikZ native compile environment to reuse system Tectonic/pdflatex, select a custom compiler, or explicitly install the pinned managed Tectonic runtime. Preview, SVG, PNG, and preview PDF exports do not require LaTeX.
- Advanced batch file selection enables saved selection profiles and rule previews.
- A missing batch target folder can be created after confirmation, with an option to remember automatic creation for future missing folders.
- An existing non-empty folder requires one confirmation before the whole batch, never one confirmation per generated file.
- Developer mode reveals provider diagnostics and advanced troubleshooting controls.
`;
const requiredTokens = protectedTokens.filter((token) => source.includes(token));

const languageNames = {
  ar: 'Arabic', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish',
  fi: 'Finnish', fr: 'French', he: 'Hebrew', hi: 'Hindi', hu: 'Hungarian', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese',
  ro: 'Romanian', ru: 'Russian', sv: 'Swedish', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', vi: 'Vietnamese',
  zh_Hant: 'Traditional Chinese'
};

function parseArguments(argv) {
  const options = {locales: [], write: false, normalizeExisting: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--write') {
      options.write = true;
      continue;
    }
    if (argument === '--normalize-existing') {
      options.normalizeExisting = true;
      continue;
    }
    if (argument === '--locales') {
      index += 1;
      options.locales = (argv[index] || '').split(',').map((locale) => locale.trim()).filter(Boolean);
      continue;
    }
    if (argument.startsWith('--locales=')) {
      options.locales = argument.slice('--locales='.length).split(',').map((locale) => locale.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  const localesArgument = options.locales;
  const locales = localesArgument.length > 0 ? localesArgument : Object.keys(languageNames);
  if (locales.length === 0 || locales.some((locale) => !languageNames[locale])) {
    throw new Error('Use --locales=<comma-separated locale codes> from the languageNames catalog.');
  }
  if (locales.length > MAX_LOCALES_PER_RUN) {
    throw new Error(`Process at most ${MAX_LOCALES_PER_RUN} locales per run.`);
  }
  return {...options, locales};
}

function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

function systemPromptFor(locale) {
  const placeholders = protectedTokens.map((_, index) => `NOTEMD_TOKEN_${index}`).join(', ');
  return `Translate Markdown into ${languageNames[locale]}. Return only the translated Markdown. Preserve the HTML marker, headings, bullets, technical names, and every placeholder exactly. Never omit, translate, reorder, or reformat these placeholders: ${placeholders}.`;
}

function assertContextBudget(locale) {
  const systemPrompt = systemPromptFor(locale);
  const estimatedContext = estimateTokenCount(`${systemPrompt}\n${source}`) + TRANSLATION_MAX_TOKENS;
  if (estimatedContext >= MAX_CONTEXT_TOKENS) {
    throw new Error(`${locale}: estimated request context ${estimatedContext} exceeds ${MAX_CONTEXT_TOKENS} token budget`);
  }
}

function protectTokens(text) {
  const replacements = protectedTokens.map((token, index) => ({token, placeholder: `NOTEMD_TOKEN_${index}`}));
  let protectedText = text;
  for (const {token, placeholder} of replacements) protectedText = protectedText.split(token).join(placeholder);
  return {
    text: protectedText,
    restore: (translated) => replacements.reduce((result, {token, placeholder}) => result.split(placeholder).join(token), translated),
  };
}

function normalize(content) {
  return content.replace(/\r\n/g, '\n').trim() + '\n';
}

function extractSection(content) {
  const markerOffset = content.indexOf(marker);
  if (markerOffset < 0) return null;
  return content.slice(markerOffset).trim();
}

function validateTranslation(content, locale) {
  const normalized = normalize(content);
  if (!normalized.includes(marker) || !/^##\s+/m.test(normalized)) {
    throw new Error(`${locale}: translated section lost the marker or heading`);
  }
  for (const token of requiredTokens) {
    if (!normalized.includes(token)) throw new Error(`${locale}: translated section lost required token ${token}`);
  }
  return normalized;
}

function insertSection(document, section) {
  const normalizedDocument = normalize(document);
  const markerOffset = normalizedDocument.indexOf(marker);
  if (markerOffset >= 0) {
    return `${normalizedDocument.slice(0, markerOffset).trimEnd()}\n\n${section.trim()}\n`;
  }
  return `${normalizedDocument.trimEnd()}\n\n${section.trim()}\n`;
}

async function translate(locale) {
  assertContextBudget(locale);
  const protectedSource = protectTokens(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: TRANSLATION_MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPromptFor(locale) },
          { role: 'user', content: protectedSource.text }
        ]
      })
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`${locale}: LM Studio returned HTTP ${response.status}: ${body.slice(0, 500)}`);
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      throw new Error(`${locale}: LM Studio returned invalid JSON: ${body.slice(0, 500)}`);
    }
    const content = payload.choices?.[0]?.message?.content?.trim();
    const restored = content ? protectedSource.restore(content) : '';
    return validateTranslation(restored, locale);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const options = parseArguments(process.argv.slice(2));
  const locales = options.locales;
  for (const locale of locales) {
    const file = path.join(root, `README_${locale}.md`);
    const current = fs.readFileSync(file, 'utf8');
    if (options.normalizeExisting) {
      const existingSection = extractSection(current);
      if (!existingSection) throw new Error(`${locale}: missing ${marker} in ${file}`);
      const normalized = validateTranslation(existingSection, locale);
      if (options.write) fs.writeFileSync(file, insertSection(current, normalized), 'utf8');
      process.stdout.write(`${locale} normalized${options.write ? ' and written' : ''}\n`);
      continue;
    }
    const translated = await translate(locale);
    if (options.write) fs.writeFileSync(file, insertSection(current, translated), 'utf8');
    process.stdout.write(`${locale} translated${options.write ? ' and written' : ''}\n`);
  }
}

main().catch(error => { console.error(error); process.exit(1); });
