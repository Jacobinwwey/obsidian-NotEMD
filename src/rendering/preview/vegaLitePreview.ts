import { RenderArtifact } from '../types';

export interface VegaLitePreviewView {
    toSVG(): Promise<string>;
    finalize?(): void;
}

export interface VegaLitePreviewDeps {
    compile(spec: Record<string, unknown>): { spec: Record<string, unknown> };
    parse(spec: Record<string, unknown>): unknown;
    createView(runtime: unknown): VegaLitePreviewView;
}

async function loadDefaultVegaLitePreviewDeps(): Promise<VegaLitePreviewDeps> {
    const [vegaLiteModule, vegaModule] = await Promise.all([
        import('vega-lite'),
        import('vega')
    ]);

    const compile = (vegaLiteModule as any).compile;
    const parse = (vegaModule as any).parse;
    const View = (vegaModule as any).View;

    if (typeof compile !== 'function' || typeof parse !== 'function' || typeof View !== 'function') {
        throw new Error('Vega-Lite preview runtime is unavailable.');
    }

    return {
        compile,
        parse,
        createView: (runtime) => new View(runtime, { renderer: 'svg' })
    };
}

function parseVegaLiteArtifactContent(content: string): Record<string, unknown> {
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

export async function renderVegaLiteArtifactSvg(
    artifact: RenderArtifact,
    depsLoader: () => Promise<VegaLitePreviewDeps> = loadDefaultVegaLitePreviewDeps
): Promise<string> {
    if (artifact.target !== 'vega-lite') {
        throw new Error(`renderVegaLiteArtifactSvg only supports vega-lite artifacts, received "${artifact.target}".`);
    }

    const spec = parseVegaLiteArtifactContent(artifact.content);
    const deps = await depsLoader();
    const compiled = deps.compile(spec);
    const runtime = deps.parse(compiled.spec);
    const view = deps.createView(runtime);

    try {
        return await view.toSVG();
    } finally {
        view.finalize?.();
    }
}
