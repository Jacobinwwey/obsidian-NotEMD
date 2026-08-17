jest.mock('../diagram/planner', () => ({
    buildDiagramPlan: jest.fn()
}));

import { generateDiagramArtifact } from '../diagram/diagramGenerationService';
import { buildDiagramPlan } from '../diagram/planner';
import { DiagramPlan } from '../diagram/types';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import { DiagramRenderer } from '../rendering/types';

function createForcedPlan(): DiagramPlan {
    return {
        intent: 'dataChart',
        confidence: 0.9,
        reasons: ['forced plan for fallback coverage'],
        renderTarget: 'vega-lite',
        fallbackTargets: ['mermaid', 'html'],
        mermaidDiagramType: null,
        preferredChartType: 'bar',
        legacyCompatibilityMode: false
    };
}

function createRenderer(target: 'vega-lite' | 'mermaid' | 'html', renderImpl: DiagramRenderer['render']): DiagramRenderer {
    return {
        id: `${target}-renderer`,
        target,
        supports: () => true,
        render: renderImpl
    };
}

describe('diagram generation fallback traversal', () => {
    const mockedBuildDiagramPlan = buildDiagramPlan as jest.MockedFunction<typeof buildDiagramPlan>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedBuildDiagramPlan.mockReturnValue(createForcedPlan());
    });

    test('tries later fallback targets when an earlier fallback target fails', async () => {
        const attempts: string[] = [];
        const rendererService = new RendererService(new RendererRegistry([
            createRenderer('vega-lite', async () => {
                attempts.push('vega-lite');
                throw new Error('vega failed');
            }),
            createRenderer('mermaid', async () => {
                attempts.push('mermaid');
                throw new Error('mermaid failed');
            }),
            createRenderer('html', async (spec) => {
                attempts.push('html');
                return {
                    target: 'html',
                    content: '<!DOCTYPE html><html><body>Fallback</body></html>',
                    mimeType: 'text/html',
                    sourceIntent: spec.intent
                };
            })
        ]));

        const result = await generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Release Flow',
                nodes: [],
                layoutHints: { chartType: 'bar' },
                dataSeries: [
                    {
                        id: 'release',
                        label: 'Release',
                        points: [{ x: 'Validate', y: 1 }]
                    }
                ]
            })
        });

        expect(attempts).toEqual(['vega-lite', 'mermaid', 'html']);
        expect(result.artifact.target).toBe('html');
    });

    test('surfaces every attempted renderer failure when all fallbacks fail', async () => {
        const rendererService = new RendererService(new RendererRegistry([
            createRenderer('vega-lite', async () => {
                throw new Error('vega failed');
            }),
            createRenderer('mermaid', async () => {
                throw new Error('mermaid failed');
            }),
            createRenderer('html', async () => {
                throw new Error('html failed');
            })
        ]));

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Release Flow',
                nodes: [],
                layoutHints: { chartType: 'bar' },
                dataSeries: [
                    {
                        id: 'release',
                        label: 'Release',
                        points: [{ x: 'Validate', y: 1 }]
                    }
                ]
            })
        })).rejects.toThrow('vega failed');

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Release Flow',
                nodes: [],
                layoutHints: { chartType: 'bar' },
                dataSeries: [
                    {
                        id: 'release',
                        label: 'Release',
                        points: [{ x: 'Validate', y: 1 }]
                    }
                ]
            })
        })).rejects.toThrow('mermaid failed');

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Release Flow',
                nodes: [],
                layoutHints: { chartType: 'bar' },
                dataSeries: [
                    {
                        id: 'release',
                        label: 'Release',
                        points: [{ x: 'Validate', y: 1 }]
                    }
                ]
            })
        })).rejects.toThrow('html failed');
    });

    test('returns the retry spec together with the retry artifact', async () => {
        mockedBuildDiagramPlan.mockReturnValue({
            ...createForcedPlan(),
            intent: 'flowchart',
            renderTarget: 'mermaid',
            fallbackTargets: []
        });

        const rendererService = new RendererService(new RendererRegistry([
            createRenderer('mermaid', async (spec) => {
                if (spec.title === 'Initial') {
                    throw new Error('Mermaid diagram failed validation: Parse error');
                }
                return {
                    target: 'mermaid',
                    content: `retry:${spec.title}`,
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: spec.intent
                };
            })
        ]));
        const llmResponses = [
            JSON.stringify({ intent: 'flowchart', title: 'Initial', nodes: [{ id: 'a', label: 'Initial' }] }),
            JSON.stringify({ intent: 'flowchart', title: 'Retry', nodes: [{ id: 'b', label: 'Retry' }] })
        ];

        const result = await generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => llmResponses.shift()!
        });

        expect(result.spec.title).toBe('Retry');
        expect(result.artifact.content).toBe('retry:Retry');
        expect(result.artifact.sourceIntent).toBe(result.spec.intent);
    });

    test('does not return a mixed-target artifact when the Mermaid retry also fails', async () => {
        const rendererService = new RendererService(new RendererRegistry([
            createRenderer('vega-lite', async () => {
                throw new Error('vega failed');
            }),
            createRenderer('mermaid', async () => {
                throw new Error('Mermaid diagram failed validation: Parse error');
            }),
            createRenderer('html', async () => {
                throw new Error('html failed');
            })
        ]));
        const llmResponses = [
            JSON.stringify({
                intent: 'dataChart',
                title: 'Initial chart',
                nodes: [],
                dataSeries: [{ id: 'release', label: 'Release', points: [{ x: 'Validate', y: 1 }] }]
            }),
            JSON.stringify({
                intent: 'dataChart',
                title: 'Retry chart',
                nodes: [],
                dataSeries: [{ id: 'release', label: 'Release', points: [{ x: 'Validate', y: 1 }] }]
            })
        ];

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => llmResponses.shift()!
        })).rejects.toThrow(/Mermaid rendering failed after retry/i);
    });
});
