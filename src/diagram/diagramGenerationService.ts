import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { JsonCanvasRenderer } from '../rendering/renderers/jsonCanvasRenderer';
import { VegaLiteRenderer } from '../rendering/renderers/vegaLiteRenderer';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';
import { DrawioRenderer } from '../rendering/renderers/drawioRenderer';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { CircuitikzRenderer } from '../rendering/renderers/circuitikzRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import { NotemdSettings } from '../types';
import { buildDiagramPlan } from './planner';
import { findDiagramTypeByIntent } from './diagramTypeCatalog';
import { buildDiagramSpecPrompt } from './prompts/diagramSpecPrompt';
import { assertValidDiagramSpec } from './spec';
import { isSupportedRenderTarget } from './types';
import type { DiagramIntent, DiagramNode, DiagramPlan, DiagramSpec, RenderTarget } from './types';
import { parseDiagramSpecResponse } from './diagramSpecResponseParser';
import { resolveCircuitTemplateFromMarkdown } from './adapters/circuitikz/circuitTemplateCatalog';
import { validateDrawnixMindMapSpec } from './adapters/drawnix/drawnixMindMapProjection';
import { enrichDrawnixSourceCoverage } from './adapters/drawnix/drawnixSourceCoverage';
import { hashResolvedSourceVisualManifest, ResolvedSourceVisual } from './sourceVisuals';

export interface DiagramGenerationOptions {
    compatibilityMode: 'best-fit' | 'legacy-mermaid';
    sourcePath?: string;
    targetLanguage?: string;
    requestedIntent?: DiagramIntent;
    requestedRenderTarget?: RenderTarget;
    llmInvoker: (systemPrompt: string, sourceMarkdown: string) => Promise<string>;
    rendererService?: RendererService;
    sourceVisuals?: readonly ResolvedSourceVisual[];
    drawnixExportMermaidCompanions?: boolean;
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
    sourceVisuals?: readonly ResolvedSourceVisual[];
    drawnixExportMermaidCompanions?: boolean;
}

export interface BuildDiagramOperationInputParams {
    sourcePath?: string;
    sourceMarkdown: string;
    executionMode: DiagramOperationExecutionMode;
    settings: Pick<NotemdSettings, 'preferredDiagramIntent' | 'preferredDiagramRenderTarget' | 'experimentalDiagramCompatibilityMode' | 'summarizeToMermaidLanguage' | 'drawnixExportMermaidCompanions'>;
    targetLanguage?: string;
    requestedIntentOverride?: DiagramIntent;
    requestedRenderTargetOverride?: RenderTarget;
    compatibilityModeOverride?: 'best-fit' | 'legacy-mermaid';
    targetLanguageOverride?: string;
}

export function resolveDiagramOperationCompatibilityMode(
    executionMode: DiagramOperationExecutionMode,
    configuredMode: 'best-fit' | 'legacy-mermaid',
    requestedRenderTarget?: RenderTarget
): 'best-fit' | 'legacy-mermaid' {
    if (executionMode === 'save-mermaid') {
        return 'legacy-mermaid';
    }

    if (configuredMode === 'legacy-mermaid' && requestedRenderTarget && requestedRenderTarget !== 'mermaid') {
        return 'best-fit';
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
    if (requestedRenderTarget === 'drawnix' && configuredIntent && configuredIntent !== 'drawnixMindmap') {
        throw new Error('Drawnix source format requires the Drawnix knowledge-map diagram type.');
    }

    const requestedIntent = requestedRenderTarget === 'circuitikz'
        ? 'circuit'
        : requestedRenderTarget === 'drawnix'
        ? 'drawnixMindmap'
        : configuredIntent;

    return {
        sourcePath: params.sourcePath,
        sourceMarkdown: params.sourceMarkdown,
        requestedIntent,
        requestedRenderTarget,
        compatibilityMode: resolveDiagramOperationCompatibilityMode(
            params.executionMode,
            params.compatibilityModeOverride ?? params.settings.experimentalDiagramCompatibilityMode,
            requestedRenderTarget
        ),
        outputMode: params.executionMode === 'save-mermaid' ? 'mermaid' : 'artifact',
        targetLanguage: params.targetLanguageOverride
            ?? params.targetLanguage
            ?? params.settings.summarizeToMermaidLanguage,
        drawnixExportMermaidCompanions: params.settings.drawnixExportMermaidCompanions
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
    'stateDiagram',
    'timeline',
    'swimlane',
    'quadrant'
]);

function normalizeErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function renderWithFallbackTraversal(
    rendererService: RendererService,
    spec: DiagramSpec,
    targets: Array<DiagramPlan['renderTarget']>,
    sourceVisuals?: readonly ResolvedSourceVisual[],
    drawnixExportMermaidCompanions?: boolean
): Promise<Awaited<ReturnType<RendererService['render']>>> {
    const failures: string[] = [];

    for (const target of targets) {
        try {
            const targetSpec = target === 'mermaid' && spec.intent === 'drawnixMindmap'
                ? { ...spec, intent: 'mindmap' as const }
                : spec;
            return await rendererService.render(targetSpec, {
                target,
                sourceVisuals,
                sourceVisualManifestHash: hashResolvedSourceVisualManifest(sourceVisuals),
                drawnixExportMermaidCompanions
            });
        } catch (error) {
            failures.push(`${target}: ${normalizeErrorMessage(error)}`);
        }
    }

    throw new Error(`Diagram rendering failed across targets: ${failures.join(' | ')}`);
}

export function createDefaultDiagramRendererService(): RendererService {
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
    return findDiagramTypeByIntent(intent).defaultTarget;
}

function normalizeDrawnixGenerationOptions(options: DiagramGenerationOptions): DiagramGenerationOptions {
    if (options.requestedRenderTarget !== 'drawnix') {
        return options;
    }
    if (options.requestedIntent && options.requestedIntent !== 'drawnixMindmap') {
        throw new Error('Drawnix source format requires the Drawnix knowledge-map diagram type.');
    }
    return {
        ...options,
        requestedIntent: 'drawnixMindmap'
    };
}

function resolvePromptPreferredIntent(plan: DiagramPlan, requestedIntent?: DiagramIntent): DiagramIntent {
    if (requestedIntent) {
        return requestedIntent;
    }

    return plan.renderTarget === 'circuitikz' ? 'circuit' : plan.intent;
}

function buildGenerationPrompt(
    plan: DiagramPlan,
    options: Pick<DiagramGenerationOptions, 'requestedIntent' | 'targetLanguage' | 'sourcePath'>
): string {
    return buildDiagramSpecPrompt({
        preferredIntent: resolvePromptPreferredIntent(plan, options.requestedIntent),
        requiredIntent: options.requestedIntent,
        preferredChartType: plan.preferredChartType,
        preferredRenderTarget: plan.renderTarget,
        sourcePath: options.sourcePath,
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

function deriveDrawnixNodeId(label: string, fallback: string): string {
    const normalized = label.trim().toLowerCase();
    const asciiPart = normalized
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const nonAsciiPart = Array.from(normalized)
        .filter(character => !/[a-z0-9_-]/.test(character))
        .map(character => character.codePointAt(0)?.toString(16))
        .filter((codePoint): codePoint is string => Boolean(codePoint))
        .join('-');

    return [asciiPart, nonAsciiPart].filter(Boolean).join('-') || fallback;
}

function collectExplicitDrawnixNodeIds(nodes: DiagramNode[], ids: Set<string>): void {
    nodes.forEach(node => {
        const explicitId = node.id?.trim();
        if (explicitId) {
            ids.add(explicitId);
        }
        collectExplicitDrawnixNodeIds(node.children ?? [], ids);
    });
}

function normalizeDrawnixNode(
    node: DiagramNode,
    path: number[],
    reservedIds: Set<string>,
    usedGeneratedIds: Set<string>
): DiagramNode {
    const label = node.label?.trim() || node.id?.trim() || `Untitled ${path.join('-')}`;
    const explicitId = node.id?.trim();
    let id = explicitId || deriveDrawnixNodeId(label, `node-${path.join('-')}`);

    if (!explicitId) {
        const baseId = id;
        let suffix = 2;
        while (reservedIds.has(id) || usedGeneratedIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
        }
        usedGeneratedIds.add(id);
    }

    return {
        ...node,
        id,
        label,
        children: (node.children ?? []).map((child, index) => normalizeDrawnixNode(
            child,
            [...path, index],
            reservedIds,
            usedGeneratedIds
        ))
    };
}

function normalizeDrawnixMindMapNodes(nodes: DiagramNode[]): DiagramNode[] {
    const reservedIds = new Set<string>();
    collectExplicitDrawnixNodeIds(nodes, reservedIds);
    const usedGeneratedIds = new Set<string>();

    return nodes.map((node, index) => normalizeDrawnixNode(
        node,
        [index],
        reservedIds,
        usedGeneratedIds
    ));
}

function mergeSpecDefaults(
    spec: DiagramSpec,
    plan: DiagramPlan,
    requiredIntent?: DiagramIntent
): DiagramSpec {
    // Source coverage diagnostics are renderer-owned and must never be
    // accepted from an LLM response as if they were provenance evidence.
    const llmSpec = { ...spec };
    delete llmSpec.sourceCoverageDiagnostics;
    const resolvedIntent = requiredIntent === 'drawnixMindmap'
        ? 'drawnixMindmap'
        : resolveLegacyCompatibleIntent(spec, plan);
    const normalizedLayoutHints = { ...(spec.layoutHints ?? {}) };

    if (resolvedIntent !== 'dataChart') {
        delete normalizedLayoutHints.chartType;
    } else if (normalizedLayoutHints.chartType === undefined && plan.preferredChartType) {
        normalizedLayoutHints.chartType = plan.preferredChartType;
    }

    const normalizedNodes = resolvedIntent === 'drawnixMindmap'
        ? normalizeDrawnixMindMapNodes(spec.nodes ?? [])
        : (spec.nodes ?? []).map(node => ({
            ...node,
            label: node.label?.trim() || node.id || 'Untitled'
        }));

    return {
        ...llmSpec,
        intent: resolvedIntent,
        title: spec.title?.trim() || 'Generated Diagram',
        nodes: normalizedNodes,
        edges: (spec.edges ?? []).map(edge => ({
            ...edge,
            label: edge.label?.trim() || undefined
        })),
        sections: spec.sections ?? [],
        callouts: spec.callouts ?? [],
        dataSeries: spec.dataSeries ?? [],
        radarSpec: resolvedIntent === 'radar' ? spec.radarSpec : undefined,
        circuitSpec: resolvedIntent === 'circuit' ? spec.circuitSpec : undefined,
        layoutHints: Object.keys(normalizedLayoutHints).length > 0 ? normalizedLayoutHints : undefined,
        evidenceRefs: spec.evidenceRefs ?? []
    };
}

function applyDrawnixSourceCoverage(
    spec: DiagramSpec,
    sourceMarkdown: string,
    sourcePath?: string
): DiagramSpec {
    return spec.intent === 'drawnixMindmap'
        ? enrichDrawnixSourceCoverage(spec, sourceMarkdown, sourcePath)
        : spec;
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
    inputOptions: DiagramGenerationOptions
): Promise<DiagramGenerationResult> {
    const options = normalizeDrawnixGenerationOptions(inputOptions);
    const plan = buildDiagramPlan(markdown, {
        compatibilityMode: options.compatibilityMode,
        requestedIntent: options.requestedIntent,
        requestedRenderTarget: options.requestedRenderTarget
    });

    const prompt = buildGenerationPrompt(plan, options);

    let rawResponse = await options.llmInvoker(prompt, markdown);
    let spec: DiagramSpec;
    try {
        const parsedSpec = parseDiagramSpecResponse(rawResponse);
        spec = applyDrawnixSourceCoverage(
            mergeSpecDefaults(parsedSpec, plan, options.requestedIntent),
            markdown,
            options.sourcePath
        );
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
        try {
            const parsedSpec = parseDiagramSpecResponse(rawResponse);
            spec = applyDrawnixSourceCoverage(
                mergeSpecDefaults(parsedSpec, plan, options.requestedIntent),
                markdown,
                options.sourcePath
            );
            assertValidDiagramSpec(spec);
        } catch (retryValidationError: unknown) {
            const circuitFallback = resolveConstrainedCircuitFallback(markdown, plan, options);
            if (!circuitFallback) {
                throw retryValidationError;
            }
            spec = circuitFallback;
            assertValidDiagramSpec(spec);
        }

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

    const rendererService = options.rendererService ?? createDefaultDiagramRendererService();
    let targets = [plan.renderTarget, ...plan.fallbackTargets]
        .filter((target, index, allTargets) => allTargets.indexOf(target) === index)
        // When user explicitly chose an intent, don't fall back to HTML — let retry handle failures
        .filter(target => !(options.requestedIntent && target === 'html'));

    // A user-selected Drawnix artifact is a strict format contract. Falling back
    // to Mermaid here would return a text artifact while callers still persist
    // the requested Drawnix operation, making the file extension and payload
    // disagree. Keep fallback traversal for best-fit inference, but fail closed
    // when Drawnix was explicitly requested.
    if (options.requestedRenderTarget === 'drawnix' || options.requestedIntent === 'drawnixMindmap') {
        targets = ['drawnix'];
    }

    let artifact: Awaited<ReturnType<RendererService['render']>>;
    let renderError: string | undefined;
    if (plan.renderTarget === 'drawnix') {
        const validationErrors = validateDrawnixMindMapSpec(spec);
        if (validationErrors.length > 0) {
            targets = targets.filter(target => target !== 'drawnix');
            renderError = `Drawnix knowledge-map validation rejected the source artifact: ${validationErrors.join(' ')}`;
        }
    }
    try {
        artifact = await renderWithFallbackTraversal(
            rendererService,
            spec,
            targets,
            options.sourceVisuals,
            options.drawnixExportMermaidCompanions
        );
    } catch (initialRenderFailure: unknown) {
        const errorMsg = normalizeErrorMessage(initialRenderFailure);
        // If Mermaid parse failed, retry once with the LLM asking for valid Mermaid syntax
        if (errorMsg.includes('Mermaid diagram failed validation') || errorMsg.includes('Parse error')) {
            const retryPrompt = buildGenerationPrompt(plan, {
                ...options,
                requestedIntent: options.requestedIntent ?? spec.intent
            }) + `\n\nCRITICAL: Your previous diagram spec rendered invalid Mermaid syntax. The error was: ${errorMsg}. Please regenerate the DiagramSpec with valid, well-formed content. Ensure entity names have no trailing spaces, all braces are properly closed, and the syntax follows standard Mermaid conventions.`;

            const retryResponse = await options.llmInvoker(retryPrompt, markdown);
            const retryParsedSpec = parseDiagramSpecResponse(retryResponse);
            const retrySpec = applyDrawnixSourceCoverage(
                mergeSpecDefaults(retryParsedSpec, plan, options.requestedIntent),
                markdown,
                options.sourcePath
            );
            assertValidDiagramSpec(retrySpec);
            assertPlanCompatibility(retrySpec, plan, options);

            try {
                artifact = await renderWithFallbackTraversal(
                    rendererService,
                    retrySpec,
                    targets,
                    options.sourceVisuals,
                    options.drawnixExportMermaidCompanions
                );
                spec = retrySpec;
            } catch (retryError: unknown) {
                const retryMsg = normalizeErrorMessage(retryError);
                throw new Error(
                    `Mermaid rendering failed after retry: ${retryMsg}. Initial rendering failure: ${errorMsg}`
                );
            }
        } else {
            throw initialRenderFailure;
        }
    }

    return { plan, spec, artifact, renderError };
}
