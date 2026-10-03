import { build } from 'esbuild';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import { readFileSync } from 'fs';

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
                builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: "export class Scope { register(modifiers, key, callback) { this.escape = callback; } } export const getLanguage = () => 'en'; export function setIcon(element) { element.innerHTML = '<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\"><path d=\"M7 17 17 7M7 7h10v10\" fill=\"none\" stroke=\"currentColor\"/></svg>'; }" }));
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
            runtime.options = {
                app: { keymap: { pushScope: (scope: any) => { runtime.scope = scope; }, popScope: () => { runtime.scope = null; } } },
                typeParent: document.querySelector('#type'), outputParent: document.querySelector('#outputs'),
                getSettings: () => runtime.settings,
                saveSettings: () => { runtime.saves++; return runtime.persist?.() ?? Promise.resolve(); },
                onPreviewType: (typeId: string) => { runtime.previewType = typeId; }
            };
            runtime.control = runtime.DiagramSelection.renderDiagramOutputSelector(runtime.options);
        });
    });

    test('collapses output choices until the compact trigger is opened', async () => {
        expect(await page.locator('[data-diagram-output="svg"]').isVisible()).toBe(false);
        await page.locator('[data-diagram-output-trigger]').click();
        expect(await page.locator('[data-diagram-output="svg"]').isVisible()).toBe(true);
        expect(await page.locator('[data-diagram-output-trigger]').getAttribute('aria-expanded')).toBe('true');
        expect(await page.locator('.notemd-diagram-output-choice small').count()).toBe(0);
    });

    test.each([320, 900])('keeps the live preview visible while scrolling chart choices at %ipx and restores it on close', async width => {
        await page.setViewportSize({ width, height: 600 });
        await page.addStyleTag({ content: readFileSync(path.join(__dirname, '../../styles.css'), 'utf8') });
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.control.destroy();
            const host = document.createElement('section'); host.id = 'preview-home';
            const preview = document.createElement('div'); preview.className = 'notemd-diagram-type-preview-panel';
            preview.innerHTML = '<h4 class="notemd-diagram-type-preview-title">Preview</h4><div class="notemd-diagram-type-preview-canvas"><svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#e5e7eb"/></svg></div>';
            host.appendChild(preview); document.body.appendChild(host);
            runtime.control = runtime.DiagramSelection.renderDiagramOutputSelector({ ...runtime.options, getPreviewElement: () => preview });
        });
        await page.locator('[data-diagram-type-trigger]').click();
        await page.locator('[data-diagram-type-check="nested"]').focus();
        const popup = await page.locator('[data-diagram-type-popup]').boundingBox();
        const preview = await page.locator('[data-diagram-type-popup] .notemd-diagram-type-preview-panel').boundingBox();
        expect(preview!.y).toBeGreaterThanOrEqual(popup!.y);
        expect(preview!.y + preview!.height).toBeLessThanOrEqual(popup!.y + popup!.height + 1);
        expect(popup!.x + popup!.width).toBeLessThanOrEqual(width - 8);
        expect(await page.locator('[data-diagram-type-popup]').evaluate(el => el.scrollTop)).toBe(0);
        await page.keyboard.press('Escape');
        expect(await page.locator('#preview-home > .notemd-diagram-type-preview-panel').count()).toBe(1);
        await page.locator('[data-diagram-type-trigger]').click();
        await page.evaluate(() => (window as any).control.destroy());
        expect(await page.locator('#preview-home > .notemd-diagram-type-preview-panel').count()).toBe(1);
    });

    test('closes with Escape or outside focus and releases popup on destroy', async () => {
        const trigger = page.locator('[data-diagram-output-trigger]');
        await trigger.click();
        await page.keyboard.press('Escape');
        expect(await trigger.evaluate(element => element === document.activeElement)).toBe(true);
        expect(await trigger.getAttribute('aria-expanded')).toBe('false');
        await trigger.click();
        await page.locator('#outside').focus();
        expect(await trigger.getAttribute('aria-expanded')).toBe('false');
        expect(await page.locator('#outside').evaluate(element => element === document.activeElement)).toBe(true);
        await trigger.click();
        await page.evaluate(() => (window as any).control.destroy());
        expect(await page.locator('[data-diagram-output-popup]').count()).toBe(0);
    });

    test('owns the host Escape scope only while its popup is open', async () => {
        await page.locator('[data-diagram-output-trigger]').click();
        expect(await page.evaluate(() => typeof (window as any).scope?.escape)).toBe('function');
        await page.evaluate(() => (window as any).scope.escape());
        expect(await page.locator('[data-diagram-output-trigger]').getAttribute('aria-expanded')).toBe('false');
        expect(await page.evaluate(() => (window as any).scope)).toBe(null);
    });

    test('fits a narrow viewport and keeps native tab order after portal dismissal', async () => {
        await page.setViewportSize({ width: 320, height: 480 });
        await page.addStyleTag({ content: readFileSync(path.join(__dirname, '../../styles.css'), 'utf8') });
        await page.locator('[data-diagram-output-trigger]').click();
        const popup = await page.locator('[data-diagram-output-popup]').boundingBox();
        expect(popup!.x).toBeGreaterThanOrEqual(8);
        expect(popup!.x + popup!.width).toBeLessThanOrEqual(312);
        expect(popup!.y + popup!.height).toBeLessThanOrEqual(480);
        await page.keyboard.press('Tab');
        expect(await page.locator('#outside').evaluate(el => el === document.activeElement)).toBe(true);
        expect(await page.locator('[data-diagram-output-trigger]').getAttribute('aria-expanded')).toBe('false');
    });

    test('orders supported choices first while keeping every incompatible choice visible', async () => {
        await page.locator('[data-diagram-output-trigger]').click();
        const states = await page.locator('[data-diagram-output-state]').evaluateAll(elements => elements.map(element => element.getAttribute('data-diagram-output-state')));
        expect(states[0]).toBe('supported');
        expect(states.indexOf('unsupported')).toBeGreaterThan(0);
        expect(await page.locator('input[data-diagram-output="source:drawnix"]').count()).toBe(1);
        expect(await page.locator('input[data-diagram-output="source:drawnix"]').isEnabled()).toBe(false);
    });

    test('selects multiple types and edits their formats independently', async () => {
        await page.locator('[data-diagram-type-trigger]').click();
        await page.locator('[data-diagram-type-check="drawnix-knowledge-map"]').check();
        await page.locator('[data-diagram-type-edit="drawnix-knowledge-map"]').click();
        await page.locator('[data-diagram-output="pdf"]').check();
        expect(await page.locator('[data-diagram-output="source:drawnix"]').isChecked()).toBe(true);
        await page.locator('[data-diagram-type-trigger]').click();
        expect(await page.locator('[data-diagram-type-check="nested"]').isChecked()).toBe(true);
        await page.locator('[data-diagram-type-edit="nested"]').click();
        expect(await page.locator('[data-diagram-output="pdf"]').isChecked()).toBe(false);
        expect(await page.locator('[data-diagram-output="html-diagram"]').isChecked()).toBe(true);
        expect(await page.locator('[data-diagram-output="source:drawnix"]').isEnabled()).toBe(false);
    });

    test('hover and keyboard focus preview without saving; closing restores the editing type', async () => {
        await page.locator('[data-diagram-type-trigger]').click();
        await page.locator('[data-diagram-type-edit="flowchart"]').hover();
        expect(await page.evaluate(() => (window as any).previewType)).toBe('flowchart');
        await page.locator('[data-diagram-type-check="drawnix-knowledge-map"]').focus();
        expect(await page.evaluate(() => (window as any).previewType)).toBe('drawnix-knowledge-map');
        expect(await page.evaluate(() => (window as any).saves)).toBe(0);
        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => (window as any).previewType)).toBe('nested');
        expect(await page.locator('[data-diagram-type-trigger]').evaluate(el => el === document.activeElement)).toBe(true);
    });

    test('keeps keyboard focus on the changed output after sorting and never steals it after saving', async () => {
        await page.locator('[data-diagram-output-trigger]').click();
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
        await page.locator('[data-diagram-output-trigger]').click();
        const unknown = page.locator('input[data-diagram-output="future-format"]');
        expect(await unknown.isChecked()).toBe(true);
        expect(await unknown.isEnabled()).toBe(true);
        await unknown.click();
        expect(await unknown.count()).toBe(0);
    });

    test('edits the current settings object after a command has reloaded settings', async () => {
        await page.locator('[data-diagram-output-trigger]').click();
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.oldSettings = runtime.settings;
            runtime.settings = structuredClone(runtime.settings);
        });
        await page.locator('input[data-diagram-output="pdf"]').check();
        expect(await page.evaluate(() => (window as any).settings.diagramTypeOutputPreferences.outputsByType.nested)).toContain('pdf');
        expect(await page.evaluate(() => (window as any).oldSettings.diagramTypeOutputPreferences)).toBeUndefined();
    });

    test('serializes rapid changes and persists the latest selection after a failed save', async () => {
        await page.locator('[data-diagram-output-trigger]').click();
        await page.evaluate(() => {
            const runtime = window as any;
            runtime.activeSaves = 0;
            runtime.maxActiveSaves = 0;
            runtime.persist = () => {
                runtime.activeSaves++;
                runtime.maxActiveSaves = Math.max(runtime.maxActiveSaves, runtime.activeSaves);
                const snapshot = structuredClone(runtime.settings.diagramTypeOutputPreferences);
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
        expect(await page.evaluate(() => (window as any).persisted.outputsByType.nested)).toEqual(['html-diagram', 'svg', 'png']);
    });
});
