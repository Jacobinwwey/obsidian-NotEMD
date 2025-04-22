import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, requestUrl } from 'obsidian'; // Import requestUrl
import { refineMermaidBlocks, cleanupLatexDelimiters } from './mermaidProcessor'; // Import new functions

// Remember to rename these classes and interfaces!

interface LLMProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	model: string;
	temperature: number;
	apiVersion?: string;  // Only used for Azure OpenAI
}

interface NotemdSettings {
	providers: LLMProviderConfig[];
	activeProvider: string;
	// Concept Note Settings
	useCustomConceptNoteFolder: boolean; // New setting
	conceptNoteFolder: string; // Renamed from outputFolder
	// Processed File Settings
	useCustomProcessedFileFolder: boolean; // New setting
	processedFileFolder: string; // New setting
	// Concept Log File Settings - START
	generateConceptLogFile: boolean;
	useCustomConceptLogFolder: boolean;
	conceptLogFolderPath: string;
	useCustomConceptLogFileName: boolean;
	conceptLogFileName: string;
	// Concept Log File Settings - END
	// Other settings
	chunkWordCount: number;
	maxTokens: number; // Added setting for max tokens
	enableDuplicateDetection: boolean; // Added setting for duplicate checks
	processMode: string; // Although commands are separate, keep for potential future use or settings logic
	moveOriginalFileOnProcess: boolean; // New setting for alternative workflow
	tavilyApiKey: string; // New setting for Tavily API Key
	searchProvider: 'tavily' | 'duckduckgo'; // New setting for search provider
	ddgMaxResults: number; // Max results for DuckDuckGo
	ddgFetchTimeout: number; // Timeout in seconds for fetching DDG result content
	maxResearchContentTokens: number; // New setting for max research content tokens
	enableResearchInGenerateContent: boolean; // New setting: Toggle research for Generate from Title
	tavilyMaxResults: number; // New setting for Tavily max results
	tavilySearchDepth: 'basic' | 'advanced'; // New setting for Tavily search depth
	// Multi-model settings
	useMultiModelSettings: boolean; // Toggle for using different models per task
	addLinksProvider: string; // Provider for "Process File/Folder (Add Links)"
	researchProvider: string; // Provider for "Research and Summarize"
	generateTitleProvider: string; // Provider for "Generate from Title"
	// Stable API Call Settings
	enableStableApiCall: boolean; // Toggle for enabling retry logic
	apiCallInterval: number; // Interval in seconds between retries
	apiCallMaxRetries: number; // Maximum number of retry attempts
	// Task-specific models (used if useMultiModelSettings is true)
	addLinksModel?: string; // Optional: Model override for Add Links task
	researchModel?: string; // Optional: Model override for Research task
	generateTitleModel?: string; // Optional: Model override for Generate Title task
	// Custom Add Links Output Filename Settings
	useCustomAddLinksSuffix: boolean; // Toggle for custom suffix/overwrite
	addLinksCustomSuffix: string; // The custom suffix string (empty means overwrite)
	// Custom Generate from Title Output Folder Settings
	useCustomGenerateTitleOutputFolder: boolean; // Toggle for custom output folder
	generateTitleOutputFolderName: string; // The custom folder name (defaults to _complete)
}

// Interface for search results
interface SearchResult {
	title: string;
	url: string;
	content: string; // Snippet or fetched content
}


const DEFAULT_SETTINGS: NotemdSettings = {
	providers: [
		{
			name: 'DeepSeek',
			apiKey: '',
			baseUrl: 'https://api.deepseek.com/v1',
			model: 'deepseek-reasoner',
			temperature: 0.5
		},
		{
			name: 'OpenAI',
			apiKey: '',
			baseUrl: 'https://api.openai.com/v1',
			model: 'gpt-4o',
			temperature: 0.5
		},
		{
			name: 'Anthropic',
			apiKey: '',
			baseUrl: 'https://api.anthropic.com',
			model: 'claude-3-5-sonnet-20241022',
			temperature: 0.5
		},
		{
			name: 'Google',
			apiKey: '',
			baseUrl: 'https://generativelanguage.googleapis.com/v1',
			model: 'gemini-2.0-flash-exp',
			temperature: 0.5
		},
		{
			name: 'Mistral',
			apiKey: '',
			baseUrl: 'https://api.mistral.ai/v1',
			model: 'mistral-large-latest',
			temperature: 0.5
		},
		{
			name: 'Azure OpenAI',
			apiKey: '',
			baseUrl: '',
			model: 'gpt-4o',
			temperature: 0.5,
			apiVersion: '2025-01-01-preview'
		},
		{
			name: 'LMStudio',
			apiKey: 'EMPTY', // LMStudio often requires a placeholder
			baseUrl: 'http://localhost:1234/v1',
			model: 'local-model', // User needs to set this based on their loaded model
			temperature: 0.7
		},
		{
			name: 'Ollama',
			apiKey: '', // Ollama doesn't use API keys
			baseUrl: 'http://localhost:11434/api',
			model: 'llama3', // User needs to set this based on their pulled models
			temperature: 0.7
		},
		{
			name: 'OpenRouter',
			apiKey: '', // Required
			baseUrl: 'https://openrouter.ai/api/v1',
			model: 'gryphe/mythomax-l2-13b', // Example model, user should change
			temperature: 0.7
		}
	],
	activeProvider: 'DeepSeek',
	// Concept Note Defaults
	useCustomConceptNoteFolder: false,
	conceptNoteFolder: '',
	// Processed File Defaults
	useCustomProcessedFileFolder: false,
	processedFileFolder: '',
	// Concept Log File Defaults - START
	generateConceptLogFile: false,
	useCustomConceptLogFolder: false,
	conceptLogFolderPath: '',
	useCustomConceptLogFileName: false,
	conceptLogFileName: 'Generate.log',
	// Concept Log File Defaults - END
	// Other Defaults
	chunkWordCount: 3000,
	maxTokens: 4096, // Default max tokens for LLM response
	enableDuplicateDetection: true, // Enable by default
	processMode: 'single',
	moveOriginalFileOnProcess: false, // Default to creating copies
	tavilyApiKey: '', // Default Tavily API Key to empty
	searchProvider: 'tavily', // Default search provider
	ddgMaxResults: 5, // Default max results for DuckDuckGo
	ddgFetchTimeout: 15, // Default timeout (seconds) for fetching DDG result content
	maxResearchContentTokens: 3000, // Default token limit for research content
	enableResearchInGenerateContent: false, // Default to false: Generate from Title does NOT research by default
	tavilyMaxResults: 5, // Default Tavily max results
	tavilySearchDepth: 'basic', // Default Tavily search depth
	// Multi-model defaults
	useMultiModelSettings: false, // Default to using the single activeProvider
	addLinksProvider: 'DeepSeek', // Default to the primary activeProvider initially
	researchProvider: 'DeepSeek', // Default to the primary activeProvider initially
	generateTitleProvider: 'DeepSeek', // Default to the primary activeProvider initially
	// Stable API Call Defaults
	enableStableApiCall: false, // Default to disabled
	apiCallInterval: 5, // Default interval 5 seconds
	apiCallMaxRetries: 3, // Default max 3 retries
	// Task-specific model defaults (empty means use provider's default)
	addLinksModel: '',
	researchModel: '',
	generateTitleModel: '',
	// Custom Add Links Output Filename Defaults
	useCustomAddLinksSuffix: false, // Default to standard '_processed.md' suffix
	addLinksCustomSuffix: '', // Default custom suffix is empty (relevant only if toggle is on)
	// Custom Generate from Title Output Folder Defaults
	useCustomGenerateTitleOutputFolder: false, // Default to using '[foldername]_complete'
	generateTitleOutputFolderName: '_complete', // Default folder name if custom is enabled but empty
}

// Interface for progress reporting (used by Modal and Sidebar View)
interface ProgressReporter {
	log(message: string): void;
	updateStatus(text: string, percent?: number): void;
	requestCancel(): void;
	clearDisplay(): void;
	get cancelled(): boolean;
	// Add property to hold the AbortController for the current fetch
	abortController?: AbortController | null;
}


// Constants for the Sidebar View
const NOTEMD_SIDEBAR_VIEW_TYPE = "notemd-sidebar-view";
const NOTEMD_SIDEBAR_DISPLAY_TEXT = "Notemd Processor";
const NOTEMD_SIDEBAR_ICON = "wand"; // Example icon

export default class NotemdPlugin extends Plugin {
	settings: NotemdSettings;
	currentProcessingFile: string = ''; // Track currently processed file for backlinks
	statusBarItem: HTMLElement; // Reference to status bar element
	// progressModal?: ProgressModal; // No longer needed at plugin level

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon to OPEN THE SIDEBAR VIEW
		const ribbonIconEl = this.addRibbonIcon(NOTEMD_SIDEBAR_ICON, NOTEMD_SIDEBAR_DISPLAY_TEXT, (evt: MouseEvent) => {
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('notemd-ribbon-class'); // Keep existing class if needed

		// Add command to open the sidebar view
		this.addCommand({
			id: 'open-notemd-sidebar',
			name: 'Open Sidebar',
			callback: () => {
				this.activateView();
			}
		});

		// Status bar indicators
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar('Ready');

		// --- Command Palette Integration ---
		this.addCommand({
			id: 'process-with-notemd',
			name: 'Process Current File',
			callback: async () => {
				await this.processWithNotemd();
			}
		});

		this.addCommand({
			id: 'process-folder-with-notemd',
			name: 'Process Folder',
			callback: async () => {
				await this.processFolderWithNotemd();
			}
		});

		this.addCommand({
			id: 'check-for-duplicates',
			name: 'Check for Duplicates in Current File',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file to check');
					return;
				}
				// Check if the file is a supported text format (.md or .txt)
				if (!(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
					new Notice(`Cannot check this file type. Please select a '.md' or '.txt' file.`);
					return;
				}
				const content = await this.app.vault.read(activeFile);
				const duplicates = this.findDuplicates(content); // Call method directly
				new Notice(`Found ${duplicates.size} potential duplicate terms in the current file. Check console.`);
				if (duplicates.size > 0) {
					console.log(`Potential duplicates in ${activeFile.name}:`, Array.from(duplicates));
				}
			}
		});

		this.addCommand({
			id: 'test-llm-connection',
			name: 'Test LLM Connection',
			callback: async () => {
				const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
				if (!provider) {
					new Notice('No active provider configured');
					return;
				}

				// Show a "Testing..." notice
				const testingNotice = new Notice(`Testing connection to ${provider.name}...`, 0); // 0 = indefinite

				try {
					const result = await this.testAPI(provider);
					testingNotice.hide(); // Hide the "Testing..." notice

					if (result.success) {
						new Notice(`✅ Success: ${result.message}`, 5000); // Show success longer
					} else {
						new Notice(`❌ Failed: ${result.message}. Check console for details.`, 10000); // Show error longer
					}
				} catch (error: any) { // Catch any unexpected errors from testAPI itself
					testingNotice.hide();
					new Notice(`Error during connection test: ${error.message}`, 10000);
					console.error('LLM Connection Test Error:', error);
					// Show detailed, copyable error modal
					const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
					new ErrorModal(this.app, "LLM Connection Test Error", errorDetails).open();
				}
			}
		});

		this.addCommand({
			id: 'generate-content-from-title',
			name: 'Generate Content from Note Title',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
					new Notice('No active Markdown file selected.');
					return;
				}

				// Use the sidebar/modal reporter for progress
				const reporter = this.getReporter(); // Get reporter (sidebar or modal)

				// Pass the active file and the reporter
				await this.generateContentForTitle(activeFile, reporter);
			}
		});

		this.addCommand({
			id: 'research-and-summarize-topic',
			name: 'Research and Summarize Topic',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				// Use sidebar/modal reporter
				const reporter = this.getReporter();
				await this.researchAndSummarize(editor, view, reporter);
			}
		});

		// New Command: Batch Generate Content from Titles
		this.addCommand({
			id: 'batch-generate-content-from-titles',
			name: 'Batch Generate Content from Titles',
			callback: async () => {
				const reporter = this.getReporter();
				await this.batchGenerateContentForTitles(reporter);
			}
		});


		// --- Settings Tab ---
		this.addSettingTab(new NotemdSettingTab(this.app, this));

		// --- Event Listeners ---
		// Register file rename/delete handlers for backlink maintenance
		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
			if (file instanceof TFile && file.extension === 'md') {
				this.handleFileRename(oldPath, file.path);
			}
		}));
		this.registerEvent(this.app.vault.on('delete', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				this.handleFileDelete(file.path);
			}
		}));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// Removed console.log('click', evt); to reduce noise, uncomment if needed for debugging
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('Notemd interval check'), 15 * 60 * 1000)); // Example: 15 minutes

		// Register the Sidebar View
		this.registerView(
			NOTEMD_SIDEBAR_VIEW_TYPE,
			(leaf) => new NotemdSidebarView(leaf, this) // Pass plugin instance
		);
	}

	onunload() {
		// Clean up event handlers
		// console.log('Unloading Notemd plugin');
	}

	// --- Settings Management ---
	async loadSettings() {
		const savedData = await this.loadData() || {};

		// Smart merge for providers array
		const savedProviders = savedData.providers || [];
		const defaultProviders = DEFAULT_SETTINGS.providers;
		const mergedProviders: LLMProviderConfig[] = [];
		const savedProviderMap = new Map(savedProviders.map((p: LLMProviderConfig) => [p.name, p]));

		// Add saved providers first, potentially updating non-critical defaults if they changed
		savedProviders.forEach((savedProvider: LLMProviderConfig) => {
			const defaultProvider = defaultProviders.find(dp => dp.name === savedProvider.name);
			if (defaultProvider) {
				// Merge, prioritizing saved user settings like apiKey, model, baseUrl over defaults
				mergedProviders.push({
					...defaultProvider, // Start with potentially updated defaults
					...savedProvider    // Overwrite with user's saved settings
				});
			} else {
				// Provider was saved but no longer exists in defaults? Keep it anyway.
				mergedProviders.push(savedProvider);
			}
		});

		// Add any new default providers that weren't in the saved data
		defaultProviders.forEach(defaultProvider => {
			if (!savedProviderMap.has(defaultProvider.name)) {
				mergedProviders.push(defaultProvider);
			}
		});

		// Assign merged settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData, { providers: mergedProviders });

		// Ensure activeProvider is valid, fallback to default if not
		if (!this.settings.providers.some(p => p.name === this.settings.activeProvider)) {
			this.settings.activeProvider = DEFAULT_SETTINGS.activeProvider;
		}
	}


	async saveSettings() {
		await this.saveData(this.settings);
	}

	// --- UI and Commands ---

	updateStatusBar(text: string) {
		if (this.statusBarItem) {
			this.statusBarItem.setText(`Notemd: ${text}`);
			// Removed update to progressModal as it's handled by the reporter now
		}
	}

	async getFolderSelection(): Promise<string | null> {
		const folders = this.app.vault.getAllLoadedFiles()
			.filter(f => f instanceof TFolder)
			.map(f => f.path);

		// Add root folder option
		folders.unshift('/'); // Add root directory

		return new Promise((resolve) => {
			const modal = new Modal(this.app);
			modal.titleEl.setText('Select Folder to Process');

			const selectEl = modal.contentEl.createEl('select');
			folders.forEach(folder => {
				selectEl.createEl('option', { text: folder === '/' ? '(Vault Root)' : folder, value: folder });
			});

			const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
			const processButton = buttonContainer.createEl('button', { text: 'Process', cls: 'mod-cta' });
			processButton.onclick = () => {
				modal.close();
				resolve(selectEl.value);
			};
			// Removed duplicate cancelButton declaration below
			const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
			cancelButton.onclick = () => {
				modal.close();
				resolve(null); // Resolve with null if cancelled
			};

			modal.open();
		});
	}

	// --- File Processing Logic ---

	// Updated to accept optional progress reporter
	async processWithNotemd(progressReporter?: ProgressReporter) {
		await this.loadSettings(); // Ensure latest settings are loaded
		// console.log("Entering processWithNotemd"); // DEBUG
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			this.updateStatusBar('No file selected');
			new Notice('No active file to process');
			// console.log("processWithNotemd: No active file."); // DEBUG
			return;
		}

		// Check if the file is a supported text format (.md or .txt)
		if (!(activeFile instanceof TFile) || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
			new Notice(`Cannot process this file type. Please select a '.md' or '.txt' file.`);
			// console.log("processWithNotemd: No active file."); // DEBUG
			return;
		}
		// console.log(`processWithNotemd: Processing file: ${activeFile.path}`); // DEBUG

		// Use provided reporter or create a ProgressModal as fallback
		let reporter: ProgressReporter;
		let closeModalOnFinish = false;
		if (progressReporter) {
			reporter = progressReporter;
		} else {
			const modal = new ProgressModal(this.app);
			modal.open();
			reporter = modal;
			closeModalOnFinish = true; // Close the modal only if we created it here
		}

		try {
			reporter.updateStatus(`Processing ${activeFile.name}...`, 0);
			reporter.log(`Reading file: ${activeFile.name}`);
			this.updateStatusBar(`Processing: ${activeFile.name}`);
			// console.log(`processWithNotemd: Reading content of ${activeFile.name}`); // DEBUG

			// Get file content
			const content = await this.app.vault.read(activeFile);
			// console.log(`processWithNotemd: Read ${content.length} characters.`); // DEBUG

			// Step 1: Process content with LLM, passing the reporter
			reporter.log(`Processing content with LLM...`);
			// console.log("processWithNotemd: Calling processContentWithLLM..."); // DEBUG
			const processedContent = await this.processContentWithLLM(content, reporter); // Pass reporter
			// console.log(`processWithNotemd: processContentWithLLM returned ${processedContent?.length ?? 'null/undefined'} characters.`); // DEBUG

			if (reporter.cancelled) {
				new Notice('Processing cancelled by user.');
				this.updateStatusBar('Cancelled');
				reporter.updateStatus('Cancelled by user.', -1); // Update reporter status
				return; // Exit if cancelled
			}

			// Step 2: Generate Obsidian links
			reporter.log(`Generating links...`);
			// console.log("processWithNotemd: Calling generateObsidianLinks..."); // DEBUG
			const withLinks = this.generateObsidianLinks(processedContent);
			// console.log(`processWithNotemd: generateObsidianLinks returned ${withLinks?.length ?? 'null/undefined'} characters.`); // DEBUG

			// Step 3: Handle duplicates within the processed content
			reporter.log(`Checking for duplicates in content...`);
			// console.log("processWithNotemd: Calling handleDuplicates..."); // DEBUG
			await this.handleDuplicates(withLinks); // Check duplicates in the result
			// console.log("processWithNotemd: handleDuplicates finished."); // DEBUG

			// --- Refactored: Call processFile to handle saving/moving ---
			// The processFile function now contains all the logic for determining
			// the output path based on settings (custom suffix, move original, etc.)
			// and performs the actual file creation/modification/move.
			// We pass the activeFile and the reporter instance.
			// Note: processFile already includes post-processing (Mermaid/LaTeX cleanup)
			// and duplicate handling, so we don't need to call them again here.
			// We just need to ensure processFile gets the content *after* LLM processing and link generation.

			// Re-apply post-processing here before passing to processFile,
			// as processFile expects the final content.
			reporter.log(`Applying post-processing (Mermaid/LaTeX)...`);
			let finalContent = withLinks; // Start with content after LLM + link generation
			try {
				finalContent = cleanupLatexDelimiters(finalContent);
				finalContent = refineMermaidBlocks(finalContent);
				// Remove leading \boxed{ if present
				const lines = finalContent.split('\n');
				if (lines.length > 0 && lines[0].trim() === '\\boxed{') {
					reporter.log(`Removing leading '\\boxed{' line.`);
					lines.shift();
					if (lines.length > 0 && lines[lines.length - 1].trim() === '}') {
						lines.pop();
					}
					finalContent = lines.join('\n');
				}
				reporter.log(`Post-processing applied.`);
			} catch (cleanupError: any) {
				reporter.log(`Warning: Error during Mermaid/LaTeX cleanup: ${cleanupError.message}`);
				console.warn(`Warning during Mermaid/LaTeX cleanup for ${activeFile.name}:`, cleanupError);
				// Continue with the content before cleanup attempt
				finalContent = withLinks;
			}


			// Now, call a modified version of processFile logic directly or refactor processFile
			// Let's adapt the core saving logic from processFile here, as processFile itself
			// includes the LLM call which we've already done.

			// --- Determine Output Path (Adapted from processFile) ---
			let processedFileSaveDir = '';
			if (this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder) {
				processedFileSaveDir = this.settings.processedFileFolder;
			} else {
				processedFileSaveDir = activeFile.parent?.path || '';
			}
			processedFileSaveDir = processedFileSaveDir.replace(/^\/|\/$/g, '');
			if (processedFileSaveDir && !processedFileSaveDir.endsWith('/')) {
				processedFileSaveDir += '/';
			}
			if (activeFile.parent?.path === '/' && !(this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder)) {
				processedFileSaveDir = '';
			}

			// Ensure output folder exists
			const targetSaveFolder = processedFileSaveDir.replace(/\/$/, '');
			if (targetSaveFolder && !this.app.vault.getAbstractFileByPath(targetSaveFolder)) {
				try {
					await this.app.vault.createFolder(targetSaveFolder);
					reporter.log(`Created output folder: ${targetSaveFolder}`);
				} catch (folderError: any) {
					reporter.log(`Error creating output folder ${targetSaveFolder}: ${folderError.message}`);
					throw folderError;
				}
			} else if (targetSaveFolder && !(this.app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
				const errorMsg = `Output path '${targetSaveFolder}' exists but is not a folder.`;
				reporter.log(errorMsg);
				throw new Error(errorMsg);
			}

			// --- Save or Move File (Adapted from processFile) ---
			if (this.settings.moveOriginalFileOnProcess) {
				const targetPath = `${processedFileSaveDir}${activeFile.name}`;
				reporter.log(`Processing mode: Move & Overwrite original file.`);
				if (targetPath !== activeFile.path) {
					reporter.log(`Moving original file to: ${targetPath}`);
					const existingTargetFile = this.app.vault.getAbstractFileByPath(targetPath);
					if (existingTargetFile) {
						throw new Error(`File already exists at target move path: ${targetPath}. Cannot move original file.`);
					}
					await this.app.vault.rename(activeFile, targetPath);
					const movedFile = this.app.vault.getAbstractFileByPath(targetPath);
					if (movedFile instanceof TFile) {
						await this.app.vault.modify(movedFile, finalContent);
						reporter.log(`Overwrote content of moved file: ${targetPath}`);
					} else {
						throw new Error(`Failed to find moved file at ${targetPath} after rename.`);
					}
				} else {
					reporter.log(`Overwriting original file in place: ${activeFile.path}`);
					await this.app.vault.modify(activeFile, finalContent);
					reporter.log(`Overwrote original file: ${activeFile.path}`);
				}
			} else {
				// Logic for creating a processed copy (not moving original)
				let outputPath: string;
				let logAction: string;

				if (this.settings.useCustomAddLinksSuffix) {
					if (this.settings.addLinksCustomSuffix === '') {
						outputPath = activeFile.path;
						logAction = `Overwriting original file (custom setting): ${outputPath}`;
						reporter.log(`Processing mode: Overwrite original (custom setting).`);
					} else {
						let suffix = this.settings.addLinksCustomSuffix;
						if (suffix.toLowerCase().endsWith('.md')) {
							suffix = suffix.substring(0, suffix.length - 3);
						}
						outputPath = `${processedFileSaveDir}${activeFile.basename}${suffix}.md`;
						logAction = `Saving processed file with custom suffix: ${outputPath}`;
						reporter.log(`Processing mode: Create copy with custom suffix.`);
					}
				} else {
					outputPath = `${processedFileSaveDir}${activeFile.basename}_processed.md`;
					logAction = `Saving processed file with default suffix: ${outputPath}`;
					reporter.log(`Processing mode: Create/Overwrite default processed copy.`);
				}

				reporter.log(logAction); // Log the determined action and path

				if (outputPath === activeFile.path) {
					// Overwrite original file case
					await this.app.vault.modify(activeFile, finalContent);
					reporter.log(`Overwrote original file: ${outputPath}`);
				} else {
					// Create or overwrite a *different* file
					const existingOutputFile = this.app.vault.getAbstractFileByPath(outputPath);
					if (existingOutputFile instanceof TFile) {
						await this.app.vault.modify(existingOutputFile, finalContent);
						reporter.log(`Overwrote existing file: ${outputPath}`);
					} else {
						await this.app.vault.create(outputPath, finalContent);
						reporter.log(`Created processed file: ${outputPath}`);
					}
				}
			}
			// --- End Adapted Saving Logic ---

			this.updateStatusBar('Processing complete');
			reporter.updateStatus('Processing complete!', 100);
			new Notice('Notemd processing complete!');
			// Only close if it's the modal we created
			if (closeModalOnFinish && reporter instanceof ProgressModal) {
				// Explicitly cast inside setTimeout to ensure type safety
				setTimeout(() => (reporter as ProgressModal).close(), 2000);
			}
			// console.log("Exiting processWithNotemd successfully."); // DEBUG
		} catch (error: any) { // Added type annotation
			this.updateStatusBar('Error occurred');
			const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
			console.error("Notemd Processing Error in processWithNotemd:", errorDetails); // Keep this error log
			// Show a simple notice
			new Notice(`Error during Notemd processing. See details or console.`, 10000);
			// Log to reporter
			reporter.log(`Error: ${error.message}`);
			reporter.updateStatus('Error occurred', -1); // Indicate error state
			// Show detailed, copyable error modal
			new ErrorModal(this.app, "Notemd Processing Error", errorDetails).open();
			// Keep reporter open on error (modal stays open, sidebar remains)
		}
	}

	// Updated to accept optional progress reporter
	async processFolderWithNotemd(progressReporter?: ProgressReporter) {
		await this.loadSettings(); // Ensure latest settings are loaded
		const folderPath = await this.getFolderSelection();
		if (!folderPath) {
			new Notice('Folder selection cancelled.');
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder || !(folder instanceof TFolder)) {
			new Notice(`Selected path is not a valid folder: ${folderPath}`);
			return;
		}

		// Filter for only .md and .txt files within the selected folder
		const files = this.app.vault.getFiles().filter(f =>
			(f.extension === 'md' || f.extension === 'txt') &&
			(f.path === folderPath || f.path.startsWith(folderPath === '/' ? '' : folderPath + '/')) // Handle root folder case correctly
		);


		if (files.length === 0) {
			new Notice(`No '.md' or '.txt' files found in selected folder: ${folderPath}`);
			return;
		}

		// Use provided reporter or create a ProgressModal as fallback
		let reporter: ProgressReporter;
		let closeModalOnFinish = false;
		if (progressReporter) {
			reporter = progressReporter;
		} else {
			const modal = new ProgressModal(this.app);
			modal.open();
			reporter = modal;
			closeModalOnFinish = true; // Close the modal only if we created it here
		}

		// Removed duplicate declaration of 'folder'
		// const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder || !(folder instanceof TFolder)) {
			reporter.log(`Error: Selected path is not a valid folder: ${folderPath}`);
			reporter.updateStatus('Error: Invalid folder', -1);
			new Notice(`Selected path is not a valid folder: ${folderPath}`);
			return;
		}

		// Removed duplicate declaration of 'files'
		// Filter for only .md and .txt files within the selected folder
		// const files = this.app.vault.getFiles().filter(f =>
		// 	(f.extension === 'md' || f.extension === 'txt') &&
		// 	(f.path === folderPath || f.path.startsWith(folderPath === '/' ? '' : folderPath + '/')) // Handle root folder case correctly
		// );


		if (files.length === 0) {
			reporter.log(`No '.md' or '.txt' files found in selected folder: ${folderPath}`);
			reporter.updateStatus('No files found', 100); // Indicate completion, even if no files
			new Notice(`No '.md' or '.txt' files found in selected folder: ${folderPath}`);
			// Only close if it's the modal we created
			if (closeModalOnFinish && reporter instanceof ProgressModal) {
				// Explicitly cast inside setTimeout
				setTimeout(() => (reporter as ProgressModal).close(), 2000);
			}
			return;
		}

		this.updateStatusBar(`Batch processing ${files.length} files...`);
		reporter.log(`Starting batch processing for ${files.length} files in "${folderPath}"...`);
		const errors: { file: string; message: string }[] = []; // Array to collect errors

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				// Skip already processed files? Maybe add a setting later.
				if (file.name.endsWith('_processed.md')) {
					reporter.log(`Skipping already processed file: ${file.name}`);
					continue;
				}

				const progress = Math.floor(((i) / files.length) * 100); // Progress before starting current file
				reporter.updateStatus(
					`Processing ${i + 1}/${files.length}: ${file.name}`,
					progress
				);

				if (reporter.cancelled) {
					new Notice('Batch processing cancelled by user.');
					this.updateStatusBar('Cancelled');
					reporter.updateStatus('Batch processing cancelled.', -1);
					break; // Exit loop if cancelled
				}

				try {
					// Process individual file, passing the reporter
					await this.processFile(file, reporter);
				} catch (fileError: any) {
					// Log error for this specific file and continue with the next
					const errorMsg = `Error processing ${file.name}: ${fileError.message}`;
					const errorDetails = fileError instanceof Error ? fileError.stack || fileError.message : String(fileError);
					console.error(errorMsg, errorDetails); // Keep console error for details
					reporter.log(`❌ ${errorMsg}`); // Log user-friendly error to reporter
					errors.push({ file: file.name, message: fileError.message }); // Collect error details

					// --- Silent Error Logging to File ---
					const timestamp = new Date().toISOString();
					const logEntry = `[${timestamp}] Error processing ${file.path}:\n${errorDetails}\n\n`;
					try {
						await this.app.vault.adapter.append('error_processing_filename.log', logEntry);
					} catch (logError) {
						console.error("Failed to write to error_processing_filename.log:", logError);
						reporter.log("⚠️ Failed to write error details to log file.");
						// Optionally show a notice here if writing the log fails?
						// new Notice("Failed to write to error log file. Check console.", 5000);
					}
					// --- End Silent Error Logging ---

					// Continue to the next file
				}

				if (reporter.cancelled) { // Check again after processFile
					new Notice('Batch processing cancelled by user.');
					this.updateStatusBar('Cancelled');
					reporter.updateStatus('Batch processing cancelled.', -1);
					break;
				}
			} // End of loop

			if (!reporter.cancelled) {
				// Report final status including any errors
				if (errors.length > 0) {
					// Modify the error summary message to point to the log file
					const errorSummary = `Batch processing finished with ${errors.length} error(s). Check 'error_processing_filename.log' for details.`;
					reporter.log(`⚠️ ${errorSummary}`);
					reporter.updateStatus(errorSummary, -1); // Indicate error state in status/progress
					this.updateStatusBar(`Batch complete with errors`);
					// Update the Notice to mention the log file
					new Notice(errorSummary, 10000);
				} else {
					reporter.updateStatus('Batch processing complete!', 100);
					this.updateStatusBar('Batch complete');
					new Notice(`Successfully processed ${files.length} files.`, 5000);
				}
				// Only close if it's the modal we created AND there were no errors (or maybe always close?)
				// Let's keep it open if there were errors so user can see log.
				if (closeModalOnFinish && reporter instanceof ProgressModal && errors.length === 0) {
					// Explicitly cast inside setTimeout
					setTimeout(() => (reporter as ProgressModal).close(), 2000);
				}
			}
			// If cancelled, the status is already set inside the loop and modal remains open

		} catch (error: any) { // Catch errors outside the loop (e.g., initial setup)
			this.updateStatusBar('Error occurred');
			const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
			console.error("Notemd Batch Processing Error:", errorDetails);
			// Show simple notice
			new Notice(`Error during batch processing. See details or console.`, 10000);
			// Log to reporter
			reporter.log(`Batch Error: ${error.message}`);
			reporter.updateStatus('Error occurred during batch processing', -1);
			// Show detailed, copyable error modal
			new ErrorModal(this.app, "Notemd Batch Processing Error", errorDetails).open();
			// Keep reporter open (modal stays open, sidebar remains)
		}
	}

	// Updated processFile to accept ProgressReporter
	async processFile(file: TFile, progressReporter: ProgressReporter) {
		// console.log(`Entering processFile for: ${file.path}`); // DEBUG
		this.currentProcessingFile = file.basename; // Set current file for backlinks
		progressReporter.log(`Starting processing for: ${file.name}`);
		// console.log(`processFile: Reading content of ${file.name}`); // DEBUG
		const content = await this.app.vault.read(file);
		// console.log(`processFile: Read ${content.length} characters.`); // DEBUG

		// Pass the reporter instance to the LLM processor
		progressReporter.log(`Submitting content to LLM for: ${file.name}...`); // Added log
		// console.log(`processFile: Calling processContentWithLLM for ${file.name}...`); // DEBUG
		const processedContent = await this.processContentWithLLM(content, progressReporter);
		// console.log(`processFile: processContentWithLLM returned ${processedContent?.length ?? 'null/undefined'} characters for ${file.name}.`); // DEBUG

		if (progressReporter.cancelled) {
			progressReporter.log(`Processing cancelled for ${file.name}`);
			// console.log(`processFile: Processing cancelled for ${file.name}`); // DEBUG
			return; // Stop processing this file if cancelled
		}

		progressReporter.log(`Generating Obsidian links for: ${file.name}...`); // Refined log
		// console.log(`processFile: Calling generateObsidianLinks for ${file.name}...`); // DEBUG
		const withLinks = this.generateObsidianLinks(processedContent);
		// console.log(`processFile: generateObsidianLinks returned ${withLinks?.length ?? 'null/undefined'} characters for ${file.name}.`); // DEBUG

		progressReporter.log(`Checking for duplicates in: ${file.name}...`); // Refined log
		// console.log(`processFile: Calling handleDuplicates for ${file.name}...`); // DEBUG
		await this.handleDuplicates(withLinks);
		// console.log(`processFile: handleDuplicates finished for ${file.name}.`); // DEBUG

		// --- Apply Post-Processing ---
		progressReporter.log(`Cleaning Mermaid/LaTeX for: ${file.name}`);
		let finalContent = withLinks;
		try {
			finalContent = cleanupLatexDelimiters(finalContent);
			finalContent = refineMermaidBlocks(finalContent);
			// console.log(`processFile: Mermaid/LaTeX cleanup applied for ${file.name}.`); // DEBUG
			progressReporter.log(`Mermaid/LaTeX cleanup applied for: ${file.name}`); // Added log
		} catch (cleanupError: any) {
			progressReporter.log(`Warning: Error during Mermaid/LaTeX cleanup for ${file.name}: ${cleanupError.message}`);
			console.warn(`Warning during Mermaid/LaTeX cleanup for ${file.name}:`, cleanupError);
			// Continue with the content before cleanup attempt
			finalContent = withLinks;
		}

		// --- Remove \boxed{ line if present ---
		const lines = finalContent.split('\n');
		if (lines.length > 0 && lines[0].trim() === '\\boxed{') {
			progressReporter.log(`Removing leading '\\boxed{' line.`);
			lines.shift(); // Remove the first line
			// Remove the corresponding closing brace '}' potentially at the end
			if (lines.length > 0 && lines[lines.length - 1].trim() === '}') {
				lines.pop();
			}
			finalContent = lines.join('\n');
		}


		// --- Determine Processed File Output Path ---
		let processedFileSaveDir = '';
		if (this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder) {
			processedFileSaveDir = this.settings.processedFileFolder;
		} else {
			// Default: Save in the same folder as the original file
			processedFileSaveDir = file.parent?.path || ''; // Use empty string for vault root
		}

		// Normalize path (remove leading/trailing slashes for consistency, handle root case)
		processedFileSaveDir = processedFileSaveDir.replace(/^\/|\/$/g, '');
		if (processedFileSaveDir && !processedFileSaveDir.endsWith('/')) {
			processedFileSaveDir += '/';
		}
		// Handle vault root case explicitly
		if (file.parent?.path === '/' && !(this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder)) {
			processedFileSaveDir = ''; // Ensure root path is empty string for correct concatenation
		}

		// Ensure output folder exists before constructing path
		const targetSaveFolder = processedFileSaveDir.replace(/\/$/, ''); // Remove trailing slash for check/create
		if (targetSaveFolder && !this.app.vault.getAbstractFileByPath(targetSaveFolder)) {
			try {
				// console.log(`DEBUG: Attempting to create processed file folder: '${targetSaveFolder}'`);
				await this.app.vault.createFolder(targetSaveFolder);
				progressReporter.log(`Created processed file output folder: ${targetSaveFolder}`);
			} catch (folderError: any) {
				// console.error(`DEBUG: createFolder failed specifically for processed file path: '${targetSaveFolder}'`, folderError);
				progressReporter.log(`Error creating processed file output folder ${targetSaveFolder}: ${folderError.message}`);
				new Notice(`Error creating processed file output folder: ${folderError.message}`);
				throw folderError; // Re-throw to stop processing
			}
		} else if (targetSaveFolder && !(this.app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
			const errorMsg = `Processed file output path '${targetSaveFolder}' exists but is not a folder.`;
			progressReporter.log(errorMsg);
			new Notice(errorMsg);
			throw new Error(errorMsg);
		}

		// --- Save or Move Processed File ---
		if (this.settings.moveOriginalFileOnProcess) {
			// Move original file to target directory (if different) and overwrite content
			const targetPath = `${processedFileSaveDir}${file.name}`; // Use original filename in target dir
			progressReporter.log(`Processing mode: Move & Overwrite original file.`);

			// Check if target path is different from original path
			if (targetPath !== file.path) {
				progressReporter.log(`Moving original file to: ${targetPath}`);
				// Ensure target directory exists (already done earlier)
				try {
					// Check if a file already exists at the target path before attempting rename
					const existingTargetFile = this.app.vault.getAbstractFileByPath(targetPath);
					if (existingTargetFile) {
						// Handle conflict - maybe delete existing or throw error?
						// For now, let's throw an error to prevent accidental overwrite by rename.
						// User should manually resolve conflict in target folder.
						throw new Error(`File already exists at target move path: ${targetPath}. Cannot move original file.`);
					}

					// Move first (rename)
					await this.app.vault.rename(file, targetPath);
					progressReporter.log(`Moved original file to: ${targetPath}`);

					// Now modify the moved file's content
					const movedFile = this.app.vault.getAbstractFileByPath(targetPath);
					if (movedFile instanceof TFile) {
						await this.app.vault.modify(movedFile, finalContent);
						progressReporter.log(`Overwrote content of moved file: ${targetPath}`);
					} else {
						// This should ideally not happen if rename succeeded
						throw new Error(`Failed to find moved file at ${targetPath} after rename.`);
					}
				} catch (moveError: any) {
					progressReporter.log(`Error moving file ${file.name} to ${targetPath}: ${moveError.message}`);
					// Stop processing this file if move fails
					throw new Error(`Failed to move original file: ${moveError.message}`);
				}
			} else {
				// Target path is the same, just modify the original file in place
				progressReporter.log(`Overwriting original file in place: ${file.path}`);
				await this.app.vault.modify(file, finalContent);
				progressReporter.log(`Overwrote original file: ${file.path}`);
			}
		} else {
			// Logic for creating a processed copy (not moving original)
			// Logic for creating a processed copy (not moving original)
			let outputPath: string;
			let logAction: string;

			// DEBUGGING LOGS START
			progressReporter.log(`DEBUG: useCustomAddLinksSuffix = ${this.settings.useCustomAddLinksSuffix}`);
			progressReporter.log(`DEBUG: addLinksCustomSuffix = "${this.settings.addLinksCustomSuffix}"`);
			// DEBUGGING LOGS END

			// Determine output path based on custom suffix settings
			if (this.settings.useCustomAddLinksSuffix) {
				if (this.settings.addLinksCustomSuffix === '') {
					// Overwrite original file
					outputPath = file.path; // Target the original file path
					logAction = `Overwriting original file (custom setting): ${outputPath}`;
					progressReporter.log(`Processing mode: Overwrite original (custom setting).`);
				} else {
					// Use custom suffix
					// Ensure .md extension is handled correctly (remove if present in suffix, then add)
					let suffix = this.settings.addLinksCustomSuffix;
					if (suffix.toLowerCase().endsWith('.md')) {
						suffix = suffix.substring(0, suffix.length - 3);
					}
					// Ensure suffix starts appropriately (e.g., with '_' if desired, user adds it)
					outputPath = `${processedFileSaveDir}${file.basename}${suffix}.md`;
					logAction = `Saving processed file with custom suffix: ${outputPath}`;
					progressReporter.log(`Processing mode: Create copy with custom suffix.`);
				}
			} else {
				// Default behavior: append _processed.md
				outputPath = `${processedFileSaveDir}${file.basename}_processed.md`;
				logAction = `Saving processed file with default suffix: ${outputPath}`;
				progressReporter.log(`Processing mode: Create/Overwrite default processed copy.`);
			}

			progressReporter.log(logAction); // Log the determined action and path

			// --- Corrected File Operation Logic ---
			if (outputPath === file.path) {
				// Overwrite original file case
				const originalFile = this.app.vault.getAbstractFileByPath(file.path);
				if (originalFile instanceof TFile) {
					await this.app.vault.modify(originalFile, finalContent);
					progressReporter.log(`Overwrote original file: ${outputPath}`);
				} else {
					// This should ideally not happen, but log an error if it does
					console.error(`Error: Tried to overwrite original file ${file.path}, but it was not found or not a TFile.`);
					progressReporter.log(`Error: Could not find original file ${file.path} to overwrite.`);
					// Optionally throw an error? For now, just log.
				}
			} else {
				// Create or overwrite a *different* file (with suffix or in different dir)
				const existingOutputFile = this.app.vault.getAbstractFileByPath(outputPath);
				if (existingOutputFile instanceof TFile) {
					// If the target output file exists, modify it
					await this.app.vault.modify(existingOutputFile, finalContent);
					progressReporter.log(`Overwrote existing file: ${outputPath}`);
				} else {
					// If the target output file doesn't exist, create it
					await this.app.vault.create(outputPath, finalContent);
					progressReporter.log(`Created processed file: ${outputPath}`);
				}
			}
			// --- End Corrected File Operation Logic ---
		}
		// console.log(`processFile: File saving/moving/overwriting complete for ${file.name}.`); // DEBUG

		progressReporter.log(`Finished processing: ${file.name}`);
		this.currentProcessingFile = ''; // Clear after processing
		// console.log(`Exiting processFile for: ${file.path}`); // DEBUG
	}


	// --- Backlink and Note Management ---

	async handleFileRename(oldPath: string, newPath: string) {
		const oldName = oldPath.split('/').pop()?.replace('.md', '') || '';
		const newName = newPath.split('/').pop()?.replace('.md', '') || '';

		if (!oldName || !newName || oldName === newName) return;

		// console.log(`Handling rename: "${oldName}" -> "${newName}"`); // Keep this log? Maybe less verbose.
		new Notice(`Updating links for renamed file: ${newName}`, 5000); // Show notice longer

		// Escape special regex characters in oldName for accurate matching
		const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const linkRegex = new RegExp(`\\[\\[${escapedOldName}\\]\\]`, 'g');

		const files = this.app.vault.getMarkdownFiles();
		let updatedCount = 0;
		const errors: string[] = [];

		for (const file of files) {
			// Avoid processing the file that was just renamed
			if (file.path === newPath) continue;

			try {
				let content = await this.app.vault.read(file);
				if (content.match(linkRegex)) {
					const updatedContent = content.replace(linkRegex, `[[${newName}]]`);
					if (content !== updatedContent) {
						await this.app.vault.modify(file, updatedContent);
						updatedCount++;
						// console.log(`Updated link in: ${file.path}`); // Maybe too verbose for many files
					}
				}
			} catch (error: any) {
				const errorMsg = `Error updating links in ${file.path} for rename: ${error.message}`;
				console.error(errorMsg);
				errors.push(errorMsg);
			}
		}

		if (updatedCount > 0) {
			const message = `Updated links to "${newName}" in ${updatedCount} files.`;
			// console.log(message); // Notice is sufficient
			new Notice(message, 5000);
		} else {
			// console.log(`No links found for "${oldName}" to update.`); // Less critical log
		}
		if (errors.length > 0) {
			new Notice(`Encountered ${errors.length} errors while updating links. Check console.`, 10000);
		}
	}

	async handleFileDelete(path: string) {
		const fileName = path.split('/').pop()?.replace('.md', '') || '';
		if (!fileName) return;

		// console.log(`Handling delete: "${fileName}"`); // Keep this log? Maybe less verbose.
		new Notice(`Removing links for deleted file: ${fileName}`, 5000);

		// Escape special regex characters in fileName
		const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Simplified Regex to find only the link itself, globally and case-insensitively (Obsidian links are case-insensitive)
		const linkRegex = new RegExp(`\\[\\[${escapedFileName}\\]\\]`, 'gi');

		const files = this.app.vault.getMarkdownFiles();
		let updatedCount = 0;
		const errors: string[] = [];

		for (const file of files) {
			try {
				let content = await this.app.vault.read(file);
				let updatedContent = content;

				// Use the simplified regex to replace only the link itself with an empty string
				if (linkRegex.test(content)) { // Check if the link exists before modifying
					updatedContent = content.replace(linkRegex, '');

					// Optional: Clean up potential empty list items like "-  " or "*  " left after removal
					// This regex looks for lines starting with list markers followed only by whitespace
					updatedContent = updatedContent.replace(/^[ \t]*[-*+]\s*$/gm, '');
					// Clean up extra blank lines that might result
					updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n').trim();


					if (content !== updatedContent) {
						await this.app.vault.modify(file, updatedContent);
						updatedCount++;
						// console.log(`Removed link from: ${file.path}`); // Maybe too verbose
					}
				}
			} catch (error: any) {
				const errorMsg = `Error removing links from ${file.path} for delete: ${error.message}`;
				console.error(errorMsg);
				errors.push(errorMsg);
			}
		}

		if (updatedCount > 0) {
			const message = `Removed links to "${fileName}" from ${updatedCount} files.`;
			// console.log(message); // Notice is sufficient
			new Notice(message, 5000);
		} else {
			// console.log(`No links found for "${fileName}" to remove.`); // Less critical log
		}
		if (errors.length > 0) {
			new Notice(`Encountered ${errors.length} errors while removing links. Check console.`, 10000);
		}
	}

	// --- LLM API Call Helpers ---

	// Refined API test function
	public async testAPI(provider: LLMProviderConfig): Promise<{ success: boolean; message: string }> {
		// console.log(`Testing connection for ${provider.name}...`); // Logged by caller (Settings/Sidebar)
		try {
			let response: Response;
			let url: string;
			let options: RequestInit = { method: 'GET' }; // Default to GET

			switch (provider.name) {
				case 'Ollama':
					// Check local models endpoint
					url = `${provider.baseUrl}/tags`; // Use /api/tags which lists models
					options.headers = { 'Content-Type': 'application/json' };
					response = await fetch(url, options);
					if (!response.ok) throw new Error(`Ollama API error: ${response.status} - ${await response.text()}`);
					await response.json(); // Ensure response is valid JSON
					return { success: true, message: `Successfully connected to Ollama at ${provider.baseUrl} and listed models.` };

				case 'LMStudio':
					// Try direct POST to chat completions endpoint since OPTIONS may fail
					try {
						// console.log(`Testing LMStudio via chat completions endpoint (${provider.baseUrl}/chat/completions)...`);
						const lmStudioUrl = `${provider.baseUrl}/chat/completions`;
						const lmStudioOptions: RequestInit = {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
							},
							body: JSON.stringify({
								model: provider.model,
								messages: [
									{ role: 'system', content: 'You are a helpful assistant' },
									{ role: 'user', content: 'Hello' }
								],
								temperature: 0.7,
								max_tokens: 10
							})
						};
						// console.log("DEBUG: LMStudio Test - Request Body:", lmStudioOptions.body);
						response = await fetch(lmStudioUrl, lmStudioOptions);
						if (response.ok) {
							// Attempt to parse JSON, but handle cases where LM Studio might return non-JSON on success for simple tests
							try {
								await response.json();
							} catch (jsonError) {
								console.warn("LMStudio test connection response was not valid JSON, but status was OK. Assuming success.");
							}
							return { success: true, message: `Successfully connected to LMStudio API at ${provider.baseUrl} using model '${provider.model}'.` };
						} else {
							const errorText = await response.text();
							// console.error(`DEBUG: LMStudio Test failed (${response.status}): ${errorText}`);
							// Provide a more specific error message if possible
							if (errorText.includes("Could not find model")) {
								throw new Error(`LMStudio API error: Model '${provider.model}' not found or loaded on the server.`);
							}
							throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
						}
					} catch (e: any) {
						// console.error(`DEBUG: LMStudio Test fetch error: ${e.message}`);
						throw new Error(`LMStudio API connection failed: ${e.message}. Is the server running at ${provider.baseUrl}?`);
					}
					// --- End LMStudio Test Logic ---

				case 'OpenRouter':
					// OpenRouter uses OpenAI compatible endpoint but requires specific headers
					// console.log(`Testing OpenRouter via chat completions endpoint...`);
					url = `${provider.baseUrl}/chat/completions`;
					options.method = 'POST';
					options.headers = {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${provider.apiKey}`, // Required
						'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD', // Required by OpenRouter - CORRECTED AGAIN
						'X-Title': 'Notemd Obsidian Plugin' // Required by OpenRouter
					};
					options.body = JSON.stringify({
						model: provider.model, // User specifies the OpenRouter model string
						messages: [{ role: 'user', content: 'Test connection' }],
						max_tokens: 1,
						temperature: 0
					});
					response = await fetch(url, options);
					if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
					await response.json(); // Ensure response is valid JSON
					return { success: true, message: `Successfully connected to OpenRouter API using model '${provider.model}'.` };


				case 'OpenAI':
				case 'Mistral':
				case 'DeepSeek':
					// Try listing models first for these cloud providers
					url = `${provider.baseUrl}/models`;
					options.headers = { 'Authorization': `Bearer ${provider.apiKey}` }; // API Key required
					response = await fetch(url, options);
					// If listing models fails, try a minimal chat completion as fallback
					if (!response.ok) {
						// console.log(`Listing models failed for ${provider.name} (${response.status}), trying minimal chat completion...`);
						url = `${provider.baseUrl}/chat/completions`;
						options.method = 'POST';
						options.headers = {
							...options.headers,
							'Content-Type': 'application/json'
						};
						options.body = JSON.stringify({
							model: provider.model,
							messages: [{ role: 'user', content: 'Test' }],
							max_tokens: 1,
							temperature: 0
						});
						response = await fetch(url, options);
					}
					if (!response.ok) throw new Error(`${provider.name} API error: ${response.status} - ${await response.text()}`);
					await response.json(); // Ensure response is valid JSON
					return { success: true, message: `Successfully connected to ${provider.name} API at ${provider.baseUrl}.` };

				case 'Anthropic':
					// Minimal message request
					url = `${provider.baseUrl}/v1/messages`;
					options.method = 'POST';
					options.headers = {
						'Content-Type': 'application/json',
						'x-api-key': provider.apiKey,
						'anthropic-version': '2023-06-01'
					};
					options.body = JSON.stringify({
						model: provider.model,
						messages: [{ role: 'user', content: 'Test' }],
						max_tokens: 1
					});
					response = await fetch(url, options);
					if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
					await response.json();
					return { success: true, message: `Successfully connected to Anthropic API.` };

				case 'Google':
					// Minimal generateContent request
					url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
					options.method = 'POST';
					options.headers = { 'Content-Type': 'application/json' };
					options.body = JSON.stringify({
						contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
						generationConfig: { maxOutputTokens: 1, temperature: 0 }
					});
					response = await fetch(url, options);
					if (!response.ok) throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
					await response.json();
					return { success: true, message: `Successfully connected to Google API.` };

				case 'Azure OpenAI':
					// Use the provided deployment name (model) and endpoint (baseUrl)
					if (!provider.apiVersion || !provider.baseUrl || !provider.model) {
						throw new Error('Azure requires Base URL, Model (Deployment Name), and API Version.');
					}
					url = `${provider.baseUrl}/openai/deployments/${provider.model}/chat/completions?api-version=${provider.apiVersion}`;
					options.method = 'POST';
					options.headers = {
						'Content-Type': 'application/json',
						'api-key': provider.apiKey
					};
					options.body = JSON.stringify({
						messages: [{ role: 'user', content: 'Test' }],
						max_tokens: 1,
						temperature: 0
					});
					response = await fetch(url, options);
					if (!response.ok) throw new Error(`Azure OpenAI API error: ${response.status} - ${await response.text()}`);
					await response.json();
					return { success: true, message: `Successfully connected to Azure OpenAI deployment '${provider.model}'.` };

				default:
					return { success: false, message: `Connection test not implemented for provider: ${provider.name}` };
			}
		} catch (error: any) {
			console.error(`Connection test failed for ${provider.name}:`, error);
			return { success: false, message: `Connection failed: ${error.message}` };
		}
	}

	// Modified to accept modelName parameter and progressReporter
	private async callDeepSeekAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// Removed the old testAPI call here - connection test should be done separately if desired
		// const isHealthy = await this.testAPI(provider);
		// if (!isHealthy) {
		// 	throw new Error('API connection test failed');
		// }

		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callDeepSeekAPI: Calling URL: ${url}`); // DEBUG
		// console.log(`callDeepSeekAPI: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${provider.apiKey}`
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callDeepSeekAPI: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `DeepSeek API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage); // Store error for potential retry/final throw
					console.warn(`callDeepSeekAPI: Attempt ${attempt} failed: ${userMessage}`); // Log warning on failure

					// Don't retry on certain fatal errors like 401
					if (response.status === 401 || response.status === 400 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic if applicable

				} else {
					// Success path
					const data = await response.json();
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callDeepSeekAPI: Unexpected response format:", data); // Keep error log
						throw new Error(`Unexpected response format from DeepSeek API`);
					}
					// console.log(`callDeepSeekAPI: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error; // Store network or other fetch errors
				console.warn(`callDeepSeekAPI: Attempt ${attempt} failed with error: ${error.message}`);
				// If it's a network error, retry might help. If it's a parsing error, maybe not, but retry anyway.
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callDeepSeekAPI: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// If we reached here, it means the attempt failed (and wasn't aborted) and we might retry
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callDeepSeekAPI: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callDeepSeekAPI: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed, throw the last recorded error
		console.error(`callDeepSeekAPI: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("DeepSeek API call failed after multiple retries."); // Throw the last error
	}

	// Modified to accept modelName parameter and progressReporter
	private async callOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// Add API health check if applicable (assuming a similar /health or equivalent endpoint)
		// const isHealthy = await this.testAPI(provider); // Adapt testAPI or use a provider-specific check
		// if (!isHealthy) { throw new Error('API connection test failed'); }

		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callOpenAIApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callOpenAIApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${provider.apiKey}`
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callOpenAIApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `OpenAI API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key.";
					else if (response.status === 404) userMessage += " - Not Found. Check the Base URL and model name.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callOpenAIApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 401 || response.status === 400 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callOpenAIApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from OpenAI API`);
					}
					// console.log(`callOpenAIApi: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callOpenAIApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callOpenAIApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callOpenAIApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callOpenAIApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callOpenAIApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("OpenAI API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callAnthropicApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		const url = `${provider.baseUrl}/v1/messages`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'user',
				content: `${prompt}\n\n${content}` // Anthropic prefers prompt in user message
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens // Use setting
		};
		// console.log(`callAnthropicApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callAnthropicApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'user', content: `(prompt + content length: ${prompt.length + content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': provider.apiKey,
						'anthropic-version': '2023-06-01' // Use a specific version
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callAnthropicApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `Anthropic API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key.";
					else if (response.status === 403) userMessage += " - Forbidden. Check API key permissions.";
					else if (response.status === 404) userMessage += " - Not Found. Check the Base URL.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callAnthropicApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 401 || response.status === 400 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					if (!data.content || !data.content[0] || !data.content[0].text) {
						console.error("callAnthropicApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from Anthropic API`);
					}
					// console.log(`callAnthropicApi: Attempt ${attempt} successful. Returning content length: ${data.content[0].text.length}`); // DEBUG
					return data.content[0].text; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callAnthropicApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callAnthropicApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callAnthropicApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callAnthropicApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callAnthropicApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("Anthropic API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callGoogleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// Google API doesn't have a standard /health endpoint. Skipping testAPI.
		// const isHealthy = await this.testAPI(provider);
		// if (!isHealthy) { throw new Error('API connection test failed'); }

		// Use API key in query parameter for Google Gemini
		const urlWithKey = `${provider.baseUrl}/models/${modelName}:generateContent?key=${provider.apiKey}`; // Use passed modelName
		const requestBody = {
			contents: [
				// { role: 'system', parts: [{ text: prompt }] }, // Optional system prompt
				{ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] }
			],
			generationConfig: {
				temperature: provider.temperature,
				maxOutputTokens: this.settings.maxTokens
			}
		};
		// console.log(`callGoogleApi: Calling URL: ${urlWithKey}`); // DEBUG
		// console.log(`callGoogleApi: Request Body (excluding content):`, { ...requestBody, contents: [{ role: 'user', parts: [{ text: `(prompt + content length: ${prompt.length + content.length})` }] }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(urlWithKey, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callGoogleApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `Google API error: ${response.status}`;
					if (response.status === 400) userMessage += " - Bad Request. Check API key or request format.";
					else if (response.status === 403) userMessage += " - Forbidden. Check API key permissions.";
					else if (response.status === 404) userMessage += " - Not Found. Check the Base URL and model name.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callGoogleApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
						console.error("callGoogleApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from Google API`);
					}
					// console.log(`callGoogleApi: Attempt ${attempt} successful. Returning content length: ${data.candidates[0].content.parts[0].text.length}`); // DEBUG
					return data.candidates[0].content.parts[0].text; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callGoogleApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callGoogleApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callGoogleApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callGoogleApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callGoogleApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("Google API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callMistralApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callMistralApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callMistralApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${provider.apiKey}`
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callMistralApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `Mistral API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key.";
					else if (response.status === 404) userMessage += " - Not Found. Check the Base URL and model name.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callMistralApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 401 || response.status === 400 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callMistralApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from Mistral API`);
					}
					// console.log(`callMistralApi: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callMistralApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callMistralApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callMistralApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callMistralApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callMistralApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("Mistral API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter (used as deployment name) and progressReporter
	private async callAzureOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		if (!provider.apiVersion) {
			throw new Error('API version is required for Azure OpenAI');
		}
		if (!provider.baseUrl) {
			throw new Error('Base URL (endpoint) is required for Azure OpenAI');
		}

		// Construct the full URL for Azure deployment using passed modelName (deployment name)
		const url = `${provider.baseUrl}/openai/deployments/${modelName}/chat/completions?api-version=${provider.apiVersion}`;
		const requestBody = {
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callAzureOpenAIApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callAzureOpenAIApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'api-key': provider.apiKey // Azure uses 'api-key' header
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callAzureOpenAIApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `Azure OpenAI API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key and endpoint.";
					else if (response.status === 404) userMessage += " - Not Found. Check the endpoint and deployment name (model).";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callAzureOpenAIApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 401 || response.status === 400 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callAzureOpenAIApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from Azure OpenAI API`);
					}
					// console.log(`callAzureOpenAIApi: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callAzureOpenAIApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callAzureOpenAIApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callAzureOpenAIApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callAzureOpenAIApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callAzureOpenAIApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("Azure OpenAI API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callLMStudioApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// LMStudio uses OpenAI compatible endpoint
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callLMStudioApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callLMStudioApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						// LMStudio might need a placeholder key, even if not validated
						'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callLMStudioApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `LMStudio API error: ${response.status}`;
					if (response.status === 404) userMessage += " - Not Found. Check the Base URL (e.g., http://localhost:1234/v1).";
					else if (errorText.includes("Could not find model")) userMessage += ` - Model '${provider.model}' not found or loaded.`;
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callLMStudioApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors like model not found or bad request
					if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || errorText.includes("Could not find model")) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					// Standard OpenAI response format expected
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callLMStudioApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from LMStudio`);
					}
					// console.log(`callLMStudioApi: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callLMStudioApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callLMStudioApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callLMStudioApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callLMStudioApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callLMStudioApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("LMStudio API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callOllamaApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// Ollama has a different endpoint and request structure
		const url = `${provider.baseUrl}/chat`; // Endpoint is /api/chat
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			options: {
				temperature: provider.temperature,
				num_predict: this.settings.maxTokens
			},
			stream: false
		};
		// console.log(`callOllamaApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callOllamaApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						// No API key needed for Ollama
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callOllamaApi: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `Ollama API error: ${response.status}`;
					if (response.status === 404) userMessage += " - Not Found. Check the Base URL (e.g., http://localhost:11434/api) and ensure Ollama is running.";
					else if (errorText.includes("model not found")) userMessage += ` - Model '${provider.model}' not found.`;
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callOllamaApi: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors like model not found or bad request
					if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || errorText.includes("model not found")) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					// Ollama's response structure is different
					if (!data.message || !data.message.content) {
						console.error("callOllamaApi: Unexpected response format:", data);
						throw new Error(`Unexpected response format from Ollama`);
					}
					// console.log(`callOllamaApi: Attempt ${attempt} successful. Returning content length: ${data.message.content.length}`); // DEBUG
					return data.message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error;
				console.warn(`callOllamaApi: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callOllamaApi: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callOllamaApi: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callOllamaApi: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callOllamaApi: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("Ollama API call failed after multiple retries.");
	}

	// Modified to accept modelName parameter and progressReporter
	private async callOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter): Promise<string> {
		// OpenRouter uses OpenAI compatible endpoint but requires specific headers
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: modelName, // Use passed modelName
			messages: [{
				role: 'system',
				content: prompt
			}, {
				role: 'user',
				content: content
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens
		};
		// console.log(`callOpenRouterAPI: Calling URL: ${url}`); // DEBUG
		// console.log(`callOpenRouterAPI: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'system', content: '...' }, { role: 'user', content: `(length: ${content.length})` }] }); // DEBUG

		let lastError: Error | null = null;
		const maxAttempts = this.settings.enableStableApiCall ? this.settings.apiCallMaxRetries + 1 : 1;
		const intervalSeconds = this.settings.enableStableApiCall ? this.settings.apiCallInterval : 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const controller = new AbortController();
			progressReporter.abortController = controller; // Store controller
			try {
				const response = await fetch(url, {
					method: 'POST',
					signal: controller.signal, // Pass signal to fetch
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${provider.apiKey}`, // Required
						'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD', // Required by OpenRouter
						'X-Title': 'Notemd Obsidian Plugin' // Required by OpenRouter
					},
					body: JSON.stringify(requestBody)
				});

				// console.log(`callOpenRouterAPI: Attempt ${attempt}/${maxAttempts} - Response Status: ${response.status}`); // DEBUG
				if (!response.ok) {
					const errorText = await response.text();
					let userMessage = `OpenRouter API error: ${response.status}`;
					if (response.status === 401) userMessage += " - Unauthorized. Check your API key.";
					else if (response.status === 402) userMessage += " - Payment Required / Quota Exceeded.";
					else if (response.status === 404) userMessage += " - Not Found. Check the Base URL and model name.";
					else if (response.status === 429) userMessage += " - Rate limit exceeded."; // Retry might help
					else if (response.status >= 500) userMessage += " - Server error."; // Retry might help
					else userMessage += ` - ${errorText}`; // Include original text for other errors

					lastError = new Error(userMessage);
					console.warn(`callOpenRouterAPI: Attempt ${attempt} failed: ${userMessage}`);

					// Don't retry on fatal errors
					if (response.status === 401 || response.status === 400 || response.status === 402 || response.status === 403 || response.status === 404) {
						throw lastError;
					}
					// Continue to retry logic

				} else {
					// Success path
					const data = await response.json();
					// Standard OpenAI response format expected
					if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
						console.error("callOpenRouterAPI: Unexpected response format:", data);
						throw new Error(`Unexpected response format from OpenRouter`);
					}
					// console.log(`callOpenRouterAPI: Attempt ${attempt} successful. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
					return data.choices[0].message.content; // Return on success
				}

			} catch (error: any) {
				lastError = error; // Includes fetch errors caught by the outer try-catch
				console.warn(`callOpenRouterAPI: Attempt ${attempt} failed with error: ${error.message}`);
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					console.log("callOpenRouterAPI: Fetch aborted by user cancellation.");
					throw new Error("API call cancelled by user."); // Re-throw specific error
				}
			} finally {
				// Clear the controller from the reporter once this attempt is done
				if (progressReporter.abortController === controller) {
					progressReporter.abortController = null;
				}
			}

			// Wait before retrying if applicable (and not aborted)
			if (attempt < maxAttempts) {
				// Check for cancellation BEFORE waiting
				if (progressReporter.cancelled) {
					console.log("callOpenRouterAPI: Cancellation detected before retry wait.");
					throw new Error("Processing cancelled by user during API retry wait.");
				}
				console.log(`callOpenRouterAPI: Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
				await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
			}
		}

		// If all attempts failed
		console.error(`callOpenRouterAPI: All ${maxAttempts} attempts failed.`);
		throw lastError || new Error("OpenRouter API call failed after multiple retries.");
	}


	// --- Main Processing Logic ---

	public splitContent(content: string): string[] {
		const maxWords = this.settings.chunkWordCount; // Use setting
		// Split content by paragraphs, keeping the separators
		const paragraphs = content.split(/(\n\s*\n)/);
		const chunks: string[] = [];
		let currentChunkParts: string[] = [];
		let currentWordCount = 0;

		// Helper function to count words in a string
		const countWords = (text: string): number => {
			return text.trim().split(/\s+/).filter(Boolean).length;
		};

		for (let i = 0; i < paragraphs.length; i++) {
			const part = paragraphs[i];
			const partWordCount = countWords(part);

			// If adding this part exceeds the word limit and the current chunk is not empty, finalize the current chunk
			if (currentWordCount + partWordCount > maxWords && currentChunkParts.length > 0) {
				chunks.push(currentChunkParts.join('').trim());
				// Start new chunk with the current part (unless it's just whitespace/separator)
				currentChunkParts = (part.trim() === '') ? [] : [part];
				currentWordCount = (part.trim() === '') ? 0 : partWordCount;
			} else {
				// Add the part to the current chunk
				currentChunkParts.push(part);
				currentWordCount += partWordCount;
			}
		}

		// Add the last remaining chunk if it has content
		if (currentChunkParts.length > 0) {
			const lastChunk = currentChunkParts.join('').trim();
			if (lastChunk) {
				chunks.push(lastChunk);
			}
			}
		// console.log(`Split content into ${chunks.length} chunks based on maxWords=${maxWords}`);
		return chunks;
	}




	// Restore original function signature and logic
	async processContentWithLLM(content: string, progressReporter: ProgressReporter): Promise<string> {
		// console.log("Entering processContentWithLLM"); // DEBUG
		// Use helper functions to get the correct provider and model for this task
		const provider = this.getProviderForTask('addLinks');
		if (!provider) {
			console.error("processContentWithLLM: Could not determine a valid provider for 'addLinks' task!"); // Keep error log
			throw new Error('No valid LLM provider configured for the "Add Links" task.');
		}
		const modelName = this.getModelForTask('addLinks', provider);
		// console.log(`processContentWithLLM: Using provider: ${provider.name}, Model: ${modelName}, BaseURL: ${provider.baseUrl}`); // DEBUG
		// Allow empty API key for local providers like Ollama, LMStudio might need 'EMPTY'
		if (!provider.apiKey && provider.name !== 'Ollama' && provider.name !== 'LMStudio') {
			// Check if it's Azure with managed identity (no key needed) - needs more robust check
			if (provider.name !== 'Azure OpenAI' /* && !isManagedIdentity */) {
				console.error(`processContentWithLLM: API key missing for ${provider.name}`); // Keep error log
				throw new Error(`API key not configured for selected provider: ${provider.name}`);
			}
		}
		if (provider.name === 'Azure OpenAI' && !provider.baseUrl) {
			console.error("processContentWithLLM: Base URL missing for Azure OpenAI"); // Keep error log
			throw new Error('Base URL (endpoint) is required for Azure OpenAI');
		}

		// Split content into chunks if needed
		// console.log("processContentWithLLM: Calling splitContent..."); // DEBUG
		const chunks = this.splitContent(content); // Use configured word count
		let processedChunks: string[] = [];
		const totalChunks = chunks.length;
		progressReporter.log(`Splitting content into ${totalChunks} chunks.`);
		// console.log(`processContentWithLLM: Content split into ${totalChunks} chunks.`); // DEBUG

		for (let i = 0; i < totalChunks; i++) {
			// Check for cancellation before processing each chunk
			if (progressReporter.cancelled) {
				// console.log("processContentWithLLM: Processing cancelled by user during chunk processing."); // DEBUG
				throw new Error("Processing cancelled by user."); // Re-throw to be caught by caller
			}

			const chunk = chunks[i];
			// console.log(`processContentWithLLM: Processing chunk ${i + 1}/${totalChunks} (Length: ${chunk.length})`); // DEBUG
			// Calculate progress based on chunks completed
			const chunkProgress = Math.floor(((i) / totalChunks) * 100); // Progress before starting current chunk
			progressReporter.updateStatus(`Processing chunk ${i + 1}/${totalChunks}...`, chunkProgress);
			progressReporter.log(`Processing chunk ${i + 1}/${totalChunks}...`);
			// // console.log(`Processing chunk ${i + 1}/${totalChunks}`); // Redundant with log above


			// Refined prompt based on PowerShell script rules
			const prompt = `Completely decompose and structure the knowledge points in this markdown document, outputting them in markdown format supported by Obsidian. Core knowledge points should be labelled with Obsidian's backlink format [[]]. Do not output anything other than the original text and the requested "Obsidian's backlink format [[]]".

Rules:
1. Only add Obsidian backlinks [[like this]] to core concepts. Do not modify the original text content or formatting otherwise.
2. Skip conventional names (common products, company names, dates, times, individual names) unless they represent a core technical or scientific concept within the text's context.
3. Output the *entire* original content of the chunk, preserving all formatting (headers, lists, code blocks, etc.), with only the added backlinks.
4. Handle duplicate concepts carefully:
    a. If both singular and plural forms of a word/concept appear (e.g., "model" and "models"), only add the backlink to the *first occurrence* of the *singular* form (e.g., [[model]]). Do not link the plural form.
    b. If a single-word concept (e.g., "relaxation") also appears as part of a multi-word concept (e.g., "dielectric relaxation"), only add the backlink to the *multi-word* concept (e.g., [[dielectric relaxation]]). Do not link the standalone single word in this case.
    c. Do not add duplicate backlinks for the exact same concept within this chunk. Link only the first meaningful occurrence.
5. Ignore any "References", "Bibliography", or similar sections, typically found at the end of documents. Do not add backlinks within these sections.`;

			try {
				let responseText;
				// console.log(`processContentWithLLM: Calling API function for provider: ${provider.name} with model ${modelName}`); // DEBUG
				switch (provider.name) {
					case 'DeepSeek':
						responseText = await this.callDeepSeekAPI(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'OpenAI':
						responseText = await this.callOpenAIApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'Anthropic':
						responseText = await this.callAnthropicApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'Google':
						responseText = await this.callGoogleApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'Mistral':
						responseText = await this.callMistralApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'Azure OpenAI':
						responseText = await this.callAzureOpenAIApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'LMStudio':
						responseText = await this.callLMStudioApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'Ollama':
						responseText = await this.callOllamaApi(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					case 'OpenRouter':
						responseText = await this.callOpenRouterAPI(provider, modelName, prompt, chunk, progressReporter); // Pass reporter
						break;
					default:
						console.error(`processContentWithLLM: Unsupported provider: ${provider.name}`); // Keep error log
						throw new Error(`Unsupported provider: ${provider.name}`);
				}
				// console.log(`processContentWithLLM: Received response for chunk ${i + 1}. Length: ${responseText?.length ?? 'null/undefined'}`); // DEBUG
				processedChunks.push(responseText); // Store processed chunk
				progressReporter.log(`Chunk ${i + 1} processed successfully.`);
			} catch (error: any) { // Added type annotation for error
				console.error(`processContentWithLLM: LLM processing error on chunk ${i + 1}:`, error); // Keep error log
				progressReporter.log(`Error processing chunk ${i + 1}: ${error.message}`);
				// Removed Notice pop-up for silent batch processing
				// new Notice(`LLM Error (${provider.name}) on chunk ${i + 1}: ${error.message}`);
				// Re-throw error to be handled by the calling function (processFile or processWithNotemd)
				throw error;
			}
		} // End of chunk loop

		// Update progress to 100% after loop finishes successfully
		progressReporter.updateStatus('Merging processed chunks...', 100); // Update final status before returning
		// console.log("processContentWithLLM: Finished processing all chunks. Joining results."); // DEBUG

		// Join chunks with double newline, ensuring no triple+ newlines
		const finalResult = processedChunks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
		// console.log(`processContentWithLLM: Final merged content length: ${finalResult.length}`); // DEBUG
		return finalResult;
	}

	// --- Post-Processing ---

	generateObsidianLinks(content: string): string {
		// Extract key concepts using the LLM-generated links
		const concepts = new Set<string>();
		const linkRegex = /\[\[([^\[\]]+)\]\]/g; // Find existing links generated by LLM
		let match;

		while ((match = linkRegex.exec(content)) !== null) {
			const concept = match[1].trim();
			// Basic filtering: avoid empty links, very short terms, or pure numbers
			if (concept && concept.length > 1 && !/^\d+$/.test(concept)) {
				concepts.add(concept);
			}
		}

		// Create notes for discovered concepts if the setting is enabled and a path is provided
		if (this.settings.useCustomConceptNoteFolder && this.settings.conceptNoteFolder && concepts.size > 0) {
			// Run asynchronously but don't wait for it here to avoid blocking UI
			this.createConceptNotes(concepts).catch(error => {
				console.error("Error during background concept note creation:", error);
				new Notice("Error creating some concept notes. See console.");
			});
		}

		// Return the content as is, assuming the LLM included the links.
		return content;
	}

	async createConceptNotes(concepts: Set<string>) {
		// Check if concept note creation is enabled and a path is set
		if (!this.settings.useCustomConceptNoteFolder || !this.settings.conceptNoteFolder) {
			// console.log("Concept note creation is disabled or no folder path is set."); // Less critical log
			return;
		}

		const folderPath = this.settings.conceptNoteFolder; // Use the new setting
		const newlyCreatedConcepts: string[] = []; // Track newly created concepts for logging

		let createdCount = 0;
		let updatedCount = 0;

		try {
			// Ensure the target folder exists
			const targetFolder = this.app.vault.getAbstractFileByPath(folderPath);
			if (!targetFolder) {
				try {
					await this.app.vault.createFolder(folderPath);
					// console.log(`Created concept note folder: ${folderPath}`);
				} catch (folderError: any) {
					// console.error(`DEBUG: createFolder failed specifically for concept note path: '${folderPath}'`, folderError);
					new Notice(`Error creating concept note folder: ${folderError.message}`);
					throw folderError; // Stop concept note creation if folder fails
				}
			} else if (!(targetFolder instanceof TFolder)) {
				throw new Error(`Concept note output path '${folderPath}' exists but is not a folder.`);
			}

			for (const concept of concepts) {
				// Sanitize concept name for filename using the new normalization function
				let safeName = this.normalizeNameForFilePath(concept);

				// Limit filename length (e.g., 100 chars) to avoid issues
				if (safeName.length > 100) {
					safeName = safeName.substring(0, 100).trim();
				}
				// Ensure not empty or just dots after sanitization
				if (!safeName || /^\.+$/.test(safeName)) {
					console.warn(`Skipping concept note creation for invalid/empty name derived from: "${concept}"`);
					continue;
				}

				const notePath = `${folderPath}/${safeName}.md`;
				const existingFile = this.app.vault.getAbstractFileByPath(notePath);

				try {
					if (existingFile && existingFile instanceof TFile) {
						// Update existing note: Add backlink if not already present and source file is known
						if (this.currentProcessingFile) {
							let existingContent = await this.app.vault.read(existingFile);
							const backlink = `[[${this.currentProcessingFile}]]`;
							const linkedFromHeader = `## Linked From`;
							const backlinkLine = `- ${backlink}`;

							// Avoid adding duplicate backlink lines
							if (!existingContent.includes(backlinkLine)) {
								let newContent = existingContent.trim();
								const headerIndex = newContent.indexOf(linkedFromHeader);

								if (headerIndex !== -1) {
									// Find the end of the "Linked From" section (next header or end of file)
									const nextHeaderIndex = newContent.indexOf('\n## ', headerIndex + 1);
									const insertionPoint = (nextHeaderIndex !== -1) ? nextHeaderIndex : newContent.length;
									// Insert the backlink line at the end of the section
									newContent = newContent.substring(0, insertionPoint).trim() + `\n${backlinkLine}` + newContent.substring(insertionPoint).trim();
								} else {
									// Add the header and the backlink line
									newContent += `\n\n${linkedFromHeader}\n${backlinkLine}`;
								}

								// Only modify if content actually changed
								if (newContent.trim() !== existingContent.trim()) {
									await this.app.vault.modify(existingFile, newContent.trim());
									updatedCount++;
								}
							}
						}
					} else if (!existingFile) {
						// Create new note with template
						let newNoteContent = `# ${concept}\n`; // Use original concept for title
						if (this.currentProcessingFile) {
							newNoteContent += `\n## Linked From\n- [[${this.currentProcessingFile}]]`;
						}
						await this.app.vault.create(notePath, newNoteContent.trim());
						createdCount++;
						newlyCreatedConcepts.push(concept); // Log this concept name
					}
				} catch (fileOpError: any) {
					console.error(`Error processing concept note "${notePath}": ${fileOpError.message}`);
					// Optionally add to a list of errors to report later
				}
			} // End for loop

			// if (createdCount > 0) console.log(`Created ${createdCount} new concept notes.`); // Less critical logs
			// if (updatedCount > 0) console.log(`Updated ${updatedCount} existing concept notes with backlinks.`); // DEBUG

			// --- Generate Concept Log File ---
			if (this.settings.generateConceptLogFile && newlyCreatedConcepts.length > 0) {
				// console.log(`Calling generateConceptLog for ${newlyCreatedConcepts.length} concepts.`); // DEBUG
				await this.generateConceptLog(newlyCreatedConcepts);
			} else {
				// console.log(`Skipping concept log generation. Setting: ${this.settings.generateConceptLogFile}, New Concepts: ${newlyCreatedConcepts.length}`); // DEBUG
			}

		} catch (error: any) { // Added type annotation
			console.error("Error creating concept notes:", error);
			new Notice(`Error creating concept notes: ${error.message}. Check console.`);
			// Optionally log to modal if passed, but this function isn't currently called with it
			// progressModal?.log(`Error creating concept notes: ${error.message}`);
		}
	}

	// --- Concept Log File Generation ---
	async generateConceptLog(createdConcepts: string[]) {
		let logFolderPath = '';
		// Determine folder path
		if (this.settings.useCustomConceptLogFolder && this.settings.conceptLogFolderPath) {
			logFolderPath = this.settings.conceptLogFolderPath;
		} else if (this.settings.useCustomConceptNoteFolder && this.settings.conceptNoteFolder) {
			// Fallback to concept note folder if custom log folder isn't set/used
			logFolderPath = this.settings.conceptNoteFolder;
		}
		// Vault root ('/') is the ultimate fallback if neither custom log nor concept note folder is specified

		// Normalize folder path (remove leading/trailing slashes, ensure trailing slash if not root)
		logFolderPath = logFolderPath.replace(/^\/|\/$/g, '');
		if (logFolderPath) {
			logFolderPath += '/';
		}

		// Determine file name
		const logFileName = (this.settings.useCustomConceptLogFileName && this.settings.conceptLogFileName)
			? this.settings.conceptLogFileName
			: DEFAULT_SETTINGS.conceptLogFileName; // Default to 'Generate.log'

		// Ensure filename ends with .log (redundant check if settings validation works, but safe)
		const finalLogFileName = logFileName.toLowerCase().endsWith('.log') ? logFileName : `${logFileName}.log`;

		const logFilePath = `${logFolderPath}${finalLogFileName}`;

		// Format log content
		let logContent = `generate ${createdConcepts.length} concepts md file\n`;
		createdConcepts.forEach((concept, index) => {
			logContent += `${index + 1}. ${concept}\n`;
		});

		try {
			// Ensure target folder exists
			const targetLogFolder = logFolderPath.replace(/\/$/, ''); // Remove trailing slash for check/create
			if (targetLogFolder && !this.app.vault.getAbstractFileByPath(targetLogFolder)) {
				try {
					await this.app.vault.createFolder(targetLogFolder);
					console.log(`Created concept log folder: ${targetLogFolder}`);
				} catch (folderError: any) {
					console.error(`Error creating concept log folder ${targetLogFolder}:`, folderError);
					new Notice(`Error creating concept log folder: ${folderError.message}`);
					// Don't throw, just log the error and skip log file creation
					return;
				}
			} else if (targetLogFolder && !(this.app.vault.getAbstractFileByPath(targetLogFolder) instanceof TFolder)) {
				new Notice(`Concept log output path '${targetLogFolder}' exists but is not a folder. Cannot create log file.`);
				return; // Skip log file creation
			}

			// Check if log file exists - overwrite if it does
			const existingLogFile = this.app.vault.getAbstractFileByPath(logFilePath);
			if (existingLogFile instanceof TFile) {
				await this.app.vault.modify(existingLogFile, logContent.trim());
				new Notice(`Overwrote concept log file: ${logFilePath}`);
			} else {
				await this.app.vault.create(logFilePath, logContent.trim());
				new Notice(`Created concept log file: ${logFilePath}`);
			}
		} catch (error: any) {
			console.error(`Error writing concept log file to ${logFilePath}:`, error);
			new Notice(`Error writing concept log file: ${error.message}`);
		}
	}


	// --- Duplicate Handling (Refined) ---

	// Simple duplicate word/phrase detection within the *current* content
	findDuplicates(content: string): Set<string> {
		const duplicates = new Set<string>();
		const seenWords = new Set<string>();
		const lines = content.split('\n');

		lines.forEach(line => {
			// Match words (sequences of letters/numbers, possibly with internal hyphens/apostrophes)
			const words = line.match(/[\p{L}\p{N}]+(?:['\-][\p{L}\p{N}]+)*/gu) || [];
			words.forEach(word => {
				// Normalize: lowercase, remove possessive 's
				const normalized = word.toLowerCase().replace(/'s$/, '');
				if (normalized.length > 2) { // Ignore very short words
					if (seenWords.has(normalized)) {
						duplicates.add(normalized);
					}
					seenWords.add(normalized);
				}
			});
		});

		return duplicates;
	}

	// Placeholder for more advanced duplicate handling based on PowerShell logic
	// This version focuses on *detecting* potential issues within the processed text,
	// rather than deleting files across the vault.
	async handleDuplicates(content: string) {
		if (!this.settings.enableDuplicateDetection) {
			console.log("Duplicate detection is disabled in settings."); // Restore this log for the test case
			return; // Skip if disabled
		}

		const potentialIssues = new Set<string>();

		// 1. Basic Duplicate Word Check (using the refined findDuplicates)
		const duplicateWords = this.findDuplicates(content);
		duplicateWords.forEach(word => potentialIssues.add(`Duplicate word: "${word}"`));

		// 2. Plural/Singular Check (Simple version within content)
		const words = Array.from(this.getAllWords(content));
		const wordSet = new Set(words.map(w => w.toLowerCase()));

		words.forEach(word => {
			const lowerWord = word.toLowerCase();
			let singular = '';
			if (lowerWord.endsWith('ies') && lowerWord.length > 3) {
				singular = lowerWord.substring(0, lowerWord.length - 3) + 'y';
			} else if (lowerWord.endsWith('es') && lowerWord.length > 2) {
				singular = lowerWord.substring(0, lowerWord.length - 2);
			} else if (lowerWord.endsWith('s') && lowerWord.length > 1) {
				singular = lowerWord.substring(0, lowerWord.length - 1);
			}

			if (singular && wordSet.has(singular)) {
				potentialIssues.add(`Plural/Singular pair found: "${singular}" / "${lowerWord}"`);
			}
		});

		// 3. Symbol Normalization Check (Example: find words differing only by hyphen/space)
		const normalizedMap = new Map<string, string[]>();
		words.forEach(word => {
			const normalized = word.toLowerCase().replace(/[-_\s]/g, ''); // Remove hyphens, underscores, spaces
			if (normalized.length > 3) {
				const list = normalizedMap.get(normalized) || [];
				if (!list.includes(word)) { // Avoid adding same word multiple times
					list.push(word);
					normalizedMap.set(normalized, list);
				}
			}
		});
		normalizedMap.forEach(list => {
			if (list.length > 1) {
				potentialIssues.add(`Potential normalization conflict: ${list.join(' vs ')}`);
			}
		});


		// Report findings
		if (potentialIssues.size > 0) {
			new Notice(`Found ${potentialIssues.size} potential duplicate/consistency issues in processed content. Check console.`);
			console.log('Potential duplicate/consistency issues found in content:', Array.from(potentialIssues)); // Keep this log as it's user-facing via Notice
		}
	}

	// Helper to get all unique words from content
	private getAllWords(content: string): Set<string> {
		const words = new Set<string>();
		const lines = content.split('\n');
		lines.forEach(line => {
			const lineWords = line.match(/[\p{L}\p{N}]+(?:['\-][\p{L}\p{N}]+)*/gu) || [];
			lineWords.forEach(word => words.add(word));
		});
		return words;
	}

	// --- Sidebar View Activation ---
	async activateView() {
		// Check if the view is already open
		const existingLeaves = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE);
		if (existingLeaves.length > 0) {
			// Reveal the existing view
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return;
		}

		// Create a new leaf in the right sidebar
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: NOTEMD_SIDEBAR_VIEW_TYPE,
				active: true,
			});
			this.app.workspace.revealLeaf(leaf);
		} else {
			// Fallback if right leaf doesn't exist (should be rare)
			console.error("Could not get right sidebar leaf to activate Notemd view.");
			new Notice("Could not open Notemd sidebar.");
		}
	}

	/**
	 * Normalizes a concept name for use as a file path.
	 * - Replaces hyphens and underscores with spaces.
	 * - Removes characters invalid for file paths and Obsidian links.
	 * - Collapses multiple spaces to single spaces.
	 * - Trims leading/trailing whitespace.
	 * Inspired by process_string from mermaid.py.
	 * @param name The concept name to normalize.
	 * @returns A normalized string suitable for file paths.
	 */
	private normalizeNameForFilePath(name: string): string {
		let normalized = name;
		// Replace hyphens and underscores with spaces first
		normalized = normalized.replace(/[-_]/g, ' ');
		// Remove invalid file path characters and Obsidian link characters
		normalized = normalized.replace(/[\\/:*?"<>|#^[\]]/g, '');
		// Collapse multiple spaces and trim
		normalized = normalized.replace(/\s+/g, ' ').trim();
		return normalized;
	}

	/**
	 * Gets the appropriate LLM provider configuration for a specific task.
	 * Respects the `useMultiModelSettings` flag.
	 * @param taskType The type of task being performed.
	 * @returns The LLMProviderConfig or undefined if no valid provider is found.
	 */
	private getProviderForTask(taskType: 'addLinks' | 'research' | 'generateTitle'): LLMProviderConfig | undefined {
		let providerName: string;
		if (this.settings.useMultiModelSettings) {
			switch (taskType) {
				case 'addLinks':
					providerName = this.settings.addLinksProvider;
					break;
				case 'research':
					providerName = this.settings.researchProvider;
					break;
				case 'generateTitle':
					providerName = this.settings.generateTitleProvider;
					break;
				default:
					console.warn(`Unknown task type '${taskType}' in getProviderForTask. Falling back to active provider.`);
					providerName = this.settings.activeProvider; // Fallback
			}
		} else {
			providerName = this.settings.activeProvider;
		}

		const provider = this.settings.providers.find(p => p.name === providerName);

		if (!provider) {
			const errorMsg = `Provider configuration not found for name: '${providerName}' (Task: ${taskType}).`;
			console.error(errorMsg);
			// Fallback to the globally active provider if the task-specific one is missing/invalid
			const fallbackProvider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
			if (fallbackProvider && providerName !== this.settings.activeProvider) {
				new Notice(`${errorMsg} Falling back to active provider '${this.settings.activeProvider}'.`);
				return fallbackProvider;
			} else {
				// If even the active provider isn't found, return undefined
				new Notice(`${errorMsg} Active provider '${this.settings.activeProvider}' also not found.`);
				return undefined;
			}
		}
		return provider;
	}

	/**
	 * Gets the appropriate model name for a specific task.
	 * Respects the `useMultiModelSettings` flag and task-specific model overrides.
	 * Falls back to the provider's default model if override is not set.
	 * @param taskType The type of task being performed.
	 * @param provider The LLMProviderConfig determined for this task.
	 * @returns The model name string to use.
	 */
	private getModelForTask(taskType: 'addLinks' | 'research' | 'generateTitle', provider: LLMProviderConfig): string {
		let modelName: string | undefined | null = provider.model; // Start with provider's default

		if (this.settings.useMultiModelSettings) {
			switch (taskType) {
				case 'addLinks':
					// Use override if it's not empty, otherwise stick with provider default
					modelName = this.settings.addLinksModel?.trim() || provider.model;
					break;
				case 'research':
					modelName = this.settings.researchModel?.trim() || provider.model;
					break;
				case 'generateTitle':
					modelName = this.settings.generateTitleModel?.trim() || provider.model;
					break;
				default:
					// Should not happen if taskType is correctly typed, but keep fallback
					console.warn(`Unknown task type '${taskType}' in getModelForTask. Using provider default.`);
					modelName = provider.model;
			}
		} else {
			// If not using multi-model settings, always use the active provider's model
			// (The passed 'provider' should already be the active one in this case)
			modelName = provider.model;
		}

		// Ensure we return a valid string, defaulting to provider's model if somehow null/undefined
		return modelName || provider.model;
	}


	/**
	 * Generates the system prompt for the LLM processing task (adding backlinks).
	 * @returns The prompt string.
	 */
	private getLLMProcessingPrompt(): string {
		// Refined prompt based on PowerShell script rules
		return `Completely decompose and structure the knowledge points in this markdown document, outputting them in markdown format supported by Obsidian. Core knowledge points should be labelled with Obsidian's backlink format [[]]. Do not output anything other than the original text and the requested "Obsidian's backlink format [[]]".

Rules:
1. Only add Obsidian backlinks [[like this]] to core concepts. Do not modify the original text content or formatting otherwise.
2. Skip conventional names (common products, company names, dates, times, individual names) unless they represent a core technical or scientific concept within the text's context.
3. Output the *entire* original content of the chunk, preserving all formatting (headers, lists, code blocks, etc.), with only the added backlinks.
4. Handle duplicate concepts carefully:
    a. If both singular and plural forms of a word/concept appear (e.g., "model" and "models"), only add the backlink to the *first occurrence* of the *singular* form (e.g., [[model]]). Do not link the plural form.
    b. If a single-word concept (e.g., "relaxation") also appears as part of a multi-word concept (e.g., "dielectric relaxation"), only add the backlink to the *multi-word* concept (e.g., [[dielectric relaxation]]). Do not link the standalone single word in this case.
    c. Do not add duplicate backlinks for the exact same concept within this chunk. Link only the first meaningful occurrence.
5. Ignore any "References", "Bibliography", or similar sections, typically found at the end of documents. Do not add backlinks within these sections.`;
	}

	/**
	 * Generates content for a given note based on its title using an LLM.
	 * Replaces the entire note content with the generated documentation.
	 * @param file The TFile object to process.
	 * @param progressReporter Interface for reporting progress (Modal or Sidebar).
	 */
	async generateContentForTitle(file: TFile, progressReporter: ProgressReporter) {
		// Use the passed file argument instead of relying on the active file
		// const activeFile = this.app.workspace.getActiveFile();
		if (!file || !(file instanceof TFile) || file.extension !== 'md') {
			// Adjust error message slightly
			new Notice('Invalid file provided for content generation.');
			progressReporter.log(`Error: Invalid file provided: ${file?.path || 'undefined'}`);
			progressReporter.updateStatus('Error: Invalid file', -1);
			if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 2000);
			return;
		}

		const title = file.basename; // Use basename from the passed file
		// Use helper functions to get the correct provider and model for this task
		const provider = this.getProviderForTask('generateTitle');
		if (!provider) {
			// Error is handled by getProviderForTask, but throw specific error here too
			new Notice('No valid LLM provider configured for the "Generate from Title" task.');
			progressReporter.log('Error: No active LLM provider configured.');
			progressReporter.updateStatus('Error: No provider', -1);
			if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 2000);
			return;
		}
		const modelName = this.getModelForTask('generateTitle', provider);

		// Clear display and start progress reporting
		// Clear display and start progress reporting (if it's the first file in a batch, this is fine)
		// progressReporter.clearDisplay(); // Caller (batch function or single command) should handle clearing
		progressReporter.updateStatus(`Generating content for "${title}"...`, 5); // Status update is fine
		progressReporter.log(`Starting content generation for: ${file.name}`);
		this.updateStatusBar(`Generating: ${file.name}`);

		try {
			let researchContext = '';
			// --- Conditional Research ---
			if (this.settings.enableResearchInGenerateContent) {
				progressReporter.log(`Research enabled for "${title}". Performing web search...`);
				progressReporter.updateStatus(`Researching "${title}"...`, 10);
				try {
					// Use the refactored research logic
					const context = await this._performResearch(title, progressReporter);
					if (context) {
						researchContext = context;
						progressReporter.log(`Research context obtained for "${title}".`);
						progressReporter.updateStatus(`Summarizing research for "${title}"...`, 15); // Update status
					} else {
						progressReporter.log(`Warning: Research for "${title}" returned no results or failed. Proceeding without web context.`);
						// Optionally add a Notice here?
					}
				} catch (researchError: any) {
					progressReporter.log(`Error during research for "${title}": ${researchError.message}. Proceeding without web context.`);
					// Optionally add a Notice here?
				}
			} else {
				progressReporter.log(`Research disabled for "Generate from Title". Proceeding with title only.`);
			}
			// --- End Conditional Research ---


			// Construct the prompt for content generation
			let generationPrompt = `Create comprehensive technical documentation about "${title}" with a focus on scientific and mathematical rigor.`;

			// Append research context if available
			if (researchContext) {
				generationPrompt += `\n\nUse the following research context to inform the documentation:\n\n${researchContext}\n\nDocumentation based on the title "${title}" and the provided context:`;
			} else {
				generationPrompt += `\n\nDocumentation based *only* on the title "${title}":`;
			}

			// Add the detailed instructions (common part)
			generationPrompt += `

Include:
1.  Detailed explanation of core concepts with their mathematical foundations. Start with a Level 2 Header (## ${title}).
2.  Key technical specifications with precise values and units (use tables).
3.  Common use cases with quantitative performance metrics.
4.  Implementation considerations with algorithmic complexity analysis (if applicable).
5.  Performance characteristics with statistical measures.
6.  Related technologies with comparative mathematical models.
7.  Mathematical equations in LaTeX format (using $$...$$ for display and $...$ for inline) with detailed explanations of all parameters and variables. Example: $$ P(f) = \\int_{-\\infty}^{\\infty} p(t) e^{-i2\\pi ft} dt $$
8.  Mermaid.js diagram code blocks using the format \`\`\`mermaid ... \`\`\` (IMPORTANT: without brackets "()" or "{}" for Mermaid diagrams,Uses plain text labels for edges) for complex relationships or system architectures, Avoids special LaTeX syntax and Uses -->|label| syntax for edge labels.
9.  Use bullet points for lists longer than 3 items.
10. Include references to academic papers with DOI where applicable, under a "## References" section.
11. Preserve all mathematical formulas and scientific principles without simplification.
12. Define all variables and parameters used in equations.
13. Include statistical measures and confidence intervals where relevant.

Format directly for Obsidian markdown. Do NOT wrap the entire response in a markdown code block. Start directly with the Level 2 Header.`;

			progressReporter.log(`Calling ${provider.name} to generate content...`);
			// Adjust progress percentage based on whether research happened
			const llmCallProgress = this.settings.enableResearchInGenerateContent ? 25 : 20;
			progressReporter.updateStatus(`Calling ${provider.name}...`, llmCallProgress);

			// Call the appropriate API function based on the provider, passing the determined modelName
			// Pass an empty string for 'content' as the prompt now contains everything.
			let generatedContent;
			switch (provider.name) {
				case 'DeepSeek':
					generatedContent = await this.callDeepSeekAPI(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'OpenAI':
					generatedContent = await this.callOpenAIApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Anthropic':
					// Anthropic combines system prompt and user message, so pass empty prompt here
					generatedContent = await this.callAnthropicApi(provider, modelName, '', generationPrompt, progressReporter); // Pass reporter
					break;
				case 'Google':
					generatedContent = await this.callGoogleApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Mistral':
					generatedContent = await this.callMistralApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Azure OpenAI':
					generatedContent = await this.callAzureOpenAIApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'LMStudio':
					generatedContent = await this.callLMStudioApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Ollama':
					generatedContent = await this.callOllamaApi(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				case 'OpenRouter':
					generatedContent = await this.callOpenRouterAPI(provider, modelName, generationPrompt, '', progressReporter); // Pass reporter
					break;
				default:
					throw new Error(`Unsupported provider for content generation: ${provider.name}`);
			}

			progressReporter.log(`Content received from ${provider.name}.`);
			progressReporter.updateStatus('Applying post-processing...', 80);

			// Apply post-processing (cleanup)
			let finalContent = generatedContent;
			try {
				finalContent = cleanupLatexDelimiters(finalContent);
				finalContent = refineMermaidBlocks(finalContent);
				progressReporter.log(`Mermaid/LaTeX cleanup applied.`);
			} catch (cleanupError: any) {
				progressReporter.log(`Warning: Error during Mermaid/LaTeX cleanup: ${cleanupError.message}`);
				console.warn(`Warning during Mermaid/LaTeX cleanup for ${file.name}:`, cleanupError); // Use file.name here
				// Continue with the uncleaned content
				finalContent = generatedContent;
			}

			// --- Remove \boxed{ if present before saving ---
			let contentToSave = finalContent.trim();
			const contentLines = contentToSave.split('\n');
			if (contentLines.length > 0 && contentLines[0].trim() === '\\boxed{') {
				progressReporter.log(`Removing '\\boxed{' wrapper from generated content.`);
				contentLines.shift();
				if (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '}') {
					contentLines.pop();
				}
				contentToSave = contentLines.join('\n');
			}

			// Replace the entire content of the provided file
			progressReporter.log(`Replacing content in: ${file.name}`);
			progressReporter.updateStatus('Saving content...', 95);
			await this.app.vault.modify(file, contentToSave); // Use the passed file object

			this.updateStatusBar('Generation complete'); // Status bar is global, ok to update
			progressReporter.updateStatus('Content generation complete!', 100); // Update reporter status
			// Only show Notice for single file operation, not batch
			// new Notice(`Content generated successfully for ${file.name}!`);
			progressReporter.log(`Content generated successfully for ${file.name}.`); // Log success instead of Notice
			// Caller (batch or single) handles closing the modal/reporter
			// if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 2000);

		} catch (error: any) {
			this.updateStatusBar('Error during generation');
			const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
			console.error(`Error generating content for ${file.name}:`, errorDetails); // Use file.name in log
			// Removed Notice pop-up for silent batch processing
			// new Notice(`Error generating content: ${error.message}. See console.`, 10000);
			progressReporter.log(`Error generating content for ${file.name}: ${error.message}`); // Log specific file error
			progressReporter.updateStatus('Error occurred', -1);
			// Keep ErrorModal for single file errors, but batch handles summary
			// new ErrorModal(this.app, "Content Generation Error", errorDetails).open();
			// Re-throw the error so the batch function can catch it and log it silently
			throw error;
		}
	}

	/**
	 * Estimates the number of tokens in a string.
	 * Uses a simple approximation (e.g., 4 characters per token).
	 * @param text The string to estimate tokens for.
	 * @returns An estimated token count.
	 */
	private estimateTokens(text: string): number {
		if (!text) return 0;
		// Simple approximation: 1 token ~ 4 characters
		return Math.ceil(text.length / 4);
	}


	/**
	 * Helper to get a progress reporter (Sidebar or new Modal)
	 */
	private getReporter(): ProgressReporter {
		const view = this.app.workspace.getLeavesOfType(NOTEMD_SIDEBAR_VIEW_TYPE)[0]?.view;
		if (view instanceof NotemdSidebarView) {
			this.app.workspace.revealLeaf(view.leaf); // Ensure sidebar is visible
			return view;
		} else {
			// Fallback to modal if sidebar isn't open
			const modal = new ProgressModal(this.app);
			modal.open();
			return modal;
		}
	}

	// --- DuckDuckGo Search Implementation ---

	/**
	 * Performs a search using DuckDuckGo HTML endpoint and parses results.
	 * @param query The search query.
	 * @param progressReporter For logging progress/errors.
	 * @returns A promise resolving to an array of SearchResult objects.
	 */
	private async searchDuckDuckGo(query: string, progressReporter: ProgressReporter): Promise<SearchResult[]> {
		const maxResults = this.settings.ddgMaxResults;
		const encodedQuery = encodeURIComponent(query);
		const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
		const results: SearchResult[] = [];

		progressReporter.log(`Querying DuckDuckGo HTML endpoint: ${url}`);
		try {
			// Use Obsidian's global requestUrl function
			const response = await requestUrl({ // Use global requestUrl
				url: url,
				method: 'GET',
				headers: { // Mimic browser headers
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
				}
			});

			if (response.status !== 200) {
				throw new Error(`DuckDuckGo request failed: ${response.status}`);
			}

			const htmlContent = response.text;
			progressReporter.log(`Received HTML response from DuckDuckGo (${htmlContent.length} bytes). Parsing...`);

			// Regex to capture result blocks (adjust if DDG HTML structure changes)
			// Using [\s\S] to match any character including newlines
			const resultRegex = /<div class="result result--html[\s\S]*?<a class="result__a" href="([^"]*)"[\s\S]*?>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[\s\S]*?>(.*?)<\/a>/g;
			let match;
			let count = 0;

			while ((match = resultRegex.exec(htmlContent)) !== null && count < maxResults) {
				let link = match[1];
				// Decode DDG redirect URL (e.g., /l/?uddg=...)
				if (link.startsWith('/l/?uddg=')) {
					const urlParams = new URLSearchParams(link.substring(3)); // Remove /l/?
					const decodedLink = urlParams.get('uddg');
					if (decodedLink) {
						link = decodeURIComponent(decodedLink);
					} else {
						progressReporter.log(`Warning: Could not decode DDG redirect URL: ${match[1]}`);
						// Optionally skip this result or use the raw link
						// continue;
						link = `https://duckduckgo.com${link}`; // Fallback to DDG link
					}
				} else if (!link.startsWith('http')) {
					// Handle relative links if any (unlikely for main results)
					try {
						const base = new URL('https://duckduckgo.com');
						link = new URL(link, base).toString();
					} catch (e) {
						progressReporter.log(`Warning: Could not resolve relative URL: ${link}`);
						continue; // Skip invalid relative URLs
					}
				}

				// Basic HTML tag stripping for title/snippet
				const title = match[2].replace(/<.*?>/g, '').trim();
				const snippet = match[3].replace(/<.*?>/g, '').trim();

				// Basic validation
				if (title && link && snippet) {
					results.push({ title, url: link, content: snippet });
					count++;
				} else {
					progressReporter.log(`Warning: Skipping partially parsed result (Title: ${!!title}, Link: ${!!link}, Snippet: ${!!snippet})`);
				}
			}

			if (results.length === 0) {
				progressReporter.log("Warning: Could not parse any valid results from DuckDuckGo HTML. Structure might have changed.");
			} else {
				progressReporter.log(`Successfully parsed ${results.length} results from DuckDuckGo.`);
			}

			return results;

		} catch (error: any) {
			const message = `Automated DuckDuckGo search failed. This is likely due to search engine restrictions or changes in their HTML structure. Error: ${error.message}. Consider using Tavily.`;
			progressReporter.log(`Error: ${message}`);
			// Don't throw here, let the caller handle the empty results
			// throw new Error(message);
			return []; // Return empty array on failure
		}
	}

	/**
	 * Fetches content from a URL and extracts basic text.
	 * @param url The URL to fetch.
	 * @param progressReporter For logging.
	 * @returns A promise resolving to the extracted text content or an error message string.
	 */
	private async fetchContentFromUrl(url: string, progressReporter: ProgressReporter): Promise<string> {
		progressReporter.log(`Fetching content from: ${url}`);
		try {
			// Add a small random delay
			// await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // Removed delay for faster testing
			// Use Obsidian's global requestUrl function
			const response = await requestUrl({ // Use global requestUrl
				url: url,
				method: 'GET',
				headers: { // Mimic browser headers
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				},
				// Add a timeout mechanism if requestUrl doesn't support it directly
				// This requires a wrapper like Promise.race
			});

			// Check content type - only process HTML
			const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
			if (!contentType.includes('text/html')) {
				progressReporter.log(`Skipping non-HTML content (${contentType}) from: ${url}`);
				return `[Content skipped: Not HTML - ${contentType}]`;
			}

			const htmlContent = response.text;

			// Basic text extraction: Remove scripts, styles, and then tags
			let text = htmlContent
				.replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script blocks
				.replace(/<style[\s\S]*?<\/style>/gi, '')   // Remove style blocks
				.replace(/<[^>]+>/g, ' ')                   // Replace all tags with space
				.replace(/\s+/g, ' ')                       // Collapse multiple whitespace
				.trim();

			// Decode HTML entities (simple common ones)
			text = text.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&').replace(/"/g, '"').replace(/'/g, "'").replace(/&nbsp;/g, ' ');

			// Truncate if very long
			const maxLength = 15000; // Limit fetched content size
			if (text.length > maxLength) {
				text = text.substring(0, maxLength) + "... [content truncated]";
				progressReporter.log(`Truncated content from: ${url}`);
			}

			progressReporter.log(`Successfully fetched and extracted text from: ${url}`);
			return text;

		} catch (error: any) {
			progressReporter.log(`Error fetching content from ${url}: ${error.message}`);
			return `[Content skipped: Error fetching - ${error.message}]`;
		}
	}


	/**
	 * Performs web research on a topic (note title or selection) and appends a summary.
	 */
	async researchAndSummarize(editor: Editor, view: MarkdownView, progressReporter: ProgressReporter): Promise<void> {
		const activeFile = view.file;
		if (!activeFile) {
			new Notice('No active file.');
			return;
		}

		// Determine input: selected text or file title
		const selectedText = editor.getSelection();
		const topic = selectedText ? selectedText.trim() : activeFile.basename;

		if (!topic) {
			new Notice('No topic found (select text or use a note with a title).');
			return;
		}

		progressReporter.clearDisplay();
		progressReporter.log(`Starting research for topic: "${topic}"`);
		this.updateStatusBar(`Researching: ${topic}`);

		try {
			// --- Perform Research using Helper ---
			const researchContext = await this._performResearch(topic, progressReporter);

			if (!researchContext) {
				// Error/No results handled within _performResearch, just update status
				new Notice(`Research for "${topic}" failed or returned no results. Summary not generated.`);
				progressReporter.updateStatus('Research failed/No results', -1);
				this.updateStatusBar('Research failed');
				if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 3000);
				return;
			}

			// --- Summarize Research Context ---
			progressReporter.updateStatus('Summarizing research...', 50);

			// Use helper functions to get the correct provider and model for this task
			const provider = this.getProviderForTask('research');
			if (!provider) {
				// Error is handled by getProviderForTask, but throw specific error here too
				throw new Error('No valid LLM provider configured for the "Research & Summarize" task.');
			}
			const modelName = this.getModelForTask('research', provider);

			progressReporter.log(`Calling ${provider.name} (Model: ${modelName}) for summarization...`);
			// Use the original topic in the prompt, but provide the fetched context
			const summaryPrompt = `Based on the following research context gathered for "${topic}", provide a concise summary focusing on the key facts, concepts, and conclusions. Present the summary in clear Markdown format.\n\nResearch Context:\n${researchContext}`;

			// Call the appropriate LLM API function, passing the determined modelName
			// Pass empty string for 'content' as prompt contains everything
			let summary = '';
			switch (provider.name) {
				case 'DeepSeek':
					summary = await this.callDeepSeekAPI(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'OpenAI':
					summary = await this.callOpenAIApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Anthropic':
					summary = await this.callAnthropicApi(provider, modelName, '', summaryPrompt, progressReporter); // Pass reporter
					break;
				case 'Google':
					summary = await this.callGoogleApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Mistral':
					summary = await this.callMistralApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Azure OpenAI':
					summary = await this.callAzureOpenAIApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'LMStudio':
					summary = await this.callLMStudioApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'Ollama':
					summary = await this.callOllamaApi(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				case 'OpenRouter':
					summary = await this.callOpenRouterAPI(provider, modelName, summaryPrompt, '', progressReporter); // Pass reporter
					break;
				default:
					throw new Error(`Unsupported provider for summarization: ${provider.name}`);
			}

			progressReporter.log(`Generated summary using ${provider.name}.`);
			progressReporter.updateStatus('Appending summary...', 90);

			// --- Remove \boxed{ if present in summary ---
			let finalSummary = summary.trim();
			const summaryLines = finalSummary.split('\n');
			if (summaryLines.length > 0 && summaryLines[0].trim() === '\\boxed{') {
				progressReporter.log(`Removing '\\boxed{' wrapper from summary.`);
				summaryLines.shift();
				if (summaryLines.length > 0 && summaryLines[summaryLines.length - 1].trim() === '}') {
					summaryLines.pop();
				}
				finalSummary = summaryLines.join('\n');
			}

			// --- Append Summary to Note ---
			const searchSource = this.settings.searchProvider === 'tavily' ? 'Tavily' : 'DuckDuckGo';
			const summaryHeader = `\n\n## Research Summary (via ${searchSource}): ${topic}\n\n`; // Use original topic in header
			editor.replaceSelection(selectedText); // Clear selection if it was used
			const currentContent = editor.getValue();
			editor.setValue(currentContent.trim() + summaryHeader + finalSummary); // Use finalSummary

			this.updateStatusBar('Research complete');
			progressReporter.updateStatus('Research and summary complete!', 100);
			new Notice(`Research summary for "${topic}" appended.`);
			if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 2000);

		} catch (error: any) {
			this.updateStatusBar('Error during research');
			const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
			console.error(`Error researching "${topic}":`, errorDetails);
			new Notice(`Error during research: ${error.message}. See console.`, 10000);
			progressReporter.log(`Error: ${error.message}`);
			progressReporter.updateStatus('Error occurred', -1);
			new ErrorModal(this.app, "Research Error", errorDetails).open();
			// Keep reporter open on error
		}
	}

	/**
	 * Helper function to perform web research (Tavily or DDG) and return combined context.
	 * @param topic The topic to research.
	 * @param progressReporter For logging progress/errors.
	 * @returns A promise resolving to the combined research context string, or null if research fails/yields no results.
	 */
	private async _performResearch(topic: string, progressReporter: ProgressReporter): Promise<string | null> {
		const searchQuery = `${topic} wiki`; // Use modified query
		let combinedContent = '';
		let searchSource = '';
		let searchResults: SearchResult[] = [];

		try {
			// --- Select Search Provider ---
			if (this.settings.searchProvider === 'tavily') {
				searchSource = 'Tavily';
				if (!this.settings.tavilyApiKey) {
					throw new Error('Tavily API key is not configured in Notemd settings.');
				}
				const tavilyUrl = 'https://api.tavily.com/search';
				progressReporter.log(`Searching Tavily for: "${searchQuery}"`);
				progressReporter.updateStatus('Searching Tavily...', 10);
				const tavilyRequestBody = {
					api_key: this.settings.tavilyApiKey,
					query: searchQuery,
					search_depth: this.settings.tavilySearchDepth, // Use setting
					include_answer: false,
					include_raw_content: false, // Keep false, rely on snippets/content field
					max_results: this.settings.tavilyMaxResults // Use setting
				};
				const tavilyResponse = await requestUrl({ url: tavilyUrl, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tavilyRequestBody), throw: false });
				if (tavilyResponse.status !== 200) throw new Error(`Tavily API error: ${tavilyResponse.status} - ${tavilyResponse.text}`);
				const tavilyData = tavilyResponse.json;
				if (!tavilyData.results || tavilyData.results.length === 0) {
					progressReporter.log('Tavily returned no results.');
					return null; // Indicate no results found
				}
				searchResults = tavilyData.results.map((r: any) => ({ title: r.title, url: r.url, content: r.content }));
				progressReporter.log(`Fetched ${searchResults.length} results from Tavily.`);

			} else { // DuckDuckGo selected
				searchSource = 'DuckDuckGo';
				progressReporter.log(`Searching DuckDuckGo for: "${searchQuery}"`);
				progressReporter.updateStatus('Searching DuckDuckGo...', 10);
				searchResults = await this.searchDuckDuckGo(searchQuery, progressReporter);
				if (searchResults.length === 0) {
					progressReporter.log('DuckDuckGo search failed or returned no results.');
					return null; // Indicate failure/no results
				}
			}

			// --- Fetch Content (if DDG) or Use Snippets (if Tavily) ---
			let fetchedContents: string[] = [];
			if (searchSource === 'DuckDuckGo') {
				progressReporter.log(`Fetching content for top ${searchResults.length} DuckDuckGo results...`);
				progressReporter.updateStatus('Fetching content...', 30);
				const fetchPromises = searchResults.map(async (result) => {
					const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${result.url}`)), this.settings.ddgFetchTimeout * 1000));
					try { return await Promise.race([this.fetchContentFromUrl(result.url, progressReporter), timeoutPromise]); }
					catch (fetchError: any) { return `[Content skipped: Timeout or fetch error for ${result.url}]`; }
				});
				const settledResults = await Promise.allSettled(fetchPromises);
				fetchedContents = settledResults.map((result, index) => result.status === 'fulfilled' ? result.value : `[Content skipped for ${searchResults[index].url} due to error: ${result.reason?.message}]`);
				progressReporter.log(`Finished fetching content for DuckDuckGo results.`);
			} else { // Tavily
				fetchedContents = searchResults.map(result => result.content); // Use snippets directly
			}

			// --- Combine Content ---
			if (fetchedContents.length > 0) {
				combinedContent = `Research context for "${searchQuery}" (via ${searchSource}):\n\n`;
				searchResults.forEach((result, index) => {
					combinedContent += `Result ${index + 1}:\n`;
					combinedContent += `Title: ${result.title}\n`;
					combinedContent += `URL: ${result.url}\n`;
					combinedContent += `${searchSource === 'Tavily' ? 'Snippet' : 'Content'}: ${fetchedContents[index] ? fetchedContents[index] : '[No content available]'}\n\n`;
				});

				// --- Truncate combined content ---
				const estimatedTokens = this.estimateTokens(combinedContent);
				const maxTokens = this.settings.maxResearchContentTokens;
				progressReporter.log(`Estimated research context tokens: ${estimatedTokens}. Limit: ${maxTokens}`);
				if (estimatedTokens > maxTokens) {
					const maxChars = maxTokens * 4;
					combinedContent = combinedContent.substring(0, maxChars) + "\n\n[...research context truncated due to token limit]";
					progressReporter.log(`Truncated research context to ~${maxTokens} tokens.`);
					new Notice(`Research context truncated to fit token limit (${maxTokens}).`);
				}
				return combinedContent.trim(); // Return the combined context
			} else {
				progressReporter.log('No content could be obtained from search results.');
				return null; // Indicate no content fetched/available
			}

		} catch (error: any) {
			// Log the error via the reporter
			progressReporter.log(`Error during research for "${topic}": ${error.message}`);
			console.error(`Error researching "${topic}":`, error); // Also log detailed error to console
			// Do not throw here, return null to indicate failure
			return null;
		}
	}

	/**
	 * Batch generates content for all Markdown files in a selected folder.
	 * @param progressReporter - Interface for reporting progress.
	 */
	async batchGenerateContentForTitles(progressReporter: ProgressReporter) {
		const folderPath = await this.getFolderSelection(); // e.g., "Notes/Subfolder" or "/" for root
		if (!folderPath) {
			new Notice('Folder selection cancelled.');
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder || !(folder instanceof TFolder)) {
			new Notice(`Selected path is not a valid folder: ${folderPath}`);
			progressReporter?.log(`Error: Selected path is not a valid folder: ${folderPath}`); // Use optional chaining for reporter
			progressReporter?.updateStatus('Error: Invalid folder', -1);
			return;
		}

		// --- Determine the "Complete" Folder Path ---
		let completeFolderName: string;
		if (this.settings.useCustomGenerateTitleOutputFolder) {
			completeFolderName = this.settings.generateTitleOutputFolderName || DEFAULT_SETTINGS.generateTitleOutputFolderName; // Use default if custom is empty
		} else {
			// Default: Use original folder name + _complete (handle root case)
			const baseFolderName = folderPath === '/' ? 'Vault' : folder.name; // Use 'Vault' for root
			completeFolderName = `${baseFolderName}_complete`;
		}
		// Construct the full path relative to the *parent* of the selected folder, or root if selected folder is root
		const parentPath = folder.parent?.path === '/' ? '' : (folder.parent?.path ? folder.parent.path + '/' : ''); // Handle root and subfolder parents
		const completeFolderPath = `${parentPath}${completeFolderName}`;
		progressReporter?.log(`Determined 'complete' folder path: ${completeFolderPath}`);

		// --- Filter Files ---
		// Filter for only .md files within the selected folder, excluding _processed.md AND files already in the complete folder
		const filesToProcess = this.app.vault.getMarkdownFiles().filter(f => {
			const isInSelectedFolder = f.path.startsWith(folderPath === '/' ? '' : folderPath + '/');
			// Ensure completeFolderPath ends with '/' for accurate startsWith check unless it's root
			const normalizedCompletePath = completeFolderPath === '' ? '' : (completeFolderPath.endsWith('/') ? completeFolderPath : completeFolderPath + '/');
			const isInCompleteFolder = normalizedCompletePath ? f.path.startsWith(normalizedCompletePath) : false; // Check if file is inside the complete folder
			return isInSelectedFolder && !isInCompleteFolder && !f.name.endsWith('_processed.md');
		});


		if (filesToProcess.length === 0) {
			new Notice(`No eligible '.md' files found in "${folderPath}" (excluding the '${completeFolderName}' subfolder).`);
			progressReporter?.log(`No eligible '.md' files found in "${folderPath}" (excluding '${completeFolderName}').`);
			progressReporter?.updateStatus('No files found', 100);
			if (progressReporter instanceof ProgressModal) setTimeout(() => progressReporter.close(), 2000);
			return;
		}

		this.updateStatusBar(`Batch generating content for ${filesToProcess.length} files...`);
		progressReporter?.clearDisplay(); // Use optional chaining
		progressReporter?.log(`Starting batch content generation for ${filesToProcess.length} files in "${folderPath}"...`);
		const errors: { file: string; message: string }[] = [];

		// --- Ensure Complete Folder Exists ---
		try {
			// Normalize path for adapter methods (remove trailing slash if not root)
			const normalizedCompleteFolderPath = completeFolderPath.endsWith('/') && completeFolderPath !== '/' ? completeFolderPath.slice(0, -1) : completeFolderPath;

			const targetFolderExists = await this.app.vault.adapter.exists(normalizedCompleteFolderPath);
			if (!targetFolderExists) {
				await this.app.vault.createFolder(normalizedCompleteFolderPath);
				progressReporter?.log(`Created 'complete' folder: ${normalizedCompleteFolderPath}`);
			} else {
				const targetFolderStat = await this.app.vault.adapter.stat(normalizedCompleteFolderPath);
				if (targetFolderStat && targetFolderStat.type !== 'folder') {
					throw new Error(`Path for 'complete' folder (${normalizedCompleteFolderPath}) exists but is not a directory.`);
				}
			}
		} catch (folderError: any) {
			new Notice(`Error ensuring 'complete' folder exists: ${folderError.message}`);
			progressReporter?.log(`Error ensuring 'complete' folder exists at ${completeFolderPath}: ${folderError.message}`);
			progressReporter?.updateStatus('Error creating output folder', -1);
			return; // Stop processing if we can't create the output folder
		}
		// --- End Ensure Complete Folder Exists ---


		try {
			for (let i = 0; i < filesToProcess.length; i++) {
				const file = filesToProcess[i];
				const progress = Math.floor(((i) / filesToProcess.length) * 100);
				progressReporter.updateStatus(
					`Generating ${i + 1}/${filesToProcess.length}: ${file.name}`,
					progress
				);

				if (progressReporter.cancelled) {
					new Notice('Batch generation cancelled by user.');
					this.updateStatusBar('Cancelled');
					progressReporter.updateStatus('Batch generation cancelled.', -1);
					break; // Exit loop
				}

				try {
					// Temporarily set the active file for generateContentForTitle
					// This is a bit hacky, ideally generateContentForTitle would take a TFile argument
					const currentLeaf = this.app.workspace.activeLeaf;
					await this.app.workspace.setActiveLeaf(this.app.workspace.getLeaf(true), { focus: false }); // Create temp leaf if needed
					// No longer need to open the file, just pass it directly
					// await this.app.workspace.openLinkText(file.path, '', false);

					// Call generateContentForTitle, passing the file and reporter
					await this.generateContentForTitle(file, progressReporter);

					// --- Move Successfully Processed File ---
					try {
						// Ensure completeFolderPath ends with a slash if it's not empty
						const normalizedCompletePathForMove = completeFolderPath ? (completeFolderPath.endsWith('/') ? completeFolderPath : completeFolderPath + '/') : '';
						const destinationPath = `${normalizedCompletePathForMove}${file.name}`;

						// Check if file already exists at destination to prevent error
						const destExists = await this.app.vault.adapter.exists(destinationPath);
						if (destExists) {
							progressReporter?.log(`⚠️ File already exists at destination, skipping move: ${destinationPath}`);
							// Optionally delete the source file? Or just log? Let's just log for now.
						} else {
							// Check if source file still exists before attempting rename
							const sourceExists = await this.app.vault.adapter.exists(file.path);
							if (sourceExists) {
								await this.app.vault.rename(file, destinationPath);
								progressReporter?.log(`✅ Moved processed file to: ${destinationPath}`);
							} else {
								progressReporter?.log(`⚠️ Source file ${file.path} not found, skipping move.`);
							}
						}
					} catch (moveError: any) {
						const moveErrorMsg = `Error moving processed file ${file.name} to ${completeFolderPath}: ${moveError.message}`;
						console.error(moveErrorMsg, moveError);
						progressReporter?.log(`❌ ${moveErrorMsg}`);
						// Add this specific error to the main error list?
						errors.push({ file: file.name, message: `Failed to move after generation: ${moveError.message}` });
						// Continue to next file even if move fails
					}
					// --- End Move File ---


					// No longer need to restore leaf as we didn't change it
					if (currentLeaf) {
						this.app.workspace.setActiveLeaf(currentLeaf);
					}

				} catch (fileError: any) { // Catch errors from generateContentForTitle
					const errorMsg = `Error generating content for ${file.name}: ${fileError.message}`;
					const errorDetails = fileError instanceof Error ? fileError.stack || fileError.message : String(fileError);
					console.error(errorMsg, errorDetails); // Keep console error for details
					progressReporter.log(`❌ ${errorMsg}`);
					errors.push({ file: file.name, message: fileError.message });

					// --- Silent Error Logging to File ---
					const timestamp = new Date().toISOString();
					const logEntry = `[${timestamp}] Error generating content for ${file.path}:\n${errorDetails}\n\n`;
					try {
						await this.app.vault.adapter.append('error_processing_filename.log', logEntry);
					} catch (logError) {
						console.error("Failed to write to error_processing_filename.log:", logError);
						progressReporter.log("⚠️ Failed to write error details to log file."); // Corrected variable name
					}
					// --- End Silent Error Logging ---

					// Continue to the next file
				}

				if (progressReporter.cancelled) { // Check again after generation attempt
					new Notice('Batch generation cancelled by user.');
					this.updateStatusBar('Cancelled');
					progressReporter.updateStatus('Batch generation cancelled.', -1);
					break;
				}
			} // End of loop

			// --- Final Reporting ---
			if (!progressReporter.cancelled) {
				if (errors.length > 0) {
					// Modify the error summary message to point to the log file
					const errorSummary = `Batch generation finished with ${errors.length} error(s). Check 'error_processing_filename.log' for details.`;
					progressReporter.log(`⚠️ ${errorSummary}`);
					progressReporter.updateStatus(errorSummary, -1); // Indicate error state
					this.updateStatusBar(`Batch generation complete with errors`);
					// Update the Notice to mention the log file
					new Notice(errorSummary, 10000);
				} else {
					progressReporter.updateStatus('Batch generation complete!', 100);
					this.updateStatusBar('Batch generation complete');
					new Notice(`Successfully generated content for ${filesToProcess.length} files.`, 5000);
				}
				if (progressReporter instanceof ProgressModal && errors.length === 0) {
					setTimeout(() => (progressReporter as ProgressModal).close(), 2000);
				}
			}

		} catch (batchError: any) { // Catch errors outside the loop
			this.updateStatusBar('Error during batch generation');
			const errorDetails = batchError instanceof Error ? batchError.stack || batchError.message : String(batchError);
			console.error("Notemd Batch Generation Error:", errorDetails);
			new Notice(`Error during batch generation: ${batchError.message}. See console.`, 10000);
			progressReporter.log(`Batch Error: ${batchError.message}`);
			progressReporter.updateStatus('Error occurred during batch generation', -1);
			new ErrorModal(this.app, "Notemd Batch Generation Error", errorDetails).open();
		}
	}


} // End of NotemdPlugin class definition


// --- UI Components ---

// ProgressModal now implements ProgressReporter
class ProgressModal extends Modal implements ProgressReporter {
	private progressEl: HTMLElement;
	private statusEl: HTMLElement;
	private progressBarContainerEl: HTMLElement;
	private logEl: HTMLElement;
	private cancelButton: HTMLElement;
	private isCancelled = false;
	private startTime: number = 0;
	private timeRemainingEl: HTMLElement;
	// Store the AbortController for the current operation
	private currentAbortController: AbortController | null = null;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.addClass('notemd-progress-modal');
		
		// Header
		contentEl.createEl('h3', {text: 'Notemd Processing'});
		
		// Status section
		const statusContainer = contentEl.createEl('div', {cls: 'notemd-status-container'});
		this.statusEl = statusContainer.createEl('p', {text: 'Starting...', cls: 'notemd-status-text'});
		
		// Progress bar
		this.progressBarContainerEl = contentEl.createEl('div', {cls: 'notemd-progress-bar-container'});
		this.progressBarContainerEl.addClass('is-hidden'); // Hide initially
		this.progressEl = this.progressBarContainerEl.createEl('div', {cls: 'notemd-progress-bar-fill'});
		// Width is still set dynamically
		
		// Time remaining indicator
		this.timeRemainingEl = contentEl.createEl('p', {
			text: 'Estimated time remaining: calculating...',
			cls: 'notemd-time-remaining'
		});
		
		// Log output
		this.logEl = contentEl.createEl('div', {cls: 'notemd-log-output'});
		
		// Cancel button
		const buttonContainer = contentEl.createEl('div', {cls: 'notemd-button-container'});
		this.cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'notemd-cancel-button'
		});
		this.cancelButton.onclick = () => {
			this.isCancelled = true;
			this.updateStatus('Cancelling...', -1); // Indicate cancellation visually
			this.log('User requested cancellation');
			// Disable button after click?
			this.cancelButton.setAttribute('disabled', 'true');
		};

		// Record start time
		this.startTime = Date.now();
	}

	updateStatus(text: string, percent: number) {
		if (this.statusEl) this.statusEl.setText(text);
		if (this.progressEl && percent >= 0) {
			const clampedPercent = Math.min(100, Math.max(0, percent));
			this.progressEl.style.width = `${clampedPercent}%`;
			this.progressEl.setText(`${Math.round(clampedPercent)}%`);
			
			// Update time remaining estimate
			if (percent > 0) {
				const elapsed = (Date.now() - this.startTime) / 1000; // in seconds
				const estimatedTotal = elapsed / (percent / 100);
				const remaining = Math.max(0, estimatedTotal - elapsed);
				this.timeRemainingEl.setText(
					`Estimated time remaining: ${this.formatTime(remaining)}`
				);
			}
		} else if (this.progressEl && percent < 0) { // Handle negative percent for error/cancel state
			this.progressEl.style.width = `100%`;
			this.progressEl.addClass('is-error'); // Use CSS class for error state
			// this.progressEl.style.backgroundColor = 'var(--text-error)'; // Removed inline style
			this.progressEl.setText('Cancelled/Error');
			this.timeRemainingEl.setText('Processing cancelled');
		}
	}

	private formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	}

	log(message: string) {
		if (this.logEl) {
			const entry = this.logEl.createEl('div', {cls: 'notemd-log-entry'});
			entry.createEl('span', {
				text: `[${new Date().toLocaleTimeString()}] `,
				cls: 'notemd-log-time'
			});
			entry.createEl('span', {
				text: message,
				cls: 'notemd-log-message'
			});
			// Auto-scroll to bottom
			this.logEl.scrollTop = this.logEl.scrollHeight;
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	get cancelled() {
		return this.isCancelled;
	}

	// Implement ProgressReporter methods
	requestCancel() {
		if (!this.isCancelled) {
			this.isCancelled = true;
			this.updateStatus('Cancelling...', -1); // Indicate cancellation visually
			this.log('User requested cancellation.');
			// Abort the ongoing fetch request, if any
			this.currentAbortController?.abort();
			if (this.cancelButton) this.cancelButton.setAttribute('disabled', 'true');
		}
	}

	clearDisplay() {
		// Modals are typically recreated, but clear if needed for reuse (unlikely here)
		this.logEl?.empty();
		this.updateStatus('Starting...', 0);
		this.isCancelled = false;
		this.currentAbortController = null; // Clear controller on display clear
		if (this.cancelButton) this.cancelButton.removeAttribute('disabled');
	}

	// Implement the abortController property from the interface
	get abortController(): AbortController | null | undefined {
		return this.currentAbortController;
	}
	set abortController(controller: AbortController | null | undefined) {
		this.currentAbortController = controller ?? null;
	}
}

// --- Sidebar View Implementation ---
import { ItemView, WorkspaceLeaf } from 'obsidian';

// NotemdSidebarView now implements ProgressReporter
class NotemdSidebarView extends ItemView implements ProgressReporter {
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
	private cancelButton: HTMLButtonElement | null = null; // Reference to cancel button
	private isCancelled: boolean = false; // Track cancellation state
	// Store the AbortController for the current operation
	private currentAbortController: AbortController | null = null;

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
		this.logContent = [];
		if (this.logEl) this.logEl.empty();
		if (this.statusEl) this.statusEl.setText('Ready');
		if (this.progressEl) {
			this.progressEl.style.width = '0%'; // Width remains dynamic
			this.progressEl.setText('');
			this.progressEl.removeClass('is-error'); // Reset error state class
			// this.progressEl.style.backgroundColor = ''; // Removed inline style
		}
		if (this.timeRemainingEl) this.timeRemainingEl.setText('');
		if (this.progressBarContainerEl) this.progressBarContainerEl.addClass('is-hidden'); // Hide progress bar
		if (this.cancelButton) {
			// Keep button visible but disabled and styled as inactive
			this.cancelButton.disabled = true;
			this.cancelButton.removeClass('is-active'); // Remove active class if present
			// Optionally add an 'is-inactive' class if specific styling is desired
			// this.cancelButton.addClass('is-inactive');
		}
		this.isProcessing = false;
		this.isCancelled = false;
		this.startTime = 0;
		this.currentAbortController = null; // Clear controller
	}

	// Method to update status display
	updateStatus(text: string, percent?: number) {
		if (this.statusEl) this.statusEl.setText(text);

		if (percent !== undefined && this.progressEl && this.progressBarContainerEl) {
			this.progressBarContainerEl.removeClass('is-hidden'); // Show progress bar
			if (percent >= 0) {
				const clampedPercent = Math.min(100, Math.max(0, percent));
				this.progressEl.style.width = `${clampedPercent}%`; // Width remains dynamic
				this.progressEl.setText(`${Math.round(clampedPercent)}%`);
				this.progressEl.removeClass('is-error'); // Ensure error class is removed
				// this.progressEl.style.backgroundColor = ''; // Removed inline style

				// Update time remaining estimate
				if (percent > 0 && this.startTime > 0) {
					const elapsed = (Date.now() - this.startTime) / 1000; // in seconds
					const estimatedTotal = elapsed / (percent / 100);
					const remaining = Math.max(0, estimatedTotal - elapsed);
					if (this.timeRemainingEl) {
						this.timeRemainingEl.setText(`Est. time remaining: ${this.formatTime(remaining)}`);
					}
				} else if (this.timeRemainingEl) {
					this.timeRemainingEl.setText('Est. time remaining: calculating...');
				}
			} else { // Handle negative percent for error/cancel state
				this.progressEl.style.width = `100%`; // Width remains dynamic
				this.progressEl.addClass('is-error'); // Use CSS class for error state
				// this.progressEl.style.backgroundColor = 'var(--text-error)'; // Removed inline style
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
			this.logContent.push(fullMessage); // Store for copying

			const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
			entry.createEl('span', { text: timestamp, cls: 'notemd-log-time' });
			entry.createEl('span', { text: ` ${message}`, cls: 'notemd-log-message' }); // Add space after timestamp
			// Auto-scroll to bottom
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
		if (this.isProcessing && !this.isCancelled) { // Only cancel if processing and not already cancelled
			this.isCancelled = true;
			this.updateStatus('Cancelling...', -1);
			this.log('User requested cancellation.');
			// Abort the ongoing fetch request, if any
			this.currentAbortController?.abort();
			if (this.cancelButton) this.cancelButton.disabled = true;
		}
	}

	// Implement the abortController property from the interface
	get abortController(): AbortController | null | undefined {
		return this.currentAbortController;
	}
	set abortController(controller: AbortController | null | undefined) {
		this.currentAbortController = controller ?? null;
	}


	async onOpen() {
		const container = this.containerEl.children[1]; // View content container
		container.empty();
		container.addClass('notemd-sidebar-container'); // Add a class for potential styling

		container.createEl("h4", { text: "Original Processing" });

		// --- Original Action Buttons ---
		const originalButtonGroup = container.createDiv({ cls: 'notemd-button-group' });

		// Process Current File Button (Original Logic)
		const processCurrentButton = originalButtonGroup.createEl('button', { text: 'Process File (Add Links)', cls: 'mod-cta' });
		processCurrentButton.title = 'Processes the current file to add [[wiki-links]] and create concept notes based on LLM analysis.'; // Use title attribute
		processCurrentButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay(); // Clear previous run
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.disabled = false; // Enable button
				this.cancelButton.addClass('is-active'); // Add class for active styling
				// this.cancelButton.removeClass('is-inactive');
			}
			this.log('Starting: Process Current File...');
			this.updateStatus('Processing current file...', 0);
			// Pass 'this' (the view instance) instead of creating a ProgressModal
			await this.plugin.processWithNotemd(this); // Calls original logic
			this.isProcessing = false; // Mark processing finished
			if (this.cancelButton) {
				this.cancelButton.disabled = true; // Disable button
				this.cancelButton.removeClass('is-active');
				// this.cancelButton.addClass('is-inactive');
			}
		};
		// Process Folder Button (Original Logic)
		const processFolderButton = originalButtonGroup.createEl('button', { text: 'Process Folder (Add Links)' });
		processFolderButton.title = 'Processes all files in a selected folder to add [[wiki-links]] and create concept notes.'; // Use title attribute
		processFolderButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay();
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.disabled = false; // Enable button
				this.cancelButton.addClass('is-active');
				// this.cancelButton.removeClass('is-inactive');
			}
			this.log('Starting: Process Folder...');
			this.updateStatus('Processing folder...', 0);
			// Pass 'this' (the view instance) instead of creating a ProgressModal
			await this.plugin.processFolderWithNotemd(this); // Calls original logic
			this.isProcessing = false;
			if (this.cancelButton) {
				this.cancelButton.disabled = true; // Disable button
				this.cancelButton.removeClass('is-active');
				// this.cancelButton.addClass('is-inactive');
			}
		};

		// --- New Feature Buttons ---
		container.createEl('h4', { text: "New Features" });
		const newFeatureButtonGroup = container.createDiv({ cls: 'notemd-button-group' });
		// Research & Summarize Button
		const researchButton = newFeatureButtonGroup.createEl('button', { text: 'Research & Summarize' });
		researchButton.title = 'Uses the current note title or selection to search the web (Tavily/DDG) and appends an LLM-generated summary.'; // Use title attribute
		researchButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView && activeView.editor) {
				this.clearDisplay();
				this.isProcessing = true;
				this.startTime = Date.now();
				if (this.cancelButton) {
					this.cancelButton.disabled = false; // Enable button
					this.cancelButton.addClass('is-active');
					// this.cancelButton.removeClass('is-inactive');
				}
				this.log('Starting: Research & Summarize Topic...');
				this.updateStatus('Researching topic...', 0);
				await this.plugin.researchAndSummarize(activeView.editor, activeView, this);
				this.isProcessing = false;
				if (this.cancelButton) {
					this.cancelButton.disabled = true; // Disable button
					this.cancelButton.removeClass('is-active');
					// this.cancelButton.addClass('is-inactive');
				}
			} else {
				new Notice('No active Markdown editor found.');
			}
		};
		// Generate Content from Title Button
		const generateTitleButton = newFeatureButtonGroup.createEl('button', { text: 'Generate from Title' });
		generateTitleButton.title = 'Generates content for the current note based on its title (optionally including web research), replacing existing content.'; // Updated title
		generateTitleButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay();
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.disabled = false; // Enable button
				this.cancelButton.addClass('is-active');
				// this.cancelButton.removeClass('is-inactive');
			}
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
				new Notice('No active Markdown file selected.');
				this.isProcessing = false;
				if (this.cancelButton) {
					this.cancelButton.disabled = true; // Disable button
					this.cancelButton.removeClass('is-active');
					// this.cancelButton.addClass('is-inactive');
				}
				return;
			}
			this.log('Starting: Generate Content from Title...');
			this.updateStatus('Generating content...', 0);
			await this.plugin.generateContentForTitle(activeFile, this); // Pass active file and reporter
			this.isProcessing = false;
			if (this.cancelButton) {
				this.cancelButton.disabled = true; // Disable button
				this.cancelButton.removeClass('is-active');
				// this.cancelButton.addClass('is-inactive');
			}
		};

		// Batch Generate Content from Titles Button
		const batchGenerateTitleButton = newFeatureButtonGroup.createEl('button', { text: 'Batch Generate from Titles' });
		batchGenerateTitleButton.title = 'Generates content for all notes in a selected folder based on their titles (optionally including web research).'; // Use title attribute
		batchGenerateTitleButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay();
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.disabled = false; // Enable button
				this.cancelButton.addClass('is-active');
				// this.cancelButton.removeClass('is-inactive');
			}
			this.log('Starting: Batch Generate Content from Titles...');
			this.updateStatus('Starting batch generation...', 0);
			await this.plugin.batchGenerateContentForTitles(this); // Call the new batch function
			this.isProcessing = false;
			if (this.cancelButton) {
				this.cancelButton.disabled = true; // Disable button
				this.cancelButton.removeClass('is-active');
				// this.cancelButton.addClass('is-inactive');
			}
		};


		// --- Utility Buttons ---
		container.createEl('h4', { text: "Utilities" });
		const utilityButtonGroup = container.createDiv({ cls: 'notemd-button-group' });

		// Check Duplicates Button
		const checkDuplicatesButton = utilityButtonGroup.createEl('button', { text: 'Check Duplicates (Current File)' });
		checkDuplicatesButton.onclick = async () => {
			// This action is quick, doesn't need the full processing state management
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice('No active file to check');
				return;
			}
			this.clearDisplay();
			this.log(`Checking duplicates in ${activeFile.name}...`);
			const content = await this.plugin.app.vault.read(activeFile);
			const duplicates = this.plugin.findDuplicates(content); // Call plugin's method
			const message = `Found ${duplicates.size} potential duplicate terms. Check log below and console.`;
			this.log(message);
			new Notice(message);
			if (duplicates.size > 0) {
				this.log(`Potential duplicates: ${Array.from(duplicates).join(', ')}`);
				console.log(`Potential duplicates in ${activeFile.name}:`, Array.from(duplicates));
			}
		};

		// Test Connection Button
		const testConnectionButton = utilityButtonGroup.createEl('button', { text: 'Test LLM Connection' });
		testConnectionButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Cannot test connection while processing.");
				return;
			}
			this.clearDisplay();
			const provider = this.plugin.settings.providers.find(p => p.name === this.plugin.settings.activeProvider);
			if (!provider) {
				this.log('Error: No active provider configured');
				new Notice('No active provider configured');
				return;
			}
			this.log(`Testing connection to ${provider.name}...`);
			const testingNotice = new Notice(`Testing connection to ${provider.name}...`, 0);
			testConnectionButton.disabled = true;
			try {
				const result = await this.plugin.testAPI(provider);
				testingNotice.hide();
				if (result.success) {
					this.log(`✅ Success: ${result.message}`);
					new Notice(`✅ Success: ${result.message}`, 5000);
				} else {
					this.log(`❌ Failed: ${result.message}. Check console.`);
					new Notice(`❌ Failed: ${result.message}. Check console.`, 10000);
				}
			} catch (error: any) {
				testingNotice.hide();
				const errorMsg = `Error during connection test: ${error.message}`;
				this.log(`❌ ${errorMsg}`);
				new Notice(errorMsg, 10000);
				console.error('LLM Connection Test Error (Sidebar):', error);
				const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
				new ErrorModal(this.app, "LLM Connection Test Error", errorDetails).open();
			} finally {
				testConnectionButton.disabled = false;
			}
		};

		// --- Progress Display Area ---
		container.createEl('hr'); // Separator
		const progressArea = container.createDiv({ cls: 'notemd-progress-area' });
		this.statusEl = progressArea.createEl('p', { text: 'Ready', cls: 'notemd-status-text' });
		this.progressBarContainerEl = progressArea.createEl('div', { cls: 'notemd-progress-bar-container' });
		this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });
		this.timeRemainingEl = progressArea.createEl('p', { cls: 'notemd-time-remaining' });
		this.progressBarContainerEl.addClass('is-hidden'); // Hide initially

		// Cancel Button (visible but disabled initially)
		this.cancelButton = progressArea.createEl('button', { text: 'Cancel Processing', cls: 'notemd-cancel-button' });
		// this.cancelButton.addClass('is-inactive'); // Optional class for styling when disabled
		this.cancelButton.disabled = true; // Start disabled
		this.cancelButton.onclick = () => this.requestCancel();


		// --- Log Output Area ---
		container.createEl('hr'); // Separator
		const logHeader = container.createDiv({ cls: 'notemd-log-header' });
		logHeader.createEl('h5', { text: 'Log Output' });
		const copyLogButton = logHeader.createEl('button', { text: 'Copy Log', cls: 'notemd-copy-log-button' });
		copyLogButton.onclick = () => {
			if (this.logContent.length > 0) {
				navigator.clipboard.writeText(this.logContent.join('\n')).then(() => {
					new Notice('Log copied to clipboard!');
				}).catch(err => {
					new Notice('Failed to copy log. See console.');
					console.error('Failed to copy log:', err);
				});
			} else {
				new Notice('Log is empty.');
			}
		};

		// Make the log element selectable
		this.logEl = container.createEl('div', { cls: 'notemd-log-output is-selectable' }); // Added 'is-selectable' Obsidian helper class
		this.clearDisplay(); // Initialize display state
	}

	async onClose() {
		// Nothing specific to clean up yet, but good practice
		// console.log("Closing Notemd sidebar view");
		this.statusEl = null;
		this.progressEl = null;
		this.progressBarContainerEl = null;
		this.timeRemainingEl = null;
		this.logEl = null;
		this.cancelButton = null;
	}
}

class NotemdSettingTab extends PluginSettingTab {
	plugin: NotemdPlugin;

	constructor(app: App, plugin: NotemdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Define the path for the providers JSON file within the plugin's config directory
	private get providersFilePath(): string {
		// Note: this.app.vault.configDir might be '.obsidian'
		// this.plugin.manifest.dir might be '.obsidian/plugins/obsidian-NoteMD_new' (or similar)
		// We want to save it inside the plugin's specific folder.
		const pluginConfigDir = this.app.vault.configDir + '/plugins/' + this.plugin.manifest.id;
		return `${pluginConfigDir}/notemd-providers.json`;
	}

	async exportProviderSettings(): Promise<void> {
		try {
			const providersToExport = this.plugin.settings.providers;
			const jsonData = JSON.stringify(providersToExport, null, 2); // Pretty print JSON

			// Ensure the plugin directory exists (it should, but check just in case)
			const pluginConfigDir = this.app.vault.configDir + '/plugins/' + this.plugin.manifest.id;
			try {
				// Use adapter.exists and adapter.mkdir to handle potential non-existence
				const dirExists = await this.app.vault.adapter.exists(pluginConfigDir);
				if (!dirExists) {
					await this.app.vault.adapter.mkdir(pluginConfigDir);
				}
			} catch (mkdirError) {
				console.error("Error ensuring plugin directory exists:", mkdirError);
				new Notice(`Error creating plugin directory: ${mkdirError.message}`); // Use error.message
				return; // Stop if we can't ensure the directory exists
			}


			await this.app.vault.adapter.write(this.providersFilePath, jsonData);
			new Notice(`Provider settings exported successfully to ${this.providersFilePath}`);
		} catch (error: any) {
			console.error("Error exporting provider settings:", error);
			new Notice(`Error exporting settings: ${error.message}`);
		}
	}

	async importProviderSettings(): Promise<void> {
		try {
			const filePath = this.providersFilePath;
			const fileExists = await this.app.vault.adapter.exists(filePath);

			if (!fileExists) {
				new Notice(`Import file not found at ${filePath}. Please place your 'notemd-providers.json' file there.`);
				return;
			}

			const jsonData = await this.app.vault.adapter.read(filePath);
			const importedProviders = JSON.parse(jsonData) as LLMProviderConfig[];

			// Basic validation: Check if it's an array
			if (!Array.isArray(importedProviders)) {
				throw new Error("Imported file does not contain a valid provider array.");
			}

			// Merge strategy: Overwrite existing by name, add new ones
			const existingProvidersMap = new Map(this.plugin.settings.providers.map(p => [p.name, p]));
			let importedCount = 0;
			let newCount = 0;

			importedProviders.forEach(importedProvider => {
				// Add basic validation for each provider object if needed here
				if (importedProvider && typeof importedProvider.name === 'string') {
					if (existingProvidersMap.has(importedProvider.name)) {
						// Overwrite existing
						existingProvidersMap.set(importedProvider.name, importedProvider);
						importedCount++;
					} else {
						// Add new provider
						existingProvidersMap.set(importedProvider.name, importedProvider);
						newCount++;
					}
				} else {
					console.warn("Skipping invalid provider object during import:", importedProvider);
				}
			});

			// Update settings
			this.plugin.settings.providers = Array.from(existingProvidersMap.values());

			// Ensure activeProvider is still valid after import, fallback if needed
			if (!this.plugin.settings.providers.some(p => p.name === this.plugin.settings.activeProvider)) {
				this.plugin.settings.activeProvider = DEFAULT_SETTINGS.activeProvider;
				new Notice(`Active provider reset to default as previous one was not found after import.`);
			}

			await this.plugin.saveSettings();
			new Notice(`Successfully imported ${newCount} new and updated ${importedCount} existing provider settings.`);
			this.display(); // Refresh display after successful import

		} catch (error: any) {
			console.error("Error importing provider settings:", error);
			new Notice(`Error importing settings: ${error.message}`);
		}
	}


	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Notemd Settings'});

		// --- Provider Configuration ---
		containerEl.createEl('h3', { text: 'LLM Provider Configuration' });

		// --- Import/Export Buttons ---
		const providerMgmtSetting = new Setting(containerEl)
			.setName('Manage Provider Configurations')
			.setDesc('Export your current provider settings to a JSON file, or import settings from a file.');

		providerMgmtSetting.addButton(button => button
			.setButtonText('Export Providers')
			.setTooltip('Save provider configurations to providers.json')
			.onClick(async () => {
				await this.exportProviderSettings();
			}));

		providerMgmtSetting.addButton(button => button
			.setButtonText('Import Providers')
			.setTooltip('Load provider configurations from providers.json (merges with existing)')
			.onClick(async () => {
				await this.importProviderSettings();
				this.display(); // Refresh settings tab after import
			}));
		// --- End Import/Export Buttons ---


		new Setting(containerEl)
			.setName('Active Provider')
			.setDesc('Select the LLM provider to use for processing.')
			.addDropdown(dropdown => {
				// Ensure providers are sorted or add OpenRouter logically
				const providerNames = this.plugin.settings.providers.map(p => p.name).sort();
				providerNames.forEach(name => {
					dropdown.addOption(name, name);
				});
				// dropdown => { // Original non-sorted way
				// this.plugin.settings.providers.forEach(provider => {
				// 	dropdown.addOption(provider.name, provider.name);
				// });
				dropdown
					.setValue(this.plugin.settings.activeProvider)
					.onChange(async (value) => {
						this.plugin.settings.activeProvider = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh settings to show current provider config
					});
			});

		// Show settings for the currently active provider
		const activeProvider = this.plugin.settings.providers.find(
			p => p.name === this.plugin.settings.activeProvider
		);

		if (activeProvider) {
			containerEl.createEl('h4', { text: `${activeProvider.name} Settings` });

			// API Key (optional for Ollama, placeholder for LMStudio)
			if (activeProvider.name !== 'Ollama') {
				new Setting(containerEl)
					.setName('API Key')
					.setDesc(`API key for ${activeProvider.name}. ${activeProvider.name === 'LMStudio' ? "(Optional, often 'EMPTY')" : ""}`)
					.addText(text => text
						.setPlaceholder(activeProvider.name === 'LMStudio' ? 'Usually EMPTY or leave blank' : 'Enter your API key')
						.setValue(activeProvider.apiKey)
						.onChange(async (value) => {
							activeProvider.apiKey = value;
							await this.plugin.saveSettings();
						}));
			}

			// Base URL (Endpoint) - Crucial for local models and Azure
			new Setting(containerEl)
				.setName('Base URL / Endpoint')
				.setDesc(`The API endpoint for ${activeProvider.name}. ${activeProvider.name === 'Azure OpenAI' ? 'Required.' : ''}`)
				.addText(text => text
					.setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.baseUrl || 'Enter API Base URL')
					.setValue(activeProvider.baseUrl)
					.onChange(async (value) => {
						activeProvider.baseUrl = value;
						await this.plugin.saveSettings();
					}));

			// Model Name
			new Setting(containerEl)
				.setName('Model')
				.setDesc(`Model name to use with ${activeProvider.name}. (e.g., gpt-4o, claude-3-opus-20240229, llama3, local-model)`)
				.addText(text => text
					.setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.model || 'Enter model name')
					.setValue(activeProvider.model)
					.onChange(async (value) => {
						activeProvider.model = value;
						await this.plugin.saveSettings();
					}));

			// Temperature
			new Setting(containerEl)
				.setName('Temperature')
				.setDesc('Controls randomness (0=deterministic, 1=creative). Lower values recommended for factual tasks.')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(activeProvider.temperature)
					.onChange(async (value) => {
						activeProvider.temperature = value;
						await this.plugin.saveSettings();
					})
					.setDynamicTooltip());

			// Azure Specific: API Version
			if (activeProvider.name === 'Azure OpenAI') {
				new Setting(containerEl)
					.setName('API Version')
					.setDesc('Required API version for Azure OpenAI (e.g., 2024-02-15-preview)')
					.addText(text => text
						.setPlaceholder('Enter API version')
						.setValue(activeProvider.apiVersion || '')
						.onChange(async (value) => {
							activeProvider.apiVersion = value;
							await this.plugin.saveSettings();
						}));
			}

			// Add Test Connection button for the active provider
			new Setting(containerEl)
				.setName(`Test ${activeProvider.name} Connection`)
				.setDesc('Click to verify API key, endpoint, and model accessibility.')
				.addButton(button => button
					.setButtonText('Test Connection')
					.setCta() // Make it stand out slightly
					.onClick(async () => {
						button.setDisabled(true).setButtonText('Testing...');
						const testingNotice = new Notice(`Testing connection to ${activeProvider.name}...`, 0);

						try {
							const result = await this.plugin.testAPI(activeProvider);
							testingNotice.hide();
							if (result.success) {
								new Notice(`✅ Success: ${result.message}`, 5000);
							} else {
								new Notice(`❌ Failed: ${result.message}. Check console.`, 10000);
							}
						} catch (error: any) {
							testingNotice.hide();
							new Notice(`Error during connection test: ${error.message}`, 10000);
							console.error(`Error testing ${activeProvider.name} connection from settings:`, error);
						} finally {
							button.setDisabled(false).setButtonText('Test Connection');
						}
					}));

		} else {
			containerEl.createEl('p', { text: 'Error: Could not find configuration for the active provider.', cls: 'notemd-error-text' });
		}

		// --- Multi-Model Settings ---
		containerEl.createEl('h3', { text: 'Multi-Model Configuration' });

		new Setting(containerEl)
			.setName('Use Different Providers for Tasks')
			.setDesc('ON: Select a specific LLM provider for each task below. OFF: Use the single "Active Provider" selected above for all tasks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useMultiModelSettings)
				.onChange(async (value) => {
					this.plugin.settings.useMultiModelSettings = value;
					// Ensure task-specific providers are initialized if toggled on
					if (value) {
						this.plugin.settings.addLinksProvider = this.plugin.settings.addLinksProvider || this.plugin.settings.activeProvider;
						this.plugin.settings.researchProvider = this.plugin.settings.researchProvider || this.plugin.settings.activeProvider;
						this.plugin.settings.generateTitleProvider = this.plugin.settings.generateTitleProvider || this.plugin.settings.activeProvider;
					}
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide task-specific dropdowns
				}));

		if (this.plugin.settings.useMultiModelSettings) {
			const providerNames = this.plugin.settings.providers.map(p => p.name).sort();

			// Helper function to create provider and model settings for a task
			const createTaskModelSettings = (
				providerSettingName: keyof NotemdSettings,
				modelSettingName: keyof NotemdSettings,
				taskDesc: string
			) => {
				const taskSetting = new Setting(containerEl)
					.setName(`${taskDesc} Provider & Model`)
					.setDesc(`Select provider and optionally override model for "${taskDesc}". Leave model blank to use provider's default.`);

				// Provider Dropdown
				taskSetting.addDropdown(dropdown => {
					providerNames.forEach(name => {
						dropdown.addOption(name, name);
					});
					dropdown
						.setValue(this.plugin.settings[providerSettingName] as string)
						.onChange(async (value) => {
							(this.plugin.settings[providerSettingName] as any) = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh display to update model placeholder
						});
				});

				// Model Text Input (Override)
				const selectedProviderName = this.plugin.settings[providerSettingName] as string;
				const selectedProvider = this.plugin.settings.providers.find(p => p.name === selectedProviderName);
				const defaultModel = selectedProvider ? selectedProvider.model : 'Provider not found';

				taskSetting.addText(text => text
					.setPlaceholder(`Default: ${defaultModel}`)
					.setValue(this.plugin.settings[modelSettingName] as string || '') // Use || '' to handle undefined/null
					.onChange(async (value) => {
						// Store the override, even if empty (means use default)
						(this.plugin.settings[modelSettingName] as any) = value.trim();
						await this.plugin.saveSettings();
					}));
			};

			createTaskModelSettings('addLinksProvider', 'addLinksModel', 'Add Links (Process File/Folder)');
			createTaskModelSettings('researchProvider', 'researchModel', 'Research & Summarize');
			createTaskModelSettings('generateTitleProvider', 'generateTitleModel', 'Generate from Title');
		}
		// --- End Multi-Model Settings ---


		// --- Stable API Call Settings ---
		containerEl.createEl('h3', { text: 'Stable API Call Settings' });

		new Setting(containerEl)
			.setName('Enable Stable API Calls (Retry Logic)')
			.setDesc('ON: Automatically retry failed LLM API calls based on the settings below. OFF: A single API call failure will stop the current task.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableStableApiCall)
				.onChange(async (value) => {
					this.plugin.settings.enableStableApiCall = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide retry options
				}));

		if (this.plugin.settings.enableStableApiCall) {
			new Setting(containerEl)
				.setName('Retry Interval (seconds)')
				.setDesc('Time to wait between retry attempts after an API call fails.')
				.addText(text => text
					.setPlaceholder(String(DEFAULT_SETTINGS.apiCallInterval))
					.setValue(String(this.plugin.settings.apiCallInterval))
					.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (!isNaN(numValue) && numValue >= 1 && numValue <= 300) { // Allow 1 sec to 5 mins interval
							this.plugin.settings.apiCallInterval = numValue;
							await this.plugin.saveSettings();
						} else if (value === '') {
							this.plugin.settings.apiCallInterval = DEFAULT_SETTINGS.apiCallInterval;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show default restored
						} else {
							new Notice("Please enter a valid number between 1 and 300 for the retry interval.");
							text.setValue(String(this.plugin.settings.apiCallInterval)); // Revert
						}
					}));

			new Setting(containerEl)
				.setName('Maximum Retries')
				.setDesc('Maximum number of times to retry a failed API call.')
				.addText(text => text
					.setPlaceholder(String(DEFAULT_SETTINGS.apiCallMaxRetries))
					.setValue(String(this.plugin.settings.apiCallMaxRetries))
					.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) { // Allow 0 to 10 retries
							this.plugin.settings.apiCallMaxRetries = numValue;
							await this.plugin.saveSettings();
						} else if (value === '') {
							this.plugin.settings.apiCallMaxRetries = DEFAULT_SETTINGS.apiCallMaxRetries;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show default restored
						} else {
							new Notice("Please enter a valid number between 0 and 10 for maximum retries.");
							text.setValue(String(this.plugin.settings.apiCallMaxRetries)); // Revert
						}
					}));
		}
		// --- End Stable API Call Settings ---


		// --- General Settings ---
		containerEl.createEl('h3', { text: 'General Settings' });

		// --- Processed File Output Settings ---
		containerEl.createEl('h4', { text: 'Processed File Output' });

		new Setting(containerEl)
			.setName('Customize Processed File Save Path')
			.setDesc('If enabled, processed files (_processed.md) will be saved to the specified relative path. If disabled, they save in the same folder as the original file.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomProcessedFileFolder)
				.onChange(async (value) => {
					this.plugin.settings.useCustomProcessedFileFolder = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide the text input
				}));

		// Only show the path input if the toggle is enabled
		if (this.plugin.settings.useCustomProcessedFileFolder) {
			new Setting(containerEl)
				.setName('Processed File Folder Path')
				.setDesc('Relative path within the vault to save processed files. Invalid characters: * " \\ / < > : | ? # ^ [ ]')
				.addText(text => text
					.setPlaceholder('e.g., Processed/Notes')
					.setValue(this.plugin.settings.processedFileFolder)
					.onChange(async (value) => {
						const trimmedValue = value.trim();
						// Stricter validation for relative paths within vault
						const invalidChars = /[<>:"\\|?*#^[\]]/; // Allow forward slash for subfolders
						if (trimmedValue && invalidChars.test(trimmedValue)) {
							new Notice("Processed file folder path contains invalid characters.", 5000);
							text.setValue(this.plugin.settings.processedFileFolder);
							return;
						}
						// Prevent absolute paths (heuristic check)
						if (/^(?:[a-zA-Z]:\\|\/)/.test(trimmedValue)) {
							new Notice("Please use a relative path within your vault.", 5000);
							text.setValue(this.plugin.settings.processedFileFolder);
							return;
						}

						this.plugin.settings.processedFileFolder = trimmedValue;
						await this.plugin.saveSettings();
					}));
		}

		// Add the new toggle setting for move/copy workflow
		new Setting(containerEl)
			.setName('Move Original File After Processing')
			.setDesc('ON: Move the original file to the "Processed File Folder" after processing. OFF: Create a copy named "_processed.md" instead.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.moveOriginalFileOnProcess)
				.onChange(async (value) => {
					this.plugin.settings.moveOriginalFileOnProcess = value;
					await this.plugin.saveSettings();
					// No need to refresh display for this toggle
				}));

		// Add Custom Output Filename settings for 'Add Links'
		new Setting(containerEl)
			.setName("Use Custom Output Filename for 'Add Links'")
			.setDesc("ON: Use the custom suffix/replacement below instead of '_processed.md'. OFF: Use the default '_processed.md' suffix.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomAddLinksSuffix)
				.onChange(async (value) => {
					this.plugin.settings.useCustomAddLinksSuffix = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide the text input
				}));

		if (this.plugin.settings.useCustomAddLinksSuffix) {
			new Setting(containerEl)
				.setName("Custom Suffix/Replacement String")
				.setDesc("Enter the string to append/replace the filename with. Leave empty to overwrite the original file. Example: '_linked' results in 'filename_linked.md'.")
				.addText(text => text
					.setPlaceholder("Leave empty to overwrite original")
					.setValue(this.plugin.settings.addLinksCustomSuffix)
					.onChange(async (value) => {
						// No specific validation needed here, empty string is a valid option
						this.plugin.settings.addLinksCustomSuffix = value; // Store trimmed or full? Let's store as is.
						await this.plugin.saveSettings();
					}));
		}


		// --- Concept Note Output Settings ---
		containerEl.createEl('h4', { text: 'Concept Note Output' });

		new Setting(containerEl)
			.setName('Customize Concept Note Path')
			.setDesc('If enabled, new concept notes ([[linked concepts]]) will be created in the specified relative path. If disabled, concept notes are not created automatically.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomConceptNoteFolder)
				.onChange(async (value) => {
					this.plugin.settings.useCustomConceptNoteFolder = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide the text input
				}));

		// Only show the path input if the toggle is enabled
		if (this.plugin.settings.useCustomConceptNoteFolder) {
			new Setting(containerEl)
				.setName('Concept Note Folder Path')
				.setDesc('Relative path within the vault to save new concept notes. Invalid characters: * " \\ / < > : | ? # ^ [ ]')
				.addText(text => text
					.setPlaceholder('e.g., Concepts')
					.setValue(this.plugin.settings.conceptNoteFolder)
					.onChange(async (value) => {
						const trimmedValue = value.trim();
						// Stricter validation for relative paths within vault
						const invalidChars = /[<>:"\\|?*#^[\]]/; // Allow forward slash for subfolders
						if (trimmedValue && invalidChars.test(trimmedValue)) {
							new Notice("Concept note folder path contains invalid characters.", 5000);
							text.setValue(this.plugin.settings.conceptNoteFolder);
							return;
						}
						// Prevent absolute paths (heuristic check)
						if (/^(?:[a-zA-Z]:\\|\/)/.test(trimmedValue)) {
							new Notice("Please use a relative path within your vault.", 5000);
							text.setValue(this.plugin.settings.conceptNoteFolder);
							return;
						}
						// Cannot be empty if toggle is enabled
						if (!trimmedValue) {
							new Notice("Concept note folder path cannot be empty when customization is enabled.", 5000);
							// Optionally revert or just leave it, but prevent saving empty?
							// For now, allow saving empty but it will effectively disable creation later.
						}

						this.plugin.settings.conceptNoteFolder = trimmedValue;
						await this.plugin.saveSettings();
					}));
		}

		// --- Concept Log File Output Settings --- START
		containerEl.createEl('h4', { text: 'Concept Log File Output' });

		new Setting(containerEl)
			.setName('Generate Concept Log File')
			.setDesc('If enabled, a log file listing newly created concept notes will be generated after processing.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.generateConceptLogFile)
				.onChange(async (value) => {
					this.plugin.settings.generateConceptLogFile = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide dependent options
				}));

		// Only show log file options if the main toggle is enabled
		if (this.plugin.settings.generateConceptLogFile) {
			// --- Customize Log Folder Path ---
			const logFolderSetting = new Setting(containerEl) // Store setting for potential dynamic updates
				.setName('Customize Log File Save Path'); // Keep description concise

			// Add description dynamically based on concept note folder setting
			let logFolderDesc = 'If enabled, the concept log file will be saved to the specified relative path.';
			if (this.plugin.settings.useCustomConceptNoteFolder && this.plugin.settings.conceptNoteFolder) {
				logFolderDesc += ` If disabled, it saves in the Concept Note Folder ('${this.plugin.settings.conceptNoteFolder}')`;
			} else {
				logFolderDesc += ' If disabled, it saves in the vault root.';
			}
			logFolderSetting.setDesc(logFolderDesc);

			logFolderSetting.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomConceptLogFolder)
				.onChange(async (value) => {
					this.plugin.settings.useCustomConceptLogFolder = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide text input and update description
				}));

			// Conditionally display the log folder path input
			if (this.plugin.settings.useCustomConceptLogFolder) {
				new Setting(containerEl)
					.setName('Concept Log Folder Path')
					.setDesc('Relative path within the vault. Must be filled if customization is enabled. Invalid chars: * " \\ / < > : | ? # ^ [ ]')
					.addText(text => text
						.setPlaceholder('e.g., Logs/ConceptLogs') // More specific placeholder
						.setValue(this.plugin.settings.conceptLogFolderPath)
						.onChange(async (value) => {
							const trimmedValue = value.trim();
							const invalidChars = /[<>:"\\|?*#^[\]]/; // Allow forward slash
							if (!trimmedValue) { // Path is required when toggle is on
								new Notice("Concept log folder path cannot be empty when customization is enabled.", 5000);
								// Keep the invalid value in the box for correction, but don't save? Or revert?
								// Let's revert for now to avoid saving invalid state.
								text.setValue(this.plugin.settings.conceptLogFolderPath);
								return;
							}
							if (invalidChars.test(trimmedValue)) {
								new Notice("Concept log folder path contains invalid characters.", 5000);
								text.setValue(this.plugin.settings.conceptLogFolderPath); // Revert
								return;
							}
							if (/^(?:[a-zA-Z]:\\|\/)/.test(trimmedValue)) { // Basic absolute path check
								new Notice("Please use a relative path within your vault for the log folder.", 5000);
								text.setValue(this.plugin.settings.conceptLogFolderPath); // Revert
								return;
							}

							this.plugin.settings.conceptLogFolderPath = trimmedValue;
							await this.plugin.saveSettings();
						}));
			}

			// --- Customize Log File Name ---
			const logFileNameSetting = new Setting(containerEl)
				.setName('Customize Log File Name');

			logFileNameSetting.setDesc(`If enabled, use the specified file name. If disabled, use "${DEFAULT_SETTINGS.conceptLogFileName}".`);

			logFileNameSetting.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomConceptLogFileName)
				.onChange(async (value) => {
					this.plugin.settings.useCustomConceptLogFileName = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide text input
				}));

			// Conditionally display the log file name input
			if (this.plugin.settings.useCustomConceptLogFileName) {
				new Setting(containerEl)
					.setName('Concept Log File Name')
					.setDesc('Name for the log file (e.g., "ConceptLog.log"). Must be filled if customization is enabled. Invalid chars: \\ / : * ? " < > | # ^ [ ]')
					.addText(text => text
						.setPlaceholder(DEFAULT_SETTINGS.conceptLogFileName) // Show default
						.setValue(this.plugin.settings.conceptLogFileName)
						.onChange(async (value) => {
							let fileName = value.trim();
							const invalidChars = /[\\/:*?"<>|#^[\]]/; // Invalid filename chars

							if (!fileName) { // Name is required when toggle is on
								new Notice("Log file name cannot be empty when customization is enabled.", 5000);
								text.setValue(this.plugin.settings.conceptLogFileName); // Revert
								return;
							}
							if (invalidChars.test(fileName)) {
								new Notice("Log file name contains invalid characters.", 5000);
								text.setValue(this.plugin.settings.conceptLogFileName); // Revert
								return;
							}
							// Optional: Enforce .log extension? Let's allow flexibility but maybe warn.
							// if (!fileName.toLowerCase().endsWith('.log')) {
							// 	new Notice("Consider using a '.log' extension for the log file name.", 3000);
							// }

							this.plugin.settings.conceptLogFileName = fileName;
							await this.plugin.saveSettings();
						}));
			}
		}
		// --- Concept Log File Output Settings --- END


		// --- Content Generation Settings ---
		containerEl.createEl('h4', { text: 'Content Generation & Output' }); // Updated heading

		new Setting(containerEl)
			.setName('Enable Research in "Generate from Title"')
			.setDesc('ON: Perform web research (using selected provider below) and include context when using "Generate from Title". OFF: Generate based only on the title.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableResearchInGenerateContent)
				.onChange(async (value) => {
					this.plugin.settings.enableResearchInGenerateContent = value;
					await this.plugin.saveSettings();
					// No need to refresh display for this toggle specifically
				}));

		// --- Web Research Settings (Now relevant to both features) ---
		containerEl.createEl('h4', { text: 'Web Research Provider' });

		new Setting(containerEl)
			.setName('Search Provider')
			.setDesc('Select the search engine for the "Research and Summarize Topic" command.')
			.addDropdown(dropdown => dropdown
				.addOption('tavily', 'Tavily (Requires API Key)')
				.addOption('duckduckgo', 'DuckDuckGo (Experimental, often blocked)')
				.setValue(this.plugin.settings.searchProvider)
				.onChange(async (value: 'tavily' | 'duckduckgo') => {
					this.plugin.settings.searchProvider = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh settings
				}));

		// --- Generate from Title Output Folder Settings ---
		new Setting(containerEl)
			.setName("Use Custom Output Folder for 'Generate from Title'")
			.setDesc("ON: Move successfully generated files to the custom folder name specified below (relative to the original folder). OFF: Move them to '[original_foldername]_complete'.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomGenerateTitleOutputFolder)
				.onChange(async (value) => {
					this.plugin.settings.useCustomGenerateTitleOutputFolder = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide the text input
				}));

		if (this.plugin.settings.useCustomGenerateTitleOutputFolder) {
			new Setting(containerEl)
				.setName("Custom Output Folder Name")
				.setDesc("Name of the subfolder to move completed 'Generate from Title' files into. Invalid chars: \\ / : * ? \" < > | # ^ [ ]")
				.addText(text => text
					.setPlaceholder(DEFAULT_SETTINGS.generateTitleOutputFolderName) // Show default
					.setValue(this.plugin.settings.generateTitleOutputFolderName)
					.onChange(async (value) => {
						let folderName = value.trim();
						const invalidChars = /[\\/:*?"<>|#^[\]]/; // Invalid folder name chars

						if (!folderName) { // Use default if empty
							folderName = DEFAULT_SETTINGS.generateTitleOutputFolderName;
							// Optionally inform user? Or just save default silently.
							// new Notice(`Using default folder name: ${DEFAULT_SETTINGS.generateTitleOutputFolderName}`);
							text.setValue(folderName); // Update input field to show default
						}

						if (invalidChars.test(folderName)) {
							new Notice("Custom output folder name contains invalid characters.", 5000);
							text.setValue(this.plugin.settings.generateTitleOutputFolderName); // Revert
							return;
						}

						this.plugin.settings.generateTitleOutputFolderName = folderName;
						await this.plugin.saveSettings();
					}));
		}
		// --- End Generate from Title Output Folder Settings ---


		// Conditional settings based on provider
		if (this.plugin.settings.searchProvider === 'tavily') {
			new Setting(containerEl)
				.setName('Tavily API Key')
				.setDesc('Required if Tavily is selected. Get a key from tavily.com.')
				.addText(text => text
					.setPlaceholder('Enter your Tavily API key (tvly-...)')
					.setValue(this.plugin.settings.tavilyApiKey)
					.onChange(async (value) => {
						this.plugin.settings.tavilyApiKey = value.trim();
						await this.plugin.saveSettings();
					}));

			// Add Tavily Max Results setting
			new Setting(containerEl)
				.setName('Tavily Max Results')
				.setDesc('Maximum number of search results Tavily should return (1-20).')
				.addText(text => text
					.setPlaceholder(String(DEFAULT_SETTINGS.tavilyMaxResults))
					.setValue(String(this.plugin.settings.tavilyMaxResults))
					.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
							this.plugin.settings.tavilyMaxResults = numValue;
							await this.plugin.saveSettings();
						} else if (value === '') {
							this.plugin.settings.tavilyMaxResults = DEFAULT_SETTINGS.tavilyMaxResults;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show default restored
						} else {
							new Notice("Please enter a valid number between 1 and 20 for Tavily max results.");
							text.setValue(String(this.plugin.settings.tavilyMaxResults)); // Revert
						}
					}));

			// Add Tavily Search Depth setting
			new Setting(containerEl)
				.setName('Tavily Search Depth')
				.setDesc('Controls the depth of the search. "advanced" provides better results but costs 2 API credits per search.')
				.addDropdown(dropdown => dropdown
					.addOption('basic', 'Basic')
					.addOption('advanced', 'Advanced (2 Credits)')
					.setValue(this.plugin.settings.tavilySearchDepth)
					.onChange(async (value: 'basic' | 'advanced') => {
						this.plugin.settings.tavilySearchDepth = value;
						await this.plugin.saveSettings();
					}));

		} else if (this.plugin.settings.searchProvider === 'duckduckgo') {
			new Setting(containerEl)
				.setName('DuckDuckGo Max Results')
				.setDesc('Maximum number of search results to parse from DuckDuckGo.')
				.addSlider(slider => slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.ddgMaxResults)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.ddgMaxResults = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('DuckDuckGo Content Fetch Timeout (seconds)')
				.setDesc('Maximum time to wait when fetching content from each DuckDuckGo result URL.')
				.addSlider(slider => slider
					.setLimits(5, 60, 5)
					.setValue(this.plugin.settings.ddgFetchTimeout)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.ddgFetchTimeout = value;
						await this.plugin.saveSettings();
					}));
		}

		// Add setting for max research content tokens
		new Setting(containerEl)
			.setName('Max Research Content Tokens')
			.setDesc('Approximate maximum tokens from web research results to include in the summarization prompt. Helps manage context window size.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.maxResearchContentTokens))
				.setValue(String(this.plugin.settings.maxResearchContentTokens))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue) && numValue > 100) { // Ensure a reasonable minimum
						this.plugin.settings.maxResearchContentTokens = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') {
						this.plugin.settings.maxResearchContentTokens = DEFAULT_SETTINGS.maxResearchContentTokens;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show default restored
					} else {
						new Notice("Please enter a valid number greater than 100 for max research tokens.");
						text.setValue(String(this.plugin.settings.maxResearchContentTokens)); // Revert
					}
				}));


		// --- Other General Settings ---
		containerEl.createEl('h4', { text: 'Processing Parameters' });

		new Setting(containerEl)
			.setName('Chunk Word Count')
			.setDesc('Maximum words per chunk sent to LLM. Lower values use less context per call but increase call count.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.chunkWordCount))
				.setValue(String(this.plugin.settings.chunkWordCount))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue) && numValue > 50) {
						this.plugin.settings.chunkWordCount = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') {
						this.plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show default restored
					} else {
						new Notice("Please enter a valid number greater than 50 for chunk word count.");
						text.setValue(String(this.plugin.settings.chunkWordCount)); // Revert
					}
				}));

		new Setting(containerEl)
			.setName('Enable Duplicate Detection')
			.setDesc('Enable checks for duplicate words, plural/singular pairs, etc. (results logged to console).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDuplicateDetection)
				.onChange(async (value) => {
					this.plugin.settings.enableDuplicateDetection = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max Tokens')
			.setDesc('Maximum tokens LLM should generate per response. Affects cost and length.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.maxTokens))
				.setValue(String(this.plugin.settings.maxTokens))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.maxTokens = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') {
						this.plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show default restored
					} else {
						new Notice("Please enter a valid positive number for max tokens.");
						text.setValue(String(this.plugin.settings.maxTokens)); // Revert
					}
				}));

		// Removed duplicate Max Tokens setting
		// new Setting(containerEl)
		// Processing Mode setting might be less relevant now with separate commands
		// new Setting(containerEl)
		// 	.setName('Processing Mode')
		// 	.setDesc('How files should be processed')
		// 	.addDropdown(dropdown => dropdown
		// 		.addOption('single', 'Single File (via command)')
		// 		.addOption('batch', 'Batch Mode (via command)')
		// 		.setValue(this.plugin.settings.processMode)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.processMode = value;
		// 			await this.plugin.saveSettings();
		// 		}));
	}
}

// --- Error Modal for Copyable Messages ---
class ErrorModal extends Modal {
	title: string;
	errorMessage: string;

	constructor(app: App, title: string, errorMessage: string) {
		super(app);
		this.title = title;
		this.errorMessage = errorMessage;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('notemd-error-modal');

		contentEl.createEl('h3', { text: this.title });

		// Display error in a preformatted block for easy selection/copying
		const errorBlock = contentEl.createEl('pre', { cls: 'notemd-error-message-block' });
		errorBlock.setText(this.errorMessage);

		// Add a copy button
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		const copyButton = buttonContainer.createEl('button', { text: 'Copy Error Details', cls: 'mod-cta' });
		copyButton.onclick = () => {
			navigator.clipboard.writeText(this.errorMessage).then(() => {
				new Notice('Error details copied to clipboard!');
				copyButton.setText('Copied!');
				setTimeout(() => copyButton.setText('Copy Error Details'), 2000);
			}).catch(err => {
				new Notice('Failed to copy error details. See console.');
				console.error('Failed to copy error to clipboard:', err);
			});
		};

		const closeButton = buttonContainer.createEl('button', { text: 'Close' });
		closeButton.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
