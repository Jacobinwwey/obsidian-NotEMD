export interface SettingCatalogEntry {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    aliases?: string[];
    advanced?: boolean;
}

function normalize(value: string): string {
    return value.toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function isOrderedFuzzyMatch(haystack: string, needle: string): boolean {
    let searchIndex = 0;
    for (const character of needle) {
        searchIndex = haystack.indexOf(character, searchIndex);
        if (searchIndex < 0) {
            return false;
        }
        searchIndex += 1;
    }
    return true;
}

export function searchSettingCatalog(entries: SettingCatalogEntry[], query: string): SettingCatalogEntry[] {
    const ids = new Set<string>();
    for (const entry of entries) {
        if (ids.has(entry.id)) {
            throw new Error(`Duplicate setting id: ${entry.id}`);
        }
        ids.add(entry.id);
    }

    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return [...entries];
    }

    return entries.filter(entry => {
        const searchable = normalize([
            entry.name,
            entry.description,
            entry.categoryId,
            ...(entry.aliases ?? [])
        ].join(' '));
        return tokens.every(token => searchable.includes(token) || (token.length >= 4 && isOrderedFuzzyMatch(searchable, token)));
    });
}
