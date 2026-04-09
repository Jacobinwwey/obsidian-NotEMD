import { NotemdSettings, TaskKey } from '../types';
import { resolveLanguageDisplayName } from './languageContext';

type LanguageSettingKey =
    | 'generateTitleLanguage'
    | 'researchSummarizeLanguage'
    | 'addLinksLanguage'
    | 'summarizeToMermaidLanguage'
    | 'extractConceptsLanguage'
    | 'extractOriginalTextLanguage';

const TASK_LANGUAGE_KEY_MAP: Partial<Record<TaskKey, LanguageSettingKey>> = {
    addLinks: 'addLinksLanguage',
    generateTitle: 'generateTitleLanguage',
    researchSummarize: 'researchSummarizeLanguage',
    summarizeToMermaid: 'summarizeToMermaidLanguage',
    extractConcepts: 'extractConceptsLanguage',
    extractOriginalText: 'extractOriginalTextLanguage',
    extractOriginalTextMerged: 'extractOriginalTextLanguage'
};

export function shouldApplyAutoTranslation(settings: NotemdSettings, taskKey: TaskKey): boolean {
    if (taskKey === 'translate') {
        return true;
    }
    return !settings.disableAutoTranslation;
}

export function resolveTaskLanguageCode(settings: NotemdSettings, taskKey: TaskKey): string {
    if (taskKey === 'translate') {
        return settings.language || 'en';
    }

    if (settings.useDifferentLanguagesForTasks) {
        const key = TASK_LANGUAGE_KEY_MAP[taskKey];
        if (key) {
            const taskLanguage = settings[key];
            if (typeof taskLanguage === 'string' && taskLanguage.trim().length > 0) {
                return taskLanguage;
            }
        }
    }

    return settings.language || 'en';
}

export function resolveTaskLanguageName(settings: NotemdSettings, taskKey: TaskKey): string {
    return resolveLanguageDisplayName(settings, resolveTaskLanguageCode(settings, taskKey));
}

