import { Editor, ItemView, MarkdownView, Notice, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { NOTEMD_SIDEBAR_ICON, NOTEMD_SIDEBAR_VIEW_TYPE } from '../constants';
import { findDuplicates } from '../fileUtils';
import {
    ActionCategory,
    CustomWorkflowButton,
    getLocalizedWorkflowButtonName,
    getSidebarActionLabel,
    getSidebarActionTooltip,
    resolveCustomWorkflowButtons,
    SIDEBAR_ACTION_DEFINITIONS,
    SidebarActionId
} from '../workflowButtons';
import { formatI18n, getCurrentUiLocale, getI18nStrings } from '../i18n';
import { formatTimeForLocale } from '../i18n/localeFormat';

interface WorkflowExecutionContext {
    preferredFolderPath: string | null;
    lastGeneratedCompleteFolderPath: string | null;
}

const ACTION_CATEGORY_CONFIG: Record<ActionCategory, { openByDefault: boolean }> = {
    core: { openByDefault: true },
    generation: { openByDefault: true },
    knowledge: { openByDefault: false },
    translation: { openByDefault: false },
    utilities: { openByDefault: false }
};

const SINGLE_FILE_ACTION_IDS = new Set<SidebarActionId>([
    'process-current-add-links',
    'generate-from-title',
    'research-and-summarize',
    'summarize-as-mermaid',
    'generate-experimental-diagram',
    'preview-experimental-diagram',
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

    private getStrings() {
        return getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
    }

    private getResolvedUiLocale() {
        return getCurrentUiLocale({ uiLocale: this.plugin.settings.uiLocale });
    }

    constructor(leaf: WorkspaceLeaf, plugin: NotemdPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return NOTEMD_SIDEBAR_VIEW_TYPE;
    }

    getDisplayText() {
        return this.getStrings().plugin.viewName;
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
        const i18n = this.getStrings();
        this.logContent = [];
        if (this.logEl) this.logEl.empty();
        if (this.statusEl) this.statusEl.setText(i18n.common.ready);
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
            this.progressValueEl.setText(i18n.common.ready);
            this.progressValueEl.addClass('is-idle');
            this.progressValueEl.removeClass('is-error');
        }
        if (this.timeRemainingEl) this.timeRemainingEl.setText(i18n.common.standby);
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
        const i18n = this.getStrings();
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
                        this.timeRemainingEl.setText(
                            formatI18n(i18n.sidebar.status.timeRemaining, { time: this.formatTime(remaining) })
                        );
                    }
                } else if (this.timeRemainingEl) {
                    this.timeRemainingEl.setText(i18n.sidebar.status.timeRemainingCalculating);
                }
            } else {
                this.progressEl.dataset.progress = '100';
                this.progressEl.addClass('is-error');
                this.progressEl.setText('');
                this.progressEl.style.width = '100%';
                if (this.progressValueEl) {
                    this.progressValueEl.setText(i18n.sidebar.status.stopped);
                    this.progressValueEl.removeClass('is-idle');
                    this.progressValueEl.addClass('is-error');
                }
                if (this.timeRemainingEl) this.timeRemainingEl.setText(i18n.sidebar.status.processingStopped);
            }
        }
    }

    log(message: string) {
        if (!this.logEl) {
            return;
        }
        const timestamp = `[${formatTimeForLocale(new Date(), this.getResolvedUiLocale())}]`;
        const fullMessage = `${timestamp} ${message}`;
        this.logContent.push(fullMessage);

        const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
        entry.createEl('span', { text: timestamp, cls: 'notemd-log-time' });
        const messageEl = entry.createEl('span', { cls: 'notemd-log-message' });
        messageEl.setText(` ${message}`);
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
            const i18n = this.getStrings();
            this.isCancelled = true;
            this.updateStatus(i18n.sidebar.status.cancelling, -1);
            this.log(i18n.sidebar.status.userRequestedCancellation);
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
        const i18n = this.getStrings();
        this.activeTasks += delta;
        this.updateStatus(formatI18n(i18n.sidebar.status.processingActive, { count: this.activeTasks }));
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
        category: ActionCategory
    ) {
        const i18n = this.getStrings();
        const label = getSidebarActionLabel(i18n, actionId);
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
        button.title = getSidebarActionTooltip(i18n, actionId);
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
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }
        const actionLabel = getSidebarActionLabel(i18n, actionId);
        this.startProcessing(formatI18n(i18n.sidebar.status.runningAction, { label: actionLabel }));
        const reporter = this.createReporterProxy();

        try {
            await this.executeAction(actionId, reporter);
            if (!this.cancelled) {
                this.updateStatus(formatI18n(i18n.sidebar.status.actionComplete, { label: actionLabel }), 100);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const failureMessage = formatI18n(i18n.sidebar.status.actionFailed, { message });
            this.log(failureMessage);
            this.updateStatus(failureMessage, -1);
        } finally {
            this.finishProcessing();
        }
    }

    private async runCustomWorkflow(button: CustomWorkflowButton): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }
        const workflowName = getLocalizedWorkflowButtonName(i18n, button.name);
        this.startProcessing(formatI18n(i18n.sidebar.status.workflowStart, { name: workflowName }));
        const reporter = this.createReporterProxy();
        const context: WorkflowExecutionContext = {
            preferredFolderPath: this.getConfiguredConceptFolderPath(),
            lastGeneratedCompleteFolderPath: null
        };
        const continueOnError = this.plugin.settings.customWorkflowErrorStrategy === 'continue_on_error';
        let failedSteps = 0;
        this.log(formatI18n(i18n.sidebar.status.workflowStart, { name: workflowName }));

        try {
            for (let i = 0; i < button.actions.length; i++) {
                if (this.cancelled) {
                    break;
                }
                const actionId = button.actions[i];
                const actionLabel = getSidebarActionLabel(i18n, actionId);
                const progress = Math.floor((i / button.actions.length) * 100);
                this.updateStatus(
                    formatI18n(i18n.sidebar.status.stepLabel, {
                        current: i + 1,
                        total: button.actions.length,
                        label: actionLabel
                    }),
                    progress
                );
                this.log(
                    formatI18n(i18n.sidebar.status.stepLog, {
                        current: i + 1,
                        total: button.actions.length,
                        label: actionLabel
                    })
                );
                try {
                    await this.executeAction(actionId, reporter, context);
                } catch (error: unknown) {
                    failedSteps++;
                    const message = error instanceof Error ? error.message : String(error);
                    this.log(formatI18n(i18n.sidebar.status.stepFailed, { message }));
                    if (!continueOnError) {
                        throw error;
                    }
                }
            }

            if (!this.cancelled) {
                if (failedSteps > 0) {
                    const failureSummary = formatI18n(i18n.sidebar.status.workflowFinishedWithErrors, {
                        name: workflowName,
                        count: failedSteps
                    });
                    this.updateStatus(failureSummary, -1);
                    new Notice(failureSummary);
                } else {
                    const completeMessage = formatI18n(i18n.sidebar.status.workflowComplete, { name: workflowName });
                    this.updateStatus(completeMessage, 100);
                    new Notice(completeMessage);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(formatI18n(i18n.sidebar.status.workflowFailedLog, { message }));
            this.updateStatus(i18n.sidebar.status.workflowFailed, -1);
            new Notice(formatI18n(i18n.sidebar.status.actionFailed, { message: `${workflowName}: ${message}` }));
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
            case 'generate-experimental-diagram': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.generateExperimentalDiagramCommand(activeFile, reporter);
                break;
            }
            case 'preview-experimental-diagram': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.previewExperimentalDiagramCommand(activeFile, reporter);
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
                    throw new Error(this.getStrings().notices.noActiveTextFileSelected);
                }

                const content = await this.plugin.app.vault.read(activeFile);
                const duplicates = findDuplicates(content);
                const message = formatI18n(this.getStrings().notices.duplicateTermsFound, { count: duplicates.size });
                reporter.log(message);
                new Notice(formatI18n(this.getStrings().notices.duplicateTermsCheckLogConsole, { count: duplicates.size }));
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
        const i18n = this.getStrings();
        const row = parent.createDiv({ cls: 'notemd-inline-control' });
        row.createEl('label', { text: i18n.common.language, cls: 'notemd-inline-label' });
        this.languageSelector = row.createEl('select', { cls: 'notemd-language-select' });
        const selector = this.languageSelector;
        this.plugin.settings.availableLanguages.forEach(lang => {
            selector.add(new Option(lang.name, lang.code));
        });
        selector.value = this.plugin.settings.language;
        selector.onchange = async () => {
            this.plugin.settings.language = selector.value;
            await this.plugin.saveSettings();
            new Notice(formatI18n(i18n.sidebar.languageChangedNotice, { language: selector.value }));
        };
    }

    private buildDiagramIntentSelector(parent: HTMLElement) {
        const i18n = this.getStrings();
        const row = parent.createDiv({ cls: 'notemd-inline-control' });
        row.createEl('label', { text: i18n.settings.developer.experimentalDiagramPipeline.intentName, cls: 'notemd-inline-label' });
        const selector = row.createEl('select', { cls: 'notemd-language-select' });

        const intents = [
            { value: 'auto', label: i18n.settings.developer.experimentalDiagramPipeline.intentAuto },
            { value: 'mindmap', label: i18n.settings.developer.experimentalDiagramPipeline.intentMindmap },
            { value: 'flowchart', label: i18n.settings.developer.experimentalDiagramPipeline.intentFlowchart },
            { value: 'sequence', label: i18n.settings.developer.experimentalDiagramPipeline.intentSequence },
            { value: 'classDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentClassDiagram },
            { value: 'erDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentErDiagram },
            { value: 'stateDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentStateDiagram },
            { value: 'canvasMap', label: i18n.settings.developer.experimentalDiagramPipeline.intentCanvasMap },
            { value: 'dataChart', label: i18n.settings.developer.experimentalDiagramPipeline.intentDataChart },
        ];

        intents.forEach(item => {
            selector.add(new Option(item.label, item.value));
        });

        selector.value = this.plugin.settings.preferredDiagramIntent || 'auto';
        selector.onchange = async () => {
            const newValue = selector.value === 'auto' ? undefined : selector.value;
            this.plugin.settings.preferredDiagramIntent = newValue;
            await this.plugin.saveSettings();
            const displayName = intents.find(i => i.value === selector.value)?.label || selector.value;
        };
    }

    async onOpen() {
        const i18n = this.getStrings();
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('notemd-sidebar-container');
        const shell = container.createDiv({ cls: 'notemd-sidebar-shell' });
        const scrollArea = shell.createDiv({ cls: 'notemd-sidebar-scroll' });
        const footer = shell.createDiv({ cls: 'notemd-sidebar-footer mod-docked' });

        const hero = scrollArea.createDiv({ cls: 'notemd-hero-card' });
        hero.createEl('h3', { text: i18n.sidebar.heroTitle });
        hero.createEl('p', { text: i18n.sidebar.heroDesc });

        const workflowResolution = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        const quickBody = this.createSection(
            scrollArea,
            i18n.sidebar.quickWorkflowTitle,
            i18n.sidebar.quickWorkflowDesc,
            true
        );

        workflowResolution.buttons.forEach(buttonConfig => {
            const workflowName = getLocalizedWorkflowButtonName(i18n, buttonConfig.name);
            const workflowClasses = ['notemd-action-button', 'notemd-workflow-button'];
            if (isSingleFileWorkflow(buttonConfig)) {
                workflowClasses.push('mod-cta', 'is-primary');
            }
            const workflowButton = quickBody.createEl('button', {
                text: workflowName,
                cls: workflowClasses.join(' ')
            });
            workflowButton.dataset.category = 'workflow';
            workflowButton.title = buttonConfig.actions.map(actionId => getSidebarActionLabel(i18n, actionId)).join(' > ');
            workflowButton.onclick = async () => {
                await this.runCustomWorkflow(buttonConfig);
            };
            this.workflowButtons.push(workflowButton);
        });

        if (workflowResolution.usedFallback && workflowResolution.errors.length > 0) {
            const warn = quickBody.createDiv({ cls: 'notemd-workflow-warning' });
            warn.setText(formatI18n(i18n.sidebar.workflowFallbackWarning, { count: workflowResolution.errors.length }));
        }

        const actionsByCategory = new Map<ActionCategory, Array<typeof SIDEBAR_ACTION_DEFINITIONS[number]>>();
        SIDEBAR_ACTION_DEFINITIONS.forEach(def => {
            const existing = actionsByCategory.get(def.category) || [];
            existing.push(def);
            actionsByCategory.set(def.category, existing);
        });

        (Object.keys(ACTION_CATEGORY_CONFIG) as ActionCategory[]).forEach(category => {
            const defs = actionsByCategory.get(category) || [];
            if (defs.length === 0) {
                return;
            }

            const categoryTitle = i18n.sidebar.sectionTitles[category];
            const body = this.createSection(
                scrollArea,
                categoryTitle,
                formatI18n(i18n.sidebar.builtInActionsPrefix, { category: categoryTitle }),
                ACTION_CATEGORY_CONFIG[category].openByDefault
            );

            defs.forEach(def => {
                this.createActionButton(body, def.id, def.category);
            });

            if (category === 'generation') {
                this.buildDiagramIntentSelector(body);
            }

            if (category === 'translation') {
                this.buildLanguageSelector(body);
            }
        });

        const progressArea = footer.createDiv({ cls: 'notemd-progress-area is-idle' });
        this.progressAreaEl = progressArea;
        const progressMeta = progressArea.createDiv({ cls: 'notemd-progress-meta' });
        this.statusEl = progressMeta.createEl('p', { text: i18n.common.ready, cls: 'notemd-status-text' });
        this.progressValueEl = progressMeta.createEl('span', { text: i18n.common.ready, cls: 'notemd-progress-value is-idle' });
        this.progressBarContainerEl = progressArea.createEl('div', { cls: 'notemd-progress-bar-container mod-sidebar is-idle' });
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });
        this.timeRemainingEl = progressArea.createEl('p', { text: i18n.common.standby, cls: 'notemd-time-remaining' });

        this.cancelButton = progressArea.createEl('button', { text: i18n.sidebar.cancelProcessing, cls: 'notemd-cancel-button' });
        this.cancelButton.onclick = () => this.requestCancel();

        const logCard = footer.createDiv({ cls: 'notemd-log-card mod-persistent' });
        const logHeader = logCard.createDiv({ cls: 'notemd-log-header' });
        logHeader.createEl('h5', { text: i18n.sidebar.logOutputTitle });
        const copyLogButton = logHeader.createEl('button', { text: i18n.sidebar.copyLog, cls: 'notemd-copy-log-button' });
        copyLogButton.onclick = () => {
            if (this.logContent.length > 0) {
                navigator.clipboard
                    .writeText(this.logContent.join('\n'))
                    .then(() => new Notice(i18n.sidebar.copyLogSuccess), () => new Notice(i18n.sidebar.copyLogFailed));
            } else {
                new Notice(i18n.sidebar.logEmpty);
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
