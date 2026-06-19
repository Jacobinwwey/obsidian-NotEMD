const fs = require('fs');
const path = require('path');

const websiteRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(websiteRoot, 'build');
const siteRoot = 'https://jacobinwwey.github.io/obsidian-NotEMD/';
const basePath = '/obsidian-NotEMD/';
const zhRoot = `${siteRoot}zh-CN/`;
const zhBasePath = `${basePath}zh-CN/`;
const publishedZhCnDocPaths = new Set(['/docs/faq']);
const canonicalEnglishDocPaths = [
  '/docs/intro',
  '/docs/getting-started/quick-start',
  '/docs/providers/overview',
  '/docs/pillar-ai-knowledge',
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

function routeForZhCnDocIndex(filePath) {
  const docsRoot = path.join(buildRoot, 'zh-CN', 'docs');
  const relativePath = path.relative(docsRoot, filePath);
  const routePath = relativePath.replace(/\\/g, '/').replace(/\/index\.html$/, '');
  return routePath === 'index.html' ? '/docs' : `/docs/${routePath}`;
}

function auditHomepageRoutes() {
  const englishHome = readBuildFile('index.html');
  const zhHome = readBuildFile('zh-CN/index.html');

  assertContains(englishHome, '<html lang="en-US"', 'English homepage');
  assertContains(englishHome, `rel="canonical" href="${siteRoot}"`, 'English homepage');
  assertContains(englishHome, `"url":"${siteRoot}"`, 'English homepage JSON-LD');

  assertContains(zhHome, '<html lang="zh-CN"', 'zh-CN homepage');
  assertContains(zhHome, `rel="canonical" href="${zhRoot}"`, 'zh-CN homepage');
  assertContains(zhHome, `"url":"${zhRoot}"`, 'zh-CN homepage JSON-LD');
  assertContains(zhHome, `href="${zhBasePath}docs/faq"`, 'zh-CN homepage');

  for (const docPath of canonicalEnglishDocPaths) {
    assertContains(zhHome, `href="${basePath}${docPath.slice(1)}"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${basePath}${docPath.slice(1)}" target="_blank"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${siteRoot}${docPath.slice(1)}"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${zhBasePath}${docPath.slice(1)}"`, 'zh-CN homepage');
    assertNotContains(zhHome, `href="${zhBasePath}${basePath.slice(1)}${docPath.slice(1)}"`, 'zh-CN homepage');
  }
}

function auditZhCnDocFallbacks() {
  const zhDocsRoot = path.join(buildRoot, 'zh-CN', 'docs');
  if (!fs.existsSync(zhDocsRoot)) {
    fail('Missing zh-CN docs build directory');
  }

  for (const filePath of listHtmlFiles(zhDocsRoot)) {
    const routePath = routeForZhCnDocIndex(filePath);
    const html = fs.readFileSync(filePath, 'utf8');

    if (publishedZhCnDocPaths.has(routePath)) {
      assertNotContains(html, 'content="noindex,follow"', `published zh-CN doc ${routePath}`);
      continue;
    }

    assertContains(html, 'content="noindex,follow"', `untranslated zh-CN fallback ${routePath}`);
  }
}

function auditSitemaps() {
  const sitemap = readBuildFile('sitemap.xml');
  const zhSitemap = readBuildFile('zh-CN/sitemap.xml');

  assertContains(sitemap, siteRoot, 'root sitemap');
  assertContains(zhSitemap, zhRoot, 'zh-CN sitemap');
  assertContains(zhSitemap, `${siteRoot}zh-CN/docs/faq`, 'zh-CN sitemap');

  for (const docPath of canonicalEnglishDocPaths) {
    assertContains(sitemap, `${siteRoot}${docPath.slice(1)}`, 'root sitemap');
    assertNotContains(zhSitemap, `${siteRoot}zh-CN${docPath}`, 'zh-CN sitemap');
  }
}

function auditAiRetrievalMap() {
  const llmsText = readBuildFile('llms.txt');

  assertContains(llmsText, '## Language Scope', 'llms.txt');
  assertContains(llmsText, 'English is the canonical complete documentation surface.', 'llms.txt');
  assertContains(llmsText, `${siteRoot}zh-CN/`, 'llms.txt');
  assertContains(llmsText, `${siteRoot}zh-CN/docs/faq`, 'llms.txt');
  assertContains(
    llmsText,
    'Do not treat fallback English pages under the zh-CN locale path as independently translated Chinese source pages.',
    'llms.txt',
  );
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

auditRequiredFiles();
auditHomepageRoutes();
auditZhCnDocFallbacks();
auditSitemaps();
auditAiRetrievalMap();

console.log('website build audit passed');
