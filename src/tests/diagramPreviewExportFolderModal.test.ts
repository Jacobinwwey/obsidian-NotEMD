import {
    DiagramPreviewExportFolderModal,
    getDiagramPreviewSourceFolder,
    normalizeDiagramPreviewExportFolderPath
} from '../ui/DiagramPreviewExportFolderModal';
import { mockApp } from './__mocks__/app';

class ModalElement {
    children: ModalElement[] = [];
    text = '';
    value = '';
    checked = false;
    disabled = false;
    hidden = false;
    onclick?: () => void;
    listeners: Record<string, () => void> = {};
    constructor(readonly tag = 'div', readonly options: { cls?: string; text?: string; type?: string; attr?: Record<string, string> } = {}) {
        this.text = options.text ?? '';
        this.value = options.attr?.value ?? '';
    }
    createEl(tag: string, options = {}) { const child = new ModalElement(tag, options); this.children.push(child); return child; }
    createDiv(options = {}) { return this.createEl('div', options); }
    createSpan(options = {}) { return this.createEl('span', options); }
    addClass() { /* Obsidian decoration does not affect the selection contract. */ }
    addEventListener(event: string, callback: () => void) { this.listeners[event] = callback; }
    setText(text: string) { this.text = text; }
    empty() { this.children = []; }
    find(predicate: (element: ModalElement) => boolean): ModalElement | undefined {
        if (predicate(this)) return this;
        for (const child of this.children) { const match = child.find(predicate); if (match) return match; }
        return undefined;
    }
}

function mountFolderModal() {
    const resolve = jest.fn();
    const createFolder = jest.fn().mockResolvedValue(undefined);
    const modal = new DiagramPreviewExportFolderModal(mockApp, 'Notes/Topic.md', 'en', resolve);
    const content = new ModalElement();
    Object.assign(modal, {
        app: { vault: { getAbstractFileByPath: jest.fn().mockReturnValue(null), createFolder } },
        titleEl: new ModalElement(), contentEl: content, close: () => modal.onClose()
    });
    modal.onOpen();
    const checkbox = (format: string) => content.find(element => element.value === format)!;
    return { modal, content, resolve, createFolder, checkbox };
}

describe('diagram export format and folder dialog', () => {
    test('retains SVG while selecting PDF and resolves both formats after one folder confirmation', async () => {
        const { modal, checkbox, resolve, createFolder } = mountFolderModal();
        checkbox('PDF').checked = true;
        checkbox('PDF').listeners.change();
        await (modal as any).confirmSelection();
        expect(resolve).toHaveBeenCalledTimes(1);
        expect(resolve).toHaveBeenCalledWith({ folderPath: 'Notes', formats: ['SVG', 'PDF'] });
        expect(createFolder).toHaveBeenCalledTimes(1);
    });

    test('empty selection disables export and never creates a folder even on programmatic confirmation', async () => {
        const { modal, checkbox, content, resolve, createFolder } = mountFolderModal();
        checkbox('SVG').checked = false;
        checkbox('SVG').listeners.change();
        expect(content.find(element => element.options.cls === 'mod-cta')?.disabled).toBe(true);
        expect(content.find(element => element.options.cls === 'notemd-export-format-summary')?.text).toBe('Select at least one format.');
        await (modal as any).confirmSelection();
        expect(createFolder).not.toHaveBeenCalled();
        expect(resolve).not.toHaveBeenCalled();
    });

    test('close resolves cancellation once without creating folders', () => {
        const { modal, resolve, createFolder } = mountFolderModal();
        modal.onClose();
        modal.onClose();
        expect(resolve).toHaveBeenCalledTimes(1);
        expect(resolve).toHaveBeenCalledWith(null);
        expect(createFolder).not.toHaveBeenCalled();
    });

    test('custom traversal paths never reach Vault writes', async () => {
        const { modal, content, createFolder, resolve } = mountFolderModal();
        content.find(element => element.value === 'custom-folder')!.checked = true;
        content.find(element => element.options.type === 'text')!.value = '../Outside';
        await (modal as any).confirmSelection();
        expect(createFolder).not.toHaveBeenCalled();
        expect(resolve).not.toHaveBeenCalled();
        expect(content.find(element => element.options.cls === 'mod-cta')?.disabled).toBe(false);
    });
});

describe('diagram preview export folder selection helpers', () => {
    test('derives the source folder for default multi-panel exports', () => {
        expect(getDiagramPreviewSourceFolder('1Knowledge/architecture.zh-CN.md')).toBe('1Knowledge');
        expect(getDiagramPreviewSourceFolder('architecture.md')).toBe('');
        expect(getDiagramPreviewSourceFolder('Notes\\Topic.md')).toBe('Notes');
    });

    test('normalizes Vault-relative custom folders', () => {
        expect(normalizeDiagramPreviewExportFolderPath(' /Exports\\Architecture/ ')).toBe('Exports/Architecture');
        expect(normalizeDiagramPreviewExportFolderPath('')).toBe('');
    });

    test('rejects absolute and traversal paths', () => {
        for (const path of ['C:/Exports', '//server/Exports', '../Exports', 'Exports/../Other']) {
            expect(() => normalizeDiagramPreviewExportFolderPath(path)).toThrow(/Vault-relative/i);
        }
    });
});
