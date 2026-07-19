import type { DiagramHistoryEntry, DiagramHistoryQuery } from '../diagram/history/diagramHistoryRepository';
import { mountDiagramHistoryView } from '../ui/DiagramHistoryView';

type MockElement = {
    tag: string;
    text: string;
    value: string;
    disabled: boolean;
    attributes: Record<string, string>;
    children: MockElement[];
    onclick?: (() => unknown | Promise<unknown>) | null;
    onchange?: (() => unknown) | null;
    oninput?: (() => unknown) | null;
    empty: jest.Mock;
    createEl: jest.Mock;
    createDiv: jest.Mock;
    createSpan: jest.Mock;
    setAttribute: jest.Mock;
    setText: jest.Mock;
};

function element(tag = 'div', options: Record<string, any> = {}): MockElement {
    const root = {
        tag,
        text: options.text ?? '',
        value: options.value ?? '',
        disabled: false,
        attributes: { ...(options.attr ?? {}) },
        children: [] as MockElement[],
        onclick: null,
        onchange: null,
        oninput: null,
        empty: jest.fn(),
        createEl: jest.fn(),
        createDiv: jest.fn(),
        createSpan: jest.fn(),
        setAttribute: jest.fn(),
        setText: jest.fn()
    } as MockElement;
    root.empty.mockImplementation(() => { root.children = []; });
    root.setText.mockImplementation((text: string) => { root.text = text; });
    root.setAttribute.mockImplementation((name: string, value: string) => { root.attributes[name] = value; });
    root.createEl.mockImplementation((childTag: string, childOptions: Record<string, any> = {}) => {
        const child = element(childTag, childOptions);
        root.children.push(child);
        return child;
    });
    root.createDiv.mockImplementation((childOptions: Record<string, any> = {}) => {
        const child = element('div', childOptions);
        root.children.push(child);
        return child;
    });
    root.createSpan.mockImplementation((childOptions: Record<string, any> = {}) => {
        const child = element('span', childOptions);
        root.children.push(child);
        return child;
    });
    return root;
}

function all(root: MockElement, predicate: (item: MockElement) => boolean): MockElement[] {
    const matches = predicate(root) ? [root] : [];
    return root.children.reduce((items, child) => items.concat(all(child, predicate)), matches);
}

function entry(overrides: Partial<DiagramHistoryEntry> = {}): DiagramHistoryEntry {
    return {
        id: 'history-one', completedAt: Date.UTC(2026, 6, 19, 8), title: 'NMOS', intent: 'circuit',
        sourceFormat: 'circuitikz', sourcePath: 'Notes/NMOS.md', artifactPath: 'Diagrams/NMOS.tex',
        exportPaths: { svg: 'Diagrams/NMOS.svg' }, status: 'completed', ...overrides
    };
}

describe('diagram history shared view', () => {
    test('keeps filters hidden until requested and renders stable record regions', async () => {
        const loadPage = jest.fn().mockResolvedValue({ items: [entry()], page: 1, totalPages: 1, totalItems: 1 });
        const root = element();
        const view = mountDiagramHistoryView(root as unknown as HTMLElement, {
            uiLocale: 'zh-CN',
            store: { loadPage, removeEntry: jest.fn() }
        });

        await view.refresh();

        expect(all(root, item => item.attributes['data-notemd-history-filters-toggle'] === 'true')).toHaveLength(1);
        expect(all(root, item => item.attributes['data-notemd-history-filter'] === 'true')).toHaveLength(0);
        expect(all(root, item => item.attributes['data-notemd-history-entry'] === 'true')).toHaveLength(1);
        expect(all(root, item => item.attributes['data-notemd-history-entry-header'] === 'true')).toHaveLength(1);
        expect(all(root, item => item.attributes['data-notemd-history-entry-actions'] === 'true')).toHaveLength(1);
        expect(all(root, item => item.attributes.role === 'search')).toHaveLength(1);
        expect(all(root, item => item.attributes.role === 'list')).toHaveLength(1);
        expect(all(root, item => item.attributes.role === 'listitem')).toHaveLength(1);

        const toggle = all(root, item => item.attributes['data-notemd-history-filters-toggle'] === 'true')[0];
        toggle.onclick?.();
        await Promise.resolve();
        await Promise.resolve();
        expect(all(root, item => item.attributes['data-notemd-history-filter'] === 'true')).toHaveLength(5);
    });

    test('resets page on search and exposes retry after a load failure', async () => {
        const loadPage = jest.fn()
            .mockResolvedValueOnce({ items: [], page: 1, totalPages: 1, totalItems: 0 })
            .mockResolvedValueOnce({ items: [], page: 1, totalPages: 1, totalItems: 0 })
            .mockRejectedValueOnce(new Error('Vault unavailable'))
            .mockResolvedValueOnce({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        const root = element();
        const view = mountDiagramHistoryView(root as unknown as HTMLElement, {
            uiLocale: 'en',
            store: { loadPage, removeEntry: jest.fn() }
        });

        await view.refresh();
        const search = all(root, item => item.tag === 'input')[0];
        search.value = 'nmos';
        search.oninput?.();
        await Promise.resolve();
        await Promise.resolve();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'nmos' }));
        expect(all(root, item => item.attributes['data-notemd-history-retry'] === 'true')).toHaveLength(1);

        const retry = all(root, item => item.attributes['data-notemd-history-retry'] === 'true')[0];
        await retry.onclick?.();
        expect(loadPage).toHaveBeenCalledTimes(4);
    });
});
