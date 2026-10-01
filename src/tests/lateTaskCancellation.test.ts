import { TFile } from 'obsidian';
import { researchAndSummarizeFile } from '../searchUtils';
import { translateFile } from '../translate';
import { SearchManager } from '../search/SearchManager';
import * as llmUtils from '../llmUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(settle => { resolve = settle; });
    return { promise, resolve };
}

function reporter(): ProgressReporter {
    let cancelled = false;
    const abortController = new AbortController();
    return {
        log: jest.fn(), updateStatus: jest.fn(), clearDisplay: jest.fn(), updateActiveTasks: jest.fn(), activeTasks: 0,
        abortController, get cancelled() { return cancelled; },
        requestCancel() { cancelled = true; abortController.abort(); }
    };
}

const source = Object.assign(new TFile(), { path: 'Notes/Topic.md', name: 'Topic.md', basename: 'Topic', extension: 'md', parent: { path: 'Notes' } });
const translated = Object.assign(new TFile(), { path: 'Translations/Topic_en.md', name: 'Topic_en.md', basename: 'Topic_en', extension: 'md' });
const settings = { ...mockSettings, useCustomTranslationSavePath: true, translationSavePath: 'Translations' };

describe('cancellation across the final awaited file boundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.vault.read as jest.Mock).mockResolvedValue('Original note');
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(translated);
        (mockApp.vault.createFolder as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('Generated text');
        jest.spyOn(SearchManager, 'getProvider').mockReturnValue({
            name: 'Tavily',
            search: jest.fn().mockResolvedValue([{ title: 'Source', url: 'https://example.invalid/source', content: 'Research evidence' }])
        });
    });

    afterEach(() => jest.restoreAllMocks());

    test('research cannot append when cancellation arrives during the final source read', async () => {
        const readStarted = deferred<void>();
        const readFinished = deferred<string>();
        (mockApp.vault.read as jest.Mock).mockImplementation(() => { readStarted.resolve(); return readFinished.promise; });
        const progress = reporter();
        const running = researchAndSummarizeFile(mockApp, mockSettings, source, progress);
        await readStarted.promise;
        progress.requestCancel();
        readFinished.resolve('Original note');
        await expect(running).rejects.toThrow(/cancelled by user/);
        expect(mockApp.vault.modify).not.toHaveBeenCalled();
    });

    test.each([
        { label: 'new translation', existing: null },
        { label: 'existing translation', existing: translated }
    ])('cancellation during folder creation preserves $label', async ({ existing }) => {
        const folderStarted = deferred<void>();
        const folderFinished = deferred<void>();
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => path === translated.path ? existing : null);
        (mockApp.vault.createFolder as jest.Mock).mockImplementation(() => { folderStarted.resolve(); return folderFinished.promise; });
        const progress = reporter();
        const running = translateFile(mockApp, settings, source, 'en', progress);
        await folderStarted.promise;
        progress.requestCancel();
        folderFinished.resolve();
        await expect(running).rejects.toThrow(/cancelled by user/);
        expect(mockApp.vault.create).not.toHaveBeenCalled();
        expect(mockApp.vault.modify).not.toHaveBeenCalled();
    });

    test('an explicit signal abort during folder preparation prevents translation output', async () => {
        const folderStarted = deferred<void>();
        const folderFinished = deferred<void>();
        const external = new AbortController();
        (mockApp.vault.createFolder as jest.Mock).mockImplementation(() => { folderStarted.resolve(); return folderFinished.promise; });
        const progress = reporter();
        const running = translateFile(mockApp, settings, source, 'en', progress, false, external.signal);
        await folderStarted.promise;
        external.abort();
        expect(progress.cancelled).toBe(false);
        folderFinished.resolve();
        await expect(running).rejects.toThrow(/cancelled by user/);
        expect(mockApp.vault.create).not.toHaveBeenCalled();
    });

    test('the reporter abort controller remains effective when no explicit signal was supplied', async () => {
        const folderStarted = deferred<void>();
        const folderFinished = deferred<void>();
        (mockApp.vault.createFolder as jest.Mock).mockImplementation(() => { folderStarted.resolve(); return folderFinished.promise; });
        const progress = reporter();
        const running = translateFile(mockApp, settings, source, 'en', progress);
        await folderStarted.promise;
        progress.abortController!.abort();
        expect(progress.cancelled).toBe(false);
        folderFinished.resolve();
        await expect(running).rejects.toThrow(/cancelled by user/);
        expect(mockApp.vault.create).not.toHaveBeenCalled();
    });

    test('a write already accepted before cancellation remains a completed result', async () => {
        const writeStarted = deferred<void>();
        const writeFinished = deferred<TFile>();
        (mockApp.vault.create as jest.Mock).mockImplementation(() => { writeStarted.resolve(); return writeFinished.promise; });
        const progress = reporter();
        const running = translateFile(mockApp, settings, source, 'en', progress);
        await writeStarted.promise;
        progress.requestCancel();
        writeFinished.resolve(translated);
        await expect(running).resolves.toEqual(expect.objectContaining({ created: true, outputPath: translated.path }));
    });
});
