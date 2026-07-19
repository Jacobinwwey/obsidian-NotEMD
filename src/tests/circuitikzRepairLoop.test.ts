import { CircuitSpec } from '../diagram/adapters/circuitikz/circuitSpec';
import { CircuitikzCompileDiagnosticReport } from '../diagram/adapters/circuitikz/circuitikzDiagnostics';
import { runCircuitikzRepairLoop } from '../diagram/adapters/circuitikz/circuitikzRepairLoop';

function createSpec(): CircuitSpec {
    return {
        circuitKind: 'common-source-amplifier',
        title: 'Common-source NMOS amplifier',
        goldenReferenceId: 'common-source-nmos-v1',
        style: { package: 'circuitikz', voltageConvention: 'american voltages' },
        nets: ['VDD', 'GND', 'vin', 'vout', 'drain'],
        components: [
            { id: 'RD', type: 'resistor', label: '$R_D$', terminals: { top: 'VDD', bottom: 'drain' } },
            { id: 'M1', type: 'nmos', label: '$M_1$', terminals: { D: 'drain', G: 'vin', S: 'GND' } }
        ],
        connections: [
            { from: 'VDD', to: 'RD.top' },
            { from: 'RD.bottom', to: 'M1.D' },
            { from: 'M1.D', to: 'vout' },
            { from: 'M1.G', to: 'vin' },
            { from: 'M1.S', to: 'GND' }
        ],
        layoutHints: { inputSide: 'left', outputSide: 'right', routingStyle: 'orthogonal' }
    };
}

function overlapDiagnostics(): CircuitikzCompileDiagnosticReport {
    return {
        ok: false,
        summary: '1 error(s), 0 warning(s)',
        diagnostics: [{
            severity: 'error',
            kind: 'render-svg-label-overlap',
            message: 'A label overlaps circuit geometry.',
            excerpt: 'M1',
            advice: 'Move the label without changing topology.'
        }]
    };
}

function cleanDiagnostics(): CircuitikzCompileDiagnosticReport {
    return { ok: true, summary: '0 error(s), 0 warning(s)', diagnostics: [] };
}

describe('runCircuitikzRepairLoop', () => {
    test('accepts one topology-preserving candidate after clean compile and render evidence', async () => {
        const sourceSpec = createSpec();
        const candidate = { ...createSpec(), title: 'Common-source NMOS amplifier, repaired' };
        const requestRepairCandidate = jest.fn(async () => `\n\`\`\`json\n${JSON.stringify(candidate)}\n\`\`\``);
        const evaluateCandidate = jest.fn(async () => ({
            diagnostics: cleanDiagnostics(),
            renderSmoke: { diagnostics: [] }
        }));

        const report = await runCircuitikzRepairLoop({
            referenceSpec: sourceSpec,
            sourceSpec,
            initialDiagnostics: overlapDiagnostics(),
            requestRepairCandidate,
            evaluateCandidate
        });

        expect(report.status).toBe('accepted');
        expect(report.attemptCount).toBe(1);
        expect(report.candidateSpec?.title).toContain('repaired');
        expect(report.acceptance?.readyForVisualAcceptance).toBe(true);
        expect(requestRepairCandidate).toHaveBeenCalledTimes(1);
        expect(evaluateCandidate).toHaveBeenCalledTimes(1);
        expect(evaluateCandidate).toHaveBeenCalledWith(expect.objectContaining({
            texContent: expect.stringContaining('\\begin{circuitikz}')
        }));
    });

    test('rejects topology drift before evaluating or exporting the candidate', async () => {
        const candidate = createSpec();
        candidate.connections = [...candidate.connections, { from: 'VDD', to: 'M1.D' }];
        const evaluateCandidate = jest.fn();

        const report = await runCircuitikzRepairLoop({
            referenceSpec: createSpec(),
            sourceSpec: createSpec(),
            initialDiagnostics: overlapDiagnostics(),
            requestRepairCandidate: async () => JSON.stringify(candidate),
            evaluateCandidate
        });

        expect(report.status).toBe('rejected');
        expect(report.reason).toContain('topology');
        expect(evaluateCandidate).not.toHaveBeenCalled();
    });

    test('rejects a non-JSON repair response without evaluating it', async () => {
        const evaluateCandidate = jest.fn();
        const report = await runCircuitikzRepairLoop({
            referenceSpec: createSpec(),
            sourceSpec: createSpec(),
            initialDiagnostics: overlapDiagnostics(),
            requestRepairCandidate: async () => 'Move the output label to the right.',
            evaluateCandidate
        });

        expect(report.status).toBe('rejected');
        expect(report.reason).toContain('JSON');
        expect(evaluateCandidate).not.toHaveBeenCalled();
    });

    test('keeps the source spec when the repaired candidate still fails visual acceptance', async () => {
        const report = await runCircuitikzRepairLoop({
            referenceSpec: createSpec(),
            sourceSpec: createSpec(),
            initialDiagnostics: overlapDiagnostics(),
            requestRepairCandidate: async () => JSON.stringify(createSpec()),
            evaluateCandidate: async () => ({
                diagnostics: overlapDiagnostics(),
                renderSmoke: { diagnostics: overlapDiagnostics().diagnostics }
            })
        });

        expect(report.status).toBe('rejected');
        expect(report.acceptance?.readyForVisualAcceptance).toBe(false);
        expect(report.candidateSpec).toBeUndefined();
    });

    test('does not call the model when the configured renderer is unavailable', async () => {
        const requestRepairCandidate = jest.fn();
        const report = await runCircuitikzRepairLoop({
            referenceSpec: createSpec(),
            sourceSpec: createSpec(),
            initialDiagnostics: {
                ok: false,
                summary: '1 error(s), 0 warning(s)',
                diagnostics: [{
                    severity: 'error',
                    kind: 'compile-executable-not-found',
                    message: 'Renderer executable was not found.',
                    excerpt: 'pdflatex',
                    advice: 'Configure a renderer.'
                }]
            },
            requestRepairCandidate,
            evaluateCandidate: jest.fn()
        });

        expect(report.status).toBe('unavailable');
        expect(report.attemptCount).toBe(0);
        expect(requestRepairCandidate).not.toHaveBeenCalled();
    });
});
