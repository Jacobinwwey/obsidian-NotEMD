import { DiagramSpec } from './types';

function stripCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function extractJsonObject(raw: string): string {
    const stripped = stripCodeFence(raw);
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
        throw new Error('Unable to parse DiagramSpec: no JSON object found in LLM response.');
    }

    return stripped.slice(start, end + 1);
}

function normalizeSpec(candidate: any): DiagramSpec {
    const payload = candidate?.diagramSpec ?? candidate;

    return {
        intent: payload.intent,
        title: typeof payload.title === 'string' ? payload.title : '',
        summary: typeof payload.summary === 'string' ? payload.summary : undefined,
        nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
        edges: Array.isArray(payload.edges) ? payload.edges : [],
        sections: Array.isArray(payload.sections) ? payload.sections : [],
        callouts: Array.isArray(payload.callouts) ? payload.callouts : [],
        dataSeries: Array.isArray(payload.dataSeries) ? payload.dataSeries : [],
        layoutHints: payload.layoutHints && typeof payload.layoutHints === 'object' ? payload.layoutHints : undefined,
        sourceLanguage: typeof payload.sourceLanguage === 'string' ? payload.sourceLanguage : undefined,
        outputLanguage: typeof payload.outputLanguage === 'string' ? payload.outputLanguage : undefined,
        evidenceRefs: Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs : []
    };
}

export function parseDiagramSpecResponse(raw: string): DiagramSpec {
    try {
        const jsonObject = extractJsonObject(raw);
        return normalizeSpec(JSON.parse(jsonObject));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Unable to parse DiagramSpec response: ${message}`);
    }
}
