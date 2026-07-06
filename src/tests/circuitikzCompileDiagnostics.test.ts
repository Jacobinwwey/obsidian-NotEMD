import { diagnoseCircuitikzCompileLog } from '../diagram/adapters/circuitikz/circuitikzDiagnostics';

describe('circuitikz compile diagnostics', () => {
    test('turns LaTeX package and TikZ key failures into actionable diagnostics', () => {
        const report = diagnoseCircuitikzCompileLog(`
! LaTeX Error: File \`circuitikz.sty' not found.

Type X to quit or <RETURN> to proceed,
or enter new name. (Default extension: sty)

! Package pgfkeys Error: I do not know the key '/tikz/pmoss' and I am going to ignore it.
See the pgfkeys package documentation for explanation.
`);

        expect(report.ok).toBe(false);
        expect(report.summary).toBe('2 error(s), 0 warning(s)');
        expect(report.diagnostics).toEqual([
            expect.objectContaining({
                severity: 'error',
                kind: 'missing-package',
                message: 'Missing LaTeX package: circuitikz.sty',
                advice: expect.stringContaining('Install circuitikz')
            }),
            expect.objectContaining({
                severity: 'error',
                kind: 'unknown-tikz-key',
                message: 'Unknown TikZ/circuitikz key: /tikz/pmoss',
                advice: expect.stringContaining('component name')
            })
        ]);
    });

    test('keeps layout warnings advisory while marking successful compile logs as ok', () => {
        const report = diagnoseCircuitikzCompileLog(`
Output written on circuit.pdf (1 page, 12345 bytes).
Overfull \\hbox (12.0pt too wide) in paragraph at lines 10--12
`);

        expect(report.ok).toBe(true);
        expect(report.summary).toBe('0 error(s), 1 warning(s)');
        expect(report.diagnostics).toEqual([
            expect.objectContaining({
                severity: 'warning',
                kind: 'overfull-hbox',
                advice: expect.stringContaining('Inspect the rendered circuit')
            })
        ]);
    });

    test('classifies TikZ path syntax and runaway argument failures before generic LaTeX repair', () => {
        const report = diagnoseCircuitikzCompileLog(`
! Package tikz Error: Giving up on this path. Did you forget a semicolon?.
See the tikz package documentation for explanation.

Runaway argument?
{ \\draw (0,0) to[R] (1,0)
! Paragraph ended before \\tikz@scan@one@point was complete.
`);

        expect(report.ok).toBe(false);
        expect(report.summary).toBe('2 error(s), 0 warning(s)');
        expect(report.diagnostics).toEqual([
            expect.objectContaining({
                severity: 'error',
                kind: 'tikz-path-syntax',
                message: 'TikZ path syntax failed, likely because a path was not terminated.',
                advice: expect.stringContaining('semicolon')
            }),
            expect.objectContaining({
                severity: 'error',
                kind: 'runaway-argument',
                message: 'LaTeX reported a runaway argument while parsing circuit source.',
                advice: expect.stringContaining('unbalanced braces')
            })
        ]);
    });
});
