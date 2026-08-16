import { mockSettings } from './__mocks__/settings';
import {
    DIAGRAM_LLM_REQUEST_TIMEOUT_MS,
    runDiagramGenerateOperation
} from '../operations/diagramGenerateOperation';
import { ProgressReporter } from '../types';
import { resolveCircuitTemplateFromMarkdown } from '../diagram/adapters/circuitikz/circuitTemplateCatalog';

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
            sourcePath: 'Notes/Topic.md',
            requestedIntent: 'flowchart',
            compatibilityMode: 'best-fit'
        }));
        expect(result.artifact.target).toBe('mermaid');
    });

    test('forwards resolved source visuals without adding them to the LLM markdown payload', async () => {
        const reporter = createReporter();
        const sourceVisuals = [{
            id: 'source-visual-1',
            kind: 'mermaid' as const,
            sourceHash: 'abc12345',
            lineStart: 2,
            lineEnd: 4,
            language: 'mermaid',
            definition: 'flowchart TD\nA --> B',
            status: 'resolved' as const,
            content: 'flowchart TD\nA --> B'
        }];
        const generateDiagramArtifactImpl = jest.fn().mockResolvedValue({
            plan: { intent: 'drawnixMindmap' },
            spec: { intent: 'drawnixMindmap', title: 'Topic', nodes: [] },
            artifact: {
                target: 'drawnix',
                content: '{}',
                mimeType: 'application/vnd.drawnix+json',
                sourceIntent: 'drawnixMindmap'
            }
        });

        await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                sourceVisuals,
                requestedIntent: 'drawnixMindmap',
                requestedRenderTarget: 'drawnix',
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

        expect(generateDiagramArtifactImpl).toHaveBeenCalledWith('# Topic', expect.objectContaining({ sourceVisuals }));
    });

    test('forwards the Drawnix Mermaid companion preference to structured generation', async () => {
        const reporter = createReporter();
        const generateDiagramArtifactImpl = jest.fn().mockResolvedValue({
            plan: { intent: 'drawnixMindmap' },
            spec: { intent: 'drawnixMindmap', title: 'Topic', nodes: [] },
            artifact: {
                target: 'drawnix',
                content: '{}',
                mimeType: 'application/vnd.drawnix+json',
                sourceIntent: 'drawnixMindmap'
            }
        });

        await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                requestedIntent: 'drawnixMindmap',
                requestedRenderTarget: 'drawnix',
                drawnixExportMermaidCompanions: true,
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
            drawnixExportMermaidCompanions: true
        }));
    });

    test('passes a circuit-focused prompt to the provider for circuitikz artifact output', async () => {
        const reporter = createReporter();
        const circuitSpec = resolveCircuitTemplateFromMarkdown('Draw a CMOS inverter.');
        if (!circuitSpec) {
            throw new Error('Expected catalog to resolve CMOS inverter fixture.');
        }
        const callLLMImpl = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'circuit',
            title: 'CMOS Inverter',
            summary: 'CMOS inverter with PMOS pull-up and NMOS pull-down.',
            nodes: [],
            edges: [],
            sections: [],
            callouts: [],
            dataSeries: [],
            layoutHints: {},
            sourceLanguage: 'en',
            outputLanguage: 'en',
            evidenceRefs: [],
            circuitSpec
        }));

        const result = await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Cmos.md',
                sourceMarkdown: 'Draw a CMOS inverter in circuitikz.',
                requestedIntent: 'circuit',
                requestedRenderTarget: 'circuitikz',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            settings: mockSettings,
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter,
            getLegacyMermaidPrompt: () => 'legacy prompt',
            callLLMImpl
        });

        const prompt = callLLMImpl.mock.calls[0][1];
        expect(prompt).toMatch(/Supported intent:\s*circuit/i);
        expect(prompt).not.toMatch(/Supported intents:[\s\S]*mindmap/i);
        expect(prompt).toMatch(/CircuitSpec JSON example/i);
        expect(prompt).toMatch(/Do not output raw TikZ/i);
        expect(result.artifact.target).toBe('circuitikz');
        expect(result.artifact.content).toContain('\\begin{circuitikz}');
    });

    test('aborts a stalled diagram request at the deadline and releases the reporter controller', async () => {
        jest.useFakeTimers();
        try {
            const reporter = createReporter();
            reporter.abortController = null;
            const callLLMImpl = jest.fn((
                _provider,
                _prompt,
                _content,
                _settings,
                _reporter,
                _modelName,
                signal?: AbortSignal
            ) => new Promise<string>((_resolve, reject) => {
                if (!signal) {
                    reject(new Error('Diagram operation did not provide an abort signal.'));
                    return;
                }
                signal.addEventListener('abort', () => {
                    const abortError = new Error('request aborted');
                    abortError.name = 'AbortError';
                    reject(abortError);
                }, { once: true });
            }));

            const operation = runDiagramGenerateOperation({
                input: {
                    sourcePath: 'Notes/Architecture.md',
                    sourceMarkdown: '# Architecture',
                    requestedIntent: 'drawnixMindmap',
                    requestedRenderTarget: 'drawnix',
                    compatibilityMode: 'best-fit',
                    outputMode: 'artifact'
                },
                settings: mockSettings,
                provider: mockSettings.providers[0],
                modelName: mockSettings.providers[0].model,
                reporter,
                getLegacyMermaidPrompt: () => 'legacy prompt',
                callLLMImpl
            });

            await Promise.resolve();
            await Promise.resolve();

            const activeController = reporter.abortController as AbortController | null;
            expect(activeController).not.toBeNull();
            expect(activeController!.signal).toBe(callLLMImpl.mock.calls[0][6]);

            jest.advanceTimersByTime(DIAGRAM_LLM_REQUEST_TIMEOUT_MS);

            await expect(operation).rejects.toThrow('Diagram generation timed out');
            expect(reporter.abortController).toBeNull();
        } finally {
            jest.useRealTimers();
        }
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
            mockSettings.providers[0].model,
            expect.objectContaining({ aborted: false })
        );
        expect(result.artifact.content).toBe('graph TD\nA-->B');
        expect((reporter.log as jest.Mock).mock.calls.flat().join('\n')).toContain('Falling back to legacy Mermaid');
    });
});
