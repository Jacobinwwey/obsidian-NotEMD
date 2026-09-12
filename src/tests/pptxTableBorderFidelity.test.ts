import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
import { strFromU8, unzipSync } from 'fflate';
import { extractSlidevPptxSlideFromPage } from '../slideExport/pptxDomExtractor';
import { writePptxDocument } from '../slideExport/pptxWriter';

jest.mock('obsidian', () => ({ Platform: { isDesktopApp: true } }));

test('preserves a translucent bottom-only table border through DOM extraction and DrawingML', async () => {
    const browser = await chromium.launch({ headless: true });
    const cache = path.resolve('.cache');
    fs.mkdirSync(cache, { recursive: true });
    const directory = fs.mkdtempSync(path.join(cache, 'pptx-border-'));
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await page.setContent(`<body style="margin:0;background:white"><div class="slidev-page" style="width:1280px;height:720px;padding:64px;box-sizing:border-box">
            <table style="width:100%;border-collapse:collapse"><tr><td style="border:0;border-bottom:1px solid rgba(0,0,0,0.1);padding:12px">Readable 中文</td></tr></table>
        </div></body>`);
        const slide = await extractSlidevPptxSlideFromPage(page, 1);
        const cell = slide.tables[0].rows[0][0];
        expect(cell).toHaveProperty('borderSides.bottom', expect.objectContaining({ color: '000000', opacity: 0.1 }));
        expect(cell).toHaveProperty('borderSides.top.widthPt', 0);
        const output = path.join(directory, 'border.pptx');
        writePptxDocument(output, { title: 'Border fidelity', author: 'Notemd', slides: [slide] });
        const xml = strFromU8(unzipSync(new Uint8Array(fs.readFileSync(output)))['ppt/slides/slide1.xml']);
        // CT_TableCellProperties orders line properties before its fill group.
        expect(xml.match(/<a:tcPr[^>]*>[\s\S]*?<\/a:tcPr>/)?.[0]).toMatch(/^<a:tcPr[^>]*><a:lnL/);
        expect(xml).toMatch(/<a:lnB[^>]*><a:solidFill><a:srgbClr val="000000"><a:alpha val="10000"\/><\/a:srgbClr><\/a:solidFill><\/a:lnB>/);
        for (const side of ['L', 'R', 'T']) expect(xml).toContain(`<a:ln${side}><a:noFill/></a:ln${side}>`);
    } finally {
        await browser.close();
        fs.rmSync(directory, { recursive: true, force: true });
    }
}, 30000);

test('captures collapsed row separators instead of turning them into cell outlines', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await page.setContent(`<body style="margin:0;background:white"><div class="slidev-page" style="width:1280px;height:720px;padding:64px;box-sizing:border-box">
            <table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid rgba(0,0,0,0.1)"><td>Left</td><td>Right</td></tr></table>
        </div></body>`);
        const slide = await extractSlidevPptxSlideFromPage(page, 1);
        for (const cell of slide.tables[0].rows[0]) {
            expect(cell.borderSides?.bottom).toMatchObject({ color: '000000', opacity: 0.1 });
            expect(cell.borderSides?.bottom.widthPt).toBeGreaterThan(0);
            expect(cell.borderSides?.left.widthPt).toBe(0);
        }
    } finally { await browser.close(); }
}, 30000);

test('continues the outer border across every grid cell of a merged header', async () => {
    const browser = await chromium.launch({ headless: true });
    const cache = path.resolve('.cache');
    fs.mkdirSync(cache, { recursive: true });
    const directory = fs.mkdtempSync(path.join(cache, 'pptx-merged-border-'));
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await page.setContent(`<body style="margin:0;background:white"><div class="slidev-page" style="width:1280px;height:720px;padding:64px;box-sizing:border-box">
            <table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid rgba(0,0,0,0.1)"><th colspan="2">Merged</th></tr><tr><td>Left</td><td>Right</td></tr></table>
        </div></body>`);
        const slide = await extractSlidevPptxSlideFromPage(page, 1);
        const output = path.join(directory, 'merged.pptx');
        writePptxDocument(output, { title: 'Merged border', author: 'Notemd', slides: [slide] });
        const xml = strFromU8(unzipSync(new Uint8Array(fs.readFileSync(output)))['ppt/slides/slide1.xml']);
        const cells = [...xml.matchAll(/<a:tcPr[^>]*>[\s\S]*?<\/a:tcPr>/g)].map(match => match[0]);
        expect(cells[0]).toMatch(/<a:lnB[^>]*><a:solidFill>/);
        expect(cells[1]).toMatch(/<a:lnB[^>]*><a:solidFill>/);
        expect(cells[0]).toContain('<a:lnR><a:noFill/></a:lnR>');
        expect(cells[1]).toContain('<a:lnL><a:noFill/></a:lnL>');
    } finally {
        await browser.close();
        fs.rmSync(directory, { recursive: true, force: true });
    }
}, 30000);
