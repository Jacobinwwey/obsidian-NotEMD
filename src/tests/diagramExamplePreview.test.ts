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

    test('renders a catalog example into an ephemeral native-tree preview without saving or generating', async () => {
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
        expect(DiagramPreviewModal).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'en',
            expect.not.objectContaining({ drawnixAlternateDelivery: expect.anything() })
        );
        expect(mockModalOpen).toHaveBeenCalledTimes(1);
        expect((plugin as any).saveSettings).not.toHaveBeenCalled();
        expect((plugin as any).generateDiagramCommand).not.toHaveBeenCalled();
    });
});
