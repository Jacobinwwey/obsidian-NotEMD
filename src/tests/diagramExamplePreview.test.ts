const mockRender = jest.fn();
const mockCreateDefaultRendererService = jest.fn(() => ({ render: mockRender }));
const mockCreateSession = jest.fn(() => ({ htmlSrcdoc: '<html></html>', payload: {} }));
const mockModalOpen = jest.fn();

jest.mock('../diagram/diagramGenerationService', () => ({
    createDefaultDiagramRendererService: mockCreateDefaultRendererService
}));

jest.mock('../rendering/host/iframeRenderHost', () => ({
    IframeRenderHost: jest.fn().mockImplementation(() => ({
        createSession: mockCreateSession
    }))
}));

jest.mock('../ui/DiagramPreviewModal', () => ({
    DiagramPreviewModal: jest.fn().mockImplementation(() => ({
        open: mockModalOpen
    }))
}));

import NotemdPlugin from '../main';
import { DiagramPreviewModal } from '../ui/DiagramPreviewModal';
import { createDrawnixKnowledgeMapReplayRecord } from '../diagram/adapters/drawnix/drawnixExporter';

describe('diagram example preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRender.mockResolvedValue({
            target: 'drawnix',
            content: '{"type":"drawnix"}',
            mimeType: 'application/json',
            sourceIntent: 'drawnixMindmap'
        });
    });

    test('renders a catalog example into an ephemeral preview without saving or generating', async () => {
        const plugin = Object.create(NotemdPlugin.prototype) as NotemdPlugin;
        (plugin as any).app = {};
        (plugin as any).settings = { uiLocale: 'en', diagramPreviewExportPpi: 300 };
        (plugin as any).saveSettings = jest.fn();
        (plugin as any).generateDiagramCommand = jest.fn();

        await plugin.openDiagramExamplePreview('drawnix-knowledge-map');

        expect(mockCreateDefaultRendererService).toHaveBeenCalledTimes(1);
        expect(mockRender).toHaveBeenCalledWith(
            expect.objectContaining({ intent: 'drawnixMindmap' }),
            { target: 'drawnix' }
        );
        expect(mockCreateSession).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'drawnix' }),
            { previewTitle: 'Diagram delivery architecture' }
        );
        expect(mockModalOpen).toHaveBeenCalledTimes(1);
        expect((plugin as any).saveSettings).not.toHaveBeenCalled();
        expect((plugin as any).generateDiagramCommand).not.toHaveBeenCalled();
    });

    test('replays a Drawnix board into presentation delivery without invoking an LLM', async () => {
        const semanticSpec = {
            intent: 'drawnixMindmap' as const,
            title: 'Replayable architecture',
            nodes: [{ id: 'root', label: 'Root' }]
        };
        const replay = createDrawnixKnowledgeMapReplayRecord(semanticSpec);
        const plugin = Object.create(NotemdPlugin.prototype) as NotemdPlugin;
        (plugin as any).app = {};
        (plugin as any).settings = { uiLocale: 'en', diagramPreviewExportPpi: 300 };
        (plugin as any).createDiagramHistoryStore = jest.fn(() => ({
            recordCompleted: jest.fn().mockResolvedValue(undefined)
        }));
        (plugin as any).generateDiagramCommand = jest.fn();

        (plugin as any).openDiagramPreviewModal({
            target: 'drawnix',
            content: JSON.stringify({
                type: 'drawnix',
                metadata: {
                    notemd: {
                        version: 1,
                        sourceVisuals: [],
                        knowledgeMap: replay
                    }
                }
            }),
            mimeType: 'application/json',
            sourceIntent: 'drawnixMindmap'
        }, 'Notes/Architecture.md', true);

        const modalOptions = (DiagramPreviewModal as jest.Mock).mock.calls[0]?.[3];
        expect(modalOptions.drawnixAlternateDelivery.label).toBe('Presentation');

        await modalOptions.drawnixAlternateDelivery.loadSession();

        expect(mockRender).toHaveBeenCalledWith(
            semanticSpec,
            { target: 'drawnix', drawnixKnowledgeMapDelivery: 'presentation' }
        );
        expect((plugin as any).generateDiagramCommand).not.toHaveBeenCalled();
    });

    test('replays a Drawnix presentation into the full-board delivery without invoking an LLM', async () => {
        const semanticSpec = {
            intent: 'drawnixMindmap' as const,
            title: 'Replayable architecture',
            nodes: [{ id: 'root', label: 'Root' }]
        };
        const replay = createDrawnixKnowledgeMapReplayRecord(semanticSpec);
        const plugin = Object.create(NotemdPlugin.prototype) as NotemdPlugin;
        (plugin as any).app = {};
        (plugin as any).settings = { uiLocale: 'en', diagramPreviewExportPpi: 300 };
        (plugin as any).createDiagramHistoryStore = jest.fn(() => ({
            recordCompleted: jest.fn().mockResolvedValue(undefined)
        }));
        (plugin as any).generateDiagramCommand = jest.fn();

        (plugin as any).openDiagramPreviewModal({
            target: 'drawnix',
            content: JSON.stringify({
                type: 'drawnix',
                metadata: {
                    notemd: {
                        version: 1,
                        sourceVisuals: [],
                        knowledgeMap: replay
                    }
                }
            }),
            mimeType: 'application/json',
            sourceIntent: 'drawnixMindmap',
            drawnixKnowledgeMapPresentation: {
                version: 1,
                catalogTypeId: 'drawnix-knowledge-map'
            }
        }, 'Notes/Architecture.md', true);

        const modalOptions = (DiagramPreviewModal as jest.Mock).mock.calls[0]?.[3];
        expect(modalOptions.drawnixAlternateDelivery.label).toBe('Full board');

        await modalOptions.drawnixAlternateDelivery.loadSession();

        expect(mockRender).toHaveBeenCalledWith(
            semanticSpec,
            { target: 'drawnix', drawnixKnowledgeMapDelivery: 'full-board' }
        );
        expect((plugin as any).generateDiagramCommand).not.toHaveBeenCalled();
    });
});
