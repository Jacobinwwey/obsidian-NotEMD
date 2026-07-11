import { cloneDiagramHistoryEntry, DiagramHistoryEntry, DiagramHistoryExportKind, DiagramHistoryPage, DiagramHistoryQuery, queryDiagramHistoryEntries } from './diagramHistoryQuery';
export type { DiagramHistoryEntry, DiagramHistoryExportKind, DiagramHistoryPage, DiagramHistoryQuery } from './diagramHistoryQuery';

type LoadEntries = () => Promise<DiagramHistoryEntry[]>;
type SaveEntries = (entries: DiagramHistoryEntry[]) => Promise<void>;


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
                entries.push(cloneDiagramHistoryEntry(entry));
                entries.sort((left, right) => right.completedAt - left.completedAt);
                await save(entries.slice(0, Math.max(1, retentionLimit)).map(cloneDiagramHistoryEntry));
            });
        },
        async query(query: DiagramHistoryQuery = {}): Promise<DiagramHistoryPage> {
            return queryDiagramHistoryEntries(await load(), query);
        },
        async get(id: string): Promise<DiagramHistoryEntry | null> {
            const entry = (await load()).find(candidate => candidate.id === id);
            return entry ? cloneDiagramHistoryEntry(entry) : null;
        },
        async recordArtifactPath(id: string, artifactPath: string): Promise<boolean> {
            let updated = false;
            await write(async () => {
                const entries = await load();
                const entry = entries.find(candidate => candidate.id === id);
                if (!entry) return;
                entry.artifactPath = artifactPath;
                updated = true;
                await save(entries.map(cloneDiagramHistoryEntry));
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
                await save(entries.map(cloneDiagramHistoryEntry));
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
                    await save(remaining.map(cloneDiagramHistoryEntry));
                }
            });
            return removed;
        }
    };
}
