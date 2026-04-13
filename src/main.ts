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
    extractConceptsFromFile,
    createConceptNotes,
    fixMermaidSyntaxInFile,
    saveErrorLog // Import
} from './fileUtils';
import { fixFormulaFormatsInFile, batchFixFormulaFormatsInFolder } from './formulaFixer';
import { _performResearch, researchAndSummarize } from './searchUtils'; // Import _performResearch if needed directly, ensure researchAndSummarize is exported
import { ProgressModal } from './ui/ProgressModal';
import { ErrorModal } from './ui/ErrorModal';
import { NotemdSettingTab } from './ui/NotemdSettingTab';
import { showDeletionConfirmationModal } from './ui/modals'; // Import the modal function
import { NotemdSidebarView } from './ui/NotemdSidebarView';
import { translateFile, batchTranslateFolder } from './translate';
import { getSystemPrompt } from './promptUtils';
import { extractOriginalText } from './extractOriginalText';
import { formatI18n, getI18nStrings } from './i18n';
import { resolveTaskLanguageCode } from './i18n/taskLanguagePolicy';
import { getSidebarActionLabel } from './workflowButtons';

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

    async onload() {
        await this.loadSettings();
        const uiStrings = this.getUiStrings();

        // --- Sidebar View ---
        this.registerView(NOTEMD_SIDEBAR_VIEW_TYPE, (leaf) => new NotemdSidebarView(leaf, this));
		
		this.addCommand({
			id: 'notemd-summarize-as-mermaid',
			name: getSidebarActionLabel(uiStrings, 'summarize-as-mermaid'),
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = view.file;
				if (file) {
					const reporter = this.getReporter();
					await this.summarizeToMermaidCommand(file, reporter);
				}
			},
		});

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

                    reporter.updateStatus('Wiki-Link & Generation complete!', 100);
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
        await this.saveData(this.settings);
    }

    // --- UI and Status ---
    updateStatusBar(text: string) {
        if (this.statusBarItem) {
            this.statusBarItem.setText(`Notemd: ${text}`);
        }
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Processing current file...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Processing current file...', 0);
        }

        try {
            await this.loadSettings(); // Load latest settings
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            this.updateStatusBar(`Processing: ${activeFile.name}`);

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

            this.updateStatusBar('Processing complete');
            useReporter.updateStatus('Processing complete!', 100);
            new Notice(i18n.notices.processingComplete);
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error occurred');
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
            useReporter.updateStatus('Error occurred', -1);
            // Keep reporter open on error/cancellation
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    /** Command: Process Folder (Add Links) */
    async processFolderWithNotemdCommand(reporter?: ProgressReporter, folderPathOverride?: string) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Processing folder...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Processing folder...', 0);
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof TFolder)) throw new Error(`Invalid folder selected: ${folderPath}`);

            const files = this.app.vault.getFiles().filter(f =>
                (f.extension === 'md' || f.extension === 'txt') &&
                (f.path === folderPath || f.path.startsWith(folderPath === '/' ? '' : folderPath + '/'))
            );

            if (files.length === 0) {
                new Notice(formatI18n(i18n.notices.noMarkdownOrTextFilesFoundSelectedFolder, { folderPath }));
                useReporter.log(`No eligible files found in "${folderPath}".`);
                useReporter.updateStatus('No files found', 100);
                if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                return; // Exit gracefully
            }

            this.updateStatusBar(`Batch processing ${files.length} files...`);
            useReporter.log(`Starting batch processing for ${files.length} files in "${folderPath}"...`);
            const errors: { file: string; message: string }[] = [];

            if (!this.settings.enableBatchParallelism || this.settings.batchConcurrency <= 1) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (useReporter.cancelled) { new Notice(i18n.notices.batchProcessingCancelled); this.updateStatusBar('Cancelled'); useReporter.updateStatus('Cancelled', -1); break; }

                    const progress = Math.floor(((i) / files.length) * 100);
                    useReporter.updateStatus(`Processing ${i + 1}/${files.length}: ${file.name}`, progress);

                    try {
                        // Pass the ref object
                        await processFile(this.app, this.settings, file, useReporter, this.currentProcessingFileBasename);
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
                                    useReporter.updateStatus(`Batch: ${processedCount}/${files.length} (${file.name}: ${msg})`, overallProgress);
                                } else {
                                    useReporter.updateStatus(`Batch: ${processedCount}/${files.length} (${file.name}: ${msg})`);
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
                    this.updateStatusBar(`Batch complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    useReporter.updateStatus('Batch processing complete!', 100); this.updateStatusBar('Batch complete');
                    new Notice(formatI18n(i18n.notices.batchProcessingSuccess, { count: files.length }), 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            }

        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error occurred');
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
            useReporter.updateStatus('Error occurred during batch processing', -1);
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

            useReporter.log(`Testing connection to ${provider.name}...`);
            useReporter.updateStatus(`Testing ${provider.name}...`, 50);
            const testingNotice = new Notice(formatI18n(providerI18n.testConnectionRunning, { provider: provider.name }), 0);

            const result = await testAPI(provider, this.settings.enableApiErrorDebugMode); // Use utility function
            testingNotice.hide();

            if (result.success) {
                useReporter.log(`✅ Success: ${result.message}`);
                new Notice(formatI18n(providerI18n.testConnectionSuccess, { message: result.message }), 5000);
                useReporter.updateStatus("Connection successful!", 100);
            } else {
                useReporter.log(`❌ Failed: ${result.message}. Check console.`);
                new Notice(formatI18n(providerI18n.testConnectionFailed, { message: result.message }), 10000);
                useReporter.updateStatus("Connection failed.", -1);
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
            new Notice(formatI18n(providerI18n.testConnectionError, { message: errorMessage }), 10000);
            console.error('LLM Connection Test Error:', errorDetails); // Log details
            useReporter.updateStatus("Connection test error.", -1);
            this.openLocalizedErrorModal(this.getUiStrings().errorModal.titles.llmConnectionTest, errorDetails);
            
            // Save error log
            await saveErrorLog(this.app, useReporter, error, this.settings);
        } finally {
            this.isBusy = false;
            // No need to call useReporter.updateButtonStates() here
        }
    }

    /** Command: Generate Content from Title */
    async generateContentForTitleCommand(file: TFile, reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing(`Generating: ${file.name}`);
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus(`Generating: ${file.name}`, 0);
        }

        this.updateStatusBar(`Generating: ${file.name}`);
        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            await generateContentForTitle(this.app, this.settings, file, useReporter); // Call utility

            await this.maybeAutoFixMermaidForFile(file, useReporter, 'generate from title');

            this.updateStatusBar('Generation complete');
            useReporter.updateStatus('Content generation complete!', 100);
            new Notice(formatI18n(i18n.notices.contentGenerationSuccess, { file: file.name }));
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error during generation');
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
            useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Researching and summarizing...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Researching and summarizing...', 0);
        }

        const activeFile = view.file;
        if (!activeFile) { new Notice(i18n.notices.noActiveFile); this.isBusy = false; return; }
        const selectedText = editor.getSelection();
        const topic = selectedText ? selectedText.trim() : activeFile.basename;
        if (!topic) { new Notice(i18n.notices.noTopicFound); this.isBusy = false; return; }

        this.updateStatusBar(`Researching: ${topic}`);
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
                 this.updateStatusBar('Research complete');
            } else {
                 this.updateStatusBar('Research cancelled');
            }
        } catch (error: unknown) { // Changed to unknown, Catch errors propagated from researchAndSummarize
            this.updateStatusBar('Error during research');
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
                 useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch generating content...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch generating content...', 0);
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            this.updateStatusBar(`Batch generating...`);
            useReporter.log(`Starting batch generation for folder: "${folderPath}"...`);

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
                    this.updateStatusBar(`Batch generation complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    useReporter.updateStatus('Batch generation complete!', 100); this.updateStatusBar('Batch generation complete');
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
                 this.updateStatusBar('Batch generation cancelled');
                 new Notice(i18n.notices.batchGenerationCancelled);
            }

        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error during batch generation');
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
            useReporter.updateStatus('Error occurred during batch generation', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Checking duplicates...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Checking duplicates...', 0);
        }

        this.updateStatusBar("Checking duplicates...");
        useReporter.log("Starting: Check & Remove Duplicate Concept Notes...");
        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            await checkAndRemoveDuplicateConceptNotes(this.app, this.settings, useReporter); // Call utility
            // Status is updated within the utility function
            this.updateStatusBar("Duplicate check complete.");
        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error during duplicate check');
            let errorMessage = 'An unknown error occurred during duplicate check.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            console.error("Error checking/removing duplicate concept notes:", errorDetails);
            new Notice(formatI18n(i18n.notices.duplicateCheckRemoveError, { message: errorMessage }), 10000);
            useReporter.log(`Error: ${errorMessage}`);
            useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch fixing Mermaid syntax...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch fixing Mermaid syntax...', 0);
        }

        try {
            await this.loadSettings(); // Load settings in case needed by future logic
            i18n = this.getUiStrings();
            const folderPath = folderPathOverride ?? await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            this.updateStatusBar(`Batch fixing Mermaid syntax...`);
            useReporter.log(`Starting batch Mermaid fix for folder: "${folderPath}"...`);

            const { errors, modifiedCount } = await batchFixMermaidSyntaxInFolder(this.app, this.settings, folderPath, useReporter); // Call utility

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = formatI18n(i18n.notices.batchMermaidFixFinishedWithErrors, {
                        count: errors.length,
                        modifiedCount
                    });
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(`Batch fix complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    const finalMessage = formatI18n(i18n.notices.batchMermaidFixSuccess, { modifiedCount });
                    useReporter.updateStatus(finalMessage, 100); this.updateStatusBar('Batch fix complete');
                    new Notice(finalMessage, 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
                return { folderPath, modifiedCount };
            }

        } catch (error: unknown) { // Changed to unknown
            this.updateStatusBar('Error during batch fix');
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
            useReporter.updateStatus('Error occurred during batch fix', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing(`Fixing formulas in ${file.name}...`);
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus(`Fixing formulas in ${file.name}...`, 0);
        }

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
            useReporter.updateStatus('Formula fix complete!', 100);
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 1000);

        } catch (error: unknown) {
            this.updateStatusBar('Error during formula fix');
            let errorMessage = 'An unknown error occurred.';
            if (error instanceof Error) errorMessage = error.message;
            
            useReporter.log(`Error: ${errorMessage}`);
            useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch fixing formula formats...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch fixing formula formats...', 0);
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Cancelled"); }

            const { modifiedCount, errors } = await batchFixFormulaFormatsInFolder(this.app, folderPath, useReporter);

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const msg = formatI18n(i18n.notices.batchFormulaFixFinishedWithErrors, {
                        count: errors.length,
                        modifiedCount
                    });
                    useReporter.log(msg);
                    useReporter.updateStatus('Finished with errors', -1);
                    new Notice(msg);
                } else {
                    const msg = formatI18n(i18n.notices.batchFormulaFixSuccess, { modifiedCount });
                    useReporter.log(msg);
                    useReporter.updateStatus('Complete', 100);
                    new Notice(msg);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            }
        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred.';
            if (error instanceof Error) errorMessage = error.message;
            if (!errorMessage.includes("Cancelled")) {
                useReporter.log(`Error: ${errorMessage}`);
                useReporter.updateStatus('Error occurred', -1);
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

        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing("Batch translating...");
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus("Batch translating...", 0);
        }

        this.updateStatusBar("Batch translating...");

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
            this.updateStatusBar("Batch translation failed");
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
            useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing("Translating...");
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus("Translating...", 0);
        }

        this.updateStatusBar("Translating...");

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
            this.updateStatusBar("Translation complete");
            useReporter.log("Translation complete.");
            useReporter.updateStatus("Translation complete", 100);

        } catch (error: unknown) {
            this.updateStatusBar("Translation failed");
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
            useReporter.updateStatus('Error occurred', -1);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

	async summarizeToMermaidCommand(file: TFile, reporter: ProgressReporter) {
		if (this.isBusy) {
			new Notice(this.getUiStrings().notices.anotherProcessRunning);
			return;
		}
		this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();

        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing(`Summarizing ${file.name}...`);
        } else {
            useReporter.clearDisplay();
		    reporter.log(`Starting Mermaid summarization for ${file.name}...`);
		    reporter.updateStatus(`Summarizing ${file.name}...`, 5);
        }

		try {
            await this.loadSettings();
            i18n = this.getUiStrings();
			const fileContent = await this.app.vault.read(file);
			if (!fileContent.trim()) {
				throw new Error("File is empty. Cannot summarize.");
			}

			const { provider, modelName } = this.getProviderAndModelForTask('summarizeToMermaid');
			reporter.log(`Using provider: ${provider.name}, Model: ${modelName}`);

			const prompt = this.getPromptForTask('summarizeToMermaid');

            reporter.updateStatus('Calling LLM for summarization...', 20);
            const mermaidContent = await callLLM(provider, prompt, fileContent, this.settings, reporter, modelName);
            reporter.updateStatus('LLM call complete. Processing response...', 90);

			const outputFilePath = await saveMermaidSummaryFile(this.app, this.settings, file, mermaidContent, reporter);
            if (this.settings.autoMermaidFixAfterGenerate) {
                const outputFile = this.app.vault.getAbstractFileByPath(outputFilePath);
                if (outputFile instanceof TFile) {
                    await this.maybeAutoFixMermaidForFile(outputFile, reporter, 'summarise as mermaid');
                }
            }

			reporter.updateStatus('Mermaid diagram saved successfully!', 100);
			reporter.log(`Mermaid diagram saved to: ${outputFilePath}`);
			new Notice(i18n.notices.mermaidSummarizationComplete);

			// Open the new file in a split pane
			if (outputFilePath) {
				const newLeaf = this.app.workspace.getLeaf('split', 'vertical');
				const newFile = this.app.vault.getAbstractFileByPath(outputFilePath);
				if (newFile instanceof TFile) {
					newLeaf.openFile(newFile);
				}
			}

		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			reporter.log(`Error during Mermaid summarization: ${message}`);
			reporter.updateStatus('Error during summarization.', -1);
			new Notice(formatI18n(i18n.notices.mermaidSummarizationError, { message }));
			console.error("Summarization Error:", error);
            
            // Save error log
            await saveErrorLog(this.app, reporter, error, this.settings);
		} finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
			this.isBusy = false;
		}
	}

    async extractConceptsCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice(this.getUiStrings().notices.notemdBusy); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        let i18n = this.getUiStrings();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Extracting concepts...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Extracting concepts...', 0);
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to extract concepts from.");
            }

            this.updateStatusBar(`Extracting concepts: ${activeFile.name}`);

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
                useReporter.updateStatus('Concept extraction complete!', 100);
                new Notice(formatI18n(i18n.notices.conceptExtractionSuccess, { count: concepts.size }));
            } else {
                useReporter.updateStatus('No concepts found.', 100);
                new Notice(i18n.notices.noConceptsFoundToExtract);
            }

            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error: unknown) {
            this.updateStatusBar('Error occurred');
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
            useReporter.updateStatus('Error occurred', -1);
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
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch extracting concepts...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch extracting concepts...', 0);
        }

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

            this.updateStatusBar(`Batch extracting concepts from ${files.length} files...`);
            useReporter.log(`Starting batch concept extraction for ${files.length} files in "${folderPath}"...`);
            const errors: { file: string; message: string }[] = [];
            let totalConcepts = 0;

            if (!this.settings.enableBatchParallelism || this.settings.batchConcurrency <= 1) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (useReporter.cancelled) { new Notice(i18n.notices.batchExtractionCancelled); break; }

                    const progress = Math.floor(((i) / files.length) * 100);
                    useReporter.updateStatus(`Processing ${i + 1}/${files.length}: ${file.name}`, progress);

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
                                    useReporter.updateStatus(`Batch: ${processedCount}/${files.length} (${file.name}: ${msg})`, overallProgress);
                                } else {
                                    useReporter.updateStatus(`Batch: ${processedCount}/${files.length} (${file.name}: ${msg})`);
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
            this.updateStatusBar('Error occurred');
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
            useReporter.updateStatus('Error occurred', -1);
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

        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing("Extracting concepts and generating titles...");
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus("Extracting concepts and generating titles...", 0);
        }

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
            this.updateStatusBar("Error occurred");
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
            useReporter.updateStatus('Error occurred', -1);
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

        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing("Extracting specific original text...");
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus("Extracting specific original text...", 0);
        }

        try {
            await this.loadSettings();
            i18n = this.getUiStrings();
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            await extractOriginalText(this.app, this, activeFile, useReporter);
            
            useReporter.updateStatus('Extraction complete!', 100);

        } catch (error: unknown) {
            this.updateStatusBar("Error occurred");
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
            useReporter.updateStatus('Error occurred', -1);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

} // End of NotemdPlugin class
