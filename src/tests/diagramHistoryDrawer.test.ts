import { DiagramHistoryDrawer } from '../ui/DiagramHistoryDrawer';
import { mountDiagramHistoryView } from '../ui/DiagramHistoryView';
import { mockApp } from './__mocks__/app';

jest.mock('../ui/DiagramHistoryView', () => ({ mountDiagramHistoryView: jest.fn() }));

type MockElement = {
    tag: string; cls: string; attributes: Record<string, string>; children: MockElement[];
    onclick?: (() => void) | null; parent?: MockElement; removed: boolean;
    createDiv: jest.Mock; createEl: jest.Mock; setAttribute: jest.Mock;
    addEventListener: jest.Mock; removeEventListener: jest.Mock; remove: jest.Mock; focus: jest.Mock;
};

function element(tag = 'div', options: Record<string, any> = {}, parent?: MockElement): MockElement {
    const root = {
        tag, cls: options.cls ?? '', attributes: { ...(options.attr ?? {}) }, children: [], onclick: null,
        parent, removed: false, createDiv: jest.fn(), createEl: jest.fn(), setAttribute: jest.fn(),
        addEventListener: jest.fn(), removeEventListener: jest.fn(), remove: jest.fn(), focus: jest.fn()
    } as MockElement;
    root.createDiv.mockImplementation((childOptions = {}) => { const child = element('div', childOptions, root); root.children.push(child); return child; });
    root.createEl.mockImplementation((childTag: string, childOptions = {}) => { const child = element(childTag, childOptions, root); root.children.push(child); return child; });
    root.setAttribute.mockImplementation((name: string, value: string) => { root.attributes[name] = value; });
    root.remove.mockImplementation(() => { root.removed = true; if (root.parent) root.parent.children = root.parent.children.filter(child => child !== root); });
    return root;
}

function find(root: MockElement, cls: string): MockElement | undefined {
    if (root.cls.split(' ').includes(cls)) return root;
    for (const child of root.children) { const match = find(child, cls); if (match) return match; }
    return undefined;
}

describe('DiagramHistoryDrawer', () => {
    const store = { loadPage: jest.fn(), removeEntry: jest.fn() };
    let host: MockElement;
    let trigger: MockElement;
    let controller: { refresh: jest.Mock; focusSearch: jest.Mock; destroy: jest.Mock };

    beforeEach(() => {
        host = element(); trigger = element('button');
        controller = { refresh: jest.fn(), focusSearch: jest.fn(), destroy: jest.fn() };
        (mountDiagramHistoryView as jest.Mock).mockReturnValue(controller);
    });

    test('opens an internal dialog, focuses search, and restores trigger focus', () => {
        const drawer = new DiagramHistoryDrawer(host as unknown as HTMLElement, { app: mockApp, store, uiLocale: 'en' });
        drawer.open(trigger as unknown as HTMLElement);
        expect(find(host, 'notemd-diagram-history-drawer')?.attributes['aria-modal']).toBe('true');
        expect(controller.focusSearch).toHaveBeenCalled();
        drawer.close();
        expect(controller.destroy).toHaveBeenCalled();
        expect(trigger.focus).toHaveBeenCalled();
    });

    test('Escape and the backdrop close the drawer before the preview', () => {
        const drawer = new DiagramHistoryDrawer(host as unknown as HTMLElement, { app: mockApp, store, uiLocale: 'en' });
        drawer.open(trigger as unknown as HTMLElement);
        const layer = find(host, 'notemd-diagram-history-layer')!;
        const listener = layer.addEventListener.mock.calls[0][1];
        const event = { key: 'Escape', preventDefault: jest.fn() };
        listener(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(drawer.isOpen()).toBe(false);

        drawer.open(trigger as unknown as HTMLElement);
        find(host, 'notemd-diagram-history-backdrop')?.onclick?.();
        expect(drawer.isOpen()).toBe(false);
    });

    test('destroy removes the drawer layer and shared view', () => {
        const drawer = new DiagramHistoryDrawer(host as unknown as HTMLElement, { app: mockApp, store, uiLocale: 'en' });
        drawer.open(trigger as unknown as HTMLElement);
        drawer.destroy();
        expect(find(host, 'notemd-diagram-history-layer')).toBeUndefined();
        expect(controller.destroy).toHaveBeenCalled();
    });
});
