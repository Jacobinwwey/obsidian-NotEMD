import type { RenderArtifact, RenderArtifactTarget } from '../types';
import type { RenderWebviewTheme } from '../theme';
import { isSupportedRenderTarget } from '../../diagram/types';
import { TargetAdapterRegistry } from '../targetAdapterRegistry';
import type { TargetAdapter } from '../targetAdapterRegistry';
import { renderJsonCanvasArtifactSvg } from './canvasPreview';
import {
    MermaidPreviewDeps,
    renderMermaidArtifactSvg,
    renderMermaidArtifactSvgForRasterExport
} from './mermaidPreview';
import { VegaLitePreviewDeps, renderVegaLiteArtifactSvg } from './vegaLitePreview';

export interface PreviewTargetAdapterContext {
    mermaid?: MermaidPreviewDeps;
    vegaLiteDepsLoader?: () => Promise<VegaLitePreviewDeps>;
    theme?: RenderWebviewTheme;
}

function assertPreviewSvgLayoutSafety(svg: string, target: RenderArtifactTarget): string {
    if (!svg.trim()) {
        throw new Error(`Preview target "${target}" returned an empty SVG.`);
    }
    if (!/<svg\b[\s\S]*<\/svg>/i.test(svg)) {
        throw new Error(`Preview target "${target}" returned malformed SVG.`);
    }
    return svg;
}

export interface PreviewTargetAdapter extends TargetAdapter {
    renderSvg(artifact: RenderArtifact, context: PreviewTargetAdapterContext): Promise<string>;
    renderSvgForRasterExport(artifact: RenderArtifact, context: PreviewTargetAdapterContext): Promise<string>;
}

const PREVIEW_TARGET_ADAPTERS = new TargetAdapterRegistry<PreviewTargetAdapter>([
    {
        target: 'mermaid',
        renderSvg: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderMermaidArtifactSvg(artifact, context.mermaid, context.theme), artifact.target),
        renderSvgForRasterExport: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderMermaidArtifactSvgForRasterExport(artifact, context.mermaid, context.theme), artifact.target)
    },
    {
        target: 'json-canvas',
        renderSvg: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderJsonCanvasArtifactSvg(artifact, context.theme), artifact.target),
        renderSvgForRasterExport: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderJsonCanvasArtifactSvg(artifact, context.theme), artifact.target)
    },
    {
        target: 'vega-lite',
        renderSvg: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderVegaLiteArtifactSvg(artifact, context.vegaLiteDepsLoader, context.theme), artifact.target),
        renderSvgForRasterExport: async (artifact, context) => assertPreviewSvgLayoutSafety(await renderVegaLiteArtifactSvg(artifact, context.vegaLiteDepsLoader, context.theme), artifact.target)
    }
]);

export function listPreviewTargetAdapters(): readonly PreviewTargetAdapter[] {
    return PREVIEW_TARGET_ADAPTERS.list();
}

export function getPreviewTargetAdapter(target: RenderArtifactTarget): PreviewTargetAdapter | null {
    return isSupportedRenderTarget(target)
        ? PREVIEW_TARGET_ADAPTERS.resolve(target)
        : null;
}
