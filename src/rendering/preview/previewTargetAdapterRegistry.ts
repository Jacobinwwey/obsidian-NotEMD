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

export interface PreviewTargetAdapter extends TargetAdapter {
    renderSvg(artifact: RenderArtifact, context: PreviewTargetAdapterContext): Promise<string>;
    renderSvgForRasterExport(artifact: RenderArtifact, context: PreviewTargetAdapterContext): Promise<string>;
}

const PREVIEW_TARGET_ADAPTERS = new TargetAdapterRegistry<PreviewTargetAdapter>([
    {
        target: 'mermaid',
        renderSvg: (artifact, context) => renderMermaidArtifactSvg(artifact, context.mermaid, context.theme),
        renderSvgForRasterExport: (artifact, context) => renderMermaidArtifactSvgForRasterExport(artifact, context.mermaid, context.theme)
    },
    {
        target: 'json-canvas',
        renderSvg: (artifact, context) => renderJsonCanvasArtifactSvg(artifact, context.theme),
        renderSvgForRasterExport: (artifact, context) => renderJsonCanvasArtifactSvg(artifact, context.theme)
    },
    {
        target: 'vega-lite',
        renderSvg: (artifact, context) => renderVegaLiteArtifactSvg(artifact, context.vegaLiteDepsLoader, context.theme),
        renderSvgForRasterExport: (artifact, context) => renderVegaLiteArtifactSvg(artifact, context.vegaLiteDepsLoader, context.theme)
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
