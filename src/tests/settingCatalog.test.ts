import { searchSettingCatalog, SettingCatalogEntry } from '../ui/settings/settingSearch';
import { createLocalizedSettingIdResolver, createLocalizedSettingMetadataResolver, retainKnownSettingIds } from '../ui/settings/settingCatalog';
import { resolveSettingsNavigation } from '../ui/settings/SettingsNavigation';
import * as fs from 'fs';
import * as path from 'path';

const entries: SettingCatalogEntry[] = [
    { id: 'diagrams.export-ppi', categoryId: 'diagrams', name: 'Image export PPI', description: 'Controls PNG and PDF clarity.', aliases: ['resolution', 'dpi'] },
    { id: 'batch.parallelism', categoryId: 'batch', name: 'Batch parallelism', description: 'Process multiple notes concurrently.', aliases: ['concurrency'] },
    { id: 'providers.active', categoryId: 'providers', name: 'Active provider', description: 'Default LLM provider.', aliases: ['model'] }
];

describe('setting catalog search', () => {
    test('returns all settings for an empty query', () => {
        expect(searchSettingCatalog(entries, '')).toHaveLength(3);
    });

    test('matches aliases and ordered fuzzy characters', () => {
        expect(searchSettingCatalog(entries, 'dpi').map(entry => entry.id)).toEqual(['diagrams.export-ppi']);
        expect(searchSettingCatalog(entries, 'btch prll').map(entry => entry.id)).toEqual(['batch.parallelism']);
    });

    test('requires stable unique setting ids', () => {
        expect(() => searchSettingCatalog([...entries, { ...entries[0] }], '')).toThrow(/duplicate setting id/i);
    });
});

describe('localized setting identity', () => {
    const english = { settings: { model: { name: 'Model', description: 'Model identifier' }, timeout: { name: 'Timeout', description: 'Request timeout' } } };
    const chinese = { settings: { model: { name: '模型', description: '模型标识符' }, timeout: { name: '超时', description: '请求超时时间' } } };

    test('resolves the same stable id across locales', () => {
        const englishResolver = createLocalizedSettingIdResolver(english, english);
        const chineseResolver = createLocalizedSettingIdResolver(chinese, english);

        expect(englishResolver('Model', 'Model identifier')).toBe('settings.model');
        expect(chineseResolver('模型', '模型标识符')).toBe('settings.model');
    });

    test('adds canonical English aliases for localized setting declarations', () => {
        const resolve = createLocalizedSettingMetadataResolver(chinese, english);
        expect(resolve('模型', '模型标识符')).toEqual({
            id: 'settings.model', aliases: ['Model', 'Model identifier']
        });
    });

    test('creates a deterministic fallback for dynamically generated settings', () => {
        const resolve = createLocalizedSettingIdResolver(english, english);
        expect(resolve('Custom provider', 'Endpoint profile')).toBe(resolve('Custom provider', 'Endpoint profile'));
        expect(resolve('Custom provider', 'Endpoint profile')).toMatch(/^dynamic\./);
    });

    test('suppresses unknown and duplicate favorite ids while preserving order', () => {
        expect(retainKnownSettingIds(
            ['settings.model', 'removed.setting', 'settings.model', 'settings.timeout'],
            ['settings.model', 'settings.timeout']
        )).toEqual(['settings.model', 'settings.timeout']);
    });
});

describe('settings navigation state', () => {
    test('combines fuzzy search and favorites while reporting visible categories', () => {
        const result = resolveSettingsNavigation(entries, {
            query: 'model', favoritesOnly: true, favoriteIds: new Set(['providers.active', 'batch.parallelism'])
        });
        expect([...result.visibleIds]).toEqual(['providers.active']);
        expect([...result.visibleCategoryIds]).toEqual(['providers']);
        expect(result.visibleCount).toBe(1);
        expect(result.totalCount).toBe(3);
    });
});

test('settings catalog captures declaration copy instead of reading rendered name and description DOM', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts'), 'utf8');
    expect(source).toContain('this.createCatalogSetting(containerEl)');
    expect(source).toContain('this.settingDeclarationCopy.get(item)');
    expect(source).not.toContain("querySelector<HTMLElement>('.setting-item-name')");
    expect(source).not.toContain("querySelector<HTMLElement>('.setting-item-description')");
});
