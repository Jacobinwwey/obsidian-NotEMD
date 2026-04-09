jest.mock('obsidian');

import { getLanguage } from 'obsidian';
import { clearI18nCache, formatI18n, getI18nStrings, getResolvedStrings } from '../i18n';

describe('i18n fallback and cache', () => {
    beforeEach(() => {
        clearI18nCache();
        (getLanguage as jest.Mock).mockReset();
    });

    test('falls back to English when locale is unsupported', () => {
        const locale = getResolvedStrings('fr');
        expect(locale.common.cancel).toBe('Cancel');
        expect(locale.sidebar.logOutputTitle).toBe('Log output');
    });

    test('supports zh locale alias resolution', () => {
        const zh = getResolvedStrings('zh');
        expect(zh.common.cancel).toBe('取消');
    });

    test('fills missing localized keys from English base catalog', () => {
        const zhTw = getResolvedStrings('zh-TW');
        expect(zhTw.notices.notemdBusy).toBe('Notemd 忙碌中。');
        // This key exists in English and should always be available even if future locales omit it.
        expect(zhTw.common.unknownError).toBeDefined();
    });

    test('returns cached object for identical locale', () => {
        const first = getResolvedStrings('zh-CN');
        const second = getResolvedStrings('zh_cn');
        expect(first).toBe(second);
    });

    test('resolves strings using Obsidian language when uiLocale is auto', () => {
        (getLanguage as jest.Mock).mockReturnValue('zh-cn');
        const resolved = getI18nStrings({ uiLocale: 'auto' });
        expect(resolved.common.language).toBe('语言');
    });

    test('manual ui locale override has priority over Obsidian language', () => {
        (getLanguage as jest.Mock).mockReturnValue('en');
        const resolved = getI18nStrings({ uiLocale: 'zh-TW' });
        expect(resolved.common.language).toBe('語言');
    });

    test('formats placeholders', () => {
        expect(formatI18n('Language changed to {language}', { language: 'zh-CN' })).toBe('Language changed to zh-CN');
    });
});

