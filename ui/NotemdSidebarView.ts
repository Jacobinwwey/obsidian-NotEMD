import { ItemView, WorkspaceLeaf, MarkdownView, Notice, TFile, TFolder, Editor } from 'obsidian'; // Added Editor
import NotemdPlugin from '../main'; // Import the plugin class
import { ProgressReporter } from '../types';
import { NOTEMD_SIDEBAR_VIEW_TYPE, NOTEMD_SIDEBAR_DISPLAY_TEXT, NOTEMD_SIDEBAR_ICON } from '../constants';
import { ErrorModal } from './ErrorModal'; // Import ErrorModal
import { findDuplicates } from '../fileUtils'; // Import findDuplicates utility

// NotemdSidebarView now implements ProgressReporter
export class NotemdSidebarView extends ItemView implements ProgressReporter {
    plugin: NotemdPlugin; // Reference to the main plugin
    // UI Elements for progress display
    private statusEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private progressBarContainerEl: HTMLElement | null = null;
    private timeRemainingEl: HTMLElement | null = null;
    private logEl: HTMLElement | null = null;
    private logContent: string[] = []; // Store log messages
    private startTime: number = 0;
    private isProcessing: boolean = false; // Track if processing is active
    private isCancelled: boolean = false; // Track cancellation state
    // Store the AbortController for the current operation
    private currentAbortController: AbortController | null = null;
    private activeLeafChangeHandler: (() => void) | null = null; // Store handler reference

    // --- Button References ---
    private processCurrentButton: HTMLButtonElement | null = null;
    private processFolderButton: HTMLButtonElement | null = null;
    private researchButton: HTMLButtonElement | null = null;
    private generateTitleButton: HTMLButtonElement | null = null;
    private batchGenerateTitleButton: HTMLButtonElement | null = null;
    private checkDuplicatesButton: HTMLButtonElement | null = null;
    private testConnectionButton: HTMLButtonElement | null = null;
    private checkRemoveDuplicatesButton: HTMLButtonElement | null = null;
    private batchMermaidFixButton: HTMLButtonElement | null = null; // Added
    private cancelButton: HTMLButtonElement | null = null;
    private translateButton: HTMLButtonElement | null = null;
    private languageSelector: HTMLSelectElement | null = null;

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

    // Method to clear progress/log display
    clearDisplay() {
        console.log('clearDisplay called.');
        this.logContent = [];
        if (this.logEl) this.logEl.empty();
        if (this.statusEl) this.statusEl.setText('Ready');
        if (this.progressEl) {
            this.progressEl.dataset.progress = '0'; // Set data attribute
            this.progressEl.setText('');
            this.progressEl.removeClass('is-error');
        }
        if (this.timeRemainingEl) this.timeRemainingEl.setText('');
        if (this.progressBarContainerEl) this.progressBarContainerEl.addClass('is-hidden');
        if (this.cancelButton) {
            this.cancelButton.disabled = true; // Cancel button disabled when not processing
            this.cancelButton.removeClass('is-active');
        }
        this.isProcessing = false;
        this.isCancelled = false;
        this.startTime = 0;
        this.currentAbortController = null;
        this.updateButtonStates(); // Update button states after clearing
    }

    // Method to update status display
    updateStatus(text: string, percent?: number) {
        if (this.statusEl) this.statusEl.setText(text);
        if (this.cancelButton && this.isProcessing && !this.isCancelled) { // Enable cancel only when processing and not cancelled
            this.cancelButton.disabled = false;
            this.cancelButton.addClass('is-active');
        } else if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.removeClass('is-active');
        }

        if (percent !== undefined && this.progressEl && this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            if (percent >= 0) {
                const clampedPercent = Math.min(100, Math.max(0, percent));
                // REMOVED: this.progressEl.style.setProperty('--notemd-progress-percent', `${clampedPercent}%`);
                this.progressEl.dataset.progress = String(clampedPercent); // Store progress in data attribute
                this.progressEl.setText(`${Math.round(clampedPercent)}%`);
                this.progressEl.removeClass('is-error');

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
            } else { // Handle negative percent for error/cancel state
                // REMOVED: this.progressEl.style.setProperty('--notemd-progress-percent', `100%`);
                this.progressEl.dataset.progress = '100'; // Set data attribute for error state
                this.progressEl.addClass('is-error');
                this.progressEl.setText('Cancelled/Error');
                if (this.timeRemainingEl) this.timeRemainingEl.setText('Processing stopped.');
            }
        }
    }

    // Method to add log messages
    log(message: string) {
        if (this.logEl) {
            const timestamp = `[${new Date().toLocaleTimeString()}]`;
            const fullMessage = `${timestamp} ${message}`;
            this.logContent.push(fullMessage);

            const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
            entry.createEl('span', { text: timestamp, cls: 'notemd-log-time' });
            entry.createEl('span', { text: ` ${message}`, cls: 'notemd-log-message' });
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    // Helper to format time
    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    // Getter for cancellation status
    get cancelled() {
        return this.isCancelled;
    }

    // Method to handle cancellation request
    requestCancel() {
        console.log(`requestCancel called. isProcessing: ${this.isProcessing}, isCancelled: ${this.isCancelled}`);
        if (this.isProcessing && !this.isCancelled) {
            this.isCancelled = true;
            this.updateStatus('Cancelling...', -1);
            this.log('User requested cancellation.');
            this.currentAbortController?.abort();
            this.updateButtonStates(); // Update states after requesting cancel
        }
    }

    // Implement the abortController property from the interface
    get abortController(): AbortController | null | undefined {
        return this.currentAbortController;
    }
    set abortController(controller: AbortController | null | undefined) {
        this.currentAbortController = controller ?? null;
    }

    // --- Centralized Button State Management ---
    private updateButtonStates() {
        console.log(`updateButtonStates called. isProcessing: ${this.isProcessing}, isCancelled: ${this.isCancelled}`);
        const processing = this.isProcessing;
        const cancelled = this.isCancelled;

        // Action buttons disabled during processing
        if (this.processCurrentButton) this.processCurrentButton.disabled = processing;
        if (this.processFolderButton) this.processFolderButton.disabled = processing;
        if (this.researchButton) this.researchButton.disabled = processing || !this.app.workspace.getActiveViewOfType(MarkdownView);
        if (this.generateTitleButton) this.generateTitleButton.disabled = processing;
        if (this.batchGenerateTitleButton) this.batchGenerateTitleButton.disabled = processing;
        if (this.checkDuplicatesButton) this.checkDuplicatesButton.disabled = processing;
        if (this.testConnectionButton) this.testConnectionButton.disabled = processing;
        if (this.checkRemoveDuplicatesButton) this.checkRemoveDuplicatesButton.disabled = processing;
        if (this.batchMermaidFixButton) this.batchMermaidFixButton.disabled = processing; // Added
        if (this.translateButton) this.translateButton.disabled = processing;

        // Cancel button enabled only during processing and before cancellation
        if (this.cancelButton) {
            this.cancelButton.disabled = !processing || cancelled;
            if (!processing || cancelled) {
                this.cancelButton.removeClass('is-active');
            } else {
                this.cancelButton.addClass('is-active');
            }
        }
        this.updateResearchButtonState(); // Update research button specific state
    }
    // --- End Button State Management ---

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('notemd-sidebar-container');

        container.createEl("h4", { text: "Original processing" });
        const originalButtonGroup = container.createDiv({ cls: 'notemd-button-group' });

        this.processCurrentButton = originalButtonGroup.createEl('button', { text: 'Process file (add links)', cls: 'mod-cta' });
        this.processCurrentButton.title = 'Processes the current file to add [[wiki-links]] and create concept notes.';
        this.processCurrentButton.onclick = async () => {
            if (this.isProcessing) return;
            this.clearDisplay();
            this.currentAbortController = new AbortController(); // Create new controller
            this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
            this.log('Starting: Process Current File...'); this.updateStatus('Processing current file...', 0);
            try { await this.plugin.processWithNotemdCommand(this); } // Use plugin method
            finally { this.isProcessing = false; this.updateButtonStates(); }
        };

        this.processFolderButton = originalButtonGroup.createEl('button', { text: 'Process folder (add links)' });
        this.processFolderButton.title = 'Processes all files in a selected folder to add [[wiki-links]] and create concept notes.';
        this.processFolderButton.onclick = async () => {
            if (this.isProcessing) return;
            this.clearDisplay();
            this.currentAbortController = new AbortController(); // Create new controller
            this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
            this.log('Starting: Process Folder...'); this.updateStatus('Processing folder...', 0);
            try { await this.plugin.processFolderWithNotemdCommand(this); } // Use plugin method
            finally { this.isProcessing = false; this.updateButtonStates(); }
        };

        container.createEl('h4', { text: "New features" });
        const newFeatureButtonGroup = container.createDiv({ cls: 'notemd-button-group' });

        this.researchButton = newFeatureButtonGroup.createEl('button', { text: 'Research & summarize' });
        this.researchButton.title = 'Uses the current note title or selection for web search and appends an LLM summary.';
        this.researchButton.onclick = async () => {
            if (this.isProcessing || this.plugin.getIsBusy()) { new Notice('Processing already in progress.'); return; }

            // Get active file like 'Process File' button
            const activeFile = this.app.workspace.getActiveFile();

            if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                this.log('Debug: "Research & Summarize" clicked, but no active Markdown file found.');
                // Optionally show notice or update status for debugging
                // new Notice('No active Markdown file found.');
                return; // Stop if no valid file
            }

            // Try to find the corresponding MarkdownView and Editor
            let targetView: MarkdownView | null = null;
            let targetEditor: Editor | null = null;
            this.app.workspace.iterateAllLeaves(leaf => {
                if (leaf.view instanceof MarkdownView && leaf.view.file?.path === activeFile.path) {
                    targetView = leaf.view;
                    targetEditor = leaf.view.editor;
                }
            });

            if (targetView && targetEditor) {
                this.clearDisplay();
                this.currentAbortController = new AbortController(); // Create new controller
                this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
                this.log(`Starting: Research & Summarize Topic for ${activeFile.name}...`);
                this.updateStatus('Researching topic...', 0);
                try {
                    // Pass the found editor and view
                    await this.plugin.researchAndSummarizeCommand(targetEditor, targetView, this);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.log(`Error during Research & Summarize: ${message}`);
                    this.updateStatus('Error occurred', -1);
                    // new Notice(`Error: ${message}`); // Optional notice
                } finally {
                    this.isProcessing = false;
                    this.updateButtonStates();
                }
            } else {
                // Log if the view/editor for the active file couldn't be found (e.g., file open but not focused)
                this.log(`Debug: "Research & Summarize" clicked for active file "${activeFile.name}", but its editor/view was not found.`);
            }
        };

        this.generateTitleButton = newFeatureButtonGroup.createEl('button', { text: 'Generate from title' });
        this.generateTitleButton.title = 'Generates content for the current note based on its title, replacing existing content.';
        this.generateTitleButton.onclick = async () => {
            if (this.isProcessing) return;
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') { new Notice('No active Markdown file selected.'); return; }
            this.clearDisplay();
            this.currentAbortController = new AbortController(); // Create new controller
            this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
            this.log('Starting: Generate Content from Title...'); this.updateStatus('Generating content...', 0);
            try { await this.plugin.generateContentForTitleCommand(activeFile, this); } // Use plugin method
            finally { this.isProcessing = false; this.updateButtonStates(); }
        };

        this.batchGenerateTitleButton = newFeatureButtonGroup.createEl('button', { text: 'Batch generate from titles' });
        this.batchGenerateTitleButton.title = 'Generates content for all notes in a selected folder based on their titles.';
        this.batchGenerateTitleButton.onclick = async () => {
            if (this.isProcessing) return;
            this.clearDisplay();
            this.currentAbortController = new AbortController(); // Create new controller
            this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
            this.log('Starting: Batch Generate Content from Titles...'); this.updateStatus('Starting batch generation...', 0);
            try { await this.plugin.batchGenerateContentForTitlesCommand(this); } // Use plugin method
            finally { this.isProcessing = false; this.updateButtonStates(); }
        };

        const translateGroup = newFeatureButtonGroup.createDiv({ cls: 'notemd-translate-group' });
        this.translateButton = translateGroup.createEl('button', { text: 'Translate', cls: 'mod-cta' });
        this.translateButton.title = 'Translates the selected text using the configured provider.';
        this.translateButton.onclick = async () => {
            if (this.isProcessing) {
                console.log('Translate button clicked but already processing. Ignoring.');
                return;
            }
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                console.log('Translate button clicked. Initializing processing state.');
                this.clearDisplay();
                this.currentAbortController = new AbortController();
                this.isProcessing = true;
                this.startTime = Date.now();
                this.updateButtonStates(); // Should enable cancel button here
                this.log('Starting: Translate File...');
                this.updateStatus('Translating...', 0);
                try {
                    await this.plugin.translateFileCommand(activeFile, this.currentAbortController.signal);
                } finally {
                    console.log('Translate command finished. Resetting processing state.');
                    this.isProcessing = false;
                    this.updateButtonStates(); // Should disable cancel button here
                }
            } else {
                new Notice('No active file to translate.');
                console.log('No active file to translate. Translate command not started.');
            }
        };

        this.languageSelector = translateGroup.createEl('select');
        const languageSelector = this.languageSelector;
        if (languageSelector) {
            this.plugin.settings.availableLanguages.forEach(lang => {
                languageSelector.add(new Option(lang.name, lang.code));
            });
            languageSelector.value = this.plugin.settings.language;
            languageSelector.onchange = async (e) => {
                this.plugin.settings.language = (e.target as HTMLSelectElement).value;
                await this.plugin.saveSettings();
                new Notice(`Language changed to ${this.plugin.settings.language}`);
            };
        }

        container.createEl('h4', { text: "Utilities" });
        const utilityButtonGroup = container.createDiv({ cls: 'notemd-button-group' });

        this.batchMermaidFixButton = utilityButtonGroup.createEl('button', { text: 'Batch Mermaid fix' });
        this.batchMermaidFixButton.title = 'Fixes Mermaid and LaTeX syntax in all Markdown files in a selected folder.';
        this.batchMermaidFixButton.onclick = async () => {
            if (this.isProcessing) return;
            this.clearDisplay();
            this.currentAbortController = new AbortController(); // Create new controller
            this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
            this.log('Starting: Batch Mermaid Fix...'); this.updateStatus('Starting batch fix...', 0);
            try { await this.plugin.batchMermaidFixCommand(this); } // Use plugin method
            finally { this.isProcessing = false; this.updateButtonStates(); }
        };

        this.checkDuplicatesButton = utilityButtonGroup.createEl('button', { text: 'Check duplicates (current file)' });
        this.checkDuplicatesButton.onclick = async () => {
            // Replicate logic from main.ts onload for this command
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile || !(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                new Notice("No active '.md' or '.txt' file to check.");
                return;
            }
            this.clearDisplay(); // Clear sidebar log/status
            this.log(`Checking duplicates in ${activeFile.name}...`);
            this.updateStatus(`Checking ${activeFile.name}...`, 50); // Show some progress indication
            try {
                const content = await this.plugin.app.vault.read(activeFile);
                const duplicates = findDuplicates(content); // Use imported utility
                const message = `Found ${duplicates.size} potential duplicate terms. Check log below and console.`;
                this.log(message);
                new Notice(message);
                if (duplicates.size > 0) {
                    this.log(`Potential duplicates: ${Array.from(duplicates).join(', ')}`);
                    console.log(`Potential duplicates in ${activeFile.name}:`, Array.from(duplicates));
                }
                this.updateStatus("Duplicate check complete.", 100);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                new Notice(`Error checking duplicates: ${message}`);
                this.log(`Error: ${message}`);
                this.updateStatus("Error checking duplicates.", -1);
                console.error("Error checking duplicates (Sidebar):", error);
            }
        };

        this.testConnectionButton = utilityButtonGroup.createEl('button', { text: 'Test LLM connection' });
        this.testConnectionButton.onclick = async () => {
            if (this.isProcessing) { new Notice("Cannot test connection while processing."); return; }
            this.clearDisplay();
            await this.plugin.testLlmConnectionCommand(this); // Use plugin method
        };

        this.checkRemoveDuplicatesButton = utilityButtonGroup.createEl('button', { text: 'Check & remove duplicates' });
        if (this.checkRemoveDuplicatesButton) {
            this.checkRemoveDuplicatesButton.title = 'Checks Concept Note folder for duplicates and prompts for deletion.';
            this.checkRemoveDuplicatesButton.onclick = async () => {
                if (this.isProcessing) return;
                this.clearDisplay();
                this.currentAbortController = new AbortController(); // Create new controller
                this.isProcessing = true; this.startTime = Date.now(); this.updateButtonStates();
                this.log('Starting: Check & Remove Duplicate Concept Notes...'); this.updateStatus('Checking duplicates...', 0);
                try {
                    if (this.plugin) {
                        await this.plugin.checkAndRemoveDuplicateConceptNotesCommand(this);
                    }
                } // Use plugin method
                finally { this.isProcessing = false; this.updateButtonStates(); }
            };
        }

        container.createEl('hr');
        const progressArea = container.createDiv({ cls: 'notemd-progress-area' });
        this.statusEl = progressArea.createEl('p', { text: 'Ready', cls: 'notemd-status-text' });
        this.progressBarContainerEl = progressArea.createEl('div', { cls: 'notemd-progress-bar-container is-hidden' });
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });
        this.timeRemainingEl = progressArea.createEl('p', { cls: 'notemd-time-remaining' });

        this.cancelButton = progressArea.createEl('button', { text: 'Cancel processing', cls: 'notemd-cancel-button' });
        this.cancelButton.onclick = () => this.requestCancel();

        container.createEl('hr');
        const logHeader = container.createDiv({ cls: 'notemd-log-header' });
        logHeader.createEl('h5', { text: 'Log output' });
        const copyLogButton = logHeader.createEl('button', { text: 'Copy log', cls: 'notemd-copy-log-button' });
        copyLogButton.onclick = () => {
            if (this.logContent.length > 0) {
                navigator.clipboard.writeText(this.logContent.join('\n')).then(() => new Notice('Log copied!'), () => new Notice('Failed to copy log.'));
            } else { new Notice('Log is empty.'); }
        };
        this.logEl = container.createEl('div', { cls: 'notemd-log-output is-selectable' });

        this.activeLeafChangeHandler = () => this.updateResearchButtonState();
        this.plugin.registerEvent(this.app.workspace.on('active-leaf-change', this.activeLeafChangeHandler));
        this.updateButtonStates(); // Set initial states
    }

    private updateResearchButtonState() {
        if (!this.researchButton) return;
        // Keep the check for activeView for context, but don't use it to disable
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const disabled = this.isProcessing; // Only disable if processing is active
        this.researchButton.disabled = disabled;
        if (disabled) this.researchButton.addClass('is-disabled');
        else this.researchButton.removeClass('is-disabled');
    }

    async onClose() {
        if (this.activeLeafChangeHandler) {
            this.app.workspace.off('active-leaf-change', this.activeLeafChangeHandler);
            this.activeLeafChangeHandler = null;
        }
        // Clear references
        this.statusEl = null; this.progressEl = null; this.progressBarContainerEl = null;
        this.timeRemainingEl = null; this.logEl = null; this.cancelButton = null;
        this.processCurrentButton = null; this.processFolderButton = null; this.researchButton = null;
        this.generateTitleButton = null; this.batchGenerateTitleButton = null; this.checkDuplicatesButton = null;
        this.testConnectionButton = null; this.checkRemoveDuplicatesButton = null; this.batchMermaidFixButton = null; // Added
        this.translateButton = null; this.languageSelector = null;
    }
}
