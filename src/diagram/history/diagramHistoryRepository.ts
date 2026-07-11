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

type LoadEntries = () => Promise<DiagramHistoryEntry[]>;
type SaveEntries = (entries: DiagramHistoryEntry[]) => Promise<void>;

function cloneEntry(entry: DiagramHistoryEntry): DiagramHistoryEntry {
    return { ...entry, exportPaths: { ...entry.exportPaths } };
}

function normalizedTokens(value: string): string[] {
    return value.toLocaleLowerCase().normalize('NFKC').trim().split(/\s+/).filter(Boolean);
}

function matchesSearch(entry: DiagramHistoryEntry, search: string): boolean {
    const haystack = [entry.title, entry.sourcePath, entry.artifactPath, entry.intent, entry.sourceFormat]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .normalize('NFKC');
    return normalizedTokens(search).every(token => haystack.includes(token));
}

function queryEntries(entries: DiagramHistoryEntry[], query: DiagramHistoryQuery): DiagramHistoryPage {
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
    return {
        items: filtered.slice(start, start + pageSize).map(cloneEntry),
        page: resolvedPage,
        pageSize,
        totalItems: filtered.length,
        totalPages
    };
}

export function createDiagramHistoryRepository(load: LoadEntries, save: SaveEntries, retentionLimit = 500) {
    let writeQueue = Promise.resolve();
    const write = (operation: () => Promise<void>) => {
        writeQueue = writeQueue.then(operation, operation);
        return writeQueue;
    };

    return {
        async recordCompleted(entry: DiagramHistoryEntry): Promise<void> {
            await write(async () => {
                const entries = (await load()).filter(existing => existing.id !== entry.id);
                entries.push(cloneEntry(entry));
                entries.sort((left, right) => right.completedAt - left.completedAt);
                await save(entries.slice(0, Math.max(1, retentionLimit)).map(cloneEntry));
            });
        },
        async query(query: DiagramHistoryQuery = {}): Promise<DiagramHistoryPage> {
            return queryEntries(await load(), query);
        },
        async get(id: string): Promise<DiagramHistoryEntry | null> {
            const entry = (await load()).find(candidate => candidate.id === id);
            return entry ? cloneEntry(entry) : null;
        },
        async recordArtifactPath(id: string, artifactPath: string): Promise<boolean> {
            let updated = false;
            await write(async () => {
                const entries = await load();
                const entry = entries.find(candidate => candidate.id === id);
                if (!entry) return;
                entry.artifactPath = artifactPath;
                updated = true;
                await save(entries.map(cloneEntry));
            });
            return updated;
        },
        async recordExportPath(id: string, kind: DiagramHistoryExportKind, exportPath: string): Promise<boolean> {
            let updated = false;
            await write(async () => {
                const entries = await load();
                const entry = entries.find(candidate => candidate.id === id);
                if (!entry) return;
                entry.exportPaths = { ...entry.exportPaths, [kind]: exportPath };
                updated = true;
                await save(entries.map(cloneEntry));
            });
            return updated;
        },
        async removeIndexEntry(id: string): Promise<boolean> {
            let removed = false;
            await write(async () => {
                const entries = await load();
                const remaining = entries.filter(entry => entry.id !== id);
                removed = remaining.length !== entries.length;
                if (removed) {
                    await save(remaining.map(cloneEntry));
                }
            });
            return removed;
        }
    };
}
