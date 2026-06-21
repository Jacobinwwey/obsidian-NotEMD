import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import {
    NotemdSettings,
    ProgressReporter,
    LLMProviderConfig,
    TaskKey,
    GlobalModelAwareMaxTokensTracking,
    ProviderDiscoveredModelMaxOutputTokensTracking
} from './types';
import { DEFAULT_SETTINGS, NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_ICON } from './constants';
import {
    canonicalizeProviderConfigs,
    resolveCanonicalProviderName
} from './llmProviders';
import {
    applyFolderTaskSelectionOverride,
    createFolderTaskSelectionPresetOverride,
    createCurrentFolderTaskFileSelectionProfile,
    FolderTaskFileSelectionOverride,
    FolderTaskInteractiveSelection,
    FolderTaskKind,
    FolderTaskSelectionPresetId,
    getFolderTaskFileSelectionProfiles,
    getFolderTaskRegexValidationError,
    isAdvancedFolderTaskFileSelectionEnabled,
    looksLikeFolderTaskPatternPath,
    mergeFolderTaskSelectionOverrides,
    resolveExistingFolderTaskFolderPath,
    resolveFolderTaskProfileFolderSelectionUiState,
    resolveFolderTaskFileSelectionProfile,
    selectFolderTaskFiles
} from './folderTaskFileSelector';
import { retry } from './utils';
import { callLLM } from './llmUtils';
import {
    BatchMermaidFixResult,
    BatchGenerateContentForTitlesResult,
    BatchProcessFolderResult,
    ConceptDedupeCandidate,
    ConceptDedupeResult,
    handleFileRename,
    handleFileDelete,
    GenerateContentForTitleResult,
    processFile,
    ProcessFileResult,
    batchGenerateContentForTitles,
    batchFixMermaidSyntaxInFolder,
    saveMermaidSummaryFile,
    saveDiagramArtifactFile,
    extractConceptsFromFile,
    fixMermaidSyntaxInFile,
    saveErrorLog // Import
} from './fileUtils';
import {
    researchAndSummarizeFile,
    ResearchSummarizeResult
} from './searchUtils';
import {
    buildLocalKnowledgeBaseRetriever,
    buildDiagramLocalKnowledgeQuery,
    inspectLocalKnowledgeRetrieval,
    createEmptyLocalKnowledgeContextBuildResult,
    LocalKnowledgeInspectRequest,
    LocalKnowledgeInspectResult,
    LocalKnowledgeRetrievalSummary,
    toLocalKnowledgeRetrievalSummary
} from './localKnowledgeBase';
import { ProgressModal } from './ui/ProgressModal';
import { ErrorModal } from './ui/ErrorModal';
import { DiagramPreviewModal } from './ui/DiagramPreviewModal';
import { WelcomeModal } from './ui/WelcomeModal';
import { NotemdSettingTab } from './ui/NotemdSettingTab';
import { showConceptNotePathWarningModal, showDeletionConfirmationModal } from './ui/modals'; // Import the modal function
import { NotemdSidebarView } from './ui/NotemdSidebarView';
import { BatchProgressStore } from './batchProgressStore';
import { getSystemPrompt } from './promptUtils';
import { formatI18n, getI18nStrings } from './i18n';
import { resolveTaskLanguageCode } from './i18n/taskLanguagePolicy';
import { getSidebarActionLabel, SidebarActionId } from './workflowButtons';
import { DiagramOperationInput } from './diagram/diagramGenerationService';
import { RenderArtifact } from './rendering/types';
import { IframeRenderHost } from './rendering/host/iframeRenderHost';
import { getRenderTargetDisplayName } from './rendering/targetLabel';
import { supportsDiagramPreviewModal } from './ui/diagramPreview';
import {
    createCompleteResetSettings,
    createPartialResetSettings
} from './settingsReset';
import {
    DiagramCommandExecutionDetails,
    DiagramCommandHostAdapter,
    DiagramCommandExecutionMode,
    DiagramCommandOptions,
    DiagramCommandRunHost,
    DiagramCommandUiStrings,
    isDirectPreviewableDiagramExtension,
    runGenerateDiagramCommandWithHost,
    runPreviewDiagramCommandWithHost
} from './operations/diagramCommandHostAdapter';
import { stopAllServers } from './slideExport/localServer';
import type { SlideExportConfig, SlidevExportSource } from './slideExport/types';
import {
    DiagramCommandExecutionHost,
    runArtifactDiagramExecutionWithHost,
    runSaveMermaidDiagramExecutionWithHost
} from './operations/diagramCommandExecution';
import {
    PluginConfigCommandHost
} from './operations/configProfileCommands';
import {
    ProviderDiagnosticReportHost
} from './operations/providerDiagnosticReportPersistence';
import {
    ProviderDiagnosticCommandHost,
    runProviderDiagnosticCommandWithHost,
    runProviderDiagnosticStabilityCommandWithHost
} from './operations/providerDiagnosticCommandHostAdapter';
import {
    InteractiveProviderConnectionTestCommandHost,
    runInteractiveProviderConnectionTestCommandWithHost
} from './operations/providerConnectionTestCommandHostAdapter';
import {
    ConfigProfileCommandHost,
    ConfigProfileCommandNotice,
    runExportCliCapabilityManifestCommandWithHost,
    runExportCliInvocationContractCommandWithHost,
    runExportCliPublicSurfaceCommandWithHost,
    runExportProviderProfilesCommandWithHost,
    runExportRedactedProviderProfilesCommandWithHost,
    runImportProviderProfilesCommandWithHost
} from './operations/configProfileCommandHostAdapter';
import { invokeMaintainerCliOperation, MaintainerCliOperationRequest } from './maintainerCliBridge';
import {
    getAllowedInputExtensionsForTask,
    isSupportedInputFileForTask,
    readSupportedInputFile,
    SupportedInputTaskId
} from './inputFileSupport';
import {
    NoteProcessingCommandHost,
    runBatchExtractOriginalTextCommandWithHost,
    runBatchExtractConceptsForFolderCommandWithHost,
    runBatchGenerateContentForTitlesCommandWithHost,
    runBatchTranslateFolderCommandWithHost,
    runExtractConceptsAndGenerateTitlesCommandWithHost,
    runExtractConceptsCommandWithHost,
    runExtractOriginalTextCommandWithHost,
    runGenerateContentForTitleCommandWithHost,
    runCreateWikiLinkAndGenerateFromSelectionCommandWithHost,
    runProcessFolderWithNotemdCommandWithHost,
    runProcessWithNotemdCommandWithHost,
    runResearchAndSummarizeCommandWithHost,
    runTranslateFileCommandWithHost
} from './operations/noteProcessingCommandHostAdapter';
import {
    runBatchFixFormulaFormatsCommandWithHost,
    runBatchMermaidFixCommandWithHost,
    runCheckDuplicatesCurrentCommandWithHost,
    runCheckAndRemoveDuplicateConceptNotesCommandWithHost,
    runFixFormulaFormatsCommandWithHost,
    runSplitNoteByChaptersCommandWithHost,
    UtilityCommandHost
} from './operations/utilityCommandHostAdapter';
import { ChapterSplitOptions, ChapterSplitResult, splitNoteByChapters } from './chapterSplit';

interface DiagramLocalKnowledgeContextResult {
    operationInput: DiagramOperationInput;
    localKnowledgeContextUsed: boolean;
    localKnowledgeRetrieval: LocalKnowledgeRetrievalSummary;
}

export default class NotemdPlugin extends Plugin {
    settings: NotemdSettings;
    statusBarItem: HTMLElement;
    private ribbonIconEl: HTMLElement | null = null;
    private isBusy: boolean = false;
    private suppressConceptNotePathWarningOnce = false;
    currentProcessingFileBasename: { value: string | null } = { value: null }; // Keep track of the file being processed

    public getIsBusy(): boolean {
        return this.isBusy;
    }

    // Method to set the busy state, primarily for internal use by command handlers
    // Could potentially be used by UI components if needed, but command handlers are safer
    public setBusy(busy: boolean) {
        this.isBusy = busy;
        // Optionally update status bar or trigger UI updates if needed globally
        // this.updateStatusBar(busy ? 'Busy...' : 'Ready');
    }

    private getUiStrings() {
        return getI18nStrings({ uiLocale: this.settings?.uiLocale || 'auto' });
    }

    public clearConceptNotePathWarningSuppressionOnce(): void {
        this.suppressConceptNotePathWarningOnce = false;
    }

    public async openSettingsAtSection(sectionKey?: string): Promise<void> {
        (this.app as any).setting?.openTabById?.('notemd');
        if (!sectionKey) {
            return;
        }

        window.requestAnimationFrame(() => {
            const target = document.querySelector<HTMLElement>(`[data-notemd-setting-section="${sectionKey}"]`);
            if (target) {
                target.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        });
    }

    public async ensureConceptNotePathConfiguredForActions(actionLabels: string[]): Promise<boolean> {
        if (this.settings.suppressConceptNotePathWarningForever || this.suppressConceptNotePathWarningOnce) {
            return true;
        }

        if (this.settings.useCustomConceptNoteFolder && this.settings.conceptNoteFolder.trim()) {
            return true;
        }

        const choice = await showConceptNotePathWarningModal(this.app, {
            uiLocale: this.settings.uiLocale,
            actions: actionLabels
        });

        if (choice === 'configure') {
            await this.openSettingsAtSection('concept-note-output');
            return false;
        }

        if (choice === 'skip-forever') {
            this.settings.suppressConceptNotePathWarningForever = true;
            await this.saveSettings();
            new Notice(this.getUiStrings().notices.conceptNotePathWarningSuppressedForever);
            return true;
        }

        this.suppressConceptNotePathWarningOnce = true;
        new Notice(this.getUiStrings().notices.conceptNotePathWarningSuppressedOnce);
        return true;
    }

    private openLocalizedErrorModal(title: string, errorMessage: string) {
        new ErrorModal(this.app, title, errorMessage, this.settings.uiLocale).open();
    }

    private supportsDiagramPreview(artifact: RenderArtifact): boolean {
        return supportsDiagramPreviewModal(artifact);
    }

    private openDiagramPreviewModal(artifact: RenderArtifact, sourcePath: string, artifactSaved = false) {
        const i18n = this.getUiStrings();
        const targetLabel = getRenderTargetDisplayName(artifact.target);
        const previewTitle = formatI18n(i18n.previewModal.title, { target: targetLabel });
        const session = new IframeRenderHost().createSession(artifact, { sourcePath, artifactSaved, previewTitle });
        new DiagramPreviewModal(this.app, session, this.settings.uiLocale).open();
    }

    private createDiagramCommandHostAdapter(): DiagramCommandHostAdapter {
        return {
            saveMermaidSummary: (file, mermaidContent, reporter) =>
                saveMermaidSummaryFile(this.app, this.settings, file, mermaidContent, reporter),
            saveArtifact: (file, artifact, reporter) =>
                saveDiagramArtifactFile(this.app, this.settings, file, artifact, reporter),
            getFileByPath: (path) => {
                const abstractFile = this.app.vault.getAbstractFileByPath(path);
                return abstractFile instanceof TFile ? abstractFile : null;
            },
            readFile: (file) => this.readSupportedTaskInputFile(file),
            openFile: (file) => {
                const leaf = this.app.workspace.getLeaf('split', 'vertical');
                leaf.openFile(file);
            },
            maybeAutoFixMermaid: (file, reporter, reason) =>
                this.maybeAutoFixMermaidForFile(file, reporter, reason),
            supportsPreview: (artifact) => this.supportsDiagramPreview(artifact),
            openPreview: (artifact, sourcePath, artifactSaved = false) =>
                this.openDiagramPreviewModal(artifact, sourcePath, artifactSaved),
            notify: (message, duration) => {
                new Notice(message, duration);
            }
        };
    }

    private createPluginConfigCommandHost(): PluginConfigCommandHost {
        return {
            configDir: this.app.vault.configDir,
            exists: (path) => this.app.vault.adapter.exists(path),
            mkdir: (path) => this.app.vault.adapter.mkdir(path),
            read: (path) => this.app.vault.adapter.read(path),
            write: (path, content) => this.app.vault.adapter.write(path, content)
        };
    }

    private createProviderDiagnosticReportHost(): ProviderDiagnosticReportHost {
        return {
            exists: (path) => this.app.vault.adapter.exists(path),
            create: async (path, content) => {
                await this.app.vault.create(path, content);
            }
        };
    }

    private createProviderDiagnosticCommandHost(): ProviderDiagnosticCommandHost {
        return {
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            sanitizeTimeoutMs: (rawValue) => this.sanitizeDeveloperDiagnosticTimeoutMs(rawValue),
            sanitizeRuns: (rawValue) => this.sanitizeDeveloperDiagnosticRuns(rawValue),
            reportHost: this.createProviderDiagnosticReportHost()
        };
    }

    private createProviderConnectionTestCommandHost(): InteractiveProviderConnectionTestCommandHost {
        return {
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            getReporter: () => this.getReporter(),
            isBusy: () => this.isBusy,
            setBusy: (busy) => this.setBusy(busy),
            getBusyNotice: () => this.getUiStrings().notices.cannotTestConnectionWhileProcessing,
            showNotice: (message, duration) => new Notice(message, duration),
            logError: (message, details) => console.error(message, details),
            openErrorModal: (title, details) => this.openLocalizedErrorModal(title, details),
            saveErrorLog: (error, reporter) => saveErrorLog(this.app, reporter, error, this.settings)
        };
    }

    private createDiagramCommandRunHost(): DiagramCommandRunHost {
        return {
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            getReporter: () => this.getReporter(),
            isBusy: () => this.isBusy,
            setBusy: (busy) => this.setBusy(busy),
            getBusyNotice: () => this.getUiStrings().notices.anotherProcessRunning,
            startReporterAction: (reporter, label) => this.startReporterAction(reporter, label),
            finalizeReporter: (reporter) => {
                if (reporter instanceof NotemdSidebarView) {
                    reporter.finishProcessing();
                }
            },
            getActionLabel: (executionMode, i18n) => this.getDiagramCommandActionLabel(executionMode, i18n),
            getActionCompleteText: (label) => this.getActionCompleteText(label),
            getActionFailedText: (message) => this.getActionFailedText(message),
            readFile: (file) => this.readSupportedTaskInputFile(file),
            getProviderAndModelForTask: (task) => this.getProviderAndModelForTask(task),
            getTaskLanguageCode: (task) => resolveTaskLanguageCode(this.settings, task),
            executeSaveMermaidCommand: (file, operationInput, provider, modelName, reporter, actionLabel, i18n) =>
                this.executeSaveMermaidDiagramCommand(file, operationInput, provider, modelName, reporter, actionLabel, i18n),
            executeArtifactCommand: (file, operationInput, provider, modelName, reporter, actionLabel, i18n, executionMode) =>
                this.executeArtifactDiagramCommand(file, operationInput, provider, modelName, reporter, actionLabel, i18n, executionMode),
            createDiagramHostAdapter: () => this.createDiagramCommandHostAdapter(),
            saveErrorLog: (error, reporter) => saveErrorLog(this.app, reporter, error, this.settings),
            logError: (message, details) => console.error(message, details)
        };
    }

    private createDiagramCommandExecutionHost(): DiagramCommandExecutionHost {
        return {
            getSettings: () => this.settings,
            getLegacyMermaidPrompt: () => this.getPromptForTask('summarizeToMermaid'),
            createDiagramHostAdapter: () => this.createDiagramCommandHostAdapter(),
            getStepStatusText: (current, total, label) => this.getStepStatusText(current, total, label),
            getActionCompleteText: (label) => this.getActionCompleteText(label)
        };
    }

    private createConfigProfileCommandHost(): ConfigProfileCommandHost {
        return {
            loadSettings: () => this.loadSettings(),
            saveSettings: () => this.saveSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            pluginId: this.manifest.id,
            defaultActiveProvider: DEFAULT_SETTINGS.activeProvider,
            configHost: this.createPluginConfigCommandHost(),
            logError: (message, error) => console.error(message, error)
        };
    }

    private createNoteProcessingCommandHost(): NoteProcessingCommandHost {
        return {
            getApp: () => this.app,
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getPluginRuntime: () => this,
            getActiveFile: () => {
                const activeFile = this.app.workspace.getActiveFile();
                return activeFile instanceof TFile ? activeFile : null;
            },
            getFileByPath: (path) => {
                const abstractFile = this.app.vault.getAbstractFileByPath(path);
                return abstractFile instanceof TFile ? abstractFile : null;
            },
            getFolderByPath: (path) => {
                const abstractFile = this.app.vault.getAbstractFileByPath(path);
                return abstractFile instanceof TFolder ? abstractFile : null;
            },
            getFiles: () => this.app.vault.getFiles(),
            getFolderSelection: () => this.getFolderSelection(),
            getFolderTaskSelection: (taskKind, initialOverride) => this.getFolderTaskSelection(taskKind, initialOverride),
            getTaskLanguageCode: (task) => resolveTaskLanguageCode(this.settings, task),
            resolveCompleteFolderPath: (sourceFolderPath) => this.resolveCompleteFolderPath(sourceFolderPath),
            getStepStatusText: (current, total, label) => this.getStepStatusText(current, total, label),
            currentProcessingFileBasename: this.currentProcessingFileBasename,
            getBatchProgressStore: () => this.getBatchProgressStore(),
            getUiStrings: () => this.getUiStrings(),
            getActionLabel: (actionId) => this.getActionLabel(actionId),
            getReporter: () => this.getReporter(),
            isBusy: () => this.isBusy,
            setBusy: (busy) => this.setBusy(busy),
            startReporterAction: (reporter, label) => this.startReporterAction(reporter, label),
            failReporterAction: (reporter, message) => this.failReporterAction(reporter, message),
            updateStatusBar: (message) => this.updateStatusBar(message),
            getRunningActionText: (label) => this.getRunningActionText(label),
            getActionCompleteText: (label) => this.getActionCompleteText(label),
            ensureConceptNotePathConfiguredForActions: (actionLabels) =>
                this.ensureConceptNotePathConfiguredForActions(actionLabels),
            showNotice: (message, duration) => new Notice(message, duration),
            logError: (message, details) => console.error(message, details),
            openErrorModal: (title, details) => this.openLocalizedErrorModal(title, details),
            saveErrorLog: (error, reporter) => saveErrorLog(this.app, reporter, error, this.settings),
            maybeAutoFixMermaidForFile: (file, reporter, reason) =>
                this.maybeAutoFixMermaidForFile(file, reporter, reason),
            maybeAutoFixMermaidForFolder: (folderPath, reporter, reason) =>
                this.maybeAutoFixMermaidForFolder(folderPath, reporter, reason),
            appendVaultLog: (path, content) => this.app.vault.adapter.append(path, content),
            completeReporter: (reporter) => {
                if (reporter instanceof ProgressModal) {
                    setTimeout(() => reporter.close(), 2000);
                }
            },
            finalizeReporter: (reporter) => {
                if (reporter instanceof NotemdSidebarView) {
                    reporter.finishProcessing();
                }
            }
        };
    }

    private createUtilityCommandHost(): UtilityCommandHost {
        return {
            getApp: () => this.app,
            getActiveFile: () => this.app.workspace.getActiveFile(),
            readFile: (file) => this.readSupportedTaskInputFile(file),
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            getActionLabel: (actionId) => this.getActionLabel(actionId),
            getReporter: () => this.getReporter(),
            getFolderSelection: () => this.getFolderSelection(),
            getFolderTaskSelection: (taskKind, initialOverride) => this.getFolderTaskSelection(taskKind, initialOverride),
            isBusy: () => this.isBusy,
            setBusy: (busy) => this.setBusy(busy),
            startReporterAction: (reporter, label) => this.startReporterAction(reporter, label),
            failReporterAction: (reporter, message) => this.failReporterAction(reporter, message),
            updateStatusBar: (message) => this.updateStatusBar(message),
            getRunningActionText: (label) => this.getRunningActionText(label),
            getActionCompleteText: (label) => this.getActionCompleteText(label),
            showNotice: (message, duration) => new Notice(message, duration),
            confirmConceptDeletion: (reportList: ConceptDedupeCandidate[], uiLocale: string) =>
                showDeletionConfirmationModal(this.app, reportList, uiLocale),
            logInfo: (message, details) => console.log(message, details),
            logError: (message, details) => console.error(message, details),
            openErrorModal: (title, details) => this.openLocalizedErrorModal(title, details),
            saveErrorLog: (error, reporter) => saveErrorLog(this.app, reporter, error, this.settings),
            completeReporter: (reporter) => {
                if (reporter instanceof ProgressModal) {
                    setTimeout(() => reporter.close(), 2000);
                }
            },
            finalizeReporter: (reporter) => {
                if (reporter instanceof NotemdSidebarView) {
                    reporter.finishProcessing();
                }
            }
        };
    }

    private showCommandNotices(notices: ConfigProfileCommandNotice[]): void {
        for (const notice of notices) {
            new Notice(notice.message, notice.duration);
        }
    }

    private getDiagramCommandActionLabel(
        executionMode: DiagramCommandExecutionMode,
        i18n: DiagramCommandUiStrings = this.getUiStrings()
    ): string {
        switch (executionMode) {
            case 'save-mermaid':
                return this.getActionLabel('summarize-as-mermaid');
            case 'save-artifact':
                return i18n.commands.generateExperimentalDiagram;
            case 'preview-artifact':
                return i18n.commands.previewExperimentalDiagram;
        }
    }

    private sanitizeDeveloperDiagnosticTimeoutMs(rawValue: number): number {
        if (!Number.isFinite(rawValue)) {
            return DEFAULT_SETTINGS.developerDiagnosticTimeoutMs;
        }

        const normalized = Math.floor(rawValue);
        if (normalized < 15_000) {
            return 15_000;
        }
        return Math.min(normalized, 60 * 60 * 1000);
    }

    private sanitizeDeveloperDiagnosticRuns(rawValue: number): number {
        if (!Number.isFinite(rawValue)) {
            return DEFAULT_SETTINGS.developerDiagnosticStabilityRuns;
        }

        const normalized = Math.floor(rawValue);
        if (normalized < 1) {
            return 1;
        }
        return Math.min(normalized, 10);
    }

    private isSupportedTaskInputFile(file: TFile, taskId: SupportedInputTaskId): boolean {
        return isSupportedInputFileForTask(this.settings, taskId, file);
    }

    private getAllowedTaskInputExtensions(taskId: SupportedInputTaskId): string[] {
        return getAllowedInputExtensionsForTask(this.settings, taskId);
    }

    private readSupportedTaskInputFile(file: TFile): Promise<string> {
        return readSupportedInputFile(this.app, file, this.settings);
    }

    private registerEditorDiagramCommand(
        id: string,
        name: string,
        taskId: Extract<SupportedInputTaskId, 'summarize-as-mermaid' | 'generate-diagram'>,
        handler: (file: TFile, reporter: ProgressReporter) => Promise<void>
    ) {
        this.addCommand({
            id,
            name,
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = !!activeFile && this.isSupportedTaskInputFile(activeFile, taskId);
                if (condition) {
                    if (!checking && activeFile) {
                        const reporter = this.getReporter();
                        void handler.call(this, activeFile, reporter);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    private registerPreviewDiagramCommand(
        id: string,
        name: string,
        handler: (file: TFile, reporter: ProgressReporter) => Promise<void>
    ) {
        const runHandler = async (file: TFile) => {
            const reporter = this.getReporter();
            await handler.call(this, file, reporter);
        };

        this.addCommand({
            id,
            name,
            editorCallback: async (_editor: Editor, view: MarkdownView) => {
                const file = view.file;
                if (file && this.canPreviewDiagramFromFile(file)) {
                    await runHandler(file);
                }
            },
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = !!activeFile && this.canPreviewDiagramFromFile(activeFile);
                if (condition) {
                    if (!checking && activeFile) {
                        void runHandler(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    private canPreviewDiagramFromFile(file: TFile): boolean {
        const derivedExtension = file.extension
            || file.name?.split('.').pop()
            || file.path?.split('.').pop()
            || '';
        return isDirectPreviewableDiagramExtension(derivedExtension);
    }

    async onload() {
        await this.loadSettings();

        // Show welcome modal on first install
        if (this.settings._firstLaunch === undefined || this.settings._firstLaunch) {
            this.settings._firstLaunch = false;
            await this.saveSettings();
            // Delay slightly so the Obsidian layout is ready
            setTimeout(() => {
                new WelcomeModal(this.app, this.settings.uiLocale).open();
            }, 500);
        }
        const uiStrings = this.getUiStrings();

        // --- Sidebar View ---
        this.registerView(NOTEMD_SIDEBAR_VIEW_TYPE, (leaf) => new NotemdSidebarView(leaf, this));

        this.registerEditorDiagramCommand(
            'notemd-summarize-as-mermaid',
            getSidebarActionLabel(uiStrings, 'summarize-as-mermaid'),
            'summarize-as-mermaid',
            this.summarizeToMermaidCommand
        );

        this.registerEditorDiagramCommand(
            'notemd-generate-diagram',
            uiStrings.commands.generateExperimentalDiagram,
            'generate-diagram',
            async (file, reporter) => {
                await this.generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });
            }
        );

        this.registerPreviewDiagramCommand(
            'notemd-preview-diagram',
            uiStrings.commands.previewExperimentalDiagram,
            async (file, reporter) => {
                await this.previewDiagramCommand(file, reporter);
            }
        );

        // Legacy compatibility aliases remain registered until downstream workflows
        // and docs fully converge on the canonical diagram command ids.
        this.registerEditorDiagramCommand(
            'notemd-generate-experimental-diagram',
            uiStrings.commands.generateExperimentalDiagram,
            'generate-diagram',
            this.generateExperimentalDiagramCommand
        );

        this.registerPreviewDiagramCommand(
            'notemd-preview-experimental-diagram',
            uiStrings.commands.previewExperimentalDiagram,
            async (file, reporter) => {
                await this.previewExperimentalDiagramCommand(file, reporter);
            }
        );

		this.ribbonIconEl = this.addRibbonIcon(NOTEMD_SIDEBAR_ICON, uiStrings.plugin.ribbonTooltip, () => {
			this.activateView();
		});
        this.ribbonIconEl.setAttribute('aria-label', uiStrings.plugin.ribbonTooltip);
        this.ribbonIconEl.setAttribute('title', uiStrings.plugin.ribbonTooltip);

        // --- Status Bar ---
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar(uiStrings.common.ready);

        // --- Command Palette Integration ---
        this.addCommand({
            id: 'process-with-notemd',
            name: getSidebarActionLabel(uiStrings, 'process-current-add-links'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = activeFile && (activeFile.extension === 'md' || activeFile.extension === 'txt');
                if (condition) {
                    if (!checking) {
                        this.processWithNotemdCommand();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'process-folder-with-notemd',
            name: getSidebarActionLabel(uiStrings, 'process-folder-add-links'),
            callback: async () => {
                await this.processFolderWithNotemdCommand(); // Use the command handler method
            }
        });

        // Command to check duplicates in the current file (simple version)
        this.addCommand({
            id: 'check-for-duplicates',
            name: uiStrings.commands.checkDuplicatesCurrent,
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = !!activeFile && this.isSupportedTaskInputFile(activeFile, 'check-duplicates-current');
                if (condition) {
                    if (!checking) {
                        void this.checkDuplicatesCurrentCommand();
                    }
                    return true;
                }
                return false;
            }
        });


        this.addCommand({
            id: 'test-llm-connection',
            name: getSidebarActionLabel(uiStrings, 'test-llm-connection'),
            checkCallback: (checking: boolean) => {
                const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
                const condition = !!provider;
                if (condition) {
                    if (!checking) {
                        this.testLlmConnectionCommand();
                    }
                    return true;
                }
                if (!checking) { // Only show notice if trying to execute, not just checking availability
                    new Notice(uiStrings.notices.noActiveProviderConfigured);
                }
                return false;
            }
        });

        this.addCommand({
            id: 'run-developer-provider-diagnostic',
            name: `${uiStrings.settings.developer.runDiagnostic} (${getSidebarActionLabel(uiStrings, 'test-llm-connection')})`,
            callback: async () => {
                await this.runDeveloperProviderDiagnosticCommand();
            }
        });

        this.addCommand({
            id: 'run-developer-provider-stability-diagnostic',
            name: `${uiStrings.settings.developer.runStability} (${getSidebarActionLabel(uiStrings, 'test-llm-connection')})`,
            callback: async () => {
                await this.runDeveloperProviderStabilityDiagnosticCommand();
            }
        });

        this.addCommand({
            id: 'export-provider-profiles',
            name: uiStrings.commands.exportProviderProfiles,
            callback: async () => {
                await this.exportProviderProfilesCommand();
            }
        });

        this.addCommand({
            id: 'export-provider-profiles-redacted',
            name: uiStrings.commands.exportProviderProfilesRedacted,
            callback: async () => {
                await this.exportRedactedProviderProfilesCommand();
            }
        });

        this.addCommand({
            id: 'import-provider-profiles',
            name: uiStrings.commands.importProviderProfiles,
            callback: async () => {
                await this.importProviderProfilesCommand();
            }
        });

        this.addCommand({
            id: 'export-cli-capability-manifest',
            name: uiStrings.commands.exportCliCapabilityManifest,
            callback: async () => {
                await this.exportCliCapabilityManifestCommand();
            }
        });

        this.addCommand({
            id: 'export-cli-invocation-contract',
            name: uiStrings.commands.exportCliInvocationContract,
            callback: async () => {
                await this.exportCliInvocationContractCommand();
            }
        });

        this.addCommand({
            id: 'export-cli-public-surface',
            name: uiStrings.commands.exportCliPublicSurface,
            callback: async () => {
                await this.exportCliPublicSurfaceCommand();
            }
        });

        this.addCommand({
            id: 'generate-content-from-title',
            name: getSidebarActionLabel(uiStrings, 'generate-from-title'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = activeFile && activeFile instanceof TFile && activeFile.extension === 'md';
                if (condition) {
                    if (!checking) {
                        // Re-fetch activeFile for safety, as it might change
                        const currentActiveFile = this.app.workspace.getActiveFile();
                        if (currentActiveFile && currentActiveFile instanceof TFile && currentActiveFile.extension === 'md') {
                            this.generateContentForTitleCommand(currentActiveFile);
                        } else {
                            new Notice(uiStrings.notices.noActiveMarkdownFileSelectedOrChanged);
                        }
                    }
                    return true;
                }
                 if (!checking) {
                    new Notice(uiStrings.notices.noActiveMarkdownFileSelected);
                }
                return false;
            }
        });

        this.addCommand({
            id: 'research-and-summarize-topic',
            name: getSidebarActionLabel(uiStrings, 'research-and-summarize'),
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                const condition = activeView !== null;
                if (condition) {
                    if (!checking) {
                        // Re-fetch activeView for safety
                        const currentActiveView = this.app.workspace.getActiveViewOfType(MarkdownView);
                        if (currentActiveView) {
                             this.researchAndSummarizeCommand(currentActiveView.editor, currentActiveView);
                        }
                    }
                    return true;
                }
                if (!checking) {
                    new Notice(uiStrings.notices.noActiveMarkdownEditorFound);
                }
                return false;
            }
        });

        this.addCommand({
            id: 'batch-generate-content-from-titles',
            name: getSidebarActionLabel(uiStrings, 'batch-generate-from-titles'),
            callback: async () => {
                await this.batchGenerateContentForTitlesCommand(); // Use the command handler method
            }
        });

        this.addCommand({
            id: 'check-and-remove-duplicate-concept-notes',
            name: getSidebarActionLabel(uiStrings, 'check-remove-duplicate-concepts'),
            callback: async () => {
                await this.checkAndRemoveDuplicateConceptNotesCommand(); // Use the command handler method
            }
        });

        this.addCommand({
            id: 'batch-mermaid-fix',
            name: getSidebarActionLabel(uiStrings, 'batch-mermaid-fix'),
            callback: async () => {
                await this.batchMermaidFixCommand(); // Use the new command handler method
            }
        });

        this.addCommand({
            id: 'fix-formula-formats',
            name: getSidebarActionLabel(uiStrings, 'fix-formula-current'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = activeFile && (activeFile.extension === 'md' || activeFile.extension === 'txt');
                if (condition) {
                    if (!checking) {
                        this.fixFormulaFormatsCommand(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'batch-fix-formula-formats',
            name: getSidebarActionLabel(uiStrings, 'batch-fix-formula'),
            callback: async () => {
                await this.batchFixFormulaFormatsCommand();
            }
        });

        this.addCommand({
            id: 'translate-file',
            name: getSidebarActionLabel(uiStrings, 'translate-current-file'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = !!activeFile && this.isSupportedTaskInputFile(activeFile, 'translate-current-file');
                if (condition && activeFile) {
                    if (!checking) {
                        this.translateFileCommand(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'extract-concepts-from-current-file',
            name: getSidebarActionLabel(uiStrings, 'extract-concepts-current'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = !!activeFile && this.isSupportedTaskInputFile(activeFile, 'extract-concepts-current');
                if (condition) {
                    if (!checking) {
                        this.extractConceptsCommand();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'batch-extract-concepts-from-folder',
            name: getSidebarActionLabel(uiStrings, 'extract-concepts-folder'),
            callback: async () => {
                await this.batchExtractConceptsForFolderCommand();
            }
        });

        this.addCommand({
            id: 'batch-translate-folder',
            name: getSidebarActionLabel(uiStrings, 'batch-translate-folder'),
            callback: async () => {
                await this.batchTranslateFolderCommand();
            }
        });

        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                            .setTitle(getSidebarActionLabel(uiStrings, 'batch-translate-folder'))
                            .setIcon('language')
                            .onClick(async () => {
                                await this.batchTranslateFolderCommand(file);
                            });
                    });
                }
            })
        );

        this.addCommand({
            id: 'extract-concepts-and-generate-titles',
            name: uiStrings.commands.extractConceptsAndGenerateTitles,
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile && activeFile.extension === 'md') {
                    if (!checking) {
                        this.extractConceptsAndGenerateTitlesCommand();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'extract-original-text',
            name: getSidebarActionLabel(uiStrings, 'extract-original-text'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = activeFile && (activeFile.extension === 'md' || activeFile.extension === 'txt');
                if (condition) {
                    if (!checking) {
                        this.extractOriginalTextCommand();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'batch-extract-original-text',
            name: getSidebarActionLabel(uiStrings, 'batch-extract-original-text'),
            callback: async () => {
                await this.batchExtractOriginalTextCommand();
            }
        });

        this.addCommand({
            id: 'split-note-by-chapters',
            name: getSidebarActionLabel(uiStrings, 'split-note-by-chapters'),
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                const condition = activeFile && activeFile instanceof TFile && activeFile.extension === 'md';
                if (condition) {
                    if (!checking) {
                        this.splitNoteByChaptersCommand();
                    }
                    return true;
                }
                if (!checking) {
                    new Notice(uiStrings.notices.noActiveMarkdownFileSelected);
                }
                return false;
            }
        });

        this.addCommand({
            id: 'create-wiki-link-and-generate-from-selection',
            name: uiStrings.commands.createWikiLinkAndGenerateNoteFromSelection,
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.createWikiLinkAndGenerateFromSelectionCommand(editor, view);
            }
        });

        // Slide export commands (desktop-only)
        if ((globalThis as any).Platform?.isDesktopApp !== false) {
            this.addCommand({
                id: 'probe-slide-export-environment',
                name: getSidebarActionLabel(uiStrings, 'probe-slide-export-env'),
                callback: async () => {
                    await this.probeSlideExportEnvironmentCommand();
                }
            });

            this.addCommand({
                id: 'export-slides',
                name: getSidebarActionLabel(uiStrings, 'export-slides'),
                checkCallback: (checking: boolean) => {
                    const activeFile = this.app.workspace.getActiveFile();
                    const condition = activeFile && activeFile instanceof TFile && activeFile.extension === 'md';
                    if (condition) {
                        if (!checking) {
                            const currentActiveFile = this.app.workspace.getActiveFile();
                            if (currentActiveFile && currentActiveFile instanceof TFile && currentActiveFile.extension === 'md') {
                                this.exportSlidesCommand(currentActiveFile);
                            } else {
                                new Notice(uiStrings.notices.noActiveMarkdownFileSelectedOrChanged);
                            }
                        }
                        return true;
                    }
                    if (!checking) {
                        new Notice(uiStrings.notices.noActiveMarkdownFileSelected);
                    }
                    return false;
                }
            });
        }

        // --- Settings Tab ---
        this.addSettingTab(new NotemdSettingTab(this.app, this));

        // --- Event Listeners ---
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            if (file instanceof TFile && file.extension === 'md') {
                handleFileRename(this.app, oldPath, file.path, this.settings.uiLocale); // Call utility function
            }
        }));
        this.registerEvent(this.app.vault.on('delete', (file) => {
            if (file instanceof TFile && file.extension === 'md') {
                handleFileDelete(this.app, file.path, this.settings.uiLocale); // Call utility function
            }
        }));

        // Optional: Register DOM events or intervals if needed
        // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {});
        // this.registerInterval(window.setInterval(() => console.log('Interval'), 5 * 60 * 1000));
    }

    onunload() {
        // Clean up resources if necessary
        stopAllServers();
    }

    // --- Settings Management ---
    private normalizeGlobalModelAwareMaxTokensTracking(
        value: unknown
    ): GlobalModelAwareMaxTokensTracking | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined;
        }

        const candidate = value as Partial<GlobalModelAwareMaxTokensTracking>;
        const providerName = typeof candidate.providerName === 'string' ? candidate.providerName.trim() : '';
        const modelName = typeof candidate.modelName === 'string' ? candidate.modelName.trim() : '';
        const discoveryIdentity = typeof candidate.discoveryIdentity === 'string' ? candidate.discoveryIdentity.trim() : '';
        const resolvedMaxTokens = Number(candidate.resolvedMaxTokens);

        if (!providerName || !modelName || !discoveryIdentity) {
            return undefined;
        }

        if (!Number.isFinite(resolvedMaxTokens) || resolvedMaxTokens <= 0) {
            return undefined;
        }

        return {
            providerName,
            modelName,
            discoveryIdentity,
            resolvedMaxTokens: Math.floor(resolvedMaxTokens)
        };
    }

    private normalizeDiscoveredModelMaxOutputTokensTracking(
        value: unknown
    ): ProviderDiscoveredModelMaxOutputTokensTracking | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined;
        }

        const candidate = value as Partial<ProviderDiscoveredModelMaxOutputTokensTracking>;
        const providerName = typeof candidate.providerName === 'string' ? candidate.providerName.trim() : '';
        const modelName = typeof candidate.modelName === 'string' ? candidate.modelName.trim() : '';
        const discoveryIdentity = typeof candidate.discoveryIdentity === 'string' ? candidate.discoveryIdentity.trim() : '';
        const resolvedMaxOutputTokens = Number(candidate.resolvedMaxOutputTokens);

        if (!providerName || !modelName || !discoveryIdentity) {
            return undefined;
        }

        if (!Number.isFinite(resolvedMaxOutputTokens) || resolvedMaxOutputTokens <= 0) {
            return undefined;
        }

        return {
            providerName,
            modelName,
            discoveryIdentity,
            resolvedMaxOutputTokens: Math.floor(resolvedMaxOutputTokens)
        };
    }

    async loadSettings() {
        const savedData = await this.loadData() || {};
        const savedProviders = canonicalizeProviderConfigs(savedData.providers || []);
        const defaultProviders = DEFAULT_SETTINGS.providers;
        const mergedProviders: LLMProviderConfig[] = [];
        const savedProviderMap = new Map(savedProviders.map((p: LLMProviderConfig) => [p.name, p]));

        savedProviders.forEach((savedProvider: LLMProviderConfig) => {
            const defaultProvider = defaultProviders.find(dp => dp.name === savedProvider.name);
            mergedProviders.push({ ...(defaultProvider || {}), ...savedProvider });
        });

        defaultProviders.forEach(defaultProvider => {
            if (!savedProviderMap.has(defaultProvider.name)) {
                mergedProviders.push({ ...defaultProvider });
            }
        });


        // Merge local-only providers from localStorage
        if (typeof localStorage !== 'undefined') {
            try {
                const localRaw = localStorage.getItem('notemd-local-providers');
                if (localRaw) {
                    const localProviders = canonicalizeProviderConfigs(JSON.parse(localRaw) as LLMProviderConfig[]);
                    const mergedNames = new Set(mergedProviders.map(p => p.name));
                    for (const lp of localProviders) {
                        if (!mergedNames.has(lp.name)) {
                            lp.localOnly = true;
                            mergedProviders.push(lp);
                        }
                    }
                }
            } catch {
                // Corrupted localStorage data — ignore
            }
        }

        this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData, { providers: mergedProviders });
        this.settings.globalModelAwareMaxTokensTracking = this.normalizeGlobalModelAwareMaxTokensTracking(
            this.settings.globalModelAwareMaxTokensTracking
        );
        this.settings.discoveredModelMaxOutputTokensTracking = this.normalizeDiscoveredModelMaxOutputTokensTracking(
            this.settings.discoveredModelMaxOutputTokensTracking
        );
        if (
            this.settings.globalModelAwareMaxTokensTracking
            && !mergedProviders.some(provider => provider.name === this.settings.globalModelAwareMaxTokensTracking?.providerName)
        ) {
            this.settings.globalModelAwareMaxTokensTracking = undefined;
        }
        if (
            this.settings.discoveredModelMaxOutputTokensTracking
            && !mergedProviders.some(provider => provider.name === this.settings.discoveredModelMaxOutputTokensTracking?.providerName)
        ) {
            this.settings.discoveredModelMaxOutputTokensTracking = undefined;
        }
        if (savedData.autoApplyDiscoveredModelMaxOutputTokens === undefined) {
            this.settings.autoApplyDiscoveredModelMaxOutputTokens = this.settings.autoSyncGlobalTokensOnDiscoveredModelApply;
        }
        this.settings.activeProvider = resolveCanonicalProviderName(this.settings.activeProvider);
        this.settings.addLinksProvider = resolveCanonicalProviderName(this.settings.addLinksProvider);
        this.settings.researchProvider = resolveCanonicalProviderName(this.settings.researchProvider);
        this.settings.generateTitleProvider = resolveCanonicalProviderName(this.settings.generateTitleProvider);
        this.settings.translateProvider = resolveCanonicalProviderName(this.settings.translateProvider);
        this.settings.summarizeToMermaidProvider = resolveCanonicalProviderName(this.settings.summarizeToMermaidProvider);
        this.settings.extractConceptsProvider = resolveCanonicalProviderName(this.settings.extractConceptsProvider);
        this.settings.extractOriginalTextProvider = resolveCanonicalProviderName(this.settings.extractOriginalTextProvider);

        if (!this.settings.providers.some(p => p.name === this.settings.activeProvider)) {
            this.settings.activeProvider = DEFAULT_SETTINGS.activeProvider;
        }
        // Ensure task-specific providers fall back to active if invalid or not set
        this.settings.addLinksProvider = this.settings.providers.some(p => p.name === this.settings.addLinksProvider) ? this.settings.addLinksProvider : this.settings.activeProvider;
        this.settings.researchProvider = this.settings.providers.some(p => p.name === this.settings.researchProvider) ? this.settings.researchProvider : this.settings.activeProvider;
        this.settings.generateTitleProvider = this.settings.providers.some(p => p.name === this.settings.generateTitleProvider) ? this.settings.generateTitleProvider : this.settings.activeProvider;
        this.settings.translateProvider = this.settings.providers.some(p => p.name === this.settings.translateProvider) ? this.settings.translateProvider : this.settings.activeProvider;
        this.settings.summarizeToMermaidProvider = this.settings.providers.some(p => p.name === this.settings.summarizeToMermaidProvider) ? this.settings.summarizeToMermaidProvider : this.settings.activeProvider;
        this.settings.extractConceptsProvider = this.settings.providers.some(p => p.name === this.settings.extractConceptsProvider) ? this.settings.extractConceptsProvider : this.settings.activeProvider;
        this.settings.extractOriginalTextProvider = this.settings.providers.some(p => p.name === this.settings.extractOriginalTextProvider) ? this.settings.extractOriginalTextProvider : this.settings.activeProvider;

        // Merge availableLanguages to ensure new languages are added for existing users
        const defaultLanguages = DEFAULT_SETTINGS.availableLanguages;
        const savedLanguages = this.settings.availableLanguages || [];
        const savedLanguageCodes = new Set(savedLanguages.map(l => l.code));
        const mergedLanguages = [...savedLanguages];

        defaultLanguages.forEach(defaultLang => {
            if (!savedLanguageCodes.has(defaultLang.code)) {
                mergedLanguages.push(defaultLang);
            }
        });

        this.settings.availableLanguages = mergedLanguages;
    }

    async saveSettings() {
        // Separate local-only providers from syncable ones
        const localProviders = this.settings.providers.filter(p => p.localOnly);
        const syncProviders = this.settings.providers.filter(p => !p.localOnly);

        // Store local-only providers in localStorage
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('notemd-local-providers', JSON.stringify(localProviders));
            } catch {
                // localStorage may be full or unavailable
            }
        }

        // Save only syncable providers to data.json
        const syncSettings = { ...this.settings, providers: syncProviders };
        await this.saveData(syncSettings);
        await this.saveData(this.settings);
    }

    async resetSettings(mode: 'complete' | 'partial'): Promise<void> {
        const nextSettings = mode === 'complete'
            ? createCompleteResetSettings()
            : createPartialResetSettings(this.settings);
        this.settings = nextSettings;
        this.clearConceptNotePathWarningSuppressionOnce();
        await this.saveSettings();
    }

    // --- UI and Status ---
    updateStatusBar(text: string) {
        if (this.statusBarItem) {
            this.statusBarItem.setText(`Notemd: ${text}`);
        }
    }

    private getActionLabel(actionId: SidebarActionId): string {
        return getSidebarActionLabel(this.getUiStrings(), actionId);
    }

    private getRunningActionText(label: string): string {
        return formatI18n(this.getUiStrings().sidebar.status.runningAction, { label });
    }

    private getActionCompleteText(label: string): string {
        return formatI18n(this.getUiStrings().sidebar.status.actionComplete, { label });
    }

    private getActionFailedText(message: string): string {
        return formatI18n(this.getUiStrings().sidebar.status.actionFailed, { message });
    }

    private getStepStatusText(current: number, total: number, label: string): string {
        return formatI18n(this.getUiStrings().sidebar.status.stepLabel, { current, total, label });
    }

    private startReporterAction(reporter: ProgressReporter, label: string): void {
        const statusText = this.getRunningActionText(label);
        const maybeSidebar = reporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing(statusText);
        } else {
            reporter.clearDisplay();
            reporter.updateStatus(statusText, 0);
        }
        this.updateStatusBar(statusText);
    }

    private failReporterAction(reporter: ProgressReporter, message: string): string {
        const statusText = this.getActionFailedText(message);
        reporter.updateStatus(statusText, -1);
        this.updateStatusBar(statusText);
        return statusText;
    }

    async refreshLocalizedUi(): Promise<void> {
        const uiStrings = this.getUiStrings();

        if (this.ribbonIconEl) {
            this.ribbonIconEl.setAttribute('aria-label', uiStrings.plugin.ribbonTooltip);
            this.ribbonIconEl.setAttribute('title', uiStrings.plugin.ribbonTooltip);
        }

        if (!this.isBusy) {
            this.updateStatusBar(uiStrings.common.ready);
        }

        if (this.isBusy) {
            return;
        }

        const leaves = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE);
        for (const leaf of leaves) {
            if (leaf.view instanceof NotemdSidebarView) {
                await leaf.view.onOpen();
            }
        }
    }

    async activateView() {
        const existingLeaves = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE);
        if (existingLeaves.length > 0) {
            this.app.workspace.revealLeaf(existingLeaves[0]);
            return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: NOTEMD_SIDEBAR_VIEW_TYPE, active: true });
            this.app.workspace.revealLeaf(leaf);
        } else {
            console.error("Could not get right sidebar leaf.");
            new Notice(this.getUiStrings().notices.couldNotOpenSidebar);
        }
    }

    /** Helper to get a progress reporter (Sidebar or new Modal) */
    getReporter(): ProgressReporter {
        const view = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE)[0]?.view;
        if (view instanceof NotemdSidebarView) {
            this.app.workspace.revealLeaf(view.leaf); // Ensure sidebar is visible
            view.clearDisplay(); // Clear previous logs/status in sidebar
            return view;
        } else {
            const modal = new ProgressModal(this.app, this.settings.uiLocale);
            modal.open();
            return modal;
        }
    }

    async getSidebarReporter(): Promise<ProgressReporter> {
        await this.activateView();
        const view = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE)[0]?.view;
        if (view instanceof NotemdSidebarView) {
            this.app.workspace.revealLeaf(view.leaf);
            view.clearDisplay();
            return view;
        }
        return this.getReporter();
    }

    /** Helper to show folder selection modal */
    private getFolderPickerOptions(): string[] {
        const folders = this.app.vault.getAllLoadedFiles()
            .filter((f): f is TFolder => f instanceof TFolder)
            .map(f => f.path);
        folders.unshift('/');
        return folders;
    }

    async getFolderSelection(): Promise<string | null> {
        const folders = this.getFolderPickerOptions();

        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            const i18n = this.getUiStrings();
            modal.titleEl.setText(i18n.folderPicker.title);
            const selectEl = modal.contentEl.createEl('select');
            folders.forEach(folder => selectEl.createEl('option', { text: folder === '/' ? i18n.folderPicker.vaultRoot : folder, value: folder }));
            const btnContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
            btnContainer.createEl('button', { text: i18n.folderPicker.selectAction, cls: 'mod-cta' }).onclick = () => { modal.close(); resolve(selectEl.value); };
            btnContainer.createEl('button', { text: i18n.common.cancel }).onclick = () => { modal.close(); resolve(null); };
            modal.open();
        });
    }

    async getFolderTaskSelection(
        taskKind: FolderTaskKind,
        initialOverride?: FolderTaskFileSelectionOverride
    ): Promise<FolderTaskInteractiveSelection | null> {
        if (!isAdvancedFolderTaskFileSelectionEnabled(this.settings)) {
            const folderPath = await this.getFolderSelection();
            return folderPath ? { folderPath } : null;
        }

        const profiles = getFolderTaskFileSelectionProfiles(this.settings);
        const folders = this.getFolderPickerOptions();
        const i18n = this.getUiStrings();
        const currentDefaultsValue = '__current_defaults__';
        const initialProfile = resolveFolderTaskFileSelectionProfile(this.settings, initialOverride);
        const currentDefaultsProfile = createCurrentFolderTaskFileSelectionProfile(
            this.settings,
            i18n.folderPicker.selectionProfileCurrentDefaults
        );
        const currentDefaultOverride = initialOverride
            ? {
                ...initialOverride,
                profileId: undefined,
                profileName: undefined
            }
            : undefined;
        const hasFolder = (folderPath: string): boolean => folders.includes(folderPath);
        const defaultFolderValue = resolveExistingFolderTaskFolderPath(
            folders,
            initialProfile?.folderPathHint || '/'
        ) || '/';
        const formatFolderDisplay = (folderPath: string): string => folderPath === '/' ? i18n.folderPicker.vaultRoot : folderPath;
        const resolveCurrentFolderInput = (rawValue: string): string | null =>
            resolveExistingFolderTaskFolderPath(folders, rawValue);
        const resolveSelectedProfile = (selectedProfileId: string): typeof initialProfile =>
            selectedProfileId === currentDefaultsValue
                ? null
                : (profiles.find(item => item.id === selectedProfileId) || null);
        const createDraftRuleOverride = (selectedProfileId: string): FolderTaskFileSelectionOverride => {
            const baseOverride = selectedProfileId === currentDefaultsValue
                ? currentDefaultOverride
                : { profileId: selectedProfileId };
            const effectiveSettings = applyFolderTaskSelectionOverride(this.settings, baseOverride);
            return {
                includeSubfoldersMode: effectiveSettings.folderTaskIncludeSubfoldersMode,
                fileFilterMode: effectiveSettings.folderTaskFileFilterMode,
                fileFilterPattern: effectiveSettings.folderTaskFileFilterPattern,
                fileFilterTarget: effectiveSettings.folderTaskFileFilterTarget,
                fileFilterCaseSensitive: effectiveSettings.folderTaskFileFilterCaseSensitive,
                fileFilterInvert: effectiveSettings.folderTaskFileFilterInvert
            };
        };
        const buildEffectiveSelectionOverride = (
            selectedProfileId: string,
            draftRuleOverride?: FolderTaskFileSelectionOverride,
            useRuleOverride = false
        ): FolderTaskFileSelectionOverride | undefined => {
            const baseOverride = selectedProfileId === currentDefaultsValue
                ? currentDefaultOverride
                : { profileId: selectedProfileId };
            if (!useRuleOverride || !draftRuleOverride) {
                return baseOverride;
            }
            return mergeFolderTaskSelectionOverrides(baseOverride, draftRuleOverride);
        };
        const allFiles = this.app.vault.getFiles();
        const resolvePreviewFiles = (
            folderPath: string,
            effectiveSettings: NotemdSettings
        ): TFile[] => {
            if (taskKind === 'batch-generate-from-titles') {
                const folder = this.app.vault.getFolderByPath(folderPath);
                const baseFolderName = folderPath === '/' ? 'Vault' : (folder?.name || folderPath.split('/').pop() || 'Vault');
                const completeFolderName = effectiveSettings.useCustomGenerateTitleOutputFolder
                    ? (effectiveSettings.generateTitleOutputFolderName || DEFAULT_SETTINGS.generateTitleOutputFolderName)
                    : `${baseFolderName}_complete`;
                const parentPath = folder?.parent?.path === '/'
                    ? ''
                    : (folder?.parent?.path ? `${folder.parent.path}/` : '');
                const completeFolderPath = `${parentPath}${completeFolderName}`;
                const normalizedCompletePath = completeFolderPath === ''
                    ? ''
                    : (completeFolderPath.endsWith('/') ? completeFolderPath : `${completeFolderPath}/`);

                return selectFolderTaskFiles({
                    taskKind,
                    folderPath,
                    files: this.app.vault.getMarkdownFiles(),
                    allowedExtensions: ['md'],
                    settings: effectiveSettings,
                    exclude: (file) => {
                        const isInCompleteFolder = normalizedCompletePath ? file.path.startsWith(normalizedCompletePath) : false;
                        return isInCompleteFolder || file.name.endsWith('_processed.md');
                    }
                });
            }

            if (taskKind === 'batch-mermaid-fix' || taskKind === 'batch-translate-folder') {
                return selectFolderTaskFiles({
                    taskKind,
                    folderPath,
                    files: taskKind === 'batch-mermaid-fix' ? this.app.vault.getMarkdownFiles() : allFiles,
                    allowedExtensions: taskKind === 'batch-translate-folder'
                        ? this.getAllowedTaskInputExtensions('batch-translate-folder')
                        : ['md'],
                    settings: effectiveSettings
                });
            }

            return selectFolderTaskFiles({
                taskKind,
                folderPath,
                files: allFiles,
                allowedExtensions: taskKind === 'extract-concepts-folder'
                    ? this.getAllowedTaskInputExtensions('extract-concepts-folder')
                    : ['md', 'txt'],
                settings: effectiveSettings
            });
        };
        const resolveProfilePreview = (
            selectedProfileId: string,
            effectiveFolderPath: string | null,
            rawFolderInputValue: string,
            folderOverrideEnabled: boolean,
            ruleOverrideEnabled: boolean,
            draftRuleOverride?: FolderTaskFileSelectionOverride
        ) => {
            const selectedSavedProfile = resolveSelectedProfile(selectedProfileId);
            const previewSelectionOverride = buildEffectiveSelectionOverride(
                selectedProfileId,
                draftRuleOverride,
                ruleOverrideEnabled
            );
            const previewSettings = applyFolderTaskSelectionOverride(this.settings, previewSelectionOverride);
            const configuredFolderHint = selectedSavedProfile?.folderPathHint.trim() || '';
            const resolvedConfiguredFolderHint = configuredFolderHint
                ? resolveExistingFolderTaskFolderPath(folders, configuredFolderHint)
                : null;
            const configuredFolderLooksLikePattern = !resolvedConfiguredFolderHint
                && looksLikeFolderTaskPatternPath(configuredFolderHint);
            const normalizedRawFolderInput = (rawFolderInputValue || '').trim();
            const rawPreviewFolderValue = normalizedRawFolderInput.length > 0 ? normalizedRawFolderInput : '/';
            const previewRunFolder = effectiveFolderPath
                ? formatFolderDisplay(effectiveFolderPath)
                : formatI18n(i18n.folderPicker.selectionProfilePreviewMissingFolder, {
                    path: rawPreviewFolderValue
                });

            return {
                profileName: selectedSavedProfile?.name || currentDefaultsProfile.name,
                savedFolder: configuredFolderHint
                    ? (resolvedConfiguredFolderHint
                        ? formatFolderDisplay(resolvedConfiguredFolderHint)
                        : configuredFolderLooksLikePattern
                            ? formatI18n(i18n.folderPicker.selectionProfilePreviewPatternLikeFolder, {
                                path: configuredFolderHint
                            })
                        : formatI18n(i18n.folderPicker.selectionProfilePreviewMissingFolder, {
                            path: configuredFolderHint
                        }))
                    : i18n.folderPicker.selectionProfilePreviewNotSet,
                runFolder: previewRunFolder,
                filterMode: previewSettings.folderTaskFileFilterMode === 'none'
                    ? i18n.settings.folderTaskFilter.modeNone
                    : previewSettings.folderTaskFileFilterMode === 'contains'
                        ? i18n.settings.folderTaskFilter.modeContains
                        : previewSettings.folderTaskFileFilterMode === 'regex'
                            ? i18n.settings.folderTaskFilter.modeRegex
                            : i18n.settings.folderTaskFilter.modeGlob,
                pattern: previewSettings.folderTaskFileFilterPattern.trim() || i18n.folderPicker.selectionProfilePreviewNotSet,
                matchTarget: previewSettings.folderTaskFileFilterTarget === 'basename'
                    ? i18n.settings.folderTaskFilter.targetBasename
                    : i18n.settings.folderTaskFilter.targetRelativePath,
                subfolderScope: previewSettings.folderTaskIncludeSubfoldersMode === 'include'
                    ? i18n.settings.folderTaskFilter.includeSubfoldersInclude
                    : previewSettings.folderTaskIncludeSubfoldersMode === 'exclude'
                        ? i18n.settings.folderTaskFilter.includeSubfoldersExclude
                        : i18n.settings.folderTaskFilter.includeSubfoldersLegacy,
                caseSensitive: previewSettings.folderTaskFileFilterCaseSensitive
                    ? i18n.common.enabled
                    : i18n.common.disabled,
                invert: previewSettings.folderTaskFileFilterInvert
                    ? i18n.common.enabled
                    : i18n.common.disabled,
                pathMode: folderOverrideEnabled
                    ? i18n.folderPicker.selectionProfilePreviewPathModeOverride
                    : resolvedConfiguredFolderHint
                        ? i18n.folderPicker.selectionProfilePreviewPathModeSaved
                        : i18n.folderPicker.selectionProfilePreviewPathModeManual,
                filterSource: ruleOverrideEnabled
                    ? i18n.folderPicker.selectionProfilePreviewFilterSourceOverride
                    : i18n.folderPicker.selectionProfilePreviewFilterSourceSaved
            };
        };
        const presetChipDefs: Array<{ id: FolderTaskSelectionPresetId; label: string }> = [
            { id: 'contains-index-family', label: i18n.folderPicker.selectionProfilePresetContainsIndex },
            { id: 'regex-index-variants', label: i18n.folderPicker.selectionProfilePresetRegexIndex },
            { id: 'glob-index-family', label: i18n.folderPicker.selectionProfilePresetGlobIndex },
            { id: 'glob-index-cross-folder', label: i18n.folderPicker.selectionProfilePresetCrossFolderIndex }
        ];

        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.modalEl.addClass('notemd-folder-task-selection-shell');
            modal.contentEl.addClass('notemd-folder-task-selection-modal');
            let settled = false;
            let allowTemporaryProfileFolderOverride = false;
            let allowTemporaryRuleOverride = false;
            let selectedFolderValue = defaultFolderValue;
            let draftRuleOverride = createDraftRuleOverride(initialProfile?.id || currentDefaultsValue);
            let activePresetChipId: FolderTaskSelectionPresetId | null = null;

            const finish = (value: FolderTaskInteractiveSelection | null) => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve(value);
            };

            modal.titleEl.setText(i18n.folderPicker.selectionProfileTitle);
            modal.contentEl.createEl('p', {
                text: i18n.folderPicker.selectionProfileDesc,
                cls: 'setting-item-description notemd-folder-task-selection-intro'
            });

            const layoutEl = modal.contentEl.createDiv({ cls: 'notemd-folder-task-selection-layout' });
            const formEl = layoutEl.createDiv({ cls: 'notemd-folder-task-selection-main' });
            const previewEl = layoutEl.createDiv({ cls: 'notemd-folder-task-selection-preview' });

            let profileSelect: HTMLSelectElement | null = null;
            if (profiles.length > 0) {
                const profileFieldEl = formEl.createDiv({ cls: 'notemd-folder-task-selection-field' });
                profileFieldEl.createEl('label', {
                    text: i18n.folderPicker.selectionProfileLabel,
                    cls: 'notemd-folder-task-selection-label'
                });
                profileSelect = profileFieldEl.createEl('select', {
                    cls: 'notemd-folder-task-selection-select'
                });
                profileSelect.createEl('option', {
                    text: i18n.folderPicker.selectionProfileCurrentDefaults,
                    value: currentDefaultsValue
                });
                profiles.forEach(profile => {
                    profileSelect!.createEl('option', { text: profile.name, value: profile.id });
                });
                profileSelect.value = initialProfile?.id || currentDefaultsValue;
            } else {
                formEl.createEl('div', {
                    text: i18n.folderPicker.selectionProfileNoSavedProfiles,
                    cls: 'setting-item-description notemd-folder-task-selection-empty'
                });
            }

            const folderFieldEl = formEl.createDiv({ cls: 'notemd-folder-task-selection-field' });
            folderFieldEl.createEl('label', {
                text: i18n.folderPicker.folderLabel,
                cls: 'notemd-folder-task-selection-label'
            });
            const folderInput = folderFieldEl.createEl('input', {
                type: 'text',
                cls: 'notemd-folder-task-selection-input'
            });
            folderInput.value = defaultFolderValue;
            folderInput.placeholder = i18n.folderPicker.selectionProfileFolderInputPlaceholder;
            const datalistId = `notemd-folder-picker-${Date.now()}`;
            folderInput.setAttr('list', datalistId);
            const folderSuggestions = folderFieldEl.createEl('datalist');
            folderSuggestions.id = datalistId;
            folders.forEach(folder => {
                const optionEl = folderSuggestions.createEl('option');
                optionEl.value = folder;
                if (folder === '/') {
                    optionEl.label = i18n.folderPicker.vaultRoot;
                }
            });
            folderFieldEl.createEl('div', {
                text: i18n.folderPicker.selectionProfileFolderInputDesc,
                cls: 'setting-item-description notemd-folder-task-selection-hint'
            });
            const folderValidationEl = folderFieldEl.createEl('div', {
                cls: 'notemd-folder-task-selection-validation'
            });

            const exampleEl = formEl.createDiv({ cls: 'notemd-folder-task-selection-examples' });
            exampleEl.createEl('div', {
                text: i18n.folderPicker.selectionProfileExamplesHeading,
                cls: 'notemd-folder-task-selection-examples-heading'
            });
            exampleEl.createEl('div', {
                text: i18n.folderPicker.selectionProfilePresetHint,
                cls: 'setting-item-description notemd-folder-task-selection-hint'
            });
            const presetChipsEl = exampleEl.createDiv({ cls: 'notemd-folder-task-selection-chip-row' });
            const presetChipButtons = presetChipDefs.map(({ id, label }) => {
                const chipEl = presetChipsEl.createEl('button', {
                    text: label,
                    cls: 'notemd-folder-task-selection-chip'
                });
                chipEl.type = 'button';
                return {
                    id,
                    element: chipEl
                };
            });
            const exampleListEl = exampleEl.createEl('ul', {
                cls: 'notemd-folder-task-selection-examples-list'
            });
            [
                i18n.folderPicker.selectionProfileExamplesFolderRule,
                i18n.folderPicker.selectionProfileExamplesContains,
                i18n.folderPicker.selectionProfileExamplesRegex,
                i18n.folderPicker.selectionProfileExamplesGlob,
                i18n.folderPicker.selectionProfileExamplesCrossFolder,
                i18n.folderPicker.selectionProfileExamplesSettingsHint
            ].forEach(exampleText => {
                exampleListEl.createEl('li', {
                    text: exampleText,
                    cls: 'notemd-folder-task-selection-examples-item'
                });
            });

            const temporaryFolderOverrideContainer = formEl.createDiv({
                cls: 'notemd-folder-task-selection-toggle'
            });
            const temporaryFolderOverrideToggleLabel = temporaryFolderOverrideContainer.createEl('label', {
                cls: 'notemd-folder-task-selection-toggle-label'
            });
            const temporaryFolderOverrideToggle = temporaryFolderOverrideToggleLabel.createEl('input', {
                type: 'checkbox'
            });
            temporaryFolderOverrideToggleLabel.appendText(` ${i18n.folderPicker.selectionProfileTemporaryFolderOverride}`);
            temporaryFolderOverrideContainer.createEl('div', {
                text: i18n.folderPicker.selectionProfileTemporaryFolderOverrideDesc,
                cls: 'setting-item-description notemd-folder-task-selection-hint'
            });

            const temporaryRuleOverrideContainer = formEl.createDiv({
                cls: 'notemd-folder-task-selection-toggle'
            });
            const temporaryRuleOverrideToggleLabel = temporaryRuleOverrideContainer.createEl('label', {
                cls: 'notemd-folder-task-selection-toggle-label'
            });
            const temporaryRuleOverrideToggle = temporaryRuleOverrideToggleLabel.createEl('input', {
                type: 'checkbox'
            });
            temporaryRuleOverrideToggleLabel.appendText(` ${i18n.folderPicker.selectionProfileTemporaryRuleOverride}`);
            temporaryRuleOverrideContainer.createEl('div', {
                text: i18n.folderPicker.selectionProfileTemporaryRuleOverrideDesc,
                cls: 'setting-item-description notemd-folder-task-selection-hint'
            });
            const ruleOverrideGridEl = temporaryRuleOverrideContainer.createDiv({
                cls: 'notemd-folder-task-selection-override-grid'
            });
            const createRuleOverrideField = (label: string) => {
                const fieldEl = ruleOverrideGridEl.createDiv({
                    cls: 'notemd-folder-task-selection-field notemd-folder-task-selection-field-compact'
                });
                fieldEl.createEl('label', {
                    text: label,
                    cls: 'notemd-folder-task-selection-label'
                });
                return fieldEl;
            };

            const ruleModeFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.modeName);
            const ruleModeSelect = ruleModeFieldEl.createEl('select', {
                cls: 'notemd-folder-task-selection-select'
            });
            [
                { value: 'none', label: i18n.settings.folderTaskFilter.modeNone },
                { value: 'contains', label: i18n.settings.folderTaskFilter.modeContains },
                { value: 'regex', label: i18n.settings.folderTaskFilter.modeRegex },
                { value: 'glob', label: i18n.settings.folderTaskFilter.modeGlob }
            ].forEach(option => {
                ruleModeSelect.createEl('option', {
                    value: option.value,
                    text: option.label
                });
            });

            const rulePatternFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.patternName);
            const rulePatternInput = rulePatternFieldEl.createEl('input', {
                type: 'text',
                cls: 'notemd-folder-task-selection-input'
            });
            rulePatternInput.placeholder = i18n.settings.folderTaskFilter.patternPlaceholder;

            const ruleTargetFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.targetName);
            const ruleTargetSelect = ruleTargetFieldEl.createEl('select', {
                cls: 'notemd-folder-task-selection-select'
            });
            [
                { value: 'relativePath', label: i18n.settings.folderTaskFilter.targetRelativePath },
                { value: 'basename', label: i18n.settings.folderTaskFilter.targetBasename }
            ].forEach(option => {
                ruleTargetSelect.createEl('option', {
                    value: option.value,
                    text: option.label
                });
            });

            const ruleSubfoldersFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.includeSubfoldersName);
            const ruleSubfoldersSelect = ruleSubfoldersFieldEl.createEl('select', {
                cls: 'notemd-folder-task-selection-select'
            });
            [
                { value: 'legacy', label: i18n.settings.folderTaskFilter.includeSubfoldersLegacy },
                { value: 'include', label: i18n.settings.folderTaskFilter.includeSubfoldersInclude },
                { value: 'exclude', label: i18n.settings.folderTaskFilter.includeSubfoldersExclude }
            ].forEach(option => {
                ruleSubfoldersSelect.createEl('option', {
                    value: option.value,
                    text: option.label
                });
            });

            const ruleCaseSensitiveFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.caseSensitiveName);
            const ruleCaseSensitiveToggleLabel = ruleCaseSensitiveFieldEl.createEl('label', {
                cls: 'notemd-folder-task-selection-toggle-label'
            });
            const ruleCaseSensitiveToggle = ruleCaseSensitiveToggleLabel.createEl('input', {
                type: 'checkbox'
            });
            ruleCaseSensitiveToggleLabel.appendText(` ${i18n.settings.folderTaskFilter.caseSensitiveDesc}`);

            const ruleInvertFieldEl = createRuleOverrideField(i18n.settings.folderTaskFilter.invertName);
            const ruleInvertToggleLabel = ruleInvertFieldEl.createEl('label', {
                cls: 'notemd-folder-task-selection-toggle-label'
            });
            const ruleInvertToggle = ruleInvertToggleLabel.createEl('input', {
                type: 'checkbox'
            });
            ruleInvertToggleLabel.appendText(` ${i18n.settings.folderTaskFilter.invertDesc}`);

            const ruleValidationEl = temporaryRuleOverrideContainer.createEl('div', {
                cls: 'notemd-folder-task-selection-validation'
            });

            previewEl.createEl('h3', {
                text: i18n.folderPicker.selectionProfilePreviewHeading,
                cls: 'notemd-folder-task-selection-preview-heading'
            });
            const previewRowsEl = previewEl.createDiv({ cls: 'notemd-folder-task-selection-preview-rows' });
            const createPreviewRow = (label: string) => {
                const rowEl = previewRowsEl.createDiv({ cls: 'notemd-folder-task-selection-preview-row' });
                rowEl.createEl('div', {
                    text: label,
                    cls: 'notemd-folder-task-selection-preview-label'
                });
                return rowEl.createEl('div', {
                    cls: 'notemd-folder-task-selection-preview-value'
                });
            };
            const previewConfigValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewConfigLabel);
            const previewPathModeValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewPathModeLabel);
            const previewSavedFolderValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewSavedFolderLabel);
            const previewRunFolderValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewRunFolderLabel);
            const previewFilterSourceValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewFilterSourceLabel);
            const previewFilterModeValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewFilterModeLabel);
            const previewPatternValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewPatternLabel);
            const previewTargetValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewTargetLabel);
            const previewSubfoldersValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewSubfoldersLabel);
            const previewCaseSensitiveValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewCaseSensitiveLabel);
            const previewInvertValueEl = createPreviewRow(i18n.folderPicker.selectionProfilePreviewInvertLabel);

            const selectedFilesEl = formEl.createDiv({ cls: 'notemd-folder-task-selection-file-list' });
            const selectedFilesHeadingEl = selectedFilesEl.createEl('div', {
                cls: 'notemd-folder-task-selection-file-list-heading'
            });
            const selectedFilesListEl = selectedFilesEl.createEl('div', {
                cls: 'notemd-folder-task-selection-file-list-scroll'
            });
            const selectedFilesHintEl = selectedFilesEl.createEl('div', {
                cls: 'setting-item-description notemd-folder-task-selection-file-list-hint'
            });

            const renderSelectedFiles = (
                resolvedRunFolder: string | null,
                effectiveSettings: NotemdSettings,
                validationMessage: string | null
            ) => {
                if (!resolvedRunFolder || validationMessage) {
                    selectedFilesHeadingEl.setText(i18n.folderPicker.selectionProfileSelectedFilesHeading);
                    selectedFilesHintEl.setText(validationMessage || i18n.folderPicker.selectionProfileSelectedFilesInvalidFolderHint);
                    selectedFilesListEl.replaceChildren(selectedFilesListEl.createEl('div', {
                        text: i18n.folderPicker.selectionProfileSelectedFilesNone,
                        cls: 'notemd-folder-task-selection-file-list-empty'
                    }));
                    return;
                }

                let selectedFiles: TFile[];
                try {
                    selectedFiles = resolvePreviewFiles(resolvedRunFolder, effectiveSettings);
                } catch (error: unknown) {
                    const previewErrorMessage = error instanceof Error && error.message
                        ? error.message
                        : i18n.common.unknownError;
                    selectedFilesHeadingEl.setText(i18n.folderPicker.selectionProfileSelectedFilesHeading);
                    selectedFilesHintEl.setText(previewErrorMessage);
                    selectedFilesListEl.replaceChildren(selectedFilesListEl.createEl('div', {
                        text: i18n.folderPicker.selectionProfileSelectedFilesNone,
                        cls: 'notemd-folder-task-selection-file-list-empty'
                    }));
                    return;
                }

                selectedFilesHeadingEl.setText(formatI18n(i18n.folderPicker.selectionProfileSelectedFilesHeadingWithCount, {
                    count: selectedFiles.length
                }));
                selectedFilesHintEl.setText(formatI18n(i18n.folderPicker.selectionProfileSelectedFilesHint, {
                    folder: formatFolderDisplay(resolvedRunFolder)
                }));
                selectedFilesListEl.replaceChildren();

                if (selectedFiles.length === 0) {
                    selectedFilesListEl.createEl('div', {
                        text: i18n.folderPicker.selectionProfileSelectedFilesNone,
                        cls: 'notemd-folder-task-selection-file-list-empty'
                    });
                    return;
                }

                const fileListFragment = document.createDocumentFragment();
                selectedFiles.forEach(file => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'notemd-folder-task-selection-file-list-item';
                    itemEl.textContent = file.path;
                    fileListFragment.appendChild(itemEl);
                });
                selectedFilesListEl.appendChild(fileListFragment);
            };

            const syncRuleOverrideInputsFromDraft = () => {
                ruleModeSelect.value = draftRuleOverride.fileFilterMode || 'none';
                rulePatternInput.value = draftRuleOverride.fileFilterPattern || '';
                ruleTargetSelect.value = draftRuleOverride.fileFilterTarget || 'relativePath';
                ruleSubfoldersSelect.value = draftRuleOverride.includeSubfoldersMode || 'legacy';
                ruleCaseSensitiveToggle.checked = Boolean(draftRuleOverride.fileFilterCaseSensitive);
                ruleInvertToggle.checked = Boolean(draftRuleOverride.fileFilterInvert);
            };

            const updatePresetChipState = () => {
                presetChipButtons.forEach(({ id, element }) => {
                    const isActive = id === activePresetChipId && allowTemporaryRuleOverride;
                    element.toggleClass('is-active', isActive);
                    element.setAttr('aria-pressed', isActive ? 'true' : 'false');
                });
            };

            const syncFolderPickerState = () => {
                const selectedProfileId = profileSelect?.value || currentDefaultsValue;
                const selectedProfile = resolveSelectedProfile(selectedProfileId);
                const folderState = resolveFolderTaskProfileFolderSelectionUiState({
                    availableFolders: folders,
                    selectedProfile,
                    currentFolderPath: selectedFolderValue,
                    allowTemporaryFolderOverride: allowTemporaryProfileFolderOverride,
                    fallbackFolderPath: defaultFolderValue
                });

                allowTemporaryProfileFolderOverride = folderState.allowTemporaryFolderOverride;
                folderInput.disabled = folderState.folderSelectionDisabled;
                folderInput.value = folderState.folderPath;
                selectedFolderValue = folderState.folderPath;
                temporaryFolderOverrideContainer.style.display = folderState.hasProfileFolderHint ? '' : 'none';
                temporaryFolderOverrideToggle.checked = folderState.allowTemporaryFolderOverride;
                temporaryFolderOverrideToggle.disabled = !folderState.hasProfileFolderHint;

                const resolvedRunFolder = resolveCurrentFolderInput(folderInput.value);
                const previewSelectionOverride = buildEffectiveSelectionOverride(
                    selectedProfileId,
                    draftRuleOverride,
                    allowTemporaryRuleOverride
                );
                const effectiveSettings = applyFolderTaskSelectionOverride(this.settings, previewSelectionOverride);
                const regexValidationMessage = effectiveSettings.folderTaskFileFilterMode === 'regex'
                    ? getFolderTaskRegexValidationError(
                        effectiveSettings.folderTaskFileFilterPattern,
                        effectiveSettings.folderTaskFileFilterCaseSensitive
                    )
                    : null;
                const preview = resolveProfilePreview(
                    selectedProfileId,
                    resolvedRunFolder,
                    folderInput.value,
                    folderState.allowTemporaryFolderOverride,
                    allowTemporaryRuleOverride,
                    draftRuleOverride
                );
                syncRuleOverrideInputsFromDraft();
                [
                    ruleModeSelect,
                    rulePatternInput,
                    ruleTargetSelect,
                    ruleSubfoldersSelect,
                    ruleCaseSensitiveToggle,
                    ruleInvertToggle
                ].forEach(control => {
                    control.disabled = !allowTemporaryRuleOverride;
                });
                temporaryRuleOverrideToggle.checked = allowTemporaryRuleOverride;
                ruleValidationEl.setText(regexValidationMessage
                    ? formatI18n(i18n.settings.folderTaskFilter.invalidRegexNotice, {
                        message: regexValidationMessage
                    })
                    : '');
                updatePresetChipState();
                previewConfigValueEl.setText(preview.profileName);
                previewPathModeValueEl.setText(preview.pathMode);
                previewSavedFolderValueEl.setText(preview.savedFolder);
                previewRunFolderValueEl.setText(preview.runFolder);
                previewFilterSourceValueEl.setText(preview.filterSource);
                previewFilterModeValueEl.setText(preview.filterMode);
                previewPatternValueEl.setText(preview.pattern);
                previewTargetValueEl.setText(preview.matchTarget);
                previewSubfoldersValueEl.setText(preview.subfolderScope);
                previewCaseSensitiveValueEl.setText(preview.caseSensitive);
                previewInvertValueEl.setText(preview.invert);
                renderSelectedFiles(resolvedRunFolder, effectiveSettings, regexValidationMessage);

                if (!folderInput.disabled && !resolvedRunFolder) {
                    folderValidationEl.setText(formatI18n(i18n.folderPicker.selectionProfileFolderInvalid, {
                        path: folderInput.value.trim() || '/'
                    }));
                } else {
                    folderValidationEl.setText('');
                }
            };

            profileSelect?.addEventListener('change', () => {
                const selectedProfileId = profileSelect?.value || currentDefaultsValue;
                const selectedProfile = resolveSelectedProfile(selectedProfileId);
                allowTemporaryProfileFolderOverride = false;
                allowTemporaryRuleOverride = false;
                activePresetChipId = null;
                draftRuleOverride = createDraftRuleOverride(selectedProfileId);
                selectedFolderValue = resolveExistingFolderTaskFolderPath(
                    folders,
                    selectedProfile?.folderPathHint || folderInput.value
                ) || '/';
                syncFolderPickerState();
            });
            folderInput.addEventListener('input', () => {
                const resolvedFolder = resolveCurrentFolderInput(folderInput.value);
                if (resolvedFolder) {
                    selectedFolderValue = resolvedFolder;
                }
                syncFolderPickerState();
            });
            temporaryFolderOverrideToggle.addEventListener('change', () => {
                allowTemporaryProfileFolderOverride = temporaryFolderOverrideToggle.checked;
                if (!allowTemporaryProfileFolderOverride) {
                    const selectedProfileId = profileSelect?.value || currentDefaultsValue;
                    const selectedProfile = resolveSelectedProfile(selectedProfileId);
                    if (selectedProfile?.folderPathHint && hasFolder(selectedProfile.folderPathHint)) {
                        selectedFolderValue = selectedProfile.folderPathHint;
                    }
                }
                syncFolderPickerState();
            });
            temporaryRuleOverrideToggle.addEventListener('change', () => {
                allowTemporaryRuleOverride = temporaryRuleOverrideToggle.checked;
                if (!allowTemporaryRuleOverride) {
                    activePresetChipId = null;
                }
                syncFolderPickerState();
            });
            presetChipButtons.forEach(({ id, element }) => {
                element.addEventListener('click', () => {
                    allowTemporaryRuleOverride = true;
                    activePresetChipId = id;
                    draftRuleOverride = createFolderTaskSelectionPresetOverride(id);
                    syncFolderPickerState();
                });
            });
            ruleModeSelect.addEventListener('change', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    fileFilterMode: ruleModeSelect.value as FolderTaskFileSelectionOverride['fileFilterMode']
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            rulePatternInput.addEventListener('input', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    fileFilterPattern: rulePatternInput.value
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            ruleTargetSelect.addEventListener('change', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    fileFilterTarget: ruleTargetSelect.value as FolderTaskFileSelectionOverride['fileFilterTarget']
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            ruleSubfoldersSelect.addEventListener('change', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    includeSubfoldersMode: ruleSubfoldersSelect.value as FolderTaskFileSelectionOverride['includeSubfoldersMode']
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            ruleCaseSensitiveToggle.addEventListener('change', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    fileFilterCaseSensitive: ruleCaseSensitiveToggle.checked
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            ruleInvertToggle.addEventListener('change', () => {
                draftRuleOverride = {
                    ...draftRuleOverride,
                    fileFilterInvert: ruleInvertToggle.checked
                };
                activePresetChipId = null;
                syncFolderPickerState();
            });
            syncFolderPickerState();

            const btnContainer = modal.contentEl.createDiv({
                cls: 'modal-button-container notemd-folder-task-selection-actions'
            });
            btnContainer.createEl('button', { text: i18n.folderPicker.selectAction, cls: 'mod-cta' }).onclick = () => {
                const selectedProfileId = profileSelect?.value || currentDefaultsValue;
                const resolvedFolderPath = resolveCurrentFolderInput(folderInput.value);
                const previewSelectionOverride = buildEffectiveSelectionOverride(
                    selectedProfileId,
                    draftRuleOverride,
                    allowTemporaryRuleOverride
                );
                const effectiveSettings = applyFolderTaskSelectionOverride(this.settings, previewSelectionOverride);
                const regexValidationMessage = effectiveSettings.folderTaskFileFilterMode === 'regex'
                    ? getFolderTaskRegexValidationError(
                        effectiveSettings.folderTaskFileFilterPattern,
                        effectiveSettings.folderTaskFileFilterCaseSensitive
                    )
                    : null;
                if (!resolvedFolderPath) {
                    folderValidationEl.setText(formatI18n(i18n.folderPicker.selectionProfileFolderInvalid, {
                        path: folderInput.value.trim() || '/'
                    }));
                    return;
                }
                if (regexValidationMessage) {
                    ruleValidationEl.setText(formatI18n(i18n.settings.folderTaskFilter.invalidRegexNotice, {
                        message: regexValidationMessage
                    }));
                    return;
                }
                modal.close();
                finish({
                    folderPath: resolvedFolderPath,
                    fileSelectionOverride: previewSelectionOverride
                });
            };
            btnContainer.createEl('button', { text: i18n.common.cancel }).onclick = () => {
                modal.close();
                finish(null);
            };

            modal.onClose = () => finish(null);
            modal.open();
        });
    }

    log(message: string) {
        // Simple console log for now. Could be expanded to log to a file.
        console.log(`[Notemd] ${message}`);
    }

	getProviderAndModelForTask(taskKey: 'addLinks' | 'research' | 'generateTitle' | 'translate' | 'summarizeToMermaid' | 'extractConcepts' | 'extractOriginalText'): { provider: LLMProviderConfig, modelName: string } {
		let providerName: string = this.settings.activeProvider;
		let modelName: string | undefined = undefined;

		if (this.settings.useMultiModelSettings) {
			switch (taskKey) {
				case 'addLinks':
					providerName = this.settings.addLinksProvider;
					modelName = this.settings.addLinksModel;
					break;
				case 'research':
					providerName = this.settings.researchProvider;
					modelName = this.settings.researchModel;
					break;
				case 'generateTitle':
					providerName = this.settings.generateTitleProvider;
					modelName = this.settings.generateTitleModel;
					break;
				case 'translate':
					providerName = this.settings.translateProvider;
					modelName = this.settings.translateModel;
					break;
				case 'summarizeToMermaid':
					providerName = this.settings.summarizeToMermaidProvider;
					modelName = this.settings.summarizeToMermaidModel;
					break;
                case 'extractConcepts':
                    providerName = this.settings.extractConceptsProvider;
                    modelName = this.settings.extractConceptsModel;
                    break;
                case 'extractOriginalText':
                    providerName = this.settings.extractOriginalTextProvider;
                    modelName = this.settings.extractOriginalTextModel;
                    break;
			}
		}

		const provider = this.settings.providers.find(p => p.name === providerName) || this.settings.providers.find(p => p.name === this.settings.activeProvider);
		if (!provider) {
			throw new Error("Could not find a valid LLM provider. Please check your settings.");
		}

		return { provider, modelName: modelName || provider.model };
	}

	getPromptForTask(taskKey: TaskKey, replacements: Record<string, string> = {}): string {
		const prompt = getSystemPrompt(this.settings, taskKey, replacements);
        if (this.settings.enableGlobalCustomPrompts &&
            ((taskKey === 'addLinks' && this.settings.useCustomPromptForAddLinks) ||
             (taskKey === 'generateTitle' && this.settings.useCustomPromptForGenerateTitle) ||
             (taskKey === 'researchSummarize' && this.settings.useCustomPromptForResearchSummarize) ||
             (taskKey === 'summarizeToMermaid' && this.settings.useCustomPromptForSummarizeToMermaid))) {
            this.log(`Using custom prompt for task: ${taskKey}`);
        } else if (this.settings.enableFocusedLearning && this.settings.focusedLearningDomain) {
            this.log(`Using focused learning domain for task: ${taskKey}`);
        } else {
		    this.log(`Using default prompt for task: ${taskKey}`);
        }
		return prompt;
	}

    private resolveCompleteFolderPath(sourceFolderPath: string): string | null {
        const folder = this.app.vault.getAbstractFileByPath(sourceFolderPath);
        if (!(folder instanceof TFolder)) {
            return null;
        }

        let completeFolderName: string;
        if (this.settings.useCustomGenerateTitleOutputFolder) {
            completeFolderName = this.settings.generateTitleOutputFolderName || DEFAULT_SETTINGS.generateTitleOutputFolderName;
        } else {
            const baseFolderName = sourceFolderPath === '/' ? 'Vault' : folder.name;
            completeFolderName = `${baseFolderName}_complete`;
        }

        const parentPath = folder.parent?.path === '/' ? '' : (folder.parent?.path ? folder.parent.path + '/' : '');
        return `${parentPath}${completeFolderName}`;
    }

    private async maybeAutoFixMermaidForFile(file: TFile, reporter: ProgressReporter, reason: string): Promise<void> {
        if (!this.settings.autoMermaidFixAfterGenerate || reporter.cancelled) {
            return;
        }
        reporter.log(`Running automatic Mermaid fix (${reason}) for: ${file.path}`);
        await fixMermaidSyntaxInFile(this.app, file, reporter);
    }

    private async maybeAutoFixMermaidForFolder(folderPath: string | null, reporter: ProgressReporter, reason: string): Promise<void> {
        if (!this.settings.autoMermaidFixAfterGenerate || reporter.cancelled || !folderPath) {
            return;
        }
        reporter.log(`Running automatic batch Mermaid fix (${reason}) for folder: ${folderPath}`);
        await batchFixMermaidSyntaxInFolder(this.app, this.settings, folderPath, reporter);
    }

    // --- Command Handler Methods ---
    // These methods contain the core logic initiated by commands or sidebar buttons.

    /** Command: Process Current File (Add Links) */
    async processWithNotemdCommand(reporter?: ProgressReporter): Promise<ProcessFileResult | null> {
        return runProcessWithNotemdCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    /** Command: Process Folder (Add Links) */

    private getBatchProgressStore(): BatchProgressStore {
        const vaultRoot = (this.app.vault.adapter as any).getBasePath?.() || (this.app.vault.adapter as any).basePath || '.';
        return new BatchProgressStore(vaultRoot);
    }

    async processFolderWithNotemdCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ): Promise<BatchProcessFolderResult | null> {
        if (!fileSelectionOverride) {
            return runProcessFolderWithNotemdCommandWithHost(
                this.createNoteProcessingCommandHost(),
                reporter,
                folderPathOverride
            );
        }
        return runProcessFolderWithNotemdCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride,
            undefined,
            fileSelectionOverride
        );
    }

    // Note: The simple 'Check Duplicates' command logic is now directly in onload()

    /** Command: Test LLM Connection */
    // This command handler now uses the reporter for UI feedback
    async testLlmConnectionCommand(reporter?: ProgressReporter) {
        return runInteractiveProviderConnectionTestCommandWithHost(
            this.createProviderConnectionTestCommandHost(),
            reporter
        );
    }

    async runDeveloperProviderDiagnosticCommand(): Promise<void> {
        const result = await runProviderDiagnosticCommandWithHost(this.createProviderDiagnosticCommandHost());
        new Notice(result.notice.message, result.notice.duration);
    }

    async runDeveloperProviderStabilityDiagnosticCommand(): Promise<void> {
        const result = await runProviderDiagnosticStabilityCommandWithHost(this.createProviderDiagnosticCommandHost());
        new Notice(result.notice.message, result.notice.duration);
    }

    async exportProviderProfilesCommand() {
        const result = await runExportProviderProfilesCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
        return result.kind === 'success' ? result.execution : null;
    }

    async exportRedactedProviderProfilesCommand() {
        const result = await runExportRedactedProviderProfilesCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
        return result.kind === 'success' ? result.execution : null;
    }

    async importProviderProfilesCommand(): Promise<void> {
        const result = await runImportProviderProfilesCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
    }

    async exportCliCapabilityManifestCommand() {
        const result = await runExportCliCapabilityManifestCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
        return result.execution;
    }

    async exportCliInvocationContractCommand() {
        const result = await runExportCliInvocationContractCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
        return result.execution;
    }

    async exportCliPublicSurfaceCommand() {
        const result = await runExportCliPublicSurfaceCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
        return result.execution;
    }

    async invokeMaintainerCliOperation(request: MaintainerCliOperationRequest) {
        return invokeMaintainerCliOperation({
            batchGenerateContentForTitlesCommand: async (reporter, folderPathOverride, fileSelectionOverride) => (
                this.batchGenerateContentForTitlesCommand(reporter, folderPathOverride, fileSelectionOverride)
            ),
            splitNoteByChaptersForPathCommand: async (sourcePath, reporter, options) => (
                this.splitNoteByChaptersForPathCommand(sourcePath, reporter, options)
            ),
            researchAndSummarizeForPathCommand: async (sourcePath, topicOverride, reporter) => (
                this.researchAndSummarizeForPathCommand(sourcePath, topicOverride, reporter)
            ),
            generateDiagramForPathCommand: async (sourcePath, reporter, options) => (
                this.generateDiagramForPathCommand(sourcePath, reporter, options)
            ),
            inspectLocalKnowledgeCommand: async (inspectRequest, reporter) => (
                this.inspectLocalKnowledgeCommand(inspectRequest, reporter)
            ),
            exportRedactedProviderProfilesCommand: async () => this.exportRedactedProviderProfilesCommand(),
            exportCliCapabilityManifestCommand: async () => this.exportCliCapabilityManifestCommand(),
            exportCliInvocationContractCommand: async () => this.exportCliInvocationContractCommand(),
            exportCliPublicSurfaceCommand: async () => this.exportCliPublicSurfaceCommand()
        }, request);
    }

    /** Command: Generate Content from Title */
    async generateContentForTitleCommand(
        file: TFile,
        reporter?: ProgressReporter
    ): Promise<GenerateContentForTitleResult | null> {
        return runGenerateContentForTitleCommandWithHost(this.createNoteProcessingCommandHost(), file, reporter);
    }

    async createWikiLinkAndGenerateFromSelectionCommand(
        editor: Editor,
        view: MarkdownView,
        reporter?: ProgressReporter
    ) {
        return runCreateWikiLinkAndGenerateFromSelectionCommandWithHost(
            this.createNoteProcessingCommandHost(),
            editor,
            view,
            reporter
        );
    }

    /** Command: Research and Summarize Topic */
    async researchAndSummarizeCommand(editor: Editor, view: MarkdownView, reporter?: ProgressReporter) {
        await runResearchAndSummarizeCommandWithHost(this.createNoteProcessingCommandHost(), editor, view, reporter);
    }

    async researchAndSummarizeForPathCommand(
        sourcePath: string,
        topicOverride?: string,
        reporter?: ProgressReporter
    ): Promise<ResearchSummarizeResult | null> {
        await this.loadSettings();
        const file = this.app.vault.getFileByPath(sourcePath);
        if (!file || file.extension !== 'md') {
            throw new Error(`No Markdown file found at path: ${sourcePath}`);
        }

        const useReporter = reporter ?? this.getReporter();
        const result = await researchAndSummarizeFile(this.app, this.settings, file, useReporter, topicOverride);
        if (result && this.settings.autoMermaidFixAfterGenerate) {
            await this.maybeAutoFixMermaidForFile(file, useReporter, 'research & summarize (cli)');
        }

        return result;
    }

    /** Command: Batch Generate Content from Titles */
    async batchGenerateContentForTitlesCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ): Promise<BatchGenerateContentForTitlesResult | null> {
        if (!fileSelectionOverride) {
            return runBatchGenerateContentForTitlesCommandWithHost(
                this.createNoteProcessingCommandHost(),
                reporter,
                folderPathOverride
            );
        }
        return runBatchGenerateContentForTitlesCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride,
            undefined,
            fileSelectionOverride
        );
    }

    /** Command: Check and Remove Duplicate Concept Notes */
    async checkAndRemoveDuplicateConceptNotesCommand(reporter?: ProgressReporter): Promise<ConceptDedupeResult | null> {
        return runCheckAndRemoveDuplicateConceptNotesCommandWithHost(this.createUtilityCommandHost(), reporter);
    }

    async checkDuplicatesCurrentCommand(reporter?: ProgressReporter) {
        return runCheckDuplicatesCurrentCommandWithHost(this.createUtilityCommandHost(), reporter);
    }

    /** Command: Batch Fix Mermaid Syntax */
    async batchMermaidFixCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ): Promise<BatchMermaidFixResult | null> {
        if (!fileSelectionOverride) {
            return runBatchMermaidFixCommandWithHost(this.createUtilityCommandHost(), reporter, folderPathOverride);
        }
        return runBatchMermaidFixCommandWithHost(
            this.createUtilityCommandHost(),
            reporter,
            folderPathOverride,
            undefined,
            fileSelectionOverride
        );
    }

    async fixFormulaFormatsCommand(file: TFile, reporter?: ProgressReporter) {
        await runFixFormulaFormatsCommandWithHost(this.createUtilityCommandHost(), file, reporter);
    }

    async batchFixFormulaFormatsCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ) {
        if (!folderPathOverride && !fileSelectionOverride) {
            await runBatchFixFormulaFormatsCommandWithHost(this.createUtilityCommandHost(), reporter);
            return;
        }
        await runBatchFixFormulaFormatsCommandWithHost(
            this.createUtilityCommandHost(),
            reporter,
            undefined,
            {
                folderPathOverride,
                fileSelectionOverride
            }
        );
    }

    async batchTranslateFolderCommand(
        folder?: TFolder,
        reporter?: ProgressReporter,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ) {
        if (!fileSelectionOverride) {
            await runBatchTranslateFolderCommandWithHost(this.createNoteProcessingCommandHost(), reporter, folder);
            return;
        }
        await runBatchTranslateFolderCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folder,
            undefined,
            fileSelectionOverride
        );
    }

    async translateFileCommand(file: TFile, signal?: AbortSignal, reporter?: ProgressReporter) {
        await runTranslateFileCommandWithHost(this.createNoteProcessingCommandHost(), file, signal, reporter);
    }

    async summarizeToMermaidCommand(file: TFile, reporter: ProgressReporter) {
        await this.generateDiagramCommand(file, reporter, { executionMode: 'save-mermaid' });
    }

    async generateDiagramCommand(
        file: TFile,
        reporter?: ProgressReporter,
        options: DiagramCommandOptions = { executionMode: 'save-artifact' }
    ) {
        return runGenerateDiagramCommandWithHost(
            this.createDiagramCommandRunHost(),
            file,
            reporter,
            options
        );
    }

    async generateDiagramForPathCommand(
        sourcePath: string,
        reporter?: ProgressReporter,
        options: DiagramCommandOptions = { executionMode: 'save-artifact' }
    ) {
        await this.loadSettings();
        const file = this.app.vault.getFileByPath(sourcePath);
        if (!file || !this.isSupportedTaskInputFile(file, 'generate-diagram')) {
            throw new Error(`No supported diagram input file found at path: ${sourcePath}`);
        }

        return this.generateDiagramCommand(file, reporter, options);
    }

    async inspectLocalKnowledgeCommand(
        request: LocalKnowledgeInspectRequest,
        reporter?: ProgressReporter
    ): Promise<LocalKnowledgeInspectResult> {
        await this.loadSettings();
        return inspectLocalKnowledgeRetrieval(this.app, this.settings, request, reporter);
    }

    private async executeSaveMermaidDiagramCommand(
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: DiagramCommandUiStrings = this.getUiStrings()
    ): Promise<DiagramCommandExecutionDetails> {
        const localKnowledgeRetrieval = toLocalKnowledgeRetrievalSummary(
            createEmptyLocalKnowledgeContextBuildResult('', {
                currentFilePath: operationInput.sourcePath,
                topK: 0,
                slidingWindowSize: 0,
                maxSnippetChars: 0
            })
        );
        return runSaveMermaidDiagramExecutionWithHost(this.createDiagramCommandExecutionHost(), {
            file,
            operationInput,
            provider,
            modelName,
            reporter,
            actionLabel,
            i18n,
            localKnowledgeContextUsed: false,
            localKnowledgeRetrieval
        });
    }

    private async executeArtifactDiagramCommand(
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: DiagramCommandUiStrings,
        executionMode: Extract<DiagramCommandExecutionMode, 'save-artifact' | 'preview-artifact'>
    ): Promise<DiagramCommandExecutionDetails> {
        const localKnowledgeResult = await this.withDiagramLocalKnowledgeContext(operationInput, reporter);

        return runArtifactDiagramExecutionWithHost(this.createDiagramCommandExecutionHost(), {
            file,
            operationInput: localKnowledgeResult.operationInput,
            provider,
            modelName,
            reporter,
            actionLabel,
            i18n,
            executionMode,
            localKnowledgeContextUsed: localKnowledgeResult.localKnowledgeContextUsed,
            localKnowledgeRetrieval: localKnowledgeResult.localKnowledgeRetrieval
        });
    }

    async generateExperimentalDiagramCommand(file: TFile, reporter: ProgressReporter) {
        await this.generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });
    }

    async previewDiagramCommand(file: TFile, reporter: ProgressReporter) {
        return runPreviewDiagramCommandWithHost(
            this.createDiagramCommandRunHost(),
            file,
            reporter
        );
    }

    async previewExperimentalDiagramCommand(file: TFile, reporter: ProgressReporter) {
        return this.previewDiagramCommand(file, reporter);
    }

    private async withDiagramLocalKnowledgeContext(
        operationInput: DiagramOperationInput,
        reporter: ProgressReporter
    ): Promise<DiagramLocalKnowledgeContextResult> {
        const query = buildDiagramLocalKnowledgeQuery(operationInput.sourcePath, operationInput.sourceMarkdown);
        const localKnowledgeOptions = {
            currentFilePath: operationInput.sourcePath,
            topK: this.settings.localKnowledgeTopK,
            slidingWindowSize: this.settings.localKnowledgeSlidingWindowSize,
            maxSnippetChars: this.settings.localKnowledgeMaxSnippetChars
        };
        const emptyResult = (overrides?: Partial<Pick<
            ReturnType<typeof createEmptyLocalKnowledgeContextBuildResult>,
            'indexedFileCount' | 'indexedSectionCount' | 'excludeCurrentFileApplied' | 'indexBuildMs'
        >>): DiagramLocalKnowledgeContextResult => ({
            operationInput,
            localKnowledgeContextUsed: false,
            localKnowledgeRetrieval: toLocalKnowledgeRetrievalSummary(
                createEmptyLocalKnowledgeContextBuildResult(query, localKnowledgeOptions, overrides)
            )
        });

        if (!this.settings.enableLocalKnowledgeRetrieval || !this.settings.enableLocalKnowledgeForDiagramGeneration) {
            return emptyResult();
        }

        const retriever = await buildLocalKnowledgeBaseRetriever(
            this.app,
            this.settings,
            reporter,
            'diagramGeneration'
        );
        if (!retriever) {
            return emptyResult({
                indexedFileCount: 0,
                indexedSectionCount: 0,
                excludeCurrentFileApplied: Boolean(
                    this.settings.localKnowledgeExcludeCurrentFile && operationInput.sourcePath
                ),
                indexBuildMs: 0
            });
        }

        const localKnowledgeDetails = retriever.buildContextDetails(query, localKnowledgeOptions);
        const localKnowledgeContext = localKnowledgeDetails.context || '';
        const localKnowledgeRetrieval = toLocalKnowledgeRetrievalSummary(localKnowledgeDetails);

        if (!localKnowledgeContext) {
            reporter.log(
                `Local knowledge retrieval returned no prompt context for diagram source `
                + `"${operationInput.sourcePath ?? 'current note'}" `
                + `(matched sections: ${localKnowledgeRetrieval.matchedSectionCount}, `
                + `excluded current-file hits: ${localKnowledgeRetrieval.excludedCurrentFileHitCount}, `
                + `build ${localKnowledgeRetrieval.indexBuildMs}ms, `
                + `query ${localKnowledgeRetrieval.queryMs}ms).`
            );
            return {
                operationInput,
                localKnowledgeContextUsed: false,
                localKnowledgeRetrieval
            };
        }

        reporter.log(
            `Local knowledge retrieval returned context for diagram source `
            + `"${operationInput.sourcePath ?? 'current note'}" `
            + `(length: ${localKnowledgeContext.length}, `
            + `${localKnowledgeRetrieval.returnedHitCount} hit block(s), `
            + `${localKnowledgeRetrieval.sourcePaths.length} file(s), `
            + `build ${localKnowledgeRetrieval.indexBuildMs}ms, `
            + `query ${localKnowledgeRetrieval.queryMs}ms).`
        );
        return {
            operationInput: {
                ...operationInput,
                localKnowledgeContext
            },
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval
        };
    }

    async splitNoteByChaptersForPathCommand(
        sourcePath: string,
        reporter?: ProgressReporter,
        options: {
            splitHeadingLevel?: ChapterSplitOptions['splitHeadingLevel'];
        } = {}
    ): Promise<ChapterSplitResult | null> {
        await this.loadSettings();
        const file = this.app.vault.getFileByPath(sourcePath);
        if (!file || file.extension !== 'md') {
            throw new Error(`No Markdown file found at path: ${sourcePath}`);
        }

        const markdown = await this.app.vault.read(file);
        if (!markdown.trim()) {
            throw new Error(this.getUiStrings().notices.fileEmpty);
        }

        return splitNoteByChapters(this.app, file, reporter ?? this.getReporter(), {
            splitHeadingLevel: options.splitHeadingLevel ?? this.settings.chapterSplitHeadingLevel
        });
    }

    async splitNoteByChaptersCommand(reporter?: ProgressReporter): Promise<ChapterSplitResult | null> {
        return runSplitNoteByChaptersCommandWithHost(this.createUtilityCommandHost(), reporter);
    }

    async extractConceptsCommand(reporter?: ProgressReporter) {
        await runExtractConceptsCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async batchExtractConceptsForFolderCommand(
        reporter?: ProgressReporter,
        options?: {
            folderPathOverride?: string;
            fileSelectionOverride?: FolderTaskFileSelectionOverride;
        }
    ) {
        if (!options?.folderPathOverride && !options?.fileSelectionOverride) {
            await runBatchExtractConceptsForFolderCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
            return;
        }
        await runBatchExtractConceptsForFolderCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            undefined,
            undefined,
            options
        );
    }

    async extractConceptsAndGenerateTitlesCommand(reporter?: ProgressReporter) {
        await runExtractConceptsAndGenerateTitlesCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async extractOriginalTextCommand(reporter?: ProgressReporter) {
        return runExtractOriginalTextCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async batchExtractOriginalTextCommand(
        reporter?: ProgressReporter,
        options?: {
            folderPathOverride?: string;
            fileSelectionOverride?: FolderTaskFileSelectionOverride;
        }
    ) {
        if (!options?.folderPathOverride && !options?.fileSelectionOverride) {
            return runBatchExtractOriginalTextCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
        }
        return runBatchExtractOriginalTextCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            undefined,
            options
        );
    }

    /** Command: Probe Slide Export Environment */
    async probeSlideExportEnvironmentCommand(): Promise<void> {
        await this.activateView();
        const view = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE)[0]?.view;
        if (view instanceof NotemdSidebarView) {
            await view.runSlideExportEnvironmentProbe();
            return;
        }
        new Notice(this.getUiStrings().notices.couldNotOpenSidebar);
    }

    private buildSlideExportConfig(): SlideExportConfig {
        return {
            format: this.settings.slideExportDefaultFormat,
            withClicks: this.settings.slideExportWithClicks,
            outputSubfolder: this.settings.slideExportOutputSubfolder,
            ffmpegFps: this.settings.slideExportFfmpegFps,
            ffmpegCrf: this.settings.slideExportFfmpegCrf,
            slidevTheme: this.settings.slideExportTheme,
            timeoutMs: this.settings.slideExportTimeoutMs,
            htmlMode: this.settings.slideExportHtmlMode,
        };
    }

    private createSlidevDeckGenerationProfile(reporter: ProgressReporter) {
        const uiStrings = this.getUiStrings();
        try {
            const { provider, modelName } = this.getProviderAndModelForTask('generateTitle');
            return {
                provider,
                modelName,
                settings: this.settings,
                reporter,
            };
        } catch (providerError) {
            const message = providerError instanceof Error ? providerError.message : String(providerError);
            reporter.log(formatI18n(uiStrings.slideExport.outlineLlmUnavailable, { message }));
            return undefined;
        }
    }

    async generateSlidevExportOutlineCommand(file: TFile, reporter?: ProgressReporter): Promise<string> {
        const { generateSlidevExportOutline } = await import('./slideExport');
        const uiStrings = this.getUiStrings();
        const activeReporter = reporter ?? await this.getSidebarReporter();
        const ownsReporter = !reporter;
        const label = uiStrings.slideExport.generateOutlineButton;
        const config = this.buildSlideExportConfig();

        if (ownsReporter) {
            this.startReporterAction(activeReporter, label);
        }

        try {
            const deckGeneration = this.createSlidevDeckGenerationProfile(activeReporter);
            const outlinePath = await generateSlidevExportOutline(
                this.app,
                file,
                config,
                { deckGeneration },
                (phase, detail) => activeReporter.log(detail ? `${phase}: ${detail}` : phase)
            );
            activeReporter.log(formatI18n(uiStrings.slideExport.outlineOutputLog, { path: outlinePath }));
            activeReporter.updateStatus(formatI18n(uiStrings.slideExport.outlineOutputSuccess, { path: outlinePath }), 100);
            new Notice(formatI18n(uiStrings.slideExport.outlineOutputSuccess, { path: outlinePath }));
            return outlinePath;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const failureNotice = formatI18n(uiStrings.slideExport.exportFailedNotice, { message });
            activeReporter.log(failureNotice);
            activeReporter.updateStatus(failureNotice, -1);
            new Notice(failureNotice);
            console.error('Slide outline export error:', error);
            return '';
        } finally {
            if (ownsReporter && activeReporter instanceof NotemdSidebarView) {
                activeReporter.finishProcessing();
            }
        }
    }

    /** Command: Export Slides */
    async exportSlidesCommand(file: TFile, reporter?: ProgressReporter): Promise<void> {
        const { prepareSlidevExportSource } = await import('./slideExport');
        await this.exportSlidesWithPreparedSource(
            file,
            this.getUiStrings().slideExport.oneShotExportButton,
            reporter,
            async (config, activeReporter, logSlideExportProgress) => prepareSlidevExportSource(
                this.app,
                file,
                config,
                { deckGeneration: this.createSlidevDeckGenerationProfile(activeReporter) },
                logSlideExportProgress
            )
        );
    }

    async exportSlidesFromOutlineCommand(file: TFile, reporter?: ProgressReporter): Promise<void> {
        const { getSlidevExportOutlinePath, prepareSlidevExportSourceFromOutline } = await import('./slideExport');
        const uiStrings = this.getUiStrings();
        await this.exportSlidesWithPreparedSource(
            file,
            uiStrings.slideExport.continueFromOutlineButton,
            reporter,
            async (config, activeReporter, logSlideExportProgress) => {
                const outlinePath = getSlidevExportOutlinePath(file, config);
                let outlineMarkdown = '';
                try {
                    outlineMarkdown = await this.app.vault.adapter.read(outlinePath);
                } catch {
                    throw new Error(formatI18n(uiStrings.slideExport.outlineMissingError, { path: outlinePath }));
                }
                activeReporter.log(formatI18n(uiStrings.slideExport.outlineLoadedLog, { path: outlinePath }));
                activeReporter.log(uiStrings.slideExport.outlinePreparingDeck);
                return prepareSlidevExportSourceFromOutline(
                    this.app,
                    file,
                    outlineMarkdown,
                    config,
                    { deckGeneration: this.createSlidevDeckGenerationProfile(activeReporter) },
                    logSlideExportProgress
                );
            }
        );
    }

    private async exportSlidesWithPreparedSource(
        file: TFile,
        label: string,
        reporter: ProgressReporter | undefined,
        prepareSource: (
            config: SlideExportConfig,
            activeReporter: ProgressReporter,
            logSlideExportProgress: (phase: string, detail?: string) => void
        ) => Promise<SlidevExportSource>
    ): Promise<void> {
        const { probeEnvironment, convergeSlidevDeckLayout, exportSlidevPdf, exportSlidevPng, exportVideoMp4, getVaultBasePath } = await import('./slideExport');
        const uiStrings = this.getUiStrings();
        const config = this.buildSlideExportConfig();
        const activeReporter = reporter ?? await this.getSidebarReporter();
        const ownsReporter = !reporter;
        const logSlideExportProgress = (phase: string, detail?: string) => {
            activeReporter.log(detail ? `${phase}: ${detail}` : phase);
        };

        if (ownsReporter) {
            this.startReporterAction(activeReporter, label);
        }

        try {
            activeReporter.updateStatus(uiStrings.slideExport.probingEnvironment, 8);
            activeReporter.log(uiStrings.slideExport.probingEnvironment);
            const vaultRoot = getVaultBasePath(this.app);
            const envReport = await probeEnvironment(vaultRoot ? [vaultRoot] : []);

            if (!envReport.capabilities[config.format]) {
                throw new Error(uiStrings.slideExport.formatNotSupported.replace('{format}', config.format.toUpperCase()));
            }

            activeReporter.updateStatus(uiStrings.slideExport.exportingSlides, 22);
            const slideSource = await prepareSource(config, activeReporter, logSlideExportProgress);
            activeReporter.updateStatus(uiStrings.slideExport.exportingSlides, 48);
            const layoutConvergence = await convergeSlidevDeckLayout(
                this.app,
                slideSource,
                config,
                logSlideExportProgress
            );
            activeReporter.updateStatus(uiStrings.slideExport.exportingSlides, 74);

            if (config.format === 'html') {
                const outputPath = layoutConvergence.exportPath;
                activeReporter.log(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath));
                activeReporter.updateStatus(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath), 100);
                new Notice(uiStrings.slideExport.exportComplete);

                const requiresLocalServer = outputPath.endsWith('/index.html');
                if (config.htmlMode === 'server-script' || requiresLocalServer) {
                    if (requiresLocalServer && config.htmlMode !== 'server-script') {
                        activeReporter.log('Standalone HTML fallback requires a local server; opening compatible HTML export...');
                    }
                    activeReporter.log('Opening in browser...');
                    const { openHtmlInBrowser } = await import('./slideExport/localServer');
                    const vaultRoot = (this.app.vault.adapter as any).basePath;
                    await openHtmlInBrowser(outputPath, vaultRoot);
                }
            } else if (config.format === 'pdf') {
                const outputPath = await exportSlidevPdf(
                    this.app,
                    slideSource,
                    config,
                    logSlideExportProgress
                );
                activeReporter.log(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath));
                activeReporter.updateStatus(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath), 100);
                new Notice(uiStrings.slideExport.exportComplete);
            } else if (config.format === 'png') {
                const outputPath = await exportSlidevPng(
                    this.app,
                    slideSource,
                    config,
                    logSlideExportProgress
                );
                activeReporter.log(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath));
                activeReporter.updateStatus(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath), 100);
                new Notice(uiStrings.slideExport.exportComplete);
            } else if (config.format === 'mp4') {
                activeReporter.log(uiStrings.slideExport.exportingPngSequence);
                const pngDir = await exportSlidevPng(
                    this.app,
                    slideSource,
                    config,
                    logSlideExportProgress
                );
                activeReporter.updateStatus(uiStrings.slideExport.convertingToVideo, 88);
                activeReporter.log(uiStrings.slideExport.convertingToVideo);
                const outputPath = await exportVideoMp4(
                    this.app,
                    pngDir,
                    slideSource.outputBasename,
                    config,
                    logSlideExportProgress
                );
                activeReporter.log(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath));
                activeReporter.updateStatus(uiStrings.slideExport.exportSuccess.replace('{path}', outputPath), 100);
                new Notice(uiStrings.slideExport.exportComplete);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const failureNotice = formatI18n(uiStrings.slideExport.exportFailedNotice, { message: errorMessage });
            activeReporter.log(failureNotice);
            activeReporter.updateStatus(failureNotice, -1);
            new Notice(failureNotice);
            console.error('Slide export error:', error);
        } finally {
            if (ownsReporter && activeReporter instanceof NotemdSidebarView) {
                activeReporter.finishProcessing();
            }
        }
    }

} // End of NotemdPlugin class
