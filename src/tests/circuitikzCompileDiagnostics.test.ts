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
});
