import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as diagramGenerateOperation from '../operations/diagramGenerateOperation';
import * as diagramCommandHostAdapter from '../operations/diagramCommandHostAdapter';
import * as fileUtils from '../fileUtils';

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
        const runSpy = jest.spyOn(diagramGenerateOperation, 'runDiagramGenerateOperation').mockResolvedValue({
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
        } as any);
        jest.spyOn(plugin as any, 'maybeAutoFixMermaidForFile').mockResolvedValue(undefined);
        jest.spyOn(plugin as any, 'openDiagramPreviewModal').mockImplementation(() => undefined);
        const saveSpy = jest.spyOn(fileUtils, 'saveDiagramArtifactFile').mockResolvedValue('Notes/Topic_diagram.md');

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

        expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({
            input: expect.objectContaining({ outputMode: 'artifact' }),
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model
        }));
        expect(saveSpy).toHaveBeenCalled();
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

    test('canonical generate command delegates to the canonical save flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue(undefined);
        plugin.addCommand = jest.fn((command: any) => {
            if (command.id === 'notemd-generate-diagram') {
                command.editorCallback({}, { file } as any);
            }
        }) as any;

        plugin.onload();
        await Promise.resolve();

        expect(canonicalCall).toHaveBeenCalledWith(
            file,
            expect.anything(),
            expect.objectContaining({ executionMode: 'save-artifact' })
        );
    });

    test('canonical preview command delegates to the canonical preview flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'previewDiagramCommand')
            .mockResolvedValue(undefined);
        plugin.addCommand = jest.fn((command: any) => {
            if (command.id === 'notemd-preview-diagram') {
                command.editorCallback({}, { file } as any);
            }
        }) as any;

        plugin.onload();
        await Promise.resolve();

        expect(canonicalCall).toHaveBeenCalledWith(file, expect.anything());
    });
});
