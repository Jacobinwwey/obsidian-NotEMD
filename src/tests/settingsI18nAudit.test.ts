import * as fs from 'fs';
import * as path from 'path';

import { getResolvedStrings } from '../i18n';

const settingsTabPath = path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts');

describe('settings page i18n coverage', () => {
    test('localizes the lower settings sections instead of hardcoding English copy', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        const hardcodedLabels = [
            'Extract Specific Original Text',
            'Questions for extraction',
            "Use custom output folder for 'Generate from title'",
            'Custom output folder name',
            'Web research provider',
            'Search provider',
            'Tavily API key',
            'Tavily max results',
            'Tavily search depth',
            'DuckDuckGo max results',
            'DuckDuckGo content fetch timeout (seconds)',
            'Max research content tokens',
            'Processing parameters',
            'Chunk word count',
            'Max tokens',
            'Batch Processing',
            'Enable Batch Parallelism',
            'Batch Concurrency',
            'Enable duplicate detection',
            'Translate output to corresponding language',
            'Merged query mode',
            'Customise extracted text save path & filename',
            'Extracted file save path',
            'Batch Mermaid fix',
            'Enable Mermaid Error Detection',
            'Move files with Mermaid errors to specified folder',
            'Mermaid error folder path',
            'Duplicate check scope',
            'Duplicate check scope mode',
            'Focused learning domain',
            'Enable focused learning domain',
            'Learning domain'
        ];

        for (const label of hardcodedLabels) {
            expect(source).not.toContain(label);
        }
    });

    test('ships catalog keys for the lower settings sections in english and chinese locales', () => {
        const en = getResolvedStrings('en');
        const zhCn = getResolvedStrings('zh-CN');
        const zhTw = getResolvedStrings('zh-TW');

        expect(en.settings.extractOriginalText.heading).toBeDefined();
        expect(en.settings.webResearch.heading).toBeDefined();
        expect(en.settings.processing.heading).toBeDefined();
        expect(en.settings.batchProcessing.heading).toBeDefined();
        expect(en.settings.batchMermaidFix.heading).toBeDefined();
        expect(en.settings.duplicateScope.heading).toBeDefined();
        expect(en.settings.focusedLearning.heading).toBeDefined();

        expect(zhCn.settings.extractOriginalText.heading).not.toBe(en.settings.extractOriginalText.heading);
        expect(zhCn.settings.webResearch.heading).not.toBe(en.settings.webResearch.heading);
        expect(zhTw.settings.batchMermaidFix.heading).not.toBe(en.settings.batchMermaidFix.heading);
        expect(zhTw.settings.focusedLearning.heading).not.toBe(en.settings.focusedLearning.heading);
    });
});
