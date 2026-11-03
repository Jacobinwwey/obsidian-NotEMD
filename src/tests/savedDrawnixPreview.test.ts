import { createSavedDrawnixMindMapPreview } from '../rendering/renderers/savedDrawnixPreview';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

describe('saved Drawnix preview', () => {
    async function nativeMap() {
        return new DrawnixRenderer().render({
            intent: 'drawnixMindmap', title: 'Architecture',
            nodes: [{ id: 'root', label: 'Architecture', children: [
                { id: 'storage', label: 'Storage & <Vault>' },
                { id: 'runtime', label: 'Runtime' }
            ] }],
            edges: [{ from: 'storage', to: 'runtime', label: 'supplies' }]
        });
    }

    test('reconstructs the primary hierarchy and relationships without mutating native data', async () => {
        const original = await nativeMap();
        const preview = createSavedDrawnixMindMapPreview(original.content);
        expect(preview.previewSvg?.content).toContain('Architecture');
        expect(preview.previewSvg?.content).toContain('Storage &amp; &lt;Vault&gt;');
        expect(preview.previewSvg?.content).toContain('Runtime');
        expect(preview.previewSvg?.content).toContain('supplies');
        expect(preview.diagnostics).toEqual([expect.objectContaining({ kind: 'drawnix-derived-preview' })]);
        expect(original.content).toBe((await nativeMap()).content);
    });

    test('keeps the known hierarchy preview when future attachment metadata is present', async () => {
        const saved = JSON.parse((await nativeMap()).content);
        saved.metadata = { notemd: { version: 999, futureAttachments: [] } };
        expect(createSavedDrawnixMindMapPreview(JSON.stringify(saved)).previewSvg?.content).toContain('Runtime');
    });

    test('keeps native relationships outside the projection subset source-only with an explicit diagnostic', async () => {
        const saved = JSON.parse((await nativeMap()).content);
        saved.elements[1].source.id = 'root';
        saved.elements[1].target.id = 'storage';
        const preview = createSavedDrawnixMindMapPreview(JSON.stringify(saved));
        expect(preview.previewSvg).toBeUndefined();
        expect(preview.diagnostics).toEqual([expect.objectContaining({ kind: 'drawnix-source-preview-unavailable', severity: 'warning' })]);
    });

    test.each([
        'not json', 'null', '[]',
        '{"type":"drawnix","version":2,"source":"web","elements":[]}',
        '{"type":"drawnix","version":1,"source":"web","viewport":{},"elements":[{"type":"rectangle"}]}'
    ])('leaves unsupported or malformed native documents source-only: %s', content => {
        expect(createSavedDrawnixMindMapPreview(content).previewSvg).toBeUndefined();
    });
});
