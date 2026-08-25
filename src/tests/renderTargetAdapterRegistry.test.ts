import { listPreviewTargetAdapters, getPreviewTargetAdapter } from '../rendering/preview/previewTargetAdapterRegistry';
import { listRenderHostTargetAdapters, getRenderHostTargetAdapter } from '../rendering/runtime/renderHostTargetAdapterRegistry';
import { TargetAdapterRegistry } from '../rendering/targetAdapterRegistry';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';

describe('render target adapter registries', () => {
    test('rejects duplicate target registrations instead of shadowing an adapter', () => {
        expect(() => new TargetAdapterRegistry([
            { target: 'mermaid' },
            { target: 'mermaid' }
        ])).toThrow('Duplicate target adapter "mermaid".');
    });

    test('advertises one preview adapter per runtime-rendered target', () => {
        expect(listPreviewTargetAdapters().map(adapter => adapter.target)).toEqual([
            'mermaid',
            'json-canvas',
            'vega-lite'
        ]);
        expect(getPreviewTargetAdapter('mermaid')).toBeDefined();
        expect(getPreviewTargetAdapter('html')).toBeNull();
    });

    test('keeps interactive and raster preview operations explicit', () => {
        for (const adapter of listPreviewTargetAdapters()) {
            expect(typeof adapter.renderSvg).toBe('function');
            expect(typeof adapter.renderSvgForRasterExport).toBe('function');
            expect(getRenderTargetDescriptor(adapter.target).exportFormats).toContain('svg');
        }
    });

    test('rejects malformed adapter output before preview/export consumers receive it', async () => {
        const adapter = getPreviewTargetAdapter('mermaid')!;
        const malformed = {
            target: 'mermaid' as const,
            content: 'graph TD\nA-->B',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart' as const
        };
        const mermaid = {
            initialize: jest.fn(),
            parse: jest.fn(),
            render: jest.fn().mockResolvedValue({ svg: '<div>not svg</div>' })
        };

        await expect(adapter.renderSvg(malformed, { mermaid })).rejects.toThrow(/malformed SVG/i);
    });

    test('advertises host adapters with explicit error surfaces', () => {
        expect(listRenderHostTargetAdapters().map(adapter => adapter.target)).toEqual([
            'mermaid',
            'vega-lite'
        ]);
        expect(getRenderHostTargetAdapter('mermaid')?.errorElementId).toBe('notemd-mermaid-error');
        expect(getRenderHostTargetAdapter('vega-lite')?.errorElementId).toBe('notemd-vega-lite-error');
        expect(getRenderHostTargetAdapter('json-canvas')).toBeNull();
        for (const adapter of listRenderHostTargetAdapters()) {
            expect(getRenderTargetDescriptor(adapter.target).previewKind).toBe('iframe');
        }
    });
});
