import type { DiagramIntent, RenderTarget } from '../types';

export type DiagramHistoryExportKind = 'svg' | 'png' | 'pdf';

export interface DiagramHistoryEntry {
    id: string;
    completedAt: number;
    title: string;
    sourcePath?: string;
    intent: DiagramIntent;
    sourceFormat: RenderTarget;
    artifactPath?: string;
    exportPaths: Partial<Record<DiagramHistoryExportKind, string>>;
    status: 'completed' | 'failed';
    errorMessage?: string;
}

export interface DiagramHistoryQuery {
    search?: string;
    intent?: DiagramIntent;
    sourceFormat?: RenderTarget;
    exportKind?: DiagramHistoryExportKind;
    sourcePath?: string;
    completedFrom?: number;
    completedTo?: number;
    page?: number;
    pageSize?: number;
}

export interface DiagramHistoryPage {
    items: DiagramHistoryEntry[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export function cloneDiagramHistoryEntry(entry: DiagramHistoryEntry): DiagramHistoryEntry {
    return { ...entry, exportPaths: { ...entry.exportPaths } };
}

function normalizedTokens(value: string): string[] {
    return value.toLocaleLowerCase().normalize('NFKC').trim().split(/\s+/).filter(Boolean);
}

function matchesSearch(entry: DiagramHistoryEntry, search: string): boolean {
    const haystack = [entry.title, entry.sourcePath, entry.artifactPath, entry.intent, entry.sourceFormat]
        .filter(Boolean).join(' ').toLocaleLowerCase().normalize('NFKC');
    return normalizedTokens(search).every(token => haystack.includes(token));
}

export function queryDiagramHistoryEntries(entries: readonly DiagramHistoryEntry[], query: DiagramHistoryQuery): DiagramHistoryPage {
    const pageSize = Math.max(1, Math.floor(query.pageSize ?? 20));
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const filtered = entries
        .filter(entry => !query.search || matchesSearch(entry, query.search))
        .filter(entry => !query.intent || entry.intent === query.intent)
        .filter(entry => !query.sourceFormat || entry.sourceFormat === query.sourceFormat)
        .filter(entry => !query.exportKind || Boolean(entry.exportPaths[query.exportKind]))
        .filter(entry => !query.sourcePath || entry.sourcePath === query.sourcePath)
        .filter(entry => query.completedFrom === undefined || entry.completedAt >= query.completedFrom)
        .filter(entry => query.completedTo === undefined || entry.completedAt <= query.completedTo)
        .sort((left, right) => right.completedAt - left.completedAt);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const resolvedPage = Math.min(page, totalPages);
    const start = (resolvedPage - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize).map(cloneDiagramHistoryEntry), page: resolvedPage, pageSize, totalItems: filtered.length, totalPages };
}
