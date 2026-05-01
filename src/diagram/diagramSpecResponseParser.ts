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

function normalizeSpec(candidate: any): DiagramSpec {
    const payload = candidate?.diagramSpec ?? candidate;
    const title = typeof payload.title === 'string' ? payload.title : '';

    return {
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
