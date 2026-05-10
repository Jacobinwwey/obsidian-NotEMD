import { DEFAULT_SETTINGS } from '../constants';
import {
    createCompleteResetSettings,
    createPartialResetSettings
} from '../settingsReset';
import { NotemdSettings } from '../types';

function createCustomizedSettings(): NotemdSettings {
    const settings: NotemdSettings = {
        ...DEFAULT_SETTINGS,
        providers: DEFAULT_SETTINGS.providers.map((provider, index) => ({
            ...provider,
            apiKey: `custom-key-${index + 1}`
        })),
        chunkWordCount: 1234,
        maxTokens: 4321,
        conceptNoteFolder: 'Concepts/Custom',
        useCustomConceptNoteFolder: true,
        enableMermaidErrorDetection: false,
        replaceSynonymsDuringConceptExtraction: true,
        activeProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        addLinksProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        researchProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        generateTitleProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        translateProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        summarizeToMermaidProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        extractConceptsProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        extractOriginalTextProvider: DEFAULT_SETTINGS.providers[0]?.name || DEFAULT_SETTINGS.activeProvider,
        addLinksModel: 'custom-add-links-model',
        researchModel: 'custom-research-model',
        generateTitleModel: 'custom-generate-title-model',
        translateModel: 'custom-translate-model',
        summarizeToMermaidModel: 'custom-mermaid-model',
        extractConceptsModel: 'custom-extract-concepts-model',
        extractOriginalTextModel: 'custom-extract-original-text-model'
    };
    return settings;
}

describe('settings reset helpers', () => {
    test('complete reset returns default settings with cloned mutable objects', () => {
        const reset = createCompleteResetSettings();

        expect(reset).toEqual(DEFAULT_SETTINGS);
        expect(reset).not.toBe(DEFAULT_SETTINGS);
        expect(reset.providers).not.toBe(DEFAULT_SETTINGS.providers);
        expect(reset.availableLanguages).not.toBe(DEFAULT_SETTINGS.availableLanguages);
        expect(reset.providers[0]).not.toBe(DEFAULT_SETTINGS.providers[0]);
    });

    test('partial reset preserves llm provider settings while resetting other fields', () => {
        const customized = createCustomizedSettings();
        const reset = createPartialResetSettings(customized);

        expect(reset.chunkWordCount).toBe(DEFAULT_SETTINGS.chunkWordCount);
        expect(reset.maxTokens).toBe(DEFAULT_SETTINGS.maxTokens);
        expect(reset.conceptNoteFolder).toBe(DEFAULT_SETTINGS.conceptNoteFolder);
        expect(reset.enableMermaidErrorDetection).toBe(DEFAULT_SETTINGS.enableMermaidErrorDetection);
        expect(reset.replaceSynonymsDuringConceptExtraction).toBe(DEFAULT_SETTINGS.replaceSynonymsDuringConceptExtraction);

        expect(reset.providers).toEqual(customized.providers);
        expect(reset.activeProvider).toBe(customized.activeProvider);
        expect(reset.addLinksProvider).toBe(customized.addLinksProvider);
        expect(reset.researchProvider).toBe(customized.researchProvider);
        expect(reset.generateTitleProvider).toBe(customized.generateTitleProvider);
        expect(reset.translateProvider).toBe(customized.translateProvider);
        expect(reset.summarizeToMermaidProvider).toBe(customized.summarizeToMermaidProvider);
        expect(reset.extractConceptsProvider).toBe(customized.extractConceptsProvider);
        expect(reset.extractOriginalTextProvider).toBe(customized.extractOriginalTextProvider);
        expect(reset.addLinksModel).toBe(customized.addLinksModel);
        expect(reset.researchModel).toBe(customized.researchModel);
        expect(reset.generateTitleModel).toBe(customized.generateTitleModel);
        expect(reset.translateModel).toBe(customized.translateModel);
        expect(reset.summarizeToMermaidModel).toBe(customized.summarizeToMermaidModel);
        expect(reset.extractConceptsModel).toBe(customized.extractConceptsModel);
        expect(reset.extractOriginalTextModel).toBe(customized.extractOriginalTextModel);
    });

    test('partial reset clones preserved provider objects to avoid mutating source settings', () => {
        const customized = createCustomizedSettings();
        const reset = createPartialResetSettings(customized);

        expect(reset.providers).not.toBe(customized.providers);
        expect(reset.providers[0]).not.toBe(customized.providers[0]);

        reset.providers[0].apiKey = 'mutated-key';
        expect(customized.providers[0].apiKey).toBe('custom-key-1');
    });
});
