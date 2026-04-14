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
        expect(result.preferredChartType).toBe('line');
        expect(result.fallbackTargets).toEqual(['html']);
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
        expect(result.preferredChartType).toBe('line');
        expect(result.legacyCompatibilityMode).toBe(true);
    });

    test('infers pie charts for part-to-whole metric summaries', () => {
        const markdown = `# Traffic Mix

Organic share: 40%
Paid share: 25%
Referral share: 35%
`;

        const result = buildDiagramPlan(markdown, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'dataChart'
        });

        expect(result.preferredChartType).toBe('pie');
    });

    test('routes part-to-whole summaries to best-fit pie charts without an explicit intent', () => {
        const markdown = `# Traffic Mix

Organic share: 40%
Paid share: 25%
Referral share: 35%
`;

        const result = buildDiagramPlan(markdown, { compatibilityMode: 'best-fit' });

        expect(result.intent).toBe('dataChart');
        expect(result.renderTarget).toBe('vega-lite');
        expect(result.preferredChartType).toBe('pie');
    });

    test('infers scatter charts for paired numeric comparisons', () => {
        const markdown = `# Latency vs Throughput

Compare latency versus throughput across benchmark runs.
`;

        const result = buildDiagramPlan(markdown, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'dataChart'
        });

        expect(result.preferredChartType).toBe('scatter');
    });

    test('routes paired numeric comparisons to best-fit scatter charts without an explicit intent', () => {
        const markdown = `# Latency vs Throughput

Run A: latency 120 ms, throughput 45 req/s
Run B: latency 180 ms, throughput 70 req/s
`;

        const result = buildDiagramPlan(markdown, { compatibilityMode: 'best-fit' });

        expect(result.intent).toBe('dataChart');
        expect(result.renderTarget).toBe('vega-lite');
        expect(result.preferredChartType).toBe('scatter');
    });

    test('infers table charts for ranked issue summaries', () => {
        const markdown = `# Top Issues

Top ranked issues this week:
- Timeouts: 12
- Retries: 7
`;

        const result = buildDiagramPlan(markdown, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'dataChart'
        });

        expect(result.preferredChartType).toBe('table');
    });

    test('routes ranked issue summaries to best-fit tables without an explicit intent', () => {
        const markdown = `# Top Issues

- Timeouts: 12
- Retries: 7
- Rate limits: 4
`;

        const result = buildDiagramPlan(markdown, { compatibilityMode: 'best-fit' });

        expect(result.intent).toBe('dataChart');
        expect(result.renderTarget).toBe('vega-lite');
        expect(result.preferredChartType).toBe('table');
    });
});
