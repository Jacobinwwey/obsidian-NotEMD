import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { NotemdSettings, ProgressReporter, LLMProviderConfig, TaskKey } from './types';
import { DEFAULT_SETTINGS, NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_ICON } from './constants';
import { delay, createConcurrentProcessor, chunkArray, retry, normalizeNameForFilePath } from './utils';
import { testAPI, callLLM } from './llmUtils';
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
import { translateFile, batchTranslateFolder } from './translate';
import { BatchProgressStore } from './batchProgressStore';
import { getSystemPrompt } from './promptUtils';
import { extractOriginalText } from './extractOriginalText';
import { formatI18n, getI18nStrings } from './i18n';
import { resolveTaskLanguageCode } from './i18n/taskLanguagePolicy';
import { buildCliCapabilityManifest, getSidebarActionLabel, SidebarActionId } from './workflowButtons';
import {
    buildDiagramOperationInput,
    DiagramOperationInput,
    generateDiagramArtifact
} from './diagram/diagramGenerationService';
import { RenderArtifact } from './rendering/types';
import { DiagramIntent } from './diagram/types';
import { IframeRenderHost } from './rendering/host/iframeRenderHost';
import { getRenderTargetDisplayName } from './rendering/targetLabel';
import { supportsDiagramPreviewModal } from './ui/diagramPreview';
import {
    buildProviderDiagnosticFileName,
    buildProviderDiagnosticOperationInput,
    ProviderDiagnosticCallMode,
    runProviderDiagnosticProbe,
    runProviderDiagnosticStabilityProbe
} from './providerDiagnostics';

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

    private resolveExperimentalDiagramCompatibilityMode(requireMermaidOutput = false): 'legacy-mermaid' | 'best-fit' {
        if (requireMermaidOutput) {
            return 'legacy-mermaid';
        }

        return this.settings.experimentalDiagramCompatibilityMode;
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

    private async saveProviderDiagnosticReport(providerName: string, reportContent: string): Promise<string> {
        const baseFileName = buildProviderDiagnosticFileName(providerName, new Date());
        const existing = this.app.vault.getAbstractFileByPath(baseFileName);

        if (existing instanceof TFile) {
            await this.app.vault.modify(existing, reportContent);
            return existing.path;
        }

        const created = await this.app.vault.create(baseFileName, reportContent);
        return created.path;
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
                const tab = new NotemdSettingTab(this.app, this);
                await tab.exportProviderSettings();
            }
        });

        this.addCommand({
            id: 'import-provider-profiles',
            name: uiStrings.commands.importProviderProfiles,
            callback: async () => {
                const tab = new NotemdSettingTab(this.app, this);
                await tab.importProviderSettings();
            }
        });

        this.addCommand({
            id: 'export-cli-capability-manifest',
            name: 'Export CLI capability manifest',
            callback: async () => {
                const manifest = buildCliCapabilityManifest();
                const outputPath = `${this.app.vault.configDir}/plugins/${this.manifest.id}/notemd-cli-capabilities.json`;
                await this.app.vault.adapter.write(outputPath, JSON.stringify(manifest, null, 2));
                new Notice(`CLI capability manifest exported to ${outputPath}`);
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
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('process-current-add-links');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings(); // Load latest settings
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            this.updateStatusBar(this.getRunningActionText(`${actionLabel}: ${activeFile.name}`));

            // Pass the ref object for currentProcessingFileBasename
            const outputPath = await processFile(this.app, this.settings, activeFile, useReporter, this.currentProcessingFileBasename);
            if (outputPath && this.settings.autoMermaidFixAfterGenerate) {
                const outputFile = this.app.vault.getAbstractFileByPath(outputPath);
                if (outputFile instanceof TFile) {
                    await this.maybeAutoFixMermaidForFile(outputFile, useReporter, 'process current file');
                } else {
                    useReporter.log(`Skipped Mermaid auto-fix: output file not found at ${outputPath}`);
                }
            }

            const completeText = this.getActionCompleteText(actionLabel);
            this.updateStatusBar(completeText);
            useReporter.updateStatus(completeText, 100);
            new Notice(i18n.notices.processingComplete);
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during processing.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            console.error("Notemd Processing Error:", errorDetails);
            // Check if it's a cancellation error before showing notice/modal
            if (!errorMessage.includes("cancelled by user")) {
                new Notice(formatI18n(i18n.notices.processingError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.processing, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
            // Keep reporter open on error/cancellation
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    /** Command: Process Folder (Add Links) */

    private getBatchProgressStore(): BatchProgressStore {
        const vaultRoot = (this.app.vault.adapter as any).getBasePath?.() || (this.app.vault.adapter as any).basePath || '.';
        return new BatchProgressStore(vaultRoot);
    }

    async processFolderWithNotemdCommand(reporter?: ProgressReporter, folderPathOverride?: string) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('process-folder-add-links');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) {
                useReporter.log(i18n.notices.batchProcessingCancelled);
                useReporter.updateStatus(i18n.notices.batchProcessingCancelled, -1);
                throw new Error(i18n.notices.batchProcessingCancelled);
            }

            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof TFolder)) throw new Error(`Invalid folder selected: ${folderPath}`);

            const files = this.app.vault.getFiles().filter(f =>
                (f.extension === 'md' || f.extension === 'txt') &&
                (f.path === folderPath || f.path.startsWith(folderPath === '/' ? '' : folderPath + '/'))
            );

            if (files.length === 0) {
                const noFilesMessage = formatI18n(i18n.notices.noMarkdownOrTextFilesFoundSelectedFolder, { folderPath });
                new Notice(noFilesMessage);
                useReporter.log(noFilesMessage);
                useReporter.updateStatus(noFilesMessage, 100);
                if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                return; // Exit gracefully
            }

            this.updateStatusBar(this.getRunningActionText(actionLabel));
            useReporter.log(this.getRunningActionText(actionLabel));
            const errors: { file: string; message: string }[] = [];

            const batchId = `process-folder-${Date.now()}`;
            const progressStore = this.getBatchProgressStore();
            progressStore.start(batchId, 'process-folder', folderPath, files);

            if (!this.settings.enableBatchParallelism || this.settings.batchConcurrency <= 1) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (useReporter.cancelled) {
                        new Notice(i18n.notices.batchProcessingCancelled);
                        this.updateStatusBar(i18n.notices.batchProcessingCancelled);
                        useReporter.updateStatus(i18n.notices.batchProcessingCancelled, -1);
                        break;
                    }

                    const progress = Math.floor(((i) / files.length) * 100);
                    useReporter.updateStatus(this.getStepStatusText(i + 1, files.length, file.name), progress);

                    try {
                        // Pass the ref object
                        await processFile(this.app, this.settings, file, useReporter, this.currentProcessingFileBasename);
                        progressStore.markCompleted(file.path);
                    } catch (fileError: unknown) {
                        const message = fileError instanceof Error ? fileError.message : String(fileError);
                        const stack = fileError instanceof Error ? fileError.stack : undefined;
                        const errorMsg = `Error processing ${file.name}: ${message}`;
                        console.error(errorMsg, fileError);
                        useReporter.log(`❌ ${errorMsg}`);
                        errors.push({ file: file.name, message: message });
                        // Log silently
                        const timestamp = new Date().toISOString();
                        const logEntry = `[${timestamp}] Error processing ${file.path}:\nMessage: ${message}\nStack Trace:\n${stack || fileError}\n\n`;
                        try { await this.app.vault.adapter.append('error_processing_filename.log', logEntry); }
                        catch (logError) { console.error("Failed to write to error log:", logError); useReporter.log("⚠️ Failed to write error details to log file."); }
                        if (message.includes("cancelled by user")) break; // Exit loop on cancellation
                    }
                } // End loop
            } else {
                const concurrency = Math.min(this.settings.batchConcurrency, 20); // Cap
                const processor = createConcurrentProcessor(concurrency, this.settings.apiCallIntervalMs, useReporter);
                const fileBatches = chunkArray(files, this.settings.batchSize);
                let processedCount = 0;

                for (let b = 0; b < fileBatches.length; b++) {
                    const batch = fileBatches[b];
                    useReporter.log(`Processing batch ${b + 1}/${fileBatches.length} (${batch.length} files)`);
                    if (useReporter.cancelled) break;

                    const tasks = batch.map(file => async () => {
                        const fileProgressReporter: ProgressReporter = {
                            log: (msg: string) => useReporter.log(`[${file.name}] ${msg}`),
                            updateStatus: (msg: string, percentage?: number) => {
                                if (percentage !== undefined) {
                                    const overallProgress = Math.floor(((processedCount + (percentage / 100)) / files.length) * 100);
                                    useReporter.updateStatus(
                                        this.getStepStatusText(processedCount, files.length, `${file.name}: ${msg}`),
                                        overallProgress
                                    );
                                } else {
                                    useReporter.updateStatus(this.getStepStatusText(processedCount, files.length, `${file.name}: ${msg}`));
                                }
                            },
                            cancelled: useReporter.cancelled,
                            requestCancel: () => useReporter.requestCancel(),
                            clearDisplay: () => { },
                            abortController: useReporter.abortController,
                            activeTasks: useReporter.activeTasks,
                            updateActiveTasks: (delta: number) => useReporter.updateActiveTasks(delta),
                        };

                        try {
                            await processFile(this.app, this.settings, file, fileProgressReporter, this.currentProcessingFileBasename);
                            return { file, success: true };
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                            return { file, success: false, error: e };
                        }
                    });

                    const results = await processor(tasks);
                    processedCount += batch.length;

                    results.forEach(r => {
                        const result = r as { success: boolean; file: TFile; error?: any };
                        if (!result.success && result.error) {
                            const errorMessage = result.error.message || String(result.error);
                            errors.push({ file: result.file.name, message: errorMessage });
                        }
                    });

                    if (useReporter.cancelled) {
                        useReporter.log('Cancellation requested, stopping batch processing.');
                        break;
                    }

                    if (this.settings.batchInterDelayMs > 0 && b < fileBatches.length - 1) {
                        useReporter.log(`Delaying for ${this.settings.batchInterDelayMs}ms before next batch...`);
                        await delay(this.settings.batchInterDelayMs);
                    }
                }
            }
            if (!useReporter.cancelled) {
                const mermaidFixTargetFolder = (this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder)
                    ? this.settings.processedFileFolder
                    : folderPath;
                await this.maybeAutoFixMermaidForFolder(mermaidFixTargetFolder, useReporter, 'process folder');
            }

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(i18n.notices.batchProcessingFinishedWithErrors, { count: errors.length });
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(errorSummary); new Notice(errorSummary, 10000);
                } else {
                    const completeText = this.getActionCompleteText(actionLabel);
                    useReporter.updateStatus(completeText, 100); this.updateStatusBar(completeText);
                    new Notice(formatI18n(i18n.notices.batchProcessingSuccess, { count: files.length }), 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            }

        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during batch processing.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            console.error("Notemd Batch Processing Error:", errorDetails);
            // Check if it's a cancellation error before showing notice/modal
            if (!errorMessage.includes("cancelled")) {
                new Notice(formatI18n(i18n.notices.batchProcessingError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.batchProcessing, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Batch Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
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
            await this.loadSettings();
            const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
            if (!provider) throw new Error('No active provider configured');
            const providerI18n = this.getUiStrings().settings.providerConfig;

            const runningStatus = formatI18n(providerI18n.testConnectionRunning, { provider: provider.name });
            useReporter.log(runningStatus);
            useReporter.updateStatus(runningStatus, 50);
            const testingNotice = new Notice(formatI18n(providerI18n.testConnectionRunning, { provider: provider.name }), 0);

            const result = await testAPI(provider, this.settings.enableApiErrorDebugMode); // Use utility function
            testingNotice.hide();

            if (result.success) {
                const successStatus = formatI18n(providerI18n.testConnectionSuccess, { message: result.message });
                useReporter.log(successStatus);
                new Notice(successStatus, 5000);
                useReporter.updateStatus(successStatus, 100);
            } else {
                const failedStatus = formatI18n(providerI18n.testConnectionFailed, { message: result.message });
                useReporter.log(failedStatus);
                new Notice(failedStatus, 10000);
                useReporter.updateStatus(failedStatus, -1);
            }
        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during connection test.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            const providerI18n = this.getUiStrings().settings.providerConfig;
            useReporter.log(`❌ ${errorMessage}`);
            const errorStatus = formatI18n(providerI18n.testConnectionError, { message: errorMessage });
            new Notice(errorStatus, 10000);
            console.error('LLM Connection Test Error:', errorDetails); // Log details
            useReporter.updateStatus(errorStatus, -1);
            this.openLocalizedErrorModal(this.getUiStrings().errorModal.titles.llmConnectionTest, errorDetails);

            // Save error log
            await saveErrorLog(this.app, useReporter, error, this.settings);
        } finally {
            this.isBusy = false;
            // No need to call useReporter.updateButtonStates() here
        }
    }

    async runDeveloperProviderDiagnosticCommand(): Promise<void> {
        await this.loadSettings();
        const i18n = this.getUiStrings();
        const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);

        if (!provider) {
            new Notice(i18n.notices.noActiveProviderConfigured, 8000);
            return;
        }

        const input = buildProviderDiagnosticOperationInput(provider, this.settings);
        const timeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(input.timeoutMs);
        const callMode = input.callMode as ProviderDiagnosticCallMode;

        const result = await runProviderDiagnosticProbe(provider, this.settings, {
            callMode,
            timeoutMs
        });
        const reportPath = await this.saveProviderDiagnosticReport(provider.name, result.report);

        if (result.success) {
            new Notice(formatI18n(i18n.settings.developer.diagnosticSuccess, {
                callMode: result.callMode,
                path: reportPath
            }), 8000);
        } else {
            new Notice(formatI18n(i18n.settings.developer.diagnosticCapturedFailure, {
                callMode: result.callMode,
                path: reportPath
            }), 12000);
        }
    }

    async runDeveloperProviderStabilityDiagnosticCommand(): Promise<void> {
        await this.loadSettings();
        const i18n = this.getUiStrings();
        const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);

        if (!provider) {
            new Notice(i18n.notices.noActiveProviderConfigured, 8000);
            return;
        }

        const input = buildProviderDiagnosticOperationInput(provider, this.settings);
        const timeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(input.timeoutMs);
        const runs = this.sanitizeDeveloperDiagnosticRuns(input.stabilityRuns);
        const callMode = input.callMode as ProviderDiagnosticCallMode;

        const result = await runProviderDiagnosticStabilityProbe(provider, this.settings, {
            callMode,
            timeoutMs,
            runs
        });
        const reportPath = await this.saveProviderDiagnosticReport(`${provider.name}_stability`, result.report);

        new Notice(
            formatI18n(i18n.settings.developer.stabilityFinished, {
                callMode: result.callMode,
                successCount: result.successCount,
                runs: result.runs,
                path: reportPath
            }),
            12000
        );
    }

    /** Command: Generate Content from Title */
    async generateContentForTitleCommand(file: TFile, reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('generate-from-title');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, `${actionLabel}: ${file.name}`);
        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            await generateContentForTitle(this.app, this.settings, file, useReporter); // Call utility

            await this.maybeAutoFixMermaidForFile(file, useReporter, 'generate from title');

            const completeText = this.getActionCompleteText(actionLabel);
            this.updateStatusBar(completeText);
            useReporter.updateStatus(completeText, 100);
            new Notice(formatI18n(i18n.notices.contentGenerationSuccess, { file: file.name }));
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during content generation.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            // Check if it's a cancellation error before logging/showing modal
            if (!errorMessage.includes("cancelled by user")) {
                console.error(`Error generating content for ${file.name}:`, errorDetails);
                new Notice(formatI18n(i18n.notices.contentGenerationError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.contentGeneration, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error generating content for ${file.name}: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    /** Command: Research and Summarize Topic */
    async researchAndSummarizeCommand(editor: Editor, view: MarkdownView, reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('research-and-summarize');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        const activeFile = view.file;
        if (!activeFile) { new Notice(i18n.notices.noActiveFile); this.isBusy = false; return; }
        const selectedText = editor.getSelection();
        const topic = selectedText ? selectedText.trim() : activeFile.basename;
        if (!topic) { new Notice(i18n.notices.noTopicFound); this.isBusy = false; return; }

        this.updateStatusBar(this.getRunningActionText(`${actionLabel}: ${topic}`));
        useReporter.log(`Starting research for topic: "${topic}"`);
        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            // Assuming researchAndSummarize is now in searchUtils and takes app, settings
            await researchAndSummarize(this.app, this.settings, editor, view, useReporter); // Call utility
            if (activeFile instanceof TFile) {
                await this.maybeAutoFixMermaidForFile(activeFile, useReporter, 'research & summarize');
            }
            // Success/error handling is now within researchAndSummarize
            // Update status bar based on final reporter state?
            if (!useReporter.cancelled) {
                 this.updateStatusBar(this.getActionCompleteText(actionLabel));
            } else {
                 this.updateStatusBar(i18n.sidebar.status.processingStopped);
            }
        } catch (error: unknown) { // Changed to unknown, Catch errors propagated from researchAndSummarize
            let errorMessage = 'An unknown error occurred during research.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
             if (!errorMessage.includes("cancelled by user")) {
                console.error(`Error researching "${topic}":`, errorDetails);
                new Notice(formatI18n(i18n.notices.researchError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.research, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            // Reporter status should already be set by the utility function if it's used
            // If reporter wasn't used or failed early, log here
            if (!useReporter.cancelled) { // Avoid double logging cancellation
                 useReporter.log(`Error: ${errorMessage}`);
                 this.failReporterAction(useReporter, errorMessage);
            }
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    /** Command: Batch Generate Content from Titles */
    async batchGenerateContentForTitlesCommand(
        reporter?: ProgressReporter,
        folderPathOverride?: string
    ): Promise<{ sourceFolderPath: string; completeFolderPath: string } | null> {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return null; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('batch-generate-from-titles');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) {
                useReporter.log(i18n.notices.batchGenerationCancelled);
                useReporter.updateStatus(i18n.notices.batchGenerationCancelled, -1);
                throw new Error(i18n.notices.batchGenerationCancelled);
            }

            this.updateStatusBar(this.getRunningActionText(actionLabel));
            useReporter.log(this.getRunningActionText(actionLabel));

            const { errors } = await batchGenerateContentForTitles(this.app, this.settings, folderPath, useReporter); // Call utility

            const completeFolderPath = this.resolveCompleteFolderPath(folderPath);
            if (!completeFolderPath) {
                useReporter.log("Could not determine completed folder path for Mermaid fix.");
            } else {
                await this.maybeAutoFixMermaidForFolder(completeFolderPath, useReporter, 'batch generate from titles');
            }

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(i18n.notices.batchGenerationFinishedWithErrors, { count: errors.length });
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(errorSummary); new Notice(errorSummary, 10000);
                } else {
                    const completeText = this.getActionCompleteText(actionLabel);
                    useReporter.updateStatus(completeText, 100); this.updateStatusBar(completeText);
                    new Notice(formatI18n(i18n.notices.batchGenerationSuccess, { folderPath }), 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
                if (completeFolderPath) {
                    return {
                        sourceFolderPath: folderPath,
                        completeFolderPath
                    };
                }
            } else {
                 this.updateStatusBar(i18n.notices.batchGenerationCancelled);
                 new Notice(i18n.notices.batchGenerationCancelled);
            }

        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during batch generation.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                console.error("Notemd Batch Generation Error:", errorDetails);
                new Notice(formatI18n(i18n.notices.batchGenerationError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.batchGeneration, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Batch Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
        return null;
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
        if (this.isBusy) {
            new Notice(this.getUiStrings().notices.notemdBusy);
            return;
        }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('batch-translate-folder');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            let targetFolder = folder;
            if (!targetFolder) {
                const folderPath = await this.getFolderSelection();
                if (!folderPath) {
                    throw new Error("Folder selection cancelled.");
                }
                const abstractFile = this.app.vault.getAbstractFileByPath(folderPath);
                if (!(abstractFile instanceof TFolder)) {
                    throw new Error("Invalid folder selected.");
                }
                targetFolder = abstractFile;
            }
            const resolvedTargetFolder = targetFolder as TFolder;

            const translateLanguage = resolveTaskLanguageCode(this.settings, 'translate');
            await batchTranslateFolder(this.app, this.settings, resolvedTargetFolder, translateLanguage);
            if (!useReporter.cancelled) {
                const mermaidFixTarget = (this.settings.useCustomTranslationSavePath && this.settings.translationSavePath)
                    ? this.settings.translationSavePath
                    : resolvedTargetFolder.path;
                await this.maybeAutoFixMermaidForFolder(mermaidFixTarget, useReporter, 'batch translate folder');
            }

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during batch translation.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                new Notice(formatI18n(i18n.notices.batchTranslationFailedWithMessage, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.batchTranslation, errorMessage);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async translateFileCommand(file: TFile, signal?: AbortSignal, reporter?: ProgressReporter) {
        if (this.isBusy) {
            new Notice(this.getUiStrings().notices.notemdBusy);
            return;
        }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('translate-current-file');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, `${actionLabel}: ${file.name}`);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const translateLanguage = resolveTaskLanguageCode(this.settings, 'translate');
            const outputPath = await translateFile(this.app, this.settings, file, translateLanguage, useReporter, true, signal);
            if (outputPath && this.settings.autoMermaidFixAfterGenerate) {
                const outputFile = this.app.vault.getAbstractFileByPath(outputPath);
                if (outputFile instanceof TFile) {
                    await this.maybeAutoFixMermaidForFile(outputFile, useReporter, 'translate current file');
                }
            }

            // Update status and progress on success
            this.updateStatusBar(this.getActionCompleteText(actionLabel));
            useReporter.log("Translation complete.");
            useReporter.updateStatus(this.getActionCompleteText(actionLabel), 100);

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during translation.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            if (!errorMessage.includes("cancelled by user")) {
                console.error("Translation Error:", errorDetails);
                new Notice(formatI18n(i18n.notices.failedTranslateFileWithMessage, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.translation, errorDetails);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
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

    private async generateMermaidSummaryContent(
        fileContent: string,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter
    ): Promise<string> {
        if (!this.settings.enableExperimentalDiagramPipeline) {
            const prompt = this.getPromptForTask('summarizeToMermaid');
            return callLLM(provider, prompt, fileContent, this.settings, reporter, modelName);
        }

        reporter.log('Experimental diagram pipeline enabled. Attempting spec-first Mermaid generation.');

        try {
            const compatibilityMode = this.resolveExperimentalDiagramCompatibilityMode(true);
            if (this.settings.experimentalDiagramCompatibilityMode !== compatibilityMode) {
                reporter.log('Mermaid command pins experimental compatibility mode to legacy-mermaid to guarantee Mermaid output.');
            }

            const result = await generateDiagramArtifact(fileContent, {
                requestedIntent: this.settings.preferredDiagramIntent as DiagramIntent | undefined,
                compatibilityMode,
                targetLanguage: resolveTaskLanguageCode(this.settings, 'summarizeToMermaid'),
                llmInvoker: (systemPrompt, sourceMarkdown) =>
                    callLLM(provider, systemPrompt, sourceMarkdown, this.settings, reporter, modelName)
            });

            if (result.artifact.target !== 'mermaid') {
                throw new Error(`Experimental diagram pipeline returned unsupported target "${result.artifact.target}" for Mermaid command.`);
            }

            reporter.log(`Experimental diagram pipeline succeeded with intent "${result.spec.intent}" and target "${result.artifact.target}".`);
            return result.artifact.content;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            reporter.log(`Experimental diagram pipeline failed: ${message}`);
            reporter.log('Falling back to legacy Mermaid prompt and fixer pipeline.');
            const prompt = this.getPromptForTask('summarizeToMermaid');
            return callLLM(provider, prompt, fileContent, this.settings, reporter, modelName);
        }
    }

    private async generateDiagramOperation(
        input: DiagramOperationInput,
        settings: NotemdSettings,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter
    ) {
        if (input.outputMode === 'mermaid' && !settings.enableExperimentalDiagramPipeline) {
            const prompt = this.getPromptForTask('summarizeToMermaid');
            const mermaidContent = await callLLM(provider, prompt, input.sourceMarkdown, settings, reporter, modelName);
            return {
                plan: {
                    intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
                    confidence: 1,
                    reasons: ['legacy mermaid compatibility path'],
                    renderTarget: 'mermaid' as const,
                    fallbackTargets: [],
                    mermaidDiagramType: null,
                    legacyCompatibilityMode: true
                },
                spec: {
                    intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
                    title: input.sourcePath || 'Generated Diagram',
                    nodes: []
                },
                artifact: {
                    target: 'mermaid' as const,
                    content: mermaidContent,
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: (input.requestedIntent || 'mindmap') as DiagramIntent
                },
                renderError: undefined
            };
        }

        reporter.log(`Generating diagram operation in ${input.outputMode} mode.`);

        try {
            if (input.outputMode === 'mermaid' && settings.experimentalDiagramCompatibilityMode !== input.compatibilityMode) {
                reporter.log('Mermaid command pins experimental compatibility mode to legacy-mermaid to guarantee Mermaid output.');
            }

            return await generateDiagramArtifact(input.sourceMarkdown, {
                requestedIntent: input.requestedIntent,
                compatibilityMode: input.compatibilityMode,
                targetLanguage: input.targetLanguage,
                llmInvoker: (systemPrompt, sourceMarkdown) =>
                    callLLM(provider, systemPrompt, sourceMarkdown, settings, reporter, modelName)
            });
        } catch (error: unknown) {
            if (input.outputMode !== 'mermaid') {
                throw error;
            }

            const message = error instanceof Error ? error.message : String(error);
            reporter.log(`Experimental diagram pipeline failed: ${message}`);
            reporter.log('Falling back to legacy Mermaid prompt and fixer pipeline.');
            const prompt = this.getPromptForTask('summarizeToMermaid');
            const mermaidContent = await callLLM(provider, prompt, input.sourceMarkdown, settings, reporter, modelName);
            return {
                plan: {
                    intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
                    confidence: 1,
                    reasons: ['legacy mermaid fallback path'],
                    renderTarget: 'mermaid' as const,
                    fallbackTargets: [],
                    mermaidDiagramType: null,
                    legacyCompatibilityMode: true
                },
                spec: {
                    intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
                    title: input.sourcePath || 'Generated Diagram',
                    nodes: []
                },
                artifact: {
                    target: 'mermaid' as const,
                    content: mermaidContent,
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: (input.requestedIntent || 'mindmap') as DiagramIntent
                },
                renderError: undefined
            };
        }
    }

    private async generateExperimentalDiagramArtifact(
        fileContent: string,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter
    ) {
        return generateDiagramArtifact(fileContent, {
            requestedIntent: this.settings.preferredDiagramIntent as DiagramIntent | undefined,
            compatibilityMode: this.resolveExperimentalDiagramCompatibilityMode(),
            targetLanguage: resolveTaskLanguageCode(this.settings, 'summarizeToMermaid'),
            llmInvoker: (systemPrompt, sourceMarkdown) =>
                callLLM(provider, systemPrompt, sourceMarkdown, this.settings, reporter, modelName)
        });
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
        const result = await this.generateDiagramOperation(operationInput, this.settings, provider, modelName, reporter);
        const mermaidContent = result.artifact.content;
        reporter.updateStatus(this.getStepStatusText(2, 3, actionLabel), 90);

        const outputFilePath = await saveMermaidSummaryFile(this.app, this.settings, file, mermaidContent, reporter);
        if (this.settings.autoMermaidFixAfterGenerate) {
            const outputFile = this.app.vault.getAbstractFileByPath(outputFilePath);
            if (outputFile instanceof TFile) {
                await this.maybeAutoFixMermaidForFile(outputFile, reporter, 'summarise as mermaid');
            }
        }

        reporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
        reporter.log(`Mermaid diagram saved to: ${outputFilePath}`);
        new Notice(i18n.notices.mermaidSummarizationComplete);

        if (outputFilePath) {
            const newLeaf = this.app.workspace.getLeaf('split', 'vertical');
            const newFile = this.app.vault.getAbstractFileByPath(outputFilePath);
            if (newFile instanceof TFile) {
                newLeaf.openFile(newFile);
            }
        }
    }


    private extractVegaLiteFromMarkdown(content: string): string | null {
        const fenceRegex = /```vega-lite\s*\n([\s\S]*?)\n```/i;
        const match = content.match(fenceRegex);
        return match ? match[1].trim() : null;
    }

    private buildVegaLitePreviewArtifact(vlContent: string): RenderArtifact {
        return {
            target: 'vega-lite' as const,
            content: vlContent,
            mimeType: 'application/json' as const,
            sourceIntent: 'dataChart' as DiagramIntent
        };
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

        const result = await this.generateDiagramOperation(operationInput, this.settings, provider, modelName, reporter);

        if (result.renderError) {
            reporter.log(`Warning: ${result.renderError}`);
            new Notice(i18n.notices.experimentalDiagramManualFixHint, 8000);
        }

        if (executionMode === 'preview-artifact') {
            reporter.log(`Experimental diagram preview produced target "${result.artifact.target}" with intent "${result.spec.intent}".`);
            this.openDiagramPreviewModal(result.artifact, file.path, false);

            reporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
            reporter.log(`Experimental diagram preview opened for: ${file.path}`);
            new Notice(i18n.notices.experimentalDiagramPreviewReady);
            return;
        }

        reporter.log(`Experimental diagram pipeline produced target "${result.artifact.target}" with intent "${result.spec.intent}".`);
        reporter.updateStatus(this.getStepStatusText(2, totalSteps, actionLabel), 85);

        const outputFilePath = await saveDiagramArtifactFile(this.app, this.settings, file, result.artifact, reporter);
        if (result.artifact.target === 'mermaid' && this.settings.autoMermaidFixAfterGenerate) {
            const outputFile = this.app.vault.getAbstractFileByPath(outputFilePath);
            if (outputFile instanceof TFile) {
                await this.maybeAutoFixMermaidForFile(outputFile, reporter, 'experimental diagram generation');
            }
        }

        reporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
        reporter.log(`Experimental diagram saved to: ${outputFilePath}`);
        new Notice(i18n.notices.experimentalDiagramComplete);

        if (outputFilePath) {
            const newLeaf = this.app.workspace.getLeaf('split', 'vertical');
            const newFile = this.app.vault.getAbstractFileByPath(outputFilePath);
            if (newFile instanceof TFile) {
                newLeaf.openFile(newFile);
            }

            if (this.supportsDiagramPreview(result.artifact)) {
                this.openDiagramPreviewModal(result.artifact, outputFilePath, true);
            }
        }
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
            const vlContent = this.extractVegaLiteFromMarkdown(fileContent);
            if (!vlContent) {
                throw new Error("No \\`\\`\\`vega-lite code fence found in this file. Use the \"Generate diagram\" command first to create Vega-Lite content.");
            }

            const artifact = this.buildVegaLitePreviewArtifact(vlContent);
            this.openDiagramPreviewModal(artifact, file.path, false);

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
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('extract-concepts-current');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to extract concepts from.");
            }

            this.updateStatusBar(this.getRunningActionText(`${actionLabel}: ${activeFile.name}`));

            const concepts = await extractConceptsFromFile(this.app, this, activeFile, useReporter);

            if (concepts.size > 0) {
                useReporter.log(`Found ${concepts.size} concepts. Creating concept notes...`);
                await createConceptNotes(
                    this.app,
                    this.settings,
                    concepts,
                    activeFile.basename, // Pass the basename of the active file
                    {
                        disableBacklink: !this.settings.extractConceptsAddBacklink,
                        minimalTemplate: this.settings.extractConceptsMinimalTemplate
                    }
                );
                useReporter.updateStatus(this.getActionCompleteText(actionLabel), 100);
                new Notice(formatI18n(i18n.notices.conceptExtractionSuccess, { count: concepts.size }));
            } else {
                useReporter.updateStatus(i18n.notices.noConceptsFoundToExtract, 100);
                new Notice(i18n.notices.noConceptsFoundToExtract);
            }

            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during concept extraction.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled by user")) {
                new Notice(formatI18n(i18n.notices.conceptExtractionError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.conceptExtraction, errorMessage);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async batchExtractConceptsForFolderCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('extract-concepts-folder');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { throw new Error("Folder selection cancelled."); }

            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof TFolder)) throw new Error(`Invalid folder selected: ${folderPath}`);

            const files = this.app.vault.getFiles().filter(f =>
                (f.extension === 'md' || f.extension === 'txt') &&
                (f.path.startsWith(folderPath === '/' ? '' : folderPath + '/'))
            );

            if (files.length === 0) {
                new Notice(formatI18n(i18n.notices.noMarkdownOrTextFilesFoundSelectedFolder, { folderPath }));
                return;
            }

            this.updateStatusBar(this.getRunningActionText(actionLabel));
            useReporter.log(this.getRunningActionText(actionLabel));
            const errors: { file: string; message: string }[] = [];
            let totalConcepts = 0;

            if (!this.settings.enableBatchParallelism || this.settings.batchConcurrency <= 1) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (useReporter.cancelled) { new Notice(i18n.notices.batchExtractionCancelled); break; }

                    const progress = Math.floor(((i) / files.length) * 100);
                    useReporter.updateStatus(this.getStepStatusText(i + 1, files.length, file.name), progress);

                    try {
                        const concepts = await extractConceptsFromFile(this.app, this, file, useReporter);
                        if (concepts.size > 0) {
                            totalConcepts += concepts.size;
                            await createConceptNotes(
                                this.app,
                                this.settings,
                                concepts,
                                file.basename, // Pass the basename of the current file
                                {
                                    disableBacklink: !this.settings.extractConceptsAddBacklink,
                                    minimalTemplate: this.settings.extractConceptsMinimalTemplate
                                }
                            );
                        }
                    } catch (fileError: unknown) {
                        const message = fileError instanceof Error ? fileError.message : String(fileError);
                        errors.push({ file: file.name, message: message });
                        useReporter.log(`❌ Error processing ${file.name}: ${message}`);
                        if (message.includes("cancelled by user")) break;
                    }
                }
            } else {
                const concurrency = Math.min(this.settings.batchConcurrency, 20); // Cap
                const processor = createConcurrentProcessor(concurrency, this.settings.apiCallIntervalMs, useReporter);
                const fileBatches = chunkArray(files, this.settings.batchSize);
                let processedCount = 0;

                for (let b = 0; b < fileBatches.length; b++) {
                    const batch = fileBatches[b];
                    useReporter.log(`Processing batch ${b + 1}/${fileBatches.length} (${batch.length} files)`);
                    if (useReporter.cancelled) break;

                    const tasks = batch.map(file => async () => {
                        const fileProgressReporter: ProgressReporter = {
                            log: (msg: string) => useReporter.log(`[${file.name}] ${msg}`),
                            updateStatus: (msg: string, percentage?: number) => {
                                if (percentage !== undefined) {
                                    const overallProgress = Math.floor(((processedCount + (percentage / 100)) / files.length) * 100);
                                    useReporter.updateStatus(
                                        this.getStepStatusText(processedCount, files.length, `${file.name}: ${msg}`),
                                        overallProgress
                                    );
                                } else {
                                    useReporter.updateStatus(this.getStepStatusText(processedCount, files.length, `${file.name}: ${msg}`));
                                }
                            },
                            cancelled: useReporter.cancelled,
                            requestCancel: () => useReporter.requestCancel(),
                            clearDisplay: () => { },
                            abortController: useReporter.abortController,
                            activeTasks: useReporter.activeTasks,
                            updateActiveTasks: (delta: number) => useReporter.updateActiveTasks(delta),
                        };

                        try {
                            const concepts = await extractConceptsFromFile(this.app, this, file, fileProgressReporter);
                            if (concepts.size > 0) {
                                totalConcepts += concepts.size;
                                await createConceptNotes(
                                    this.app,
                                    this.settings,
                                    concepts,
                                    file.basename, // Pass the basename of the current file
                                    {
                                        disableBacklink: !this.settings.extractConceptsAddBacklink,
                                        minimalTemplate: this.settings.extractConceptsMinimalTemplate
                                    }
                                );
                            }
                            return { file, success: true };
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                            return { file, success: false, error: e };
                        }
                    });

                    const results = await processor(tasks);
                    processedCount += batch.length;

                    results.forEach(r => {
                        const result = r as { success: boolean; file: TFile; error?: any };
                        if (!result.success && result.error) {
                            const errorMessage = result.error.message || String(result.error);
                            errors.push({ file: result.file.name, message: errorMessage });
                        }
                    });

                    if (useReporter.cancelled) {
                        useReporter.log('Cancellation requested, stopping batch processing.');
                        break;
                    }

                    if (this.settings.batchInterDelayMs > 0 && b < fileBatches.length - 1) {
                        useReporter.log(`Delaying for ${this.settings.batchInterDelayMs}ms before next batch...`);
                        await delay(this.settings.batchInterDelayMs);
                    }
                }
            }


            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(i18n.notices.batchExtractionFinishedWithErrors, { count: errors.length });
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    new Notice(errorSummary, 10000);
                } else {
                    const successMessage = formatI18n(i18n.notices.batchExtractionSuccess, {
                        concepts: totalConcepts,
                        files: files.length
                    });
                    useReporter.updateStatus(successMessage, 100);
                    new Notice(successMessage);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            }

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during batch extraction.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                new Notice(formatI18n(i18n.notices.batchExtractionError, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.batchConceptExtraction, errorMessage);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Batch Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async extractConceptsAndGenerateTitlesCommand(reporter?: ProgressReporter) {
        if (this.isBusy) {
            new Notice(this.getUiStrings().notices.notemdBusy);
            return;
        }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const commandLabel = i18n.commands.extractConceptsAndGenerateTitles;

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, commandLabel);

        try {
            await this.extractConceptsCommand(useReporter);

            if (this.settings.useCustomConceptNoteFolder && this.settings.conceptNoteFolder) {
                const conceptFolder = this.app.vault.getAbstractFileByPath(this.settings.conceptNoteFolder);
                if (conceptFolder instanceof TFolder) {
                    await this.batchGenerateContentForTitlesCommand(useReporter);
                } else {
                    throw new Error("Concept note folder not found.");
                }
            } else {
                throw new Error("Concept note folder not set.");
            }

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during the process.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                new Notice(formatI18n(i18n.notices.genericErrorSeeConsoleForDetails, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.generic, errorMessage);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async extractOriginalTextCommand(reporter?: ProgressReporter) {
        if (this.isBusy) {
            new Notice(this.getUiStrings().notices.notemdBusy);
            return;
        }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        const actionLabel = this.getActionLabel('extract-original-text');

        const maybeSidebar = useReporter as any;
        this.startReporterAction(useReporter, actionLabel);

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            await extractOriginalText(this.app, this, activeFile, useReporter);

            useReporter.updateStatus(this.getActionCompleteText(actionLabel), 100);

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred during extraction.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled")) {
                new Notice(formatI18n(i18n.notices.genericErrorSeeConsoleForDetails, { message: errorMessage }), 10000);
                this.openLocalizedErrorModal(i18n.errorModal.titles.extraction, errorMessage);

                // Save error log
                await saveErrorLog(this.app, useReporter, error, this.settings);
            }
            useReporter.log(`Error: ${errorMessage}`);
            this.failReporterAction(useReporter, errorMessage);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

} // End of NotemdPlugin class
