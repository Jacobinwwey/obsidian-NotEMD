import {
    DEFAULT_PREVIEW_EXPORT_PPI,
    MAX_PREVIEW_EXPORT_PPI,
    applyPngPhysicalPixelDensity,
    rasterizeSvgToPngArrayBuffer,
    resolvePngPixelsPerMeter,
    resolvePreviewExportPpi,
    resolveSvgDimensions
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
    test('uses width and height attributes when present', () => {
        expect(resolveSvgDimensions('<svg width="640" height="360"></svg>')).toEqual({ width: 640, height: 360 });
    });

    test('falls back to viewBox dimensions when width and height are absent', () => {
        expect(resolveSvgDimensions('<svg viewBox="0 0 1200 800"></svg>')).toEqual({ width: 1200, height: 800 });
    });

    test('defaults raster export to 300 ppi and clamps manual resolution at 600 ppi', () => {
        expect(DEFAULT_PREVIEW_EXPORT_PPI).toBe(300);
        expect(MAX_PREVIEW_EXPORT_PPI).toBe(600);
        expect(resolvePreviewExportPpi()).toBe(300);
        expect(resolvePreviewExportPpi(450)).toBe(450);
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
});
