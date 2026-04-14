import { generateDiagramArtifact } from '../diagram/diagramGenerationService';

describe('diagram generation service', () => {
    test('generates mermaid content through the experimental pipeline when spec output is valid', async () => {
        const artifact = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate version' },
                    { id: 'publish', label: 'Publish release' }
                ],
                edges: [
                    { from: 'validate', to: 'publish', label: 'pass' }
                ]
            })
        });

        expect(artifact.plan.legacyCompatibilityMode).toBe(true);
        expect(artifact.artifact.target).toBe('mermaid');
        expect(artifact.artifact.content).toContain('flowchart TD');
    });

    test('throws when the LLM response cannot be parsed into a valid diagram spec', async () => {
        await expect(generateDiagramArtifact('# Notes', {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => 'not-json'
        })).rejects.toThrow(/Unable to parse DiagramSpec/i);
    });

    test('coerces unsupported legacy-mermaid intents into a mermaid-compatible artifact', async () => {
        const artifact = await generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [
                    { id: 'week-1', label: 'Week 1: 12' },
                    { id: 'week-2', label: 'Week 2: 19' }
                ],
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 }
                        ]
                    }
                ]
            })
        });

        expect(artifact.plan.legacyCompatibilityMode).toBe(true);
        expect(artifact.spec.intent).toBe('mindmap');
        expect(artifact.artifact.target).toBe('mermaid');
        expect(artifact.artifact.content).toContain('mindmap');
    });
});
