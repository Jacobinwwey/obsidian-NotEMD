import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

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
        reporter = createReporter();
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

    test('routes experimental preview command through the shared diagram command', async () => {
        const sharedSpy = jest
            .spyOn(plugin as any, 'generateDiagramCommand')
            .mockResolvedValue(undefined);

        await (plugin as any).previewExperimentalDiagramCommand(file, reporter);

        expect(sharedSpy).toHaveBeenCalledWith(file, reporter, expect.objectContaining({
            executionMode: 'preview-artifact'
        }));
    });
});
