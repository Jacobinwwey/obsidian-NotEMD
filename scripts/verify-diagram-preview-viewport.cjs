#!/usr/bin/env node
'use strict';

// Actual browser geometry complements Modal renderer/lifecycle unit tests.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');

(async () => {
  const outputDir = path.resolve('.cache/diagram-preview-viewport');
  fs.mkdirSync(outputDir, { recursive: true });
  const bundle = buildSync({ entryPoints: ['src/ui/DiagramPreviewViewport.ts'], bundle: true,
    format: 'iife', globalName: 'NotemdViewport', write: false }).outputFiles[0].text;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
    console.log('Checking viewport navigation');
    page.setDefaultTimeout(15000);
    await page.setContent('<style>body{margin:16px;--background-primary:#fafafa;--background-modifier-border:#999;--interactive-accent:#3869af;--text-muted:#666;--radius-s:4px}section{width:760px;margin-bottom:16px}button{font:14px sans-serif}svg{background:#f1f5fa}</style><section id="first"></section><section id="second"></section>');
    await page.addStyleTag({ content: fs.readFileSync('styles.css', 'utf8') });
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      const copy = { zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomFit: 'Fit', zoomActual: 'Actual size',
        zoomLevel: 'Zoom level', zoomViewport: 'Hold Ctrl to zoom; hold Alt to select text', zoomLock: 'Lock', zoomUnlock: 'Unlock' };
      const first = new NotemdViewport.DiagramPreviewViewport(document.querySelector('#first'), copy);
      const second = new NotemdViewport.DiagramPreviewViewport(document.querySelector('#second'), copy);
      first.contentEl.innerHTML = '<svg viewBox="0 0 4772 16749"><text x="20" y="80" font-size="48">Architecture 核心关系</text><rect x="4000" y="15500" width="500" height="700" fill="#7da8db"/></svg>';
      second.contentEl.innerHTML = '<svg viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#d7e6f8"/><text x="100" y="150" font-size="48">Second diagram</text></svg>';
      window.views = { first, second };
      first.refresh(); second.refresh();
    });
    await page.waitForTimeout(80);
    const scale = async id => Number(await page.locator(`${id} .notemd-diagram-zoom-viewport`).getAttribute('data-zoom-scale'));
    const fitFirst = await scale('#first');
    const fitSecond = await scale('#second');
    assert(fitFirst > 0 && fitFirst < 0.1);
    await page.locator('#first button[aria-label="Actual size"]').click();
    assert.equal(await scale('#first'), 1);
    assert.equal(await scale('#second'), fitSecond);
    const dimensions = await page.locator('#first .notemd-diagram-zoom-viewport').evaluate(el => ({
      scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight, width: el.clientWidth, height: el.clientHeight
    }));
    assert(dimensions.scrollWidth >= 4772 && dimensions.scrollHeight >= 16749);
    await page.locator('#first button[aria-label="Zoom in"]').click();
    assert.equal(await scale('#first'), 1.25);
    await page.locator('#first .notemd-diagram-zoom-viewport').focus();
    await page.keyboard.press('-');
    assert.equal(await scale('#first'), 1);
    await page.keyboard.press('0');
    assert.equal(await scale('#first'), fitFirst);
    await page.locator('#first button[aria-label="Actual size"]').click();
    const viewport = page.locator('#first .notemd-diagram-zoom-viewport');
    await viewport.evaluate(el => { el.scrollTop = 500; el.scrollLeft = 500; });
    const box = await viewport.boundingBox();
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 100, { steps: 4 });
    await page.mouse.up();
    const afterDrag = await viewport.evaluate(el => ({ left: el.scrollLeft, top: el.scrollTop }));
    assert(afterDrag.top > 550 && afterDrag.left > 530);
    const beforeWheel = await scale('#first');
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await page.waitForTimeout(60);
    assert(await scale('#first') > beforeWheel);
    const beforeScroll = await scale('#first');
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(60);
    assert.equal(await scale('#first'), beforeScroll);

    // Real modifier and pointer events prove Alt enables SVG text selection without panning.
    console.log('Checking SVG Alt selection');
    await page.locator('#second button[aria-label="Actual size"]').click();
    const secondViewport = page.locator('#second .notemd-diagram-zoom-viewport');
    await secondViewport.evaluate(el => { el.scrollLeft = 0; el.scrollTop = 0; });
    await secondViewport.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);
    await page.keyboard.down('Alt');
    const textBox = await page.locator('#second svg text').boundingBox();
    await page.mouse.move(textBox.x + 2, textBox.y + textBox.height / 2);
    assert(await secondViewport.evaluate(el => el.classList.contains('is-locked')));
    const selectionStart = await secondViewport.evaluate(el => ({ left: el.scrollLeft, top: el.scrollTop }));
    await page.mouse.down();
    await page.mouse.move(textBox.x + textBox.width - 2, textBox.y + textBox.height / 2, { steps: 12 });
    await page.mouse.up();
    assert((await page.evaluate(() => window.getSelection().toString())).includes('Second'));
    assert.deepEqual(await secondViewport.evaluate(el => ({ left: el.scrollLeft, top: el.scrollTop })), selectionStart);
    assert.equal(await page.locator('#second .notemd-diagram-zoom-lock').getAttribute('aria-pressed'), 'false');
    const altScale = await scale('#second');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Alt');
    assert.equal(await scale('#second'), altScale);
    assert.equal(await secondViewport.evaluate(el => el.classList.contains('is-locked')), false);
    await page.locator('#second button[aria-label="Lock"]').click();
    await secondViewport.focus();
    await page.keyboard.down('Alt');
    await page.keyboard.up('Alt');
    assert(await secondViewport.evaluate(el => el.classList.contains('is-locked')));
    await page.locator('#second button[aria-label="Unlock"]').click();

    // Iframe diagrams share the same viewport without changing sandbox access.
    console.log('Checking iframe Alt selection');
    await page.evaluate(() => {
      const section = document.querySelector('#second');
      views.second.destroy();
      section.replaceChildren();
      const copy = { zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomFit: 'Fit', zoomActual: 'Actual size', zoomLevel: 'Zoom level', zoomViewport: 'Hold Ctrl to zoom; hold Alt to select text', zoomLock: 'Lock', zoomUnlock: 'Unlock' };
      const view = new NotemdViewport.DiagramPreviewViewport(section, copy);
      const iframe = document.createElement('iframe');
      iframe.className = 'notemd-diagram-preview-frame';
      iframe.setAttribute('sandbox', 'allow-same-origin');
      iframe.onload = () => view.attachIframe(iframe);
      iframe.srcdoc = '<svg viewBox="0 0 1800 900"><rect width="1800" height="900" fill="#d8e4f5"/><text x="100" y="150" font-size="48">Iframe selection</text></svg>';
      view.contentEl.appendChild(iframe);
      window.views.second = view;
    });
    await page.waitForFunction(() => document.querySelector('#second iframe')?.style.width === '1800px');
    const initialFrameScale = await scale('#second');
    await page.locator('#second button[aria-label="Zoom in"]').click();
    assert(await scale('#second') > initialFrameScale);
    assert.equal(await page.locator('#second iframe').getAttribute('sandbox'), 'allow-same-origin');
    await page.frameLocator("#second iframe").locator("text").evaluate(el => {
      const doc = el.ownerDocument;
      doc.dispatchEvent(new KeyboardEvent("keydown", {key:"Alt", altKey:true, bubbles:true}));
      const range = doc.createRange();
      range.selectNodeContents(el);
      doc.getSelection().removeAllRanges();
      doc.getSelection().addRange(range);
    });
    assert(await secondViewport.evaluate(el => el.classList.contains("is-locked")));
    assert((await page.frameLocator("#second iframe").locator("text").evaluate(el => el.ownerDocument.getSelection().toString())).includes("Iframe"));
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keyup", {key:"Alt", bubbles:true})));
    assert.equal(await secondViewport.evaluate(el => el.classList.contains("is-locked")), false);
    await page.frameLocator('#second iframe').locator('svg').evaluate(el => {
      el.setAttribute('viewBox', '0 0 2400 1200');
      el.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    });
    await page.waitForFunction(() => document.querySelector('#second iframe')?.style.width === '2400px');
    const beforeDestroy = await scale('#second');
    await page.evaluate(() => views.second.destroy());
    await page.locator('#second button[aria-label="Zoom in"]').click();
    assert.equal(await scale('#second'), beforeDestroy);
    await page.locator('#first button[aria-label="Fit"]').click();
    await page.screenshot({ path: path.join(outputDir, 'preview.png'), fullPage: true });
    const controls = await page.locator('.notemd-diagram-zoom-controls button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect(); return { width: rect.width, height: rect.height, label: button.getAttribute('aria-label') };
    }));
    assert(controls.every(c => c.width >= 44 && c.height >= 44 && c.label));
    const receipt = { passed: true, independentPanels: true, inlineSvg: true, iframeSvg: true,
      keyboard: true, pointerPan: true, modifiedWheel: true, plainWheelPreserved: true, cleanup: true,
      altTemporaryLock: true, altSvgTextSelection: true, altIframeSelectionRange: true, persistentLockPreserved: true,
      fitFirst, controls };
    fs.writeFileSync(path.join(outputDir, 'receipt.json'), JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify(receipt));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
