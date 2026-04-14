import { resolveRenderTheme } from '../rendering/theme';

describe('render theme config', () => {
    test('resolves explicit themes without environment checks', () => {
        expect(resolveRenderTheme('dark')).toBe('dark');
        expect(resolveRenderTheme('light')).toBe('light');
    });

    test('maps system theme to dark when Obsidian body uses theme-dark', () => {
        expect(resolveRenderTheme('system', {
            bodyClassListContains: (className) => className === 'theme-dark'
        })).toBe('dark');
    });

    test('maps system theme to light when Obsidian body uses theme-light', () => {
        expect(resolveRenderTheme('system', {
            bodyClassListContains: (className) => className === 'theme-light'
        })).toBe('light');
    });

    test('falls back to light when no theme signal exists', () => {
        expect(resolveRenderTheme('system', {
            bodyClassListContains: () => false,
            matchMedia: () => null
        })).toBe('light');
    });
});
