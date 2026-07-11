type TranslationTree = Record<string, unknown>;

function collectStringPaths(value: unknown, prefix = '', paths = new Map<string, string>()): Map<string, string> {
    if (typeof value === 'string') {
        if (!paths.has(value)) paths.set(value, prefix);
        return paths;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return paths;
    for (const [key, child] of Object.entries(value as TranslationTree)) {
        collectStringPaths(child, prefix ? `${prefix}.${key}` : key, paths);
    }
    return paths;
}

function settingRoot(path: string): string {
    return path.replace(/\.(name|description|desc|title|label)$/, '');
}

function stableHash(value: string): string {
    let hash = 2166136261;
    for (const character of value.normalize('NFKC').toLocaleLowerCase()) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

export function createLocalizedSettingIdResolver(current: TranslationTree, canonicalEnglish: TranslationTree) {
    const currentPaths = collectStringPaths(current);
    const englishPaths = collectStringPaths(canonicalEnglish);
    return (name: string, description: string): string => {
        const namePath = currentPaths.get(name) ?? englishPaths.get(name);
        const descriptionPath = currentPaths.get(description) ?? englishPaths.get(description);
        const path = namePath ?? descriptionPath;
        if (path) return settingRoot(path);
        return `dynamic.${stableHash(`${name}\u0000${description}`)}`;
    };
}

export function retainKnownSettingIds(savedIds: readonly string[], knownIds: readonly string[]): string[] {
    const known = new Set(knownIds);
    const retained = new Set<string>();
    for (const id of savedIds) {
        if (known.has(id)) retained.add(id);
    }
    return [...retained];
}
