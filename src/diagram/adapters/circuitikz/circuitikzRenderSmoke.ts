import * as fs from 'fs';
import * as path from 'path';
import { CircuitikzCompileDiagnostic } from './circuitikzDiagnostics';

export interface CircuitikzRenderSmokeRequest {
    expectedArtifactPath: string;
    expectedSvgText?: string[];
}

export interface CircuitikzSvgExpectedTextReport {
    text: string;
    present: boolean;
}

export interface CircuitikzSvgSmokeReport {
    rootElementPresent: boolean;
    width?: number;
    height?: number;
    viewBox?: [number, number, number, number];
    visibleElementCount: number;
    textElementCount: number;
    expectedText: CircuitikzSvgExpectedTextReport[];
}

export interface CircuitikzRenderSmokeReport {
    expectedArtifactPath: string;
    artifactExists: boolean;
    artifactSizeBytes: number;
    nonEmptyArtifact: boolean;
    artifactKind: 'opaque' | 'svg';
    svg?: CircuitikzSvgSmokeReport;
    diagnostics: CircuitikzCompileDiagnostic[];
}

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

function parsePositiveLength(value: string | undefined): number | undefined {
    if (!value || value.trim().endsWith('%')) {
        return undefined;
    }

    const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)(?:px|pt|bp|mm|cm|in)?$/i);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    return numericValue > 0 ? numericValue : undefined;
}

function readAttribute(tag: string, attributeName: string): string | undefined {
    const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = tag.match(new RegExp(`\\s${escapedName}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return match ? match[1] : undefined;
}

function parseViewBox(value: string | undefined): [number, number, number, number] | undefined {
    if (!value) {
        return undefined;
    }

    const parts = value
        .trim()
        .split(/[\s,]+/)
        .map(part => Number(part));
    if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) {
        return undefined;
    }
    if (parts[2] <= 0 || parts[3] <= 0) {
        return undefined;
    }

    return [parts[0], parts[1], parts[2], parts[3]];
}

function countMatches(text: string, pattern: RegExp): number {
    return Array.from(text.matchAll(pattern)).length;
}

function extractSvgSmoke(svgText: string, expectedSvgText: string[]): CircuitikzSvgSmokeReport {
    const svgTag = svgText.match(/<svg\b[^>]*>/i)?.[0];
    const width = parsePositiveLength(svgTag ? readAttribute(svgTag, 'width') : undefined);
    const height = parsePositiveLength(svgTag ? readAttribute(svgTag, 'height') : undefined);
    const viewBox = parseViewBox(svgTag ? readAttribute(svgTag, 'viewBox') : undefined);
    const searchableText = decodeXmlEntities(svgText.replace(/<[^>]+>/g, ' '));

    return {
        rootElementPresent: Boolean(svgTag),
        width,
        height,
        viewBox,
        visibleElementCount: countMatches(
            svgText,
            /<(?:path|line|polyline|polygon|rect|circle|ellipse|text|use)\b(?![^>]*\bdisplay\s*=\s*["']none["'])/gi
        ),
        textElementCount: countMatches(svgText, /<text\b/gi),
        expectedText: expectedSvgText.map(text => ({
            text,
            present: svgText.includes(text) || searchableText.includes(text)
        }))
    };
}

function artifactMissingDiagnostic(expectedArtifactPath: string): CircuitikzCompileDiagnostic {
    return {
        severity: 'error',
        kind: 'render-artifact-missing',
        message: 'Expected circuitikz render artifact was not created.',
        excerpt: expectedArtifactPath,
        advice: 'Check the renderer output path, job name, and arguments before treating the compile run as a valid render smoke.'
    };
}

function artifactEmptyDiagnostic(expectedArtifactPath: string): CircuitikzCompileDiagnostic {
    return {
        severity: 'error',
        kind: 'render-artifact-empty',
        message: 'Expected circuitikz render artifact is empty.',
        excerpt: expectedArtifactPath,
        advice: 'Inspect the renderer log and rerun with a known-good golden reference before attempting visual repair.'
    };
}

function svgDiagnostic(report: CircuitikzSvgSmokeReport, expectedArtifactPath: string): CircuitikzCompileDiagnostic[] {
    const diagnostics: CircuitikzCompileDiagnostic[] = [];

    if (!report.rootElementPresent) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-invalid',
            message: 'Expected SVG render artifact does not contain an <svg> root element.',
            excerpt: expectedArtifactPath,
            advice: 'Check the renderer conversion stage before using the artifact for visual feedback.'
        });
    }

    if (!report.viewBox && (!report.width || !report.height)) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-dimension-missing',
            message: 'Expected SVG render artifact does not expose a positive width/height or viewBox.',
            excerpt: expectedArtifactPath,
            advice: 'Keep renderer output bounded so later screenshot and layout checks can compare stable dimensions.'
        });
    }

    if (report.visibleElementCount === 0) {
        diagnostics.push({
            severity: 'error',
            kind: 'render-svg-no-visible-elements',
            message: 'Expected SVG render artifact contains no visible drawing elements.',
            excerpt: expectedArtifactPath,
            advice: 'Treat this as a failed render smoke even if the renderer exited successfully.'
        });
    }

    for (const expectedText of report.expectedText) {
        if (!expectedText.present) {
            diagnostics.push({
                severity: 'error',
                kind: 'render-svg-text-missing',
                message: `Expected SVG render artifact is missing text: ${expectedText.text}`,
                excerpt: expectedArtifactPath,
                advice: 'Only require SVG text tokens for renderers that preserve text nodes or searchable labels; otherwise validate labels through a later OCR/screenshot pass.'
            });
        }
    }

    return diagnostics;
}

export function inspectCircuitikzRenderArtifact(request: CircuitikzRenderSmokeRequest): CircuitikzRenderSmokeReport {
    const expectedArtifactPath = request.expectedArtifactPath;
    const expectedSvgText = request.expectedSvgText ?? [];

    if (!fs.existsSync(expectedArtifactPath)) {
        return {
            expectedArtifactPath,
            artifactExists: false,
            artifactSizeBytes: 0,
            nonEmptyArtifact: false,
            artifactKind: 'opaque',
            diagnostics: [artifactMissingDiagnostic(expectedArtifactPath)]
        };
    }

    const artifactSizeBytes = fs.statSync(expectedArtifactPath).size;
    if (artifactSizeBytes === 0) {
        return {
            expectedArtifactPath,
            artifactExists: true,
            artifactSizeBytes,
            nonEmptyArtifact: false,
            artifactKind: 'opaque',
            diagnostics: [artifactEmptyDiagnostic(expectedArtifactPath)]
        };
    }

    if (path.extname(expectedArtifactPath).toLowerCase() !== '.svg') {
        return {
            expectedArtifactPath,
            artifactExists: true,
            artifactSizeBytes,
            nonEmptyArtifact: true,
            artifactKind: 'opaque',
            diagnostics: []
        };
    }

    const svgText = fs.readFileSync(expectedArtifactPath, 'utf8').replace(/^\uFEFF/, '');
    const svg = extractSvgSmoke(svgText, expectedSvgText);

    return {
        expectedArtifactPath,
        artifactExists: true,
        artifactSizeBytes,
        nonEmptyArtifact: true,
        artifactKind: 'svg',
        svg,
        diagnostics: svgDiagnostic(svg, expectedArtifactPath)
    };
}
