import {
    createDiagramHistoryRepository,
    DiagramHistoryEntry
} from '../diagram/history/diagramHistoryRepository';

function entry(id: string, completedAt: number, overrides: Partial<DiagramHistoryEntry> = {}): DiagramHistoryEntry {
    return {
        id,
        completedAt,
        title: `Diagram ${id}`,
        sourcePath: `Notes/${id}.md`,
        intent: 'flowchart',
        sourceFormat: 'mermaid',
        artifactPath: `Diagrams/${id}.md`,
        exportPaths: {},
        status: 'completed',
        ...overrides
    };
}

describe('diagram history repository', () => {
    test('queries Vault history newest first with fuzzy text, filters, and pagination', async () => {
        let stored = [
            entry('old', 10, { title: 'Quarterly Revenue Flow' }),
            entry('new', 30, { title: 'Revenue Circuit', intent: 'circuit', sourceFormat: 'circuitikz', exportPaths: { png: 'new.png' } }),
            entry('mid', 20, { title: 'Team Sequence' })
        ];
        const repository = createDiagramHistoryRepository(async () => stored, async entries => { stored = entries; });

        const page = await repository.query({ search: 'rev cir', intent: 'circuit', exportKind: 'png', page: 1, pageSize: 20 });

        expect(page.items.map(item => item.id)).toEqual(['new']);
        expect(page.totalItems).toBe(1);
        expect(page.totalPages).toBe(1);
    });

    test('retains the newest entries without deleting artifact files', async () => {
        let stored: DiagramHistoryEntry[] = [];
        const repository = createDiagramHistoryRepository(async () => stored, async entries => { stored = entries; }, 2);

        await repository.recordCompleted(entry('one', 10));
        await repository.recordCompleted(entry('two', 20));
        await repository.recordCompleted(entry('three', 30));

        expect(stored.map(item => item.id)).toEqual(['three', 'two']);
    });

    test('returns clones so callers cannot mutate persisted records', async () => {
        let stored = [entry('safe', 10)];
        const repository = createDiagramHistoryRepository(async () => stored, async entries => { stored = entries; });

        const first = await repository.get('safe');
        first!.title = 'mutated';

        expect((await repository.get('safe'))?.title).toBe('Diagram safe');
    });
});

test('updates source and visual export paths without replacing existing metadata', async () => {
    let stored = [entry('one', 10, { artifactPath: undefined, exportPaths: {} })];
    const repository = createDiagramHistoryRepository(async () => stored, async entries => { stored = entries; });

    await repository.recordArtifactPath('one', 'Notes/Topic_diagram.tex');
    await repository.recordExportPath('one', 'png', 'Notes/Topic_preview.png');
    await repository.recordExportPath('one', 'pdf', 'Notes/Topic_preview.pdf');

    expect(await repository.get('one')).toEqual(expect.objectContaining({
        title: stored[0].title,
        artifactPath: 'Notes/Topic_diagram.tex',
        exportPaths: {
            png: 'Notes/Topic_preview.png',
            pdf: 'Notes/Topic_preview.pdf'
        }
    }));
});
