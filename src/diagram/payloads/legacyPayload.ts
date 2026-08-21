import type { DiagramSpec } from '../types';
import type { DiagramPayload, LegacyDiagramPayload, QuantitativeDiagramPayload } from './types';

export const DIAGRAM_SPEC_SCHEMA_VERSION = 2 as const;

function resolveChartType(spec: DiagramSpec): QuantitativeDiagramPayload['chartType'] {
    const chartType = spec.layoutHints?.chartType;
    return chartType === 'line'
        || chartType === 'scatter'
        || chartType === 'pie'
        || chartType === 'table'
        || chartType === 'bar'
        ? chartType
        : 'bar';
}

function buildLegacyPayload(spec: DiagramSpec): DiagramPayload {
    if (spec.intent === 'dataChart') {
        return {
            kind: 'quantitative',
            chartType: resolveChartType(spec),
            series: spec.dataSeries ?? []
        };
    }

    const specialized: LegacyDiagramPayload['specialized'] = {};
    if (spec.radarSpec) specialized.radarSpec = spec.radarSpec;
    if (spec.orgChartSpec) specialized.orgChartSpec = spec.orgChartSpec;
    if (spec.timelineEvents) specialized.timelineEvents = spec.timelineEvents;
    if (spec.swimlaneLanes) specialized.swimlaneLanes = spec.swimlaneLanes;
    if (spec.quadrant) specialized.quadrant = spec.quadrant;
    if (spec.circuitSpec) specialized.circuitSpec = spec.circuitSpec;

    return {
        kind: 'legacy',
        nodes: spec.nodes ?? [],
        edges: spec.edges ?? [],
        specialized: Object.keys(specialized).length > 0 ? specialized : undefined
    };
}

/**
 * Establishes the canonical payload metadata without changing the legacy
 * fields consumed by existing renderers. This is intentionally a boundary
 * adapter: future payload-family renderers can require `payload` while old
 * target adapters continue to read their stable projections.
 */
export function normalizeDiagramSpecPayload(spec: DiagramSpec): DiagramSpec {
    if (spec.schemaVersion !== undefined && spec.schemaVersion !== 1 && spec.schemaVersion !== DIAGRAM_SPEC_SCHEMA_VERSION) {
        throw new Error(`Unsupported DiagramSpec schema version "${String(spec.schemaVersion)}".`);
    }

    if (spec.schemaVersion === DIAGRAM_SPEC_SCHEMA_VERSION && spec.payload) {
        return spec;
    }

    return {
        ...spec,
        schemaVersion: DIAGRAM_SPEC_SCHEMA_VERSION,
        payload: spec.payload ?? buildLegacyPayload(spec)
    };
}
