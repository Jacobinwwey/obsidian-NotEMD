import { rasterizeSvgToPngArrayBuffer, resolveSvgDimensions } from '../rendering/preview/pngPreview';

describe('png preview rasterizer', () => {
    test('uses width and height attributes when present', () => {
        expect(resolveSvgDimensions('<svg width="640" height="360"></svg>')).toEqual({ width: 640, height: 360 });
    });

    test('falls back to viewBox dimensions when width and height are absent', () => {
        expect(resolveSvgDimensions('<svg viewBox="0 0 1200 800"></svg>')).toEqual({ width: 1200, height: 800 });
    });

    test('rasterizes svg into png array buffer with injected deps', async () => {
        const scale = jest.fn(() => 2);
        const blobToArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(32));
        const drawImage = jest.fn();
        const scaleContext = jest.fn();
        const toBlob = jest.fn((callback: (blob: Blob | null) => void) => callback(new Blob(['png-bytes'], { type: 'image/png' })));
        const createObjectURL = jest.fn(() => 'blob:mock');
        const revokeObjectURL = jest.fn();
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
            createCanvas: (width, height) => ({
                width,
                height,
                getContext: () => ({
                    scale: scaleContext,
                    drawImage
                }),
                toBlob
            }),
            createObjectURL,
            revokeObjectURL,
            blobToArrayBuffer,
            getScale: scale
        });

        expect(png).toBeInstanceOf(ArrayBuffer);
        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(scaleContext).toHaveBeenCalledWith(2, 2);
        expect(drawImage).toHaveBeenCalled();
        expect(blobToArrayBuffer).toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });
});
