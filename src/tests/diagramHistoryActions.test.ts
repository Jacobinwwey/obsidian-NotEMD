import { collectDiagramHistoryArtifactPaths } from '../diagram/history/diagramHistoryActions';
import type { DiagramHistoryEntry } from '../diagram/history/diagramHistoryRepository';

function historyEntry(overrides: Partial<DiagramHistoryEntry> = {}): DiagramHistoryEntry {
    return {
        id: 'one', completedAt: 1, title: 'One', intent: 'circuit', sourceFormat: 'circuitikz',
        artifactPath: 'Diagrams/one.tex', exportPaths: { svg: 'Diagrams/one.svg', png: 'Diagrams/one.png' }, status: 'completed',
        ...overrides
    };
}

describe('diagram history artifact actions', () => {
    test('collects source artifact and visual exports without deleting the source note', () => {
        expect(collectDiagramHistoryArtifactPaths(historyEntry({ sourcePath: 'Notes/source.md' }))).toEqual([
            'Diagrams/one.tex', 'Diagrams/one.svg', 'Diagrams/one.png'
        ]);
    });

    test('deduplicates paths and ignores blank values', () => {
        expect(collectDiagramHistoryArtifactPaths(historyEntry({
            artifactPath: 'Diagrams/one.svg',
            exportPaths: { svg: 'Diagrams/one.svg', pdf: '' }
        }))).toEqual(['Diagrams/one.svg']);
    });
});
