import { App, ButtonComponent, PluginSettingTab, Setting, Notice, TextAreaComponent } from 'obsidian';
import NotemdPlugin from '../main'; // Import the plugin class itself
import { LLMProviderConfig, NotemdSettings, TaskKey } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import {
    getLLMProviderDefinition,
    getOrderedProviderNames,
    getProviderValidationIssues,
    hasBlockingProviderValidationIssues
} from '../llmProviders';
import { testAPI } from '../llmUtils'; // Import testAPI
import { getDefaultPrompt } from '../promptUtils'; // Import for default prompts
import {
    buildProviderDiagnosticFileName,
    getProviderDiagnosticCallModeOptions,
    ProviderDiagnosticCallMode,
    runProviderDiagnosticProbe,
    runProviderDiagnosticStabilityProbe
} from '../providerDiagnostics';
import {
    createEmptyWorkflowButton,
    CustomWorkflowButton,
    getSidebarActionLabel,
    getWorkflowActionHelpText,
    resolveCustomWorkflowButtons,
    serializeCustomWorkflowButtons,
    SIDEBAR_ACTION_DEFINITIONS,
    SidebarActionId
} from '../workflowButtons';
import { UI_LOCALE_AUTO } from '../i18n/languageContext';
import { SUPPORTED_UI_LOCALES } from '../i18n/uiLocales';
import { formatI18n, getI18nStrings } from '../i18n';

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

    private async saveProviderDiagnosticReport(providerName: string, reportContent: string): Promise<string> {
        const baseFileName = buildProviderDiagnosticFileName(providerName, new Date());
        const fileSuffix = '.txt';
        const fileStem = baseFileName.endsWith(fileSuffix)
            ? baseFileName.slice(0, -fileSuffix.length)
            : baseFileName;

        let candidatePath = baseFileName;
        let index = 1;

        while (await this.app.vault.adapter.exists(candidatePath)) {
            candidatePath = `${fileStem}_${index}${fileSuffix}`;
            index += 1;
        }

        await this.app.vault.create(candidatePath, reportContent);
        return candidatePath;
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

    private async runDeveloperProviderDiagnostic(
        provider: LLMProviderConfig,
        buttonControl: ButtonComponent,
        callMode: ProviderDiagnosticCallMode
    ): Promise<void> {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        const blockingIssues = getProviderValidationIssues(provider, this.plugin.settings.maxTokens)
            .filter(issue => issue.level === 'error')
            .map(issue => issue.message);

        if (blockingIssues.length > 0) {
            new Notice(formatI18n(i18n.settings.developer.diagnosticBlocked, {
                provider: provider.name,
                issues: blockingIssues.join(' ')
            }), 10000);
            return;
        }

        buttonControl.setDisabled(true).setButtonText(i18n.settings.developer.runDiagnostic);
        const runningNotice = new Notice(formatI18n(i18n.settings.developer.diagnosticRunning, {
            provider: provider.name
        }), 0);
        const timeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(this.plugin.settings.developerDiagnosticTimeoutMs);

        try {
            const result = await runProviderDiagnosticProbe(provider, this.plugin.settings, {
                callMode,
                timeoutMs
            });
            const reportPath = await this.saveProviderDiagnosticReport(provider.name, result.report);
            runningNotice.hide();

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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            runningNotice.hide();
            new Notice(formatI18n(i18n.settings.developer.diagnosticFailedBeforeReport, { message }), 12000);
            console.error('Developer provider diagnostic failed:', error);
        } finally {
            buttonControl.setDisabled(false).setButtonText(i18n.settings.developer.runDiagnostic);
        }
    }

    private async runDeveloperProviderStabilityDiagnostic(
        provider: LLMProviderConfig,
        buttonControl: ButtonComponent,
        callMode: ProviderDiagnosticCallMode
    ): Promise<void> {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        const blockingIssues = getProviderValidationIssues(provider, this.plugin.settings.maxTokens)
            .filter(issue => issue.level === 'error')
            .map(issue => issue.message);

        if (blockingIssues.length > 0) {
            new Notice(formatI18n(i18n.settings.developer.stabilityBlocked, {
                provider: provider.name,
                issues: blockingIssues.join(' ')
            }), 10000);
            return;
        }

        const runs = this.sanitizeDeveloperDiagnosticRuns(this.plugin.settings.developerDiagnosticStabilityRuns);
        const timeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(this.plugin.settings.developerDiagnosticTimeoutMs);
        buttonControl.setDisabled(true).setButtonText(i18n.settings.developer.runStability);
        const runningNotice = new Notice(
            formatI18n(i18n.settings.developer.stabilityRunning, {
                provider: provider.name,
                runs
            }),
            0
        );

        try {
            const result = await runProviderDiagnosticStabilityProbe(provider, this.plugin.settings, {
                callMode,
                timeoutMs,
                runs
            });
            const reportPath = await this.saveProviderDiagnosticReport(`${provider.name}_stability`, result.report);
            runningNotice.hide();
            new Notice(
                formatI18n(i18n.settings.developer.stabilityFinished, {
                    callMode: result.callMode,
                    successCount: result.successCount,
                    runs: result.runs,
                    path: reportPath
                }),
                12000
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            runningNotice.hide();
            new Notice(formatI18n(i18n.settings.developer.stabilityFailedBeforeReport, { message }), 12000);
            console.error('Developer provider stability diagnostic failed:', error);
        } finally {
            buttonControl.setDisabled(false).setButtonText(i18n.settings.developer.runStability);
        }
    }

    private renderProviderSummary(containerEl: HTMLElement, provider: LLMProviderConfig): void {
        const definition = getLLMProviderDefinition(provider.name);
        if (!definition) {
            return;
        }

        const providerConfigI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const callout = containerEl.createDiv({ cls: 'notemd-provider-callout' });
        const badgeRow = callout.createDiv({ cls: 'notemd-provider-badge-row' });
        const categoryLabel = (() => {
            switch (definition.category) {
                case 'cloud':
                    return providerConfigI18n.categoryCloud;
                case 'gateway':
                    return providerConfigI18n.categoryGateway;
                case 'local':
                    return providerConfigI18n.categoryLocal;
                default:
                    return providerConfigI18n.categoryOther;
            }
        })();

        badgeRow.createEl('span', {
            text: categoryLabel,
            cls: 'notemd-provider-badge'
        });

        callout.createEl('strong', {
            text: formatI18n(providerConfigI18n.presetSummaryTitle, { provider: definition.name })
        });
        callout.createEl('p', {
            text: formatI18n(providerConfigI18n.presetSummaryHint, {
                baseUrl: definition.defaultConfig.baseUrl,
                model: definition.defaultConfig.model
            })
        });
    }

    private renderProviderValidation(containerEl: HTMLElement, provider: LLMProviderConfig): void {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        const issues = getProviderValidationIssues(provider, this.plugin.settings.maxTokens);
        if (issues.length === 0) {
            return;
        }

        issues.forEach(issue => {
            const callout = containerEl.createDiv({
                cls: `notemd-provider-validation notemd-provider-validation-${issue.level}`
            });
            callout.createEl('strong', {
                text: issue.level === 'error'
                    ? i18n.settings.providerConfig.validationRequired
                    : i18n.settings.providerConfig.validationWarning
            });
            callout.createEl('p', { text: issue.message });
        });
    }

    private getWorkflowBuilderStateFromSettings(): CustomWorkflowButton[] {
        const resolved = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        if (resolved.buttons.length > 0) {
            return resolved.buttons.map((button, index) => ({
                id: button.id || `workflow-${index + 1}`,
                name: button.name,
                actions: [...button.actions]
            }));
        }
        return [createEmptyWorkflowButton(1)];
    }

    private async persistWorkflowBuilderState(
        workflows: CustomWorkflowButton[],
        options?: { refresh?: boolean; notice?: string }
    ): Promise<void> {
        const normalized = workflows
            .map((workflow, index) => ({
                id: workflow.id || `workflow-${index + 1}`,
                name: workflow.name.trim(),
                actions: workflow.actions.filter(Boolean) as SidebarActionId[]
            }))
            .filter(workflow => workflow.name && workflow.actions.length > 0);

        const finalState = normalized.length > 0 ? normalized : [createEmptyWorkflowButton(1)];
        this.plugin.settings.customWorkflowButtonsDsl = serializeCustomWorkflowButtons(finalState);
        await this.plugin.saveSettings();

        if (options?.notice) {
            new Notice(options.notice);
        }
        if (options?.refresh !== false) {
            this.display();
        }
    }

    private renderWorkflowVisualBuilder(containerEl: HTMLElement): void {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        const workflowI18n = i18n.settings.workflowBuilder;
        const resolution = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        const workflows = this.getWorkflowBuilderStateFromSettings();
        const builderWrap = containerEl.createDiv({ cls: 'notemd-workflow-builder' });

        if (resolution.errors.length > 0) {
            builderWrap.createDiv({
                text: formatI18n(workflowI18n.builderDslWarning, { count: resolution.errors.length }),
                cls: 'notemd-workflow-builder-warning'
            });
        }

        workflows.forEach((workflow, workflowIndex) => {
            const card = builderWrap.createDiv({ cls: 'notemd-workflow-card' });
            const cardHeader = card.createDiv({ cls: 'notemd-workflow-card-header' });
            cardHeader.createEl('strong', {
                text: formatI18n(workflowI18n.builderCardTitle, { index: workflowIndex + 1 })
            });
            const deleteBtn = cardHeader.createEl('button', { text: workflowI18n.deleteButton, cls: 'mod-warning' });
            deleteBtn.onclick = async () => {
                const next = workflows.filter((_, i) => i !== workflowIndex);
                await this.persistWorkflowBuilderState(next, {
                    notice: workflowI18n.workflowRemovedNotice
                });
            };

            const nameRow = card.createDiv({ cls: 'notemd-workflow-row' });
            nameRow.createEl('label', { text: workflowI18n.buttonNameLabel });
            const nameInput = nameRow.createEl('input', { type: 'text' });
            nameInput.value = workflow.name;
            nameInput.placeholder = formatI18n(workflowI18n.buttonNamePlaceholder, { index: workflowIndex + 1 });
            nameInput.onblur = async () => {
                const next = workflows.map((item, i) => i === workflowIndex ? { ...item, name: nameInput.value.trim() || item.name } : item);
                await this.persistWorkflowBuilderState(next);
            };

            const actionsTitle = card.createEl('p', { text: workflowI18n.actionSequenceTitle, cls: 'notemd-workflow-subtitle' });
            actionsTitle.setAttr('aria-hidden', 'true');

            workflow.actions.forEach((actionId, actionIndex) => {
                const actionRow = card.createDiv({ cls: 'notemd-workflow-action-row' });

                const select = actionRow.createEl('select');
                SIDEBAR_ACTION_DEFINITIONS.forEach(def => {
                    const option = new Option(`${getSidebarActionLabel(i18n, def.id)} (${def.id})`, def.id);
                    select.add(option);
                });
                select.value = actionId;
                select.onchange = async () => {
                    const selected = select.value as SidebarActionId;
                    const next = workflows.map((item, i) => {
                        if (i !== workflowIndex) return item;
                        const actions = [...item.actions];
                        actions[actionIndex] = selected;
                        return { ...item, actions };
                    });
                    await this.persistWorkflowBuilderState(next);
                };

                const moveUp = actionRow.createEl('button', { text: workflowI18n.moveUp });
                moveUp.disabled = actionIndex === 0;
                moveUp.onclick = async () => {
                    const next = workflows.map((item, i) => {
                        if (i !== workflowIndex) return item;
                        const actions = [...item.actions];
                        const temp = actions[actionIndex - 1];
                        actions[actionIndex - 1] = actions[actionIndex];
                        actions[actionIndex] = temp;
                        return { ...item, actions };
                    });
                    await this.persistWorkflowBuilderState(next);
                };

                const moveDown = actionRow.createEl('button', { text: workflowI18n.moveDown });
                moveDown.disabled = actionIndex === workflow.actions.length - 1;
                moveDown.onclick = async () => {
                    const next = workflows.map((item, i) => {
                        if (i !== workflowIndex) return item;
                        const actions = [...item.actions];
                        const temp = actions[actionIndex + 1];
                        actions[actionIndex + 1] = actions[actionIndex];
                        actions[actionIndex] = temp;
                        return { ...item, actions };
                    });
                    await this.persistWorkflowBuilderState(next);
                };

                const removeAction = actionRow.createEl('button', { text: workflowI18n.removeAction });
                removeAction.disabled = workflow.actions.length <= 1;
                removeAction.onclick = async () => {
                    const next = workflows.map((item, i) => {
                        if (i !== workflowIndex) return item;
                        const actions = item.actions.filter((_, idx) => idx !== actionIndex);
                        return { ...item, actions };
                    });
                    await this.persistWorkflowBuilderState(next);
                };
            });

            const addActionButton = card.createEl('button', { text: workflowI18n.addAction });
            addActionButton.onclick = async () => {
                const next = workflows.map((item, i) => {
                    if (i !== workflowIndex) return item;
                    return { ...item, actions: [...item.actions, 'batch-mermaid-fix' as SidebarActionId] };
                });
                await this.persistWorkflowBuilderState(next);
            };
        });

        const toolbar = builderWrap.createDiv({ cls: 'notemd-workflow-builder-toolbar' });
        const addWorkflowButton = toolbar.createEl('button', { text: workflowI18n.addWorkflow, cls: 'mod-cta' });
        addWorkflowButton.onclick = async () => {
            const next = [...workflows, createEmptyWorkflowButton(workflows.length + 1)];
            await this.persistWorkflowBuilderState(next, { notice: workflowI18n.workflowAddedNotice });
        };

        const resetWorkflowButton = toolbar.createEl('button', { text: workflowI18n.resetDefault });
        resetWorkflowButton.onclick = async () => {
            this.plugin.settings.customWorkflowButtonsDsl = DEFAULT_SETTINGS.customWorkflowButtonsDsl;
            await this.plugin.saveSettings();
            this.display();
            new Notice(workflowI18n.resetDefaultNotice);
        };
    }

    async exportProviderSettings(): Promise<void> {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
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
                const message = mkdirError instanceof Error ? mkdirError.message : String(mkdirError);
                new Notice(formatI18n(i18n.settings.providerConfig.exportDirectoryError, { message }));
                return;
            }

            await this.app.vault.adapter.write(this.providersFilePath, jsonData);
            new Notice(formatI18n(i18n.settings.providerConfig.exportSuccess, { path: this.providersFilePath }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error exporting provider settings:", error);
            new Notice(formatI18n(i18n.settings.providerConfig.exportError, { message }));
        }
    }

    async importProviderSettings(): Promise<void> {
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        try {
            const filePath = this.providersFilePath;
            const fileExists = await this.app.vault.adapter.exists(filePath);

            if (!fileExists) {
                new Notice(formatI18n(i18n.settings.providerConfig.importFileMissing, { path: filePath }));
                return;
            }

            const jsonData = await this.app.vault.adapter.read(filePath);
            const importedProviders = JSON.parse(jsonData) as LLMProviderConfig[];

            if (!Array.isArray(importedProviders)) {
                throw new Error(i18n.settings.providerConfig.importInvalidArray);
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
                new Notice(i18n.settings.providerConfig.activeProviderReset);
            }

            await this.plugin.saveSettings();
            new Notice(formatI18n(i18n.settings.providerConfig.importSuccess, {
                newCount,
                updatedCount: importedCount
            }));
            this.display(); // Refresh display

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error importing provider settings:", error);
            new Notice(formatI18n(i18n.settings.providerConfig.importError, { message }));
        }
    }


    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        const i18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
        const providerI18n = i18n.settings.providerConfig;
        const multiModelI18n = i18n.settings.multiModel;
        const translationTaskI18n = i18n.settings.translationTask;
        const mermaidTaskI18n = i18n.settings.mermaidTask;
        const extractConceptsTaskI18n = i18n.settings.extractConceptsTask;
        const stableApiI18n = i18n.settings.stableApi;
        const workflowBuilderI18n = i18n.settings.workflowBuilder;
        const generalOutputI18n = i18n.settings.generalOutput;
        const contentGenerationI18n = i18n.settings.contentGeneration;
        const customPromptsI18n = i18n.settings.customPrompts;
        const generateFromTitleTaskLabel = getSidebarActionLabel(i18n, 'generate-from-title');
        const researchAndSummarizeTaskLabel = getSidebarActionLabel(i18n, 'research-and-summarize');
        const summarizeAsMermaidTaskLabel = getSidebarActionLabel(i18n, 'summarize-as-mermaid');
        const extractOriginalTextTaskLabel = getSidebarActionLabel(i18n, 'extract-original-text');

        // --- Sponsor Support ---
        if (i18n.settings.sponsor) {
            const sponsorHeading = containerEl.createEl('h2', { text: i18n.settings.sponsor.heading });
            sponsorHeading.style.marginTop = '0';
            containerEl.createEl('p', { text: i18n.settings.sponsor.desc, cls: 'setting-item-description' });

            const sponsorButtonRow = containerEl.createDiv({ cls: 'notemd-sponsor-buttons' });
            const githubBtn = sponsorButtonRow.createEl('button', {
                text: i18n.settings.sponsor.githubButton,
                cls: 'mod-cta'
            });
            githubBtn.addEventListener('click', () => {
                window.open('https://github.com/Jacobinwwey/obsidian-NotEMD', '_blank');
            });

            const coffeeBtn = sponsorButtonRow.createEl('button', {
                text: i18n.settings.sponsor.coffeeButton,
            });
            coffeeBtn.addEventListener('click', () => {
                window.open('https://ko-fi.com/jacobinwwey', '_blank');
            });

            containerEl.createEl('hr');
        }

        // --- Provider Configuration ---
        new Setting(containerEl).setName(providerI18n.heading).setHeading();
        const providerSupportCallout = containerEl.createDiv({ cls: 'notemd-provider-callout' });
        providerSupportCallout.createEl('strong', {
            text: formatI18n(providerI18n.summaryTitle, { count: this.plugin.settings.providers.length })
        });
        providerSupportCallout.createEl('p', {
            text: providerI18n.summaryDesc
        });

        const providerMgmtSetting = new Setting(containerEl)
            .setName(providerI18n.manageName)
            .setDesc(providerI18n.manageDesc);
        providerMgmtSetting.addButton(button => button
            .setButtonText(providerI18n.exportButton).setTooltip(providerI18n.exportTooltip).onClick(() => this.exportProviderSettings()));
        providerMgmtSetting.addButton(button => button
            .setButtonText(providerI18n.importButton).setTooltip(providerI18n.importTooltip).onClick(() => this.importProviderSettings()));

        new Setting(containerEl)
            .setName(providerI18n.activeProviderName)
            .setDesc(providerI18n.activeProviderDesc)
            .addDropdown(dropdown => {
                const providerNames = getOrderedProviderNames(this.plugin.settings.providers);
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
            new Setting(containerEl).setName(formatI18n(providerI18n.providerDetailsHeading, { provider: activeProvider.name })).setHeading();
            this.renderProviderSummary(containerEl, activeProvider);
            this.renderProviderValidation(containerEl, activeProvider);

            const providerDefinition = getLLMProviderDefinition(activeProvider.name);
            const apiKeyMode = providerDefinition?.apiKeyMode ?? 'required';
            const isOpenAICompatible = providerDefinition?.transport === 'openai-compatible';

            if (apiKeyMode !== 'none') {
                const apiKeyDescription = apiKeyMode === 'optional'
                    ? formatI18n(providerI18n.apiKeyDescOptional, { provider: activeProvider.name })
                    : formatI18n(providerI18n.apiKeyDescRequired, {
                        provider: activeProvider.name,
                        extra: activeProvider.name === 'LMStudio' ? providerI18n.apiKeyExtraLmStudio : ''
                    });
                new Setting(containerEl)
                    .setName(providerI18n.apiKeyName)
                    .setDesc(apiKeyDescription)
                    .addText(text => text
                        .setPlaceholder(activeProvider.name === 'LMStudio' ? providerI18n.apiKeyPlaceholderLmStudio : providerI18n.apiKeyPlaceholderDefault)
                        .setValue(activeProvider.apiKey)
                        .onChange(async (value) => { activeProvider.apiKey = value; await this.plugin.saveSettings(); }));
            }

            new Setting(containerEl)
                .setName(providerI18n.baseUrlName)
                .setDesc(formatI18n(providerI18n.baseUrlDesc, {
                    provider: activeProvider.name,
                    required: activeProvider.name === 'Azure OpenAI' ? providerI18n.baseUrlRequired : ''
                }))
                .addText(text => text
                    .setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.baseUrl || providerI18n.baseUrlPlaceholder)
                    .setValue(activeProvider.baseUrl)
                    .onChange(async (value) => { activeProvider.baseUrl = value; await this.plugin.saveSettings(); }));

            new Setting(containerEl)
                .setName(providerI18n.modelName)
                .setDesc(formatI18n(providerI18n.modelDesc, { provider: activeProvider.name }))
                .addText(text => text
                    .setPlaceholder(DEFAULT_SETTINGS.providers.find(p => p.name === activeProvider.name)?.model || providerI18n.modelPlaceholder)
                    .setValue(activeProvider.model)
                    .onChange(async (value) => { activeProvider.model = value; await this.plugin.saveSettings(); }));

            new Setting(containerEl)
                .setName(providerI18n.temperatureName)
                .setDesc(providerI18n.temperatureDesc)
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(activeProvider.temperature)
                    .onChange(async (value) => { activeProvider.temperature = value; await this.plugin.saveSettings(); })
                    .setDynamicTooltip());

            const showManualOutputTokenOverride =
                this.plugin.settings.enableDeveloperMode || activeProvider.maxOutputTokens !== undefined;

            if (showManualOutputTokenOverride) {
                new Setting(containerEl)
                    .setName(i18n.settings.processing.maxTokensName)
                    .setDesc(providerI18n.maxOutputTokensDesc)
                    .addText(text => text
                        .setPlaceholder(String(this.plugin.settings.maxTokens))
                        .setValue(activeProvider.maxOutputTokens !== undefined ? String(activeProvider.maxOutputTokens) : '')
                        .onChange(async (value) => {
                            const parsed = Number.parseInt(value.trim(), 10);
                            if (Number.isFinite(parsed) && parsed > 0) {
                                activeProvider.maxOutputTokens = parsed;
                            } else {
                                delete activeProvider.maxOutputTokens;
                            }
                            await this.plugin.saveSettings();
                        }));
            }

            if (isOpenAICompatible) {
                new Setting(containerEl)
                    .setName(providerI18n.topPName)
                    .setDesc(providerI18n.topPDesc)
                    .addText(text => text
                        .setPlaceholder(providerI18n.topPPlaceholder)
                        .setValue(activeProvider.topP !== undefined ? String(activeProvider.topP) : '')
                        .onChange(async (value) => {
                            const parsed = Number.parseFloat(value.trim());
                            if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
                                activeProvider.topP = parsed;
                            } else {
                                delete activeProvider.topP;
                            }
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName(providerI18n.reasoningEffortName)
                    .setDesc(providerI18n.reasoningEffortDesc)
                    .addText(text => text
                        .setPlaceholder(providerI18n.reasoningEffortPlaceholder)
                        .setValue(activeProvider.reasoningEffort || '')
                        .onChange(async (value) => {
                            const normalized = value.trim().toLowerCase();
                            if (['none', 'low', 'medium', 'high'].includes(normalized)) {
                                activeProvider.reasoningEffort = normalized;
                            } else {
                                delete activeProvider.reasoningEffort;
                            }
                            await this.plugin.saveSettings();
                        }));
            }

            if (activeProvider.name === 'DeepSeek') {
                new Setting(containerEl)
                    .setName(providerI18n.thinkingEnabledName)
                    .setDesc(providerI18n.thinkingEnabledDesc)
                    .addToggle(toggle => toggle
                        .setValue(activeProvider.thinkingEnabled === true)
                        .onChange(async (value) => {
                            activeProvider.thinkingEnabled = value;
                            await this.plugin.saveSettings();
                        }));
            }

            if (activeProvider.name === 'Azure OpenAI') {
                new Setting(containerEl)
                    .setName(providerI18n.apiVersionName)
                    .setDesc(providerI18n.apiVersionDesc)
                    .addText(text => text
                        .setPlaceholder(providerI18n.apiVersionPlaceholder)
                        .setValue(activeProvider.apiVersion || '')
                        .onChange(async (value) => { activeProvider.apiVersion = value; await this.plugin.saveSettings(); }));
            }

            new Setting(containerEl)
                .setName(formatI18n(providerI18n.testConnectionName, { provider: activeProvider.name }))
                .setDesc(providerI18n.testConnectionDesc)
                .addButton(button => button
                    .setButtonText(providerI18n.testConnectionButton).setCta()
                    .onClick(async () => {
                        const blockingIssues = getProviderValidationIssues(activeProvider, this.plugin.settings.maxTokens)
                            .filter(issue => issue.level === 'error')
                            .map(issue => issue.message);
                        if (hasBlockingProviderValidationIssues(activeProvider, this.plugin.settings.maxTokens)) {
                            new Notice(formatI18n(providerI18n.testConnectionBlocked, {
                                provider: activeProvider.name,
                                issues: blockingIssues.join(' ')
                            }), 8000);
                            return;
                        }
                        button.setDisabled(true).setButtonText(providerI18n.testConnectionTesting);
                        const testingNotice = new Notice(formatI18n(providerI18n.testConnectionRunning, { provider: activeProvider.name }), 0);
                        try {
                            const result = await testAPI(activeProvider, this.plugin.settings.enableApiErrorDebugMode); // Use imported testAPI
                            testingNotice.hide();
                            if (result.success) { new Notice(formatI18n(providerI18n.testConnectionSuccess, { message: result.message }), 5000); }
                            else { new Notice(formatI18n(providerI18n.testConnectionFailed, { message: result.message }), 10000); }
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            testingNotice.hide();
                            new Notice(formatI18n(providerI18n.testConnectionError, { message }), 10000);
                            console.error(`Error testing ${activeProvider.name} connection from settings:`, error);
                        } finally {
                            button.setDisabled(false).setButtonText(providerI18n.testConnectionButton);
                        }
                    }));
        } else {
            containerEl.createEl('p', { text: providerI18n.missingActiveProvider, cls: 'notemd-error-text' });
        }

        // --- Multi-Model Settings ---
        new Setting(containerEl).setName(multiModelI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(multiModelI18n.usePerTaskProvidersName)
                .setDesc(multiModelI18n.usePerTaskProvidersDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useMultiModelSettings)
                .onChange(async (value) => {
                    this.plugin.settings.useMultiModelSettings = value;
                    if (value) {
                        this.plugin.settings.addLinksProvider = this.plugin.settings.addLinksProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.researchProvider = this.plugin.settings.researchProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.generateTitleProvider = this.plugin.settings.generateTitleProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.translateProvider = this.plugin.settings.translateProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.summarizeToMermaidProvider = this.plugin.settings.summarizeToMermaidProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.extractConceptsProvider = this.plugin.settings.extractConceptsProvider || this.plugin.settings.activeProvider;
                        this.plugin.settings.extractOriginalTextProvider = this.plugin.settings.extractOriginalTextProvider || this.plugin.settings.activeProvider;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useMultiModelSettings) {
            const providerNames = getOrderedProviderNames(this.plugin.settings.providers);
            // Use the specific key types defined above
            const createTaskModelSettings = (providerSettingName: keyof NotemdSettings, modelSettingName: keyof NotemdSettings, taskDesc: string) => {
                const taskSetting = new Setting(containerEl)
                    .setName(formatI18n(multiModelI18n.taskProviderModelLabel, { task: taskDesc }))
                    .setDesc(formatI18n(multiModelI18n.taskProviderModelDesc, { task: taskDesc }));
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
                const defaultModel = selectedProvider ? selectedProvider.model : multiModelI18n.providerNotFound;
                    // Use the typed key
                    taskSetting.addText(text => text.setPlaceholder(formatI18n(multiModelI18n.taskModelPlaceholder, { model: defaultModel })).setValue(this.plugin.settings[modelSettingName] as string || '').onChange(async (value) => {
                        (this.plugin.settings as any)[modelSettingName] = value.trim() || undefined;
                        await this.plugin.saveSettings();
                    }));
            };
            createTaskModelSettings('addLinksProvider', 'addLinksModel', 'Add links (process file/folder)');
            createTaskModelSettings('researchProvider', 'researchModel', 'Research & summarize');
            createTaskModelSettings('generateTitleProvider', 'generateTitleModel', generateFromTitleTaskLabel);
            createTaskModelSettings('translateProvider', 'translateModel', 'Translate');
            createTaskModelSettings('summarizeToMermaidProvider', 'summarizeToMermaidModel', 'Summarise as Mermaid diagram');
            createTaskModelSettings('extractConceptsProvider', 'extractConceptsModel', 'Extract Concepts');
            createTaskModelSettings('extractOriginalTextProvider', 'extractOriginalTextModel', extractOriginalTextTaskLabel);
        }

        // --- Translate Task Settings ---
        new Setting(containerEl).setName(translationTaskI18n.heading).setHeading();

        // New setting: Toggle for custom translation save path
        new Setting(containerEl)
            .setName(translationTaskI18n.customSavePathName)
            .setDesc(translationTaskI18n.customSavePathDesc)
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
                .setName(translationTaskI18n.savePathName)
                .setDesc(translationTaskI18n.savePathDesc)
                .addText(text => text
                    .setPlaceholder(translationTaskI18n.savePathPlaceholder)
                    .setValue(this.plugin.settings.translationSavePath)
                    .onChange(async (value) => {
                        this.plugin.settings.translationSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName(translationTaskI18n.customSuffixToggleName)
            .setDesc(translationTaskI18n.customSuffixToggleDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomTranslationSuffix)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomTranslationSuffix = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the text input
                }));

        if (this.plugin.settings.useCustomTranslationSuffix) {
            new Setting(containerEl)
                .setName(translationTaskI18n.customSuffixName)
                .setDesc(translationTaskI18n.customSuffixDesc)
                .addText(text => text
                    .setPlaceholder(translationTaskI18n.customSuffixPlaceholder)
                    .setValue(this.plugin.settings.translationCustomSuffix)
                    .onChange(async (value) => {
                        this.plugin.settings.translationCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // --- Summarize to Mermaid Task Settings ---
        new Setting(containerEl).setName(mermaidTaskI18n.heading).setHeading();

        new Setting(containerEl)
            .setName(mermaidTaskI18n.customSavePathName)
            .setDesc(mermaidTaskI18n.customSavePathDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomSummarizeToMermaidSavePath)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomSummarizeToMermaidSavePath = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useCustomSummarizeToMermaidSavePath) {
            new Setting(containerEl)
                .setName(mermaidTaskI18n.savePathName)
                .setDesc(mermaidTaskI18n.savePathDesc)
                .addText(text => text
                    .setPlaceholder(mermaidTaskI18n.savePathPlaceholder)
                    .setValue(this.plugin.settings.summarizeToMermaidSavePath)
                    .onChange(async (value) => {
                        this.plugin.settings.summarizeToMermaidSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName(mermaidTaskI18n.customSuffixToggleName)
            .setDesc(mermaidTaskI18n.customSuffixToggleDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomSummarizeToMermaidSuffix)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomSummarizeToMermaidSuffix = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useCustomSummarizeToMermaidSuffix) {
            new Setting(containerEl)
                .setName(mermaidTaskI18n.customSuffixName)
                .setDesc(mermaidTaskI18n.customSuffixDesc)
                .addText(text => text
                    .setPlaceholder(mermaidTaskI18n.customSuffixPlaceholder)
                    .setValue(this.plugin.settings.summarizeToMermaidCustomSuffix)
                    .onChange(async (value) => {
                        this.plugin.settings.summarizeToMermaidCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName(mermaidTaskI18n.translateOutputName)
            .setDesc(mermaidTaskI18n.translateOutputDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.translateSummarizeToMermaidOutput)
                .onChange(async (value) => {
                    this.plugin.settings.translateSummarizeToMermaidOutput = value;
                    await this.plugin.saveSettings();
                }));

        // --- Extract Concepts Task Settings ---
        new Setting(containerEl).setName(extractConceptsTaskI18n.heading).setHeading();

        new Setting(containerEl)
            .setName(extractConceptsTaskI18n.minimalName)
            .setDesc(extractConceptsTaskI18n.minimalDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractConceptsMinimalTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.extractConceptsMinimalTemplate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(extractConceptsTaskI18n.backlinkName)
            .setDesc(extractConceptsTaskI18n.backlinkDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractConceptsAddBacklink)
                .onChange(async (value) => {
                    this.plugin.settings.extractConceptsAddBacklink = value;
                    await this.plugin.saveSettings();
                }));

        // --- Stable API Call Settings ---
        new Setting(containerEl).setName(stableApiI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(stableApiI18n.enableName)
            .setDesc(stableApiI18n.enableDesc)
            .addToggle(toggle => toggle.setValue(this.plugin.settings.enableStableApiCall).onChange(async (value) => { this.plugin.settings.enableStableApiCall = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.enableStableApiCall) {
            new Setting(containerEl).setName(stableApiI18n.retryIntervalName).setDesc(stableApiI18n.retryIntervalDesc).addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallInterval)).setValue(String(this.plugin.settings.apiCallInterval)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 1 && num <= 300) { this.plugin.settings.apiCallInterval = num; } else { this.plugin.settings.apiCallInterval = DEFAULT_SETTINGS.apiCallInterval; } await this.plugin.saveSettings(); this.display(); }));
            new Setting(containerEl).setName(stableApiI18n.maxRetriesName).setDesc(stableApiI18n.maxRetriesDesc).addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallMaxRetries)).setValue(String(this.plugin.settings.apiCallMaxRetries)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 0 && num <= 10) { this.plugin.settings.apiCallMaxRetries = num; } else { this.plugin.settings.apiCallMaxRetries = DEFAULT_SETTINGS.apiCallMaxRetries; } await this.plugin.saveSettings(); this.display(); }));
        }

        new Setting(containerEl)
            .setName(stableApiI18n.debugModeName)
            .setDesc(stableApiI18n.debugModeDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableApiErrorDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableApiErrorDebugMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(i18n.settings.developer.modeName)
            .setDesc(i18n.settings.developer.modeDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDeveloperMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableDeveloperMode = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.enableDeveloperMode && activeProvider) {
            new Setting(containerEl).setName(i18n.settings.developer.heading).setHeading();
            const experimentalDiagramI18n = i18n.settings.developer.experimentalDiagramPipeline;

            const diagnosticModeOptions = getProviderDiagnosticCallModeOptions(activeProvider);
            const modeSet = new Set(diagnosticModeOptions.map(option => option.value));
            let effectiveCallMode = this.plugin.settings.developerDiagnosticCallMode as ProviderDiagnosticCallMode;
            if (!modeSet.has(effectiveCallMode)) {
                effectiveCallMode = diagnosticModeOptions[0].value;
                this.plugin.settings.developerDiagnosticCallMode = effectiveCallMode;
            }

            new Setting(containerEl)
                .setName(stableApiI18n.diagnosticCallModeName)
                .setDesc(stableApiI18n.diagnosticCallModeDesc)
                .addDropdown(dropdown => {
                    diagnosticModeOptions.forEach(option => {
                        dropdown.addOption(option.value, option.label);
                    });
                    dropdown
                        .setValue(effectiveCallMode)
                        .onChange(async (value) => {
                            this.plugin.settings.developerDiagnosticCallMode = value;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            const selectedMode = diagnosticModeOptions.find(option => option.value === effectiveCallMode);
            if (selectedMode) {
                const modeHint = containerEl.createDiv({ cls: 'notemd-provider-callout' });
                modeHint.createEl('strong', { text: selectedMode.label });
                modeHint.createEl('p', { text: selectedMode.description });
            }

            new Setting(containerEl)
                .setName(stableApiI18n.diagnosticTimeoutName)
                .setDesc(stableApiI18n.diagnosticTimeoutDesc)
                .addText(text => text
                    .setPlaceholder(String(Math.floor(DEFAULT_SETTINGS.developerDiagnosticTimeoutMs / 1000)))
                    .setValue(String(Math.floor(this.sanitizeDeveloperDiagnosticTimeoutMs(this.plugin.settings.developerDiagnosticTimeoutMs) / 1000)))
                    .onChange(async (value) => {
                        const num = Number.parseInt(value, 10);
                        if (Number.isFinite(num)) {
                            this.plugin.settings.developerDiagnosticTimeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(num * 1000);
                        } else {
                            this.plugin.settings.developerDiagnosticTimeoutMs = DEFAULT_SETTINGS.developerDiagnosticTimeoutMs;
                        }
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(stableApiI18n.stabilityRunsName)
                .setDesc(stableApiI18n.stabilityRunsDesc)
                .addText(text => text
                    .setPlaceholder(String(DEFAULT_SETTINGS.developerDiagnosticStabilityRuns))
                    .setValue(String(this.sanitizeDeveloperDiagnosticRuns(this.plugin.settings.developerDiagnosticStabilityRuns)))
                    .onChange(async (value) => {
                        const num = Number.parseInt(value, 10);
                        if (Number.isFinite(num)) {
                            this.plugin.settings.developerDiagnosticStabilityRuns = this.sanitizeDeveloperDiagnosticRuns(num);
                        } else {
                            this.plugin.settings.developerDiagnosticStabilityRuns = DEFAULT_SETTINGS.developerDiagnosticStabilityRuns;
                        }
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl).setName(experimentalDiagramI18n.heading).setHeading();

            new Setting(containerEl)
                .setName(experimentalDiagramI18n.enableName)
                .setDesc(experimentalDiagramI18n.enableDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableExperimentalDiagramPipeline)
                    .onChange(async (value) => {
                        this.plugin.settings.enableExperimentalDiagramPipeline = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName(experimentalDiagramI18n.compatibilityName)
                .setDesc(experimentalDiagramI18n.compatibilityDesc)
                .addDropdown(dropdown => {
                    dropdown.addOption('legacy-mermaid', experimentalDiagramI18n.compatibilityLegacy);
                    dropdown.addOption('best-fit', experimentalDiagramI18n.compatibilityBestFit);

            new Setting(containerEl)
                .setName(experimentalDiagramI18n.intentName)
                .setDesc(experimentalDiagramI18n.intentDesc)
                .addDropdown(dropdown => {
                    dropdown.addOption('auto', experimentalDiagramI18n.intentAuto);
                    dropdown.addOption('mindmap', experimentalDiagramI18n.intentMindmap);
                    dropdown.addOption('flowchart', experimentalDiagramI18n.intentFlowchart);
                    dropdown.addOption('sequence', experimentalDiagramI18n.intentSequence);
                    dropdown.addOption('classDiagram', experimentalDiagramI18n.intentClassDiagram);
                    dropdown.addOption('erDiagram', experimentalDiagramI18n.intentErDiagram);
                    dropdown.addOption('stateDiagram', experimentalDiagramI18n.intentStateDiagram);
                    dropdown.addOption('canvasMap', experimentalDiagramI18n.intentCanvasMap);
                    dropdown.addOption('dataChart', experimentalDiagramI18n.intentDataChart);
                    dropdown
                        .setValue(this.plugin.settings.preferredDiagramIntent || 'auto')
                        .onChange(async (value: string) => {
                            this.plugin.settings.preferredDiagramIntent = value === 'auto' ? undefined : value;
                            await this.plugin.saveSettings();
                        });
                });
                    dropdown
                        .setValue(this.plugin.settings.experimentalDiagramCompatibilityMode)
                        .onChange(async (value: 'legacy-mermaid' | 'best-fit') => {
                            this.plugin.settings.experimentalDiagramCompatibilityMode = value;
                            await this.plugin.saveSettings();
                        });
                });

            new Setting(containerEl)
                .setName(stableApiI18n.longRequestName)
                .setDesc(stableApiI18n.longRequestDesc)
                .addButton(button => button
                    .setButtonText(i18n.settings.developer.runDiagnostic)
                    .onClick(async () => {
                        await this.runDeveloperProviderDiagnostic(activeProvider, button, effectiveCallMode);
                    }))
                .addButton(button => button
                    .setButtonText(i18n.settings.developer.runStability)
                    .onClick(async () => {
                        await this.runDeveloperProviderStabilityDiagnostic(activeProvider, button, effectiveCallMode);
                    }));
        }

        // --- General Settings ---
        new Setting(containerEl).setName(generalOutputI18n.processedHeading).setHeading();
        new Setting(containerEl).setName(generalOutputI18n.processedSavePathName).setDesc(generalOutputI18n.processedSavePathDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomProcessedFileFolder).onChange(async (value) => { this.plugin.settings.useCustomProcessedFileFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomProcessedFileFolder) {
            new Setting(containerEl).setName(generalOutputI18n.processedFolderPathName).setDesc(generalOutputI18n.processedFolderPathDesc).addText(text => text.setPlaceholder(generalOutputI18n.processedFolderPathPlaceholder).setValue(this.plugin.settings.processedFileFolder).onChange(async (value) => { /* Add validation */ this.plugin.settings.processedFileFolder = value.trim(); await this.plugin.saveSettings(); }));
        }
        new Setting(containerEl).setName(generalOutputI18n.moveOriginalName).setDesc(generalOutputI18n.moveOriginalDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.moveOriginalFileOnProcess).onChange(async (value) => { this.plugin.settings.moveOriginalFileOnProcess = value; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName(generalOutputI18n.customAddLinksFilenameName).setDesc(generalOutputI18n.customAddLinksFilenameDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomAddLinksSuffix).onChange(async (value) => { this.plugin.settings.useCustomAddLinksSuffix = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomAddLinksSuffix) {
            new Setting(containerEl).setName(generalOutputI18n.addLinksSuffixName).setDesc(generalOutputI18n.addLinksSuffixDesc).addText(text => text.setPlaceholder(generalOutputI18n.addLinksSuffixPlaceholder).setValue(this.plugin.settings.addLinksCustomSuffix).onChange(async (value) => { this.plugin.settings.addLinksCustomSuffix = value; await this.plugin.saveSettings(); }));
        }
        // Add the new toggle for removing code fences
        new Setting(containerEl)
            .setName(generalOutputI18n.removeCodeFencesName)
            .setDesc(generalOutputI18n.removeCodeFencesDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.removeCodeFencesOnAddLinks)
                .onChange(async (value) => {
                    this.plugin.settings.removeCodeFencesOnAddLinks = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl).setName(generalOutputI18n.conceptNoteHeading).setHeading();
        new Setting(containerEl).setName(generalOutputI18n.conceptNotePathName).setDesc(generalOutputI18n.conceptNotePathDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptNoteFolder).onChange(async (value) => { this.plugin.settings.useCustomConceptNoteFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomConceptNoteFolder) {
            new Setting(containerEl).setName(generalOutputI18n.conceptNoteFolderName).setDesc(generalOutputI18n.conceptNoteFolderDesc).addText(text => text.setPlaceholder(generalOutputI18n.conceptNoteFolderPlaceholder).setValue(this.plugin.settings.conceptNoteFolder).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptNoteFolder = value.trim(); await this.plugin.saveSettings(); }));
        }

        new Setting(containerEl).setName(generalOutputI18n.conceptLogHeading).setHeading();
        new Setting(containerEl).setName(generalOutputI18n.generateConceptLogName).setDesc(generalOutputI18n.generateConceptLogDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.generateConceptLogFile).onChange(async (value) => { this.plugin.settings.generateConceptLogFile = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.generateConceptLogFile) {
            const logFolderSetting = new Setting(containerEl).setName(generalOutputI18n.customLogPathName);
            const logFolderDesc = this.plugin.settings.useCustomConceptNoteFolder && this.plugin.settings.conceptNoteFolder
                ? formatI18n(generalOutputI18n.customLogPathDescWithConceptFolder, { folder: this.plugin.settings.conceptNoteFolder })
                : generalOutputI18n.customLogPathDescVault;
            logFolderSetting.setDesc(logFolderDesc);
            logFolderSetting.addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptLogFolder).onChange(async (value) => { this.plugin.settings.useCustomConceptLogFolder = value; await this.plugin.saveSettings(); this.display(); }));
            if (this.plugin.settings.useCustomConceptLogFolder) {
                new Setting(containerEl).setName(generalOutputI18n.conceptLogFolderName).setDesc(generalOutputI18n.conceptLogFolderDesc).addText(text => text.setPlaceholder(generalOutputI18n.conceptLogFolderPlaceholder).setValue(this.plugin.settings.conceptLogFolderPath).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptLogFolderPath = value.trim(); await this.plugin.saveSettings(); }));
            }
            const logFileNameSetting = new Setting(containerEl).setName(generalOutputI18n.customLogFileNameToggleName);
            logFileNameSetting.setDesc(formatI18n(generalOutputI18n.customLogFileNameToggleDesc, { defaultName: DEFAULT_SETTINGS.conceptLogFileName }));
            logFileNameSetting.addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptLogFileName).onChange(async (value) => { this.plugin.settings.useCustomConceptLogFileName = value; await this.plugin.saveSettings(); this.display(); }));
            if (this.plugin.settings.useCustomConceptLogFileName) {
                new Setting(containerEl).setName(generalOutputI18n.conceptLogFileNameName).setDesc(generalOutputI18n.conceptLogFileNameDesc).addText(text => text.setPlaceholder(DEFAULT_SETTINGS.conceptLogFileName).setValue(this.plugin.settings.conceptLogFileName).onChange(async (value) => { /* Add validation */ this.plugin.settings.conceptLogFileName = value.trim(); await this.plugin.saveSettings(); }));
            }
        }

        new Setting(containerEl).setName(contentGenerationI18n.heading).setHeading();
        new Setting(containerEl).setName(contentGenerationI18n.enableResearchName).setDesc(contentGenerationI18n.enableResearchDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.enableResearchInGenerateContent).onChange(async (value) => { this.plugin.settings.enableResearchInGenerateContent = value; await this.plugin.saveSettings(); }));
        
        new Setting(containerEl)
            .setName(contentGenerationI18n.autoMermaidFixName)
            .setDesc(contentGenerationI18n.autoMermaidFixDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoMermaidFixAfterGenerate)
                .onChange(async (value) => {
                    this.plugin.settings.autoMermaidFixAfterGenerate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl).setName(workflowBuilderI18n.heading).setHeading();

        new Setting(containerEl)
            .setName(workflowBuilderI18n.errorStrategyName)
            .setDesc(workflowBuilderI18n.errorStrategyDesc)
            .addDropdown(dropdown => dropdown
                .addOption('stop_on_error', workflowBuilderI18n.errorStrategyStop)
                .addOption('continue_on_error', workflowBuilderI18n.errorStrategyContinue)
                .setValue(this.plugin.settings.customWorkflowErrorStrategy)
                .onChange(async (value: 'stop_on_error' | 'continue_on_error') => {
                    this.plugin.settings.customWorkflowErrorStrategy = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(workflowBuilderI18n.visualBuilderName)
            .setDesc(workflowBuilderI18n.visualBuilderDesc);
        this.renderWorkflowVisualBuilder(containerEl);

        new Setting(containerEl)
            .setName(workflowBuilderI18n.advancedDslName)
            .setDesc(workflowBuilderI18n.advancedDslDesc)
            .addTextArea((text: TextAreaComponent) => {
                text
                    .setPlaceholder(DEFAULT_SETTINGS.customWorkflowButtonsDsl)
                    .setValue(this.plugin.settings.customWorkflowButtonsDsl)
                    .onChange(async (value) => {
                        this.plugin.settings.customWorkflowButtonsDsl = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.setAttrs({ rows: 5, style: 'width: 100%; font-family: var(--font-monospace);' });
            });

        const parsedWorkflowButtons = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        if (parsedWorkflowButtons.errors.length > 0) {
            new Setting(containerEl)
                .setName(workflowBuilderI18n.dslValidationName)
                .setDesc(formatI18n(workflowBuilderI18n.dslValidationDesc, { count: parsedWorkflowButtons.errors.length }));
        }

        new Setting(containerEl)
            .setName(workflowBuilderI18n.availableActionIdsName)
            .setDesc(getWorkflowActionHelpText(i18n));

        // --- Extract Original Text Settings ---
        new Setting(containerEl).setName(i18n.settings.extractOriginalText.heading).setHeading();
        new Setting(containerEl)
            .setName(i18n.settings.extractOriginalText.questionsName)
            .setDesc(i18n.settings.extractOriginalText.questionsDesc)
            .addTextArea(text => text
                .setPlaceholder(i18n.settings.extractOriginalText.questionsPlaceholder)
                .setValue(this.plugin.settings.extractQuestions)
                .onChange(async (value) => {
                    this.plugin.settings.extractQuestions = value;
                    await this.plugin.saveSettings();
                })
                .inputEl.setAttrs({ rows: 6, style: 'width: 100%;' }));

        new Setting(containerEl)
            .setName(i18n.settings.generateTitleOutput.useCustomFolderName)
            .setDesc(i18n.settings.generateTitleOutput.useCustomFolderDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomGenerateTitleOutputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomGenerateTitleOutputFolder = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));
        if (this.plugin.settings.useCustomGenerateTitleOutputFolder) {
            new Setting(containerEl)
                .setName(i18n.settings.generateTitleOutput.customFolderName)
                .setDesc(i18n.settings.generateTitleOutput.customFolderDesc)
                .addText(text => text
                    .setPlaceholder(DEFAULT_SETTINGS.generateTitleOutputFolderName)
                    .setValue(this.plugin.settings.generateTitleOutputFolderName)
                    .onChange(async (value) => {
                        this.plugin.settings.generateTitleOutputFolderName = value.trim() || DEFAULT_SETTINGS.generateTitleOutputFolderName;
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        }

        new Setting(containerEl).setName(i18n.settings.webResearch.heading).setHeading();
        new Setting(containerEl)
            .setName(i18n.settings.webResearch.searchProviderName)
            .setDesc(i18n.settings.webResearch.searchProviderDesc)
            .addDropdown(dropdown => dropdown
                .addOption('tavily', i18n.settings.webResearch.tavilyOption)
                .addOption('duckduckgo', i18n.settings.webResearch.duckduckgoOption)
                .setValue(this.plugin.settings.searchProvider)
                .onChange(async (value: 'tavily' | 'duckduckgo') => {
                    this.plugin.settings.searchProvider = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));
        if (this.plugin.settings.searchProvider === 'tavily') {
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.tavilyApiKeyName)
                .setDesc(i18n.settings.webResearch.tavilyApiKeyDesc)
                .addText(text => text
                    .setPlaceholder(i18n.settings.webResearch.tavilyApiKeyPlaceholder)
                    .setValue(this.plugin.settings.tavilyApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.tavilyApiKey = value.trim();
                        await this.plugin.saveSettings();
                    }));
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.tavilyMaxResultsName)
                .setDesc(i18n.settings.webResearch.tavilyMaxResultsDesc)
                .addText(text => text
                    .setPlaceholder(String(DEFAULT_SETTINGS.tavilyMaxResults))
                    .setValue(String(this.plugin.settings.tavilyMaxResults))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 1 && num <= 20) {
                            this.plugin.settings.tavilyMaxResults = num;
                        } else {
                            this.plugin.settings.tavilyMaxResults = DEFAULT_SETTINGS.tavilyMaxResults;
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.tavilySearchDepthName)
                .setDesc(i18n.settings.webResearch.tavilySearchDepthDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('basic', i18n.settings.webResearch.tavilySearchDepthBasic)
                    .addOption('advanced', i18n.settings.webResearch.tavilySearchDepthAdvanced)
                    .setValue(this.plugin.settings.tavilySearchDepth)
                    .onChange(async (value: 'basic' | 'advanced') => {
                        this.plugin.settings.tavilySearchDepth = value;
                        await this.plugin.saveSettings();
                    }));
        } else if (this.plugin.settings.searchProvider === 'duckduckgo') {
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.duckduckgoMaxResultsName)
                .setDesc(i18n.settings.webResearch.duckduckgoMaxResultsDesc)
                .addSlider(slider => slider
                    .setLimits(1, 10, 1)
                    .setValue(this.plugin.settings.ddgMaxResults)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.ddgMaxResults = value;
                        await this.plugin.saveSettings();
                    }));
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.duckduckgoFetchTimeoutName)
                .setDesc(i18n.settings.webResearch.duckduckgoFetchTimeoutDesc)
                .addSlider(slider => slider
                    .setLimits(5, 60, 5)
                    .setValue(this.plugin.settings.ddgFetchTimeout)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.ddgFetchTimeout = value;
                        await this.plugin.saveSettings();
                    }));
        }
        new Setting(containerEl)
            .setName(i18n.settings.webResearch.maxResearchTokensName)
            .setDesc(i18n.settings.webResearch.maxResearchTokensDesc)
            .addText(text => text
                .setPlaceholder(String(DEFAULT_SETTINGS.maxResearchContentTokens))
                .setValue(String(this.plugin.settings.maxResearchContentTokens))
                .onChange(async (value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 100) {
                        this.plugin.settings.maxResearchContentTokens = num;
                    } else {
                        this.plugin.settings.maxResearchContentTokens = DEFAULT_SETTINGS.maxResearchContentTokens;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        new Setting(containerEl).setName(i18n.settings.processing.heading).setHeading();

        new Setting(containerEl)
            .setName(i18n.settings.processing.chunkWordCountName)
            .setDesc(i18n.settings.processing.chunkWordCountDesc)
            .addText(text => text
                .setPlaceholder(String(DEFAULT_SETTINGS.chunkWordCount))
                .setValue(String(this.plugin.settings.chunkWordCount))
                .onChange(async (value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 50) {
                        this.plugin.settings.chunkWordCount = num;
                    } else {
                        this.plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));
        
        new Setting(containerEl)
            .setName(i18n.settings.processing.maxTokensName)
            .setDesc(i18n.settings.processing.maxTokensDesc)
            .addText(text => text
                .setPlaceholder(String(DEFAULT_SETTINGS.maxTokens))
                .setValue(String(this.plugin.settings.maxTokens))
                .onChange(async (value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.maxTokens = num;
                    } else {
                        this.plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // --- Batch execution ---
        new Setting(containerEl).setName(i18n.settings.batchProcessing.heading).setHeading();

        new Setting(containerEl)
            .setName(i18n.settings.batchProcessing.parallelismName)
            .setDesc(i18n.settings.batchProcessing.parallelismDesc)
            .addToggle(t => t
                .setValue(this.plugin.settings.enableBatchParallelism)
                .onChange(async (v) => {
                    this.plugin.settings.enableBatchParallelism = v;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.enableBatchParallelism) {
            new Setting(containerEl)
                .setName(i18n.settings.batchProcessing.concurrencyName)
                .setDesc(i18n.settings.batchProcessing.concurrencyDesc)
                .addSlider(s => s
                    .setLimits(1, 20, 1)
                    .setValue(this.plugin.settings.batchConcurrency)
                    .setDynamicTooltip()
                    .onChange(async (v) => {
                        this.plugin.settings.batchConcurrency = Math.floor(v);
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName(i18n.settings.processing.duplicateDetectionName)
            .setDesc(i18n.settings.processing.duplicateDetectionDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDuplicateDetection)
                .onChange(async (value) => {
                    this.plugin.settings.enableDuplicateDetection = value;
                    await this.plugin.saveSettings();
                }));


        new Setting(containerEl).setName(i18n.settings.language.heading).setHeading();
        new Setting(containerEl)
            .setName(i18n.settings.language.uiLocaleName)
            .setDesc(i18n.settings.language.uiLocaleDesc)
            .addDropdown(dropdown => {
                dropdown.addOption(UI_LOCALE_AUTO, i18n.settings.language.uiLocaleAuto);
                SUPPORTED_UI_LOCALES.forEach(locale => {
                    dropdown.addOption(locale.code, locale.name);
                });

                const currentUiLocale = this.plugin.settings.uiLocale || UI_LOCALE_AUTO;
                if (currentUiLocale !== UI_LOCALE_AUTO && !SUPPORTED_UI_LOCALES.some(locale => locale.code === currentUiLocale)) {
                    dropdown.addOption(currentUiLocale, currentUiLocale);
                }

                dropdown
                    .setValue(currentUiLocale)
                    .onChange(async (value) => {
                        this.plugin.settings.uiLocale = value;
                        await this.plugin.saveSettings();
                        await this.plugin.refreshLocalizedUi();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(i18n.settings.language.outputName)
            .setDesc(i18n.settings.language.outputDesc)
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
            .setName(i18n.settings.language.perTaskName)
            .setDesc(i18n.settings.language.perTaskDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useDifferentLanguagesForTasks)
                .onChange(async (value) => {
                    this.plugin.settings.useDifferentLanguagesForTasks = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        new Setting(containerEl)
            .setName(i18n.settings.language.disableAutoTranslationName)
            .setDesc(i18n.settings.language.disableAutoTranslationDesc)
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.disableAutoTranslation)
                    .onChange(async (value) => {
                        this.plugin.settings.disableAutoTranslation = value;
                        await this.plugin.saveSettings();
                    })
            );

        if (this.plugin.settings.useDifferentLanguagesForTasks) {
            const availableLanguages = this.plugin.settings.availableLanguages || DEFAULT_SETTINGS.availableLanguages;

            const createTaskLanguageSettings = (languageSettingName: keyof NotemdSettings, taskDesc: string) => {
                new Setting(containerEl)
                    .setName(formatI18n(i18n.settings.language.taskLanguageLabel, { task: taskDesc }))
                    .setDesc(formatI18n(i18n.settings.language.taskLanguageDesc, { task: taskDesc }))
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

            createTaskLanguageSettings('generateTitleLanguage', generateFromTitleTaskLabel);
            createTaskLanguageSettings('researchSummarizeLanguage', researchAndSummarizeTaskLabel);
            createTaskLanguageSettings('addLinksLanguage', 'Add links (process file/folder)');
            createTaskLanguageSettings('summarizeToMermaidLanguage', summarizeAsMermaidTaskLabel);
            createTaskLanguageSettings('extractConceptsLanguage', 'Extract Concepts');
            createTaskLanguageSettings('extractOriginalTextLanguage', extractOriginalTextTaskLabel);
        }

        new Setting(containerEl)
            .setName(i18n.settings.extractOriginalText.translateOutputName)
            .setDesc(i18n.settings.extractOriginalText.translateOutputDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.translateExtractOriginalTextOutput)
                .onChange(async (value) => {
                    this.plugin.settings.translateExtractOriginalTextOutput = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(i18n.settings.extractOriginalText.mergedQueryName)
            .setDesc(i18n.settings.extractOriginalText.mergedQueryDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractOriginalTextMergedMode)
                .onChange(async (value) => {
                    this.plugin.settings.extractOriginalTextMergedMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(i18n.settings.extractOriginalText.customOutputName)
            .setDesc(i18n.settings.extractOriginalText.customOutputDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extractOriginalTextUseCustomOutput)
                .onChange(async (value) => {
                    this.plugin.settings.extractOriginalTextUseCustomOutput = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide path/suffix inputs
                }));

        if (this.plugin.settings.extractOriginalTextUseCustomOutput) {
            new Setting(containerEl)
                .setName(i18n.settings.extractOriginalText.savePathName)
                .setDesc(i18n.settings.extractOriginalText.savePathDesc)
                .addText(text => text
                    .setPlaceholder(i18n.settings.extractOriginalText.savePathPlaceholder)
                    .setValue(this.plugin.settings.extractOriginalTextCustomPath)
                    .onChange(async (value) => {
                        this.plugin.settings.extractOriginalTextCustomPath = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(i18n.settings.extractOriginalText.customSuffixName)
                .setDesc(i18n.settings.extractOriginalText.customSuffixDesc)
                .addText(text => text
                    .setPlaceholder(i18n.settings.extractOriginalText.customSuffixPlaceholder)
                    .setValue(this.plugin.settings.extractOriginalTextCustomSuffix)
                    .onChange(async (value) => {
                        this.plugin.settings.extractOriginalTextCustomSuffix = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        // --- Mermaid Batch Fix ---
        new Setting(containerEl).setName(i18n.settings.batchMermaidFix.heading).setHeading();
        
        new Setting(containerEl)
            .setName(i18n.settings.batchMermaidFix.enableDetectionName)
            .setDesc(i18n.settings.batchMermaidFix.enableDetectionDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableMermaidErrorDetection)
                .onChange(async (value) => {
                    this.plugin.settings.enableMermaidErrorDetection = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide related settings if needed
                }));

        new Setting(containerEl)
            .setName(i18n.settings.batchMermaidFix.moveErrorFilesName)
            .setDesc(i18n.settings.batchMermaidFix.moveErrorFilesDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.moveMermaidErrorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.moveMermaidErrorFiles = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.moveMermaidErrorFiles) {
            new Setting(containerEl)
                .setName(i18n.settings.batchMermaidFix.errorFolderPathName)
                .setDesc(i18n.settings.batchMermaidFix.errorFolderPathDesc)
                .addText(text => text
                    .setPlaceholder(i18n.settings.batchMermaidFix.errorFolderPathPlaceholder)
                    .setValue(this.plugin.settings.mermaidErrorFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.mermaidErrorFolderPath = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        // --- Duplicate Check Scope ---
        new Setting(containerEl).setName(i18n.settings.duplicateScope.heading).setHeading();

        new Setting(containerEl)
            .setName(i18n.settings.duplicateScope.modeName)
            .setDesc(i18n.settings.duplicateScope.modeDesc)
            .addDropdown(dropdown => dropdown
                .addOption('vault', i18n.settings.duplicateScope.optionVault)
                .addOption('include', i18n.settings.duplicateScope.optionInclude)
                .addOption('exclude', i18n.settings.duplicateScope.optionExclude)
                .addOption('concept_folder_only', i18n.settings.duplicateScope.optionConceptFolderOnly)
                .setValue(this.plugin.settings.duplicateCheckScopeMode)
                .onChange(async (value: 'vault' | 'include' | 'exclude' | 'concept_folder_only') => {
                    this.plugin.settings.duplicateCheckScopeMode = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.duplicateCheckScopeMode === 'include' || this.plugin.settings.duplicateCheckScopeMode === 'exclude') {
            const scopeModeVerb = this.plugin.settings.duplicateCheckScopeMode === 'include'
                ? i18n.settings.duplicateScope.pathsModeInclude
                : i18n.settings.duplicateScope.pathsModeExclude;
            new Setting(containerEl)
                .setName(this.plugin.settings.duplicateCheckScopeMode === 'include'
                    ? i18n.settings.duplicateScope.includeFoldersName
                    : i18n.settings.duplicateScope.excludeFoldersName)
                .setDesc(formatI18n(i18n.settings.duplicateScope.pathsDesc, { mode: scopeModeVerb }))
                .addTextArea(textarea => textarea
                    .setPlaceholder(i18n.settings.duplicateScope.pathsPlaceholder)
                    .setValue(this.plugin.settings.duplicateCheckScopePaths)
                    .onChange(async (value) => {
                        const paths = value.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                        let isValid = true;
                        const invalidChars = /[\\"<>\:\?#\^\[\]\|\s]/;

                        for (const path of paths) {
                            if (path.includes('\\')) {
                                new Notice(formatI18n(i18n.settings.duplicateScope.invalidPathNotice, { path }), 7000);
                                isValid = false;
                                break;
                            }
                            if (invalidChars.test(path)) {
                                const offendingChar = path.match(invalidChars)?.[0];
                                new Notice(formatI18n(i18n.settings.duplicateScope.invalidCharacterNotice, {
                                    char: offendingChar ?? '',
                                    path
                                }), 7000);
                                isValid = false;
                                break;
                            }
                        }

                        if (!value.trim() && (this.plugin.settings.duplicateCheckScopeMode === 'include' || this.plugin.settings.duplicateCheckScopeMode === 'exclude')) {
                            new Notice(i18n.settings.duplicateScope.emptyPathsNotice, 5000);
                        }

                        if (isValid) {
                            this.plugin.settings.duplicateCheckScopePaths = value;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice(i18n.settings.duplicateScope.invalidPathsNotSaved, 5000);
                        }
                    })
                    .inputEl.setAttrs({ rows: 4, style: 'width: 100%;' })
                );
        }
        // --- End Duplicate Check Scope ---

        // --- Custom Prompt Settings ---
        new Setting(containerEl).setName(customPromptsI18n.heading).setHeading();

        new Setting(containerEl)
            .setName(customPromptsI18n.enableName)
            .setDesc(customPromptsI18n.enableDesc)
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
                useCustomSettingKey: keyof Pick<NotemdSettings, 'useCustomPromptForAddLinks' | 'useCustomPromptForGenerateTitle' | 'useCustomPromptForResearchSummarize' | 'useCustomPromptForSummarizeToMermaid' | 'useCustomPromptForExtractConcepts' | 'useCustomPromptForTranslate' | 'useCustomPromptForExtractOriginalText'>,
                customPromptSettingKey: keyof Pick<NotemdSettings, 'customPromptAddLinks' | 'customPromptGenerateTitle' | 'customPromptResearchSummarize' | 'customPromptSummarizeToMermaid' | 'customPromptExtractConcepts' | 'translatePrompt' | 'customPromptExtractOriginalText'>
            }> = [
                { key: 'addLinks', name: getSidebarActionLabel(i18n, 'process-current-add-links'), useCustomSettingKey: 'useCustomPromptForAddLinks', customPromptSettingKey: 'customPromptAddLinks' },
                { key: 'generateTitle', name: generateFromTitleTaskLabel, useCustomSettingKey: 'useCustomPromptForGenerateTitle', customPromptSettingKey: 'customPromptGenerateTitle' },
                { key: 'researchSummarize', name: researchAndSummarizeTaskLabel, useCustomSettingKey: 'useCustomPromptForResearchSummarize', customPromptSettingKey: 'customPromptResearchSummarize' },
                { key: 'summarizeToMermaid', name: summarizeAsMermaidTaskLabel, useCustomSettingKey: 'useCustomPromptForSummarizeToMermaid', customPromptSettingKey: 'customPromptSummarizeToMermaid' },
                { key: 'extractConcepts', name: getSidebarActionLabel(i18n, 'extract-concepts-current'), useCustomSettingKey: 'useCustomPromptForExtractConcepts', customPromptSettingKey: 'customPromptExtractConcepts' },
                { key: 'translate', name: getSidebarActionLabel(i18n, 'translate-current-file'), useCustomSettingKey: 'useCustomPromptForTranslate', customPromptSettingKey: 'translatePrompt' },
                { key: 'extractOriginalText', name: extractOriginalTextTaskLabel, useCustomSettingKey: 'useCustomPromptForExtractOriginalText', customPromptSettingKey: 'customPromptExtractOriginalText' },
            ];

            tasksToCustomize.forEach(task => {
                new Setting(containerEl)
                    .setName(formatI18n(customPromptsI18n.taskToggleName, { task: task.name }))
                    .setDesc(customPromptsI18n.taskToggleDesc)
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings[task.useCustomSettingKey])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[task.useCustomSettingKey] = value;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh to show/hide custom prompt area
                        }));

                if (this.plugin.settings[task.useCustomSettingKey]) {
                    const defaultPromptDisplay = containerEl.createDiv();
                    defaultPromptDisplay.createEl('p', {
                        text: formatI18n(customPromptsI18n.defaultPromptLabel, { task: task.name })
                    });
                    const defaultPromptText = getDefaultPrompt(task.key);
                    new TextAreaComponent(defaultPromptDisplay)
                        .setValue(defaultPromptText)
                        .setDisabled(true)
                        .inputEl.setAttrs({ rows: 5, style: 'width: 100%; font-family: monospace; font-size: 0.9em; margin-bottom: 5px;' });

                    const copyButton = defaultPromptDisplay.createEl('button', { text: customPromptsI18n.copyDefaultButton });
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(defaultPromptText);
                        new Notice(customPromptsI18n.copyDefaultNotice);
                    };
                    defaultPromptDisplay.style.marginBottom = "10px";


                    new Setting(containerEl)
                        .setName(formatI18n(customPromptsI18n.customPromptName, { task: task.name }))
                        .setDesc(customPromptsI18n.customPromptDesc)
                        .addTextArea(textarea => textarea
                            .setPlaceholder(formatI18n(customPromptsI18n.customPromptPlaceholder, { task: task.name }))
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

        // --- Focused Learning ---
        new Setting(containerEl).setName(i18n.settings.focusedLearning.heading).setHeading();

        new Setting(containerEl)
            .setName(i18n.settings.focusedLearning.enableName)
            .setDesc(i18n.settings.focusedLearning.enableDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableFocusedLearning)
                .onChange(async (value) => {
                    this.plugin.settings.enableFocusedLearning = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the domain input
                }));

        if (this.plugin.settings.enableFocusedLearning) {
            new Setting(containerEl)
                .setName(i18n.settings.focusedLearning.domainName)
                .setDesc(i18n.settings.focusedLearning.domainDesc)
                .addText(text => text
                    .setPlaceholder(i18n.settings.focusedLearning.domainPlaceholder)
                    .setValue(this.plugin.settings.focusedLearningDomain)
                    .onChange(async (value) => {
                        this.plugin.settings.focusedLearningDomain = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
