import {
    DEFAULT_PREVIEW_EXPORT_PPI,
    MAX_PREVIEW_EXPORT_PPI,
    SUPPORTED_PREVIEW_EXPORT_PPI,
    applyPngPhysicalPixelDensity,
    rasterizeSvgToPngArrayBuffer,
    resolvePngPixelsPerMeter,
    resolvePreviewExportPpi,
    resolveSvgDimensions,
    sanitizeSvgForExport
} from '../rendering/preview/pngPreview';

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function writeUint32(value: number): Uint8Array {
    const output = new Uint8Array(4);
    const view = new DataView(output.buffer);
    view.setUint32(0, value, false);
    return output;
}

function asciiBytes(value: string): Uint8Array {
    return Uint8Array.from(value.split('').map(char => char.charCodeAt(0)));
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return output;
}

function buildTestPngChunk(type: string, data: Uint8Array = new Uint8Array()): Uint8Array {
    return concatBytes([
        writeUint32(data.byteLength),
        asciiBytes(type),
        data,
        writeUint32(0)
    ]);
}

function buildMinimalPng(): ArrayBuffer {
    const bytes = concatBytes([
        PNG_SIGNATURE,
        buildTestPngChunk('IHDR', new Uint8Array(13)),
        buildTestPngChunk('IDAT', new Uint8Array([0])),
        buildTestPngChunk('IEND')
    ]);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function readPngChunks(data: ArrayBuffer): Array<{ type: string; data: Uint8Array }> {
    const bytes = new Uint8Array(data);
    const chunks: Array<{ type: string; data: Uint8Array }> = [];
    let offset = PNG_SIGNATURE.byteLength;

    while (offset + 12 <= bytes.byteLength) {
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
        const length = view.getUint32(0, false);
        const typeOffset = offset + 4;
        const dataOffset = offset + 8;
        const chunkEnd = dataOffset + length + 4;
        const type = String.fromCharCode(...bytes.slice(typeOffset, typeOffset + 4));
        chunks.push({
            type,
            data: bytes.slice(dataOffset, dataOffset + length)
        });
        offset = chunkEnd;
        if (type === 'IEND') {
            break;
        }
    }

    return chunks;
}

function readUint32(data: Uint8Array, offset: number): number {
    return new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false);
}

describe('png preview rasterizer', () => {
    test('sanitizes foreignObject labels and external image references before rasterization', () => {
        const safeSvg = sanitizeSvgForExport(`
            <svg xmlns="http://www.w3.org/2000/svg" width="240" height="120">
                <foreignObject x="0" y="0" width="240" height="40">
                    <div xmlns="http://www.w3.org/1999/xhtml">Architecture label</div>
                </foreignObject>
                <image href="https://example.com/remote.png" x="0" y="40" width="20" height="20" />
                <image href="data:image/png;base64,AAAA" x="20" y="40" width="20" height="20" />
            </svg>
        `);

        expect(safeSvg).not.toContain('<foreignObject');
        expect(safeSvg).toContain('Architecture label');
        expect(safeSvg).toContain('<text');
        expect(safeSvg).not.toContain('https://example.com/remote.png');
        expect(safeSvg).toContain('data:image/png;base64,AAAA');
    });

    test('uses width and height attributes when present', () => {
        expect(resolveSvgDimensions('<svg width="640" height="360"></svg>')).toEqual({ width: 640, height: 360 });
    });

    test('falls back to viewBox dimensions when width and height are absent', () => {
        expect(resolveSvgDimensions('<svg viewBox="0 0 1200 800"></svg>')).toEqual({ width: 1200, height: 800 });
    });

    test('ignores percentage width and height so the intrinsic viewBox is preserved', () => {
        expect(resolveSvgDimensions('<svg width="100%" height="100%" viewBox="0 0 1200 800"></svg>'))
            .toEqual({ width: 1200, height: 800 });
    });

    test('ignores descendant viewBox attributes when the root SVG has no intrinsic viewBox', () => {
        const svg = '<svg width="100%"><defs><marker viewBox="0 0 10 10">'
            + '<path width="100" height="128" /></marker></defs></svg>';

        expect(resolveSvgDimensions(svg)).toEqual({ width: 1600, height: 900 });
    });

    test('defaults raster export to 300 ppi and clamps manual resolution at 600 ppi', () => {
        expect(DEFAULT_PREVIEW_EXPORT_PPI).toBe(300);
        expect(MAX_PREVIEW_EXPORT_PPI).toBe(600);
        expect(SUPPORTED_PREVIEW_EXPORT_PPI).toEqual([100, 300, 600]);
        expect(resolvePreviewExportPpi()).toBe(300);
        expect(resolvePreviewExportPpi(72)).toBe(72);
        expect(resolvePreviewExportPpi(71)).toBe(72);
        expect(resolvePreviewExportPpi(100)).toBe(100);
        expect(resolvePreviewExportPpi(600)).toBe(600);
        expect(resolvePreviewExportPpi(601)).toBe(600);
        expect(resolvePreviewExportPpi(450)).toBe(450);
        expect(resolvePreviewExportPpi('450')).toBe(450);
        expect(resolvePreviewExportPpi('450ppi')).toBe(300);
        expect(resolvePreviewExportPpi(1200)).toBe(600);
        expect(resolvePreviewExportPpi(Number.NaN)).toBe(300);
    });

    test('writes png physical pixel density metadata for the selected ppi', () => {
        const png = applyPngPhysicalPixelDensity(buildMinimalPng(), 300);
        const chunks = readPngChunks(png);
        const phys = chunks.find(chunk => chunk.type === 'pHYs');

        expect(resolvePngPixelsPerMeter(300)).toBe(11811);
        expect(chunks.map(chunk => chunk.type)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']);
        expect(phys).toBeDefined();
        expect(readUint32(phys?.data ?? new Uint8Array(), 0)).toBe(11811);
        expect(readUint32(phys?.data ?? new Uint8Array(), 4)).toBe(11811);
        expect(phys?.data[8]).toBe(1);
    });

    test('rasterizes svg into png array buffer with injected deps', async () => {
        const blobToArrayBuffer = jest.fn().mockResolvedValue(buildMinimalPng());
        const drawImage = jest.fn();
        const scaleContext = jest.fn();
        const toBlob = jest.fn((callback: (blob: Blob | null) => void) => callback(new Blob(['png-bytes'], { type: 'image/png' })));
        const createObjectURL = jest.fn(() => 'blob:mock');
        const revokeObjectURL = jest.fn();
        const createCanvas = jest.fn((width: number, height: number) => ({
            width,
            height,
            getContext: () => ({
                scale: scaleContext,
                drawImage
            }),
            toBlob
        }));
        const image = {
            onload: null as null | (() => void),
            onerror: null as null | ((event?: unknown) => void),
            set src(_value: string) {
                this.onload?.();
            }
        };

        const png = await rasterizeSvgToPngArrayBuffer('<svg viewBox="0 0 400 200"></svg>', {
            createBlob: (parts, options) => new Blob(parts, options),
            createImage: () => image,
            createCanvas,
            createObjectURL,
            revokeObjectURL,
            blobToArrayBuffer
        }, { ppi: 300 });

        expect(png).toBeInstanceOf(ArrayBuffer);
        expect(readPngChunks(png).map(chunk => chunk.type)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']);
        expect(createCanvas).toHaveBeenCalledWith(1250, 625);
        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(scaleContext).toHaveBeenCalledWith(300 / 96, 300 / 96);
        expect(drawImage).toHaveBeenCalled();
        expect(blobToArrayBuffer).toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    test('passes raster-safe svg markup to the image blob boundary', async () => {
        const createBlob = jest.fn((parts: BlobPart[], options?: BlobPropertyBag) => new Blob(parts, options));
        const image = {
            onload: null as null | (() => void),
            onerror: null as null | ((event?: unknown) => void),
            set src(_value: string) {
                this.onload?.();
            }
        };

        await rasterizeSvgToPngArrayBuffer(`
            <svg width="100" height="50">
                <foreignObject width="100" height="50"><div xmlns="http://www.w3.org/1999/xhtml">Label</div></foreignObject>
            </svg>
        `, {
            createBlob,
            createImage: () => image,
            createCanvas: () => ({
                width: 100,
                height: 50,
                getContext: () => ({ scale: jest.fn(), drawImage: jest.fn() }),
                toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['png'], { type: 'image/png' }))
            }),
            createObjectURL: () => 'blob:safe',
            revokeObjectURL: jest.fn(),
            blobToArrayBuffer: async () => buildMinimalPng()
        });

        const svgBlobMarkup = String(createBlob.mock.calls[0][0][0]);
        expect(svgBlobMarkup).not.toContain('<foreignObject');
        expect(svgBlobMarkup).toContain('Label');
    });
});
