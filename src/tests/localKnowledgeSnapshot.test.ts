import { App, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';
import { buildLocalKnowledgeBaseRetriever } from '../localKnowledgeBase';
import { ProgressReporter } from '../types';

const settings = { ...DEFAULT_SETTINGS, enableLocalKnowledgeRetrieval: true, localKnowledgeBasePaths: 'Knowledge' };
const options = { topK: 3, slidingWindowSize: 0, maxSnippetChars: 300 };

function fixture() {
    const notes = new Map<string, { file: TFile; markdown: string }>(['first', 'second'].map(name => {
        const file = Object.assign(new TFile(), { path: `Knowledge/${name}.md`, basename: name, extension: 'md' });
        return [file.path, { file, markdown: `# ${name}\nIdempotency prevents duplicate payments.` }];
    }));
    const read = jest.fn(async (file: TFile) => {
        const entry = notes.get(file.path);
        if (!entry) throw Object.assign(new Error('File does not exist'), { code: 'ENOENT' });
        return entry.markdown;
    });
    const app = { vault: { getFiles: () => [...notes.values()].map(note => note.file), read } } as unknown as App;
    return { app, notes, read };
}

describe('local knowledge batch snapshots', () => {
    test('skips a candidate deleted after enumeration without discarding other knowledge', async () => {
        const vault = fixture();
        vault.read.mockImplementationOnce(async () => {
            vault.notes.delete('Knowledge/second.md');
            return '# First\nIdempotency prevents duplicate payments.';
        });
        const retriever = await buildLocalKnowledgeBaseRetriever(vault.app, settings);
        expect(retriever?.indexedFileCount).toBe(1);
        expect(retriever?.buildContextDetails('duplicate payments', options).sourcePaths).toEqual(['Knowledge/first.md']);
    });

    test('does not index a file moved outside the configured scope during its read', async () => {
        const vault = fixture();
        vault.notes.delete('Knowledge/second.md');
        vault.read.mockImplementationOnce(async file => {
            file.path = 'Private/renamed.md';
            return '# Moved\nIdempotency prevents duplicate payments.';
        });
        expect(await buildLocalKnowledgeBaseRetriever(vault.app, settings)).toBeNull();
    });

    test('keeps a built batch snapshot immutable; the next build sees edits and deletions', async () => {
        const vault = fixture();
        const retriever = await buildLocalKnowledgeBaseRetriever(vault.app, settings);
        vault.notes.get('Knowledge/first.md')!.markdown = '# First\nNew edited content about astronomy.';
        vault.notes.delete('Knowledge/second.md');
        const snapshot = retriever!.buildContextDetails('duplicate payments', options);
        expect(snapshot.sourcePaths).toHaveLength(2);
        expect(snapshot.context).toContain('Idempotency prevents duplicate payments.');
        const rebuilt = await buildLocalKnowledgeBaseRetriever(vault.app, settings);
        expect(rebuilt?.buildContext('duplicate payments', options)).toBeNull();
        expect(rebuilt?.buildContext('astronomy', options)).toContain('astronomy');
    });

    test('propagates read failures for files that still exist', async () => {
        const vault = fixture();
        vault.read.mockRejectedValueOnce(Object.assign(new Error('Access denied'), { code: 'EACCES' }));
        await expect(buildLocalKnowledgeBaseRetriever(vault.app, settings)).rejects.toThrow('Access denied');
    });

    test('does not read candidate bytes when a batch is already cancelled', async () => {
        const vault = fixture();
        const reporter = { cancelled: true, log: jest.fn() } as unknown as ProgressReporter;
        await expect(buildLocalKnowledgeBaseRetriever(vault.app, settings, reporter)).rejects.toThrow(/cancelled/i);
        expect(vault.read).not.toHaveBeenCalled();
    });
});
