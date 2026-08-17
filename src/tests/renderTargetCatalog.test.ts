import { SUPPORTED_RENDER_TARGETS } from '../diagram/types';
import {
    DIAGRAM_EXPORT_FORMATS,
    getRenderTargetDescriptor,
    listRenderTargetDescriptors
} from '../rendering/renderTargetCatalog';

describe('render target catalog', () => {
    test('describes every supported target exactly once', () => {
        const descriptors = listRenderTargetDescriptors();

        expect(descriptors.map(descriptor => descriptor.target).sort()).toEqual(
            [...SUPPORTED_RENDER_TARGETS].sort()
        );
        expect(new Set(descriptors.map(descriptor => descriptor.target)).size).toBe(descriptors.length);
        expect(descriptors.every(descriptor => descriptor.rendererId === descriptor.target)).toBe(true);
    });

    test('keeps source metadata and preview/export policy explicit', () => {
        expect(getRenderTargetDescriptor('editable-html-svg')).toMatchObject({
            mimeType: 'text/html',
            sourceExtension: '.html',
            previewKind: 'svg-companion',
            exportFormats: DIAGRAM_EXPORT_FORMATS,
            fallbackPolicy: 'strict'
        });
        expect(getRenderTargetDescriptor('circuitikz')).toMatchObject({
            mimeType: 'text/x-tex',
            sourceExtension: '.tex',
            previewKind: 'svg-companion',
            consumerGate: 'native-compile'
        });
        expect(getRenderTargetDescriptor('html')).toMatchObject({
            mimeType: 'text/html',
            sourceExtension: '.html',
            exportFormats: []
        });
    });

    test('fails closed for unknown targets instead of falling back to text metadata', () => {
        expect(() => getRenderTargetDescriptor('unknown' as never)).toThrow(/unsupported render target/i);
    });
});
