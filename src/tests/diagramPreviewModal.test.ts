import { Notice } from 'obsidian';
import { DiagramPreviewModal } from '../ui/DiagramPreviewModal';
import { mockApp } from './__mocks__/app';
import * as mermaidPreview from '../rendering/preview/mermaidPreview';
import * as previewExport from '../rendering/preview/previewExport';

jest.mock('../rendering/preview/mermaidPreview', () => ({
    renderMermaidArtifactSvg: jest.fn().mockResolvedValue('<svg><g /></svg>')
}));

jest.mock('../rendering/preview/previewExport', () => {
    const actual = jest.requireActual('../rendering/preview/previewExport');
    return {
        ...actual,
        renderPreviewArtifactSvg: jest.fn().mockResolvedValue('<svg><rect /></svg>'),
        saveDiagramPreviewSvg: jest.fn().mockResolvedValue('Notes/Topic_preview.svg'),
        saveDiagramPreviewPng: jest.fn().mockResolvedValue('Notes/Topic_preview.png'),
        saveDiagramSourceArtifact: jest.fn().mockResolvedValue('Notes/Topic_diagram.json')
    };
});

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    children: MockElement[];
    innerHTML: string;
    onclick?: (() => unknown | Promise<unknown>) | null;
    disabled: boolean;
    srcdoc?: string;
    attributes: Record<string, string>;
    empty: jest.Mock;
    addClass: jest.Mock;
    createEl: jest.Mock;
    createDiv: jest.Mock;
    setAttribute: jest.Mock;
    setText: jest.Mock;
};

function createMockElement(tag = 'div', options: { text?: string; cls?: string } = {}): MockElement {
    const element = {
        tag,
        text: options.text ?? '',
        cls: options.cls ?? '',
        children: [] as MockElement[],
        innerHTML: '',
        onclick: null,
        disabled: false,
        srcdoc: undefined,
        attributes: {} as Record<string, string>,
        empty: jest.fn(),
        addClass: jest.fn(),
        createEl: jest.fn(),
        createDiv: jest.fn(),
        setAttribute: jest.fn(),
        setText: jest.fn()
    } as MockElement;

    element.empty.mockImplementation(() => {
        element.children = [];
        element.innerHTML = '';
    });

    element.addClass.mockImplementation((cls: string) => {
        element.cls = element.cls ? `${element.cls} ${cls}` : cls;
    });

    element.setAttribute.mockImplementation((name: string, value: string) => {
        element.attributes[name] = value;
        (element as any)[name] = value;
    });

    element.setText.mockImplementation((text: string) => {
        element.text = text;
    });

    element.createEl.mockImplementation((childTag: string, childOptions: { text?: string; cls?: string } = {}) => {
        const child = createMockElement(childTag, childOptions);
        element.children.push(child);
        return child;
    });

    element.createDiv.mockImplementation((childOptions: { cls?: string } = {}) => {
        const child = createMockElement('div', childOptions);
        element.children.push(child);
        return child;
    });

    return element;
}

function collectButtons(root: MockElement): MockElement[] {
    const buttons: MockElement[] = root.tag === 'button' ? [root] : [];
    for (const child of root.children) {
        buttons.push(...collectButtons(child));
    }
    return buttons;
}

function createSession(artifactOverrides: Partial<any> = {}, sourcePath = 'Notes/Topic.md', theme = 'system') {
    return {
        htmlSrcdoc: '<!DOCTYPE html><html></html>',
        payload: {
            artifact: {
                target: 'mermaid',
                content: '```mermaid\nflowchart TD\nA --> B\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart',
                ...artifactOverrides
            },
            theme,
            previewTitle: 'Mermaid preview',
            sourcePath,
            artifactSaved: false
        }
    } as any;
}

async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('diagram preview modal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                clipboard: {
                    writeText: jest.fn().mockResolvedValue(undefined)
                }
            }
        });
    });

    test('shows export button for preview-capable artifacts and saves svg on click', async () => {
        const modal = new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        const exportButton = buttons.find(button => button.text === 'Export SVG');
        const exportPngButton = buttons.find(button => button.text === 'Export PNG');

        expect(exportButton).toBeDefined();
        expect(exportPngButton).toBeDefined();
        expect(mermaidPreview.renderMermaidArtifactSvg).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            undefined,
            'dark'
        );

        await exportButton?.onclick?.();

        expect(previewExport.saveDiagramPreviewSvg).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({ theme: 'dark' })
        );
        expect(Notice).toHaveBeenCalledWith('Diagram preview exported to Notes/Topic_preview.svg');
        expect(exportButton?.text).toBe('Export SVG');
        expect(exportButton?.disabled).toBe(false);
    });

    test('shows png export button and saves png preview on click', async () => {
        const modal = new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        const exportPngButton = buttons.find(button => button.text === 'Export PNG');
        expect(exportPngButton).toBeDefined();

        await exportPngButton?.onclick?.();

        expect(previewExport.saveDiagramPreviewPng).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({ theme: 'dark' })
        );
        expect(Notice).toHaveBeenCalledWith('Diagram PNG exported to Notes/Topic_preview.png');
    });

    test('shows save-source button for unsaved preview artifacts and writes target file on click', async () => {
        const modal = new DiagramPreviewModal(mockApp, createSession({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }), 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        const saveButton = buttons.find(button => button.text === 'Save source file');
        expect(saveButton).toBeDefined();

        await saveButton?.onclick?.();

        expect(previewExport.saveDiagramSourceArtifact).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'vega-lite' })
        );
        expect(Notice).toHaveBeenCalledWith('Diagram source saved to Notes/Topic_diagram.json');
    });

    test('routes vega-lite previews through iframe host instead of plugin-runtime svg rendering', async () => {
        const modal = new DiagramPreviewModal(mockApp, {
            ...createSession({
                target: 'vega-lite',
                content: '{"mark":"bar"}',
                mimeType: 'application/json',
                sourceIntent: 'dataChart'
            }, 'Notes/Topic.md', 'dark'),
            htmlSrcdoc: '<!DOCTYPE html><html><body><div id="notemd-vega-lite-mount"></div></body></html>'
        }, 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        expect(previewExport.renderPreviewArtifactSvg).not.toHaveBeenCalledWith(
            expect.objectContaining({ target: 'vega-lite' }),
            expect.anything()
        );

        const iframe = modal.contentEl.children
            .flatMap((child: MockElement) => child.children)
            .find((child: MockElement) => child.tag === 'iframe');

        expect(iframe).toBeDefined();
        expect(iframe?.sandbox).toBe('allow-scripts allow-same-origin');
        expect(iframe?.srcdoc).toContain('notemd-vega-lite-mount');
    });

    test('hides export button for non-svg preview targets', async () => {
        const modal = new DiagramPreviewModal(mockApp, createSession({
            target: 'html',
            content: '<div>Preview</div>',
            mimeType: 'text/html'
        }), 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === 'Export SVG')).toBe(false);
        expect(buttons.some(button => button.text === 'Export PNG')).toBe(false);

        const iframe = modal.contentEl.children
            .flatMap((child: MockElement) => child.children)
            .find((child: MockElement) => child.tag === 'iframe');

        expect(iframe?.sandbox).toBe('allow-same-origin');
    });

    test('hides save-source button when preview already points at saved artifact', async () => {
        const modal = new DiagramPreviewModal(mockApp, {
            ...createSession(),
            payload: {
                ...createSession().payload,
                artifactSaved: true
            }
        }, 'en') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === 'Save source file')).toBe(false);
    });

    test('uses localized export label for chinese preview modal', async () => {
        const modal = new DiagramPreviewModal(mockApp, createSession(), 'zh-CN') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === '导出 SVG')).toBe(true);
        expect(buttons.some(button => button.text === '导出 PNG')).toBe(true);
        expect(buttons.some(button => button.text === '保存源码文件')).toBe(true);
    });

    test('renders localized preview title when session provides one', async () => {
        const modal = new DiagramPreviewModal(mockApp, {
            ...createSession(),
            payload: {
                ...createSession().payload,
                previewTitle: 'Mermaid 预览'
            }
        }, 'zh-CN') as any;
        modal.app = mockApp;
        modal.contentEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();
        await flushPromises();

        expect(modal.contentEl.children.some((child: MockElement) => child.tag === 'h3' && child.text === 'Mermaid 预览')).toBe(true);
    });
});
