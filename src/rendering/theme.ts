export type RenderWebviewTheme = 'system' | 'light' | 'dark';
export type ResolvedRenderTheme = 'light' | 'dark';

export interface RenderThemeEnvironment {
    bodyClassListContains?: (className: string) => boolean;
    matchMedia?: (query: string) => { matches: boolean } | null | undefined;
}

function createDefaultThemeEnvironment(): RenderThemeEnvironment {
    return {
        bodyClassListContains: (className) => {
            if (typeof document === 'undefined' || !document.body) {
                return false;
            }

            return document.body.classList.contains(className);
        },
        matchMedia: (query) => {
            if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
                return null;
            }

            return window.matchMedia(query);
        }
    };
}

export function resolveRenderTheme(
    theme: RenderWebviewTheme = 'system',
    environment: RenderThemeEnvironment = createDefaultThemeEnvironment()
): ResolvedRenderTheme {
    if (theme === 'dark' || theme === 'light') {
        return theme;
    }

    if (environment.bodyClassListContains?.('theme-dark')) {
        return 'dark';
    }

    if (environment.bodyClassListContains?.('theme-light')) {
        return 'light';
    }

    if (environment.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
        return 'dark';
    }

    return 'light';
}
