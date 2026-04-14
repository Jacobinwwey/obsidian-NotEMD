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
        expect(en.settings.developer.diagnosticSuccess).toBeDefined();
        expect(en.errorModal.titles.research).toBeDefined();
        expect(en.errorModal.titles.batchTranslation).toBeDefined();
        expect(en.previewModal.exportSvg).toBeDefined();
        expect(en.previewModal.exportSuccessNotice).toBeDefined();

        expect(zhCn.notices.processingComplete).not.toBe(en.notices.processingComplete);
        expect(zhCn.notices.updatingLinksForRenamedFile).not.toBe(en.notices.updatingLinksForRenamedFile);
        expect(zhCn.settings.developer.diagnosticSuccess).not.toBe(en.settings.developer.diagnosticSuccess);
        expect(zhCn.errorModal.titles.batchTranslation).not.toBe(en.errorModal.titles.batchTranslation);
        expect(zhCn.previewModal.exportSvg).not.toBe(en.previewModal.exportSvg);
        expect(zhCn.previewModal.exportSuccessNotice).not.toBe(en.previewModal.exportSuccessNotice);

        expect(zhTw.notices.researchSummaryAppended).not.toBe(en.notices.researchSummaryAppended);
        expect(zhTw.notices.batchMermaidFixSuccess).not.toBe(en.notices.batchMermaidFixSuccess);
        expect(zhTw.settings.developer.stabilityFinished).not.toBe(en.settings.developer.stabilityFinished);
        expect(zhTw.errorModal.titles.research).not.toBe(en.errorModal.titles.research);
        expect(zhTw.previewModal.exportSvg).not.toBe(en.previewModal.exportSvg);
        expect(zhTw.previewModal.exportSuccessNotice).not.toBe(en.previewModal.exportSuccessNotice);
    });
});
