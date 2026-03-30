import { Editor, ItemView, MarkdownView, Notice, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { NOTEMD_SIDEBAR_DISPLAY_TEXT, NOTEMD_SIDEBAR_ICON, NOTEMD_SIDEBAR_VIEW_TYPE } from '../constants';
import { findDuplicates } from '../fileUtils';
import {
    CustomWorkflowButton,
    resolveCustomWorkflowButtons,
    SIDEBAR_ACTION_DEFINITIONS,
    SidebarActionId
} from '../workflowButtons';

type ActionCategory = typeof SIDEBAR_ACTION_DEFINITIONS[number]['category'];

interface WorkflowExecutionContext {
    preferredFolderPath: string | null;
    lastGeneratedCompleteFolderPath: string | null;
}

const ACTION_CATEGORY_LABEL: Record<ActionCategory, { title: string; openByDefault: boolean }> = {
    core: { title: 'Core Flow', openByDefault: true },
    generation: { title: 'Generation & Mermaid', openByDefault: true },
    knowledge: { title: 'Knowledge', openByDefault: false },
    translation: { title: 'Translation', openByDefault: false },
    utilities: { title: 'Utilities', openByDefault: false }
};

const ACTION_TOOLTIP: Record<SidebarActionId, string> = {
    'process-current-add-links': 'Processes current file and creates wiki links/concept notes.',
    'process-folder-add-links': 'Processes all eligible notes in a folder.',
    'generate-from-title': 'Generate note content from current note title.',
    'batch-generate-from-titles': 'Batch-generate content from note titles in a folder.',
    'research-and-summarize': 'Research selected topic/title and append summary.',
    'summarize-as-mermaid': 'Generate a Mermaid diagram summary from current note.',
    'translate-current-file': 'Translate the active file into selected output language.',
    'batch-translate-folder': 'Translate all markdown files in a folder.',
    'extract-concepts-current': 'Extract concepts from current file only.',
    'extract-concepts-folder': 'Extract concepts from every file in a selected folder.',
    'extract-original-text': 'Extract verbatim source excerpts for configured questions.',
    'batch-mermaid-fix': 'Run Mermaid/LaTeX batch syntax fix on selected folder.',
    'fix-formula-current': 'Normalize formula delimiters in current file.',
    'batch-fix-formula': 'Normalize formula delimiters across a selected folder.',
    'check-duplicates-current': 'Detect duplicate terms in the current file.',
    'check-remove-duplicate-concepts': 'Detect and remove duplicate concept notes.',
    'test-llm-connection': 'Test active provider connection and credentials.'
};

const SINGLE_FILE_ACTION_IDS = new Set<SidebarActionId>([
    'process-current-add-links',
    'generate-from-title',
    'research-and-summarize',
    'summarize-as-mermaid',
    'translate-current-file',
    'extract-concepts-current',
    'extract-original-text',
    'fix-formula-current',
    'check-duplicates-current'
]);

function isSingleFileAction(actionId: SidebarActionId): boolean {
    return SINGLE_FILE_ACTION_IDS.has(actionId);
}

function isSingleFileWorkflow(button: CustomWorkflowButton): boolean {
    return button.actions.length > 0 && button.actions.every(actionId => isSingleFileAction(actionId));
}

export class NotemdSidebarView extends ItemView implements ProgressReporter {
    plugin: NotemdPlugin;

    private statusEl: HTMLElement | null = null;
    private progressAreaEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private progressBarContainerEl: HTMLElement | null = null;
    private progressValueEl: HTMLElement | null = null;
    private timeRemainingEl: HTMLElement | null = null;
    private logEl: HTMLElement | null = null;
    private cancelButton: HTMLButtonElement | null = null;
    private languageSelector: HTMLSelectElement | null = null;

    private logContent: string[] = [];
    private startTime = 0;
    private isProcessing = false;
    private isCancelled = false;
    private currentAbortController: AbortController | null = null;
    activeTasks = 0;

    private actionButtons = new Map<string, HTMLButtonElement>();
    private workflowButtons: HTMLButtonElement[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: NotemdPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return NOTEMD_SIDEBAR_VIEW_TYPE;
    }

    getDisplayText() {
        return NOTEMD_SIDEBAR_DISPLAY_TEXT;
    }

    getIcon() {
        return NOTEMD_SIDEBAR_ICON;
    }

    startProcessing(initialStatus: string) {
        this.clearDisplay();
        this.currentAbortController = new AbortController();
        this.isProcessing = true;
        this.isCancelled = false;
        this.startTime = Date.now();
        this.updateStatus(initialStatus, 0);
        this.updateButtonStates();
    }

    finishProcessing() {
        this.isProcessing = false;
        this.updateButtonStates();
    }

    clearDisplay() {
        this.logContent = [];
        if (this.logEl) this.logEl.empty();
        if (this.statusEl) this.statusEl.setText('Ready');
        if (this.progressAreaEl) this.progressAreaEl.addClass('is-idle');
        if (this.progressEl) {
            this.progressEl.dataset.progress = '0';
            this.progressEl.setText('');
            this.progressEl.removeClass('is-error');
            this.progressEl.style.width = '0%';
        }
        if (this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            this.progressBarContainerEl.addClass('is-idle');
        }
        if (this.progressValueEl) {
            this.progressValueEl.setText('Ready');
            this.progressValueEl.addClass('is-idle');
            this.progressValueEl.removeClass('is-error');
        }
        if (this.timeRemainingEl) this.timeRemainingEl.setText('Standby');
        if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.removeClass('is-active');
        }
        this.isProcessing = false;
        this.isCancelled = false;
        this.startTime = 0;
        this.currentAbortController = null;
        this.updateButtonStates();
    }

    updateStatus(text: string, percent?: number) {
        if (this.statusEl) this.statusEl.setText(text);

        if (percent !== undefined && (percent < 0 || percent >= 100)) {
            this.isProcessing = false;
        }

        this.updateButtonStates();

        if (percent !== undefined && this.progressEl && this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            this.progressBarContainerEl.removeClass('is-idle');
            if (this.progressAreaEl) this.progressAreaEl.removeClass('is-idle');
            if (percent >= 0) {
                const clampedPercent = Math.min(100, Math.max(0, percent));
                this.progressEl.dataset.progress = String(clampedPercent);
                this.progressEl.setText('');
                this.progressEl.removeClass('is-error');
                this.progressEl.style.width = `${clampedPercent}%`;
                if (this.progressValueEl) {
                    this.progressValueEl.setText(`${Math.round(clampedPercent)}%`);
                    this.progressValueEl.removeClass('is-idle');
                    this.progressValueEl.removeClass('is-error');
                }

                if (percent > 0 && this.startTime > 0) {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    const estimatedTotal = elapsed / (percent / 100);
                    const remaining = Math.max(0, estimatedTotal - elapsed);
                    if (this.timeRemainingEl) {
                        this.timeRemainingEl.setText(`Est. time remaining: ${this.formatTime(remaining)}`);
                    }
                } else if (this.timeRemainingEl) {
                    this.timeRemainingEl.setText('Est. time remaining: calculating...');
                }
            } else {
                this.progressEl.dataset.progress = '100';
                this.progressEl.addClass('is-error');
                this.progressEl.setText('');
                this.progressEl.style.width = '100%';
                if (this.progressValueEl) {
                    this.progressValueEl.setText('Stopped');
                    this.progressValueEl.removeClass('is-idle');
                    this.progressValueEl.addClass('is-error');
                }
                if (this.timeRemainingEl) this.timeRemainingEl.setText('Processing stopped.');
            }
        }
    }

    log(message: string) {
        if (!this.logEl) {
            return;
        }
        const timestamp = `[${new Date().toLocaleTimeString()}]`;
        const fullMessage = `${timestamp} ${message}`;
        this.logContent.push(fullMessage);

        const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
        entry.createEl('span', { text: timestamp, cls: 'notemd-log-time' });
        entry.createEl('span', { text: ` ${message}`, cls: 'notemd-log-message' });
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    getLogs(): string {
        return this.logContent.join('\n');
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    get cancelled() {
        return this.isCancelled;
    }

    requestCancel() {
        if (this.isProcessing && !this.isCancelled) {
            this.isCancelled = true;
            this.updateStatus('Cancelling...', -1);
            this.log('User requested cancellation.');
            this.currentAbortController?.abort();
            this.updateButtonStates();
        }
    }

    get abortController(): AbortController | null | undefined {
        return this.currentAbortController;
    }
    set abortController(controller: AbortController | null | undefined) {
        this.currentAbortController = controller ?? null;
    }

    updateActiveTasks(delta: number): void {
        this.activeTasks += delta;
        this.updateStatus(`Processing... (Active: ${this.activeTasks})`);
    }

    private updateButtonStates() {
        const processing = this.isProcessing;
        this.actionButtons.forEach(button => {
            button.disabled = processing;
        });
        this.workflowButtons.forEach(button => {
            button.disabled = processing;
        });
        if (this.languageSelector) {
            this.languageSelector.disabled = processing;
        }

        if (this.cancelButton) {
            this.cancelButton.disabled = !processing || this.isCancelled;
            if (this.cancelButton.disabled) this.cancelButton.removeClass('is-active');
            else this.cancelButton.addClass('is-active');
        }
    }

    private createReporterProxy(clearEnabled = false): ProgressReporter {
        const view = this;
        return {
            log(message: string) {
                view.log(message);
            },
            updateStatus(text: string, percent?: number) {
                view.updateStatus(text, percent);
            },
            requestCancel() {
                view.requestCancel();
            },
            clearDisplay() {
                if (clearEnabled) {
                    view.clearDisplay();
                }
            },
            get cancelled() {
                return view.cancelled;
            },
            get abortController() {
                return view.abortController;
            },
            set abortController(controller: AbortController | null | undefined) {
                view.abortController = controller;
            },
            get activeTasks() {
                return view.activeTasks;
            },
            set activeTasks(value: number) {
                view.activeTasks = value;
            },
            updateActiveTasks(delta: number) {
                view.updateActiveTasks(delta);
            },
            getLogs() {
                return view.getLogs();
            }
        };
    }

    private createSection(
        parent: HTMLElement,
        title: string,
        description: string,
        openByDefault: boolean
    ): HTMLElement {
        const details = parent.createEl('details', { cls: 'notemd-section-card' });
        details.open = openByDefault;
        const summary = details.createEl('summary', { cls: 'notemd-section-summary' });
        summary.createEl('span', { text: title });
        details.createEl('p', { text: description, cls: 'notemd-section-description' });
        return details.createDiv({ cls: 'notemd-button-grid' });
    }

    private createActionButton(
        parent: HTMLElement,
        actionId: SidebarActionId,
        label: string,
        category: ActionCategory
    ) {
        const classes = ['notemd-action-button'];
        if (isSingleFileAction(actionId)) {
            classes.push('mod-cta');
            classes.push('is-primary');
        }
        const button = parent.createEl('button', {
            text: label,
            cls: classes.join(' ')
        });
        button.dataset.category = category;
        button.title = ACTION_TOOLTIP[actionId] || label;
        button.onclick = async () => {
            await this.runSingleAction(actionId);
        };
        this.actionButtons.set(actionId, button);
    }

    private getConfiguredConceptFolderPath(): string | null {
        if (this.plugin.settings.useCustomConceptNoteFolder && this.plugin.settings.conceptNoteFolder.trim()) {
            return this.plugin.settings.conceptNoteFolder.trim();
        }
        return null;
    }

    private async runSingleAction(actionId: SidebarActionId): Promise<void> {
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice('Processing already in progress.');
            return;
        }
        const actionLabel = SIDEBAR_ACTION_DEFINITIONS.find(def => def.id === actionId)?.label || actionId;
        this.startProcessing(`Running "${actionLabel}"...`);
        const reporter = this.createReporterProxy();

        try {
            await this.executeAction(actionId, reporter);
            if (!this.cancelled) {
                this.updateStatus(`"${actionLabel}" complete`, 100);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Action failed: ${message}`);
            this.updateStatus('Error occurred', -1);
        } finally {
            this.finishProcessing();
        }
    }

    private async runCustomWorkflow(button: CustomWorkflowButton): Promise<void> {
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice('Processing already in progress.');
            return;
        }
        this.startProcessing(`Workflow: ${button.name}`);
        const reporter = this.createReporterProxy();
        const context: WorkflowExecutionContext = {
            preferredFolderPath: this.getConfiguredConceptFolderPath(),
            lastGeneratedCompleteFolderPath: null
        };
        const continueOnError = this.plugin.settings.customWorkflowErrorStrategy === 'continue_on_error';
        let failedSteps = 0;
        this.log(
            `Executing workflow "${button.name}" with ${button.actions.length} step(s). ` +
            `Strategy: ${continueOnError ? 'continue on error' : 'stop on first error'}.`
        );

        try {
            for (let i = 0; i < button.actions.length; i++) {
                if (this.cancelled) {
                    break;
                }
                const actionId = button.actions[i];
                const actionLabel = SIDEBAR_ACTION_DEFINITIONS.find(def => def.id === actionId)?.label || actionId;
                const progress = Math.floor((i / button.actions.length) * 100);
                this.updateStatus(`[${i + 1}/${button.actions.length}] ${actionLabel}`, progress);
                this.log(`Step ${i + 1}/${button.actions.length}: ${actionLabel}`);
                try {
                    await this.executeAction(actionId, reporter, context);
                } catch (error: unknown) {
                    failedSteps++;
                    const message = error instanceof Error ? error.message : String(error);
                    this.log(`Step failed: ${message}`);
                    if (!continueOnError) {
                        throw error;
                    }
                }
            }

            if (!this.cancelled) {
                if (failedSteps > 0) {
                    this.updateStatus(`Workflow "${button.name}" finished with ${failedSteps} error(s)`, -1);
                    new Notice(`Workflow "${button.name}" finished with ${failedSteps} error(s).`);
                } else {
                    this.updateStatus(`Workflow "${button.name}" complete`, 100);
                    new Notice(`Workflow "${button.name}" completed.`);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Workflow failed: ${message}`);
            this.updateStatus('Workflow failed', -1);
            new Notice(`Workflow "${button.name}" failed: ${message}`);
        } finally {
            this.finishProcessing();
        }
    }

    private async executeAction(
        actionId: SidebarActionId,
        reporter: ProgressReporter,
        context?: WorkflowExecutionContext
    ): Promise<void> {
        switch (actionId) {
            case 'process-current-add-links': {
                await this.plugin.processWithNotemdCommand(reporter);
                if (context && !context.preferredFolderPath) {
                    context.preferredFolderPath = this.getConfiguredConceptFolderPath();
                }
                break;
            }
            case 'process-folder-add-links': {
                await this.plugin.processFolderWithNotemdCommand(reporter, context?.preferredFolderPath || undefined);
                break;
            }
            case 'generate-from-title': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.generateContentForTitleCommand(activeFile, reporter);
                break;
            }
            case 'batch-generate-from-titles': {
                const folderOverride = context?.preferredFolderPath || this.getConfiguredConceptFolderPath() || undefined;
                const result = await this.plugin.batchGenerateContentForTitlesCommand(reporter, folderOverride);
                if (result && context) {
                    context.preferredFolderPath = result.sourceFolderPath;
                    context.lastGeneratedCompleteFolderPath = result.completeFolderPath;
                }
                break;
            }
            case 'research-and-summarize': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }

                let targetView: MarkdownView | null = null;
                let targetEditor: Editor | null = null;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view instanceof MarkdownView && leaf.view.file?.path === activeFile.path) {
                        targetView = leaf.view;
                        targetEditor = leaf.view.editor;
                    }
                });

                if (!targetView || !targetEditor) {
                    throw new Error('Could not find active Markdown editor view.');
                }
                await this.plugin.researchAndSummarizeCommand(targetEditor, targetView, reporter);
                break;
            }
            case 'summarize-as-mermaid': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.summarizeToMermaidCommand(activeFile, reporter);
                break;
            }
            case 'translate-current-file': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    throw new Error('No active file selected.');
                }
                await this.plugin.translateFileCommand(activeFile, reporter.abortController?.signal, reporter);
                break;
            }
            case 'batch-translate-folder': {
                const targetFolderPath = context?.preferredFolderPath;
                if (targetFolderPath) {
                    const abstract = this.app.vault.getAbstractFileByPath(targetFolderPath);
                    if (abstract instanceof TFolder) {
                        await this.plugin.batchTranslateFolderCommand(abstract, reporter);
                        break;
                    }
                }
                await this.plugin.batchTranslateFolderCommand(undefined, reporter);
                break;
            }
            case 'extract-concepts-current': {
                await this.plugin.extractConceptsCommand(reporter);
                break;
            }
            case 'extract-concepts-folder': {
                await this.plugin.batchExtractConceptsForFolderCommand(reporter);
                break;
            }
            case 'extract-original-text': {
                await this.plugin.extractOriginalTextCommand(reporter);
                break;
            }
            case 'batch-mermaid-fix': {
                const folderOverride = context?.lastGeneratedCompleteFolderPath || context?.preferredFolderPath || undefined;
                await this.plugin.batchMermaidFixCommand(reporter, folderOverride);
                break;
            }
            case 'fix-formula-current': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                    throw new Error('No active .md/.txt file selected.');
                }
                await this.plugin.fixFormulaFormatsCommand(activeFile, reporter);
                break;
            }
            case 'batch-fix-formula': {
                await this.plugin.batchFixFormulaFormatsCommand(reporter);
                break;
            }
            case 'check-duplicates-current': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                    throw new Error("No active '.md' or '.txt' file selected.");
                }

                const content = await this.plugin.app.vault.read(activeFile);
                const duplicates = findDuplicates(content);
                const message = `Found ${duplicates.size} potential duplicate terms.`;
                reporter.log(message);
                new Notice(`${message} Check log and console.`);
                if (duplicates.size > 0) {
                    reporter.log(`Potential duplicates: ${Array.from(duplicates).join(', ')}`);
                    console.log(`Potential duplicates in ${activeFile.name}:`, Array.from(duplicates));
                }
                break;
            }
            case 'check-remove-duplicate-concepts': {
                await this.plugin.checkAndRemoveDuplicateConceptNotesCommand(reporter);
                break;
            }
            case 'test-llm-connection': {
                await this.plugin.testLlmConnectionCommand(reporter);
                break;
            }
            default: {
                throw new Error(`Unsupported action: ${actionId}`);
            }
        }
    }

    private buildLanguageSelector(parent: HTMLElement) {
        const row = parent.createDiv({ cls: 'notemd-inline-control' });
        row.createEl('label', { text: 'Language', cls: 'notemd-inline-label' });
        this.languageSelector = row.createEl('select', { cls: 'notemd-language-select' });
        const selector = this.languageSelector;
        this.plugin.settings.availableLanguages.forEach(lang => {
            selector.add(new Option(lang.name, lang.code));
        });
        selector.value = this.plugin.settings.language;
        selector.onchange = async () => {
            this.plugin.settings.language = selector.value;
            await this.plugin.saveSettings();
            new Notice(`Language changed to ${selector.value}`);
        };
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('notemd-sidebar-container');
        const shell = container.createDiv({ cls: 'notemd-sidebar-shell' });
        const scrollArea = shell.createDiv({ cls: 'notemd-sidebar-scroll' });
        const footer = shell.createDiv({ cls: 'notemd-sidebar-footer mod-docked' });

        const hero = scrollArea.createDiv({ cls: 'notemd-hero-card' });
        hero.createEl('h3', { text: 'Notemd Workbench' });
        hero.createEl('p', { text: 'Run single actions or custom one-click workflows with live progress and logs.' });

        const workflowResolution = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        const quickBody = this.createSection(
            scrollArea,
            'Quick Workflows',
            'Custom buttons assembled from built-in actions.',
            true
        );

        workflowResolution.buttons.forEach(buttonConfig => {
            const workflowClasses = ['notemd-action-button', 'notemd-workflow-button'];
            if (isSingleFileWorkflow(buttonConfig)) {
                workflowClasses.push('mod-cta', 'is-primary');
            }
            const workflowButton = quickBody.createEl('button', {
                text: buttonConfig.name,
                cls: workflowClasses.join(' ')
            });
            workflowButton.dataset.category = 'workflow';
            workflowButton.title = buttonConfig.actions.join(' > ');
            workflowButton.onclick = async () => {
                await this.runCustomWorkflow(buttonConfig);
            };
            this.workflowButtons.push(workflowButton);
        });

        if (workflowResolution.usedFallback && workflowResolution.errors.length > 0) {
            const warn = quickBody.createDiv({ cls: 'notemd-workflow-warning' });
            warn.setText(`Workflow DSL has ${workflowResolution.errors.length} issue(s). Sidebar is using default fallback.`);
        }

        const actionsByCategory = new Map<ActionCategory, Array<typeof SIDEBAR_ACTION_DEFINITIONS[number]>>();
        SIDEBAR_ACTION_DEFINITIONS.forEach(def => {
            const existing = actionsByCategory.get(def.category) || [];
            existing.push(def);
            actionsByCategory.set(def.category, existing);
        });

        (Object.keys(ACTION_CATEGORY_LABEL) as ActionCategory[]).forEach(category => {
            const defs = actionsByCategory.get(category) || [];
            if (defs.length === 0) {
                return;
            }

            const body = this.createSection(
                scrollArea,
                ACTION_CATEGORY_LABEL[category].title,
                `Built-in ${ACTION_CATEGORY_LABEL[category].title.toLowerCase()} actions.`,
                ACTION_CATEGORY_LABEL[category].openByDefault
            );

            defs.forEach(def => {
                this.createActionButton(body, def.id, def.label, def.category);
            });

            if (category === 'translation') {
                this.buildLanguageSelector(body);
            }
        });

        const progressArea = footer.createDiv({ cls: 'notemd-progress-area is-idle' });
        this.progressAreaEl = progressArea;
        const progressMeta = progressArea.createDiv({ cls: 'notemd-progress-meta' });
        this.statusEl = progressMeta.createEl('p', { text: 'Ready', cls: 'notemd-status-text' });
        this.progressValueEl = progressMeta.createEl('span', { text: 'Ready', cls: 'notemd-progress-value is-idle' });
        this.progressBarContainerEl = progressArea.createEl('div', { cls: 'notemd-progress-bar-container mod-sidebar is-idle' });
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });
        this.timeRemainingEl = progressArea.createEl('p', { text: 'Standby', cls: 'notemd-time-remaining' });

        this.cancelButton = progressArea.createEl('button', { text: 'Cancel processing', cls: 'notemd-cancel-button' });
        this.cancelButton.onclick = () => this.requestCancel();

        const logCard = footer.createDiv({ cls: 'notemd-log-card mod-persistent' });
        const logHeader = logCard.createDiv({ cls: 'notemd-log-header' });
        logHeader.createEl('h5', { text: 'Log output' });
        const copyLogButton = logHeader.createEl('button', { text: 'Copy log', cls: 'notemd-copy-log-button' });
        copyLogButton.onclick = () => {
            if (this.logContent.length > 0) {
                navigator.clipboard
                    .writeText(this.logContent.join('\n'))
                    .then(() => new Notice('Log copied!'), () => new Notice('Failed to copy log.'));
            } else {
                new Notice('Log is empty.');
            }
        };
        this.logEl = logCard.createEl('div', { cls: 'notemd-log-output is-selectable mod-sidebar' });
        this.clearDisplay();
    }

    async onClose() {
        this.statusEl = null;
        this.progressAreaEl = null;
        this.progressEl = null;
        this.progressBarContainerEl = null;
        this.progressValueEl = null;
        this.timeRemainingEl = null;
        this.logEl = null;
        this.cancelButton = null;
        this.languageSelector = null;
        this.actionButtons.clear();
        this.workflowButtons = [];
    }
}
