import { TFile } from 'obsidian';
import { DiagramGenerationResult } from '../diagram/diagramGenerationService';
import { DiagramIntent } from '../diagram/types';
import { RenderArtifact } from '../rendering/types';
import { ProgressReporter } from '../types';

export interface DiagramCommandHostAdapter {
    saveMermaidSummary: (file: TFile, mermaidContent: string, reporter: ProgressReporter) => Promise<string>;
    saveArtifact: (file: TFile, artifact: RenderArtifact, reporter: ProgressReporter) => Promise<string>;
    getFileByPath: (path: string) => TFile | null;
    openFile: (file: TFile) => void;
    maybeAutoFixMermaid: (file: TFile, reporter: ProgressReporter, reason: string) => Promise<void>;
    supportsPreview: (artifact: RenderArtifact) => boolean;
    openPreview: (artifact: RenderArtifact, sourcePath: string, artifactSaved?: boolean) => void;
    notify: (message: string, duration?: number) => void;
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
            `Experimental diagram preview produced target "${params.result.artifact.target}" with intent "${params.result.spec.intent}".`
        );
        params.host.openPreview(params.result.artifact, params.file.path, false);
        params.reporter.updateStatus(params.getActionCompleteText(params.actionLabel), 100);
        params.reporter.log(`Experimental diagram preview opened for: ${params.file.path}`);
        params.host.notify(params.previewReadyNotice);
        return undefined;
    }

    params.reporter.log(
        `Experimental diagram pipeline produced target "${params.result.artifact.target}" with intent "${params.result.spec.intent}".`
    );
    params.reporter.updateStatus(params.getStepStatusText(2, 3, params.actionLabel), 85);

    const outputFilePath = await params.host.saveArtifact(params.file, params.result.artifact, params.reporter);
    if (params.result.artifact.target === 'mermaid' && params.autoFixAfterGenerate) {
        await maybeAutoFixGeneratedMermaid(params.host, outputFilePath, params.reporter, 'experimental diagram generation');
    }

    params.reporter.updateStatus(params.getActionCompleteText(params.actionLabel), 100);
    params.reporter.log(`Experimental diagram saved to: ${outputFilePath}`);
    params.host.notify(params.completeNotice);
    maybeOpenSavedFile(params.host, outputFilePath);

    if (params.host.supportsPreview(params.result.artifact)) {
        params.host.openPreview(params.result.artifact, outputFilePath, true);
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
