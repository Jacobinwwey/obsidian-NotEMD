import { buildDiagramPlan } from '../diagram/planner';

describe('diagram planner', () => {
    test('uses best-fit render target for chart notes', () => {
        const markdown = `# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
| 3 | 27 |
`;

        const result = buildDiagramPlan(markdown, { compatibilityMode: 'best-fit' });

        expect(result.intent).toBe('dataChart');
        expect(result.renderTarget).toBe('vega-lite');
        expect(result.mermaidDiagramType).toBeNull();
        expect(result.fallbackTargets).toEqual([]);
    });

    test('preserves legacy mermaid compatibility when requested', () => {
        const markdown = `# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`;

        const result = buildDiagramPlan(markdown, { compatibilityMode: 'legacy-mermaid' });

        expect(result.intent).toBe('dataChart');
        expect(result.renderTarget).toBe('mermaid');
        expect(result.mermaidDiagramType).toBe('mindmap');
        expect(result.legacyCompatibilityMode).toBe(true);
    });
});
