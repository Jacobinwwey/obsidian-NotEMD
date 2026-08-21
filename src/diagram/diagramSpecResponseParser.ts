import { DiagramOrgChartStatus, DiagramSpec } from './types';
import type { DiagramPayload, DiagramPresentation } from './types';

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

function readTrimmedString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function readNumericValue(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (!/^-?\d[\d,]*(\.\d+)?%?$/.test(trimmed)) {
        return undefined;
    }

    const normalized = trimmed.replace(/,/g, '').replace(/%$/, '');
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizePoint(point: any, fallbackSeriesLabel: string) {
    if (Array.isArray(point) && point.length >= 2) {
        const x = point[0];
        const y = readNumericValue(point[1]);

        if ((typeof x === 'string' || typeof x === 'number') && y !== undefined) {
            return {
                x: typeof x === 'string' ? x.trim() : x,
                y,
                series: fallbackSeriesLabel
            };
        }

        return null;
    }

    if (!point || typeof point !== 'object') {
        return null;
    }

    const pointRecord = point as Record<string, unknown>;
    const explicitX = pointRecord.x;
    const fallbackX = pointRecord.label
        ?? pointRecord.name
        ?? pointRecord.category
        ?? pointRecord.item
        ?? pointRecord.date
        ?? pointRecord.key
        ?? pointRecord.id;
    const xCandidate = explicitX ?? fallbackX;
    const x = typeof xCandidate === 'number'
        ? xCandidate
        : readTrimmedString(xCandidate);
    let y = readNumericValue(pointRecord.y);

    if (y === undefined) {
        y = readNumericValue(
            pointRecord.value
            ?? pointRecord.amount
            ?? pointRecord.count
            ?? pointRecord.total
            ?? pointRecord.metric
        );
    }

    if ((x === undefined || x === '') && y === undefined) {
        const entries = Object.entries(pointRecord);
        if (entries.length === 1) {
            const [key, value] = entries[0];
            const parsedValue = readNumericValue(value);
            if (parsedValue !== undefined) {
                return {
                    x: key,
                    y: parsedValue,
                    series: fallbackSeriesLabel
                };
            }
        }
    }

    if ((typeof x !== 'string' && typeof x !== 'number') || y === undefined) {
        return null;
    }

    return {
        x,
        y,
        series: readTrimmedString(pointRecord.series) ?? fallbackSeriesLabel
    };
}

type NormalizedPoint = NonNullable<ReturnType<typeof normalizePoint>>;

function normalizeSeriesEntries(rawDataSeries: unknown): any[] {
    if (Array.isArray(rawDataSeries)) {
        return rawDataSeries;
    }

    if (!rawDataSeries || typeof rawDataSeries !== 'object') {
        return [];
    }

    return Object.entries(rawDataSeries as Record<string, unknown>).map(([key, value]) => {
        if (Array.isArray(value)) {
            return {
                id: key,
                label: key,
                points: value
            };
        }

        if (value && typeof value === 'object') {
            return {
                ...(value as Record<string, unknown>),
                id: (value as Record<string, unknown>).id ?? key,
                label: (value as Record<string, unknown>).label
                    ?? (value as Record<string, unknown>).name
                    ?? key
            };
        }

        return {
            id: key,
            label: key,
            points: []
        };
    });
}

function normalizeDataSeries(rawDataSeries: unknown, title: string): DiagramSpec['dataSeries'] {
    const seriesEntries = normalizeSeriesEntries(rawDataSeries);

    return seriesEntries.map((series, index) => {
        const labelFallback = title.trim().length > 0
            ? (seriesEntries.length === 1 ? title.trim() : `${title.trim()} ${index + 1}`)
            : `Series ${index + 1}`;
        const label = readTrimmedString(series?.label)
            ?? readTrimmedString(series?.name)
            ?? readTrimmedString(series?.title)
            ?? readTrimmedString(series?.series)
            ?? labelFallback;
        const slugId = slugify(label);
        const id = readTrimmedString(series?.id)
            ?? readTrimmedString(series?.key)
            ?? (slugId || `series-${index + 1}`);
        const rawPoints: unknown[] = Array.isArray(series?.points)
            ? series.points
            : Array.isArray(series?.values)
                ? series.values
                : Array.isArray(series?.data)
                    ? series.data
                    : Array.isArray(series?.items)
                        ? series.items
                        : [];
        const points = rawPoints
            .map((point: unknown) => normalizePoint(point, label))
            .filter((point): point is NormalizedPoint => point !== null);

        return {
            id,
            label,
            points
        };
    });
}

function normalizeRadarSpec(rawRadarSpec: unknown): DiagramSpec['radarSpec'] {
    if (!rawRadarSpec || typeof rawRadarSpec !== 'object' || Array.isArray(rawRadarSpec)) {
        return undefined;
    }

    const payload = rawRadarSpec as Record<string, unknown>;
    const rawAxes = Array.isArray(payload.axes) ? payload.axes : [];
    const axes = rawAxes.map((axis: unknown, index) => {
        if (typeof axis === 'string') {
            const label = axis.trim();
            return {
                id: slugify(label) || `axis-${index + 1}`,
                label
            };
        }

        const record = axis && typeof axis === 'object'
            ? axis as Record<string, unknown>
            : {};
        const label = readTrimmedString(record.label)
            ?? readTrimmedString(record.name)
            ?? readTrimmedString(record.title)
            ?? `Axis ${index + 1}`;
        const id = readTrimmedString(record.id)
            ?? readTrimmedString(record.key)
            ?? slugify(label)
            ?? `axis-${index + 1}`;
        const max = readNumericValue(record.max ?? record.maximum ?? record.limit);

        return max === undefined ? { id, label } : { id, label, max };
    });

    const axisIds = axes.map(axis => axis.id);
    const normalizeRadarPoints = (rawPoints: unknown): Array<{ axisId: string; value: number }> => {
        let entries: unknown[] = [];
        if (Array.isArray(rawPoints)) {
            entries = rawPoints;
        } else if (rawPoints && typeof rawPoints === 'object') {
            entries = Object.entries(rawPoints as Record<string, unknown>).map(([axisId, value]) => ({
                axisId,
                value
            }));
        }

        return entries.map((point: unknown) => {
            const record = point && typeof point === 'object'
                ? point as Record<string, unknown>
                : {};
            const axisCandidate = record.axisId
                ?? record.axis
                ?? record.dimension
                ?? record.label
                ?? record.name
                ?? record.id;
            const axisId = typeof axisCandidate === 'string'
                ? axisCandidate.trim()
                : typeof axisCandidate === 'number'
                    ? axisIds[axisCandidate] ?? ''
                    : '';
            const value = readNumericValue(record.value ?? record.score ?? record.amount ?? record.y);
            return value === undefined ? null : { axisId, value };
        }).filter((point): point is { axisId: string; value: number } => point !== null);
    };

    const seriesEntries = normalizeSeriesEntries(payload.series ?? payload.data);
    const series = seriesEntries.map((entry, index) => {
        const label = readTrimmedString(entry?.label)
            ?? readTrimmedString(entry?.name)
            ?? readTrimmedString(entry?.title)
            ?? `Series ${index + 1}`;
        const id = readTrimmedString(entry?.id)
            ?? readTrimmedString(entry?.key)
            ?? slugify(label)
            ?? `series-${index + 1}`;
        const rawPoints = entry?.points
            ?? entry?.values
            ?? entry?.data
            ?? entry?.items
            ?? [];
        return {
            id,
            label,
            points: normalizeRadarPoints(rawPoints)
        };
    });

    return { axes, series };
}

function normalizeOrgChartSpec(rawOrgChartSpec: unknown): DiagramSpec['orgChartSpec'] {
    if (!rawOrgChartSpec || typeof rawOrgChartSpec !== 'object' || Array.isArray(rawOrgChartSpec)) {
        return undefined;
    }

    const payload = rawOrgChartSpec as Record<string, unknown>;
    const rawNodes = Array.isArray(payload.nodes)
        ? payload.nodes
        : Array.isArray(payload.people)
            ? payload.people
            : [];

    const nodes = rawNodes.map((rawNode: unknown, index) => {
        const record = rawNode && typeof rawNode === 'object'
            ? rawNode as Record<string, unknown>
            : {};
        const explicitLabel = readTrimmedString(record.label)
            ?? readTrimmedString(record.name);
        const title = readTrimmedString(record.title);
        const label = explicitLabel
            ?? title
            ?? `Owner ${index + 1}`;
        const id = readTrimmedString(record.id)
            ?? readTrimmedString(record.key)
            ?? slugify(label)
            ?? `owner-${index + 1}`;
        const rawScope = record.scope ?? record.ownership ?? record.responsibilities;
        const scope = Array.isArray(rawScope)
            ? rawScope.filter((value): value is string => typeof value === 'string')
                .map(value => value.trim())
                .filter(Boolean)
            : typeof rawScope === 'string'
                ? rawScope.split(/[,;|]/).map(value => value.trim()).filter(Boolean)
                : undefined;
        const status = readTrimmedString(record.status);

        return {
            id,
            label,
            role: readTrimmedString(record.role)
                ?? readTrimmedString(record.position)
                ?? (explicitLabel && title && title !== explicitLabel ? title : undefined),
            scope,
            reportsTo: readTrimmedString(record.reportsTo)
                ?? readTrimmedString(record.parentId)
                ?? readTrimmedString(record.parent)
                ?? readTrimmedString(record.managerId)
                ?? readTrimmedString(record.manager),
            status: status as DiagramOrgChartStatus | undefined
        };
    });

    return { nodes };
}

function normalizePresentation(rawPresentation: unknown): DiagramPresentation | undefined {
    if (!rawPresentation || typeof rawPresentation !== 'object' || Array.isArray(rawPresentation)) {
        return undefined;
    }

    const value = rawPresentation as Record<string, unknown>;
    const format = value.format;
    const size = value.size;
    const detail = value.detail;
    const audience = value.audience;
    return {
        format: format === 'html' || format === 'svg' || format === 'png' || format === 'html+png' ? format : undefined,
        size: size === 'doc-inline' || size === 'doc-wide' || size === 'slide-16x9' || size === 'social-og' || size === 'fit' ? size : undefined,
        detail: detail === 'simplified' || detail === 'balanced' || detail === 'faithful' ? detail : undefined,
        audience: audience === 'technical' || audience === 'mixed' || audience === 'executive' ? audience : undefined
    };
}

function normalizeSpec(candidate: any): DiagramSpec {
    const payload = candidate?.diagramSpec ?? candidate;
    const title = typeof payload.title === 'string' ? payload.title : '';

    return {
        schemaVersion: typeof payload.schemaVersion === 'number' ? payload.schemaVersion : undefined,
        intent: payload.intent,
        title,
        summary: typeof payload.summary === 'string' ? payload.summary : undefined,
        nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
        edges: Array.isArray(payload.edges) ? payload.edges.map((e: any) => ({
                from: e.from ?? e.source ?? e.sourceId ?? e.start,
                to: e.to ?? e.target ?? e.targetId ?? e.end,
                label: e.label,
                relation: e.relation,
            })) : [],
        sections: Array.isArray(payload.sections) ? payload.sections : [],
        callouts: Array.isArray(payload.callouts) ? payload.callouts : [],
        dataSeries: normalizeDataSeries(payload.dataSeries, title),
        radarSpec: normalizeRadarSpec(payload.radarSpec),
        orgChartSpec: normalizeOrgChartSpec(payload.orgChartSpec),
        timelineEvents: Array.isArray(payload.timelineEvents)
            ? payload.timelineEvents.map((event: any) => ({
                id: event?.id,
                date: event?.date,
                label: event?.label,
                details: Array.isArray(event?.details) ? event.details : undefined
            }))
            : undefined,
        swimlaneLanes: Array.isArray(payload.swimlaneLanes)
            ? payload.swimlaneLanes.map((lane: any) => ({
                id: lane?.id,
                label: lane?.label,
                steps: Array.isArray(lane?.steps)
                    ? lane.steps.map((step: any) => ({
                        id: step?.id,
                        label: step?.label,
                        nextStepId: step?.nextStepId ?? step?.next
                    }))
                    : []
            }))
            : undefined,
        quadrant: payload.quadrant && typeof payload.quadrant === 'object'
            ? {
                xAxisLabel: payload.quadrant.xAxisLabel,
                yAxisLabel: payload.quadrant.yAxisLabel,
                quadrantLabels: payload.quadrant.quadrantLabels,
                items: Array.isArray(payload.quadrant.items)
                    ? payload.quadrant.items.map((item: any) => ({
                        id: item?.id,
                        label: item?.label,
                        x: item?.x,
                        y: item?.y,
                        detail: item?.detail
                    }))
                    : []
            }
            : undefined,
        circuitSpec: payload.circuitSpec && typeof payload.circuitSpec === 'object' ? payload.circuitSpec : undefined,
        layoutHints: payload.layoutHints && typeof payload.layoutHints === 'object' ? payload.layoutHints : undefined,
        sourceLanguage: typeof payload.sourceLanguage === 'string' ? payload.sourceLanguage : undefined,
        outputLanguage: typeof payload.outputLanguage === 'string' ? payload.outputLanguage : undefined,
        evidenceRefs: Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs : [],
        payload: payload.payload && typeof payload.payload === 'object'
            ? payload.payload as DiagramPayload
            : undefined,
        presentation: normalizePresentation(payload.presentation),
        extensions: payload.extensions && typeof payload.extensions === 'object' && !Array.isArray(payload.extensions)
            ? payload.extensions as Record<string, unknown>
            : undefined
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
