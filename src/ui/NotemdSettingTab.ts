import { App, ButtonComponent, PluginSettingTab, Setting, Notice, TextAreaComponent } from 'obsidian';
import NotemdPlugin from '../main'; // Import the plugin class itself
import {
    FolderTaskFileSelectionProfile,
    GlobalModelAwareMaxTokensTracking,
    LLMProviderConfig,
    NotemdSettings,
    ProviderDiscoveredModelMaxOutputTokensTracking,
    TaskKey
} from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import type { DiagramIntent, RenderTarget } from '../diagram/types';
import { applyDiagramIntentPreference } from '../diagram/diagramPreferenceCompatibility';
import { MAX_PREVIEW_EXPORT_PPI, MIN_PREVIEW_EXPORT_PPI } from '../rendering/preview/pngPreview';
import {
    getLLMProviderDefinition,
    getKnownModelMaxOutputTokens,
    getProviderDiscoveryIdentity,
    getProviderSettingFields,
    getOrderedProviderNames,
    getProviderValidationIssues,
    hasBlockingProviderValidationIssues,
    hasPersistedAdvancedProviderSettings,
    LLMProviderSettingFieldDefinition,
    resolveProviderModelDiscoveryDefinition,
    shouldShowProviderSettingField
} from '../llmProviders';
import { getDefaultPrompt } from '../promptUtils'; // Import for default prompts
import {
    getProviderDiagnosticCallModeOptions,
    ProviderDiagnosticCallMode
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
import { createLocalizedSettingIdResolver, retainKnownSettingIds } from './settings/settingCatalog';
import { SettingCatalogEntry } from './settings/settingSearch';
import { resolveSettingsNavigation } from './settings/SettingsNavigation';
import { runProviderConnectionTestWithHost } from '../operations/providerConnectionTestCommandHostAdapter';
import { getFolderTaskFileSelectionProfiles, getFolderTaskRegexValidationError } from '../folderTaskFileSelector';
import { DiscoveredProviderModel, discoverProviderModelsDetailed } from '../providerModelDiscovery';
import {
    SLIDEV_PPTX_EAST_ASIA_FONT_FACE_PRESETS,
    SLIDEV_PPTX_LATIN_FONT_FACE_PRESETS,
    SLIDEV_PPTX_MONOSPACE_FONT_FACE_PRESETS
} from '../slideExport/pptxFontContract';

// Define specific key types for settings accessed dynamically
type ProviderSettingKey = 'addLinksProvider' | 'researchProvider' | 'generateTitleProvider' | 'translateProvider';
type ModelSettingKey = 'addLinksModel' | 'researchModel' | 'generateTitleModel' | 'translateModel';
type SlideExportPptxFontSettingKey =
    | 'slideExportPptxLatinFontFace'
    | 'slideExportPptxEastAsiaFontFace'
    | 'slideExportPptxMonospaceFontFace';

type ProviderPanelState = {
    advancedSettingsExpanded?: boolean;
    discoveredModels: string[];
    discoveredModelEntries: DiscoveredProviderModel[];
    discoveredModelsExpanded: boolean;
    fetchStatus: 'idle' | 'loading' | 'success' | 'error';
    fetchMessage?: string;
    discoveryIdentity?: string;
    discoveryRequestNonce: number;
};


export class NotemdSettingTab extends PluginSettingTab {
    plugin: NotemdPlugin;
    private providerPanelState = new Map<string, ProviderPanelState>();

    private enhanceSettingsDiscovery(containerEl: HTMLElement): void {
        if (typeof containerEl.querySelectorAll !== 'function' || typeof containerEl.prepend !== 'function') {
            return;
        }
        const settingItems = Array.from(containerEl.querySelectorAll<HTMLElement>('.setting-item'));
        const resolveSettingId = createLocalizedSettingIdResolver(
            getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }) as unknown as Record<string, unknown>,
            getI18nStrings({ uiLocale: 'en' }) as unknown as Record<string, unknown>
        );
        const duplicateCounts = new Map<string, number>();
        let currentCategoryId = 'settings.general';
        const catalog = settingItems.map((item): SettingCatalogEntry => {
            const name = item.querySelector<HTMLElement>('.setting-item-name')?.textContent?.trim() ?? '';
            const description = item.querySelector<HTMLElement>('.setting-item-description')?.textContent?.trim() ?? '';
            const baseId = resolveSettingId(name, description);
            const occurrence = duplicateCounts.get(baseId) ?? 0;
            duplicateCounts.set(baseId, occurrence + 1);
            const id = occurrence === 0 ? baseId : `${baseId}.${occurrence + 1}`;
            if (item.matches('.setting-item-heading')) currentCategoryId = id;
            return { id, categoryId: currentCategoryId, name, description };
        });
        const retainedFavoriteIds = retainKnownSettingIds(this.plugin.settings.favoriteSettingIds ?? [], catalog.map(entry => entry.id));
        const favorites = new Set(retainedFavoriteIds);
        if (retainedFavoriteIds.length !== (this.plugin.settings.favoriteSettingIds ?? []).length) {
            this.plugin.settings.favoriteSettingIds = retainedFavoriteIds;
            void this.plugin.saveSettings();
        }
        const copy = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settingsDiscovery;
        const header = containerEl.createDiv({ cls: 'notemd-settings-discovery' });
        containerEl.prepend(header);
        const search = header.createEl('input', { type: 'search', placeholder: copy.searchPlaceholder, cls: 'notemd-settings-search' });
        search.setAttribute('aria-label', copy.searchLabel);
        const favoritesButton = header.createEl('button', { text: copy.favorites, cls: 'notemd-settings-favorites-filter' });
        favoritesButton.type = 'button';
        let favoritesOnly = false;
        const navigation = header.createDiv({ cls: 'notemd-settings-category-navigation' });
        const categoryButtons = new Map<string, HTMLButtonElement>();
        const resultCount = header.createDiv({ cls: 'notemd-settings-result-count' });
        resultCount.setAttribute('aria-live', 'polite');
        const emptyState = header.createDiv({ cls: 'notemd-settings-empty-state', text: copy.noResults });
        emptyState.hidden = true;
        Array.from(containerEl.querySelectorAll<HTMLElement>('h2, .setting-item-heading')).forEach((heading, index) => {
            const label = heading.textContent?.trim();
            if (!label) return;
            heading.id = `notemd-settings-category-${index}`;
            const button = navigation.createEl('button', { text: label });
            button.type = 'button';
            button.onclick = () => heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const settingIndex = settingItems.indexOf(heading);
            if (settingIndex >= 0) categoryButtons.set(catalog[settingIndex].id, button);
        });
        const applyFilter = () => {
            const navigationState = resolveSettingsNavigation(catalog, { query: search.value, favoritesOnly, favoriteIds: favorites });
            settingItems.forEach((item, index) => {
                const settingId = catalog[index].id;
                const hidden = !navigationState.visibleIds.has(settingId);
                item.toggleAttribute('hidden', hidden);
            });
            categoryButtons.forEach((button, categoryId) => {
                button.hidden = !navigationState.visibleCategoryIds.has(categoryId);
            });
            resultCount.setText(formatI18n(copy.resultCount, { visible: navigationState.visibleCount, total: navigationState.totalCount }));
            emptyState.hidden = navigationState.visibleCount !== 0;
        };
        settingItems.forEach((item, index) => {
            const settingId = catalog[index].id;
            item.dataset.notemdSettingId = settingId;
            const star = item.createEl('button', { text: favorites.has(settingId) ? '★' : '☆', cls: 'notemd-setting-favorite-button' });
            star.type = 'button';
            star.setAttribute('aria-label', favorites.has(settingId) ? copy.removeFavorite : copy.addFavorite);
            star.onclick = async () => {
                favorites.has(settingId) ? favorites.delete(settingId) : favorites.add(settingId);
                this.plugin.settings.favoriteSettingIds = [...favorites];
                await this.plugin.saveSettings();
                star.textContent = favorites.has(settingId) ? '★' : '☆';
                star.setAttribute('aria-label', favorites.has(settingId) ? copy.removeFavorite : copy.addFavorite);
                applyFilter();
            };
        });
        search.addEventListener('input', applyFilter);
        favoritesButton.onclick = () => {
            favoritesOnly = !favoritesOnly;
            favoritesButton.toggleClass('is-active', favoritesOnly);
            favoritesButton.setAttribute('aria-pressed', String(favoritesOnly));
            applyFilter();
        };
        applyFilter();
    }

    constructor(app: App, plugin: NotemdPlugin) {
        super(app, plugin);
        this.plugin = plugin;
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

    private sanitizePositiveInteger(rawValue: string, fallback: number, min = 1, max?: number): number {
        const parsed = Number.parseInt(rawValue.trim(), 10);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        const normalized = Math.floor(parsed);
        if (normalized < min) {
            return fallback;
        }
        if (typeof max === 'number' && normalized > max) {
            return fallback;
        }
        return normalized;
    }

    private addPptxFontFaceSetting(
        containerEl: HTMLElement,
        settingKey: SlideExportPptxFontSettingKey,
        presets: readonly string[],
        name: string,
        desc: string,
        placeholder: string,
        customLabel: string
    ): void {
        const customValue = '__custom__';
        const currentValue = this.plugin.settings[settingKey] || placeholder;
        const presetSet = new Set(presets);
        const setting = new Setting(containerEl).setName(name).setDesc(desc);
        setting.addDropdown(dropdown => {
            for (const preset of presets) {
                dropdown.addOption(preset, preset);
            }
            dropdown.addOption(customValue, customLabel);
            dropdown
                .setValue(presetSet.has(currentValue) ? currentValue : customValue)
                .onChange(async (value) => {
                    if (value === customValue) {
                        return;
                    }
                    this.plugin.settings[settingKey] = value;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });
        setting.addText(text => text
            .setPlaceholder(placeholder)
            .setValue(currentValue)
            .onChange(async (value) => {
                this.plugin.settings[settingKey] = value.trim();
                await this.plugin.saveSettings();
            }));
    }

    private normalizeMultilinePathSetting(value: string): string {
        return value
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n');
    }

    private addDeferredTextSetting(
        setting: Setting,
        options: {
            placeholder?: string;
            value: string;
            onCommit: (value: string) => Promise<void>;
        }
    ): void {
        setting.addText(text => {
            text.setPlaceholder(options.placeholder || '').setValue(options.value);

            let lastCommittedValue = options.value;

            const commit = async () => {
                const nextValue = text.getValue();
                if (nextValue === lastCommittedValue) {
                    return;
                }
                await options.onCommit(nextValue);
                lastCommittedValue = nextValue;
            };

            text.inputEl.addEventListener('blur', () => {
                void commit();
            });
            text.inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    void commit();
                    text.inputEl.blur();
                }
            });
        });
    }

    private addDeferredNumberSetting(
        setting: Setting,
        options: {
            placeholder?: string;
            value: number | string;
            onCommit: (rawValue: string) => Promise<string | void>;
        }
    ): void {
        this.addDeferredTextSetting(setting, {
            placeholder: options.placeholder,
            value: typeof options.value === 'string' ? options.value : String(options.value),
            onCommit: async (rawValue) => {
                const normalized = await options.onCommit(rawValue);
                if (typeof normalized === 'string') {
                    const input = setting.controlEl.querySelector('input');
                    if (input) {
                        input.value = normalized;
                    }
                }
            }
        });
    }

    private addDeferredTextAreaSetting(
        setting: Setting,
        options: {
            placeholder?: string;
            value: string;
            onCommit: (value: string) => Promise<void>;
        }
    ): void {
        setting.addTextArea((textArea: TextAreaComponent) => {
            textArea.setPlaceholder(options.placeholder || '').setValue(options.value);

            let lastCommittedValue = options.value;

            const commit = async () => {
                const nextValue = textArea.getValue();
                if (nextValue === lastCommittedValue) {
                    return;
                }
                await options.onCommit(nextValue);
                lastCommittedValue = nextValue;
            };

            textArea.inputEl.addEventListener('blur', () => {
                void commit();
            });
            textArea.inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void commit();
                    textArea.inputEl.blur();
                }
            });
        });
    }

    private getRecommendedChunkWordCount(maxTokens: number): number {
        return Math.max(1, Math.ceil(maxTokens / 3));
    }

    private buildModelAwareMaxTokensTracking(
        provider: LLMProviderConfig,
        modelName: string,
        resolvedMaxTokens: number
    ): GlobalModelAwareMaxTokensTracking | undefined {
        const normalizedModelName = modelName.trim();
        if (!normalizedModelName || !Number.isFinite(resolvedMaxTokens) || resolvedMaxTokens <= 0) {
            return undefined;
        }

        return {
            providerName: provider.name,
            modelName: normalizedModelName,
            discoveryIdentity: getProviderDiscoveryIdentity(provider),
            resolvedMaxTokens: Math.floor(resolvedMaxTokens)
        };
    }

    private getCurrentModelAwareMaxTokensTracking(): GlobalModelAwareMaxTokensTracking | undefined {
        const tracking = this.plugin.settings.globalModelAwareMaxTokensTracking;
        if (!tracking) {
            return undefined;
        }

        const provider = this.plugin.settings.providers.find(entry => entry.name === tracking.providerName);
        if (!provider) {
            return undefined;
        }

        if (
            provider.model.trim() !== tracking.modelName
            || getProviderDiscoveryIdentity(provider) !== tracking.discoveryIdentity
            || !Number.isFinite(tracking.resolvedMaxTokens)
            || tracking.resolvedMaxTokens <= 0
        ) {
            return undefined;
        }

        return tracking;
    }

    private setModelAwareMaxTokensTracking(
        tracking: GlobalModelAwareMaxTokensTracking | undefined
    ): void {
        this.plugin.settings.globalModelAwareMaxTokensTracking = tracking;
    }

    private buildDiscoveredModelMaxOutputTokensTracking(
        provider: LLMProviderConfig,
        modelName: string,
        resolvedMaxOutputTokens: number
    ): ProviderDiscoveredModelMaxOutputTokensTracking | undefined {
        const normalizedModelName = modelName.trim();
        if (!normalizedModelName || !Number.isFinite(resolvedMaxOutputTokens) || resolvedMaxOutputTokens <= 0) {
            return undefined;
        }

        return {
            providerName: provider.name,
            modelName: normalizedModelName,
            discoveryIdentity: getProviderDiscoveryIdentity(provider),
            resolvedMaxOutputTokens: Math.floor(resolvedMaxOutputTokens)
        };
    }

    private getCurrentDiscoveredModelMaxOutputTokensTracking(): ProviderDiscoveredModelMaxOutputTokensTracking | undefined {
        const tracking = this.plugin.settings.discoveredModelMaxOutputTokensTracking;
        if (!tracking) {
            return undefined;
        }

        const provider = this.plugin.settings.providers.find(entry => entry.name === tracking.providerName);
        if (!provider) {
            return undefined;
        }

        if (
            provider.model.trim() !== tracking.modelName
            || getProviderDiscoveryIdentity(provider) !== tracking.discoveryIdentity
            || !Number.isFinite(tracking.resolvedMaxOutputTokens)
            || tracking.resolvedMaxOutputTokens <= 0
        ) {
            return undefined;
        }

        return tracking;
    }

    private setDiscoveredModelMaxOutputTokensTracking(
        tracking: ProviderDiscoveredModelMaxOutputTokensTracking | undefined
    ): void {
        this.plugin.settings.discoveredModelMaxOutputTokensTracking = tracking;
    }

    private resolveModelAwareMaxTokensForProvider(
        provider: LLMProviderConfig,
        modelName: string,
        options?: { discoveredModelEntries?: DiscoveredProviderModel[] }
    ): number {
        return this.getKnownModelMaxTokensForProvider(provider, modelName, options) ?? DEFAULT_SETTINGS.maxTokens;
    }

    private getKnownModelMaxTokensForProvider(
        provider: LLMProviderConfig,
        modelName: string,
        options?: { discoveredModelEntries?: DiscoveredProviderModel[] }
    ): number | undefined {
        const normalizedModelName = modelName.trim();
        if (!normalizedModelName) {
            return undefined;
        }

        const discoveredModel = options?.discoveredModelEntries?.find(entry => entry.id === normalizedModelName);
        const knownModelMaxTokens = getKnownModelMaxOutputTokens(provider.name, normalizedModelName, {
            baseUrl: provider.baseUrl,
            ownerHint: discoveredModel?.ownerHint
        });
        if (typeof knownModelMaxTokens === 'number' && knownModelMaxTokens > 0) {
            return knownModelMaxTokens;
        }

        if (typeof discoveredModel?.maxOutputTokens === 'number' && discoveredModel.maxOutputTokens > 0) {
            return discoveredModel.maxOutputTokens;
        }

        return undefined;
    }

    private resetProviderDiscoveryState(
        state: ProviderPanelState,
        discoveryIdentity: string
    ): void {
        state.discoveryIdentity = discoveryIdentity;
        state.discoveryRequestNonce += 1;
        state.discoveredModels = [];
        state.discoveredModelEntries = [];
        state.discoveredModelsExpanded = false;
        state.fetchStatus = 'idle';
        state.fetchMessage = undefined;
    }

    private syncProviderDiscoveryState(provider: LLMProviderConfig): ProviderPanelState {
        const state = this.getProviderPanelState(provider.name);
        const discoveryIdentity = getProviderDiscoveryIdentity(provider);
        if (state.discoveryIdentity !== discoveryIdentity) {
            this.resetProviderDiscoveryState(state, discoveryIdentity);
        }
        return state;
    }

    private resolveModelAwareMaxTokens(providerName: string, modelName: string): number {
        const activeProvider = this.plugin.settings.providers.find(provider => provider.name === providerName);
        if (!activeProvider) {
            return DEFAULT_SETTINGS.maxTokens;
        }

        const discoveredModelEntries = this.syncProviderDiscoveryState(activeProvider).discoveredModelEntries;
        return this.resolveModelAwareMaxTokensForProvider(activeProvider, modelName, {
            discoveredModelEntries
        });
    }

    private shouldAutoFillRecommendedChunk(
        currentChunkWordCount: number,
        previousMaxTokens: number
    ): boolean {
        const previousRecommendedChunk = this.getRecommendedChunkWordCount(previousMaxTokens);
        return currentChunkWordCount === DEFAULT_SETTINGS.chunkWordCount
            || currentChunkWordCount === previousRecommendedChunk;
    }

    private shouldAutoSyncModelAwareMaxTokens(
        currentMaxTokens: number,
        previousProviderName: string,
        previousModelName: string
    ): boolean {
        const tracking = this.getCurrentModelAwareMaxTokensTracking();
        if (tracking) {
            return currentMaxTokens === tracking.resolvedMaxTokens;
        }

        return currentMaxTokens === DEFAULT_SETTINGS.maxTokens
            || currentMaxTokens === this.resolveModelAwareMaxTokens(previousProviderName, previousModelName);
    }

    private syncModelAwareTokenDefaults(
        provider: LLMProviderConfig,
        previousProviderName: string,
        previousModelName: string
    ): void {
        const previousMaxTokens = this.plugin.settings.maxTokens;
        const shouldSyncMaxTokens = this.shouldAutoSyncModelAwareMaxTokens(
            previousMaxTokens,
            previousProviderName,
            previousModelName
        );
        const shouldSyncChunk = this.shouldAutoFillRecommendedChunk(
            this.plugin.settings.chunkWordCount,
            previousMaxTokens
        );

        if (!shouldSyncMaxTokens) {
            return;
        }

        const nextMaxTokens = this.resolveModelAwareMaxTokens(provider.name, provider.model);
        this.plugin.settings.maxTokens = nextMaxTokens;
        this.setModelAwareMaxTokensTracking(
            this.buildModelAwareMaxTokensTracking(provider, provider.model, nextMaxTokens)
        );

        if (shouldSyncChunk) {
            this.plugin.settings.chunkWordCount = this.getRecommendedChunkWordCount(nextMaxTokens);
        }
        this.setDiscoveredModelMaxOutputTokensTracking(undefined);
    }

    private syncModelAwareTokenDefaultsAfterDiscoveryIdentityChange(
        provider: LLMProviderConfig,
        previousResolvedMaxTokens: number,
        previousConfiguredMaxTokens: number,
        previousChunkWordCount: number
    ): void {
        const tracking = this.getCurrentModelAwareMaxTokensTracking();
        const shouldSyncMaxTokens = previousConfiguredMaxTokens === DEFAULT_SETTINGS.maxTokens
            || previousConfiguredMaxTokens === previousResolvedMaxTokens
            || (tracking?.resolvedMaxTokens === previousConfiguredMaxTokens);
        const shouldSyncChunk = previousChunkWordCount === DEFAULT_SETTINGS.chunkWordCount
            || previousChunkWordCount === this.getRecommendedChunkWordCount(previousConfiguredMaxTokens);

        if (!shouldSyncMaxTokens) {
            return;
        }

        const nextMaxTokens = this.resolveModelAwareMaxTokensForProvider(provider, provider.model, {
            discoveredModelEntries: []
        });
        this.plugin.settings.maxTokens = nextMaxTokens;
        this.setModelAwareMaxTokensTracking(
            this.buildModelAwareMaxTokensTracking(provider, provider.model, nextMaxTokens)
        );

        if (shouldSyncChunk) {
            this.plugin.settings.chunkWordCount = this.getRecommendedChunkWordCount(nextMaxTokens);
        }
        this.setDiscoveredModelMaxOutputTokensTracking(undefined);
    }

    private getGlobalMaxTokensDescription(baseDescription: string): string {
        const providerI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const activeProvider = this.plugin.settings.providers.find(provider => provider.name === this.plugin.settings.activeProvider);
        const knownModelMaxTokens = activeProvider
            ? this.getKnownModelMaxTokensForProvider(activeProvider, activeProvider.model, {
                discoveredModelEntries: this.syncProviderDiscoveryState(activeProvider).discoveredModelEntries
            })
            : undefined;
        const knownModelHint = typeof knownModelMaxTokens === 'number'
            ? ` ${formatI18n(providerI18n.maxOutputTokensKnownModelHint, {
                model: activeProvider?.model ?? '',
                maxTokens: knownModelMaxTokens
            })}`
            : '';
        return `${baseDescription}${knownModelHint} Recommended chunk word count: ${this.getRecommendedChunkWordCount(this.plugin.settings.maxTokens)}.`;
    }

    private getProviderMaxOutputTokensDescription(provider: LLMProviderConfig, baseDescription: string): string {
        const providerI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const knownModelMaxTokens = this.getKnownModelMaxTokensForProvider(provider, provider.model, {
            discoveredModelEntries: this.syncProviderDiscoveryState(provider).discoveredModelEntries
        });
        if (typeof knownModelMaxTokens !== 'number') {
            return baseDescription;
        }

        return `${baseDescription} ${formatI18n(providerI18n.maxOutputTokensKnownModelHint, {
            model: provider.model,
            maxTokens: knownModelMaxTokens
        })}`;
    }

    private getProviderModelDescription(provider: LLMProviderConfig, baseDescription: string): string {
        const providerI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const knownModelMaxTokens = this.getKnownModelMaxTokensForProvider(provider, provider.model, {
            discoveredModelEntries: this.syncProviderDiscoveryState(provider).discoveredModelEntries
        });
        if (typeof knownModelMaxTokens !== 'number') {
            return baseDescription;
        }

        return `${baseDescription} ${formatI18n(providerI18n.modelKnownMaxOutputTokensHint, {
            maxTokens: knownModelMaxTokens
        })}`;
    }

    private markSection(setting: Setting, sectionKey: string): Setting {
        setting.settingEl.setAttr('data-notemd-setting-section', sectionKey);
        return setting;
    }

    private createFolderTaskFileSelectionProfileId(): string {
        return `folder-task-profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    private createFolderTaskFileSelectionProfile(
        seed: Partial<FolderTaskFileSelectionProfile> = {}
    ): FolderTaskFileSelectionProfile {
        return {
            id: seed.id || this.createFolderTaskFileSelectionProfileId(),
            name: seed.name || '',
            folderPathHint: seed.folderPathHint || '',
            includeSubfoldersMode: seed.includeSubfoldersMode ?? DEFAULT_SETTINGS.folderTaskIncludeSubfoldersMode,
            fileFilterMode: seed.fileFilterMode ?? DEFAULT_SETTINGS.folderTaskFileFilterMode,
            fileFilterPattern: seed.fileFilterPattern ?? DEFAULT_SETTINGS.folderTaskFileFilterPattern,
            fileFilterTarget: seed.fileFilterTarget ?? DEFAULT_SETTINGS.folderTaskFileFilterTarget,
            fileFilterCaseSensitive: seed.fileFilterCaseSensitive ?? DEFAULT_SETTINGS.folderTaskFileFilterCaseSensitive,
            fileFilterInvert: seed.fileFilterInvert ?? DEFAULT_SETTINGS.folderTaskFileFilterInvert
        };
    }

    private getDefaultFolderTaskProfileName(folderTaskFilterI18n: {
        profileIndexedName?: string;
        profileDefaultName: string;
    }, index: number): string {
        if (folderTaskFilterI18n.profileIndexedName) {
            return formatI18n(folderTaskFilterI18n.profileIndexedName, { index });
        }
        return `${folderTaskFilterI18n.profileDefaultName} ${index}`;
    }

    private async persistFolderTaskFileSelectionProfiles(profiles: FolderTaskFileSelectionProfile[]): Promise<void> {
        this.plugin.settings.folderTaskFileSelectionProfiles = profiles;
        await this.plugin.saveSettings();
    }

    private async updateFolderTaskFileSelectionProfile(
        profileId: string,
        update: (profile: FolderTaskFileSelectionProfile) => FolderTaskFileSelectionProfile
    ): Promise<void> {
        const profiles = getFolderTaskFileSelectionProfiles(this.plugin.settings).map(profile =>
            profile.id === profileId ? update(profile) : profile
        );
        await this.persistFolderTaskFileSelectionProfiles(profiles);
    }

    private createSilentReporter() {
        return {
            log: () => {},
            updateStatus: () => {},
            requestCancel: () => {},
            clearDisplay: () => {},
            get cancelled() {
                return false;
            },
            activeTasks: 0,
            updateActiveTasks: () => {}
        };
    }

    private getProviderPanelState(providerName: string): ProviderPanelState {
        let state = this.providerPanelState.get(providerName);
        if (!state) {
            state = {
                discoveredModels: [],
                discoveredModelEntries: [],
                discoveredModelsExpanded: false,
                fetchStatus: 'idle',
                discoveryRequestNonce: 0
            };
            this.providerPanelState.set(providerName, state);
        }
        return state;
    }

    private getDiscoveredProviderModel(provider: LLMProviderConfig, modelId: string): DiscoveredProviderModel | undefined {
        const normalizedModelId = modelId.trim();
        if (!normalizedModelId) {
            return undefined;
        }

        const state = this.syncProviderDiscoveryState(provider);
        return state.discoveredModelEntries.find(entry => entry.id === normalizedModelId);
    }

    private isProviderAdvancedSettingsExpanded(provider: LLMProviderConfig): boolean {
        const panelState = this.getProviderPanelState(provider.name);
        if (typeof panelState.advancedSettingsExpanded === 'boolean') {
            return panelState.advancedSettingsExpanded;
        }

        const defaultOpen = hasPersistedAdvancedProviderSettings(provider);
        panelState.advancedSettingsExpanded = defaultOpen;
        return defaultOpen;
    }

    private async updateProviderField(
        provider: LLMProviderConfig,
        update: (draft: LLMProviderConfig) => void
    ): Promise<void> {
        const panelState = this.syncProviderDiscoveryState(provider);
        const previousDiscoveryIdentity = getProviderDiscoveryIdentity(provider);
        const previousResolvedMaxTokens = this.resolveModelAwareMaxTokensForProvider(provider, provider.model, {
            discoveredModelEntries: panelState.discoveredModelEntries
        });
        const previousConfiguredMaxTokens = this.plugin.settings.maxTokens;
        const previousChunkWordCount = this.plugin.settings.chunkWordCount;
        update(provider);
        const nextDiscoveryIdentity = getProviderDiscoveryIdentity(provider);
        if (nextDiscoveryIdentity !== previousDiscoveryIdentity) {
            this.resetProviderDiscoveryState(panelState, nextDiscoveryIdentity);
            this.syncModelAwareTokenDefaultsAfterDiscoveryIdentityChange(
                provider,
                previousResolvedMaxTokens,
                previousConfiguredMaxTokens,
                previousChunkWordCount
            );
            this.setDiscoveredModelMaxOutputTokensTracking(undefined);
        }
        await this.plugin.saveSettings();
        this.display();
    }

    private syncDiscoveredModelSelectionProviderMaxOutputTokens(
        provider: LLMProviderConfig,
        discoveredModelEntries: DiscoveredProviderModel[]
    ): { resolvedMaxOutputTokens?: number; usedFallbackMaxOutputTokens?: boolean } {
        const nextMaxOutputTokens = this.getKnownModelMaxTokensForProvider(provider, provider.model, {
            discoveredModelEntries
        });
        if (!this.plugin.settings.autoApplyDiscoveredModelMaxOutputTokens) {
            return {};
        }

        if (typeof nextMaxOutputTokens === 'number' && nextMaxOutputTokens > 0) {
            provider.maxOutputTokens = nextMaxOutputTokens;
            this.setDiscoveredModelMaxOutputTokensTracking(
                this.buildDiscoveredModelMaxOutputTokensTracking(provider, provider.model, nextMaxOutputTokens)
            );
            return { resolvedMaxOutputTokens: nextMaxOutputTokens };
        }

        const existingProviderOverride = typeof provider.maxOutputTokens === 'number' && provider.maxOutputTokens > 0
            ? Math.floor(provider.maxOutputTokens)
            : undefined;
        const fallbackMaxOutputTokens = existingProviderOverride ?? DEFAULT_SETTINGS.maxTokens;
        provider.maxOutputTokens = fallbackMaxOutputTokens;
        this.setDiscoveredModelMaxOutputTokensTracking(undefined);
        return {
            resolvedMaxOutputTokens: fallbackMaxOutputTokens,
            usedFallbackMaxOutputTokens: true
        };
    }

    private async applyTypedProviderModelSelection(
        provider: LLMProviderConfig,
        nextModel: string
    ): Promise<void> {
        await this.updateProviderField(provider, draft => {
            const previousProviderName = draft.name;
            const previousModelName = draft.model;
            draft.model = nextModel.trim();
            this.syncModelAwareTokenDefaults(draft, previousProviderName, previousModelName);
        });
    }

    private async applyDiscoveredProviderModelSelection(
        provider: LLMProviderConfig,
        nextModel: string,
        discoveredModelEntries: DiscoveredProviderModel[]
    ): Promise<{ resolvedMaxOutputTokens?: number; usedFallbackMaxOutputTokens?: boolean }> {
        let applyResult: { resolvedMaxOutputTokens?: number; usedFallbackMaxOutputTokens?: boolean } = {};
        await this.updateProviderField(provider, draft => {
            draft.model = nextModel.trim();
            applyResult = this.syncDiscoveredModelSelectionProviderMaxOutputTokens(draft, discoveredModelEntries);
        });
        return applyResult;
    }

    private addProviderTextField(
        setting: Setting,
        provider: LLMProviderConfig,
        read: () => string,
        placeholder: string,
        onCommit: (value: string) => Promise<void>
    ): void {
        this.addDeferredTextSetting(setting, {
            placeholder,
            value: read(),
            onCommit
        });
    }

    private addProviderNumberField(
        setting: Setting,
        provider: LLMProviderConfig,
        read: () => string,
        placeholder: string,
        onCommit: (value: string) => Promise<string | void>
    ): void {
        this.addDeferredNumberSetting(setting, {
            placeholder,
            value: read(),
            onCommit
        });
    }

    private renderProviderModelDiscovery(containerEl: HTMLElement, provider: LLMProviderConfig): void {
        const providerI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const discovery = resolveProviderModelDiscoveryDefinition(provider);
        const panelState = this.syncProviderDiscoveryState(provider);
        const unavailableReason = discovery.disableReasonKey
            ? providerI18n.fetchModelsUnavailableReasons[discovery.disableReasonKey]
            : providerI18n.fetchModelsUnavailableReasonDefault;

        new Setting(containerEl)
            .setName(providerI18n.fetchModelsName)
            .setDesc(
                discovery.mode === 'none'
                    ? formatI18n(providerI18n.fetchModelsUnavailable, {
                        provider: provider.name,
                        reason: unavailableReason
                    })
                    : providerI18n.fetchModelsDesc
            )
            .addButton(button => {
                button
                    .setButtonText(panelState.fetchStatus === 'loading' ? providerI18n.fetchModelsLoading : providerI18n.fetchModelsButton)
                    .setDisabled(discovery.mode === 'none' || panelState.fetchStatus === 'loading')
                    .onClick(async () => {
                        const providerSnapshot: LLMProviderConfig = { ...provider };
                        const requestIdentity = getProviderDiscoveryIdentity(providerSnapshot);
                        const requestNonce = panelState.discoveryRequestNonce + 1;
                        panelState.discoveryIdentity = requestIdentity;
                        panelState.discoveryRequestNonce = requestNonce;
                        panelState.fetchStatus = 'loading';
                        panelState.fetchMessage = undefined;
                        panelState.discoveredModels = [];
                        panelState.discoveredModelEntries = [];
                        panelState.discoveredModelsExpanded = false;
                        this.display();

                        try {
                            const result = await discoverProviderModelsDetailed(providerSnapshot);
                            if (
                                panelState.discoveryRequestNonce !== requestNonce
                                || panelState.discoveryIdentity !== requestIdentity
                            ) {
                                return;
                            }
                            panelState.discoveredModels = result.models;
                            panelState.discoveredModelEntries = result.entries;
                            panelState.discoveredModelsExpanded = result.models.length > 0;
                            panelState.fetchStatus = 'success';
                            panelState.fetchMessage = result.models.length > 0
                                ? formatI18n(providerI18n.fetchModelsSuccess, {
                                    provider: provider.name,
                                    count: result.models.length
                                })
                                : formatI18n(providerI18n.fetchModelsEmpty, { provider: provider.name });
                        } catch (error: unknown) {
                            if (
                                panelState.discoveryRequestNonce !== requestNonce
                                || panelState.discoveryIdentity !== requestIdentity
                            ) {
                                return;
                            }
                            const message = error instanceof Error ? error.message : String(error);
                            panelState.fetchStatus = 'error';
                            panelState.fetchMessage = formatI18n(providerI18n.fetchModelsError, {
                                provider: provider.name,
                                message
                            });
                        }

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(providerI18n.discoveredModelTokenSyncName)
            .setDesc(providerI18n.discoveredModelTokenSyncDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoApplyDiscoveredModelMaxOutputTokens)
                .onChange(async value => {
                    this.plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = value;
                    await this.plugin.saveSettings();
                }));

        if (panelState.fetchMessage) {
            const callout = containerEl.createDiv({
                cls: `notemd-provider-validation ${panelState.fetchStatus === 'error' ? 'notemd-provider-validation-error' : 'notemd-provider-validation-warning'}`
            });
            callout.createEl('strong', {
                text: panelState.fetchStatus === 'error'
                    ? providerI18n.validationWarning
                    : providerI18n.discoveredModelsName
            });
            callout.createEl('p', { text: panelState.fetchMessage });
        }

        if (panelState.discoveredModels.length > 0) {
            const currentModel = provider.model.trim();
            const currentDiscoveredModel = panelState.discoveredModels.includes(currentModel) ? currentModel : '';
            const discoveredModels: DiscoveredProviderModel[] = panelState.discoveredModelEntries.length > 0
                ? panelState.discoveredModelEntries
                : panelState.discoveredModels.map(modelId => ({ id: modelId }));
            const detailsEl = containerEl.createEl('details', {
                cls: 'notemd-section-card notemd-provider-discovery-panel'
            });
            detailsEl.open = panelState.discoveredModelsExpanded;
            detailsEl.addEventListener('toggle', () => {
                panelState.discoveredModelsExpanded = detailsEl.open;
            });

            const summary = detailsEl.createEl('summary', {
                cls: 'notemd-section-summary notemd-provider-discovery-summary'
            });
            summary.setText(
                currentDiscoveredModel
                    ? formatI18n(providerI18n.discoveredModelsSummaryWithCurrent, {
                        count: panelState.discoveredModels.length,
                        model: currentDiscoveredModel
                    })
                    : formatI18n(providerI18n.discoveredModelsSummary, {
                        count: panelState.discoveredModels.length
                    })
            );

            detailsEl.createEl('p', {
                cls: 'notemd-section-description',
                text: providerI18n.discoveredModelsDesc
            });

            const list = detailsEl.createDiv({ cls: 'notemd-provider-model-list' });
            discoveredModels.forEach(model => {
                const modelId = model.id;
                const isCurrentModel = currentModel === modelId;
                const row = list.createDiv({
                    cls: `notemd-provider-model-item${isCurrentModel ? ' is-current' : ''}`
                });
                const copy = row.createDiv({ cls: 'notemd-provider-model-copy' });
                copy.createEl('code', { text: modelId });
                const metaParts = [
                    model.label?.trim() || '',
                    model.ownerHint?.trim()
                        ? formatI18n(providerI18n.discoveredModelsOwnerHint, { owner: model.ownerHint.trim() })
                        : '',
                    (() => {
                        const knownModelMaxTokens = this.getKnownModelMaxTokensForProvider(provider, modelId, {
                            discoveredModelEntries: discoveredModels
                        });
                        return typeof knownModelMaxTokens === 'number'
                            ? formatI18n(providerI18n.modelKnownMaxOutputTokensHint, {
                                maxTokens: knownModelMaxTokens
                            })
                            : '';
                    })()
                ].filter(Boolean);
                if (metaParts.length > 0) {
                    copy.createEl('div', {
                        cls: 'notemd-provider-model-meta',
                        text: metaParts.join(' · ')
                    });
                }
                const useButton = new ButtonComponent(row);
                useButton
                    .setButtonText(isCurrentModel ? providerI18n.discoveredModelsUsingButton : providerI18n.discoveredModelsUseButton)
                    .setDisabled(isCurrentModel)
                    .onClick(async () => {
                        const applyResult = await this.applyDiscoveredProviderModelSelection(provider, modelId, discoveredModels);
                        panelState.discoveredModelsExpanded = false;
                        const appliedMessage = applyResult.usedFallbackMaxOutputTokens === true
                            ? formatI18n(providerI18n.discoveredModelsAppliedManualMaxOutputTokensNeeded, {
                                provider: provider.name,
                                model: modelId,
                                maxTokens: applyResult.resolvedMaxOutputTokens ?? DEFAULT_SETTINGS.maxTokens
                            })
                            : typeof applyResult.resolvedMaxOutputTokens === 'number'
                            ? formatI18n(providerI18n.discoveredModelsAppliedAutoMaxOutputTokens, {
                                provider: provider.name,
                                model: modelId,
                                maxTokens: applyResult.resolvedMaxOutputTokens
                            })
                            : this.plugin.settings.autoApplyDiscoveredModelMaxOutputTokens
                                ? formatI18n(providerI18n.discoveredModelsAppliedManualMaxOutputTokensNeeded, {
                                    provider: provider.name,
                                    model: modelId,
                                    maxTokens: DEFAULT_SETTINGS.maxTokens
                                })
                                : formatI18n(providerI18n.discoveredModelsApplied, {
                                    provider: provider.name,
                                    model: modelId
                                });
                        new Notice(appliedMessage, 7000);
                        this.display();
                    });
            });
        }
    }

    private renderProviderField(
        containerEl: HTMLElement,
        provider: LLMProviderConfig,
        field: LLMProviderSettingFieldDefinition
    ): void {
        const providerI18n = getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }).settings.providerConfig;
        const defaultProvider = DEFAULT_SETTINGS.providers.find(p => p.name === provider.name);

        switch (field.id) {
            case 'apiKey': {
                const definition = getLLMProviderDefinition(provider.name);
                const apiKeyMode = definition?.apiKeyMode ?? 'required';
                const apiKeyDescription = apiKeyMode === 'optional'
                    ? formatI18n(providerI18n.apiKeyDescOptional, { provider: provider.name })
                    : formatI18n(providerI18n.apiKeyDescRequired, {
                        provider: provider.name,
                        extra: provider.name === 'LMStudio' ? providerI18n.apiKeyExtraLmStudio : ''
                    });
                const setting = new Setting(containerEl)
                    .setName(providerI18n.apiKeyName)
                    .setDesc(apiKeyDescription);
                this.addProviderTextField(
                    setting,
                    provider,
                    () => provider.apiKey,
                    provider.name === 'LMStudio' ? providerI18n.apiKeyPlaceholderLmStudio : providerI18n.apiKeyPlaceholderDefault,
                    async value => this.updateProviderField(provider, draft => { draft.apiKey = value; })
                );
                break;
            }
            case 'baseUrl': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.baseUrlName)
                    .setDesc(formatI18n(providerI18n.baseUrlDesc, {
                        provider: provider.name,
                        required: provider.name === 'Azure OpenAI' ? providerI18n.baseUrlRequired : ''
                    }));
                this.addProviderTextField(
                    setting,
                    provider,
                    () => provider.baseUrl,
                    defaultProvider?.baseUrl || providerI18n.baseUrlPlaceholder,
                    async value => this.updateProviderField(provider, draft => { draft.baseUrl = value.trim(); })
                );
                break;
            }
            case 'model': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.modelName)
                    .setDesc(this.getProviderModelDescription(provider, formatI18n(providerI18n.modelDesc, { provider: provider.name })));
                this.addProviderTextField(
                    setting,
                    provider,
                    () => provider.model,
                    defaultProvider?.model || providerI18n.modelPlaceholder,
                    async value => this.applyTypedProviderModelSelection(provider, value)
                );
                break;
            }
            case 'temperature': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.temperatureName)
                    .setDesc(providerI18n.temperatureDesc);
                setting.addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(provider.temperature)
                    .onChange(async value => {
                        provider.temperature = value;
                        await this.plugin.saveSettings();
                    })
                    .setDynamicTooltip());
                break;
            }
            case 'topP': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.topPName)
                    .setDesc(providerI18n.topPDesc);
                this.addProviderNumberField(
                    setting,
                    provider,
                    () => provider.topP !== undefined ? String(provider.topP) : '',
                    providerI18n.topPPlaceholder,
                    async value => {
                        const parsed = Number.parseFloat(value.trim());
                        await this.updateProviderField(provider, draft => {
                            if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
                                draft.topP = parsed;
                            } else {
                                delete draft.topP;
                            }
                        });
                        return provider.topP !== undefined ? String(provider.topP) : '';
                    }
                );
                break;
            }
            case 'reasoningEffort': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.reasoningEffortName)
                    .setDesc(providerI18n.reasoningEffortDesc);
                this.addProviderTextField(
                    setting,
                    provider,
                    () => provider.reasoningEffort || '',
                    providerI18n.reasoningEffortPlaceholder,
                    async value => {
                        const normalized = value.trim().toLowerCase();
                        await this.updateProviderField(provider, draft => {
                            if (['none', 'low', 'medium', 'high'].includes(normalized)) {
                                draft.reasoningEffort = normalized;
                            } else {
                                delete draft.reasoningEffort;
                            }
                        });
                    }
                );
                break;
            }
            case 'thinkingEnabled': {
                new Setting(containerEl)
                    .setName(providerI18n.thinkingEnabledName)
                    .setDesc(providerI18n.thinkingEnabledDesc)
                    .addToggle(toggle => toggle
                        .setValue(provider.thinkingEnabled === true)
                        .onChange(async value => {
                            provider.thinkingEnabled = value;
                            await this.plugin.saveSettings();
                        }));
                break;
            }
            case 'apiVersion': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.apiVersionName)
                    .setDesc(providerI18n.apiVersionDesc);
                this.addProviderTextField(
                    setting,
                    provider,
                    () => provider.apiVersion || '',
                    providerI18n.apiVersionPlaceholder,
                    async value => this.updateProviderField(provider, draft => { draft.apiVersion = value.trim(); })
                );
                break;
            }
            case 'maxOutputTokens': {
                const setting = new Setting(containerEl)
                    .setName(providerI18n.maxOutputTokensName)
                    .setDesc(this.getProviderMaxOutputTokensDescription(provider, providerI18n.maxOutputTokensDesc));
                this.addProviderNumberField(
                    setting,
                    provider,
                    () => provider.maxOutputTokens !== undefined ? String(provider.maxOutputTokens) : '',
                    String(this.plugin.settings.maxTokens),
                    async value => {
                        const parsed = Number.parseInt(value.trim(), 10);
                        await this.updateProviderField(provider, draft => {
                            if (Number.isFinite(parsed) && parsed > 0) {
                                draft.maxOutputTokens = parsed;
                            } else {
                                delete draft.maxOutputTokens;
                            }
                        });
                        return provider.maxOutputTokens !== undefined ? String(provider.maxOutputTokens) : '';
                    }
                );
                break;
            }
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
        await this.plugin.exportProviderProfilesCommand();
    }

    async importProviderSettings(): Promise<void> {
        await this.plugin.importProviderProfilesCommand();
        this.display();
    }

    private renderFolderTaskFileSelectionProfileManager(containerEl: HTMLElement, folderTaskFilterI18n: any): void {
        new Setting(containerEl)
            .setName(folderTaskFilterI18n.profilesHeading)
            .setDesc(folderTaskFilterI18n.profilesDesc);

        const toolbar = containerEl.createDiv({ cls: 'notemd-workflow-builder-toolbar' });
        const addProfileButton = toolbar.createEl('button', {
            text: folderTaskFilterI18n.addProfileButton,
            cls: 'mod-cta'
        });
        addProfileButton.onclick = async () => {
            const profiles = getFolderTaskFileSelectionProfiles(this.plugin.settings);
            const nextProfileName = this.getDefaultFolderTaskProfileName(folderTaskFilterI18n, profiles.length + 1);
            const next = [
                ...profiles,
                this.createFolderTaskFileSelectionProfile({
                    name: nextProfileName
                })
            ];
            await this.persistFolderTaskFileSelectionProfiles(next);
            this.display();
            new Notice(folderTaskFilterI18n.profileAddedNotice);
        };

        const saveCurrentAsProfileButton = toolbar.createEl('button', {
            text: folderTaskFilterI18n.saveCurrentAsProfileButton
        });
        saveCurrentAsProfileButton.onclick = async () => {
            const profiles = getFolderTaskFileSelectionProfiles(this.plugin.settings);
            const nextProfileName = this.getDefaultFolderTaskProfileName(folderTaskFilterI18n, profiles.length + 1);
            const next = [
                ...profiles,
                this.createFolderTaskFileSelectionProfile({
                    name: nextProfileName,
                    includeSubfoldersMode: this.plugin.settings.folderTaskIncludeSubfoldersMode,
                    fileFilterMode: this.plugin.settings.folderTaskFileFilterMode,
                    fileFilterPattern: this.plugin.settings.folderTaskFileFilterPattern,
                    fileFilterTarget: this.plugin.settings.folderTaskFileFilterTarget,
                    fileFilterCaseSensitive: this.plugin.settings.folderTaskFileFilterCaseSensitive,
                    fileFilterInvert: this.plugin.settings.folderTaskFileFilterInvert
                })
            ];
            await this.persistFolderTaskFileSelectionProfiles(next);
            this.display();
            new Notice(folderTaskFilterI18n.profileSavedCurrentNotice);
        };

        const profiles = getFolderTaskFileSelectionProfiles(this.plugin.settings);
        if (profiles.length === 0) {
            containerEl.createEl('p', {
                text: folderTaskFilterI18n.profilesEmpty,
                cls: 'setting-item-description'
            });
            return;
        }

        profiles.forEach((profile, index) => {
            const fallbackProfileName = this.getDefaultFolderTaskProfileName(folderTaskFilterI18n, index + 1);
            new Setting(containerEl)
                .setName(profile.name || fallbackProfileName)
                .setDesc(folderTaskFilterI18n.profileCardDesc)
                .addButton(button => button
                    .setButtonText(folderTaskFilterI18n.deleteProfileButton)
                    .setWarning()
                    .onClick(async () => {
                        const next = getFolderTaskFileSelectionProfiles(this.plugin.settings)
                            .filter(item => item.id !== profile.id);
                        await this.persistFolderTaskFileSelectionProfiles(next);
                        this.display();
                        new Notice(folderTaskFilterI18n.profileDeletedNotice);
                    }));

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(folderTaskFilterI18n.profileNameName)
                    .setDesc(folderTaskFilterI18n.profileNameDesc),
                {
                    placeholder: folderTaskFilterI18n.profileNamePlaceholder,
                    value: profile.name,
                    onCommit: async (value) => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            name: value.trim() || current.name
                        }));
                    }
                }
            );

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(folderTaskFilterI18n.profileFolderPathName)
                    .setDesc(folderTaskFilterI18n.profileFolderPathDesc),
                {
                    placeholder: folderTaskFilterI18n.profileFolderPathPlaceholder,
                    value: profile.folderPathHint,
                    onCommit: async (value) => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            folderPathHint: value.trim()
                        }));
                    }
                }
            );

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.modeName)
                .setDesc(folderTaskFilterI18n.modeDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('none', folderTaskFilterI18n.modeNone)
                    .addOption('contains', folderTaskFilterI18n.modeContains)
                    .addOption('regex', folderTaskFilterI18n.modeRegex)
                    .addOption('glob', folderTaskFilterI18n.modeGlob)
                    .setValue(profile.fileFilterMode)
                    .onChange(async (value: 'none' | 'contains' | 'regex' | 'glob') => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            fileFilterMode: value
                        }));
                        const latestProfile = getFolderTaskFileSelectionProfiles(this.plugin.settings)
                            .find(item => item.id === profile.id) || profile;
                        if (value === 'regex') {
                            const regexError = getFolderTaskRegexValidationError(
                                latestProfile.fileFilterPattern,
                                latestProfile.fileFilterCaseSensitive
                            );
                            if (regexError) {
                                new Notice(formatI18n(folderTaskFilterI18n.invalidRegexNotice, { message: regexError }), 9000);
                            }
                        }
                    }));

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(folderTaskFilterI18n.patternName)
                    .setDesc(folderTaskFilterI18n.patternDesc),
                {
                    placeholder: folderTaskFilterI18n.patternPlaceholder,
                    value: profile.fileFilterPattern,
                    onCommit: async (value) => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            fileFilterPattern: value
                        }));
                        const latestProfile = getFolderTaskFileSelectionProfiles(this.plugin.settings)
                            .find(item => item.id === profile.id) || profile;
                        if (latestProfile.fileFilterMode === 'regex') {
                            const regexError = getFolderTaskRegexValidationError(
                                value,
                                latestProfile.fileFilterCaseSensitive
                            );
                            if (regexError) {
                                new Notice(formatI18n(folderTaskFilterI18n.invalidRegexNotice, { message: regexError }), 9000);
                            }
                        }
                    }
                }
            );

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.targetName)
                .setDesc(folderTaskFilterI18n.targetDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('relativePath', folderTaskFilterI18n.targetRelativePath)
                    .addOption('basename', folderTaskFilterI18n.targetBasename)
                    .setValue(profile.fileFilterTarget)
                    .onChange(async (value: 'relativePath' | 'basename') => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            fileFilterTarget: value
                        }));
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.caseSensitiveName)
                .setDesc(folderTaskFilterI18n.caseSensitiveDesc)
                .addToggle(toggle => toggle
                    .setValue(profile.fileFilterCaseSensitive)
                    .onChange(async (value) => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            fileFilterCaseSensitive: value
                        }));
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.invertName)
                .setDesc(folderTaskFilterI18n.invertDesc)
                .addToggle(toggle => toggle
                    .setValue(profile.fileFilterInvert)
                    .onChange(async (value) => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            fileFilterInvert: value
                        }));
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.includeSubfoldersName)
                .setDesc(folderTaskFilterI18n.includeSubfoldersDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('legacy', folderTaskFilterI18n.includeSubfoldersLegacy)
                    .addOption('include', folderTaskFilterI18n.includeSubfoldersInclude)
                    .addOption('exclude', folderTaskFilterI18n.includeSubfoldersExclude)
                    .setValue(profile.includeSubfoldersMode)
                    .onChange(async (value: 'legacy' | 'include' | 'exclude') => {
                        await this.updateFolderTaskFileSelectionProfile(profile.id, current => ({
                            ...current,
                            includeSubfoldersMode: value
                        }));
                    }));

            if (index < profiles.length - 1) {
                containerEl.createEl('hr');
            }
        });
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
        const settingsResetI18n = i18n.settings.settingsReset;
        const generalOutputI18n = i18n.settings.generalOutput;
        const contentGenerationI18n = i18n.settings.contentGeneration;
        const localKnowledgeI18n = i18n.settings.localKnowledge;
        const chapterSplitI18n = i18n.settings.chapterSplit;
        const customPromptsI18n = i18n.settings.customPrompts;
        const folderTaskFilterI18n = i18n.settings.folderTaskFilter;
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

        new Setting(containerEl).setName(settingsResetI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(settingsResetI18n.completeName)
            .setDesc(settingsResetI18n.completeDesc)
            .addButton(button => button
                .setButtonText(settingsResetI18n.completeButton)
                .setWarning()
                .onClick(async () => {
                    await this.plugin.resetSettings('complete');
                    await this.plugin.refreshLocalizedUi();
                    this.display();
                    new Notice(settingsResetI18n.completeNotice);
                }));

        new Setting(containerEl)
            .setName(settingsResetI18n.partialName)
            .setDesc(settingsResetI18n.partialDesc)
            .addButton(button => button
                .setButtonText(settingsResetI18n.partialButton)
                .onClick(async () => {
                    await this.plugin.resetSettings('partial');
                    await this.plugin.refreshLocalizedUi();
                    this.display();
                    new Notice(settingsResetI18n.partialNotice);
                }));

        containerEl.createEl('hr');

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

            const providerFields = getProviderSettingFields(activeProvider.name)
                .filter(field => shouldShowProviderSettingField(activeProvider, field, {
                    developerMode: this.plugin.settings.enableDeveloperMode
                }));

            providerFields
                .filter(field => field.group === 'core')
                .forEach(field => this.renderProviderField(containerEl, activeProvider, field));

            const hasContextualFields = providerFields.some(field => field.group === 'contextual');
            if (hasContextualFields) {
                new Setting(containerEl)
                    .setName(providerI18n.contextualSettingsName)
                    .setHeading();
                providerFields
                    .filter(field => field.group === 'contextual')
                    .forEach(field => this.renderProviderField(containerEl, activeProvider, field));
            }

            this.renderProviderModelDiscovery(containerEl, activeProvider);

            const advancedFields = providerFields.filter(field => field.group === 'advanced' || field.group === 'developer');
            if (advancedFields.length > 0) {
                const panelState = this.getProviderPanelState(activeProvider.name);
                const advancedDetails = containerEl.createEl('details', { cls: 'notemd-section-card notemd-provider-advanced-settings' });
                advancedDetails.open = this.isProviderAdvancedSettingsExpanded(activeProvider);
                advancedDetails.addEventListener('toggle', () => {
                    panelState.advancedSettingsExpanded = advancedDetails.open;
                });
                const summary = advancedDetails.createEl('summary', { cls: 'notemd-section-summary' });
                summary.setText(providerI18n.advancedSettingsName);
                advancedDetails.createEl('p', {
                    text: advancedDetails.open
                        ? providerI18n.advancedSettingsHint
                        : formatI18n(providerI18n.advancedSettingsDesc, { provider: activeProvider.name }),
                    cls: 'notemd-section-description'
                });
                advancedFields.forEach(field => this.renderProviderField(advancedDetails, activeProvider, field));
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
                        try {
                            await runProviderConnectionTestWithHost({
                                loadSettings: async () => {},
                                getSettings: () => this.plugin.settings,
                                getUiStrings: () => getI18nStrings({ uiLocale: this.plugin.settings.uiLocale }),
                                showNotice: (message, duration) => new Notice(message, duration),
                                logError: (_message, details) => console.error(`Error testing ${activeProvider.name} connection from settings:`, details)
                            }, this.createSilentReporter());
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            new Notice(formatI18n(providerI18n.testConnectionError, { message }), 10000);
                            console.error(`Error testing ${activeProvider.name} connection from settings:`, error);
                        } finally {
                            button.setDisabled(false).setButtonText(providerI18n.testConnectionButton);
                        }
                    }));
        } else {
            containerEl.createEl('p', { text: providerI18n.missingActiveProvider, cls: 'notemd-error-text' });

            new Setting(containerEl)
                .setName(providerI18n.localOnlyName)
                .setDesc(providerI18n.localOnlyDesc)
                .addToggle(toggle => toggle
                    .setValue(activeProvider!.localOnly === true)
                    .onChange(async (value) => {
                        activeProvider!.localOnly = value;
                        await this.plugin.saveSettings();
                    }));
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

        // --- General Settings ---
        this.markSection(new Setting(containerEl).setName(generalOutputI18n.processedHeading).setHeading(), 'processed-output');
        new Setting(containerEl).setName(generalOutputI18n.processedSavePathName).setDesc(generalOutputI18n.processedSavePathDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomProcessedFileFolder).onChange(async (value) => { this.plugin.settings.useCustomProcessedFileFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomProcessedFileFolder) {
            this.addDeferredTextSetting(
                new Setting(containerEl).setName(generalOutputI18n.processedFolderPathName).setDesc(generalOutputI18n.processedFolderPathDesc),
                {
                    placeholder: generalOutputI18n.processedFolderPathPlaceholder,
                    value: this.plugin.settings.processedFileFolder,
                    onCommit: async (value) => {
                        this.plugin.settings.processedFileFolder = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
        }
        new Setting(containerEl).setName(generalOutputI18n.moveOriginalName).setDesc(generalOutputI18n.moveOriginalDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.moveOriginalFileOnProcess).onChange(async (value) => { this.plugin.settings.moveOriginalFileOnProcess = value; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName(generalOutputI18n.customAddLinksFilenameName).setDesc(generalOutputI18n.customAddLinksFilenameDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomAddLinksSuffix).onChange(async (value) => { this.plugin.settings.useCustomAddLinksSuffix = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomAddLinksSuffix) {
            this.addDeferredTextSetting(
                new Setting(containerEl).setName(generalOutputI18n.addLinksSuffixName).setDesc(generalOutputI18n.addLinksSuffixDesc),
                {
                    placeholder: generalOutputI18n.addLinksSuffixPlaceholder,
                    value: this.plugin.settings.addLinksCustomSuffix,
                    onCommit: async (value) => {
                        this.plugin.settings.addLinksCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }
                }
            );
        }
        new Setting(containerEl)
            .setName(generalOutputI18n.removeCodeFencesName)
            .setDesc(generalOutputI18n.removeCodeFencesDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.removeCodeFencesOnAddLinks)
                .onChange(async (value) => {
                    this.plugin.settings.removeCodeFencesOnAddLinks = value;
                    await this.plugin.saveSettings();
                }));

        this.markSection(new Setting(containerEl).setName(generalOutputI18n.conceptNoteHeading).setHeading(), 'concept-note-output');
        new Setting(containerEl).setName(generalOutputI18n.conceptNotePathName).setDesc(generalOutputI18n.conceptNotePathDesc).addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptNoteFolder).onChange(async (value) => { this.plugin.settings.useCustomConceptNoteFolder = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.useCustomConceptNoteFolder) {
            this.addDeferredTextSetting(
                new Setting(containerEl).setName(generalOutputI18n.conceptNoteFolderName).setDesc(generalOutputI18n.conceptNoteFolderDesc),
                {
                    placeholder: generalOutputI18n.conceptNoteFolderPlaceholder,
                    value: this.plugin.settings.conceptNoteFolder,
                    onCommit: async (value) => {
                        this.plugin.settings.conceptNoteFolder = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
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
                this.addDeferredTextSetting(
                    new Setting(containerEl).setName(generalOutputI18n.conceptLogFolderName).setDesc(generalOutputI18n.conceptLogFolderDesc),
                    {
                        placeholder: generalOutputI18n.conceptLogFolderPlaceholder,
                        value: this.plugin.settings.conceptLogFolderPath,
                        onCommit: async (value) => {
                            this.plugin.settings.conceptLogFolderPath = value.trim();
                            await this.plugin.saveSettings();
                        }
                    }
                );
            }
            const logFileNameSetting = new Setting(containerEl).setName(generalOutputI18n.customLogFileNameToggleName);
            logFileNameSetting.setDesc(formatI18n(generalOutputI18n.customLogFileNameToggleDesc, { defaultName: DEFAULT_SETTINGS.conceptLogFileName }));
            logFileNameSetting.addToggle(toggle => toggle.setValue(this.plugin.settings.useCustomConceptLogFileName).onChange(async (value) => { this.plugin.settings.useCustomConceptLogFileName = value; await this.plugin.saveSettings(); this.display(); }));
            if (this.plugin.settings.useCustomConceptLogFileName) {
                this.addDeferredTextSetting(
                    new Setting(containerEl).setName(generalOutputI18n.conceptLogFileNameName).setDesc(generalOutputI18n.conceptLogFileNameDesc),
                    {
                        placeholder: DEFAULT_SETTINGS.conceptLogFileName,
                        value: this.plugin.settings.conceptLogFileName,
                        onCommit: async (value) => {
                            this.plugin.settings.conceptLogFileName = value.trim();
                            await this.plugin.saveSettings();
                        }
                    }
                );
            }
        }

        new Setting(containerEl).setName(i18n.settings.processing.heading).setHeading();
        this.addDeferredNumberSetting(
            new Setting(containerEl)
                .setName(i18n.settings.processing.maxTokensName)
                .setDesc(this.getGlobalMaxTokensDescription(i18n.settings.processing.maxTokensDesc)),
            {
                placeholder: String(DEFAULT_SETTINGS.maxTokens),
                value: this.plugin.settings.maxTokens,
                onCommit: async (rawValue) => {
                    const previousMaxTokens = this.plugin.settings.maxTokens;
                    const previousRecommendedChunk = this.getRecommendedChunkWordCount(previousMaxTokens);
                    const nextMaxTokens = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.maxTokens, 1);
                    this.plugin.settings.maxTokens = nextMaxTokens;
                    this.setModelAwareMaxTokensTracking(undefined);

                    const currentChunk = this.plugin.settings.chunkWordCount;
                    if (this.shouldAutoFillRecommendedChunk(currentChunk, previousMaxTokens)) {
                        this.plugin.settings.chunkWordCount = this.getRecommendedChunkWordCount(nextMaxTokens);
                    }

                    await this.plugin.saveSettings();
                    this.display();
                    return String(this.plugin.settings.maxTokens);
                }
            }
        );
        this.addDeferredNumberSetting(
            new Setting(containerEl)
                .setName(i18n.settings.processing.chunkWordCountName)
                .setDesc(i18n.settings.processing.chunkWordCountDesc),
            {
                placeholder: String(this.getRecommendedChunkWordCount(this.plugin.settings.maxTokens)),
                value: this.plugin.settings.chunkWordCount,
                onCommit: async (rawValue) => {
                    this.plugin.settings.chunkWordCount = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.chunkWordCount, 50);
                    await this.plugin.saveSettings();
                    this.display();
                    return String(this.plugin.settings.chunkWordCount);
                }
            }
        );
        new Setting(containerEl)
            .setName(i18n.settings.processing.duplicateDetectionName)
            .setDesc(i18n.settings.processing.duplicateDetectionDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDuplicateDetection)
                .onChange(async (value) => {
                    this.plugin.settings.enableDuplicateDetection = value;
                    await this.plugin.saveSettings();
                }));

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

        if (this.plugin.settings.enableDeveloperMode && this.plugin.settings.enableAdvancedFileSelectionProfiles) {
            new Setting(containerEl).setName(folderTaskFilterI18n.heading).setHeading();
            new Setting(containerEl)
                .setName(folderTaskFilterI18n.modeName)
                .setDesc(folderTaskFilterI18n.modeDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('none', folderTaskFilterI18n.modeNone)
                    .addOption('contains', folderTaskFilterI18n.modeContains)
                    .addOption('regex', folderTaskFilterI18n.modeRegex)
                    .addOption('glob', folderTaskFilterI18n.modeGlob)
                    .setValue(this.plugin.settings.folderTaskFileFilterMode)
                    .onChange(async (value: 'none' | 'contains' | 'regex' | 'glob') => {
                        this.plugin.settings.folderTaskFileFilterMode = value;
                        await this.plugin.saveSettings();
                        if (value === 'regex') {
                            const regexError = getFolderTaskRegexValidationError(
                                this.plugin.settings.folderTaskFileFilterPattern,
                                this.plugin.settings.folderTaskFileFilterCaseSensitive
                            );
                            if (regexError) {
                                new Notice(formatI18n(folderTaskFilterI18n.invalidRegexNotice, { message: regexError }), 9000);
                            }
                        }
                    }));

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(folderTaskFilterI18n.patternName)
                    .setDesc(folderTaskFilterI18n.patternDesc),
                {
                    placeholder: folderTaskFilterI18n.patternPlaceholder,
                    value: this.plugin.settings.folderTaskFileFilterPattern,
                    onCommit: async (value) => {
                        this.plugin.settings.folderTaskFileFilterPattern = value;
                        await this.plugin.saveSettings();
                        if (this.plugin.settings.folderTaskFileFilterMode === 'regex') {
                            const regexError = getFolderTaskRegexValidationError(
                                value,
                                this.plugin.settings.folderTaskFileFilterCaseSensitive
                            );
                            if (regexError) {
                                new Notice(formatI18n(folderTaskFilterI18n.invalidRegexNotice, { message: regexError }), 9000);
                            }
                        }
                    }
                }
            );

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.syntaxGuideName)
                .setDesc(folderTaskFilterI18n.syntaxGuideDesc);

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.targetName)
                .setDesc(folderTaskFilterI18n.targetDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('relativePath', folderTaskFilterI18n.targetRelativePath)
                    .addOption('basename', folderTaskFilterI18n.targetBasename)
                    .setValue(this.plugin.settings.folderTaskFileFilterTarget)
                    .onChange(async (value: 'relativePath' | 'basename') => {
                        this.plugin.settings.folderTaskFileFilterTarget = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.caseSensitiveName)
                .setDesc(folderTaskFilterI18n.caseSensitiveDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.folderTaskFileFilterCaseSensitive)
                    .onChange(async (value) => {
                        this.plugin.settings.folderTaskFileFilterCaseSensitive = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.invertName)
                .setDesc(folderTaskFilterI18n.invertDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.folderTaskFileFilterInvert)
                    .onChange(async (value) => {
                        this.plugin.settings.folderTaskFileFilterInvert = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(folderTaskFilterI18n.includeSubfoldersName)
                .setDesc(folderTaskFilterI18n.includeSubfoldersDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('legacy', folderTaskFilterI18n.includeSubfoldersLegacy)
                    .addOption('include', folderTaskFilterI18n.includeSubfoldersInclude)
                    .addOption('exclude', folderTaskFilterI18n.includeSubfoldersExclude)
                    .setValue(this.plugin.settings.folderTaskIncludeSubfoldersMode)
                    .onChange(async (value: 'legacy' | 'include' | 'exclude') => {
                        this.plugin.settings.folderTaskIncludeSubfoldersMode = value;
                        await this.plugin.saveSettings();
                    }));

            this.renderFolderTaskFileSelectionProfileManager(containerEl, folderTaskFilterI18n);
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(translationTaskI18n.savePathName)
                    .setDesc(translationTaskI18n.savePathDesc),
                {
                    placeholder: translationTaskI18n.savePathPlaceholder,
                    value: this.plugin.settings.translationSavePath,
                    onCommit: async (value) => {
                        this.plugin.settings.translationSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(translationTaskI18n.customSuffixName)
                    .setDesc(translationTaskI18n.customSuffixDesc),
                {
                    placeholder: translationTaskI18n.customSuffixPlaceholder,
                    value: this.plugin.settings.translationCustomSuffix,
                    onCommit: async (value) => {
                        this.plugin.settings.translationCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(mermaidTaskI18n.savePathName)
                    .setDesc(mermaidTaskI18n.savePathDesc),
                {
                    placeholder: mermaidTaskI18n.savePathPlaceholder,
                    value: this.plugin.settings.summarizeToMermaidSavePath,
                    onCommit: async (value) => {
                        this.plugin.settings.summarizeToMermaidSavePath = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(mermaidTaskI18n.customSuffixName)
                    .setDesc(mermaidTaskI18n.customSuffixDesc),
                {
                    placeholder: mermaidTaskI18n.customSuffixPlaceholder,
                    value: this.plugin.settings.summarizeToMermaidCustomSuffix,
                    onCommit: async (value) => {
                        this.plugin.settings.summarizeToMermaidCustomSuffix = value;
                        await this.plugin.saveSettings();
                    }
                }
            );
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

        new Setting(containerEl)
            .setName(extractConceptsTaskI18n.replaceSynonymsName)
            .setDesc(extractConceptsTaskI18n.replaceSynonymsDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.replaceSynonymsDuringConceptExtraction)
                .onChange(async (value) => {
                    this.plugin.settings.replaceSynonymsDuringConceptExtraction = value;
                    await this.plugin.saveSettings();
                }));

        // --- Stable API Call Settings ---
        new Setting(containerEl).setName(stableApiI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(stableApiI18n.enableName)
            .setDesc(stableApiI18n.enableDesc)
            .addToggle(toggle => toggle.setValue(this.plugin.settings.enableStableApiCall).onChange(async (value) => { this.plugin.settings.enableStableApiCall = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.enableStableApiCall) {
            this.addDeferredNumberSetting(
                new Setting(containerEl).setName(stableApiI18n.retryIntervalName).setDesc(stableApiI18n.retryIntervalDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.apiCallInterval),
                    value: this.plugin.settings.apiCallInterval,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.apiCallInterval = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.apiCallInterval, 1, 300);
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.apiCallInterval);
                    }
                }
            );
            this.addDeferredNumberSetting(
                new Setting(containerEl).setName(stableApiI18n.maxRetriesName).setDesc(stableApiI18n.maxRetriesDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.apiCallMaxRetries),
                    value: this.plugin.settings.apiCallMaxRetries,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.apiCallMaxRetries = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.apiCallMaxRetries, 0, 10);
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.apiCallMaxRetries);
                    }
                }
            );
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

        const experimentalDiagramI18n = i18n.settings.developer.experimentalDiagramPipeline;

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
                dropdown
                    .setValue(this.plugin.settings.experimentalDiagramCompatibilityMode)
                    .onChange(async (value: 'legacy-mermaid' | 'best-fit') => {
                        this.plugin.settings.experimentalDiagramCompatibilityMode = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName(experimentalDiagramI18n.intentName)
            .setDesc(experimentalDiagramI18n.intentDesc)
            .addDropdown(dropdown => {
                dropdown.addOption('auto', experimentalDiagramI18n.intentAuto);
                dropdown.addOption('flowchart', experimentalDiagramI18n.intentFlowchart);
                dropdown.addOption('sequence', experimentalDiagramI18n.intentSequence);
                dropdown.addOption('classDiagram', experimentalDiagramI18n.intentClassDiagram);
                dropdown.addOption('erDiagram', experimentalDiagramI18n.intentErDiagram);
                dropdown.addOption('stateDiagram', experimentalDiagramI18n.intentStateDiagram);
                dropdown.addOption('circuit', experimentalDiagramI18n.intentCircuit);
                dropdown.addOption('dataChart', experimentalDiagramI18n.intentDataChart);
                dropdown
                    .setValue(this.plugin.settings.preferredDiagramIntent || 'auto')
                    .onChange(async (value: string) => {
                        applyDiagramIntentPreference(
                            this.plugin.settings,
                            value === 'auto' ? undefined : value as DiagramIntent
                        );
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(experimentalDiagramI18n.renderTargetName)
            .setDesc(experimentalDiagramI18n.renderTargetDesc)
            .addDropdown(dropdown => {
                dropdown.addOption('auto', experimentalDiagramI18n.renderTargetAuto);
                dropdown.addOption('mermaid', experimentalDiagramI18n.renderTargetMermaid);
                dropdown.addOption('json-canvas', experimentalDiagramI18n.renderTargetJsonCanvas);
                dropdown.addOption('vega-lite', experimentalDiagramI18n.renderTargetVegaLite);
                dropdown.addOption('html', experimentalDiagramI18n.renderTargetHtml);
                dropdown.addOption('editable-html-svg', experimentalDiagramI18n.renderTargetEditableHtmlSvg);
                dropdown.addOption('drawio', experimentalDiagramI18n.renderTargetDrawio);
                dropdown.addOption('drawnix', experimentalDiagramI18n.renderTargetDrawnix);
                dropdown.addOption('circuitikz', experimentalDiagramI18n.renderTargetCircuitikz);
                dropdown
                    .setValue(this.plugin.settings.preferredDiagramRenderTarget || 'auto')
                    .onChange(async (value: string) => {
                        this.plugin.settings.preferredDiagramRenderTarget = value === 'auto'
                            ? undefined
                            : value as RenderTarget;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName(experimentalDiagramI18n.exportFormatsName)
            .setDesc(experimentalDiagramI18n.exportFormatsDesc);

        new Setting(containerEl)
            .setName(experimentalDiagramI18n.exportPpiName)
            .setDesc(experimentalDiagramI18n.exportPpiDesc)
            .addText(text => text
                .setPlaceholder(String(DEFAULT_SETTINGS.diagramPreviewExportPpi))
                .setValue(String(this.plugin.settings.diagramPreviewExportPpi ?? DEFAULT_SETTINGS.diagramPreviewExportPpi))
                .onChange(async (rawValue) => {
                    this.plugin.settings.diagramPreviewExportPpi = this.sanitizePositiveInteger(
                        rawValue,
                        DEFAULT_SETTINGS.diagramPreviewExportPpi,
                        MIN_PREVIEW_EXPORT_PPI,
                        MAX_PREVIEW_EXPORT_PPI
                    );
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

        if (this.plugin.settings.enableDeveloperMode) {
            new Setting(containerEl).setName(i18n.settings.developer.heading).setHeading();
            new Setting(containerEl)
                .setName(i18n.settings.developer.advancedFileSelectionName)
                .setDesc(i18n.settings.developer.advancedFileSelectionDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableAdvancedFileSelectionProfiles)
                    .onChange(async (value) => {
                        this.plugin.settings.enableAdvancedFileSelectionProfiles = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            new Setting(containerEl)
                .setName(i18n.settings.developer.relaxedInputFileTypesName)
                .setDesc(i18n.settings.developer.relaxedInputFileTypesDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableRelaxedInputFileTypes)
                    .onChange(async (value) => {
                        this.plugin.settings.enableRelaxedInputFileTypes = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        }

        if (this.plugin.settings.enableDeveloperMode && activeProvider) {
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
                .addText(text => {
                    text
                        .setPlaceholder(String(Math.floor(DEFAULT_SETTINGS.developerDiagnosticTimeoutMs / 1000)))
                        .setValue(String(Math.floor(this.sanitizeDeveloperDiagnosticTimeoutMs(this.plugin.settings.developerDiagnosticTimeoutMs) / 1000)));
                    let lastCommitted = text.getValue();
                    const commit = async () => {
                        const value = text.getValue();
                        if (value === lastCommitted) {
                            return;
                        }
                        const num = Number.parseInt(value, 10);
                        if (Number.isFinite(num)) {
                            this.plugin.settings.developerDiagnosticTimeoutMs = this.sanitizeDeveloperDiagnosticTimeoutMs(num * 1000);
                        } else {
                            this.plugin.settings.developerDiagnosticTimeoutMs = DEFAULT_SETTINGS.developerDiagnosticTimeoutMs;
                        }
                        await this.plugin.saveSettings();
                        text.setValue(String(Math.floor(this.plugin.settings.developerDiagnosticTimeoutMs / 1000)));
                        lastCommitted = text.getValue();
                    };
                    text.inputEl.addEventListener('blur', () => { void commit(); });
                    text.inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void commit();
                            text.inputEl.blur();
                        }
                    });
                });

            new Setting(containerEl)
                .setName(stableApiI18n.stabilityRunsName)
                .setDesc(stableApiI18n.stabilityRunsDesc)
                .addText(text => {
                    text
                        .setPlaceholder(String(DEFAULT_SETTINGS.developerDiagnosticStabilityRuns))
                        .setValue(String(this.sanitizeDeveloperDiagnosticRuns(this.plugin.settings.developerDiagnosticStabilityRuns)));
                    let lastCommitted = text.getValue();
                    const commit = async () => {
                        const value = text.getValue();
                        if (value === lastCommitted) {
                            return;
                        }
                        const num = Number.parseInt(value, 10);
                        if (Number.isFinite(num)) {
                            this.plugin.settings.developerDiagnosticStabilityRuns = this.sanitizeDeveloperDiagnosticRuns(num);
                        } else {
                            this.plugin.settings.developerDiagnosticStabilityRuns = DEFAULT_SETTINGS.developerDiagnosticStabilityRuns;
                        }
                        await this.plugin.saveSettings();
                        text.setValue(String(this.plugin.settings.developerDiagnosticStabilityRuns));
                        lastCommitted = text.getValue();
                    };
                    text.inputEl.addEventListener('blur', () => { void commit(); });
                    text.inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void commit();
                            text.inputEl.blur();
                        }
                    });
                });

            new Setting(containerEl)
                .setName(stableApiI18n.longRequestName)
                .setDesc(stableApiI18n.longRequestDesc)
                .addButton(button => button
                    .setButtonText(i18n.settings.developer.runDiagnostic)
                    .onClick(async () => {
                        this.plugin.settings.developerDiagnosticCallMode = effectiveCallMode;
                        await this.plugin.saveSettings();
                        await this.plugin.runDeveloperProviderDiagnosticCommand();
                    }))
                .addButton(button => button
                    .setButtonText(i18n.settings.developer.runStability)
                    .onClick(async () => {
                        this.plugin.settings.developerDiagnosticCallMode = effectiveCallMode;
                        await this.plugin.saveSettings();
                        await this.plugin.runDeveloperProviderStabilityDiagnosticCommand();
                    }));
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

        new Setting(containerEl).setName(localKnowledgeI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(localKnowledgeI18n.enableName)
            .setDesc(localKnowledgeI18n.enableDesc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableLocalKnowledgeRetrieval)
                .onChange(async (value) => {
                    this.plugin.settings.enableLocalKnowledgeRetrieval = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.enableLocalKnowledgeRetrieval) {
            type LocalKnowledgePathSettingKey =
                | 'localKnowledgeBasePaths'
                | 'localKnowledgeGenerateTitlePaths'
                | 'localKnowledgeBatchGenerateFromTitlesPaths'
                | 'localKnowledgeResearchSummarizePaths'
                | 'localKnowledgeDiagramGenerationPaths';

            const addLocalKnowledgePathSetting = (
                name: string,
                desc: string,
                placeholder: string,
                settingKey: LocalKnowledgePathSettingKey
            ) => {
                this.addDeferredTextAreaSetting(
                    new Setting(containerEl)
                        .setName(name)
                        .setDesc(desc),
                    {
                        placeholder,
                        value: this.plugin.settings[settingKey],
                        onCommit: async (value) => {
                            this.plugin.settings[settingKey] = this.normalizeMultilinePathSetting(value);
                            await this.plugin.saveSettings();
                        }
                    }
                );
            };

            addLocalKnowledgePathSetting(
                localKnowledgeI18n.pathsName,
                localKnowledgeI18n.pathsDesc,
                localKnowledgeI18n.pathsPlaceholder,
                'localKnowledgeBasePaths'
            );

            this.addDeferredNumberSetting(
                new Setting(containerEl)
                    .setName(localKnowledgeI18n.topKName)
                    .setDesc(localKnowledgeI18n.topKDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.localKnowledgeTopK),
                    value: this.plugin.settings.localKnowledgeTopK,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.localKnowledgeTopK = this.sanitizePositiveInteger(
                            rawValue,
                            DEFAULT_SETTINGS.localKnowledgeTopK,
                            1,
                            20
                        );
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.localKnowledgeTopK);
                    }
                }
            );

            this.addDeferredNumberSetting(
                new Setting(containerEl)
                    .setName(localKnowledgeI18n.slidingWindowSizeName)
                    .setDesc(localKnowledgeI18n.slidingWindowSizeDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.localKnowledgeSlidingWindowSize),
                    value: this.plugin.settings.localKnowledgeSlidingWindowSize,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.localKnowledgeSlidingWindowSize = this.sanitizePositiveInteger(
                            rawValue,
                            DEFAULT_SETTINGS.localKnowledgeSlidingWindowSize,
                            0,
                            10
                        );
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.localKnowledgeSlidingWindowSize);
                    }
                }
            );

            this.addDeferredNumberSetting(
                new Setting(containerEl)
                    .setName(localKnowledgeI18n.maxSnippetCharsName)
                    .setDesc(localKnowledgeI18n.maxSnippetCharsDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.localKnowledgeMaxSnippetChars),
                    value: this.plugin.settings.localKnowledgeMaxSnippetChars,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.localKnowledgeMaxSnippetChars = this.sanitizePositiveInteger(
                            rawValue,
                            DEFAULT_SETTINGS.localKnowledgeMaxSnippetChars,
                            100,
                            10_000
                        );
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.localKnowledgeMaxSnippetChars);
                    }
                }
            );

            new Setting(containerEl)
                .setName(localKnowledgeI18n.excludeCurrentFileName)
                .setDesc(localKnowledgeI18n.excludeCurrentFileDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.localKnowledgeExcludeCurrentFile)
                    .onChange(async (value) => {
                        this.plugin.settings.localKnowledgeExcludeCurrentFile = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(localKnowledgeI18n.generateTitleName)
                .setDesc(localKnowledgeI18n.generateTitleDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableLocalKnowledgeForGenerateTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.enableLocalKnowledgeForGenerateTitle = value;
                        await this.plugin.saveSettings();
                    }));

            addLocalKnowledgePathSetting(
                localKnowledgeI18n.generateTitlePathsName,
                localKnowledgeI18n.generateTitlePathsDesc,
                localKnowledgeI18n.taskPathsPlaceholder,
                'localKnowledgeGenerateTitlePaths'
            );

            new Setting(containerEl)
                .setName(localKnowledgeI18n.batchGenerateName)
                .setDesc(localKnowledgeI18n.batchGenerateDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableLocalKnowledgeForBatchGenerateFromTitles)
                    .onChange(async (value) => {
                        this.plugin.settings.enableLocalKnowledgeForBatchGenerateFromTitles = value;
                        await this.plugin.saveSettings();
                    }));

            addLocalKnowledgePathSetting(
                localKnowledgeI18n.batchGeneratePathsName,
                localKnowledgeI18n.batchGeneratePathsDesc,
                localKnowledgeI18n.taskPathsPlaceholder,
                'localKnowledgeBatchGenerateFromTitlesPaths'
            );

            new Setting(containerEl)
                .setName(localKnowledgeI18n.researchSummarizeName)
                .setDesc(localKnowledgeI18n.researchSummarizeDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableLocalKnowledgeForResearchSummarize)
                    .onChange(async (value) => {
                        this.plugin.settings.enableLocalKnowledgeForResearchSummarize = value;
                        await this.plugin.saveSettings();
                    }));

            addLocalKnowledgePathSetting(
                localKnowledgeI18n.researchSummarizePathsName,
                localKnowledgeI18n.researchSummarizePathsDesc,
                localKnowledgeI18n.taskPathsPlaceholder,
                'localKnowledgeResearchSummarizePaths'
            );

            new Setting(containerEl)
                .setName(localKnowledgeI18n.generateDiagramName)
                .setDesc(localKnowledgeI18n.generateDiagramDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableLocalKnowledgeForDiagramGeneration)
                    .onChange(async (value) => {
                        this.plugin.settings.enableLocalKnowledgeForDiagramGeneration = value;
                        await this.plugin.saveSettings();
                    }));

            addLocalKnowledgePathSetting(
                localKnowledgeI18n.generateDiagramPathsName,
                localKnowledgeI18n.generateDiagramPathsDesc,
                localKnowledgeI18n.taskPathsPlaceholder,
                'localKnowledgeDiagramGenerationPaths'
            );
        }

        new Setting(containerEl).setName(chapterSplitI18n.heading).setHeading();
        new Setting(containerEl)
            .setName(chapterSplitI18n.headingLevelName)
            .setDesc(chapterSplitI18n.headingLevelDesc)
            .addDropdown(dropdown => dropdown
                .addOption('auto', chapterSplitI18n.headingLevelAuto)
                .addOption('h1', chapterSplitI18n.headingLevelH1)
                .addOption('h2', chapterSplitI18n.headingLevelH2)
                .addOption('h3', chapterSplitI18n.headingLevelH3)
                .addOption('h4', chapterSplitI18n.headingLevelH4)
                .addOption('h5', chapterSplitI18n.headingLevelH5)
                .addOption('h6', chapterSplitI18n.headingLevelH6)
                .setValue(this.plugin.settings.chapterSplitHeadingLevel)
                .onChange(async (value) => {
                    this.plugin.settings.chapterSplitHeadingLevel = value as typeof this.plugin.settings.chapterSplitHeadingLevel;
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
            .setName(i18n.settings.extractOriginalText.batchModeName)
            .setDesc(i18n.settings.extractOriginalText.batchModeDesc);

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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.generateTitleOutput.customFolderName)
                    .setDesc(i18n.settings.generateTitleOutput.customFolderDesc),
                {
                    placeholder: DEFAULT_SETTINGS.generateTitleOutputFolderName,
                    value: this.plugin.settings.generateTitleOutputFolderName,
                    onCommit: async (value) => {
                        this.plugin.settings.generateTitleOutputFolderName = value.trim() || DEFAULT_SETTINGS.generateTitleOutputFolderName;
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.webResearch.tavilyApiKeyName)
                    .setDesc(i18n.settings.webResearch.tavilyApiKeyDesc),
                {
                    placeholder: i18n.settings.webResearch.tavilyApiKeyPlaceholder,
                    value: this.plugin.settings.tavilyApiKey,
                    onCommit: async (value) => {
                        this.plugin.settings.tavilyApiKey = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
            this.addDeferredNumberSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.webResearch.tavilyMaxResultsName)
                    .setDesc(i18n.settings.webResearch.tavilyMaxResultsDesc),
                {
                    placeholder: String(DEFAULT_SETTINGS.tavilyMaxResults),
                    value: this.plugin.settings.tavilyMaxResults,
                    onCommit: async (rawValue) => {
                        this.plugin.settings.tavilyMaxResults = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.tavilyMaxResults, 1, 20);
                        await this.plugin.saveSettings();
                        return String(this.plugin.settings.tavilyMaxResults);
                    }
                }
            );
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
        this.addDeferredNumberSetting(
            new Setting(containerEl)
                .setName(i18n.settings.webResearch.maxResearchTokensName)
                .setDesc(i18n.settings.webResearch.maxResearchTokensDesc),
            {
                placeholder: String(DEFAULT_SETTINGS.maxResearchContentTokens),
                value: this.plugin.settings.maxResearchContentTokens,
                onCommit: async (rawValue) => {
                    this.plugin.settings.maxResearchContentTokens = this.sanitizePositiveInteger(rawValue, DEFAULT_SETTINGS.maxResearchContentTokens, 100);
                    await this.plugin.saveSettings();
                    return String(this.plugin.settings.maxResearchContentTokens);
                }
            }
        );


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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.extractOriginalText.savePathName)
                    .setDesc(i18n.settings.extractOriginalText.savePathDesc),
                {
                    placeholder: i18n.settings.extractOriginalText.savePathPlaceholder,
                    value: this.plugin.settings.extractOriginalTextCustomPath,
                    onCommit: async (value) => {
                        this.plugin.settings.extractOriginalTextCustomPath = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.extractOriginalText.customSuffixName)
                    .setDesc(i18n.settings.extractOriginalText.customSuffixDesc),
                {
                    placeholder: i18n.settings.extractOriginalText.customSuffixPlaceholder,
                    value: this.plugin.settings.extractOriginalTextCustomSuffix,
                    onCommit: async (value) => {
                        this.plugin.settings.extractOriginalTextCustomSuffix = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.batchMermaidFix.errorFolderPathName)
                    .setDesc(i18n.settings.batchMermaidFix.errorFolderPathDesc),
                {
                    placeholder: i18n.settings.batchMermaidFix.errorFolderPathPlaceholder,
                    value: this.plugin.settings.mermaidErrorFolderPath,
                    onCommit: async (value) => {
                        this.plugin.settings.mermaidErrorFolderPath = value.trim();
                        await this.plugin.saveSettings();
                    }
                }
            );
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
            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.settings.focusedLearning.domainName)
                    .setDesc(i18n.settings.focusedLearning.domainDesc),
                {
                    placeholder: i18n.settings.focusedLearning.domainPlaceholder,
                    value: this.plugin.settings.focusedLearningDomain,
                    onCommit: async (value) => {
                        this.plugin.settings.focusedLearningDomain = value;
                        await this.plugin.saveSettings();
                    }
                }
            );
        }

        // --- Slide Export (Desktop only) ---
        if ((globalThis as any).Platform?.isDesktopApp !== false) {
            containerEl.createEl('hr');
            new Setting(containerEl).setName(i18n.slideExport.settingsHeading).setHeading();

            new Setting(containerEl)
                .setName(i18n.slideExport.enableName)
                .setDesc(i18n.slideExport.enableDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableSlideExport)
                    .onChange(async (value) => {
                        this.plugin.settings.enableSlideExport = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName(i18n.slideExport.defaultFormatName)
                .setDesc(i18n.slideExport.defaultFormatDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('html', 'HTML')
                    .addOption('pdf', 'PDF')
                    .addOption('png', 'PNG')
                    .addOption('pptx', 'PPTX')
                    .addOption('mp4', 'MP4')
                    .setValue(this.plugin.settings.slideExportDefaultFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.slideExportDefaultFormat = value as any;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.slideExportDefaultFormat === 'html') {
                new Setting(containerEl)
                    .setName(i18n.slideExport.htmlModeName)
                    .setDesc(i18n.slideExport.htmlModeDesc)
                    .addDropdown(dropdown => dropdown
                        .addOption('standalone', i18n.slideExport.htmlModeStandalone)
                        .addOption('server-script', i18n.slideExport.htmlModeServer)
                        .setValue(this.plugin.settings.slideExportHtmlMode)
                        .onChange(async (value) => {
                            this.plugin.settings.slideExportHtmlMode = value as 'standalone' | 'server-script';
                            await this.plugin.saveSettings();
                        }));
            }

            if (this.plugin.settings.slideExportDefaultFormat === 'pptx') {
                this.addPptxFontFaceSetting(
                    containerEl,
                    'slideExportPptxLatinFontFace',
                    SLIDEV_PPTX_LATIN_FONT_FACE_PRESETS,
                    i18n.slideExport.pptxLatinFontName,
                    i18n.slideExport.pptxLatinFontDesc,
                    'Noto Sans',
                    i18n.slideExport.pptxCustomSystemFontOption
                );
                this.addPptxFontFaceSetting(
                    containerEl,
                    'slideExportPptxEastAsiaFontFace',
                    SLIDEV_PPTX_EAST_ASIA_FONT_FACE_PRESETS,
                    i18n.slideExport.pptxEastAsiaFontName,
                    i18n.slideExport.pptxEastAsiaFontDesc,
                    'Microsoft YaHei',
                    i18n.slideExport.pptxCustomSystemFontOption
                );
                this.addPptxFontFaceSetting(
                    containerEl,
                    'slideExportPptxMonospaceFontFace',
                    SLIDEV_PPTX_MONOSPACE_FONT_FACE_PRESETS,
                    i18n.slideExport.pptxMonospaceFontName,
                    i18n.slideExport.pptxMonospaceFontDesc,
                    'DejaVu Sans Mono',
                    i18n.slideExport.pptxCustomSystemFontOption
                );
            }

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.slideExport.outputSubfolderName)
                    .setDesc(i18n.slideExport.outputSubfolderDesc),
                {
                    placeholder: 'slidev-export',
                    value: this.plugin.settings.slideExportOutputSubfolder,
                    onCommit: async (value) => {
                        this.plugin.settings.slideExportOutputSubfolder = value;
                        await this.plugin.saveSettings();
                    }
                }
            );

            this.addDeferredTextSetting(
                new Setting(containerEl)
                    .setName(i18n.slideExport.themeName)
                    .setDesc(i18n.slideExport.themeDesc),
                {
                    placeholder: i18n.slideExport.themePlaceholder,
                    value: this.plugin.settings.slideExportTheme,
                    onCommit: async (value) => {
                        this.plugin.settings.slideExportTheme = value;
                        await this.plugin.saveSettings();
                    }
                }
            );

            new Setting(containerEl)
                .setName(i18n.slideExport.imageClarityName)
                .setDesc(i18n.slideExport.imageClarityDesc)
                .addDropdown(dropdown => dropdown
                    .addOption('standard', i18n.slideExport.imageClarityStandard)
                    .addOption('high', i18n.slideExport.imageClarityHigh)
                    .addOption('ultra', i18n.slideExport.imageClarityUltra)
                    .setValue(this.plugin.settings.slideExportImageClarity)
                    .onChange(async (value) => {
                        this.plugin.settings.slideExportImageClarity = value as 'standard' | 'high' | 'ultra';
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(i18n.slideExport.withClicksName)
                .setDesc(i18n.slideExport.withClicksDesc)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.slideExportWithClicks)
                    .onChange(async (value) => {
                        this.plugin.settings.slideExportWithClicks = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(i18n.slideExport.ffmpegFpsName)
                .setDesc(i18n.slideExport.ffmpegFpsDesc)
                .addText(text => text
                    .setValue(String(this.plugin.settings.slideExportFfmpegFps))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num > 0) {
                            this.plugin.settings.slideExportFfmpegFps = num;
                            await this.plugin.saveSettings();
                        }
                    }));

            new Setting(containerEl)
                .setName(i18n.slideExport.ffmpegCrfName)
                .setDesc(i18n.slideExport.ffmpegCrfDesc)
                .addText(text => text
                    .setValue(String(this.plugin.settings.slideExportFfmpegCrf))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 0 && num <= 51) {
                            this.plugin.settings.slideExportFfmpegCrf = num;
                            await this.plugin.saveSettings();
                        }
                    }));

            new Setting(containerEl)
                .setName(i18n.slideExport.timeoutName)
                .setDesc(i18n.slideExport.timeoutDesc)
                .addText(text => text
                    .setValue(String(this.plugin.settings.slideExportTimeoutMs / 1000))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num > 0) {
                            this.plugin.settings.slideExportTimeoutMs = num * 1000;
                            await this.plugin.saveSettings();
                        }
                    }));
        }
        this.enhanceSettingsDiscovery(containerEl);
    }
}
