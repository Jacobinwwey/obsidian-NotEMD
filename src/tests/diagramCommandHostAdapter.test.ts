import { STRINGS_EN } from '../i18n/locales/en';
import {
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
                localKnowledgeContextUsed: true,
                localKnowledgeRetrieval: {
                    indexedFileCount: 2,
                    indexedSectionCount: 5,
                    matchedSectionCount: 1,
                    returnedHitCount: 1,
                    expandedSectionCount: 1,
                    sourcePaths: ['Knowledge/Reference.md'],
                    usedSlidingWindowSize: 0,
                    requestedTopK: 3,
                    indexBuildMs: 9,
                    queryMs: 4,
                    contextCharCount: 64,
                    excludeCurrentFileApplied: true,
                    excludedCurrentFileHitCount: 0
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
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval: {
                indexedFileCount: 2,
                indexedSectionCount: 5,
                matchedSectionCount: 1,
                returnedHitCount: 1,
                expandedSectionCount: 1,
                sourcePaths: ['Knowledge/Reference.md'],
                usedSlidingWindowSize: 0,
                requestedTopK: 3,
                indexBuildMs: 9,
                queryMs: 4,
                contextCharCount: 64,
                excludeCurrentFileApplied: true,
                excludedCurrentFileHitCount: 0
            },
            outputPath: 'Notes/Topic_diagram.canvas',
            previewOpened: true
        });
    });

    test('preview wrapper finalizes reporter and returns artifact metadata', async () => {
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

    test('preview wrapper supports saved canvas artifacts directly', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_diagram.canvas', path: 'Notes/Topic_diagram.canvas' };
        host.readFile.mockResolvedValue('{"nodes":[],"edges":[]}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_diagram.canvas',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'json-canvas'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'json-canvas' }),
            'Notes/Topic_diagram.canvas',
            true
        );
    });

    test('preview wrapper supports raw saved mermaid markdown artifacts directly', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_summ.md', path: 'Notes/Topic_summ.md' };
        host.readFile.mockResolvedValue('flowchart TD\nA --> B');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_summ.md',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'mermaid',
                sourceIntent: 'flowchart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            'Notes/Topic_summ.md',
            true
        );
    });

    test('preview wrapper supports saved circuitikz tex artifacts as source-only previews', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Inverter_diagram.tex', path: 'Notes/Inverter_diagram.tex' };
        host.readFile.mockResolvedValue('\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\draw (0,0) to[short] (1,0);\n\\end{circuitikz}\n\\end{document}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Inverter_diagram.tex',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'circuitikz',
                mimeType: 'text/x-tex',
                sourceIntent: 'flowchart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'circuitikz',
                content: expect.stringContaining('\\begin{circuitikz}')
            }),
            'Notes/Inverter_diagram.tex',
            true
        );
    });
});
