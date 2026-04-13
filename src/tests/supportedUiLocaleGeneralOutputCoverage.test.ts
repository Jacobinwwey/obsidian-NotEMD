import { getResolvedStrings } from '../i18n';
import { SUPPORTED_UI_LOCALE_CODES } from '../i18n/uiLocales';

describe('supported UI locale general output coverage', () => {
    test('ships localized general output settings copy for all advertised locales', () => {
        const en = getResolvedStrings('en');

        const generalOutputFields = [
            { label: 'settings.generalOutput.processedSavePathName', get: (strings: typeof en) => strings.settings.generalOutput.processedSavePathName },
            { label: 'settings.generalOutput.processedSavePathDesc', get: (strings: typeof en) => strings.settings.generalOutput.processedSavePathDesc },
            { label: 'settings.generalOutput.processedFolderPathName', get: (strings: typeof en) => strings.settings.generalOutput.processedFolderPathName },
            { label: 'settings.generalOutput.processedFolderPathDesc', get: (strings: typeof en) => strings.settings.generalOutput.processedFolderPathDesc },
            { label: 'settings.generalOutput.processedFolderPathPlaceholder', get: (strings: typeof en) => strings.settings.generalOutput.processedFolderPathPlaceholder },
            { label: 'settings.generalOutput.moveOriginalName', get: (strings: typeof en) => strings.settings.generalOutput.moveOriginalName },
            { label: 'settings.generalOutput.moveOriginalDesc', get: (strings: typeof en) => strings.settings.generalOutput.moveOriginalDesc },
            { label: 'settings.generalOutput.customAddLinksFilenameName', get: (strings: typeof en) => strings.settings.generalOutput.customAddLinksFilenameName },
            { label: 'settings.generalOutput.customAddLinksFilenameDesc', get: (strings: typeof en) => strings.settings.generalOutput.customAddLinksFilenameDesc },
            { label: 'settings.generalOutput.addLinksSuffixName', get: (strings: typeof en) => strings.settings.generalOutput.addLinksSuffixName },
            { label: 'settings.generalOutput.addLinksSuffixDesc', get: (strings: typeof en) => strings.settings.generalOutput.addLinksSuffixDesc },
            { label: 'settings.generalOutput.addLinksSuffixPlaceholder', get: (strings: typeof en) => strings.settings.generalOutput.addLinksSuffixPlaceholder },
            { label: 'settings.generalOutput.removeCodeFencesName', get: (strings: typeof en) => strings.settings.generalOutput.removeCodeFencesName },
            { label: 'settings.generalOutput.removeCodeFencesDesc', get: (strings: typeof en) => strings.settings.generalOutput.removeCodeFencesDesc },
            { label: 'settings.generalOutput.conceptNotePathName', get: (strings: typeof en) => strings.settings.generalOutput.conceptNotePathName },
            { label: 'settings.generalOutput.conceptNotePathDesc', get: (strings: typeof en) => strings.settings.generalOutput.conceptNotePathDesc },
            { label: 'settings.generalOutput.conceptNoteFolderName', get: (strings: typeof en) => strings.settings.generalOutput.conceptNoteFolderName },
            { label: 'settings.generalOutput.conceptNoteFolderDesc', get: (strings: typeof en) => strings.settings.generalOutput.conceptNoteFolderDesc },
            { label: 'settings.generalOutput.conceptNoteFolderPlaceholder', get: (strings: typeof en) => strings.settings.generalOutput.conceptNoteFolderPlaceholder },
            { label: 'settings.generalOutput.generateConceptLogName', get: (strings: typeof en) => strings.settings.generalOutput.generateConceptLogName },
            { label: 'settings.generalOutput.generateConceptLogDesc', get: (strings: typeof en) => strings.settings.generalOutput.generateConceptLogDesc },
            { label: 'settings.generalOutput.customLogPathName', get: (strings: typeof en) => strings.settings.generalOutput.customLogPathName },
            { label: 'settings.generalOutput.customLogPathDescWithConceptFolder', get: (strings: typeof en) => strings.settings.generalOutput.customLogPathDescWithConceptFolder },
            { label: 'settings.generalOutput.customLogPathDescVault', get: (strings: typeof en) => strings.settings.generalOutput.customLogPathDescVault },
            { label: 'settings.generalOutput.conceptLogFolderName', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogFolderName },
            { label: 'settings.generalOutput.conceptLogFolderDesc', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogFolderDesc },
            { label: 'settings.generalOutput.conceptLogFolderPlaceholder', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogFolderPlaceholder },
            { label: 'settings.generalOutput.customLogFileNameToggleName', get: (strings: typeof en) => strings.settings.generalOutput.customLogFileNameToggleName },
            { label: 'settings.generalOutput.customLogFileNameToggleDesc', get: (strings: typeof en) => strings.settings.generalOutput.customLogFileNameToggleDesc },
            { label: 'settings.generalOutput.conceptLogFileNameName', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogFileNameName },
            { label: 'settings.generalOutput.conceptLogFileNameDesc', get: (strings: typeof en) => strings.settings.generalOutput.conceptLogFileNameDesc }
        ];

        for (const locale of SUPPORTED_UI_LOCALE_CODES) {
            if (locale === 'en') {
                continue;
            }

            const strings = getResolvedStrings(locale);

            for (const field of generalOutputFields) {
                expect(field.get(strings)).not.toBe(field.get(en));
            }
        }
    });
});
