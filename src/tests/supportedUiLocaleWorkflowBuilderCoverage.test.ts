import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale workflow builder coverage', () => {
    test('ships localized workflow builder copy for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const workflowFields = [
            { label: 'settings.workflowBuilder.errorStrategyName', get: (strings: typeof en) => strings.settings.workflowBuilder.errorStrategyName },
            { label: 'settings.workflowBuilder.errorStrategyDesc', get: (strings: typeof en) => strings.settings.workflowBuilder.errorStrategyDesc },
            { label: 'settings.workflowBuilder.errorStrategyStop', get: (strings: typeof en) => strings.settings.workflowBuilder.errorStrategyStop },
            { label: 'settings.workflowBuilder.errorStrategyContinue', get: (strings: typeof en) => strings.settings.workflowBuilder.errorStrategyContinue },
            { label: 'settings.workflowBuilder.visualBuilderName', get: (strings: typeof en) => strings.settings.workflowBuilder.visualBuilderName },
            { label: 'settings.workflowBuilder.visualBuilderDesc', get: (strings: typeof en) => strings.settings.workflowBuilder.visualBuilderDesc },
            { label: 'settings.workflowBuilder.advancedDslName', get: (strings: typeof en) => strings.settings.workflowBuilder.advancedDslName },
            { label: 'settings.workflowBuilder.advancedDslDesc', get: (strings: typeof en) => strings.settings.workflowBuilder.advancedDslDesc },
            { label: 'settings.workflowBuilder.dslValidationName', get: (strings: typeof en) => strings.settings.workflowBuilder.dslValidationName },
            { label: 'settings.workflowBuilder.dslValidationDesc', get: (strings: typeof en) => strings.settings.workflowBuilder.dslValidationDesc },
            { label: 'settings.workflowBuilder.availableActionIdsName', get: (strings: typeof en) => strings.settings.workflowBuilder.availableActionIdsName },
            { label: 'settings.workflowBuilder.builderDslWarning', get: (strings: typeof en) => strings.settings.workflowBuilder.builderDslWarning },
            { label: 'settings.workflowBuilder.builderCardTitle', get: (strings: typeof en) => strings.settings.workflowBuilder.builderCardTitle },
            { label: 'settings.workflowBuilder.deleteButton', get: (strings: typeof en) => strings.settings.workflowBuilder.deleteButton },
            { label: 'settings.workflowBuilder.workflowRemovedNotice', get: (strings: typeof en) => strings.settings.workflowBuilder.workflowRemovedNotice },
            { label: 'settings.workflowBuilder.buttonNameLabel', get: (strings: typeof en) => strings.settings.workflowBuilder.buttonNameLabel },
            { label: 'settings.workflowBuilder.buttonNamePlaceholder', get: (strings: typeof en) => strings.settings.workflowBuilder.buttonNamePlaceholder },
            { label: 'settings.workflowBuilder.actionSequenceTitle', get: (strings: typeof en) => strings.settings.workflowBuilder.actionSequenceTitle },
            { label: 'settings.workflowBuilder.removeAction', get: (strings: typeof en) => strings.settings.workflowBuilder.removeAction },
            { label: 'settings.workflowBuilder.addAction', get: (strings: typeof en) => strings.settings.workflowBuilder.addAction },
            { label: 'settings.workflowBuilder.addWorkflow', get: (strings: typeof en) => strings.settings.workflowBuilder.addWorkflow },
            { label: 'settings.workflowBuilder.workflowAddedNotice', get: (strings: typeof en) => strings.settings.workflowBuilder.workflowAddedNotice },
            { label: 'settings.workflowBuilder.resetDefault', get: (strings: typeof en) => strings.settings.workflowBuilder.resetDefault },
            { label: 'settings.workflowBuilder.resetDefaultNotice', get: (strings: typeof en) => strings.settings.workflowBuilder.resetDefaultNotice }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of workflowFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
