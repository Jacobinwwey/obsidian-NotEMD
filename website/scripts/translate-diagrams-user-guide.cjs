#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const websiteRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(websiteRoot, 'docs', 'features', 'diagrams.mdx');
const i18nRoot = path.join(websiteRoot, 'i18n');
const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';
const MAX_LOCALES_PER_RUN = 8;
const MAX_CONTEXT_TOKENS = 30000;
const TRANSLATION_MAX_TOKENS = Number(process.env.LM_TRANSLATION_MAX_TOKENS || 6000);
const TRANSLATION_TIMEOUT_MS = Number(process.env.LM_TRANSLATION_TIMEOUT_MS || 5 * 60 * 1000);
const localeNames = {
  ar: 'Arabic', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish',
  fa: 'Persian', fi: 'Finnish', fr: 'French', he: 'Hebrew', hi: 'Hindi', hu: 'Hungarian', id: 'Indonesian',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish',
  pt: 'Portuguese', 'pt-BR': 'Brazilian Portuguese', ro: 'Romanian', ru: 'Russian', sv: 'Swedish',
  th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', vi: 'Vietnamese', 'zh-CN': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese', 'zh-TW': 'Traditional Chinese for Taiwan',
};

function parseArguments(argv) {
  const options = {locales: [], write: false, normalizeExisting: false, sectioned: false};
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--write') {
      options.write = true;
      continue;
    }
    if (argument === '--normalize-existing') {
      options.normalizeExisting = true;
      continue;
    }
    if (argument === '--sectioned') {
      options.sectioned = true;
      continue;
    }
    if (argument === '--locales') {
      index += 1;
      options.locales = (argv[index] || '').split(',').map((locale) => locale.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.locales.length === 0) {
    throw new Error('--locales requires one or more comma-separated locale codes');
  }
  if (!options.normalizeExisting && options.locales.length > MAX_LOCALES_PER_RUN) {
    throw new Error('Process at most 8 locales per run to stay within the 32k model context budget');
  }
  return options;
}

function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

function assertContextBudget(sourceBody, locale) {
  const systemPrompt = [
    'You are a documentation localization engineer.',
    'Translate the complete MDX user guide into the requested locale.',
    'Return only the complete translated MDX document without a code fence or explanation.',
    'Preserve frontmatter keys, MDX imports, Markdown structure, heading levels, tables, list numbering, links, inline code, file extensions, and product names.',
    'Do not translate: Notemd, Obsidian, Mermaid, JSON Canvas, Draw.io, Drawnix, CircuitikZ, TikZJax, SVG, PNG, PDF, TLDR.',
    `The target language is ${localeNames[locale]} (${locale}). The input starts at the H1 heading. Translate headings, prose, table descriptions, steps, and troubleshooting text.`,
  ].join(' ');
  const userPrompt = `Target locale: ${locale}\n\n${sourceBody}`;
  const estimatedContext = estimateTokenCount(`${systemPrompt}\n${userPrompt}`) + TRANSLATION_MAX_TOKENS;
  if (estimatedContext >= MAX_CONTEXT_TOKENS) {
    throw new Error(`${locale}: estimated request context ${estimatedContext} exceeds ${MAX_CONTEXT_TOKENS} token budget`);
  }
}

function normalizeMdx(content) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd() + '\n';
}

function stripModelFence(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:mdx|markdown)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function headingShape(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.match(/^#+/)[0].length);
}

function alignHeadingLevels(source, translated) {
  const sourceLevels = headingShape(source);
  const translatedLines = translated.split('\n');
  const translatedHeadingIndexes = [];
  for (let index = 0; index < translatedLines.length; index += 1) {
    if (/^#{1,6}\s+/.test(translatedLines[index])) translatedHeadingIndexes.push(index);
  }
  if (sourceLevels.length !== translatedHeadingIndexes.length) return translated;
  translatedHeadingIndexes.forEach((lineIndex, headingIndex) => {
    translatedLines[lineIndex] = `${'#'.repeat(sourceLevels[headingIndex])}${translatedLines[lineIndex].replace(/^#{1,6}/, '')}`;
  });
  return translatedLines.join('\n');
}

function splitMdxDocument(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)\s*import TLDR from '@site\/src\/components\/TLDR';\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Unable to split MDX frontmatter, import, and body');
  }
  return {frontmatter: match[1], body: match[2].trim()};
}

function validateTranslation(source, translated, locale) {
  if (!translated.startsWith('---\n') || !translated.includes("import TLDR from '@site/src/components/TLDR';")) {
    throw new Error(`${locale}: frontmatter or TLDR import was not preserved`);
  }
  if (JSON.stringify(headingShape(translated)) !== JSON.stringify(headingShape(source))) {
    throw new Error(`${locale}: heading levels do not mirror the English guide`);
  }
  const sourceH1 = source.split(/\r?\n/).find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim();
  const translatedH1 = translated.split(/\r?\n/).find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim();
  if (sourceH1 && translatedH1 === sourceH1) throw new Error(`${locale}: English H1 was not translated`);
  const scriptRequirements = {
    'zh-CN': /[\u4e00-\u9fff]/, 'zh-Hant': /[\u4e00-\u9fff]/, 'zh-TW': /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u30ff]/, ko: /[\uac00-\ud7af]/, ar: /[\u0600-\u06ff]/, fa: /[\u0600-\u06ff]/,
    he: /[\u0590-\u05ff]/, th: /[\u0e00-\u0e7f]/, hi: /[\u0900-\u097f]/, bn: /[\u0980-\u09ff]/,
    ru: /[\u0400-\u04ff]/, uk: /[\u0400-\u04ff]/, el: /[\u0370-\u03ff]/,
  };
  if (scriptRequirements[locale] && !scriptRequirements[locale].test(translatedH1 || '')) {
    throw new Error(`${locale}: translated H1 does not contain the expected script`);
  }
  if (locale !== 'ko' && locale !== 'ja' && !/^zh/.test(locale) && /[\uac00-\ud7af]/.test(translatedH1 || '')) {
    throw new Error(`${locale}: translated H1 contains Hangul from another locale`);
  }
  if (locale !== 'ko' && locale !== 'ja' && !/^zh/.test(locale) && /[\u4e00-\u9fff]/.test(translatedH1 || '')) {
    throw new Error(`${locale}: translated H1 contains CJK text from another locale`);
  }
  for (const token of ['Notemd', 'Obsidian', 'Mermaid', 'JSON Canvas', 'Draw.io', 'Drawnix', 'CircuitikZ', 'TikZJax', 'SVG', 'PNG', 'PDF', '.canvas', '.drawio', '.drawnix', '.tex']) {
    if (!translated.includes(token)) {
      throw new Error(`${locale}: missing preserved token ${token}`);
    }
  }
  if (/preferredDiagramRenderTarget|cmos-inverter-v1|--compile-executable|Golden Reference Prompt Shape/.test(translated)) {
    throw new Error(`${locale}: maintainer-only content leaked into the user guide`);
  }
}

async function translateGuide(sourceBody, locale, attempt = 1) {
  assertContextBudget(sourceBody, locale);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
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
          {
            role: 'system',
            content: [
              'You are a documentation localization engineer.',
              'Translate the complete MDX user guide into the requested locale.',
              'Return only the complete translated MDX document without a code fence or explanation.',
              'Preserve frontmatter keys, MDX imports, Markdown structure, heading levels, tables, list numbering, links, inline code, file extensions, and product names.',
              'Do not translate: Notemd, Obsidian, Mermaid, JSON Canvas, Draw.io, Drawnix, CircuitikZ, TikZJax, SVG, PNG, PDF, TLDR.',
              `The target language is ${localeNames[locale]} (${locale}). This is validation attempt ${attempt}; reproduce every heading level exactly. The input starts at the H1 heading. Translate headings, prose, table descriptions, steps, and troubleshooting text.`,
            ].join(' '),
          },
          {
            role: 'user',
            content: `Target locale: ${locale}\n\n${sourceBody}`,
          },
        ],
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${locale}: LM Studio returned HTTP ${response.status}: ${body.slice(0, 500)}`);
    }
    const payload = JSON.parse(body);
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error(`${locale}: LM Studio returned no translated document`);
    }
    return stripModelFence(content).replace(/\r\n/g, '\n').trim();
  } finally {
    clearTimeout(timeout);
  }
}

function splitBodyIntoChunks(body, maxCharacters = 3600) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let current = [];
  let inFence = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) inFence = !inFence;
    if (!inFence && /^#{1,6}\s+/.test(line) && current.length && current.some((item) => /^#{1,6}\s+/.test(item))) {
      parts.push(current.join('\n'));
      current = [];
    }
    current.push(line);
    if (current.join('\n').length >= maxCharacters && current.some((item) => /^#{1,6}\s+/.test(item)) && !inFence) {
      parts.push(current.join('\n'));
      current = [];
    }
  }
  if (current.length) parts.push(current.join('\n'));
  return parts.filter((part) => part.trim());
}

async function translateGuideSectioned(sourceBody, locale) {
  const chunks = splitBodyIntoChunks(sourceBody);
  const translatedChunks = [];
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const sourceChunk = chunks[chunkIndex];
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          signal: controller.signal,
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: 3500,
            messages: [
              {
                role: 'system',
                content: [
                  'You are a documentation localization engineer.',
                  `Translate this Markdown/MDX chunk into ${localeNames[locale]} (${locale}).`,
                  'Return only the translated chunk. Preserve every heading marker and level, blank-line structure, table pipe, code fence, inline code, URL, and technical identifier.',
                  'Do not translate Notemd, Obsidian, Mermaid, JSON Canvas, Draw.io, Drawnix, CircuitikZ, TikZJax, SVG, PNG, PDF, or TLDR.',
                  `Validation attempt ${attempt}; do not add an explanation or a code fence around the chunk.`,
                ].join(' '),
              },
              {role: 'user', content: `Target language: ${localeNames[locale]} (${locale})\nChunk ${chunkIndex + 1}/${chunks.length}:\n${sourceChunk}`},
            ],
          }),
        });
        const responseBody = await response.text();
        if (!response.ok) throw new Error(`${locale} chunk ${chunkIndex + 1}: HTTP ${response.status}: ${responseBody.slice(0, 300)}`);
        const payload = JSON.parse(responseBody);
        const content = payload.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) throw new Error(`${locale} chunk ${chunkIndex + 1}: empty response`);
        let translatedChunk = stripModelFence(content).replace(/\r\n/g, '\n').trim();
        if (JSON.stringify(headingShape(sourceChunk)) !== JSON.stringify(headingShape(translatedChunk))) {
          const sourceHeading = sourceChunk.match(/^(#{1,6})\s+(.+)$/m);
          if (sourceHeading && !/^#{1,6}\s+/.test(translatedChunk)) {
            const translatedHeading = await translateHeadingLine(sourceHeading[0], locale);
            translatedChunk = `${translatedHeading}\n\n${translatedChunk}`;
          }
          translatedChunk = alignHeadingLevels(sourceChunk, translatedChunk);
        }
        if (JSON.stringify(headingShape(sourceChunk)) !== JSON.stringify(headingShape(translatedChunk))) {
          throw new Error(`${locale} chunk ${chunkIndex + 1}: heading levels changed source=${JSON.stringify(headingShape(sourceChunk))} translated=${JSON.stringify(headingShape(translatedChunk))}`);
        }
        translatedChunks.push(translatedChunk);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 1) process.stdout.write(`chunk-${chunkIndex + 1}-retry `);
      } finally {
        clearTimeout(timeout);
      }
    }
    if (lastError) throw lastError;
  }
  return translatedChunks.join('\n\n');
}

async function translateHeadingLine(sourceHeading, locale) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(TRANSLATION_TIMEOUT_MS, 120000));
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 300,
        messages: [
          {role: 'system', content: `Translate one Markdown heading into ${localeNames[locale]} (${locale}). Return only the heading, preserve its # level exactly.`},
          {role: 'user', content: sourceHeading},
        ],
      }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`${locale}: heading translation HTTP ${response.status}`);
    const content = stripModelFence(JSON.parse(body).choices?.[0]?.message?.content || '').trim();
    if (!/^#{1,6}\s+/.test(content)) throw new Error(`${locale}: heading translation returned no heading`);
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const options = parseArguments(process.argv);
  const source = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  const sourceParts = splitMdxDocument(source);

  for (const locale of options.locales) {
    process.stdout.write(`[${locale}] translating... `);
    const targetPath = path.join(
      i18nRoot,
      locale,
      'docusaurus-plugin-content-docs',
      'current',
      'features',
      'diagrams.mdx'
    );
    if (!fs.existsSync(targetPath)) {
      throw new Error(`${locale}: expected localized source does not exist: ${targetPath}`);
    }
    if (options.normalizeExisting) {
      const normalized = normalizeMdx(fs.readFileSync(targetPath, 'utf8'));
      validateTranslation(source, normalized, locale);
      if (options.write) {
        fs.writeFileSync(targetPath, normalized, 'utf8');
        process.stdout.write('normalized and written\n');
      } else {
        process.stdout.write('normalized (dry run)\n');
      }
      continue;
    }

    const localizedParts = splitMdxDocument(fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n'));
    let translated;
    let lastError;
    if (options.sectioned) {
      const translatedBody = await translateGuideSectioned(sourceParts.body, locale);
      translated = normalizeMdx(`${localizedParts.frontmatter}\nimport TLDR from '@site/src/components/TLDR';\n\n${alignHeadingLevels(source, translatedBody)}\n`);
      validateTranslation(source, translated, locale);
    }
    for (let attempt = 1; !translated && attempt <= 1; attempt += 1) {
      try {
        const translatedBody = await translateGuide(sourceParts.body, locale, attempt);
        const candidate = normalizeMdx(`${localizedParts.frontmatter}\nimport TLDR from '@site/src/components/TLDR';\n\n${alignHeadingLevels(source, translatedBody)}\n`);
        validateTranslation(source, candidate, locale);
        translated = candidate;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) process.stdout.write(`retry-${attempt} `);
      }
    }
    if (!translated) {
      process.stdout.write('sectioned ');
      try {
        const translatedBody = await translateGuideSectioned(sourceParts.body, locale);
        const candidate = normalizeMdx(`${localizedParts.frontmatter}\nimport TLDR from '@site/src/components/TLDR';\n\n${alignHeadingLevels(source, translatedBody)}\n`);
        validateTranslation(source, candidate, locale);
        translated = candidate;
      } catch (sectionedError) {
        throw sectionedError || lastError;
      }
    }
    if (options.write) {
      fs.writeFileSync(targetPath, translated, 'utf8');
      process.stdout.write('validated and written\n');
    } else {
      process.stdout.write('validated (dry run)\n');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
