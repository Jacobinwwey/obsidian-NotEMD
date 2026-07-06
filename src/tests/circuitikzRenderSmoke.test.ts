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
