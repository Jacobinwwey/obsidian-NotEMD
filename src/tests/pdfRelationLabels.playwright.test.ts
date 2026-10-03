import { build } from 'esbuild';
import { chromium, Browser } from 'playwright';
import { unzlibSync } from 'fflate';
import * as path from 'path';

function pdfPageCommands(bytes: number[]): string {
    const raw = Buffer.from(bytes).toString('latin1');
    return Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g), match => {
        try { return Buffer.from(unzlibSync(Buffer.from(match[1], 'latin1'))).toString('latin1'); }
        catch { return match[1]; }
    }).filter(stream => /\/F\d+ [\d.]+ Tf/.test(stream)).join('\n');
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
