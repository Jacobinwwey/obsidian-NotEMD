import { RenderArtifactDiagnostic } from './types';

export interface RenderArtifactDiagnosticSummary {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    hasErrors: boolean;
}

export function summarizeRenderArtifactDiagnostics(
    diagnostics: readonly RenderArtifactDiagnostic[]
): RenderArtifactDiagnosticSummary {
    let errors = 0;
    let warnings = 0;
    let info = 0;

    for (const diagnostic of diagnostics) {
        if (diagnostic.severity === 'error') {
            errors += 1;
        } else if (diagnostic.severity === 'warning') {
            warnings += 1;
        } else {
            info += 1;
        }
    }

    return {
        total: diagnostics.length,
        errors,
        warnings,
        info,
        hasErrors: errors > 0
    };
}

export function formatRenderArtifactDiagnosticSummary(
    summary: RenderArtifactDiagnosticSummary
): string {
    if (summary.total === 0) {
        return '';
    }

    return `${summary.errors} error(s) · ${summary.warnings} warning(s) · ${summary.info} info`;
}
