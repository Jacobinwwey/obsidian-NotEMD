interface DiagramExampleSummaryForTest {
    typeId: string;
    fixtureId: string;
    title: string;
    titleZh: string;
    selectionRationale: string;
    selectionRationaleZh: string;
    sourceIntent: string;
    payloadKind: string;
    target: string;
    semanticFacts: string[];
    readingCues: string[];
    readingCuesZh: string[];
}

const { loadExecutableDiagramExampleSummaries } = require('../../scripts/lib/diagram-examples-catalog') as {
    loadExecutableDiagramExampleSummaries: (repoRoot: string) => Promise<DiagramExampleSummaryForTest[]>;
};

describe('diagram examples catalog bridge', () => {
    test('derives one JSON-safe summary for every executable catalog row', async () => {
        const summaries: DiagramExampleSummaryForTest[] = await loadExecutableDiagramExampleSummaries(process.cwd());

        expect(summaries).toHaveLength(33);
        expect(new Set(summaries.map(summary => summary.typeId)).size).toBe(33);
        expect(summaries.every(summary => summary.fixtureId && summary.target && summary.sourceIntent)).toBe(true);
        expect(summaries.every(summary => summary.semanticFacts.length > 0)).toBe(true);
        expect(summaries.every(summary => summary.readingCues.length >= 2)).toBe(true);
        expect(summaries.every(summary => summary.titleZh && summary.selectionRationaleZh)).toBe(true);
    });

    test('keeps bilingual input facts and request selectors aligned', async () => {
        const summaries: DiagramExampleSummaryForTest[] = await loadExecutableDiagramExampleSummaries(process.cwd());
        const topology = summaries.find(summary => summary.typeId === 'integration-topology');

        expect(topology).toBeDefined();
        expect(topology?.semanticFacts.some((fact: string) => fact.includes('platform'))).toBe(true);
        expect(topology?.semanticFacts.some((fact: string) => fact.includes('"from"') && fact.includes('"to"'))).toBe(true);
        expect(topology?.titleZh).toBe('集成拓扑');
        expect(topology?.payloadKind).toBe('topology');
        expect(topology?.selectionRationaleZh).toContain('源系统');
    });
});
