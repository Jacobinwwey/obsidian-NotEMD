import { STRINGS_EN } from '../i18n/locales/en';
import * as diagramGenerateOperation from '../operations/diagramGenerateOperation';
import * as diagramCommandHostAdapter from '../operations/diagramCommandHostAdapter';
import {
    runArtifactDiagramExecutionWithHost,
    runSaveMermaidDiagramExecutionWithHost
} from '../operations/diagramCommandExecution';
import { mockSettings } from './__mocks__/settings';

function createReporter() {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        clearDisplay: jest.fn(),
        requestCancel: jest.fn(),
        cancelled: false,
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

function createExecutionHost() {
    const diagramHost = {
        saveMermaidSummary: jest.fn(),
        saveArtifact: jest.fn(),
        getFileByPath: jest.fn(),
        readFile: jest.fn(),
        openFile: jest.fn(),
        maybeAutoFixMermaid: jest.fn(),
        supportsPreview: jest.fn(() => false),
        openPreview: jest.fn(),
        notify: jest.fn()
    };

    return {
        diagramHost,
        host: {
            getSettings: jest.fn(() => mockSettings),
            getLegacyMermaidPrompt: jest.fn(() => 'legacy prompt'),
            createDiagramHostAdapter: jest.fn(() => diagramHost),
            getStepStatusText: jest.fn((current: number, total: number, label: string) => `${label} ${current}/${total}`),
            getActionCompleteText: jest.fn((label: string) => `Completed ${label}`)
        }
    };
}

describe('diagram command execution', () => {
    test('save mermaid execution runs generation and completion below main.ts', async () => {
        const reporter = createReporter();
        const { host, diagramHost } = createExecutionHost();
        const file = { path: 'Notes/Topic.md' } as any;
        const generation = {
            plan: { intent: 'mindmap' },
            spec: { intent: 'mindmap' },
            artifact: {
                target: 'mermaid',
                content: 'graph TD',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            }
        } as any;
        const runSpy = jest.spyOn(diagramGenerateOperation, 'runDiagramGenerateOperation').mockResolvedValue(generation);
        const completeSpy = jest
            .spyOn(diagramCommandHostAdapter, 'completeMermaidDiagramCommand')
            .mockResolvedValue('Notes/Topic_diagram.md');

        const result = await runSaveMermaidDiagramExecutionWithHost(host as any, {
            file,
            operationInput: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter: reporter as any,
            actionLabel: 'Summarize diagram',
            i18n: STRINGS_EN as any
        });

        expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({
            input: expect.objectContaining({ outputMode: 'mermaid' }),
            settings: mockSettings,
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter,
            getLegacyMermaidPrompt: expect.any(Function)
        }));
        expect(completeSpy).toHaveBeenCalledWith(expect.objectContaining({
            host: diagramHost,
            file,
            reporter,
            mermaidContent: 'graph TD',
            autoFixAfterGenerate: mockSettings.autoMermaidFixAfterGenerate
        }));
        expect(result).toEqual({
            generation,
            followThrough: {
                kind: 'save-mermaid',
                outputPath: 'Notes/Topic_diagram.md',
                previewOpened: false,
                autoFixAttempted: mockSettings.autoMermaidFixAfterGenerate,
                artifactTarget: 'mermaid'
            },
            outputPath: 'Notes/Topic_diagram.md',
            previewOpened: false
        });
    });

    test('artifact execution reports saved output path and preview follow-through below main.ts', async () => {
        const reporter = createReporter();
        const { host, diagramHost } = createExecutionHost();
        const file = { path: 'Notes/Topic.md' } as any;
        const generation = {
            plan: { intent: 'canvasMap' },
            spec: { intent: 'canvasMap' },
            artifact: {
                target: 'json-canvas',
                content: '{"nodes":[],"edges":[]}',
                mimeType: 'application/json',
                sourceIntent: 'canvasMap'
            }
        } as any;
        diagramHost.supportsPreview.mockReturnValue(true);
        const runSpy = jest.spyOn(diagramGenerateOperation, 'runDiagramGenerateOperation').mockResolvedValue(generation);
        const completeSpy = jest
            .spyOn(diagramCommandHostAdapter, 'completeArtifactDiagramCommand')
            .mockResolvedValue('Notes/Topic_diagram.canvas');

        const result = await runArtifactDiagramExecutionWithHost(host as any, {
            file,
            operationInput: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter: reporter as any,
            actionLabel: 'Generate diagram',
            i18n: STRINGS_EN as any,
            executionMode: 'save-artifact'
        });

        expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({
            input: expect.objectContaining({ outputMode: 'artifact' }),
            settings: mockSettings
        }));
        expect(completeSpy).toHaveBeenCalledWith(expect.objectContaining({
            host: diagramHost,
            file,
            reporter,
            result: generation,
            executionMode: 'save-artifact',
            autoFixAfterGenerate: mockSettings.autoMermaidFixAfterGenerate
        }));
        expect(result).toEqual({
            generation,
            followThrough: {
                kind: 'save-artifact',
                outputPath: 'Notes/Topic_diagram.canvas',
                previewOpened: true,
                autoFixAttempted: false,
                artifactTarget: 'json-canvas'
            },
            outputPath: 'Notes/Topic_diagram.canvas',
            previewOpened: true
        });
    });

    test('preview artifact execution keeps preview follow-through explicit without claiming auto-fix ran', async () => {
        const reporter = createReporter();
        const { host } = createExecutionHost();
        const file = { path: 'Notes/Topic.md' } as any;
        const generation = {
            plan: { intent: 'mindmap' },
            spec: { intent: 'mindmap' },
            artifact: {
                target: 'mermaid',
                content: 'graph TD',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            }
        } as any;
        jest.spyOn(diagramGenerateOperation, 'runDiagramGenerateOperation').mockResolvedValue(generation);
        jest
            .spyOn(diagramCommandHostAdapter, 'completeArtifactDiagramCommand')
            .mockResolvedValue(undefined);

        const result = await runArtifactDiagramExecutionWithHost(host as any, {
            file,
            operationInput: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter: reporter as any,
            actionLabel: 'Preview diagram',
            i18n: STRINGS_EN as any,
            executionMode: 'preview-artifact'
        });

        expect(result).toEqual({
            generation,
            followThrough: {
                kind: 'preview-artifact',
                outputPath: undefined,
                previewOpened: true,
                autoFixAttempted: false,
                artifactTarget: 'mermaid'
            },
            outputPath: undefined,
            previewOpened: true
        });
    });
});
