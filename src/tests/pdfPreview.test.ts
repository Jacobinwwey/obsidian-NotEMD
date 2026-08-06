import { buildPdfFromSvg } from '../rendering/preview/pdfPreview';

describe('pdf preview exporter', () => {
    test('builds PDF through the SVG vector renderer instead of a raster image XObject', async () => {
        const document = {
            output: jest.fn(() => new TextEncoder().encode('%PDF-1.4\n/vector-content\n').buffer)
        };
        const parseSvg = jest.fn(() => ({ tagName: 'svg' }));
        const createDocument = jest.fn(() => document);
        const renderSvg = jest.fn((root, pdfDocument, options) => {
            expect(root).toEqual({ tagName: 'svg' });
            expect(pdfDocument).toBe(document);
            expect(options).toEqual({ x: 0, y: 0, width: 300, height: 150 });
        });

        const pdf = await buildPdfFromSvg('<svg width="400" height="200"><rect width="400" height="200" /></svg>', {
            parseSvg,
            createDocument,
            renderSvg
        });

        expect(createDocument).toHaveBeenCalledWith(300, 150, 'landscape');
        expect(parseSvg).toHaveBeenCalledWith(expect.stringContaining('font-family="NotoSansSC"'));
        expect(renderSvg).toHaveBeenCalledTimes(1);
        expect(document.output).toHaveBeenCalledWith('arraybuffer');
        expect(Buffer.from(pdf).toString('latin1')).not.toContain('/DCTDecode');
    });

    test('rejects an empty vector document returned by the renderer', async () => {
        await expect(buildPdfFromSvg('<svg width="400" height="200" />', {
            parseSvg: jest.fn(() => ({ tagName: 'svg' })),
            createDocument: jest.fn(() => ({
                output: jest.fn(() => new ArrayBuffer(0))
            })),
            renderSvg: jest.fn()
        })).rejects.toThrow(/empty document/i);
    });

    test('keeps exactly one root font-family attribute when the SVG already declares one', async () => {
        const parseSvg = jest.fn((markup: string) => {
            const rootTag = markup.match(/^<svg\b[^>]*>/)?.[0] ?? '';
            expect(rootTag.match(/\bfont-family=/g)).toHaveLength(1);
            expect(rootTag).toContain('font-family="NotoSansSC"');
            expect(markup).toContain('style="font-family: &quot;NotoSansSC&quot;, &quot;Segoe UI&quot;, Arial, sans-serif; fill: red"');
            return { tagName: 'svg' };
        });

        await buildPdfFromSvg('<svg font-family="Arial" width="400" height="200"><text style="font-family: Arial; fill: red">Node</text></svg>', {
            parseSvg,
            createDocument: jest.fn(() => ({ output: jest.fn(() => new ArrayBuffer(16)) })),
            renderSvg: jest.fn()
        });
    });

    test('uses the root viewBox for percentage-sized Mermaid SVGs', async () => {
        const document = {
            output: jest.fn(() => new TextEncoder().encode('%PDF-1.4\n/vector-content\n').buffer)
        };
        const createDocument = jest.fn(() => document);

        await buildPdfFromSvg(
            '<svg width="100%" viewBox="0 0 1368 1704">'
                + '<defs><marker viewBox="0 0 10 10"><path width="100" height="128" /></marker></defs>'
                + '</svg>',
            {
                parseSvg: jest.fn(() => ({ tagName: 'svg' })),
                createDocument,
                renderSvg: jest.fn()
            }
        );

        expect(createDocument).toHaveBeenCalledWith(1026, 1278, 'portrait');
    });

    test('converts foreignObject labels to native SVG text before svg2pdf consumes the document', async () => {
        const parseSvg = jest.fn((markup: string) => {
            expect(markup).not.toContain('<foreignObject');
            expect(markup).toContain('令牌解析');
            const lines = Array.from(markup.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g), match => match[1]);
            expect(lines).toEqual(['令牌解析', '(resolveProviderTokenLimit)']);
            return { tagName: 'svg' };
        });

        await buildPdfFromSvg(
            '<svg width="200" height="100"><foreignObject width="160" height="48">'
                + '<div><span><p>令牌解析<br/>(resolveProviderTokenLimit)</p></span></div>'
                + '</foreignObject></svg>',
            {
                parseSvg,
                createDocument: jest.fn(() => ({ output: jest.fn(() => new ArrayBuffer(16)) })),
                renderSvg: jest.fn()
            }
        );
    });

    test('keeps landscape SVG dimensions in landscape PDF orientation', async () => {
        const createDocument = jest.fn(() => ({ output: jest.fn(() => new ArrayBuffer(16)) }));
        const pdf = await buildPdfFromSvg('<svg width="2000" height="800"></svg>', {
            parseSvg: jest.fn(() => ({ tagName: 'svg' })),
            createDocument,
            renderSvg: jest.fn()
        });

        expect(pdf).toBeInstanceOf(ArrayBuffer);
        expect(createDocument).toHaveBeenCalledWith(1500, 600, 'landscape');
    });
});
