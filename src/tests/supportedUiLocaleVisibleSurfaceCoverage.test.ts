import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale visible surface coverage', () => {
    test('ships localized commands, duplicate modal copy, and settings headings for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const visibleFields = [
            { label: 'common.select', get: (strings: typeof en) => strings.common.select },
            { label: 'commands.checkDuplicatesCurrent', get: (strings: typeof en) => strings.commands.checkDuplicatesCurrent },
            { label: 'commands.extractConceptsAndGenerateTitles', get: (strings: typeof en) => strings.commands.extractConceptsAndGenerateTitles },
            {
                label: 'commands.createWikiLinkAndGenerateNoteFromSelection',
                get: (strings: typeof en) => strings.commands.createWikiLinkAndGenerateNoteFromSelection
            },
            { label: 'duplicateModal.title', get: (strings: typeof en) => strings.duplicateModal.title },
            { label: 'duplicateModal.intro', get: (strings: typeof en) => strings.duplicateModal.intro },
            { label: 'duplicateModal.reason', get: (strings: typeof en) => strings.duplicateModal.reason },
            { label: 'duplicateModal.conflictsWith', get: (strings: typeof en) => strings.duplicateModal.conflictsWith },
            { label: 'duplicateModal.warning', get: (strings: typeof en) => strings.duplicateModal.warning },
            { label: 'duplicateModal.deleteFiles', get: (strings: typeof en) => strings.duplicateModal.deleteFiles },
            { label: 'settings.developer.heading', get: (strings: typeof en) => strings.settings.developer.heading },
            { label: 'settings.providerConfig.heading', get: (strings: typeof en) => strings.settings.providerConfig.heading },
            { label: 'settings.multiModel.heading', get: (strings: typeof en) => strings.settings.multiModel.heading },
            { label: 'settings.translationTask.heading', get: (strings: typeof en) => strings.settings.translationTask.heading },
            { label: 'settings.mermaidTask.heading', get: (strings: typeof en) => strings.settings.mermaidTask.heading },
            { label: 'settings.extractConceptsTask.heading', get: (strings: typeof en) => strings.settings.extractConceptsTask.heading },
            { label: 'settings.stableApi.heading', get: (strings: typeof en) => strings.settings.stableApi.heading },
            { label: 'settings.workflowBuilder.heading', get: (strings: typeof en) => strings.settings.workflowBuilder.heading },
            { label: 'settings.generalOutput.processedHeading', get: (strings: typeof en) => strings.settings.generalOutput.processedHeading },
            { label: 'settings.generalOutput.conceptNoteHeading', get: (strings: typeof en) => strings.settings.generalOutput.conceptNoteHeading },
            { label: 'settings.generalOutput.conceptLogHeading', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogHeading },
            { label: 'settings.contentGeneration.heading', get: (strings: typeof en) => strings.settings.contentGeneration.heading },
            { label: 'settings.customPrompts.heading', get: (strings: typeof en) => strings.settings.customPrompts.heading },
            { label: 'settings.extractOriginalText.heading', get: (strings: typeof en) => strings.settings.extractOriginalText.heading },
            { label: 'settings.webResearch.heading', get: (strings: typeof en) => strings.settings.webResearch.heading },
            { label: 'settings.processing.heading', get: (strings: typeof en) => strings.settings.processing.heading },
            { label: 'settings.batchProcessing.heading', get: (strings: typeof en) => strings.settings.batchProcessing.heading },
            { label: 'settings.batchMermaidFix.heading', get: (strings: typeof en) => strings.settings.batchMermaidFix.heading },
            { label: 'settings.duplicateScope.heading', get: (strings: typeof en) => strings.settings.duplicateScope.heading },
            { label: 'settings.focusedLearning.heading', get: (strings: typeof en) => strings.settings.focusedLearning.heading }
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
