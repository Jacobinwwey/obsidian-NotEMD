import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { CircuitikzCompileDiagnostic } from './circuitikzDiagnostics';

export interface CircuitikzRenderSmokeRequest {
    expectedArtifactPath: string;
    expectedSvgText?: string[];
}

export interface CircuitikzSvgExpectedTextReport {
    text: string;
    present: boolean;
}

export interface CircuitikzSvgSmokeReport {
    rootElementPresent: boolean;
    width?: number;
    height?: number;
    viewBox?: [number, number, number, number];
    visibleElementCount: number;
    textElementCount: number;
    expectedText: CircuitikzSvgExpectedTextReport[];
}

export interface CircuitikzPngSmokeReport {
    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    interlaceMethod: number;
    decodedPixelCount: number;
    nonBackgroundPixelCount: number;
}

export interface CircuitikzRenderSmokeReport {
    expectedArtifactPath: string;
    artifactExists: boolean;
    artifactSizeBytes: number;
    nonEmptyArtifact: boolean;
    artifactKind: 'opaque' | 'png' | 'svg';
    svg?: CircuitikzSvgSmokeReport;
    png?: CircuitikzPngSmokeReport;
    diagnostics: CircuitikzCompileDiagnostic[];
}

interface PngChunk {
    type: string;
    data: Buffer;
}

interface PngHeader {
    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: number;
}

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

function parsePositiveLength(value: string | undefined): number | undefined {
    if (!value || value.trim().endsWith('%')) {
        return undefined;
    }

    const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)(?:px|pt|bp|mm|cm|in)?$/i);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    return numericValue > 0 ? numericValue : undefined;
}

function readAttribute(tag: string, attributeName: string): string | undefined {
    const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = tag.match(new RegExp(`\\s${escapedName}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return match ? match[1] : undefined;
}

function parseViewBox(value: string | undefined): [number, number, number, number] | undefined {
    if (!value) {
        return undefined;
    }

    const parts = value
        .trim()
        .split(/[\s,]+/)
        .map(part => Number(part));
    if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) {
        return undefined;
    }
    if (parts[2] <= 0 || parts[3] <= 0) {
        return undefined;
    }

    return [parts[0], parts[1], parts[2], parts[3]];
}

function countMatches(text: string, pattern: RegExp): number {
    return Array.from(text.matchAll(pattern)).length;
}

function extractSvgSmoke(svgText: string, expectedSvgText: string[]): CircuitikzSvgSmokeReport {
    const svgTag = svgText.match(/<svg\b[^>]*>/i)?.[0];
    const width = parsePositiveLength(svgTag ? readAttribute(svgTag, 'width') : undefined);
    const height = parsePositiveLength(svgTag ? readAttribute(svgTag, 'height') : undefined);
    const viewBox = parseViewBox(svgTag ? readAttribute(svgTag, 'viewBox') : undefined);
    const searchableText = decodeXmlEntities(svgText.replace(/<[^>]+>/g, ' '));

    return {
        rootElementPresent: Boolean(svgTag),
        width,
        height,
        viewBox,
        visibleElementCount: countMatches(
            svgText,
            /<(?:path|line|polyline|polygon|rect|circle|ellipse|text|use)\b(?![^>]*\bdisplay\s*=\s*["']none["'])/gi
        ),
        textElementCount: countMatches(svgText, /<text\b/gi),
        expectedText: expectedSvgText.map(text => ({
            text,
            present: svgText.includes(text) || searchableText.includes(text)
        }))
    };
}

function artifactMissingDiagnostic(expectedArtifactPath: string): CircuitikzCompileDiagnostic {
    return {
        severity: 'error',
        kind: 'render-artifact-missing',
        message: 'Expected circuitikz render artifact was not created.',
        excerpt: expectedArtifactPath,
        advice: 'Check the renderer output path, job name, and arguments before treating the compile run as a valid render smoke.'
    };
}

function artifactEmptyDiagnostic(expectedArtifactPath: string): CircuitikzCompileDiagnostic {
    return {
        severity: 'error',
        kind: 'render-artifact-empty',
        message: 'Expected circuitikz render artifact is empty.',
        excerpt: expectedArtifactPath,
        advice: 'Inspect the renderer log and rerun with a known-good golden reference before attempting visual repair.'
    };
}

function svgDiagnostic(report: CircuitikzSvgSmokeReport, expectedArtifactPath: string): CircuitikzCompileDiagnostic[] {
    const diagnostics: CircuitikzCompileDiagnostic[] = [];

    if (!report.rootElementPresent) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-invalid',
            message: 'Expected SVG render artifact does not contain an <svg> root element.',
            excerpt: expectedArtifactPath,
            advice: 'Check the renderer conversion stage before using the artifact for visual feedback.'
        });
    }

    if (!report.viewBox && (!report.width || !report.height)) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-dimension-missing',
            message: 'Expected SVG render artifact does not expose a positive width/height or viewBox.',
            excerpt: expectedArtifactPath,
            advice: 'Keep renderer output bounded so later screenshot and layout checks can compare stable dimensions.'
        });
    }

    if (report.visibleElementCount === 0) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-no-visible-elements',
            message: 'Expected SVG render artifact contains no visible drawing elements.',
            excerpt: expectedArtifactPath,
            advice: 'Treat this as a failed render smoke even if the renderer exited successfully.'
        });
    }

    for (const expectedText of report.expectedText) {
        if (!expectedText.present) {
            diagnostics.push({
                severity: 'error',
                kind: 'render-svg-text-missing',
                message: `Expected SVG render artifact is missing text: ${expectedText.text}`,
                excerpt: expectedArtifactPath,
                advice: 'Only require SVG text tokens for renderers that preserve text nodes or searchable labels; otherwise validate labels through a later OCR/screenshot pass.'
            });
        }
    }

    return diagnostics;
}

function parsePngChunks(pngBytes: Buffer): PngChunk[] {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (pngBytes.length < signature.length || !pngBytes.subarray(0, signature.length).equals(signature)) {
        throw new Error('PNG signature is missing.');
    }

    const chunks: PngChunk[] = [];
    let offset = signature.length;
    while (offset + 8 <= pngBytes.length) {
        const length = pngBytes.readUInt32BE(offset);
        const type = pngBytes.subarray(offset + 4, offset + 8).toString('ascii');
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        const nextOffset = dataEnd + 4;
        if (dataEnd > pngBytes.length || nextOffset > pngBytes.length) {
            throw new Error(`PNG chunk ${type} extends beyond the file boundary.`);
        }

        chunks.push({
            type,
            data: pngBytes.subarray(dataStart, dataEnd)
        });
        offset = nextOffset;
        if (type === 'IEND') {
            break;
        }
    }

    return chunks;
}

function parsePngHeader(chunks: PngChunk[]): PngHeader {
    const ihdr = chunks.find(chunk => chunk.type === 'IHDR');
    if (!ihdr || ihdr.data.length !== 13) {
        throw new Error('PNG IHDR chunk is missing or malformed.');
    }

    return {
        width: ihdr.data.readUInt32BE(0),
        height: ihdr.data.readUInt32BE(4),
        bitDepth: ihdr.data[8],
        colorType: ihdr.data[9],
        compressionMethod: ihdr.data[10],
        filterMethod: ihdr.data[11],
        interlaceMethod: ihdr.data[12]
    };
}

function channelsForColorType(colorType: number): number | undefined {
    switch (colorType) {
        case 0:
            return 1;
        case 2:
            return 3;
        case 4:
            return 2;
        case 6:
            return 4;
        default:
            return undefined;
    }
}

function paethPredictor(left: number, up: number, upLeft: number): number {
    const prediction = left + up - upLeft;
    const leftDistance = Math.abs(prediction - left);
    const upDistance = Math.abs(prediction - up);
    const upLeftDistance = Math.abs(prediction - upLeft);

    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
        return left;
    }
    if (upDistance <= upLeftDistance) {
        return up;
    }
    return upLeft;
}

function unfilterPngScanlines(inflated: Buffer, width: number, height: number, bytesPerPixel: number): Buffer {
    const rowLength = width * bytesPerPixel;
    const expectedLength = (rowLength + 1) * height;
    if (inflated.length < expectedLength) {
        throw new Error('PNG image data is shorter than the decoded scanline length.');
    }

    const decoded = Buffer.alloc(rowLength * height);
    for (let row = 0; row < height; row += 1) {
        const sourceOffset = row * (rowLength + 1);
        const filter = inflated[sourceOffset];
        const targetOffset = row * rowLength;
        const previousOffset = row > 0 ? targetOffset - rowLength : undefined;

        for (let column = 0; column < rowLength; column += 1) {
            const raw = inflated[sourceOffset + 1 + column];
            const left = column >= bytesPerPixel ? decoded[targetOffset + column - bytesPerPixel] : 0;
            const up = previousOffset === undefined ? 0 : decoded[previousOffset + column];
            const upLeft = previousOffset !== undefined && column >= bytesPerPixel
                ? decoded[previousOffset + column - bytesPerPixel]
                : 0;

            switch (filter) {
                case 0:
                    decoded[targetOffset + column] = raw;
                    break;
                case 1:
                    decoded[targetOffset + column] = (raw + left) & 0xff;
                    break;
                case 2:
                    decoded[targetOffset + column] = (raw + up) & 0xff;
                    break;
                case 3:
                    decoded[targetOffset + column] = (raw + Math.floor((left + up) / 2)) & 0xff;
                    break;
                case 4:
                    decoded[targetOffset + column] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
                    break;
                default:
                    throw new Error(`Unsupported PNG filter type: ${filter}.`);
            }
        }
    }

    return decoded;
}

function readPixel(decoded: Buffer, pixelIndex: number, colorType: number, channels: number): [number, number, number, number] {
    const offset = pixelIndex * channels;
    switch (colorType) {
        case 0: {
            const gray = decoded[offset];
            return [gray, gray, gray, 255];
        }
        case 2:
            return [decoded[offset], decoded[offset + 1], decoded[offset + 2], 255];
        case 4: {
            const gray = decoded[offset];
            return [gray, gray, gray, decoded[offset + 1]];
        }
        case 6:
            return [decoded[offset], decoded[offset + 1], decoded[offset + 2], decoded[offset + 3]];
        default:
            throw new Error(`Unsupported PNG color type: ${colorType}.`);
    }
}

function colorDistance(left: [number, number, number, number], right: [number, number, number, number]): number {
    return Math.abs(left[0] - right[0])
        + Math.abs(left[1] - right[1])
        + Math.abs(left[2] - right[2])
        + Math.abs(left[3] - right[3]);
}

function extractPngSmoke(pngBytes: Buffer): CircuitikzPngSmokeReport {
    const chunks = parsePngChunks(pngBytes);
    const header = parsePngHeader(chunks);
    const channels = channelsForColorType(header.colorType);
    if (!channels || header.bitDepth !== 8 || header.compressionMethod !== 0 || header.filterMethod !== 0 || header.interlaceMethod !== 0) {
        throw new Error(`Unsupported PNG format: bitDepth=${header.bitDepth}, colorType=${header.colorType}, interlace=${header.interlaceMethod}.`);
    }
    if (header.width <= 0 || header.height <= 0) {
        throw new Error('PNG dimensions must be positive.');
    }

    const idatChunks = chunks.filter(chunk => chunk.type === 'IDAT');
    if (idatChunks.length === 0) {
        throw new Error('PNG IDAT image data is missing.');
    }

    const inflated = zlib.inflateSync(Buffer.concat(idatChunks.map(chunk => chunk.data)));
    const decoded = unfilterPngScanlines(inflated, header.width, header.height, channels);
    const decodedPixelCount = header.width * header.height;
    const background = readPixel(decoded, 0, header.colorType, channels);
    let nonBackgroundPixelCount = 0;

    for (let pixelIndex = 0; pixelIndex < decodedPixelCount; pixelIndex += 1) {
        const pixel = readPixel(decoded, pixelIndex, header.colorType, channels);
        if (pixel[3] > 0 && colorDistance(pixel, background) > 8) {
            nonBackgroundPixelCount += 1;
        }
    }

    return {
        width: header.width,
        height: header.height,
        bitDepth: header.bitDepth,
        colorType: header.colorType,
        interlaceMethod: header.interlaceMethod,
        decodedPixelCount,
        nonBackgroundPixelCount
    };
}

function pngDiagnostics(report: CircuitikzPngSmokeReport, expectedArtifactPath: string): CircuitikzCompileDiagnostic[] {
    if (report.nonBackgroundPixelCount > 0) {
        return [];
    }

    return [{
        severity: 'error',
        kind: 'render-png-blank',
        message: 'Expected PNG render artifact appears visually blank.',
        excerpt: expectedArtifactPath,
        advice: 'Treat this as a failed screenshot smoke and inspect the renderer before attempting topology-preserving visual repair.'
    }];
}

export function inspectCircuitikzRenderArtifact(request: CircuitikzRenderSmokeRequest): CircuitikzRenderSmokeReport {
    const expectedArtifactPath = request.expectedArtifactPath;
    const expectedSvgText = request.expectedSvgText ?? [];

    if (!fs.existsSync(expectedArtifactPath)) {
        return {
            expectedArtifactPath,
            artifactExists: false,
            artifactSizeBytes: 0,
            nonEmptyArtifact: false,
            artifactKind: 'opaque',
            diagnostics: [artifactMissingDiagnostic(expectedArtifactPath)]
        };
    }

    const artifactSizeBytes = fs.statSync(expectedArtifactPath).size;
    if (artifactSizeBytes === 0) {
        return {
            expectedArtifactPath,
            artifactExists: true,
            artifactSizeBytes,
            nonEmptyArtifact: false,
            artifactKind: 'opaque',
            diagnostics: [artifactEmptyDiagnostic(expectedArtifactPath)]
        };
    }

    const artifactExtension = path.extname(expectedArtifactPath).toLowerCase();
    if (artifactExtension === '.png') {
        try {
            const png = extractPngSmoke(fs.readFileSync(expectedArtifactPath));
            return {
                expectedArtifactPath,
                artifactExists: true,
                artifactSizeBytes,
                nonEmptyArtifact: true,
                artifactKind: 'png',
                png,
                diagnostics: pngDiagnostics(png, expectedArtifactPath)
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                expectedArtifactPath,
                artifactExists: true,
                artifactSizeBytes,
                nonEmptyArtifact: true,
                artifactKind: 'png',
                diagnostics: [{
                    severity: 'error',
                    kind: message.startsWith('Unsupported PNG format') ? 'render-png-unsupported' : 'render-png-invalid',
                    message: `Expected PNG render artifact could not be inspected: ${message}`,
                    excerpt: expectedArtifactPath,
                    advice: 'Use a non-interlaced 8-bit grayscale, RGB, or RGBA PNG for screenshot-level smoke checks.'
                }]
            };
        }
    }

    if (artifactExtension !== '.svg') {
        return {
            expectedArtifactPath,
            artifactExists: true,
            artifactSizeBytes,
            nonEmptyArtifact: true,
            artifactKind: 'opaque',
            diagnostics: []
        };
    }

    const svgText = fs.readFileSync(expectedArtifactPath, 'utf8').replace(/^\uFEFF/, '');
    const svg = extractSvgSmoke(svgText, expectedSvgText);

    return {
        expectedArtifactPath,
        artifactExists: true,
        artifactSizeBytes,
        nonEmptyArtifact: true,
        artifactKind: 'svg',
        svg,
        diagnostics: svgDiagnostic(svg, expectedArtifactPath)
    };
}
