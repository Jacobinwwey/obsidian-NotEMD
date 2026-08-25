import { applySvgSafetyContract, assertSvgSafetyContract } from '../rendering/preview/svgSafety';

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
});
