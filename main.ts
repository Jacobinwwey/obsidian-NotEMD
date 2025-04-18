import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

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
	// Other settings
	chunkWordCount: number;
	maxTokens: number; // Added setting for max tokens
	enableDuplicateDetection: boolean; // Added setting for duplicate checks
	processMode: string; // Although commands are separate, keep for potential future use or settings logic
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
	// Other Defaults
	chunkWordCount: 3000,
	maxTokens: 4096, // Default max tokens for LLM response
	enableDuplicateDetection: true, // Enable by default
	processMode: 'single'
}

// Interface for progress reporting (used by Modal and Sidebar View)
interface ProgressReporter {
	log(message: string): void;
	updateStatus(text: string, percent?: number): void;
	requestCancel(): void;
	clearDisplay(): void;
	get cancelled(): boolean;
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

			// --- Determine Processed File Output Path ---
			let processedFileSaveDir = '';
			if (this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder) {
				processedFileSaveDir = this.settings.processedFileFolder;
			} else {
				// Default: Save in the same folder as the original file
				processedFileSaveDir = activeFile.parent?.path || ''; // Use empty string for vault root
			}

			// Normalize path (remove leading/trailing slashes for consistency, handle root case)
			processedFileSaveDir = processedFileSaveDir.replace(/^\/|\/$/g, '');
			if (processedFileSaveDir && !processedFileSaveDir.endsWith('/')) {
				processedFileSaveDir += '/';
			}
			// Handle vault root case explicitly
			if (activeFile.parent?.path === '/' && !(this.settings.useCustomProcessedFileFolder && this.settings.processedFileFolder)) {
				processedFileSaveDir = ''; // Ensure root path is empty string for correct concatenation
			}


			// Ensure output folder exists before constructing path
			const targetSaveFolder = processedFileSaveDir.replace(/\/$/, ''); // Remove trailing slash for check/create
			if (targetSaveFolder && !this.app.vault.getAbstractFileByPath(targetSaveFolder)) {
				try {
					// console.log(`DEBUG: Attempting to create processed file folder: '${targetSaveFolder}'`);
					await this.app.vault.createFolder(targetSaveFolder);
					reporter.log(`Created processed file output folder: ${targetSaveFolder}`);
				} catch (folderError: any) {
					// console.error(`DEBUG: createFolder failed specifically for processed file path: '${targetSaveFolder}'`, folderError);
					reporter.log(`Error creating processed file output folder ${targetSaveFolder}: ${folderError.message}`);
					new Notice(`Error creating processed file output folder: ${folderError.message}`);
					throw folderError; // Re-throw to stop processing
				}
			} else if (targetSaveFolder && !(this.app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
				const errorMsg = `Processed file output path '${targetSaveFolder}' exists but is not a folder.`;
				reporter.log(errorMsg);
				new Notice(errorMsg);
				throw new Error(errorMsg);
			}

			// Construct final processed file name
			const processedName = `${processedFileSaveDir}${activeFile.basename}_processed.md`;
			reporter.log(`Saving processed file as: ${processedName}`);
			// console.log(`processWithNotemd: Determined processed file output path: ${processedName}`); // DEBUG

			// Check if file exists before creating/modifying
			const existingProcessedFile = this.app.vault.getAbstractFileByPath(processedName);
			// console.log(`processWithNotemd: Checking existence of ${processedName}. Found: ${!!existingProcessedFile}`); // DEBUG
			if (existingProcessedFile instanceof TFile) {
				// console.log(`processWithNotemd: Modifying existing file: ${processedName}`); // DEBUG
				await this.app.vault.modify(existingProcessedFile, withLinks);
				reporter.log(`Overwrote existing processed file: ${processedName}`);
			} else {
				// console.log(`processWithNotemd: Creating new file: ${processedName}`); // DEBUG
				await this.app.vault.create(processedName, withLinks);
				reporter.log(`Created processed file: ${processedName}`);
			}
			// console.log("processWithNotemd: File saving complete."); // DEBUG

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
					console.error(errorMsg, fileError);
					reporter.log(errorMsg);
					// Optionally mark the overall progress as errored? Or just log?
					// For now, just log and continue. We'll show the detailed error modal outside the loop if needed.
				}

				if (reporter.cancelled) { // Check again after processFile
					new Notice('Batch processing cancelled by user.');
					this.updateStatusBar('Cancelled');
					reporter.updateStatus('Batch processing cancelled.', -1);
					break;
				}
			} // End of loop

			if (!reporter.cancelled) {
				reporter.updateStatus('Batch processing complete!', 100);
				this.updateStatusBar('Batch complete');
				// Only close if it's the modal we created
				if (closeModalOnFinish && reporter instanceof ProgressModal) {
					// Explicitly cast inside setTimeout
					setTimeout(() => (reporter as ProgressModal).close(), 2000);
				}
			}
			// If cancelled, the status is already set inside the loop

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
		// console.log(`processFile: Calling processContentWithLLM for ${file.name}...`); // DEBUG
		const processedContent = await this.processContentWithLLM(content, progressReporter);
		// console.log(`processFile: processContentWithLLM returned ${processedContent?.length ?? 'null/undefined'} characters for ${file.name}.`); // DEBUG

		if (progressReporter.cancelled) {
			progressReporter.log(`Processing cancelled for ${file.name}`);
			// console.log(`processFile: Processing cancelled for ${file.name}`); // DEBUG
			return; // Stop processing this file if cancelled
		}

		progressReporter.log(`Generating links for: ${file.name}`);
		// console.log(`processFile: Calling generateObsidianLinks for ${file.name}...`); // DEBUG
		const withLinks = this.generateObsidianLinks(processedContent);
		// console.log(`processFile: generateObsidianLinks returned ${withLinks?.length ?? 'null/undefined'} characters for ${file.name}.`); // DEBUG

		progressReporter.log(`Handling duplicates for: ${file.name}`);
		// console.log(`processFile: Calling handleDuplicates for ${file.name}...`); // DEBUG
		await this.handleDuplicates(withLinks);
		// console.log(`processFile: handleDuplicates finished for ${file.name}.`); // DEBUG

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

		// Construct final processed file name
		const processedName = `${processedFileSaveDir}${file.basename}_processed.md`;
		progressReporter.log(`Saving processed file as: ${processedName}`);
		// console.log(`processFile: Determined processed file output path: ${processedName}`); // DEBUG

		// Check if file exists before creating/modifying
		const existingProcessedFile = this.app.vault.getAbstractFileByPath(processedName);
		// console.log(`processFile: Checking existence of ${processedName}. Found: ${!!existingProcessedFile}`); // DEBUG
		if (existingProcessedFile instanceof TFile) {
			// console.log(`processFile: Modifying existing file: ${processedName}`); // DEBUG
			await this.app.vault.modify(existingProcessedFile, withLinks);
			progressReporter.log(`Overwrote existing processed file: ${processedName}`);
		} else {
			// console.log(`processFile: Creating new file: ${processedName}`); // DEBUG
			await this.app.vault.create(processedName, withLinks);
			progressReporter.log(`Created processed file: ${processedName}`);
		}
		// console.log(`processFile: File saving complete for ${processedName}.`); // DEBUG

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
		// Regex to find the link:
		// - Optionally preceded by list marker and whitespace (^[ \t]*[-*+]\s+)
		// - OR just the link itself
		// - Followed by optional whitespace and newline
		const linkRegex = new RegExp(`(?:^[ \\t]*[-*+]\\s+)?\\[\\[${escapedFileName}\\]\\][ \\t]*$\\n?`, 'gm');
		// Simpler regex just to remove the link itself if the above is too aggressive
		// const simpleLinkRegex = new RegExp(`\\[\\[${escapedFileName}\\]\\]`, 'g');

		const files = this.app.vault.getMarkdownFiles();
		let updatedCount = 0;
		const errors: string[] = [];

		for (const file of files) {
			try {
				let content = await this.app.vault.read(file);
				let updatedContent = content;

				if (content.includes(`[[${fileName}]]`)) { // Quick check before running regex
					// Attempt to remove the link, potentially removing the list item line
					updatedContent = content.replace(linkRegex, (match) => {
						// If the match starts with list syntax, remove the whole line (including newline)
						// Otherwise, just remove the link itself (replace with empty string) - this part needs refinement
						// For simplicity now, let's just remove the link text itself if not a list item
						// A better approach might involve AST parsing, but regex is used here.
						// Let's try removing the whole line if it's a list item, otherwise just the link.
						return match.trim().startsWith('-') || match.trim().startsWith('*') || match.trim().startsWith('+') ? '' : match.replace(`[[${fileName}]]`, '');
					});

					// Clean up potential empty lines left after removal
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
						'HTTP-Referer': 'https://github.com/Jacobinwwey/Notemd', // Required by OpenRouter
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


	private async callDeepSeekAPI(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// Removed the old testAPI call here - connection test should be done separately if desired
		// const isHealthy = await this.testAPI(provider);
		// if (!isHealthy) {
		// 	throw new Error('API connection test failed');
		// }

		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: provider.model,
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${provider.apiKey}`
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callDeepSeekAPI: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callDeepSeekAPI: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callDeepSeekAPI: Raw Response Data:", data); // DEBUG: Potentially verbose
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callDeepSeekAPI: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from DeepSeek API`);
		}
		// console.log(`callDeepSeekAPI: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
	}

	private async callOpenAIApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// Add API health check if applicable (assuming a similar /health or equivalent endpoint)
		// const isHealthy = await this.testAPI(provider); // Adapt testAPI or use a provider-specific check
		// if (!isHealthy) { throw new Error('API connection test failed'); }

		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: provider.model,
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${provider.apiKey}`
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callOpenAIApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callOpenAIApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callOpenAIApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callOpenAIApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from OpenAI API`);
		}
		// console.log(`callOpenAIApi: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
	}

	private async callAnthropicApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		const url = `${provider.baseUrl}/v1/messages`;
		const requestBody = {
			model: provider.model,
			messages: [{
				role: 'user',
				content: `${prompt}\n\n${content}` // Anthropic prefers prompt in user message
			}],
			temperature: provider.temperature,
			max_tokens: this.settings.maxTokens // Use setting
		};
		// console.log(`callAnthropicApi: Calling URL: ${url}`); // DEBUG
		// console.log(`callAnthropicApi: Request Body (excluding content):`, { ...requestBody, messages: [{ role: 'user', content: `(prompt + content length: ${prompt.length + content.length})` }] }); // DEBUG

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': provider.apiKey,
				'anthropic-version': '2023-06-01' // Use a specific version
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callAnthropicApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callAnthropicApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callAnthropicApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		if (!data.content || !data.content[0] || !data.content[0].text) {
			console.error("callAnthropicApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from Anthropic API`);
		}
		// console.log(`callAnthropicApi: Success. Returning content length: ${data.content[0].text.length}`); // DEBUG
		return data.content[0].text;
	}

	private async callGoogleApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// Google API doesn't have a standard /health endpoint. Skipping testAPI.
		// const isHealthy = await this.testAPI(provider);
		// if (!isHealthy) { throw new Error('API connection test failed'); }

		// Use API key in query parameter for Google Gemini
		const urlWithKey = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
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

		const response = await fetch(urlWithKey, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callGoogleApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callGoogleApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`Google API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callGoogleApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		// Check response structure carefully
		if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
			console.error("callGoogleApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from Google API`);
		}
		// console.log(`callGoogleApi: Success. Returning content length: ${data.candidates[0].content.parts[0].text.length}`); // DEBUG
		return data.candidates[0].content.parts[0].text;
	}


	private async callMistralApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: provider.model,
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${provider.apiKey}`
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callMistralApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callMistralApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callMistralApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callMistralApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from Mistral API`);
		}
		// console.log(`callMistralApi: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
	}

	private async callAzureOpenAIApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		if (!provider.apiVersion) {
			throw new Error('API version is required for Azure OpenAI');
		}
		if (!provider.baseUrl) {
			throw new Error('Base URL (endpoint) is required for Azure OpenAI');
		}

		// Construct the full URL for Azure deployment
		const url = `${provider.baseUrl}/openai/deployments/${provider.model}/chat/completions?api-version=${provider.apiVersion}`;
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': provider.apiKey // Azure uses 'api-key' header
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callAzureOpenAIApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callAzureOpenAIApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callAzureOpenAIApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callAzureOpenAIApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from Azure OpenAI API`);
		}
		// console.log(`callAzureOpenAIApi: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
	}

	private async callLMStudioApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// LMStudio uses OpenAI compatible endpoint
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: provider.model,
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// LMStudio might need a placeholder key, even if not validated
				'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callLMStudioApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callLMStudioApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callLMStudioApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		// Standard OpenAI response format expected
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callLMStudioApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from LMStudio`);
		}
		// console.log(`callLMStudioApi: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
	}

	private async callOllamaApi(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// Ollama has a different endpoint and request structure
		const url = `${provider.baseUrl}/chat`; // Endpoint is /api/chat
		const requestBody = {
			model: provider.model,
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// No API key needed for Ollama
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callOllamaApi: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callOllamaApi: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callOllamaApi: Raw Response Data:", data); // DEBUG: Potentially verbose
		// Ollama's response structure is different
		if (!data.message || !data.message.content) {
			console.error("callOllamaApi: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from Ollama`);
		}
		// console.log(`callOllamaApi: Success. Returning content length: ${data.message.content.length}`); // DEBUG
		return data.message.content;
	}

	private async callOpenRouterAPI(provider: LLMProviderConfig, prompt: string, content: string): Promise<string> {
		// OpenRouter uses OpenAI compatible endpoint but requires specific headers
		const url = `${provider.baseUrl}/chat/completions`;
		const requestBody = {
			model: provider.model, // User specifies the full model string e.g., "google/gemini-pro"
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

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${provider.apiKey}`, // Required
				'HTTP-Referer': 'https://github.com/Jacobinwwey/Notemd', // Required by OpenRouter - replace with your actual repo URL if different
				'X-Title': 'Notemd Obsidian Plugin' // Required by OpenRouter - can be your app's name
			},
			body: JSON.stringify(requestBody)
		});

		// console.log(`callOpenRouterAPI: Response Status: ${response.status}`); // DEBUG
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`callOpenRouterAPI: Error Response Text: ${errorText}`); // Keep error log
			throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		// // console.log("callOpenRouterAPI: Raw Response Data:", data); // DEBUG: Potentially verbose
		// Standard OpenAI response format expected
		if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error("callOpenRouterAPI: Unexpected response format:", data); // Keep error log
			throw new Error(`Unexpected response format from OpenRouter`);
		}
		// console.log(`callOpenRouterAPI: Success. Returning content length: ${data.choices[0].message.content.length}`); // DEBUG
		return data.choices[0].message.content;
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




	// Modify signature to accept ProgressReporter
	async processContentWithLLM(content: string, progressReporter: ProgressReporter): Promise<string> {
		// console.log("Entering processContentWithLLM"); // DEBUG
		const provider = this.settings.providers.find(p => p.name === this.settings.activeProvider);
		if (!provider) {
			console.error("processContentWithLLM: No active provider found!"); // Keep error log
			throw new Error('No active LLM provider configured');
		}
		// console.log(`processContentWithLLM: Using provider: ${provider.name}, Model: ${provider.model}, BaseURL: ${provider.baseUrl}`); // DEBUG
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
				// console.log(`processContentWithLLM: Calling API function for provider: ${provider.name}`); // DEBUG
				switch (provider.name) {
					case 'DeepSeek':
						responseText = await this.callDeepSeekAPI(provider, prompt, chunk);
						break;
					case 'OpenAI':
						responseText = await this.callOpenAIApi(provider, prompt, chunk);
						break;
					case 'Anthropic':
						responseText = await this.callAnthropicApi(provider, prompt, chunk);
						break;
					case 'Google':
						responseText = await this.callGoogleApi(provider, prompt, chunk);
						break;
					case 'Mistral':
						responseText = await this.callMistralApi(provider, prompt, chunk);
						break;
					case 'Azure OpenAI':
						responseText = await this.callAzureOpenAIApi(provider, prompt, chunk);
						break;
					case 'LMStudio':
						responseText = await this.callLMStudioApi(provider, prompt, chunk);
						break;
					case 'Ollama':
						responseText = await this.callOllamaApi(provider, prompt, chunk);
						break;
					case 'OpenRouter':
						responseText = await this.callOpenRouterAPI(provider, prompt, chunk);
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
				new Notice(`LLM Error (${provider.name}) on chunk ${i + 1}: ${error.message}`);
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
				// Sanitize concept name for filename (more robustly)
				let safeName = concept
					.replace(/[\\/:*?"<>|#^[\]]/g, '') // Remove invalid file path chars + Obsidian specific ones
					.replace(/\s+/g, ' ') // Collapse multiple spaces
					.trim();

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
					}
				} catch (fileOpError: any) {
					console.error(`Error processing concept note "${notePath}": ${fileOpError.message}`);
					// Optionally add to a list of errors to report later
				}
			} // End for loop

			// if (createdCount > 0) console.log(`Created ${createdCount} new concept notes.`); // Less critical logs
			// if (updatedCount > 0) console.log(`Updated ${updatedCount} existing concept notes with backlinks.`);

		} catch (error: any) { // Added type annotation
			console.error("Error creating concept notes:", error);
			new Notice(`Error creating concept notes: ${error.message}. Check console.`);
			// Optionally log to modal if passed, but this function isn't currently called with it
			// progressModal?.log(`Error creating concept notes: ${error.message}`);
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
			this.log('User requested cancellation');
			if (this.cancelButton) this.cancelButton.setAttribute('disabled', 'true');
		}
	}

	clearDisplay() {
		// Modals are typically recreated, but clear if needed for reuse (unlikely here)
		this.logEl?.empty();
		this.updateStatus('Starting...', 0);
		this.isCancelled = false;
		if (this.cancelButton) this.cancelButton.removeAttribute('disabled');
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
			this.cancelButton.addClass('is-hidden'); // Hide cancel button
			this.cancelButton.disabled = true;
		}
		this.isProcessing = false;
		this.isCancelled = false;
		this.startTime = 0;
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
		if (this.isProcessing) {
			this.isCancelled = true;
			this.updateStatus('Cancelling...', -1);
			this.log('User requested cancellation.');
			if (this.cancelButton) this.cancelButton.disabled = true;
		}
	}


	async onOpen() {
		const container = this.containerEl.children[1]; // View content container
		container.empty();
		container.addClass('notemd-sidebar-container'); // Add a class for potential styling

		container.createEl("h4", { text: "Notemd Actions" });

		// --- Action Buttons ---
		const buttonGroup = container.createDiv({ cls: 'notemd-button-group' });

		// Process Current File Button
		const processCurrentButton = buttonGroup.createEl('button', { text: 'Process Current File', cls: 'mod-cta' });
		processCurrentButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay(); // Clear previous run
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.removeClass('is-hidden'); // Show cancel button
				this.cancelButton.disabled = false;
			}
			this.log('Starting: Process Current File...');
			this.updateStatus('Processing current file...', 0);
			// Pass 'this' (the view instance) instead of creating a ProgressModal
			await this.plugin.processWithNotemd(this);
			this.isProcessing = false; // Mark processing finished
			if (this.cancelButton) this.cancelButton.addClass('is-hidden'); // Hide cancel button
		};

		// Process Folder Button
		const processFolderButton = buttonGroup.createEl('button', { text: 'Process Folder' });
		processFolderButton.onclick = async () => {
			if (this.isProcessing) {
				new Notice("Processing already in progress.");
				return;
			}
			this.clearDisplay();
			this.isProcessing = true;
			this.startTime = Date.now();
			if (this.cancelButton) {
				this.cancelButton.removeClass('is-hidden'); // Show cancel button
				this.cancelButton.disabled = false;
			}
			this.log('Starting: Process Folder...');
			this.updateStatus('Processing folder...', 0);
			// Pass 'this' (the view instance) instead of creating a ProgressModal
			await this.plugin.processFolderWithNotemd(this);
			this.isProcessing = false;
			if (this.cancelButton) this.cancelButton.addClass('is-hidden'); // Hide cancel button
		};

		// Check Duplicates Button
		const checkDuplicatesButton = buttonGroup.createEl('button', { text: 'Check Duplicates (Current File)' });
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
		const testConnectionButton = buttonGroup.createEl('button', { text: 'Test LLM Connection' });
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

		// Cancel Button (initially hidden)
		this.cancelButton = progressArea.createEl('button', { text: 'Cancel Processing', cls: 'notemd-cancel-button' });
		this.cancelButton.addClass('is-hidden'); // Hide initially
		this.cancelButton.disabled = true;
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

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Notemd Settings'});

		// --- Provider Configuration ---
		containerEl.createEl('h3', { text: 'LLM Provider Configuration' });

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


		// --- Other General Settings ---
		containerEl.createEl('h4', { text: 'Processing Parameters' });

		new Setting(containerEl)
			.setName('Chunk Word Count')
			.setDesc('Maximum number of words per chunk sent to the LLM. Lower values use less context per API call but may increase the number of calls.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.chunkWordCount)) // Show default as placeholder
				.setValue(String(this.plugin.settings.chunkWordCount))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue) && numValue > 50) { // Basic validation: ensure it's a number > 50
						this.plugin.settings.chunkWordCount = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') { // Allow clearing to reset to default (or handle differently)
						this.plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
						await this.plugin.saveSettings();
						// Optionally refresh the display to show the default value restored
						// this.display();
					} else {
						new Notice("Please enter a valid number greater than 50 for chunk word count.");
					}0
				}));

		new Setting(containerEl)
			.setName('Enable Duplicate Detection')
			.setDesc('Enable checks for duplicate words, plural/singular pairs, and normalization conflicts within processed content (results logged to console).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDuplicateDetection)
				.onChange(async (value) => {
					this.plugin.settings.enableDuplicateDetection = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max Tokens')
			.setDesc('Maximum number of tokens the LLM should generate in its response. Affects cost and response length.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.maxTokens)) // Show default
				.setValue(String(this.plugin.settings.maxTokens))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					// Add reasonable validation, e.g., must be > 0 and maybe not excessively large
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.maxTokens = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') {
						this.plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens; // Reset to default if cleared
						await this.plugin.saveSettings();
						// Optionally refresh display: this.display();
					} else {
						new Notice("Please enter a valid positive number for max tokens.");
					}
				}));

		new Setting(containerEl)
			.setName('Max Tokens')
			.setDesc('Maximum number of tokens the LLM should generate in its response. Affects cost and response length.')
			.addText(text => text
				.setPlaceholder(String(DEFAULT_SETTINGS.maxTokens)) // Show default
				.setValue(String(this.plugin.settings.maxTokens))
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					// Add reasonable validation, e.g., must be > 0 and maybe not excessively large
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.maxTokens = numValue;
						await this.plugin.saveSettings();
					} else if (value === '') {
						this.plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens; // Reset to default if cleared
						await this.plugin.saveSettings();
						// Optionally refresh display: this.display();
					} else {
						new Notice("Please enter a valid positive number for max tokens.");
					}
				}));

		new Setting(containerEl)
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
