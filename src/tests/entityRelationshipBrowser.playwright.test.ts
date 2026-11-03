import { build } from 'esbuild';
import { chromium, type Browser } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { buildEntityRelationshipScene } from '../diagram/adapters/er/entityRelationshipLayout';
import { renderEntityRelationshipHtmlDocument, renderEntityRelationshipSvg } from '../diagram/adapters/er/entityRelationshipSvg';
import { renderSemanticFigureSvg } from '../rendering/renderers/editableHtmlSvgRenderer';
import { buildSemanticFigureModel } from '../diagram/adapters/editableSvg/semanticFigureModel';
import { renderErMermaid } from '../diagram/adapters/mermaid/erAdapter';
import { renderClassMermaid } from '../diagram/adapters/mermaid/classAdapter';
import { renderSequenceMermaid } from '../diagram/adapters/mermaid/sequenceAdapter';
import { orderSchema } from './fixtures/entityRelationshipFixture';

describe('ER real browser semantics and geometry', () => {
    let browser: Browser;
    let mermaidBundle: string;
    const evidenceRoot = resolve(__dirname, '../../.cache/er-quality-evidence');
    beforeAll(async () => {
        mkdirSync(evidenceRoot, { recursive: true });
        mermaidBundle = (await build({ stdin: { contents: "export { default as mermaid } from 'mermaid';", resolveDir: resolve(__dirname, '../..'), loader: 'ts' }, bundle: true, write: false, format: 'iife', globalName: 'ErRuntime' })).outputFiles[0].text;
        browser = await chromium.launch({ headless: true });
    }, 60000);
    afterAll(async () => { await browser?.close(); }, 30000);

    test.each([
        ['er', renderErMermaid(orderSchema()), ['客户', '订单', 'customer_id', 'decimal(12,2)']],
        ['legacy-er', renderErMermaid({ intent: 'erDiagram', title: 'Legacy', nodes: [{ id: 'customer', label: '客户' }, { id: 'order', label: '订单' }], edges: [{ from: 'customer', to: 'order', label: 'places' }] }), ['客户', '订单']],
        ['class', renderClassMermaid({ intent: 'classDiagram', title: '领域', nodes: [{ id: 'customer', label: '客户' }, { id: 'order', label: '订单' }], edges: [{ from: 'customer', to: 'order', label: 'places' }] }), ['客户', '订单']],
        ['sequence', renderSequenceMermaid({ intent: 'sequence', title: 'Request', nodes: [{ id: 'api-gateway', label: 'Gateway A' }, { id: 'api_gateway', label: 'Gateway B' }], edges: [{ from: 'api-gateway', to: 'api_gateway', label: 'request' }] }), ['Gateway A', 'Gateway B']]
    ] as const)('parses and renders actual Mermaid %s, not its Jest mock', async (kind, content, expectedText) => {
        const page = await browser.newPage();
        try {
            await page.setContent('<main></main>');
            await page.addScriptTag({ content: mermaidBundle });
            const rendered = await page.evaluate(source => {
                const runtime = window as unknown as { ErRuntime: { mermaid: { initialize: (options: object) => void; render: (id: string, source: string) => Promise<{ svg: string }> } } };
                runtime.ErRuntime.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
                return runtime.ErRuntime.mermaid.render('actual-er', source.replace(/^.*?\n/, '').replace(/\n```[\s\S]*$/, '')).then(artifact => artifact.svg);
            }, content);
            for (const expected of expectedText) expect(rendered).toContain(expected);
            await page.locator('main').evaluate((element, svg) => { element.innerHTML = svg; }, rendered);
            if (kind === 'sequence') {
                expect(await page.locator('rect.actor-top').count()).toBe(2);
                expect(await page.locator('rect.actor-bottom').count()).toBe(2);
                expect(await page.locator('text.messageText').allTextContents()).toContain('request');
            }
            await page.screenshot({ path: resolve(evidenceRoot, 'mermaid-' + kind + '-engine.png'), fullPage: true });
        } finally { await page.close(); }
    }, 30000);

    test.each(['light', 'dark'] as const)('preserves all field text and fitting geometry in %s theme', async colorScheme => {
        const page = await browser.newPage({ viewport: { width: 1280, height: 780 }, colorScheme });
        try {
            const scene = buildEntityRelationshipScene(orderSchema());
            const html = renderEntityRelationshipHtmlDocument(scene);
            await page.setContent(html);
            const measurements = await page.evaluate(() => {
                const svg = document.querySelector('svg')!;
                const view = svg.viewBox.baseVal;
                const textOutsideCanvas = Array.from(svg.querySelectorAll('text')).filter(element => {
                    const box = element.getBBox();
                    return box.x < 0 || box.y < 0 || box.x + box.width > view.width || box.y + box.height > view.height;
                }).map(element => element.textContent);
                const fieldsOutsideEntity = Array.from(svg.querySelectorAll('[data-er-entity]')).flatMap(entity => {
                    const bounds = entity.querySelector('rect')!.getBBox();
                    return Array.from(entity.querySelectorAll('text')).filter(element => {
                        const box = element.getBBox();
                        return box.x < bounds.x || box.x + box.width > bounds.x + bounds.width || box.y < bounds.y || box.y + box.height > bounds.y + bounds.height;
                    }).map(element => element.textContent);
                });
                const summary = document.querySelector('summary')!;
                const summaryBox = summary.getBoundingClientRect();
                return { textOutsideCanvas, fieldsOutsideEntity, entityCount: svg.querySelectorAll('[data-er-entity]').length, fieldCount: svg.querySelectorAll('[data-er-attribute]').length,
                    selectableText: getComputedStyle(svg.querySelector('text')!).userSelect, summaryTarget: { width: summaryBox.width, height: summaryBox.height }, unknownInteractionP95: true };
            });
            expect(measurements.textOutsideCanvas).toEqual([]);
            expect(measurements.fieldsOutsideEntity).toEqual([]);
            expect(measurements.entityCount).toBe(2);
            expect(measurements.fieldCount).toBe(4);
            expect(measurements.selectableText).not.toBe('none');
            expect(measurements.summaryTarget.height).toBeGreaterThanOrEqual(44);
            await page.screenshot({ path: resolve(evidenceRoot, 'er-after-' + colorScheme + '.png'), fullPage: true });
            writeFileSync(resolve(evidenceRoot, 'measurements-' + colorScheme + '.json'), JSON.stringify(measurements, null, 2));
            if (colorScheme === 'light') writeFileSync(resolve(evidenceRoot, 'er-after.html'), html);
            await page.getByText('客户', { exact: true }).last().focus();
            await page.keyboard.press('Enter');
            expect(await page.locator('details').first().getAttribute('open')).not.toBeNull();
        } finally { await page.close(); }
    }, 30000);

    test('captures the previous generic-card layout for a like-for-like comparison', async () => {
        const typed = orderSchema();
        const payload = typed.payload!;
        if (payload.kind !== 'entity-relationship') throw new Error('ER fixture requires typed payload.');
        const legacy = { ...typed, payload: undefined, schemaVersion: undefined, nodes: payload.entities.map(entity => ({ id: entity.id, label: entity.label, children: entity.attributes.map((attribute, index) => ({ id: entity.id + '-field-' + index, label: attribute.name, kind: attribute.type })) })), edges: [{ from: 'customer', to: 'order', label: 'places' }] };
        const svg = renderSemanticFigureSvg(buildSemanticFigureModel(legacy));
        const page = await browser.newPage({ viewport: { width: 1280, height: 780 } });
        try {
            await page.setContent(svg);
            await page.screenshot({ path: resolve(evidenceRoot, 'er-before-generic.png'), fullPage: true });
            writeFileSync(resolve(evidenceRoot, 'er-after.svg'), renderEntityRelationshipSvg(buildEntityRelationshipScene(typed)));
        } finally { await page.close(); }
    }, 30000);
});
