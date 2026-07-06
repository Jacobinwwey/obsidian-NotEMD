import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';
import { inspectCircuitikzRenderArtifact } from '../diagram/adapters/circuitikz/circuitikzRenderSmoke';

function crc32(bytes: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
    const typeBytes = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
    return Buffer.concat([length, typeBytes, data, crc]);
}

function createPngHeaderOnly(bitDepth: number, colorType: number, interlaceMethod: number): Buffer {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1, 0);
    ihdr.writeUInt32BE(1, 4);
    ihdr[8] = bitDepth;
    ihdr[9] = colorType;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = interlaceMethod;

    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

function packPngSamples(samples: number[], bitDepth: number): number[] {
    if (bitDepth === 8) {
        return samples;
    }
    const samplesPerByte = 8 / bitDepth;
    const rowBytes: number[] = [];
    for (let offset = 0; offset < samples.length; offset += samplesPerByte) {
        let packed = 0;
        for (let sampleOffset = 0; sampleOffset < samplesPerByte; sampleOffset += 1) {
            const sample = samples[offset + sampleOffset] ?? 0;
            packed |= sample << (8 - bitDepth * (sampleOffset + 1));
        }
        rowBytes.push(packed);
    }
    return rowBytes;
}

function createRgbaPng(width: number, height: number, pixels: Array<[number, number, number, number]>): Buffer {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanlines: number[] = [];
    for (let row = 0; row < height; row += 1) {
        scanlines.push(0);
        for (let column = 0; column < width; column += 1) {
            scanlines.push(...pixels[row * width + column]);
        }
    }

    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', zlib.deflateSync(Buffer.from(scanlines))),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

function createDirect16Png(width: number, height: number, colorType: number, samples: number[][]): Buffer {
    const channelsByColorType: Record<number, number> = {
        0: 1,
        2: 3,
        4: 2,
        6: 4
    };
    const channels = channelsByColorType[colorType];
    if (!channels) {
        throw new Error(`Unsupported test color type: ${colorType}`);
    }

    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 16;
    ihdr[9] = colorType;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanline = Buffer.alloc(height * (1 + width * channels * 2));
    let offset = 0;
    for (let row = 0; row < height; row += 1) {
        scanline[offset] = 0;
        offset += 1;
        for (let column = 0; column < width; column += 1) {
            const pixelSamples = samples[row * width + column];
            for (let channel = 0; channel < channels; channel += 1) {
                scanline.writeUInt16BE(pixelSamples[channel], offset);
                offset += 2;
            }
        }
    }

    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', zlib.deflateSync(scanline)),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

function createGrayscalePng(
    width: number,
    height: number,
    bitDepth: number,
    samples: number[],
    transparentSample?: number
): Buffer {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = bitDepth;
    ihdr[9] = 0;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanlines: number[] = [];
    for (let row = 0; row < height; row += 1) {
        scanlines.push(0);
        scanlines.push(...packPngSamples(samples.slice(row * width, row * width + width), bitDepth));
    }

    const chunks = [
        signature,
        pngChunk('IHDR', ihdr)
    ];
    if (transparentSample !== undefined) {
        const transparency = Buffer.alloc(2);
        transparency.writeUInt16BE(transparentSample, 0);
        chunks.push(pngChunk('tRNS', transparency));
    }
    chunks.push(
        pngChunk('IDAT', zlib.deflateSync(Buffer.from(scanlines))),
        pngChunk('IEND', Buffer.alloc(0))
    );

    return Buffer.concat(chunks);
}

function createRgbPng(
    width: number,
    height: number,
    pixels: Array<[number, number, number]>,
    transparentColor?: [number, number, number]
): Buffer {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanlines: number[] = [];
    for (let row = 0; row < height; row += 1) {
        scanlines.push(0);
        for (let column = 0; column < width; column += 1) {
            scanlines.push(...pixels[row * width + column]);
        }
    }

    const chunks = [
        signature,
        pngChunk('IHDR', ihdr)
    ];
    if (transparentColor) {
        const transparency = Buffer.alloc(6);
        transparentColor.forEach((sample, index) => transparency.writeUInt16BE(sample, index * 2));
        chunks.push(pngChunk('tRNS', transparency));
    }
    chunks.push(
        pngChunk('IDAT', zlib.deflateSync(Buffer.from(scanlines))),
        pngChunk('IEND', Buffer.alloc(0))
    );

    return Buffer.concat(chunks);
}

function createIndexedPng(
    width: number,
    height: number,
    bitDepth: number,
    palette: Array<[number, number, number]>,
    indexes: number[],
    alpha?: number[]
): Buffer {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = bitDepth;
    ihdr[9] = 3;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanlines: number[] = [];
    for (let row = 0; row < height; row += 1) {
        scanlines.push(0);
        scanlines.push(...packPngSamples(indexes.slice(row * width, row * width + width), bitDepth));
    }

    const chunks = [
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('PLTE', Buffer.from(palette.flat()))
    ];
    if (alpha) {
        chunks.push(pngChunk('tRNS', Buffer.from(alpha)));
    }
    chunks.push(
        pngChunk('IDAT', zlib.deflateSync(Buffer.from(scanlines))),
        pngChunk('IEND', Buffer.alloc(0))
    );

    return Buffer.concat(chunks);
}

describe('circuitikz render smoke inspection', () => {
    test('accepts a bounded non-empty SVG artifact with expected text', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-smoke-'));
        const svgPath = path.join(tempRoot, 'cmos.svg');
        fs.writeFileSync(
            svgPath,
            '<svg width="120pt" height="80pt" viewBox="0 0 120 80"><path d="M0 0H10"/><text>v_{out}</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{out}']
            });

            expect(report).toEqual({
                expectedArtifactPath: svgPath,
                artifactExists: true,
                artifactSizeBytes: expect.any(Number),
                nonEmptyArtifact: true,
                artifactKind: 'svg',
                diagnostics: [],
                svg: {
                    rootElementPresent: true,
                    width: 120,
                    height: 80,
                    viewBox: [0, 0, 120, 80],
                    visibleElementCount: 2,
                    textElementCount: 1,
                    pathOnlyGlyphUseCount: 0,
                    expectedText: [{
                        text: 'v_{out}',
                        present: true
                    }]
                }
            });
            expect(report.artifactSizeBytes).toBeGreaterThan(0);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG artifacts that have no dimensions or drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-empty-'));
        const svgPath = path.join(tempRoot, 'empty.svg');
        fs.writeFileSync(svgPath, '<svg><metadata>empty</metadata></svg>', 'utf8');

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                rootElementPresent: true,
                visibleElementCount: 0
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({ kind: 'render-svg-dimension-missing' }),
                expect.objectContaining({ kind: 'render-svg-no-visible-elements' })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG artifacts with only invisible drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-invisible-elements-'));
        const svgPath = path.join(tempRoot, 'invisible-elements.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><path d="M0 0H10" visibility="hidden"/><line x1="0" y1="10" x2="10" y2="10" opacity="0"/><g style="display: none"><rect x="0" y="20" width="10" height="10"/></g></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                rootElementPresent: true,
                visibleElementCount: 0
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({ kind: 'render-svg-no-visible-elements' })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports missing expected SVG text tokens as render smoke failures', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-label-'));
        const svgPath = path.join(tempRoot, 'missing-label.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><path d="M0 0H10"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{in}']
            });

            expect(report.svg?.expectedText).toEqual([{
                text: 'v_{in}',
                present: false
            }]);
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-missing',
                    message: 'Expected SVG render artifact is missing text: v_{in}'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG labels when expected text cannot be searched', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-path-only-label-'));
        const svgPath = path.join(tempRoot, 'path-only-label.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><defs><path id="glyph-v" d="M0 0 L3 8 L6 0"/></defs><path d="M0 0H10"/><use href="#glyph-v" x="40" y="40"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{in}']
            });

            expect(report.svg).toEqual(expect.objectContaining({
                textElementCount: 0,
                pathOnlyGlyphUseCount: 1,
                expectedText: [{
                    text: 'v_{in}',
                    present: false
                }]
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-path-only',
                    message: expect.stringContaining('path-only glyph geometry')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts expected SVG text preserved only in accessibility metadata', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-accessible-label-'));
        const svgPath = path.join(tempRoot, 'accessible-path-label.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><path d="M0 0H10"/><path aria-label="v_{in} &amp; v_{out}" d="M40 40 L43 48 L46 40"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{in} & v_{out}']
            });

            expect(report.svg).toEqual(expect.objectContaining({
                textElementCount: 0,
                pathOnlyGlyphUseCount: 0,
                expectedText: [{
                    text: 'v_{in} & v_{out}',
                    present: true
                }]
            }));
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG drawing elements that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-bounds-'));
        const svgPath = path.join(tempRoot, 'out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><path d="M10 10 L140 10"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('extends outside the SVG viewBox')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG drawing elements moved outside the viewBox by group transforms', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-transform-bounds-'));
        const svgPath = path.join(tempRoot, 'transformed-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><g transform="translate(95 0)"><path d="M0 10 L10 10"/></g></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('extends outside the SVG viewBox')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG drawing elements outside the viewBox after transform-list composition', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-transform-list-'));
        const svgPath = path.join(tempRoot, 'transform-list-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 75 80"><path d="M0 10 L15 10" transform="scale(2) translate(30 0)"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('extends outside the SVG viewBox')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG stroked drawing elements clipped by the viewBox edge', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-stroke-bounds-'));
        const svgPath = path.join(tempRoot, 'stroke-width-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><line x1="10" y1="2" x2="90" y2="2" stroke="black" stroke-width="8"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('line')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG style-declared stroked drawing elements clipped by the viewBox edge', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-style-stroke-bounds-'));
        const svgPath = path.join(tempRoot, 'style-stroke-width-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><line x1="10" y1="2" x2="90" y2="2" style="stroke: #000; stroke-width: 8"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('line')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('does not expand SVG drawing boxes for stroke-width when stroke is none', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-stroke-none-'));
        const svgPath = path.join(tempRoot, 'stroke-none-width.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><line x1="10" y1="2" x2="90" y2="2" style="stroke: none; stroke-width: 8"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG arc path endpoints that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-arc-bounds-'));
        const svgPath = path.join(tempRoot, 'arc-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 200"><path d="M10 10 A5 5 0 0 1 140 10"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('keeps relative SVG path commands bounded after close-path resets current point', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-close-path-current-point-'));
        const svgPath = path.join(tempRoot, 'close-path-relative-command.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><path d="M10 10 L90 10 z h20"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts bounded SVG path coordinates written as leading-dot decimals', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-leading-dot-path-'));
        const svgPath = path.join(tempRoot, 'leading-dot-path.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 1 1"><path d="M.5 .5 L.6 .5"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts bounded SVG point lists written as leading-dot decimals', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-leading-dot-points-'));
        const svgPath = path.join(tempRoot, 'leading-dot-points.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 1 1"><polyline points=".5,.5 .6,.5"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts bounded SVG numeric attributes written with explicit plus signs', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-plus-signed-attributes-'));
        const svgPath = path.join(tempRoot, 'plus-signed-attributes.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 1 1"><circle cx="+.5" cy="+.5" r="+.1"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg?.visibleElementCount).toBe(1);
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG numeric attributes written with explicit plus signs outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-plus-signed-attribute-bounds-'));
        const svgPath = path.join(tempRoot, 'plus-signed-attribute-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 1 1"><circle cx="+2" cy="+.5" r="+.1"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg?.visibleElementCount).toBe(1);
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('circle')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG arc bounds that extend outside the viewBox between endpoints', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-arc-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'arc-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 20 100 40"><path d="M10 50 A40 40 0 0 0 90 50"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports relative SVG arc bounds that extend outside the viewBox between endpoints', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-relative-arc-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'relative-arc-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 20 100 40"><path d="M10 50 a40 40 0 0 0 80 0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports relative SVG cubic curve endpoints that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-cubic-bounds-'));
        const svgPath = path.join(tempRoot, 'cubic-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 120"><path d="M70 20 c5 0 10 0 40 0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports relative SVG quadratic curve endpoints that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-quadratic-bounds-'));
        const svgPath = path.join(tempRoot, 'quadratic-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 120"><path d="M70 20 q10 0 40 0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports relative SVG smooth cubic curve endpoints that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-smooth-cubic-bounds-'));
        const svgPath = path.join(tempRoot, 'smooth-cubic-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 120"><path d="M70 20 s5 0 40 0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports relative SVG smooth quadratic curve endpoints that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-smooth-quadratic-bounds-'));
        const svgPath = path.join(tempRoot, 'smooth-quadratic-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 120"><path d="M70 20 t40 0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG quadratic curve bounds that extend outside the viewBox between endpoints', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-quadratic-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'quadratic-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 60"><path d="M10 50 Q50 -100 90 50"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG cubic curve bounds that extend outside the viewBox between endpoints', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-cubic-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'cubic-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 60"><path d="M10 50 C30 -120 70 -120 90 50"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG smooth quadratic curve bounds from reflected controls', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-smooth-quadratic-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'smooth-quadratic-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 60"><path d="M10 50 Q20 0 20 50 T90 50"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG smooth cubic curve bounds from reflected controls', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-smooth-cubic-curve-bounds-'));
        const svgPath = path.join(tempRoot, 'smooth-cubic-curve-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 60"><path d="M10 50 C10 50 20 0 20 50 S70 100 90 50"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('path')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG polyline drawing elements that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-polyline-bounds-'));
        const svgPath = path.join(tempRoot, 'polyline-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><polyline points="10,10 40,10 112,20"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('polyline')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG polygon drawing elements moved into label overlap by transforms', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-polygon-label-overlap-'));
        const svgPath = path.join(tempRoot, 'polygon-label-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><polygon points="0,0 24,0 24,16 0,16" transform="translate(42 31)"/><text x="45" y="45" font-size="12">M1</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-label-overlap',
                    message: expect.stringContaining('polygon')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG glyph uses that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-use-bounds-'));
        const svgPath = path.join(tempRoot, 'path-only-use-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><defs><path id="glyph-v" d="M0 0 L12 0 L12 8 L0 8"/></defs><path d="M10 10H20"/><use href="#glyph-v" x="94" y="20"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{out}']
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                pathOnlyGlyphUseCount: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-path-only'
                }),
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('use:#glyph-v')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG glyph uses with transformed definitions that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-use-definition-transform-bounds-'));
        const svgPath = path.join(tempRoot, 'path-only-use-definition-transform-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><defs><path id="glyph-v" transform="scale(10)" d="M0 0 L12 0 L12 1 L0 1"/></defs><path d="M20 70H30"/><use href="#glyph-v" x="0" y="0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{out}']
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                pathOnlyGlyphUseCount: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-path-only'
                }),
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('use:#glyph-v')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG glyph uses from grouped definitions that extend outside the viewBox', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-use-group-definition-bounds-'));
        const svgPath = path.join(tempRoot, 'path-only-use-group-definition-out-of-bounds.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><defs><g id="glyph-v" transform="scale(2)"><path d="M0 0 L10 0 L10 5 L0 5"/></g></defs><path d="M20 70H30"/><use href="#glyph-v" x="85" y="0"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath,
                expectedSvgText: ['v_{out}']
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                pathOnlyGlyphUseCount: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-path-only'
                }),
                expect.objectContaining({
                    kind: 'render-svg-out-of-bounds',
                    message: expect.stringContaining('use:#glyph-v')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('does not count definitions-only SVG glyph paths as visible drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-defs-only-'));
        const svgPath = path.join(tempRoot, 'defs-only.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 100 80"><defs><path id="glyph-v" d="M0 0 L12 0 L12 8 L0 8"/></defs></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                visibleElementCount: 0,
                pathOnlyGlyphUseCount: 0
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-no-visible-elements'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG glyph labels from symbol definitions that overlap drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-use-symbol-label-overlap-'));
        const svgPath = path.join(tempRoot, 'path-only-use-symbol-label-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><defs><symbol id="glyph-v"><path d="M0 0 L12 0 L12 8 L0 8"/></symbol></defs><rect x="38" y="36" width="20" height="16"/><use href="#glyph-v" x="40" y="40"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                pathOnlyGlyphUseCount: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-path-glyph-overlap',
                    message: expect.stringContaining('use:#glyph-v / rect')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports path-only SVG glyph labels that overlap drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-use-label-overlap-'));
        const svgPath = path.join(tempRoot, 'path-only-use-label-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 120 80"><defs><path id="glyph-v" d="M0 0 L12 0 L12 8 L0 8"/></defs><rect x="38" y="36" width="20" height="16"/><use href="#glyph-v" x="40" y="40"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.svg).toEqual(expect.objectContaining({
                pathOnlyGlyphUseCount: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-path-glyph-overlap',
                    message: expect.stringContaining('use:#glyph-v / rect')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports obvious overlapping SVG text labels', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-overlap-'));
        const svgPath = path.join(tempRoot, 'overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><text x="40" y="40" font-size="12">v_{in}</text><text x="42" y="41" font-size="12">v_{out}</text><path d="M0 0H12"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-overlap',
                    message: expect.stringContaining('overlap')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG text labels moved into overlap by element transforms', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-transform-overlap-'));
        const svgPath = path.join(tempRoot, 'transformed-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><text x="0" y="52" font-size="12" transform="translate(40 -12)">v_{in}</text><text x="42" y="41" font-size="12">v_{out}</text><path d="M0 0H12"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-overlap',
                    message: expect.stringContaining('overlap')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG labels overlapped by stroked drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-stroke-label-overlap-'));
        const svgPath = path.join(tempRoot, 'stroke-label-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><line x1="20" y1="50" x2="120" y2="50" stroke="black" stroke-width="12"/><text x="40" y="43" font-size="8">VIN</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-label-overlap',
                    message: expect.stringContaining('VIN / line')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG text labels that overlap drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-label-drawing-overlap-'));
        const svgPath = path.join(tempRoot, 'label-drawing-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><rect x="40" y="30" width="40" height="20"/><text x="45" y="45" font-size="12">v_{out}</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-label-overlap',
                    message: expect.stringContaining('text label overlaps a drawing element')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG centered text labels overlapped by drawing elements', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-anchor-middle-label-overlap-'));
        const svgPath = path.join(tempRoot, 'anchor-middle-label-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><line x1="58" y1="45" x2="62" y2="45" stroke="black" stroke-width="2"/><text x="80" y="48" font-size="12" text-anchor="middle">v_{out}</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-label-overlap',
                    message: expect.stringContaining('v_{out} / line')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG end-anchored text labels that overlap preceding labels', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-anchor-end-text-overlap-'));
        const svgPath = path.join(tempRoot, 'anchor-end-text-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 180 100"><text x="30" y="50" font-size="12">left</text><text x="80" y="50" font-size="12" style="text-anchor: end">right</text><path d="M0 0H12"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-overlap',
                    message: expect.stringContaining('left / right')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('inherits SVG text-anchor from parent text into positioned tspan labels', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-tspan-anchor-inherit-'));
        const svgPath = path.join(tempRoot, 'tspan-anchor-inherit.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 180 100"><text x="30" y="50" font-size="12">left</text><text style="text-anchor: end"><tspan x="80" y="50" font-size="12">right</tspan></text><path d="M0 0H12"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-overlap',
                    message: expect.stringContaining('left / right')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports overlapping SVG labels when separate labels are emitted as tspans', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-tspan-text-overlap-'));
        const svgPath = path.join(tempRoot, 'tspan-text-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><text><tspan x="40" y="40" font-size="12">VDD</tspan><tspan x="42" y="41" font-size="12">VIN</tspan></text><path d="M0 0H12"/></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-text-overlap',
                    message: expect.stringContaining('VDD / VIN')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports SVG drawing elements moved into label overlap by transforms', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-svg-transform-label-drawing-overlap-'));
        const svgPath = path.join(tempRoot, 'transformed-label-drawing-overlap.svg');
        fs.writeFileSync(
            svgPath,
            '<svg viewBox="0 0 160 100"><rect x="0" y="0" width="30" height="16" transform="translate(42 31)"/><text x="45" y="45" font-size="12">v_{out}</text></svg>',
            'utf8'
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: svgPath
            });

            expect(report.artifactKind).toBe('svg');
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-svg-label-overlap',
                    message: expect.stringContaining('text label overlaps a drawing element')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts a nonblank PNG screenshot artifact', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-smoke-'));
        const pngPath = path.join(tempRoot, 'render.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(3, 3, [
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255]
            ])
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual({
                width: 3,
                height: 3,
                bitDepth: 8,
                colorType: 6,
                interlaceMethod: 0,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            });
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test.each([
        [1, 1],
        [2, 3],
        [4, 15]
    ])('accepts a packed %i-bit grayscale PNG screenshot artifact', (bitDepth, foregroundSample) => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `notemd-circuitikz-png-gray-${bitDepth}bit-smoke-`));
        const pngPath = path.join(tempRoot, `gray-${bitDepth}bit-render.png`);
        fs.writeFileSync(
            pngPath,
            createGrayscalePng(
                3,
                3,
                bitDepth,
                [
                    0, 0, 0,
                    0, foregroundSample, 0,
                    0, 0, 0
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth,
                colorType: 0,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('ignores grayscale PNG tRNS transparent samples when checking foreground', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-gray-trns-smoke-'));
        const pngPath = path.join(tempRoot, 'gray-trns-render.png');
        fs.writeFileSync(
            pngPath,
            createGrayscalePng(
                3,
                3,
                8,
                [
                    255, 255, 255,
                    255, 0, 255,
                    255, 255, 255
                ],
                0
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 8,
                colorType: 0,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 0,
                foregroundBounds: undefined
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-blank',
                    message: expect.stringContaining('visually blank')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('ignores RGB PNG tRNS transparent colors when checking foreground', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-rgb-trns-smoke-'));
        const pngPath = path.join(tempRoot, 'rgb-trns-render.png');
        fs.writeFileSync(
            pngPath,
            createRgbPng(
                3,
                3,
                [
                    [255, 255, 255],
                    [255, 255, 255],
                    [255, 255, 255],
                    [255, 255, 255],
                    [255, 0, 0],
                    [255, 255, 255],
                    [255, 255, 255],
                    [255, 255, 255],
                    [255, 255, 255]
                ],
                [255, 0, 0]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 8,
                colorType: 2,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 0,
                foregroundBounds: undefined
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-blank',
                    message: expect.stringContaining('visually blank')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test.each([
        {
            label: 'grayscale',
            colorType: 0,
            background: [0],
            foreground: [65535]
        },
        {
            label: 'rgb',
            colorType: 2,
            background: [0, 0, 0],
            foreground: [65535, 65535, 65535]
        },
        {
            label: 'grayscale-alpha',
            colorType: 4,
            background: [0, 65535],
            foreground: [65535, 65535]
        },
        {
            label: 'rgba',
            colorType: 6,
            background: [0, 0, 0, 65535],
            foreground: [65535, 65535, 65535, 65535]
        }
    ])('accepts a nonblank 16-bit $label PNG screenshot artifact', ({ label, colorType, background, foreground }) => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `notemd-circuitikz-png-16bit-${label}-smoke-`));
        const pngPath = path.join(tempRoot, `${label}-16bit-render.png`);
        fs.writeFileSync(
            pngPath,
            createDirect16Png(
                3,
                3,
                colorType,
                [
                    background, background, background,
                    background, foreground, background,
                    background, background, background
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 16,
                colorType,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts a nonblank indexed-color PNG screenshot artifact', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-smoke-'));
        const pngPath = path.join(tempRoot, 'indexed-render.png');
        fs.writeFileSync(
            pngPath,
            createIndexedPng(
                3,
                3,
                8,
                [
                    [255, 255, 255],
                    [0, 0, 0]
                ],
                [
                    0, 0, 0,
                    0, 1, 0,
                    0, 0, 0
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual({
                width: 3,
                height: 3,
                bitDepth: 8,
                colorType: 3,
                interlaceMethod: 0,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            });
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('honors indexed-color PNG transparency metadata', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-alpha-smoke-'));
        const pngPath = path.join(tempRoot, 'indexed-alpha-render.png');
        fs.writeFileSync(
            pngPath,
            createIndexedPng(
                3,
                3,
                8,
                [
                    [255, 255, 255],
                    [0, 0, 0]
                ],
                [
                    0, 0, 0,
                    0, 1, 0,
                    0, 0, 0
                ],
                [0, 255]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                colorType: 3,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts a packed one-bit indexed-color PNG screenshot artifact', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-1bit-smoke-'));
        const pngPath = path.join(tempRoot, 'indexed-1bit-render.png');
        fs.writeFileSync(
            pngPath,
            createIndexedPng(
                3,
                3,
                1,
                [
                    [255, 255, 255],
                    [0, 0, 0]
                ],
                [
                    0, 0, 0,
                    0, 1, 0,
                    0, 0, 0
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 1,
                colorType: 3,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts a packed two-bit indexed-color PNG screenshot artifact', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-2bit-smoke-'));
        const pngPath = path.join(tempRoot, 'indexed-2bit-render.png');
        fs.writeFileSync(
            pngPath,
            createIndexedPng(
                3,
                3,
                2,
                [
                    [255, 255, 255],
                    [192, 192, 192],
                    [96, 96, 96],
                    [0, 0, 0]
                ],
                [
                    0, 0, 0,
                    0, 3, 0,
                    0, 0, 0
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 2,
                colorType: 3,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('accepts a packed four-bit indexed-color PNG screenshot artifact', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-4bit-smoke-'));
        const pngPath = path.join(tempRoot, 'indexed-4bit-render.png');
        fs.writeFileSync(
            pngPath,
            createIndexedPng(
                3,
                3,
                4,
                [
                    [255, 255, 255],
                    [192, 192, 192],
                    [0, 0, 0]
                ],
                [
                    0, 0, 0,
                    0, 2, 0,
                    0, 0, 0
                ]
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.diagnostics).toEqual([]);
            expect(report.png).toEqual(expect.objectContaining({
                bitDepth: 4,
                colorType: 3,
                decodedPixelCount: 9,
                nonBackgroundPixelCount: 1,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 1,
                    maxX: 1,
                    maxY: 1
                }
            }));
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports PNG screenshot artifacts with foreground content clipped by the canvas edge', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-clipped-'));
        const pngPath = path.join(tempRoot, 'clipped.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(3, 3, [
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255]
            ])
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                foregroundBounds: {
                    minX: 2,
                    minY: 0,
                    maxX: 2,
                    maxY: 0
                }
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-content-clipped',
                    message: expect.stringContaining('touches the image boundary')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports PNG screenshot artifacts with overly dense foreground pixels', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-dense-'));
        const pngPath = path.join(tempRoot, 'dense.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(5, 5, [
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255]
            ])
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                nonBackgroundPixelCount: 9,
                foregroundDensity: 1
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-foreground-dense',
                    message: expect.stringContaining('foreground pixels are unusually dense')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports large PNG screenshot artifacts whose foreground is too small to review', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-tiny-foreground-'));
        const pngPath = path.join(tempRoot, 'tiny-foreground.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(
                20,
                20,
                Array.from({ length: 400 }, (_value, index) => index === 210
                    ? [0, 0, 0, 255]
                    : [255, 255, 255, 255])
            )
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                decodedPixelCount: 400,
                nonBackgroundPixelCount: 1,
                foregroundBounds: {
                    minX: 10,
                    minY: 10,
                    maxX: 10,
                    maxY: 10
                }
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-foreground-too-small',
                    message: expect.stringContaining('foreground footprint is too small')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('does not report dense PNG foreground for a thin stroke', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-thin-stroke-'));
        const pngPath = path.join(tempRoot, 'thin-stroke.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(5, 5, [
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [0, 0, 0, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255]
            ])
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                nonBackgroundPixelCount: 3,
                foregroundDensity: 1,
                foregroundBounds: {
                    minX: 1,
                    minY: 2,
                    maxX: 3,
                    maxY: 2
                }
            }));
            expect(report.diagnostics).toEqual([]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports interlaced PNG screenshot artifacts with format-specific guidance', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-interlaced-'));
        const pngPath = path.join(tempRoot, 'interlaced.png');
        fs.writeFileSync(pngPath, createPngHeaderOnly(8, 6, 1));

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toBeUndefined();
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-unsupported',
                    message: expect.stringContaining('Adam7 interlaced PNG output is not supported'),
                    advice: expect.stringContaining('Export the renderer screenshot as a non-interlaced PNG')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports 16-bit indexed-color PNG screenshot artifacts with indexed bit-depth guidance', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-indexed-16bit-'));
        const pngPath = path.join(tempRoot, 'indexed-16bit.png');
        fs.writeFileSync(pngPath, createPngHeaderOnly(16, 3, 0));

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toBeUndefined();
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-unsupported',
                    message: expect.stringContaining('Indexed-color PNG bit depth 16 is not supported'),
                    advice: expect.stringContaining('Export indexed-color screenshots as 1/2/4/8-bit PNG')
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('reports PNG screenshot artifacts that match only the background color', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-png-blank-'));
        const pngPath = path.join(tempRoot, 'blank.png');
        fs.writeFileSync(
            pngPath,
            createRgbaPng(2, 2, [
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255],
                [255, 255, 255, 255]
            ])
        );

        try {
            const report = inspectCircuitikzRenderArtifact({
                expectedArtifactPath: pngPath
            });

            expect(report.artifactKind).toBe('png');
            expect(report.png).toEqual(expect.objectContaining({
                width: 2,
                height: 2,
                nonBackgroundPixelCount: 0
            }));
            expect(report.diagnostics).toEqual([
                expect.objectContaining({
                    kind: 'render-png-blank'
                })
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
