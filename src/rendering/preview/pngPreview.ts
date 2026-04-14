export interface PreviewImageLike {
    onload: null | ((...args: unknown[]) => unknown);
    onerror: null | ((...args: unknown[]) => unknown);
    src: string;
}

export type PreviewImageSource = PreviewImageLike | HTMLImageElement;

export interface PreviewCanvasContextLike {
    scale(x: number, y: number): void;
    drawImage(image: PreviewImageSource, dx: number, dy: number, dw: number, dh: number): void;
}

export interface PreviewCanvasLike {
    width: number;
    height: number;
    getContext(type: '2d'): PreviewCanvasContextLike | null;
    toBlob(callback: (blob: Blob | null) => void, type?: string): void;
}

export interface PreviewPngRasterDeps {
    createBlob(parts: BlobPart[], options?: BlobPropertyBag): Blob;
    createImage(): PreviewImageSource;
    createCanvas(width: number, height: number): PreviewCanvasLike;
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
    blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>;
    getScale(): number;
}

export interface SvgDimensions {
    width: number;
    height: number;
}

function parseLength(value: string | undefined): number | null {
    if (!value) {
        return null;
    }

    const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (!match) {
        return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
}

export function resolveSvgDimensions(svg: string): SvgDimensions {
    const widthMatch = svg.match(/\bwidth="([^"]+)"/i);
    const heightMatch = svg.match(/\bheight="([^"]+)"/i);
    const width = parseLength(widthMatch?.[1]);
    const height = parseLength(heightMatch?.[1]);

    if (width && height) {
        return { width, height };
    }

    const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/i);
    if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
            return { width: parts[2], height: parts[3] };
        }
    }

    return { width: 1600, height: 900 };
}

function createDefaultPngRasterDeps(): PreviewPngRasterDeps {
    return {
        createBlob: (parts, options) => new Blob(parts, options),
        createImage: () => new Image(),
        createCanvas: (width, height) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas as unknown as PreviewCanvasLike;
        },
        createObjectURL: (blob) => URL.createObjectURL(blob),
        revokeObjectURL: (url) => URL.revokeObjectURL(url),
        blobToArrayBuffer: async (blob) => blob.arrayBuffer(),
        getScale: () => {
            if (typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number' && window.devicePixelRatio > 0) {
                return Math.max(1, Math.min(3, window.devicePixelRatio));
            }
            return 2;
        }
    };
}

async function loadImage(sourceUrl: string, deps: PreviewPngRasterDeps): Promise<PreviewImageSource> {
    const image = deps.createImage();
    return await new Promise<PreviewImageSource>((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = (...args: unknown[]) => {
            const event = args[0];
            reject(new Error(`PNG export image load failed: ${String(event ?? 'unknown error')}`));
        };
        image.src = sourceUrl;
    });
}

async function renderCanvasToBlob(canvas: PreviewCanvasLike): Promise<Blob> {
    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('PNG export canvas encoding failed.'));
                return;
            }
            resolve(blob);
        }, 'image/png');
    });
}

export async function rasterizeSvgToPngArrayBuffer(
    svg: string,
    deps: PreviewPngRasterDeps = createDefaultPngRasterDeps()
): Promise<ArrayBuffer> {
    const dimensions = resolveSvgDimensions(svg);
    const scale = Math.max(1, deps.getScale());
    const blob = deps.createBlob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = deps.createObjectURL(blob);

    try {
        const image = await loadImage(objectUrl, deps);
        const canvas = deps.createCanvas(
            Math.max(1, Math.ceil(dimensions.width * scale)),
            Math.max(1, Math.ceil(dimensions.height * scale))
        );
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('PNG export canvas context is unavailable.');
        }

        context.scale(scale, scale);
        context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

        const pngBlob = await renderCanvasToBlob(canvas);
        return await deps.blobToArrayBuffer(pngBlob);
    } finally {
        deps.revokeObjectURL(objectUrl);
    }
}
