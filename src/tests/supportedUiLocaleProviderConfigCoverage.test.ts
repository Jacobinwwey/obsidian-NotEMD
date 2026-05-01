import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale provider config coverage', () => {
    test('ships localized provider configuration copy for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const providerFields = [
            { label: 'settings.providerConfig.heading', get: (strings: typeof en) => strings.settings.providerConfig.heading },
            { label: 'settings.providerConfig.summaryTitle', get: (strings: typeof en) => strings.settings.providerConfig.summaryTitle },
            { label: 'settings.providerConfig.summaryDesc', get: (strings: typeof en) => strings.settings.providerConfig.summaryDesc },
            { label: 'settings.providerConfig.categoryCloud', get: (strings: typeof en) => strings.settings.providerConfig.categoryCloud },
            { label: 'settings.providerConfig.categoryGateway', get: (strings: typeof en) => strings.settings.providerConfig.categoryGateway },
            { label: 'settings.providerConfig.categoryLocal', get: (strings: typeof en) => strings.settings.providerConfig.categoryLocal },
            { label: 'settings.providerConfig.categoryOther', get: (strings: typeof en) => strings.settings.providerConfig.categoryOther },
            { label: 'settings.providerConfig.presetSummaryTitle', get: (strings: typeof en) => strings.settings.providerConfig.presetSummaryTitle },
            { label: 'settings.providerConfig.presetSummaryHint', get: (strings: typeof en) => strings.settings.providerConfig.presetSummaryHint },
            { label: 'settings.providerConfig.manageName', get: (strings: typeof en) => strings.settings.providerConfig.manageName },
            { label: 'settings.providerConfig.manageDesc', get: (strings: typeof en) => strings.settings.providerConfig.manageDesc },
            { label: 'settings.providerConfig.exportButton', get: (strings: typeof en) => strings.settings.providerConfig.exportButton },
            { label: 'settings.providerConfig.exportTooltip', get: (strings: typeof en) => strings.settings.providerConfig.exportTooltip },
            { label: 'settings.providerConfig.importButton', get: (strings: typeof en) => strings.settings.providerConfig.importButton },
            { label: 'settings.providerConfig.importTooltip', get: (strings: typeof en) => strings.settings.providerConfig.importTooltip },
            { label: 'settings.providerConfig.activeProviderName', get: (strings: typeof en) => strings.settings.providerConfig.activeProviderName },
            { label: 'settings.providerConfig.activeProviderDesc', get: (strings: typeof en) => strings.settings.providerConfig.activeProviderDesc },
            { label: 'settings.providerConfig.providerDetailsHeading', get: (strings: typeof en) => strings.settings.providerConfig.providerDetailsHeading },
            { label: 'settings.providerConfig.apiKeyName', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyName },
            { label: 'settings.providerConfig.apiKeyDescRequired', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyDescRequired },
            { label: 'settings.providerConfig.apiKeyDescOptional', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyDescOptional },
            { label: 'settings.providerConfig.apiKeyExtraLmStudio', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyExtraLmStudio },
            { label: 'settings.providerConfig.apiKeyPlaceholderDefault', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyPlaceholderDefault },
            { label: 'settings.providerConfig.apiKeyPlaceholderLmStudio', get: (strings: typeof en) => strings.settings.providerConfig.apiKeyPlaceholderLmStudio },
            { label: 'settings.providerConfig.baseUrlName', get: (strings: typeof en) => strings.settings.providerConfig.baseUrlName },
            { label: 'settings.providerConfig.baseUrlDesc', get: (strings: typeof en) => strings.settings.providerConfig.baseUrlDesc },
            { label: 'settings.providerConfig.baseUrlRequired', get: (strings: typeof en) => strings.settings.providerConfig.baseUrlRequired },
            { label: 'settings.providerConfig.baseUrlPlaceholder', get: (strings: typeof en) => strings.settings.providerConfig.baseUrlPlaceholder },
            { label: 'settings.providerConfig.modelName', get: (strings: typeof en) => strings.settings.providerConfig.modelName },
            { label: 'settings.providerConfig.modelDesc', get: (strings: typeof en) => strings.settings.providerConfig.modelDesc },
            { label: 'settings.providerConfig.modelPlaceholder', get: (strings: typeof en) => strings.settings.providerConfig.modelPlaceholder },
            { label: 'settings.providerConfig.temperatureName', get: (strings: typeof en) => strings.settings.providerConfig.temperatureName },
            { label: 'settings.providerConfig.temperatureDesc', get: (strings: typeof en) => strings.settings.providerConfig.temperatureDesc },
            { label: 'settings.providerConfig.maxOutputTokensDesc', get: (strings: typeof en) => strings.settings.providerConfig.maxOutputTokensDesc },
            { label: 'settings.providerConfig.topPName', get: (strings: typeof en) => strings.settings.providerConfig.topPName },
            { label: 'settings.providerConfig.topPDesc', get: (strings: typeof en) => strings.settings.providerConfig.topPDesc },
            { label: 'settings.providerConfig.topPPlaceholder', get: (strings: typeof en) => strings.settings.providerConfig.topPPlaceholder },
            { label: 'settings.providerConfig.reasoningEffortName', get: (strings: typeof en) => strings.settings.providerConfig.reasoningEffortName },
            { label: 'settings.providerConfig.reasoningEffortDesc', get: (strings: typeof en) => strings.settings.providerConfig.reasoningEffortDesc },
            { label: 'settings.providerConfig.reasoningEffortPlaceholder', get: (strings: typeof en) => strings.settings.providerConfig.reasoningEffortPlaceholder },
            { label: 'settings.providerConfig.thinkingEnabledName', get: (strings: typeof en) => strings.settings.providerConfig.thinkingEnabledName },
            { label: 'settings.providerConfig.thinkingEnabledDesc', get: (strings: typeof en) => strings.settings.providerConfig.thinkingEnabledDesc },
            { label: 'settings.providerConfig.apiVersionName', get: (strings: typeof en) => strings.settings.providerConfig.apiVersionName },
            { label: 'settings.providerConfig.apiVersionDesc', get: (strings: typeof en) => strings.settings.providerConfig.apiVersionDesc },
            { label: 'settings.providerConfig.apiVersionPlaceholder', get: (strings: typeof en) => strings.settings.providerConfig.apiVersionPlaceholder },
            { label: 'settings.providerConfig.testConnectionName', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionName },
            { label: 'settings.providerConfig.testConnectionDesc', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionDesc },
            { label: 'settings.providerConfig.testConnectionButton', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionButton },
            { label: 'settings.providerConfig.testConnectionTesting', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionTesting },
            { label: 'settings.providerConfig.testConnectionRunning', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionRunning },
            { label: 'settings.providerConfig.testConnectionBlocked', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionBlocked },
            { label: 'settings.providerConfig.testConnectionSuccess', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionSuccess },
            { label: 'settings.providerConfig.testConnectionFailed', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionFailed },
            { label: 'settings.providerConfig.testConnectionError', get: (strings: typeof en) => strings.settings.providerConfig.testConnectionError },
            { label: 'settings.providerConfig.missingActiveProvider', get: (strings: typeof en) => strings.settings.providerConfig.missingActiveProvider },
            { label: 'settings.providerConfig.exportDirectoryError', get: (strings: typeof en) => strings.settings.providerConfig.exportDirectoryError },
            { label: 'settings.providerConfig.exportSuccess', get: (strings: typeof en) => strings.settings.providerConfig.exportSuccess },
            { label: 'settings.providerConfig.exportError', get: (strings: typeof en) => strings.settings.providerConfig.exportError },
            { label: 'settings.providerConfig.importFileMissing', get: (strings: typeof en) => strings.settings.providerConfig.importFileMissing },
            { label: 'settings.providerConfig.importInvalidArray', get: (strings: typeof en) => strings.settings.providerConfig.importInvalidArray },
            { label: 'settings.providerConfig.activeProviderReset', get: (strings: typeof en) => strings.settings.providerConfig.activeProviderReset },
            { label: 'settings.providerConfig.importSuccess', get: (strings: typeof en) => strings.settings.providerConfig.importSuccess },
            { label: 'settings.providerConfig.importError', get: (strings: typeof en) => strings.settings.providerConfig.importError },
            { label: 'settings.providerConfig.validationRequired', get: (strings: typeof en) => strings.settings.providerConfig.validationRequired },
            { label: 'settings.providerConfig.validationWarning', get: (strings: typeof en) => strings.settings.providerConfig.validationWarning }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of providerFields) {
                const localizedValue = field.get(strings);
                expect(localizedValue).toBeDefined();
                expect(localizedValue).not.toBe('');
            }
        }
    });
});
