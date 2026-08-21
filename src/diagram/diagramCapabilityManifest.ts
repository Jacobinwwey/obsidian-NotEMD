import type { DiagramCatalogTypeId, DiagramIntent, RenderTarget } from './types';
import { EXECUTABLE_DIAGRAM_TYPES } from './diagramTypeCatalog';
import type { DiagramTypeFamily } from './diagramTypeCatalog';

interface DiagramReferenceCatalogRow {
    id: string;
    label: string;
    labelZh: string;
    referenceFileName: string;
    screenshotFileName: string;
    previewAssetId: string;
}

// JSON is loaded through CommonJS so Jest and esbuild observe the same module shape.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const referencePreviewRows = require('./diagramReferenceCatalog.json') as DiagramReferenceCatalogRow[];

export const DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION = 2 as const;
export const DIAGRAM_DESIGN_REFERENCE_REVISION = '09df49d8d1a1c7fb2efdfcdc7a2a0713534350a6' as const;

export interface ShippedDiagramCapability {
    id: DiagramCatalogTypeId;
    lifecycle: 'shipped';
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    defaultTarget: RenderTarget;
    compatibleTargets: readonly RenderTarget[];
    fixtureId: string;
    /** Optional reference-repository layout shown beside the production fixture. */
    referencePreviewId?: string;
}

export interface DiagramReferencePreview {
    id: string;
    label: string;
    labelZh: string;
    referencePath: string;
    screenshotPath: string;
    previewAssetId: string;
    sourceRevision: string;
}

export interface ReferenceOnlyDiagramLayout extends DiagramReferencePreview {
    lifecycle: 'reference-only';
}

export interface DiagramCapabilityManifest {
    schemaVersion: typeof DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION;
    shippedTypes: readonly ShippedDiagramCapability[];
    referenceOnlyLayouts: readonly ReferenceOnlyDiagramLayout[];
    referencePreviews: readonly DiagramReferencePreview[];
}

const REFERENCE_DIAGRAM_PREVIEWS: readonly DiagramReferencePreview[] = referencePreviewRows.map(row => ({
    id: row.id,
    label: row.label,
    labelZh: row.labelZh,
    referencePath: `ref/diagram-design/skills/diagram-design/references/${row.referenceFileName}`,
    screenshotPath: `ref/diagram-design/docs/screenshots/${row.screenshotFileName}`,
    previewAssetId: row.previewAssetId,
    sourceRevision: DIAGRAM_DESIGN_REFERENCE_REVISION
}));

const REFERENCE_ONLY_LAYOUT_IDS = new Set([
    'architecture',
    'it-current-state',
    'flowchart',
    'sequence',
    'state-machine',
    'er-data-model',
    'loop',
    'nested',
    'tree',
    'layer-stack',
    'venn',
    'pyramid-funnel',
    'bar-chart',
    'line-chart',
    'gantt',
    'scatter-plot',
    'high-level',
    'process',
    'medallion',
    'data-flow',
    'dp-integration',
    'dp-security-matrix'
]);

const REFERENCE_ONLY_LAYOUTS: readonly ReferenceOnlyDiagramLayout[] = REFERENCE_DIAGRAM_PREVIEWS
    .filter(preview => REFERENCE_ONLY_LAYOUT_IDS.has(preview.previewAssetId))
    .map(preview => ({
        ...preview,
        lifecycle: 'reference-only' as const
    }));

const REFERENCE_PREVIEW_BY_ID = new Map(REFERENCE_DIAGRAM_PREVIEWS.map(preview => [preview.id, preview]));

const SHIPPED_REFERENCE_PREVIEW_BY_TYPE: Readonly<Record<DiagramCatalogTypeId, string | undefined>> = {
    'mermaid-mindmap': undefined,
    'drawnix-knowledge-map': undefined,
    flowchart: 'diagram-design:flowchart',
    sequence: 'diagram-design:sequence',
    state: 'diagram-design:state-machine',
    class: undefined,
    'entity-relationship': 'diagram-design:er-data-model',
    'canvas-map': undefined,
    'data-chart': undefined,
    'radar-chart': 'diagram-design:radar',
    'org-chart': 'diagram-design:org-chart',
    timeline: 'diagram-design:timeline',
    swimlane: 'diagram-design:swimlane',
    quadrant: 'diagram-design:quadrant',
    circuit: undefined
};

const SHIPPED_TYPES: readonly ShippedDiagramCapability[] = EXECUTABLE_DIAGRAM_TYPES.map(type => ({
    id: type.id,
    lifecycle: 'shipped' as const,
    intent: type.intent,
    family: type.family,
    defaultTarget: type.defaultTarget,
    compatibleTargets: [...type.compatibleTargets],
    fixtureId: type.exampleFixtureId,
    referencePreviewId: SHIPPED_REFERENCE_PREVIEW_BY_TYPE[type.id]
}));

const DIAGRAM_CAPABILITY_MANIFEST: DiagramCapabilityManifest = {
    schemaVersion: DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION,
    shippedTypes: SHIPPED_TYPES,
    referenceOnlyLayouts: REFERENCE_ONLY_LAYOUTS,
    referencePreviews: REFERENCE_DIAGRAM_PREVIEWS
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
    if (DIAGRAM_CAPABILITY_MANIFEST.referencePreviews.length !== 27) {
        throw new Error('Diagram capability manifest must expose all 27 reference previews.');
    }
    const referenceIds = new Set(DIAGRAM_CAPABILITY_MANIFEST.referencePreviews.map(preview => preview.id));
    if (referenceIds.size !== DIAGRAM_CAPABILITY_MANIFEST.referencePreviews.length) {
        throw new Error('Diagram reference previews must use unique ids.');
    }
    for (const type of DIAGRAM_CAPABILITY_MANIFEST.shippedTypes) {
        if (type.referencePreviewId && !referenceIds.has(type.referencePreviewId)) {
            throw new Error(`Shipped diagram type "${type.id}" references an unknown preview.`);
        }
    }
    for (const layout of DIAGRAM_CAPABILITY_MANIFEST.referenceOnlyLayouts) {
        if (!REFERENCE_PREVIEW_BY_ID.has(layout.id)) {
            throw new Error(`Reference-only layout "${layout.id}" has no preview descriptor.`);
        }
    }
}

assertDiagramCapabilityManifest();

export function getDiagramCapabilityManifest(): DiagramCapabilityManifest {
    return DIAGRAM_CAPABILITY_MANIFEST;
}

export function getDiagramReferencePreview(id: string): DiagramReferencePreview | undefined {
    return REFERENCE_PREVIEW_BY_ID.get(id);
}
