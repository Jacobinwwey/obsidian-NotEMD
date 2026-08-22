import type {
    DiagramIntent,
    DiagramIntentResult,
    DiagramPlan,
    DiagramPlanOptions,
    MermaidDiagramType,
    RenderTarget
} from './types';
import type { SupportedVegaLiteChartType } from './adapters/vega/schema';
import { findDefaultDiagramType, findDiagramType } from './diagramTypeCatalog';
import { inferDiagramIntent } from './intent';

function resolveRequestedRenderTarget(
    intent: DiagramIntent,
    requestedTarget: RenderTarget | undefined,
    defaultTarget: RenderTarget,
    variant?: string
): RenderTarget {
    if (!requestedTarget) {
        return defaultTarget;
    }

    const definition = variant === undefined
        ? findDefaultDiagramType(intent)
        : findDiagramType(intent, variant);
    if (definition.compatibleTargets.includes(requestedTarget)) {
        return requestedTarget;
    }

    throw new Error(
        `Render target "${requestedTarget}" is not compatible with diagram intent "${intent}". `
        + `Supported targets: ${definition.compatibleTargets.join(', ')}.`
    );
}

function resolveMermaidDiagramType(intent: DiagramIntent): MermaidDiagramType | null {
    switch (intent) {
        case 'mindmap':
        case 'drawnixMindmap':
            return 'mindmap';
        case 'flowchart':
            return 'flowchart';
        case 'sequence':
            return 'sequenceDiagram';
        case 'classDiagram':
            return 'classDiagram';
        case 'erDiagram':
            return 'erDiagram';
        case 'stateDiagram':
            return 'stateDiagram-v2';
        case 'timeline':
            return 'timeline';
        case 'quadrant':
            return 'quadrantChart';
        case 'orgChart':
            return 'flowchart';
        case 'swimlane':
            return 'flowchart';
        default:
            return null;
    }
}

function resolveFallbackTargets(
    compatibilityMode: 'best-fit' | 'legacy-mermaid',
    primaryTarget: RenderTarget,
    defaultTarget: RenderTarget,
    preferredMermaidType: MermaidDiagramType | null
): RenderTarget[] {
    if (compatibilityMode === 'legacy-mermaid') {
        return [];
    }

    if (primaryTarget === 'circuitikz') {
        return [];
    }

    if (primaryTarget === 'drawnix') {
        return ['mermaid', 'html'];
    }

    const fallbackTargets: RenderTarget[] = [];

    if (primaryTarget !== defaultTarget) {
        fallbackTargets.push(defaultTarget);
    }

    if (primaryTarget !== 'mermaid' && defaultTarget !== 'mermaid' && preferredMermaidType) {
        fallbackTargets.push('mermaid');
    }

    if (primaryTarget !== 'html') {
        fallbackTargets.push('html');
    }

    return fallbackTargets.filter((target, index, allTargets) =>
        target !== primaryTarget && allTargets.indexOf(target) === index
    );
}

function inferPreferredChartType(markdown: string, intent: DiagramIntent): SupportedVegaLiteChartType | undefined {
    if (intent !== 'dataChart') {
        return undefined;
    }

    const normalized = markdown.toLowerCase();

    if (/\bvs\.?\b|\bversus\b|\bcorrelation\b|\bscatter\b|\bthroughput\b|\blatency\b/.test(normalized)) {
        return 'scatter';
    }

    if (/%/.test(normalized) || /\bshare\b|\bmix\b|\bbreakdown\b|\bcomposition\b|\bportion\b|\bdistribution\b/.test(normalized)) {
        return 'pie';
    }

    if (/\btop\b|\brank(?:ed|ing)?\b|\bleaderboard\b|\bissue(?:s)?\b/.test(normalized)) {
        return 'table';
    }

    if (/\bday\b|\bdaily\b|\bweek\b|\bweekly\b|\bmonth\b|\bmonthly\b|\bquarter\b|\bquarterly\b|\byear\b|\byearly\b|\btrend\b|\bover time\b/.test(normalized)) {
        return 'line';
    }

    return 'bar';
}

function buildIntentResult(markdown: string, requestedIntent?: DiagramIntent): DiagramIntentResult {
    if (!requestedIntent) {
        return inferDiagramIntent(markdown);
    }

    return {
        intent: requestedIntent,
        confidence: 0.95,
        reasons: ['explicit intent requested']
    };
}

function resolveChartVariant(variant: string | undefined): SupportedVegaLiteChartType | undefined {
    return variant === 'bar' || variant === 'line' || variant === 'scatter'
        ? variant
        : undefined;
}

const NATIVE_ONLY_LEGACY_OVERRIDE_INTENTS = new Set<DiagramIntent>([
    'drawnixMindmap',
    'canvasMap',
    'circuit',
    'radar',
    'architecture',
    'currentState',
    'integrationTopology',
    'dataFlow',
    'accessMatrix',
    'gantt',
    'layerStack',
    'setOverlap',
    'rankedFunnel',
    'loop',
    'nested',
    'tree',
    'process',
    'medallion',
    'highLevel'
]);

export function buildDiagramPlan(markdown: string, options: DiagramPlanOptions = {}): DiagramPlan {
    const inferred = buildIntentResult(markdown, options.requestedIntent);
    const selectedType = options.requestedVariant === undefined
        ? findDefaultDiagramType(inferred.intent)
        : findDiagramType(inferred.intent, options.requestedVariant);
    const defaultTarget = selectedType.defaultTarget;
    const preferredMermaidType = resolveMermaidDiagramType(inferred.intent);
    // Native-only intents must not be forced through a Mermaid mindmap when
    // the global preference remains legacy-mermaid. Existing dataChart keeps
    // its historical Mermaid escape hatch; only explicitly native-only
    // intents strengthen the compatibility contract.
    const compatibilityMode = options.compatibilityMode === 'legacy-mermaid'
        && options.requestedIntent
        && (NATIVE_ONLY_LEGACY_OVERRIDE_INTENTS.has(options.requestedIntent)
            || options.requestedVariant !== undefined)
        ? 'best-fit'
        : options.compatibilityMode ?? 'best-fit';
    const preferredChartType = resolveChartVariant(options.requestedVariant)
        ?? inferPreferredChartType(markdown, inferred.intent);
    const preferredTarget = compatibilityMode === 'legacy-mermaid'
        ? 'mermaid'
        : resolveRequestedRenderTarget(
            inferred.intent,
            options.requestedRenderTarget,
            defaultTarget,
            options.requestedVariant
        );
    const fallbackTargets = resolveFallbackTargets(
        compatibilityMode,
        preferredTarget,
        defaultTarget,
        preferredMermaidType
    );

    if (compatibilityMode === 'legacy-mermaid') {
        return {
            intent: inferred.intent,
            confidence: inferred.confidence,
            reasons: inferred.reasons,
            renderTarget: 'mermaid',
            fallbackTargets,
            preferredChartType,
            mermaidDiagramType: preferredMermaidType ?? 'mindmap',
            legacyCompatibilityMode: true,
            catalogTypeId: selectedType.id,
            variant: selectedType.variant
        };
    }

    return {
        intent: inferred.intent,
        confidence: inferred.confidence,
        reasons: inferred.reasons,
        renderTarget: preferredTarget,
        fallbackTargets,
        preferredChartType,
        mermaidDiagramType: preferredMermaidType,
        legacyCompatibilityMode: false,
        catalogTypeId: selectedType.id,
        variant: selectedType.variant
    };
}
