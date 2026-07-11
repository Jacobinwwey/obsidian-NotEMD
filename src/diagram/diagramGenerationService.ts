import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';
import { DrawioRenderer } from '../rendering/renderers/drawioRenderer';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { CircuitikzRenderer } from '../rendering/renderers/circuitikzRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RenderArtifact } from '../rendering/types';
import { RendererService } from '../rendering/rendererService';
import { NotemdSettings } from '../types';
import { buildDiagramPlan } from './planner';
import { buildDiagramSpecPrompt } from './prompts/diagramSpecPrompt';
import { assertValidDiagramSpec } from './spec';
import { isSupportedRenderTarget } from './types';
import type { DiagramIntent, DiagramPlan, DiagramSpec, RenderTarget } from './types';
import { parseDiagramSpecResponse } from './diagramSpecResponseParser';
import { resolveCircuitTemplateFromMarkdown } from './adapters/circuitikz/circuitTemplateCatalog';

export interface DiagramGenerationOptions {
    compatibilityMode: 'best-fit' | 'legacy-mermaid';
    targetLanguage?: string;
    requestedIntent?: DiagramIntent;
    requestedRenderTarget?: RenderTarget;
    llmInvoker: (systemPrompt: string, sourceMarkdown: string) => Promise<string>;
    rendererService?: RendererService;
}

export type DiagramOperationOutputMode = 'artifact' | 'mermaid';
export type DiagramOperationExecutionMode = 'save-mermaid' | 'save-artifact' | 'preview-artifact';

export interface DiagramOperationInput {
    sourcePath?: string;
    sourceMarkdown: string;
    localKnowledgeContext?: string;
    requestedIntent?: DiagramIntent;
    requestedRenderTarget?: RenderTarget;
    compatibilityMode: 'best-fit' | 'legacy-mermaid';
    outputMode: DiagramOperationOutputMode;
    targetLanguage?: string;
}

export interface BuildDiagramOperationInputParams {
    sourcePath?: string;
    sourceMarkdown: string;
    executionMode: DiagramOperationExecutionMode;
    settings: Pick<NotemdSettings, 'preferredDiagramIntent' | 'preferredDiagramRenderTarget' | 'experimentalDiagramCompatibilityMode' | 'summarizeToMermaidLanguage'>;
    targetLanguage?: string;
    requestedIntentOverride?: DiagramIntent;
    requestedRenderTargetOverride?: RenderTarget;
    compatibilityModeOverride?: 'best-fit' | 'legacy-mermaid';
    targetLanguageOverride?: string;
}

export function resolveDiagramOperationCompatibilityMode(
    executionMode: DiagramOperationExecutionMode,
    configuredMode: 'best-fit' | 'legacy-mermaid'
): 'best-fit' | 'legacy-mermaid' {
    if (executionMode === 'save-mermaid') {
        return 'legacy-mermaid';
    }

    return configuredMode;
}

export function buildDiagramOperationInput(params: BuildDiagramOperationInputParams): DiagramOperationInput {
    const configuredRenderTarget = params.requestedRenderTargetOverride
        ?? params.settings.preferredDiagramRenderTarget;
    const requestedRenderTarget = params.executionMode === 'save-mermaid' || !isSupportedRenderTarget(configuredRenderTarget)
        ? undefined
        : configuredRenderTarget;
    const configuredIntent = params.requestedIntentOverride
        ?? params.settings.preferredDiagramIntent as DiagramIntent | undefined;

    if (requestedRenderTarget === 'circuitikz' && configuredIntent && configuredIntent !== 'circuit') {
        throw new Error('CircuitikZ source format requires the circuit diagram type.');
    }

    const requestedIntent = requestedRenderTarget === 'circuitikz'
        ? 'circuit'
        : configuredIntent;

    return {
        sourcePath: params.sourcePath,
        sourceMarkdown: params.sourceMarkdown,
        requestedIntent,
        requestedRenderTarget,
        compatibilityMode: resolveDiagramOperationCompatibilityMode(
            params.executionMode,
            params.compatibilityModeOverride ?? params.settings.experimentalDiagramCompatibilityMode
        ),
        outputMode: params.executionMode === 'save-mermaid' ? 'mermaid' : 'artifact',
        targetLanguage: params.targetLanguageOverride
            ?? params.targetLanguage
            ?? params.settings.summarizeToMermaidLanguage
    };
}

export interface DiagramGenerationResult {
    plan: DiagramPlan;
    spec: DiagramSpec;
    artifact: Awaited<ReturnType<RendererService['render']>>;
    renderError?: string;
}

const MERMAID_COMPATIBLE_INTENTS = new Set<DiagramIntent>([
    'mindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram'
]);

function normalizeErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function renderWithFallbackTraversal(
    rendererService: RendererService,
    spec: DiagramSpec,
    targets: Array<DiagramPlan['renderTarget']>
): Promise<Awaited<ReturnType<RendererService['render']>>> {
    const failures: string[] = [];

    for (const target of targets) {
        try {
            return await rendererService.render(spec, { target });
        } catch (error) {
            failures.push(`${target}: ${normalizeErrorMessage(error)}`);
        }
    }

    throw new Error(`Diagram rendering failed across targets: ${failures.join(' | ')}`);
}

function createDefaultRendererService(): RendererService {
    return new RendererService(new RendererRegistry([
        new MermaidRenderer(),
        new JsonCanvasRenderer(),
        new VegaLiteRenderer(),
        new EditableHtmlSvgRenderer(),
        new DrawioRenderer(),
        new DrawnixRenderer(),
        new CircuitikzRenderer(),
        new HtmlRenderer()
    ]));
}

function resolveRenderTargetForIntent(intent: DiagramIntent): DiagramPlan['renderTarget'] {
    switch (intent) {
        case 'canvasMap':
            return 'json-canvas';
        case 'dataChart':
            return 'vega-lite';
        case 'circuit':
            return 'circuitikz';
        default:
            return 'mermaid';
    }
}

function resolvePromptPreferredIntent(plan: DiagramPlan, requestedIntent?: DiagramIntent): DiagramIntent {
    if (requestedIntent) {
        return requestedIntent;
    }

    return plan.renderTarget === 'circuitikz' ? 'circuit' : plan.intent;
}

function buildGenerationPrompt(
    plan: DiagramPlan,
    options: Pick<DiagramGenerationOptions, 'requestedIntent' | 'targetLanguage'>
): string {
    return buildDiagramSpecPrompt({
        preferredIntent: resolvePromptPreferredIntent(plan, options.requestedIntent),
        requiredIntent: options.requestedIntent,
        preferredChartType: plan.preferredChartType,
        preferredRenderTarget: plan.renderTarget,
        targetLanguage: options.targetLanguage
    });
}

function resolveLegacyCompatibleIntent(spec: DiagramSpec, plan: DiagramPlan): DiagramIntent {
    const requestedIntent = spec.intent || plan.intent;

    if (!plan.legacyCompatibilityMode || plan.renderTarget !== 'mermaid') {
        return requestedIntent;
    }

    if (MERMAID_COMPATIBLE_INTENTS.has(requestedIntent)) {
        return requestedIntent;
    }

    return plan.mermaidDiagramType === 'flowchart' ? 'flowchart' : 'mindmap';
}

function mergeSpecDefaults(spec: DiagramSpec, plan: DiagramPlan): DiagramSpec {
    const resolvedIntent = resolveLegacyCompatibleIntent(spec, plan);
    const normalizedLayoutHints = { ...(spec.layoutHints ?? {}) };

    if (resolvedIntent !== 'dataChart') {
        delete normalizedLayoutHints.chartType;
    } else if (normalizedLayoutHints.chartType === undefined && plan.preferredChartType) {
        normalizedLayoutHints.chartType = plan.preferredChartType;
    }

    return {
        ...spec,
        intent: resolvedIntent,
        title: spec.title?.trim() || 'Generated Diagram',
        nodes: (spec.nodes ?? []).map(node => ({
            ...node,
            label: node.label?.trim() || node.id || 'Untitled'
        })),
        edges: (spec.edges ?? []).map(edge => ({
            ...edge,
            label: edge.label?.trim() || undefined
        })),
        sections: spec.sections ?? [],
        callouts: spec.callouts ?? [],
        dataSeries: spec.dataSeries ?? [],
        circuitSpec: resolvedIntent === 'circuit' ? spec.circuitSpec : undefined,
        layoutHints: Object.keys(normalizedLayoutHints).length > 0 ? normalizedLayoutHints : undefined,
        evidenceRefs: spec.evidenceRefs ?? []
    };
}

function assertPlanCompatibility(
    spec: DiagramSpec,
    plan: DiagramPlan,
    options: Pick<DiagramGenerationOptions, 'compatibilityMode' | 'requestedIntent' | 'requestedRenderTarget'>
): void {
    if (options.requestedIntent && spec.intent !== options.requestedIntent) {
        throw new Error(
            `Diagram spec intent "${spec.intent}" does not match requested intent "${options.requestedIntent}".`
        );
    }

    const explicitRenderTarget = Boolean(options.requestedRenderTarget && options.compatibilityMode !== 'legacy-mermaid');
    const specTarget = resolveRenderTargetForIntent(spec.intent);
    if (!explicitRenderTarget && specTarget !== plan.renderTarget) {
        throw new Error(
            `Diagram spec intent "${spec.intent}" does not match planner route `
            + `"${plan.intent}" targeting "${plan.renderTarget}".`
        );
    }
}

function resolveConstrainedCircuitFallback(
    markdown: string,
    plan: DiagramPlan,
    options: Pick<DiagramGenerationOptions, 'compatibilityMode' | 'requestedIntent'>
): DiagramSpec | null {
    if (
        options.compatibilityMode !== 'best-fit'
        || options.requestedIntent !== 'circuit'
        || plan.renderTarget !== 'circuitikz'
    ) {
        return null;
    }

    const circuitSpec = resolveCircuitTemplateFromMarkdown(markdown);
    if (!circuitSpec) {
        return null;
    }

    return {
        intent: 'circuit',
        title: circuitSpec.title,
        summary: `Constrained ${circuitSpec.circuitKind} golden-template fallback.`,
        nodes: [],
        edges: [],
        sections: [],
        callouts: [],
        dataSeries: [],
        circuitSpec,
        evidenceRefs: []
    };
}

export async function generateDiagramArtifact(
    markdown: string,
    options: DiagramGenerationOptions
): Promise<DiagramGenerationResult> {
    const plan = buildDiagramPlan(markdown, {
        compatibilityMode: options.compatibilityMode,
        requestedIntent: options.requestedIntent,
        requestedRenderTarget: options.requestedRenderTarget
    });

    const prompt = buildGenerationPrompt(plan, options);

    let rawResponse = await options.llmInvoker(prompt, markdown);
    let parsedSpec = parseDiagramSpecResponse(rawResponse);
    let spec = mergeSpecDefaults(parsedSpec, plan);
    try {
        assertValidDiagramSpec(spec);
    } catch (validationError: unknown) {
        const circuitFallback = resolveConstrainedCircuitFallback(markdown, plan, options);
        if (!circuitFallback) {
            throw validationError;
        }
        spec = circuitFallback;
        assertValidDiagramSpec(spec);
    }

    // If user requested a specific intent and LLM returned a different one, retry with stronger prompt
    if (options.requestedIntent && spec.intent !== options.requestedIntent) {
        const retryPrompt = buildGenerationPrompt(plan, options)
            + `\n\nCRITICAL: Your previous response used intent "${spec.intent}" but the required intent is "${options.requestedIntent}". This is incorrect. You MUST use "${options.requestedIntent}" as the diagram intent. Do not choose any other intent. Regenerate the DiagramSpec with the correct intent.`;

        rawResponse = await options.llmInvoker(retryPrompt, markdown);
        parsedSpec = parseDiagramSpecResponse(rawResponse);
        spec = mergeSpecDefaults(parsedSpec, plan);
        assertValidDiagramSpec(spec);

        if (spec.intent !== options.requestedIntent) {
            const circuitFallback = resolveConstrainedCircuitFallback(markdown, plan, options);
            if (circuitFallback) {
                spec = circuitFallback;
                assertValidDiagramSpec(spec);
            }
        }

        assertPlanCompatibility(spec, plan, options);
    }

    assertPlanCompatibility(spec, plan, options);

    const rendererService = options.rendererService ?? createDefaultRendererService();
    const targets = [plan.renderTarget, ...plan.fallbackTargets]
        .filter((target, index, allTargets) => allTargets.indexOf(target) === index)
        // When user explicitly chose an intent, don't fall back to HTML — let retry handle failures
        .filter(target => !(options.requestedIntent && target === 'html'));

    let artifact: Awaited<ReturnType<RendererService['render']>>;
    let renderError: string | undefined;
    try {
        artifact = await renderWithFallbackTraversal(rendererService, spec, targets);
    } catch (renderError: unknown) {
        const errorMsg = renderError instanceof Error ? renderError.message : String(renderError);
        // If Mermaid parse failed, retry once with the LLM asking for valid Mermaid syntax
        if (errorMsg.includes('Mermaid diagram failed validation') || errorMsg.includes('Parse error')) {
            const retryPrompt = buildGenerationPrompt(plan, {
                ...options,
                requestedIntent: options.requestedIntent ?? spec.intent
            }) + `\n\nCRITICAL: Your previous diagram spec rendered invalid Mermaid syntax. The error was: ${errorMsg}. Please regenerate the DiagramSpec with valid, well-formed content. Ensure entity names have no trailing spaces, all braces are properly closed, and the syntax follows standard Mermaid conventions.`;

            const retryResponse = await options.llmInvoker(retryPrompt, markdown);
            const retryParsedSpec = parseDiagramSpecResponse(retryResponse);
            const retrySpec = mergeSpecDefaults(retryParsedSpec, plan);
            assertValidDiagramSpec(retrySpec);
            assertPlanCompatibility(retrySpec, plan, options);

            try {
                artifact = await renderWithFallbackTraversal(rendererService, retrySpec, targets);
            } catch (retryError: unknown) {
                const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
                const rawMermaid = spec.nodes?.length
                    ? `\`\`\`mermaid\\n${spec.intent}\\n${spec.nodes.map((n: any) => `    ${n.id}[${n.label || n.id}]`).join('\\n')}\\n\`\`\``
                    : `// ${retryMsg}`;
                artifact = {
                    target: plan.renderTarget as any,
                    content: rawMermaid,
                    mimeType: 'text/vnd.mermaid' as const,
                    sourceIntent: spec.intent
                };
                renderError = `Mermaid rendering failed after retry: ${retryMsg}. The diagram may need manual fixing.`;
            }
        } else {
            throw renderError;
        }
    }

    return { plan, spec, artifact, renderError };
}
