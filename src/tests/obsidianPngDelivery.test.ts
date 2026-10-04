import { decodePngInObsidian, ObsidianPngCompatibilityError, renderObsidianCompatiblePng, renderRequestedPng, chooseObsidianPngCandidatePpi } from '../rendering/preview/obsidianPngDelivery';
import { RasterizedImageResult } from '../rendering/preview/pngPreview';

function raster(ppi: number): RasterizedImageResult {
    return { data: new Uint8Array([ppi % 256]).buffer, ppi, requestedPpi: ppi, sourceWidthCssPx: 4772,
        sourceHeightCssPx: 16749, imageWidthPx: Math.ceil(4772 * ppi / 96), imageHeightPx: Math.ceil(16749 * ppi / 96), mimeType: 'image/png' };
}
function dependencies() {
    return { renderPng: jest.fn(async (_svg: string, ppi: number) => raster(ppi)), decodePng: jest.fn(async () => true) };
}
describe('Obsidian PNG delivery', () => {
    test('requested-only operation preserves PPI and never probes compatibility', async () => {
        const deps = dependencies();
        const delivery = await renderRequestedPng('<svg/>', 300, deps);
        expect(delivery.primary).toBe(delivery.requested);
        expect(delivery.compatibility).toBe('unchecked');
        expect(deps.renderPng).toHaveBeenCalledTimes(1);
        expect(deps.decodePng).not.toHaveBeenCalled();
    });
    test('successful host decode delivers the original without a companion', async () => {
        const deps = dependencies();
        const delivery = await renderObsidianCompatiblePng('<svg/>', 300, deps);
        expect(delivery.primary).toBe(delivery.requested);
        expect(delivery.companion).toBeUndefined();
        expect(delivery.compatibility).toBe('verified');
        expect(deps.renderPng).toHaveBeenCalledTimes(1);
    });
    test('rerenders a lower PPI companion and retains the exact requested buffer', async () => {
        const deps = dependencies();
        deps.decodePng.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const delivery = await renderObsidianCompatiblePng('<svg/>', 300, deps);
        expect(deps.renderPng.mock.calls.map(call => call[1])).toEqual([300, 87]);
        expect(delivery.requested.ppi).toBe(300);
        expect(delivery.primary).toBe(delivery.companion);
        expect(delivery.companion?.ppi).toBe(87);
        expect(delivery.companion?.imageHeightPx).toBeLessThan(delivery.requested.imageHeightPx);
        expect(deps.decodePng).toHaveBeenCalledWith(delivery.requested.data, undefined);
    });
    test('progressively retries decode failures down to 1 without repeated PPIs', async () => {
        const deps = dependencies();
        deps.renderPng.mockImplementation(async (_svg, ppi) => ({ ...raster(ppi), sourceWidthCssPx: 400, sourceHeightCssPx: 200 }));
        deps.decodePng.mockResolvedValue(false);
        let failure: unknown;
        try { await renderObsidianCompatiblePng('<svg/>', 100, deps); } catch (error) { failure = error; }
        expect(failure).toBeInstanceOf(ObsidianPngCompatibilityError);
        expect((failure as ObsidianPngCompatibilityError).requested.ppi).toBe(100);
        expect(deps.renderPng.mock.calls.map(call => call[1])).toEqual([100, 99, 79, 63, 50, 40, 32, 25, 20, 16, 12, 9, 7, 5, 4, 3, 2, 1]);
    });
    test('minimum requested PPI can receive a lower compatibility companion', async () => {
        const deps = dependencies(); deps.decodePng.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const delivery = await renderObsidianCompatiblePng('<svg/>', 72, deps);
        expect(delivery.requested.ppi).toBe(72);
        expect(delivery.companion?.ppi).toBe(71);
        expect(deps.renderPng).toHaveBeenCalledTimes(2);
    });
    test('a throwing decoder still preserves the requested original and tries a companion', async () => {
        const deps = dependencies(); deps.decodePng.mockRejectedValueOnce(new Error('decode failed')).mockResolvedValueOnce(true);
        const delivery = await renderObsidianCompatiblePng('<svg/>', 300, deps);
        expect(delivery.requested.ppi).toBe(300); expect(delivery.companion?.ppi).toBe(87);
    });
    test('candidate selection uses a configurable geometry budget and rejects malformed inputs', () => {
        expect(chooseObsidianPngCandidatePpi(raster(300), { decodedBytes: 1024 * 1024 * 1024, maxEdgePx: 1000 })).toBe(5);
        expect(() => chooseObsidianPngCandidatePpi({ ...raster(300), sourceWidthCssPx: 0 })).toThrow('Invalid PNG compatibility');
    });
    test('candidate rendering failures remain surfaced', async () => {
        const deps = dependencies(); deps.decodePng.mockResolvedValue(false);
        deps.renderPng.mockResolvedValueOnce(raster(300)).mockRejectedValueOnce(new Error('pixel readback failed'));
        await expect(renderObsidianCompatiblePng('<svg/>', 300, deps)).rejects.toThrow('pixel readback failed');
    });
    test('cancellation after rendering prevents host decode and companion allocation', async () => {
        const controller = new AbortController(); const deps = dependencies();
        deps.renderPng.mockImplementation(async (_svg, ppi) => { controller.abort(); return raster(ppi); });
        await expect(renderObsidianCompatiblePng('<svg/>', 300, { ...deps, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
        expect(deps.decodePng).not.toHaveBeenCalled();
    });
});

describe('host PNG decoder', () => {
    function probe(decode?: () => Promise<void>, width = 20) {
        const image = { naturalWidth: width, naturalHeight: 10, onload: null as null | (() => void), onerror: null as null | (() => void), decode,
            set src(value: string) { if (value && !decode) this.onload?.(); } };
        const deps = { createImage: () => image, createBlob: (data: ArrayBuffer) => new Blob([data]), createObjectURL: jest.fn(() => 'blob:png'), revokeObjectURL: jest.fn() };
        return { image, deps };
    }
    test('uses Image.decode and releases the blob URL', async () => {
        const decode = jest.fn(async () => undefined); const { image, deps } = probe(decode);
        await expect(decodePngInObsidian(new ArrayBuffer(1), undefined, deps)).resolves.toBe(true);
        expect(decode).toHaveBeenCalledTimes(1); expect(deps.revokeObjectURL).toHaveBeenCalledWith('blob:png');
        expect(image.onload).toBeNull(); expect(image.onerror).toBeNull();
    });
    test('rejects zero dimensions and decode failure, cleaning both', async () => {
        for (const probeCase of [probe(async () => undefined, 0), probe(async () => { throw new Error('cannot decode'); })]) {
            await expect(decodePngInObsidian(new ArrayBuffer(1), undefined, probeCase.deps)).resolves.toBe(false);
            expect(probeCase.deps.revokeObjectURL).toHaveBeenCalledTimes(1);
        }
    });
    test('uses load events only when Image.decode is absent', async () => {
        const { deps } = probe(); await expect(decodePngInObsidian(new ArrayBuffer(1), undefined, deps)).resolves.toBe(true);
    });
    test('cancels an unresolved decoder and releases resources', async () => {
        const controller = new AbortController(); const { deps } = probe(() => new Promise(() => undefined));
        const pending = decodePngInObsidian(new ArrayBuffer(1), controller.signal, deps); controller.abort();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(deps.revokeObjectURL).toHaveBeenCalledTimes(1);
    });
});
