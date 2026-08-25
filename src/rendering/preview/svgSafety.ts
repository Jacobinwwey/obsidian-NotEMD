import { LAYOUT_SAFETY_VERSION } from '../../diagram/layout/layoutSafety';

export interface SvgSafetyDiagnostic {
    severity: 'warning' | 'error';
    kind: 'svg-malformed' | 'svg-missing-viewport' | 'svg-empty';
    message: string;
}

export interface SvgSafetyResult {
    svg: string;
    diagnostics: SvgSafetyDiagnostic[];
}

function hasPositiveViewport(svg: string): boolean {
    const root = svg.match(/<svg\b([^>]*)>/i)?.[1] ?? '';
    const viewBox = root.match(/\bviewBox\s*=\s*["']\s*[-+0-9.eE]+[\s,]+[-+0-9.eE]+[\s,]+([-+0-9.eE]+)[\s,]+([-+0-9.eE]+)\s*["']/i);
    if (viewBox) {
        const width = Number(viewBox[1]);
        const height = Number(viewBox[2]);
        return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
    }
    const width = Number((root.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').replace(/px$/i, ''));
    const height = Number((root.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').replace(/px$/i, ''));
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

export function applySvgSafetyContract(svg: string, source: string): SvgSafetyResult {
    const diagnostics: SvgSafetyDiagnostic[] = [];
    if (!/<svg\b[\s\S]*<\/svg>/i.test(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-malformed', message: `${source} preview runtime returned malformed SVG markup.` });
        return { svg, diagnostics };
    }
    if (!hasPositiveViewport(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-missing-viewport', message: `${source} preview SVG has no positive viewBox or intrinsic dimensions.` });
    }
    if (!/<(?:g|path|rect|circle|ellipse|polygon|polyline|line|text|image|use|foreignObject)\b/i.test(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-empty', message: `${source} preview SVG contains no drawable content.` });
    }
    const marker = `data-layout-safety="${LAYOUT_SAFETY_VERSION}" data-layout-safety-owner="runtime"`;
    const normalized = svg.replace(/<svg\b([^>]*)>/i, (match, attributes: string) => {
        if (/\bdata-layout-safety\s*=/.test(attributes)) return match;
        return `<svg${attributes} ${marker}>`;
    });
    return { svg: normalized, diagnostics };
}

export function assertSvgSafetyContract(svg: string, source: string): string {
    const result = applySvgSafetyContract(svg, source);
    const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error');
    if (errors.length > 0) {
        throw new Error(errors.map(diagnostic => diagnostic.message).join(' '));
    }
    return result.svg;
}
