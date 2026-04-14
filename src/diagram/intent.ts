import { DiagramIntent, DiagramIntentResult } from './types';

function countMatches(content: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => count + (content.match(pattern)?.length ?? 0), 0);
}

function scoreResult(intent: DiagramIntent, score: number, reasons: string[]): DiagramIntentResult {
    return {
        intent,
        confidence: Math.min(0.99, Math.max(0.2, score)),
        reasons
    };
}

export function inferDiagramIntent(markdown: string): DiagramIntentResult {
    const normalized = markdown.toLowerCase();
    const trimmed = normalized.trim();

    if (!trimmed) {
        return scoreResult('mindmap', 0.2, ['empty content defaults to hierarchical summary']);
    }

    const chartReasons: string[] = [];
    const hasMarkdownTable = /\|.+\|/.test(normalized) && /\|\s*-+\s*\|/.test(normalized);
    const numericCells = (normalized.match(/\|\s*\d+(?:\.\d+)?\s*\|/g) ?? []).length;
    const percentValues = (normalized.match(/\b\d+(?:\.\d+)?%/g) ?? []).length;
    const numericTokens = (normalized.match(/\b\d+(?:\.\d+)?\b/g) ?? []).length;
    const rankedNumericLines = (normalized.match(/^\s*(?:[-*]|\d+\.)\s+[^:\n]+:\s*\d+(?:\.\d+)?%?\s*$/gm) ?? []).length;
    const chartKeywords = countMatches(normalized, [
        /\bmetric(s)?\b/g,
        /\btrend(s)?\b/g,
        /\bweekly\b/g,
        /\bmonthly\b/g,
        /\bgrowth\b/g,
        /\bsignup(s)?\b/g,
        /\brevenue\b/g,
        /\bcount\b/g
    ]);
    const shareKeywords = countMatches(normalized, [
        /\bshare\b/g,
        /\bmix\b/g,
        /\bbreakdown\b/g,
        /\bdistribution\b/g,
        /\bcomposition\b/g,
        /\bportion\b/g
    ]);
    const comparisonKeywords = countMatches(normalized, [
        /\bvs\.?\b/g,
        /\bversus\b/g,
        /\bcompare\b/g,
        /\bcomparison\b/g,
        /\blatency\b/g,
        /\bthroughput\b/g,
        /\bcorrelation\b/g
    ]);
    const rankingKeywords = countMatches(normalized, [
        /\btop\b/g,
        /\brank(?:ed|ing)?\b/g,
        /\bissue(?:s)?\b/g,
        /\bleaderboard\b/g,
        /\bhighest\b/g,
        /\blowest\b/g
    ]);
    if (hasMarkdownTable) {
        chartReasons.push('markdown table detected');
    }
    if (numericCells >= 2) {
        chartReasons.push('numeric table values detected');
    }
    if (chartKeywords > 0) {
        chartReasons.push('metric-oriented keywords detected');
    }
    if (shareKeywords > 0) {
        chartReasons.push('part-to-whole keywords detected');
    }
    if (percentValues >= 2) {
        chartReasons.push('percentage values detected');
    }
    if (comparisonKeywords > 0) {
        chartReasons.push('comparison vocabulary detected');
    }
    if (comparisonKeywords > 0 && numericTokens >= 4) {
        chartReasons.push('paired numeric values detected');
    }
    if (rankingKeywords > 0) {
        chartReasons.push('ranking keywords detected');
    }
    if (rankedNumericLines >= 2) {
        chartReasons.push('ranked numeric items detected');
    }
    if (chartReasons.length >= 2) {
        return scoreResult('dataChart', 0.88, chartReasons);
    }

    const sequenceReasons: string[] = [];
    const sequenceKeywords = countMatches(normalized, [
        /\brequest\b/g,
        /\bresponse\b/g,
        /\bsend(s|ing)?\b/g,
        /\breturn(s|ed|ing)?\b/g,
        /\bclient\b/g,
        /\bserver\b/g,
        /\bgateway\b/g,
        /\bservice\b/g
    ]);
    if (sequenceKeywords >= 4) {
        sequenceReasons.push('request-response vocabulary detected');
    }
    if (/->|=>/.test(normalized)) {
        sequenceReasons.push('directional interaction markers detected');
    }
    if (sequenceReasons.length > 0) {
        return scoreResult('sequence', 0.82, sequenceReasons);
    }

    const erReasons: string[] = [];
    const erKeywords = countMatches(normalized, [
        /\bprimary key\b/g,
        /\bforeign key\b/g,
        /\bentity\b/g,
        /\btable\b/g,
        /\bcolumn\b/g,
        /\bschema\b/g
    ]);
    if (erKeywords >= 2) {
        erReasons.push('data-model vocabulary detected');
        return scoreResult('erDiagram', 0.8, erReasons);
    }

    const stateReasons: string[] = [];
    const stateKeywords = countMatches(normalized, [
        /\bstate\b/g,
        /\btransition\b/g,
        /\bpending\b/g,
        /\brunning\b/g,
        /\bcompleted\b/g,
        /\bfailed\b/g
    ]);
    if (stateKeywords >= 3) {
        stateReasons.push('state-transition vocabulary detected');
        return scoreResult('stateDiagram', 0.76, stateReasons);
    }

    const canvasReasons: string[] = [];
    const canvasKeywords = countMatches(normalized, [
        /\bconcept map\b/g,
        /\bknowledge graph\b/g,
        /\bspatial\b/g,
        /\bcluster\b/g,
        /\bmap the relationships\b/g
    ]);
    if (canvasKeywords >= 1) {
        canvasReasons.push('spatial knowledge mapping vocabulary detected');
        return scoreResult('canvasMap', 0.72, canvasReasons);
    }

    const flowchartReasons: string[] = [];
    const numberedSteps = (normalized.match(/^\s*\d+\./gm) ?? []).length;
    if (numberedSteps >= 2) {
        flowchartReasons.push('numbered steps detected');
    }
    const flowKeywords = countMatches(normalized, [
        /\bif\b/g,
        /\bthen\b/g,
        /\belse\b/g,
        /\bstep\b/g,
        /\bprocess\b/g,
        /\bworkflow\b/g,
        /\bvalidate\b/g,
        /\bcontinue\b/g,
        /\bstop\b/g
    ]);
    if (flowKeywords >= 2) {
        flowchartReasons.push('workflow/process vocabulary detected');
    }
    if (flowchartReasons.length > 0) {
        return scoreResult('flowchart', 0.74, flowchartReasons);
    }

    return scoreResult('mindmap', 0.55, ['defaulted to hierarchical summary structure']);
}
