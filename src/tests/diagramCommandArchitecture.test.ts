import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as diagramGenerateOperation from '../operations/diagramGenerateOperation';
import * as diagramCommandHostAdapter from '../operations/diagramCommandHostAdapter';
import * as diagramCommandExecution from '../operations/diagramCommandExecution';
import * as localKnowledgeBase from '../localKnowledgeBase';

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

describe('diagram command architecture', () => {
    let plugin: NotemdPlugin;
    let reporter: ProgressReporter;
    let file: any;

    beforeEach(() => {
        jest.clearAllMocks();
        plugin = new NotemdPlugin(mockApp, {
            id: 'notemd-test',
            name: 'Notemd Test',
            version: '0.0.1',
            author: 'Test',
            description: 'Test plugin',
            isDesktopOnly: false,
            minAppVersion: '1.0.0'
        });
        plugin.app = mockApp;
        plugin.settings = {
            ...mockSettings
        };
        plugin.settings._firstLaunch = false;
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
        plugin.registerView = jest.fn();
        plugin.registerEvent = jest.fn();
        plugin.addRibbonIcon = jest.fn(() => ({
            setAttribute: jest.fn()
        })) as any;
        plugin.addStatusBarItem = jest.fn(() => ({
            setText: jest.fn(),
            empty: jest.fn()
        })) as any;
        plugin.addSettingTab = jest.fn();
        plugin.getReporter = jest.fn(() => reporter);
        reporter = createReporter();
        (mockApp.workspace.getLeaf as any) = jest.fn(() => ({ openFile: jest.fn() }));
        file = {
            name: 'Topic.md',
            basename: 'Topic',
            path: 'Notes/Topic.md',
            parent: { path: 'Notes' }
        };
    });

    test('exposes a shared generateDiagramCommand entrypoint for command consolidation', () => {
        expect(typeof (plugin as any).generateDiagramCommand).toBe('function');
    });

    test('keeps summarizeToMermaidCommand as a compatibility alias over the shared diagram command', async () => {
        const sharedSpy = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue(undefined);

        await (plugin as any).summarizeToMermaidCommand(file, reporter);

        expect(sharedSpy).toHaveBeenCalledWith(file, reporter, expect.objectContaining({
            executionMode: 'save-mermaid'
        }));
    });

    test('routes experimental save command through the shared diagram command', async () => {
        const sharedSpy = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue(undefined);

        await (plugin as any).generateExperimentalDiagramCommand(file, reporter);

        expect(sharedSpy).toHaveBeenCalledWith(file, reporter, expect.objectContaining({
            executionMode: 'save-artifact'
        }));
    });

    test('exposes previewDiagramCommand as the canonical preview entrypoint', () => {
        expect(typeof (plugin as any).previewDiagramCommand).toBe('function');
    });

    test('keeps previewExperimentalDiagramCommand as a compatibility alias over previewDiagramCommand', async () => {
        const previewSpy = jest
            .spyOn(plugin as any, 'previewDiagramCommand')
            .mockResolvedValue(undefined);

        await (plugin as any).previewExperimentalDiagramCommand(file, reporter);

        expect(previewSpy).toHaveBeenCalledWith(file, reporter);
    });

    test('shared diagram command shapes operation input before delegating artifact execution', async () => {
        (mockApp.vault.read as jest.Mock).mockResolvedValue('# Topic');
        jest.spyOn(plugin as any, 'executeArtifactDiagramCommand').mockResolvedValue({
            generation: {
                plan: {} as any,
                spec: {} as any,
                artifact: {} as any
            },
            outputPath: 'Notes/Topic_diagram.canvas',
            previewOpened: true
        });
        jest.spyOn(plugin as any, 'getProviderAndModelForTask').mockReturnValue({
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model
        });

        await (plugin as any).generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });

        expect((plugin as any).executeArtifactDiagramCommand).toHaveBeenCalledWith(
            file,
            expect.objectContaining({
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                outputMode: 'artifact',
                compatibilityMode: mockSettings.experimentalDiagramCompatibilityMode
            }),
            mockSettings.providers[0],
            mockSettings.providers[0].model,
            reporter,
            expect.any(String),
            expect.anything(),
            'save-artifact'
        );
    });

    test('shared diagram command applies explicit input overrides for maintainer CLI dispatch', async () => {
        (mockApp.vault.read as jest.Mock).mockResolvedValue('# Topic');
        jest.spyOn(plugin as any, 'executeArtifactDiagramCommand').mockResolvedValue({
            generation: {
                plan: {} as any,
                spec: {} as any,
                artifact: {} as any
            },
            outputPath: 'Notes/Topic_diagram.md',
            previewOpened: true
        });
        jest.spyOn(plugin as any, 'getProviderAndModelForTask').mockReturnValue({
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model
        });

        await (plugin as any).generateDiagramCommand(file, reporter, {
            executionMode: 'save-artifact',
            inputOverrides: {
                requestedIntent: 'erDiagram',
                compatibilityMode: 'best-fit',
                targetLanguage: 'zh-CN'
            }
        });

        expect((plugin as any).executeArtifactDiagramCommand).toHaveBeenCalledWith(
            file,
            expect.objectContaining({
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                requestedIntent: 'erDiagram',
                compatibilityMode: 'best-fit',
                targetLanguage: 'zh-CN',
                outputMode: 'artifact'
            }),
            mockSettings.providers[0],
            mockSettings.providers[0].model,
            reporter,
            expect.any(String),
            expect.anything(),
            'save-artifact'
        );
    });

    test('generateDiagramForPathCommand accepts pdf input when developer relaxed input mode is enabled', async () => {
        plugin.settings.enableDeveloperMode = true;
        plugin.settings.enableRelaxedInputFileTypes = true;
        const pdfFile = {
            name: 'Topic.pdf',
            basename: 'Topic',
            path: 'Docs/Topic.pdf',
            extension: 'pdf',
            parent: { path: 'Docs' }
        };
        (mockApp.vault.getFileByPath as jest.Mock).mockReturnValue(pdfFile);
        const generateSpy = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue({ outputPath: 'Docs/Topic_diagram.canvas' });

        await (plugin as any).generateDiagramForPathCommand('Docs/Topic.pdf', reporter, {
            executionMode: 'save-artifact'
        });

        expect(plugin.loadSettings).toHaveBeenCalled();
        expect(generateSpy).toHaveBeenCalledWith(pdfFile, reporter, expect.objectContaining({
            executionMode: 'save-artifact'
        }));
    });

    test('artifact execution injects local knowledge context when diagram retrieval is enabled', async () => {
        plugin.settings.enableLocalKnowledgeRetrieval = true;
        plugin.settings.enableLocalKnowledgeForDiagramGeneration = true;
        const buildContextDetails = jest.fn(() => ({
            query: 'index',
            context: 'Path: Knowledge/Reference.md\nExcerpt: Deployment topology.',
            indexedFileCount: 1,
            indexedSectionCount: 1,
            matchedSectionCount: 1,
            returnedHitCount: 1,
            expandedSectionCount: 1,
            sourcePaths: ['Knowledge/Reference.md'],
            usedSlidingWindowSize: 0,
            requestedTopK: 1,
            indexBuildMs: 5,
            queryMs: 2,
            contextCharCount: 55,
            excludeCurrentFileApplied: true,
            excludedCurrentFileHitCount: 0
        }));
        jest.spyOn(localKnowledgeBase, 'buildLocalKnowledgeBaseRetriever').mockResolvedValue({
            indexedFileCount: 1,
            indexedSectionCount: 1,
            buildContextDetails
        } as any);
        const executionSpy = jest.spyOn(diagramCommandExecution, 'runArtifactDiagramExecutionWithHost').mockResolvedValue({
            generation: {
                plan: {} as any,
                spec: {} as any,
                artifact: {} as any
            },
            followThrough: {
                kind: 'save-artifact',
                previewOpened: false,
                autoFixAttempted: false,
                artifactTarget: 'mermaid'
            },
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval: {
                indexedFileCount: 1,
                indexedSectionCount: 1,
                matchedSectionCount: 1,
                returnedHitCount: 1,
                expandedSectionCount: 1,
                sourcePaths: ['Knowledge/Reference.md'],
                usedSlidingWindowSize: 0,
                requestedTopK: 1,
                indexBuildMs: 5,
                queryMs: 2,
                contextCharCount: 55,
                excludeCurrentFileApplied: true,
                excludedCurrentFileHitCount: 0
            },
            previewOpened: false
        });

        const result = await (plugin as any).executeArtifactDiagramCommand(
            file,
            {
                sourcePath: file.path,
                sourceMarkdown: '# Topic\n\nDeployment topology and failure handling.',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            mockSettings.providers[0],
            mockSettings.providers[0].model,
            reporter,
            'Generate diagram',
            (plugin as any).getUiStrings(),
            'save-artifact'
        );

        expect(executionSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                operationInput: expect.objectContaining({
                    localKnowledgeContext: 'Path: Knowledge/Reference.md\nExcerpt: Deployment topology.'
                })
            })
        );
        expect(buildContextDetails).toHaveBeenCalledWith(
            expect.stringContaining('Topic'),
            expect.objectContaining({
                currentFilePath: 'Notes/Topic.md',
                topK: mockSettings.localKnowledgeTopK,
                slidingWindowSize: mockSettings.localKnowledgeSlidingWindowSize
            })
        );
        expect(localKnowledgeBase.buildLocalKnowledgeBaseRetriever).toHaveBeenCalledWith(
            mockApp,
            plugin.settings,
            reporter,
            'diagramGeneration'
        );
        expect(result).toEqual(expect.objectContaining({
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval: expect.objectContaining({
                returnedHitCount: 1,
                sourcePaths: ['Knowledge/Reference.md'],
                indexBuildMs: 5,
                queryMs: 2
            })
        }));
    });

    test('generate command delegates busy and orchestration to extracted diagram host adapter wrapper', async () => {
        const commandSpy = jest
            .spyOn(diagramCommandHostAdapter, 'runGenerateDiagramCommandWithHost')
            .mockResolvedValue({
                kind: 'success',
                executionMode: 'save-artifact',
                sourcePath: 'Notes/Topic.md',
                actionLabel: 'Generate diagram',
                operationInput: {
                    sourcePath: 'Notes/Topic.md',
                    sourceMarkdown: '# Topic',
                    compatibilityMode: 'best-fit',
                    outputMode: 'artifact'
                },
                generation: {
                    plan: {} as any,
                    spec: {} as any,
                    artifact: {} as any
                },
                localKnowledgeContextUsed: false,
                localKnowledgeRetrieval: {
                    indexedFileCount: 0,
                    indexedSectionCount: 0,
                    matchedSectionCount: 0,
                    returnedHitCount: 0,
                    expandedSectionCount: 0,
                    sourcePaths: [],
                    usedSlidingWindowSize: 0,
                    requestedTopK: 0,
                    indexBuildMs: 0,
                    queryMs: 0,
                    contextCharCount: 0,
                    excludeCurrentFileApplied: false,
                    excludedCurrentFileHitCount: 0
                },
                outputPath: 'Notes/Topic_diagram.canvas',
                previewOpened: true
            } as any);

        await (plugin as any).generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });

        expect(commandSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                getReporter: expect.any(Function),
                isBusy: expect.any(Function),
                setBusy: expect.any(Function),
                startReporterAction: expect.any(Function),
                createDiagramHostAdapter: expect.any(Function),
                executeArtifactCommand: expect.any(Function)
            }),
            file,
            reporter,
            { executionMode: 'save-artifact' }
        );
    });

    test('artifact execution delegates to extracted diagram generate operation module', async () => {
        const runSpy = jest.spyOn(diagramCommandExecution, 'runArtifactDiagramExecutionWithHost').mockResolvedValue({
            generation: {
                plan: {
                    intent: 'flowchart',
                    confidence: 1,
                    reasons: [],
                    renderTarget: 'mermaid',
                    fallbackTargets: [],
                    mermaidDiagramType: 'flowchart',
                    legacyCompatibilityMode: false
                },
                spec: {
                    intent: 'flowchart',
                    title: 'Topic',
                    nodes: []
                },
                artifact: {
                    target: 'mermaid',
                    content: 'graph TD',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'flowchart'
                }
            } as any,
            followThrough: {
                kind: 'save-artifact',
                outputPath: 'Notes/Topic_diagram.md',
                previewOpened: true,
                autoFixAttempted: false,
                artifactTarget: 'mermaid'
            },
            localKnowledgeContextUsed: false,
            localKnowledgeRetrieval: {
                indexedFileCount: 0,
                indexedSectionCount: 0,
                matchedSectionCount: 0,
                returnedHitCount: 0,
                expandedSectionCount: 0,
                sourcePaths: [],
                usedSlidingWindowSize: 0,
                requestedTopK: 0,
                indexBuildMs: 0,
                queryMs: 0,
                contextCharCount: 0,
                excludeCurrentFileApplied: false,
                excludedCurrentFileHitCount: 0
            },
            outputPath: 'Notes/Topic_diagram.md',
            previewOpened: true
        });

        await (plugin as any).executeArtifactDiagramCommand(
            file,
            {
                sourcePath: file.path,
                sourceMarkdown: '# Topic',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact'
            },
            mockSettings.providers[0],
            mockSettings.providers[0].model,
            reporter,
            'Generate diagram',
            (plugin as any).getUiStrings(),
            'save-artifact'
        );

        expect(runSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                operationInput: expect.objectContaining({ outputMode: 'artifact' }),
                provider: mockSettings.providers[0],
                modelName: mockSettings.providers[0].model,
                executionMode: 'save-artifact'
            })
        );
    });

    test('mermaid save execution delegates host side effects to extracted diagram host adapter module', async () => {
        jest.spyOn(diagramGenerateOperation, 'runDiagramGenerateOperation').mockResolvedValue({
            artifact: {
                target: 'mermaid',
                content: 'graph TD',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            }
        } as any);
        const completeSpy = jest
            .spyOn(diagramCommandHostAdapter, 'completeMermaidDiagramCommand')
            .mockResolvedValue('Notes/Topic_diagram.md');

        await (plugin as any).executeSaveMermaidDiagramCommand(
            file,
            {
                sourcePath: file.path,
                sourceMarkdown: '# Topic',
                compatibilityMode: 'legacy-mermaid',
                outputMode: 'mermaid'
            },
            mockSettings.providers[0],
            mockSettings.providers[0].model,
            reporter,
            'Summarise as Mermaid diagram',
            (plugin as any).getUiStrings()
        );

        expect(completeSpy).toHaveBeenCalledWith(expect.objectContaining({
            file,
            mermaidContent: 'graph TD',
            actionLabel: 'Summarise as Mermaid diagram'
        }));
    });

    test('canonical preview command reads vega-lite from file without calling generateDiagramCommand', async () => {
        const sharedSpy = jest.spyOn(plugin as any, 'generateDiagramCommand');
        const previewSpy = jest
            .spyOn(diagramCommandHostAdapter, 'runPreviewDiagramCommandWithHost')
            .mockResolvedValue({
                kind: 'success',
                sourcePath: 'Notes/Topic.md',
                actionLabel: 'Preview diagram',
                artifact: {
                    target: 'vega-lite',
                    content: '{"mark":"bar"}',
                    mimeType: 'application/json',
                    sourceIntent: 'dataChart'
                },
                previewOpened: true
            } as any);

        await (plugin as any).previewDiagramCommand(file, reporter);

        expect(sharedSpy).not.toHaveBeenCalled();
        expect(previewSpy).toHaveBeenCalled();
    });

    test('canonical preview command delegates lifecycle and preview orchestration to extracted diagram host adapter wrapper', async () => {
        const commandSpy = jest
            .spyOn(diagramCommandHostAdapter, 'runPreviewDiagramCommandWithHost')
            .mockResolvedValue({
                kind: 'success',
                sourcePath: 'Notes/Topic.md',
                actionLabel: 'Preview diagram',
                artifact: {
                    target: 'vega-lite',
                    content: '{"mark":"bar"}',
                    mimeType: 'application/json',
                    sourceIntent: 'dataChart'
                },
                previewOpened: true
            } as any);

        await (plugin as any).previewDiagramCommand(file, reporter);

        expect(commandSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                startReporterAction: expect.any(Function),
                finalizeReporter: expect.any(Function),
                createDiagramHostAdapter: expect.any(Function),
                saveErrorLog: expect.any(Function)
            }),
            file,
            reporter
        );
    });

    test('diagram host adapter preview entry delegates to openDiagramPreviewModal', () => {
        const previewSpy = jest.spyOn(plugin as any, 'openDiagramPreviewModal').mockImplementation(() => undefined);
        const adapter = (plugin as any).createDiagramCommandHostAdapter();
        const artifact = {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        } as any;

        adapter.openPreview(artifact, 'Notes/Topic_diagram.canvas', true);

        expect(previewSpy).toHaveBeenCalledWith(artifact, 'Notes/Topic_diagram.canvas', true);
    });

    test('exposes canonical stable diagram command ids alongside legacy compatibility aliases', async () => {
        const commandCalls: Array<{ id: string; name: string }> = [];
        plugin.addCommand = jest.fn((command: any) => {
            commandCalls.push({ id: command.id, name: command.name });
        }) as any;

        await plugin.onload();

        const ids = commandCalls.map(command => command.id);
        expect(ids).toContain('notemd-generate-diagram');
        expect(ids).toContain('notemd-preview-diagram');
        expect(ids).toContain('notemd-summarize-as-mermaid');
        expect(ids).toContain('notemd-generate-experimental-diagram');
        expect(ids).toContain('notemd-preview-experimental-diagram');
    });

    test('canonical preview command stays available for supported saved artifact files', async () => {
        const commandCalls: any[] = [];
        plugin.addCommand = jest.fn((command: any) => {
            commandCalls.push(command);
        }) as any;
        const previewSpy = jest.spyOn(plugin as any, 'previewDiagramCommand').mockResolvedValue(undefined);
        const canvasFile = {
            name: 'Topic_diagram.canvas',
            basename: 'Topic_diagram',
            path: 'Notes/Topic_diagram.canvas',
            extension: 'canvas',
            parent: { path: 'Notes' }
        };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(canvasFile);

        await plugin.onload();

        const previewCommand = commandCalls.find(command => command.id === 'notemd-preview-diagram');
        expect(previewCommand).toBeDefined();
        expect(previewCommand.checkCallback(true)).toBe(true);

        previewCommand.checkCallback(false);
        await Promise.resolve();

        expect(previewSpy).toHaveBeenCalledWith(canvasFile, expect.anything());
    });

    test('canonical preview command stays available for saved circuitikz tex artifacts', async () => {
        const commandCalls: any[] = [];
        plugin.addCommand = jest.fn((command: any) => {
            commandCalls.push(command);
        }) as any;
        const previewSpy = jest.spyOn(plugin as any, 'previewDiagramCommand').mockResolvedValue(undefined);
        const circuitFile = {
            name: 'Inverter_diagram.tex',
            basename: 'Inverter_diagram',
            path: 'Notes/Inverter_diagram.tex',
            extension: 'tex',
            parent: { path: 'Notes' }
        };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(circuitFile);

        await plugin.onload();

        const previewCommand = commandCalls.find(command => command.id === 'notemd-preview-diagram');
        expect(previewCommand).toBeDefined();
        expect(previewCommand.checkCallback(true)).toBe(true);

        previewCommand.checkCallback(false);
        await Promise.resolve();

        expect(previewSpy).toHaveBeenCalledWith(circuitFile, expect.anything());
    });

    test.each([
        ['Draw.io', 'Architecture_diagram.drawio', 'drawio'],
        ['Drawnix', 'Architecture_diagram.drawnix', 'drawnix']
    ])('canonical preview command stays available for saved %s artifacts', async (_label, name, extension) => {
        const commandCalls: any[] = [];
        plugin.addCommand = jest.fn((command: any) => {
            commandCalls.push(command);
        }) as any;
        const previewSpy = jest.spyOn(plugin as any, 'previewDiagramCommand').mockResolvedValue(undefined);
        const artifactFile = {
            name,
            basename: name.replace(/\.[^.]+$/, ''),
            path: `Notes/${name}`,
            extension,
            parent: { path: 'Notes' }
        };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(artifactFile);

        await plugin.onload();

        const previewCommand = commandCalls.find(command => command.id === 'notemd-preview-diagram');
        expect(previewCommand).toBeDefined();
        expect(previewCommand.checkCallback(true)).toBe(true);

        previewCommand.checkCallback(false);
        await Promise.resolve();

        expect(previewSpy).toHaveBeenCalledWith(artifactFile, expect.anything());
    });

    test('canonical generate command delegates to the canonical save flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue(undefined);
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue({
            ...file,
            extension: 'md'
        });
        plugin.addCommand = jest.fn((command: any) => {
            if (command.id === 'notemd-generate-diagram') {
                command.checkCallback(false);
            }
        }) as any;

        plugin.onload();
        await Promise.resolve();

        expect(canonicalCall).toHaveBeenCalledWith(
            expect.objectContaining({
                path: file.path,
                extension: 'md'
            }),
            expect.anything(),
            expect.objectContaining({ executionMode: 'save-artifact' })
        );
    });

    test('canonical preview command delegates to the canonical preview flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'previewDiagramCommand')
            .mockResolvedValue(undefined);
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue({
            ...file,
            extension: 'md'
        });
        plugin.addCommand = jest.fn((command: any) => {
            if (command.id === 'notemd-preview-diagram') {
                command.checkCallback(false);
            }
        }) as any;

        plugin.onload();
        await Promise.resolve();

        expect(canonicalCall).toHaveBeenCalledWith(
            expect.objectContaining({
                path: file.path,
                extension: 'md'
            }),
            expect.anything()
        );
    });
});
