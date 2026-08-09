#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const websiteRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(websiteRoot, 'docs', 'getting-started', 'configuration.mdx');
const i18nRoot = path.join(websiteRoot, 'i18n');
const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';
const marker = '<!-- notemd-settings-favorites-guide -->';
const MAX_LOCALES_PER_RUN = 8;
const MAX_CONTEXT_TOKENS = 30000;
const TRANSLATION_MAX_TOKENS = 1800;
const protectedTokens = ['Notemd', 'Obsidian', 'Mermaid', 'Drawnix', 'Vault', 'PPI', 'PNG', 'SVG', 'PDF', '★ Favorites'];

const localeNames = {
  ar: 'Arabic', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish',
  fa: 'Persian', fi: 'Finnish', fr: 'French', he: 'Hebrew', hi: 'Hindi', hu: 'Hungarian', id: 'Indonesian',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish',
  pt: 'Portuguese', 'pt-BR': 'Brazilian Portuguese', ro: 'Romanian', ru: 'Russian', sv: 'Swedish',
  th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', vi: 'Vietnamese', 'zh-CN': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese', 'zh-TW': 'Traditional Chinese for Taiwan',
};

function parseArguments(argv) {
  const localeArgument = argv.find((argument) => argument.startsWith('--locales='));
  const write = argv.includes('--write');
  if (!localeArgument) throw new Error('Usage: node translate-settings-favorites-guide.cjs --write --locales=zh-CN,ja,...');
  const locales = localeArgument.slice('--locales='.length).split(',').map((locale) => locale.trim()).filter(Boolean);
  if (locales.length === 0 || locales.some((locale) => !localeNames[locale])) {
    throw new Error('Every locale must exist in the localeNames catalog.');
  }
  if (locales.length > MAX_LOCALES_PER_RUN) {
    throw new Error(`Process at most ${MAX_LOCALES_PER_RUN} locales per run.`);
  }
  return {locales, write};
}

function normalize(content) {
  return content.replace(/\r\n/g, '\n').trim() + '\n';
}

function extractSection(source) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing ${marker} in English configuration source.`);
  const end = source.indexOf('\n---\n', markerIndex);
  return source.slice(markerIndex, end >= 0 ? end : source.length).trim();
}

function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

function systemPromptFor(locale) {
  const placeholders = protectedTokens.map((_, index) => `NOTEMD_TOKEN_${index}`).join(', ');
  return [
    'You are a documentation localization engineer.',
    `Translate the Markdown section into ${localeNames[locale]}.`,
    'Return only the translated section.',
    'Preserve the marker, heading level, Markdown bullets, inline code, product names, setting labels, UI symbols, and every placeholder exactly.',
    `Never omit, translate, reorder, or reformat these placeholders: ${placeholders}.`,
  ].join(' ');
}

function assertContextBudget(locale, section) {
  const systemPrompt = systemPromptFor(locale);
  const estimatedContext = estimateTokenCount(`${systemPrompt}\n${section}`) + TRANSLATION_MAX_TOKENS;
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

function stripFence(content) {
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:md|markdown)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function clipSection(content) {
  const start = content.indexOf(marker);
  if (start < 0) return content.trim();
  const end = content.indexOf('\n---\n', start);
  return content.slice(start, end >= 0 ? end : content.length).trim();
}

function validateTranslation(source, content, locale) {
  if (!content.includes(marker) || !/^##\s+/m.test(content)) {
    throw new Error(`${locale}: translated section lost the marker or heading`);
  }
  for (const token of protectedTokens.filter((candidate) => source.includes(candidate))) {
    if (!content.includes(token)) throw new Error(`${locale}: translated section lost required token ${token}`);
  }
}

function insertSection(document, section) {
  const normalizedDocument = normalize(document);
  const sectionStart = normalizedDocument.indexOf(marker);
  if (sectionStart >= 0) {
    const nextRule = normalizedDocument.indexOf('\n---\n', sectionStart);
    const end = nextRule >= 0 ? nextRule : normalizedDocument.length;
    return `${normalizedDocument.slice(0, sectionStart).trimEnd()}\n\n${section.trim()}\n${normalizedDocument.slice(end).trimStart()}`;
  }

  const tldrEnd = normalizedDocument.indexOf('\n---\n', normalizedDocument.indexOf('</TLDR>'));
  if (tldrEnd < 0) throw new Error('Unable to find configuration document insertion boundary.');
  return `${normalizedDocument.slice(0, tldrEnd).trimEnd()}\n\n${section.trim()}\n${normalizedDocument.slice(tldrEnd).trimStart()}`;
}

async function translateSection(section, locale) {
  assertContextBudget(locale, section);
  const protectedSection = protectTokens(section);
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: TRANSLATION_MAX_TOKENS,
          messages: [
            {role: 'system', content: `${systemPromptFor(locale)} This is validation attempt ${attempt}; output every placeholder even if the surrounding sentence is unchanged.`},
            {role: 'user', content: protectedSection.text},
          ],
        }),
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`${locale}: LM Studio returned HTTP ${response.status}: ${body.slice(0, 500)}`);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (error) {
        throw new Error(`${locale}: LM Studio returned invalid JSON: ${body.slice(0, 500)}`);
      }
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error(`${locale}: LM Studio returned no content`);
      const translated = normalize(clipSection(protectedSection.restore(stripFence(content))));
      validateTranslation(section, translated, locale);
      return translated;
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function main() {
  const {locales, write} = parseArguments(process.argv.slice(2));
  const englishSection = extractSection(fs.readFileSync(sourcePath, 'utf8'));
  for (const locale of locales) {
    const targetPath = path.join(i18nRoot, locale, 'docusaurus-plugin-content-docs', 'current', 'getting-started', 'configuration.mdx');
    if (!fs.existsSync(targetPath)) throw new Error(`${locale}: missing localized configuration page: ${targetPath}`);
    process.stdout.write(`[${locale}] translating... `);
    const translated = await translateSection(englishSection, locale);
    if (write) fs.writeFileSync(targetPath, insertSection(fs.readFileSync(targetPath, 'utf8'), translated), 'utf8');
    process.stdout.write(write ? 'written\n' : 'validated\n');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
