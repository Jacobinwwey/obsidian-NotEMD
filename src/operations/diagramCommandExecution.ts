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
import { LocalKnowledgeRetrievalSummary } from '../localKnowledgeBase';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';
import { formatI18n, getI18nStrings } from '../i18n';

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
    localKnowledgeContextUsed: boolean;
    localKnowledgeRetrieval: LocalKnowledgeRetrievalSummary;
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
        localKnowledgeContextUsed: params.localKnowledgeContextUsed,
        localKnowledgeRetrieval: params.localKnowledgeRetrieval,
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

    if (params.operationInput.requestedOutputs !== undefined && params.executionMode === 'preview-artifact') {
        diagramHost.openPreview(result.artifact, params.file.path, false, undefined, {
            sourcePath: params.file.path, generation: result, requestedOutputs: [...params.operationInput.requestedOutputs], ppi: params.operationInput.exportPpi ?? 300, outputFolder: params.operationInput.exportFolder
        });
        params.reporter.updateStatus(host.getActionCompleteText(params.actionLabel), 100);
        diagramHost.notify(params.i18n.notices.experimentalDiagramPreviewReady);
        return {
            generation: result,
            followThrough: { kind: params.executionMode, previewOpened: true, autoFixAttempted: false, artifactTarget: result.artifact.target },
            localKnowledgeContextUsed: params.localKnowledgeContextUsed, localKnowledgeRetrieval: params.localKnowledgeRetrieval, previewOpened: true
        };
    }
    if (params.operationInput.requestedOutputs !== undefined && params.executionMode === 'save-artifact') {
        if (!diagramHost.exportOutputs) throw new Error('Diagram multi-format export is unavailable in this host.');
        const exportRun = await diagramHost.exportOutputs(params.file, result, params.operationInput, params.reporter);
        const saved = exportRun.outputs.filter(output => output.status === 'completed');
        const outputPath = saved.find(output => output.id.startsWith('source:'))?.path ?? saved[0]?.path;
        const copy = getI18nStrings(settings).diagramOutputs;
        const status = formatI18n(copy.runStatus, { status: copy[exportRun.status], count: saved.length, total: exportRun.outputs.length });
        params.reporter.updateStatus(status, 100);
        params.reporter.log(status);
        params.reporter.log(exportRun.manifestPath);
        if (exportRun.plan.usedDefaultOutput) params.reporter.log(copy.fallback);
        if (exportRun.plan.inactiveOutputs.length) params.reporter.log(formatI18n(copy.inactive, { outputs: exportRun.plan.inactiveOutputs.map(output => output.id).join(', ') }));
        diagramHost.notify(status);
        const previewOpened = !params.reporter.cancelled && diagramHost.supportsPreview(result.artifact);
        if (previewOpened) diagramHost.openPreview(result.artifact, params.file.path, Boolean(saved.some(output => output.id.startsWith('source:'))), exportRun);
        return {
            generation: result,
            followThrough: { kind: params.executionMode, outputPath, previewOpened, autoFixAttempted: false, artifactTarget: result.artifact.target, exportRun },
            localKnowledgeContextUsed: params.localKnowledgeContextUsed,
            localKnowledgeRetrieval: params.localKnowledgeRetrieval,
            outputPath, previewOpened
        };
    }

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
        localKnowledgeContextUsed: params.localKnowledgeContextUsed,
        localKnowledgeRetrieval: params.localKnowledgeRetrieval,
        outputPath,
        previewOpened
    };
}
