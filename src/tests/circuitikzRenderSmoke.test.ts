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
