import {
    formatRenderArtifactDiagnosticSummary,
    summarizeRenderArtifactDiagnostics
} from '../rendering/diagnostics';

describe('render artifact diagnostics', () => {
    test('summarizes diagnostic severities for preview and automation gates', () => {
        const summary = summarizeRenderArtifactDiagnostics([
            {
                severity: 'error',
                kind: 'render-png-blank',
                message: 'Blank PNG.'
            },
            {
                severity: 'warning',
                kind: 'render-svg-text-path-only',
                message: 'Path-only glyph labels.'
            },
            {
                severity: 'info',
                kind: 'render-artifact-created',
                message: 'Artifact exists.'
            }
        ]);

        expect(summary).toEqual({
            total: 3,
            errors: 1,
            warnings: 1,
            info: 1,
            hasErrors: true
        });
        expect(formatRenderArtifactDiagnosticSummary(summary)).toBe('1 error(s) · 1 warning(s) · 1 info');
    });

    test('omits a formatted summary when no diagnostics exist', () => {
        const summary = summarizeRenderArtifactDiagnostics([]);

        expect(summary).toEqual({
            total: 0,
            errors: 0,
            warnings: 0,
            info: 0,
            hasErrors: false
        });
        expect(formatRenderArtifactDiagnosticSummary(summary)).toBe('');
    });
});
