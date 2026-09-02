import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import { getDiagramCapabilityManifest } from '../diagram/diagramCapabilityManifest';
import { listRenderTargetDescriptors, DIAGRAM_EXPORT_FORMATS } from '../rendering/renderTargetCatalog';
import { LLM_PROVIDER_DEFINITIONS } from '../llmProviders';
import { SUPPORTED_UI_LOCALES } from '../i18n/uiLocales';
import { listOperationDefinitions } from '../operations/registry';

interface DiagramExampleManifestEntry {
    typeId: string;
    fixtureId: string;
    inputPath: string;
    inputZhPath: string;
    status: string;
}

interface DiagramExampleManifest {
    schemaVersion: number;
    expectedCount: number;
    entries: DiagramExampleManifestEntry[];
}

const repoRoot = path.resolve(__dirname, '../..');

function readRepoFile(relativePath: string): string {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertRepoFile(relativePath: string): void {
    expect(existsSync(path.join(repoRoot, relativePath))).toBe(true);
}

function readExampleManifest(): DiagramExampleManifest {
    return JSON.parse(readRepoFile('docs/diagram-examples/manifest.json')) as DiagramExampleManifest;
}

describe('current-main documentation contract', () => {
    test('records the current runtime count matrix', () => {
        const progressEnglish = readRepoFile('docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.md');
        const progressChinese = readRepoFile('docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md');
        const websiteLocaleSource = readRepoFile('website/src/lib/publishedLocales.mjs');
        const capabilityManifest = getDiagramCapabilityManifest();

        expect(EXECUTABLE_DIAGRAM_TYPES).toHaveLength(33);
        expect(new Set(EXECUTABLE_DIAGRAM_TYPES.map(type => type.intent)).size).toBe(30);
        expect(listRenderTargetDescriptors()).toHaveLength(8);
        expect(DIAGRAM_EXPORT_FORMATS).toHaveLength(3);
        expect(LLM_PROVIDER_DEFINITIONS).toHaveLength(36);
        expect(SUPPORTED_UI_LOCALES).toHaveLength(21);
        expect(listOperationDefinitions()).toHaveLength(29);
        expect(capabilityManifest.shippedTypes).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        expect(capabilityManifest.referenceOnlyLayouts).toHaveLength(5);
        expect((websiteLocaleSource.match(/^\s*\{locale:/gm) || [])).toHaveLength(34);

        for (const marker of [
            'Executable diagram catalog rows | 33',
            'Semantic diagram intents | 30',
            'Render targets | 8',
            'Image export formats | 3',
            'Provider definitions | 36',
            'Plugin UI locales | 21',
            'Published website locales | 34',
            'Registered operation contracts | 29',
            'Reference-only diagram grammars | 5'
        ]) {
            expect(progressEnglish).toContain(marker);
        }
        expect(progressEnglish).toContain('Compatibility Inventory And Ponytail Audit');
        expect(progressEnglish).toContain('no production dependency that can be removed safely');

        for (const marker of [
            '可执行图表目录行 | 33',
            '语义图表 intent | 30',
            '渲染 target | 8',
            '图片导出格式 | 3',
            'Provider 定义 | 36',
            '插件 UI locale | 21',
            '已发布网站 locale | 34',
            '已注册 operation 契约 | 29',
            '仅参考图表 grammar | 5'
        ]) {
            expect(progressChinese).toContain(marker);
        }
        expect(progressChinese).toContain('兼容层盘点与 Ponytail 审计');
        expect(progressChinese).toContain('没有发现可以在本次收敛切片中安全删除的生产依赖');
    });

    test('keeps every executable diagram backed by bilingual real-vault inputs', () => {
        const manifest = readExampleManifest();
        const entriesByType = new Map(manifest.entries.map(entry => [entry.typeId, entry]));

        expect(manifest.schemaVersion).toBe(1);
        expect(manifest.expectedCount).toBe(EXECUTABLE_DIAGRAM_TYPES.length);
        expect(manifest.entries).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        expect(new Set(manifest.entries.map(entry => entry.typeId)).size).toBe(manifest.entries.length);

        for (const type of EXECUTABLE_DIAGRAM_TYPES) {
            const entry = entriesByType.get(type.id);
            expect(entry).toBeDefined();
            if (!entry) {
                throw new Error(`Missing real-Vault example manifest entry for ${type.id}`);
            }
            expect(entry.fixtureId).toBe(type.exampleFixtureId);
            expect(entry.status).toBe('passed');
            expect(entry.inputPath).toMatch(/^docs\/diagram-examples\//);
            expect(entry.inputZhPath).toMatch(/^docs\/diagram-examples\//);
            assertRepoFile(entry.inputPath);
            assertRepoFile(entry.inputZhPath);
        }
    });

    test('keeps the capability catalog and current docs free of known stale claims', () => {
        const catalogEnglish = readRepoFile('docs/maintainer/diagram-capability-catalog.md');
        const catalogChinese = readRepoFile('docs/maintainer/diagram-capability-catalog.zh-CN.md');
        const architectureEnglish = readRepoFile('docs/architecture.md');
        const architectureChinese = readRepoFile('docs/architecture.zh-CN.md');
        const slidevEnglish = readRepoFile('docs/slidev/architecture.stage15.slidev.md');
        const slidevChinese = readRepoFile('docs/slidev/architecture.stage15.slidev.zh-CN.md');
        const shippedCatalogSection = catalogEnglish.match(/## Shipped Semantic Types([\s\S]*?)(?=## Render Targets)/)?.[1] || '';
        const catalogRows = shippedCatalogSection.match(/^\| `[^`]+` \|/gm) || [];
        const catalogReferenceSection = catalogEnglish.match(/## Reference-Only \/ Planned Types([\s\S]*?)(?=## Preview and Gallery Contract)/)?.[1] || '';
        const catalogReferenceIds = catalogReferenceSection.match(/diagram-design:[a-z-]+/g) || [];

        expect(catalogRows).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        for (const type of EXECUTABLE_DIAGRAM_TYPES) {
            expect(catalogEnglish).toContain(`| \`${type.id}\` |`);
            expect(catalogChinese).toContain(`| \`${type.id}\` |`);
        }
        expect([...new Set(catalogReferenceIds)]).toEqual([
            'diagram-design:flowchart',
            'diagram-design:sequence',
            'diagram-design:state-machine',
            'diagram-design:er-data-model',
            'diagram-design:pyramid-funnel'
        ]);

        const currentDocs = [catalogEnglish, catalogChinese, architectureEnglish, architectureChinese, slidevEnglish, slidevChinese];
        for (const document of currentDocs) {
            expect(document).not.toContain('22 providers');
            expect(document).not.toContain('22 个提供商');
            expect(document).not.toContain('26 provider definitions');
            expect(document).not.toContain('26 个提供商定义');
            expect(document).not.toContain('22 reference-only layouts');
            expect(document).not.toContain('22 个仅参考布局');
        }
    });

    test('publishes both current-main documents and their docs hub links', () => {
        const indexEnglish = readRepoFile('docs/index.md');
        const indexChinese = readRepoFile('docs/index.zh-CN.md');
        const readmeEnglish = readRepoFile('docs/README.md');
        const readmeChinese = readRepoFile('docs/README.zh-CN.md');
        const planEnglish = 'docs/superpowers/plans/2026-09-02-current-main-truth-convergence.en.md';
        const planChinese = 'docs/superpowers/plans/2026-09-02-current-main-truth-convergence.zh-CN.md';
        const progressEnglish = 'docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.md';
        const progressChinese = 'docs/brainstorms/2026-09-02-current-main-progress-and-forward-plan.zh-CN.md';

        for (const file of [planEnglish, planChinese, progressEnglish, progressChinese]) {
            assertRepoFile(file);
        }
        expect(indexEnglish).toContain(`./${planEnglish.replace('docs/', '')}`);
        expect(indexEnglish).toContain(`./${progressEnglish.replace('docs/', '')}`);
        expect(indexChinese).toContain(`./${planChinese.replace('docs/', '')}`);
        expect(indexChinese).toContain(`./${progressChinese.replace('docs/', '')}`);
        expect(readmeEnglish).toContain(`./${planEnglish.replace('docs/', '')}`);
        expect(readmeEnglish).toContain(`./${progressEnglish.replace('docs/', '')}`);
        expect(readmeChinese).toContain(`./${planChinese.replace('docs/', '')}`);
        expect(readmeChinese).toContain(`./${progressChinese.replace('docs/', '')}`);
    });
});
