import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale extract original text coverage', () => {
    test('ships localized extract original text settings copy for all advertised locales', () => {
        const en = getResolvedStrings('en');

        // `customSuffixPlaceholder` intentionally stays aligned with the runtime default `_Extracted`.
        const extractOriginalTextFields = [
            { label: 'settings.extractOriginalText.questionsName', get: (strings: typeof en) => strings.settings.extractOriginalText.questionsName },
            { label: 'settings.extractOriginalText.questionsDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.questionsDesc },
            { label: 'settings.extractOriginalText.questionsPlaceholder', get: (strings: typeof en) => strings.settings.extractOriginalText.questionsPlaceholder },
            { label: 'settings.extractOriginalText.translateOutputName', get: (strings: typeof en) => strings.settings.extractOriginalText.translateOutputName },
            { label: 'settings.extractOriginalText.translateOutputDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.translateOutputDesc },
            { label: 'settings.extractOriginalText.mergedQueryName', get: (strings: typeof en) => strings.settings.extractOriginalText.mergedQueryName },
            { label: 'settings.extractOriginalText.mergedQueryDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.mergedQueryDesc },
            { label: 'settings.extractOriginalText.customOutputName', get: (strings: typeof en) => strings.settings.extractOriginalText.customOutputName },
            { label: 'settings.extractOriginalText.customOutputDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.customOutputDesc },
            { label: 'settings.extractOriginalText.savePathName', get: (strings: typeof en) => strings.settings.extractOriginalText.savePathName },
            { label: 'settings.extractOriginalText.savePathDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.savePathDesc },
            { label: 'settings.extractOriginalText.savePathPlaceholder', get: (strings: typeof en) => strings.settings.extractOriginalText.savePathPlaceholder },
            { label: 'settings.extractOriginalText.customSuffixName', get: (strings: typeof en) => strings.settings.extractOriginalText.customSuffixName },
            { label: 'settings.extractOriginalText.customSuffixDesc', get: (strings: typeof en) => strings.settings.extractOriginalText.customSuffixDesc }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of extractOriginalTextFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
