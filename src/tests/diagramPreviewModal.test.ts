import { Menu, Notice } from 'obsidian';
import { DiagramPreviewModal } from '../ui/DiagramPreviewModal';
import { clearDiagramPreviewHistory } from '../ui/diagramPreviewHistory';
import { mockApp } from './__mocks__/app';
import * as mermaidPreview from '../rendering/preview/mermaidPreview';
import * as previewExport from '../rendering/preview/previewExport';
import * as bundledPreviewDeps from '../rendering/webview/bundledPreviewDeps';

const bundledMermaidDeps = {
    initialize: jest.fn(),
    parse: jest.fn(),
    render: jest.fn()
};
const bundledVegaLiteDeps = {
    compile: jest.fn(),
    parse: jest.fn(),
    createView: jest.fn()
};

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
        saveDiagramPreviewPdf: jest.fn().mockResolvedValue('Notes/Topic_preview.pdf'),
        saveDiagramSourceArtifact: jest.fn().mockResolvedValue('Notes/Topic_diagram.json')
    };
});

jest.mock('../rendering/webview/bundledPreviewDeps', () => ({
    getBundledMermaidPreviewDeps: jest.fn(() => bundledMermaidDeps),
    getBundledVegaLitePreviewDeps: jest.fn(() => bundledVegaLiteDeps)
}));

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    children: MockElement[];
    innerHTML: string;
    onclick?: ((event?: MouseEvent) => unknown | Promise<unknown>) | null;
    disabled: boolean;
    srcdoc?: string;
    sandbox?: string;
    attributes: Record<string, string>;
    empty: jest.Mock;
    addClass: jest.Mock;
    removeClass: jest.Mock;
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
        removeClass: jest.fn(),
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

    element.removeClass.mockImplementation((cls: string) => {
        element.cls = element.cls
            .split(' ')
            .filter(token => token && token !== cls)
            .join(' ');
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

function mountModal(modal: any): any {
    modal.app = mockApp;
    modal.modalEl = createMockElement();
    modal.contentEl = createMockElement();
    modal.close = jest.fn();
    return modal;
}

function findByClass(root: MockElement, cls: string): MockElement | null {
    if (root.cls.split(' ').includes(cls)) {
        return root;
    }
    for (const child of root.children) {
        const match = findByClass(child, cls);
        if (match) {
            return match;
        }
    }
    return null;
}

function findByTag(root: MockElement, tag: string): MockElement | null {
    if (root.tag === tag) {
        return root;
    }
    for (const child of root.children) {
        const match = findByTag(child, tag);
        if (match) {
            return match;
        }
    }
    return null;
}

function collectText(root: MockElement): string[] {
    const textValues = root.text ? [root.text] : [];
    for (const child of root.children) {
        textValues.push(...collectText(child));
    }
    return textValues;
}

function createSession(artifactOverrides: Partial<any> = {}, sourcePath = 'Notes/Topic.md', theme = 'system') {
    const artifact = {
        target: 'mermaid',
        content: '```mermaid\nflowchart TD\nA --> B\n```',
        mimeType: 'text/vnd.mermaid',
        sourceIntent: 'flowchart',
        ...artifactOverrides
    };
    const runtimeHtml = artifact.target === 'mermaid'
        ? '<!DOCTYPE html><html><body><div id="notemd-mermaid-mount"></div></body></html>'
        : artifact.target === 'vega-lite'
            ? '<!DOCTYPE html><html><body><div id="notemd-vega-lite-mount"></div></body></html>'
            : '<!DOCTYPE html><html></html>';

    return {
        htmlSrcdoc: runtimeHtml,
        payload: {
            artifact,
            theme,
            previewTitle: 'Mermaid preview',
            sourcePath,
            artifactSaved: false,
            renderHostRuntimeUrl: artifact.target === 'mermaid' || artifact.target === 'vega-lite'
                ? 'app://local/.obsidian/plugins/notemd/render-host.mjs'
                : undefined
        }
    } as any;
}

async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

async function clickExportMenuItem(modal: any, index: number): Promise<void> {
    const exportButton = collectButtons(modal.contentEl).find(button => button.text === 'Export' || button.text === '导出');
    exportButton?.onclick?.({} as MouseEvent);
    const menu = (Menu as jest.Mock).mock.results.at(-1)?.value;
    const configure = menu.addItem.mock.calls[index][0];
    const item = {
        setTitle: jest.fn().mockReturnThis(),
        setIcon: jest.fn().mockReturnThis(),
        onClick: jest.fn().mockReturnThis()
    };
    configure(item);
    await item.onClick.mock.calls[0][0]();
}

describe('diagram preview modal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearDiagramPreviewHistory();
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
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        const exportButton = buttons.find(button => button.text === 'Export');

        expect(exportButton).toBeDefined();
        expect(mermaidPreview.renderMermaidArtifactSvg).not.toHaveBeenCalled();

        await clickExportMenuItem(modal, 0);

        expect(previewExport.saveDiagramPreviewSvg).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({
                theme: 'dark',
                mermaid: bundledMermaidDeps,
                vegaLiteDepsLoader: expect.any(Function)
            })
        );
        const exportDeps = (previewExport.saveDiagramPreviewSvg as jest.Mock).mock.calls[0][3];
        await expect(exportDeps.vegaLiteDepsLoader()).resolves.toBe(bundledVegaLiteDeps);
        expect(bundledPreviewDeps.getBundledVegaLitePreviewDeps).toHaveBeenCalled();
        expect(Notice).toHaveBeenCalledWith('Diagram preview exported to Notes/Topic_preview.svg');
        expect((Menu as jest.Mock).mock.results.at(-1)?.value.addItem).toHaveBeenCalledTimes(3);
        expect(exportButton?.text).toBe('Export');
        expect(exportButton?.disabled).toBe(false);
    });

    test('shows png export button and saves png preview on click', async () => {
        const recordExportPath = jest.fn().mockResolvedValue(undefined);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en', {
            historyEntryId: 'diagram-one',
            historyStore: { loadPage: jest.fn(), removeEntry: jest.fn(), recordExportPath }
        }) as any);

        modal.onOpen();
        await flushPromises();

        await clickExportMenuItem(modal, 1);

        expect(previewExport.saveDiagramPreviewPng).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({ theme: 'dark' })
        );
        expect(Notice).toHaveBeenCalledWith('Diagram PNG exported to Notes/Topic_preview.png');
        expect(recordExportPath).toHaveBeenCalledWith('diagram-one', 'png', 'Notes/Topic_preview.png');
    });

    test('shows pdf export button and saves pdf preview with configured ppi on click', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en', {
            exportPpi: 450
        }) as any);

        modal.onOpen();
        await flushPromises();

        await clickExportMenuItem(modal, 2);

        expect(previewExport.saveDiagramPreviewPdf).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({ theme: 'dark', ppi: 450 })
        );
        expect(Notice).toHaveBeenCalledWith('Diagram PDF exported to Notes/Topic_preview.pdf');
    });

    test('clamps pdf export ppi at 600 when modal receives an oversized value', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en', {
            exportPpi: 1200
        }) as any);

        modal.onOpen();
        await flushPromises();

        await clickExportMenuItem(modal, 2);

        expect(previewExport.saveDiagramPreviewPdf).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({ ppi: 600 })
        );
    });

    test('shows save-source button for unsaved preview artifacts and writes target file on click', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }), 'en') as any);

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

    test('routes mermaid previews through iframe host instead of plugin-runtime svg rendering', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, {
            ...createSession({}, 'Notes/Topic.md', 'dark'),
            htmlSrcdoc: '<!DOCTYPE html><html><body><div id="notemd-mermaid-mount"></div></body></html>'
        }, 'en') as any);

        modal.onOpen();
        await flushPromises();

        expect(mermaidPreview.renderMermaidArtifactSvg).not.toHaveBeenCalled();

        const iframe = findByTag(modal.contentEl, 'iframe');

        expect(iframe).toBeDefined();
        expect(iframe?.sandbox).toBe('allow-scripts allow-same-origin');
        expect(iframe?.srcdoc).toContain('notemd-mermaid-mount');
    });

    test('routes vega-lite previews through iframe host instead of plugin-runtime svg rendering', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, {
            ...createSession({
                target: 'vega-lite',
                content: '{"mark":"bar"}',
                mimeType: 'application/json',
                sourceIntent: 'dataChart'
            }, 'Notes/Topic.md', 'dark'),
            htmlSrcdoc: '<!DOCTYPE html><html><body><div id="notemd-vega-lite-mount"></div></body></html>'
        }, 'en') as any);

        modal.onOpen();
        await flushPromises();

        expect(previewExport.renderPreviewArtifactSvg).not.toHaveBeenCalledWith(
            expect.objectContaining({ target: 'vega-lite' }),
            expect.anything()
        );

        const iframe = findByTag(modal.contentEl, 'iframe');

        expect(iframe).toBeDefined();
        expect(iframe?.sandbox).toBe('allow-scripts allow-same-origin');
        expect(iframe?.srcdoc).toContain('notemd-vega-lite-mount');
    });

    test('hides export button for non-svg preview targets', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'html',
            content: '<div>Preview</div>',
            mimeType: 'text/html'
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === 'Export')).toBe(false);

        const iframe = findByTag(modal.contentEl, 'iframe');

        expect(iframe?.sandbox).toBe('allow-same-origin');
    });

    test('shows export actions for html svg wrappers with persisted preview svg', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'html',
            content: '<!DOCTYPE html><html><body><svg><text>Wrapper SVG</text></svg></body></html>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Wrapper SVG</text></svg>',
                mimeType: 'image/svg+xml'
            }
        }, 'Notes/Topic_diagram.drawio.md'), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.filter(button => button.text === 'Export')).toHaveLength(1);

        const iframe = findByTag(modal.contentEl, 'iframe');
        expect(iframe?.sandbox).toBe('allow-same-origin');
    });

    test('renders source-only artifacts without iframe or svg export actions', async () => {
        const source = '\\usepackage{circuitikz}\n\\begin{document}\n\\end{document}';
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'html',
            content: source,
            mimeType: 'text/x-tex',
            diagnostics: [{
                severity: 'warning',
                kind: 'render-svg-text-missing',
                message: 'SVG text token is missing.'
            }]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const iframe = findByTag(modal.contentEl, 'iframe');
        const sourcePreview = findByClass(modal.contentEl, 'notemd-diagram-preview-source-only-code');
        const buttons = collectButtons(modal.contentEl);

        expect(iframe).toBeNull();
        expect(sourcePreview?.text).toBe(source);
        expect(buttons.some(button => button.text === 'Save source file')).toBe(true);
        expect(buttons.some(button => button.text === 'Export')).toBe(false);
        expect(findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics')).not.toBeNull();
    });

    test('renders companion svg artifacts instead of source-only fallback', async () => {
        (previewExport.renderPreviewArtifactSvg as jest.Mock).mockResolvedValueOnce('<svg><text>Draw.io SVG</text></svg>');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'drawio',
            content: '<mxfile><diagram /></mxfile>',
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Draw.io SVG</text></svg>',
                mimeType: 'image/svg+xml'
            }
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const iframe = findByTag(modal.contentEl, 'iframe');
        const sourcePreview = findByClass(modal.contentEl, 'notemd-diagram-preview-source-only-code');
        const svgPreview = findByClass(modal.contentEl, 'is-svg-preview');
        const buttons = collectButtons(modal.contentEl);

        expect(iframe).toBeNull();
        expect(sourcePreview).toBeNull();
        expect(svgPreview?.innerHTML).toContain('Draw.io SVG');
        expect(buttons.filter(button => button.text === 'Export')).toHaveLength(1);
    });

    test('renders circuitikz companion svg artifacts with svg png and pdf export actions', async () => {
        (previewExport.renderPreviewArtifactSvg as jest.Mock).mockResolvedValueOnce('<svg><text>CMOS Inverter</text></svg>');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'circuitikz',
            content: '\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\end{circuitikz}\n\\end{document}',
            mimeType: 'text/x-tex',
            sourceIntent: 'circuit',
            previewSvg: {
                content: '<svg><text>CMOS Inverter</text></svg>',
                mimeType: 'image/svg+xml'
            }
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const iframe = findByTag(modal.contentEl, 'iframe');
        const sourcePreview = findByClass(modal.contentEl, 'notemd-diagram-preview-source-only-code');
        const svgPreview = findByClass(modal.contentEl, 'is-svg-preview');
        const buttons = collectButtons(modal.contentEl);

        expect(iframe).toBeNull();
        expect(sourcePreview).toBeNull();
        expect(svgPreview?.innerHTML).toContain('CMOS Inverter');
        expect(buttons.filter(button => button.text === 'Export')).toHaveLength(1);
    });

    test('hides save-source button when preview already points at saved artifact', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, {
            ...createSession(),
            payload: {
                ...createSession().payload,
                artifactSaved: true
            }
        }, 'en') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === 'Save source file')).toBe(false);
    });

    test('uses localized export label for chinese preview modal', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'zh-CN') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.filter(button => button.text === '导出')).toHaveLength(1);
        expect(buttons.some(button => button.text === '保存源码文件')).toBe(true);
    });

    test('uses localized vault history label for chinese preview modal', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'zh-CN', {
            historyStore: { loadPage: jest.fn(), removeEntry: jest.fn() }
        }) as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        expect(buttons.some(button => button.text === '历史')).toBe(true);
        expect(buttons.some(button => button.text === 'History')).toBe(false);
    });

    test('renders localized preview title when session provides one', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, {
            ...createSession(),
            payload: {
                ...createSession().payload,
                previewTitle: 'Mermaid 预览'
            }
        }, 'zh-CN') as any);

        modal.onOpen();
        await flushPromises();

        expect(collectText(modal.contentEl).some(text => text === 'Mermaid 预览')).toBe(true);
    });

    test('renders artifact diagnostics in the preview stage', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'error',
                kind: 'render-png-blank',
                message: 'Expected PNG render artifact appears visually blank.',
                advice: 'Inspect the renderer before repair.'
            }]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const diagnosticsPanel = findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics');
        expect(diagnosticsPanel).not.toBeNull();

        const text = collectText(diagnosticsPanel as MockElement);
        expect(text).toContain('Artifact diagnostics');
        expect(text).toContain('1 error(s) · 0 warning(s) · 0 info');
        expect(text).toContain('ERROR · render-png-blank');
        expect(text).toContain('Expected PNG render artifact appears visually blank.');
        expect(text).toContain('Advice: Inspect the renderer before repair.');
    });

    test('renders localized artifact diagnostics copy in chinese preview modal', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'warning',
                kind: 'render-svg-text-missing',
                message: 'SVG text token is missing.',
                advice: 'Check renderer text preservation.'
            }]
        }), 'zh-CN') as any);

        modal.onOpen();
        await flushPromises();

        const diagnosticsPanel = findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics');
        expect(diagnosticsPanel).not.toBeNull();

        const text = collectText(diagnosticsPanel as MockElement);
        expect(text).toContain('Artifact 诊断');
        expect(text).toContain('0 错误 · 1 警告 · 0 信息');
        expect(text).toContain('WARNING · render-svg-text-missing');
        expect(text).toContain('建议：Check renderer text preservation.');
    });

    test('shows preview history entries and disables the active one', async () => {
        const firstModal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en') as any);
        firstModal.onOpen();
        await flushPromises();

        const secondModal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }, 'Notes/Chart.md', 'dark'), 'en') as any);
        secondModal.onOpen();
        await flushPromises();

        const historyPanel = findByClass(secondModal.contentEl, 'notemd-diagram-preview-history');
        expect(historyPanel).toBeNull();
        if (!historyPanel) return;

        const historyButtons = collectButtons(historyPanel as MockElement);
        expect(historyButtons.some(button => button.text === 'Topic.md')).toBe(true);
        expect(historyButtons.some(button => button.text === 'Chart.md' && button.disabled)).toBe(true);
    });

    test('keeps history entries distinct when artifact diagnostics differ', async () => {
        const firstModal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'warning',
                kind: 'render-svg-text-missing',
                message: 'Missing expected SVG text.'
            }]
        }, 'Notes/Topic.md', 'dark'), 'en') as any);
        firstModal.onOpen();
        await flushPromises();

        const secondModal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'error',
                kind: 'render-png-blank',
                message: 'Blank PNG.'
            }]
        }, 'Notes/Topic.md', 'dark'), 'en') as any);
        secondModal.onOpen();
        await flushPromises();

        const historyPanel = findByClass(secondModal.contentEl, 'notemd-diagram-preview-history');
        expect(historyPanel).toBeNull();
        if (!historyPanel) return;

        const historyText = collectText(historyPanel as MockElement);
        expect(historyText.some(text => text.includes('1 error(s) · 0 warning(s) · 0 info'))).toBe(true);

        const historyButtons = collectButtons(historyPanel as MockElement);
        expect(historyButtons.filter(button => button.text === 'Topic.md')).toHaveLength(2);
    });

    test('uses localized diagnostic summary in chinese preview history', async () => {
        const firstModal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'error',
                kind: 'render-png-blank',
                message: 'Blank PNG.'
            }]
        }, 'Notes/Topic.md', 'dark'), 'zh-CN') as any);
        firstModal.onOpen();
        await flushPromises();

        const secondModal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{
                severity: 'warning',
                kind: 'render-svg-text-missing',
                message: 'Missing expected SVG text.'
            }]
        }, 'Notes/Chart.md', 'dark'), 'zh-CN') as any);
        secondModal.onOpen();
        await flushPromises();

        const historyPanel = findByClass(secondModal.contentEl, 'notemd-diagram-preview-history');
        expect(historyPanel).toBeNull();
        if (!historyPanel) return;

        const historyText = collectText(historyPanel as MockElement);
        expect(historyText.some(text => text.includes('1 错误 · 0 警告 · 0 信息'))).toBe(true);
        expect(historyText.some(text => text.includes('0 错误 · 1 警告 · 0 信息'))).toBe(true);
    });
});
