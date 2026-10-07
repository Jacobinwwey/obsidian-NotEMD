import { DiagramPreviewViewport } from '../ui/DiagramPreviewViewport';

class ViewportElement extends EventTarget {
    children: ViewportElement[] = [];
    style: Record<string, string> = {};
    attributes = new Map<string, string>();
    className = '';
    classList = {
        add: (name: string) => { this.className += ` ${name}`; },
        remove: (name: string) => { this.className = this.className.split(' ').filter(part => part !== name).join(' '); },
        toggle: (name: string, enabled: boolean) => { this.classList.remove(name); if (enabled) this.classList.add(name); }
    };
    clientWidth = 800;
    clientHeight = 400;
    scrollWidth = 1600;
    scrollHeight = 800;
    scrollLeft = 0;
    scrollTop = 0;
    clientLeft = 0;
    clientTop = 0;
    parentElement?: ViewportElement;
    left = 0;
    top = 0;
    textContent = '';
    disabled = false;
    nodeType = 1;
    capturedPointer?: number;
    setPointerCapture(pointerId: number) { this.capturedPointer = pointerId; }
    hasPointerCapture(pointerId: number) { return this.capturedPointer === pointerId; }
    releasePointerCapture() { this.capturedPointer = undefined; }
    constructor(readonly ownerDocument: ViewportDocument, readonly tag: string) { super(); }
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    getAttribute(name: string) { return this.attributes.get(name) ?? null; }
    appendChild(child: ViewportElement) { child.parentElement = this; this.children.push(child); return child; }
    append(...children: ViewportElement[]) { children.forEach(child => this.appendChild(child)); }
    remove() { /* Detached mock style has no observer lifecycle. */ }
    querySelector() { return null; }
    closest() { return null; }
    getBoundingClientRect() { return { left: this.left, top: this.top, right: this.left + this.clientWidth, bottom: this.top + this.clientHeight }; }
}

class ViewportDocument extends EventTarget {
    nodeType = 9;
    activeElement: unknown;
    defaultView = Object.assign(new EventTarget(), { innerWidth: 1200, innerHeight: 800, devicePixelRatio: 2,
        getComputedStyle: (element: ViewportElement) => ({ overflowX: element.style.overflowX ?? 'visible', overflowY: element.style.overflowY ?? 'visible' }) });
    body = new ViewportElement(this, 'body');
    head = new ViewportElement(this, 'head');
    createElement(tag: string) { return new ViewportElement(this, tag); }
    querySelector() { return null; }
}

const copy = { zoomIn: 'In', zoomOut: 'Out', zoomFit: 'Fit', zoomActual: 'Actual', zoomLevel: 'Zoom', zoomViewport: 'Preview', zoomLock: 'Lock', zoomUnlock: 'Unlock' };
function mount() {
    const doc = new ViewportDocument();
    const container = doc.createElement('div');
    const instance = new DiagramPreviewViewport(container as unknown as HTMLElement, copy);
    instance.refresh();
    const [controls, viewport] = container.children;
    const content = viewport.children[0].children[0];
    return { instance, controls, viewport, content };
}
function fire(target: EventTarget, type: string, properties: Record<string, unknown> = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, properties);
    target.dispatchEvent(event);
    return event;
}
function lockButton(controls: ViewportElement) {
    return controls.children.find(child => child.attributes.has('aria-pressed'))!;
}

test('lock is beside minus, freezes all navigation and resize, and unlock preserves transform', () => {
    const { instance, controls, viewport, content } = mount();
    const lock = lockButton(controls);
    expect(lock).toBeDefined();
    expect(controls.children[1]).toBe(lock);
    const transform = content.style.transform;
    viewport.scrollLeft = 20;
    viewport.scrollTop = 30;
    fire(viewport, 'pointerdown', { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fire(lock, 'click');
    expect(lock.getAttribute('aria-pressed')).toBe('true');
    expect(viewport.className).not.toContain('is-panning');
    for (const button of controls.children.filter(child => child.tag === 'button' && child !== lock)) {
        expect(button.disabled).toBe(true);
        fire(button, 'click');
    }
    for (const key of ['+', '-', '0', '1', 'ArrowDown', 'PageDown', ' ']) fire(viewport, 'keydown', { key });
    expect(fire(viewport, 'wheel', { deltaY: 20 }).defaultPrevented).toBe(true);
    fire(viewport, 'wheel', { deltaY: 20, ctrlKey: true });
    fire(viewport, 'pointermove', { pointerId: 1, clientX: 40, clientY: 40 });
    expect(viewport.scrollLeft).toBe(20);
    expect(viewport.scrollTop).toBe(30);
    viewport.scrollLeft = 100;
    viewport.scrollTop = 100;
    fire(viewport, 'scroll');
    expect(viewport.scrollLeft).toBe(20);
    expect(viewport.scrollTop).toBe(30);
    viewport.clientWidth = 600;
    instance.refresh();
    expect(content.style.transform).toBe(transform);
    fire(lock, 'click');
    expect(content.style.transform).toBe(transform);
    fire(controls.children.find(child => child.textContent === '+')!, 'click');
    expect(content.style.transform).not.toBe(transform);
    instance.destroy();
});

test('locking one viewport leaves others and text selection/copy usable, including iframe input', () => {
    const first = mount();
    const second = mount();
    const frameDoc = new ViewportDocument();
    const iframe = { contentDocument: frameDoc, style: {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
    first.instance.attachIframe(iframe as unknown as HTMLIFrameElement);
    fire(lockButton(first.controls), 'click');
    const transform = first.content.style.transform;
    expect(fire(frameDoc, 'pointerdown', { button: 0, pointerId: 2 }).defaultPrevented).toBe(false);
    expect(fire(frameDoc, 'pointermove', { pointerId: 2 }).defaultPrevented).toBe(false);
    expect(fire(frameDoc, 'keydown', { key: 'c', ctrlKey: true }).defaultPrevented).toBe(false);
    fire(frameDoc, 'keydown', { key: '+' });
    fire(frameDoc, 'wheel', { deltaY: 40, ctrlKey: true });
    expect(first.content.style.transform).toBe(transform);
    const otherTransform = second.content.style.transform;
    fire(second.viewport, 'keydown', { key: '+' });
    expect(second.content.style.transform).not.toBe(otherTransform);
    first.instance.destroy();
    expect(fire(frameDoc, 'wheel', { deltaY: 40 }).defaultPrevented).toBe(false);
    fire(lockButton(first.controls), 'click');
    expect(first.content.style.transform).toBe(transform);
    second.instance.destroy();
});

test('Alt temporarily locks on entry, cancels dragging, and preserves persistent lock and geometry', () => {
    const { instance, controls, viewport, content } = mount();
    const transform = content.style.transform;
    fire(viewport, 'pointerdown', { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fire(viewport, 'keydown', { key: 'Alt', altKey: true });
    expect(viewport.className).toContain('is-locked');
    expect(viewport.className).not.toContain('is-panning');
    expect(viewport.capturedPointer).toBeUndefined();
    expect(lockButton(controls).getAttribute('aria-pressed')).toBe('false');
    expect(fire(viewport, 'wheel', { deltaY: 20, ctrlKey: true, altKey: true }).defaultPrevented).toBe(true);
    expect(fire(viewport, 'keydown', { key: 'c', ctrlKey: true, altKey: true }).defaultPrevented).toBe(false);
    fire(viewport.ownerDocument, 'keyup', { key: 'Alt' });
    expect(viewport.className).not.toContain('is-locked');
    expect(content.style.transform).toBe(transform);
    fire(viewport, 'pointerenter', { altKey: true });
    expect(viewport.className).toContain('is-locked');
    fire(viewport.ownerDocument.defaultView, 'blur');
    expect(viewport.className).not.toContain('is-locked');
    fire(lockButton(controls), 'click');
    fire(viewport, 'keydown', { key: 'Alt', altKey: true });
    fire(viewport.ownerDocument, 'keyup', { key: 'Alt' });
    expect(viewport.className).toContain('is-locked');
    expect(lockButton(controls).getAttribute('aria-pressed')).toBe('true');
    instance.destroy();
});

test('iframe Alt release and cleanup leave independent panels usable', () => {
    const first = mount();
    const second = mount();
    const frameDoc = new ViewportDocument();
    first.instance.attachIframe({ contentDocument: frameDoc, style: {} } as unknown as HTMLIFrameElement);
    fire(frameDoc, 'keydown', { key: 'Alt', altKey: true });
    expect(first.viewport.className).toContain('is-locked');
    expect(second.viewport.className).not.toContain('is-locked');
    expect(frameDoc.body.className).toContain('notemd-preview-locked');
    fire(frameDoc, 'keyup', { key: 'Alt' });
    expect(first.viewport.className).not.toContain('is-locked');
    first.instance.destroy();
    fire(frameDoc, 'keydown', { key: 'Alt', altKey: true });
    expect(first.viewport.className).not.toContain('is-locked');
    second.instance.destroy();
});

test('focusing an embedded preview preserves Alt until the frame loses window focus', () => {
    const view = mount();
    const frameDoc = new ViewportDocument();
    const frame = { contentDocument: frameDoc, style: {} };
    view.instance.attachIframe(frame as unknown as HTMLIFrameElement);
    fire(view.viewport, 'keydown', { key: 'Alt', altKey: true });
    view.viewport.ownerDocument.activeElement = frame;
    fire(view.viewport.ownerDocument.defaultView, 'blur');
    expect(view.viewport.className).toContain('is-locked');
    fire(frameDoc.defaultView, 'blur');
    expect(view.viewport.className).not.toContain('is-locked');
    view.instance.destroy();
});

test('geometry subscribers receive final zoom anchors, DPR and source crop, then stop after unsubscribe', () => {
    const { instance, viewport } = mount();
    instance.setSourceDimensions(1600, 800);
    const changed = jest.fn();
    const unsubscribe = instance.subscribeGeometry(changed);
    expect(changed).toHaveBeenLastCalledWith({ scale: 0.5, pixelRatio: 2, visibleSource: { left: 0, top: 0, width: 1600, height: 800 } });
    changed.mockClear();
    fire(viewport, 'keydown', { key: '1' });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith({ scale: 1, pixelRatio: 2, visibleSource: { left: 400, top: 200, width: 800, height: 400 } });
    fire(viewport, 'keydown', { key: '0' });
    expect(changed).toHaveBeenLastCalledWith({ scale: 0.5, pixelRatio: 2, visibleSource: { left: 0, top: 0, width: 1600, height: 800 } });
    unsubscribe();
    changed.mockClear();
    fire(viewport, 'keydown', { key: '+' });
    expect(changed).not.toHaveBeenCalled();
    instance.destroy();
});

test('geometry clips outer scrolling ancestors and window, and updates density while navigation is locked', () => {
    const { instance, viewport, controls, content } = mount();
    instance.setSourceDimensions(800, 400);
    const ancestor = viewport.parentElement!;
    ancestor.style.overflowY = 'auto';
    ancestor.top = 100;
    ancestor.clientHeight = 200;
    const changed = jest.fn();
    instance.subscribeGeometry(changed);
    expect(changed.mock.calls.at(-1)?.[0].visibleSource).toEqual({ left: 0, top: 100, width: 800, height: 200 });
    viewport.top = 900;
    fire(viewport.ownerDocument, 'scroll');
    expect(changed.mock.calls.at(-1)?.[0].visibleSource).toBeNull();
    viewport.top = 0;
    fire(lockButton(controls), 'click');
    const transform = content.style.transform;
    viewport.ownerDocument.defaultView.devicePixelRatio = 3;
    fire(viewport.ownerDocument.defaultView, 'resize');
    expect(changed.mock.calls.at(-1)?.[0].pixelRatio).toBe(3);
    expect(content.style.transform).toBe(transform);
    instance.destroy();
    changed.mockClear();
    fire(viewport.ownerDocument, 'scroll');
    expect(changed).not.toHaveBeenCalled();
});
