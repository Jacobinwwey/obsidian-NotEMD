import { DiagramIntent } from '../../diagram/types';
import { RenderArtifact } from '../types';
import { RenderWebviewTheme, resolveRenderTheme } from '../theme';

export interface VegaLitePreviewView {
    toSVG(): Promise<string>;
    finalize?(): void;
}

export interface VegaLitePreviewDeps {
    compile(spec: Record<string, unknown>): { spec: Record<string, unknown> };
    parse(spec: Record<string, unknown>): unknown;
    createView(runtime: unknown): VegaLitePreviewView;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeVegaLiteValues(base: unknown, override: unknown): unknown {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override === undefined ? base : override;
    }

    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        result[key] = key in result
            ? mergeVegaLiteValues(result[key], value)
            : value;
    }
    return result;
}

function buildPreviewThemePatch(theme: RenderWebviewTheme): Record<string, unknown> {
    if (resolveRenderTheme(theme) === 'dark') {
        return {
            background: '#0f172a',
            config: {
                view: { stroke: null },
                title: { color: '#f8fafc' },
                axis: {
                    domainColor: '#475569',
                    gridColor: '#334155',
                    labelColor: '#e2e8f0',
                    tickColor: '#475569',
                    titleColor: '#e2e8f0'
                },
                legend: {
                    labelColor: '#e2e8f0',
                    titleColor: '#e2e8f0'
                }
            }
        };
    }

    return {
        background: '#ffffff',
        config: {
            view: { stroke: null },
            title: { color: '#0f172a' },
            axis: {
                domainColor: '#cbd5e1',
                gridColor: '#e2e8f0',
                labelColor: '#0f172a',
                tickColor: '#94a3b8',
                titleColor: '#0f172a'
            },
            legend: {
                labelColor: '#0f172a',
                titleColor: '#0f172a'
            }
        }
    };
}

export function parseVegaLiteArtifactContent(content: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Artifact payload must be a JSON object.');
        }
        return parsed as Record<string, unknown>;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid Vega-Lite artifact JSON: ${message}`);
    }
}

export async function renderParsedVegaLiteSpecSvgWithDeps(
    spec: Record<string, unknown>,
    deps: VegaLitePreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    const compiled = deps.compile(
        mergeVegaLiteValues(spec, buildPreviewThemePatch(theme)) as Record<string, unknown>
    );
    const runtime = deps.parse(compiled.spec);
    const view = deps.createView(runtime);

    try {
        return await view.toSVG();
    } finally {
        view.finalize?.();
    }
}

export async function renderVegaLiteSpecSvgWithDeps(
    content: string,
    deps: VegaLitePreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    return renderParsedVegaLiteSpecSvgWithDeps(
        parseVegaLiteArtifactContent(content),
        deps,
        theme
    );
}

export async function renderVegaLiteArtifactSvgWithDeps(
    artifact: RenderArtifact,
    deps: VegaLitePreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    if (artifact.target !== 'vega-lite') {
        throw new Error(`renderVegaLiteArtifactSvg only supports vega-lite artifacts, received "${artifact.target}".`);
    }

    return renderVegaLiteSpecSvgWithDeps(artifact.content, deps, theme);
}

export function createVegaLiteRenderArtifact(
    content: string,
    sourceIntent: DiagramIntent = 'dataChart'
): RenderArtifact {
    return {
        target: 'vega-lite',
        content,
        mimeType: 'application/json',
        sourceIntent
    };
}
