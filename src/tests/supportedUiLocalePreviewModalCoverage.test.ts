import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale preview modal coverage', () => {
    test('ships localized preview modal export copy for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const previewFields = [
            { label: 'previewModal.title', get: (strings: typeof en) => strings.previewModal.title },
            { label: 'previewModal.copySource', get: (strings: typeof en) => strings.previewModal.copySource },
            { label: 'previewModal.saveSource', get: (strings: typeof en) => strings.previewModal.saveSource },
            { label: 'previewModal.savingSource', get: (strings: typeof en) => strings.previewModal.savingSource },
            { label: 'previewModal.exportSvg', get: (strings: typeof en) => strings.previewModal.exportSvg },
            { label: 'previewModal.exportingSvg', get: (strings: typeof en) => strings.previewModal.exportingSvg },
            { label: 'previewModal.copySuccessNotice', get: (strings: typeof en) => strings.previewModal.copySuccessNotice },
            { label: 'previewModal.copyFailedNotice', get: (strings: typeof en) => strings.previewModal.copyFailedNotice },
            { label: 'previewModal.saveSourceSuccessNotice', get: (strings: typeof en) => strings.previewModal.saveSourceSuccessNotice },
            { label: 'previewModal.saveSourceFailedNotice', get: (strings: typeof en) => strings.previewModal.saveSourceFailedNotice },
            { label: 'previewModal.exportSuccessNotice', get: (strings: typeof en) => strings.previewModal.exportSuccessNotice },
            { label: 'previewModal.exportFailedNotice', get: (strings: typeof en) => strings.previewModal.exportFailedNotice },
            { label: 'previewModal.sourceFile', get: (strings: typeof en) => strings.previewModal.sourceFile }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);
            for (const field of previewFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
