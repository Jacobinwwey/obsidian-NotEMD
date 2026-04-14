import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale remaining settings coverage', () => {
    const assertLocalizedForAllAdvertisedLocales = (
        fields: Array<{ label: string; get: (strings: ReturnType<typeof getResolvedStrings>) => string }>
    ) => {
        const en = getResolvedStrings('en');

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of fields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    };

    test('ships localized stable api settings copy for all advertised locales', () => {
        assertLocalizedForAllAdvertisedLocales([
            { label: 'settings.stableApi.enableName', get: strings => strings.settings.stableApi.enableName },
            { label: 'settings.stableApi.enableDesc', get: strings => strings.settings.stableApi.enableDesc },
            { label: 'settings.stableApi.retryIntervalName', get: strings => strings.settings.stableApi.retryIntervalName },
            { label: 'settings.stableApi.retryIntervalDesc', get: strings => strings.settings.stableApi.retryIntervalDesc },
            { label: 'settings.stableApi.maxRetriesName', get: strings => strings.settings.stableApi.maxRetriesName },
            { label: 'settings.stableApi.maxRetriesDesc', get: strings => strings.settings.stableApi.maxRetriesDesc },
            { label: 'settings.stableApi.debugModeName', get: strings => strings.settings.stableApi.debugModeName },
            { label: 'settings.stableApi.debugModeDesc', get: strings => strings.settings.stableApi.debugModeDesc },
            { label: 'settings.stableApi.diagnosticCallModeName', get: strings => strings.settings.stableApi.diagnosticCallModeName },
            { label: 'settings.stableApi.diagnosticCallModeDesc', get: strings => strings.settings.stableApi.diagnosticCallModeDesc },
            { label: 'settings.stableApi.diagnosticTimeoutName', get: strings => strings.settings.stableApi.diagnosticTimeoutName },
            { label: 'settings.stableApi.diagnosticTimeoutDesc', get: strings => strings.settings.stableApi.diagnosticTimeoutDesc },
            { label: 'settings.stableApi.stabilityRunsName', get: strings => strings.settings.stableApi.stabilityRunsName },
            { label: 'settings.stableApi.stabilityRunsDesc', get: strings => strings.settings.stableApi.stabilityRunsDesc },
            { label: 'settings.stableApi.longRequestName', get: strings => strings.settings.stableApi.longRequestName },
            { label: 'settings.stableApi.longRequestDesc', get: strings => strings.settings.stableApi.longRequestDesc }
        ]);
    });

    test('ships localized web research settings copy for all advertised locales', () => {
        assertLocalizedForAllAdvertisedLocales([
            { label: 'settings.webResearch.searchProviderName', get: strings => strings.settings.webResearch.searchProviderName },
            { label: 'settings.webResearch.searchProviderDesc', get: strings => strings.settings.webResearch.searchProviderDesc },
            { label: 'settings.webResearch.tavilyOption', get: strings => strings.settings.webResearch.tavilyOption },
            { label: 'settings.webResearch.duckduckgoOption', get: strings => strings.settings.webResearch.duckduckgoOption },
            { label: 'settings.webResearch.tavilyApiKeyName', get: strings => strings.settings.webResearch.tavilyApiKeyName },
            { label: 'settings.webResearch.tavilyApiKeyDesc', get: strings => strings.settings.webResearch.tavilyApiKeyDesc },
            { label: 'settings.webResearch.tavilyApiKeyPlaceholder', get: strings => strings.settings.webResearch.tavilyApiKeyPlaceholder },
            { label: 'settings.webResearch.tavilyMaxResultsName', get: strings => strings.settings.webResearch.tavilyMaxResultsName },
            { label: 'settings.webResearch.tavilyMaxResultsDesc', get: strings => strings.settings.webResearch.tavilyMaxResultsDesc },
            { label: 'settings.webResearch.tavilySearchDepthName', get: strings => strings.settings.webResearch.tavilySearchDepthName },
            { label: 'settings.webResearch.tavilySearchDepthDesc', get: strings => strings.settings.webResearch.tavilySearchDepthDesc },
            { label: 'settings.webResearch.tavilySearchDepthBasic', get: strings => strings.settings.webResearch.tavilySearchDepthBasic },
            { label: 'settings.webResearch.tavilySearchDepthAdvanced', get: strings => strings.settings.webResearch.tavilySearchDepthAdvanced },
            { label: 'settings.webResearch.duckduckgoMaxResultsName', get: strings => strings.settings.webResearch.duckduckgoMaxResultsName },
            { label: 'settings.webResearch.duckduckgoMaxResultsDesc', get: strings => strings.settings.webResearch.duckduckgoMaxResultsDesc },
            { label: 'settings.webResearch.duckduckgoFetchTimeoutName', get: strings => strings.settings.webResearch.duckduckgoFetchTimeoutName },
            { label: 'settings.webResearch.duckduckgoFetchTimeoutDesc', get: strings => strings.settings.webResearch.duckduckgoFetchTimeoutDesc },
            { label: 'settings.webResearch.maxResearchTokensName', get: strings => strings.settings.webResearch.maxResearchTokensName },
            { label: 'settings.webResearch.maxResearchTokensDesc', get: strings => strings.settings.webResearch.maxResearchTokensDesc }
        ]);
    });

    test('ships localized duplicate scope settings copy for all advertised locales', () => {
        assertLocalizedForAllAdvertisedLocales([
            { label: 'settings.duplicateScope.modeName', get: strings => strings.settings.duplicateScope.modeName },
            { label: 'settings.duplicateScope.modeDesc', get: strings => strings.settings.duplicateScope.modeDesc },
            { label: 'settings.duplicateScope.optionVault', get: strings => strings.settings.duplicateScope.optionVault },
            { label: 'settings.duplicateScope.optionInclude', get: strings => strings.settings.duplicateScope.optionInclude },
            { label: 'settings.duplicateScope.optionExclude', get: strings => strings.settings.duplicateScope.optionExclude },
            { label: 'settings.duplicateScope.optionConceptFolderOnly', get: strings => strings.settings.duplicateScope.optionConceptFolderOnly },
            { label: 'settings.duplicateScope.includeFoldersName', get: strings => strings.settings.duplicateScope.includeFoldersName },
            { label: 'settings.duplicateScope.excludeFoldersName', get: strings => strings.settings.duplicateScope.excludeFoldersName },
            { label: 'settings.duplicateScope.pathsDesc', get: strings => strings.settings.duplicateScope.pathsDesc },
            { label: 'settings.duplicateScope.pathsModeInclude', get: strings => strings.settings.duplicateScope.pathsModeInclude },
            { label: 'settings.duplicateScope.pathsModeExclude', get: strings => strings.settings.duplicateScope.pathsModeExclude },
            { label: 'settings.duplicateScope.pathsPlaceholder', get: strings => strings.settings.duplicateScope.pathsPlaceholder },
            { label: 'settings.duplicateScope.invalidPathNotice', get: strings => strings.settings.duplicateScope.invalidPathNotice },
            { label: 'settings.duplicateScope.invalidCharacterNotice', get: strings => strings.settings.duplicateScope.invalidCharacterNotice },
            { label: 'settings.duplicateScope.emptyPathsNotice', get: strings => strings.settings.duplicateScope.emptyPathsNotice },
            { label: 'settings.duplicateScope.invalidPathsNotSaved', get: strings => strings.settings.duplicateScope.invalidPathsNotSaved }
        ]);
    });

    test('ships localized custom prompt settings copy for all advertised locales', () => {
        assertLocalizedForAllAdvertisedLocales([
            { label: 'settings.customPrompts.taskToggleName', get: strings => strings.settings.customPrompts.taskToggleName },
            { label: 'settings.customPrompts.taskToggleDesc', get: strings => strings.settings.customPrompts.taskToggleDesc },
            { label: 'settings.customPrompts.copyDefaultButton', get: strings => strings.settings.customPrompts.copyDefaultButton },
            { label: 'settings.customPrompts.copyDefaultNotice', get: strings => strings.settings.customPrompts.copyDefaultNotice },
            { label: 'settings.customPrompts.defaultPromptLabel', get: strings => strings.settings.customPrompts.defaultPromptLabel },
            { label: 'settings.customPrompts.customPromptName', get: strings => strings.settings.customPrompts.customPromptName },
            { label: 'settings.customPrompts.customPromptDesc', get: strings => strings.settings.customPrompts.customPromptDesc },
            { label: 'settings.customPrompts.customPromptPlaceholder', get: strings => strings.settings.customPrompts.customPromptPlaceholder }
        ]);
    });

    test('ships localized experimental diagram pipeline settings copy for all advertised locales', () => {
        assertLocalizedForAllAdvertisedLocales([
            { label: 'settings.developer.experimentalDiagramPipeline.heading', get: strings => strings.settings.developer.experimentalDiagramPipeline.heading },
            { label: 'settings.developer.experimentalDiagramPipeline.enableName', get: strings => strings.settings.developer.experimentalDiagramPipeline.enableName },
            { label: 'settings.developer.experimentalDiagramPipeline.enableDesc', get: strings => strings.settings.developer.experimentalDiagramPipeline.enableDesc },
            { label: 'settings.developer.experimentalDiagramPipeline.compatibilityName', get: strings => strings.settings.developer.experimentalDiagramPipeline.compatibilityName },
            { label: 'settings.developer.experimentalDiagramPipeline.compatibilityDesc', get: strings => strings.settings.developer.experimentalDiagramPipeline.compatibilityDesc },
            { label: 'settings.developer.experimentalDiagramPipeline.compatibilityLegacy', get: strings => strings.settings.developer.experimentalDiagramPipeline.compatibilityLegacy },
            { label: 'settings.developer.experimentalDiagramPipeline.compatibilityBestFit', get: strings => strings.settings.developer.experimentalDiagramPipeline.compatibilityBestFit }
        ]);
    });
});
