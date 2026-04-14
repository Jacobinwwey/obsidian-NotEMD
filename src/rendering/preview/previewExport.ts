import { App, TFile } from 'obsidian';
import { RenderArtifact } from '../types';
import { renderJsonCanvasArtifactSvg } from './canvasPreview';
import { renderMermaidArtifactSvg, MermaidPreviewDeps } from './mermaidPreview';
import { renderVegaLiteArtifactSvg, VegaLitePreviewDeps } from './vegaLitePreview';

export interface PreviewSvgRenderDeps {
    mermaid?: MermaidPreviewDeps;
    vegaLiteDepsLoader?: () => Promise<VegaLitePreviewDeps>;
}

export function supportsPreviewSvgExport(artifact: RenderArtifact): boolean {
    return artifact.target === 'mermaid'
        || artifact.target === 'json-canvas'
        || artifact.target === 'vega-lite';
}

export async function renderPreviewArtifactSvg(
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    switch (artifact.target) {
        case 'mermaid':
            return renderMermaidArtifactSvg(artifact, deps.mermaid);
        case 'json-canvas':
            return renderJsonCanvasArtifactSvg(artifact);
        case 'vega-lite':
            return renderVegaLiteArtifactSvg(artifact, deps.vegaLiteDepsLoader);
        default:
            throw new Error(`Preview SVG export is not supported for target "${artifact.target}".`);
    }
}

export function buildDiagramPreviewExportPath(sourcePath: string): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const dir = lastSlashIndex >= 0 ? trimmedPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const normalizedBase = withoutExtension.endsWith('_preview')
        ? withoutExtension
        : `${withoutExtension}_preview`;
    return dir ? `${dir}/${normalizedBase}.svg` : `${normalizedBase}.svg`;
}

export async function saveDiagramPreviewSvg(
    app: App,
    sourcePath: string,
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewExportPath(sourcePath);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modify(existingFile, svg);
    } else {
        await app.vault.create(outputPath, svg);
    }

    return outputPath;
}
