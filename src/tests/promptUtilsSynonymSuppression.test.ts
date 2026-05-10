import { DEFAULT_SETTINGS } from '../constants';
import {
    CONCEPT_SYNONYM_SUPPRESSION_INSTRUCTION,
    getSystemPrompt
} from '../promptUtils';
import { NotemdSettings } from '../types';

function createSettings(overrides: Partial<NotemdSettings> = {}): NotemdSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...overrides
    };
}

describe('prompt synonym suppression setting', () => {
    test('keeps add-links prompt unchanged when synonym suppression setting is disabled', () => {
        const settings = createSettings({ replaceSynonymsDuringConceptExtraction: false });
        const prompt = getSystemPrompt(settings, 'addLinks');

        expect(prompt).not.toContain(CONCEPT_SYNONYM_SUPPRESSION_INSTRUCTION);
    });

    test('prepends synonym suppression instruction for add-links task when enabled', () => {
        const disabledSettings = createSettings({ replaceSynonymsDuringConceptExtraction: false });
        const enabledSettings = createSettings({ replaceSynonymsDuringConceptExtraction: true });
        const baselinePrompt = getSystemPrompt(disabledSettings, 'addLinks');
        const prompt = getSystemPrompt(enabledSettings, 'addLinks');

        expect(prompt.startsWith(`${CONCEPT_SYNONYM_SUPPRESSION_INSTRUCTION}\n\n`)).toBe(true);
        expect(prompt.endsWith(baselinePrompt)).toBe(true);
    });

    test('prepends synonym suppression instruction for extract-concepts task when enabled', () => {
        const disabledSettings = createSettings({ replaceSynonymsDuringConceptExtraction: false });
        const enabledSettings = createSettings({ replaceSynonymsDuringConceptExtraction: true });
        const baselinePrompt = getSystemPrompt(disabledSettings, 'extractConcepts');
        const prompt = getSystemPrompt(enabledSettings, 'extractConcepts');

        expect(prompt.startsWith(`${CONCEPT_SYNONYM_SUPPRESSION_INSTRUCTION}\n\n`)).toBe(true);
        expect(prompt.endsWith(baselinePrompt)).toBe(true);
    });

    test('does not prepend synonym suppression instruction for unrelated tasks', () => {
        const settings = createSettings({ replaceSynonymsDuringConceptExtraction: true });
        const prompt = getSystemPrompt(settings, 'translate');

        expect(prompt).not.toContain(CONCEPT_SYNONYM_SUPPRESSION_INSTRUCTION);
    });
});
