import { App, TFile } from 'obsidian';
import { RenderArtifact } from '../types';
import { RenderWebviewTheme } from '../theme';
import { ensureSemanticFigureSvgStandaloneStyles } from '../renderers/editableHtmlSvgRenderer';
import { renderJsonCanvasArtifactSvg } from './canvasPreview';
import { renderMermaidArtifactSvg, MermaidPreviewDeps } from './mermaidPreview';
import { buildPdfFromRasterImage } from './pdfPreview';
import {
    PreviewPngRasterDeps,
    rasterizeSvgToJpeg,
    rasterizeSvgToPngArrayBuffer,
    resolvePreviewExportPpi
} from './pngPreview';
import { renderVegaLiteArtifactSvg, VegaLitePreviewDeps } from './vegaLitePreview';

export interface PreviewSvgRenderDeps {
    mermaid?: MermaidPreviewDeps;
    vegaLiteDepsLoader?: () => Promise<VegaLitePreviewDeps>;
    theme?: RenderWebviewTheme;
}

export interface PreviewPngExportDeps extends PreviewSvgRenderDeps {
    pngRaster?: PreviewPngRasterDeps;
    ppi?: number;
}

export interface PreviewPdfExportDeps extends PreviewSvgRenderDeps {
    raster?: PreviewPngRasterDeps;
    ppi?: number;
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
        case 'editable-html-svg':
            return { suffix: '_diagram', extension: '.html' };
        case 'circuitikz':
            return { suffix: '_diagram', extension: '.tex' };
        case 'drawio':
            return { suffix: '_diagram', extension: '.drawio' };
        case 'drawnix':
            return { suffix: '_diagram', extension: '.drawnix' };
        default:
            return { suffix: '_diagram', extension: '.txt' };
    }
}

export function supportsPreviewSvgExport(artifact: RenderArtifact): boolean {
    return Boolean(artifact.previewSvg?.content?.trim())
        || artifact.target === 'mermaid'
        || artifact.target === 'json-canvas'
        || artifact.target === 'vega-lite';
}

export async function renderPreviewArtifactSvg(
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    if (artifact.previewSvg?.content?.trim()) {
        return ensureSemanticFigureSvgStandaloneStyles(artifact.previewSvg.content);
    }

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

export function buildDiagramPreviewPdfExportPath(sourcePath: string): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const dir = lastSlashIndex >= 0 ? trimmedPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const normalizedBase = withoutExtension.endsWith('_preview')
        ? withoutExtension
        : `${withoutExtension}_preview`;
    return dir ? `${dir}/${normalizedBase}.pdf` : `${normalizedBase}.pdf`;
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
    const png = await rasterizeSvgToPngArrayBuffer(svg, deps.pngRaster, {
        ppi: resolvePreviewExportPpi(deps.ppi)
    });
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, png);
    } else {
        await app.vault.createBinary(outputPath, png);
    }

    return outputPath;
}

export async function saveDiagramPreviewPdf(
    app: App,
    sourcePath: string,
    artifact: RenderArtifact,
    deps: PreviewPdfExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPdfExportPath(sourcePath);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const raster = await rasterizeSvgToJpeg(svg, deps.raster, {
        ppi: resolvePreviewExportPpi(deps.ppi),
        backgroundColor: '#ffffff'
    });
    const pdf = buildPdfFromRasterImage({
        imageData: raster.data,
        imageMimeType: 'image/jpeg',
        imageWidthPx: raster.imageWidthPx,
        imageHeightPx: raster.imageHeightPx,
        sourceWidthCssPx: raster.sourceWidthCssPx,
        sourceHeightCssPx: raster.sourceHeightCssPx
    });
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, pdf);
    } else {
        await app.vault.createBinary(outputPath, pdf);
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
