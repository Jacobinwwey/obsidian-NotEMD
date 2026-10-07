import { loadPdfJs } from 'obsidian';
import { BinaryDiagramPreviewModal } from '../ui/BinaryDiagramPreviewModal';
import { DiagramPreviewViewport } from '../ui/DiagramPreviewViewport';

jest.mock('../ui/DiagramPreviewViewport', () => ({ DiagramPreviewViewport: jest.fn().mockImplementation((container: any) => {
    const contentEl = container.ownerDocument.createElement('div');
    container.appendChild(contentEl);
    return { contentEl, setSourceDimensions: jest.fn(), subscribeGeometry: jest.fn(() => jest.fn()), destroy: jest.fn() };
}) }));

beforeEach(() => jest.clearAllMocks());

function viewports(): Array<{ contentEl: any; setSourceDimensions: jest.Mock; destroy: jest.Mock }> {
    return (DiagramPreviewViewport as jest.Mock).mock.results.map(result => result.value);
}

function element(tag = 'div'): any {
    const children: any[] = [];
    return {
        tag, children, ownerDocument: { createElement: element },
        classList: { add: jest.fn() }, style: { setProperty: jest.fn() },
        appendChild: (child: any) => children.push(child), replaceChildren: () => children.splice(0),
        querySelectorAll: () => children.flatMap(child => child.tag === 'canvas' ? [child] : child.querySelectorAll()),
        getContext: () => ({}),
        set src(_url: string) { queueMicrotask(() => this.onerror?.()); },
    };
}

function modal(extension = 'pdf') {
    const preview = new BinaryDiagramPreviewModal({} as any, { extension, name: `test.${extension}`, path: `test.${extension}` } as any, new Uint8Array([1]), 'en');
    Object.assign(preview, { contentEl: element(), modalEl: element(), open: () => preview.onOpen(), close: () => preview.onClose() });
    return preview;
}

function pdfFixture() {
    const destroy = jest.fn(async () => {});
    const cancel = jest.fn();
    const pages = [{ width: 100, height: 200 }, { width: 200, height: 100 }].map(dimensions => ({
        getViewport: ({ scale }: any) => ({ width: dimensions.width * scale, height: dimensions.height * scale }),
        render: jest.fn(() => ({ promise: Promise.resolve(), cancel })),
        getTextContent: jest.fn(async () => ({ items: [{ str: 'Selectable text' }] })), cleanup: jest.fn(),
    }));
    const renderTextLayer = jest.fn((_parameters: unknown) => ({ promise: Promise.resolve(), cancel: jest.fn() }));
    const pdf = { numPages: pages.length, getPage: jest.fn(async (number: number) => pages[number - 1]) };
    (loadPdfJs as jest.Mock).mockResolvedValue({ getDocument: () => ({ promise: Promise.resolve(pdf), destroy }), renderTextLayer });
    return { destroy, cancel, page: pages[0], pages, pdf, renderTextLayer };
}

test('renders every PDF page in its own labeled viewport with independent source dimensions', async () => {
    const fixture = pdfFixture();
    const preview = modal();
    await preview.openPreview();
    expect(DiagramPreviewViewport).toHaveBeenCalledTimes(2);
    const pageViewports = viewports();
    expect(pageViewports[0].setSourceDimensions.mock.calls).toEqual([[100, 200]]);
    expect(pageViewports[1].setSourceDimensions.mock.calls).toEqual([[200, 100]]);
    for (const viewport of pageViewports) {
        expect(viewport.contentEl.children).toHaveLength(1);
        expect(viewport.contentEl.children[0].className).toBe('notemd-pdf-page');
    }
    const panels = (preview.contentEl as any).children.find((child: any) => child.className?.includes('notemd-diagram-preview-panels'));
    expect(panels.className).toContain('notemd-diagram-preview-scroll-region');
    expect(panels.children).toHaveLength(2);
    expect(panels.children.map((panel: any) => panel.children[0].textContent)).toEqual(['Diagram 1 of 2', 'Diagram 2 of 2']);
    expect(fixture.pdf.getPage.mock.calls).toEqual([[1], [2]]);
    expect(fixture.renderTextLayer).toHaveBeenCalledTimes(2);
    expect(fixture.page.render).toHaveBeenCalledWith(expect.objectContaining({ intent: 'print' }));
    expect(fixture.renderTextLayer.mock.calls[0][0]).toMatchObject({ textContentSource: { items: [{ str: 'Selectable text' }] } });
    fixture.pages.forEach(page => expect(page.cleanup).not.toHaveBeenCalled());
    const canvases = preview.contentEl.querySelectorAll('canvas');
    preview.onClose();
    fixture.pages.forEach(page => expect(page.cleanup).toHaveBeenCalledTimes(1));
    pageViewports.forEach(viewport => expect(viewport.destroy).toHaveBeenCalledTimes(1));
    canvases.forEach(canvas => { expect(canvas.width).toBe(0); expect(canvas.height).toBe(0); });
    expect(fixture.destroy).toHaveBeenCalledTimes(1);
});

test('failure in a later PDF page destroys every created viewport and clears its canvases', async () => {
    const fixture = pdfFixture();
    fixture.pages[1].getTextContent.mockRejectedValueOnce(new Error('Broken page text'));
    const preview = modal();
    await expect(preview.openPreview()).rejects.toThrow('Broken page text');
    expect(DiagramPreviewViewport).toHaveBeenCalledTimes(2);
    viewports().forEach(viewport => {
        expect(viewport.destroy).toHaveBeenCalledTimes(1);
        viewport.contentEl.querySelectorAll('canvas').forEach((canvas: any) => {
            expect(canvas.width).toBe(0);
            expect(canvas.height).toBe(0);
        });
    });
    fixture.pages.forEach(page => expect(page.cleanup).toHaveBeenCalledTimes(1));
    expect(fixture.destroy).toHaveBeenCalledTimes(1);
    expect((preview.contentEl as any).children).toHaveLength(0);
});

test('very wide PDF pages respect the canvas side limit while retaining original text coordinates', async () => {
    const fixture = pdfFixture();
    fixture.page.getViewport = ({ scale }: any) => ({ width: 1_000_000 * scale, height: 100 * scale });
    const preview = modal();
    await preview.openPreview();
    const canvas = preview.contentEl.querySelectorAll('canvas')[0];
    expect(canvas.width).toBeLessThanOrEqual(8192);
    expect(canvas.height).toBeGreaterThan(0);
    expect(viewports()[0].setSourceDimensions).toHaveBeenCalledWith(1_000_000, 100);
    expect(fixture.renderTextLayer.mock.calls[0][0]).toMatchObject({ viewport: { width: 1_000_000, height: 100 } });
    preview.onClose();
});

test('reports malformed PDF decoding and destroys the failed loading task', async () => {
    const destroy = jest.fn(async () => {});
    (loadPdfJs as jest.Mock).mockResolvedValue({ getDocument: () => ({ promise: Promise.reject(new Error('Malformed PDF')), destroy }) });
    await expect(modal().openPreview()).rejects.toThrow('Malformed PDF');
    expect(destroy).toHaveBeenCalledTimes(1);
});

test('close cancels an active PDF render and prevents subsequent pages', async () => {
    const fixture = pdfFixture();
    let rejectRender: (error: Error) => void = () => {};
    const pending = new Promise<void>((_, reject) => { rejectRender = reject; });
    fixture.page.render.mockReturnValue({ promise: pending, cancel: jest.fn(() => rejectRender(new Error('Rendering cancelled'))) });
    const preview = modal();
    const opening = preview.openPreview();
    await new Promise(resolve => setImmediate(resolve));
    preview.onClose();
    await expect(opening).rejects.toThrow('Rendering cancelled');
    expect(fixture.pdf.getPage).toHaveBeenCalledTimes(1);
    expect(fixture.destroy).toHaveBeenCalledTimes(1);
    expect(DiagramPreviewViewport).toHaveBeenCalledTimes(1);
    expect(viewports()[0].destroy).toHaveBeenCalledTimes(1);
});

test('PNG retains one viewport using the decoded image dimensions', async () => {
    const create = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const preview = modal('png');
    (preview.contentEl as any).ownerDocument.createElement = (tag: string) => {
        const node = element(tag);
        if (tag === 'img') {
            node.naturalWidth = 640;
            node.naturalHeight = 480;
            Object.defineProperty(node, 'src', { set: () => queueMicrotask(() => node.onload?.()) });
        }
        return node;
    };
    try {
        await preview.openPreview();
        expect(DiagramPreviewViewport).toHaveBeenCalledTimes(1);
        expect(viewports()[0].setSourceDimensions).toHaveBeenCalledWith(640, 480);
        expect(viewports()[0].contentEl.children[0].tag).toBe('img');
        preview.onClose();
        expect(viewports()[0].destroy).toHaveBeenCalledTimes(1);
        expect(revoke).toHaveBeenCalledWith('blob:test');
    } finally {
        create.mockRestore(); revoke.mockRestore();
    }
});

test('malformed PNG decode rejects and releases its object URL', async () => {
    const create = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    await expect(modal('png').openPreview()).rejects.toThrow('Unable to decode PNG');
    expect(revoke).toHaveBeenCalledWith('blob:test');
    create.mockRestore(); revoke.mockRestore();
});
