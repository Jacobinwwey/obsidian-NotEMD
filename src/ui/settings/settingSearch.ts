export type SettingSearchMatchedField = 'name' | 'description' | 'alias' | 'category';

export interface SettingCatalogEntry {
    id: string;
    categoryId: string;
    categoryLabel: string;
    name: string;
    description: string;
    aliases: string[];
    elementId: string;
}

export interface SettingSearchMatch extends SettingCatalogEntry {
    score: number;
    matchedFields: SettingSearchMatchedField[];
}

type SearchTier = 'exact' | 'prefix' | 'substring' | 'fuzzy';

const MIN_FUZZY_TOKEN_LENGTH = 4;
const MAX_FUZZY_EDIT_DISTANCE = 1;

const FIELD_SCORES: Record<SettingSearchMatchedField, Record<SearchTier, number>> = {
    name: { exact: 1000, prefix: 800, substring: 700, fuzzy: 500 },
    alias: { exact: 600, prefix: 550, substring: 500, fuzzy: 350 },
    description: { exact: 300, prefix: 250, substring: 200, fuzzy: 150 },
    category: { exact: 100, prefix: 90, substring: 80, fuzzy: 60 }
};

function normalize(value: string): string {
    return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function tokenize(value: string): string[] {
    return normalize(value).split(/\s+/).filter(Boolean);
}

function isLatinWord(value: string): boolean {
    return /^[a-z0-9]+$/i.test(value);
}

function isWithinEditDistance(left: string, right: string, maxDistance: number): boolean {
    if (Math.abs(left.length - right.length) > maxDistance) {
        return false;
    }

    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        const current = [leftIndex];
        let rowMinimum = current[0];
        for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
            const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
            const distance = Math.min(
                previous[rightIndex] + 1,
                current[rightIndex - 1] + 1,
                previous[rightIndex - 1] + substitutionCost
            );
            current.push(distance);
            rowMinimum = Math.min(rowMinimum, distance);
        }
        if (rowMinimum > maxDistance) {
            return false;
        }
        previous = current;
    }
    return previous[right.length] <= maxDistance;
}

function resolveSearchTier(fieldValue: string, token: string): SearchTier | undefined {
    const normalizedField = normalize(fieldValue);
    if (!normalizedField) {
        return undefined;
    }

    const words = tokenize(fieldValue);
    if (words.includes(token)) {
        return 'exact';
    }
    if (words.some(word => word.startsWith(token))) {
        return 'prefix';
    }
    if (normalizedField.includes(token)) {
        return 'substring';
    }
    if (token.length < MIN_FUZZY_TOKEN_LENGTH || !isLatinWord(token)) {
        return undefined;
    }

    return words.some(word => isLatinWord(word)
        && isWithinEditDistance(word, token, MAX_FUZZY_EDIT_DISTANCE))
        ? 'fuzzy'
        : undefined;
}

function resolveFieldScore(
    fieldValue: string,
    token: string,
    field: SettingSearchMatchedField
): number | undefined {
    const tier = resolveSearchTier(fieldValue, token);
    return tier ? FIELD_SCORES[field][tier] : undefined;
}

function collectTokenMatches(entry: SettingCatalogEntry, token: string): Array<{ field: SettingSearchMatchedField; score: number }> {
    const matches: Array<{ field: SettingSearchMatchedField; score: number }> = [];
    const nameScore = resolveFieldScore(entry.name, token, 'name');
    if (nameScore !== undefined) matches.push({ field: 'name', score: nameScore });

    const descriptionScore = resolveFieldScore(entry.description, token, 'description');
    if (descriptionScore !== undefined) matches.push({ field: 'description', score: descriptionScore });

    const aliasScore = entry.aliases.reduce<number | undefined>((best, alias) => {
        const score = resolveFieldScore(alias, token, 'alias');
        return score === undefined ? best : Math.max(best ?? 0, score);
    }, undefined);
    if (aliasScore !== undefined) matches.push({ field: 'alias', score: aliasScore });

    const categoryScore = resolveFieldScore(entry.categoryLabel, token, 'category');
    if (categoryScore !== undefined) matches.push({ field: 'category', score: categoryScore });

    return matches;
}

function assertUniqueSettingIds(entries: readonly SettingCatalogEntry[]): void {
    const ids = new Set<string>();
    for (const entry of entries) {
        if (ids.has(entry.id)) {
            throw new Error(`Duplicate setting id: ${entry.id}`);
        }
        ids.add(entry.id);
    }
}

export function searchSettingCatalog(
    entries: readonly SettingCatalogEntry[],
    query: string
): SettingSearchMatch[] {
    assertUniqueSettingIds(entries);

    const tokens = tokenize(query);
    if (tokens.length === 0) {
        return entries.map(entry => ({ ...entry, score: 0, matchedFields: [] }));
    }

    return entries
        .map((entry, declarationIndex) => {
            let score = 0;
            const matchedFields = new Set<SettingSearchMatchedField>();

            for (const token of tokens) {
                const tokenMatches = collectTokenMatches(entry, token);
                if (tokenMatches.length === 0) {
                    return undefined;
                }
                score += Math.max(...tokenMatches.map(match => match.score));
                tokenMatches.forEach(match => matchedFields.add(match.field));
            }

            return {
                ...entry,
                score,
                matchedFields: Array.from(matchedFields),
                declarationIndex
            };
        })
        .filter((match): match is SettingSearchMatch & { declarationIndex: number } => Boolean(match))
        .sort((left, right) => right.score - left.score
            || left.declarationIndex - right.declarationIndex
            || left.id.localeCompare(right.id))
        .map(({ declarationIndex: _declarationIndex, ...match }) => match);
}
