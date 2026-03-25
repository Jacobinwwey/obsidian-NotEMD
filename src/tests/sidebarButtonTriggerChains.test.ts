import { MarkdownView, TFile, TFolder } from 'obsidian';
import { NotemdSidebarView } from '../ui/NotemdSidebarView';
import { ProgressReporter } from '../types';
import { SIDEBAR_ACTION_DEFINITIONS, SidebarActionId } from '../workflowButtons';
import { mockApp } from './__mocks__/app';

type WorkflowContext = {
    preferredFolderPath: string | null;
    lastGeneratedCompleteFolderPath: string | null;
};

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
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

function createFolder(path: string): TFolder {
    return Object.assign(new (TFolder as any)(), {
        path,
        name: path.split('/').pop() || path,
        children: []
    });
}

function createPluginMock() {
    return {
        app: mockApp,
        settings: {
            useCustomConceptNoteFolder: true,
            conceptNoteFolder: 'Concepts',
            customWorkflowErrorStrategy: 'stop_on_error'
        },
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

describe('NotemdSidebarView button trigger chains', () => {
    let plugin: ReturnType<typeof createPluginMock>;
    let sidebar: NotemdSidebarView;
    let reporter: ProgressReporter;
    let activeMdFile: TFile;
    let activeTxtFile: TFile;
    let conceptFolder: TFolder;
    let executeAction: (
        actionId: SidebarActionId,
        reporter: ProgressReporter,
        context?: WorkflowContext
    ) => Promise<void>;

    beforeEach(() => {
        jest.clearAllMocks();
        plugin = createPluginMock();
        sidebar = new NotemdSidebarView({} as any, plugin as any);
        (sidebar as any).app = mockApp;
        reporter = createReporter();
        executeAction = (sidebar as any).executeAction.bind(sidebar);

        activeMdFile = createMarkdownFile('Notes/Current.md', 'Current.md', 'md');
        activeTxtFile = createMarkdownFile('Notes/Current.txt', 'Current.txt', 'txt');
        conceptFolder = createFolder('Concepts');

        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(activeMdFile);
        (mockApp.workspace.iterateAllLeaves as jest.Mock).mockImplementation(() => {});
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('duplicate duplicate term');
    });

    test('test definitions include all current action IDs', () => {
        const testedActionIds: SidebarActionId[] = [
            'process-current-add-links',
            'process-folder-add-links',
            'generate-from-title',
            'batch-generate-from-titles',
            'research-and-summarize',
            'summarize-as-mermaid',
            'translate-current-file',
            'batch-translate-folder',
            'extract-concepts-current',
            'extract-concepts-folder',
            'extract-original-text',
            'batch-mermaid-fix',
            'fix-formula-current',
            'batch-fix-formula',
            'check-duplicates-current',
            'check-remove-duplicate-concepts',
            'test-llm-connection'
        ];
        const definedActionIds = SIDEBAR_ACTION_DEFINITIONS.map(def => def.id);
        expect(new Set(testedActionIds)).toEqual(new Set(definedActionIds));
    });

    test('process-current-add-links triggers processWithNotemdCommand', async () => {
        await executeAction('process-current-add-links', reporter);
        expect(plugin.processWithNotemdCommand).toHaveBeenCalledWith(reporter);
    });

    test('process-folder-add-links triggers processFolderWithNotemdCommand with context folder', async () => {
        await executeAction('process-folder-add-links', reporter, {
            preferredFolderPath: 'Concepts',
            lastGeneratedCompleteFolderPath: null
        });
        expect(plugin.processFolderWithNotemdCommand).toHaveBeenCalledWith(reporter, 'Concepts');
    });

    test('generate-from-title triggers generateContentForTitleCommand', async () => {
        await executeAction('generate-from-title', reporter);
        expect(plugin.generateContentForTitleCommand).toHaveBeenCalledWith(activeMdFile, reporter);
    });

    test('batch-generate-from-titles triggers batchGenerateContentForTitlesCommand and updates context', async () => {
        const context: WorkflowContext = {
            preferredFolderPath: 'Concepts',
            lastGeneratedCompleteFolderPath: null
        };

        await executeAction('batch-generate-from-titles', reporter, context);

        expect(plugin.batchGenerateContentForTitlesCommand).toHaveBeenCalledWith(reporter, 'Concepts');
        expect(context.preferredFolderPath).toBe('Concepts');
        expect(context.lastGeneratedCompleteFolderPath).toBe('Concepts_complete');
    });

    test('research-and-summarize triggers researchAndSummarizeCommand', async () => {
        const editor = { getSelection: jest.fn(), replaceSelection: jest.fn(), getValue: jest.fn(), setValue: jest.fn() };
        const mdView = Object.assign(new (MarkdownView as any)(), {
            file: activeMdFile,
            editor
        });
        (mockApp.workspace.iterateAllLeaves as jest.Mock).mockImplementation((cb: Function) => {
            cb({ view: mdView });
        });

        await executeAction('research-and-summarize', reporter);
        expect(plugin.researchAndSummarizeCommand).toHaveBeenCalledWith(editor, mdView, reporter);
    });

    test('summarize-as-mermaid triggers summarizeToMermaidCommand', async () => {
        await executeAction('summarize-as-mermaid', reporter);
        expect(plugin.summarizeToMermaidCommand).toHaveBeenCalledWith(activeMdFile, reporter);
    });

    test('translate-current-file triggers translateFileCommand', async () => {
        await executeAction('translate-current-file', reporter);
        expect(plugin.translateFileCommand).toHaveBeenCalledWith(activeMdFile, reporter.abortController?.signal, reporter);
    });

    test('batch-translate-folder triggers batchTranslateFolderCommand with context folder when available', async () => {
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            return path === 'Concepts' ? conceptFolder : null;
        });

        await executeAction('batch-translate-folder', reporter, {
            preferredFolderPath: 'Concepts',
            lastGeneratedCompleteFolderPath: null
        });
        expect(plugin.batchTranslateFolderCommand).toHaveBeenCalledWith(conceptFolder, reporter);
    });

    test('extract-concepts-current triggers extractConceptsCommand', async () => {
        await executeAction('extract-concepts-current', reporter);
        expect(plugin.extractConceptsCommand).toHaveBeenCalledWith(reporter);
    });

    test('extract-concepts-folder triggers batchExtractConceptsForFolderCommand', async () => {
        await executeAction('extract-concepts-folder', reporter);
        expect(plugin.batchExtractConceptsForFolderCommand).toHaveBeenCalledWith(reporter);
    });

    test('extract-original-text triggers extractOriginalTextCommand', async () => {
        await executeAction('extract-original-text', reporter);
        expect(plugin.extractOriginalTextCommand).toHaveBeenCalledWith(reporter);
    });

    test('batch-mermaid-fix triggers batchMermaidFixCommand with latest complete folder from context', async () => {
        await executeAction('batch-mermaid-fix', reporter, {
            preferredFolderPath: 'Concepts',
            lastGeneratedCompleteFolderPath: 'Concepts_complete'
        });
        expect(plugin.batchMermaidFixCommand).toHaveBeenCalledWith(reporter, 'Concepts_complete');
    });

    test('fix-formula-current triggers fixFormulaFormatsCommand', async () => {
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(activeTxtFile);
        await executeAction('fix-formula-current', reporter);
        expect(plugin.fixFormulaFormatsCommand).toHaveBeenCalledWith(activeTxtFile, reporter);
    });

    test('batch-fix-formula triggers batchFixFormulaFormatsCommand', async () => {
        await executeAction('batch-fix-formula', reporter);
        expect(plugin.batchFixFormulaFormatsCommand).toHaveBeenCalledWith(reporter);
    });

    test('check-duplicates-current triggers duplicate check read chain', async () => {
        await executeAction('check-duplicates-current', reporter);
        expect(mockApp.vault.read).toHaveBeenCalledWith(activeMdFile);
    });

    test('check-remove-duplicate-concepts triggers checkAndRemoveDuplicateConceptNotesCommand', async () => {
        await executeAction('check-remove-duplicate-concepts', reporter);
        expect(plugin.checkAndRemoveDuplicateConceptNotesCommand).toHaveBeenCalledWith(reporter);
    });

    test('test-llm-connection triggers testLlmConnectionCommand', async () => {
        await executeAction('test-llm-connection', reporter);
        expect(plugin.testLlmConnectionCommand).toHaveBeenCalledWith(reporter);
    });
});
