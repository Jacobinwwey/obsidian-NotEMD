const { runExampleBatch } = require('../../scripts/generate-diagram-examples');

function fakePlan(typeId = 'flowchart') {
    return {
        typeId,
        fixtureId: `${typeId}-release`,
        title: 'Release decision',
        titleZh: '发布决策',
        selectionRationale: 'Use for an ordered release decision.',
        selectionRationaleZh: '用于有序发布决策。',
        sourceIntent: 'flowchart',
        target: 'mermaid',
        targetExtension: '.md',
        semanticFacts: ['Build -> Tests -> Release'],
        readingCues: ['Confirm the decision path.'],
        readingCuesZh: ['确认决策路径。'],
        directory: 'docs/diagram-examples/flowchart',
        inputPath: 'notemd-real-diagram-examples/flowchart.md',
        inputZhPath: 'notemd-real-diagram-examples/flowchart.zh-CN.md',
        outputInputPath: 'docs/diagram-examples/flowchart/input.md',
        outputInputZhPath: 'docs/diagram-examples/flowchart/input.zh-CN.md',
        outputDirectory: 'docs/diagram-examples/flowchart'
    };
}

describe('diagram examples generator orchestration', () => {
    test('records a failed example but cleans every temporary path', async () => {
        const calls: string[] = [];
        const writes: string[] = [];
        const result = await runExampleBatch({
            plans: [fakePlan()],
            createVaultFile: async (path: string) => calls.push(`create:${path}`),
            invokeDiagramGenerate: async () => ({ kind: 'error', errorMessage: 'provider timeout' }),
            readVaultFile: async () => { throw new Error('must not read output after failure'); },
            writeOutputFile: async (path: string) => writes.push(path),
            deleteVaultFile: async (path: string) => calls.push(`delete:${path}`),
            now: () => '2026-08-29T00:00:00.000Z'
        });

        expect(result.entries[0].status).toBe('failed');
        expect(result.entries[0].diagnostic).toContain('provider timeout');
        expect(calls).toEqual([
            'create:notemd-real-diagram-examples/flowchart.md',
            'delete:notemd-real-diagram-examples/flowchart.md'
        ]);
        expect(writes).toEqual([
            'docs/diagram-examples/flowchart/input.md',
            'docs/diagram-examples/flowchart/input.zh-CN.md',
            'docs/diagram-examples/flowchart/machine-test.json'
        ]);
    });

    test('copies a matching artifact and preview, then writes a hashed passed record', async () => {
        const writes = new Map<string, string | Uint8Array>();
        const deleted: string[] = [];
        const plan = fakePlan();
        const result = await runExampleBatch({
            plans: [plan],
            createVaultFile: async (path: string, content: string) => {
                expect(path).toBe(plan.inputPath);
                expect(content).toContain('Requested diagram type');
            },
            invokeDiagramGenerate: async (request: Record<string, unknown>) => {
                expect(request).toMatchObject({
                    sourcePath: plan.inputPath,
                    requestedTypeId: 'flowchart',
                    requestedRenderTarget: 'mermaid'
                });
                return {
                    kind: 'success',
                    sourcePath: plan.inputPath,
                    outputPath: 'notemd-real-diagram-examples/flowchart_diagram.md',
                    followThrough: { artifactTarget: 'mermaid', outputPath: 'notemd-real-diagram-examples/flowchart_diagram.md' },
                    generation: {
                        artifact: { target: 'mermaid', content: 'flowchart TD\n  Build --> Tests', mimeType: 'text/vnd.mermaid', sourceIntent: 'flowchart' },
                        spec: { intent: 'flowchart', title: 'Release decision', nodes: [] }
                    }
                };
            },
            readVaultFile: async (path: string) => {
                if (path.endsWith('.svg')) return '<svg viewBox="0 0 100 50"><text>Release</text></svg>';
                return 'flowchart TD\n  Build --> Tests';
            },
            writeOutputFile: async (path: string, content: string | Uint8Array) => {
                writes.set(path, content);
            },
            deleteVaultFile: async (path: string) => deleted.push(path),
            renderPreviewSvg: async () => '<svg viewBox="0 0 100 50"><text>Release</text></svg>',
            renderPreviewPng: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]),
            now: () => '2026-08-29T00:00:00.000Z'
        });

        expect(result.entries[0]).toEqual(expect.objectContaining({ status: 'passed', artifactPath: 'docs/diagram-examples/flowchart/artifact.md' }));
        expect(result.entries[0].artifactSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(writes.has('docs/diagram-examples/flowchart/input.md')).toBe(true);
        expect(writes.has('docs/diagram-examples/flowchart/input.zh-CN.md')).toBe(true);
        expect(writes.has('docs/diagram-examples/flowchart/artifact.md')).toBe(true);
        expect(writes.has('docs/diagram-examples/flowchart/artifact.zh-CN.md')).toBe(true);
        expect(writes.get('docs/diagram-examples/flowchart/artifact.zh-CN.md')).toContain('# 发布决策');
        expect(writes.has('docs/diagram-examples/flowchart/result.svg')).toBe(true);
        expect(writes.has('docs/diagram-examples/flowchart/result.png')).toBe(true);
        expect(deleted).toContain(plan.inputPath);
        expect(deleted).toContain('notemd-real-diagram-examples/flowchart_diagram.md');
    });

    test('fails an example when the mounted SVG presentation gate rejects its preview', async () => {
        const writes = new Map<string, string | Uint8Array>();
        const result = await runExampleBatch({
            plans: [fakePlan()],
            createVaultFile: async () => undefined,
            invokeDiagramGenerate: async () => ({
                kind: 'success',
                outputPath: 'notemd-real-diagram-examples/flowchart_diagram.md',
                followThrough: { artifactTarget: 'mermaid', outputPath: 'notemd-real-diagram-examples/flowchart_diagram.md' },
                generation: { artifact: { target: 'mermaid', content: 'flowchart TD\n  Build --> Tests' } }
            }),
            readVaultFile: async () => 'flowchart TD\n  Build --> Tests',
            writeOutputFile: async (path: string, content: string | Uint8Array) => writes.set(path, content),
            deleteVaultFile: async () => undefined,
            renderPreviewSvg: async () => '<svg viewBox="0 0 100 50"><text>Release</text></svg>',
            renderPreviewPng: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]),
            assertPreviewSvgPresentationSafety: async () => {
                throw new Error('Mounted SVG labels overlap.');
            },
            now: () => '2026-08-29T00:00:00.000Z'
        });

        expect(result.entries[0].status).toBe('failed');
        expect(result.entries[0].diagnostic).toContain('Mounted SVG labels overlap');
        expect(writes.has('docs/diagram-examples/flowchart/result.svg')).toBe(false);
    });

    test('fails closed on a returned target mismatch and continues to the next type', async () => {
        const plans = [fakePlan('flowchart'), fakePlan('state')];
        plans[1].target = 'mermaid';
        plans[1].sourceIntent = 'stateDiagram';
        const statuses: string[] = [];
        const deleted: string[] = [];
        const result = await runExampleBatch({
            plans,
            createVaultFile: async () => undefined,
            invokeDiagramGenerate: async ({ requestedTypeId }: { requestedTypeId: string }) => requestedTypeId === 'flowchart'
                ? { kind: 'success', outputPath: 'notemd-real-diagram-examples/flowchart_diagram.md', followThrough: { artifactTarget: 'editable-html-svg' }, generation: { artifact: { target: 'editable-html-svg' } } }
                : { kind: 'error', errorMessage: 'second provider error' },
            readVaultFile: async () => 'unused',
            writeOutputFile: async () => undefined,
            deleteVaultFile: async (path: string) => deleted.push(path),
            now: () => '2026-08-29T00:00:00.000Z',
            onEntry: (entry: { status: string }) => statuses.push(entry.status)
        });

        expect(statuses).toEqual(['failed', 'failed']);
        expect(result.entries.map((entry: { status: string }) => entry.status)).toEqual(['failed', 'failed']);
        expect(result.ok).toBe(false);
        expect(deleted).toContain('notemd-real-diagram-examples/flowchart_diagram.md');
    });

    test('does not delete a pre-existing source when temporary creation fails', async () => {
        const deleted: string[] = [];
        const result = await runExampleBatch({
            plans: [fakePlan()],
            createVaultFile: async () => { throw new Error('temporary source already exists'); },
            invokeDiagramGenerate: async () => { throw new Error('must not invoke provider'); },
            readVaultFile: async () => { throw new Error('must not read output'); },
            writeOutputFile: async () => undefined,
            deleteVaultFile: async (path: string) => deleted.push(path),
            now: () => '2026-08-29T00:00:00.000Z'
        });

        expect(result.entries[0].status).toBe('failed');
        expect(deleted).toEqual([]);
    });
});
