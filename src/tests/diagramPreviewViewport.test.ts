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
    textContent = '';
    disabled = false;
    nodeType = 1;
    constructor(readonly ownerDocument: ViewportDocument, readonly tag: string) { super(); }
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    getAttribute(name: string) { return this.attributes.get(name) ?? null; }
    appendChild(child: ViewportElement) { this.children.push(child); return child; }
    append(...children: ViewportElement[]) { this.children.push(...children); }
    remove() { /* Detached mock style has no observer lifecycle. */ }
    querySelector() { return null; }
    closest() { return null; }
    getBoundingClientRect() { return { left: 0, top: 0 }; }
}

class ViewportDocument extends EventTarget {
    nodeType = 9;
    defaultView = null;
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
