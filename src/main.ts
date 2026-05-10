import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { NotemdSettings, ProgressReporter, LLMProviderConfig, TaskKey } from './types';
import { DEFAULT_SETTINGS, NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_ICON } from './constants';
import { createCompleteResetSettings, createPartialResetSettings } from './settingsReset';
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
import { _performResearch, researchAndSummarize } from './searchUtils'; // Import _performResearch if needed directly, ensure researchAndSummarize is exported
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
    DiagramCommandExecutionDetails,
    DiagramCommandHostAdapter,
    DiagramCommandExecutionMode,
    DiagramCommandOptions,
    DiagramCommandRunHost,
    DiagramCommandUiStrings,
    runGenerateDiagramCommandWithHost,
    runPreviewDiagramCommandWithHost
} from './operations/diagramCommandHostAdapter';
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
    runExportProviderProfilesCommandWithHost,
    runImportProviderProfilesCommandWithHost
} from './operations/configProfileCommandHostAdapter';
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
    UtilityCommandHost
} from './operations/utilityCommandHostAdapter';

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
            readFile: (file) => this.app.vault.read(file),
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
            readFile: (file) => this.app.vault.read(file),
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            getActionLabel: (actionId) => this.getActionLabel(actionId),
            getReporter: () => this.getReporter(),
            getFolderSelection: () => this.getFolderSelection(),
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

    private registerEditorDiagramCommand(
        id: string,
        name: string,
        handler: (file: TFile, reporter: ProgressReporter) => Promise<void>
    ) {
        this.addCommand({
            id,
            name,
            editorCallback: async (_editor: Editor, view: MarkdownView) => {
                const file = view.file;
                if (file) {
                    const reporter = this.getReporter();
                    await handler.call(this, file, reporter);
                }
            }
        });
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
            this.summarizeToMermaidCommand
        );

        this.registerEditorDiagramCommand(
            'notemd-generate-diagram',
            uiStrings.commands.generateExperimentalDiagram,
            async (file, reporter) => {
                await this.generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });
            }
        );

        this.registerEditorDiagramCommand(
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
            this.generateExperimentalDiagramCommand
        );

        this.registerEditorDiagramCommand(
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
                const condition = activeFile && (activeFile.extension === 'md' || activeFile.extension === 'txt');
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
                if (activeFile) {
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
                const condition = activeFile && (activeFile.extension === 'md' || activeFile.extension === 'txt');
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
            id: 'create-wiki-link-and-generate-from-selection',
            name: uiStrings.commands.createWikiLinkAndGenerateNoteFromSelection,
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.createWikiLinkAndGenerateFromSelectionCommand(editor, view);
            }
        });

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
    }

    // --- Settings Management ---
    async loadSettings() {
        const savedData = await this.loadData() || {};
        const savedProviders = savedData.providers || [];
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
                    const localProviders: LLMProviderConfig[] = JSON.parse(localRaw);
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

    /** Helper to show folder selection modal */
    async getFolderSelection(): Promise<string | null> {
        const folders = this.app.vault.getAllLoadedFiles()
            .filter((f): f is TFolder => f instanceof TFolder) // Type guard
            .map(f => f.path);
        folders.unshift('/'); // Add root

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
        folderPathOverride?: string
    ): Promise<BatchProcessFolderResult | null> {
        return runProcessFolderWithNotemdCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride
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

    async exportProviderProfilesCommand(): Promise<void> {
        const result = await runExportProviderProfilesCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
    }

    async importProviderProfilesCommand(): Promise<void> {
        const result = await runImportProviderProfilesCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
    }

    async exportCliCapabilityManifestCommand(): Promise<void> {
        const result = await runExportCliCapabilityManifestCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
    }

    async exportCliInvocationContractCommand(): Promise<void> {
        const result = await runExportCliInvocationContractCommandWithHost(this.createConfigProfileCommandHost());
        this.showCommandNotices(result.notices);
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

    /** Command: Batch Generate Content from Titles */
    async batchGenerateContentForTitlesCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string
    ): Promise<BatchGenerateContentForTitlesResult | null> {
        return runBatchGenerateContentForTitlesCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride
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
        folderPathOverride?: string
    ): Promise<BatchMermaidFixResult | null> {
        return runBatchMermaidFixCommandWithHost(this.createUtilityCommandHost(), reporter, folderPathOverride);
    }

    async fixFormulaFormatsCommand(file: TFile, reporter?: ProgressReporter) {
        await runFixFormulaFormatsCommandWithHost(this.createUtilityCommandHost(), file, reporter);
    }

    async batchFixFormulaFormatsCommand(reporter?: ProgressReporter) {
        await runBatchFixFormulaFormatsCommandWithHost(this.createUtilityCommandHost(), reporter);
    }

    async batchTranslateFolderCommand(folder?: TFolder, reporter?: ProgressReporter) {
        await runBatchTranslateFolderCommandWithHost(this.createNoteProcessingCommandHost(), reporter, folder);
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

    private async executeSaveMermaidDiagramCommand(
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: DiagramCommandUiStrings = this.getUiStrings()
    ): Promise<DiagramCommandExecutionDetails> {
        return runSaveMermaidDiagramExecutionWithHost(this.createDiagramCommandExecutionHost(), {
            file,
            operationInput,
            provider,
            modelName,
            reporter,
            actionLabel,
            i18n
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
        return runArtifactDiagramExecutionWithHost(this.createDiagramCommandExecutionHost(), {
            file,
            operationInput,
            provider,
            modelName,
            reporter,
            actionLabel,
            i18n,
            executionMode
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

    async extractConceptsCommand(reporter?: ProgressReporter) {
        await runExtractConceptsCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async batchExtractConceptsForFolderCommand(reporter?: ProgressReporter) {
        await runBatchExtractConceptsForFolderCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async extractConceptsAndGenerateTitlesCommand(reporter?: ProgressReporter) {
        await runExtractConceptsAndGenerateTitlesCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async extractOriginalTextCommand(reporter?: ProgressReporter) {
        return runExtractOriginalTextCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    async batchExtractOriginalTextCommand(reporter?: ProgressReporter) {
        return runBatchExtractOriginalTextCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

} // End of NotemdPlugin class
