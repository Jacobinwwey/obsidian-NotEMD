import { getLanguage } from 'obsidian';
import { normalizeLocaleCode, resolveSupportedLocaleCode, resolveUiLocale, UI_LOCALE_AUTO } from './languageContext';
import { STRINGS_EN, NotemdEnglishStrings } from './locales/en';
import { STRINGS_ZH_CN } from './locales/zh_cn';
import { STRINGS_ZH_TW } from './locales/zh_tw';
import {
    STRINGS_AR,
    STRINGS_DE,
    STRINGS_ES,
    STRINGS_FA,
    STRINGS_FR,
    STRINGS_ID,
    STRINGS_IT,
    STRINGS_JA,
    STRINGS_KO,
    STRINGS_NL,
    STRINGS_PL,
    STRINGS_PT,
    STRINGS_PT_BR,
    STRINGS_RU,
    STRINGS_TH,
    STRINGS_TR,
    STRINGS_UK,
    STRINGS_VI
} from './locales/additional';
import { EXPERIMENTAL_DIAGRAM_PIPELINE_LOCALE_EXTENSIONS } from './locales/experimentalDiagramPipeline';
import { DIAGRAM_ACTION_LOCALE_EXTENSIONS } from './locales/diagramActions';
import { PREVIEW_MODAL_LOCALE_EXTENSIONS } from './locales/previewModal';
import { SUPPORTED_UI_LOCALE_CODES } from './uiLocales';

type TranslationStrings = NotemdEnglishStrings;
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

const LANGUAGE_MAP: Record<string, DeepPartial<TranslationStrings>> = {
    ar: STRINGS_AR,
    de: STRINGS_DE,
    en: STRINGS_EN,
    es: STRINGS_ES,
    fa: STRINGS_FA,
    fr: STRINGS_FR,
    id: STRINGS_ID,
    it: STRINGS_IT,
    ja: STRINGS_JA,
    ko: STRINGS_KO,
    nl: STRINGS_NL,
    pl: STRINGS_PL,
    pt: STRINGS_PT,
    'pt-BR': STRINGS_PT_BR,
    ru: STRINGS_RU,
    th: STRINGS_TH,
    tr: STRINGS_TR,
    uk: STRINGS_UK,
    vi: STRINGS_VI,
    zh: STRINGS_ZH_CN,
    'zh-CN': STRINGS_ZH_CN,
    'zh-TW': STRINGS_ZH_TW
};

const resolvedLanguageCache = new Map<string, TranslationStrings>();

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeTranslationValues(base: unknown, override: unknown): unknown {
    if (override === undefined) {
        return base;
    }

    if (Array.isArray(base)) {
        return Array.isArray(override) ? override : base;
    }

    if (isPlainObject(base)) {
        if (!isPlainObject(override)) {
            return base;
        }

        const result: Record<string, unknown> = {};
        for (const key of Object.keys(base)) {
            result[key] = mergeTranslationValues(base[key], override[key]);
        }
        return result;
    }

    return typeof override === typeof base ? override : base;
}

function getLocaleLayers(locale: string): Array<DeepPartial<TranslationStrings>> {
    return [
        LANGUAGE_MAP[locale],
        EXPERIMENTAL_DIAGRAM_PIPELINE_LOCALE_EXTENSIONS[locale],
        DIAGRAM_ACTION_LOCALE_EXTENSIONS[locale],
        PREVIEW_MODAL_LOCALE_EXTENSIONS[locale]
    ].filter((value): value is DeepPartial<TranslationStrings> => Boolean(value));
}

export function getResolvedStrings(locale: string): TranslationStrings {
    const normalizedLocale = resolveSupportedLocaleCode(locale);
    if (normalizedLocale === 'en') {
        return STRINGS_EN;
    }

    const cached = resolvedLanguageCache.get(normalizedLocale);
    if (cached) {
        return cached;
    }

    let merged: TranslationStrings = STRINGS_EN;
    for (const layer of getLocaleLayers(normalizedLocale)) {
        merged = mergeTranslationValues(merged, layer) as TranslationStrings;
    }
    resolvedLanguageCache.set(normalizedLocale, merged);
    return merged;
}

export function clearI18nCache(): void {
    resolvedLanguageCache.clear();
}

export function getCurrentObsidianLocale(): string {
    return normalizeLocaleCode(getLanguage());
}

export function getCurrentUiLocale(settings?: { uiLocale?: string }): string {
    return resolveUiLocale(
        { uiLocale: settings?.uiLocale ?? UI_LOCALE_AUTO },
        getCurrentObsidianLocale(),
        SUPPORTED_UI_LOCALE_CODES
    );
}

export function getI18nStrings(settings?: { uiLocale?: string }): TranslationStrings {
    return getResolvedStrings(getCurrentUiLocale(settings));
}

export function formatI18n(template: string, variables: Record<string, string | number>): string {
    return template.replace(/{(\w+)}/g, (_, key: string) => {
        const value = variables[key];
        return value === undefined ? `{${key}}` : String(value);
    });
}

export const strings: TranslationStrings = getI18nStrings();
