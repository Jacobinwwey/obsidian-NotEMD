import { searchSettingCatalog, SettingCatalogEntry } from '../ui/settings/settingSearch';
import { createLocalizedSettingIdResolver, createLocalizedSettingMetadataResolver, retainKnownSettingIds } from '../ui/settings/settingCatalog';
import { resolveSettingsNavigation } from '../ui/settings/SettingsNavigation';
import * as fs from 'fs';
import * as path from 'path';

const entries: SettingCatalogEntry[] = [
    {
        id: 'diagrams.export-ppi', categoryId: 'diagrams', categoryLabel: 'Diagrams',
        name: 'Image export PPI', description: 'Controls PNG and PDF clarity.', aliases: ['resolution', 'dpi'],
        elementId: 'setting-diagrams-export-ppi'
    },
    {
        id: 'batch.parallelism', categoryId: 'batch', categoryLabel: 'Batch processing',
        name: 'Batch parallelism', description: 'Process multiple notes concurrently.', aliases: ['concurrency'],
        elementId: 'setting-batch-parallelism'
    },
    {
        id: 'providers.active', categoryId: 'providers', categoryLabel: 'Providers',
        name: 'Active provider', description: 'Default LLM provider.', aliases: ['model'],
        elementId: 'setting-providers-active'
    }
];

const mermaidEntries: SettingCatalogEntry[] = [
    {
        id: 'settings.experimentalDiagramPipeline.drawnixCompanions',
        categoryId: 'settings.experimentalDiagramPipeline',
        categoryLabel: '图形预览与导出',
        name: '同时完整输出 Mermaid 图',
        description: 'Keep Mermaid visuals embedded in Drawnix and optionally write companions.',
        aliases: ['Mermaid visuals'],
        elementId: 'settings-experimental-diagram-pipeline-drawnix-companions'
    },
    {
        id: 'settings.experimentalDiagramPipeline.enable',
        categoryId: 'settings.experimentalDiagramPipeline',
        categoryLabel: '实验性图形管线',
        name: '启用 Spec-first Mermaid 管线',
        description: 'Try the Mermaid-aware DiagramSpec pipeline before the legacy flow.',
        aliases: ['spec-first diagrams'],
        elementId: 'settings-experimental-diagram-pipeline-enable'
    },
    {
        id: 'settings.stableApi.enable',
        categoryId: 'mermaid-internal-stable-api',
        categoryLabel: '稳定 API 调用',
        name: '启用稳定 API 调用',
        description: 'Retry provider calls through the stable API path.',
        aliases: [],
        elementId: 'settings-stable-api-enable'
    }
];

describe('setting catalog search', () => {
    test('returns all settings for an empty query', () => {
        expect(searchSettingCatalog(entries, '')).toHaveLength(3);
    });

    test('matches aliases and same-word bounded fuzzy characters', () => {
        expect(searchSettingCatalog(entries, 'dpi').map(entry => entry.id)).toEqual(['diagrams.export-ppi']);
        expect(searchSettingCatalog(entries, 'btch prallelism').map(entry => entry.id)).toEqual(['batch.parallelism']);
    });

    test('requires stable unique setting ids', () => {
        expect(() => searchSettingCatalog([...entries, { ...entries[0] }], '')).toThrow(/duplicate setting id/i);
    });
});

describe('field-aware setting search', () => {
    test('ranks Mermaid name matches and excludes internal category-id noise', () => {
        const matches = searchSettingCatalog(mermaidEntries, 'Mermaid');

        expect(matches.map(entry => entry.id)).toEqual([
            'settings.experimentalDiagramPipeline.drawnixCompanions',
            'settings.experimentalDiagramPipeline.enable'
        ]);
        expect(matches[0].matchedFields).toContain('name');
        expect(matches[0].score).toBeGreaterThanOrEqual(matches[1].score);
        expect(matches.map(entry => entry.name)).not.toContain('启用稳定 API 调用');
    });

    test('reports description matches without requiring a name match', () => {
        const matches = searchSettingCatalog([
            {
                ...entries[0],
                name: 'Preview quality',
                description: 'Controls Mermaid preview resolution.'
            }
        ], 'Mermaid');

        expect(matches).toHaveLength(1);
        expect(matches[0].matchedFields).toEqual(['description']);
    });

    test('does not join adjacent fields to create a false positive', () => {
        const matches = searchSettingCatalog([
            {
                ...entries[0],
                name: 'Mer',
                description: 'maid',
                aliases: []
            }
        ], 'Mermaid');

        expect(matches).toHaveLength(0);
    });

    test('keeps stable ordering when scores tie and preserves explicit IDs', () => {
        const first = { ...mermaidEntries[0], name: 'Diagram output', description: 'Mermaid export' };
        const second = { ...mermaidEntries[1], name: 'Pipeline output', description: 'Mermaid export' };
        const matches = searchSettingCatalog([first, second], 'Mermaid');

        expect(matches.map(entry => entry.id)).toEqual([first.id, second.id]);
        expect(matches.every(entry => entry.elementId.startsWith('settings-'))).toBe(true);
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
        expect(result.matches[0]).toMatchObject({
            id: 'providers.active',
            matchedFields: ['alias'],
            score: expect.any(Number)
        });
    });
});

test('settings catalog captures declaration copy instead of reading rendered name and description DOM', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts'), 'utf8');
    expect(source).toContain('this.createCatalogSetting(containerEl)');
    expect(source).toContain('this.settingDeclarationCopy.get(item)');
    expect(source).not.toContain("querySelector<HTMLElement>('.setting-item-name')");
    expect(source).not.toContain("querySelector<HTMLElement>('.setting-item-description')");
});

test('settings discovery exposes stable listbox navigation instead of filtering native options', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts'), 'utf8');

    expect(source).toContain("resultPanel.setAttribute('role', 'listbox')");
    expect(source).toContain('aria-expanded');
    expect(source).toContain('settings.experimentalDiagramPipeline.drawnixCompanions');
    expect(source).toContain('elementId');
    expect(source).not.toContain('option.hidden = !visible');
    expect(source).not.toContain('option.disabled = !visible');
});
