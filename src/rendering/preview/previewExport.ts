import { App, TFile } from 'obsidian';
import { RenderArtifact } from '../types';
import { getRenderTargetDescriptor } from '../renderTargetCatalog';
import { ensureSemanticFigureSvgStandaloneStyles } from '../renderers/editableHtmlSvgRenderer';
import {
    getPreviewTargetAdapter,
    PreviewTargetAdapter,
    PreviewTargetAdapterContext
} from './previewTargetAdapterRegistry';
import { buildPdfFromSvg, SvgPdfExportDeps } from './pdfPreview';
import {
    PreviewPngRasterDeps,
    rasterizeSvgToCompatibilityPng,
    resolvePreviewExportPpi
} from './pngPreview';

import { buildRequestedPngPath, buildObsidianPngCompanionPath, decodePngInObsidian, renderRequestedPng, renderObsidianCompatiblePng, ObsidianPngCompatibilityError } from './obsidianPngDelivery';

export interface SavedPreviewPng {
    path: string;
    files: string[];
}

export type PreviewSvgRenderDeps = PreviewTargetAdapterContext;

export interface PreviewPngExportDeps extends PreviewSvgRenderDeps {
    pngRaster?: PreviewPngRasterDeps;
    obsidianCompatiblePng?: boolean;
    decodePng?: (data: ArrayBuffer, signal?: AbortSignal) => Promise<boolean>;
    signal?: AbortSignal;
    onPngSaved?: (delivery: SavedPreviewPng) => Promise<void>;
    ppi?: number;
}

export interface PreviewPdfExportDeps extends PreviewSvgRenderDeps {
    svgPdf?: SvgPdfExportDeps;
    ppi?: number;
}

interface ArtifactPathSpec {
    suffix: string;
    extension: string;
}

function getArtifactPathSpec(artifact: RenderArtifact): ArtifactPathSpec {
    const descriptor = getRenderTargetDescriptor(artifact.target);
    return {
        suffix: artifact.target === 'mermaid' ? '_summ' : '_diagram',
        extension: descriptor.sourceExtension
    };
}

export function supportsPreviewSvgExport(artifact: RenderArtifact): boolean {
    return Boolean(artifact.previewSvg?.content?.trim())
        || getRenderTargetDescriptor(artifact.target).exportFormats.length > 0;
}

interface PreviewSvgCanvas {
    innerMarkup: string;
    width: number;
    height: number;
    viewBoxX: number;
    viewBoxY: number;
}

function parseSvgNumber(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSvgCoordinate(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePreviewSvgCanvas(svg: string): PreviewSvgCanvas {
    const match = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!match) {
        throw new Error('Preview renderer returned malformed SVG markup.');
    }

    const attributes = match[1] ?? '';
    const viewBox = attributes.match(/\bviewBox\s*=\s*["']\s*([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s*["']/i);
    const viewBoxX = parseSvgCoordinate(viewBox?.[1], 0);
    const viewBoxY = parseSvgCoordinate(viewBox?.[2], 0);
    const viewBoxWidth = parseSvgNumber(viewBox?.[3], 960);
    const viewBoxHeight = parseSvgNumber(viewBox?.[4], 540);
    return {
        innerMarkup: match[2] ?? '',
        viewBoxX,
        viewBoxY,
        width: viewBox ? viewBoxWidth : parseSvgNumber(attributes.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1], viewBoxWidth),
        height: viewBox ? viewBoxHeight : parseSvgNumber(attributes.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1], viewBoxHeight)
    };
}

function composePreviewSvgCanvases(canvases: readonly PreviewSvgCanvas[]): string {
    if (canvases.length === 0) {
        throw new Error('No preview SVG canvases were produced.');
    }

    const gap = 32;
    const width = Math.max(...canvases.map(canvas => canvas.width));
    const height = canvases.reduce((total, canvas) => total + canvas.height, 0) + gap * (canvases.length - 1);
    let offsetY = 0;
    const nestedSvgs = canvases.map(canvas => {
        // Keep every panel as a nested SVG so root-level style/defs and its
        // viewBox stay attached to the resources they describe during Canvas
        // rasterization. Hoisting only the inner graph makes browsers treat
        // Mermaid classes as unstyled black geometry.
        const nestedSvg = `<svg x="0" y="${offsetY}" width="${canvas.width}" height="${canvas.height}" viewBox="${canvas.viewBoxX} ${canvas.viewBoxY} ${canvas.width} ${canvas.height}" overflow="visible">${canvas.innerMarkup}</svg>`;
        offsetY += canvas.height + gap;
        return nestedSvg;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${nestedSvgs}</svg>`;
}

async function renderPreviewArtifactSvgWithRenderer(
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps,
    renderTarget: (adapter: PreviewTargetAdapter, artifact: RenderArtifact, deps: PreviewSvgRenderDeps) => Promise<string>
): Promise<string> {
    if (artifact.previewSvg?.content?.trim()) {
        return ensureSemanticFigureSvgStandaloneStyles(artifact.previewSvg.content);
    }

    if (artifact.previewPanels && artifact.previewPanels.length > 0) {
        const panelSvgs: PreviewSvgCanvas[] = [];
        for (const panel of artifact.previewPanels) {
            const svg = await renderPreviewArtifactSvgWithRenderer(panel.artifact, deps, renderTarget);
            panelSvgs.push(parsePreviewSvgCanvas(svg));
        }
        return ensureSemanticFigureSvgStandaloneStyles(composePreviewSvgCanvases(panelSvgs));
    }

    const adapter = getPreviewTargetAdapter(artifact.target);
    if (!adapter) {
        throw new Error(`Preview SVG export is not supported for target "${artifact.target}".`);
    }

    return renderTarget(adapter, artifact, deps);
}

export async function renderPreviewArtifactSvg(
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    return renderPreviewArtifactSvgWithRenderer(
        artifact,
        deps,
        (adapter, currentArtifact, context) => adapter.renderSvg(currentArtifact, context)
    );
}

export async function renderPreviewArtifactSvgForRasterExport(
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    return renderPreviewArtifactSvgWithRenderer(
        artifact,
        deps,
        (adapter, currentArtifact, context) => adapter.renderSvgForRasterExport(currentArtifact, context)
    );
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

function getSourceFolderPath(sourcePath: string): string {
    const normalizedPath = sourcePath.trim().replace(/\\/g, '/').replace(/\/+$/, '');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    return lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : '';
}

function buildDiagramPreviewExportPathInFolder(
    sourcePath: string,
    folderPath: string,
    extension: 'svg' | 'png' | 'pdf'
): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const normalizedBase = withoutExtension.endsWith('_preview')
        ? withoutExtension
        : `${withoutExtension}_preview`;
    const normalizedFolder = normalizeVaultFolderPath(folderPath);
    const outputName = `${normalizedBase}.${extension}`;
    return normalizedFolder ? `${normalizedFolder}/${outputName}` : outputName;
}

function normalizeVaultFolderPath(folderPath: string): string {
    const trimmed = folderPath.trim().replace(/\\/g, '/');
    if (trimmed.startsWith('//') || /^[a-zA-Z]:/.test(trimmed)) {
        throw new Error(`Invalid Vault folder path: "${folderPath}".`);
    }
    const normalized = trimmed.replace(/^\/+|\/+$/g, '');
    if (!normalized || normalized === '.') {
        return '';
    }
    if (normalized.split('/').some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\0'))) {
        throw new Error(`Invalid Vault folder path: "${folderPath}".`);
    }
    return normalized;
}

function buildDiagramPreviewPanelExportPathInFolder(
    sourcePath: string,
    panelId: string,
    extension: string,
    folderPath: string
): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const fileName = lastSlashIndex >= 0 ? trimmedPath.slice(lastSlashIndex + 1) : trimmedPath;
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const normalizedPanelId = panelId.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'panel';
    const outputName = `${withoutExtension}_preview_${normalizedPanelId}.${extension}`;
    const normalizedFolder = normalizeVaultFolderPath(folderPath);
    return normalizedFolder ? `${normalizedFolder}/${outputName}` : outputName;
}

function buildDiagramPreviewPanelExportPath(sourcePath: string, panelId: string, extension: string): string {
    const trimmedPath = sourcePath.trim().replace(/\/+$/, '');
    const lastSlashIndex = trimmedPath.lastIndexOf('/');
    const sourceFolder = lastSlashIndex >= 0 ? trimmedPath.slice(0, lastSlashIndex) : '';
    return buildDiagramPreviewPanelExportPathInFolder(sourcePath, panelId, extension, sourceFolder);
}

export function buildDiagramPreviewPanelSvgExportPath(sourcePath: string, panelId: string): string {
    return buildDiagramPreviewPanelExportPath(sourcePath, panelId, 'svg');
}

export function buildDiagramPreviewPanelSvgExportPathInFolder(sourcePath: string, panelId: string, folderPath: string): string {
    return buildDiagramPreviewPanelExportPathInFolder(sourcePath, panelId, 'svg', folderPath);
}

export function buildDiagramPreviewPanelPngExportPath(sourcePath: string, panelId: string): string {
    return buildDiagramPreviewPanelExportPath(sourcePath, panelId, 'png');
}

export function buildDiagramPreviewPanelPngExportPathInFolder(
    sourcePath: string,
    panelId: string,
    folderPath: string
): string {
    return buildDiagramPreviewPanelExportPathInFolder(sourcePath, panelId, 'png', folderPath);
}

export function buildDiagramPreviewPanelPdfExportPath(sourcePath: string, panelId: string): string {
    return buildDiagramPreviewPanelExportPath(sourcePath, panelId, 'pdf');
}

export function buildDiagramPreviewPanelPdfExportPathInFolder(
    sourcePath: string,
    panelId: string,
    folderPath: string
): string {
    return buildDiagramPreviewPanelExportPathInFolder(sourcePath, panelId, 'pdf', folderPath);
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
    return saveDiagramPreviewSvgToFolder(app, sourcePath, getSourceFolderPath(sourcePath), artifact, deps);
}

export async function saveDiagramPreviewSvgToFolder(
    app: App,
    sourcePath: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewExportPathInFolder(sourcePath, folderPath, 'svg');
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
    return saveDiagramPreviewPngToFolder(app, sourcePath, getSourceFolderPath(sourcePath), artifact, deps);
}

export async function saveDiagramPreviewPngToFolder(
    app: App,
    sourcePath: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewPngExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewExportPathInFolder(sourcePath, folderPath, 'png');
    const svg = await renderPreviewArtifactSvgForRasterExport(artifact, deps);
    return savePreviewPngDelivery(app, outputPath, svg, deps);
}

export async function saveDiagramPreviewPdf(
    app: App,
    sourcePath: string,
    artifact: RenderArtifact,
    deps: PreviewPdfExportDeps = {}
): Promise<string> {
    return saveDiagramPreviewPdfToFolder(app, sourcePath, getSourceFolderPath(sourcePath), artifact, deps);
}

export async function saveDiagramPreviewPdfToFolder(
    app: App,
    sourcePath: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewPdfExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewExportPathInFolder(sourcePath, folderPath, 'pdf');
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const pdf = await buildPdfFromSvg(svg, deps.svgPdf);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);

    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, pdf);
    } else {
        await app.vault.createBinary(outputPath, pdf);
    }

    return outputPath;
}

export async function saveDiagramPreviewPanelSvg(
    app: App,
    sourcePath: string,
    panelId: string,
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelSvgExportPath(sourcePath, panelId);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
        await app.vault.modify(existingFile, svg);
    } else {
        await app.vault.create(outputPath, svg);
    }
    return outputPath;
}

export async function saveDiagramPreviewPanelPng(
    app: App,
    sourcePath: string,
    panelId: string,
    artifact: RenderArtifact,
    deps: PreviewPngExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelPngExportPath(sourcePath, panelId);
    const svg = await renderPreviewArtifactSvgForRasterExport(artifact, deps);
    return savePreviewPngDelivery(app, outputPath, svg, deps);
}

export async function saveDiagramPreviewPanelPngToFolder(
    app: App,
    sourcePath: string,
    panelId: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewPngExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelPngExportPathInFolder(sourcePath, panelId, folderPath);
    const svg = await renderPreviewArtifactSvgForRasterExport(artifact, deps);
    return savePreviewPngDelivery(app, outputPath, svg, deps);
}

export async function saveDiagramPreviewPanelPdf(
    app: App,
    sourcePath: string,
    panelId: string,
    artifact: RenderArtifact,
    deps: PreviewPdfExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelPdfExportPath(sourcePath, panelId);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const pdf = await buildPdfFromSvg(svg, deps.svgPdf);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, pdf);
    } else {
        await app.vault.createBinary(outputPath, pdf);
    }
    return outputPath;
}

export async function saveDiagramPreviewPanelPdfToFolder(
    app: App,
    sourcePath: string,
    panelId: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewPdfExportDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelPdfExportPathInFolder(sourcePath, panelId, folderPath);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const pdf = await buildPdfFromSvg(svg, deps.svgPdf);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
        await app.vault.modifyBinary(existingFile, pdf);
    } else {
        await app.vault.createBinary(outputPath, pdf);
    }
    return outputPath;
}

export async function saveDiagramPreviewPanelSvgToFolder(
    app: App,
    sourcePath: string,
    panelId: string,
    folderPath: string,
    artifact: RenderArtifact,
    deps: PreviewSvgRenderDeps = {}
): Promise<string> {
    const outputPath = buildDiagramPreviewPanelSvgExportPathInFolder(sourcePath, panelId, folderPath);
    const svg = await renderPreviewArtifactSvg(artifact, deps);
    const existingFile = app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
        await app.vault.modify(existingFile, svg);
    } else {
        await app.vault.create(outputPath, svg);
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

const activePngPaths = new WeakMap<App['vault'], Set<string>>();

async function savePreviewPngDelivery(app: App, basePath: string, svg: string, deps: PreviewPngExportDeps): Promise<string> {
    const ppi = resolvePreviewExportPpi(deps.ppi);
    let reservations = activePngPaths.get(app.vault);
    if (!reservations) { reservations = new Set(); activePngPaths.set(app.vault, reservations); }
    const stem = basePath.replace(/\.png$/i, '');
    const occupiedPngPaths = app.vault.getFiles().map(file => file.path.toLowerCase()).filter(path => path.endsWith('.png'));
    let reservedBase = basePath;
    for (let index = 1; ; index++) {
        reservedBase = index === 1 ? basePath : stem + '-' + index + '.png';
        const requestedPath = buildRequestedPngPath(reservedBase, ppi);
        const key = reservedBase.toLowerCase();
        const familyPrefix = key.slice(0, -4) + '_';
        // A changed requested PPI can produce the same compatible PPI. Reserve
        // the complete family so a new export cannot collide with its older copy.
        if (!reservations.has(key) && !app.vault.getAbstractFileByPath(requestedPath)
            && !occupiedPngPaths.some(path => path === key || path.startsWith(familyPrefix))) break;
    }
    reservations.add(reservedBase.toLowerCase());
    const saved: string[] = [];
    const pngDeps = {
        renderPng: (sourceSvg: string, density: number) => rasterizeSvgToCompatibilityPng(sourceSvg, density, deps.pngRaster),
        decodePng: deps.decodePng ?? decodePngInObsidian,
        signal: deps.signal
    };
    try {
        const render = deps.obsidianCompatiblePng === false ? renderRequestedPng : renderObsidianCompatiblePng;
        let delivery;
        try { delivery = await render(svg, ppi, pngDeps); }
        catch (error) {
            if (error instanceof ObsidianPngCompatibilityError && !deps.signal?.aborted) {
                const path = buildRequestedPngPath(reservedBase, error.requested.ppi);
                await app.vault.createBinary(path, error.requested.data);
                saved.push(path);
                await deps.onPngSaved?.({ path, files: [...saved] });
            }
            throw error;
        }
        for (const image of delivery.files) {
            if (deps.signal?.aborted) { const error = new Error('PNG export cancelled.'); error.name = 'AbortError'; throw error; }
            const path = image === delivery.requested ? buildRequestedPngPath(reservedBase, image.ppi)
                : buildObsidianPngCompanionPath(reservedBase, image.ppi);
            await app.vault.createBinary(path, image.data);
            saved.push(path);
            // Record partial saves too: a failed companion write must not orphan the original.
            await deps.onPngSaved?.({ path, files: [...saved] });
        }
        return saved[delivery.preferredIndex];
    } finally {
        reservations.delete(reservedBase.toLowerCase());
    }
}
