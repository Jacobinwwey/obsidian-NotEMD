import { CircuitSpec } from './circuitSpec';
import { CircuitikzCompileDiagnosticReport } from './circuitikzDiagnostics';
import { exportCircuitSpecToCircuitikz } from './circuitikzExporter';
import {
    CircuitikzRepairAcceptanceEvidence,
    CircuitikzRepairAcceptanceReport,
    CircuitikzRepairBrief,
    createCircuitikzRepairAcceptanceReport,
    createCircuitikzRepairBrief,
    assertCircuitikzRepairCandidateMatchesBrief
} from './circuitikzRepairBrief';

export interface CircuitikzRepairCandidateEvaluationInput {
    candidateSpec: CircuitSpec;
    texContent: string;
    repairBrief: CircuitikzRepairBrief;
}

export interface CircuitikzRepairLoopRequest {
    referenceSpec: CircuitSpec;
    sourceSpec: CircuitSpec;
    initialDiagnostics: CircuitikzCompileDiagnosticReport;
    requestRepairCandidate: (prompt: string) => Promise<string>;
    evaluateCandidate: (
        input: CircuitikzRepairCandidateEvaluationInput
    ) => Promise<CircuitikzRepairAcceptanceEvidence>;
}

export interface CircuitikzRepairLoopReport {
    status: 'not-needed' | 'unavailable' | 'accepted' | 'rejected';
    attemptCount: 0 | 1;
    reason: string;
    repairBrief?: CircuitikzRepairBrief;
    candidateSpec?: CircuitSpec;
    acceptance?: CircuitikzRepairAcceptanceReport;
}

const RENDERER_UNAVAILABLE_KINDS = new Set([
    'compile-executable-invalid',
    'compile-executable-not-found',
    'compile-process-error'
]);

function createRepairCandidatePrompt(brief: CircuitikzRepairBrief): string {
    return [
        'Return exactly one revised CircuitSpec JSON object.',
        'Do not return Markdown, prose, or TikZ.',
        'Follow every topology invariant and acceptance criterion in this repair brief:',
        JSON.stringify(brief, null, 2)
    ].join('\n\n');
}

function parseCircuitSpecCandidate(rawResponse: string): CircuitSpec {
    const trimmed = rawResponse.trim();
    const unfenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed;
    const objectStart = unfenced.indexOf('{');
    const objectEnd = unfenced.lastIndexOf('}');

    if (objectStart < 0 || objectEnd < objectStart) {
        throw new Error('Repair response did not contain a CircuitSpec JSON object.');
    }

    try {
        const candidate = JSON.parse(unfenced.slice(objectStart, objectEnd + 1));
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            throw new Error('CircuitSpec JSON must be an object.');
        }
        return candidate as CircuitSpec;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Unable to parse CircuitSpec JSON: ${message}`);
    }
}

function rendererIsUnavailable(diagnostics: CircuitikzCompileDiagnosticReport): boolean {
    return diagnostics.diagnostics.some(diagnostic => RENDERER_UNAVAILABLE_KINDS.has(diagnostic.kind));
}

function rejectionReport(
    reason: string,
    repairBrief: CircuitikzRepairBrief,
    acceptance?: CircuitikzRepairAcceptanceReport
): CircuitikzRepairLoopReport {
    return {
        status: 'rejected',
        attemptCount: 1,
        reason,
        repairBrief,
        acceptance
    };
}

export async function runCircuitikzRepairLoop(
    request: CircuitikzRepairLoopRequest
): Promise<CircuitikzRepairLoopReport> {
    if (request.initialDiagnostics.diagnostics.length === 0) {
        return {
            status: 'not-needed',
            attemptCount: 0,
            reason: 'Initial compile and render diagnostics require no repair.'
        };
    }

    if (rendererIsUnavailable(request.initialDiagnostics)) {
        return {
            status: 'unavailable',
            attemptCount: 0,
            reason: 'Circuitikz repair requires a configured renderer that can produce fresh acceptance evidence.'
        };
    }

    const repairBrief = createCircuitikzRepairBrief({
        referenceSpec: request.referenceSpec,
        sourceSpec: request.sourceSpec,
        diagnostics: request.initialDiagnostics
    });

    let candidateSpec: CircuitSpec;
    try {
        const rawCandidate = await request.requestRepairCandidate(createRepairCandidatePrompt(repairBrief));
        candidateSpec = parseCircuitSpecCandidate(rawCandidate);
        assertCircuitikzRepairCandidateMatchesBrief(repairBrief, candidateSpec);
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        return rejectionReport(reason, repairBrief);
    }

    let texContent: string;
    try {
        texContent = exportCircuitSpecToCircuitikz(candidateSpec);
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        return rejectionReport(reason, repairBrief);
    }

    let evidence: CircuitikzRepairAcceptanceEvidence;
    try {
        evidence = await request.evaluateCandidate({ candidateSpec, texContent, repairBrief });
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        return rejectionReport(`Candidate evaluation failed: ${reason}`, repairBrief);
    }

    const acceptance = createCircuitikzRepairAcceptanceReport(repairBrief, candidateSpec, evidence);
    if (!acceptance.readyForVisualAcceptance) {
        return rejectionReport('Repair candidate did not pass compile and render-smoke acceptance.', repairBrief, acceptance);
    }

    return {
        status: 'accepted',
        attemptCount: 1,
        reason: 'Repair candidate preserved topology and passed fresh compile and render-smoke acceptance.',
        repairBrief,
        candidateSpec,
        acceptance
    };
}
