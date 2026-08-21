import type { DiagramCatalogTypeId, DiagramIntent, RenderTarget } from './types';
import { EXECUTABLE_DIAGRAM_TYPES } from './diagramTypeCatalog';
import type { DiagramTypeFamily } from './diagramTypeCatalog';

export const DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION = 1 as const;
export const DIAGRAM_DESIGN_REFERENCE_REVISION = '09df49d8d1a1c7fb2efdfcdc7a2a0713534350a6' as const;

export interface ShippedDiagramCapability {
    id: DiagramCatalogTypeId;
    lifecycle: 'shipped';
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    defaultTarget: RenderTarget;
    compatibleTargets: readonly RenderTarget[];
    fixtureId: string;
}

export interface ReferenceOnlyDiagramLayout {
    id: string;
    lifecycle: 'reference-only';
    label: string;
    sourceRevision: string;
}

export interface DiagramCapabilityManifest {
    schemaVersion: typeof DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION;
    shippedTypes: readonly ShippedDiagramCapability[];
    referenceOnlyLayouts: readonly ReferenceOnlyDiagramLayout[];
}

const REFERENCE_ONLY_LAYOUTS: readonly ReferenceOnlyDiagramLayout[] = [
    ['architecture', 'Architecture'],
    ['it-current-state', 'IT current-state'],
    ['flowchart', 'Flowchart'],
    ['sequence', 'Sequence'],
    ['state-machine', 'State machine'],
    ['er-data-model', 'ER / data model'],
    ['loop', 'Loop / flywheel'],
    ['nested', 'Nested'],
    ['tree', 'Tree'],
    ['layer-stack', 'Layer stack'],
    ['venn', 'Venn'],
    ['pyramid-funnel', 'Pyramid / funnel'],
    ['bar-chart', 'Bar chart'],
    ['line-chart', 'Line chart'],
    ['gantt', 'Gantt'],
    ['scatter-plot', 'Scatter plot'],
    ['high-level', 'High-Level'],
    ['process', 'Process'],
    ['medallion', 'Medallion'],
    ['data-flow', 'Data flow'],
    ['dp-integration', 'DP integration'],
    ['dp-security-matrix', 'DP security matrix']
].map(([id, label]) => ({
    id: 'diagram-design:' + id,
    lifecycle: 'reference-only' as const,
    label,
    sourceRevision: DIAGRAM_DESIGN_REFERENCE_REVISION
}));

const SHIPPED_TYPES: readonly ShippedDiagramCapability[] = EXECUTABLE_DIAGRAM_TYPES.map(type => ({
    id: type.id,
    lifecycle: 'shipped' as const,
    intent: type.intent,
    family: type.family,
    defaultTarget: type.defaultTarget,
    compatibleTargets: [...type.compatibleTargets],
    fixtureId: type.exampleFixtureId
}));

const DIAGRAM_CAPABILITY_MANIFEST: DiagramCapabilityManifest = {
    schemaVersion: DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION,
    shippedTypes: SHIPPED_TYPES,
    referenceOnlyLayouts: REFERENCE_ONLY_LAYOUTS
};

function assertDiagramCapabilityManifest(): void {
    if (DIAGRAM_CAPABILITY_MANIFEST.shippedTypes.length !== EXECUTABLE_DIAGRAM_TYPES.length) {
        throw new Error('Diagram capability manifest is missing an executable diagram type.');
    }
    const shippedIds = new Set(DIAGRAM_CAPABILITY_MANIFEST.shippedTypes.map(type => type.id));
    if (shippedIds.size !== DIAGRAM_CAPABILITY_MANIFEST.shippedTypes.length) {
        throw new Error('Diagram capability manifest contains duplicate shipped type ids.');
    }
    if (DIAGRAM_CAPABILITY_MANIFEST.referenceOnlyLayouts.some(layout => shippedIds.has(layout.id as DiagramCatalogTypeId))) {
        throw new Error('Reference-only diagram layouts must not enter the shipped type selector.');
    }
}

assertDiagramCapabilityManifest();

export function getDiagramCapabilityManifest(): DiagramCapabilityManifest {
    return DIAGRAM_CAPABILITY_MANIFEST;
}
