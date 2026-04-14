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
        intent: 'flowchart',
        confidence: 0.9,
        reasons: ['forced plan for fallback coverage'],
        renderTarget: 'vega-lite',
        fallbackTargets: ['mermaid', 'html'],
        mermaidDiagramType: 'flowchart',
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
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [{ id: 'validate', label: 'Validate' }]
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
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [{ id: 'validate', label: 'Validate' }]
            })
        })).rejects.toThrow('vega failed');

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [{ id: 'validate', label: 'Validate' }]
            })
        })).rejects.toThrow('mermaid failed');

        await expect(generateDiagramArtifact('# Release flow', {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [{ id: 'validate', label: 'Validate' }]
            })
        })).rejects.toThrow('html failed');
    });
});
