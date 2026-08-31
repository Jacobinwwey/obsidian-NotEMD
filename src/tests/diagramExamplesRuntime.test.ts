const {
    buildExamplePlans,
    collectCleanupPaths,
    renderExampleInput,
    resolveSafeVaultPath,
    sanitizeDiagnostic,
    validateManifest
} = require('../../scripts/lib/diagram-examples-runtime');

describe('diagram examples runtime contract', () => {
    const flowchart = {
        typeId: 'flowchart',
        fixtureId: 'flowchart-release',
        title: 'Release decision',
        intent: 'flowchart',
        target: 'mermaid',
        selectionRationale: 'Use for an ordered release decision.',
        semanticFacts: ['Build -> Tests -> Release', 'Tests pass before Release']
    };

    test('plans one stable directory and bilingual input path per catalog row', () => {
        const plans = buildExamplePlans(
            [flowchart],
            'docs/diagram-examples',
            'notemd-real-diagram-examples'
        );

        expect(plans).toEqual([
            expect.objectContaining({
                typeId: 'flowchart',
                directory: 'docs/diagram-examples/flowchart',
                inputPath: 'notemd-real-diagram-examples/flowchart.md',
                inputZhPath: 'notemd-real-diagram-examples/flowchart.zh-CN.md'
            })
        ]);
    });

    test('renders equivalent language-specific input headings with requested type and target', () => {
        const english = renderExampleInput(flowchart, 'en');
        const chinese = renderExampleInput(flowchart, 'zh-CN');

        expect(english).toContain('# Release decision');
        expect(english).toContain('Requested diagram type: `flowchart`');
        expect(english).toContain('Requested render target: `mermaid`');
        expect(chinese).toContain('# Release decision');
        expect(chinese).toContain('请求图表类型：`flowchart`');
        expect(chinese).toContain('请求渲染目标：`mermaid`');
        expect(chinese).toContain('Build -> Tests -> Release');
    });

    test('makes the canonical tree response shape explicit in both input languages', () => {
        const tree = {
            typeId: 'tree',
            fixtureId: 'tree-ownership',
            title: 'Ownership tree',
            titleZh: '责任树',
            intent: 'tree',
            sourceIntent: 'tree',
            payloadKind: 'tree',
            target: 'editable-html-svg',
            selectionRationale: 'Use for a single-root parent-to-child hierarchy.',
            selectionRationaleZh: '用于单根父子层级。',
            semanticFacts: [
                'spec.payload.nodes[1]: platform (Platform)',
                'spec.payload.nodes[2]: authoring -> platform (parent)'
            ],
            readingCues: [
                'Confirm the single root.',
                'Check the parent references.',
                'Inspect this evidence first: spec.payload.nodes[1]'
            ],
            readingCuesZh: ['确认只有一个根节点。', '检查父节点引用。']
        };

        const english = renderExampleInput(tree, 'en');
        const chinese = renderExampleInput(tree, 'zh-CN');

        expect(english).toContain('Top-level nodes and edges must remain empty arrays.');
        expect(english).toContain('payload.kind must be `tree`');
        expect(english).toContain('parentId');
        expect(chinese).toContain('顶层 nodes 和 edges 必须保持为空数组');
        expect(chinese).toContain('payload.kind 必须是 `tree`');
        expect(chinese).toContain('parentId');
        expect(chinese).toContain('优先检查这条证据：');
        expect(chinese).not.toContain('Inspect this evidence first');
    });

    test('rejects a vault path that escapes the dedicated prefix', () => {
        expect(() => resolveSafeVaultPath('notemd-real-diagram-examples', '../user.md'))
            .toThrow('outside the dedicated diagram examples prefix');
        expect(() => resolveSafeVaultPath('notemd-real-diagram-examples', 'C:\\Users\\jacob\\user.md'))
            .toThrow('outside the dedicated diagram examples prefix');
    });

    test('redacts secret-shaped diagnostics and absolute paths', () => {
        expect(sanitizeDiagnostic('https://x.test?api_key=secret C:\\Users\\jacob\\vault\\note.md'))
            .toBe('https://x.test?api_key=[REDACTED] <absolute-path>');
    });

    test('returns only paths under the dedicated prefix for cleanup', () => {
        expect(collectCleanupPaths(
            [
                'notemd-real-diagram-examples/flowchart.md',
                'notemd-real-diagram-examples/flowchart_diagram.svg'
            ],
            'notemd-real-diagram-examples'
        )).toEqual([
            'notemd-real-diagram-examples/flowchart.md',
            'notemd-real-diagram-examples/flowchart_diagram.svg'
        ]);
        expect(() => collectCleanupPaths(
            ['notemd-real-diagram-examples/flowchart.md', 'Notes/user.md'],
            'notemd-real-diagram-examples'
        )).toThrow('outside the dedicated diagram examples prefix');
    });

    test('validates manifest membership, file presence, and hashes', () => {
        const manifest = {
            schemaVersion: 1,
            generatedAt: '2026-08-29T00:00:00.000Z',
            catalogSource: 'src/diagram/diagramTypeCatalog.ts',
            expectedCount: 1,
            entries: [{
                typeId: 'flowchart',
                fixtureId: 'flowchart-release',
                title: 'Release decision',
                intent: 'flowchart',
                target: 'mermaid',
                inputPath: 'docs/diagram-examples/flowchart/input.md',
                inputZhPath: 'docs/diagram-examples/flowchart/input.zh-CN.md',
                artifactPath: 'docs/diagram-examples/flowchart/artifact.md',
                svgPath: 'docs/diagram-examples/flowchart/result.svg',
                pngPath: null,
                status: 'passed',
                providerId: 'openai',
                model: 'test-model',
                generatedAt: '2026-08-29T00:00:00.000Z',
                artifactSha256: 'artifact-hash',
                svgSha256: 'svg-hash',
                pngSha256: null,
                sourceNotePath: 'notemd-real-diagram-examples/flowchart.md',
                diagnostic: null
            }]
        };

        expect(validateManifest(manifest, {
            expectedTypeIds: ['flowchart'],
            outputRoot: 'docs/diagram-examples',
            fileRecords: {
                'docs/diagram-examples/flowchart/input.md': { exists: true },
                'docs/diagram-examples/flowchart/input.zh-CN.md': { exists: true },
                'docs/diagram-examples/flowchart/artifact.md': { exists: true, sha256: 'artifact-hash' },
                'docs/diagram-examples/flowchart/result.svg': { exists: true, sha256: 'svg-hash' }
            }
        })).toEqual({ ok: true, failures: [] });

        const invalid = validateManifest(manifest, {
            expectedTypeIds: ['flowchart'],
            outputRoot: 'docs/diagram-examples',
            fileRecords: {
                'docs/diagram-examples/flowchart/input.md': { exists: false },
                'docs/diagram-examples/flowchart/input.zh-CN.md': { exists: true },
                'docs/diagram-examples/flowchart/artifact.md': { exists: true, sha256: 'stale-hash' },
                'docs/diagram-examples/flowchart/result.svg': { exists: true, sha256: 'svg-hash' }
            }
        });
        expect(invalid.ok).toBe(false);
        expect(invalid.failures).toEqual(expect.arrayContaining([
            'flowchart input.md is missing',
            'flowchart artifact.md hash is stale'
        ]));
    });

    test('rejects catalog metadata drift and source paths outside the dedicated Vault prefix', () => {
        const manifest = {
            schemaVersion: 1,
            catalogSource: 'src/diagram/diagramTypeCatalog.ts',
            expectedCount: 1,
            entries: [{
                typeId: 'flowchart',
                fixtureId: 'changed-fixture',
                title: 'Release decision',
                intent: 'stateDiagram',
                target: 'mermaid',
                inputPath: 'docs/diagram-examples/flowchart/input.md',
                inputZhPath: 'docs/diagram-examples/flowchart/input.zh-CN.md',
                status: 'failed',
                sourceNotePath: '/outside/vault.md'
            }]
        };

        const validation = validateManifest(manifest, {
            expectedTypeIds: ['flowchart'],
            expectedCatalogEntries: [{
                typeId: 'flowchart',
                fixtureId: 'flowchart-release',
                title: 'Release decision',
                intent: 'flowchart',
                target: 'mermaid',
                inputPath: 'docs/diagram-examples/flowchart/input.md',
                inputZhPath: 'docs/diagram-examples/flowchart/input.zh-CN.md'
            }],
            vaultPrefix: 'notemd-real-diagram-examples',
            fileRecords: {
                'docs/diagram-examples/flowchart/input.md': { exists: true },
                'docs/diagram-examples/flowchart/input.zh-CN.md': { exists: true }
            }
        });

        expect(validation.ok).toBe(false);
        expect(validation.failures).toEqual(expect.arrayContaining([
            'flowchart fixtureId disagrees with catalog',
            'flowchart intent disagrees with catalog',
            'flowchart sourceNotePath is outside the dedicated Vault prefix.'
        ]));
    });
});
