import { TFile } from 'obsidian';
import { DiagramOperationInput } from '../diagram/diagramGenerationService';
import { runDiagramGenerateOperation } from './diagramGenerateOperation';
import {
    completeArtifactDiagramCommand,
    completeMermaidDiagramCommand,
    DiagramCommandExecutionDetails,
    DiagramCommandExecutionMode,
    DiagramCommandHostAdapter,
    DiagramCommandUiStrings
} from './diagramCommandHostAdapter';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

export interface DiagramCommandExecutionHost {
    getSettings: () => NotemdSettings;
    getLegacyMermaidPrompt: () => string;
    createDiagramHostAdapter: () => DiagramCommandHostAdapter;
    getStepStatusText: (current: number, total: number, label: string) => string;
    getActionCompleteText: (label: string) => string;
}

export interface RunSaveMermaidDiagramExecutionParams {
    file: TFile;
    operationInput: DiagramOperationInput;
    provider: LLMProviderConfig;
    modelName: string;
    reporter: ProgressReporter;
    actionLabel: string;
    i18n: DiagramCommandUiStrings;
}

export interface RunArtifactDiagramExecutionParams extends RunSaveMermaidDiagramExecutionParams {
    executionMode: Extract<DiagramCommandExecutionMode, 'save-artifact' | 'preview-artifact'>;
}

export async function runSaveMermaidDiagramExecutionWithHost(
    host: DiagramCommandExecutionHost,
    params: RunSaveMermaidDiagramExecutionParams
): Promise<DiagramCommandExecutionDetails> {
    const settings = host.getSettings();
    const diagramHost = host.createDiagramHostAdapter();

    params.reporter.updateStatus(host.getStepStatusText(1, 3, params.actionLabel), 20);

    const result = await runDiagramGenerateOperation({
        input: params.operationInput,
        settings,
        provider: params.provider,
        modelName: params.modelName,
        reporter: params.reporter,
        getLegacyMermaidPrompt: host.getLegacyMermaidPrompt
    });

    const outputPath = await completeMermaidDiagramCommand({
        host: diagramHost,
        file: params.file,
        reporter: params.reporter,
        mermaidContent: result.artifact.content,
        actionLabel: params.actionLabel,
        completeNotice: params.i18n.notices.mermaidSummarizationComplete,
        autoFixAfterGenerate: settings.autoMermaidFixAfterGenerate,
        getStepStatusText: host.getStepStatusText,
        getActionCompleteText: host.getActionCompleteText
    });

    return {
        generation: result,
        followThrough: {
            kind: 'save-mermaid',
            outputPath,
            previewOpened: false,
            autoFixAttempted: settings.autoMermaidFixAfterGenerate,
            artifactTarget: result.artifact.target
        },
        outputPath,
        previewOpened: false
    };
}

export async function runArtifactDiagramExecutionWithHost(
    host: DiagramCommandExecutionHost,
    params: RunArtifactDiagramExecutionParams
): Promise<DiagramCommandExecutionDetails> {
    const settings = host.getSettings();
    const diagramHost = host.createDiagramHostAdapter();
    const totalSteps = params.executionMode === 'preview-artifact' ? 2 : 3;
    const initialProgress = params.executionMode === 'preview-artifact' ? 25 : 20;

    params.reporter.updateStatus(host.getStepStatusText(1, totalSteps, params.actionLabel), initialProgress);

    const result = await runDiagramGenerateOperation({
        input: params.operationInput,
        settings,
        provider: params.provider,
        modelName: params.modelName,
        reporter: params.reporter,
        getLegacyMermaidPrompt: host.getLegacyMermaidPrompt
    });

    const outputPath = await completeArtifactDiagramCommand({
        host: diagramHost,
        file: params.file,
        reporter: params.reporter,
        result,
        actionLabel: params.actionLabel,
        executionMode: params.executionMode,
        completeNotice: params.i18n.notices.experimentalDiagramComplete,
        previewReadyNotice: params.i18n.notices.experimentalDiagramPreviewReady,
        manualFixHintNotice: params.i18n.notices.experimentalDiagramManualFixHint,
        autoFixAfterGenerate: settings.autoMermaidFixAfterGenerate,
        getStepStatusText: host.getStepStatusText,
        getActionCompleteText: host.getActionCompleteText
    });

    const previewOpened = params.executionMode === 'preview-artifact' || diagramHost.supportsPreview(result.artifact);
    const autoFixAttempted =
        params.executionMode === 'save-artifact'
        && result.artifact.target === 'mermaid'
        && settings.autoMermaidFixAfterGenerate;

    return {
        generation: result,
        followThrough: {
            kind: params.executionMode,
            outputPath,
            previewOpened,
            autoFixAttempted,
            artifactTarget: result.artifact.target
        },
        outputPath,
        previewOpened
    };
}
