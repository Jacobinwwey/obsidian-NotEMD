import type { DiagramHistoryEntry } from './diagramHistoryRepository';

export function collectDiagramHistoryArtifactPaths(entry: DiagramHistoryEntry): string[] {
    const candidates = [entry.artifactPath, ...Object.values(entry.exportPaths), entry.exportManifestPath, ...(entry.companionPaths ?? [])];
    return [...new Set(candidates.filter((path): path is string => Boolean(path?.trim())))];
}
