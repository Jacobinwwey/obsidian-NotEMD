import { TFile } from 'obsidian';
import { formatI18n } from '../i18n';
import { DiagramGenerationResult } from '../diagram/diagramGenerationService';
import { DiagramIntent } from '../diagram/types';
import { RenderArtifact } from '../rendering/types';
import { DiagramOperationInput, DiagramOperationExecutionMode, buildDiagramOperationInput } from '../diagram/diagramGenerationService';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

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

export type DiagramCommandExecutionMode = DiagramOperationExecutionMode;

export interface DiagramCommandOptions {
    executionMode: DiagramCommandExecutionMode;
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

export type PreviewExperimentalDiagramCommandResult =
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
            reporter.log(`Starting experimental diagram generation for ${fileName}...`);
            break;
        case 'preview-artifact':
            reporter.log(`Starting experimental diagram preview for ${fileName}...`);
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
            targetLanguage: host.getTaskLanguageCode('summarizeToMermaid')
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
                useReporter.log(`Error during experimental diagram generation: ${message}`);
                diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                host.logError('Experimental diagram generation error:', error);
                break;
            case 'preview-artifact':
                useReporter.log(`Error during experimental diagram preview: ${message}`);
                diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
                host.logError('Experimental diagram preview error:', error);
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

export async function runPreviewExperimentalDiagramCommandWithHost(
    host: Pick<
        DiagramCommandRunHost,
        | 'getUiStrings'
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
): Promise<PreviewExperimentalDiagramCommandResult | null> {
    const diagramHost = host.createDiagramHostAdapter();
    const i18n = host.getUiStrings();
    const actionLabel = host.getActionLabel('preview-artifact', i18n);

    if (host.isBusy()) {
        diagramHost.notify(host.getBusyNotice());
        return null;
    }

    host.startReporterAction(reporter, `${actionLabel}: ${file.name}`);
    reporter.log(`Starting Vega-Lite preview for ${file.name}...`);

    try {
        const fileContent = await host.readFile(file);
        const artifact = previewVegaLiteArtifactFromMarkdown({
            host: diagramHost,
            sourceMarkdown: fileContent,
            sourcePath: file.path
        });

        reporter.updateStatus(host.getActionCompleteText(actionLabel), 100);
        reporter.log(`Vega-Lite preview opened for: ${file.path}`);
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
        reporter.log(`Error during Vega-Lite preview: ${message}`);
        diagramHost.notify(formatI18n(i18n.notices.experimentalDiagramError, { message }));
        host.logError('Vega-Lite preview error:', error);
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
