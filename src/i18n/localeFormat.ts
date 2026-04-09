import { normalizeLocaleCode } from './languageContext';

const RTL_LANGUAGE_PREFIXES = ['ar', 'he', 'fa', 'ur'];

export function isRtlLocale(locale: string | undefined | null): boolean {
    const normalized = normalizeLocaleCode(locale);
    return RTL_LANGUAGE_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export function formatTimeForLocale(date: Date, locale: string | undefined | null): string {
    const normalized = normalizeLocaleCode(locale);
    try {
        return date.toLocaleTimeString(normalized);
    } catch (_error) {
        return date.toLocaleTimeString();
    }
}

export function formatDateForLocale(date: Date, locale: string | undefined | null): string {
    const normalized = normalizeLocaleCode(locale);
    try {
        return date.toLocaleDateString(normalized);
    } catch (_error) {
        return date.toLocaleDateString();
    }
}

