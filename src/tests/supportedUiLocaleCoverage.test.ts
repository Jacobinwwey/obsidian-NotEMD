import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale runtime coverage', () => {
    test('ships non-English runtime strings for all advertised locales', () => {
        const en = getResolvedStrings('en');

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            expect(strings.notices.processingComplete).not.toBe(en.notices.processingComplete);
            expect(strings.notices.contentGenerationSuccess).not.toBe(en.notices.contentGenerationSuccess);
            expect(strings.notices.researchSummaryAppended).not.toBe(en.notices.researchSummaryAppended);
            expect(strings.notices.batchGenerationSuccess).not.toBe(en.notices.batchGenerationSuccess);
            expect(strings.notices.conceptExtractionSuccess).not.toBe(en.notices.conceptExtractionSuccess);
            expect(strings.errorModal.titles.research).not.toBe(en.errorModal.titles.research);
            expect(strings.errorModal.titles.batchTranslation).not.toBe(en.errorModal.titles.batchTranslation);
        }
    });
});
