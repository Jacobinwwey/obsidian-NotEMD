import {
    DiagramGenerationResult,
    DiagramOperationInput,
    generateDiagramArtifact
} from '../diagram/diagramGenerationService';
import { DiagramIntent } from '../diagram/types';
import { callLLM } from '../llmUtils';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

export interface RunDiagramGenerateOperationParams {
    input: DiagramOperationInput;
    settings: NotemdSettings;
    provider: LLMProviderConfig;
    modelName: string;
    reporter: ProgressReporter;
    getLegacyMermaidPrompt: () => string;
    callLLMImpl?: typeof callLLM;
    generateDiagramArtifactImpl?: typeof generateDiagramArtifact;
}

function buildLegacyMermaidResult(
    input: DiagramOperationInput,
    mermaidContent: string,
    reason: string
): DiagramGenerationResult {
    return {
        plan: {
            intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
            confidence: 1,
            reasons: [reason],
            renderTarget: 'mermaid',
            fallbackTargets: [],
            mermaidDiagramType: null,
            legacyCompatibilityMode: true
        },
        spec: {
            intent: (input.requestedIntent || 'mindmap') as DiagramIntent,
            title: input.sourcePath || 'Generated Diagram',
            nodes: []
        },
        artifact: {
            target: 'mermaid',
            content: mermaidContent,
            mimeType: 'text/vnd.mermaid',
            sourceIntent: (input.requestedIntent || 'mindmap') as DiagramIntent
        },
        renderError: undefined
    };
}

export async function runDiagramGenerateOperation(
    params: RunDiagramGenerateOperationParams
): Promise<DiagramGenerationResult> {
    const {
        input,
        settings,
        provider,
        modelName,
        reporter
    } = params;
    const llmCall = params.callLLMImpl ?? callLLM;
    const runStructuredGeneration = params.generateDiagramArtifactImpl ?? generateDiagramArtifact;

    if (input.outputMode === 'mermaid' && !settings.enableExperimentalDiagramPipeline) {
        const mermaidContent = await llmCall(
            provider,
            params.getLegacyMermaidPrompt(),
            input.sourceMarkdown,
            settings,
            reporter,
            modelName
        );
        return buildLegacyMermaidResult(input, mermaidContent, 'legacy mermaid compatibility path');
    }

    reporter.log(`Generating diagram operation in ${input.outputMode} mode.`);

    try {
        if (input.outputMode === 'mermaid' && settings.experimentalDiagramCompatibilityMode !== input.compatibilityMode) {
            reporter.log('Mermaid command pins experimental compatibility mode to legacy-mermaid to guarantee Mermaid output.');
        }

        return await runStructuredGeneration(input.sourceMarkdown, {
            requestedIntent: input.requestedIntent,
            compatibilityMode: input.compatibilityMode,
            targetLanguage: input.targetLanguage,
            llmInvoker: (systemPrompt, sourceMarkdown) =>
                llmCall(provider, systemPrompt, sourceMarkdown, settings, reporter, modelName)
        });
    } catch (error: unknown) {
        if (input.outputMode !== 'mermaid') {
            throw error;
        }

        const message = error instanceof Error ? error.message : String(error);
        reporter.log(`Experimental diagram pipeline failed: ${message}`);
        reporter.log('Falling back to legacy Mermaid prompt and fixer pipeline.');
        const mermaidContent = await llmCall(
            provider,
            params.getLegacyMermaidPrompt(),
            input.sourceMarkdown,
            settings,
            reporter,
            modelName
        );
        return buildLegacyMermaidResult(input, mermaidContent, 'legacy mermaid fallback path');
    }
}
