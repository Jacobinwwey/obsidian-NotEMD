import { mockSettings } from './__mocks__/settings';
import { runDiagramGenerateOperation } from '../operations/diagramGenerateOperation';
import { ProgressReporter } from '../types';

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

describe('diagram generate operation', () => {
    test('uses structured generation path for artifact output', async () => {
        const reporter = createReporter();
        const generateDiagramArtifactImpl = jest.fn().mockResolvedValue({
            plan: { intent: 'flowchart' },
            spec: { intent: 'flowchart', title: 'Topic', nodes: [] },
            artifact: {
                target: 'mermaid',
                content: 'graph TD',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            }
        });

        const result = await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                requestedIntent: 'flowchart',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            settings: mockSettings,
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt',
            generateDiagramArtifactImpl
        });

        expect(generateDiagramArtifactImpl).toHaveBeenCalledWith('# Topic', expect.objectContaining({
            requestedIntent: 'flowchart',
            compatibilityMode: 'best-fit'
        }));
        expect(result.artifact.target).toBe('mermaid');
    });

    test('falls back to legacy mermaid path when mermaid output fails structured generation', async () => {
        const reporter = createReporter();
        const callLLMImpl = jest.fn().mockResolvedValue('graph TD\nA-->B');
        const generateDiagramArtifactImpl = jest.fn().mockRejectedValue(new Error('render boom'));
        const settings = {
            ...mockSettings,
            enableExperimentalDiagramPipeline: true
        };

        const result = await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                requestedIntent: 'mindmap',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            settings,
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt',
            callLLMImpl,
            generateDiagramArtifactImpl
        });

        expect(callLLMImpl).toHaveBeenCalledWith(
            mockSettings.providers[0],
            'legacy prompt',
            '# Topic',
            settings,
            reporter,
            mockSettings.providers[0].model
        );
        expect(result.artifact.content).toBe('graph TD\nA-->B');
        expect((reporter.log as jest.Mock).mock.calls.flat().join('\n')).toContain('Falling back to legacy Mermaid');
    });
});
