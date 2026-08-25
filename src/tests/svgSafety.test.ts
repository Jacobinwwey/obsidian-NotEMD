import {
    applySvgSafetyContract,
    assertSvgSafetyContract,
    collectSvgPresentationDiagnostics,
    assertSvgPresentationSafety
} from '../rendering/preview/svgSafety';

describe('runtime SVG safety contract', () => {
    test('adds a versioned runtime marker to a drawable SVG', () => {
        const result = applySvgSafetyContract('<svg viewBox="0 0 100 100"><rect /></svg>', 'runtime');
        expect(result.diagnostics).toEqual([]);
        expect(result.svg).toContain('data-layout-safety="notemd-layout-safety@1.0.0"');
        expect(result.svg).toContain('data-layout-safety-owner="runtime"');
    });

    test('rejects malformed or dimensionless runtime output', () => {
        expect(() => assertSvgSafetyContract('<div>broken</div>', 'Mermaid')).toThrow(/malformed SVG/i);
        expect(() => assertSvgSafetyContract('<svg><rect /></svg>', 'Vega-Lite')).toThrow(/positive viewBox/i);
    });

    test('detects mounted runtime label overlap and later-shape occlusion', () => {
        const text = (content: string, rect: { x: number; y: number; width: number; height: number }) => ({
            textContent: content,
            getBoundingClientRect: () => rect,
            closest: () => null,
            contains: () => false,
            compareDocumentPosition: () => 4
        });
        const shape = {
            tagName: 'rect',
            classList: { contains: () => false },
            getBoundingClientRect: () => ({ x: 10, y: 10, width: 80, height: 60 }),
            contains: () => false,
            compareDocumentPosition: () => 2
        };
        const first = text('First', { x: 20, y: 20, width: 30, height: 12 });
        const second = text('Second', { x: 20, y: 20, width: 40, height: 12 });
        const root = { querySelector: (selector: string) => selector === 'svg' ? {
            querySelectorAll: (query: string) => query === 'text' ? [first, second] : query.includes('rect') ? [shape] : []
        } : null } as unknown as ParentNode;
        const diagnostics = collectSvgPresentationDiagnostics(root);
        expect(diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'svg-text-overlap' }),
            expect.objectContaining({ kind: 'svg-text-occluded' })
        ]));
        expect(() => assertSvgPresentationSafety(root, 'Runtime')).toThrow(/presentation safety/i);
    });
});
