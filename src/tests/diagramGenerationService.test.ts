import { generateDiagramArtifact } from '../diagram/diagramGenerationService';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { DiagramRenderer } from '../rendering/types';

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

    test('drops chart-only layout hints when legacy-mermaid compatibility coerces data charts', async () => {
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
                layoutHints: { chartType: 'pie' },
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
        expect(artifact.spec.layoutHints?.chartType).toBeUndefined();
        expect(artifact.artifact.target).toBe('mermaid');
    });

    test('falls back to html when the preferred renderer fails in best-fit mode', async () => {
        const failingMermaidRenderer: DiagramRenderer = {
            id: 'failing-mermaid',
            target: 'mermaid',
            supports: (spec) => spec.intent === 'flowchart',
            render: async () => {
                throw new Error('mermaid parse failed');
            }
        };
        const rendererService = new RendererService(new RendererRegistry([
            failingMermaidRenderer,
            new HtmlRenderer()
        ]));

        const result = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
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

        expect(result.plan.fallbackTargets).toContain('html');
        expect(result.artifact.target).toBe('html');
        expect(result.artifact.content).toContain('Release Flow');
    });

    test('rejects unsupported data chart layout hints before renderer fallback', async () => {
        await expect(generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [],
                layoutHints: { chartType: 'radar' },
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
        })).rejects.toThrow(/unsupported chartType/i);
    });

    test('injects planner chart defaults when the LLM omits chartType', async () => {
        const result = await generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
| 3 | 27 |
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [],
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 },
                            { x: 'Week 3', y: 27 }
                        ]
                    }
                ]
            })
        });

        expect(result.plan.preferredChartType).toBe('line');
        expect(result.spec.layoutHints?.chartType).toBe('line');
        expect(JSON.parse(result.artifact.content).mark).toBe('line');
    });

    test('rejects ambiguous multi-series pie specs before renderer fallback', async () => {
        await expect(generateDiagramArtifact(`# Traffic Mix

Organic share: 40%
Paid share: 25%
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Traffic Mix',
                nodes: [],
                layoutHints: { chartType: 'pie' },
                dataSeries: [
                    {
                        id: 'current',
                        label: 'Current',
                        points: [{ x: 'Organic', y: 40 }]
                    },
                    {
                        id: 'previous',
                        label: 'Previous',
                        points: [{ x: 'Paid', y: 25 }]
                    }
                ]
            })
        })).rejects.toThrow(/single data series/i);
    });
});
