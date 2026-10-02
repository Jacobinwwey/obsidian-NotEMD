import { build } from 'esbuild';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';

describe('diagram output selection in a real DOM', () => {
    let browser: Browser;
    let page: Page;
    let bundle: string;
    beforeAll(async () => {
        const compiled = await build({
            stdin: { contents: "export { renderDiagramOutputSelector } from './src/ui/diagramOutputSelector';", resolveDir: path.join(__dirname, '../..'), loader: 'ts' },
            bundle: true, write: false, format: 'iife', globalName: 'DiagramSelection', platform: 'browser',
            plugins: [{ name: 'obsidian', setup(builder) {
                builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'mock' }));
                builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: "export const getLanguage = () => 'en';" }));
            } }]
        });
        bundle = compiled.outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    }, 30000);
    afterAll(async () => { await browser?.close(); });
    afterEach(async () => { await page?.close(); });
    beforeEach(async () => {
        page = await browser.newPage();
        await page.setContent('<div id="type"></div><div id="outputs"></div><button id="outside">Outside</button>');
        await page.evaluate(() => {
            const prototype = HTMLElement.prototype as any;
            prototype.createEl = function(tag: string, options: any = {}) {
                const element = document.createElement(tag);
                if (options.text) element.textContent = options.text;
                if (options.cls) element.className = options.cls;
                for (const [name, value] of Object.entries(options.attr ?? {})) element.setAttribute(name, String(value));
                for (const name of ['value', 'type']) if (options[name] !== undefined) (element as any)[name] = options[name];
                this.appendChild(element);
                return element;
            };
            prototype.createDiv = function(options: any) { return this.createEl('div', options); };
            prototype.empty = function() { this.replaceChildren(); };
            prototype.setText = function(text: string) { this.textContent = text; };
            prototype.addClass = function(name: string) { this.classList.add(name); };
        });
        await page.addScriptTag({ content: bundle });
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.settings = { uiLocale: 'en', experimentalDiagramCompatibilityMode: 'best-fit', preferredDiagramTypeId: 'nested', preferredDiagramIntent: 'nested', preferredDiagramRenderTarget: 'editable-html-svg' };
            runtime.saves = 0;
            runtime.control = runtime.DiagramSelection.renderDiagramOutputSelector({
                typeParent: document.querySelector('#type'), outputParent: document.querySelector('#outputs'),
                getSettings: () => runtime.settings,
                saveSettings: () => { runtime.saves++; return runtime.persist?.() ?? Promise.resolve(); },
                onTypeChanged: () => undefined
            });
        });
    });

    test('orders supported choices first while keeping every incompatible choice visible', async () => {
        const states = await page.locator('[data-diagram-output-state]').evaluateAll(elements => elements.map(element => element.getAttribute('data-diagram-output-state')));
        expect(states[0]).toBe('supported');
        expect(states.indexOf('adjustable')).toBeGreaterThan(0);
        expect(await page.locator('input[data-diagram-output="source:drawnix"]').count()).toBe(1);
        expect(await page.locator('input[data-diagram-output="source:drawnix"]').isEnabled()).toBe(true);
    });

    test('coordinates both directions without resetting or losing selected requests', async () => {
        await page.locator('input[data-diagram-output="source:drawnix"]').check();
        expect(await page.locator('[data-diagram-type]').inputValue()).toBe('drawnixMindmap');
        await page.locator('[data-diagram-type]').selectOption('nested');
        expect(await page.locator('input[data-diagram-output="source:drawnix"]').isChecked()).toBe(true);
        expect(await page.locator('[data-diagram-output-summary]').innerText()).toContain('Drawnix');
        await page.locator('[data-diagram-promote-output="source:drawnix"]').click();
        expect(await page.locator('[data-diagram-type]').inputValue()).toBe('drawnixMindmap');
    });

    test('keeps keyboard focus on the changed output after sorting and never steals it after saving', async () => {
        const svg = page.locator('input[data-diagram-output="svg"]');
        await svg.focus();
        await page.keyboard.press('Space');
        expect(await svg.evaluate(element => element === document.activeElement)).toBe(true);
        await page.locator('#outside').focus();
        await page.waitForTimeout(40);
        expect(await page.locator('#outside').evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('keeps unknown selected outputs visible and removable', async () => {
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.settings.diagramOutputPreferences = { version: 1, requestedOutputs: ['future-format', 'svg'] };
            runtime.control.refresh();
        });
        const unknown = page.locator('input[data-diagram-output="future-format"]');
        expect(await unknown.isChecked()).toBe(true);
        expect(await unknown.isEnabled()).toBe(true);
        await unknown.click();
        expect(await unknown.count()).toBe(0);
    });

    test('edits the current settings object after a command has reloaded settings', async () => {
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.oldSettings = runtime.settings;
            runtime.settings = structuredClone(runtime.settings);
        });
        await page.locator('input[data-diagram-output="source:drawnix"]').check();
        expect(await page.evaluate(() => (window as any).settings.preferredDiagramTypeId)).toBe('drawnix-knowledge-map');
        expect(await page.evaluate(() => (window as any).oldSettings.preferredDiagramTypeId)).toBe('nested');
    });

    test('serializes rapid changes and persists the latest selection after a failed save', async () => {
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.activeSaves = 0;
            runtime.maxActiveSaves = 0;
            runtime.persist = () => {
                runtime.activeSaves++;
                runtime.maxActiveSaves = Math.max(runtime.maxActiveSaves, runtime.activeSaves);
                const snapshot = structuredClone(runtime.settings.diagramOutputPreferences);
                return new Promise<void>((resolve, reject) => {
                    runtime.finishSave = (fail: boolean) => {
                        runtime.activeSaves--;
                        if (fail) reject(new Error('disk temporarily unavailable'));
                        else { runtime.persisted = snapshot; resolve(); }
                    };
                });
            };
        });
        await page.locator('input[data-diagram-output="svg"]').check();
        await page.waitForFunction(() => (window as any).saves === 1, undefined, { timeout: 1500 });
        await page.locator('input[data-diagram-output="png"]').check();
        expect(await page.evaluate(() => (window as any).saves)).toBe(1);
        await page.evaluate(() => (window as any).finishSave(true));
        await page.waitForFunction(() => (window as any).saves === 2, undefined, { timeout: 1500 });
        expect(await page.locator('.notemd-diagram-output-error').innerText()).toContain('disk temporarily unavailable');
        await page.evaluate(() => (window as any).finishSave(false));
        await page.waitForFunction(() => document.querySelector('.notemd-diagram-output-error')?.textContent === '', undefined, { timeout: 1500 });
        expect(await page.evaluate(() => (window as any).maxActiveSaves)).toBe(1);
        expect(await page.evaluate(() => (window as any).persisted.requestedOutputs)).toEqual(['html-diagram', 'svg', 'png']);
    });
});
