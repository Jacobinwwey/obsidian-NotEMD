import { MarkdownView, TFile } from 'obsidian';
import { NotemdSidebarView } from '../ui/NotemdSidebarView';
import { mockApp } from './__mocks__/app';

type MockPlugin = {
    app: typeof mockApp;
    settings: {
        availableLanguages: Array<{ code: string; name: string }>;
        language: string;
        useCustomConceptNoteFolder: boolean;
        conceptNoteFolder: string;
        customWorkflowButtonsDsl: string;
        customWorkflowErrorStrategy: 'stop_on_error' | 'continue_on_error';
    };
    saveSettings: jest.Mock<Promise<void>, []>;
    getIsBusy: jest.Mock<boolean, []>;
    processWithNotemdCommand: jest.Mock<Promise<void>, [any]>;
    processFolderWithNotemdCommand: jest.Mock<Promise<void>, [any, string?]>;
    generateContentForTitleCommand: jest.Mock<Promise<void>, [any, any]>;
    batchGenerateContentForTitlesCommand: jest.Mock<Promise<any>, [any, string?]>;
    researchAndSummarizeCommand: jest.Mock<Promise<void>, [any, any, any]>;
    summarizeToMermaidCommand: jest.Mock<Promise<void>, [any, any]>;
    translateFileCommand: jest.Mock<Promise<void>, [any, any, any]>;
    batchTranslateFolderCommand: jest.Mock<Promise<void>, [any?, any?]>;
    extractConceptsCommand: jest.Mock<Promise<void>, [any]>;
    batchExtractConceptsForFolderCommand: jest.Mock<Promise<void>, [any]>;
    extractOriginalTextCommand: jest.Mock<Promise<void>, [any]>;
    batchMermaidFixCommand: jest.Mock<Promise<void>, [any, string?]>;
    fixFormulaFormatsCommand: jest.Mock<Promise<void>, [any, any]>;
    batchFixFormulaFormatsCommand: jest.Mock<Promise<void>, [any]>;
    checkAndRemoveDuplicateConceptNotesCommand: jest.Mock<Promise<void>, [any]>;
    testLlmConnectionCommand: jest.Mock<Promise<void>, [any]>;
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
    style: Record<string, string> = {};
    value = '';
    scrollTop = 0;
    scrollHeight = 100;
    inputEl: any;

    constructor(tag: string, options?: { text?: string; cls?: string }) {
        this.tag = tag;
        if (options?.text) this.text = options.text;
        if (options?.cls) this.cls = options.cls.split(' ').filter(Boolean);
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

    createEl(tag: string, options?: { text?: string; cls?: string; type?: string }): FakeElement {
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
        return;
    }

    setAttrs(_attrs: Record<string, string>) {
        return;
    }

    add(_option: any) {
        return;
    }

    findButton(text: string): FakeElement | null {
        if (this.tag === 'button' && this.text === text) {
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
}

function createPluginMock(): MockPlugin {
    return {
        app: mockApp,
        settings: {
            availableLanguages: [{ code: 'en', name: 'English' }],
            language: 'en',
            useCustomConceptNoteFolder: true,
            conceptNoteFolder: 'Concepts',
            customWorkflowButtonsDsl: 'One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix',
            customWorkflowErrorStrategy: 'stop_on_error'
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
        translateFileCommand: jest.fn().mockResolvedValue(undefined),
        batchTranslateFolderCommand: jest.fn().mockResolvedValue(undefined),
        extractConceptsCommand: jest.fn().mockResolvedValue(undefined),
        batchExtractConceptsForFolderCommand: jest.fn().mockResolvedValue(undefined),
        extractOriginalTextCommand: jest.fn().mockResolvedValue(undefined),
        batchMermaidFixCommand: jest.fn().mockResolvedValue(undefined),
        fixFormulaFormatsCommand: jest.fn().mockResolvedValue(undefined),
        batchFixFormulaFormatsCommand: jest.fn().mockResolvedValue(undefined),
        checkAndRemoveDuplicateConceptNotesCommand: jest.fn().mockResolvedValue(undefined),
        testLlmConnectionCommand: jest.fn().mockResolvedValue(undefined)
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

describe('NotemdSidebarView DOM button wiring', () => {
    let plugin: MockPlugin;
    let sidebar: NotemdSidebarView;
    let rootContainer: FakeElement;
    let contentContainer: FakeElement;
    let mdFile: TFile;
    let txtFile: TFile;

    beforeEach(() => {
        jest.clearAllMocks();
        (global as any).Option = function Option(text: string, value: string) {
            return { text, value };
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
        await clickButton('Translate current file');
        await clickButton('Batch translate folder');
        await clickButton('Extract concepts (current file)');
        await clickButton('Extract concepts (folder)');
        await clickButton('Extract specific original text');
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
        expect(plugin.translateFileCommand).toHaveBeenCalledWith(mdFile, expect.anything(), expect.anything());
        expect(plugin.batchTranslateFolderCommand).toHaveBeenCalled();
        expect(plugin.extractConceptsCommand).toHaveBeenCalled();
        expect(plugin.batchExtractConceptsForFolderCommand).toHaveBeenCalled();
        expect(plugin.extractOriginalTextCommand).toHaveBeenCalled();
        expect(plugin.batchMermaidFixCommand).toHaveBeenCalled();
        expect(plugin.fixFormulaFormatsCommand).toHaveBeenCalledWith(txtFile, expect.anything());
        expect(plugin.batchFixFormulaFormatsCommand).toHaveBeenCalled();
        expect(mockApp.vault.read).toHaveBeenCalledWith(txtFile);
        expect(plugin.checkAndRemoveDuplicateConceptNotesCommand).toHaveBeenCalled();
        expect(plugin.testLlmConnectionCommand).toHaveBeenCalled();
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
        const batchGenerate = contentContainer.findButton('Batch generate from titles');
        const batchTranslate = contentContainer.findButton('Batch translate folder');
        const workflowDefault = contentContainer.findButton('One-Click Extract');

        expect(processCurrent).not.toBeNull();
        expect(translateCurrent).not.toBeNull();
        expect(batchGenerate).not.toBeNull();
        expect(batchTranslate).not.toBeNull();
        expect(workflowDefault).not.toBeNull();

        expect(processCurrent?.cls).toContain('mod-cta');
        expect(translateCurrent?.cls).toContain('mod-cta');
        expect(batchGenerate?.cls).not.toContain('mod-cta');
        expect(batchTranslate?.cls).not.toContain('mod-cta');
        expect(workflowDefault?.cls).not.toContain('mod-cta');
    });

    test('builds a docked footer that keeps ready progress and logs visible', async () => {
        await sidebar.onOpen();

        const shell = contentContainer.findByClass('notemd-sidebar-shell');
        const scrollArea = contentContainer.findByClass('notemd-sidebar-scroll');
        const footer = contentContainer.findByClass('notemd-sidebar-footer');
        const progressValue = contentContainer.findByClass('notemd-progress-value');
        const progressBar = contentContainer.findByClass('notemd-progress-bar-container');
        const logCard = contentContainer.findByClass('notemd-log-card');

        expect(shell).not.toBeNull();
        expect(scrollArea).not.toBeNull();
        expect(footer).not.toBeNull();
        expect(footer?.cls).toContain('mod-docked');
        expect(progressValue?.text).toBe('Ready');
        expect(progressBar?.cls).toContain('is-idle');
        expect(logCard).not.toBeNull();
        expect(logCard?.cls).toContain('mod-persistent');
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
});
