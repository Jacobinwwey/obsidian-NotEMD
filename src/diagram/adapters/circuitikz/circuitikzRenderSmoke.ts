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
    pathOnlyGlyphUseCount: number;
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
    foregroundBounds?: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
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

interface SvgBox {
    label: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface SvgTextBox extends SvgBox {
    text: string;
}

interface SvgTransform {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
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

function countPathOnlyGlyphUses(svgText: string): number {
    const pathIds = new Set(
        Array.from(svgText.matchAll(/<path\b[^>]*\sid\s*=\s*["']([^"']+)["'][^>]*>/gi))
            .map(match => match[1])
    );
    if (pathIds.size === 0) {
        return 0;
    }

    return Array.from(svgText.matchAll(/<use\b[^>]*>/gi))
        .filter(match => {
            const tag = match[0];
            if (tagIsHidden(tag)) {
                return false;
            }
            const reference = readAttribute(tag, 'href') ?? readAttribute(tag, 'xlink:href');
            return Boolean(reference?.startsWith('#') && pathIds.has(reference.slice(1)));
        })
        .length;
}

function parseNumericAttribute(tag: string, attributeName: string): number | undefined {
    const value = readAttribute(tag, attributeName);
    if (!value) {
        return undefined;
    }

    const match = value.trim().match(/^-?[0-9]+(?:\.[0-9]+)?/);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[0]);
    return Number.isFinite(numericValue) ? numericValue : undefined;
}

function boxFromPoints(label: string, points: Array<[number, number]>): SvgBox | undefined {
    if (points.length === 0) {
        return undefined;
    }

    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    return {
        label,
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
    };
}

function identityTransform(): SvgTransform {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

function multiplyTransforms(left: SvgTransform, right: SvgTransform): SvgTransform {
    return {
        a: left.a * right.a + left.c * right.b,
        b: left.b * right.a + left.d * right.b,
        c: left.a * right.c + left.c * right.d,
        d: left.b * right.c + left.d * right.d,
        e: left.a * right.e + left.c * right.f + left.e,
        f: left.b * right.e + left.d * right.f + left.f
    };
}

function parseTransformNumbers(value: string): number[] {
    return Array.from(value.matchAll(/-?[0-9]+(?:\.[0-9]+)?(?:e[-+]?[0-9]+)?/gi))
        .map(match => Number(match[0]))
        .filter(Number.isFinite);
}

function translateTransform(x: number, y: number): SvgTransform {
    return { a: 1, b: 0, c: 0, d: 1, e: x, f: y };
}

function scaleTransform(x: number, y: number): SvgTransform {
    return { a: x, b: 0, c: 0, d: y, e: 0, f: 0 };
}

function rotateTransform(degrees: number, centerX?: number, centerY?: number): SvgTransform {
    const radians = degrees * Math.PI / 180;
    const rotation = {
        a: Math.cos(radians),
        b: Math.sin(radians),
        c: -Math.sin(radians),
        d: Math.cos(radians),
        e: 0,
        f: 0
    };
    if (centerX === undefined || centerY === undefined) {
        return rotation;
    }
    return multiplyTransforms(
        multiplyTransforms(translateTransform(centerX, centerY), rotation),
        translateTransform(-centerX, -centerY)
    );
}

function parseSvgTransform(value: string | undefined): SvgTransform {
    if (!value) {
        return identityTransform();
    }

    let transform = identityTransform();
    for (const match of value.matchAll(/([a-z]+)\s*\(([^)]*)\)/gi)) {
        const name = match[1].toLowerCase();
        const numbers = parseTransformNumbers(match[2]);
        let next = identityTransform();

        if (name === 'matrix' && numbers.length >= 6) {
            next = {
                a: numbers[0],
                b: numbers[1],
                c: numbers[2],
                d: numbers[3],
                e: numbers[4],
                f: numbers[5]
            };
        } else if (name === 'translate' && numbers.length >= 1) {
            next = translateTransform(numbers[0], numbers[1] ?? 0);
        } else if (name === 'scale' && numbers.length >= 1) {
            next = scaleTransform(numbers[0], numbers[1] ?? numbers[0]);
        } else if (name === 'rotate' && numbers.length >= 1) {
            next = rotateTransform(numbers[0], numbers[1], numbers[2]);
        } else if (name === 'skewx' && numbers.length >= 1) {
            next = { a: 1, b: 0, c: Math.tan(numbers[0] * Math.PI / 180), d: 1, e: 0, f: 0 };
        } else if (name === 'skewy' && numbers.length >= 1) {
            next = { a: 1, b: Math.tan(numbers[0] * Math.PI / 180), c: 0, d: 1, e: 0, f: 0 };
        }

        transform = multiplyTransforms(transform, next);
    }

    return transform;
}

function transformPoint(transform: SvgTransform, point: [number, number]): [number, number] {
    return [
        transform.a * point[0] + transform.c * point[1] + transform.e,
        transform.b * point[0] + transform.d * point[1] + transform.f
    ];
}

function transformBox<T extends SvgBox>(box: T, transform: SvgTransform): T {
    const transformed = boxFromPoints(box.label, [
        transformPoint(transform, [box.minX, box.minY]),
        transformPoint(transform, [box.maxX, box.minY]),
        transformPoint(transform, [box.maxX, box.maxY]),
        transformPoint(transform, [box.minX, box.maxY])
    ]);

    return {
        ...box,
        minX: transformed?.minX ?? box.minX,
        minY: transformed?.minY ?? box.minY,
        maxX: transformed?.maxX ?? box.maxX,
        maxY: transformed?.maxY ?? box.maxY
    };
}

function tagIsHidden(tag: string): boolean {
    return /\bdisplay\s*=\s*["']none["']/i.test(tag);
}

function pathBox(tag: string): SvgBox | undefined {
    const d = readAttribute(tag, 'd');
    if (!d) {
        return undefined;
    }

    const tokens = Array.from(d.matchAll(/[MLHVZmlhvz]|-?[0-9]+(?:\.[0-9]+)?(?:e[-+]?[0-9]+)?/g))
        .map(match => match[0]);
    const points: Array<[number, number]> = [];
    let command = '';
    let index = 0;
    let x = 0;
    let y = 0;

    const readNumber = (): number | undefined => {
        const token = tokens[index];
        if (token === undefined || /^[MLHVZmlhvz]$/.test(token)) {
            return undefined;
        }
        index += 1;
        const value = Number(token);
        return Number.isFinite(value) ? value : undefined;
    };

    while (index < tokens.length) {
        const token = tokens[index];
        if (/^[MLHVZmlhvz]$/.test(token)) {
            command = token;
            index += 1;
            if (command.toLowerCase() === 'z') {
                continue;
            }
        }

        if (command === 'M' || command === 'L' || command === 'm' || command === 'l') {
            const nextX = readNumber();
            const nextY = readNumber();
            if (nextX === undefined || nextY === undefined) {
                break;
            }
            x = command === 'm' || command === 'l' ? x + nextX : nextX;
            y = command === 'm' || command === 'l' ? y + nextY : nextY;
            points.push([x, y]);
            continue;
        }

        if (command === 'H' || command === 'h') {
            const nextX = readNumber();
            if (nextX === undefined) {
                break;
            }
            x = command === 'h' ? x + nextX : nextX;
            points.push([x, y]);
            continue;
        }

        if (command === 'V' || command === 'v') {
            const nextY = readNumber();
            if (nextY === undefined) {
                break;
            }
            y = command === 'v' ? y + nextY : nextY;
            points.push([x, y]);
            continue;
        }

        index += 1;
    }

    return boxFromPoints('path', points);
}

function elementBox(tagName: string, tag: string): SvgBox | undefined {
    if (tagName === 'path') {
        return pathBox(tag);
    }

    if (tagName === 'line') {
        const x1 = parseNumericAttribute(tag, 'x1');
        const y1 = parseNumericAttribute(tag, 'y1');
        const x2 = parseNumericAttribute(tag, 'x2');
        const y2 = parseNumericAttribute(tag, 'y2');
        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
            return undefined;
        }
        return boxFromPoints('line', [[x1, y1], [x2, y2]]);
    }

    if (tagName === 'rect') {
        const x = parseNumericAttribute(tag, 'x') ?? 0;
        const y = parseNumericAttribute(tag, 'y') ?? 0;
        const width = parseNumericAttribute(tag, 'width');
        const height = parseNumericAttribute(tag, 'height');
        if (width === undefined || height === undefined) {
            return undefined;
        }
        return {
            label: 'rect',
            minX: x,
            minY: y,
            maxX: x + width,
            maxY: y + height
        };
    }

    if (tagName === 'circle') {
        const cx = parseNumericAttribute(tag, 'cx');
        const cy = parseNumericAttribute(tag, 'cy');
        const r = parseNumericAttribute(tag, 'r');
        if (cx === undefined || cy === undefined || r === undefined) {
            return undefined;
        }
        return {
            label: 'circle',
            minX: cx - r,
            minY: cy - r,
            maxX: cx + r,
            maxY: cy + r
        };
    }

    if (tagName === 'ellipse') {
        const cx = parseNumericAttribute(tag, 'cx');
        const cy = parseNumericAttribute(tag, 'cy');
        const rx = parseNumericAttribute(tag, 'rx');
        const ry = parseNumericAttribute(tag, 'ry');
        if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) {
            return undefined;
        }
        return {
            label: 'ellipse',
            minX: cx - rx,
            minY: cy - ry,
            maxX: cx + rx,
            maxY: cy + ry
        };
    }

    return undefined;
}

function textBox(tag: string): SvgTextBox | undefined {
    if (tagIsHidden(tag)) {
        return undefined;
    }

    const x = parseNumericAttribute(tag, 'x');
    const y = parseNumericAttribute(tag, 'y');
    if (x === undefined || y === undefined) {
        return undefined;
    }

    const fontSize = parseNumericAttribute(tag, 'font-size') ?? 12;
    const text = decodeXmlEntities((tag.match(/<text\b[^>]*>([\s\S]*?)<\/text>/i)?.[1] ?? '')
        .replace(/<[^>]+>/g, '')
        .trim());
    if (!text) {
        return undefined;
    }

    const width = Math.max(fontSize * 0.65, text.length * fontSize * 0.55);
    return {
        label: `text:${text}`,
        text,
        minX: x,
        minY: y - fontSize,
        maxX: x + width,
        maxY: y + fontSize * 0.25
    };
}

function collectSvgBoxes(svgText: string): { boxes: SvgBox[]; textBoxes: SvgTextBox[] } {
    const boxes: SvgBox[] = [];
    const textBoxes: SvgTextBox[] = [];
    const groupStack: Array<{ transform: SvgTransform; hidden: boolean }> = [{
        transform: identityTransform(),
        hidden: false
    }];
    const tokenPattern = /<\/g\s*>|<g\b[^>]*\/?>|<(path|line|rect|circle|ellipse)\b[^>]*\/?>|<text\b[^>]*>[\s\S]*?<\/text>/gi;

    for (const match of svgText.matchAll(tokenPattern)) {
        const tag = match[0];
        if (/^<\/g/i.test(tag)) {
            if (groupStack.length > 1) {
                groupStack.pop();
            }
            continue;
        }

        const parent = groupStack[groupStack.length - 1];
        if (/^<g\b/i.test(tag)) {
            if (/\/\s*>$/.test(tag)) {
                continue;
            }
            groupStack.push({
                transform: multiplyTransforms(parent.transform, parseSvgTransform(readAttribute(tag, 'transform'))),
                hidden: parent.hidden || tagIsHidden(tag)
            });
            continue;
        }

        if (parent.hidden || tagIsHidden(tag)) {
            continue;
        }

        const localTransform = multiplyTransforms(parent.transform, parseSvgTransform(readAttribute(tag, 'transform')));
        if (/^<text\b/i.test(tag)) {
            const box = textBox(tag);
            if (box) {
                const transformedBox = transformBox(box, localTransform);
                textBoxes.push(transformedBox);
                boxes.push(transformedBox);
            }
            continue;
        }

        const tagName = match[1]?.toLowerCase();
        if (!tagName) {
            continue;
        }
        const box = elementBox(tagName, tag);
        if (box) {
            boxes.push(transformBox(box, localTransform));
        }
    }

    return { boxes, textBoxes };
}

function extractTextBoxes(svgText: string): SvgTextBox[] {
    return collectSvgBoxes(svgText).textBoxes;
}

function extractElementBoxes(svgText: string): SvgBox[] {
    return collectSvgBoxes(svgText).boxes;
}

function boxIsOutsideViewBox(box: SvgBox, viewBox: [number, number, number, number]): boolean {
    const tolerance = 1;
    const [minX, minY, width, height] = viewBox;
    const maxX = minX + width;
    const maxY = minY + height;

    return box.minX < minX - tolerance
        || box.minY < minY - tolerance
        || box.maxX > maxX + tolerance
        || box.maxY > maxY + tolerance;
}

function boxesOverlap(left: SvgBox, right: SvgBox): boolean {
    const overlapWidth = Math.min(left.maxX, right.maxX) - Math.max(left.minX, right.minX);
    const overlapHeight = Math.min(left.maxY, right.maxY) - Math.max(left.minY, right.minY);
    return overlapWidth > 1 && overlapHeight > 1;
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
        pathOnlyGlyphUseCount: countPathOnlyGlyphUses(svgText),
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

function svgDiagnostic(
    report: CircuitikzSvgSmokeReport,
    svgText: string,
    expectedArtifactPath: string
): CircuitikzCompileDiagnostic[] {
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
            if (report.textElementCount === 0 && report.pathOnlyGlyphUseCount > 0) {
                diagnostics.push({
                    severity: 'error',
                    kind: 'render-svg-text-path-only',
                    message: `Expected SVG text cannot be searched because the renderer converted labels to path-only glyph geometry: ${expectedText.text}`,
                    excerpt: expectedArtifactPath,
                    advice: 'Treat this as an unverified label render. Use the PNG/OCR or screenshot gate before accepting or repairing the circuit visually.'
                });
                continue;
            }

            diagnostics.push({
                severity: 'error',
                kind: 'render-svg-text-missing',
                message: `Expected SVG render artifact is missing text: ${expectedText.text}`,
                excerpt: expectedArtifactPath,
                advice: 'Only require SVG text tokens for renderers that preserve text nodes or searchable labels; otherwise validate labels through a later OCR/screenshot pass.'
            });
        }
    }

    if (report.viewBox) {
        const outOfBoundsBox = extractElementBoxes(svgText)
            .find(box => boxIsOutsideViewBox(box, report.viewBox as [number, number, number, number]));
        if (outOfBoundsBox) {
            diagnostics.push({
                severity: 'error',
                kind: 'render-svg-out-of-bounds',
                message: `Expected SVG render artifact contains an element that extends outside the SVG viewBox: ${outOfBoundsBox.label}`,
                excerpt: expectedArtifactPath,
                advice: 'Treat this as a bounded-canvas failure. Inspect layout coordinates before accepting or repairing the circuit visually.'
            });
        }
    }

    const textBoxes = extractTextBoxes(svgText);
    for (let leftIndex = 0; leftIndex < textBoxes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < textBoxes.length; rightIndex += 1) {
            const left = textBoxes[leftIndex];
            const right = textBoxes[rightIndex];
            if (!boxesOverlap(left, right)) {
                continue;
            }

            diagnostics.push({
                severity: 'error',
                kind: 'render-svg-text-overlap',
                message: `Expected SVG render artifact contains overlapping text labels: ${left.text} / ${right.text}`,
                excerpt: expectedArtifactPath,
                advice: 'Treat this as a label-legibility failure. Keep circuit topology fixed and adjust layout/routing before accepting the artifact.'
            });
            leftIndex = textBoxes.length;
            break;
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
    let minX = header.width;
    let minY = header.height;
    let maxX = -1;
    let maxY = -1;

    for (let pixelIndex = 0; pixelIndex < decodedPixelCount; pixelIndex += 1) {
        const pixel = readPixel(decoded, pixelIndex, header.colorType, channels);
        if (pixel[3] > 0 && colorDistance(pixel, background) > 8) {
            nonBackgroundPixelCount += 1;
            const x = pixelIndex % header.width;
            const y = Math.floor(pixelIndex / header.width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }

    return {
        width: header.width,
        height: header.height,
        bitDepth: header.bitDepth,
        colorType: header.colorType,
        interlaceMethod: header.interlaceMethod,
        decodedPixelCount,
        nonBackgroundPixelCount,
        foregroundBounds: nonBackgroundPixelCount > 0
            ? { minX, minY, maxX, maxY }
            : undefined
    };
}

function pngDiagnostics(report: CircuitikzPngSmokeReport, expectedArtifactPath: string): CircuitikzCompileDiagnostic[] {
    const diagnostics: CircuitikzCompileDiagnostic[] = [];

    if (report.nonBackgroundPixelCount === 0) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-png-blank',
            message: 'Expected PNG render artifact appears visually blank.',
            excerpt: expectedArtifactPath,
            advice: 'Treat this as a failed screenshot smoke and inspect the renderer before attempting topology-preserving visual repair.'
        });
        return diagnostics;
    }

    const bounds = report.foregroundBounds;
    if (
        bounds
        && (bounds.minX <= 0 || bounds.minY <= 0 || bounds.maxX >= report.width - 1 || bounds.maxY >= report.height - 1)
    ) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-png-content-clipped',
            message: 'Expected PNG render artifact foreground content touches the image boundary.',
            excerpt: expectedArtifactPath,
            advice: 'Increase renderer padding/viewBox or inspect layout before topology-preserving visual repair.'
        });
    }

    return diagnostics;
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
        diagnostics: svgDiagnostic(svg, svgText, expectedArtifactPath)
    };
}
