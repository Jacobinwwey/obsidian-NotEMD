import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale status and error surface coverage', () => {
    test('ships localized sidebar status and error modal titles for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const visibleFields = [
            { label: 'sidebar.status.workflowStart', get: (strings: typeof en) => strings.sidebar.status.workflowStart },
            { label: 'sidebar.status.workflowComplete', get: (strings: typeof en) => strings.sidebar.status.workflowComplete },
            { label: 'sidebar.status.workflowFailed', get: (strings: typeof en) => strings.sidebar.status.workflowFailed },
            { label: 'sidebar.status.workflowFailedLog', get: (strings: typeof en) => strings.sidebar.status.workflowFailedLog },
            {
                label: 'sidebar.status.workflowFinishedWithErrors',
                get: (strings: typeof en) => strings.sidebar.status.workflowFinishedWithErrors
            },
            { label: 'sidebar.status.stepLabel', get: (strings: typeof en) => strings.sidebar.status.stepLabel },
            { label: 'sidebar.status.stepLog', get: (strings: typeof en) => strings.sidebar.status.stepLog },
            { label: 'sidebar.status.processingActive', get: (strings: typeof en) => strings.sidebar.status.processingActive },
            { label: 'sidebar.status.timeRemaining', get: (strings: typeof en) => strings.sidebar.status.timeRemaining },
            {
                label: 'sidebar.status.timeRemainingCalculating',
                get: (strings: typeof en) => strings.sidebar.status.timeRemainingCalculating
            },
            { label: 'sidebar.status.stopped', get: (strings: typeof en) => strings.sidebar.status.stopped },
            { label: 'sidebar.builtInActionsPrefix', get: (strings: typeof en) => strings.sidebar.builtInActionsPrefix },
            { label: 'sidebar.workflowFallbackWarning', get: (strings: typeof en) => strings.sidebar.workflowFallbackWarning },
            { label: 'errorModal.titles.processing', get: (strings: typeof en) => strings.errorModal.titles.processing },
            { label: 'errorModal.titles.batchProcessing', get: (strings: typeof en) => strings.errorModal.titles.batchProcessing },
            { label: 'errorModal.titles.llmConnectionTest', get: (strings: typeof en) => strings.errorModal.titles.llmConnectionTest },
            { label: 'errorModal.titles.contentGeneration', get: (strings: typeof en) => strings.errorModal.titles.contentGeneration },
            { label: 'errorModal.titles.batchGeneration', get: (strings: typeof en) => strings.errorModal.titles.batchGeneration },
            {
                label: 'errorModal.titles.duplicateCheckRemove',
                get: (strings: typeof en) => strings.errorModal.titles.duplicateCheckRemove
            },
            { label: 'errorModal.titles.batchMermaidFix', get: (strings: typeof en) => strings.errorModal.titles.batchMermaidFix },
            { label: 'errorModal.titles.translation', get: (strings: typeof en) => strings.errorModal.titles.translation },
            {
                label: 'errorModal.titles.conceptExtraction',
                get: (strings: typeof en) => strings.errorModal.titles.conceptExtraction
            },
            {
                label: 'errorModal.titles.batchConceptExtraction',
                get: (strings: typeof en) => strings.errorModal.titles.batchConceptExtraction
            },
            { label: 'errorModal.titles.generic', get: (strings: typeof en) => strings.errorModal.titles.generic },
            { label: 'errorModal.titles.extraction', get: (strings: typeof en) => strings.errorModal.titles.extraction }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of visibleFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
