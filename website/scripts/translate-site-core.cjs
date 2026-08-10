#!/usr/bin/env node

/*
 * Controlled site localization for the public documentation surface.
 *
 * Every request is keyed by locale, source path, source hash, mode, and batch
 * index. The model never receives an implicit array position as identity.
 * Requests are grouped by estimated input + output context, keeping the sum
 * below the 32k model window requested for the LM Studio endpoint.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const websiteRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(websiteRoot, 'docs');
const i18nRoot = path.join(websiteRoot, 'i18n');
const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';
const maxContextTokens = 30000;
const defaultBatchSize = 8;
const requestTimeoutMs = 10 * 60 * 1000;
const localeNames = {
  ar: 'Arabic', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish',
  fa: 'Persian', fi: 'Finnish', fr: 'French', he: 'Hebrew', hi: 'Hindi', hu: 'Hungarian', id: 'Indonesian',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish',
  pt: 'Portuguese', 'pt-BR': 'Brazilian Portuguese', ro: 'Romanian', ru: 'Russian', sv: 'Swedish',
  th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', vi: 'Vietnamese', 'zh-CN': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese', 'zh-TW': 'Traditional Chinese for Taiwan',
};

const protectedTechnicalTokens = [
  'Notemd', 'Obsidian', 'Mermaid', 'JSON Canvas', 'Vega-Lite', 'Draw.io', 'Drawnix',
  'CircuitikZ', 'TikZJax', 'DiagramSpec', 'CircuitSpec', 'SVG', 'PNG', 'PDF', 'TLDR',
  'OpenAI', 'Anthropic', 'Google', 'LM Studio', 'Ollama', 'DeepSeek', 'Qwen', 'GitHub',
];

const englishUi = {
  next: 'Next',
  docs: 'Docs',
  faq: 'FAQ',
  gettingStarted: 'Getting Started',
  coreFeatures: 'Core Features',
  providers: 'LLM Providers',
  advanced: 'Advanced',
  community: 'Community',
  more: 'More',
  sponsor: 'Sponsor',
  logoAlt: 'Notemd logo',
  built: 'Built with Docusaurus.',
  license: 'MIT License',
};

const englishCode = {
  edit: 'Edit this page',
  lastUpdated: 'Last updated on',
  next: 'Next page',
  previous: 'Previous page',
  search: 'Search',
  noResults: 'No results found',
  seeAll: 'See all results',
  toc: 'On this page',
  skip: 'Skip to main content',
  breadcrumbs: 'Breadcrumbs',
  docsSidebar: 'Docs sidebar',
  mainNav: 'Main navigation',
  backToTop: 'Back to top',
  copy: 'Copy',
  copied: 'Copied',
  copyAria: 'Copy code to clipboard',
  notFoundTitle: 'Page not found',
  notFoundBody: 'We could not find the page you were looking for.',
  language: 'Language',
  colorToggle: 'Switch between dark and light mode',
  close: 'Close',
  expand: 'Expand sidebar',
  collapse: 'Collapse sidebar',
};

function parseArguments(argv) {
  const options = {mode: '', locales: [], write: false, batchSize: defaultBatchSize};
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${argument} requires a value`);
      return argv[index];
    };
    if (argument === '--mode' || argument.startsWith('--mode=')) options.mode = argument.startsWith('--mode=') ? argument.slice('--mode='.length) : readValue();
    else if (argument === '--locales' || argument.startsWith('--locales=')) {
      const value = argument.startsWith('--locales=') ? argument.slice('--locales='.length) : readValue();
      options.locales = value.split(',').map((x) => x.trim()).filter(Boolean);
    }
    else if (argument === '--write') options.write = true;
    else if (argument === '--batch-size' || argument.startsWith('--batch-size=')) {
      options.batchSize = Number(argument.startsWith('--batch-size=') ? argument.slice('--batch-size='.length) : readValue());
    }
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!['faq', 'ui', 'home', 'home-boundary'].includes(options.mode)) throw new Error('--mode must be faq, ui, home, or home-boundary');
  if (!options.locales.length) throw new Error('--locales requires comma-separated locale codes');
  if (options.batchSize < 1 || options.batchSize > 8) throw new Error('--batch-size must be between 1 and 8');
  for (const locale of options.locales) {
    if (!localeNames[locale]) throw new Error(`Unsupported locale: ${locale}`);
  }
  return options;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n');
}

function stripModelFence(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json|md|mdx|markdown)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseModelJson(text, requestId) {
  const stripped = stripModelFence(text);
  try {
    return JSON.parse(stripped);
  } catch (error) {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch (nestedError) {
        throw new Error(`${requestId}: invalid JSON response: ${stripped.slice(0, 600)}`);
      }
    }
    throw new Error(`${requestId}: invalid JSON response: ${stripped.slice(0, 600)}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson({requestId, targetLocale, sourcePath, sourceHash, payload, maxTokens}) {
  const system = [
    'You are a senior documentation localization engineer.',
    `Translate content into ${localeNames[targetLocale]} (${targetLocale}).`,
    'Return only one valid JSON object with exactly the same keys and array lengths as the input.',
    'Preserve Markdown/MDX structure, heading levels, list numbering, table pipes, URLs, file paths, inline code, code fences, and product names.',
    `Never translate or remove these technical tokens: ${protectedTechnicalTokens.join(', ')}.`,
    'Never invent facts, omit sentences, or add explanations outside the JSON object.',
    `Request identity: ${requestId}; source path: ${sourcePath}; source hash: ${sourceHash}.`,
    'The response must be RFC 8259 JSON: use ASCII double quotes for every key and string, escape embedded quotes, and do not use typographic quotation marks as JSON delimiters.',
  ].join(' ');
  const user = JSON.stringify({targetLocale, sourcePath, sourceHash, payload}, null, 2);
  const estimatedContext = estimateTokens(`${system}\n${user}`) + maxTokens;
  if (estimatedContext >= maxContextTokens) {
    throw new Error(`${requestId}: estimated context ${estimatedContext} exceeds ${maxContextTokens}`);
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          stream: false,
          messages: [
            {role: 'system', content: system},
            {role: 'user', content: user},
          ],
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        const error = new Error(`${requestId}: LM Studio HTTP ${response.status}: ${responseText.slice(0, 500)}`);
        error.status = response.status;
        throw error;
      }
      const envelope = JSON.parse(responseText);
      const choice = envelope.choices?.[0];
      if (!choice?.message?.content) throw new Error(`${requestId}: LM Studio returned no content`);
      if (choice.finish_reason === 'length') throw new Error(`${requestId}: response was truncated`);
      const result = parseModelJson(choice.message.content, requestId);
      return {result, usage: envelope.usage || null, requestId};
    } catch (error) {
      lastError = error;
      const retryable = error.name === 'AbortError' || error.status === 429 || error.status >= 500 || /fetch failed|invalid JSON|response was truncated|no content/i.test(error.message);
      if (!retryable || attempt === 3) throw error;
      await sleep(1000 * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function requestText({requestId, targetLocale, sourcePath, sourceHash, content, maxTokens}) {
  const system = [
    'You are a senior documentation localization engineer.',
    `Translate values into ${localeNames[targetLocale]} (${targetLocale}).`,
    'Return only the requested line-oriented output. Keep every key and line order exactly; translate only text after the tab separator.',
    'Do not translate product names, technical identifiers, URLs, or code tokens.',
    'Do not add quotes, numbering, Markdown fences, commentary, or blank lines.',
    `Request identity: ${requestId}; source path: ${sourcePath}; source hash: ${sourceHash}.`,
  ].join(' ');
  const estimatedContext = estimateTokens(`${system}\n${content}`) + maxTokens;
  if (estimatedContext >= maxContextTokens) throw new Error(`${requestId}: estimated context ${estimatedContext} exceeds ${maxContextTokens}`);
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          stream: false,
          messages: [
            {role: 'system', content: `${system} Validation attempt ${attempt}.`},
            {role: 'user', content},
          ],
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        const error = new Error(`${requestId}: LM Studio HTTP ${response.status}: ${responseText.slice(0, 500)}`);
        error.status = response.status;
        throw error;
      }
      const envelope = JSON.parse(responseText);
      const choice = envelope.choices?.[0];
      if (!choice?.message?.content) throw new Error(`${requestId}: LM Studio returned no content`);
      if (choice.finish_reason === 'length') throw new Error(`${requestId}: response was truncated`);
      return {content: stripModelFence(choice.message.content), usage: envelope.usage || null};
    } catch (error) {
      lastError = error;
      const retryable = error.name === 'AbortError' || error.status === 429 || error.status >= 500 || /fetch failed|response was truncated|no content/i.test(error.message);
      if (!retryable || attempt === 3) throw error;
      await sleep(1000 * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function buildBatches(items, maxBatchSize, maxBatchContext) {
  const batches = [];
  let current = [];
  let currentContext = 0;
  for (const item of items) {
    if (current.length && (current.length >= maxBatchSize || currentContext + item.context > maxBatchContext)) {
      batches.push({items: current, context: currentContext});
      current = [];
      currentContext = 0;
    }
    current.push(item);
    currentContext += item.context;
  }
  if (current.length) batches.push({items: current, context: currentContext});
  return batches;
}

function protectBody(body) {
  const replacements = [];
  const protectedBody = body.replace(/```[\s\S]*?```|`[^`\n]+`|<[^>]+>|https?:\/\/[^\s)]+/g, (match) => {
    const token = `__NOTEMD_PROTECTED_${replacements.length}__`;
    replacements.push({token, match});
    return token;
  });
  return {
    body: protectedBody,
    restore(value) {
      let restored = value;
      for (const {token, match} of replacements) {
        if (!restored.includes(token)) throw new Error(`Missing protected token ${token}`);
        restored = restored.split(token).join(match);
      }
      return restored;
    },
    tokens: replacements.map(({token}) => token),
  };
}

function headingShape(content) {
  let inFence = false;
  const shape = [];
  for (const line of normalizeLineEndings(content).split('\n')) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) {
      const match = line.match(/^(#{1,6})\s+/);
      if (match) shape.push(match[1].length);
    }
  }
  return shape;
}

function requiredTokens(source) {
  return protectedTechnicalTokens.filter((token) => source.includes(token));
}

function validateTranslatedBody(source, translated, requestId) {
  if (!translated.trim()) throw new Error(`${requestId}: translated body is empty`);
  if (JSON.stringify(headingShape(source)) !== JSON.stringify(headingShape(translated))) {
    throw new Error(`${requestId}: heading levels do not mirror source`);
  }
  for (const token of requiredTokens(source)) {
    if (!translated.includes(token)) throw new Error(`${requestId}: missing preserved token ${token}`);
  }
  if ((source.match(/```/g) || []).length !== (translated.match(/```/g) || []).length) {
    throw new Error(`${requestId}: code fence count changed`);
  }
}

function parseFaqDocument(content) {
  const normalized = normalizeLineEndings(content);
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) throw new Error('FAQ frontmatter is missing');
  const frontmatter = frontmatterMatch[1];
  const body = normalized.slice(frontmatterMatch[0].length);
  const title = frontmatter.match(/^title:\s*(.*)$/m)?.[1]?.trim() || '';
  const description = frontmatter.match(/^description:\s*(.*)$/m)?.[1]?.trim() || '';
  const faqItems = [];
  const itemPattern = /\n\s*- question:\s*(.+)\n\s+answer:\s*(.+)/g;
  let match;
  while ((match = itemPattern.exec(frontmatter))) {
    faqItems.push({question: match[1].trim(), answer: match[2].trim()});
  }
  if (faqItems.length === 0) throw new Error('FAQ frontmatter has no faqItems');
  return {normalized, frontmatter, body, title, description, faqItems};
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function replaceFaqFrontmatter(frontmatter, translated) {
  const titleLine = `title: ${yamlQuote(translated.title)}`;
  const descriptionLine = `description: ${yamlQuote(translated.description)}`;
  let result = frontmatter.replace(/^title:\s*.*$/m, titleLine).replace(/^description:\s*.*$/m, descriptionLine);
  const start = result.indexOf('faqItems:');
  if (start < 0) throw new Error('FAQ frontmatter has no faqItems anchor');
  const replacement = [
    'faqItems:',
    ...translated.faqItems.flatMap((item) => [
      `  - question: ${yamlQuote(item.question)}`,
      `    answer: ${yamlQuote(item.answer)}`,
    ]),
  ].join('\n');
  result = `${result.slice(0, start)}${replacement}`;
  return result;
}

function validateExactKeys(source, translated, requestId) {
  const sourceKeys = Object.keys(source).sort();
  const translatedKeys = Object.keys(translated || {}).sort();
  if (JSON.stringify(sourceKeys) !== JSON.stringify(translatedKeys)) {
    throw new Error(`${requestId}: JSON keys changed; expected=${sourceKeys.join(',')} received=${translatedKeys.join(',')}`);
  }
}

function unwrapTranslatedPayload(result, source, requestId) {
  const candidate = result && result.payload && typeof result.payload === 'object' ? result.payload : result;
  validateExactKeys(source, candidate, requestId);
  return candidate;
}

function validateFaqResult(source, translated, requestId) {
  validateExactKeys({title: source.title, description: source.description, faqItems: source.faqItems}, {
    title: translated.title,
    description: translated.description,
    faqItems: translated.faqItems,
  }, requestId);
  if (!translated.title || !translated.description || !Array.isArray(translated.faqItems) || translated.faqItems.length !== source.faqItems.length) {
    throw new Error(`${requestId}: FAQ metadata shape changed`);
  }
  translated.faqItems.forEach((item, index) => {
    if (!item || typeof item.question !== 'string' || typeof item.answer !== 'string') {
      throw new Error(`${requestId}: FAQ item ${index} is invalid`);
    }
  });
  validateTranslatedBody(source.body, translated.body, requestId);
}

function faqSource() {
  return parseFaqDocument(fs.readFileSync(path.join(docsRoot, 'faq.mdx'), 'utf8'));
}

async function translateFaq(locale) {
  const source = faqSource();
  const metadataPayload = {
    title: source.title,
    description: source.description,
    faqItems: source.faqItems,
  };
  const sourcePath = 'faq.mdx';
  const sourceHash = sha256(source.normalized);
  const metadataRequestId = `faq-metadata:${locale}:${sourceHash}`;
  const {result: rawMetadata, usage: metadataUsage} = await requestJson({
    requestId: metadataRequestId,
    targetLocale: locale,
    sourcePath: `${sourcePath}#frontmatter`,
    sourceHash,
    payload: metadataPayload,
    maxTokens: 6000,
  });
  const metadata = unwrapTranslatedPayload(rawMetadata, metadataPayload, metadataRequestId);
  const targetPath = path.join(i18nRoot, locale, 'docusaurus-plugin-content-docs', 'current', 'faq.mdx');
  const current = parseFaqDocument(fs.readFileSync(targetPath, 'utf8'));
  const result = {
    ...metadata,
    body: current.body,
  };
  validateFaqResult(source, result, metadataRequestId);
  const translatedFrontmatter = replaceFaqFrontmatter(current.frontmatter, result);
  return {
    locale,
    usage: {metadata: metadataUsage},
    path: targetPath,
    content: `---\n${translatedFrontmatter}\n---\n${normalizeLineEndings(result.body).trimEnd()}\n`,
  };
}

function validateUiResult(source, translated, requestId) {
  validateExactKeys(source, translated, requestId);
  for (const group of ['ui', 'code']) {
    validateExactKeys(source[group], translated[group], `${requestId}:${group}`);
    for (const key of Object.keys(source[group])) {
      if (typeof translated[group][key] !== 'string' || !translated[group][key].trim()) {
        throw new Error(`${requestId}:${group}.${key} is empty`);
      }
    }
  }
}

function normalizeUiValue(value) {
  const alternatives = String(value).split('\t').map((part) => part.trim()).filter(Boolean);
  let normalized = alternatives.length > 1 ? alternatives[alternatives.length - 1] : String(value).trim();
  normalized = normalized.replace(/^\(LLM Providers\)\s*/i, '').replace(/^[>|-]\s*/, '').trim();
  return normalized;
}

const knownUiCorrections = {
  vi: {code: {mainNav: 'Điều hướng chính'}},
};

async function translateUi(locale) {
  const source = {ui: englishUi, code: englishCode};
  const sourcePath = 'src/lib/siteLocaleCatalog.cjs';
  const sourceHash = sha256(JSON.stringify(source));
  const requestId = `ui:${locale}:${sourceHash}`;
  const lines = Object.entries(source).flatMap(([group, values]) => Object.entries(values).map(([key, value]) => `${group}.${key}\t${value}`));
  const {content, usage} = await requestText({
    requestId,
    targetLocale: locale,
    sourcePath,
    sourceHash,
    content: lines.join('\n'),
    maxTokens: 2500,
  });
  const result = {ui: {}, code: {}};
  const expectedKeys = new Set(lines.map((line) => line.slice(0, line.indexOf('\t'))));
  const returnedKeys = new Set();
  for (const line of normalizeLineEndings(content).split('\n').map((value) => value.trim()).filter(Boolean)) {
    const key = [...expectedKeys]
      .sort((left, right) => right.length - left.length)
      .find((candidate) => line.startsWith(candidate) && line.length > candidate.length);
    if (!key) throw new Error(`${requestId}: UI response line has no known key: ${line.slice(0, 120)}`);
    const value = normalizeUiValue(line.slice(key.length).replace(/^[\s:=\t]+/, '').trim());
    if (!expectedKeys.has(key) || !value) throw new Error(`${requestId}: invalid UI response key ${key}`);
    if (returnedKeys.has(key)) {
      const [duplicateGroup, duplicateField] = key.split('.');
      if (value.length > result[duplicateGroup][duplicateField].length) result[duplicateGroup][duplicateField] = value;
      continue;
    }
    returnedKeys.add(key);
    const [group, field] = key.split('.');
    result[group][field] = value;
  }
  for (const [group, values] of Object.entries(knownUiCorrections[locale] || {})) {
    Object.assign(result[group], values);
  }
  if (returnedKeys.size !== expectedKeys.size) throw new Error(`${requestId}: UI response lost ${expectedKeys.size - returnedKeys.size} key(s)`);
  validateUiResult(source, result, requestId);
  return {locale, usage, result};
}

function extractEnglishHomeCopy() {
  const source = normalizeLineEndings(fs.readFileSync(path.join(websiteRoot, 'src', 'pages', 'index.js'), 'utf8'));
  const startMarker = 'const copyByLocale = ';
  const start = source.indexOf(startMarker);
  const end = source.indexOf('\n\nexport default function Home');
  if (start < 0 || end < 0) throw new Error('Unable to locate homepage copy catalog');
  const expression = source.slice(start + startMarker.length, end).trim();
  const context = {module: {exports: {}}, exports: {}};
  vm.runInNewContext(`module.exports = ${expression};`, context, {timeout: 1000});
  if (!context.module.exports.en) throw new Error('Homepage English copy is missing');
  return context.module.exports.en;
}

function restoreStableHomeFields(source, translated) {
  if (Array.isArray(source) && Array.isArray(translated)) {
    if (source.length !== translated.length) throw new Error('Homepage array length changed');
    return source.map((value, index) => restoreStableHomeFields(value, translated[index]));
  }
  if (source && typeof source === 'object' && translated && typeof translated === 'object') {
    const result = {...translated};
    for (const key of Object.keys(source)) {
      if (!(key in translated)) throw new Error(`Homepage key ${key} was removed`);
      if (key === 'href' || key === 'kind') result[key] = source[key];
      else result[key] = restoreStableHomeFields(source[key], translated[key]);
    }
    return result;
  }
  if (typeof source === 'string' && typeof translated !== 'string') throw new Error('Homepage string became non-string');
  return translated;
}

function validateHomeResult(source, translated, requestId) {
  const normalized = restoreStableHomeFields(source, translated);
  if (!normalized.title || !normalized.lead || !Array.isArray(normalized.facts) || !Array.isArray(normalized.sections)) {
    throw new Error(`${requestId}: homepage shape changed`);
  }
  return normalized;
}

async function translateHome(locale) {
  const source = extractEnglishHomeCopy();
  const sourcePath = 'src/pages/index.js';
  const sourceHash = sha256(JSON.stringify(source));
  const requestId = `home:${locale}:${sourceHash}`;
  const {result: rawResult, usage} = await requestJson({
    requestId,
    targetLocale: locale,
    sourcePath,
    sourceHash,
    payload: source,
    maxTokens: 8000,
  });
  const result = unwrapTranslatedPayload(rawResult, source, requestId);
  return {locale, usage, result: validateHomeResult(source, result, requestId)};
}

async function translateHomeBoundary(locale) {
  const source = extractEnglishHomeCopy();
  const payload = {languageBoundary: source.languageBoundary};
  const sourcePath = 'src/pages/index.js#languageBoundary';
  const sourceHash = sha256(JSON.stringify(payload));
  const requestId = `home-boundary:${locale}:${sourceHash}`;
  const {result: rawResult, usage} = await requestJson({
    requestId,
    targetLocale: locale,
    sourcePath,
    sourceHash,
    payload,
    maxTokens: 1000,
  });
  const result = unwrapTranslatedPayload(rawResult, payload, requestId);
  if (typeof result.languageBoundary !== 'string' || !result.languageBoundary.trim()) {
    throw new Error(`${requestId}: languageBoundary is empty`);
  }
  return {locale, usage, result};
}

function writeAtomic(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, content, 'utf8');
  try {
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath);
    fs.renameSync(tempPath, filePath);
  }
}

function writeUiCatalog(results) {
  const entries = Object.fromEntries(results.map(({locale, result}) => [locale, result]));
  writeAtomic(
    path.join(websiteRoot, 'src', 'lib', 'siteLocaleCatalog.cjs'),
    `// Generated by translate-site-core.cjs. Stable technical labels remain in English.\nmodule.exports = ${JSON.stringify(entries, null, 2)};\n`,
  );
}

function writeHomeCatalog(results) {
  const entries = Object.fromEntries(results.map(({locale, result}) => [locale, result]));
  writeAtomic(
    path.join(websiteRoot, 'src', 'lib', 'homeCopyCatalog.mjs'),
    `// Generated by translate-site-core.cjs. Links and route kinds are restored from the English source.\nexport const homeCopyOverrides = ${JSON.stringify(entries, null, 2)};\n`,
  );
}

function readHomeCatalog() {
  const catalogPath = path.join(websiteRoot, 'src', 'lib', 'homeCopyCatalog.mjs');
  const source = normalizeLineEndings(fs.readFileSync(catalogPath, 'utf8'));
  const marker = 'export const homeCopyOverrides = ';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Homepage override catalog is missing its export');
  const expression = source.slice(start + marker.length).trim();
  const context = {module: {exports: {}}, exports: {}};
  vm.runInNewContext(`module.exports = ${expression}`, context, {timeout: 1000});
  if (!context.module.exports || typeof context.module.exports !== 'object') {
    throw new Error('Homepage override catalog is not an object');
  }
  return context.module.exports;
}

function writeHomeBoundaryCatalog(results) {
  const entries = readHomeCatalog();
  for (const {locale, result} of results) {
    if (!entries[locale] || typeof entries[locale] !== 'object') {
      throw new Error(`Homepage override catalog is missing locale ${locale}`);
    }
    entries[locale].languageBoundary = result.languageBoundary;
  }
  writeAtomic(
    path.join(websiteRoot, 'src', 'lib', 'homeCopyCatalog.mjs'),
    `// Generated by translate-site-core.cjs. Links and route kinds are restored from the English source.\nexport const homeCopyOverrides = ${JSON.stringify(entries, null, 2)};\n`,
  );
}

async function run(options) {
  const items = options.locales.map((locale) => {
    const estimated = options.mode === 'faq' ? 9000 : options.mode === 'home' ? 11000 : options.mode === 'home-boundary' ? 2000 : 7000;
    return {locale, context: estimated};
  });
  const batches = buildBatches(items, options.batchSize, 29000);
  const results = [];
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    console.log(`[${options.mode}] batch ${batchIndex + 1}/${batches.length} locales=${batch.items.map(({locale}) => locale).join(',')} estimatedContext=${batch.context}`);
    // The batch budget is intentionally conservative. Requests in one batch
    // are concurrent only when their summed estimated contexts stay below 29k.
    const batchResults = await Promise.all(batch.items.map(async ({locale}) => {
      process.stdout.write(`[${options.mode}:${locale}] translating... `);
      const result = options.mode === 'faq'
        ? await translateFaq(locale)
        : options.mode === 'ui'
          ? await translateUi(locale)
          : options.mode === 'home-boundary'
            ? await translateHomeBoundary(locale)
            : await translateHome(locale);
      process.stdout.write('validated\n');
      return result;
    }));
    results.push(...batchResults);
  }

  if (!options.write) {
    console.log(`[${options.mode}] dry run complete; no files written`);
    return;
  }
  if (options.mode === 'faq') {
    for (const result of results) writeAtomic(result.path, result.content);
  } else if (options.mode === 'ui') {
    writeUiCatalog(results);
  } else if (options.mode === 'home') {
    writeHomeCatalog(results);
  } else {
    writeHomeBoundaryCatalog(results);
  }
  console.log(`[${options.mode}] wrote ${results.length} locale result(s)`);
}

run(parseArguments(process.argv)).catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
