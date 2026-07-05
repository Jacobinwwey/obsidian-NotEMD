import * as fs from 'fs';
import * as path from 'path';

import { getResolvedStrings } from '../i18n';

const mainPath = path.join(__dirname, '..', 'main.ts');
const fileUtilsPath = path.join(__dirname, '..', 'fileUtils.ts');
const searchUtilsPath = path.join(__dirname, '..', 'searchUtils.ts');
const settingsTabPath = path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts');

describe('runtime i18n coverage', () => {
    test('removes hardcoded runtime notice and modal copy from core command paths', () => {
        const mainSource = fs.readFileSync(mainPath, 'utf8');
        const fileUtilsSource = fs.readFileSync(fileUtilsPath, 'utf8');
        const searchUtilsSource = fs.readFileSync(searchUtilsPath, 'utf8');
        const settingsTabSource = fs.readFileSync(settingsTabPath, 'utf8');

        const mainHardcodedCopy = [
            'Notemd processing complete!',
            "Cannot test connection while processing.",
            'Content generated successfully for ',
            'No active file.',
            'No topic found (select text or use note title).',
            'Batch generation cancelled.',
            'Mermaid diagram summarization complete!',
            'No concepts found to extract.',
            'Batch extraction cancelled.'
        ];

        const fileUtilsHardcodedCopy = [
            'Updating links for renamed file:',
            'Updated links to "',
            'Encountered ${errors.length} errors while updating links.',
            'Removing links for deleted file:',
            'Created concept log file:',
            'Overwrote concept log file:',
            "Error ensuring 'complete' folder exists:",
            "No '.md' files found in selected folder:",
            'Error log saved:'
        ];

        const searchHardcodedCopy = [
            'Please select the topic text in the editor first, or ensure the note has a title.',
            'failed or returned no results. Summary not generated.',
            'Research summary for "',
            'Error during research:'
        ];

        const developerHardcodedCopy = [
            'Cannot run developer diagnostic for',
            'Running developer diagnostic for',
            'Developer diagnostic succeeded',
            'Cannot run developer stability diagnostic for',
            'Developer stability diagnostic failed before report generation'
        ];

        for (const label of mainHardcodedCopy) {
            expect(mainSource).not.toContain(label);
        }

        for (const label of fileUtilsHardcodedCopy) {
            expect(fileUtilsSource).not.toContain(label);
        }

        for (const label of searchHardcodedCopy) {
            expect(searchUtilsSource).not.toContain(label);
        }

        for (const label of developerHardcodedCopy) {
            expect(settingsTabSource).not.toContain(label);
        }
    });

    test('ships runtime catalog keys for english and chinese locales', () => {
        const en = getResolvedStrings('en');
        const zhCn = getResolvedStrings('zh-CN');
        const zhTw = getResolvedStrings('zh-TW');

        expect(en.notices.processingComplete).toBeDefined();
        expect(en.notices.updatingLinksForRenamedFile).toBeDefined();
        expect(en.notices.researchSummaryAppended).toBeDefined();
        expect(en.notices.batchMermaidFixSuccess).toBeDefined();
        expect(en.notices.chapterSplitSuccess).toBeDefined();
        expect(en.notices.cliCapabilityManifestExported).toBeDefined();
        expect(en.notices.cliInvocationContractExported).toBeDefined();
        expect(en.notices.cliPublicSurfaceExported).toBeDefined();
        expect(en.settings.providerConfig.exportRedactedSuccess).toBeDefined();
        expect(en.settings.developer.diagnosticSuccess).toBeDefined();
        expect(en.settings.providerConfig.exportSensitiveWarning).toBeDefined();
        expect(en.errorModal.titles.research).toBeDefined();
        expect(en.errorModal.titles.batchTranslation).toBeDefined();
        expect(en.errorModal.titles.chapterSplit).toBeDefined();
        expect(en.sidebar.apiActivityTitle).toBeDefined();
        expect(en.sidebar.actions.splitNoteByChapters).toBeDefined();
        expect(en.sidebar.copyApiActivity).toBeDefined();
        expect(en.sidebar.apiActivityReportTitle).toBeDefined();
        expect(en.sidebar.apiActivityActiveSection).toBeDefined();
        expect(en.sidebar.apiActivityRecentSection).toBeDefined();
        expect(en.previewModal.exportSvg).toBeDefined();
        expect(en.previewModal.saveSource).toBeDefined();
        expect(en.previewModal.exportSuccessNotice).toBeDefined();
        expect(en.previewModal.saveSourceSuccessNotice).toBeDefined();
        expect(en.previewModal.exportPng).toBeDefined();
        expect(en.previewModal.exportPngSuccessNotice).toBeDefined();
        expect(en.previewModal.diagnosticsTitle).toBeDefined();
        expect(en.previewModal.diagnosticAdvice).toBeDefined();

        expect(zhCn.notices.processingComplete).not.toBe(en.notices.processingComplete);
        expect(zhCn.notices.updatingLinksForRenamedFile).not.toBe(en.notices.updatingLinksForRenamedFile);
        expect(zhCn.notices.chapterSplitSuccess).not.toBe(en.notices.chapterSplitSuccess);
        expect(zhCn.notices.cliCapabilityManifestExported).not.toBe(en.notices.cliCapabilityManifestExported);
        expect(zhCn.notices.cliPublicSurfaceExported).not.toBe(en.notices.cliPublicSurfaceExported);
        expect(zhCn.settings.providerConfig.exportRedactedSuccess).not.toBe(en.settings.providerConfig.exportRedactedSuccess);
        expect(zhCn.settings.providerConfig.exportSensitiveWarning).not.toBe(en.settings.providerConfig.exportSensitiveWarning);
        expect(zhCn.settings.developer.diagnosticSuccess).not.toBe(en.settings.developer.diagnosticSuccess);
        expect(zhCn.errorModal.titles.batchTranslation).not.toBe(en.errorModal.titles.batchTranslation);
        expect(zhCn.errorModal.titles.chapterSplit).not.toBe(en.errorModal.titles.chapterSplit);
        expect(zhCn.sidebar.apiActivityTitle).not.toBe(en.sidebar.apiActivityTitle);
        expect(zhCn.sidebar.actions.splitNoteByChapters).not.toBe(en.sidebar.actions.splitNoteByChapters);
        expect(zhCn.sidebar.copyApiActivity).not.toBe(en.sidebar.copyApiActivity);
        expect(zhCn.sidebar.apiActivityActiveSection).not.toBe(en.sidebar.apiActivityActiveSection);
        expect(zhCn.previewModal.exportSvg).not.toBe(en.previewModal.exportSvg);
        expect(zhCn.previewModal.saveSource).not.toBe(en.previewModal.saveSource);
        expect(zhCn.previewModal.exportSuccessNotice).not.toBe(en.previewModal.exportSuccessNotice);
        expect(zhCn.previewModal.saveSourceSuccessNotice).not.toBe(en.previewModal.saveSourceSuccessNotice);
        expect(zhCn.previewModal.exportPng).not.toBe(en.previewModal.exportPng);
        expect(zhCn.previewModal.exportPngSuccessNotice).not.toBe(en.previewModal.exportPngSuccessNotice);
        expect(zhCn.previewModal.diagnosticsTitle).not.toBe(en.previewModal.diagnosticsTitle);
        expect(zhCn.previewModal.diagnosticAdvice).not.toBe(en.previewModal.diagnosticAdvice);

        expect(zhTw.notices.researchSummaryAppended).not.toBe(en.notices.researchSummaryAppended);
        expect(zhTw.notices.batchMermaidFixSuccess).not.toBe(en.notices.batchMermaidFixSuccess);
        expect(zhTw.notices.chapterSplitSuccess).not.toBe(en.notices.chapterSplitSuccess);
        expect(zhTw.notices.cliInvocationContractExported).not.toBe(en.notices.cliInvocationContractExported);
        expect(zhTw.notices.cliPublicSurfaceExported).not.toBe(en.notices.cliPublicSurfaceExported);
        expect(zhTw.settings.providerConfig.exportRedactedSuccess).not.toBe(en.settings.providerConfig.exportRedactedSuccess);
        expect(zhTw.settings.providerConfig.exportSensitiveWarning).not.toBe(en.settings.providerConfig.exportSensitiveWarning);
        expect(zhTw.settings.developer.stabilityFinished).not.toBe(en.settings.developer.stabilityFinished);
        expect(zhTw.errorModal.titles.research).not.toBe(en.errorModal.titles.research);
        expect(zhTw.errorModal.titles.chapterSplit).not.toBe(en.errorModal.titles.chapterSplit);
        expect(zhTw.sidebar.apiActivityTitle).not.toBe(en.sidebar.apiActivityTitle);
        expect(zhTw.sidebar.actions.splitNoteByChapters).not.toBe(en.sidebar.actions.splitNoteByChapters);
        expect(zhTw.sidebar.copyApiActivity).not.toBe(en.sidebar.copyApiActivity);
        expect(zhTw.sidebar.apiActivityRecentSection).not.toBe(en.sidebar.apiActivityRecentSection);
        expect(zhTw.previewModal.exportSvg).not.toBe(en.previewModal.exportSvg);
        expect(zhTw.previewModal.saveSource).not.toBe(en.previewModal.saveSource);
        expect(zhTw.previewModal.exportSuccessNotice).not.toBe(en.previewModal.exportSuccessNotice);
        expect(zhTw.previewModal.saveSourceSuccessNotice).not.toBe(en.previewModal.saveSourceSuccessNotice);
        expect(zhTw.previewModal.exportPng).not.toBe(en.previewModal.exportPng);
        expect(zhTw.previewModal.exportPngSuccessNotice).not.toBe(en.previewModal.exportPngSuccessNotice);
        expect(zhTw.previewModal.diagnosticsTitle).not.toBe(en.previewModal.diagnosticsTitle);
        expect(zhTw.previewModal.diagnosticAdvice).not.toBe(en.previewModal.diagnosticAdvice);
    });
});
