import { Notice } from 'obsidian';
import type { DiagramHistoryEntry, DiagramHistoryQuery } from '../diagram/history/diagramHistoryRepository';
import { DiagramHistoryModal } from '../ui/DiagramHistoryModal';
import { mockApp } from './__mocks__/app';

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    value: string;
    type: string;
    placeholder: string;
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
    setText: jest.Mock;
};

function createMockElement(tag = 'div', options: Record<string, any> = {}): MockElement {
    const element = {
        tag,
        text: options.text ?? '',
        cls: options.cls ?? '',
        value: options.value ?? '',
        type: options.type ?? '',
        placeholder: options.placeholder ?? '',
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
        setText: jest.fn()
    } as MockElement;

    element.empty.mockImplementation(() => { element.children = []; });
    element.setText.mockImplementation((text: string) => { element.text = text; });
    element.createEl.mockImplementation((childTag: string, childOptions: Record<string, any> = {}) => {
        const child = createMockElement(childTag, childOptions);
        element.children.push(child);
        return child;
    });
    element.createDiv.mockImplementation((childOptions: Record<string, any> = {}) => {
        const child = createMockElement('div', childOptions);
        element.children.push(child);
        return child;
    });
    element.createSpan.mockImplementation((childOptions: Record<string, any> = {}) => {
        const child = createMockElement('span', childOptions);
        element.children.push(child);
        return child;
    });
    return element;
}

function collectElements(root: MockElement, tag?: string): MockElement[] {
    const matches = !tag || root.tag === tag ? [root] : [];
    return root.children.reduce((all, child) => all.concat(collectElements(child, tag)), matches);
}

function mountModal(modal: any): any {
    modal.app = mockApp;
    modal.titleEl = createMockElement('h2');
    modal.contentEl = createMockElement();
    return modal;
}

function historyEntry(overrides: Partial<DiagramHistoryEntry> = {}): DiagramHistoryEntry {
    return {
        id: 'one',
        completedAt: Date.UTC(2026, 6, 11, 12),
        title: 'Common-source NMOS',
        intent: 'circuit',
        sourceFormat: 'circuitikz',
        sourcePath: 'Notes/Circuit.md',
        artifactPath: 'Diagrams/Circuit.tex',
        exportPaths: { svg: 'Diagrams/Circuit.svg' },
        status: 'completed',
        ...overrides
    };
}

async function flushRender(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

function createLoadPage(items: DiagramHistoryEntry[] = [], page = 1, totalPages = 1): jest.Mock {
    return jest.fn().mockResolvedValue({ items, page, totalPages, totalItems: items.length });
}

describe('diagram history modal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.workspace.openLinkText as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    });

    test('loads newest-first history with default pagination and localized controls', async () => {
        const loadPage = createLoadPage();
        const modal = mountModal(new DiagramHistoryModal(mockApp, loadPage, jest.fn(), undefined, undefined, 'zh-CN') as any);

        modal.onOpen();
        await flushRender();

        expect(loadPage).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
        expect(modal.titleEl.text).toBe('图形历史');
        const pageSize = collectElements(modal.contentEl, 'select')
            .find(element => element.attributes['aria-label'] === '每页显示条数');
        expect(pageSize).toBeDefined();
    });

    test('resets pagination when search, filters, or page size change', async () => {
        const loadPage = createLoadPage([], 3, 4);
        const modal = mountModal(new DiagramHistoryModal(mockApp, loadPage, jest.fn(), undefined, undefined, 'en') as any);
        (modal as any).query.page = 3;
        modal.onOpen();
        await flushRender();

        const search = collectElements(modal.contentEl, 'input').find(element => element.type === 'search')!;
        search.value = 'nmos';
        search.oninput?.();
        await flushRender();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'nmos' }));

        const intent = collectElements(modal.contentEl, 'select')
            .find(element => element.attributes['aria-label'] === 'All diagram types')!;
        intent.value = 'circuit';
        intent.onchange?.();
        await flushRender();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, intent: 'circuit' }));

        const pageSize = collectElements(modal.contentEl, 'select')
            .find(element => element.attributes['aria-label'] === 'Items per page')!;
        pageSize.value = '50';
        pageSize.onchange?.();
        await flushRender();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, pageSize: 50 }));
    });

    test('uses an inclusive end-of-day timestamp for the completion date filter', async () => {
        const loadPage = createLoadPage();
        const modal = mountModal(new DiagramHistoryModal(mockApp, loadPage, jest.fn(), undefined, undefined, 'en') as any);
        modal.onOpen();
        await flushRender();

        const completedTo = collectElements(modal.contentEl, 'input')
            .find(element => element.attributes['aria-label'] === 'Completed to')!;
        completedTo.value = '2026-07-11';
        completedTo.onchange?.();
        await flushRender();

        const expected = new Date('2026-07-11T00:00:00').getTime() + 86_399_999;
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, completedTo: expected }));
    });

    test('enforces pagination boundaries and loads adjacent pages', async () => {
        const loadPage = createLoadPage([], 1, 2);
        const modal = mountModal(new DiagramHistoryModal(mockApp, loadPage, jest.fn(), undefined, undefined, 'en') as any);
        modal.onOpen();
        await flushRender();

        let buttons = collectElements(modal.contentEl, 'button');
        expect(buttons.find(button => button.text === 'Previous')?.disabled).toBe(true);
        await buttons.find(button => button.text === 'Next')?.onclick?.();
        await flushRender();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

        loadPage.mockResolvedValue({ items: [], page: 2, totalPages: 2, totalItems: 0 });
        await (modal as any).render();
        buttons = collectElements(modal.contentEl, 'button');
        expect(buttons.find(button => button.text === 'Next')?.disabled).toBe(true);
        await buttons.find(button => button.text === 'Previous')?.onclick?.();
        await flushRender();
        expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    });

    test('opens source and artifact paths and reports a failed preview reopen', async () => {
        const entry = historyEntry();
        const reopenArtifact = jest.fn().mockResolvedValue(false);
        const modal = mountModal(new DiagramHistoryModal(mockApp, createLoadPage([entry]), jest.fn(), undefined, reopenArtifact, 'en') as any);
        modal.onOpen();
        await flushRender();

        const buttons = collectElements(modal.contentEl, 'button');
        await buttons.find(button => button.text === 'Reopen preview')?.onclick?.();
        await buttons.find(button => button.text === 'Open source note')?.onclick?.();
        await buttons.find(button => button.text === 'Open Circuit.svg')?.onclick?.();

        expect(reopenArtifact).toHaveBeenCalledWith(entry);
        expect(Notice).toHaveBeenCalledWith('The saved diagram artifact is missing or cannot be previewed.');
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith('Notes/Circuit.md', '', false);
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith('Diagrams/Circuit.svg', '', false);
    });

    test('removes only the index entry when requested', async () => {
        const removeEntry = jest.fn().mockResolvedValue(undefined);
        const loadPage = createLoadPage([historyEntry()]);
        const modal = mountModal(new DiagramHistoryModal(mockApp, loadPage, removeEntry, undefined, undefined, 'en') as any);
        modal.onOpen();
        await flushRender();

        await collectElements(modal.contentEl, 'button').find(button => button.text === 'Remove from history')?.onclick?.();

        expect(removeEntry).toHaveBeenCalledWith('one');
        expect(loadPage).toHaveBeenCalledTimes(2);
    });

    test('removes the index only after artifact deletion succeeds', async () => {
        const entry = historyEntry();
        const removeEntry = jest.fn().mockResolvedValue(undefined);
        const deleteArtifacts = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const modal = mountModal(new DiagramHistoryModal(mockApp, createLoadPage([entry]), removeEntry, deleteArtifacts, undefined, 'en') as any);
        modal.onOpen();
        await flushRender();

        let deleteButton = collectElements(modal.contentEl, 'button').find(button => button.text === 'Delete artifacts…')!;
        await deleteButton.onclick?.();
        expect(deleteArtifacts).toHaveBeenCalledWith(entry);
        expect(removeEntry).not.toHaveBeenCalled();

        deleteButton = collectElements(modal.contentEl, 'button').find(button => button.text === 'Delete artifacts…')!;
        await deleteButton.onclick?.();
        expect(removeEntry).toHaveBeenCalledWith('one');
    });
});
