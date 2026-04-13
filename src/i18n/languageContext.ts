import { SUPPORTED_UI_LOCALE_CODES } from './uiLocales';
import { NotemdSettings } from '../types';

export const UI_LOCALE_AUTO = 'auto';

function normalizeChineseLocale(locale: string): string {
    const lower = locale.toLowerCase();
    if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh_cn') {
        return 'zh-CN';
    }
    if (lower === 'zh-tw' || lower === 'zh_tw' || lower === 'zh-hant') {
        return 'zh-TW';
    }
    return locale;
}

export function normalizeLocaleCode(locale: string | undefined | null): string {
    if (!locale) {
        return 'en';
    }

    const trimmed = locale.trim();
    if (!trimmed) {
        return 'en';
    }

    const unified = normalizeChineseLocale(trimmed.replace(/_/g, '-'));
    const parts = unified.split('-');
    if (parts.length === 1) {
        return parts[0].toLowerCase();
    }

    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

export function languageCodesEqual(left: string | undefined | null, right: string | undefined | null): boolean {
    return normalizeLocaleCode(left) === normalizeLocaleCode(right);
}

export function resolveLanguageDisplayName(settings: NotemdSettings, languageCode: string): string {
    const normalizedTarget = normalizeLocaleCode(languageCode);
    const language = settings.availableLanguages.find(lang => languageCodesEqual(lang.code, normalizedTarget));
    return language?.name || normalizedTarget;
}

export function resolveUiLocale(
    settings: { uiLocale: string },
    obsidianLocale: string | undefined | null,
    supportedLocales: readonly string[] = SUPPORTED_UI_LOCALE_CODES
): string {
    const normalizedSupported = supportedLocales.map(normalizeLocaleCode);
    const configured = normalizeLocaleCode(settings.uiLocale);

    if (configured !== UI_LOCALE_AUTO && normalizedSupported.includes(configured)) {
        return configured;
    }

    const detected = normalizeLocaleCode(obsidianLocale);
    if (normalizedSupported.includes(detected)) {
        return detected;
    }

    return 'en';
}
