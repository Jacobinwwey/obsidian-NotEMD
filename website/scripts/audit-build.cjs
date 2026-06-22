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
const providerSourceRoot = path.join(websiteRoot, 'docs', 'providers');
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

  assertContains(zhHome, '<html lang="zh-CN"', 'zh-CN homepage');
  assertContains(zhHome, `rel="canonical" href="${zhRoot}"`, 'zh-CN homepage');
  assertContains(zhHome, `"url":"${zhRoot}"`, 'zh-CN homepage JSON-LD');
  assertContains(zhHome, `href="${zhBasePath}docs/faq"`, 'zh-CN homepage');

  for (const docPath of languageScope.zhCnHomepageDocPaths) {
    assertContains(zhHome, htmlHrefForSitePath(zhCnDocSitePath(docPath)), 'zh-CN homepage');
    assertNotContains(zhHome, `href="${basePath}${docPath.slice(1)}" target="_blank"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${siteRoot}${docPath.slice(1)}"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${zhBasePath}${basePath.slice(1)}${docPath.slice(1)}"`, 'zh-CN homepage');
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
}

function auditAiRetrievalMap(languageScope) {
  const llmsText = readBuildFile('llms.txt');

  assertContains(llmsText, '## Language Scope', 'llms.txt');
  assertContains(llmsText, 'English is the canonical complete documentation surface.', 'llms.txt');
  assertContains(llmsText, `${siteRoot}zh-CN/`, 'llms.txt');

  for (const docPath of languageScope.publishedZhCnDocPaths) {
    assertContains(llmsText, `${siteRoot}zh-CN${docPath}`, 'llms.txt');
  }
  assertContains(llmsText, 'Do not infer full multilingual documentation coverage from the presence of a locale dropdown.', 'llms.txt');
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

function auditMeasurementEvidence() {
  const geoRoadmap = readSourceFile(path.join(websiteRoot, '..', 'GEO_ROADMAP.md'));
  const measurementLog = readSourceFile(path.join(websiteRoot, '..', 'docs', 'maintainer', 'github-pages-geo-measurement-log.md'));
  const measurementLogZh = readSourceFile(path.join(websiteRoot, '..', 'docs', 'maintainer', 'github-pages-geo-measurement-log.zh-CN.md'));

  for (const content of [geoRoadmap, measurementLog, measurementLogZh]) {
    assertContains(content, '2026-06-22', 'GEO measurement evidence');
    assertContains(content, 'Search Console', 'GEO measurement evidence');
    assertContains(content, 'AI visibility', 'GEO measurement evidence');
    assertContains(content, 'sitemap', 'GEO measurement evidence');
  }
}

function auditRequiredFiles() {
  for (const relativePath of [
    'index.html',
    'zh-CN/index.html',
    'llms.txt',
    'robots.txt',
    'sitemap.xml',
    'zh-CN/sitemap.xml',
  ]) {
    readBuildFile(relativePath);
  }
}

async function main() {
  const languageScope = await loadPublishedLanguageScope();
  auditRequiredFiles();
  auditPublishedScopeSourceFiles(languageScope);
  auditHomepageRoutes(languageScope);
  auditZhCnDocFallbacks(languageScope);
  auditLanguageAlternates(languageScope);
  auditSitemaps(languageScope);
  auditAiRetrievalMap(languageScope);
  auditProviderDocs();
  auditMeasurementEvidence();

  console.log('website build audit passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
