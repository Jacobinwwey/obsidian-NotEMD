import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as diagramGenerationService from '../diagram/diagramGenerationService';
import * as fileUtils from '../fileUtils';
import { DiagramPreviewModal } from '../ui/DiagramPreviewModal';

jest.mock('../ui/DiagramPreviewModal', () => ({
    DiagramPreviewModal: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

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

describe('experimental diagram command', () => {
    let plugin: NotemdPlugin;
    let reporter: ProgressReporter;

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
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        reporter = createReporter();
        (mockApp.vault.read as jest.Mock).mockResolvedValue('# Topic\n\nConcept mapping notes');
        (mockApp.workspace.getLeaf as any) = jest.fn(() => ({ openFile: jest.fn() }));
    });

    test('saves experimental canvas artifact returned by generation service', async () => {
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockResolvedValue({
            plan: {
                intent: 'canvasMap',
                confidence: 0.8,
                reasons: ['spatial note detected'],
                renderTarget: 'json-canvas',
                fallbackTargets: ['mermaid'],
                mermaidDiagramType: null,
                legacyCompatibilityMode: false
            },
            spec: {
                intent: 'canvasMap',
                title: 'Knowledge Map',
                nodes: [{ id: 'root', label: 'Root' }]
            },
            artifact: {
                target: 'json-canvas',
                content: '{"nodes":[],"edges":[]}',
                mimeType: 'application/json',
                sourceIntent: 'canvasMap'
            }
        });
        jest.spyOn(fileUtils, 'saveDiagramArtifactFile').mockResolvedValue('Notes/Topic_diagram.canvas');
        const file = { name: 'Topic.md', basename: 'Topic', path: 'Notes/Topic.md', parent: { path: 'Notes' } } as any;

        await (plugin as any).generateExperimentalDiagramCommand(file, reporter);

        expect(fileUtils.saveDiagramArtifactFile).toHaveBeenCalledWith(
            mockApp,
            plugin.settings,
            file,
            expect.objectContaining({ target: 'json-canvas' }),
            reporter
        );
    });

    test('opens a diagram preview modal for mermaid experimental artifacts', async () => {
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockResolvedValue({
            plan: {
                intent: 'mindmap',
                confidence: 0.9,
                reasons: ['hierarchical note detected'],
                renderTarget: 'mermaid',
                fallbackTargets: [],
                mermaidDiagramType: 'mindmap',
                legacyCompatibilityMode: false
            },
            spec: {
                intent: 'mindmap',
                title: 'Knowledge Map',
                nodes: [{ id: 'root', label: 'Root' }]
            },
            artifact: {
                target: 'mermaid',
                content: '```mermaid\nmindmap\n  root((Topic))\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'mindmap'
            }
        });
        jest.spyOn(fileUtils, 'saveDiagramArtifactFile').mockResolvedValue('Notes/Topic_diagram.md');
        const file = { name: 'Topic.md', basename: 'Topic', path: 'Notes/Topic.md', parent: { path: 'Notes' } } as any;

        await (plugin as any).generateExperimentalDiagramCommand(file, reporter);

        expect(DiagramPreviewModal).toHaveBeenCalledTimes(1);
        expect(DiagramPreviewModal).toHaveBeenCalledWith(
            mockApp,
            expect.objectContaining({
                payload: expect.objectContaining({
                    artifact: expect.objectContaining({ target: 'mermaid' }),
                    sourcePath: 'Notes/Topic_diagram.md'
                })
            }),
            plugin.settings.uiLocale
        );
        const modalInstance = (DiagramPreviewModal as jest.Mock).mock.results[0]?.value;
        expect(modalInstance.open).toHaveBeenCalledTimes(1);
    });
});
