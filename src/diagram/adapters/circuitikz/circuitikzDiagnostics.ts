export type CircuitikzCompileDiagnosticSeverity = 'error' | 'warning';

export type CircuitikzCompileDiagnosticKind =
    | 'missing-package'
    | 'unknown-tikz-key'
    | 'undefined-control-sequence'
    | 'latex-error'
    | 'emergency-stop'
    | 'overfull-hbox'
    | 'compile-process-error'
    | 'render-artifact-missing'
    | 'render-artifact-empty'
    | 'render-svg-invalid'
    | 'render-svg-dimension-missing'
    | 'render-svg-no-visible-elements'
    | 'render-svg-text-missing'
    | 'render-svg-out-of-bounds'
    | 'render-svg-text-overlap'
    | 'render-png-invalid'
    | 'render-png-unsupported'
    | 'render-png-blank';

export interface CircuitikzCompileDiagnostic {
    severity: CircuitikzCompileDiagnosticSeverity;
    kind: CircuitikzCompileDiagnosticKind;
    message: string;
    excerpt: string;
    advice: string;
}

export interface CircuitikzCompileDiagnosticReport {
    ok: boolean;
    summary: string;
    diagnostics: CircuitikzCompileDiagnostic[];
}

function diagnosticKey(diagnostic: CircuitikzCompileDiagnostic): string {
    return `${diagnostic.severity}:${diagnostic.kind}:${diagnostic.message}:${diagnostic.excerpt}`;
}

function pushUnique(
    diagnostics: CircuitikzCompileDiagnostic[],
    seen: Set<string>,
    diagnostic: CircuitikzCompileDiagnostic
): void {
    const key = diagnosticKey(diagnostic);
    if (seen.has(key)) {
        return;
    }
    seen.add(key);
    diagnostics.push(diagnostic);
}

function lineContext(lines: string[], index: number): string {
    return lines
        .slice(index, Math.min(lines.length, index + 3))
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n');
}

function summarize(diagnostics: CircuitikzCompileDiagnostic[]): string {
    const errors = diagnostics.filter(diagnostic => diagnostic.severity === 'error').length;
    const warnings = diagnostics.filter(diagnostic => diagnostic.severity === 'warning').length;
    return `${errors} error(s), ${warnings} warning(s)`;
}

export function diagnoseCircuitikzCompileLog(logText: string): CircuitikzCompileDiagnosticReport {
    const diagnostics: CircuitikzCompileDiagnostic[] = [];
    const seen = new Set<string>();
    const lines = logText.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (!line) {
            continue;
        }

        const missingPackage = line.match(/LaTeX Error: File [`']([^`']+)' not found\./);
        if (missingPackage) {
            const packageName = missingPackage[1];
            pushUnique(diagnostics, seen, {
                severity: 'error',
                kind: 'missing-package',
                message: `Missing LaTeX package: ${packageName}`,
                excerpt: lineContext(lines, index),
                advice: packageName === 'circuitikz.sty'
                    ? 'Install circuitikz or use a TeX distribution/TikZJax environment that includes circuitikz.'
                    : `Install the missing LaTeX package "${packageName}" or remove the package dependency.`
            });
            continue;
        }

        const unknownTikzKey = line.match(/Package pgfkeys Error: I do not know the key [`']([^`']+)'/);
        if (unknownTikzKey) {
            pushUnique(diagnostics, seen, {
                severity: 'error',
                kind: 'unknown-tikz-key',
                message: `Unknown TikZ/circuitikz key: ${unknownTikzKey[1]}`,
                excerpt: lineContext(lines, index),
                advice: 'Check the component name, circuitikz library support, and template spelling before changing topology.'
            });
            continue;
        }

        if (line.includes('Undefined control sequence.')) {
            pushUnique(diagnostics, seen, {
                severity: 'error',
                kind: 'undefined-control-sequence',
                message: 'Undefined LaTeX control sequence.',
                excerpt: lineContext(lines, index),
                advice: 'Remove the unsupported macro or add the required package in the golden reference preamble.'
            });
            continue;
        }

        if (line.includes('Emergency stop.')) {
            pushUnique(diagnostics, seen, {
                severity: 'error',
                kind: 'emergency-stop',
                message: 'LaTeX stopped before producing a renderable artifact.',
                excerpt: lineContext(lines, index),
                advice: 'Review earlier diagnostics first; emergency stops are usually caused by a preceding syntax or package error.'
            });
            continue;
        }

        const latexError = line.match(/LaTeX Error: (.+)/);
        if (latexError) {
            pushUnique(diagnostics, seen, {
                severity: 'error',
                kind: 'latex-error',
                message: latexError[1].replace(/\.$/, ''),
                excerpt: lineContext(lines, index),
                advice: 'Treat this as a syntax or preamble failure before attempting visual layout repair.'
            });
            continue;
        }

        if (line.startsWith('Overfull \\hbox')) {
            pushUnique(diagnostics, seen, {
                severity: 'warning',
                kind: 'overfull-hbox',
                message: 'LaTeX reported an overfull horizontal box.',
                excerpt: lineContext(lines, index),
                advice: 'Inspect the rendered circuit for label or wire overflow before accepting the artifact.'
            });
        }
    }

    const summary = summarize(diagnostics);

    return {
        ok: diagnostics.every(diagnostic => diagnostic.severity !== 'error'),
        summary,
        diagnostics
    };
}
