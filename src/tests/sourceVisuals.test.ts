import {
    hashResolvedSourceVisualManifest,
    resolveSourceVisualReferences,
    scanSourceVisualReferences
} from '../diagram/sourceVisuals';

describe('source visual extraction and resolution', () => {
    test('extracts every Mermaid fence and image embed without scanning fenced source as Markdown', () => {
        const references = scanSourceVisualReferences([
            'Intro ![[assets/intro.png|width=320]]',
            '',
            '```mermaid',
            'flowchart TD',
            '  A["![[not-an-image.png]]"] --> B',
            '```',
            '',
            '![Architecture](architecture.png)',
            '```mermaid',
            'mindmap',
            '  root((Note))',
            '```'
        ].join('\n'));

        expect(references.map(reference => reference.kind)).toEqual(['image', 'mermaid', 'image', 'mermaid']);
        expect(references[0]).toMatchObject({ targetPath: 'assets/intro.png', width: 320, lineStart: 1 });
        expect(references[1]).toMatchObject({ language: 'mermaid', definition: expect.stringContaining('flowchart TD') });
        expect(references.filter(reference => reference.targetPath === 'not-an-image.png')).toHaveLength(0);
        expect(references[2]).toMatchObject({ targetPath: 'architecture.png', altText: 'Architecture' });
        expect(references[3].lineStart).toBeGreaterThan(references[2].lineEnd);
    });

    test('resolves vault-relative binary images and preserves unresolved diagnostics', async () => {
        const references = scanSourceVisualReferences('![[assets/architecture.png]]\n![[missing.png]]\n![](https://example.test/external.png)');
        const image = new ArrayBuffer(4);
        const visuals = await resolveSourceVisualReferences(references, 'Notes/architecture.zh-CN.md', {
            getFileByPath: jest.fn((path: string) => path === 'assets/architecture.png' ? { path } : null),
            readBinary: jest.fn().mockResolvedValue(image)
        });

        expect(visuals).toHaveLength(3);
        expect(visuals[0]).toMatchObject({ status: 'resolved', vaultPath: 'assets/architecture.png', mimeType: 'image/png', content: image });
        expect(visuals[1]).toMatchObject({ status: 'unresolved' });
        expect(visuals[1].diagnostic).toMatch(/could not be resolved/i);
        expect(visuals[2]).toMatchObject({ status: 'unresolved', targetPath: 'https://example.test/external.png' });
        expect(visuals[2].diagnostic).toMatch(/external image embeds/i);
    });

    test('rejects path traversal and produces a stable manifest hash', async () => {
        const references = scanSourceVisualReferences('![[../outside.png]]');
        const visuals = await resolveSourceVisualReferences(references, 'Notes/source.md', {
            getFileByPath: jest.fn(),
            readBinary: jest.fn()
        });

        expect(visuals[0].status).toBe('unresolved');
        expect(hashResolvedSourceVisualManifest(visuals)).toBe(hashResolvedSourceVisualManifest([...visuals]));
    });

    test('changes the manifest hash when resolved image bytes change', () => {
        const baseVisual = {
            id: 'source-visual-image',
            kind: 'image' as const,
            sourceHash: 'line-hash',
            lineStart: 1,
            lineEnd: 1,
            targetPath: 'architecture.png',
            vaultPath: 'architecture.png',
            mimeType: 'image/png',
            status: 'resolved' as const,
            content: new Uint8Array([1, 2, 3]).buffer
        };

        expect(hashResolvedSourceVisualManifest([baseVisual])).not.toBe(
            hashResolvedSourceVisualManifest([{ ...baseVisual, content: new Uint8Array([1, 2, 4]).buffer }])
        );
    });
});
