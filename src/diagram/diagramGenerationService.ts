import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import { buildDiagramPlan } from './planner';
import { buildDiagramSpecPrompt } from './prompts/diagramSpecPrompt';
import { assertValidDiagramSpec } from './spec';
import { DiagramIntent, DiagramPlan, DiagramSpec } from './types';
import { parseDiagramSpecResponse } from './diagramSpecResponseParser';

export interface DiagramGenerationOptions {
    compatibilityMode: 'best-fit' | 'legacy-mermaid';
    targetLanguage?: string;
    requestedIntent?: DiagramIntent;
    llmInvoker: (systemPrompt: string, sourceMarkdown: string) => Promise<string>;
    rendererService?: RendererService;
}

export interface DiagramGenerationResult {
    plan: DiagramPlan;
    spec: DiagramSpec;
    artifact: Awaited<ReturnType<RendererService['render']>>;
}

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
        new HtmlRenderer()
    ]));
}

function resolveRenderTargetForIntent(intent: DiagramIntent): DiagramPlan['renderTarget'] {
    switch (intent) {
        case 'canvasMap':
            return 'json-canvas';
        case 'dataChart':
            return 'vega-lite';
        default:
            return 'mermaid';
    }
}

function resolveLegacyCompatibleIntent(spec: DiagramSpec, plan: DiagramPlan): DiagramIntent {
    const requestedIntent = spec.intent || plan.intent;

    if (!plan.legacyCompatibilityMode || plan.renderTarget !== 'mermaid') {
        return requestedIntent;
    }

    if (requestedIntent === 'mindmap' || requestedIntent === 'flowchart') {
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
        nodes: spec.nodes ?? [],
        edges: spec.edges ?? [],
        sections: spec.sections ?? [],
        callouts: spec.callouts ?? [],
        dataSeries: spec.dataSeries ?? [],
        layoutHints: Object.keys(normalizedLayoutHints).length > 0 ? normalizedLayoutHints : undefined,
        evidenceRefs: spec.evidenceRefs ?? []
    };
}

function assertPlanCompatibility(
    spec: DiagramSpec,
    plan: DiagramPlan,
    options: Pick<DiagramGenerationOptions, 'compatibilityMode' | 'requestedIntent'>
): void {
    if (options.requestedIntent && spec.intent !== options.requestedIntent) {
        throw new Error(
            `Diagram spec intent "${spec.intent}" does not match requested intent "${options.requestedIntent}".`
        );
    }

    const specTarget = resolveRenderTargetForIntent(spec.intent);
    if (specTarget !== plan.renderTarget) {
        throw new Error(
            `Diagram spec intent "${spec.intent}" does not match planner route `
            + `"${plan.intent}" targeting "${plan.renderTarget}".`
        );
    }
}

export async function generateDiagramArtifact(
    markdown: string,
    options: DiagramGenerationOptions
): Promise<DiagramGenerationResult> {
    const plan = buildDiagramPlan(markdown, {
        compatibilityMode: options.compatibilityMode,
        requestedIntent: options.requestedIntent
    });

    const prompt = buildDiagramSpecPrompt({
        preferredIntent: plan.intent,
        requiredIntent: options.requestedIntent,
        preferredChartType: plan.preferredChartType,
        targetLanguage: options.targetLanguage
    });

    let rawResponse = await options.llmInvoker(prompt, markdown);
    let parsedSpec = parseDiagramSpecResponse(rawResponse);
    let spec = mergeSpecDefaults(parsedSpec, plan);
    assertValidDiagramSpec(spec);

    // If user requested a specific intent and LLM returned a different one, retry with stronger prompt
    if (options.requestedIntent && spec.intent !== options.requestedIntent) {
        const retryPrompt = buildDiagramSpecPrompt({
            preferredIntent: plan.intent,
            requiredIntent: options.requestedIntent,
            preferredChartType: plan.preferredChartType,
            targetLanguage: options.targetLanguage
        }) + `\n\nCRITICAL: Your previous response used intent "${spec.intent}" but the required intent is "${options.requestedIntent}". This is incorrect. You MUST use "${options.requestedIntent}" as the diagram intent. Do not choose any other intent. Regenerate the DiagramSpec with the correct intent.`;

        rawResponse = await options.llmInvoker(retryPrompt, markdown);
        parsedSpec = parseDiagramSpecResponse(rawResponse);
        spec = mergeSpecDefaults(parsedSpec, plan);
        assertValidDiagramSpec(spec);
        assertPlanCompatibility(spec, plan, options);
    }

    assertPlanCompatibility(spec, plan, options);

    const rendererService = options.rendererService ?? createDefaultRendererService();
    const targets = [plan.renderTarget, ...plan.fallbackTargets]
        .filter((target, index, allTargets) => allTargets.indexOf(target) === index);
    const artifact = await renderWithFallbackTraversal(rendererService, spec, targets);
    return { plan, spec, artifact };
}
