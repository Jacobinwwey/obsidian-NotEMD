import {
    DiagramIntent,
    DiagramIntentResult,
    DiagramPlan,
    DiagramPlanOptions,
    MermaidDiagramType,
    RenderTarget
} from './types';
import { SupportedVegaLiteChartType } from './adapters/vega/schema';
import { inferDiagramIntent } from './intent';

function resolvePreferredRenderTarget(intent: DiagramIntent): RenderTarget {
    switch (intent) {
        case 'canvasMap':
            return 'json-canvas';
        case 'dataChart':
            return 'vega-lite';
        default:
            return 'mermaid';
    }
}

function resolveMermaidDiagramType(intent: DiagramIntent): MermaidDiagramType | null {
    switch (intent) {
        case 'mindmap':
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
        default:
            return null;
    }
}

function resolveFallbackTargets(
    compatibilityMode: 'best-fit' | 'legacy-mermaid',
    preferredTarget: RenderTarget,
    preferredMermaidType: MermaidDiagramType | null
): RenderTarget[] {
    if (compatibilityMode === 'legacy-mermaid') {
        return [];
    }

    const fallbackTargets: RenderTarget[] = [];

    if (preferredTarget !== 'mermaid' && preferredMermaidType) {
        fallbackTargets.push('mermaid');
    }

    if (preferredTarget !== 'html') {
        fallbackTargets.push('html');
    }

    return fallbackTargets;
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

export function buildDiagramPlan(markdown: string, options: DiagramPlanOptions = {}): DiagramPlan {
    const compatibilityMode = options.compatibilityMode ?? 'best-fit';
    const inferred = buildIntentResult(markdown, options.requestedIntent);
    const preferredTarget = resolvePreferredRenderTarget(inferred.intent);
    const preferredMermaidType = resolveMermaidDiagramType(inferred.intent);
    const preferredChartType = inferPreferredChartType(markdown, inferred.intent);
    const fallbackTargets = resolveFallbackTargets(compatibilityMode, preferredTarget, preferredMermaidType);

    if (compatibilityMode === 'legacy-mermaid') {
        return {
            intent: inferred.intent,
            confidence: inferred.confidence,
            reasons: inferred.reasons,
            renderTarget: 'mermaid',
            fallbackTargets,
            preferredChartType,
            mermaidDiagramType: preferredMermaidType ?? 'mindmap',
            legacyCompatibilityMode: true
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
        legacyCompatibilityMode: false
    };
}
