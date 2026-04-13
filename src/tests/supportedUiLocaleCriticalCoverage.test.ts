import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale critical coverage', () => {
    test('ships localized critical UI chrome for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const criticalFields = [
            {
                label: 'folderPicker.title',
                get: (strings: typeof en) => strings.folderPicker.title
            },
            {
                label: 'folderPicker.selectAction',
                get: (strings: typeof en) => strings.folderPicker.selectAction
            },
            {
                label: 'settings.language.uiLocaleDesc',
                get: (strings: typeof en) => strings.settings.language.uiLocaleDesc
            },
            {
                label: 'settings.language.outputDesc',
                get: (strings: typeof en) => strings.settings.language.outputDesc
            },
            {
                label: 'settings.language.perTaskName',
                get: (strings: typeof en) => strings.settings.language.perTaskName
            },
            {
                label: 'settings.language.disableAutoTranslationName',
                get: (strings: typeof en) => strings.settings.language.disableAutoTranslationName
            },
            {
                label: 'sidebar.heroTitle',
                get: (strings: typeof en) => strings.sidebar.heroTitle
            },
            {
                label: 'sidebar.quickWorkflowTitle',
                get: (strings: typeof en) => strings.sidebar.quickWorkflowTitle
            },
            {
                label: 'sidebar.status.runningAction',
                get: (strings: typeof en) => strings.sidebar.status.runningAction
            },
            {
                label: 'sidebar.status.actionComplete',
                get: (strings: typeof en) => strings.sidebar.status.actionComplete
            },
            {
                label: 'sidebar.status.processingStopped',
                get: (strings: typeof en) => strings.sidebar.status.processingStopped
            },
            {
                label: 'sidebar.cancelProcessing',
                get: (strings: typeof en) => strings.sidebar.cancelProcessing
            },
            {
                label: 'sidebar.languageChangedNotice',
                get: (strings: typeof en) => strings.sidebar.languageChangedNotice
            },
            {
                label: 'errorModal.copyDetails',
                get: (strings: typeof en) => strings.errorModal.copyDetails
            },
            {
                label: 'errorModal.copySuccessNotice',
                get: (strings: typeof en) => strings.errorModal.copySuccessNotice
            },
            {
                label: 'progressModal.processingStopped',
                get: (strings: typeof en) => strings.progressModal.processingStopped
            },
            {
                label: 'progressModal.cancelling',
                get: (strings: typeof en) => strings.progressModal.cancelling
            },
            {
                label: 'progressModal.userRequestedCancellation',
                get: (strings: typeof en) => strings.progressModal.userRequestedCancellation
            }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of criticalFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
