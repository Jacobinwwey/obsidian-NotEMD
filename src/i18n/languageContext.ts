import { SUPPORTED_UI_LOCALE_CODES } from './uiLocales';
import { NotemdSettings } from '../types';

export const UI_LOCALE_AUTO = 'auto';

const CHINESE_TRADITIONAL_SEGMENTS = new Set(['hant', 'tw', 'hk', 'mo']);
const CHINESE_SIMPLIFIED_SEGMENTS = new Set(['hans', 'cn', 'sg', 'my']);

function normalizeChineseLocale(locale: string): string {
    const lower = locale.toLowerCase().replace(/_/g, '-');
    const segments = lower.split('-').filter(Boolean);

    if (segments.length <= 1) {
        return 'zh-CN';
    }

    const variants = segments.slice(1);
    if (variants.some(segment => CHINESE_TRADITIONAL_SEGMENTS.has(segment))) {
        return 'zh-TW';
    }
    if (variants.some(segment => CHINESE_SIMPLIFIED_SEGMENTS.has(segment))) {
        return 'zh-CN';
    }

    return 'zh-CN';
}

function normalizeLocaleSubtag(subtag: string): string {
    if (/^\d+$/.test(subtag)) {
        return subtag;
    }
    if (/^[a-z]{2}$/i.test(subtag)) {
        return subtag.toUpperCase();
    }
    if (/^[a-z]{4}$/i.test(subtag)) {
        return `${subtag[0].toUpperCase()}${subtag.slice(1).toLowerCase()}`;
    }
    return subtag.toLowerCase();
}

export function normalizeLocaleCode(locale: string | undefined | null): string {
    if (!locale) {
        return 'en';
    }

    const trimmed = locale.trim();
    if (!trimmed) {
        return 'en';
    }

    const unified = trimmed.replace(/_/g, '-');
    const parts = unified.split('-').filter(Boolean);
    if (parts.length === 0) {
        return 'en';
    }

    if (parts[0].toLowerCase() === 'zh') {
        return normalizeChineseLocale(unified);
    }

    if (parts.length === 1) {
        return parts[0].toLowerCase();
    }

    return [
        parts[0].toLowerCase(),
        ...parts.slice(1).map(normalizeLocaleSubtag)
    ].join('-');
}

export function resolveSupportedLocaleCode(
    locale: string | undefined | null,
    supportedLocales: readonly string[] = SUPPORTED_UI_LOCALE_CODES
): string {
    const normalized = normalizeLocaleCode(locale);
    const normalizedSupported = supportedLocales.map(normalizeLocaleCode);

    if (normalizedSupported.includes(normalized)) {
        return normalized;
    }

    const [baseLanguage] = normalized.split('-');
    if (normalizedSupported.includes(baseLanguage)) {
        return baseLanguage;
    }

    return 'en';
}

export function languageCodesEqual(left: string | undefined | null, right: string | undefined | null): boolean {
    return resolveSupportedLocaleCode(left) === resolveSupportedLocaleCode(right);
}

export function resolveLanguageDisplayName(settings: NotemdSettings, languageCode: string): string {
    const normalizedTarget = resolveSupportedLocaleCode(
        languageCode,
        settings.availableLanguages.map(language => language.code)
    );
    const language = settings.availableLanguages.find(lang => languageCodesEqual(lang.code, normalizedTarget));
    return language?.name || normalizedTarget;
}

export function resolveUiLocale(
    settings: { uiLocale: string },
    obsidianLocale: string | undefined | null,
    supportedLocales: readonly string[] = SUPPORTED_UI_LOCALE_CODES
): string {
    const configured = resolveSupportedLocaleCode(settings.uiLocale, supportedLocales);

    if (settings.uiLocale !== UI_LOCALE_AUTO && configured !== 'en') {
        return configured;
    }

    if (settings.uiLocale !== UI_LOCALE_AUTO && normalizeLocaleCode(settings.uiLocale) === 'en') {
        return 'en';
    }

    return resolveSupportedLocaleCode(obsidianLocale, supportedLocales);
}
