import { App, TFile } from 'obsidian';
import { RenderArtifact } from '../types';
import { RenderWebviewTheme } from '../theme';
import { renderJsonCanvasArtifactSvg } from './canvasPreview';
import { renderMermaidArtifactSvg, MermaidPreviewDeps } from './mermaidPreview';
import { PreviewPngRasterDeps, rasterizeSvgToPngArrayBuffer } from './pngPreview';
import { renderVegaLiteArtifactSvg, VegaLitePreviewDeps } from './vegaLitePreview';

export interface PreviewSvgRenderDeps {
    mermaid?: MermaidPreviewDeps;
    vegaLiteDepsLoader?: () => Promise<VegaLitePreviewDeps>;
    theme?: RenderWebviewTheme;
}

export interface PreviewPngExportDeps extends PreviewSvgRenderDeps {
    pngRaster?: PreviewPngRasterDeps;
}

interface ArtifactPathSpec {
    suffix: string;
    extension: string;
}

function getArtifactPathSpec(artifact: RenderArtifact): ArtifactPathSpec {
    switch (artifact.target) {
        case 'mermaid':
            return { suffix: '_summ', extension: '.md' };
        case 'json-canvas':
            return { suffix: '_diagram', extension: '.canvas' };
        case 'vega-lite':
            return { suffix: '_diagram', extension: '.json' };
        case 'html':
            return { suffix: '_diagram', extension: '.html' };
        default:
            return { suffix: '_diagram', extension: '.txt' };
    }
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
            return renderMermaidArtifactSvg(artifact, deps.mermaid, deps.theme);
        case 'json-canvas':
            return renderJsonCanvasArtifactSvg(artifact, deps.theme);
        case 'vega-lite':
            return renderVegaLiteArtifactSvg(artifact, deps.vegaLiteDepsLoader, deps.theme);
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

export function buildDiagramPreviewPngExportPath(sourcePath: string): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const dir = lastSlashIndex >= 0 ? trimmedPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const normalizedBase = withoutExtension.endsWith('_preview')
        ? withoutExtension
        : `${withoutExtension}_preview`;
    return dir ? `${dir}/${normalizedBase}.png` : `${normalizedBase}.png`;
}

export function buildDiagramSourceArtifactPath(sourcePath: string, artifact: RenderArtifact): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const dir = lastSlashIndex >= 0 ? trimmedPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const { suffix, extension } = getArtifactPathSpec(artifact);
    const outputName = `${withoutExtension}${suffix}${extension}`;
    return dir ? `${dir}/${outputName}` : outputName;
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

export async function saveDiagramPreviewPng(
    app: App,
    sourcePath: string,
    artifact: RenderArtifact,
    deps: PreviewPngExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPngExportPath(sourcePath);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const png = await rasterizeSvgToPngArrayBuffer(svg, deps.pngRaster);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, png);
    } else {
        await app.vault.createBinary(outputPath, png);
    }

    return outputPath;
}

export async function saveDiagramSourceArtifact(
    app: App,
    sourcePath: string,
    artifact: RenderArtifact
): Promise<string> {
    const outputPath = buildDiagramSourceArtifactPath(sourcePath, artifact);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modify(existingFile, artifact.content);
    } else {
        await app.vault.create(outputPath, artifact.content);
    }

    return outputPath;
}
