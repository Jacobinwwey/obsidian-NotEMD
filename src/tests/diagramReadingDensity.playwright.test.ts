import { chromium, type Browser } from 'playwright';
import { createRequire } from 'module';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
import type { DiagramSpec } from '../diagram/types';
const { getDiagramAcceptanceCases } = createRequire(__filename)('../../scripts/lib/diagram-acceptance-cases');

describe('reading-first source recovery geometry', () => {
    let browser: Browser;
    beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30000);
    afterAll(async () => { await browser?.close(); }, 30000);

    test.each(['tree-cycle', 'lane-handoff'])('%s retains visible facts without text clipping at desktop/mobile sizes', async id => {
        const spec = getDiagramAcceptanceCases().find((entry: { id: string }) => entry.id === id).afterSpec as DiagramSpec;
        const svg = renderReferenceLayoutSvg(spec);
        const page = await browser.newPage();
        try {
            await page.setContent('<style>body{margin:0}svg{width:100%;height:auto;display:block}</style>' + svg);
            for (const width of [1200, 390]) {
                await page.setViewportSize({ width, height: 900 });
                const geometry = await page.evaluate(() => {
                    const root = document.querySelector('svg')!;
                    const canvas = root.viewBox.baseVal;
                    const outsideText = Array.from(root.querySelectorAll('text')).filter(text => {
                        const box = text.getBBox();
                        return box.x < 0 || box.y < 0 || box.x + box.width > canvas.width + 1 || box.y + box.height > canvas.height + 1;
                    }).map(text => text.textContent);
                    const outsideCells = Array.from(root.querySelectorAll('[id^=reference-cell-]')).flatMap(cell => {
                        const bounds = cell.querySelector('rect')!.getBBox();
                        return Array.from(cell.querySelectorAll('text')).filter(text => {
                            const box = text.getBBox();
                            return box.x < bounds.x || box.y < bounds.y || box.x + box.width > bounds.x + bounds.width + 1 || box.y + box.height > bounds.y + bounds.height + 1;
                        }).map(text => text.textContent);
                    });
                    return { outsideText, outsideCells, text: root.textContent, selectable: getComputedStyle(root.querySelector('text')!).userSelect, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
                });
                expect(geometry.outsideText).toEqual([]);
                expect(geometry.outsideCells).toEqual([]);
                expect(geometry.selectable).not.toBe('none');
                expect(geometry.overflow).toBe(false);
                for (const label of id === 'tree-cycle' ? ['Root', 'First', 'Second'] : ['Create', 'submit', 'Not provided']) expect(geometry.text).toContain(label);
            }
        } finally { await page.close(); }
    }, 30000);

    test('content-sized lane rows retain richer cells without overlapping their chips', async () => {
        const spec = getDiagramAcceptanceCases().find((entry: { id: string }) => entry.id === 'lane-handoff').afterSpec as DiagramSpec;
        const rich = JSON.parse(JSON.stringify(spec)) as DiagramSpec;
        if (rich.payload?.kind !== 'lane-grid') throw new Error('Lane fixture required');
        Object.assign(rich.payload.cells[0], { title: 'Prepare release', sub: 'QA', tool: 'Git', chips: { in: '1', out: '2' } });
        const page = await browser.newPage();
        try {
            await page.setContent(renderReferenceLayoutSvg(rich));
            const textBounds = await page.locator('[id^=reference-cell-]').first().evaluate(cell => {
                const bounds = cell.querySelector('rect')!.getBBox();
                return Array.from(cell.querySelectorAll('text')).map(text => { const box = text.getBBox(); return { text: text.textContent, inside: box.y >= bounds.y && box.y + box.height <= bounds.y + bounds.height }; });
            });
            expect(textBounds.every(text => text.inside)).toBe(true);
            expect(textBounds.map(text => text.text).join(' ')).toContain('QA');
            expect(textBounds.map(text => text.text).join(' ')).toContain('Git');
            expect(textBounds.map(text => text.text)).toEqual(expect.arrayContaining(['1', '2']));
        } finally { await page.close(); }
    }, 30000);
});
