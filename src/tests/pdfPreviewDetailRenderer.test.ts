import { PdfPreviewDetailRenderer } from '../ui/PdfPreviewDetailRenderer';
import type { DiagramPreviewGeometry } from '../ui/DiagramPreviewViewport';

function element(): any {
    return { ownerDocument: { createElement: element }, style: {}, children: [] as any[], width: 0, height: 0,
        appendChild(child: any) { this.children.push(child); child.parent = this; },
        remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); },
        getContext: () => ({}),
    };
}

function fixture(renderer = new PdfPreviewDetailRenderer()) {
    const container = element();
    const textLayer = element();
    container.appendChild(textLayer);
    let notify: (geometry: DiagramPreviewGeometry) => void = () => {};
    const unsubscribe = jest.fn();
    const viewport = { subscribeGeometry: (callback: typeof notify) => { notify = callback; return unsubscribe; } };
    const page = { getViewport: jest.fn(({ scale }: { scale: number }) => ({ width: 1000 * scale, height: 2000 * scale })),
        render: jest.fn((_request: Record<string, unknown>) => ({ promise: Promise.resolve(), cancel: jest.fn() })), cleanup: jest.fn() };
    renderer.attachPage(page, container, viewport as any, 1);
    return { renderer, page, container, textLayer, notify: (geometry: DiagramPreviewGeometry) => notify(geometry), unsubscribe };
}

const geometry = (overrides: Partial<DiagramPreviewGeometry> = {}): DiagramPreviewGeometry => ({
    scale: 4, pixelRatio: 2, visibleSource: { left: 200, top: 300, width: 100, height: 80 }, ...overrides,
});

async function settle() { jest.runOnlyPendingTimers(); for (let turn = 0; turn < 10; turn++) await Promise.resolve(); }
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('renders a cropped PDF tile at zoom times DPR without replacing the selectable text layer', async () => {
    const view = fixture();
    view.notify(geometry());
    await settle();
    const request = view.page.render.mock.calls[0]?.[0] as any;
    expect(request).toMatchObject({ viewport: { width: 8000, height: 16000 }, intent: 'print', transform: [1, 0, 0, 1, -1472, -2272] });
    const tile = view.container.children.find((child: any) => child !== view.textLayer);
    expect(tile).toMatchObject({ width: 1056, height: 896, style: { width: '132px', height: '112px', left: '184px', top: '284px', pointerEvents: 'none' } });
    expect(view.container.children[0]).toBe(view.textLayer);
    expect(view.page.cleanup).not.toHaveBeenCalled();
    view.renderer.destroy();
    expect(tile.width).toBe(0);
    expect(view.unsubscribe).toHaveBeenCalledTimes(1);
    expect(view.page.cleanup).toHaveBeenCalledTimes(1);
});

test('offscreen pages allocate no detail canvas and leaving the screen releases an existing tile', async () => {
    const view = fixture();
    view.notify(geometry({ visibleSource: null }));
    await settle();
    expect(view.page.render).not.toHaveBeenCalled();
    view.notify(geometry());
    await settle();
    const tile = view.container.children[1];
    view.notify(geometry({ visibleSource: null }));
    expect(tile.width).toBe(0);
    expect(view.container.children).toEqual([view.textLayer]);
    view.renderer.destroy();
});

test('small pans reuse the rendered overscan instead of replaying PDF operators', async () => {
    const view = fixture();
    view.notify(geometry());
    await settle();
    const tile = view.container.children[1];
    view.notify(geometry({ visibleSource: { left: 210, top: 310, width: 100, height: 80 } }));
    await settle();
    expect(view.page.render).toHaveBeenCalledTimes(1);
    expect(view.container.children[1]).toBe(tile);
    view.renderer.destroy();
});

test('rapid pan cancels stale work, waits for it to settle, and cannot publish stale pixels', async () => {
    const view = fixture();
    let finish: () => void = () => {};
    const cancel = jest.fn();
    view.page.render.mockReturnValueOnce({ promise: new Promise<void>(resolve => { finish = resolve; }), cancel });
    view.notify(geometry());
    await settle();
    view.notify(geometry({ visibleSource: { left: 400, top: 600, width: 100, height: 80 } }));
    await settle();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(view.page.render).toHaveBeenCalledTimes(1);
    finish();
    await settle();
    expect(view.page.render).toHaveBeenCalledTimes(2);
    expect(view.container.children).toHaveLength(2);
    expect(view.container.children[1].style.left).toBe('384px');
    view.renderer.destroy();
});

test('closing during a render cancels it, defers page cleanup, and releases its unmounted canvas', async () => {
    const view = fixture();
    let finish: () => void = () => {};
    const cancel = jest.fn();
    view.page.render.mockReturnValueOnce({ promise: new Promise<void>(resolve => { finish = resolve; }), cancel });
    view.notify(geometry());
    await settle();
    const request = view.page.render.mock.calls[0]?.[0] as any;
    view.renderer.destroy();
    view.renderer.destroy();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(view.page.cleanup).not.toHaveBeenCalled();
    finish();
    await settle();
    expect(request.canvas.width).toBe(0);
    expect(view.container.children).toEqual([view.textLayer]);
    expect(view.page.cleanup).toHaveBeenCalledTimes(1);
});

test('limits canvas area and total displayed plus in-flight pixels across many pages', async () => {
    const renderer = new PdfPreviewDetailRenderer();
    const views = Array.from({ length: 8 }, () => fixture(renderer));
    let maximum = 0;
    for (const view of views) {
        view.page.render.mockImplementation((request: any) => {
            const displayed = views.flatMap(item => item.container.children).reduce((sum, canvas) => sum + canvas.width * canvas.height, 0);
            maximum = Math.max(maximum, displayed + request.canvas.width * request.canvas.height);
            expect(request.canvas.width).toBeLessThanOrEqual(8192);
            expect(request.canvas.height).toBeLessThanOrEqual(8192);
            expect(request.canvas.width * request.canvas.height).toBeLessThanOrEqual(8_000_000);
            return { promise: Promise.resolve(), cancel: jest.fn() };
        });
        view.notify(geometry({ scale: 8, pixelRatio: 4, visibleSource: { left: 0, top: 0, width: 1000, height: 2000 } }));
        await settle();
    }
    expect(maximum).toBeLessThanOrEqual(24_000_000);
    renderer.destroy();
});

test('render failures preserve the base/text content and are retried only after geometry changes', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const view = fixture();
    view.page.render.mockReturnValueOnce({ promise: Promise.reject(new Error('bad operator')), cancel: jest.fn() });
    view.notify(geometry());
    await settle();
    view.notify(geometry());
    await settle();
    expect(view.page.render).toHaveBeenCalledTimes(1);
    expect(view.container.children).toEqual([view.textLayer]);
    expect(warning).toHaveBeenCalledTimes(1);
    view.notify(geometry({ scale: 5 }));
    await settle();
    expect(view.page.render).toHaveBeenCalledTimes(2);
    view.renderer.destroy();
    warning.mockRestore();
});
