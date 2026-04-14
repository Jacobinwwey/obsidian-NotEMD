import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale sidebar tooltip coverage', () => {
    test('ships localized sidebar action tooltips for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const tooltipFields = [
            { label: 'sidebar.actions.processCurrentAddLinks.tooltip', get: (strings: typeof en) => strings.sidebar.actions.processCurrentAddLinks.tooltip },
            { label: 'sidebar.actions.processFolderAddLinks.tooltip', get: (strings: typeof en) => strings.sidebar.actions.processFolderAddLinks.tooltip },
            { label: 'sidebar.actions.generateFromTitle.tooltip', get: (strings: typeof en) => strings.sidebar.actions.generateFromTitle.tooltip },
            { label: 'sidebar.actions.batchGenerateFromTitles.tooltip', get: (strings: typeof en) => strings.sidebar.actions.batchGenerateFromTitles.tooltip },
            { label: 'sidebar.actions.researchAndSummarize.tooltip', get: (strings: typeof en) => strings.sidebar.actions.researchAndSummarize.tooltip },
            { label: 'sidebar.actions.summarizeAsMermaid.tooltip', get: (strings: typeof en) => strings.sidebar.actions.summarizeAsMermaid.tooltip },
            { label: 'sidebar.actions.generateExperimentalDiagram.tooltip', get: (strings: typeof en) => strings.sidebar.actions.generateExperimentalDiagram.tooltip },
            { label: 'sidebar.actions.previewExperimentalDiagram.tooltip', get: (strings: typeof en) => strings.sidebar.actions.previewExperimentalDiagram.tooltip },
            { label: 'sidebar.actions.translateCurrentFile.tooltip', get: (strings: typeof en) => strings.sidebar.actions.translateCurrentFile.tooltip },
            { label: 'sidebar.actions.batchTranslateFolder.tooltip', get: (strings: typeof en) => strings.sidebar.actions.batchTranslateFolder.tooltip },
            { label: 'sidebar.actions.extractConceptsCurrent.tooltip', get: (strings: typeof en) => strings.sidebar.actions.extractConceptsCurrent.tooltip },
            { label: 'sidebar.actions.extractConceptsFolder.tooltip', get: (strings: typeof en) => strings.sidebar.actions.extractConceptsFolder.tooltip },
            { label: 'sidebar.actions.extractOriginalText.tooltip', get: (strings: typeof en) => strings.sidebar.actions.extractOriginalText.tooltip },
            { label: 'sidebar.actions.batchMermaidFix.tooltip', get: (strings: typeof en) => strings.sidebar.actions.batchMermaidFix.tooltip },
            { label: 'sidebar.actions.fixFormulaCurrent.tooltip', get: (strings: typeof en) => strings.sidebar.actions.fixFormulaCurrent.tooltip },
            { label: 'sidebar.actions.batchFixFormula.tooltip', get: (strings: typeof en) => strings.sidebar.actions.batchFixFormula.tooltip },
            { label: 'sidebar.actions.checkDuplicatesCurrent.tooltip', get: (strings: typeof en) => strings.sidebar.actions.checkDuplicatesCurrent.tooltip },
            { label: 'sidebar.actions.checkRemoveDuplicateConcepts.tooltip', get: (strings: typeof en) => strings.sidebar.actions.checkRemoveDuplicateConcepts.tooltip },
            { label: 'sidebar.actions.testLlmConnection.tooltip', get: (strings: typeof en) => strings.sidebar.actions.testLlmConnection.tooltip }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of tooltipFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
