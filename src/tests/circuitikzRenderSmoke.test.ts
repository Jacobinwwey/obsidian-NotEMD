import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { inspectCircuitikzRenderArtifact } from '../diagram/adapters/circuitikz/circuitikzRenderSmoke';

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
});
