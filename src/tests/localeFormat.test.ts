import { formatDateForLocale, formatTimeForLocale, isRtlLocale } from '../i18n/localeFormat';

describe('localeFormat utilities', () => {
    test('detects RTL locales by prefix', () => {
        expect(isRtlLocale('ar')).toBe(true);
        expect(isRtlLocale('he-IL')).toBe(true);
        expect(isRtlLocale('fa_IR')).toBe(true);
        expect(isRtlLocale('en')).toBe(false);
    });

    test('formats time with provided locale and falls back safely', () => {
        const date = new Date('2026-01-02T03:04:05.000Z');
        const formatted = formatTimeForLocale(date, 'en-US');
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);

        const fallback = formatTimeForLocale(date, 'invalid-locale-name');
        expect(typeof fallback).toBe('string');
        expect(fallback.length).toBeGreaterThan(0);
    });

    test('formats date with provided locale and falls back safely', () => {
        const date = new Date('2026-01-02T03:04:05.000Z');
        const formatted = formatDateForLocale(date, 'zh-CN');
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);

        const fallback = formatDateForLocale(date, 'invalid-locale-name');
        expect(typeof fallback).toBe('string');
        expect(fallback.length).toBeGreaterThan(0);
    });
});

