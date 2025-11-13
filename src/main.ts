import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { NotemdSettings, ProgressReporter, LLMProviderConfig, TaskKey } from './types';
import { DEFAULT_SETTINGS, NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_DISPLAY_TEXT, NOTEMD_SIDEBAR_ICON } from './constants';
import { delay } from './utils';
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
    createConceptNotes
} from './fileUtils';
import { _performResearch, researchAndSummarize } from './searchUtils'; // Import _performResearch if needed directly, ensure researchAndSummarize is exported
import { ProgressModal } from './ui/ProgressModal';
import { ErrorModal } from './ui/ErrorModal';
import { NotemdSettingTab } from './ui/NotemdSettingTab';
import { showDeletionConfirmationModal } from './ui/modals'; // Import the modal function
import { NotemdSidebarView } from './ui/NotemdSidebarView';
import { translateFile } from './translate';
import { getSystemPrompt } from './promptUtils';

export default class NotemdPlugin extends Plugin {
    settings: NotemdSettings;
    statusBarItem: HTMLElement;
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

    async onload() {
        await this.loadSettings();

        // --- Sidebar View ---
        this.registerView(NOTEMD_SIDEBAR_VIEW_TYPE, (leaf) => new NotemdSidebarView(leaf, this));
		
		this.addCommand({
			id: 'notemd-summarize-as-mermaid',
			name: 'Summarise as Mermaid diagram',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = view.file;
				if (file) {
					const reporter = this.getReporter();
					await this.summarizeToMermaidCommand(file, reporter);
				}
			},
		});

		this.addRibbonIcon(NOTEMD_SIDEBAR_ICON, NOTEMD_SIDEBAR_DISPLAY_TEXT, () => {
			this.activateView();
		});

        // --- Status Bar ---
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar('Ready');

        // --- Command Palette Integration ---
        this.addCommand({
            id: 'process-with-notemd',
            name: 'Process current file (add links)',
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
            name: 'Process folder (add links)',
            callback: async () => {
                await this.processFolderWithNotemdCommand(); // Use the command handler method
            }
        });

        // Command to check duplicates in the current file (simple version)
        this.addCommand({
            id: 'check-for-duplicates',
            name: 'Check for duplicates in current file',
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
                                    const message = `Found ${duplicates.size} potential duplicate terms. Check console.`;
                                    new Notice(message);
                                    if (duplicates.size > 0) {
                                        console.log(`Potential duplicates in ${currentActiveFile.name}:`, Array.from(duplicates));
                                    }
                                } catch (error: unknown) {
                                    let errorMessage = 'An unknown error occurred while checking duplicates.';
                                    if (error instanceof Error) {
                                        errorMessage = error.message;
                                    }
                                    new Notice(`Error checking duplicates: ${errorMessage}`);
                                    console.error("Error checking duplicates:", error);
                                }
                            })();
                        } else if (!checking) { // If file became invalid between check and action
                             new Notice("No active '.md' or '.txt' file to check.");
                        }
                    }
                    return true;
                }
                return false;
            }
        });


        this.addCommand({
            id: 'test-llm-connection',
            name: 'Test LLM connection',
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
                    new Notice("No active LLM provider configured. Please check Notemd settings.");
                }
                return false;
            }
        });

        this.addCommand({
            id: 'generate-content-from-title',
            name: 'Generate content from note title',
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
                            new Notice('No active Markdown file selected or file changed.');
                        }
                    }
                    return true;
                }
                 if (!checking) {
                    new Notice('No active Markdown file selected.');
                }
                return false;
            }
        });

        this.addCommand({
            id: 'research-and-summarize-topic',
            name: 'Research and summarize topic',
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
                    } else {
                        new Notice('No active Markdown editor found.');
                    }
                    return true;
                }
                if (!checking) {
                    new Notice('No active Markdown editor found.');
                }
                return false;
            }
        });

        this.addCommand({
            id: 'batch-generate-content-from-titles',
            name: 'Batch generate content from titles',
            callback: async () => {
                await this.batchGenerateContentForTitlesCommand(); // Use the command handler method
            }
        });

        this.addCommand({
            id: 'check-and-remove-duplicate-concept-notes',
            name: 'Check and remove duplicate concept notes',
            callback: async () => {
                await this.checkAndRemoveDuplicateConceptNotesCommand(); // Use the command handler method
            }
        });

        this.addCommand({
            id: 'batch-mermaid-fix',
            name: 'Batch fix Mermaid syntax',
            callback: async () => {
                await this.batchMermaidFixCommand(); // Use the new command handler method
            }
        });

        this.addCommand({
            id: 'translate-file',
            name: 'Translate current file',
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
            name: 'Extract concepts (create concept notes only)',
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
            name: 'Batch extract concepts from folder',
            callback: async () => {
                await this.batchExtractConceptsForFolderCommand();
            }
        });

        // --- Settings Tab ---
        this.addSettingTab(new NotemdSettingTab(this.app, this));

        // --- Event Listeners ---
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            if (file instanceof TFile && file.extension === 'md') {
                handleFileRename(this.app, oldPath, file.path); // Call utility function
            }
        }));
        this.registerEvent(this.app.vault.on('delete', (file) => {
            if (file instanceof TFile && file.extension === 'md') {
                handleFileDelete(this.app, file.path); // Call utility function
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
                mergedProviders.push(defaultProvider);
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
        this.settings.extractConceptsProvider = this.settings.providers.some(p => p.name === this.settings.extractConceptsProvider) ? this.settings.extractConceptsProvider : this.settings.activeProvider;

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
            new Notice("Could not open Notemd sidebar.");
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
            const modal = new ProgressModal(this.app);
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
            modal.titleEl.setText('Select Folder');
            const selectEl = modal.contentEl.createEl('select');
            folders.forEach(folder => selectEl.createEl('option', { text: folder === '/' ? '(Vault Root)' : folder, value: folder }));
            const btnContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
            btnContainer.createEl('button', { text: 'Select', cls: 'mod-cta' }).onclick = () => { modal.close(); resolve(selectEl.value); };
            btnContainer.createEl('button', { text: 'Cancel' }).onclick = () => { modal.close(); resolve(null); };
            modal.open();
        });
    }

    log(message: string) {
        // Simple console log for now. Could be expanded to log to a file.
        console.log(`[Notemd] ${message}`);
    }

	getProviderAndModelForTask(taskKey: 'addLinks' | 'research' | 'generateTitle' | 'translate' | 'summarizeToMermaid' | 'extractConcepts'): { provider: LLMProviderConfig, modelName: string } {
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

    // --- Command Handler Methods ---
    // These methods contain the core logic initiated by commands or sidebar buttons.

    /** Command: Process Current File (Add Links) */
    async processWithNotemdCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Processing current file...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Processing current file...', 0);
        }

        try {
            await this.loadSettings(); // Load latest settings
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                throw new Error("No active '.md' or '.txt' file to process.");
            }

            this.updateStatusBar(`Processing: ${activeFile.name}`);

            // Pass the ref object for currentProcessingFileBasename
            await processFile(this.app, this.settings, activeFile, useReporter, this.currentProcessingFileBasename);

            this.updateStatusBar('Processing complete');
            useReporter.updateStatus('Processing complete!', 100);
            new Notice('Notemd processing complete!');
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
                new Notice(`Error during processing: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Notemd Processing Error", errorDetails).open();
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
    async processFolderWithNotemdCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Processing folder...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Processing folder...', 0);
        }

        try {
            await this.loadSettings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof TFolder)) throw new Error(`Invalid folder selected: ${folderPath}`);

            const files = this.app.vault.getFiles().filter(f =>
                (f.extension === 'md' || f.extension === 'txt') &&
                (f.path === folderPath || f.path.startsWith(folderPath === '/' ? '' : folderPath + '/'))
            );

            if (files.length === 0) {
                new Notice(`No '.md' or '.txt' files found in selected folder: ${folderPath}`);
                useReporter.log(`No eligible files found in "${folderPath}".`);
                useReporter.updateStatus('No files found', 100);
                if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                return; // Exit gracefully
            }

            this.updateStatusBar(`Batch processing ${files.length} files...`);
            useReporter.log(`Starting batch processing for ${files.length} files in "${folderPath}"...`);
            const errors: { file: string; message: string }[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (useReporter.cancelled) { new Notice('Batch processing cancelled.'); this.updateStatusBar('Cancelled'); useReporter.updateStatus('Cancelled', -1); break; }

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

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = `Batch processing finished with ${errors.length} error(s). Check 'error_processing_filename.log'.`;
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(`Batch complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    useReporter.updateStatus('Batch processing complete!', 100); this.updateStatusBar('Batch complete');
                    new Notice(`Successfully processed ${files.length} files.`, 5000);
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
                new Notice(`Error during batch processing: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Notemd Batch Processing Error", errorDetails).open();
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
        if (this.isBusy) { new Notice("Cannot test connection while processing."); return; }
        this.isBusy = true; // Prevent other actions during test
        const useReporter = reporter || this.getReporter();
        if (!reporter) useReporter.clearDisplay();

        try {
            await this.loadSettings();
            const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
            if (!provider) throw new Error('No active provider configured');

            useReporter.log(`Testing connection to ${provider.name}...`);
            useReporter.updateStatus(`Testing ${provider.name}...`, 50);
            const testingNotice = new Notice(`Testing connection to ${provider.name}...`, 0);

            const result = await testAPI(provider); // Use utility function
            testingNotice.hide();

            if (result.success) {
                useReporter.log(`✅ Success: ${result.message}`);
                new Notice(`✅ Success: ${result.message}`, 5000);
                useReporter.updateStatus("Connection successful!", 100);
            } else {
                useReporter.log(`❌ Failed: ${result.message}. Check console.`);
                new Notice(`❌ Failed: ${result.message}. Check console.`, 10000);
                useReporter.updateStatus("Connection failed.", -1);
            }
        } catch (error: unknown) { // Changed to unknown
            let errorMessage = 'An unknown error occurred during connection test.';
            let errorDetails = String(error);
            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || error.message;
            }
            useReporter.log(`❌ ${errorMessage}`);
            new Notice(errorMessage, 10000);
            console.error('LLM Connection Test Error:', errorDetails); // Log details
            useReporter.updateStatus("Connection test error.", -1);
            new ErrorModal(this.app, "LLM Connection Test Error", errorDetails).open();
        } finally {
            this.isBusy = false;
            // No need to call useReporter.updateButtonStates() here
        }
    }

    /** Command: Generate Content from Title */
    async generateContentForTitleCommand(file: TFile, reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
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
            await generateContentForTitle(this.app, this.settings, file, useReporter); // Call utility
            this.updateStatusBar('Generation complete');
            useReporter.updateStatus('Content generation complete!', 100);
            new Notice(`Content generated successfully for ${file.name}!`);
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
                new Notice(`Error generating content: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Content Generation Error", errorDetails).open();
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
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Researching and summarizing...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Researching and summarizing...', 0);
        }

        const activeFile = view.file;
        if (!activeFile) { new Notice('No active file.'); this.isBusy = false; return; }
        const selectedText = editor.getSelection();
        const topic = selectedText ? selectedText.trim() : activeFile.basename;
        if (!topic) { new Notice('No topic found (select text or use note title).'); this.isBusy = false; return; }

        this.updateStatusBar(`Researching: ${topic}`);
        useReporter.log(`Starting research for topic: "${topic}"`);
        try {
            await this.loadSettings();
            // Assuming researchAndSummarize is now in searchUtils and takes app, settings
            await researchAndSummarize(this.app, this.settings, editor, view, useReporter); // Call utility
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
                new Notice(`Error during research: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Research Error", errorDetails).open();
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
    async batchGenerateContentForTitlesCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch generating content...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch generating content...', 0);
        }

        try {
            await this.loadSettings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            this.updateStatusBar(`Batch generating...`);
            useReporter.log(`Starting batch generation for folder: "${folderPath}"...`);

            const { errors } = await batchGenerateContentForTitles(this.app, this.settings, folderPath, useReporter); // Call utility

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = `Batch generation finished with ${errors.length} error(s). Check 'error_processing_filename.log'.`;
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(`Batch generation complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    const fileCount = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folderPath === '/' ? '' : folderPath + '/')).length; // Re-count for notice
                    useReporter.updateStatus('Batch generation complete!', 100); this.updateStatusBar('Batch generation complete');
                    new Notice(`Successfully generated content for eligible files in "${folderPath}".`, 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
            } else {
                 this.updateStatusBar('Batch generation cancelled');
                 new Notice('Batch generation cancelled.');
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
                new Notice(`Error during batch generation: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Notemd Batch Generation Error", errorDetails).open();
            }
            useReporter.log(`Batch Error: ${errorMessage}`);
            useReporter.updateStatus('Error occurred during batch generation', -1);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    /** Command: Check and Remove Duplicate Concept Notes */
    async checkAndRemoveDuplicateConceptNotesCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
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
            new Notice(`Error checking/removing duplicates: ${errorMessage}. See console.`, 10000);
            useReporter.log(`Error: ${errorMessage}`);
            useReporter.updateStatus('Error occurred', -1);
            new ErrorModal(this.app, "Duplicate Check/Remove Error", errorDetails).open();
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }
    /** Command: Batch Fix Mermaid Syntax */
    async batchMermaidFixCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch fixing Mermaid syntax...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch fixing Mermaid syntax...', 0);
        }

        try {
            await this.loadSettings(); // Load settings in case needed by future logic
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { useReporter.log("Folder selection cancelled."); useReporter.updateStatus("Cancelled", -1); throw new Error("Folder selection cancelled."); }

            this.updateStatusBar(`Batch fixing Mermaid syntax...`);
            useReporter.log(`Starting batch Mermaid fix for folder: "${folderPath}"...`);

            const { errors, modifiedCount } = await batchFixMermaidSyntaxInFolder(this.app, folderPath, useReporter); // Call utility

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = `Batch Mermaid fix finished with ${errors.length} error(s). Modified ${modifiedCount} files. Check console/log.`;
                    useReporter.log(`⚠️ ${errorSummary}`); useReporter.updateStatus(errorSummary, -1);
                    this.updateStatusBar(`Batch fix complete with errors`); new Notice(errorSummary, 10000);
                } else {
                    const finalMessage = `Batch Mermaid fix complete! Modified ${modifiedCount} files.`;
                    useReporter.updateStatus(finalMessage, 100); this.updateStatusBar('Batch fix complete');
                    new Notice(finalMessage, 5000);
                    if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);
                }
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
                new Notice(`Error during batch fix: ${errorMessage}. See console.`, 10000);
                new ErrorModal(this.app, "Notemd Batch Mermaid Fix Error", errorDetails).open();
            }
            useReporter.log(`Batch Fix Error: ${errorMessage}`);
            useReporter.updateStatus('Error occurred during batch fix', -1);
        } finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
            this.isBusy = false;
        }
    }

    async translateFileCommand(file: TFile, signal?: AbortSignal, reporter?: ProgressReporter) {
        if (this.isBusy) {
            new Notice("Notemd is busy.");
            return;
        }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
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
            const translatedFilePath = await translateFile(this.app, this.settings, file, this.settings.language, useReporter, signal);
            
            // Update status and progress on success
            this.updateStatusBar("Translation complete");
            useReporter.log("Translation complete.");
            useReporter.updateStatus("Translation complete", 100);

            if (translatedFilePath) {
                // Open the translated file in a new pane
                const newLeaf = this.app.workspace.getLeaf('split', 'vertical');
                const translatedFile = this.app.vault.getAbstractFileByPath(translatedFilePath);
                if (translatedFile instanceof TFile) {
                    newLeaf.openFile(translatedFile);
                }
            }

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
                new Notice(`Failed to translate file: ${errorMessage}. See console for details.`, 10000);
                new ErrorModal(this.app, "Translation Error", errorDetails).open();
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
			new Notice('Another process is running. Please wait.');
			return;
		}
		this.isBusy = true;
        const useReporter = reporter || this.getReporter();

        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing(`Summarizing ${file.name}...`);
        } else {
            useReporter.clearDisplay();
		    reporter.log(`Starting Mermaid summarization for ${file.name}...`);
		    reporter.updateStatus(`Summarizing ${file.name}...`, 5);
        }

		try {
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

			reporter.updateStatus('Mermaid diagram saved successfully!', 100);
			reporter.log(`Mermaid diagram saved to: ${outputFilePath}`);
			new Notice('Mermaid diagram summarization complete!');

			// Open the new file in a split pane
			if (outputFilePath) {
				const newLeaf = this.app.workspace.getLeaf('split', 'vertical');
				const newFile = this.app.vault.getAbstractFileByPath(outputFilePath);
				if (newFile instanceof TFile) {
					newLeaf.openFile(newFile);
				}
			}

		} catch (error: any) {
			const message = error instanceof Error ? error.message : String(error);
			reporter.log(`Error during Mermaid summarization: ${message}`);
			reporter.updateStatus('Error during summarization.', -1);
			new Notice(`Summarization Error: ${message}`);
			console.error("Summarization Error:", error);
		} finally {
            if (maybeSidebar instanceof NotemdSidebarView) {
                maybeSidebar.finishProcessing();
            }
			this.isBusy = false;
		}
	}

    async extractConceptsCommand(reporter?: ProgressReporter) {
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Extracting concepts...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Extracting concepts...', 0);
        }

        try {
            await this.loadSettings();
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
                new Notice(`Concept extraction complete! Found and created ${concepts.size} concept notes.`);
            } else {
                useReporter.updateStatus('No concepts found.', 100);
                new Notice('No concepts found to extract.');
            }

            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error: unknown) {
            this.updateStatusBar('Error occurred');
            let errorMessage = 'An unknown error occurred during concept extraction.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (!errorMessage.includes("cancelled by user")) {
                new Notice(`Error during concept extraction: ${errorMessage}.`, 10000);
                new ErrorModal(this.app, "Concept Extraction Error", errorMessage).open();
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
        if (this.isBusy) { new Notice("Notemd is busy."); return; }
        this.isBusy = true;
        const useReporter = reporter || this.getReporter();
        
        const maybeSidebar = useReporter as any;
        if (maybeSidebar instanceof NotemdSidebarView) {
            maybeSidebar.startProcessing('Batch extracting concepts...');
        } else {
            useReporter.clearDisplay();
            useReporter.updateStatus('Batch extracting concepts...', 0);
        }

        try {
            await this.loadSettings();
            const folderPath = await this.getFolderSelection();
            if (!folderPath) { throw new Error("Folder selection cancelled."); }

            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof TFolder)) throw new Error(`Invalid folder selected: ${folderPath}`);

            const files = this.app.vault.getFiles().filter(f =>
                (f.extension === 'md' || f.extension === 'txt') &&
                (f.path.startsWith(folderPath === '/' ? '' : folderPath + '/'))
            );

            if (files.length === 0) {
                new Notice(`No '.md' or '.txt' files found in selected folder: ${folderPath}`);
                return;
            }

            this.updateStatusBar(`Batch extracting concepts from ${files.length} files...`);
            useReporter.log(`Starting batch concept extraction for ${files.length} files in "${folderPath}"...`);
            const errors: { file: string; message: string }[] = [];
            let totalConcepts = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (useReporter.cancelled) { new Notice('Batch extraction cancelled.'); break; }

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

            if (!useReporter.cancelled) {
                if (errors.length > 0) {
                    const errorSummary = `Batch extraction finished with ${errors.length} error(s).`;
                    useReporter.log(`⚠️ ${errorSummary}`);
                    useReporter.updateStatus(errorSummary, -1);
                    new Notice(errorSummary, 10000);
                } else {
                    const successMessage = `Batch extraction complete! Found ${totalConcepts} concepts across ${files.length} files.`;
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
                new Notice(`Error during batch extraction: ${errorMessage}.`, 10000);
                new ErrorModal(this.app, "Batch Concept Extraction Error", errorMessage).open();
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

} // End of NotemdPlugin class