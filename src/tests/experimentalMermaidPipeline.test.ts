import { ProgressReporter } from '../types';
import { mockSettings } from './__mocks__/settings';
import * as llmUtils from '../llmUtils';
import * as diagramGenerationService from '../diagram/diagramGenerationService';
import { runDiagramGenerateOperation } from '../operations/diagramGenerateOperation';

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

describe('experimental mermaid pipeline integration', () => {
    let reporter: ProgressReporter;

    beforeEach(() => {
        jest.clearAllMocks();
        reporter = createReporter();
    });

    test('uses legacy mermaid prompt path when experimental pipeline is disabled', async () => {
        const settings = {
            ...mockSettings,
            enableExperimentalDiagramPipeline: false
        };
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');
        const experimentalSpy = jest.spyOn(diagramGenerationService, 'generateDiagramArtifact');

        const result = await runDiagramGenerateOperation({
            input: {
                sourceMarkdown: '# Notes',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            settings,
            provider: settings.providers[0],
            modelName: 'test-model',
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt'
        });

        expect(result.artifact.content).toBe('legacy-output');
        expect(experimentalSpy).not.toHaveBeenCalled();
        expect(llmUtils.callLLM).toHaveBeenCalledTimes(1);
    });

    test('uses experimental pipeline result when enabled and successful', async () => {
        const settings = {
            ...mockSettings,
            enableExperimentalDiagramPipeline: true,
            experimentalDiagramCompatibilityMode: 'best-fit' as const
        };
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockResolvedValue({
            plan: {
                intent: 'flowchart',
                confidence: 0.8,
                reasons: ['workflow detected'],
                renderTarget: 'mermaid',
                fallbackTargets: [],
                mermaidDiagramType: 'flowchart',
                legacyCompatibilityMode: true
            },
            spec: {
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate' },
                    { id: 'publish', label: 'Publish' }
                ],
                edges: [{ from: 'validate', to: 'publish' }]
            },
            artifact: {
                target: 'mermaid',
                content: '```mermaid\nflowchart TD\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            }
        });
        const legacySpy = jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');

        const result = await runDiagramGenerateOperation({
            input: {
                sourceMarkdown: '# Notes',
                requestedIntent: 'flowchart',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            settings,
            provider: settings.providers[0],
            modelName: 'test-model',
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt'
        });

        expect(result.artifact.content).toContain('flowchart TD');
        expect(legacySpy).not.toHaveBeenCalled();
        expect(diagramGenerationService.generateDiagramArtifact).toHaveBeenCalledWith('# Notes', expect.objectContaining({
            compatibilityMode: 'legacy-mermaid'
        }));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringMatching(/pins experimental compatibility mode to legacy-mermaid/i));
    });

    test('falls back to legacy path when experimental pipeline fails', async () => {
        const settings = {
            ...mockSettings,
            enableExperimentalDiagramPipeline: true
        };
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockRejectedValue(new Error('spec parse failed'));
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');

        const result = await runDiagramGenerateOperation({
            input: {
                sourceMarkdown: '# Notes',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            settings,
            provider: settings.providers[0],
            modelName: 'test-model',
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt'
        });

        expect(result.artifact.content).toBe('legacy-output');
        expect(llmUtils.callLLM).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringMatching(/falling back/i));
    });

    test('pins legacy-mermaid compatibility when mermaid output overrides best-fit config', async () => {
        const settings = {
            ...mockSettings,
            enableExperimentalDiagramPipeline: true,
            experimentalDiagramCompatibilityMode: 'best-fit' as const
        };
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockResolvedValue({
            plan: {
                intent: 'flowchart',
                confidence: 0.8,
                reasons: ['workflow detected'],
                renderTarget: 'mermaid',
                fallbackTargets: [],
                mermaidDiagramType: 'flowchart',
                legacyCompatibilityMode: true
            },
            spec: {
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [],
                edges: []
            },
            artifact: {
                target: 'mermaid',
                content: '```mermaid\nflowchart TD\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            }
        });

        await runDiagramGenerateOperation({
            input: {
                sourceMarkdown: '# Notes',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            settings,
            provider: settings.providers[0],
            modelName: 'test-model',
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt'
        });

        expect(reporter.log).toHaveBeenCalledWith(expect.stringMatching(/pins experimental compatibility mode to legacy-mermaid/i));
    });
});
