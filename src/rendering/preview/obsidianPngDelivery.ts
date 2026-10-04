import { RasterizedImageResult, rasterizeSvgToCompatibilityPng, resolvePreviewExportPpi } from './pngPreview';

export interface PngDeliveryDependencies {
    renderPng(svg: string, ppi: number): Promise<RasterizedImageResult>;
    decodePng(data: ArrayBuffer, signal?: AbortSignal): Promise<boolean>;
    signal?: AbortSignal;
}
export interface ObsidianPngDelivery {
    requested: RasterizedImageResult;
    primary: RasterizedImageResult;
    companion?: RasterizedImageResult;
    files: RasterizedImageResult[];
    preferredIndex: number;
    compatibility: 'unchecked' | 'verified';
}
export interface PngDecodeImage {
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    onload: HTMLImageElement['onload'];
    onerror: HTMLImageElement['onerror'];
    decode?: () => Promise<void>;
}
export interface PngDecodeDependencies {
    createImage(): PngDecodeImage;
    createBlob(data: ArrayBuffer): Blob;
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
}
export class ObsidianPngCompatibilityError extends Error {
    constructor(readonly requested: RasterizedImageResult, readonly attemptedPpis: number[], reason = 'Obsidian could not decode the PNG at any attempted PPI; the requested original is preserved.') {
        super(reason);
        this.name = 'ObsidianPngCompatibilityError';
    }
}
function assertNotAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        const error = new Error('PNG export cancelled.');
        error.name = 'AbortError';
        throw error;
    }
}
const PNG_DECODE_TIMEOUT_MS = 30000;
const COMPATIBILITY_PPI_REDUCTION_FACTOR = 0.8;

const defaultDecoder: PngDecodeDependencies = {
    createImage: () => new Image(),
    createBlob: data => new Blob([data], { type: 'image/png' }),
    createObjectURL: blob => URL.createObjectURL(blob),
    revokeObjectURL: url => URL.revokeObjectURL(url)
};
/** The host decoder is authoritative; PNG structure and file-open acknowledgements are insufficient. */
export async function decodePngInObsidian(
    data: ArrayBuffer, signal?: AbortSignal, deps: PngDecodeDependencies = defaultDecoder
): Promise<boolean> {
    assertNotAborted(signal);
    const image = deps.createImage();
    const url = deps.createObjectURL(deps.createBlob(data));
    let onAbort: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        const decode = image.decode;
        const decoded = typeof decode === 'function'
            ? (async () => { image.src = url; await decode.call(image); })()
            : new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error('PNG host image load failed.'));
                image.src = url;
            });
        const aborted = new Promise<never>((_resolve, reject) => {
            onAbort = () => {
                const error = new Error('PNG export cancelled.'); error.name = 'AbortError'; reject(error);
            };
            signal?.addEventListener('abort', onAbort, { once: true });
            if (signal?.aborted) onAbort();
        });
        const timedOut = new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => reject(new Error('PNG host decode timed out.')), PNG_DECODE_TIMEOUT_MS);
        });
        await Promise.race([decoded, aborted, timedOut]);
        assertNotAborted(signal);
        return image.naturalWidth > 0 && image.naturalHeight > 0;
    } catch {
        assertNotAborted(signal);
        return false;
    } finally {
        if (timeout !== undefined) clearTimeout(timeout);
        if (onAbort) signal?.removeEventListener('abort', onAbort);
        image.onload = null; image.onerror = null; image.src = '';
        deps.revokeObjectURL(url);
    }
}
const defaultDelivery: PngDeliveryDependencies = {
    renderPng: (svg, ppi) => rasterizeSvgToCompatibilityPng(svg, ppi),
    decodePng: decodePngInObsidian
};
export interface PngDecodeBudget {
    decodedBytes: number;
    maxEdgePx: number;
}
const DEFAULT_OBSIDIAN_PNG_DECODE_BUDGET: PngDecodeBudget = {
    decodedBytes: 256 * 1024 * 1024, maxEdgePx: 32767
};

/** This budget only chooses a first candidate; actual host decoding always decides compatibility. */
export function chooseObsidianPngCandidatePpi(
    requested: Pick<RasterizedImageResult, 'ppi' | 'sourceWidthCssPx' | 'sourceHeightCssPx'>,
    budget: PngDecodeBudget = DEFAULT_OBSIDIAN_PNG_DECODE_BUDGET
): number {
    const { sourceWidthCssPx: width, sourceHeightCssPx: height } = requested;
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0
        || !Number.isFinite(budget.decodedBytes) || budget.decodedBytes < 4
        || !Number.isFinite(budget.maxEdgePx) || budget.maxEdgePx < 1) {
        throw new Error('Invalid PNG compatibility geometry or decode budget.');
    }
    const memoryPpi = 96 * Math.sqrt(budget.decodedBytes / 4 / width / height);
    const edgePpi = 96 * budget.maxEdgePx / Math.max(width, height);
    return Math.max(1, Math.min(requested.ppi - 1, Math.floor(memoryPpi), Math.floor(edgePpi)));
}
export async function renderRequestedPng(
    svg: string, ppi: number, deps: PngDeliveryDependencies = defaultDelivery
): Promise<ObsidianPngDelivery> {
    assertNotAborted(deps.signal);
    const requested = await deps.renderPng(svg, resolvePreviewExportPpi(ppi));
    assertNotAborted(deps.signal);
    return { requested, primary: requested, files: [requested], preferredIndex: 0, compatibility: 'unchecked' };
}
async function canHostDecode(data: ArrayBuffer, deps: PngDeliveryDependencies): Promise<boolean> {
    try {
        return await deps.decodePng(data, deps.signal);
    } catch {
        // Decoder rejection means incompatibility; cancellation remains a separate outcome.
        assertNotAborted(deps.signal);
        return false;
    }
}
export async function renderObsidianCompatiblePng(
    svg: string, ppi: number, deps: PngDeliveryDependencies = defaultDelivery
): Promise<ObsidianPngDelivery> {
    const delivery = await renderRequestedPng(svg, ppi, deps);
    const requested = delivery.requested;
    const attemptedPpis = [requested.ppi];
    if (await canHostDecode(requested.data, deps)) {
        assertNotAborted(deps.signal);
        return { ...delivery, compatibility: 'verified' };
    }
    assertNotAborted(deps.signal);
    let candidatePpi = chooseObsidianPngCandidatePpi(requested);
    while (candidatePpi < requested.ppi) {
        assertNotAborted(deps.signal);
        let companion: RasterizedImageResult;
        try { companion = await deps.renderPng(svg, candidatePpi); }
        catch (error) {
            assertNotAborted(deps.signal);
            throw new ObsidianPngCompatibilityError(requested, attemptedPpis,
                'Compatibility PNG rasterization failed: ' + (error instanceof Error ? error.message : String(error)));
        }
        assertNotAborted(deps.signal);
        attemptedPpis.push(candidatePpi);
        if (await canHostDecode(companion.data, deps)) {
            assertNotAborted(deps.signal);
            return { requested, primary: companion, companion, files: [requested, companion], preferredIndex: 1, compatibility: 'verified' };
        }
        assertNotAborted(deps.signal);
        if (candidatePpi === 1) break;
        candidatePpi = Math.max(1, Math.floor(candidatePpi * COMPATIBILITY_PPI_REDUCTION_FACTOR));
    }
    throw new ObsidianPngCompatibilityError(requested, attemptedPpis);
}

/** PPI-labelled siblings keep the requested original and compatible copy distinguishable. */
export function buildRequestedPngPath(basePngPath: string, ppi: number): string {
    return basePngPath.replace(/\.png$/i, '') + '_' + ppi + 'ppi.png';
}
export function buildObsidianPngCompanionPath(basePngPath: string, ppi: number): string {
    return basePngPath.replace(/\.png$/i, '') + '_obsidian_' + ppi + 'ppi.png';
}
