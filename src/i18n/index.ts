import { getLanguage } from 'obsidian';
import { normalizeLocaleCode, resolveUiLocale } from './languageContext';
import { STRINGS_EN, NotemdEnglishStrings } from './locales/en';
import { STRINGS_ZH_CN } from './locales/zh_cn';
import { STRINGS_ZH_TW } from './locales/zh_tw';

type TranslationStrings = NotemdEnglishStrings;
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

const LANGUAGE_MAP: Record<string, DeepPartial<TranslationStrings>> = {
    en: STRINGS_EN,
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

export function getResolvedStrings(locale: string): TranslationStrings {
    const normalizedLocale = normalizeLocaleCode(locale);
    if (normalizedLocale === 'en') {
        return STRINGS_EN;
    }

    const cached = resolvedLanguageCache.get(normalizedLocale);
    if (cached) {
        return cached;
    }

    const merged = mergeTranslationValues(STRINGS_EN, LANGUAGE_MAP[normalizedLocale] || LANGUAGE_MAP.en) as TranslationStrings;
    resolvedLanguageCache.set(normalizedLocale, merged);
    return merged;
}

export function clearI18nCache(): void {
    resolvedLanguageCache.clear();
}

export function getCurrentObsidianLocale(): string {
    return normalizeLocaleCode(getLanguage());
}

export function getI18nStrings(settings?: { uiLocale: string }): TranslationStrings {
    if (settings) {
        const locale = resolveUiLocale(settings, getCurrentObsidianLocale(), Object.keys(LANGUAGE_MAP));
        return getResolvedStrings(locale);
    }
    return getResolvedStrings(getCurrentObsidianLocale());
}

export function formatI18n(template: string, variables: Record<string, string | number>): string {
    return template.replace(/{(\w+)}/g, (_, key: string) => {
        const value = variables[key];
        return value === undefined ? `{${key}}` : String(value);
    });
}

export const strings: TranslationStrings = getI18nStrings();
