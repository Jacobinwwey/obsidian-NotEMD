'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');
const {version} = require('../src/lib/releaseFacts.cjs');

const websiteRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.dirname(websiteRoot);
const basePath = '/obsidian-NotEMD/';
const homepageGuideRoutes = [
  '/docs/getting-started/quick-start',
  '/docs/features/workflows',
  '/docs/developers/overview',
  '/docs/agents/overview',
  `/docs/releases/${version}`,
  '/docs/faq',
];
const viewportWidths = [390, 768, 1440];
const maxHomepageTabStops = 200;
const mimeTypes = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8'};

function parseArguments(argv, knownLocales) {
  const options = {locales: ['en', 'zh-CN', 'ar', 'ja'], reportDir: path.join(repositoryRoot, '.cache/verification/website-navigation')};
  const seen = new Set();
  for (let index = 0; index < argv.length; index++) {
    const option = argv[index];
    if (!['--locales', '--report-dir'].includes(option) || seen.has(option)) throw new Error(`Unknown or duplicate option: ${option}`);
    seen.add(option);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}`);
    if (option === '--locales') options.locales = value.split(',');
    else options.reportDir = path.resolve(repositoryRoot, value);
  }
  if (!options.locales.length || new Set(options.locales).size !== options.locales.length || options.locales.some(locale => !knownLocales.includes(locale))) throw new Error('Select distinct published locales');
  const cacheRoot = `${path.join(repositoryRoot, '.cache')}${path.sep}`;
  if (!options.reportDir.startsWith(cacheRoot)) throw new Error('Reports must stay inside the repository .cache directory');
  return options;
}

async function serveBuild(buildRoot) {
  if (!fs.existsSync(path.join(buildRoot, 'index.html'))) throw new Error('Build the website before running navigation checks');
  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(basePath)) { response.writeHead(404).end(); return; }
      let filename = path.resolve(buildRoot, pathname.slice(basePath.length));
      if (filename !== buildRoot && !filename.startsWith(`${buildRoot}${path.sep}`)) { response.writeHead(404).end(); return; }
      if (!fs.existsSync(filename) && fs.existsSync(`${filename}.html`)) filename += '.html';
      if (fs.existsSync(filename) && fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
      if (!fs.existsSync(filename)) { response.writeHead(404).end(); return; }
      response.writeHead(200, {'Content-Type': mimeTypes[path.extname(filename)] || 'application/octet-stream'});
      fs.createReadStream(filename).on('error', error => response.destroy(error)).pipe(response);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {server, origin: `http://127.0.0.1:${server.address().port}`};
}

async function inspectPage(page, label, failures, axeSource) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const geometry = await page.evaluate(() => ({width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth}));
  if (geometry.scrollWidth > geometry.width + 1) failures.push({page: label, kind: 'overflow', ...geometry});
  // Axe skips fully transparent text when checking contrast. Inspect actual
  // header text paint as well so a theme token cannot silently erase labels.
  const transparentHeaderText = await page.locator('main th').evaluateAll(headers => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const paint = canvas.getContext('2d', {willReadFrequently: true});
    return headers.flatMap(header => {
      const missingText = [];
      const walker = document.createTreeWalker(header, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (!text) continue;
        const color = getComputedStyle(node.parentElement).color;
        paint.clearRect(0, 0, 1, 1);
        paint.fillStyle = color;
        paint.fillRect(0, 0, 1, 1);
        if (paint.getImageData(0, 0, 1, 1).data[3] === 0) missingText.push({text, color});
      }
      return missingText;
    });
  });
  for (const header of transparentHeaderText) failures.push({page: label, kind: 'transparent-table-header', ...header});
  // Check glyph order, not a CSS declaration: RTL prose must not move a path's
  // leading dot to the end of the identifier that users read and copy.
  const inlinePaths = await page.locator('main code').evaluateAll(elements => elements
    .filter(element => element.textContent === '.obsidian')
    .map(element => {
      const node = element.firstChild;
      if (node.nodeType !== Node.TEXT_NODE) throw new Error('Inline path sample must contain direct text');
      const glyph = document.createRange();
      glyph.setStart(node, 0);
      glyph.setEnd(node, 1);
      const dotLeft = glyph.getBoundingClientRect().left;
      glyph.setStart(node, 1);
      glyph.setEnd(node, 2);
      return {text: element.textContent, dotLeft, firstLetterLeft: glyph.getBoundingClientRect().left};
    }));
  if (label.endsWith('/docs/agents/overview') && !inlinePaths.length) {
    failures.push({page: label, kind: 'missing-inline-path-sample'});
  }
  for (const sample of inlinePaths) {
    if (sample.dotLeft >= sample.firstLetterLeft) failures.push({page: label, kind: 'reordered-inline-path', ...sample});
  }
  await page.addScriptTag({content: axeSource});
  const violations = await page.evaluate(async () => {
    const audit = await window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']}});
    return audit.violations.filter(item => ['serious', 'critical'].includes(item.impact)).map(item => ({id: item.id, impact: item.impact, description: item.description, targets: item.nodes.map(node => node.target)}));
  });
  for (const violation of violations) failures.push({page: label, kind: 'accessibility', ...violation});
  return geometry;
}

async function followHomepageGuideByKeyboard(page, expectedPath) {
  const link = page.locator(`main a[href="${expectedPath}"], footer a[href="${expectedPath}"]`).first();
  const visited = await page.evaluateHandle(() => new Set());
  try {
    // Start from the freshly loaded page and follow the browser's real Tab order;
    // forcing focus would conceal traps and links excluded from keyboard access.
    for (let tabStops = 0; tabStops < maxHomepageTabStops; tabStops++) {
      await page.keyboard.press('Tab');
      const focusPosition = await link.evaluate((element, visited) => {
        const active = document.activeElement;
        const repeated = visited.has(active);
        visited.add(active);
        return {focused: active === element, repeated};
      }, visited);
      if (focusPosition.focused) {
        const focusStyle = await link.evaluate(element => {
          const style = getComputedStyle(element);
          return {focused: document.activeElement === element, tabIndex: element.tabIndex, outline: style.outlineStyle, outlineWidth: style.outlineWidth, shadow: style.boxShadow};
        });
        await Promise.all([page.waitForURL(url => url.pathname.replace(/\/$/, '') === expectedPath.replace(/\/$/, '')), page.keyboard.press('Enter')]);
        return focusStyle;
      }
      if (focusPosition.repeated) throw new Error(`Tab focus loop before homepage guide ${expectedPath}`);
    }
    throw new Error(`Tab traversal limit (${maxHomepageTabStops}) reached before homepage guide ${expectedPath}`);
  } finally {
    await visited.dispose();
  }
}

async function auditNavigation(argv = process.argv.slice(2)) {
  const {publishedLocaleCodes} = await import(pathToFileURL(path.join(websiteRoot, 'src/lib/publishedLocales.mjs')).href);
  const options = parseArguments(argv, publishedLocaleCodes);
  fs.mkdirSync(options.reportDir, {recursive: true});
  const tempRoot = path.join(repositoryRoot, '.cache/browser-temp');
  fs.mkdirSync(tempRoot, {recursive: true});
  process.env.TEMP = tempRoot;
  process.env.TMP = tempRoot;
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const {server, origin} = await serveBuild(path.join(websiteRoot, 'build'));
  const report = {node: process.version, locales: options.locales, pages: [], failures: []};
  let browser;
  try {
    browser = await chromium.launch({headless: true});
    for (const locale of options.locales) {
      const localeBase = `${basePath}${locale === 'en' ? '' : `${locale}/`}`;
      for (const width of viewportWidths) {
        const page = await browser.newPage({viewport: {width, height: 1000}, reducedMotion: 'reduce'});
        page.on('pageerror', error => report.failures.push({page: page.url(), kind: 'pageerror', message: error.message}));
        page.on('console', message => { if (message.type() === 'error') report.failures.push({page: page.url(), kind: 'console', message: message.text()}); });
        const homeUrl = `${origin}${localeBase}`;
        try {
          const response = await page.goto(homeUrl, {waitUntil: 'networkidle'});
          if (response.status() !== 200) throw new Error(`Homepage returned ${response.status()}`);
          const rightToLeft = await page.locator('html').getAttribute('dir') === 'rtl';
          for (const route of homepageGuideRoutes) {
            const expectedPath = `${localeBase}${route.slice(1)}`;
            const link = page.locator(`main a[href="${expectedPath}"], footer a[href="${expectedPath}"]`).first();
            if (!await link.count() || !await link.isVisible()) {
              report.failures.push({page: homeUrl, width, kind: 'missing-homepage-guide-link', route});
            }
          }
          report.pages.push({locale, width, route: '/', ...await inspectPage(page, `${locale}/${width}/`, report.failures, axeSource)});
          await page.screenshot({path: path.join(options.reportDir, `${locale}-${width}-home.png`), fullPage: true});

          for (const route of homepageGuideRoutes) {
            await page.goto(homeUrl, {waitUntil: 'networkidle'});
            const expectedPath = `${localeBase}${route.slice(1)}`;
            const link = page.locator(`main a[href="${expectedPath}"], footer a[href="${expectedPath}"]`).first();
            if (!await link.count() || !await link.isVisible()) continue;
            const focusStyle = await followHomepageGuideByKeyboard(page, expectedPath);
            if (!focusStyle.focused || focusStyle.tabIndex < 0 || ((focusStyle.outline === 'none' || focusStyle.outlineWidth === '0px') && focusStyle.shadow === 'none')) {
              report.failures.push({page: homeUrl, width, route, kind: 'missing-focus-indicator', ...focusStyle});
            }
            await page.waitForLoadState('networkidle');
            await page.locator('article h1').first().waitFor({state: 'visible'});
            report.pages.push({locale, width, route, ...await inspectPage(page, `${locale}/${width}${route}`, report.failures, axeSource)});
            if (rightToLeft && route === '/docs/agents/overview') {
              await page.screenshot({path: path.join(options.reportDir, `${locale}-${width}-agents.png`), fullPage: true});
            }
          }

          await page.goto(`${origin}${localeBase}docs/providers/overview`, {waitUntil: 'networkidle'});
          await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
          report.pages.push({locale, width, route: '/docs/providers/overview (dark)', ...await inspectPage(page, `${locale}/${width}/providers-dark`, report.failures, axeSource)});
          if (rightToLeft) {
            await page.screenshot({path: path.join(options.reportDir, `${locale}-${width}-providers-dark.png`), fullPage: true});
          }
        } catch (error) {
          report.failures.push({locale, width, kind: 'navigation', message: error.message});
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    fs.writeFileSync(path.join(options.reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Navigation audit: ${report.pages.length} pages, ${report.failures.length} failures. ${options.reportDir}`);
  if (report.failures.length) throw new Error(JSON.stringify(report.failures.slice(0, 8), null, 2));
  return report;
}

if (require.main === module) auditNavigation().catch(error => { console.error(error.message); process.exitCode = 1; });

module.exports = {auditNavigation, followHomepageGuideByKeyboard, parseArguments};
