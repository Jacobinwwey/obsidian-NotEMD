import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { NotemdSettings, ProgressReporter, LLMProviderConfig, TaskKey } from './types';
import { DEFAULT_SETTINGS, NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_ICON } from './constants';
import { retry, normalizeNameForFilePath } from './utils';
import { callLLM } from './llmUtils';
import {
    handleFileRename,
    handleFileDelete,
    processFile,
    generateContentForTitle,
    batchGenerateContentForTitles,
    checkAndRemoveDuplicateConceptNotes,
    batchFixMermaidSyntaxInFolder,
    findDuplicates,
    saveMermaidSummaryFile,
    saveDiagramArtifactFile,
    extractConceptsFromFile,
    createConceptNotes,
    fixMermaidSyntaxInFile,
    saveErrorLog // Import
} from './fileUtils';
import { fixFormulaFormatsInFile, batchFixFormulaFormatsInFolder } from './formulaFixer';
import { _performResearch, researchAndSummarize } from './searchUtils'; // Import _performResearch if needed directly, ensure researchAndSummarize is exported
import { ProgressModal } from './ui/ProgressModal';
import { ErrorModal } from './ui/ErrorModal';
import { DiagramPreviewModal } from './ui/DiagramPreviewModal';
import { WelcomeModal } from './ui/WelcomeModal';
import { NotemdSettingTab } from './ui/NotemdSettingTab';
import { showDeletionConfirmationModal } from './ui/modals'; // Import the modal function
import { NotemdSidebarView } from './ui/NotemdSidebarView';
import { BatchProgressStore } from './batchProgressStore';
import { getSystemPrompt } from './promptUtils';
import { formatI18n, getI18nStrings } from './i18n';
import { resolveTaskLanguageCode } from './i18n/taskLanguagePolicy';
import { getSidebarActionLabel, SidebarActionId } from './workflowButtons';
import {
    buildDiagramOperationInput,
    DiagramOperationInput
} from './diagram/diagramGenerationService';
import { RenderArtifact } from './rendering/types';
import { IframeRenderHost } from './rendering/host/iframeRenderHost';
import { getRenderTargetDisplayName } from './rendering/targetLabel';
import { supportsDiagramPreviewModal } from './ui/diagramPreview';
import { runDiagramGenerateOperation } from './operations/diagramGenerateOperation';
import {
    completeArtifactDiagramCommand,
    completeMermaidDiagramCommand,
    DiagramCommandHostAdapter,
    previewVegaLiteArtifactFromMarkdown
} from './operations/diagramCommandHostAdapter';
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
    ProviderConnectionTestCommandHost,
    runTestLlmConnectionCommandWithHost
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
    runBatchExtractConceptsForFolderCommandWithHost,
    runBatchGenerateContentForTitlesCommandWithHost,
    runBatchTranslateFolderCommandWithHost,
    runExtractConceptsAndGenerateTitlesCommandWithHost,
    runExtractConceptsCommandWithHost,
    runExtractOriginalTextCommandWithHost,
    runGenerateContentForTitleCommandWithHost,
    runProcessFolderWithNotemdCommandWithHost,
    runProcessWithNotemdCommandWithHost,
    runResearchAndSummarizeCommandWithHost,
    runTranslateFileCommandWithHost
} from './operations/noteProcessingCommandHostAdapter';

type DiagramCommandExecutionMode = 'save-mermaid' | 'save-artifact' | 'preview-artifact';

interface DiagramCommandOptions {
    executionMode: DiagramCommandExecutionMode;
}

export default class NotemdPlugin extends Plugin {
    settings: NotemdSettings;
    statusBarItem: HTMLElement;
    private ribbonIconEl: HTMLElement | null = null;
    private isBusy: boolean = false;
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

    private createProviderConnectionTestCommandHost(): ProviderConnectionTestCommandHost {
        return {
            loadSettings: () => this.loadSettings(),
            getSettings: () => this.settings,
            getUiStrings: () => this.getUiStrings(),
            showNotice: (message, duration) => new Notice(message, duration),
            logError: (message, details) => console.error(message, details),
            openErrorModal: (title, details) => this.openLocalizedErrorModal(title, details),
            saveErrorLog: (error, reporter) => saveErrorLog(this.app, reporter, error, this.settings)
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

    private showCommandNotices(notices: ConfigProfileCommandNotice[]): void {
        for (const notice of notices) {
            new Notice(notice.message, notice.duration);
        }
    }

    private getDiagramCommandActionLabel(executionMode: DiagramCommandExecutionMode, i18n = this.getUiStrings()): string {
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
            this.generateExperimentalDiagramCommand
        );

        this.registerEditorDiagramCommand(
            'notemd-preview-diagram',
            uiStrings.commands.previewExperimentalDiagram,
            this.previewExperimentalDiagramCommand
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
            this.previewExperimentalDiagramCommand
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
                        // This command is simple and doesn't use the full reporter/busy state
                        // We need to ensure activeFile is valid here if it was captured in an outer scope for check,
                        // or re-fetch it. Given the example, it's safer to re-evaluate.
                        const currentActiveFile = this.app.workspace.getActiveFile();
                        if (currentActiveFile && (currentActiveFile.extension === 'md' || currentActiveFile.extension === 'txt')) {
                            (async () => { // Wrap async logic
                                try {
                                    const content = await this.app.vault.read(currentActiveFile);
                                    const duplicates = findDuplicates(content); // Use utility
                                    const message = formatI18n(uiStrings.notices.duplicateTermsCheckConsole, { count: duplicates.size });
                                    new Notice(message);
                                    if (duplicates.size > 0) {
                                        console.log(`Potential duplicates in ${currentActiveFile.name}:`, Array.from(duplicates));
                                    }
                                } catch (error: unknown) {
                                    let errorMessage = uiStrings.common.unknownError;
                                    if (error instanceof Error) {
                                        errorMessage = error.message;
                                    }
                                    new Notice(formatI18n(uiStrings.notices.duplicateCheckError, { message: errorMessage }));
                                    console.error("Error checking duplicates:", error);
                                }
                            })();
                        } else if (!checking) { // If file became invalid between check and action
                             new Notice(uiStrings.notices.noActiveTextFileSelected);
                        }
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
            id: 'create-wiki-link-and-generate-from-selection',
            name: uiStrings.commands.createWikiLinkAndGenerateNoteFromSelection,
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const word = editor.getSelection().trim();
                if (!word || word.length < 2) {
                    new Notice(uiStrings.notices.selectValidWord);
                    return;
                }

                // Replace selection with wiki-link
                editor.replaceSelection(`[[${word}]]`);

                if (!this.settings.useCustomConceptNoteFolder || !this.settings.conceptNoteFolder) {
                    new Notice(uiStrings.notices.setConceptNoteFolder);
                    return;
                }

                const safeName = normalizeNameForFilePath(word);
                const notePath = `${this.settings.conceptNoteFolder}/${safeName}.md`;
                const existingFile = this.app.vault.getAbstractFileByPath(notePath);

                let newFile: TFile;
                const reporter = this.getReporter();

                try {
                    if (existingFile instanceof TFile) {
                        // Add backlink to existing (reuse createConceptNotes logic)
                        await createConceptNotes(this.app, this.settings, new Set([word]), view.file?.basename || null, { disableBacklink: false });
                        newFile = existingFile;
                        reporter.log(`Updated existing note: ${notePath}`);
                    } else {
                        // Create blank note (reuse createConceptNotes minimal template)
                        await createConceptNotes(this.app, this.settings, new Set([word]), view.file?.basename || null, { minimalTemplate: false });
                        const createdFile = this.app.vault.getAbstractFileByPath(notePath);
                        if (createdFile instanceof TFile) {
                            newFile = createdFile;
                        } else {
                            throw new Error("Failed to create note.");
                        }
                        reporter.log(`Created blank note: ${notePath}`);
                    }

                    // Auto-run Generate from Title
                    if (this.isBusy) throw new Error('Busy');
                    this.isBusy = true;
                    await generateContentForTitle(this.app, this.settings, newFile, reporter);

                    await this.maybeAutoFixMermaidForFile(newFile, reporter, 'create wiki-link and generate');

                    reporter.updateStatus(this.getActionCompleteText(uiStrings.commands.createWikiLinkAndGenerateNoteFromSelection), 100);
                    if (reporter instanceof ProgressModal) {
                        setTimeout(() => reporter.close(), 2000);
                    }

                    new Notice(formatI18n(uiStrings.notices.generatedContentForWord, { word }));
                } catch (error: any) {
                    const message = error instanceof Error ? error.message : String(error);
                    new Notice(formatI18n(uiStrings.notices.genericError, { message }));
                    reporter.log(formatI18n(uiStrings.notices.genericError, { message }));
                } finally {
                    this.isBusy = false;
                }
            },
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
    async processWithNotemdCommand(reporter?: ProgressReporter) {
        await runProcessWithNotemdCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

    /** Command: Process Folder (Add Links) */

    private getBatchProgressStore(): BatchProgressStore {
        const vaultRoot = (this.app.vault.adapter as any).getBasePath?.() || (this.app.vault.adapter as any).basePath || '.';
        return new BatchProgressStore(vaultRoot);
    }

    async processFolderWithNotemdCommand(reporter?: ProgressReporter, folderPathOverride?: string) {
        await runProcessFolderWithNotemdCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride
        );
    }

    // Note: The simple 'Check Duplicates' command logic is now directly in onload()

    /** Command: Test LLM Connection */
    // This command handler now uses the reporter for UI feedback
    async testLlmConnectionCommand(reporter?: ProgressReporter) {
        const i18n = this.getUiStrings();
        if (this.isBusy) { new Notice(i18n.notices.cannotTestConnectionWhileProcessing); return; }
        this.isBusy = true; // Prevent other actions during test
        const useReporter = reporter || this.getReporter();
        if (!reporter) useReporter.clearDisplay();

        try {
            await runTestLlmConnectionCommandWithHost(this.createProviderConnectionTestCommandHost(), useReporter);
        } finally {
            this.isBusy = false;
            // No need to call useReporter.updateButtonStates() here
        }
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
    async generateContentForTitleCommand(file: TFile, reporter?: ProgressReporter) {
        await runGenerateContentForTitleCommandWithHost(this.createNoteProcessingCommandHost(), file, reporter);
    }

    /** Command: Research and Summarize Topic */
    async researchAndSummarizeCommand(editor: Editor, view: MarkdownView, reporter?: ProgressReporter) {
        await runResearchAndSummarizeCommandWithHost(this.createNoteProcessingCommandHost(), editor, view, reporter);
    }

    /** Command: Batch Generate Content from Titles */
    async batchGenerateContentForTitlesCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string
    ): Promise<{ sourceFolderPath: string; completeFolderPath: string } | null> {
        return runBatchGenerateContentForTitlesCommandWithHost(
            this.createNoteProcessingCommandHost(),
            reporter,
            folderPathOverride
        );
    }

    /** Command: Check and Remove Duplicate Concept Notes */
    async checkAndRemoveDuplicateConceptNotesCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('check-remove-duplicate-concepts');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        useReporter.log(this.getRunningActionText(actionLabel));
        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            await checkAndRemoveDuplicateConceptNotes(this.app, this.settings, useReporter); // Call utility
            // Status is updated within the utility function
            this.updateStatusBar(this.getActionCompleteText(actionLabel));
        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during duplicate check.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            console.error("Error checking/removing duplicate concept notes:", errorDetails);
            new Notice(formatI18n(i18n.notices.duplicateCheckRemoveError, { message: errorMessage }), 10000);
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
            this.openLocalizedErrorModal(i18n.errorModal.titles.duplicateCheckRemove, errorDetails);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }
    /** Command: Batch Fix Mermaid Syntax */
    async batchMermaidFixCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string
    ): Promise<{ folderPath: string; modifiedCount: number } | null> {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return null; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('batch-mermaid-fix');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings(); // Load settings in case needed by future logic
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) {
                const cancelledMessage = i18n.common.cancel;
                useReporter.log(cancelledMessage);
                useReporter.updateStatus(cancelledMessage, -1);
                throw new Error(cancelledMessage);
            }

            this.updateStatusBar(this.getRunningActionText(actionLabel));
            useReporter.log(this.getRunningActionText(actionLabel));

            const { errors, modifiedCount } = await batchFixMermaidSyntaxInFolder(this.app, this.settings, folderPath, useReporter); // Call utility

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(i18n.notices.batchMermaidFixFinishedWithErrors, {
                        count: errors.length,
                        modifiedCount
                    });
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(errorSummary); new Notice(errorSummary, 10000);
                } else {
                    const finalMessage = formatI18n(i18n.notices.batchMermaidFixSuccess, { modifiedCount });
                    useReporter.updateStatus(finalMessage, 100); this.updateStatusBar(this.getActionCompleteText(actionLabel));
                    new Notice(finalMessage, 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
                return { folderPath, modifiedCount };
            }

        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during batch Mermaid fix.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                console.error("Notemd Batch Mermaid Fix Error:", errorDetails);
                new Notice(formatI18n(i18n.notices.batchMermaidFixError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.batchMermaidFix, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Batch Fix Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
        return null;
    }

    async fixFormulaFormatsCommand(file: TFile, reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('fix-formula-current');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, `${actionLabel}: ${file.name}`);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const modified = await fixFormulaFormatsInFile(this.app, file, useReporter);

            if (modified) {
                const message = formatI18n(i18n.notices.formulaFixSuccess, { file: file.name });
                useReporter.log(`✅ ${message}`);
                new Notice(message);
            } else {
                const message = formatI18n(i18n.notices.formulaFixNotNeeded, { file: file.name });
                useReporter.log(message);
                new Notice(message);
            }
            useReporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 1000);

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred.';
            if (error instanceof Error) errorMessage = error.message;

            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
            new Notice(formatI18n(i18n.notices.genericError, { message: errorMessage }));
            await saveErrorLog(this.app, useReporter, error, this.settings);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async batchFixFormulaFormatsCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('batch-fix-formula');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) {
                const cancelledMessage = i18n.common.cancel;
                useReporter.log(cancelledMessage);
                useReporter.updateStatus(cancelledMessage, -1);
                throw new Error(cancelledMessage);
            }

            const { modifiedCount, errors } = await batchFixFormulaFormatsInFolder(this.app, folderPath, useReporter);

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const msg = formatI18n(i18n.notices.batchFormulaFixFinishedWithErrors, {
                        count: errors.length,
                        modifiedCount
                    });
                    useReporter.log(msg);
                    useReporter.updateStatus(msg, -1);
                    new Notice(msg);
                } else {
                    const msg = formatI18n(i18n.notices.batchFormulaFixSuccess, { modifiedCount });
                    useReporter.log(msg);
                    useReporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
                    new Notice(msg);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            }
        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred.';
            if (error instanceof Error) errorMessage = error.message;
            if (!errorMessage.includes("Cancelled")) {
                useReporter.log(`Error: ${errorMessage}`);
                this.failReporterAction(useReporter, errorMessage);
                new Notice(formatI18n(i18n.notices.genericError, { message: errorMessage }));
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
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
        if (this.isBusy) {
            new Notice(this.getUiStrings().notices.anotherProcessRunning);
            return;
        }

        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        let actionLabel = this.getDiagramCommandActionLabel(options.executionMode, i18n);
        const maybeSidebar = useReporter as any;

        this.startReporterAction(useReporter, `${actionLabel}: ${file.name}`);

        switch (options.executionMode) {
            case 'save-mermaid':
                useReporter.log(`Starting Mermaid summarization for ${file.name}...`);
                break;
            case 'save-artifact':
                useReporter.log(`Starting experimental diagram generation for ${file.name}...`);
                break;
            case 'preview-artifact':
                useReporter.log(`Starting experimental diagram preview for ${file.name}...`);
                break;
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            actionLabel = this.getDiagramCommandActionLabel(options.executionMode, i18n);

            const fileContent = await this.app.vault.read(file);
            if (!fileContent.trim()) {
                switch (options.executionMode) {
                    case 'save-mermaid':
                        throw new Error('File is empty. Cannot summarize.');
                    case 'save-artifact':
                        throw new Error('File is empty. Cannot generate diagram.');
                    case 'preview-artifact':
                        throw new Error('File is empty. Cannot generate diagram preview.');
                }
            }

            const { provider, modelName } = this.getProviderAndModelForTask('summarizeToMermaid');
            useReporter.log(`Using provider: ${provider.name}, Model: ${modelName}`);
            const operationInput = buildDiagramOperationInput({
                sourcePath: file.path,
                sourceMarkdown: fileContent,
                executionMode: options.executionMode,
                settings: this.settings,
                targetLanguage: resolveTaskLanguageCode(this.settings, 'summarizeToMermaid')
            });

            if (options.executionMode === 'save-mermaid') {
                await this.executeSaveMermaidDiagramCommand(file, operationInput, provider, modelName, useReporter, actionLabel, i18n);
            } else {
                await this.executeArtifactDiagramCommand(file, operationInput, provider, modelName, useReporter, actionLabel, i18n, options.executionMode);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);

            switch (options.executionMode) {
                case 'save-mermaid':
                    useReporter.log(`Error during Mermaid summarization: ${message}`);
                    new Notice(formatI18n(i18n.notices.mermaidSummarizationError, { message }));
                    console.error('Summarization Error:', error);
                    break;
                case 'save-artifact':
                    useReporter.log(`Error during experimental diagram generation: ${message}`);
                    new Notice(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                    console.error('Experimental diagram generation error:', error);
                    break;
                case 'preview-artifact':
                    useReporter.log(`Error during experimental diagram preview: ${message}`);
                    new Notice(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                    console.error('Experimental diagram preview error:', error);
                    break;
            }

            useReporter.updateStatus(this.getActionFailedText(message), -1);
            await saveErrorLog(this.app, useReporter, error, this.settings);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    private async executeSaveMermaidDiagramCommand(
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n = this.getUiStrings()
    ) {
        reporter.updateStatus(this.getStepStatusText(1, 3, actionLabel), 20);
        const result = await runDiagramGenerateOperation({
            input: operationInput,
            settings: this.settings,
            provider,
            modelName,
            reporter,
            getLegacyMermaidPrompt: () => this.getPromptForTask('summarizeToMermaid')
        });
        await completeMermaidDiagramCommand({
            host: this.createDiagramCommandHostAdapter(),
            file,
            reporter,
            mermaidContent: result.artifact.content,
            actionLabel,
            completeNotice: i18n.notices.mermaidSummarizationComplete,
            autoFixAfterGenerate: this.settings.autoMermaidFixAfterGenerate,
            getStepStatusText: (current, total, label) => this.getStepStatusText(current, total, label),
            getActionCompleteText: (label) => this.getActionCompleteText(label)
        });
    }

    private async executeArtifactDiagramCommand(
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: ReturnType<NotemdPlugin['getUiStrings']>,
        executionMode: Extract<DiagramCommandExecutionMode, 'save-artifact' | 'preview-artifact'>
    ) {
        const totalSteps = executionMode === 'preview-artifact' ? 2 : 3;
        const initialProgress = executionMode === 'preview-artifact' ? 25 : 20;
        reporter.updateStatus(this.getStepStatusText(1, totalSteps, actionLabel), initialProgress);

        const result = await runDiagramGenerateOperation({
            input: operationInput,
            settings: this.settings,
            provider,
            modelName,
            reporter,
            getLegacyMermaidPrompt: () => this.getPromptForTask('summarizeToMermaid')
        });
        await completeArtifactDiagramCommand({
            host: this.createDiagramCommandHostAdapter(),
            file,
            reporter,
            result,
            actionLabel,
            executionMode,
            completeNotice: i18n.notices.experimentalDiagramComplete,
            previewReadyNotice: i18n.notices.experimentalDiagramPreviewReady,
            manualFixHintNotice: i18n.notices.experimentalDiagramManualFixHint,
            autoFixAfterGenerate: this.settings.autoMermaidFixAfterGenerate,
            getStepStatusText: (current, total, label) => this.getStepStatusText(current, total, label),
            getActionCompleteText: (label) => this.getActionCompleteText(label)
        });
    }

    async generateExperimentalDiagramCommand(file: TFile, reporter: ProgressReporter) {
        await this.generateDiagramCommand(file, reporter, { executionMode: 'save-artifact' });
    }

    async previewExperimentalDiagramCommand(file: TFile, reporter: ProgressReporter) {
        // Preview Vega-Lite content from current file without calling LLM
        const i18n = this.getUiStrings();
        const actionLabel = i18n.commands.previewExperimentalDiagram;
        this.startReporterAction(reporter, `${actionLabel}: ${file.name}`);
        reporter.log(`Starting Vega-Lite preview for ${file.name}...`);

        try {
            const fileContent = await this.app.vault.read(file);
            previewVegaLiteArtifactFromMarkdown({
                host: this.createDiagramCommandHostAdapter(),
                sourceMarkdown: fileContent,
                sourcePath: file.path
            });

            reporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
            reporter.log(`Vega-Lite preview opened for: ${file.path}`);
            new Notice(i18n.notices.experimentalDiagramPreviewReady);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            reporter.log(`Error during Vega-Lite preview: ${message}`);
            new Notice(formatI18n(i18n.notices.experimentalDiagramError, { message }));
            console.error("Vega-Lite preview error:", error);
            reporter.updateStatus(this.getActionFailedText(message), -1);
            await saveErrorLog(this.app, reporter, error, this.settings);
        }
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
        await runExtractOriginalTextCommandWithHost(this.createNoteProcessingCommandHost(), reporter);
    }

} // End of NotemdPlugin class
