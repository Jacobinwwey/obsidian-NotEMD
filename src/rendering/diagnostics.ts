import { RenderArtifactDiagnostic } from './types';

export interface RenderArtifactDiagnosticSummary {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    hasErrors: boolean;
}

export interface RenderArtifactDiagnosticSummaryLabels {
    errors: string;
    warnings: string;
    info: string;
}

const DEFAULT_RENDER_ARTIFACT_DIAGNOSTIC_SUMMARY_LABELS: RenderArtifactDiagnosticSummaryLabels = {
    errors: 'error(s)',
    warnings: 'warning(s)',
    info: 'info'
};

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
    summary: RenderArtifactDiagnosticSummary,
    labels: RenderArtifactDiagnosticSummaryLabels = DEFAULT_RENDER_ARTIFACT_DIAGNOSTIC_SUMMARY_LABELS
): string {
    if (summary.total === 0) {
        return '';
    }

    return `${summary.errors} ${labels.errors} · ${summary.warnings} ${labels.warnings} · ${summary.info} ${labels.info}`;
}
