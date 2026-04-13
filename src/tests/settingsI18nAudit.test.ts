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

    test('localizes provider, workflow, and task settings instead of hardcoding upper settings copy', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        const hardcodedLabels = [
            'LLM providers',
            'Manage provider configurations',
            'Active provider',
            'Multi-model usage',
            'Use different providers for tasks',
            'Task: Translate',
            'Customise translation file save path',
            'Task: Summarise as Mermaid diagram',
            'Customise Mermaid summary save path',
            'Task: Extract Concepts',
            'Create minimal concept notes',
            'Stable API calls',
            'Enable stable API calls (retry logic)',
            'Processed file output',
            'Customize processed file save path',
            'Concept note output',
            'Concept log file output',
            'Content generation & output',
            'Enable research in "Generate from title"',
            'One-click workflow buttons',
            'Workflow error strategy',
            'Visual workflow builder',
            'Advanced DSL editor',
            'Workflow DSL validation',
            'Available workflow action IDs',
            'Custom prompt settings',
            'Enable custom prompts for specific tasks',
            'Button name',
            'Action sequence',
            'Add workflow',
            'Reset to default'
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

    test('ships catalog keys for upper settings sections in english and chinese locales', () => {
        const en = getResolvedStrings('en');
        const zhCn = getResolvedStrings('zh-CN');
        const zhTw = getResolvedStrings('zh-TW');

        expect(en.settings.providerConfig.heading).toBeDefined();
        expect(en.settings.multiModel.heading).toBeDefined();
        expect(en.settings.translationTask.heading).toBeDefined();
        expect(en.settings.mermaidTask.heading).toBeDefined();
        expect(en.settings.extractConceptsTask.heading).toBeDefined();
        expect(en.settings.stableApi.heading).toBeDefined();
        expect(en.settings.generalOutput.processedHeading).toBeDefined();
        expect(en.settings.contentGeneration.heading).toBeDefined();
        expect(en.settings.customPrompts.heading).toBeDefined();
        expect(en.settings.workflowBuilder.heading).toBeDefined();

        expect(zhCn.settings.providerConfig.heading).not.toBe(en.settings.providerConfig.heading);
        expect(zhCn.settings.generalOutput.processedHeading).not.toBe(en.settings.generalOutput.processedHeading);
        expect(zhCn.settings.workflowBuilder.heading).not.toBe(en.settings.workflowBuilder.heading);
        expect(zhTw.settings.translationTask.heading).not.toBe(en.settings.translationTask.heading);
        expect(zhTw.settings.contentGeneration.heading).not.toBe(en.settings.contentGeneration.heading);
        expect(zhTw.settings.stableApi.heading).not.toBe(en.settings.stableApi.heading);
    });
});
