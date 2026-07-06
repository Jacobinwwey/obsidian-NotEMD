import { CircuitSpec } from './circuitSpec';
import { assertCircuitTopologyUnchanged, createCircuitTopologySignature } from './circuitikzExporter';
import { CircuitikzCompileDiagnosticReport } from './circuitikzDiagnostics';
import { ValidationError } from '../../../types';

export interface CircuitikzRepairBriefRequest {
    referenceSpec: CircuitSpec;
    sourceSpec: CircuitSpec;
    diagnostics: CircuitikzCompileDiagnosticReport;
}

export interface CircuitikzRepairBrief {
    schemaVersion: 'notemd.circuitikz.repair-brief.v1';
    repairObjective: string;
    circuitKind: CircuitSpec['circuitKind'];
    goldenReferenceId: string;
    topologySignature: string;
    topologyInvariant: {
        allowedChanges: string[];
        prohibitedChanges: string[];
    };
    sourceSpec: CircuitSpec;
    diagnostics: CircuitikzCompileDiagnosticReport;
    nextSteps: string[];
}

export function createCircuitikzRepairBrief(request: CircuitikzRepairBriefRequest): CircuitikzRepairBrief {
    assertCircuitTopologyUnchanged(request.referenceSpec, request.sourceSpec);

    return {
        schemaVersion: 'notemd.circuitikz.repair-brief.v1',
        repairObjective: 'Repair circuitikz layout or labels while preserving the electrical topology exactly.',
        circuitKind: request.sourceSpec.circuitKind,
        goldenReferenceId: request.sourceSpec.goldenReferenceId,
        topologySignature: createCircuitTopologySignature(request.referenceSpec),
        topologyInvariant: {
            allowedChanges: [
                'title',
                'component labels',
                'connection labels',
                'layout hints',
                'routing coordinates inside the same golden template'
            ],
            prohibitedChanges: [
                'circuitKind',
                'goldenReferenceId',
                'nets',
                'component ids',
                'component types',
                'component terminals',
                'connections'
            ]
        },
        sourceSpec: request.sourceSpec,
        diagnostics: request.diagnostics,
        nextSteps: [
            'Apply the smallest layout or label change that resolves the listed diagnostics.',
            'Re-export with --topology-reference pointing at the original reference spec.',
            'Re-run compile diagnostics and render-smoke checks before accepting the repair.'
        ]
    };
}

export function assertCircuitikzRepairCandidateMatchesBrief(
    brief: Pick<CircuitikzRepairBrief, 'schemaVersion' | 'topologySignature'>,
    candidate: CircuitSpec
): CircuitSpec {
    if (brief.schemaVersion !== 'notemd.circuitikz.repair-brief.v1') {
        throw new ValidationError('Circuit repair brief uses an unsupported schemaVersion.', 'INVALID_INPUT');
    }
    if (!brief.topologySignature) {
        throw new ValidationError('Circuit repair brief is missing topologySignature.', 'INVALID_INPUT');
    }

    const candidateSignature = createCircuitTopologySignature(candidate);
    if (candidateSignature !== brief.topologySignature) {
        throw new ValidationError(
            'Circuit repair candidate does not match the repair brief topology signature.',
            'INVALID_INPUT'
        );
    }

    return candidate;
}
