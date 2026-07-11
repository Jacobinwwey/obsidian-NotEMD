import { searchSettingCatalog, SettingCatalogEntry } from '../ui/settings/settingSearch';

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
