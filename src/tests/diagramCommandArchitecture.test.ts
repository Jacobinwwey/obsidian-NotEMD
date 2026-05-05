import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as diagramGenerateOperation from '../operations/diagramGenerateOperation';
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

    test('shared diagram command shapes operation input before delegating artifact execution', async () => {
        (mockApp.vault.read as jest.Mock).mockResolvedValue('# Topic');
        jest.spyOn(plugin as any, 'executeArtifactDiagramCommand').mockResolvedValue(undefined);
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

    test('preview command reads vega-lite from file without calling generateDiagramCommand', async () => {
        const vlContent = '{"mark":"bar"}';
        const fileContent = '# Test\n\n```vega-lite\n' + vlContent + '\n```\n';
        (mockApp.vault.read as jest.Mock).mockResolvedValue(fileContent);

        const sharedSpy = jest.spyOn(plugin as any, 'generateDiagramCommand');
        const previewSpy = jest.spyOn(plugin as any, 'openDiagramPreviewModal').mockImplementation(() => undefined);

        await (plugin as any).previewExperimentalDiagramCommand(file, reporter);

        // Should NOT call generateDiagramCommand — preview reads directly from file
        expect(sharedSpy).not.toHaveBeenCalled();
        expect(previewSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'vega-lite',
                content: vlContent
            }),
            file.path,
            false
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

    test('canonical generate command delegates to the experimental save flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'generateExperimentalDiagramCommand')
            .mockResolvedValue(undefined);
        plugin.addCommand = jest.fn((command: any) => {
            if (command.id === 'notemd-generate-diagram') {
                command.editorCallback({}, { file } as any);
            }
        }) as any;

        plugin.onload();
        await Promise.resolve();

        expect(canonicalCall).toHaveBeenCalledWith(file, expect.anything());
    });

    test('canonical preview command delegates to the preview flow', async () => {
        const canonicalCall = jest
            .spyOn(plugin as any, 'previewExperimentalDiagramCommand')
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
