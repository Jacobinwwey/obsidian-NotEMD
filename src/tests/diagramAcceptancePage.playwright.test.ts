import { chromium, type Browser } from 'playwright';
import { createRequire } from 'module';
const { renderDiagramAcceptancePage } = createRequire(__filename)('../../scripts/lib/diagram-acceptance-page');

describe('offline acceptance comparison interactions', () => {
    let browser: Browser;
    beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30000);
    afterAll(async () => { await browser?.close(); }, 30000);

    test.each([1440, 390])('fits %spx and restores focus after keyboard native-size viewing', async width => {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const specimen = { png: 'er/before.png', svg: 'er/before.svg', source: 'er/before.json', sha256: 'b'.repeat(64), kind: 'diagram', width: 960, height: 540 };
        const html = renderDiagramAcceptancePage({ baselineCommit: 'a'.repeat(40), generatedAt: '2026-10-18', cases: [{ id: 'er', title: 'ER / 实体关系', explanation: 'Actual comparison', comparison: 'identical-input', before: specimen, after: { ...specimen, png: 'er/after.png' }, measurements: {} }] });
        const pageErrors: string[] = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        try {
            await page.route('http://acceptance.test/**', route => route.request().url().endsWith('.png')
                ? route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCFsAAAAASUVORK5CYII=', 'base64') })
                : route.fulfill({ contentType: 'text/html', body: html }));
            await page.goto('http://acceptance.test/index.html');
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
            const opener = page.locator('.image-open').first();
            expect((await opener.boundingBox())!.height).toBeGreaterThanOrEqual(44);
            for (const link of await page.locator('.asset-links a').all()) {
                const box = (await link.boundingBox())!;
                expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
            }
            await opener.focus(); await page.keyboard.press('Enter');
            expect(await page.locator('dialog').evaluate(element => (element as HTMLDialogElement).open)).toBe(true);
            await page.locator('#viewer-native').click();
            expect(await page.locator('.viewer-scroll img').evaluate(element => getComputedStyle(element).maxWidth)).toBe('none');
            await page.locator('#viewer-fit').click();
            expect(await page.locator('.viewer-scroll').getAttribute('class')).not.toContain('native');
            await page.keyboard.press('Escape');
            expect(await opener.evaluate(element => element === document.activeElement)).toBe(true);
            expect(pageErrors).toEqual([]);
        } finally { await page.close(); }
    }, 30000);
});
