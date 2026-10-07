jest.mock('../rendering/preview/svgHostSanitizer', () => ({ mountDiagramSvg: (container: { innerHTML: string }, svg: string) => { container.innerHTML = svg; } }));
import { Notice } from 'obsidian';
import { DiagramPreviewModal } from '../ui/DiagramPreviewModal';
import { clearDiagramPreviewHistory } from '../ui/diagramPreviewHistory';
import { mockApp } from './__mocks__/app';
import * as mermaidPreview from '../rendering/preview/mermaidPreview';
import * as previewExport from '../rendering/preview/previewExport';
import * as bundledPreviewDeps from '../rendering/webview/bundledPreviewDeps';
import * as exportFolderModal from '../ui/DiagramPreviewExportFolderModal';
import * as exportRuns from '../diagram/diagramExportRun';
import { DiagramPreviewViewport } from '../ui/DiagramPreviewViewport';

// Browser geometry is covered by verify-diagram-preview-viewport.cjs. These
// Modal tests isolate lifecycle/renderer dispatch from the lightweight DOM mock.
jest.mock('../ui/DiagramPreviewViewport', () => ({
    DiagramPreviewViewport: jest.fn().mockImplementation((container: HTMLElement) => ({
        contentEl: container, refresh: jest.fn(),
        attachIframe: jest.fn((iframe: HTMLIFrameElement) => {
            const body = iframe.contentDocument?.body;
            iframe.style.height = `${Math.max(body?.scrollHeight ?? 0, body?.offsetHeight ?? 0, 260)}px`;
        }),
        destroy: jest.fn()
    }))
}));

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
        saveDiagramPreviewSvgToFolder: jest.fn().mockResolvedValue('Notes/Topic_preview.svg'),
        saveDiagramPreviewPngToFolder: jest.fn().mockResolvedValue('Notes/Topic_preview.png'),
        saveDiagramPreviewPdfToFolder: jest.fn().mockResolvedValue('Notes/Topic_preview.pdf'),
        saveDiagramPreviewPanelSvg: jest.fn().mockResolvedValue('Notes/Topic_preview_mermaid-1.svg'),
        saveDiagramPreviewPanelSvgToFolder: jest.fn(),
        saveDiagramPreviewPanelPng: jest.fn().mockResolvedValue('Notes/Topic_preview_mermaid-1.png'),
        saveDiagramPreviewPanelPngToFolder: jest.fn(),
        saveDiagramPreviewPanelPdf: jest.fn().mockResolvedValue('Notes/Topic_preview_mermaid-1.pdf'),
        saveDiagramPreviewPanelPdfToFolder: jest.fn(),
        saveDiagramSourceArtifact: jest.fn().mockResolvedValue('Notes/Topic_diagram.json')
    };
});

jest.mock('../rendering/webview/bundledPreviewDeps', () => ({
    getBundledMermaidPreviewDeps: jest.fn(() => bundledMermaidDeps),
    getBundledVegaLitePreviewDeps: jest.fn(() => bundledVegaLiteDeps)
}));

jest.mock('../ui/DiagramPreviewExportFolderModal', () => ({
    selectDiagramPreviewExport: jest.fn()
}));

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    children: MockElement[];
    innerHTML: string;
    onclick?: ((event?: MouseEvent) => unknown | Promise<unknown>) | null;
    disabled: boolean;
    style: { height?: string };
    contentDocument?: {
        body?: { scrollHeight?: number; offsetHeight?: number };
        querySelector?: (selector: string) => { getBoundingClientRect: () => { height: number } } | null;
    };
    onload?: (() => void) | null;
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
        style: {},
        contentDocument: undefined,
        onload: null,
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

function collectByTag(root: MockElement, tag: string): MockElement[] {
    const matches = root.tag === tag ? [root] : [];
    for (const child of root.children) {
        matches.push(...collectByTag(child, tag));
    }
    return matches;
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
    await new Promise<void>(resolve => setImmediate(resolve));
}

let selectedExportFormats = ['SVG'];

async function choosePreviewExport(modal: any, index: number): Promise<void> {
    selectedExportFormats = [['SVG'], ['PNG'], ['PDF']][index];
    const exportButton = collectButtons(modal.contentEl).find(button => button.text === 'Export' || button.text === '导出');
    await exportButton?.onclick?.();
}

async function choosePanelExport(modal: any, panelIndex: number, itemIndex: number): Promise<void> {
    selectedExportFormats = [['SVG'], ['PNG'], ['PDF']][itemIndex];
    const exportButtons = collectButtons(modal.contentEl).filter(button => button.text === 'Export' || button.text === '导出');
    await exportButtons[panelIndex + 1]?.onclick?.();
}

describe('diagram preview modal', () => {
    test('exports selected formats from one folder confirmation without truncating the selection', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockResolvedValue({ folderPath: 'Exports', formats: ['SVG', 'PDF'] });
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en'));
        modal.onOpen();
        await collectButtons(modal.contentEl).find(button => button.text === 'Export')!.onclick?.();
        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledTimes(1);
        expect(previewExport.saveDiagramPreviewSvgToFolder).toHaveBeenCalled();
        expect(previewExport.saveDiagramPreviewPdfToFolder).toHaveBeenCalled();
        expect(previewExport.saveDiagramPreviewPngToFolder).not.toHaveBeenCalled();
    });

    test('canceling format selection writes no files and releases export controls', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockResolvedValue(null);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en'));
        modal.onOpen();
        const button = collectButtons(modal.contentEl).find(button => button.text === 'Export')!;
        await button.onclick?.();
        expect(previewExport.saveDiagramPreviewSvgToFolder).not.toHaveBeenCalled();
        expect(previewExport.saveDiagramPreviewPdfToFolder).not.toHaveBeenCalled();
        expect(button.disabled).toBe(false);
    });

    test('shows the active format while exporting and restores the action label', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockResolvedValue({ folderPath: 'Exports', formats: ['SVG', 'PDF'] });
        let finish!: (path: string) => void;
        (previewExport.saveDiagramPreviewSvgToFolder as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en'));
        modal.onOpen();
        const button = collectButtons(modal.contentEl).find(button => button.text === 'Export')!;
        const pending = button.onclick?.();
        await new Promise(resolve => setImmediate(resolve));
        expect(button.text).toContain('Exporting');
        expect(button.disabled).toBe(true);
        finish('Exports/result.svg');
        await pending;
        expect(button.text).toBe('Export');
        expect(button.disabled).toBe(false);
    });

    test('closing the preview while selecting formats prevents later export writes', async () => {
        let select!: (selection: exportFolderModal.DiagramPreviewExportSelection) => void;
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(() => new Promise(resolve => { select = resolve; }));
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en'));
        modal.onOpen();
        const pending = collectButtons(modal.contentEl).find(button => button.text === 'Export')!.onclick?.();
        modal.onClose();
        select({ folderPath: 'Notes', formats: ['SVG', 'PNG', 'PDF'] });
        await pending;
        expect(previewExport.saveDiagramPreviewSvgToFolder).not.toHaveBeenCalled();
        expect(previewExport.saveDiagramPreviewPngToFolder).not.toHaveBeenCalled();
        expect(previewExport.saveDiagramPreviewPdfToFolder).not.toHaveBeenCalled();
    });

    test('multi-format PNG export retains compatibility companion paths and configured resolution', async () => {
        const recordExportPath = jest.fn().mockResolvedValue(undefined);
        const files = ['Exports/Topic_preview.png', 'Exports/Topic_preview_obsidian.png'];
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockResolvedValue({ folderPath: 'Exports', formats: ['PNG', 'PDF'] });
        (previewExport.saveDiagramPreviewPngToFolder as jest.Mock).mockImplementationOnce(async (_app, _source, _folder, _artifact, deps) => {
            expect(deps).toEqual(expect.objectContaining({ ppi: 450, obsidianCompatiblePng: true, signal: expect.any(AbortSignal) }));
            await deps.onPngSaved({ path: files[0], files });
            return files[0];
        });
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en', {
            exportPpi: 450, historyEntryId: 'one', historyStore: { loadPage: jest.fn(), removeEntry: jest.fn(), recordExportPath }
        }));
        modal.onOpen();
        await collectButtons(modal.contentEl).find(button => button.text === 'Export')!.onclick?.();
        expect(recordExportPath).toHaveBeenCalledWith('one', 'png', files[0], files);
        expect(recordExportPath).toHaveBeenCalledWith('one', 'pdf', 'Notes/Topic_preview.pdf');
    });

    test('a failed format does not prevent another format and repeated clicks do not start duplicate batches', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockResolvedValue({ folderPath: 'Exports', formats: ['SVG', 'PDF'] });
        (previewExport.saveDiagramPreviewSvgToFolder as jest.Mock).mockRejectedValueOnce(new Error('SVG failed'));
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en'));
        modal.onOpen();
        const button = collectButtons(modal.contentEl).find(button => button.text === 'Export')!;
        await Promise.all([button.onclick?.(), button.onclick?.()]);
        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledTimes(1);
        expect(previewExport.saveDiagramPreviewPdfToFolder).toHaveBeenCalledTimes(1);
        expect(Notice).toHaveBeenCalledWith(expect.stringContaining('SVG failed'));
        expect(Notice).toHaveBeenLastCalledWith(expect.stringContaining('SVG failed'));
    });

    test.each([
        ['completed', 'completed', false],
        ['partial', 'completed', true],
        ['partial', 'pending', true],
        ['partial', 'failed', true],
        ['cancelled', 'cancelled', true]
    ] as const)('export disclosure for %s run with %s output is open=%s', (status, outputStatus, open) => {
        const run: exportRuns.DiagramExportRun = {
            status, sourcePath: 'Notes/Topic.md', manifestPath: 'Notes/run/run.notemd-diagram.json',
            plan: { typeId: 'flowchart', target: 'mermaid', outputs: ['svg'], inactiveOutputs: [], usedDefaultOutput: false },
            outputs: [{ id: 'svg', path: 'Notes/run/diagram.svg', status: outputStatus, files: [] }]
        };
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en', { exportRun: run }));
        modal.onOpen();
        const panel = findByClass(modal.contentEl, 'notemd-diagram-export-run')!;
        expect(panel.tag).toBe('details');
        expect((panel as unknown as HTMLDetailsElement).open).toBe(open);
        expect(collectByTag(panel, 'summary')).toHaveLength(1);
        expect(collectText(panel).join(' ')).toContain(run.manifestPath);
    });

    test('keeps successful exports visible when recording their history fails', async () => {
        const run: exportRuns.DiagramExportRun = {
            status: 'partial', sourcePath: 'Notes/Topic.md', manifestPath: 'Notes/run/run.notemd-diagram.json',
            plan: { typeId: 'flowchart', target: 'mermaid', outputs: ['svg'], inactiveOutputs: [], usedDefaultOutput: false },
            outputs: [{ id: 'svg', path: 'Notes/run/diagram.svg', status: 'failed', files: [] }]
        };
        const saved: exportRuns.DiagramExportRun = { ...run, status: 'completed', outputs: run.outputs.map(output => ({ ...output, status: 'completed' })) };
        const retry = jest.spyOn(exportRuns, 'retryDiagramExportRun').mockResolvedValue(saved);
        try {
            const modal = mountModal(new DiagramPreviewModal(mockApp, createSession(), 'en', {
                exportRun: run, onExportRunSaved: async () => { throw new Error('history index unavailable'); }
            }));
            modal.onOpen();
            await collectButtons(modal.contentEl).find(button => button.text === 'Retry unfinished exports')!.onclick?.();
            const panel = findByClass(modal.contentEl, 'notemd-diagram-export-run')!;
            expect((panel as unknown as HTMLDetailsElement).open).toBe(true);
            expect(collectText(panel).join(' ')).toContain('history index unavailable');
            expect(collectText(panel).join(' ')).toContain('1/1');
            expect(collectByTag(panel, 'a').some(link => link.text === saved.outputs[0].path)).toBe(true);
            expect(collectButtons(panel).some(button => button.text === 'Retry unfinished exports')).toBe(false);
        } finally { retry.mockRestore(); }
    });

    test.each(['warning', 'error'] as const)('completed export disclosure respects %s artifact diagnostics', severity => {
        const run: exportRuns.DiagramExportRun = {
            status: 'completed', sourcePath: 'Notes/Topic.md', manifestPath: 'Notes/run/run.notemd-diagram.json',
            plan: { typeId: 'flowchart', target: 'mermaid', outputs: ['svg'], inactiveOutputs: [], usedDefaultOutput: false },
            outputs: [{ id: 'svg', path: 'Notes/run/diagram.svg', status: 'completed', files: [] }]
        };
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{ severity, kind: 'render-svg-text-missing', message: 'Diagnostic evidence' }]
        }), 'en', { exportRun: run }));
        modal.onOpen();
        const panel = findByClass(modal.contentEl, 'notemd-diagram-export-run')!;
        expect((panel as unknown as HTMLDetailsElement).open).toBe(severity === 'error');
    });

    test('shows partial delivery and retries the saved run rather than generating another diagram', async () => {
        const run: exportRuns.DiagramExportRun = {
            status: 'partial', sourcePath: 'Notes/Topic.md', manifestPath: 'Notes/run/run.notemd-diagram.json',
            plan: { typeId: 'flowchart', target: 'mermaid', outputs: ['svg', 'pdf'], inactiveOutputs: [{ id: 'source:drawnix', reason: 'incompatible-type' }], usedDefaultOutput: false },
            outputs: [{ id: 'svg', path: 'Notes/run/diagram.svg', status: 'completed', files: [] }, { id: 'pdf', path: 'Notes/run/diagram.pdf', status: 'failed', error: 'PDF failed', files: [] }]
        };
        const saved: exportRuns.DiagramExportRun = { ...run, status: 'completed', outputs: run.outputs.map(output => ({ ...output, status: 'completed', error: undefined })) };
        const retry = jest.spyOn(exportRuns, 'retryDiagramExportRun').mockResolvedValue(saved);
        const record = jest.fn(async () => undefined);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md'), 'en', { exportRun: run, onExportRunSaved: record }));
        modal.onOpen();
        const panel = findByClass(modal.contentEl, 'notemd-diagram-export-run')!;
        expect(panel.children.some(child => child.text.includes('1/2'))).toBe(true);
        expect(panel.children.some(child => child.text.includes('Not included'))).toBe(true);
        const button = collectButtons(panel).find(button => button.text === 'Retry unfinished exports')!;
        await button.onclick?.();
        expect(retry).toHaveBeenCalledWith(mockApp, run.manifestPath, expect.objectContaining({ cancelled: false }));
        expect(record).toHaveBeenCalledWith(saved);
        expect(collectButtons(modal.contentEl).some(button => button.text === 'Retry unfinished exports')).toBe(false);
        retry.mockRestore();
    });

    beforeEach(() => {
        selectedExportFormats = ['SVG'];
        jest.clearAllMocks();
        clearDiagramPreviewHistory();
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Notes', formats: selectedExportFormats }));
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                clipboard: {
                    writeText: jest.fn().mockResolvedValue(undefined)
                }
            }
        });
    });

    test('ignores a retired Drawnix delivery action supplied by stale preview options', async () => {
        const loadReplacement = jest.fn();
        const modal = mountModal(new DiagramPreviewModal(
            mockApp,
            createSession({
                target: 'drawnix',
                content: '{"type":"drawnix"}',
                mimeType: 'application/json',
                sourceIntent: 'drawnixMindmap'
            }),
            'en',
            {
                drawnixAlternateDelivery: {
                    label: 'Presentation delivery',
                    loadReplacement
                }
            } as any
        ) as any);

        modal.onOpen();

        const switchButton = collectButtons(modal.contentEl).find(button => button.text === 'Presentation delivery');
        expect(switchButton).toBeUndefined();
        expect(loadReplacement).not.toHaveBeenCalled();
    });

    test('shows export button for preview-capable artifacts and saves svg on click', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({}, 'Notes/Topic.md', 'dark'), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const buttons = collectButtons(modal.contentEl);
        const exportButton = buttons.find(button => button.text === 'Export');

        expect(exportButton).toBeDefined();
        expect(mermaidPreview.renderMermaidArtifactSvg).not.toHaveBeenCalled();

        await choosePreviewExport(modal, 0);

        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'en'
        );
        expect(previewExport.saveDiagramPreviewSvgToFolder).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'Notes',
            expect.objectContaining({ target: 'mermaid' }),
            expect.objectContaining({
                theme: 'dark',
                mermaid: bundledMermaidDeps,
                vegaLiteDepsLoader: expect.any(Function)
            })
        );
        const exportDeps = (previewExport.saveDiagramPreviewSvgToFolder as jest.Mock).mock.calls[0][4];
        await expect(exportDeps.vegaLiteDepsLoader()).resolves.toBe(bundledVegaLiteDeps);
        expect(bundledPreviewDeps.getBundledVegaLitePreviewDeps).toHaveBeenCalled();
        expect(Notice).toHaveBeenCalledWith('Diagram preview exported to Notes/Topic_preview.svg');
        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledTimes(1);
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

        await choosePreviewExport(modal, 1);

        expect(previewExport.saveDiagramPreviewPngToFolder).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'Notes',
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

        await choosePreviewExport(modal, 2);

        expect(previewExport.saveDiagramPreviewPdfToFolder).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'Notes',
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

        await choosePreviewExport(modal, 2);

        expect(previewExport.saveDiagramPreviewPdfToFolder).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'Notes',
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

    test('sizes iframe previews to the rendered document height', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, {
            ...createSession({}, 'Notes/Topic.md', 'dark'),
            htmlSrcdoc: '<!DOCTYPE html><html><body><svg /></body></html>'
        }, 'en') as any);

        modal.onOpen();
        await flushPromises();

        const iframe = findByTag(modal.contentEl, 'iframe') as MockElement;
        iframe.contentDocument = {
            body: { scrollHeight: 928, offsetHeight: 928 },
            querySelector: () => ({ getBoundingClientRect: () => ({ height: 900 }) })
        };
        iframe.onload?.();

        expect(iframe.style.height).toBe('928px');
    });

    test('destroys per-diagram viewports before rerendering the preview', async () => {
            const modal = mountModal(new DiagramPreviewModal(mockApp, {
                ...createSession({}, 'Notes/Topic.md', 'dark'),
                htmlSrcdoc: '<!DOCTYPE html><html><body><svg /></body></html>'
            }, 'en') as any);

            modal.onOpen();
            await flushPromises();

            const iframe = findByTag(modal.contentEl, 'iframe') as MockElement;
            iframe.contentDocument = {
                body: { scrollHeight: 928, offsetHeight: 928 },
                querySelector: () => ({ getBoundingClientRect: () => ({ height: 900 }) })
            };
            iframe.onload?.();
            const viewport = (DiagramPreviewViewport as jest.Mock).mock.results[0].value;
            modal.renderModal();

            expect(viewport.destroy).toHaveBeenCalledTimes(1);
    });

    test('renders every ordered preview panel in the modal', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const panels = collectByTag(modal.contentEl, 'div').filter(panel => panel.cls === 'notemd-diagram-preview-panel');
        const iframes = collectByTag(modal.contentEl, 'iframe');

        expect(panels).toHaveLength(2);
        expect(iframes).toHaveLength(2);
        expect(iframes[0].srcdoc).toContain('flowchart TD');
        expect(iframes[1].srcdoc).toContain('sequenceDiagram');
        expect(DiagramPreviewViewport).toHaveBeenCalledTimes(2);
    });

    test('marks the preview body as a vertical scroll region for tall multi-panel previews', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [{
                id: 'mermaid-1',
                artifact: {
                    target: 'mermaid',
                    content: '```mermaid\nflowchart TD\nA --> B\n```',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'flowchart'
                }
            }]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const body = findByClass(modal.contentEl, 'notemd-diagram-preview-body');
        expect(body?.cls).toContain('notemd-diagram-preview-scroll-region');
    });

    test('exports an individual preview panel from its own menu', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        (previewExport.saveDiagramPreviewPanelSvgToFolder as jest.Mock)
            .mockResolvedValue('Exports/Topic_preview_mermaid-2.svg');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        await choosePanelExport(modal, 1, 0);

        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'en'
        );
        expect(previewExport.saveDiagramPreviewPanelSvgToFolder).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'mermaid-2',
            'Exports',
            expect.objectContaining({ sourceIntent: 'sequence' }),
            expect.objectContaining({ theme: 'system', mermaid: bundledMermaidDeps })
        );
        expect(previewExport.saveDiagramPreviewSvg).not.toHaveBeenCalled();
        expect(Notice).toHaveBeenCalledWith('Diagram preview exported to Exports/Topic_preview_mermaid-2.svg');
    });

    test.each([
        ['PNG', 1, 'saveDiagramPreviewPanelPngToFolder', 'Exports/Topic_preview_mermaid-2.png'],
        ['PDF', 2, 'saveDiagramPreviewPanelPdfToFolder', 'Exports/Topic_preview_mermaid-2.pdf']
    ])('uses the selected folder for an individual %s preview panel export', async (_label, menuIndex, saveMethod, outputPath) => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        const saver = (previewExport as any)[saveMethod] as jest.Mock;
        saver.mockResolvedValue(outputPath);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [{
                id: 'mermaid-1',
                artifact: {
                    target: 'mermaid',
                    content: '```mermaid\nflowchart TD\nA --> B\n```',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'flowchart'
                }
            }, {
                id: 'mermaid-2',
                artifact: {
                    target: 'mermaid',
                    content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'sequence'
                }
            }]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();
        await choosePanelExport(modal, 1, menuIndex as number);

        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'en'
        );
        expect(saver).toHaveBeenCalledWith(
            mockApp,
            'Notes/Topic.md',
            'mermaid-2',
            'Exports',
            expect.objectContaining({ sourceIntent: 'sequence' }),
            expect.objectContaining({ theme: 'system' })
        );
        expect(Notice).toHaveBeenCalledWith(expect.stringContaining(outputPath as string));
    });

    test('prompts for a folder and exports every preview panel as a separate svg', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        (previewExport.saveDiagramPreviewPanelSvgToFolder as jest.Mock)
            .mockResolvedValueOnce('Exports/Topic_preview_mermaid-1.svg')
            .mockResolvedValueOnce('Exports/Topic_preview_mermaid-2.svg');
        const recordExportPath = jest.fn().mockResolvedValue(undefined);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en', {
            historyEntryId: 'diagram-one',
            historyStore: { loadPage: jest.fn(), removeEntry: jest.fn(), recordExportPath }
        }) as any);

        modal.onOpen();
        await flushPromises();
        await choosePreviewExport(modal, 0);

        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledWith(mockApp, 'Notes/Topic.md', 'en');
        expect(previewExport.saveDiagramPreviewPanelSvgToFolder).toHaveBeenNthCalledWith(
            1,
            mockApp,
            'Notes/Topic.md',
            'mermaid-1',
            'Exports',
            expect.objectContaining({ sourceIntent: 'flowchart' }),
            expect.objectContaining({ theme: 'system', mermaid: bundledMermaidDeps })
        );
        expect(previewExport.saveDiagramPreviewPanelSvgToFolder).toHaveBeenNthCalledWith(
            2,
            mockApp,
            'Notes/Topic.md',
            'mermaid-2',
            'Exports',
            expect.objectContaining({ sourceIntent: 'sequence' }),
            expect.objectContaining({ theme: 'system', mermaid: bundledMermaidDeps })
        );
        expect(recordExportPath).toHaveBeenNthCalledWith(1, 'diagram-one', 'svg', 'Exports/Topic_preview_mermaid-1.svg');
        expect(recordExportPath).toHaveBeenNthCalledWith(2, 'diagram-one', 'svg', 'Exports/Topic_preview_mermaid-2.svg');
        expect(Notice).toHaveBeenCalledWith('Exported 2 of 2 SVG files to Exports');
        expect(previewExport.saveDiagramPreviewSvg).not.toHaveBeenCalled();
    });

    test('continues separate svg export after one panel fails', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        (previewExport.saveDiagramPreviewPanelSvgToFolder as jest.Mock)
            .mockRejectedValueOnce(new Error('first panel failed'))
            .mockResolvedValueOnce('Exports/Topic_preview_mermaid-2.svg');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();
        await choosePreviewExport(modal, 0);

        expect(previewExport.saveDiagramPreviewPanelSvgToFolder).toHaveBeenCalledTimes(2);
        expect(Notice).toHaveBeenCalledWith('Exported 1 of 2 SVG files. Failed: mermaid-1: first panel failed.');
    });

    test.each([
        ['PNG', 1, 'saveDiagramPreviewPanelPngToFolder', 'Exports/Topic_preview_mermaid-1.png'],
        ['PDF', 2, 'saveDiagramPreviewPanelPdfToFolder', 'Exports/Topic_preview_mermaid-1.pdf']
    ])('prompts for a folder and exports every preview panel as separate %s files', async (_label, menuIndex, saveMethod, firstOutputPath) => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        const saver = (previewExport as any)[saveMethod] as jest.Mock;
        saver
            .mockResolvedValueOnce(firstOutputPath)
            .mockResolvedValueOnce(firstOutputPath.replace('mermaid-1', 'mermaid-2'));
        const recordExportPath = jest.fn().mockResolvedValue(undefined);
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en', {
            historyEntryId: 'diagram-one',
            historyStore: { loadPage: jest.fn(), removeEntry: jest.fn(), recordExportPath }
        }) as any);

        modal.onOpen();
        await flushPromises();
        await choosePreviewExport(modal, menuIndex as number);

        expect(exportFolderModal.selectDiagramPreviewExport).toHaveBeenCalledWith(mockApp, 'Notes/Topic.md', 'en');
        expect(saver).toHaveBeenNthCalledWith(
            1,
            mockApp,
            'Notes/Topic.md',
            'mermaid-1',
            'Exports',
            expect.objectContaining({ sourceIntent: 'flowchart' }),
            expect.objectContaining({ theme: 'system', ppi: 300 })
        );
        expect(saver).toHaveBeenNthCalledWith(
            2,
            mockApp,
            'Notes/Topic.md',
            'mermaid-2',
            'Exports',
            expect.objectContaining({ sourceIntent: 'sequence' }),
            expect.objectContaining({ theme: 'system', ppi: 300 })
        );
        expect(recordExportPath).toHaveBeenCalledTimes(2);
        expect(Notice).toHaveBeenCalledWith(expect.stringContaining('Exported 2 of 2'));
    });

    test('continues separate pdf export after one panel fails', async () => {
        (exportFolderModal.selectDiagramPreviewExport as jest.Mock).mockImplementation(async () => ({ folderPath: 'Exports', formats: selectedExportFormats }));
        (previewExport.saveDiagramPreviewPanelPdfToFolder as jest.Mock)
            .mockRejectedValueOnce(new Error('first pdf failed'))
            .mockResolvedValueOnce('Exports/Topic_preview_mermaid-2.pdf');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();
        await choosePreviewExport(modal, 2);

        expect(previewExport.saveDiagramPreviewPanelPdfToFolder).toHaveBeenCalledTimes(2);
        expect(Notice).toHaveBeenCalledWith('Exported 1 of 2 PDF files. Failed: mermaid-1: first pdf failed.');
    });

    test('shows export controls for image panels represented by preview svg', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'drawnix',
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            previewSvg: { content: '<svg><text>Drawnix</text></svg>', mimeType: 'image/svg+xml' },
            previewPanels: [{
                id: 'source-visual-image',
                artifact: {
                    target: 'html',
                    content: '<!DOCTYPE html><img src="data:image/png;base64,AAAA">',
                    mimeType: 'text/html',
                    sourceIntent: 'flowchart',
                    previewSvg: { content: '<svg><image href="data:image/png;base64,AAAA" /></svg>', mimeType: 'image/svg+xml' }
                }
            }]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        const exportButtons = collectButtons(modal.contentEl).filter(button => button.text === 'Export');
        expect(exportButtons).toHaveLength(2);
    });

    test('shows the Drawnix primary visual and persisted source visual panels together', async () => {
        (previewExport.renderPreviewArtifactSvg as jest.Mock).mockResolvedValueOnce('<svg><text>Drawnix primary</text></svg>');
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            target: 'drawnix',
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Drawnix primary</text></svg>',
                mimeType: 'image/svg+xml'
            },
            previewPanels: [
                {
                    id: 'drawnix-primary',
                    artifact: {
                        target: 'drawnix',
                        content: '{"type":"drawnix","elements":[]}',
                        mimeType: 'application/vnd.drawnix+json',
                        sourceIntent: 'flowchart',
                        previewSvg: {
                            content: '<svg><text>Drawnix primary</text></svg>',
                            mimeType: 'image/svg+xml'
                        }
                    }
                },
                {
                    id: 'source-visual-1',
                    artifact: {
                        target: 'html',
                        content: '<!DOCTYPE html><html><body><svg><text>Mermaid companion</text></svg></body></html>',
                        mimeType: 'text/html',
                        sourceIntent: 'flowchart',
                        previewSvg: {
                            content: '<svg><text>Mermaid companion</text></svg>',
                            mimeType: 'image/svg+xml'
                        }
                    }
                }
            ]
        }), 'en') as any);

        modal.onOpen();
        await flushPromises();

        expect(findByClass(modal.contentEl, 'is-svg-preview')).not.toBeNull();
        expect(collectByTag(modal.contentEl, 'iframe')).toHaveLength(1);
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

    test('separates severity within diagnostic tags and expands only error groups without losing records', async () => {
        const diagnostics = [
            { severity: 'info' as const, kind: 'node-merged', message: 'First node merged.', advice: 'First source id.' },
            { severity: 'warning' as const, kind: 'future-tag', message: 'Future diagnostic.' },
            { severity: 'error' as const, kind: 'node-merged', message: 'Second node needs attention.', advice: 'Second source id.' },
            { severity: 'info' as const, kind: 'node-merged', message: 'Another node merged.' }
        ];
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({ diagnostics }), 'en') as any);
        modal.onOpen();
        await flushPromises();

        const list = findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics-list') as MockElement;
        expect(list.children).toHaveLength(3);
        expect(list.children.map(group => group.tag)).toEqual(['details', 'details', 'details']);
        for (const [index, group] of list.children.entries()) {
            expect((group as MockElement & { open?: boolean }).open).toBe(index === 2);
            expect(group.children[0].tag).toBe('summary');
        }
        expect(collectText(list.children[0].children[0])).toEqual(expect.arrayContaining([
            'node-merged', '0 error(s) · 0 warning(s) · 2 info'
        ]));
        expect(collectText(list.children[1].children[0])).toContain('future-tag');
        expect(collectText(list.children[2].children[0])).toEqual(expect.arrayContaining([
            'node-merged', '1 error(s) · 0 warning(s) · 0 info'
        ]));
        expect(collectText(list.children[2])).not.toContain('First node merged.');
        const text = collectText(modal.contentEl);
        expect(text).toContain('1 error(s) · 1 warning(s) · 2 info');
        for (const diagnostic of diagnostics) {
            expect(text).toContain(diagnostic.message);
            if (diagnostic.advice) expect(text).toContain(`Advice: ${diagnostic.advice}`);
        }
        expect(diagnostics.map(diagnostic => diagnostic.kind)).toEqual(['node-merged', 'future-tag', 'node-merged', 'node-merged']);
    });

    test.each(['info', 'warning', 'error'] as const)('opens the whole diagnostic panel only for errors (%s)', async severity => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({
            diagnostics: [{ severity, kind: 'future-tag', message: 'Complete diagnostic evidence.' }]
        }), 'en') as any);
        modal.onOpen();
        await flushPromises();

        const panel = findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics') as MockElement & { open: boolean };
        expect(panel.tag).toBe('details');
        expect(panel.open).toBe(severity === 'error');
        expect(panel.children[0].tag).toBe('summary');
        expect(collectText(panel.children[0])).toContain('Artifact diagnostics');
        expect(collectText(panel.children[0])).toContain(
            `${severity === 'error' ? 1 : 0} error(s) · ${severity === 'warning' ? 1 : 0} warning(s) · ${severity === 'info' ? 1 : 0} info`
        );
        expect(collectText(panel)).toContain('Complete diagnostic evidence.');
    });

    test('omits the diagnostic panel when there are no diagnostics', async () => {
        const modal = mountModal(new DiagramPreviewModal(mockApp, createSession({ diagnostics: [] }), 'en') as any);
        modal.onOpen();
        await flushPromises();
        expect(findByClass(modal.contentEl, 'notemd-diagram-preview-diagnostics')).toBeNull();
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
