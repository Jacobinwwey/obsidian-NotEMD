import { DEFAULT_SETTINGS } from './constants';
import { NotemdSettings } from './types';

const PROVIDER_SETTING_KEYS: Array<keyof NotemdSettings> = [
    'providers',
    'activeProvider',
    'useMultiModelSettings',
    'addLinksProvider',
    'researchProvider',
    'generateTitleProvider',
    'translateProvider',
    'summarizeToMermaidProvider',
    'extractConceptsProvider',
    'extractOriginalTextProvider',
    'addLinksModel',
    'researchModel',
    'generateTitleModel',
    'translateModel',
    'summarizeToMermaidModel',
    'extractConceptsModel',
    'extractOriginalTextModel'
];

function cloneSettings(settings: NotemdSettings): NotemdSettings {
    return JSON.parse(JSON.stringify(settings)) as NotemdSettings;
}

function cloneValue<T>(value: T): T {
    if (value === undefined) {
        return value;
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

export function createCompleteResetSettings(): NotemdSettings {
    return cloneSettings(DEFAULT_SETTINGS);
}

export function createPartialResetSettings(current: NotemdSettings): NotemdSettings {
    const reset = createCompleteResetSettings();

    for (const key of PROVIDER_SETTING_KEYS) {
        (reset as any)[key] = cloneValue(current[key] as any);
    }

    reset.globalModelAwareMaxTokensTracking = DEFAULT_SETTINGS.globalModelAwareMaxTokensTracking;

    return reset;
}
