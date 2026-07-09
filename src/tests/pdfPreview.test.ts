import { buildPdfFromRasterImage } from '../rendering/preview/pdfPreview';

function decodePdf(buffer: ArrayBuffer): string {
    return Buffer.from(buffer).toString('latin1');
}

describe('pdf preview exporter', () => {
    test('embeds a 300 ppi raster image on a page matching the source svg size', () => {
        const pdf = buildPdfFromRasterImage({
            imageData: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer,
            imageMimeType: 'image/jpeg',
            imageWidthPx: 1250,
            imageHeightPx: 625,
            sourceWidthCssPx: 400,
            sourceHeightCssPx: 200
        });
        const source = decodePdf(pdf);

        expect(source).toContain('%PDF-1.4');
        expect(source).toContain('/MediaBox [0 0 300 150]');
        expect(source).toContain('/Subtype /Image');
        expect(source).toContain('/Filter /DCTDecode');
        expect(source).toContain('/Width 1250');
        expect(source).toContain('/Height 625');
        expect(source).toContain('q\n300 0 0 150 0 0 cm\n/Im0 Do\nQ');
        expect(source.trimEnd()).toMatch(/%%EOF$/);
    });
});
