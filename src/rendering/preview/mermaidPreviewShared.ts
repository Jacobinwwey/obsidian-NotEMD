import { RenderWebviewTheme, resolveRenderTheme } from '../theme';

export interface MermaidPreviewDeps {
    initialize(config: Record<string, unknown>): void;
    parse(source: string): Promise<unknown> | unknown;
    render(id: string, source: string): Promise<{ svg: string }> | { svg: string };
}

function createPreviewId(): string {
    return `notemd-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildMermaidPreviewConfig(theme: RenderWebviewTheme = 'system'): Record<string, unknown> {
    return {
        startOnLoad: false,
        securityLevel: 'loose',
        theme: resolveRenderTheme(theme) === 'dark' ? 'dark' : 'default'
    };
}

export function buildMermaidValidationConfig(): Record<string, unknown> {
    return {
        startOnLoad: false,
        suppressErrorRendering: true
    };
}

export function validateMermaidPreviewDeps(moduleSpecifier: string, deps: MermaidPreviewDeps): MermaidPreviewDeps {
    if (
        typeof deps?.initialize !== 'function'
        || typeof deps?.parse !== 'function'
        || typeof deps?.render !== 'function'
    ) {
        throw new Error(`Dedicated render-host runtime module returned invalid Mermaid preview deps: ${moduleSpecifier}`);
    }

    return deps;
}

export async function renderNormalizedMermaidDefinitionSvgWithDeps(
    definition: string,
    deps: MermaidPreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    deps.initialize(buildMermaidPreviewConfig(theme));
    const result = await deps.render(createPreviewId(), definition);

    if (!result || typeof result.svg !== 'string') {
        throw new Error('Mermaid preview runtime did not return SVG markup.');
    }

    return result.svg;
}

export async function validateNormalizedMermaidDefinitionWithDeps(
    definition: string,
    deps: MermaidPreviewDeps
): Promise<void> {
    deps.initialize(buildMermaidValidationConfig());
    await deps.parse(definition);
}
