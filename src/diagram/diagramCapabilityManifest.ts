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
    referencePath: string;
    sourceRevision: string;
}

export interface DiagramCapabilityManifest {
    schemaVersion: typeof DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION;
    shippedTypes: readonly ShippedDiagramCapability[];
    referenceOnlyLayouts: readonly ReferenceOnlyDiagramLayout[];
}

const REFERENCE_ONLY_LAYOUTS: readonly ReferenceOnlyDiagramLayout[] = [
    ['architecture', 'Architecture', 'type-architecture.md'],
    ['it-current-state', 'IT current-state', 'type-it-state.md'],
    ['flowchart', 'Flowchart', 'type-flowchart.md'],
    ['sequence', 'Sequence', 'type-sequence.md'],
    ['state-machine', 'State machine', 'type-state.md'],
    ['er-data-model', 'ER / data model', 'type-er.md'],
    ['loop', 'Loop / flywheel', 'type-loop.md'],
    ['nested', 'Nested', 'type-nested.md'],
    ['tree', 'Tree', 'type-tree.md'],
    ['layer-stack', 'Layer stack', 'type-layers.md'],
    ['venn', 'Venn', 'type-venn.md'],
    ['pyramid-funnel', 'Pyramid / funnel', 'type-pyramid.md'],
    ['bar-chart', 'Bar chart', 'type-bar.md'],
    ['line-chart', 'Line chart', 'type-line.md'],
    ['gantt', 'Gantt', 'type-gantt.md'],
    ['scatter-plot', 'Scatter plot', 'type-scatter.md'],
    ['high-level', 'High-Level', 'type-high-level.md'],
    ['process', 'Process', 'type-process.md'],
    ['medallion', 'Medallion', 'type-medallion.md'],
    ['data-flow', 'Data flow', 'type-data-flow.md'],
    ['dp-integration', 'DP integration', 'type-dp-integration.md'],
    ['dp-security-matrix', 'DP security matrix', 'type-dp-security-matrix.md']
].map(([id, label, fileName]) => ({
    id: `diagram-design:${id}`,
    lifecycle: 'reference-only' as const,
    label,
    referencePath: `ref/diagram-design/skills/diagram-design/references/${fileName}`,
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
