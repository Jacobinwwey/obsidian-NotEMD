import { buildSourceVisualCompanions } from '../diagram/sourceVisualArtifactBuilder';
import { ResolvedSourceVisual } from '../diagram/sourceVisuals';

describe('source visual artifact companions', () => {
    test('supports a self-contained Drawnix visual mode without Mermaid companion files', async () => {
        const visuals: ResolvedSourceVisual[] = [{
            id: 'source-visual-inline',
            kind: 'mermaid',
            sourceHash: 'inline001',
            lineStart: 1,
            lineEnd: 3,
            language: 'mermaid',
            definition: 'flowchart TD\nA --> B',
            status: 'resolved',
            content: 'flowchart TD\nA --> B'
        }];
        const result = await buildSourceVisualCompanions(visuals, {
            inlineMermaidVisuals: true
        } as any);

        expect(result.companions).toEqual([]);
        expect(result.manifest[0]).toMatchObject({
            id: 'source-visual-inline',
            companionPaths: []
        });
        expect(result.previewVisuals[0]).toEqual(expect.objectContaining({
            id: 'source-visual-inline',
            svg: expect.stringContaining('<svg')
        }));
    });

    test('emits Mermaid source and sanitized SVG companions plus a manifest', async () => {
        const visuals: ResolvedSourceVisual[] = [{
            id: 'source-visual-1',
            kind: 'mermaid',
            sourceHash: 'abc12345',
            lineStart: 1,
            lineEnd: 3,
            language: 'mermaid',
            definition: 'flowchart TD\nA --> B',
            status: 'resolved',
            content: 'flowchart TD\nA --> B'
        }];
        const result = await buildSourceVisualCompanions(visuals, {
            renderMermaidSvg: async () => '<svg><script>alert(1)</script><rect onload="bad" /></svg>'
        });

        expect(result.companions.map(companion => companion.path)).toEqual([
            'source-visual-source-visual-1.mermaid.md',
            'source-visual-source-visual-1.svg',
            'source-visual-manifest.json'
        ]);
        expect(result.companions[1].content).not.toContain('<script');
        expect(result.companions[1].content).not.toContain('onload');
        expect(result.manifest[0]).toMatchObject({ status: 'resolved', companionPaths: expect.any(Array) });
        expect(result.previewVisuals).toEqual([
            expect.objectContaining({
                id: 'source-visual-1',
                kind: 'mermaid',
                title: 'Mermaid source visual 1',
                svg: '<svg><rect /></svg>'
            })
        ]);
    });

    test('converts Mermaid HTML labels for the Drawnix preview while preserving the companion SVG', async () => {
        const result = await buildSourceVisualCompanions([{
            id: 'source-visual-foreign-object',
            kind: 'mermaid',
            sourceHash: 'foreign001',
            lineStart: 1,
            lineEnd: 3,
            definition: 'flowchart TD\\nA --> B',
            status: 'resolved',
            content: 'flowchart TD\\nA --> B'
        }], {
            renderMermaidSvg: async () => '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject x="0" y="0" width="120" height="40"><div xmlns="http://www.w3.org/1999/xhtml"><span>Architecture</span></div></foreignObject></svg>'
        });

        expect(result.companions[1].content).toContain('<foreignObject');
        expect(result.previewVisuals[0].svg).not.toContain('<foreignObject');
        expect(result.previewVisuals[0].svg).toContain('data-notemd-raster-fallback="foreign-object"');
        expect(result.previewVisuals[0].svg).toContain('Architecture');
    });

    test('keeps unresolved visuals explicit instead of dropping them', async () => {
        const result = await buildSourceVisualCompanions([{
            id: 'source-visual-2',
            kind: 'image',
            sourceHash: 'deadbeef',
            lineStart: 4,
            lineEnd: 4,
            targetPath: 'missing.png',
            status: 'unresolved',
            diagnostic: 'missing image'
        }]);

        expect(result.companions).toHaveLength(1);
        expect(result.manifest[0]).toMatchObject({ status: 'unresolved', companionPaths: [] });
        expect(result.diagnostics[0]).toMatchObject({ severity: 'warning', kind: 'source-visual-unresolved' });
        expect(result.companions[0].content).toContain('missing image');
    });

    test('emits an explicit warning when Mermaid rendering falls back to source-preserving SVG', async () => {
        const result = await buildSourceVisualCompanions([{
            id: 'source-visual-3',
            kind: 'mermaid',
            sourceHash: 'feedface',
            lineStart: 1,
            lineEnd: 2,
            definition: 'flowchart TD\nA --> B',
            status: 'resolved',
            content: 'flowchart TD\nA --> B'
        }], { renderMermaidSvg: async () => { throw new Error('runtime unavailable'); } });

        expect(result.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: 'source-visual-mermaid-render', severity: 'warning' })
        ]));
        expect(result.companions[1].content).toContain('Mermaid source visual');
    });
});
