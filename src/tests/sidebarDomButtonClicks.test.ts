import { getLanguage, MarkdownView, TFile } from 'obsidian';
import { NotemdSidebarView } from '../ui/NotemdSidebarView';
import { mockApp } from './__mocks__/app';
import { ApiLivenessEvent } from '../types';
import { probeEnvironment } from '../slideExport';

jest.mock('../slideExport', () => ({
    probeEnvironment: jest.fn()
}));

type MockPlugin = {
    app: typeof mockApp;
    settings: {
        availableLanguages: Array<{ code: string; name: string }>;
        language: string;
        uiLocale: string;
        useCustomConceptNoteFolder: boolean;
        conceptNoteFolder: string;
        customWorkflowButtonsDsl: string;
        customWorkflowErrorStrategy: 'stop_on_error' | 'continue_on_error';
        enableApiErrorDebugMode: boolean;
        slideExportDefaultFormat: 'html' | 'pdf' | 'png' | 'mp4';
    };
    saveSettings: jest.Mock<Promise<void>, []>;
    getIsBusy: jest.Mock<boolean, []>;
    processWithNotemdCommand: jest.Mock<Promise<void>, [any]>;
    processFolderWithNotemdCommand: jest.Mock<Promise<void>, [any, string?]>;
    generateContentForTitleCommand: jest.Mock<Promise<void>, [any, any]>;
    batchGenerateContentForTitlesCommand: jest.Mock<Promise<any>, [any, string?]>;
    researchAndSummarizeCommand: jest.Mock<Promise<void>, [any, any, any]>;
    summarizeToMermaidCommand: jest.Mock<Promise<void>, [any, any]>;
    generateDiagramCommand: jest.Mock<Promise<void>, [any, any, any]>;
    previewDiagramCommand: jest.Mock<Promise<void>, [any, any]>;
    generateExperimentalDiagramCommand: jest.Mock<Promise<void>, [any, any]>;
    previewExperimentalDiagramCommand: jest.Mock<Promise<void>, [any, any]>;
    translateFileCommand: jest.Mock<Promise<void>, [any, any, any]>;
    batchTranslateFolderCommand: jest.Mock<Promise<void>, [any?, any?]>;
    extractConceptsCommand: jest.Mock<Promise<void>, [any]>;
    batchExtractConceptsForFolderCommand: jest.Mock<Promise<void>, [any]>;
    extractOriginalTextCommand: jest.Mock<Promise<void>, [any]>;
    batchExtractOriginalTextCommand: jest.Mock<Promise<void>, [any]>;
    splitNoteByChaptersCommand: jest.Mock<Promise<void>, [any]>;
    batchMermaidFixCommand: jest.Mock<Promise<void>, [any, string?]>;
    fixFormulaFormatsCommand: jest.Mock<Promise<void>, [any, any]>;
    batchFixFormulaFormatsCommand: jest.Mock<Promise<void>, [any]>;
    checkAndRemoveDuplicateConceptNotesCommand: jest.Mock<Promise<void>, [any]>;
    testLlmConnectionCommand: jest.Mock<Promise<void>, [any]>;
    generateSlidevExportOutlineCommand: jest.Mock<Promise<string>, [any, any]>;
    exportSlidesCommand: jest.Mock<Promise<void>, [any, any]>;
    exportSlidesFromOutlineCommand: jest.Mock<Promise<void>, [any, any]>;
};

class FakeElement {
    tag: string;
    text = '';
    cls: string[] = [];
    children: FakeElement[] = [];
    parent: FakeElement | null = null;
    onclick?: () => Promise<void> | void;
    onchange?: () => Promise<void> | void;
    disabled = false;
    open = false;
    dataset: Record<string, string> = {};
    attributes: Record<string, string> = {};
    style: Record<string, string> = {};
    value = '';
    type = '';
    checked = false;
    scrollTop = 0;
    scrollHeight = 100;
    inputEl: any;
    href = '';
    title = '';

    constructor(tag: string, options?: { text?: string; cls?: string; type?: string; href?: string; title?: string }) {
        this.tag = tag;
        if (options?.text) this.text = options.text;
        if (options?.cls) this.cls = options.cls.split(' ').filter(Boolean);
        if (options?.type) this.type = options.type;
        if (options?.href) this.href = options.href;
        if (options?.title) this.title = options.title;
        this.inputEl = {
            setAttrs: jest.fn(),
            value: ''
        };
    }

    private appendChild<T extends FakeElement>(child: T): T {
        child.parent = this;
        this.children.push(child);
        return child;
    }

    createEl(tag: string, options?: { text?: string; cls?: string; type?: string; href?: string; title?: string }): FakeElement {
        return this.appendChild(new FakeElement(tag, options));
    }

    createDiv(options?: { text?: string; cls?: string }): FakeElement {
        return this.createEl('div', options);
    }

    addClass(cls: string) {
        if (!this.cls.includes(cls)) this.cls.push(cls);
    }

    removeClass(cls: string) {
        this.cls = this.cls.filter(item => item !== cls);
    }

    setText(value: string) {
        this.text = value;
    }

    empty() {
        this.children = [];
    }

    setAttr(_name: string, _value: string) {
        this.attributes[_name] = _value;
        if (_name === 'href') this.href = _value;
        if (_name === 'title') this.title = _value;
        return;
    }

    setAttrs(_attrs: Record<string, string>) {
        Object.assign(this.attributes, _attrs);
        return;
    }

    add(_option: any) {
        return;
    }

    findButton(text: string): FakeElement | null {
        const content = this.textContent();
        if (this.tag === 'button' && (content === text || content.endsWith(` ${text}`))) {
            return this;
        }
        for (const child of this.children) {
            const match = child.findButton(text);
            if (match) return match;
        }
        return null;
    }

    findByClass(cls: string): FakeElement | null {
        if (this.cls.includes(cls)) {
            return this;
        }
        for (const child of this.children) {
            const match = child.findByClass(cls);
            if (match) return match;
        }
        return null;
    }

    findVisibleButton(text: string): FakeElement | null {
        const content = this.textContent();
        if (
            this.tag === 'button'
            && !this.isHidden()
            && (content === text || content.endsWith(` ${text}`))
        ) {
            return this;
        }
        for (const child of this.children) {
            const match = child.findVisibleButton(text);
            if (match) return match;
        }
        return null;
    }

    isHidden(): boolean {
        let current: FakeElement | null = this;
        while (current) {
            if (current.cls.includes('is-hidden') || current.attributes['aria-hidden'] === 'true') {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    textContent(): string {
        return [this.text, ...this.children.map(child => child.textContent())].filter(Boolean).join(' ');
    }
}

function createPluginMock(): MockPlugin {
    return {
        app: mockApp,
        settings: {
            availableLanguages: [{ code: 'en', name: 'English' }],
            language: 'en',
            uiLocale: 'auto',
            useCustomConceptNoteFolder: true,
            conceptNoteFolder: 'Concepts',
            customWorkflowButtonsDsl: 'One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix',
            customWorkflowErrorStrategy: 'stop_on_error',
            enableApiErrorDebugMode: false,
            slideExportDefaultFormat: 'html'
        },
        saveSettings: jest.fn().mockResolvedValue(undefined),
        getIsBusy: jest.fn(() => false),
        processWithNotemdCommand: jest.fn().mockResolvedValue(undefined),
        processFolderWithNotemdCommand: jest.fn().mockResolvedValue(undefined),
        generateContentForTitleCommand: jest.fn().mockResolvedValue(undefined),
        batchGenerateContentForTitlesCommand: jest.fn().mockResolvedValue({
            sourceFolderPath: 'Concepts',
            completeFolderPath: 'Concepts_complete'
        }),
        researchAndSummarizeCommand: jest.fn().mockResolvedValue(undefined),
        summarizeToMermaidCommand: jest.fn().mockResolvedValue(undefined),
        generateDiagramCommand: jest.fn().mockResolvedValue(undefined),
        previewDiagramCommand: jest.fn().mockResolvedValue(undefined),
        generateExperimentalDiagramCommand: jest.fn().mockResolvedValue(undefined),
        previewExperimentalDiagramCommand: jest.fn().mockResolvedValue(undefined),
        translateFileCommand: jest.fn().mockResolvedValue(undefined),
        batchTranslateFolderCommand: jest.fn().mockResolvedValue(undefined),
        extractConceptsCommand: jest.fn().mockResolvedValue(undefined),
        batchExtractConceptsForFolderCommand: jest.fn().mockResolvedValue(undefined),
        extractOriginalTextCommand: jest.fn().mockResolvedValue(undefined),
        batchExtractOriginalTextCommand: jest.fn().mockResolvedValue(undefined),
        splitNoteByChaptersCommand: jest.fn().mockResolvedValue(undefined),
        batchMermaidFixCommand: jest.fn().mockResolvedValue(undefined),
        fixFormulaFormatsCommand: jest.fn().mockResolvedValue(undefined),
        batchFixFormulaFormatsCommand: jest.fn().mockResolvedValue(undefined),
        checkAndRemoveDuplicateConceptNotesCommand: jest.fn().mockResolvedValue(undefined),
        testLlmConnectionCommand: jest.fn().mockResolvedValue(undefined),
        generateSlidevExportOutlineCommand: jest.fn().mockResolvedValue('export/_slidev-outlines/Active.outline.md'),
        exportSlidesCommand: jest.fn().mockResolvedValue(undefined),
        exportSlidesFromOutlineCommand: jest.fn().mockResolvedValue(undefined)
    };
}

function createMarkdownFile(path: string, name: string, extension = 'md'): TFile {
    return Object.assign(new (TFile as any)(), {
        path,
        name,
        extension,
        basename: name.replace(/\.[^.]+$/, ''),
        parent: { path: 'Notes' }
    });
}

function findAllByClass(root: FakeElement, cls: string): FakeElement[] {
    const matches: FakeElement[] = [];
    if (root.cls.includes(cls)) {
        matches.push(root);
    }
    for (const child of root.children) {
        matches.push(...findAllByClass(child, cls));
    }
    return matches;
}

function collectLinks(root: FakeElement): FakeElement[] {
    const matches: FakeElement[] = [];
    if (root.tag === 'a') {
        matches.push(root);
    }
    for (const child of root.children) {
        matches.push(...collectLinks(child));
    }
    return matches;
}

function findApiActivitySection(root: FakeElement, title: string): FakeElement | null {
    return findAllByClass(root, 'notemd-api-activity-section').find(section => (
        section.children.some(child => child.cls.includes('notemd-api-activity-section-title') && child.text === title)
    )) ?? null;
}

function findApiActivityItem(root: FakeElement, providerName: string): FakeElement | null {
    return findAllByClass(root, 'notemd-api-activity-item').find(item => (
        item.children.some(child => child.children.some(grandchild => (
            grandchild.cls.includes('notemd-api-activity-item-title') && grandchild.text === providerName
        )))
    )) ?? null;
}

describe('NotemdSidebarView DOM button wiring', () => {
    let plugin: MockPlugin;
    let sidebar: NotemdSidebarView;
    let rootContainer: FakeElement;
    let contentContainer: FakeElement;
    let mdFile: TFile;
    let txtFile: TFile;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        (getLanguage as jest.Mock).mockReturnValue('en');
        (global as any).Option = function Option(text: string, value: string) {
            return { text, value };
        };
        (global as any).navigator = {
            clipboard: {
                writeText: jest.fn().mockResolvedValue(undefined)
            }
        };

        plugin = createPluginMock();
        sidebar = new NotemdSidebarView({} as any, plugin as any);
        (sidebar as any).app = mockApp;

        rootContainer = new FakeElement('root');
        rootContainer.children = [new FakeElement('header'), new FakeElement('content')];
        contentContainer = rootContainer.children[1];
        (sidebar as any).containerEl = rootContainer as any;

        mdFile = createMarkdownFile('Notes/Active.md', 'Active.md', 'md');
        txtFile = createMarkdownFile('Notes/Active.txt', 'Active.txt', 'txt');
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mdFile);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('duplicate duplicate words');
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.workspace.iterateAllLeaves as jest.Mock).mockImplementation(() => {});
        (probeEnvironment as jest.Mock).mockResolvedValue({
            isDesktop: true,
            platform: 'linux',
            node: { tool: 'node', installed: false, version: null, error: 'node not found in PATH' },
            slidev: { tool: 'slidev', installed: false, version: null, error: 'Not available via npx slidev' },
            playwright: { tool: 'playwright', installed: false, version: null, error: 'Playwright chromium not installed' },
            ffmpeg: { tool: 'ffmpeg', installed: false, version: null, error: 'ffmpeg not found in PATH' },
            capabilities: { html: false, pdf: false, png: false, mp4: false }
        });
    });

    async function clickButton(label: string) {
        const button = contentContainer.findButton(label);
        expect(button).not.toBeNull();
        await button!.onclick?.();
    }

    test('renders action buttons and clicking each triggers mapped command', async () => {
        await sidebar.onOpen();

        const editor = { getSelection: jest.fn(), replaceSelection: jest.fn(), getValue: jest.fn(), setValue: jest.fn() };
        const mdView = Object.assign(new (MarkdownView as any)(), { file: mdFile, editor });
        (mockApp.workspace.iterateAllLeaves as jest.Mock).mockImplementation((cb: Function) => {
            cb({ view: mdView });
        });

        await clickButton('Process file (add links)');
        await clickButton('Process folder (add links)');
        await clickButton('Generate from title');
        await clickButton('Batch generate from titles');
        await clickButton('Research & summarize');
        await clickButton('Summarise as Mermaid diagram');
        await clickButton('Generate diagram');
        await clickButton('Preview diagram');
        await clickButton('Translate current file');
        await clickButton('Batch translate folder');
        await clickButton('Extract concepts (current file)');
        await clickButton('Extract concepts (folder)');
        await clickButton('Extract specific original text');
        await clickButton('Batch extract specific original text');
        await clickButton('Split note by chapters');
        await clickButton('Batch Mermaid fix');

        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(txtFile);
        await clickButton('Fix formula formats (current)');
        await clickButton('Batch fix formula formats');
        await clickButton('Check duplicates (current file)');
        await clickButton('Check & remove duplicates');
        await clickButton('Test LLM connection');

        expect(plugin.processWithNotemdCommand).toHaveBeenCalled();
        expect(plugin.processFolderWithNotemdCommand).toHaveBeenCalled();
        expect(plugin.generateContentForTitleCommand).toHaveBeenCalledWith(mdFile, expect.anything());
        expect(plugin.batchGenerateContentForTitlesCommand).toHaveBeenCalled();
        expect(plugin.researchAndSummarizeCommand).toHaveBeenCalledWith(editor, mdView, expect.anything());
        expect(plugin.summarizeToMermaidCommand).toHaveBeenCalledWith(mdFile, expect.anything());
        expect(plugin.generateDiagramCommand).toHaveBeenCalledWith(
            mdFile,
            expect.anything(),
            expect.objectContaining({ executionMode: 'save-artifact' })
        );
        expect(plugin.previewDiagramCommand).toHaveBeenCalledWith(mdFile, expect.anything());
        expect(plugin.generateExperimentalDiagramCommand).not.toHaveBeenCalled();
        expect(plugin.previewExperimentalDiagramCommand).not.toHaveBeenCalled();
        expect(plugin.translateFileCommand).toHaveBeenCalledWith(mdFile, expect.anything(), expect.anything());
        expect(plugin.batchTranslateFolderCommand).toHaveBeenCalled();
        expect(plugin.extractConceptsCommand).toHaveBeenCalled();
        expect(plugin.batchExtractConceptsForFolderCommand).toHaveBeenCalled();
        expect(plugin.extractOriginalTextCommand).toHaveBeenCalled();
        expect(plugin.batchExtractOriginalTextCommand).toHaveBeenCalled();
        expect(plugin.splitNoteByChaptersCommand).toHaveBeenCalled();
        expect(plugin.batchMermaidFixCommand).toHaveBeenCalled();
        expect(plugin.fixFormulaFormatsCommand).toHaveBeenCalledWith(txtFile, expect.anything());
        expect(plugin.batchFixFormulaFormatsCommand).toHaveBeenCalled();
        expect(mockApp.vault.read).toHaveBeenCalledWith(txtFile);
        expect(plugin.checkAndRemoveDuplicateConceptNotesCommand).toHaveBeenCalled();
        expect(plugin.testLlmConnectionCommand).toHaveBeenCalled();
    });

    test('uses Obsidian locale for sidebar action labels when uiLocale is auto', async () => {
        plugin.settings.uiLocale = 'auto';
        plugin.settings.availableLanguages = [
            { code: 'en', name: 'English' },
            { code: 'zh-CN', name: '简体中文' }
        ];
        (getLanguage as jest.Mock).mockReturnValue('zh-cn');

        await sidebar.onOpen();

        expect(contentContainer.findButton('处理文件（添加链接）')).not.toBeNull();
        expect(contentContainer.findButton('翻译当前文件')).not.toBeNull();
    });

    test('clicking default One-Click Extract workflow triggers chained commands', async () => {
        await sidebar.onOpen();
        await clickButton('One-Click Extract');

        expect(plugin.processWithNotemdCommand).toHaveBeenCalledTimes(1);
        expect(plugin.batchGenerateContentForTitlesCommand).toHaveBeenCalledTimes(1);
        expect(plugin.batchMermaidFixCommand).toHaveBeenCalledTimes(1);
    });

    test('uses colorful CTA styling only for single-file actions', async () => {
        await sidebar.onOpen();

        const processCurrent = contentContainer.findButton('Process file (add links)');
        const translateCurrent = contentContainer.findButton('Translate current file');
        const generateDiagram = contentContainer.findButton('Generate diagram');
        const previewDiagram = contentContainer.findButton('Preview diagram');
        const batchGenerate = contentContainer.findButton('Batch generate from titles');
        const batchTranslate = contentContainer.findButton('Batch translate folder');
        const workflowDefault = contentContainer.findButton('One-Click Extract');

        expect(processCurrent).not.toBeNull();
        expect(translateCurrent).not.toBeNull();
        expect(generateDiagram).not.toBeNull();
        expect(previewDiagram).not.toBeNull();
        expect(batchGenerate).not.toBeNull();
        expect(batchTranslate).not.toBeNull();
        expect(workflowDefault).not.toBeNull();

        expect(processCurrent?.cls).toContain('mod-cta');
        expect(translateCurrent?.cls).toContain('mod-cta');
        expect(generateDiagram?.cls).toContain('mod-cta');
        expect(previewDiagram?.cls).toContain('mod-cta');
        expect(batchGenerate?.cls).not.toContain('mod-cta');
        expect(batchTranslate?.cls).not.toContain('mod-cta');
        expect(workflowDefault?.cls).not.toContain('mod-cta');
    });

    test('builds a docked footer that keeps ready progress and logs visible', async () => {
        await sidebar.onOpen();

        const shell = contentContainer.findByClass('notemd-sidebar-shell');
        const scrollArea = contentContainer.findByClass('notemd-sidebar-scroll');
        const footer = contentContainer.findByClass('notemd-sidebar-footer');
        const footerScroll = contentContainer.findByClass('notemd-sidebar-footer-scroll');
        const progressValue = contentContainer.findByClass('notemd-progress-value');
        const progressBar = contentContainer.findByClass('notemd-progress-bar-container');
        const logCard = contentContainer.findByClass('notemd-log-card');
        const apiLiveness = contentContainer.findByClass('notemd-api-liveness');
        const apiLivenessText = contentContainer.findByClass('notemd-api-liveness-text');
        const apiActivity = contentContainer.findByClass('notemd-api-activity');
        const apiActivityContent = contentContainer.findByClass('notemd-api-activity-content');
        const apiActivityEmpty = contentContainer.findByClass('notemd-api-activity-empty');
        const activeSection = findApiActivitySection(contentContainer, 'Active');
        const recentSection = findApiActivitySection(contentContainer, 'Recent');
        const debugToggle = contentContainer.findByClass('notemd-debug-toggle-input');
        const copyApiActivityButton = contentContainer.findButton('Copy API activity');

        expect(shell).not.toBeNull();
        expect(scrollArea).not.toBeNull();
        expect(footer).not.toBeNull();
        expect(footer?.cls).toContain('mod-docked');
        expect(footerScroll).not.toBeNull();
        expect(progressValue?.text).toBe('Ready');
        expect(progressBar?.cls).toContain('is-idle');
        expect(logCard).not.toBeNull();
        expect(logCard?.cls).toContain('mod-persistent');
        expect(apiLivenessText?.text).toBe('Standby');
        expect(apiActivity).not.toBeNull();
        expect(apiActivityContent).not.toBeNull();
        expect(apiActivityEmpty?.text).toBe('No API activity yet.');
        expect(activeSection?.cls).toContain('is-hidden');
        expect(recentSection?.cls).toContain('is-hidden');
        expect(debugToggle).not.toBeNull();
        expect(copyApiActivityButton).not.toBeNull();
        expect((debugToggle as any)?.checked).toBe(false);
    });

    test('quick deep debug toggle writes back to settings immediately', async () => {
        await sidebar.onOpen();

        const debugToggle = contentContainer.findByClass('notemd-debug-toggle-input');
        expect(debugToggle).not.toBeNull();

        (debugToggle as any).checked = true;
        await debugToggle!.onchange?.();

        expect(plugin.settings.enableApiErrorDebugMode).toBe(true);
        expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    });

    test('renders slide export format selector and saves selected format', async () => {
        await sidebar.onOpen();

        const selector = contentContainer.findByClass('notemd-slide-export-format-select');
        expect(selector).not.toBeNull();
        expect(selector?.tag).toBe('select');
        expect(selector?.value).toBe('html');

        selector!.value = 'pdf';
        await selector!.onchange?.();

        expect(plugin.settings.slideExportDefaultFormat).toBe('pdf');
        expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    });

    test('renders slide export controls as one-shot by default and reveals ordered outline steps on demand', async () => {
        await sidebar.onOpen();

        const outlineToggle = contentContainer.findByClass('notemd-slide-export-outline-toggle');
        const directGroup = contentContainer.findByClass('notemd-slide-export-direct-actions');
        const outlineGroup = contentContainer.findByClass('notemd-slide-export-outline-actions');

        expect(outlineToggle).not.toBeNull();
        expect(outlineToggle?.tag).toBe('button');
        expect(outlineToggle?.attributes.role).toBe('switch');
        expect(outlineToggle?.attributes['aria-checked']).toBe('false');
        const probeButton = contentContainer.findVisibleButton('Probe slide export env');
        const oneShotButton = contentContainer.findVisibleButton('One-shot export');
        expect(probeButton).not.toBeNull();
        expect(probeButton?.cls).toContain('notemd-slide-export-secondary-button');
        expect(probeButton?.cls).not.toContain('mod-cta');
        expect(oneShotButton).not.toBeNull();
        expect(oneShotButton?.cls).toContain('mod-cta');
        expect(oneShotButton?.cls).toContain('is-primary');
        expect(contentContainer.findVisibleButton('Generate outline')).toBeNull();
        expect(contentContainer.findVisibleButton('Continue from outline')).toBeNull();
        expect(directGroup?.cls).not.toContain('is-hidden');
        expect(outlineGroup?.cls).toContain('is-hidden');

        await outlineToggle!.onclick?.();

        expect(outlineToggle?.attributes['aria-checked']).toBe('true');
        expect(outlineToggle?.cls).toContain('is-enabled');
        expect(directGroup?.cls).toContain('is-hidden');
        expect(outlineGroup?.cls).not.toContain('is-hidden');
        expect(contentContainer.findVisibleButton('One-shot export')).toBeNull();
        expect(contentContainer.findVisibleButton('Generate outline')).not.toBeNull();
        expect(contentContainer.findVisibleButton('Continue from outline')).not.toBeNull();
    });

    test('slide export controls call the concrete one-shot and outline commands with the sidebar reporter', async () => {
        await sidebar.onOpen();

        await contentContainer.findButton('One-shot export')!.onclick?.();
        expect(plugin.exportSlidesCommand).toHaveBeenCalledWith(mdFile, expect.objectContaining({
            log: expect.any(Function),
            updateStatus: expect.any(Function)
        }));

        const outlineToggle = contentContainer.findByClass('notemd-slide-export-outline-toggle');
        await outlineToggle!.onclick?.();

        await contentContainer.findButton('Generate outline')!.onclick?.();
        expect(plugin.generateSlidevExportOutlineCommand).toHaveBeenCalledWith(mdFile, expect.objectContaining({
            log: expect.any(Function),
            updateStatus: expect.any(Function)
        }));

        await contentContainer.findButton('Continue from outline')!.onclick?.();
        expect(plugin.exportSlidesFromOutlineCommand).toHaveBeenCalledWith(mdFile, expect.objectContaining({
            log: expect.any(Function),
            updateStatus: expect.any(Function)
        }));
    });

    test('slide export environment check renders inline install guidance with commands and official links', async () => {
        await sidebar.onOpen();

        await contentContainer.findButton('Probe slide export env')!.onclick?.();

        const panel = contentContainer.findByClass('notemd-slide-export-env-panel');
        expect(panel).not.toBeNull();
        expect(panel?.parent?.parent?.open).toBe(true);
        expect(panel?.textContent()).toContain('node --version');
        expect(panel?.textContent()).toContain('corepack enable');
        expect(panel?.textContent()).toContain('npx playwright install chromium');
        expect(panel?.textContent()).toContain('sudo apt install ffmpeg');
        expect(panel?.textContent()).toContain('Copy command');

        const links = collectLinks(panel!);
        expect(links.map(link => link.href)).toEqual(expect.arrayContaining([
            'https://nodejs.org/en/download',
            'https://sli.dev/builtin/cli',
            'https://playwright.dev/docs/intro',
            'https://ffmpeg.org/download.html'
        ]));
    });

    test('updateStatus swaps between active progress and idle standby states', async () => {
        await sidebar.onOpen();

        sidebar.updateStatus('Working...', 25);
        const progressValue = contentContainer.findByClass('notemd-progress-value');
        const progressBar = contentContainer.findByClass('notemd-progress-bar-container');
        const progressFill = contentContainer.findByClass('notemd-progress-bar-fill');

        expect(progressValue?.text).toBe('25%');
        expect(progressBar?.cls).not.toContain('is-idle');
        expect(progressFill?.text).toBe('');
        expect(progressFill?.style.width).toBe('25%');

        sidebar.clearDisplay();

        expect(progressValue?.text).toBe('Ready');
        expect(progressBar?.cls).toContain('is-idle');
        expect(progressFill?.style.width).toBe('0%');
    });

    test('api liveness indicator reflects request, receive, long-wait, complete, and error phases', async () => {
        jest.useFakeTimers();
        await sidebar.onOpen();

        const apiLiveness = contentContainer.findByClass('notemd-api-liveness');
        const apiLivenessText = contentContainer.findByClass('notemd-api-liveness-text');
        const emit = (event: ApiLivenessEvent) => sidebar.updateApiLiveness(event);
        const requestId = 'req-deepseek-1';

        emit({ phase: 'request-start', providerName: 'DeepSeek', requestId });
        expect(apiLivenessText?.text).toBe('Awaiting API output...');
        expect(apiLiveness?.cls).toContain('is-waiting');

        emit({ phase: 'response-headers', providerName: 'DeepSeek', requestId, transport: 'desktop-http-stream' });
        expect(apiLivenessText?.text).toBe('API accepted request, awaiting body...');
        expect(apiLiveness?.cls).toContain('is-accepted');

        emit({ phase: 'response-chunk', providerName: 'DeepSeek', requestId, transport: 'desktop-http-stream' });
        expect(apiLivenessText?.text).toBe('Receiving API output...');
        expect(apiLiveness?.cls).toContain('is-active');

        jest.advanceTimersByTime(30000);
        expect(apiLivenessText?.text).toBe('Task is healthy, please wait.');

        emit({ phase: 'request-complete', providerName: 'DeepSeek', requestId });
        expect(apiLivenessText?.text).toBe('API response received.');
        expect(apiLiveness?.cls).toContain('is-active');

        emit({ phase: 'request-error', providerName: 'DeepSeek', requestId });
        expect(apiLivenessText?.text).toBe('API output interrupted.');
        expect(apiLiveness?.cls).toContain('is-error');

        sidebar.clearDisplay();
        expect(apiLivenessText?.text).toBe('Standby');
        expect(apiLiveness?.cls).toContain('is-idle');
    });

    test('api liveness stays request-keyed for concurrent same-provider requests and does not flash error while retrying', async () => {
        await sidebar.onOpen();

        const apiLiveness = contentContainer.findByClass('notemd-api-liveness');
        const apiLivenessText = contentContainer.findByClass('notemd-api-liveness-text');
        const emit = (event: ApiLivenessEvent) => sidebar.updateApiLiveness(event);
        const acceptedRequestId = 'req-openai-accepted';
        const receivingRequestId = 'req-openai-receiving';

        emit({ phase: 'request-start', providerName: 'OpenAI', requestId: acceptedRequestId });
        emit({ phase: 'request-start', providerName: 'OpenAI', requestId: receivingRequestId });
        emit({
            phase: 'response-headers',
            providerName: 'OpenAI',
            requestId: acceptedRequestId,
            transport: 'desktop-http-stream'
        });
        expect(apiLivenessText?.text).toBe('API accepted request, awaiting body...');
        expect(apiLiveness?.cls).toContain('is-accepted');

        emit({
            phase: 'response-chunk',
            providerName: 'OpenAI',
            requestId: receivingRequestId,
            transport: 'desktop-http-stream'
        });
        expect(apiLivenessText?.text).toBe('Receiving API output...');
        expect(apiLiveness?.cls).toContain('is-active');

        emit({ phase: 'request-complete', providerName: 'OpenAI', requestId: receivingRequestId });
        expect(apiLivenessText?.text).toBe('API accepted request, awaiting body...');
        expect(apiLiveness?.cls).toContain('is-accepted');

        emit({ phase: 'request-error', providerName: 'OpenAI', requestId: acceptedRequestId, retrying: true });
        expect(apiLivenessText?.text).toBe('Awaiting API output...');
        expect(apiLiveness?.cls).toContain('is-waiting');
        expect(apiLiveness?.cls).not.toContain('is-error');
    });

    test('api activity captures request-scoped summaries and copies a structured report without parsing logs', async () => {
        await sidebar.onOpen();

        const emit = (event: ApiLivenessEvent) => sidebar.updateApiLiveness(event);
        const copyApiActivityButton = contentContainer.findButton('Copy API activity');
        const apiActivityEmpty = contentContainer.findByClass('notemd-api-activity-empty');

        expect(apiActivityEmpty?.text).toBe('No API activity yet.');

        emit({ phase: 'request-start', providerName: 'OpenAI', requestId: 'req-openai-1', requestAttempt: 1 });
        emit({
            phase: 'response-headers',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            requestAttempt: 1,
            transport: 'desktop-http-stream',
            statusCode: 200
        });
        emit({
            phase: 'request-error',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            requestAttempt: 1,
            retrying: true
        });
        emit({ phase: 'request-start', providerName: 'OpenAI', requestId: 'req-openai-1', requestAttempt: 2 });
        emit({
            phase: 'response-chunk',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            requestAttempt: 2,
            transport: 'desktop-http-stream',
            statusCode: 200
        });
        emit({
            phase: 'request-complete',
            providerName: 'OpenAI',
            requestId: 'req-openai-1',
            requestAttempt: 2
        });
        emit({ phase: 'request-start', providerName: 'Anthropic', requestId: 'req-anthropic-1', requestAttempt: 1 });
        emit({
            phase: 'request-error',
            providerName: 'Anthropic',
            requestId: 'req-anthropic-1',
            requestAttempt: 1,
            retrying: false
        });

        const activityTitles = findAllByClass(contentContainer, 'notemd-api-activity-item-title').map(item => item.text);
        const activityMeta = findAllByClass(contentContainer, 'notemd-api-activity-item-meta').map(item => item.text);
        let activityHistoryEntries = findAllByClass(contentContainer, 'notemd-api-activity-history-entry').map(item => item.text);
        const activeSection = findApiActivitySection(contentContainer, 'Active');
        const recentSection = findApiActivitySection(contentContainer, 'Recent');
        const historyButtons = findAllByClass(contentContainer, 'notemd-api-activity-toggle-button');

        expect(activityTitles).toEqual(expect.arrayContaining(['OpenAI', 'Anthropic']));
        expect(activeSection?.cls).toContain('is-hidden');
        expect(recentSection?.cls).not.toContain('is-hidden');
        expect(activityMeta).toEqual(expect.arrayContaining([
            expect.stringContaining('req-openai-1'),
            expect.stringContaining('Attempt 2'),
            expect.stringContaining('Received'),
            expect.stringContaining('desktop-http-stream'),
            expect.stringContaining('HTTP 200'),
            expect.stringContaining('req-anthropic-1'),
            expect.stringContaining('Interrupted')
        ]));
        expect(activityHistoryEntries).toEqual([]);
        expect(historyButtons.map(item => item.text)).toEqual(expect.arrayContaining(['Show history']));

        const openAiItem = findApiActivityItem(contentContainer, 'OpenAI');
        const openAiHistoryButton = openAiItem?.findButton('Show history');
        expect(openAiHistoryButton).toBeDefined();
        await openAiHistoryButton!.onclick?.();

        activityHistoryEntries = findAllByClass(contentContainer, 'notemd-api-activity-history-entry').map(item => item.text);
        const expandedHistoryButtons = findAllByClass(contentContainer, 'notemd-api-activity-toggle-button');
        expect(activityHistoryEntries).toEqual(expect.arrayContaining([
            expect.stringContaining('request-start'),
            expect.stringContaining('response-headers'),
            expect.stringContaining('request-error'),
            expect.stringContaining('retrying=true'),
            expect.stringContaining('request-complete')
        ]));
        expect(expandedHistoryButtons.map(item => item.text)).toEqual(expect.arrayContaining(['Hide history']));

        expect(copyApiActivityButton).not.toBeNull();
        await copyApiActivityButton!.onclick?.();

        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('API activity report'));
        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Request req-openai-1'));
        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('request-start'));
        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('request-error'));
        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('retrying=true'));
        expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Request req-anthropic-1'));
    });
});
