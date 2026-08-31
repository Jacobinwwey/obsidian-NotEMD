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

async function assertSvgGeometry(page, fixtureId) {
  const report = await page.evaluate(() => {
    const svg = document.querySelector('.diagram-visual svg');
    if (!svg) return { missing: true };
    // Vega/Mermaid own their browser layout and do not expose the deterministic
    // geometry contract. Their runtime validators remain the source of truth;
    // this gate applies only to native SVG artifacts carrying the marker.
    if (!svg.getAttribute('data-layout-safety')) return { skipped: true };
    const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    const canvas = viewBox.length === 4
      ? { x: viewBox[0], y: viewBox[1], width: viewBox[2], height: viewBox[3] }
      : { x: 0, y: 0, width: Number(svg.getAttribute('width')) || 0, height: Number(svg.getAttribute('height')) || 0 };
    const safeBox = element => {
      try {
        const box = element.getBBox();
        return Number.isFinite(box.x) && Number.isFinite(box.y) && Number.isFinite(box.width) && Number.isFinite(box.height)
          ? box
          : null;
      } catch {
        return null;
      }
    };
    const intersects = (first, second, padding = 0) => first.x - padding < second.x + second.width
      && first.x + first.width + padding > second.x
      && first.y - padding < second.y + second.height
        && first.y + first.height + padding > second.y;
    const parseRgb = value => {
      const match = String(value || '').match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const channels = match[1].split(',').map(channel => Number.parseFloat(channel.trim()));
      return channels.length >= 3 && channels.slice(0, 3).every(Number.isFinite)
        ? channels.slice(0, 3).map(channel => channel / 255)
        : null;
    };
    const luminance = rgb => {
      const linear = rgb.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const contrastRatio = (foreground, background) => {
      const foregroundRgb = parseRgb(foreground);
      const backgroundRgb = parseRgb(background);
      if (!foregroundRgb || !backgroundRgb) return null;
      const foregroundLuminance = luminance(foregroundRgb);
      const backgroundLuminance = luminance(backgroundRgb);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    };
    const textOutOfBounds = Array.from(svg.querySelectorAll('text')).flatMap(text => {
      const box = safeBox(text);
      if (!box || box.width === 0 || box.height === 0) return [];
      return box.x < canvas.x - 2 || box.y < canvas.y - 2
        || box.x + box.width > canvas.x + canvas.width + 2
        || box.y + box.height > canvas.y + canvas.height + 2
        ? [text.textContent || 'text']
        : [];
    });
    // Runtime-generated Mermaid/Vega SVGs have no stable node contract. Keep
    // their final viewport/text sanity checks, but do not apply native
    // renderer assumptions such as drawio node groups or edge labels.
    if (svg.getAttribute('data-layout-safety-owner') === 'runtime') {
      const drawableCount = svg.querySelectorAll('g,path,rect,circle,ellipse,polygon,text,image,foreignObject').length;
      const rootRect = svg.getBoundingClientRect();
      const runtimeTexts = Array.from(svg.querySelectorAll('text')).flatMap((text, index) => {
        const rect = text.getBoundingClientRect();
        return rect.width === 0 || rect.height === 0 ? [] : [{ text, index, rect, content: text.textContent || 'text' }];
      });
      const runtimeTextOutOfBounds = runtimeTexts.flatMap(item => item.rect.left < rootRect.left - 2
        || item.rect.top < rootRect.top - 2
        || item.rect.right > rootRect.right + 2
        || item.rect.bottom > rootRect.bottom + 2
        ? [item.content]
        : []);
      const runtimeTextTextOverlaps = runtimeTexts.flatMap((first, index) => runtimeTexts.slice(index + 1)
        .filter(second => first.text !== second.text && intersects(
          { x: first.rect.left, y: first.rect.top, width: first.rect.width, height: first.rect.height },
          { x: second.rect.left, y: second.rect.top, width: second.rect.width, height: second.rect.height },
          0.5
        ))
        .map(second => `${first.content.trim()}:${second.content.trim()}`));
      const runtimeTextAfterShape = runtimeTexts.flatMap(textItem => Array.from(svg.querySelectorAll('rect,circle,ellipse,polygon,image'))
        .map((shape, shapeIndex) => ({ shape, shapeIndex, rect: shape.getBoundingClientRect() }))
        .filter(shapeItem => !shapeItem.shape.classList.contains('ref-canvas')
          && !shapeItem.shape.classList.contains('notemd-canvas-surface')
          && !shapeItem.shape.hasAttribute('data-nested-scope-surface')
          && !shapeItem.shape.hasAttribute('data-nested-tag-surface'))
        .filter(shapeItem => shapeItem.rect.width > 2 && shapeItem.rect.height > 2)
        .filter(shapeItem => shapeItem.shape.compareDocumentPosition(textItem.text) & Node.DOCUMENT_POSITION_PRECEDING)
        .filter(shapeItem => intersects(
          { x: textItem.rect.left, y: textItem.rect.top, width: textItem.rect.width, height: textItem.rect.height },
          { x: shapeItem.rect.left, y: shapeItem.rect.top, width: shapeItem.rect.width, height: shapeItem.rect.height },
          1
        ))
        .map(shapeItem => `${textItem.content.trim()}:${shapeItem.shape.tagName.toLowerCase()}`));
      return {
        missing: false,
        runtimeOwned: true,
        textOutOfBounds: runtimeTextOutOfBounds,
        drawableCount,
        textTextOverlaps: runtimeTextTextOverlaps,
        textAfterShape: runtimeTextAfterShape
      };
    }
    const nodeRects = Array.from(svg.querySelectorAll('g[data-drawio-type="node"], g.notemd-canvas-node')).flatMap(group => {
      const rect = group.querySelector('rect');
      const box = rect ? safeBox(rect) : null;
      return box ? [{ group, box }] : [];
    });
    const nodeTextOutOfBounds = nodeRects.flatMap(({ group, box }) => Array.from(group.querySelectorAll('text')).flatMap(text => {
      const textBox = safeBox(text);
      return textBox && (textBox.x < box.x - 2 || textBox.y < box.y - 2
        || textBox.x + textBox.width > box.x + box.width + 2
        || textBox.y + textBox.height > box.y + box.height + 2)
        ? [group.id || 'node']
        : [];
    }));
    const nodeOverlaps = nodeRects.flatMap((first, index) => nodeRects.slice(index + 1)
      .filter(second => intersects(first.box, second.box, 1))
      .map(second => `${first.group.id || index}:${second.group.id || index + 1}`));
    const edgeLabelNodeOverlaps = Array.from(svg.querySelectorAll('g[data-drawio-type="edge"], g.notemd-canvas-edge')).flatMap(edge => {
      const labels = Array.from(edge.querySelectorAll('text')).flatMap(text => {
        const box = safeBox(text);
        return box ? [box] : [];
      });
      return labels.flatMap(labelBox => nodeRects.filter(node => intersects(labelBox, node.box, 2)).map(node => `${edge.id || 'edge'}:${node.group.id || 'node'}`));
    });
    const coreTruncations = Array.from(svg.querySelectorAll('[data-layout-truncated="true"]'))
      .filter(element => !element.classList.contains('ref-node-sub') && !element.classList.contains('ref-hub-sub'))
      .map(element => element.textContent || 'text');
    const contrastFailures = Array.from(svg.querySelectorAll('g')).flatMap(group => {
      const shapes = Array.from(group.children)
        .filter(element => /^(rect|circle|ellipse|polygon)$/i.test(element.tagName))
        .map(element => ({ element, box: safeBox(element) }))
        .filter(item => item.box && item.box.width > 0 && item.box.height > 0);
      if (shapes.length === 0) return [];
      return Array.from(group.querySelectorAll(':scope > text')).flatMap(text => {
        const textBox = safeBox(text);
        if (!textBox) return [];
        const shape = shapes
          .filter(candidate => intersects(textBox, candidate.box))
          .sort((first, second) => (first.box.width * first.box.height) - (second.box.width * second.box.height))[0];
        if (!shape) return [];
        const ratio = contrastRatio(getComputedStyle(text).fill, getComputedStyle(shape.element).fill);
        return ratio !== null && ratio < 4.5
          ? [`${group.id || 'group'}:${(text.textContent || 'text').trim()}:${ratio.toFixed(2)}`]
          : [];
      });
    });
    const rootTextShapeOverlaps = Array.from(svg.children)
      .filter(element => element.tagName.toLowerCase() === 'text')
      .flatMap(text => {
        const textBox = safeBox(text);
        if (!textBox) return [];
        return Array.from(svg.querySelectorAll('rect,circle,ellipse,polygon'))
          .filter(shape => !shape.classList.contains('ref-canvas')
            && !shape.classList.contains('notemd-canvas-surface')
            && !shape.hasAttribute('data-nested-scope-surface')
            && !shape.hasAttribute('data-nested-tag-surface'))
          .map(shape => ({ shape, box: safeBox(shape) }))
          .filter(candidate => candidate.box && intersects(textBox, candidate.box))
          .map(candidate => `${(text.textContent || 'text').trim()}:${candidate.shape.tagName.toLowerCase()}`);
      });
    const rootTextTextOverlaps = Array.from(svg.children)
      .filter(element => element.tagName.toLowerCase() === 'text')
      .flatMap((text, index, roots) => {
        const firstBox = safeBox(text);
        if (!firstBox) return [];
        return roots.slice(index + 1)
          .filter(other => other.tagName.toLowerCase() === 'text')
          .filter(other => {
            const secondBox = safeBox(other);
            return secondBox && intersects(firstBox, secondBox, 0.5);
          })
          .map(other => `${(text.textContent || 'text').trim()}:${(other.textContent || 'text').trim()}`);
      });
    const nativeTextTextOverlaps = Array.from(svg.querySelectorAll('text')).flatMap((text, index, texts) => {
      const firstBox = safeBox(text);
      if (!firstBox || firstBox.width === 0 || firstBox.height === 0) return [];
      return texts.slice(index + 1).flatMap(other => {
        const secondBox = safeBox(other);
        if (!secondBox || secondBox.width === 0 || secondBox.height === 0) return [];
        // Text that is part of the same semantic marker (for example a glyph
        // in an SVG definition) is not a diagram label relationship. All
        // visible native labels otherwise need independent clearance.
        if (text.closest('defs') || other.closest('defs')) return [];
        return intersects(firstBox, secondBox, 0.5)
          ? [`${(text.textContent || 'text').trim()}:${(other.textContent || 'text').trim()}`]
          : [];
      });
    });
    return { missing: false, textOutOfBounds, nodeTextOutOfBounds, nodeOverlaps, edgeLabelNodeOverlaps, coreTruncations, contrastFailures, rootTextShapeOverlaps, rootTextTextOverlaps, nativeTextTextOverlaps };
  });
  if (report.skipped) return;
  if (report.runtimeOwned) {
    if (report.drawableCount === 0 || report.textOutOfBounds.length || report.textTextOverlaps.length || report.textAfterShape.length) {
      throw new Error(`Diagram fixture "${fixtureId}" failed runtime SVG sanity gate: ${JSON.stringify(report)}`);
    }
    return;
  }
    if (report.missing || report.textOutOfBounds.length || report.nodeTextOutOfBounds.length
    || report.nodeOverlaps.length || report.edgeLabelNodeOverlaps.length || report.coreTruncations.length
    || report.contrastFailures.length || report.rootTextShapeOverlaps.length || report.rootTextTextOverlaps.length
    || report.nativeTextTextOverlaps.length) {
    throw new Error(`Diagram fixture "${fixtureId}" failed SVG geometry gate: ${JSON.stringify(report)}`);
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
      await assertSvgGeometry(page, entry.fixtureId);
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
