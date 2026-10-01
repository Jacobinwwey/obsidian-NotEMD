import { build } from 'esbuild';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';

describe('diagram history keyboard interaction', () => {
    let browser: Browser;
    let page: Page;
    let bundle: string;

    beforeAll(async () => {
        const compiled = await build({
            stdin: {
                contents: "import { DiagramHistoryDrawer } from './src/ui/DiagramHistoryDrawer'; window.NotemdHistoryDrawer = DiagramHistoryDrawer;",
                resolveDir: path.join(__dirname, '../..'), loader: 'ts'
            },
            bundle: true, write: false, format: 'iife', platform: 'browser',
            plugins: [{
                name: 'obsidian-host-boundary',
                setup(builder) {
                    builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'host' }));
                    builder.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ contents: `
                        export const getLanguage = () => 'en';
                        export class Notice {}
                        export class Scope {
                            bindings = [];
                            register(modifiers, key, callback) { this.bindings.push({ key, callback }); }
                        }
                    ` }));
                }
            }]
        });
        bundle = compiled.outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    }, 30000);

    afterAll(async () => { await browser?.close(); });
    afterEach(async () => { await page?.close(); });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setContent('<main id="preview"><button id="trigger">History</button><button id="behind">Preview export</button></main><button id="after">Outside preview</button>');
        // Adapt the real DOM to Obsidian's element-creation API. The production
        // drawer, asynchronous view and browser keyboard behavior remain real.
        await page.evaluate(() => {
            const prototype = HTMLElement.prototype as any;
            prototype.createEl = function (tag: string, options: any = {}) {
                const child = document.createElement(tag);
                if (options.cls) child.className = options.cls;
                if (options.text) child.textContent = options.text;
                for (const [name, value] of Object.entries(options.attr || {})) child.setAttribute(name, String(value));
                for (const name of ['type', 'placeholder', 'value']) if (options[name] !== undefined) (child as any)[name] = options[name];
                this.appendChild(child);
                return child;
            };
            prototype.createDiv = function (options: any) { return this.createEl('div', options); };
            prototype.createSpan = function (options: any) { return this.createEl('span', options); };
            prototype.empty = function () { this.replaceChildren(); };
            prototype.setText = function (text: string) { this.textContent = text; };
        });
        await page.addScriptTag({ content: bundle });
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.historyRequests = [];
            runtime.parentEscapes = 0;
            runtime.scopes = [];
            runtime.app = { keymap: {
                pushScope: (scope: unknown) => runtime.scopes.push(scope),
                popScope: (scope: unknown) => { runtime.scopes = runtime.scopes.filter((entry: unknown) => entry !== scope); },
            } };
            const host = document.querySelector('#preview')!;
            host.addEventListener('keydown', event => {
                if ((event as KeyboardEvent).key === 'Escape') runtime.parentEscapes++;
            });
            const store = {
                loadPage: (query: unknown) => new Promise((resolve, reject) => runtime.historyRequests.push({ query, resolve, reject })),
                removeEntry: async () => undefined,
            };
            runtime.drawer = new runtime.NotemdHistoryDrawer(host, { app: runtime.app, store, uiLocale: 'en' });
            const trigger = document.querySelector('#trigger') as HTMLButtonElement;
            trigger.focus();
            runtime.drawer.open(trigger);
        });
    });

    async function resolveLatestPage(): Promise<void> {
        await page.evaluate(() => {
            const requests = (window as any).historyRequests;
            requests[requests.length - 1].resolve({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        });
        await page.locator('[data-notemd-history-search]').waitFor();
    }

    test('focus enters the drawer while the history request is still pending', async () => {
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.notemd-diagram-history-drawer')))).toBe(true);
        await resolveLatestPage();
        expect(await page.locator('[data-notemd-history-search]').evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('Tab and Shift+Tab stay inside the drawer and skip disabled controls', async () => {
        await resolveLatestPage();
        await page.locator('.notemd-diagram-history-drawer-close').focus();
        await page.keyboard.press('Shift+Tab');
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.notemd-diagram-history-drawer')))).toBe(true);
        expect(await page.evaluate(() => document.activeElement?.classList.contains('notemd-diagram-history-drawer-close'))).toBe(false);
        await page.keyboard.press('Tab');
        expect(await page.locator('.notemd-diagram-history-drawer-close').evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('Escape closes only the drawer and restores the trigger', async () => {
        await resolveLatestPage();
        await page.locator('[data-notemd-history-search]').focus();
        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => (window as any).parentEscapes)).toBe(0);
        expect(await page.locator('.notemd-diagram-history-drawer').count()).toBe(0);
        expect(await page.locator('#trigger').evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('host capture handles drawer Escape before the modal and releases keyboard ownership', async () => {
        await resolveLatestPage();
        await page.evaluate(() => {
            const runtime = window as any;
            // Obsidian resolves the active scope before the drawer's DOM listener.
            document.addEventListener('keydown', event => {
                if (event.key !== 'Escape') return;
                const binding = runtime.scopes.at(-1)?.bindings.find((entry: any) => entry.key === 'Escape');
                if (binding) binding.callback(event);
                else document.querySelector('#preview')?.remove();
                event.preventDefault();
                event.stopImmediatePropagation();
            }, true);
        });
        await page.keyboard.press('Escape');
        expect(await page.locator('#preview').count()).toBe(1);
        expect(await page.locator('.notemd-diagram-history-drawer').count()).toBe(0);
        expect(await page.locator('#trigger').evaluate(element => element === document.activeElement)).toBe(true);
        expect(await page.evaluate(() => (window as any).scopes.length)).toBe(0);
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.drawer.open(document.querySelector('#trigger'));
            runtime.drawer.open(document.querySelector('#trigger'));
        });
        expect(await page.evaluate(() => (window as any).scopes.length)).toBe(1);
        await page.evaluate(() => { (window as any).drawer.destroy(); (window as any).drawer.destroy(); });
        expect(await page.evaluate(() => (window as any).scopes.length)).toBe(0);
        await page.keyboard.press('Escape');
        expect(await page.locator('#preview').count()).toBe(0);
    });

    test('search accepts consecutive keystrokes while requests are pending and preserves caret on refresh', async () => {
        await resolveLatestPage();
        const search = page.locator('[data-notemd-history-search]');
        await search.focus();
        await page.keyboard.type('abc');
        expect(await page.evaluate(() => (window as any).historyRequests.at(-1).query.search)).toBe('abc');
        await resolveLatestPage();
        expect(await search.inputValue()).toBe('abc');
        expect(await search.evaluate(element => element === document.activeElement)).toBe(true);
        expect(await search.evaluate(element => (element as HTMLInputElement).selectionStart)).toBe(3);
    });

    test('a late history response cannot restore focus after the drawer is closed', async () => {
        await page.evaluate(() => (window as any).drawer.close());
        await page.evaluate(() => (window as any).historyRequests[0].resolve({ items: [], page: 1, totalPages: 1, totalItems: 0 }));
        expect(await page.locator('.notemd-diagram-history-drawer').count()).toBe(0);
        expect(await page.locator('#trigger').evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('loading completion respects an explicit focus move to the close button', async () => {
        const close = page.locator('.notemd-diagram-history-drawer-close');
        await close.focus();
        await resolveLatestPage();
        expect(await close.evaluate(element => element === document.activeElement)).toBe(true);
    });

    test.each([
        ['filter', 'select[data-notemd-history-filter]'],
        ['filter toggle', '[data-notemd-history-filters-toggle]'],
    ])('a pending refresh preserves another drawer\'s %s focus', async (_control, selector) => {
        await resolveLatestPage();
        await page.locator('#preview [data-notemd-history-filters-toggle]').click();
        await resolveLatestPage();
        await page.locator('#preview [data-notemd-history-search]').fill('pending');

        await page.evaluate(() => {
            const runtime = window as any;
            const host = document.createElement('main');
            host.id = 'second-preview';
            document.body.appendChild(host);
            runtime.secondHistoryRequests = [];
            const store = {
                loadPage: (query: unknown) => new Promise(resolve => runtime.secondHistoryRequests.push({ query, resolve })),
                removeEntry: async () => undefined,
            };
            runtime.secondDrawer = new runtime.NotemdHistoryDrawer(host, { app: runtime.app, store, uiLocale: 'en' });
            runtime.secondDrawer.open();
            runtime.secondHistoryRequests.at(-1).resolve({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        });
        await page.locator('#second-preview [data-notemd-history-filters-toggle]').click();
        await page.evaluate(() => {
            (window as any).secondHistoryRequests.at(-1).resolve({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        });
        await page.locator('#second-preview select[data-notemd-history-filter]').first().waitFor();
        const otherControl = page.locator(`#second-preview ${selector}`).first();
        await otherControl.focus();
        expect(await otherControl.evaluate(element => element === document.activeElement)).toBe(true);

        await page.evaluate(() => {
            (window as any).historyRequests.at(-1).resolve({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        });
        await page.locator('#preview .notemd-diagram-history-drawer-body[aria-busy="false"]').waitFor();
        expect(await otherControl.evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('a failed search keeps keyboard focus on the retry action', async () => {
        await resolveLatestPage();
        await page.locator('[data-notemd-history-search]').focus();
        await page.keyboard.type('nmos');
        await page.evaluate(() => (window as any).historyRequests.at(-1).reject(new Error('Vault read failed')));
        const retry = page.locator('[data-notemd-history-retry]');
        await retry.waitFor();
        expect(await retry.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Enter');
        await resolveLatestPage();
        expect(await page.locator('[data-notemd-history-search]').inputValue()).toBe('nmos');
    });

    test('filter refresh retains its control and ignores older search responses', async () => {
        await resolveLatestPage();
        await page.locator('[data-notemd-history-filters-toggle]').click();
        await resolveLatestPage();
        const filter = page.locator('select[data-notemd-history-filter]').first();
        await filter.focus();
        await filter.selectOption('circuit');
        await resolveLatestPage();
        expect(await filter.evaluate(element => element === document.activeElement)).toBe(true);
        const search = page.locator('[data-notemd-history-search]');
        await search.focus();
        await page.keyboard.type('ab');
        await page.evaluate(() => {
            const requests = (window as any).historyRequests;
            requests[requests.length - 2].resolve({ items: [], page: 1, totalPages: 1, totalItems: 99 });
        });
        expect(await search.inputValue()).toBe('ab');
        expect(await page.locator('.notemd-diagram-history-count').textContent()).not.toContain('99');
        await resolveLatestPage();
        expect(await search.evaluate(element => element === document.activeElement)).toBe(true);
    });
});
