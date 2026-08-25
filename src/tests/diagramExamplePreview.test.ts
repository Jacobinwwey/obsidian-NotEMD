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

class PreviewElement {
    children: PreviewElement[] = [];
    attrs = new Map<string, string>();
    text = '';
    innerHTML = '';
    clientWidth = 320;
    parent: PreviewElement | null = null;
    constructor(public tag = 'div') {}
    cls = '';
    createDiv(options?: { cls?: string }): PreviewElement {
        return this.createEl('div', options);
    }
    createEl(tag: string, options?: { text?: string; cls?: string }): PreviewElement {
        const child = new PreviewElement(tag);
        child.parent = this;
        child.text = options?.text ?? '';
        child.cls = options?.cls ?? '';
        this.children.push(child);
        return child;
    }
    empty(): void { this.children = []; this.text = ''; this.innerHTML = ''; }
    setAttr(name: string, value: string): void { this.attrs.set(name, value); }
    setAttribute(name: string, value: string): void { this.attrs.set(name, value); }
    setText(value: string): void { this.text = value; }
    remove(): void { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    querySelector(selector: string): PreviewElement | null {
        if (selector === 'svg') {
            return this.children.find(child => child.tag === 'svg') ?? (this.innerHTML.includes('<svg')
                ? {
                    viewBox: { baseVal: { width: 880, height: 532 } },
                    classList: { add: jest.fn() },
                    style: {},
                    setAttribute: jest.fn()
                } as unknown as PreviewElement
                : null);
        }
        return null;
    }
}

describe('diagram type preview panel', () => {
    const copy = {
        intentMindmap: 'Mindmap', intentDrawnixKnowledgeMap: 'Drawnix map', intentFlowchart: 'Flowchart',
        intentSequence: 'Sequence', intentClassDiagram: 'Class diagram', intentErDiagram: 'ER diagram',
        intentStateDiagram: 'State diagram', intentCanvasMap: 'Canvas map', intentCircuit: 'Circuit',
        intentDataChart: 'Data chart', intentRadar: 'Radar', intentOrgChart: 'Org chart', intentTimeline: 'Timeline',
        intentSwimlane: 'Swimlane', intentQuadrant: 'Quadrant', title: 'Preview', empty: 'Choose a type',
        loading: 'Loading', unavailable: 'Unavailable', failed: 'Failed', previewOverflowHint: 'Scroll', targetPrefix: 'Target', formatsPrefix: 'Formats'
    };

    test('progressively discloses one production-rendered preview and ignores stale requests', async () => {
        const { renderDiagramTypePreviewPanel } = await import('../ui/diagramTypePreviewPanel');
        const root = new PreviewElement();
        let resolveFirst: ((value: string) => void) | undefined;
        const renderThumbnail = jest.fn((typeId: string) => {
            if (typeId === 'flowchart') {
                return new Promise<string>(resolve => { resolveFirst = resolve; });
            }
            return Promise.resolve('<svg viewBox="0 0 100 60"><rect width="100" height="60" fill="none" /><title>Sequence</title></svg>');
        });
        const controller = renderDiagramTypePreviewPanel({ parent: root as unknown as HTMLElement, copy, renderThumbnail });
        const panel = root.children[0];
        const canvas = panel.children[2];
        expect(canvas.attrs.get('data-preview-state')).toBe('empty');
        controller.setSelectedType('flowchart');
        expect(canvas.attrs.get('data-preview-state')).toBe('loading');
        controller.setSelectedType('sequence');
        await Promise.resolve();
        await Promise.resolve();
        expect(canvas.attrs.get('data-preview-state')).toBe('ready');
        expect(canvas.innerHTML).toContain('<svg viewBox="0 0 100 60">');
        resolveFirst?.('<svg viewBox="0 0 100 60"><rect width="100" height="60" fill="none" /><title>stale</title></svg>');
        await Promise.resolve();
        expect(canvas.innerHTML).not.toContain('stale');
        expect(canvas.attrs.get('aria-busy')).toBe('false');
        controller.destroy();
    });

    test('reports unavailable and failed renderer states without adding reference controls', async () => {
        const { renderDiagramTypePreviewPanel } = await import('../ui/diagramTypePreviewPanel');
        const root = new PreviewElement();
        const controller = renderDiagramTypePreviewPanel({
            parent: root as unknown as HTMLElement,
            copy,
            renderThumbnail: jest.fn().mockResolvedValue(undefined)
        });
        const canvas = root.children[0].children[2];
        controller.setSelectedType('flowchart');
        await Promise.resolve();
        expect(canvas.attrs.get('data-preview-state')).toBe('unavailable');
        expect(root.children[0].children.some(child => child.tag === 'img')).toBe(false);
        controller.setSelectedType('sequence');
        const failing = renderDiagramTypePreviewPanel({
            parent: root as unknown as HTMLElement,
            copy,
            renderThumbnail: jest.fn().mockRejectedValue(new Error('renderer failed'))
        });
        failing.setSelectedType('sequence');
        await Promise.resolve();
        await Promise.resolve();
        expect(root.children[1].children[2].attrs.get('data-preview-state')).toBe('error');
    });

    test('marks native previews for intrinsic aspect-ratio sizing', async () => {
        const { renderDiagramTypePreviewPanel } = await import('../ui/diagramTypePreviewPanel');
        const root = new PreviewElement();
        const controller = renderDiagramTypePreviewPanel({
            parent: root as unknown as HTMLElement,
            copy,
            renderThumbnail: jest.fn().mockResolvedValue('<svg viewBox="0 0 880 532"><rect width="880" height="532" fill="none" /><title>Matrix</title></svg>')
        });

        controller.setSelectedType('access-matrix');
        await Promise.resolve();
        await Promise.resolve();

        const canvas = root.children[0].children[2];
        expect(canvas.innerHTML).toContain('viewBox="0 0 880 532"');
        expect(canvas.attrs.get('data-preview-aspect-ratio')).toBe('880/532');
        controller.destroy();
    });

    test('surfaces the horizontal-scroll hint when a preview exceeds the host width', async () => {
        const { renderDiagramTypePreviewPanel } = await import('../ui/diagramTypePreviewPanel');
        const root = new PreviewElement();
        const controller = renderDiagramTypePreviewPanel({
            parent: root as unknown as HTMLElement,
            copy,
            renderThumbnail: jest.fn().mockResolvedValue('<svg viewBox="0 0 880 532"><rect width="880" height="532" /></svg>')
        });

        controller.setSelectedType('access-matrix');
        await Promise.resolve();
        await Promise.resolve();

        const canvas = root.children[0].children[2];
        expect(canvas.children.some(child => child.cls.includes('notemd-diagram-type-preview-overflow-hint'))).toBe(true);
        controller.destroy();
    });
});
