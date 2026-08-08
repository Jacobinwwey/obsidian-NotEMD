export interface PreviewImageLike {
    onload: null | ((...args: unknown[]) => unknown);
    onerror: null | ((...args: unknown[]) => unknown);
    src: string;
}

export type PreviewImageSource = PreviewImageLike | HTMLImageElement;

export interface PreviewCanvasContextLike {
    scale(x: number, y: number): void;
    drawImage(image: PreviewImageSource, dx: number, dy: number, dw: number, dh: number): void;
    fillStyle?: string;
    fillRect?: (x: number, y: number, width: number, height: number) => void;
}

export interface PreviewCanvasLike {
    width: number;
    height: number;
    getContext(type: '2d'): PreviewCanvasContextLike | null;
    toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export interface PreviewPngRasterDeps {
    createBlob(parts: BlobPart[], options?: BlobPropertyBag): Blob;
    createImage(): PreviewImageSource;
    createCanvas(width: number, height: number): PreviewCanvasLike;
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
    blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>;
    getScale?: () => number;
}

export interface SvgDimensions {
    width: number;
    height: number;
}

export const DEFAULT_PREVIEW_EXPORT_PPI = 300;
export const MIN_PREVIEW_EXPORT_PPI = 72;
export const MAX_PREVIEW_EXPORT_PPI = 600;
/**
 * Legacy convenience presets. `resolvePreviewExportPpi` accepts every integer
 * value in the inclusive 72-600 range; this list is not a validation allowlist.
 */
export const SUPPORTED_PREVIEW_EXPORT_PPI = [100, 300, 600] as const;
export type SupportedPreviewExportPpi = typeof SUPPORTED_PREVIEW_EXPORT_PPI[number];
const CSS_PIXELS_PER_INCH = 96;
const METERS_PER_INCH = 0.0254;
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface PreviewRasterExportOptions {
    ppi?: number;
    mimeType?: 'image/png' | 'image/jpeg';
    quality?: number;
    backgroundColor?: string;
}

export interface RasterizedImageResult {
    data: ArrayBuffer;
    sourceWidthCssPx: number;
    sourceHeightCssPx: number;
    imageWidthPx: number;
    imageHeightPx: number;
    ppi: number;
    mimeType: 'image/png' | 'image/jpeg';
}

export function resolvePreviewExportPpi(value?: number | string | null): number {
    if (value === undefined || value === null || value === '') {
        return DEFAULT_PREVIEW_EXPORT_PPI;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_PREVIEW_EXPORT_PPI;
    }

    return Math.max(MIN_PREVIEW_EXPORT_PPI, Math.min(MAX_PREVIEW_EXPORT_PPI, Math.round(parsed)));
}

export function resolvePngPixelsPerMeter(value?: number | string | null): number {
    return Math.max(1, Math.round(resolvePreviewExportPpi(value) / METERS_PER_INCH));
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

function writeUint32(value: number): Uint8Array {
    const output = new Uint8Array(4);
    new DataView(output.buffer).setUint32(0, value >>> 0, false);
    return output;
}

function readUint32(bytes: Uint8Array, offset: number): number {
    return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false);
}

function chunkType(bytes: Uint8Array, offset: number): string {
    return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

function buildCrc32Table(): Uint32Array {
    const table = new Uint32Array(256);
    for (let index = 0; index < table.length; index += 1) {
        let value = index;
        for (let bit = 0; bit < 8; bit += 1) {
            value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }
        table[index] = value >>> 0;
    }
    return table;
}

const PNG_CRC32_TABLE = buildCrc32Table();

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc = PNG_CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function asciiBytes(value: string): Uint8Array {
    return Uint8Array.from(value.split('').map(char => char.charCodeAt(0)));
}

function buildPngChunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = asciiBytes(type);
    const crcInput = concatBytes([typeBytes, data]);
    return concatBytes([
        writeUint32(data.byteLength),
        typeBytes,
        data,
        writeUint32(crc32(crcInput))
    ]);
}

function hasPngSignature(bytes: Uint8Array): boolean {
    if (bytes.byteLength < PNG_SIGNATURE.byteLength) {
        return false;
    }

    return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function buildPngPhysicalPixelDensityChunk(ppi: number): Uint8Array {
    const pixelsPerMeter = resolvePngPixelsPerMeter(ppi);
    const data = new Uint8Array(9);
    const view = new DataView(data.buffer);
    view.setUint32(0, pixelsPerMeter, false);
    view.setUint32(4, pixelsPerMeter, false);
    data[8] = 1;
    return buildPngChunk('pHYs', data);
}

export function applyPngPhysicalPixelDensity(png: ArrayBuffer, ppi: number): ArrayBuffer {
    const bytes = new Uint8Array(png);
    if (!hasPngSignature(bytes)) {
        return png;
    }

    const densityChunk = buildPngPhysicalPixelDensityChunk(ppi);
    const chunks: Uint8Array[] = [bytes.slice(0, PNG_SIGNATURE.byteLength)];
    let offset = PNG_SIGNATURE.byteLength;
    let densityWritten = false;

    while (offset + 12 <= bytes.byteLength) {
        const length = readUint32(bytes, offset);
        const typeOffset = offset + 4;
        const dataOffset = offset + 8;
        const chunkEnd = dataOffset + length + 4;
        if (chunkEnd > bytes.byteLength) {
            return png;
        }

        const type = chunkType(bytes, typeOffset);
        if (type === 'pHYs') {
            if (!densityWritten) {
                chunks.push(densityChunk);
                densityWritten = true;
            }
        } else {
            if (type === 'IDAT' && !densityWritten) {
                chunks.push(densityChunk);
                densityWritten = true;
            }
            chunks.push(bytes.slice(offset, chunkEnd));
        }

        offset = chunkEnd;
        if (type === 'IEND') {
            break;
        }
    }

    if (!densityWritten) {
        return png;
    }

    const output = concatBytes(chunks);
    const result = new ArrayBuffer(output.byteLength);
    new Uint8Array(result).set(output);
    return result;
}

function parseLength(value: string | undefined): number | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim();
    // Percentage dimensions describe the embedding viewport, not the SVG's
    // intrinsic canvas. Prefer the viewBox when the renderer emits them.
    if (normalized.endsWith('%')) {
        return null;
    }

    const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (!match) {
        return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
}

function readSvgRootAttributes(svg: string): string {
    return svg.match(/<svg\b([^>]*)>/i)?.[1] ?? '';
}

function readSvgAttribute(attributes: string, name: string): string | undefined {
    return attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

export function resolveSvgDimensions(svg: string): SvgDimensions {
    const rootAttributes = readSvgRootAttributes(svg);
    const width = parseLength(readSvgAttribute(rootAttributes, 'width'));
    const height = parseLength(readSvgAttribute(rootAttributes, 'height'));

    if (width && height) {
        return { width, height };
    }

    const viewBox = readSvgAttribute(rootAttributes, 'viewBox');
    if (viewBox) {
        const parts = viewBox.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
            return { width: parts[2], height: parts[3] };
        }
    }

    return { width: 1600, height: 900 };
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const BLOCK_TEXT_TAGS = new Set(['article', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'section']);

function escapeXmlText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function parseSvgAttributeNumber(attributes: string, name: string): number | null {
    const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    const parsed = parseLength(match?.[1]);
    return parsed !== null && parsed >= 0 ? parsed : null;
}

function isRasterSafeResourceReference(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('#')
        || (normalized.startsWith('data:image/') && !normalized.startsWith('data:image/svg+xml'))
        || normalized.startsWith('blob:');
}

function buildRasterFallbackText(attributes: string, rawContent: string): string {
    const textContent = rawContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/[ \t\f\r]+/g, ' ')
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean);
    if (textContent.length === 0) {
        return '';
    }

    const width = parseSvgAttributeNumber(attributes, 'width') ?? 0;
    const height = parseSvgAttributeNumber(attributes, 'height') ?? 0;
    const x = parseSvgAttributeNumber(attributes, 'x') ?? width / 2;
    const y = parseSvgAttributeNumber(attributes, 'y') ?? height / 2;
    const escapedLines = textContent.map(line => escapeXmlText(line));
    if (escapedLines.length === 1) {
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" data-notemd-raster-fallback="foreign-object">${escapedLines[0]}</text>`;
    }

    const lineHeight = Math.max(14, Math.min(24, height > 0 ? height / escapedLines.length : 18));
    const tspans = escapedLines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${line}</tspan>`).join('');
    return `<text x="${x}" y="${y - (escapedLines.length - 1) * lineHeight / 2}" text-anchor="middle" dominant-baseline="middle" data-notemd-raster-fallback="foreign-object">${tspans}</text>`;
}

function sanitizeSvgMarkupFallback(svg: string): string {
    let sanitized = svg.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<foreignObject\b([^>]*)>([\s\S]*?)<\/foreignObject>/gi, (_match, attributes: string, content: string) => {
        return buildRasterFallbackText(attributes, content);
    });
    sanitized = sanitized.replace(/<image\b([^>]*?)(?:\/?>[\s\S]*?<\/image>|\/?>)/gi, (match: string, attributes: string) => {
        const reference = attributes.match(/(?:xlink:)?href\s*=\s*["']([^"']+)["']/i)?.[1];
        return reference && isRasterSafeResourceReference(reference) ? match : '';
    });
    sanitized = sanitized.replace(/<use\b([^>]*?)(?:\/?>[\s\S]*?<\/use>|\/?>)/gi, (match: string, attributes: string) => {
        const reference = attributes.match(/(?:xlink:)?href\s*=\s*["']([^"']+)["']/i)?.[1];
        return reference && isRasterSafeResourceReference(reference) ? match : '';
    });
    sanitized = sanitized.replace(/\s+(?:xlink:)?href\s*=\s*(["'])(?!#|data:image\/(?!svg\+xml)|blob:)[^"']*\1/gi, '');
    sanitized = sanitized.replace(/url\(\s*(["']?)(?!#|data:|blob:)[^)]*\1\s*\)/gi, 'none');
    sanitized = sanitized.replace(/@import[^;]+;/gi, '');
    return sanitized;
}

function collectForeignObjectTextLines(root: Node): string[] {
    const lines: string[] = [];
    let current = '';
    const flush = () => {
        const normalized = current.replace(/[ \t\f\r]+/g, ' ').trim();
        if (normalized) {
            lines.push(normalized);
        }
        current = '';
    };
    const visit = (node: Node): void => {
        if (node.nodeType === 3) {
            current += node.nodeValue ?? '';
            return;
        }
        if (node.nodeType !== 1) {
            return;
        }
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'br') {
            flush();
            return;
        }
        const isBlock = BLOCK_TEXT_TAGS.has(tagName);
        if (isBlock && current.trim()) {
            flush();
        }
        for (const child of Array.from(element.childNodes)) {
            visit(child);
        }
        if (isBlock) {
            flush();
        }
    };
    for (const child of Array.from(root.childNodes)) {
        visit(child);
    }
    flush();
    return lines;
}

function sanitizeSvgDocument(svg: string): string | null {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
        return null;
    }

    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = document.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'svg' || root.querySelector('parsererror')) {
        return null;
    }

    for (const script of Array.from(root.querySelectorAll('script'))) {
        script.remove();
    }

    for (const foreignObject of Array.from(root.getElementsByTagName('foreignObject'))) {
        const lines = collectForeignObjectTextLines(foreignObject);
        if (lines.length === 0) {
            foreignObject.remove();
            continue;
        }
        const width = parseLength(foreignObject.getAttribute('width') ?? '') ?? 0;
        const height = parseLength(foreignObject.getAttribute('height') ?? '') ?? 0;
        const x = parseLength(foreignObject.getAttribute('x') ?? '') ?? width / 2;
        const y = parseLength(foreignObject.getAttribute('y') ?? '') ?? height / 2;
        const textElement = document.createElementNS(SVG_NAMESPACE, 'text');
        textElement.setAttribute('x', String(x));
        textElement.setAttribute('y', String(y));
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('data-notemd-raster-fallback', 'foreign-object');
        if (lines.length === 1) {
            textElement.textContent = lines[0];
        } else {
            const lineHeight = Math.max(14, Math.min(24, height > 0 ? height / lines.length : 18));
            textElement.setAttribute('y', String(y - (lines.length - 1) * lineHeight / 2));
            lines.forEach((line, index) => {
                const tspan = document.createElementNS(SVG_NAMESPACE, 'tspan');
                tspan.setAttribute('x', String(x));
                tspan.setAttribute('dy', String(index === 0 ? 0 : lineHeight));
                tspan.textContent = line;
                textElement.appendChild(tspan);
            });
        }
        foreignObject.parentNode?.replaceChild(textElement, foreignObject);
    }

    for (const element of Array.from(root.querySelectorAll('*'))) {
        const reference = element.getAttribute('href')
            ?? element.getAttribute('xlink:href')
            ?? element.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (!reference || isRasterSafeResourceReference(reference)) {
            continue;
        }
        if (element.tagName.toLowerCase() === 'image' || element.tagName.toLowerCase() === 'use') {
            element.remove();
        } else {
            element.removeAttribute('href');
            element.removeAttribute('xlink:href');
        }
    }

    for (const element of Array.from(root.querySelectorAll('[style]'))) {
        const style = element.getAttribute('style') ?? '';
        element.setAttribute('style', style.replace(/url\(\s*(["']?)(?!#|data:|blob:)[^)]*\1\s*\)/gi, 'none'));
    }
    for (const styleElement of Array.from(root.querySelectorAll('style'))) {
        styleElement.textContent = (styleElement.textContent ?? '')
            .replace(/@import[^;]+;/gi, '')
            .replace(/url\(\s*(["']?)(?!#|data:|blob:)[^)]*\1\s*\)/gi, 'none');
    }

    return new XMLSerializer().serializeToString(root);
}

export function sanitizeSvgForExport(svg: string): string {
    const documentMarkup = sanitizeSvgDocument(svg);
    return documentMarkup ?? sanitizeSvgMarkupFallback(svg);
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

function resolveRasterScale(ppi: number): number {
    return ppi / CSS_PIXELS_PER_INCH;
}

export async function rasterizeSvgToImageArrayBuffer(
    svg: string,
    deps: PreviewPngRasterDeps = createDefaultPngRasterDeps(),
    options: PreviewRasterExportOptions = {}
): Promise<RasterizedImageResult> {
    const dimensions = resolveSvgDimensions(svg);
    const ppi = resolvePreviewExportPpi(options.ppi);
    const scale = resolveRasterScale(ppi);
    const mimeType = options.mimeType ?? 'image/png';
    const rasterSvg = sanitizeSvgForExport(svg);
    const blob = deps.createBlob([rasterSvg], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = deps.createObjectURL(blob);
    const imageWidthPx = Math.max(1, Math.ceil(dimensions.width * scale));
    const imageHeightPx = Math.max(1, Math.ceil(dimensions.height * scale));

    try {
        const image = await loadImage(objectUrl, deps);
        const canvas = deps.createCanvas(imageWidthPx, imageHeightPx);
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('PNG export canvas context is unavailable.');
        }

        context.scale(scale, scale);
        if (context.fillRect) {
            context.fillStyle = options.backgroundColor ?? '#ffffff';
            context.fillRect(0, 0, dimensions.width, dimensions.height);
        }
        context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

        const rasterBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Raster export canvas encoding failed.'));
                    return;
                }
                resolve(blob);
            }, mimeType, options.quality);
        });
        const data = await deps.blobToArrayBuffer(rasterBlob);
        const exportData = mimeType === 'image/png'
            ? applyPngPhysicalPixelDensity(data, ppi)
            : data;

        return {
            data: exportData,
            sourceWidthCssPx: dimensions.width,
            sourceHeightCssPx: dimensions.height,
            imageWidthPx,
            imageHeightPx,
            ppi,
            mimeType
        };
    } finally {
        deps.revokeObjectURL(objectUrl);
    }
}

export async function rasterizeSvgToPngArrayBuffer(
    svg: string,
    deps: PreviewPngRasterDeps = createDefaultPngRasterDeps(),
    options: PreviewRasterExportOptions = {}
): Promise<ArrayBuffer> {
    const result = await rasterizeSvgToImageArrayBuffer(svg, deps, {
        ...options,
        mimeType: 'image/png'
    });
    return result.data;
}

export async function rasterizeSvgToJpeg(
    svg: string,
    deps: PreviewPngRasterDeps = createDefaultPngRasterDeps(),
    options: PreviewRasterExportOptions = {}
): Promise<RasterizedImageResult> {
    return rasterizeSvgToImageArrayBuffer(svg, deps, {
        ...options,
        mimeType: 'image/jpeg',
        quality: options.quality ?? 0.92,
        backgroundColor: options.backgroundColor ?? '#ffffff'
    });
}
