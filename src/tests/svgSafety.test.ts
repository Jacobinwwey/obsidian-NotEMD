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

    test('uses SVG geometry instead of pixel-rounded client bounds for tiny previews', () => {
        const text = (content: string, top: number) => ({
            textContent: content,
            getBoundingClientRect: () => ({ x: 0, y: 0, width: 5, height: 2 }),
            getBBox: () => ({ x: 0, y: top, width: 100, height: 20 }),
            getScreenCTM: () => ({ a: 0.05, b: 0, c: 0, d: 0.05, e: 0, f: 0 }),
            closest: () => null, contains: () => false, compareDocumentPosition: () => 0
        });
        const first = text('Title', 0);
        const second = text('Summary', 30);
        const svg = {
            getScreenCTM: first.getScreenCTM,
            querySelectorAll: (query: string) => query === 'text' ? [first, second] : []
        };
        const root = { querySelector: () => svg } as unknown as ParentNode;
        expect(collectSvgPresentationDiagnostics(root)).toEqual([]);
        svg.querySelectorAll = (query: string) => query === 'text' ? [first, text('Overlap', 10)] : [];
        expect(collectSvgPresentationDiagnostics(root)).toEqual([expect.objectContaining({ kind: 'svg-text-overlap' })]);
    });

    test.each([
        { horizontalScale: 0.05, verticalScale: 0.05 },
        { horizontalScale: 0.16, verticalScale: 0.16 },
        { horizontalScale: 0.12, verticalScale: 0.3 },
        { horizontalScale: 1, verticalScale: 1 },
        { horizontalScale: 4, verticalScale: 4 }
    ])('keeps label clearance in SVG units at scale $horizontalScale × $verticalScale', ({ horizontalScale, verticalScale }) => {
        const text = (content: string, top: number) => ({
            textContent: content,
            getBoundingClientRect: () => ({ x: 10 * horizontalScale, y: top * verticalScale,
                width: 80 * horizontalScale, height: 24 * verticalScale }),
            closest: () => null,
            contains: () => false,
            compareDocumentPosition: () => 0
        });
        const first = text('Title', 20);
        const second = text('Summary', 47);
        const svg = {
            getScreenCTM: () => ({ a: horizontalScale, b: 0, c: 0, d: verticalScale }),
            querySelectorAll: (query: string) => query === 'text' ? [first, second] : []
        };
        const root = { querySelector: () => svg } as unknown as ParentNode;
        expect(collectSvgPresentationDiagnostics(root)).toEqual([]);
        svg.querySelectorAll = (query: string) => query === 'text' ? [first, text('Overlapping', 43)] : [];
        expect(collectSvgPresentationDiagnostics(root)).toEqual([
            expect.objectContaining({ kind: 'svg-text-overlap' })
        ]);
    });
});
