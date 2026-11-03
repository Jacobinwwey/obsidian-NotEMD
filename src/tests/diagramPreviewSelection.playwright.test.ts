import { chromium, Browser } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('diagram preview metadata selection', () => {
    let browser: Browser;
    beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30000);
    afterAll(async () => { await browser?.close(); }, 30000);

    test('allows native drag selection of export receipts under the Obsidian nonselecting host', async () => {
        const page = await browser.newPage();
        try {
            await page.setContent('<style>body { user-select: none; -webkit-user-select: none; } p {font: 16px monospace}</style><div class="modal notemd-diagram-preview-modal"><p class="receipt">Export receipt architecture.zh-CN_diagram.drawnix</p><div class="notemd-diagram-zoom-viewport">Pan diagram</div></div>');
            await page.addStyleTag({ content: readFileSync(resolve(__dirname, '../../styles.css'), 'utf8') });
            const receipt = await page.locator('.receipt').boundingBox();
            await page.mouse.move(receipt!.x + 2, receipt!.y + receipt!.height / 2);
            await page.mouse.down();
            await page.mouse.move(receipt!.x + 430, receipt!.y + receipt!.height / 2, { steps: 12 });
            await page.mouse.up();
            expect(await page.evaluate(() => window.getSelection()?.toString())).toContain('Export receipt');
            expect(await page.locator('.notemd-diagram-zoom-viewport').evaluate(element => getComputedStyle(element).userSelect)).toBe('none');
        } finally { await page.close(); }
    }, 30000);
});
