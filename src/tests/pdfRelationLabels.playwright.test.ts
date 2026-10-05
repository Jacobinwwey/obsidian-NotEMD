import { build } from 'esbuild';
import { chromium, Browser } from 'playwright';
import { unzlibSync } from 'fflate';
import * as path from 'path';

function pdfPageCommands(bytes: number[]): string {
    const raw = Buffer.from(bytes).toString('latin1');
    return Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g), match => {
        try { return Buffer.from(unzlibSync(Buffer.from(match[1], 'latin1'))).toString('latin1'); }
        catch { return match[1]; }
    }).filter(stream => /\/F\d+ [\d.]+ Tf|[\d.]+ [\d.]+ m/.test(stream)).join('\n');
}

describe('boxed relationship text in vector PDFs', () => {
    let browser: Browser;
    let bundle: string;
    beforeAll(async () => {
        const compiled = await build({
            stdin: { contents: "export { buildPdfFromSvg } from './src/rendering/preview/pdfPreview';", resolveDir: path.join(__dirname, '../..'), loader: 'ts' },
            bundle: true, write: false, format: 'iife', globalName: 'PdfExport', platform: 'browser', loader: { '.ttf': 'dataurl' }
        });
        bundle = compiled.outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    }, 60000);
    afterAll(async () => { await browser?.close(); });

    test('exports nested SVG functional selectors with gradients and clipping without external resources', async () => {
        const page = await browser.newPage();
        const requests: string[] = [];
        page.on('request', request => requests.push(request.url()));
        try {
            await page.addScriptTag({ content: bundle });
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
                <svg x="20" y="20" width="200" height="120" viewBox="0 0 200 120">
                    <defs><linearGradient id="paint"><stop offset="0" stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient>
                        <clipPath id="clip"><rect width="150" height="100"/></clipPath></defs>
                    <style>.node:where(:not(.skip, .hidden), [data-note="a,b"]) { fill:url(#paint); clip-path:url(#clip); }
                        g:has(> .node) { opacity:0.8; }</style>
                    <g><rect class="node" width="190" height="110"/></g>
                </svg><text x="20" y="180">渐变与裁剪</text>
                <image href="https://invalid.example/remote.svg" width="20" height="20"/>
            </svg>`;
            const bytes = await page.evaluate(markup => (window as any).PdfExport.buildPdfFromSvg(markup).then((buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))), svg);
            expect(Buffer.from(bytes).toString('latin1')).toContain('/ShadingType 2');
            expect(pdfPageCommands(bytes)).toMatch(/W\*?\s+n/);
            expect(requests).toEqual([]);
            expect(await page.locator('iframe').count()).toBe(0);
        } finally { await page.close(); }
    }, 30000);

    test.each(['', 'viewBox="0 0 240 100"'])('fits the complete CSS-pixel canvas inside the PDF point viewport (%s)', async viewBox => {
        const page = await browser.newPage();
        try {
            await page.addScriptTag({ content: bundle });
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" ${viewBox}>
                <rect x="220" y="80" width="20" height="20" fill="red"/><text x="10" y="20">边界</text></svg>`;
            const bytes = await page.evaluate(markup => (window as any).PdfExport.buildPdfFromSvg(markup).then((buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))), svg);
            expect(pdfPageCommands(bytes)).toMatch(/0\.75 0\. 0\. 0\.75 0\. 0\. cm/);
            expect(Buffer.from(bytes).toString('latin1')).toContain('/MediaBox [0 0 180. 75.]');
        } finally { await page.close(); }
    }, 30000);

    test('preserves inherited currentColor in reused SVG definitions and ignores host theme styles', async () => {
        const page = await browser.newPage();
        try {
            await page.addStyleTag({ content: 'svg, path, text { color: pink !important; fill: pink !important; }' });
            await page.addScriptTag({ content: bundle });
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100">
                <style>:is(.symbol-shape, .unused) { fill: currentColor; } text { font-size:12px; }</style>
                <defs><g id="symbol"><path class="symbol-shape" d="M0 0h30v30h-30z"/></g></defs>
                <use href="#symbol" x="10" y="10" color="red"/>
                <use href="#symbol" x="80" y="10" color="blue"/>
                <text x="10" y="70">复用图形</text>
            </svg>`;
            const bytes = await page.evaluate(markup => (window as any).PdfExport.buildPdfFromSvg(markup).then((buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))), svg);
            const commands = pdfPageCommands(bytes);
            expect(commands).toContain('1. 0. 0. rg');
            expect(commands).toContain('0. 0. 1. rg');
            expect(commands).not.toContain('1. 0.75 0.8 rg');
        } finally { await page.close(); }
    }, 30000);

    test('exports scoped functional selectors with their cascade, inline overrides and Chinese text intact', async () => {
        const page = await browser.newPage();
        try {
            await page.addScriptTag({ content: bundle });
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" data-notemd-svg-scope="old">
                <style>
                    [data-notemd-svg-scope="old"] :is(#unused, :is(.node, [data-label="a,b"])) { fill: red; stroke: blue; stroke-width: 2px; }
                    .node { fill: green; }
                    .node { stroke: purple !important; }
                    text { font-size: 12px; }
                </style>
                <rect class="node" data-label="a,b" x="5" y="5" width="100" height="40"/>
                <rect class="node" x="120" y="5" width="100" height="40" style="fill: blue"/>
                <text x="10" y="65">核心关联 café</text>
            </svg>`;
            const bytes = await page.evaluate(markup => (window as any).PdfExport.buildPdfFromSvg(markup).then((buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))), svg);
            const commands = pdfPageCommands(bytes);
            expect(commands).toMatch(/Tj|TJ/);
            expect(commands).toContain('1. 0. 0. rg');
            expect(commands).toContain('0. 0. 1. rg');
            expect(commands).toContain('0.5 0. 0.5 RG');
            expect(await page.locator('iframe').count()).toBe(0);
        } finally { await page.close(); }
    }, 30000);

    test.each([true, false])('keeps text visible while preserving unrelated outlines (boxed relation: %s)', async boxedRelation => {
        const page = await browser.newPage();
        try {
            await page.addScriptTag({ content: bundle });
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80">
                <style>.label { font-size:12px; fill:#475569; stroke:#ffffff; stroke-width:4px; paint-order:stroke; }</style>
                <g><rect ${boxedRelation ? 'data-drawnix-mindmap-relation-label-background="true"' : ''} x="5" y="5" width="225" height="70" fill="white"/>
                <text ${boxedRelation ? 'data-drawnix-mindmap-relation-label="true"' : ''} class="label" x="20" y="25">
                    <tspan x="20" dy="0">产生短拷贝</tspan><tspan x="20" dy="18">核心关系 café</tspan>
                </text></g></svg>`;
            const bytes = await page.evaluate(markup => (window as any).PdfExport.buildPdfFromSvg(markup).then((buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))), svg);
            const commands = pdfPageCommands(bytes);
            expect(commands).toMatch(/Tj|TJ/);
            // svg2pdf's fillThenStroke (2 Tr) erases small glyphs with a 4px white stroke.
            if (boxedRelation) expect(commands).not.toMatch(/(?:^|\n)2 Tr(?:\n|$)/);
            else expect(commands).toMatch(/(?:^|\n)2 Tr(?:\n|$)/);
        } finally { await page.close(); }
    }, 30000);
});
