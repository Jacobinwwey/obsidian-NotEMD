import { TFile, TFolder } from 'obsidian';
import { saveDiagramArtifactFile } from '../fileUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
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

describe('saveDiagramArtifactFile', () => {
    const originalFile = {
        basename: 'Source',
        name: 'Source.md',
        path: 'Notes/Source.md',
        parent: { path: 'Notes' }
    } as TFile;

    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.createFolder as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);
    });

    test('saves mermaid artifacts as markdown files', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'mermaid',
            content: '```mermaid\nmindmap\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        }, reporter);

        expect(path).toBe('Notes/Source_summ.md');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Notes/Source_summ.md', '```mermaid\nmindmap\n```');
    });

    test('saves json-canvas artifacts with canvas extension and target-specific suffix', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.canvas');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Notes/Source_diagram.canvas', '{"nodes":[],"edges":[]}');
    });

    test('reuses custom summarize output folder when configured', async () => {
        const reporter = createReporter();
        const settings = {
            ...mockSettings,
            useCustomSummarizeToMermaidSavePath: true,
            summarizeToMermaidSavePath: 'Generated/Diagrams'
        };
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Generated/Diagrams') {
                return Object.assign(new (TFolder as any)(), { path });
            }
            return null;
        });

        const path = await saveDiagramArtifactFile(mockApp, settings, originalFile, {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, reporter);

        expect(path).toBe('Generated/Diagrams/Source_diagram.canvas');
    });
});
