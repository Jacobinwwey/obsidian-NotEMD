import { STRINGS_EN } from '../i18n/locales/en';
import {
    completeArtifactDiagramCommand,
    MissingPreviewableDiagramArtifactError,
    previewVegaLiteArtifactFromMarkdown,
    runGenerateDiagramCommandWithHost,
    runPreviewDiagramCommandWithHost
} from '../operations/diagramCommandHostAdapter';
import { mockSettings } from './__mocks__/settings';

function createReporter() {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        clearDisplay: jest.fn(),
        cancelled: false
    };
}

function createDiagramHost() {
    const reporter = createReporter();
    const diagramHost = {
        saveMermaidSummary: jest.fn(),
        saveArtifact: jest.fn(),
        getFileByPath: jest.fn(),
        readFile: jest.fn(),
        openFile: jest.fn(),
        maybeAutoFixMermaid: jest.fn(),
        supportsPreview: jest.fn(() => true),
        openPreview: jest.fn(),
        notify: jest.fn()
    };

    return {
        reporter,
        diagramHost,
        host: {
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => STRINGS_EN),
            getReporter: jest.fn(() => reporter),
            isBusy: jest.fn(() => false),
            setBusy: jest.fn(),
            getBusyNotice: jest.fn(() => 'busy now'),
            startReporterAction: jest.fn(),
            finalizeReporter: jest.fn(),
            getActionLabel: jest.fn((mode: string) => mode === 'save-artifact' ? 'Generate diagram' : 'Preview diagram'),
            getActionCompleteText: jest.fn((label: string) => `Completed ${label}`),
            getActionFailedText: jest.fn((message: string) => `Failed: ${message}`),
            readFile: jest.fn().mockResolvedValue('# Topic'),
            getProviderAndModelForTask: jest.fn(() => ({
                provider: mockSettings.providers[0],
                modelName: mockSettings.providers[0].model
            })),
            getTaskLanguageCode: jest.fn(() => 'en'),
            executeSaveMermaidCommand: jest.fn(),
            executeArtifactCommand: jest.fn().mockResolvedValue({
                generation: {
                    plan: { intent: 'canvasMap' },
                    spec: { intent: 'canvasMap' },
                    artifact: {
                        target: 'json-canvas',
                        content: '{}',
                        mimeType: 'application/json',
                        sourceIntent: 'canvasMap'
                    }
                },
                followThrough: {
                    kind: 'save-artifact',
                    outputPath: 'Notes/Topic_diagram.canvas',
                    previewOpened: true,
                    autoFixAttempted: false,
                    artifactTarget: 'json-canvas'
                },
                outputPath: 'Notes/Topic_diagram.canvas',
                previewOpened: true
            }),
            createDiagramHostAdapter: jest.fn(() => diagramHost),
            saveErrorLog: jest.fn().mockResolvedValue(undefined),
            logError: jest.fn()
        }
    };
}

describe('diagram command host adapter', () => {
    test('save-artifact completion reopens preview from saved markdown so initial preview matches later direct preview', async () => {
        const reporter = createReporter();
        const savedFile = { path: 'Notes/Topic_summ.md', name: 'Topic_summ.md' };
        const outputArtifact = {
            target: 'mermaid',
            content: '```mermaid\nerDiagram\nA ||--o B : relates_to\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'erDiagram'
        } as const;
        const { diagramHost } = createDiagramHost();

        diagramHost.saveArtifact.mockResolvedValue('Notes/Topic_summ.md');
        diagramHost.getFileByPath.mockReturnValue(savedFile);
        diagramHost.readFile.mockResolvedValue('```mermaid\nerDiagram\nA ||--o{ B : relates_to\n```');

        const outputPath = await completeArtifactDiagramCommand({
            host: diagramHost as any,
            file: { path: 'Notes/Topic.md' } as any,
            reporter: reporter as any,
            result: {
                spec: { intent: 'erDiagram' },
                artifact: outputArtifact
            } as any,
            actionLabel: 'Generate diagram',
            executionMode: 'save-artifact',
            completeNotice: 'done',
            previewReadyNotice: 'preview ready',
            manualFixHintNotice: 'fix hint',
            autoFixAfterGenerate: true,
            getStepStatusText: (_current, _total, label) => label,
            getActionCompleteText: (label) => `Completed ${label}`
        });

        expect(outputPath).toBe('Notes/Topic_summ.md');
        expect(diagramHost.readFile).toHaveBeenCalledWith(savedFile);
        expect(diagramHost.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'mermaid',
                content: '```mermaid\nerDiagram\nA ||--o{ B : relates_to\n```',
                sourceIntent: 'erDiagram'
            }),
            'Notes/Topic_summ.md',
            true
        );
    });

    test('busy generate wrapper short-circuits before reading file or running generation', async () => {
        const { host, reporter } = createDiagramHost();
        host.isBusy.mockReturnValue(true);
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };

        const result = await runGenerateDiagramCommandWithHost(host as any, file as any, reporter as any, {
            executionMode: 'save-artifact'
        });

        expect(result).toBeNull();
        expect(host.readFile).not.toHaveBeenCalled();
        expect(host.createDiagramHostAdapter().notify).toHaveBeenCalledWith('busy now');
    });

    test('generate wrapper returns follow-through details from the execution host', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };

        const result = await runGenerateDiagramCommandWithHost(host as any, file as any, reporter as any, {
            executionMode: 'save-artifact'
        });

        expect(result).toEqual({
            kind: 'success',
            executionMode: 'save-artifact',
            sourcePath: 'Notes/Topic.md',
            actionLabel: 'Generate diagram',
            operationInput: expect.objectContaining({
                sourcePath: 'Notes/Topic.md',
                outputMode: 'artifact'
            }),
            generation: expect.objectContaining({
                artifact: expect.objectContaining({ target: 'json-canvas' })
            }),
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

    test('preview wrapper finalizes reporter and returns artifact metadata for markdown vega-lite fences', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };
        host.readFile.mockResolvedValue('# Chart\n\n```vega-lite\n{\"mark\":\"bar\"}\n```');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic.md',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'vega-lite'
            })
        });
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(host.createDiagramHostAdapter().notify).toHaveBeenCalledWith('Diagram preview is ready!');
    });

    test('preview wrapper opens direct preview for fenced mermaid markdown artifacts', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_summ.md', path: 'Notes/Topic_summ.md' };
        host.readFile.mockResolvedValue('```mermaid\nerDiagram\nA ||--o{ B : relates_to\n```');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_summ.md',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'mermaid',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'erDiagram'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            'Notes/Topic_summ.md',
            false
        );
    });

    test('preview wrapper opens direct preview for saved json-canvas artifacts', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_diagram.canvas', path: 'Notes/Topic_diagram.canvas' };
        host.readFile.mockResolvedValue('{"nodes":[],"edges":[]}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_diagram.canvas',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'json-canvas',
                mimeType: 'application/json',
                sourceIntent: 'canvasMap'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'json-canvas' }),
            'Notes/Topic_diagram.canvas',
            true
        );
    });

    test('preview wrapper opens direct preview for saved html artifacts', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_diagram.html', path: 'Notes/Topic_diagram.html' };
        host.readFile.mockResolvedValue('<!DOCTYPE html><html><body><main>Preview</main></body></html>');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_diagram.html',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'html',
                mimeType: 'text/html'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'html' }),
            'Notes/Topic_diagram.html',
            true
        );
    });

    test('preview wrapper opens direct preview for saved vega-lite json artifacts', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_diagram.json', path: 'Notes/Topic_diagram.json' };
        host.readFile.mockResolvedValue('{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","mark":"bar"}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_diagram.json',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'vega-lite',
                mimeType: 'application/json',
                sourceIntent: 'dataChart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'vega-lite' }),
            'Notes/Topic_diagram.json',
            true
        );
    });

    test('preview wrapper returns a direct-preview error when the file does not contain a supported artifact', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };
        host.readFile.mockResolvedValue('# Topic\n\nNo previewable diagram artifact here.');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toEqual({
            kind: 'error',
            sourcePath: 'Notes/Topic.md',
            actionLabel: 'Preview diagram',
            errorMessage: new MissingPreviewableDiagramArtifactError().message
        });
        expect(host.createDiagramHostAdapter().openPreview).not.toHaveBeenCalled();
    });

    test('preview helper keeps using markdown vega-lite fence extraction for direct preview', () => {
        const { diagramHost } = createDiagramHost();
        const artifact = previewVegaLiteArtifactFromMarkdown({
            host: diagramHost as any,
            sourceMarkdown: '# Chart\n\n```vega-lite\n{\"mark\":\"bar\"}\n```',
            sourcePath: 'Notes/Topic.md'
        });

        expect(artifact).toEqual(expect.objectContaining({
            target: 'vega-lite',
            mimeType: 'application/json'
        }));
        expect(diagramHost.openPreview).toHaveBeenCalled();
    });
});
