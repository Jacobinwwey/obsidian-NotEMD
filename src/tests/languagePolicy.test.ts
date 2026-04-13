import { DEFAULT_SETTINGS } from '../constants';
import { resolveUiLocale } from '../i18n/languageContext';
import {
    resolveTaskLanguageCode,
    resolveTaskLanguageName,
    shouldApplyAutoTranslation
} from '../i18n/taskLanguagePolicy';
import { NotemdSettings, TaskKey } from '../types';

function createSettings(overrides: Partial<NotemdSettings> = {}): NotemdSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...overrides
    };
}

describe('task language policy', () => {
    test('uses global language when per-task language is disabled', () => {
        const settings = createSettings({
            language: 'zh-CN',
            useDifferentLanguagesForTasks: false,
            generateTitleLanguage: 'de'
        });

        expect(resolveTaskLanguageCode(settings, 'generateTitle')).toBe('zh-CN');
    });

    test('uses task-specific language when enabled', () => {
        const settings = createSettings({
            language: 'en',
            useDifferentLanguagesForTasks: true,
            summarizeToMermaidLanguage: 'ja'
        });

        expect(resolveTaskLanguageCode(settings, 'summarizeToMermaid')).toBe('ja');
    });

    test('uses extractOriginalText language for merged mode', () => {
        const settings = createSettings({
            language: 'en',
            useDifferentLanguagesForTasks: true,
            extractOriginalTextLanguage: 'fr'
        });

        expect(resolveTaskLanguageCode(settings, 'extractOriginalTextMerged')).toBe('fr');
    });

    test('translate task always uses global translation target', () => {
        const settings = createSettings({
            language: 'es',
            useDifferentLanguagesForTasks: true
        });

        expect(resolveTaskLanguageCode(settings, 'translate')).toBe('es');
    });

    test('resolves language display name from configured language list', () => {
        const settings = createSettings({
            language: 'zh-CN',
            useDifferentLanguagesForTasks: false
        });

        expect(resolveTaskLanguageName(settings, 'addLinks')).toBe('简体中文');
    });

    test('disableAutoTranslation is ignored for explicit translate task', () => {
        const settings = createSettings({ disableAutoTranslation: true });
        expect(shouldApplyAutoTranslation(settings, 'translate')).toBe(true);
    });

    test('disableAutoTranslation disables auto-translation for non-translate tasks', () => {
        const settings = createSettings({ disableAutoTranslation: true });
        const cases: TaskKey[] = ['addLinks', 'generateTitle', 'researchSummarize', 'summarizeToMermaid', 'extractConcepts'];

        cases.forEach(taskKey => {
            expect(shouldApplyAutoTranslation(settings, taskKey)).toBe(false);
        });
    });
});

describe('ui locale resolution', () => {
    test('uses manual locale when configured and supported', () => {
        const settings = createSettings({ uiLocale: 'zh-CN' });
        expect(resolveUiLocale(settings, 'en')).toBe('zh-CN');
    });

    test('uses obsidian locale when ui locale is auto', () => {
        const settings = createSettings({ uiLocale: 'auto' });
        expect(resolveUiLocale(settings, 'zh_cn')).toBe('zh-CN');
    });

    test('supports expanded advertised locales by default', () => {
        const settings = createSettings({ uiLocale: 'auto' });
        expect(resolveUiLocale(settings, 'fr')).toBe('fr');
    });

    test('falls back to en when unsupported', () => {
        const settings = createSettings({ uiLocale: 'auto' });
        expect(resolveUiLocale(settings, 'xx')).toBe('en');
    });
});
