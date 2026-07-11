import type { DiagramHistoryEntry } from './diagramHistoryRepository';

export function collectDiagramHistoryArtifactPaths(entry: DiagramHistoryEntry): string[] {
    const candidates = [entry.artifactPath, entry.exportPaths.svg, entry.exportPaths.png, entry.exportPaths.pdf];
    return [...new Set(candidates.filter((path): path is string => Boolean(path?.trim())))];
}
