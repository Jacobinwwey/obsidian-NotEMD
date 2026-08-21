import type { DiagramSpec } from '../types';
import type { DiagramPayload, LegacyDiagramPayload, QuantitativeDiagramPayload } from './types';

export const DIAGRAM_SPEC_SCHEMA_VERSION = 2 as const;

function resolveChartType(spec: DiagramSpec): QuantitativeDiagramPayload['chartType'] {
    const chartType = spec.layoutHints?.chartType;
    // Preserve an explicitly supplied invalid value so the validation boundary
    // can reject it instead of silently changing the user's requested chart.
    return chartType === undefined ? 'bar' : chartType as QuantitativeDiagramPayload['chartType'];
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
        if (spec.payload.kind === 'quantitative') {
            return {
                ...spec,
                dataSeries: spec.dataSeries?.length ? spec.dataSeries : spec.payload.series,
                layoutHints: {
                    ...(spec.layoutHints ?? {}),
                    chartType: spec.payload.chartType
                }
            };
        }
        return spec;
    }

    const payload = spec.payload ?? buildLegacyPayload(spec);
    return {
        ...spec,
        schemaVersion: DIAGRAM_SPEC_SCHEMA_VERSION,
        payload,
        dataSeries: payload.kind === 'quantitative' && !spec.dataSeries?.length
            ? payload.series
            : spec.dataSeries,
        layoutHints: payload.kind === 'quantitative'
            ? { ...(spec.layoutHints ?? {}), chartType: payload.chartType }
            : spec.layoutHints
    };
}
