import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
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

function createDefaultRendererService(): RendererService {
    return new RendererService(new RendererRegistry([
        new MermaidRenderer(),
        new JsonCanvasRenderer(),
        new VegaLiteRenderer()
    ]));
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
    return {
        ...spec,
        intent: resolveLegacyCompatibleIntent(spec, plan),
        title: spec.title?.trim() || 'Generated Diagram',
        nodes: spec.nodes ?? [],
        edges: spec.edges ?? [],
        sections: spec.sections ?? [],
        callouts: spec.callouts ?? [],
        dataSeries: spec.dataSeries ?? [],
        evidenceRefs: spec.evidenceRefs ?? []
    };
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
        targetLanguage: options.targetLanguage
    });

    const rawResponse = await options.llmInvoker(prompt, markdown);
    const parsedSpec = parseDiagramSpecResponse(rawResponse);
    const spec = mergeSpecDefaults(parsedSpec, plan);
    assertValidDiagramSpec(spec);

    const rendererService = options.rendererService ?? createDefaultRendererService();

    try {
        const artifact = await rendererService.render(spec, { target: plan.renderTarget });
        return { plan, spec, artifact };
    } catch (error) {
        for (const fallbackTarget of plan.fallbackTargets) {
            const artifact = await rendererService.render(spec, { target: fallbackTarget });
            return { plan, spec, artifact };
        }
        throw error;
    }
}
