import { createRequire } from 'module';
import { chromium, Browser, Page } from 'playwright';

const requireScript = createRequire(__filename);
const { followHomepageGuideByKeyboard } = requireScript('../../website/scripts/audit-navigation.cjs');
const homepageUrl = 'http://navigation.test/';

describe('website homepage keyboard navigation gate', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30000);
    afterAll(async () => { await browser?.close(); });
    afterEach(async () => { await page?.close(); });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.route('http://navigation.test/**', route => route.fulfill({
            contentType: 'text/html',
            body: new URL(route.request().url()).pathname === '/guide'
                ? '<article><h1>Guide</h1></article>'
                : '<style>a:focus-visible { outline: 2px solid blue; }</style><button id="first">First</button><button id="second">Second</button><main><a href="/guide">Guide</a></main>'
        }));
        await page.goto(homepageUrl);
    });

    test('follows the guide using the actual Tab order and keyboard Enter', async () => {
        await page.evaluate(() => {
            let tabCount = 0;
            document.addEventListener('keydown', event => {
                if (event.key === 'Tab') tabCount++;
                if (event.key === 'Enter') sessionStorage.setItem('tabsBeforeEnter', String(tabCount));
            });
        });

        const focusStyle = await followHomepageGuideByKeyboard(page, '/guide');

        expect(new URL(page.url()).pathname).toBe('/guide');
        expect(await page.evaluate(() => sessionStorage.getItem('tabsBeforeEnter'))).toBe('3');
        expect(focusStyle).toMatchObject({ focused: true, tabIndex: 0, outline: 'solid', outlineWidth: '2px' });
    });

    test('rejects a page that prevents Tab even when its link can be focused programmatically', async () => {
        await page.evaluate(() => {
            document.addEventListener('keydown', event => {
                if (event.key === 'Tab') event.preventDefault();
            });
        });

        await expect(followHomepageGuideByKeyboard(page, '/guide')).rejects.toThrow(/Tab.*loop/);
        expect(page.url()).toBe(homepageUrl);
    });

    test('rejects a repeating focus cycle before the guide', async () => {
        await page.evaluate(() => {
            document.addEventListener('keydown', event => {
                if (event.key === 'Tab' && document.activeElement?.id === 'second') {
                    event.preventDefault();
                    document.getElementById('first')!.focus();
                }
            });
        });

        await expect(followHomepageGuideByKeyboard(page, '/guide')).rejects.toThrow(/Tab.*loop/);
        expect(page.url()).toBe(homepageUrl);
    });

    test('bounds traversal when a page keeps adding new focus targets', async () => {
        await page.evaluate(() => {
            document.addEventListener('keydown', event => {
                if (event.key !== 'Tab') return;
                event.preventDefault();
                const button = document.createElement('button');
                button.textContent = 'Another focus target';
                document.body.appendChild(button);
                button.focus();
            });
        });

        await expect(followHomepageGuideByKeyboard(page, '/guide')).rejects.toThrow(/Tab.*limit/);
        expect(page.url()).toBe(homepageUrl);
    }, 15000);
});
