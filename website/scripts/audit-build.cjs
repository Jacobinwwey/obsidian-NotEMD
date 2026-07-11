const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

const websiteRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(websiteRoot, 'build');
const englishDocsRoot = path.join(buildRoot, 'docs');
const zhDocsRoot = path.join(buildRoot, 'zh-CN', 'docs');
const zhCnSourceRoot = path.join(websiteRoot, 'i18n', 'zh-CN', 'docusaurus-plugin-content-docs', 'current');
const siteRoot = 'https://jacobinwwey.github.io/obsidian-NotEMD/';
const basePath = '/obsidian-NotEMD/';
const zhRoot = `${siteRoot}zh-CN/`;
const zhBasePath = `${basePath}zh-CN/`;
const expectedSoftwareVersion = '1.9.3';
const providerSourceRoot = path.join(websiteRoot, 'docs', 'providers');
let supportedLocalizedLocales = [];
let publishedLanguageScopeText = '';
const localizedFillerMarkers = [
  '这一部分解释产品行为',
  '這一部分說明產品行為',
  '製品の挙動',
  'comportement produit',
  'Produktverhalten',
  'comportamiento del producto',
  '제품 동작',
];
const placeholderPollutionPattern = /NMDPH|NMDSEGMENT|@@\d+@@/;
const trailingWhitespacePattern = /[ \t]+$/m;
const providerDetailHeadings = [
  '## Setup',
  '## Endpoint And Authentication',
  '## Model Discovery',
  '## Troubleshooting',
  '## When To Use',
];
const providerOverviewHeadings = [
  '## Provider Categories',
  '## Per-Task Model Selection',
  '## API Call Architecture',
  '## Model Discovery',
  '## Quick Start',
];

function fail(message) {
  throw new Error(`[audit-build] ${message}`);
}

function readBuildFile(relativePath) {
  const filePath = path.join(buildRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`Missing build file: ${relativePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function readSourceFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing source file: ${path.relative(websiteRoot, filePath)}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(content, expected, context) {
  if (!content.includes(expected)) {
    fail(`${context} is missing ${expected}`);
  }
}

function assertMatches(content, expected, context) {
  if (!expected.test(content)) {
    fail(`${context} does not match ${expected}`);
  }
}

function assertNotContains(content, forbidden, context) {
  if (content.includes(forbidden)) {
    fail(`${context} contains forbidden ${forbidden}`);
  }
}

function assertUnique(values, context) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(`${context} contains duplicate ${value}`);
    }
    seen.add(value);
  }
}

function listHtmlFiles(directory) {
  const entries = fs.readdirSync(directory, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listHtmlFiles(entryPath));
      continue;
    }

    if (entry.name === 'index.html') {
      files.push(entryPath);
    }
  }

  return files;
}

function routeForDocIndex(filePath, docsRoot) {
  const relativePath = path.relative(docsRoot, filePath);
  const routePath = relativePath.replace(/\\/g, '/').replace(/\/index\.html$/, '');
  return routePath === 'index.html' ? '/docs' : `/docs/${routePath}`;
}

function routePathToBuildIndex(routePath, localePrefix = '') {
  const routeWithoutDocs = routePath.replace(/^\/docs\/?/, '');
  const routeDirectory = routeWithoutDocs ? path.join('docs', routeWithoutDocs) : 'docs';
  return path.join(localePrefix, routeDirectory, 'index.html');
}

function htmlHrefForSitePath(sitePath) {
  return `href="${sitePath}"`;
}

function fullyQualifiedZhCnDocUrl(routePath) {
  return `${siteRoot}zh-CN${routePath}`;
}

function englishDocSitePath(routePath) {
  return `${basePath}${routePath.slice(1)}`;
}

function zhCnDocSitePath(routePath) {
  return `${zhBasePath}${routePath.slice(1)}`;
}

function localizedDocSitePath(locale, routePath) {
  return `${basePath}${locale}/${routePath.slice(1)}`;
}

function localizedDocUrl(locale, routePath) {
  return `${siteRoot}${locale}${routePath}`;
}

function localizedDocsSourceRoot(locale) {
  return path.join(websiteRoot, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current');
}

function englishSourceDocs() {
  const docsRoot = path.join(websiteRoot, 'docs');
  const files = [];
  const collect = (directory) => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collect(entryPath);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(path.relative(docsRoot, entryPath).replace(/\\/g, '/'));
      }
    }
  };
  collect(docsRoot);
  return files.sort();
}

function markdownHeadings(content) {
  const headings = [];
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({level: match[1].length, text: match[2].trim()});
    }
  }
  return headings;
}

function auditLocalizedSourceTextIntegrity() {
  for (const {locale} of supportedLocalizedLocales) {
    const localeRoot = localizedDocsSourceRoot(locale);
    for (const sourceDoc of englishSourceDocs()) {
      const filePath = path.join(localeRoot, sourceDoc);
      const localizedContent = readSourceFile(filePath);
      const englishContent = readSourceFile(path.join(websiteRoot, 'docs', sourceDoc));
      const context = `${locale} source doc ${sourceDoc}`;

      for (const marker of localizedFillerMarkers) {
        assertNotContains(localizedContent, marker, context);
      }
      if (placeholderPollutionPattern.test(localizedContent)) {
        fail(`${context} contains placeholder pollution`);
      }
      if (trailingWhitespacePattern.test(localizedContent)) {
        fail(`${context} contains trailing whitespace`);
      }

      const englishHeadings = markdownHeadings(englishContent).map((heading) => heading.level);
      const localizedHeadings = markdownHeadings(localizedContent).map((heading) => heading.level);
      if (JSON.stringify(localizedHeadings) !== JSON.stringify(englishHeadings)) {
        fail(`${context} heading structure does not mirror the English source`);
      }
    }
  }
}

async function loadPublishedLanguageScope() {
  const moduleUrl = pathToFileURL(path.join(websiteRoot, 'src', 'lib', 'publishedLanguageScopeData.mjs')).href;
  const languageScope = await import(moduleUrl);
  const publishedZhCnDocs = languageScope.publishedZhCnDocs || [];
  const zhCnCriticalDocPaths = languageScope.zhCnCriticalDocPaths || [];
  const zhCnHomepageDocPaths = languageScope.zhCnHomepageDocPaths || [];
  return {
    publishedZhCnDocs,
    publishedZhCnDocIds: new Set(publishedZhCnDocs.map((doc) => doc.id)),
    publishedZhCnDocPaths: new Set(publishedZhCnDocs.map((doc) => doc.path)),
    zhCnCriticalDocPaths,
    zhCnHomepageDocPaths,
  };
}

function auditPublishedScopeSourceFiles(languageScope) {
  const {publishedZhCnDocs, publishedZhCnDocIds, publishedZhCnDocPaths} = languageScope;
  const publishedZhCnSourcePaths = new Set(publishedZhCnDocs.map((doc) => doc.sourcePath));
  assertUnique(publishedZhCnDocs.map((doc) => doc.id), 'published zh-CN doc ids');
  assertUnique(publishedZhCnDocs.map((doc) => doc.path), 'published zh-CN doc paths');
  assertUnique(publishedZhCnDocs.map((doc) => doc.sourcePath), 'published zh-CN source paths');

  for (const doc of publishedZhCnDocs) {
    if (!doc.id || !doc.path || !doc.sourcePath) {
      fail(`Published zh-CN doc entries must include id, path, and sourcePath: ${JSON.stringify(doc)}`);
    }
    readSourceFile(path.join(zhCnSourceRoot, doc.sourcePath));
  }

  const localizedFiles = [];
  const collectLocalizedFiles = (directory) => {
    if (!fs.existsSync(directory)) {
      return;
    }

    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collectLocalizedFiles(entryPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        localizedFiles.push(path.relative(zhCnSourceRoot, entryPath).replace(/\\/g, '/'));
      }
    }
  };
  collectLocalizedFiles(zhCnSourceRoot);

  for (const localizedFile of localizedFiles) {
    if (!publishedZhCnSourcePaths.has(localizedFile)) {
      fail(`Localized zh-CN doc ${localizedFile} is not declared in publishedLanguageScopeData.mjs`);
    }
  }

  for (const criticalPath of languageScope.zhCnCriticalDocPaths) {
    if (!publishedZhCnDocPaths.has(criticalPath)) {
      fail(`Critical zh-CN doc path is not published: ${criticalPath}`);
    }
  }

  for (const homepagePath of languageScope.zhCnHomepageDocPaths) {
    if (!publishedZhCnDocPaths.has(homepagePath)) {
      fail(`Homepage zh-CN doc path is not published: ${homepagePath}`);
    }
  }
}

function auditHomepageRoutes(languageScope) {
  const englishHome = readBuildFile('index.html');
  const zhHome = readBuildFile('zh-CN/index.html');

  assertContains(englishHome, '<html lang="en-US"', 'English homepage');
  assertContains(englishHome, `rel="canonical" href="${siteRoot}"`, 'English homepage');
  assertContains(englishHome, `"url":"${siteRoot}"`, 'English homepage JSON-LD');
  assertContains(englishHome, `"softwareVersion":"${expectedSoftwareVersion}"`, 'English homepage SoftwareApplication JSON-LD');
  assertContains(englishHome, 'Source-backed product facts', 'English homepage GEO surface');
  assertContains(englishHome, 'Answer-engine source map', 'English homepage GEO surface');
  assertContains(englishHome, `${basePath}llms.txt`, 'English homepage GEO source map link');
  assertContains(
    englishHome,
    'English and all published documentation locales now expose the full docs route set.',
    'English homepage language boundary',
  );

  assertContains(zhHome, '<html lang="zh-CN"', 'zh-CN homepage');
  assertContains(zhHome, `rel="canonical" href="${zhRoot}"`, 'zh-CN homepage');
  assertContains(zhHome, `"url":"${zhRoot}"`, 'zh-CN homepage JSON-LD');
  assertContains(zhHome, `"softwareVersion":"${expectedSoftwareVersion}"`, 'zh-CN homepage SoftwareApplication JSON-LD');
  assertContains(zhHome, '可索引的产品事实', 'zh-CN homepage GEO surface');
  assertContains(zhHome, 'Answer engine 来源地图', 'zh-CN homepage GEO surface');
  assertContains(zhHome, `${basePath}llms.txt`, 'zh-CN homepage GEO source map link');
  assertContains(zhHome, '均暴露完整 docs 路由集。', 'zh-CN homepage language boundary');
  assertContains(zhHome, `href="${zhBasePath}docs/faq"`, 'zh-CN homepage');

  for (const docPath of languageScope.zhCnHomepageDocPaths) {
    assertContains(zhHome, htmlHrefForSitePath(zhCnDocSitePath(docPath)), 'zh-CN homepage');
    assertNotContains(zhHome, `href="${basePath}${docPath.slice(1)}" target="_blank"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${siteRoot}${docPath.slice(1)}"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${zhBasePath}${basePath.slice(1)}${docPath.slice(1)}"`, 'zh-CN homepage');
  }

  for (const {locale, htmlLang} of supportedLocalizedLocales) {
    const localizedHome = readBuildFile(path.join(locale, 'index.html'));
    assertContains(localizedHome, `<html lang="${htmlLang}"`, `${locale} homepage`);
    assertContains(localizedHome, `rel="canonical" href="${siteRoot}${locale}/"`, `${locale} homepage`);
  }
}

async function loadPublishedLocales() {
  const moduleUrl = pathToFileURL(path.join(websiteRoot, 'src', 'lib', 'publishedLocales.mjs')).href;
  const locales = await import(moduleUrl);
  supportedLocalizedLocales = locales.publishedDocumentationLocales || [];
  publishedLanguageScopeText = locales.publishedLanguageScopeSentence();
  if (!supportedLocalizedLocales.length || !publishedLanguageScopeText) {
    fail('Published locale metadata must define documentation locales and language scope text');
  }
}

function auditZhCnDocFallbacks(languageScope) {
  if (!fs.existsSync(zhDocsRoot)) {
    fail('Missing zh-CN docs build directory');
  }

  for (const filePath of listHtmlFiles(zhDocsRoot)) {
    const routePath = routeForDocIndex(filePath, zhDocsRoot);
    const html = fs.readFileSync(filePath, 'utf8');

    if (languageScope.publishedZhCnDocPaths.has(routePath)) {
      assertNotContains(html, 'content="noindex,follow"', `published zh-CN doc ${routePath}`);
      assertContains(html, `rel="alternate" href="${siteRoot}${routePath.slice(1)}" hreflang="en-US"`, `published zh-CN doc ${routePath}`);
      assertContains(html, `rel="alternate" href="${fullyQualifiedZhCnDocUrl(routePath)}" hreflang="zh-CN"`, `published zh-CN doc ${routePath}`);
      continue;
    }

    assertContains(html, 'content="noindex,follow"', `untranslated zh-CN fallback ${routePath}`);
    assertNotContains(html, 'rel="alternate"', `untranslated zh-CN fallback ${routePath}`);
    assertContains(
      html,
      `href="${englishDocSitePath(routePath)}" target="_self" rel="noopener noreferrer" class="dropdown__link" lang="en-US"`,
      `untranslated zh-CN fallback ${routePath} locale dropdown`,
    );
    assertContains(
      html,
      `href="${zhBasePath}" target="_self" rel="noopener noreferrer" class="dropdown__link dropdown__link--active" lang="zh-CN"`,
      `untranslated zh-CN fallback ${routePath} locale dropdown`,
    );
    assertNotContains(
      html,
      `href="${zhCnDocSitePath(routePath)}" target="_self" rel="noopener noreferrer" class="dropdown__link" lang="en-US"`,
      `untranslated zh-CN fallback ${routePath} locale dropdown`,
    );
    assertNotContains(
      html,
      `href="${zhBasePath}zh-CN/"`,
      `untranslated zh-CN fallback ${routePath} locale dropdown`,
    );
  }
}

function auditLanguageAlternates(languageScope) {
  const unpublishedDocPaths = [];
  for (const filePath of listHtmlFiles(englishDocsRoot)) {
    const routePath = routeForDocIndex(filePath, englishDocsRoot);
    const html = fs.readFileSync(filePath, 'utf8');
    const zhCnAlternate = `rel="alternate" href="${fullyQualifiedZhCnDocUrl(routePath)}" hreflang="zh-CN"`;

    if (languageScope.publishedZhCnDocPaths.has(routePath)) {
      assertContains(html, zhCnAlternate, `English doc ${routePath}`);
      continue;
    }

    unpublishedDocPaths.push(routePath);
    assertNotContains(html, zhCnAlternate, `English doc ${routePath}`);
    assertNotContains(html, htmlHrefForSitePath(zhCnDocSitePath(routePath)), `English doc ${routePath}`);
  }

  for (const filePath of listHtmlFiles(zhDocsRoot)) {
    const routePath = routeForDocIndex(filePath, zhDocsRoot);
    const html = fs.readFileSync(filePath, 'utf8');
    if (!languageScope.publishedZhCnDocPaths.has(routePath)) {
      continue;
    }

    for (const unpublishedDocPath of unpublishedDocPaths) {
      assertNotContains(html, htmlHrefForSitePath(zhCnDocSitePath(unpublishedDocPath)), `published zh-CN doc ${routePath}`);
    }
  }
}

function auditSitemaps(languageScope) {
  const sitemap = readBuildFile('sitemap.xml');
  const zhSitemap = readBuildFile('zh-CN/sitemap.xml');

  assertContains(sitemap, siteRoot, 'root sitemap');
  assertContains(zhSitemap, zhRoot, 'zh-CN sitemap');

  for (const docPath of languageScope.publishedZhCnDocPaths) {
    assertContains(sitemap, `${siteRoot}${docPath.slice(1)}`, 'root sitemap');
    assertContains(zhSitemap, `${siteRoot}zh-CN${docPath}`, 'zh-CN sitemap');
  }

  for (const filePath of listHtmlFiles(zhDocsRoot)) {
    const routePath = routeForDocIndex(filePath, zhDocsRoot);
    if (!languageScope.publishedZhCnDocPaths.has(routePath)) {
      assertNotContains(zhSitemap, `${siteRoot}zh-CN${routePath}`, 'zh-CN sitemap');
    }
  }

  for (const {locale} of supportedLocalizedLocales) {
    const localeSitemap = readBuildFile(path.join(locale, 'sitemap.xml'));
    assertContains(localeSitemap, `${siteRoot}${locale}/`, `${locale} sitemap`);
    for (const docPath of languageScope.publishedZhCnDocPaths) {
      assertContains(localeSitemap, localizedDocUrl(locale, docPath), `${locale} sitemap`);
    }
  }
}

function auditAiRetrievalMap(languageScope) {
  const llmsText = readBuildFile('llms.txt');

  assertContains(llmsText, '## Language Scope', 'llms.txt');
  assertContains(llmsText, `Current documented release: ${expectedSoftwareVersion}`, 'llms.txt');
  assertContains(llmsText, `${siteRoot}llms.txt`, 'llms.txt');
  assertContains(llmsText, '## Homepage GEO Contract', 'llms.txt');
  assertContains(llmsText, 'English remains the canonical source surface.', 'llms.txt');
  assertContains(llmsText, `${siteRoot}zh-CN/`, 'llms.txt');

  for (const docPath of languageScope.publishedZhCnDocPaths) {
    assertContains(llmsText, `${siteRoot}zh-CN${docPath}`, 'llms.txt');
  }
  for (const {locale} of supportedLocalizedLocales) {
    assertContains(llmsText, `${siteRoot}${locale}/docs/intro`, 'llms.txt');
  }
  assertContains(llmsText, publishedLanguageScopeText, 'llms.txt');
}

function auditLocalizedDocBuildCoverage(languageScope) {
  const sourceDocCount = englishSourceDocs().length;
  const publishedDocPaths = Array.from(languageScope.publishedZhCnDocPaths).sort();

  if (publishedDocPaths.length !== sourceDocCount) {
    fail(`Published docs scope has ${publishedDocPaths.length} docs but English source has ${sourceDocCount}`);
  }

  for (const {locale, htmlLang} of supportedLocalizedLocales) {
    const docsRoot = path.join(buildRoot, locale, 'docs');
    if (!fs.existsSync(docsRoot)) {
      fail(`Missing ${locale} docs build directory`);
    }

    for (const docPath of publishedDocPaths) {
      const html = readBuildFile(routePathToBuildIndex(docPath, locale));
      assertContains(html, `<html lang="${htmlLang}"`, `${locale} doc ${docPath}`);
      assertNotContains(html, 'content="noindex,follow"', `${locale} doc ${docPath}`);
      assertContains(html, htmlHrefForSitePath(localizedDocSitePath(locale, docPath)), `${locale} doc ${docPath}`);
    }
  }
}

function auditProviderDocs() {
  for (const entry of fs.readdirSync(providerSourceRoot, {withFileTypes: true})) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) {
      continue;
    }

    const filePath = path.join(providerSourceRoot, entry.name);
    const content = readSourceFile(filePath);
    const relativePath = path.relative(websiteRoot, filePath);
    const requiredHeadings = entry.name === 'overview.mdx' ? providerOverviewHeadings : providerDetailHeadings;
    for (const heading of requiredHeadings) {
      assertContains(content, heading, relativePath);
    }
  }
}

function auditLocalizedSourceCoverage(languageScope) {
  const sourceDocs = englishSourceDocs();
  const publishedSourcePaths = new Set(languageScope.publishedZhCnDocs.map((doc) => doc.sourcePath));

  for (const sourceDoc of sourceDocs) {
    if (!publishedSourcePaths.has(sourceDoc)) {
      fail(`Full zh-CN docs route set is missing source scope entry: ${sourceDoc}`);
    }
  }

  for (const {locale} of supportedLocalizedLocales) {
    const localeRoot = localizedDocsSourceRoot(locale);
    for (const sourceDoc of sourceDocs) {
      readSourceFile(path.join(localeRoot, sourceDoc));
    }
  }
}

function auditLegacyDiagramDocs() {
  const englishDiagrams = readBuildFile(path.join('docs', 'features', 'diagrams', 'index.html'));
  const zhCnDiagrams = readBuildFile(path.join('zh-CN', 'docs', 'features', 'diagrams', 'index.html'));

  assertContains(englishDiagrams, 'Understand the three choices', 'English diagrams doc');
  assertContains(englishDiagrams, 'Diagram type', 'English diagrams doc');
  assertContains(englishDiagrams, 'Source format', 'English diagrams doc');
  assertContains(englishDiagrams, 'Export format', 'English diagrams doc');
  assertContains(englishDiagrams, 'Draw.io', 'English diagrams doc');
  assertContains(englishDiagrams, 'Drawnix', 'English diagrams doc');
  assertContains(englishDiagrams, 'CircuitikZ', 'English diagrams doc');
  assertContains(englishDiagrams, 'TikZJax', 'English diagrams doc');
  assertContains(englishDiagrams, 'Save source file', 'English diagrams doc');
  assertContains(englishDiagrams, 'Export SVG', 'English diagrams doc');
  assertContains(englishDiagrams, 'Export PNG', 'English diagrams doc');
  assertContains(englishDiagrams, 'Export PDF', 'English diagrams doc');
  assertNotContains(englishDiagrams, 'preferredDiagramRenderTarget', 'English diagrams doc');
  assertNotContains(englishDiagrams, 'cmos-inverter-v1', 'English diagrams doc');
  assertNotContains(englishDiagrams, '--compile-executable', 'English diagrams doc');
  assertNotContains(englishDiagrams, 'Golden Reference Prompt Shape', 'English diagrams doc');

  assertContains(zhCnDiagrams, '<html lang="zh-CN"', 'zh-CN diagrams doc');
  assertMatches(zhCnDiagrams, /Editable HTML\/SVG|可编辑.*HTML\/SVG/, 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'Draw.io', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'Drawnix', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'CircuitikZ', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'TikZJax', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, '渲染目标选择', 'zh-CN diagrams doc');
  assertMatches(zhCnDiagrams, /金色参考.*提示.*形状|Golden Reference Prompt/, 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'SVG', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'PNG', 'zh-CN diagrams doc');
  assertContains(zhCnDiagrams, 'PDF', 'zh-CN diagrams doc');
  assertNotContains(zhCnDiagrams, 'preferredDiagramRenderTarget', 'zh-CN diagrams doc');
  assertNotContains(zhCnDiagrams, 'cmos-inverter-v1', 'zh-CN diagrams doc');
  assertNotContains(zhCnDiagrams, '--compile-executable', 'zh-CN diagrams doc');
  assertNotContains(zhCnDiagrams, 'content="noindex,follow"', 'zh-CN diagrams doc');
}

function auditDiagramDocs() {
  const englishDiagrams = readBuildFile(path.join('docs', 'features', 'diagrams', 'index.html'));
  const zhCnDiagrams = readBuildFile(path.join('zh-CN', 'docs', 'features', 'diagrams', 'index.html'));

  for (const requiredText of [
    'Understand the three choices',
    'Diagram type',
    'Source format',
    'Export format',
    'Draw.io',
    'Drawnix',
    'CircuitikZ',
    'TikZJax',
    'Save source file',
    'Export SVG',
    'Export PNG',
    'Export PDF'
  ]) {
    assertContains(englishDiagrams, requiredText, 'English diagrams doc');
  }

  for (const maintainerText of [
    'preferredDiagramRenderTarget',
    'cmos-inverter-v1',
    '--compile-executable',
    'Golden Reference Prompt Shape'
  ]) {
    assertNotContains(englishDiagrams, maintainerText, 'English diagrams doc');
    assertNotContains(zhCnDiagrams, maintainerText, 'zh-CN diagrams doc');
  }

  assertContains(zhCnDiagrams, '<html lang="zh-CN"', 'zh-CN diagrams doc');
  for (const requiredText of ['Draw.io', 'Drawnix', 'CircuitikZ', 'TikZJax', 'SVG', 'PNG', 'PDF']) {
    assertContains(zhCnDiagrams, requiredText, 'zh-CN diagrams doc');
  }
  assertNotContains(zhCnDiagrams, 'content="noindex,follow"', 'zh-CN diagrams doc');
}

function auditIntroDocs() {
  const englishIntro = readBuildFile(path.join('docs', 'intro', 'index.html'));
  const zhCnIntro = readBuildFile(path.join('zh-CN', 'docs', 'intro', 'index.html'));

  assertContains(englishIntro, 'Diagram Capability Direction', 'English intro doc');
  assertContains(englishIntro, 'circuitikz', 'English intro doc');
  assertContains(englishIntro, 'TikZJax', 'English intro doc');
  assertContains(englishIntro, 'Draw.io', 'English intro doc');
  assertContains(englishIntro, 'Drawnix', 'English intro doc');
  assertContains(englishIntro, 'Advanced', 'English intro sidebar');
  assertContains(englishIntro, `${basePath}docs/advanced/custom-prompts`, 'English intro sidebar');

  assertContains(zhCnIntro, '<html lang="zh-CN"', 'zh-CN intro doc');
  assertMatches(zhCnIntro, /图表.*方向/, 'zh-CN intro doc');
  assertContains(zhCnIntro, 'circuitikz', 'zh-CN intro doc');
  assertContains(zhCnIntro, 'TikZJax', 'zh-CN intro doc');
  assertContains(zhCnIntro, 'Draw.io', 'zh-CN intro doc');
  assertContains(zhCnIntro, 'Drawnix', 'zh-CN intro doc');
  assertContains(zhCnIntro, '高级', 'zh-CN intro sidebar');
  assertContains(zhCnIntro, `${zhBasePath}docs/advanced/custom-prompts`, 'zh-CN intro sidebar');
  assertNotContains(zhCnIntro, 'content="noindex,follow"', 'zh-CN intro doc');
}

function auditAdvancedDocs() {
  for (const [relativePath, requiredText] of [
    [path.join('zh-CN', 'docs', 'advanced', 'custom-prompts', 'index.html'), /自定义.*(提示词|Prompt)/],
    [path.join('zh-CN', 'docs', 'advanced', 'batch-processing', 'index.html'), /批(量)?处理/],
    [path.join('zh-CN', 'docs', 'advanced', 'troubleshooting', 'index.html'), /故障(排查|排除)/],
  ]) {
    const html = readBuildFile(relativePath);
    assertContains(html, '<html lang="zh-CN"', `zh-CN advanced doc ${relativePath}`);
    assertMatches(html, requiredText, `zh-CN advanced doc ${relativePath}`);
    assertContains(html, '高级', `zh-CN advanced doc ${relativePath}`);
    assertNotContains(html, 'content="noindex,follow"', `zh-CN advanced doc ${relativePath}`);
  }
}

function auditMeasurementEvidence() {
  const geoRoadmap = readSourceFile(path.join(websiteRoot, '..', 'GEO_ROADMAP.md'));
  const measurementLog = readSourceFile(path.join(websiteRoot, '..', 'docs', 'maintainer', 'github-pages-geo-measurement-log.md'));
  const measurementLogZh = readSourceFile(path.join(websiteRoot, '..', 'docs', 'maintainer', 'github-pages-geo-measurement-log.zh-CN.md'));

  for (const content of [geoRoadmap, measurementLog, measurementLogZh]) {
    assertContains(content, '2026-06-22', 'GEO measurement evidence');
    assertContains(content, '2026-06-24', 'GEO measurement evidence');
    assertContains(content, 'Search Console', 'GEO measurement evidence');
    assertContains(content, 'AI visibility', 'GEO measurement evidence');
    assertContains(content, 'homepage', 'GEO measurement evidence');
    assertContains(content, 'sitemap', 'GEO measurement evidence');
  }

  for (const content of [measurementLog, measurementLogZh]) {
    assertContains(content, '2026-07-04', 'GEO source-side closure evidence');
    assertContains(content, '28641376675', 'GEO source-side closure evidence');
    assertContains(content, '40543eb', 'GEO source-side closure evidence');
  }
}

function auditRequiredFiles() {
  const requiredFiles = [
    'index.html',
    'zh-CN/index.html',
    'llms.txt',
    'robots.txt',
    'sitemap.xml',
    'zh-CN/sitemap.xml',
  ];
  for (const {locale} of supportedLocalizedLocales) {
    requiredFiles.push(path.join(locale, 'index.html'));
    requiredFiles.push(path.join(locale, 'docs', 'intro', 'index.html'));
    requiredFiles.push(path.join(locale, 'sitemap.xml'));
  }

  for (const relativePath of requiredFiles) {
    readBuildFile(relativePath);
  }
}

function auditGeneratedTextIntegrity() {
  const htmlFiles = [
    ...listHtmlFiles(englishDocsRoot),
    path.join(buildRoot, 'index.html'),
  ];
  for (const {locale} of supportedLocalizedLocales) {
    htmlFiles.push(...listHtmlFiles(path.join(buildRoot, locale, 'docs')));
    htmlFiles.push(path.join(buildRoot, locale, 'index.html'));
  }

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const context = path.relative(buildRoot, filePath);
    if (content.includes('\u0000')) {
      fail(`Generated HTML contains a NUL character: ${context}`);
    }
    for (const marker of localizedFillerMarkers) {
      assertNotContains(content, marker, `generated HTML ${context}`);
    }
    if (placeholderPollutionPattern.test(content)) {
      fail(`Generated HTML contains placeholder pollution: ${context}`);
    }
  }
}

async function main() {
  await loadPublishedLocales();
  const languageScope = await loadPublishedLanguageScope();
  auditRequiredFiles();
  auditGeneratedTextIntegrity();
  auditPublishedScopeSourceFiles(languageScope);
  auditLocalizedSourceCoverage(languageScope);
  auditLocalizedSourceTextIntegrity();
  auditHomepageRoutes(languageScope);
  auditZhCnDocFallbacks(languageScope);
  auditLanguageAlternates(languageScope);
  auditSitemaps(languageScope);
  auditAiRetrievalMap(languageScope);
  auditLocalizedDocBuildCoverage(languageScope);
  auditProviderDocs();
  auditIntroDocs();
  auditDiagramDocs();
  auditAdvancedDocs();
  auditMeasurementEvidence();

  console.log('website build audit passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
