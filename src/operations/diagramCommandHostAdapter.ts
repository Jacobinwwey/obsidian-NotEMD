import { TFile } from 'obsidian';
import { formatI18n } from '../i18n';
import { DiagramGenerationResult } from '../diagram/diagramGenerationService';
import { DiagramIntent, DrawnixKnowledgeMapDelivery, isSupportedDiagramIntent, RenderTarget } from '../diagram/types';
import { LocalKnowledgeRetrievalSummary } from '../localKnowledgeBase';
import { RenderArtifact, RenderArtifactCompanion, RenderArtifactPreviewPanel } from '../rendering/types';
import { ensureSemanticFigureSvgStandaloneStyles } from '../rendering/renderers/editableHtmlSvgRenderer';
import { sanitizeSvgForExport } from '../rendering/preview/pngPreview';
import { DiagramOperationInput, DiagramOperationExecutionMode, buildDiagramOperationInput } from '../diagram/diagramGenerationService';
import { isSupportedInputFileForTask } from '../inputFileSupport';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';
import { resolveSourceVisualReferences, scanSourceVisualReferences } from '../diagram/sourceVisuals';
import { buildFallbackMermaidSvg } from '../diagram/sourceVisualArtifactBuilder';
import { renderMermaidArtifactSvg } from '../rendering/preview/mermaidPreview';
import { DRAWNIX_SOURCE_VISUAL_METADATA_VERSION } from '../diagram/adapters/drawnix/drawnixExporter';

export interface DiagramCommandHostAdapter {
    saveMermaidSummary: (file: TFile, mermaidContent: string, reporter: ProgressReporter) => Promise<string>;
    saveArtifact: (file: TFile, artifact: RenderArtifact, reporter: ProgressReporter) => Promise<string>;
    getFileByPath: (path: string) => TFile | null;
    readFile?: (file: TFile) => Promise<string>;
    readBinary?: (file: TFile) => Promise<ArrayBuffer>;
    openFile: (file: TFile) => void;
    maybeAutoFixMermaid: (file: TFile, reporter: ProgressReporter, reason: string) => Promise<void>;
    supportsPreview: (artifact: RenderArtifact) => boolean;
    openPreview: (artifact: RenderArtifact, sourcePath: string, artifactSaved?: boolean) => void;
    notify: (message: string, duration?: number) => void;
}

export type DiagramCommandExecutionMode = DiagramOperationExecutionMode;

export interface DiagramCommandInputOverrides {
    requestedIntent?: DiagramIntent;
    requestedRenderTarget?: RenderTarget;
    compatibilityMode?: 'best-fit' | 'legacy-mermaid';
    targetLanguage?: string;
    drawnixKnowledgeMapDelivery?: DrawnixKnowledgeMapDelivery;
}

export interface DiagramCommandOptions {
    executionMode: DiagramCommandExecutionMode;
    inputOverrides?: DiagramCommandInputOverrides;
}

export interface DiagramCommandUiStrings {
    commands: {
        generateExperimentalDiagram: string;
        previewExperimentalDiagram: string;
    };
    notices: {
        anotherProcessRunning: string;
        mermaidSummarizationError: string;
        mermaidSummarizationComplete: string;
        experimentalDiagramError: string;
        experimentalDiagramComplete: string;
        experimentalDiagramPreviewReady: string;
        experimentalDiagramManualFixHint: string;
    };
}

export interface DiagramCommandExecutionDetails {
    generation: DiagramGenerationResult;
    followThrough: DiagramCommandFollowThroughDetails;
    localKnowledgeContextUsed: boolean;
    localKnowledgeRetrieval: LocalKnowledgeRetrievalSummary;
    outputPath?: string;
    previewOpened: boolean;
}

export interface DiagramCommandFollowThroughDetails {
    kind: 'save-mermaid' | 'save-artifact' | 'preview-artifact';
    outputPath?: string;
    previewOpened: boolean;
    autoFixAttempted: boolean;
    artifactTarget: string;
}

export type DiagramCommandRunResult =
    | {
        kind: 'success';
        executionMode: DiagramCommandExecutionMode;
        sourcePath: string;
        actionLabel: string;
        operationInput: DiagramOperationInput;
        generation: DiagramGenerationResult;
        followThrough: DiagramCommandFollowThroughDetails;
        localKnowledgeContextUsed: boolean;
        localKnowledgeRetrieval: LocalKnowledgeRetrievalSummary;
        outputPath?: string;
        previewOpened: boolean;
    }
    | {
        kind: 'error';
        executionMode: DiagramCommandExecutionMode;
        sourcePath: string;
        actionLabel: string;
        errorMessage: string;
    };

export type PreviewDiagramCommandResult =
    | {
        kind: 'success';
        sourcePath: string;
        actionLabel: string;
        artifact: RenderArtifact;
        previewOpened: boolean;
    }
    | {
        kind: 'error';
        sourcePath: string;
        actionLabel: string;
        errorMessage: string;
    };

export type PreviewExperimentalDiagramCommandResult = PreviewDiagramCommandResult;

export interface DiagramCommandRunHost {
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getUiStrings: () => DiagramCommandUiStrings;
    getReporter: () => ProgressReporter;
    isBusy: () => boolean;
    setBusy: (busy: boolean) => void;
    getBusyNotice: () => string;
    startReporterAction: (reporter: ProgressReporter, label: string) => void;
    finalizeReporter: (reporter: ProgressReporter) => void;
    getActionLabel: (executionMode: DiagramCommandExecutionMode, i18n?: DiagramCommandUiStrings) => string;
    getActionCompleteText: (label: string) => string;
    getActionFailedText: (message: string) => string;
    readFile: (file: TFile) => Promise<string>;
    getProviderAndModelForTask: (task: 'summarizeToMermaid') => {
        provider: LLMProviderConfig;
        modelName: string;
    };
    getTaskLanguageCode: (task: 'summarizeToMermaid') => string | undefined;
    executeSaveMermaidCommand: (
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: DiagramCommandUiStrings
    ) => Promise<DiagramCommandExecutionDetails>;
    executeArtifactCommand: (
        file: TFile,
        operationInput: DiagramOperationInput,
        provider: LLMProviderConfig,
        modelName: string,
        reporter: ProgressReporter,
        actionLabel: string,
        i18n: DiagramCommandUiStrings,
        executionMode: Extract<DiagramCommandExecutionMode, 'save-artifact' | 'preview-artifact'>
    ) => Promise<DiagramCommandExecutionDetails>;
    createDiagramHostAdapter: () => DiagramCommandHostAdapter;
    saveErrorLog: (error: unknown, reporter: ProgressReporter) => Promise<void>;
    logError: (message: string, details?: unknown) => void;
}

type StepStatusFormatter = (current: number, total: number, label: string) => string;
type ActionStatusFormatter = (label: string) => string;

export interface CompleteMermaidDiagramCommandParams {
    host: DiagramCommandHostAdapter;
    file: TFile;
    reporter: ProgressReporter;
    mermaidContent: string;
    actionLabel: string;
    completeNotice: string;
    autoFixAfterGenerate: boolean;
    getStepStatusText: StepStatusFormatter;
    getActionCompleteText: ActionStatusFormatter;
}

export interface CompleteArtifactDiagramCommandParams {
    host: DiagramCommandHostAdapter;
    file: TFile;
    reporter: ProgressReporter;
    result: DiagramGenerationResult;
    actionLabel: string;
    executionMode: 'save-artifact' | 'preview-artifact';
    completeNotice: string;
    previewReadyNotice: string;
    manualFixHintNotice: string;
    autoFixAfterGenerate: boolean;
    getStepStatusText: StepStatusFormatter;
    getActionCompleteText: ActionStatusFormatter;
}

export class MissingVegaLiteFenceError extends Error {
    constructor() {
        super('No ```vega-lite code fence found in this file. Use the "Generate diagram" command first to create Vega-Lite content.');
        this.name = 'MissingVegaLiteFenceError';
    }
}

export class MissingPreviewableDiagramArtifactError extends Error {
    constructor() {
        super('No previewable diagram artifact found in this file or beside this source note. Supported direct preview sources are Mermaid or Vega-Lite markdown fences, raw Mermaid markdown artifacts, Vega-Lite JSON (.json), JSON Canvas (.canvas), HTML (.html), SVG (.svg), circuitikz TeX (.tex/.tikz), Draw.io (.drawio), and Drawnix (.drawnix) files.');
        this.name = 'MissingPreviewableDiagramArtifactError';
    }
}

const DIRECT_PREVIEWABLE_DIAGRAM_EXTENSIONS = new Set(['md', 'json', 'canvas', 'html', 'htm', 'svg', 'tex', 'tikz', 'drawio', 'drawnix']);

export function isDirectPreviewableDiagramExtension(extension: string): boolean {
    return typeof extension === 'string'
        && DIRECT_PREVIEWABLE_DIAGRAM_EXTENSIONS.has(extension.trim().toLowerCase());
}

function maybeOpenSavedFile(host: DiagramCommandHostAdapter, outputFilePath: string): void {
    const savedFile = host.getFileByPath(outputFilePath);
    if (savedFile instanceof TFile || savedFile) {
        host.openFile(savedFile);
    }
}

async function maybeAutoFixGeneratedMermaid(
    host: DiagramCommandHostAdapter,
    outputFilePath: string,
    reporter: ProgressReporter,
    reason: string
): Promise<void> {
    const savedFile = host.getFileByPath(outputFilePath);
    if (savedFile instanceof TFile || savedFile) {
        await host.maybeAutoFixMermaid(savedFile, reporter, reason);
    }
}

export async function completeMermaidDiagramCommand(
    params: CompleteMermaidDiagramCommandParams
): Promise<string> {
    params.reporter.updateStatus(params.getStepStatusText(2, 3, params.actionLabel), 90);

    const outputFilePath = await params.host.saveMermaidSummary(
        params.file,
        params.mermaidContent,
        params.reporter
    );

    if (params.autoFixAfterGenerate) {
        await maybeAutoFixGeneratedMermaid(params.host, outputFilePath, params.reporter, 'summarise as mermaid');
    }

    params.reporter.updateStatus(params.getActionCompleteText(params.actionLabel), 100);
    params.reporter.log(`Mermaid diagram saved to: ${outputFilePath}`);
    params.host.notify(params.completeNotice);
    maybeOpenSavedFile(params.host, outputFilePath);

    return outputFilePath;
}

export async function completeArtifactDiagramCommand(
    params: CompleteArtifactDiagramCommandParams
): Promise<string | undefined> {
    if (params.result.renderError) {
        params.reporter.log(`Warning: ${params.result.renderError}`);
        params.host.notify(params.manualFixHintNotice, 8000);
    }

    if (params.executionMode === 'preview-artifact') {
        const previewArtifact = await attachCompanionVisualPreviews({
            host: params.host,
            artifact: params.result.artifact,
            sourcePath: params.file.path,
            companions: params.result.artifact.companions
        });
        params.reporter.log(
            `Diagram preview produced target "${params.result.artifact.target}" with intent "${params.result.spec.intent}".`
        );
        params.host.openPreview(previewArtifact, params.file.path, false);
        params.reporter.updateStatus(params.getActionCompleteText(params.actionLabel), 100);
        params.reporter.log(`Diagram preview opened for: ${params.file.path}`);
        params.host.notify(params.previewReadyNotice);
        return undefined;
    }

    params.reporter.log(
        `Diagram pipeline produced target "${params.result.artifact.target}" with intent "${params.result.spec.intent}".`
    );
    params.reporter.updateStatus(params.getStepStatusText(2, 3, params.actionLabel), 85);

    const outputFilePath = await params.host.saveArtifact(params.file, params.result.artifact, params.reporter);
    if (params.result.artifact.target === 'mermaid' && params.autoFixAfterGenerate) {
        await maybeAutoFixGeneratedMermaid(params.host, outputFilePath, params.reporter, 'diagram generation');
    }

    params.reporter.updateStatus(params.getActionCompleteText(params.actionLabel), 100);
    params.reporter.log(`Diagram saved to: ${outputFilePath}`);
    params.host.notify(params.completeNotice);
    maybeOpenSavedFile(params.host, outputFilePath);

    if (params.host.supportsPreview(params.result.artifact)) {
        try {
            const reopenedPreview = await previewArtifactFromSavedPath({
                host: params.host,
                sourcePath: outputFilePath,
                artifactSavedOverride: true
            });

            if (!reopenedPreview) {
                params.host.openPreview(params.result.artifact, outputFilePath, true);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            params.reporter.log(`Falling back to in-memory preview because saved artifact reload failed: ${message}`);
            params.host.openPreview(params.result.artifact, outputFilePath, true);
        }
    }

    return outputFilePath;
}

export function extractVegaLiteFromMarkdown(content: string): string | null {
    const fenceRegex = /```vega-lite\s*\n([\s\S]*?)\n```/i;
    const match = content.match(fenceRegex);
    return match ? match[1].trim() : null;
}

export function buildVegaLitePreviewArtifact(vlContent: string): RenderArtifact {
    return {
        target: 'vega-lite',
        content: vlContent,
        mimeType: 'application/json',
        sourceIntent: 'dataChart' as DiagramIntent
    };
}

export function previewVegaLiteArtifactFromMarkdown(params: {
    host: Pick<DiagramCommandHostAdapter, 'openPreview'>;
    sourceMarkdown: string;
    sourcePath: string;
}): RenderArtifact {
    const vlContent = extractVegaLiteFromMarkdown(params.sourceMarkdown);
    if (!vlContent) {
        throw new MissingVegaLiteFenceError();
    }

    const artifact = buildVegaLitePreviewArtifact(vlContent);
    params.host.openPreview(artifact, params.sourcePath, false);
    return artifact;
}

function buildMermaidPreviewSource(mermaidContent: string): string {
    return `\`\`\`mermaid\n${mermaidContent.trim()}\n\`\`\``;
}

function resolveMermaidPreviewIntent(mermaidContent: string): DiagramIntent | null {
    const lines = mermaidContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('%%'));
    const firstDirective = lines[0]?.toLowerCase() ?? '';

    if (firstDirective === 'mindmap') {
        return 'mindmap';
    }
    if (firstDirective.startsWith('flowchart') || firstDirective.startsWith('graph')) {
        return 'flowchart';
    }
    if (firstDirective === 'sequencediagram') {
        return 'sequence';
    }
    if (firstDirective === 'classdiagram') {
        return 'classDiagram';
    }
    if (firstDirective === 'erdiagram') {
        return 'erDiagram';
    }
    if (firstDirective.startsWith('statediagram')) {
        return 'stateDiagram';
    }

    return null;
}

function inferMermaidPreviewIntent(mermaidContent: string): DiagramIntent {
    return resolveMermaidPreviewIntent(mermaidContent) ?? 'mindmap';
}

function buildMermaidPreviewArtifact(mermaidContent: string): RenderArtifact {
    return {
        target: 'mermaid',
        content: buildMermaidPreviewSource(mermaidContent),
        mimeType: 'text/vnd.mermaid',
        sourceIntent: inferMermaidPreviewIntent(mermaidContent)
    };
}

function buildJsonCanvasPreviewArtifact(canvasContent: string): RenderArtifact {
    return {
        target: 'json-canvas',
        content: canvasContent.trim(),
        mimeType: 'application/json',
        sourceIntent: 'canvasMap'
    };
}

function extractHtmlPreviewIntent(htmlContent: string): DiagramIntent {
    const match = htmlContent.match(/notemd-html-renderer-intent["'][^>]*>([^<]+)</i);
    const value = match?.[1]?.trim();
    return value && isSupportedDiagramIntent(value) ? value : 'flowchart';
}

function buildHtmlPreviewArtifact(htmlContent: string): RenderArtifact {
    return {
        target: 'html',
        content: htmlContent.trim(),
        mimeType: 'text/html',
        sourceIntent: extractHtmlPreviewIntent(htmlContent)
    };
}

function buildPreviewPanel(id: string, artifact: RenderArtifact): RenderArtifactPreviewPanel {
    return {
        id,
        artifact: {
            target: artifact.target,
            content: artifact.content,
            mimeType: artifact.mimeType,
            sourceIntent: artifact.sourceIntent,
            diagnostics: artifact.diagnostics,
            previewSvg: artifact.previewSvg
        }
    };
}

function looksLikeSvgSource(sourceContent: string): boolean {
    return /<svg\b[\s\S]*<\/svg>/i.test(sourceContent);
}

function buildSvgHtmlPreviewArtifact(svgContent: string): RenderArtifact {
    const svg = ensureSemanticFigureSvgStandaloneStyles(svgContent.trim());

    return {
        target: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
    <title>SVG diagram preview</title>
    <style>
        body { margin: 0; padding: 16px; background: Canvas; color: CanvasText; }
        svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
    </style>
</head>
<body>
${svg}
</body>
</html>`,
        mimeType: 'text/html',
        sourceIntent: 'flowchart',
        previewSvg: {
            content: svg,
            mimeType: 'image/svg+xml'
        }
    };
}

function looksLikeCircuitikzSource(sourceContent: string): boolean {
    return /\\begin\{circuitikz\}/i.test(sourceContent)
        || /\\usepackage(?:\[[^\]]*\])?\{circuitikz\}/i.test(sourceContent);
}

function buildCircuitikzPreviewArtifact(circuitikzContent: string): RenderArtifact {
    return {
        target: 'circuitikz',
        content: circuitikzContent.trim(),
        mimeType: 'text/x-tex',
        sourceIntent: 'circuit'
    };
}

function looksLikeDrawioSource(sourceContent: string): boolean {
    return /<mxfile\b/i.test(sourceContent) || /<mxGraphModel\b/i.test(sourceContent);
}

function buildDrawioPreviewArtifact(drawioContent: string): RenderArtifact {
    return {
        target: 'drawio',
        content: drawioContent.trim(),
        mimeType: 'application/vnd.jgraph.mxfile',
        sourceIntent: 'flowchart'
    };
}

function looksLikeDrawnixSource(sourceContent: string): boolean {
    try {
        const parsed = JSON.parse(sourceContent);
        return Boolean(
            parsed
            && typeof parsed === 'object'
            && !Array.isArray(parsed)
            && (parsed as Record<string, unknown>).type === 'drawnix'
            && Array.isArray((parsed as Record<string, unknown>).elements)
        );
    } catch {
        return false;
    }
}

function buildDrawnixPreviewArtifact(drawnixContent: string): RenderArtifact {
    return {
        target: 'drawnix',
        content: drawnixContent.trim(),
        mimeType: 'application/vnd.drawnix+json',
        sourceIntent: 'flowchart'
    };
}

type SupportedMarkdownFence = 'mermaid' | 'vega-lite';

interface MarkdownFenceMatch {
    index: number;
    kind: SupportedMarkdownFence;
    content: string;
}

interface DirectPreviewArtifactResult {
    artifact: RenderArtifact;
    artifactSaved: boolean;
    detectionLabel: string;
    sourcePath?: string;
}

function collectMarkdownFenceMatches(
    sourceMarkdown: string,
    kind: SupportedMarkdownFence,
    regex: RegExp
): MarkdownFenceMatch[] {
    return Array.from(sourceMarkdown.matchAll(regex)).map(match => ({
        index: match.index ?? Number.MAX_SAFE_INTEGER,
        kind,
        content: match[1]?.trim() ?? ''
    }));
}

function extractDirectPreviewArtifactFromMarkdown(sourceMarkdown: string): DirectPreviewArtifactResult | null {
    const fenceMatches = [
        ...collectMarkdownFenceMatches(sourceMarkdown, 'mermaid', /```mermaid\s*\n([\s\S]*?)\n```/ig),
        ...collectMarkdownFenceMatches(sourceMarkdown, 'vega-lite', /```vega-lite\s*\n([\s\S]*?)\n```/ig)
    ].sort((left, right) => left.index - right.index);
    const firstFence = fenceMatches[0];

    if (!firstFence) {
        return null;
    }

    // Mermaid is the only markdown artifact that can be safely represented as
    // an ordered multi-panel source. Keep the legacy first-fence behavior for
    // Vega-Lite and mixed documents so a saved JSON artifact is never made
    // invalid by concatenating unrelated fence types.
    const previewFences = firstFence.kind === 'mermaid'
        ? fenceMatches.filter(fence => fence.kind === 'mermaid')
        : [firstFence];
    const fenceArtifacts = previewFences.map((fence, index) => {
        const artifact = fence.kind === 'mermaid'
            ? buildMermaidPreviewArtifact(fence.content)
            : buildVegaLitePreviewArtifact(fence.content);
        return {
            artifact,
            panelId: `${fence.kind}-${index + 1}`
        };
    });
    const firstArtifact = fenceArtifacts[0].artifact;

    if (fenceArtifacts.length === 1) {
        return {
            artifact: firstArtifact,
            artifactSaved: false,
            detectionLabel: `${firstFence.kind === 'mermaid' ? 'Mermaid' : 'Vega-Lite'} markdown fence`
        };
    }

    return {
        artifact: {
            ...firstArtifact,
            content: fenceArtifacts.map(({ artifact }) => artifact.content).join('\n\n'),
            previewPanels: fenceArtifacts.map(({ artifact, panelId }) => buildPreviewPanel(panelId, artifact))
        },
        artifactSaved: false,
        detectionLabel: `${fenceArtifacts.length} markdown diagram fences`
    };
}

function looksLikeVegaLiteSpec(sourceContent: string): boolean {
    try {
        const parsed = JSON.parse(sourceContent);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return false;
        }

        const schema = typeof (parsed as Record<string, unknown>).$schema === 'string'
            ? String((parsed as Record<string, unknown>).$schema).toLowerCase()
            : '';
        if (schema.includes('vega-lite')) {
            return true;
        }

        return ['mark', 'encoding', 'layer', 'facet', 'repeat', 'concat', 'hconcat', 'vconcat']
            .some(key => key in (parsed as Record<string, unknown>));
    } catch {
        return false;
    }
}

function looksLikeRawMermaidArtifact(sourceContent: string): boolean {
    return resolveMermaidPreviewIntent(sourceContent) !== null;
}

function resolveDirectPreviewArtifact(sourceContent: string, sourcePath: string): DirectPreviewArtifactResult {
    const normalizedPath = sourcePath.trim().toLowerCase();

    if (normalizedPath.endsWith('.canvas')) {
        return {
            artifact: buildJsonCanvasPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'JSON Canvas artifact'
        };
    }

    if (normalizedPath.endsWith('.html') || normalizedPath.endsWith('.htm')) {
        return {
            artifact: buildHtmlPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'HTML artifact'
        };
    }

    if (normalizedPath.endsWith('.svg') && looksLikeSvgSource(sourceContent)) {
        return {
            artifact: buildSvgHtmlPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'SVG artifact'
        };
    }

    if ((normalizedPath.endsWith('.tex') || normalizedPath.endsWith('.tikz')) && looksLikeCircuitikzSource(sourceContent)) {
        return {
            artifact: buildCircuitikzPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'circuitikz TeX artifact'
        };
    }

    if (normalizedPath.endsWith('.drawio') && looksLikeDrawioSource(sourceContent)) {
        return {
            artifact: buildDrawioPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'Draw.io artifact'
        };
    }

    if (normalizedPath.endsWith('.drawnix') && looksLikeDrawnixSource(sourceContent)) {
        return {
            artifact: buildDrawnixPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'Drawnix artifact'
        };
    }

    if (normalizedPath.endsWith('.json') && looksLikeVegaLiteSpec(sourceContent)) {
        return {
            artifact: buildVegaLitePreviewArtifact(sourceContent.trim()),
            artifactSaved: true,
            detectionLabel: 'Vega-Lite JSON artifact'
        };
    }

    const markdownArtifact = extractDirectPreviewArtifactFromMarkdown(sourceContent);
    if (markdownArtifact) {
        return markdownArtifact;
    }

    if (normalizedPath.endsWith('.md') && looksLikeRawMermaidArtifact(sourceContent)) {
        return {
            artifact: buildMermaidPreviewArtifact(sourceContent),
            artifactSaved: true,
            detectionLabel: 'Mermaid markdown artifact'
        };
    }

    throw new MissingPreviewableDiagramArtifactError();
}

function previewArtifactFromFile(params: {
    sourceContent: string;
    sourcePath: string;
    artifactSavedOverride?: boolean;
}): DirectPreviewArtifactResult {
    const directPreview = resolveDirectPreviewArtifact(params.sourceContent, params.sourcePath);
    const artifactSaved = params.artifactSavedOverride ?? directPreview.artifactSaved;
    return {
        ...directPreview,
        artifactSaved,
        sourcePath: params.sourcePath
    };
}

function getVaultPathDirectory(vaultPath: string): string {
    const normalized = vaultPath.trim().replace(/\/+$/, '');
    const slashIndex = normalized.lastIndexOf('/');
    return slashIndex >= 0 ? normalized.slice(0, slashIndex) : '';
}

function getVaultPathFileName(vaultPath: string): string {
    const normalized = vaultPath.trim().replace(/\/+$/, '');
    const slashIndex = normalized.lastIndexOf('/');
    return slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
}

function getVaultPathBasename(vaultPath: string): string {
    return getVaultPathFileName(vaultPath).replace(/\.[^./]+$/, '');
}

function joinVaultPath(directory: string, fileName: string): string {
    return directory ? `${directory.replace(/\/+$/, '')}/${fileName.replace(/^\/+/, '')}` : fileName.replace(/^\/+/, '');
}

function resolveGeneratedDiagramDirectory(file: TFile, settings?: NotemdSettings): string {
    if (settings?.useCustomSummarizeToMermaidSavePath && settings.summarizeToMermaidSavePath?.trim()) {
        return settings.summarizeToMermaidSavePath.trim().replace(/^\/|\/$/g, '');
    }

    return getVaultPathDirectory(file.path);
}

function buildLocalGeneratedDiagramArtifactCandidates(file: TFile, settings?: NotemdSettings): string[] {
    const directory = resolveGeneratedDiagramDirectory(file, settings);
    const sourceBase = getVaultPathBasename(file.path);
    const candidates = [
        `${sourceBase}_diagram.drawio.md`,
        `${sourceBase}_diagram.drawnix.md`,
        `${sourceBase}_diagram.tex.md`,
        `${sourceBase}_diagram.drawio`,
        `${sourceBase}_diagram.drawnix`,
        `${sourceBase}_diagram.tex`,
        `${sourceBase}_diagram.tikz`,
        `${sourceBase}_diagram.drawio.svg`,
        `${sourceBase}_diagram.drawnix.svg`,
        `${sourceBase}_diagram.tex.svg`,
        `${sourceBase}_diagram.canvas`,
        `${sourceBase}_diagram.html`,
        `${sourceBase}_diagram.json`,
        `${sourceBase}_diagram.md`,
        `${sourceBase}_summ.md`
    ].map(fileName => joinVaultPath(directory, fileName));

    return candidates.filter((candidate, index, allCandidates) =>
        candidate !== file.path && allCandidates.indexOf(candidate) === index
    );
}

function resolveEmbeddedSvgPath(markdownContent: string, sourcePath: string): string | null {
    const wikilinkMatch = markdownContent.match(/!\[\[([^\]|#]+\.svg)(?:[|#][^\]]*)?\]\]/i);
    const markdownImageMatch = markdownContent.match(/!\[[^\]]*]\(([^)]+\.svg)\)/i);
    const rawTarget = wikilinkMatch?.[1] ?? markdownImageMatch?.[1];
    if (!rawTarget?.trim()) {
        return null;
    }

    const target = decodeURIComponent(rawTarget.trim()).replace(/^\/+/, '');
    if (target.includes('/')) {
        return target;
    }

    return joinVaultPath(getVaultPathDirectory(sourcePath), target);
}

function resolveEmbeddedSourceArtifactPath(markdownContent: string, sourcePath: string): string | null {
    const sourceMatch = markdownContent.match(/Source artifact:\s*\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/i);
    const rawTarget = sourceMatch?.[1];
    if (!rawTarget?.trim()) {
        return null;
    }

    const target = decodeURIComponent(rawTarget.trim()).replace(/^\/+/, '');
    return target.includes('/')
        ? target
        : joinVaultPath(getVaultPathDirectory(sourcePath), target);
}

async function readVaultTextFile(
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile'>,
    path: string
): Promise<string | null> {
    if (typeof host.readFile !== 'function') {
        return null;
    }

    const file = host.getFileByPath(path);
    if (!(file instanceof TFile || file)) {
        return null;
    }

    return host.readFile(file);
}

async function readVaultBinaryFile(
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readBinary'>,
    path: string
): Promise<ArrayBuffer | null> {
    if (typeof host.readBinary !== 'function') {
        return null;
    }

    const file = host.getFileByPath(path);
    if (!(file instanceof TFile || file)) {
        return null;
    }

    return host.readBinary(file);
}

function buildVaultPathCandidates(sourcePath: string, companionPath: string): string[] {
    const normalized = companionPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized || normalized.split('/').some(segment => segment === '..' || segment === '.')) {
        return [];
    }

    const sourceDirectory = getVaultPathDirectory(sourcePath);
    return Array.from(new Set([
        normalized,
        sourceDirectory ? joinVaultPath(sourceDirectory, normalized) : normalized
    ]));
}

async function readFirstVaultTextFile(
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile'>,
    sourcePath: string,
    companionPath: string
): Promise<{ path: string; content: string } | null> {
    for (const candidate of buildVaultPathCandidates(sourcePath, companionPath)) {
        const content = await readVaultTextFile(host, candidate);
        if (content !== null) {
            return { path: candidate, content };
        }
    }
    return null;
}

async function readFirstVaultBinaryFile(
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readBinary'>,
    sourcePath: string,
    companionPath: string
): Promise<{ path: string; content: ArrayBuffer } | null> {
    for (const candidate of buildVaultPathCandidates(sourcePath, companionPath)) {
        const content = await readVaultBinaryFile(host, candidate);
        if (content !== null) {
            return { path: candidate, content };
        }
    }
    return null;
}

interface DrawnixSourceVisualPreviewMetadata {
    id: string;
    kind: 'mermaid' | 'image';
    companionPaths: string[];
    embeddedSvg?: string;
    sourceContent?: string;
    title?: string;
    lineStart?: number;
    lineEnd?: number;
}

function parseDrawnixSourceVisualPreviewMetadata(content: string): DrawnixSourceVisualPreviewMetadata[] {
    try {
        const parsed = JSON.parse(content) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return [];
        }
        const exportedData = parsed as Record<string, unknown>;
        if (exportedData.type !== 'drawnix'
            || (exportedData.version !== 1 && exportedData.version !== '1')) {
            return [];
        }
        const metadata = exportedData.metadata;
        const notemd = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
            ? (metadata as Record<string, unknown>).notemd
            : undefined;
        const sourceVisuals = notemd && typeof notemd === 'object' && !Array.isArray(notemd)
            ? (notemd as Record<string, unknown>).sourceVisuals
            : undefined;
        const metadataVersion = notemd && typeof notemd === 'object' && !Array.isArray(notemd)
            ? (notemd as Record<string, unknown>).version
            : undefined;
        if ((metadataVersion !== DRAWNIX_SOURCE_VISUAL_METADATA_VERSION && metadataVersion !== '1')
            || !Array.isArray(sourceVisuals)) {
            return [];
        }

        const ids = new Set<string>();
        return sourceVisuals.flatMap((visual): DrawnixSourceVisualPreviewMetadata[] => {
            if (!visual || typeof visual !== 'object' || Array.isArray(visual)) {
                return [];
            }
            const candidate = visual as Record<string, unknown>;
            const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
            const kind = candidate.kind === 'mermaid' || candidate.kind === 'image' ? candidate.kind : null;
            const companionPaths = Array.isArray(candidate.companionPaths)
                ? candidate.companionPaths.filter((path): path is string => typeof path === 'string' && path.trim().length > 0)
                : [];
            const embeddedSvg = typeof candidate.embeddedSvg === 'string' && candidate.embeddedSvg.trim().length > 0
                ? candidate.embeddedSvg
                : undefined;
            const sourceContent = typeof candidate.sourceContent === 'string'
                ? candidate.sourceContent
                : undefined;
            const title = typeof candidate.title === 'string' ? candidate.title : undefined;
            const lineStart = typeof candidate.lineStart === 'number' ? candidate.lineStart : undefined;
            const lineEnd = typeof candidate.lineEnd === 'number' ? candidate.lineEnd : undefined;
            const validLineRange = (lineStart === undefined || Number.isInteger(lineStart))
                && (lineEnd === undefined || Number.isInteger(lineEnd));
            if (!id || ids.has(id) || !kind || !validLineRange) {
                return [];
            }
            const hasPreviewPayload = (
                companionPaths.length > 0
                || embeddedSvg
                || (kind === 'mermaid' && Boolean(sourceContent?.trim()))
            );
            if (!hasPreviewPayload) {
                return [];
            }
            ids.add(id);
            return [{ id, kind, companionPaths, embeddedSvg, sourceContent, title, lineStart, lineEnd }];
        });
    } catch {
        return [];
    }
}

function arrayBufferToBase64(content: ArrayBuffer): string {
    const bytes = new Uint8Array(content);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    if (typeof btoa !== 'function') {
        throw new Error('Binary preview encoding is unavailable in this host.');
    }
    return btoa(binary);
}

function buildDrawnixImagePreviewArtifact(content: ArrayBuffer, mimeType: string): RenderArtifact {
    const dataUri = `data:${mimeType};base64,${arrayBufferToBase64(content)}`;
    // A data-backed SVG keeps raster companions on the same per-panel export path as Mermaid and SVG companions.
    const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img"><rect width="960" height="540" fill="#ffffff"/><image href="${dataUri}" x="0" y="0" width="960" height="540" preserveAspectRatio="xMidYMid meet"/></svg>`;
    return {
        target: 'html',
        content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:16px;background:Canvas;color:CanvasText"><img src="${dataUri}" alt="Drawnix source visual" style="display:block;max-width:100%;height:auto;margin:0 auto"></body></html>`,
        mimeType: 'text/html',
        sourceIntent: 'flowchart',
        previewSvg: {
            content: previewSvg,
            mimeType: 'image/svg+xml'
        }
    };
}

async function buildMermaidSourcePreviewArtifact(sourceContent: string): Promise<RenderArtifact> {
    const content = `\`\`\`mermaid\n${sourceContent.trim()}\n\`\`\``;
    let svg: string;
    try {
        svg = await renderMermaidArtifactSvg({
            target: 'mermaid',
            content,
            mimeType: 'text/vnd.mermaid',
            sourceIntent: inferMermaidPreviewIntent(sourceContent)
        });
    } catch {
        svg = buildFallbackMermaidSvg(sourceContent);
    }

    return {
        target: 'mermaid',
        content,
        mimeType: 'text/vnd.mermaid',
        sourceIntent: inferMermaidPreviewIntent(sourceContent),
        previewSvg: {
            content: sanitizeSvgForExport(svg),
            mimeType: 'image/svg+xml'
        }
    };
}

function inferCompanionMimeType(path: string): string | null {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'svg': return 'image/svg+xml';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'bmp': return 'image/bmp';
        default: return null;
    }
}

async function buildDrawnixSourceVisualPreviewPanels(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'readBinary'>;
    artifact: RenderArtifact;
    sourcePath: string;
    companions?: readonly RenderArtifactCompanion[];
}): Promise<RenderArtifactPreviewPanel[]> {
    const metadata = parseDrawnixSourceVisualPreviewMetadata(params.artifact.content);
    if (metadata.length === 0) {
        return [];
    }

    const panels: RenderArtifactPreviewPanel[] = [];
    if (params.artifact.previewSvg?.content?.trim()) {
        panels.push({
            id: 'drawnix-primary',
            artifact: {
                target: params.artifact.target,
                content: params.artifact.content,
                mimeType: params.artifact.mimeType,
                sourceIntent: params.artifact.sourceIntent,
                previewSvg: params.artifact.previewSvg
            }
        });
    }

    const normalizeMemoryCompanionPath = (path: string): string =>
        path.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    const companionByPath = new Map(
        (params.companions ?? []).map(companion => [normalizeMemoryCompanionPath(companion.path), companion] as const)
    );
    const findMemoryCompanion = (path: string): RenderArtifactCompanion | undefined => {
        return companionByPath.get(normalizeMemoryCompanionPath(path));
    };

    for (const visual of metadata) {
        if (visual.embeddedSvg && looksLikeSvgSource(visual.embeddedSvg)) {
            panels.push({
                id: visual.id,
                artifact: buildSvgHtmlPreviewArtifact(sanitizeSvgForExport(visual.embeddedSvg))
            });
            continue;
        }
        const svgPath = visual.companionPaths.find(path => inferCompanionMimeType(path) === 'image/svg+xml');
        if (svgPath) {
            const memorySvg = findMemoryCompanion(svgPath);
            const svg = memorySvg && typeof memorySvg.content === 'string'
                ? { path: memorySvg.path, content: memorySvg.content }
                : await readFirstVaultTextFile(params.host, params.sourcePath, svgPath).catch(() => null);
            if (svg?.content && looksLikeSvgSource(svg.content)) {
                panels.push({
                    id: visual.id,
                    artifact: buildSvgHtmlPreviewArtifact(sanitizeSvgForExport(svg.content))
                });
                continue;
            }
        }

        const imagePath = visual.companionPaths.find(path => inferCompanionMimeType(path) && inferCompanionMimeType(path) !== 'image/svg+xml');
        const imageMimeType = imagePath ? inferCompanionMimeType(imagePath) : null;
        if (imagePath && imageMimeType) {
            const memoryImage = findMemoryCompanion(imagePath);
            const image = memoryImage && memoryImage.content instanceof ArrayBuffer
                ? { path: memoryImage.path, content: memoryImage.content }
                : await readFirstVaultBinaryFile(params.host, params.sourcePath, imagePath).catch(() => null);
            if (image) {
                try {
                    panels.push({
                        id: visual.id,
                        artifact: buildDrawnixImagePreviewArtifact(image.content, imageMimeType)
                    });
                } catch {
                    // Keep the source visual in metadata when the host cannot encode binary data.
                }
            }
        }

        if (visual.kind === 'mermaid' && visual.sourceContent?.trim()) {
            panels.push({
                id: visual.id,
                artifact: await buildMermaidSourcePreviewArtifact(visual.sourceContent)
            });
        }
    }

    return panels;
}

async function tryBuildSvgWrapperPreview(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile'>;
    sourceContent: string;
    sourcePath: string;
}): Promise<DirectPreviewArtifactResult | null> {
    const svgPath = resolveEmbeddedSvgPath(params.sourceContent, params.sourcePath);
    if (!svgPath) {
        return null;
    }

    const svgContent = await readVaultTextFile(params.host, svgPath);
    if (!svgContent || !looksLikeSvgSource(svgContent)) {
        return null;
    }

    return {
        artifact: buildSvgHtmlPreviewArtifact(svgContent),
        artifactSaved: true,
        detectionLabel: 'Obsidian SVG preview wrapper'
    };
}

async function tryBuildLinkedSourceArtifactPreview(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile'>;
    sourceContent: string;
    sourcePath: string;
}): Promise<{ preview: DirectPreviewArtifactResult; sourcePath: string } | null> {
    const sourceArtifactPath = resolveEmbeddedSourceArtifactPath(params.sourceContent, params.sourcePath);
    if (!sourceArtifactPath) {
        return null;
    }

    const artifactContent = await readVaultTextFile(params.host, sourceArtifactPath);
    if (!artifactContent) {
        return null;
    }

    try {
        return {
            preview: resolveDirectPreviewArtifact(artifactContent, sourceArtifactPath),
            sourcePath: sourceArtifactPath
        };
    } catch (error) {
        if (error instanceof MissingPreviewableDiagramArtifactError) {
            return null;
        }
        throw error;
    }
}

async function attachCompanionSvgPreview(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile'>;
    artifact: RenderArtifact;
    sourcePath: string;
}): Promise<RenderArtifact> {
    if (params.artifact.previewSvg?.content?.trim()) {
        return params.artifact;
    }

    if (!['circuitikz', 'drawio', 'drawnix'].includes(params.artifact.target)) {
        return params.artifact;
    }

    const svgPath = `${params.sourcePath}.svg`;
    const svgContent = await readVaultTextFile(params.host, svgPath);
    if (!svgContent || !looksLikeSvgSource(svgContent)) {
        return params.artifact;
    }

    return {
        ...params.artifact,
        previewSvg: {
            content: svgContent,
            mimeType: 'image/svg+xml'
        }
    };
}

async function attachCompanionVisualPreviews(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'readBinary'>;
    artifact: RenderArtifact;
    sourcePath: string;
    companions?: readonly RenderArtifactCompanion[];
}): Promise<RenderArtifact> {
    const artifactWithPrimarySvg = await attachCompanionSvgPreview(params);
    if (artifactWithPrimarySvg.previewPanels && artifactWithPrimarySvg.previewPanels.length > 0) {
        return artifactWithPrimarySvg;
    }
    if (artifactWithPrimarySvg.target !== 'drawnix') {
        return artifactWithPrimarySvg;
    }

    const previewPanels = await buildDrawnixSourceVisualPreviewPanels({
        host: params.host,
        artifact: artifactWithPrimarySvg,
        sourcePath: params.sourcePath,
        companions: params.companions
    });
    return previewPanels.length > 0
        ? { ...artifactWithPrimarySvg, previewPanels }
        : artifactWithPrimarySvg;
}

export async function previewArtifactFromSavedPath(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'readBinary' | 'openPreview'>;
    sourcePath: string;
    artifactSavedOverride?: boolean;
    openPreview?: boolean;
}): Promise<DirectPreviewArtifactResult | null> {
    if (typeof params.host.readFile !== 'function') {
        return null;
    }

    const savedFile = params.host.getFileByPath(params.sourcePath);
    if (!(savedFile instanceof TFile || savedFile)) {
        return null;
    }

    const sourceContent = await params.host.readFile(savedFile);
    let directPreview: DirectPreviewArtifactResult;
    let resolvedSourcePath = params.sourcePath;
    try {
        directPreview = resolveDirectPreviewArtifact(sourceContent, params.sourcePath);
    } catch (error) {
        if (!(error instanceof MissingPreviewableDiagramArtifactError)) {
            throw error;
        }

        const linkedSourcePreview = await tryBuildLinkedSourceArtifactPreview({
            host: params.host,
            sourceContent,
            sourcePath: params.sourcePath
        });
        if (linkedSourcePreview) {
            directPreview = {
                ...linkedSourcePreview.preview,
                detectionLabel: `${linkedSourcePreview.preview.detectionLabel} via Obsidian preview wrapper`
            };
            resolvedSourcePath = linkedSourcePreview.sourcePath;
        } else {
            const svgWrapperPreview = await tryBuildSvgWrapperPreview({
                host: params.host,
                sourceContent,
                sourcePath: params.sourcePath
            });
            if (!svgWrapperPreview) {
                throw error;
            }
            directPreview = svgWrapperPreview;
        }
    }

    const artifact = await attachCompanionVisualPreviews({
        host: params.host,
        artifact: directPreview.artifact,
        sourcePath: resolvedSourcePath
    });
    const artifactSaved = params.artifactSavedOverride ?? directPreview.artifactSaved;
    if (params.openPreview !== false) {
        params.host.openPreview(artifact, resolvedSourcePath, artifactSaved);
    }
    return {
        ...directPreview,
        artifact,
        artifactSaved,
        sourcePath: resolvedSourcePath
    };
}

async function previewLocalGeneratedDiagramArtifact(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'readBinary' | 'openPreview'>;
    file: TFile;
    settings?: NotemdSettings;
    reporter: ProgressReporter;
}): Promise<DirectPreviewArtifactResult | null> {
    for (const candidatePath of buildLocalGeneratedDiagramArtifactCandidates(params.file, params.settings)) {
        const preview = await previewArtifactFromSavedPath({
            host: params.host,
            sourcePath: candidatePath,
            artifactSavedOverride: true,
            openPreview: false
        }).catch((error: unknown) => {
            if (error instanceof MissingPreviewableDiagramArtifactError) {
                return null;
            }
            throw error;
        });

        if (preview) {
            params.reporter.log(`Found generated diagram artifact for preview: ${candidatePath}`);
            return preview;
        }
    }

    return null;
}

function getEmptyFileErrorMessage(executionMode: DiagramCommandExecutionMode): string {
    switch (executionMode) {
        case 'save-mermaid':
            return 'File is empty. Cannot summarize.';
        case 'save-artifact':
            return 'File is empty. Cannot generate diagram.';
        case 'preview-artifact':
            return 'File is empty. Cannot generate diagram preview.';
    }
}

function logDiagramCommandStart(
    reporter: ProgressReporter,
    fileName: string,
    executionMode: DiagramCommandExecutionMode
): void {
    switch (executionMode) {
        case 'save-mermaid':
            reporter.log(`Starting Mermaid summarization for ${fileName}...`);
            break;
        case 'save-artifact':
            reporter.log(`Starting diagram generation for ${fileName}...`);
            break;
        case 'preview-artifact':
            reporter.log(`Starting diagram preview for ${fileName}...`);
            break;
    }
}

export async function runGenerateDiagramCommandWithHost(
    host: DiagramCommandRunHost,
    file: TFile,
    reporter?: ProgressReporter,
    options: DiagramCommandOptions = { executionMode: 'save-artifact' }
): Promise<DiagramCommandRunResult | null> {
    const diagramHost = host.createDiagramHostAdapter();
    let i18n = host.getUiStrings();

    if (host.isBusy()) {
        diagramHost.notify(host.getBusyNotice());
        return null;
    }

    host.setBusy(true);
    const useReporter = reporter ?? host.getReporter();
    let actionLabel = host.getActionLabel(options.executionMode, i18n);
    host.startReporterAction(useReporter, `${actionLabel}: ${file.name}`);
    logDiagramCommandStart(useReporter, file.name, options.executionMode);

    try {
        await host.loadSettings();
        i18n = host.getUiStrings();
        actionLabel = host.getActionLabel(options.executionMode, i18n);
        const inputTaskId = options.executionMode === 'save-mermaid' ? 'summarize-as-mermaid' : 'generate-diagram';
        if (!isSupportedInputFileForTask(host.getSettings(), inputTaskId, file)) {
            throw new Error('No supported diagram input file selected.');
        }

        const fileContent = await host.readFile(file);
        if (!fileContent.trim()) {
            throw new Error(getEmptyFileErrorMessage(options.executionMode));
        }

        const { provider, modelName } = host.getProviderAndModelForTask('summarizeToMermaid');
        useReporter.log(`Using provider: ${provider.name}, Model: ${modelName}`);
        let operationInput = buildDiagramOperationInput({
            sourcePath: file.path,
            sourceMarkdown: fileContent,
            executionMode: options.executionMode,
            settings: host.getSettings(),
            targetLanguage: host.getTaskLanguageCode('summarizeToMermaid'),
            requestedIntentOverride: options.inputOverrides?.requestedIntent,
            requestedRenderTargetOverride: options.inputOverrides?.requestedRenderTarget,
            compatibilityModeOverride: options.inputOverrides?.compatibilityMode,
            targetLanguageOverride: options.inputOverrides?.targetLanguage,
            drawnixKnowledgeMapDeliveryOverride: options.inputOverrides?.drawnixKnowledgeMapDelivery
        });
        const sourceVisualReferences = scanSourceVisualReferences(fileContent);
        if (sourceVisualReferences.length > 0) {
            const sourceVisuals = await resolveSourceVisualReferences(
                sourceVisualReferences,
                file.path,
                diagramHost
            );
            operationInput = { ...operationInput, sourceVisuals };
            const unresolvedCount = sourceVisuals.filter(visual => visual.status === 'unresolved').length;
            useReporter.log(`Preserved ${sourceVisuals.length} source visual reference(s) for Drawnix export${unresolvedCount > 0 ? `; ${unresolvedCount} unresolved reference(s) remain in the manifest.` : '.'}`);
        }

        const executionDetails = options.executionMode === 'save-mermaid'
            ? await host.executeSaveMermaidCommand(
                file,
                operationInput,
                provider,
                modelName,
                useReporter,
                actionLabel,
                i18n
            )
            : await host.executeArtifactCommand(
                file,
                operationInput,
                provider,
                modelName,
                useReporter,
                actionLabel,
                i18n,
                options.executionMode
            );

        return {
            kind: 'success',
            executionMode: options.executionMode,
            sourcePath: file.path,
            actionLabel,
            operationInput,
            generation: executionDetails.generation,
            followThrough: executionDetails.followThrough,
            localKnowledgeContextUsed: executionDetails.localKnowledgeContextUsed,
            localKnowledgeRetrieval: executionDetails.localKnowledgeRetrieval,
            outputPath: executionDetails.outputPath,
            previewOpened: executionDetails.previewOpened
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);

        switch (options.executionMode) {
            case 'save-mermaid':
                useReporter.log(`Error during Mermaid summarization: ${message}`);
                diagramHost.notify(formatI18n(i18n.notices.mermaidSummarizationError, { message }));
                host.logError('Summarization Error:', error);
                break;
            case 'save-artifact':
                useReporter.log(`Error during diagram generation: ${message}`);
                diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                host.logError('Diagram generation error:', error);
                break;
            case 'preview-artifact':
                useReporter.log(`Error during diagram preview: ${message}`);
                diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                host.logError('Diagram preview error:', error);
                break;
        }

        useReporter.updateStatus(host.getActionFailedText(message), -1);
        await host.saveErrorLog(error, useReporter);

        return {
            kind: 'error',
            executionMode: options.executionMode,
            sourcePath: file.path,
            actionLabel,
            errorMessage: message
        };
    } finally {
        host.finalizeReporter(useReporter);
        host.setBusy(false);
    }
}

export async function runPreviewDiagramCommandWithHost(
    host: Pick<
        DiagramCommandRunHost,
        | 'getUiStrings'
        | 'getSettings'
        | 'isBusy'
        | 'getBusyNotice'
        | 'startReporterAction'
        | 'finalizeReporter'
        | 'getActionLabel'
        | 'getActionCompleteText'
        | 'getActionFailedText'
        | 'readFile'
        | 'createDiagramHostAdapter'
        | 'saveErrorLog'
        | 'logError'
    >,
    file: TFile,
    reporter: ProgressReporter
): Promise<PreviewDiagramCommandResult | null> {
    const diagramHost = host.createDiagramHostAdapter();
    const i18n = host.getUiStrings();
    const actionLabel = host.getActionLabel('preview-artifact', i18n);

    if (host.isBusy()) {
        diagramHost.notify(host.getBusyNotice());
        return null;
    }

    host.startReporterAction(reporter, `${actionLabel}: ${file.name}`);
    reporter.log(`Starting diagram preview for ${file.name}...`);

    try {
        const fileContent = await host.readFile(file);
        let directPreview: DirectPreviewArtifactResult | null = null;
        try {
            directPreview = previewArtifactFromFile({
                sourceContent: fileContent,
                sourcePath: file.path
            });
        } catch (error) {
            if (!(error instanceof MissingPreviewableDiagramArtifactError)) {
                throw error;
            }

            const linkedSourcePreview = await tryBuildLinkedSourceArtifactPreview({
                host: diagramHost,
                sourceContent: fileContent,
                sourcePath: file.path
            });

            if (linkedSourcePreview) {
                directPreview = {
                    ...linkedSourcePreview.preview,
                    artifact: linkedSourcePreview.preview.artifact,
                    artifactSaved: true,
                    detectionLabel: `${linkedSourcePreview.preview.detectionLabel} via Obsidian preview wrapper`,
                    sourcePath: linkedSourcePreview.sourcePath
                };
            } else {
                directPreview = await tryBuildSvgWrapperPreview({
                    host: diagramHost,
                    sourceContent: fileContent,
                    sourcePath: file.path
                });
            }

            if (directPreview && !linkedSourcePreview) {
                directPreview = {
                    ...directPreview,
                    artifactSaved: true,
                    sourcePath: file.path
                };
            } else if (!directPreview) {
                directPreview = await previewLocalGeneratedDiagramArtifact({
                    host: diagramHost,
                    file,
                    settings: host.getSettings(),
                    reporter
                });
            }

            if (!directPreview) {
                throw error;
            }
        }
        const previewSourcePath = directPreview.sourcePath ?? file.path;
        const artifactWithCompanionSvg = await attachCompanionVisualPreviews({
            host: diagramHost,
            artifact: directPreview.artifact,
            sourcePath: previewSourcePath
        });
        directPreview = {
            ...directPreview,
            artifact: artifactWithCompanionSvg,
            sourcePath: previewSourcePath
        };
        diagramHost.openPreview(artifactWithCompanionSvg, previewSourcePath, directPreview.artifactSaved);
        const { artifact } = directPreview;

        reporter.log(
            `Detected ${directPreview.detectionLabel} for preview target "${artifact.target}" at ${file.path}.`
        );

        reporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
        reporter.log(`Diagram preview opened for: ${file.path}`);
        diagramHost.notify(i18n.notices.experimentalDiagramPreviewReady);

        return {
            kind: 'success',
            sourcePath: file.path,
            actionLabel,
            artifact,
            previewOpened: true
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        reporter.log(`Error during diagram preview: ${message}`);
        diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
        host.logError('Diagram preview error:', error);
        reporter.updateStatus(host.getActionFailedText(message), -1);
        await host.saveErrorLog(error, reporter);

        return {
            kind: 'error',
            sourcePath: file.path,
            actionLabel,
            errorMessage: message
        };
    } finally {
        host.finalizeReporter(reporter);
    }
}

export const runPreviewExperimentalDiagramCommandWithHost = runPreviewDiagramCommandWithHost;
