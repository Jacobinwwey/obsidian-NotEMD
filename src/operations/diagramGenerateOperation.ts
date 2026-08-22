import {
    DiagramGenerationResult,
    DiagramOperationInput,
    generateDiagramArtifact
} from '../diagram/diagramGenerationService';
import { DiagramIntent } from '../diagram/types';
import { callLLM } from '../llmUtils';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

// This bounds provider availability, not diagram complexity or artifact size.
export const DIAGRAM_LLM_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

class DiagramLlmRequestDeadline {
    private readonly controller = new AbortController();
    private readonly timer: ReturnType<typeof setTimeout>;
    private timedOut = false;

    constructor(private readonly reporter: ProgressReporter) {
        this.reporter.abortController = this.controller;
        this.timer = setTimeout(() => {
            this.timedOut = true;
            this.reporter.log('Diagram generation request reached its deadline and was cancelled.');
            this.controller.abort();
        }, DIAGRAM_LLM_REQUEST_TIMEOUT_MS);
    }

    async invoke<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
        try {
            const result = await request(this.controller.signal);
            if (this.timedOut) {
                throw this.createTimeoutError();
            }
            return result;
        } catch (error: unknown) {
            if (this.timedOut) {
                throw this.createTimeoutError();
            }
            throw error;
        }
    }

    wasCancelled(): boolean {
        return this.controller.signal.aborted;
    }

    dispose(): void {
        clearTimeout(this.timer);
        if (this.reporter.abortController === this.controller) {
            this.reporter.abortController = null;
        }
    }

    private createTimeoutError(): Error {
        return new Error(
            `Diagram generation timed out after ${DIAGRAM_LLM_REQUEST_TIMEOUT_MS / 60_000} minutes. `
            + 'The request was cancelled so Notemd is ready for another task.'
        );
    }
}

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

function buildSourceMarkdownForDiagramGeneration(input: DiagramOperationInput): string {
    if (!input.localKnowledgeContext?.trim()) {
        return input.sourceMarkdown;
    }

    return [
        input.sourceMarkdown.trim(),
        '---',
        'Additional Local Knowledge Context (supporting reference only; keep the primary structure faithful to the source note):',
        input.localKnowledgeContext.trim()
    ].join('\n\n');
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
    const sourceMarkdownForGeneration = buildSourceMarkdownForDiagramGeneration(input);
    const requestDeadline = new DiagramLlmRequestDeadline(reporter);
    const invokeDiagramLlm = (systemPrompt: string, sourceMarkdown: string) => requestDeadline.invoke(
        signal => llmCall(provider, systemPrompt, sourceMarkdown, settings, reporter, modelName, signal)
    );

    try {
        if (input.outputMode === 'mermaid' && !settings.enableExperimentalDiagramPipeline) {
            const mermaidContent = await invokeDiagramLlm(
                params.getLegacyMermaidPrompt(),
                sourceMarkdownForGeneration
            );
            return buildLegacyMermaidResult(input, mermaidContent, 'legacy mermaid compatibility path');
        }

        reporter.log(`Generating diagram operation in ${input.outputMode} mode.`);

        try {
            if (input.outputMode === 'mermaid' && settings.experimentalDiagramCompatibilityMode !== input.compatibilityMode) {
                reporter.log('Mermaid command pins experimental compatibility mode to legacy-mermaid to guarantee Mermaid output.');
            }

            return await runStructuredGeneration(sourceMarkdownForGeneration, {
                sourcePath: input.sourcePath,
                requestedIntent: input.requestedIntent,
                requestedVariant: input.requestedVariant,
                requestedRenderTarget: input.requestedRenderTarget,
                compatibilityMode: input.compatibilityMode,
                targetLanguage: input.targetLanguage,
                sourceVisuals: input.sourceVisuals,
                drawnixExportMermaidCompanions: input.drawnixExportMermaidCompanions,
                llmInvoker: invokeDiagramLlm
            });
        } catch (error: unknown) {
            if (input.outputMode !== 'mermaid' || requestDeadline.wasCancelled()) {
                throw error;
            }

            const message = error instanceof Error ? error.message : String(error);
            reporter.log(`Experimental diagram pipeline failed: ${message}`);
            reporter.log('Falling back to legacy Mermaid prompt and fixer pipeline.');
            const mermaidContent = await invokeDiagramLlm(
                params.getLegacyMermaidPrompt(),
                sourceMarkdownForGeneration
            );
            return buildLegacyMermaidResult(input, mermaidContent, 'legacy mermaid fallback path');
        }
    } finally {
        requestDeadline.dispose();
    }
}
