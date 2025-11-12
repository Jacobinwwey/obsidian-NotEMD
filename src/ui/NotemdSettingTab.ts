import { App, PluginSettingTab, Setting, Notice, TextAreaComponent } from 'obsidian';
import NotemdPlugin from '../main'; // Import the plugin class itself
import { LLMProviderConfig, NotemdSettings, TaskKey } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { testAPI } from '../llmUtils'; // Import testAPI
import { getDefaultPrompt } from '../promptUtils'; // Import for default prompts

// Define specific key types for settings accessed dynamically
type ProviderSettingKey = 'addLinksProvider' | 'researchProvider' | 'generateTitleProvider' | 'translateProvider';
type ModelSettingKey = 'addLinksModel' | 'researchModel' | 'generateTitleModel' | 'translateModel';


export class NotemdSettingTab extends PluginSettingTab {
    plugin: NotemdPlugin;

    constructor(app: App, plugin: NotemdPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    // Define the path for the providers JSON file within the plugin's config directory
    private get providersFilePath(): string {
        const pluginConfigDir = this.app.vault.configDir + '/plugins/' + this.plugin.manifest.id;
        return `${pluginConfigDir}/notemd-providers.json`;
    }

    async exportProviderSettings(): Promise<void> {
        try {
            const providersToExport = this.plugin.settings.providers;
            const jsonData = JSON.stringify(providersToExport, null, 2); // Pretty print JSON

            const pluginConfigDir = this.app.vault.configDir + '/plugins/' + this.plugin.manifest.id;
            try {
                const dirExists = await this.app.vault.adapter.exists(pluginConfigDir);
                if (!dirExists) {
                    await this.app.vault.adapter.mkdir(pluginConfigDir);
                }
            } catch (mkdirError) {
                console.error("Error ensuring plugin directory exists:", mkdirError);
                new Notice(`Error creating plugin directory: ${mkdirError.message}`);
                return;
            }

            await this.app.vault.adapter.write(this.providersFilePath, jsonData);
            new Notice(`Provider settings exported successfully to ${this.providersFilePath}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error exporting provider settings:", error);
            new Notice(`Error exporting settings: ${message}`);
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

            if (!Array.isArray(importedProviders)) {
                throw new Error("Imported file does not contain a valid provider array.");
            }

            const existingProvidersMap = new Map(this.plugin.settings.providers.map(p => [p.name, p]));
            let importedCount = 0;
            let newCount = 0;

            importedProviders.forEach(importedProvider => {
                if (importedProvider && typeof importedProvider.name === 'string') {
                    if (existingProvidersMap.has(importedProvider.name)) {
                        existingProvidersMap.set(importedProvider.name, importedProvider);
                        importedCount++;
                    } else {
                        existingProvidersMap.set(importedProvider.name, importedProvider);
                        newCount++;
                    }
                } else {
                    console.warn("Skipping invalid provider object during import:", importedProvider);
                }
            });

            this.plugin.settings.providers = Array.from(existingProvidersMap.values());

            if (!this.plugin.settings.providers.some(p => p.name === this.plugin.settings.activeProvider)) {
                this.plugin.settings.activeProvider = DEFAULT_SETTINGS.activeProvider;
                new Notice(`Active provider reset to default as previous one was not found after import.`);
            }

            await this.plugin.saveSettings();
            new Notice(`Successfully imported ${newCount} new and updated ${importedCount} existing provider settings.`);
            this.display(); // Refresh display

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error importing provider settings:", error);
            new Notice(`Error importing settings: ${message}`);
        }
    }


    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // --- Provider Configuration ---
        new Setting(containerEl).setName('LLM providers').setHeading();

        const providerMgmtSetting = new Setting(containerEl)
            .setName('Manage provider configurations')
            .setDesc('Export your current provider settings to a JSON file, or import settings from a file.');
        providerMgmtSetting.addButton(button => button
            .setButtonText('Export providers').setTooltip('Save provider configurations').onClick(() => this.exportProviderSettings()));
        providerMgmtSetting.addButton(button => button
            .setButtonText('Import providers').setTooltip('Load provider configurations (merges)').onClick(() => this.importProviderSettings()));

        new Setting(containerEl)
            .setName('Active provider')
            .setDesc('Select the LLM provider to use for processing.')
            .addDropdown(dropdown => {
                const providerNames = this.plugin.settings.providers.map(p => p.name).sort();
                providerNames.forEach(name => dropdown.addOption(name, name));
                dropdown
                    .setValue(this.plugin.settings.activeProvider)
                    .onChange(async (value) => {
                        this.plugin.settings.activeProvider = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        const activeProvider = this.plugin.settings.providers.find(p => p.name === this.plugin.settings.activeProvider);

        if (activeProvider) {
            new Setting(containerEl).setName(`${activeProvider.name} details`).setHeading();

            if (activeProvider.name !== 'Ollama') {
                new Setting(containerEl)
                    .setName('API key')
                    .setDesc(`API key for ${activeProvider.name}. ${activeProvider.name === 'LMStudio' ? "(Optional, often 'EMPTY')" : ""}`)
                    .addText(text => text
                        .setPlaceholder(activeProvider.name === 'LMStudio' ? 'Usually EMPTY or leave blank' : 'Enter your API key')
                        .setValue(activeProvider.apiKey)
                        .onChange(async (value) => { activeProvider.apiKey = value; await this.plugin.saveSettings(); }));
            }

            new Setting(containerEl)
                .setName('Base URL / endpoint')
                .setDesc(`The API endpoint for ${activeProvider.name}. ${activeProvider.name === 'Azure OpenAI' ? 'Required.' : ''}`)
                .addText(text => text
                    .setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.baseUrl || 'Enter API Base URL')
                    .setValue(activeProvider.baseUrl)
                    .onChange(async (value) => { activeProvider.baseUrl = value; await this.plugin.saveSettings(); }));

            new Setting(containerEl)
                .setName('Model')
                .setDesc(`Model name to use with ${activeProvider.name}.`)
                .addText(text => text
                    .setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.model || 'Enter model name')
                    .setValue(activeProvider.model)
                    .onChange(async (value) => { activeProvider.model = value; await this.plugin.saveSettings(); }));

            new Setting(containerEl)
                .setName('Temperature')
                .setDesc('Controls randomness (0=deterministic, 1=creative).')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(activeProvider.temperature)
                    .onChange(async (value) => { activeProvider.temperature = value; await this.plugin.saveSettings(); })
                    .setDynamicTooltip());

            if (activeProvider.name === 'Azure OpenAI') {
                new Setting(containerEl)
                    .setName('API version')
                    .setDesc('Required API version for Azure OpenAI (e.g., 2024-02-15-preview)')
                    .addText(text => text
                        .setPlaceholder('Enter API version')
                        .setValue(activeProvider.apiVersion || '')
                        .onChange(async (value) => { activeProvider.apiVersion = value; await this.plugin.saveSettings(); }));
            }

            new Setting(containerEl)
                .setName(`Test ${activeProvider.name} connection`)
                .setDesc('Verify API key, endpoint, and model accessibility.')
                .addButton(button => button
                    .setButtonText('Test connection').setCta()
                    .onClick(async () => {
                        button.setDisabled(true).setButtonText('Testing...');
                        const testingNotice = new Notice(`Testing connection to ${activeProvider.name}...`, 0);
                        try {
                            const result = await testAPI(activeProvider); // Use imported testAPI
                            testingNotice.hide();
                            if (result.success) { new Notice(`✅ Success: ${result.message}`, 5000); }
                            else { new Notice(`❌ Failed: ${result.message}. Check console.`, 10000); }
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            testingNotice.hide();
                            new Notice(`Error during connection test: ${message}`, 10000);
                            console.error(`Error testing ${activeProvider.name} connection from settings:`, error);
                        } finally {
                            button.setDisabled(false).setButtonText('Test connection');
                        }
                    }));
        } else {
            containerEl.createEl('p', { text: 'Error: Could not find configuration for the active provider.', cls: 'notemd-error-text' });
        }

        // --- Multi-Model Settings ---
        new Setting(containerEl).setName('Multi-model usage').setHeading();
        new Setting(containerEl)
            .setName('Use different providers for tasks')
            .setDesc('On: Select a specific LLM provider for each task below. Off: Use the single "Active Provider".')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useMultiModelSettings)
                .onChange(async (value) => {
                    this.plugin.settings.useMultiModelSettings = value;
                    if (value) {
                        this.plugin.settings.addLinksProvider = this.plugin.settings.addLinksProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.researchProvider = this.plugin.settings.researchProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.generateTitleProvider = this.plugin.settings.generateTitleProvider || this.plugin.settings.activeProvider;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useMultiModelSettings) {
            const providerNames = this.plugin.settings.providers.map(p => p.name).sort();
            // Use the specific key types defined above
            const createTaskModelSettings = (providerSettingName: keyof NotemdSettings, modelSettingName: keyof NotemdSettings, taskDesc: string) => {
                const taskSetting = new Setting(containerEl).setName(`${taskDesc} provider & model`).setDesc(`Select provider and optionally override model for "${taskDesc}".`);
                taskSetting.addDropdown(dropdown => {
                    providerNames.forEach(name => dropdown.addOption(name, name));
                    // Use the typed key
                    dropdown.setValue(this.plugin.settings[providerSettingName] as string).onChange(async (value) => {
                        (this.plugin.settings as any)[providerSettingName] = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
                });
                const selectedProviderName = this.plugin.settings[providerSettingName] as string;
                const selectedProvider = this.plugin.settings.providers.find(p => p.name === selectedProviderName);
                const defaultModel = selectedProvider ? selectedProvider.model : 'Provider not found';
                    // Use the typed key
                    taskSetting.addText(text => text.setPlaceholder(`Default: ${defaultModel}`).setValue(this.plugin.settings[modelSettingName] as string || '').onChange(async (value) => {
                        (this.plugin.settings as any)[modelSettingName] = value.trim() || undefined;
                        await this.plugin.saveSettings();
                    }));
            };
            createTaskModelSettings('addLinksProvider', 'addLinksModel', 'Add links (process file/folder)');
            createTaskModelSettings('researchProvider', 'researchModel', 'Research & summarize');
            createTaskModelSettings('generateTitleProvider', 'generateTitleModel', 'Generate from title');
            createTaskModelSettings('translateProvider', 'translateModel', 'Translate');
            createTaskModelSettings('summarizeToMermaidProvider', 'summarizeToMermaidModel', 'Summarise as Mermaid diagram');
            createTaskModelSettings('extractConceptsProvider', 'extractConceptsModel', 'Extract Concepts');
        }

        // --- Translate Task Settings ---
        new Setting(containerEl).setName('Task: Translate').setHeading();

        // New setting: Toggle for custom translation save path
        new Setting(containerEl)
            .setName('Customise translation file save path')
            .setDesc('On: Save translated files to a specified path. Off: Save in the same folder as the original file.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomTranslationSavePath)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomTranslationSavePath = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the path input
                }));

        // Conditionally display the path input
        if (this.plugin.settings.useCustomTranslationSavePath) {
            new Setting(containerEl)
                .setName('Translation save path')
                .setDesc('The folder where translated files will be saved (relative to vault root).')
                .addText(text => text
                    .setPlaceholder('e.g., Translations')
                    .setValue(this.plugin.settings.translationSavePath)
                    .onChange(async (value) => {
                        this.plugin.settings.translationSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Use custom suffix for translated files')
            .setDesc('Enable to use a custom suffix instead of the default "_translated".')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomTranslationSuffix)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomTranslationSuffix = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the text input
                }));

        if (this.plugin.settings.useCustomTranslationSuffix) {
            new Setting(containerEl)
                .setName('Custom Suffix')
                .setDesc('The custom suffix to append to translated filenames.')
                .addText(text => text
                    .setPlaceholder('_my_translation')
                    .setValue(this.plugin.settings.translationCustomSuffix)
                    .onChange(async (value) => {
                        this.plugin.settings.translationCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // --- Summarize to Mermaid Task Settings ---
        new Setting(containerEl).setName('Task: Summarise as Mermaid diagram').setHeading();

        new Setting(containerEl)
            .setName('Customise Mermaid summary save path')
            .setDesc('On: Save Mermaid summary files to a specified path. Off: Save in the same folder as the original file.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomSummarizeToMermaidSavePath)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomSummarizeToMermaidSavePath = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useCustomSummarizeToMermaidSavePath) {
            new Setting(containerEl)
                .setName('Mermaid summary save path')
                .setDesc('The folder where Mermaid summary files will be saved (relative to vault root).')
                .addText(text => text
                    .setPlaceholder('e.g., Summaries/Mermaid')
                    .setValue(this.plugin.settings.summarizeToMermaidSavePath)
                    .onChange(async (value) => {
                        this.plugin.settings.summarizeToMermaidSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Use custom suffix for Mermaid summary files')
            .setDesc('Enable to use a custom suffix instead of the default "_summ".')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomSummarizeToMermaidSuffix)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomSummarizeToMermaidSuffix = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useCustomSummarizeToMermaidSuffix) {
            new Setting(containerEl)
                .setName('Custom Suffix')
                .setDesc('The custom suffix to append to Mermaid summary filenames.')
                .addText(text => text
                    .setPlaceholder('_mermaid_summary')
                    .setValue(this.plugin.settings.summarizeToMermaidCustomSuffix)
                    .onChange(async (value) => {
                        this.plugin.settings.summarizeToMermaidCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Translate to corresponding language when summarising')
            .setDesc('If selected, the summary output will be translated into the user\'s selected translation language; if not selected, the default will be the original text language.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.translateSummarizeToMermaidOutput)
                .onChange(async (value) => {
                    this.plugin.settings.translateSummarizeToMermaidOutput = value;
                    await this.plugin.saveSettings();
                }));

        // --- Extract Concepts Task Settings ---
        new Setting(containerEl).setName('Task: Extract Concepts').setHeading();

        new Setting(containerEl)
            .setName('Create minimal concept notes')
            .setDesc('On: Newly created concept notes will only contain the title. Off: They may include other content like backlinks.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractConceptsMinimalTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.extractConceptsMinimalTemplate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Add "Linked From" backlink')
            .setDesc('On: Add a backlink to the source document in the concept note. Off: Do not add backlinks during extraction.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractConceptsAddBacklink)
                .onChange(async (value) => {
                    this.plugin.settings.extractConceptsAddBacklink = value;
                    await this.plugin.saveSettings();
                }));

        // --- Stable API Call Settings ---
        new Setting(containerEl).setName('Stable API calls').setHeading();
        new Setting(containerEl)
            .setName('Enable stable API calls (retry logic)')
            .setDesc('On: Automatically retry failed LLM API calls. Off: Fail on first error.')
            .addToggle(toggle => toggle.setValue(this.plugin.settings.enableStableApiCall).onChange(async (value) => { this.plugin.settings.enableStableApiCall = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.enableStableApiCall) {
            new Setting(containerEl).setName('Retry interval (seconds)').setDesc('Wait time between retries.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallInterval)).setValue(String(this.plugin.settings.apiCallInterval)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 1 && num <= 300) { this.plugin.settings.apiCallInterval = num; } else { this.plugin.settings.apiCallInterval = DEFAULT_SETTINGS.apiCallInterval; } await this.plugin.saveSettings(); this.display(); }));
            new Setting(containerEl).setName('Maximum retries').setDesc('Max retry attempts.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallMaxRetries)).setValue(String(this.plugin.settings.apiCallMaxRetries)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 0 && num <= 10) { this.plugin.settings.apiCallMaxRetries = num; } else { this.plugin.settings.apiCallMaxRetries = DEFAULT_SETTINGS.apiCallMaxRetries; } await this.plugin.saveSettings(); this.display(); }));
        }

        // --- General Settings ---
        new Setting(containerEl).setName('Processed file output').setHeading();
        new Setting(containerEl).setName('Customize processed file save path').setDesc('On: Save to specified path. Off: Save in original folder.').addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomProcessedFileFolder).onChange(async (value) => { this.plugin.settings.useCustomProcessedFileFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomProcessedFileFolder) {
            new Setting(containerEl).setName('Processed file folder path').setDesc('Relative path within vault.').addText(text => text.setPlaceholder('e.g., Processed/Notes').setValue(this.plugin.settings.processedFileFolder).onChange(async (value) => { /* Add validation */ this.plugin.settings.processedFileFolder = value.trim(); await this.plugin.saveSettings(); }));
        }
        new Setting(containerEl).setName('Move original file after processing').setDesc('On: Move original to processed folder. Off: Create copy named "_processed.md".').addToggle(toggle => toggle.setValue(this.plugin.settings.moveOriginalFileOnProcess).onChange(async (value) => { this.plugin.settings.moveOriginalFileOnProcess = value; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName("Use custom output filename for 'Add links'").setDesc("On: Use custom suffix/replacement. Off: Use '_processed.md'.").addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomAddLinksSuffix).onChange(async (value) => { this.plugin.settings.useCustomAddLinksSuffix = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomAddLinksSuffix) {
            new Setting(containerEl).setName("Custom suffix/replacement string").setDesc("Empty to overwrite original. Ex: '_linked'.").addText(text => text.setPlaceholder("Leave empty to overwrite").setValue(this.plugin.settings.addLinksCustomSuffix).onChange(async (value) => { this.plugin.settings.addLinksCustomSuffix = value; await this.plugin.saveSettings(); }));
        }
        // Add the new toggle for removing code fences
        new Setting(containerEl)
            .setName("Remove code fences on 'Add links'")
            .setDesc("On: Remove all ```markdown and ``` fences from the final output of 'Process File' and 'Process Folder'. Off: Keep code fences.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.removeCodeFencesOnAddLinks)
                .onChange(async (value) => {
                    this.plugin.settings.removeCodeFencesOnAddLinks = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl).setName('Concept note output').setHeading();
        new Setting(containerEl).setName('Customize concept note path').setDesc('On: Create new concept notes in specified path. Off: Do not create automatically.').addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptNoteFolder).onChange(async (value) => { this.plugin.settings.useCustomConceptNoteFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomConceptNoteFolder) {
            new Setting(containerEl).setName('Concept note folder path').setDesc('Relative path within vault.').addText(text => text.setPlaceholder('e.g., Concepts').setValue(this.plugin.settings.conceptNoteFolder).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptNoteFolder = value.trim(); await this.plugin.saveSettings(); }));
        }

        new Setting(containerEl).setName('Concept log file output').setHeading();
        new Setting(containerEl).setName('Generate concept log file').setDesc('On: Log newly created concept notes.').addToggle(toggle => toggle.setValue(this.plugin.settings.generateConceptLogFile).onChange(async (value) => { this.plugin.settings.generateConceptLogFile = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.generateConceptLogFile) {
            const logFolderSetting = new Setting(containerEl).setName('Customize log file save path');
            let logFolderDesc = 'On: Save log to specified path.';
            if (this.plugin.settings.useCustomConceptNoteFolder && this.plugin.settings.conceptNoteFolder) { logFolderDesc += ` Off: Save in Concept Note Folder ('${this.plugin.settings.conceptNoteFolder}')`; } else { logFolderDesc += ' Off: Save in vault root.'; }
            logFolderSetting.setDesc(logFolderDesc);
            logFolderSetting.addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptLogFolder).onChange(async (value) => { this.plugin.settings.useCustomConceptLogFolder = value; await this.plugin.saveSettings(); this.display(); }));
            if (this.plugin.settings.useCustomConceptLogFolder) {
                new Setting(containerEl).setName('Concept log folder path').setDesc('Relative path. Required if custom path enabled.').addText(text => text.setPlaceholder('e.g., Logs/ConceptLogs').setValue(this.plugin.settings.conceptLogFolderPath).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptLogFolderPath = value.trim(); await this.plugin.saveSettings(); }));
            }
            const logFileNameSetting = new Setting(containerEl).setName('Customize log file name');
            logFileNameSetting.setDesc(`On: Use specified name. Off: Use "${DEFAULT_SETTINGS.conceptLogFileName}".`);
            logFileNameSetting.addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptLogFileName).onChange(async (value) => { this.plugin.settings.useCustomConceptLogFileName = value; await this.plugin.saveSettings(); this.display(); }));
            if (this.plugin.settings.useCustomConceptLogFileName) {
                new Setting(containerEl).setName('Concept log file name').setDesc('Name for the log file. Required if custom name enabled.').addText(text => text.setPlaceholder(DEFAULT_SETTINGS.conceptLogFileName).setValue(this.plugin.settings.conceptLogFileName).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptLogFileName = value.trim(); await this.plugin.saveSettings(); }));
            }
        }

        new Setting(containerEl).setName('Content generation & output').setHeading();
        new Setting(containerEl).setName('Enable research in "Generate from title"').setDesc('On: Perform web research before generating.').addToggle(toggle => toggle.setValue(this.plugin.settings.enableResearchInGenerateContent).onChange(async (value) => { this.plugin.settings.enableResearchInGenerateContent = value; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName("Use custom output folder for 'Generate from title'").setDesc("On: Move completed files to custom folder. Off: Move to '[original_foldername]_complete'.").addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomGenerateTitleOutputFolder).onChange(async (value) => { this.plugin.settings.useCustomGenerateTitleOutputFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomGenerateTitleOutputFolder) {
            new Setting(containerEl).setName("Custom output folder name").setDesc("Subfolder name for completed files.").addText(text => text.setPlaceholder(DEFAULT_SETTINGS.generateTitleOutputFolderName).setValue(this.plugin.settings.generateTitleOutputFolderName).onChange(async (value) => { /* Add validation */ this.plugin.settings.generateTitleOutputFolderName = value.trim() || DEFAULT_SETTINGS.generateTitleOutputFolderName; await this.plugin.saveSettings(); this.display(); }));
        }

        new Setting(containerEl).setName('Web research provider').setHeading();
        new Setting(containerEl).setName('Search provider').setDesc('Engine for "Research and Summarize".').addDropdown(dropdown => dropdown.addOption('tavily', 'Tavily (requires API key)').addOption('duckduckgo', 'DuckDuckGo (experimental)').setValue(this.plugin.settings.searchProvider).onChange(async (value: 'tavily' | 'duckduckgo') => { this.plugin.settings.searchProvider = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.searchProvider === 'tavily') {
            new Setting(containerEl).setName('Tavily API key').setDesc('Required for Tavily. Get from tavily.com.').addText(text => text.setPlaceholder('Enter Tavily API key (tvly-...)').setValue(this.plugin.settings.tavilyApiKey).onChange(async (value) => { this.plugin.settings.tavilyApiKey = value.trim(); await this.plugin.saveSettings(); }));
            new Setting(containerEl).setName('Tavily max results').setDesc('Max results (1-20).').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.tavilyMaxResults)).setValue(String(this.plugin.settings.tavilyMaxResults)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 1 && num <= 20) { this.plugin.settings.tavilyMaxResults = num; } else { this.plugin.settings.tavilyMaxResults = DEFAULT_SETTINGS.tavilyMaxResults; } await this.plugin.saveSettings(); this.display(); }));
            new Setting(containerEl).setName('Tavily search depth').setDesc('"advanced" uses more credits.').addDropdown(dropdown => dropdown.addOption('basic', 'Basic').addOption('advanced', 'Advanced (2 Credits)').setValue(this.plugin.settings.tavilySearchDepth).onChange(async (value: 'basic' | 'advanced') => { this.plugin.settings.tavilySearchDepth = value; await this.plugin.saveSettings(); }));
        } else if (this.plugin.settings.searchProvider === 'duckduckgo') {
            new Setting(containerEl).setName('DuckDuckGo max results').setDesc('Max results to parse.').addSlider(slider => slider.setLimits(1, 10, 1).setValue(this.plugin.settings.ddgMaxResults).setDynamicTooltip().onChange(async (value) => { this.plugin.settings.ddgMaxResults = value; await this.plugin.saveSettings(); }));
            new Setting(containerEl).setName('DuckDuckGo content fetch timeout (seconds)').setDesc('Max wait time per result URL.').addSlider(slider => slider.setLimits(5, 60, 5).setValue(this.plugin.settings.ddgFetchTimeout).setDynamicTooltip().onChange(async (value) => { this.plugin.settings.ddgFetchTimeout = value; await this.plugin.saveSettings(); }));
        }
        new Setting(containerEl).setName('Max research content tokens').setDesc('Approx. max tokens from web results for summarization prompt.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.maxResearchContentTokens)).setValue(String(this.plugin.settings.maxResearchContentTokens)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num > 100) { this.plugin.settings.maxResearchContentTokens = num; } else { this.plugin.settings.maxResearchContentTokens = DEFAULT_SETTINGS.maxResearchContentTokens; } await this.plugin.saveSettings(); this.display(); }));

        new Setting(containerEl).setName('Processing parameters').setHeading();
        new Setting(containerEl).setName('Chunk word count').setDesc('Max words per chunk sent to LLM.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.chunkWordCount)).setValue(String(this.plugin.settings.chunkWordCount)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num > 50) { this.plugin.settings.chunkWordCount = num; } else { this.plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount; } await this.plugin.saveSettings(); this.display(); }));
        new Setting(containerEl).setName('Enable duplicate detection').setDesc('Enable checks for duplicate terms (results in console).').addToggle(toggle => toggle.setValue(this.plugin.settings.enableDuplicateDetection).onChange(async (value) => { this.plugin.settings.enableDuplicateDetection = value; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Max tokens').setDesc('Max tokens LLM should generate per response.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.maxTokens)).setValue(String(this.plugin.settings.maxTokens)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num > 0) { this.plugin.settings.maxTokens = num; } else { this.plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens; } await this.plugin.saveSettings(); this.display(); }));


        new Setting(containerEl).setName('Language settings').setHeading();
        new Setting(containerEl)
            .setName('Output language')
            .setDesc('Select the desired output language for LLM responses.')
            .addDropdown(dropdown => {
                (this.plugin.settings.availableLanguages || DEFAULT_SETTINGS.availableLanguages).forEach(lang => {
                    dropdown.addOption(lang.code, lang.name);
                });
                dropdown
                    .setValue(this.plugin.settings.language || DEFAULT_SETTINGS.language)
                    .onChange(async (value) => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Select different languages for different tasks.')
            .setDesc('On: Select a specific language for each task below. Off: Use the single "Output language".')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useDifferentLanguagesForTasks)
                .onChange(async (value) => {
                    this.plugin.settings.useDifferentLanguagesForTasks = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useDifferentLanguagesForTasks) {
            const availableLanguages = this.plugin.settings.availableLanguages || DEFAULT_SETTINGS.availableLanguages;

            const createTaskLanguageSettings = (languageSettingName: keyof NotemdSettings, taskDesc: string) => {
                new Setting(containerEl)
                    .setName(`${taskDesc} language`)
                    .setDesc(`Select the output language for "${taskDesc}".`)
                    .addDropdown(dropdown => {
                        availableLanguages.forEach(lang => {
                            dropdown.addOption(lang.code, lang.name);
                        });
                        dropdown
                            .setValue(this.plugin.settings[languageSettingName] as string)
                            .onChange(async (value) => {
                                (this.plugin.settings as any)[languageSettingName] = value;
                                await this.plugin.saveSettings();
                            });
                    });
            };

            createTaskLanguageSettings('generateTitleLanguage', 'Generate from title');
            createTaskLanguageSettings('researchSummarizeLanguage', 'Research & summarize');
            createTaskLanguageSettings('addLinksLanguage', 'Add links (process file/folder)');
            createTaskLanguageSettings('summarizeToMermaidLanguage', 'Summarise as Mermaid diagram');
            createTaskLanguageSettings('extractConceptsLanguage', 'Extract Concepts');
        }

        // --- Duplicate Check Scope Settings (Refined) ---""
        new Setting(containerEl).setName('Duplicate check scope').setHeading();

        new Setting(containerEl)
            .setName('Duplicate check scope mode')
            .setDesc('Define the scope for finding duplicate counterparts.')
            .addDropdown(dropdown => dropdown
                .addOption('vault', 'Entire vault (default - compares concept notes to all other notes)')
                .addOption('include', 'Include specific folders only (compares concept notes to notes in specified folders)')
                .addOption('exclude', 'Exclude specific folders (compares concept notes to notes outside specified folders)')
                .addOption('concept_folder_only', 'Concept folder only (compares concept notes against each other)') // Added new option
                .setValue(this.plugin.settings.duplicateCheckScopeMode)
                .onChange(async (value: 'vault' | 'include' | 'exclude' | 'concept_folder_only') => { // Updated type
                    this.plugin.settings.duplicateCheckScopeMode = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the paths textarea
                }));

        // Show path input only if mode is 'include' or 'exclude' (not for 'vault' or 'concept_folder_only')
        if (this.plugin.settings.duplicateCheckScopeMode === 'include' || this.plugin.settings.duplicateCheckScopeMode === 'exclude') {
            new Setting(containerEl)
                .setName(this.plugin.settings.duplicateCheckScopeMode === 'include' ? 'Include folders' : 'Exclude folders')
                .setDesc(`Enter relative paths (one per line) for folders to ${this.plugin.settings.duplicateCheckScopeMode}. Required if mode is not 'Entire vault' or 'Concept folder only'. Paths are case-sensitive and use '/' as separator.`)
                .addTextArea(textarea => textarea
                    .setPlaceholder('e.g., Notes/ProjectA\nSource Material') // Updated placeholder
                    .setValue(this.plugin.settings.duplicateCheckScopePaths)
                    .onChange(async (value) => {
                        const paths = value.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                        let isValid = true;
                        const invalidChars = /[\\"<>\:\?#\^\[\]\|\s]/; // Added space to invalid chars, removed / as it's the separator

                        for (const path of paths) {
                            if (path.includes('\\')) {
                                new Notice(`Invalid path: "${path}". Use '/' as path separator, not '\\'.`, 7000);
                                isValid = false;
                                break;
                            }
                            if (invalidChars.test(path)) {
                                const offendingChar = path.match(invalidChars)?.[0];
                                new Notice(`Invalid character "${offendingChar}" in path: "${path}". Forbidden chars: space, \\, <, >, :, |, ?, #, ^, [, ]`, 7000);
                                isValid = false;
                                break;
                            }
                        }

                        if (!value.trim() && (this.plugin.settings.duplicateCheckScopeMode === 'include' || this.plugin.settings.duplicateCheckScopeMode === 'exclude')) {
                            new Notice("Folder paths cannot be empty when 'Include' or 'Exclude' mode is selected.", 5000);
                            // Do not save if critical validation fails
                            // isValid = false; // Or let it save but with a warning if desired
                        }

                        if (isValid) {
                            this.plugin.settings.duplicateCheckScopePaths = value; // Store raw value with newlines
                            await this.plugin.saveSettings();
                        } else {
                            // Optionally, you could revert the textarea to the last saved valid value
                            // For now, we'll just prevent saving the invalid input by not calling saveSettings
                            // or by explicitly setting it back if the UX demands it.
                            // textarea.setValue(this.plugin.settings.duplicateCheckScopePaths); // Revert to last saved
                            new Notice("Invalid path(s) detected. Settings not saved for this field.", 5000);
                        }
                    })
                    .inputEl.setAttrs({ rows: 4, style: 'width: 100%;' }) // Make textarea larger
                );
        }
        // --- End Duplicate Check Scope Settings ---

        // --- Custom Prompt Settings ---
        new Setting(containerEl).setName('Custom prompt settings').setHeading();

        new Setting(containerEl)
            .setName('Enable custom prompts for specific tasks')
            .setDesc('On: Allows you to override the default system prompts for selected tasks below. Off: Default prompts will always be used.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableGlobalCustomPrompts)
                .onChange(async (value) => {
                    this.plugin.settings.enableGlobalCustomPrompts = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide task-specific prompt settings
                }));

        if (this.plugin.settings.enableGlobalCustomPrompts) {
            const tasksToCustomize: Array<{
                key: TaskKey,
                name: string,
                useCustomSettingKey: keyof Pick<NotemdSettings, 'useCustomPromptForAddLinks' | 'useCustomPromptForGenerateTitle' | 'useCustomPromptForResearchSummarize' | 'useCustomPromptForSummarizeToMermaid' | 'useCustomPromptForExtractConcepts'>,
                customPromptSettingKey: keyof Pick<NotemdSettings, 'customPromptAddLinks' | 'customPromptGenerateTitle' | 'customPromptResearchSummarize' | 'customPromptSummarizeToMermaid' | 'customPromptExtractConcepts'>
            }> = [
                { key: 'addLinks', name: 'Add Links (Process File/Folder)', useCustomSettingKey: 'useCustomPromptForAddLinks', customPromptSettingKey: 'customPromptAddLinks' },
                { key: 'generateTitle', name: 'Generate from Title', useCustomSettingKey: 'useCustomPromptForGenerateTitle', customPromptSettingKey: 'customPromptGenerateTitle' },
                { key: 'researchSummarize', name: 'Research & Summarize', useCustomSettingKey: 'useCustomPromptForResearchSummarize', customPromptSettingKey: 'customPromptResearchSummarize' },
                { key: 'summarizeToMermaid', name: 'Summarise as Mermaid diagram', useCustomSettingKey: 'useCustomPromptForSummarizeToMermaid', customPromptSettingKey: 'customPromptSummarizeToMermaid' },
                { key: 'extractConcepts', name: 'Extract Concepts', useCustomSettingKey: 'useCustomPromptForExtractConcepts', customPromptSettingKey: 'customPromptExtractConcepts' },
            ];

            tasksToCustomize.forEach(task => {
                new Setting(containerEl)
                    .setName(`Use custom prompt for "${task.name}"`)
                    .setDesc(`On: Use your custom prompt below for this task. Off: Use the default prompt.`)
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings[task.useCustomSettingKey])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[task.useCustomSettingKey] = value;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh to show/hide custom prompt area
                        }));

                if (this.plugin.settings[task.useCustomSettingKey]) {
                    

                    const defaultPromptDisplay = containerEl.createDiv();
                    defaultPromptDisplay.createEl('p', { text: `Default prompt for "${task.name}":` });
                    const defaultPromptText = getDefaultPrompt(task.key);
                    const defaultPromptArea = new TextAreaComponent(defaultPromptDisplay)
                        .setValue(defaultPromptText)
                        .setDisabled(true)
                        .inputEl.setAttrs({ rows: 5, style: 'width: 100%; font-family: monospace; font-size: 0.9em; margin-bottom: 5px;' });

                    const copyButton = defaultPromptDisplay.createEl('button', { text: 'Copy Default Prompt' });
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(defaultPromptText);
                        new Notice('Default prompt copied to clipboard!');
                    };
                    defaultPromptDisplay.style.marginBottom = "10px";


                    new Setting(containerEl)
                        .setName(`Custom prompt for "${task.name}"`)
                        .setDesc('Enter your custom prompt. Placeholders like {TITLE} or {RESEARCH_CONTEXT_SECTION} will be replaced if applicable for the task. Refer to the default prompt for available placeholders.')
                        .addTextArea(textarea => textarea
                            .setPlaceholder(`Enter your custom prompt for ${task.name}...`)
                            .setValue(this.plugin.settings[task.customPromptSettingKey])
                            .onChange(async (value) => {
                                (this.plugin.settings as any)[task.customPromptSettingKey] = value;
                                await this.plugin.saveSettings();
                            })
                            .inputEl.setAttrs({ rows: 10, style: 'width: 100%;' })
                        );
                }
            });
        }
        // --- End Custom Prompt Settings ---

        // --- Focused Learning Domain Settings ---
        new Setting(containerEl).setName('Focused learning domain').setHeading();

        new Setting(containerEl)
            .setName('Enable focused learning domain')
            .setDesc('On: Add a specific learning domain to your prompts to improve contextual understanding. Off: Use the default general prompt.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableFocusedLearning)
                .onChange(async (value) => {
                    this.plugin.settings.enableFocusedLearning = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the domain input
                }));

        if (this.plugin.settings.enableFocusedLearning) {
            new Setting(containerEl)
                .setName('Learning domain')
                .setDesc("Specify one or more fields, e.g., 'Materials Science', 'Polymer Physics', 'Machine Learning'. This will be added to the beginning of your prompts.")
                .addText(text => text
                    .setPlaceholder("e.g., 'Materials Science', 'Polymer Physics'")
                    .setValue(this.plugin.settings.focusedLearningDomain)
                    .onChange(async (value) => {
                        this.plugin.settings.focusedLearningDomain = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
