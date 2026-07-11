import { searchSettingCatalog, SettingCatalogEntry } from './settingSearch';

export interface SettingsNavigationState {
    query: string;
    favoritesOnly: boolean;
    favoriteIds: ReadonlySet<string>;
}

export interface SettingsNavigationResult {
    visibleIds: ReadonlySet<string>;
    visibleCount: number;
    totalCount: number;
    visibleCategoryIds: ReadonlySet<string>;
}

export function resolveSettingsNavigation(
    catalog: readonly SettingCatalogEntry[],
    state: SettingsNavigationState
): SettingsNavigationResult {
    const matches = searchSettingCatalog([...catalog], state.query)
        .filter(entry => !state.favoritesOnly || state.favoriteIds.has(entry.id));
    return {
        visibleIds: new Set(matches.map(entry => entry.id)),
        visibleCount: matches.length,
        totalCount: catalog.length,
        visibleCategoryIds: new Set(matches.map(entry => entry.categoryId))
    };
}
