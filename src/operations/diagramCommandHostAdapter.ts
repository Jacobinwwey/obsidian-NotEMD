import { TFile } from 'obsidian';
import { formatI18n } from '../i18n';
import { DiagramGenerationResult } from '../diagram/diagramGenerationService';
import { DiagramIntent, isSupportedDiagramIntent } from '../diagram/types';
import { LocalKnowledgeRetrievalSummary } from '../localKnowledgeBase';
import { RenderArtifact } from '../rendering/types';
import { ensureSemanticFigureSvgStandaloneStyles } from '../rendering/renderers/editableHtmlSvgRenderer';
import { DiagramOperationInput, DiagramOperationExecutionMode, buildDiagramOperationInput } from '../diagram/diagramGenerationService';
import { isSupportedInputFileForTask } from '../inputFileSupport';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

export interface DiagramCommandHostAdapter {
    saveMermaidSummary: (file: TFile, mermaidContent: string, reporter: ProgressReporter) => Promise<string>;
    saveArtifact: (file: TFile, artifact: RenderArtifact, reporter: ProgressReporter) => Promise<string>;
    getFileByPath: (path: string) => TFile | null;
    readFile?: (file: TFile) => Promise<string>;
    openFile: (file: TFile) => void;
    maybeAutoFixMermaid: (file: TFile, reporter: ProgressReporter, reason: string) => Promise<void>;
    supportsPreview: (artifact: RenderArtifact) => boolean;
    openPreview: (artifact: RenderArtifact, sourcePath: string, artifactSaved?: boolean) => void;
    notify: (message: string, duration?: number) => void;
}

export type DiagramCommandExecutionMode = DiagramOperationExecutionMode;

export interface DiagramCommandInputOverrides {
    requestedIntent?: DiagramIntent;
    compatibilityMode?: 'best-fit' | 'legacy-mermaid';
    targetLanguage?: string;
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
        params.reporter.log(
            `Diagram preview produced target "${params.result.artifact.target}" with intent "${params.result.spec.intent}".`
        );
        params.host.openPreview(params.result.artifact, params.file.path, false);
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
        sourceIntent: 'flowchart'
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

    if (firstFence.kind === 'mermaid') {
        return {
            artifact: buildMermaidPreviewArtifact(firstFence.content),
            artifactSaved: false,
            detectionLabel: 'Mermaid markdown fence'
        };
    }

    return {
        artifact: buildVegaLitePreviewArtifact(firstFence.content),
        artifactSaved: false,
        detectionLabel: 'Vega-Lite markdown fence'
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
    host: Pick<DiagramCommandHostAdapter, 'openPreview'>;
    sourceContent: string;
    sourcePath: string;
    artifactSavedOverride?: boolean;
}): DirectPreviewArtifactResult {
    const directPreview = resolveDirectPreviewArtifact(params.sourceContent, params.sourcePath);
    const artifactSaved = params.artifactSavedOverride ?? directPreview.artifactSaved;
    params.host.openPreview(directPreview.artifact, params.sourcePath, artifactSaved);
    return {
        ...directPreview,
        artifactSaved
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

export async function previewArtifactFromSavedPath(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'openPreview'>;
    sourcePath: string;
    artifactSavedOverride?: boolean;
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
    try {
        directPreview = previewArtifactFromFile({
            host: params.host,
            sourceContent,
            sourcePath: params.sourcePath,
            artifactSavedOverride: params.artifactSavedOverride
        });
    } catch (error) {
        if (!(error instanceof MissingPreviewableDiagramArtifactError)) {
            throw error;
        }

        const svgWrapperPreview = await tryBuildSvgWrapperPreview({
            host: params.host,
            sourceContent,
            sourcePath: params.sourcePath
        });
        if (!svgWrapperPreview) {
            throw error;
        }

        directPreview = svgWrapperPreview;
        params.host.openPreview(directPreview.artifact, params.sourcePath, true);
    }

    const artifact = await attachCompanionSvgPreview({
        host: params.host,
        artifact: directPreview.artifact,
        sourcePath: params.sourcePath
    });
    if (artifact !== directPreview.artifact) {
        const artifactSaved = params.artifactSavedOverride ?? directPreview.artifactSaved;
        params.host.openPreview(artifact, params.sourcePath, artifactSaved);
        return {
            ...directPreview,
            artifact,
            artifactSaved
        };
    }

    return directPreview;
}

async function previewLocalGeneratedDiagramArtifact(params: {
    host: Pick<DiagramCommandHostAdapter, 'getFileByPath' | 'readFile' | 'openPreview'>;
    file: TFile;
    settings?: NotemdSettings;
    reporter: ProgressReporter;
}): Promise<DirectPreviewArtifactResult | null> {
    for (const candidatePath of buildLocalGeneratedDiagramArtifactCandidates(params.file, params.settings)) {
        const preview = await previewArtifactFromSavedPath({
            host: params.host,
            sourcePath: candidatePath,
            artifactSavedOverride: true
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
        const operationInput = buildDiagramOperationInput({
            sourcePath: file.path,
            sourceMarkdown: fileContent,
            executionMode: options.executionMode,
            settings: host.getSettings(),
            targetLanguage: host.getTaskLanguageCode('summarizeToMermaid'),
            requestedIntentOverride: options.inputOverrides?.requestedIntent,
            compatibilityModeOverride: options.inputOverrides?.compatibilityMode,
            targetLanguageOverride: options.inputOverrides?.targetLanguage
        });

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
                host: diagramHost,
                sourceContent: fileContent,
                sourcePath: file.path
            });
        } catch (error) {
            if (!(error instanceof MissingPreviewableDiagramArtifactError)) {
                throw error;
            }

            directPreview = await tryBuildSvgWrapperPreview({
                host: diagramHost,
                sourceContent: fileContent,
                sourcePath: file.path
            });

            if (directPreview) {
                diagramHost.openPreview(directPreview.artifact, file.path, true);
            } else {
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
        const artifactWithCompanionSvg = await attachCompanionSvgPreview({
            host: diagramHost,
            artifact: directPreview.artifact,
            sourcePath: file.path
        });
        if (artifactWithCompanionSvg !== directPreview.artifact) {
            const artifactSaved = directPreview.artifactSaved;
            diagramHost.openPreview(artifactWithCompanionSvg, file.path, artifactSaved);
            directPreview = {
                ...directPreview,
                artifact: artifactWithCompanionSvg
            };
        }
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
