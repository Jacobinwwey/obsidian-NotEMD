import mermaid from 'mermaid';
import * as vegaLiteModule from 'vega-lite';
import * as vegaModule from 'vega';
import { MermaidPreviewDeps, validateMermaidPreviewDeps } from '../preview/mermaidPreviewShared';
import { VegaLitePreviewDeps } from '../preview/vegaLitePreview';

function resolveDefaultExport(moduleExports: unknown): unknown {
    if (moduleExports && typeof moduleExports === 'object' && 'default' in moduleExports) {
        return (moduleExports as Record<string, unknown>).default;
    }

    return moduleExports;
}

export function getBundledMermaidPreviewDeps(): MermaidPreviewDeps {
    return validateMermaidPreviewDeps('bundled mermaid', resolveDefaultExport(mermaid) as MermaidPreviewDeps);
}

export function getBundledVegaLitePreviewDeps(): VegaLitePreviewDeps {
    const compile = (vegaLiteModule as any).compile;
    const parse = (vegaModule as any).parse;
    const View = (vegaModule as any).View;

    if (typeof compile !== 'function' || typeof parse !== 'function' || typeof View !== 'function') {
        throw new Error('Bundled Vega-Lite preview runtime is unavailable.');
    }

    return {
        compile,
        parse,
        createView: (runtime) => new View(runtime, { renderer: 'svg' })
    };
}
