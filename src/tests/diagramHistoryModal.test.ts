import { DiagramHistoryModal } from '../ui/DiagramHistoryModal';
import { mockApp } from './__mocks__/app';

function createMockElement(): any {
    const element: any = {
        text: '', children: [], attributes: {},
        empty: jest.fn(() => { element.children = []; }),
        addClass: jest.fn(), removeClass: jest.fn(),
        setText: jest.fn((text: string) => { element.text = text; }),
        setAttribute: jest.fn((name: string, value: string) => { element.attributes[name] = value; })
    };
    element.createDiv = jest.fn((options: any = {}) => {
        const child = createMockElement(); child.text = options.text ?? ''; child.attributes = { ...(options.attr ?? {}) }; element.children.push(child); return child;
    });
    element.createEl = jest.fn((_tag: string, options: any = {}) => {
        const child = createMockElement(); child.text = options.text ?? ''; child.attributes = { ...(options.attr ?? {}) }; child.value = options.value ?? ''; element.children.push(child); return child;
    });
    element.createSpan = element.createDiv;
    return element;
}

function mountModal(modal: any): any {
    modal.app = mockApp;
    modal.modalEl = createMockElement();
    modal.titleEl = createMockElement();
    modal.contentEl = createMockElement();
    return modal;
}

describe('diagram history modal host', () => {
    test('mounts the shared history view with localized title and default query', async () => {
        const loadPage = jest.fn().mockResolvedValue({ items: [], page: 1, totalPages: 1, totalItems: 0 });
        const modal = mountModal(new DiagramHistoryModal(mockApp, { loadPage, removeEntry: jest.fn() }, 'zh-CN') as any);

        modal.onOpen();
        await Promise.resolve();
        await Promise.resolve();

        expect(modal.titleEl.text).toBe('图形历史');
        expect(modal.modalEl.addClass).toHaveBeenCalledWith('notemd-diagram-history-shell');
        expect(modal.modalEl.attributes['aria-label']).toBe('图形历史');
        expect(loadPage).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
        expect(modal.contentEl.attributes['data-notemd-history-view']).toBe('true');
    });

    test('destroys the shared view and removes host class on close', async () => {
        const modal = mountModal(new DiagramHistoryModal(mockApp, {
            loadPage: jest.fn().mockResolvedValue({ items: [], page: 1, totalPages: 1, totalItems: 0 }),
            removeEntry: jest.fn()
        }, 'en') as any);
        modal.onOpen();
        await Promise.resolve();
        modal.onClose();

        expect(modal.contentEl.empty).toHaveBeenCalled();
        expect(modal.modalEl.removeClass).toHaveBeenCalledWith('notemd-diagram-history-shell');
    });
});
