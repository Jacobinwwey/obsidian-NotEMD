const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIAGRAM_GALLERY_SCHEMA_VERSION = 1;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function assertFixtureId(value) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`Invalid diagram gallery fixture id "${String(value)}".`);
  }
}

function buildGalleryManifest(entries) {
  return {
    schemaVersion: DIAGRAM_GALLERY_SCHEMA_VERSION,
    entries: entries.map(entry => {
      assertFixtureId(entry.fixtureId);
      return {
        typeId: entry.typeId,
        fixtureId: entry.fixtureId,
        title: entry.title,
        target: entry.target,
        previewTarget: entry.previewTarget,
        svgPath: `./${entry.fixtureId}.svg`,
        pngPath: `./${entry.fixtureId}.png`,
        svgSha256: sha256(entry.svg)
      };
    })
  };
}

function collectStaleGalleryAssetNames(existingNames, expectedNames) {
  return existingNames
    .filter(name => /\.(?:svg|png)$/i.test(name) && !expectedNames.has(name))
    .sort();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildGalleryDocument(entries, fixedCardSize) {
  const cardRule = fixedCardSize
    ? 'width:960px;height:540px;'
    : 'width:100%;aspect-ratio:16/9;min-width:0;';
  const cards = entries.map(entry => (
    `<figure class="diagram-card" data-fixture-id="${escapeHtml(entry.fixtureId)}">`
      + `<div class="diagram-visual">${entry.svg}</div>`
      + `<figcaption>${escapeHtml(entry.title)}</figcaption>`
      + '</figure>'
  )).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Arial,sans-serif}
    body{padding:${fixedCardSize ? '0' : '16px'}}
    .gallery{display:${fixedCardSize ? 'block' : 'grid'};grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;width:100%}
    .diagram-card{${cardRule}margin:0;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;background:#fff;display:grid;grid-template-rows:minmax(0,1fr) 34px}
    .diagram-visual{min-width:0;min-height:0;padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .diagram-visual svg{display:block;max-width:100%;max-height:100%;width:100%;height:100%}
    figcaption{padding:8px 12px;border-top:1px solid #e5e7eb;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  </style></head><body><main class="gallery">${cards}</main></body></html>`;
}

async function buildGalleryBrowserBundle(repoRoot, cacheRoot) {
  const esbuild = require('esbuild');
  fs.mkdirSync(cacheRoot, { recursive: true });
  const outputPath = path.join(cacheRoot, 'diagram-gallery-browser.js');
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'scripts', 'diagram-gallery-browser-entry.ts')],
    outfile: outputPath,
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  return outputPath;
}

async function assertResponsiveGalleryLayout(page, entries) {
  await page.setContent(buildGalleryDocument(entries, false), { waitUntil: 'load' });
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const report = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.diagram-card'));
      const rects = cards.map(card => card.getBoundingClientRect());
      const overlap = rects.some((rect, index) => rects.slice(index + 1).some(other => (
        Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1
        && Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1
      )));
      return {
        cardCount: cards.length,
        nonBlank: rects.every(rect => rect.width > 40 && rect.height > 40),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        overlap
      };
    });
    if (report.cardCount !== entries.length || !report.nonBlank || report.overflow || report.overlap) {
      throw new Error(`Diagram gallery layout failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(report)}`);
    }
  }
}

async function renderGalleryAssets(repoRoot, cacheRoot) {
  const { chromium } = require('playwright');
  const bundlePath = await buildGalleryBrowserBundle(repoRoot, cacheRoot);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 1 });
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ path: bundlePath });
    const entries = await page.evaluate(async () => {
      const runtime = window.__NOTEMD_DIAGRAM_GALLERY__;
      if (!runtime || typeof runtime.render !== 'function') {
        throw new Error('Diagram gallery browser runtime was not installed.');
      }
      return runtime.render();
    });
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Diagram gallery browser runtime produced no entries.');
    }

    const rendered = [];
    for (const entry of entries) {
      assertFixtureId(entry.fixtureId);
      await page.setViewportSize({ width: 960, height: 540 });
      await page.setContent(buildGalleryDocument([entry], true), { waitUntil: 'load' });
      const png = await page.locator('.diagram-card').screenshot({ type: 'png', animations: 'disabled' });
      rendered.push({ ...entry, png });
    }
    await assertResponsiveGalleryLayout(page, entries);
    return rendered;
  } finally {
    await browser.close();
  }
}

function isPngBuffer(value) {
  return Buffer.isBuffer(value)
    && value.length > PNG_SIGNATURE.length
    && value.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

module.exports = {
  DIAGRAM_GALLERY_SCHEMA_VERSION,
  buildGalleryManifest,
  collectStaleGalleryAssetNames,
  renderGalleryAssets,
  isPngBuffer
};
