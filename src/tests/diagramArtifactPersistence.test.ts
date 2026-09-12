import { App, TFile, TFolder } from 'obsidian';
import { saveDiagramArtifactFile } from '../fileUtils';
import { DEFAULT_SETTINGS } from '../constants';
import { ProgressReporter } from '../types';
import { RenderArtifact } from '../rendering/types';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function createArtifactVault() {
    const entries = new Map<string, TFile | TFolder>();
    const texts = new Map<string, string>();
    const binaries = new Map<string, ArrayBuffer>();
    const notes = Object.assign(new TFolder(), { path: 'Notes', children: [] });
    entries.set('Notes', notes);
    const beforeTextWrite = jest.fn<Promise<void>, [string, string]>().mockResolvedValue(undefined);
    const beforeTextTransform = jest.fn<Promise<void>, [TFile]>().mockResolvedValue(undefined);
    const moveFile = (file: TFile, nextPath: string) => {
        const previousPath = file.path;
        entries.delete(previousPath);
        file.path = nextPath;
        entries.set(nextPath, file);
        if (texts.has(previousPath)) {
            texts.set(nextPath, texts.get(previousPath)!);
            texts.delete(previousPath);
        }
        if (binaries.has(previousPath)) {
            binaries.set(nextPath, binaries.get(previousPath)!);
            binaries.delete(previousPath);
        }
    };
    const createText = (path: string, content: string) => {
        if (entries.has(path)) throw new Error(`File already exists: ${path}`);
        const file = Object.assign(new TFile(), { path, name: path.split('/').pop(), parent: notes });
        entries.set(path, file);
        texts.set(path, content);
        return file;
    };
    const modify = jest.fn(async (file: TFile, content: string) => {
        await beforeTextWrite(file.path, content);
        texts.set(file.path, content);
    });
    const processTails = new Map<TFile, Promise<unknown>>();
    const vault = {
        getAbstractFileByPath: (path: string) => entries.get(path) ?? null,
        createFolder: jest.fn(async (path: string) => {
            const folder = Object.assign(new TFolder(), { path, children: [] });
            entries.set(path, folder);
            return folder;
        }),
        read: jest.fn(async (file: TFile) => texts.get(file.path) ?? ''),
        readBinary: jest.fn(async (file: TFile) => binaries.get(file.path)!.slice(0)),
        create: jest.fn(async (path: string, content: string) => {
            await beforeTextWrite(path, content);
            return createText(path, content);
        }),
        createBinary: jest.fn(async (path: string, bytes: ArrayBuffer) => {
            if (entries.has(path)) throw new Error(`File already exists: ${path}`);
            const file = Object.assign(new TFile(), { path, parent: notes });
            entries.set(path, file);
            binaries.set(path, bytes.slice(0));
            return file;
        }),
        modify,
        modifyBinary: jest.fn(async (file: TFile, bytes: ArrayBuffer) => { binaries.set(file.path, bytes.slice(0)); }),
        process: jest.fn((file: TFile, transform: (text: string) => string) => {
            const operation = (processTails.get(file) ?? Promise.resolve()).then(async () => {
                await beforeTextTransform(file);
                const content = transform(texts.get(file.path) ?? '');
                await modify(file, content);
                return content;
            });
            processTails.set(file, operation.catch(() => undefined));
            return operation;
        }),
        delete: jest.fn(async (file: TFile | TFolder) => { entries.delete(file.path); texts.delete(file.path); binaries.delete(file.path); })
    };
    const source = (basename: string) => Object.assign(new TFile(), {
        path: `Notes/${basename}.md`, name: `${basename}.md`, basename, parent: notes
    });
    const seed = (basename: string) => {
        const primary = `Notes/${basename}_diagram.canvas`;
        [primary, `${primary}.svg`, `${primary}.md`].forEach(path => createText(path, `old:${path}`));
        return primary;
    };
    let cancelled = false;
    const reporter: ProgressReporter = {
        log: jest.fn(), updateStatus: jest.fn(), requestCancel: jest.fn(() => { cancelled = true; }), clearDisplay: jest.fn(),
        get cancelled() { return cancelled; }, activeTasks: 0, updateActiveTasks: jest.fn()
    };
    return { app: { vault } as unknown as App, vault, entries, texts, binaries, beforeTextWrite, beforeTextTransform, moveFile, source, seed, reporter };
}

function artifact(content: string): RenderArtifact {
    return {
        target: 'json-canvas', content, mimeType: 'application/json', sourceIntent: 'canvasMap',
        previewSvg: { content: `<svg>${content}</svg>`, mimeType: 'image/svg+xml' }
    };
}

describe('diagram artifact persistence ownership', () => {
    test.each(['first', 'second'])('preserves the successful same-basename save when the %s writer fails', async failedWriter => {
        const fixture = createArtifactVault();
        await fixture.vault.createFolder('Shared');
        const primary = 'Shared/Topic_diagram.canvas';
        for (const path of [primary, `${primary}.svg`, `${primary}.md`]) await fixture.vault.create(path, `old:${path}`);
        const sources = ['ProjectA', 'ProjectB'].map(directory => Object.assign(fixture.source('Topic'), {
            path: `${directory}/Topic.md`, parent: Object.assign(new TFolder(), { path: directory, children: [] })
        }));
        const settings = { ...DEFAULT_SETTINGS, useCustomSummarizeToMermaidSavePath: true, summarizeToMermaidSavePath: 'Shared' };
        const atFirstWrapper = deferred<void>();
        const releaseFirst = deferred<void>();
        let wrapperAttempt = 0;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path !== `${primary}.md`) return;
            const attempt = ++wrapperAttempt;
            if (attempt === 1) {
                atFirstWrapper.resolve();
                await releaseFirst.promise;
            }
            if ((attempt === 1 && failedWriter === 'first') || (attempt === 2 && failedWriter === 'second')) {
                throw new Error(`${failedWriter} wrapper failed`);
            }
        });
        const first = saveDiagramArtifactFile(fixture.app, settings, sources[0], artifact('first'), fixture.reporter).catch(error => error);
        await atFirstWrapper.promise;
        const second = saveDiagramArtifactFile(fixture.app, settings, sources[1], artifact('second'), fixture.reporter).catch(error => error);
        await new Promise(resolve => setImmediate(resolve));
        const bytesWhileFirstPaused = fixture.texts.get(primary);
        releaseFirst.resolve();
        const outcomes = await Promise.all([first, second]);
        const successfulWriter = failedWriter === 'first' ? 'second' : 'first';
        expect(bytesWhileFirstPaused).toBe('first');
        expect(outcomes[failedWriter === 'first' ? 0 : 1]).toBeInstanceOf(Error);
        expect(outcomes[failedWriter === 'first' ? 1 : 0]).toBe(`${primary}.md`);
        expect(fixture.texts.get(primary)).toBe(successfulWriter);
        expect(fixture.texts.get(`${primary}.svg`)).toBe(`<svg>${successfulWriter}</svg>`);
    });

    test('serializes distinct primary outputs that share a companion path', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const other = fixture.seed('Other');
        await fixture.vault.createFolder('Notes/shared');
        await fixture.vault.create('Notes/shared/source.txt', 'old companion');
        const atWrapper = deferred<void>();
        const release = deferred<void>();
        let failOnce = true;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md` && failOnce) {
                failOnce = false;
                atWrapper.resolve();
                await release.promise;
                throw new Error('first wrapper failed');
            }
        });
        const withCompanion = (content: string): RenderArtifact => ({ ...artifact(content),
            companions: [{ path: 'shared/source.txt', content, mimeType: 'text/plain' }] });
        const first = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), withCompanion('first'), fixture.reporter)
            .catch(error => error);
        await atWrapper.promise;
        const second = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Other'), withCompanion('second'), fixture.reporter);
        await new Promise(resolve => setImmediate(resolve));
        const companionWhilePaused = fixture.texts.get('Notes/shared/source.txt');
        const otherWhilePaused = fixture.texts.get(other);
        release.resolve();
        expect(await first).toBeInstanceOf(Error);
        await expect(second).resolves.toBe(`${other}.md`);
        expect(companionWhilePaused).toBe('first');
        expect(otherWhilePaused).toBe(`old:${other}`);
        expect(fixture.texts.get(primary)).toBe(`old:${primary}`);
        expect(fixture.texts.get(other)).toBe('second');
        expect(fixture.texts.get('Notes/shared/source.txt')).toBe('second');
    });

    test.each(['atomic', 'legacy'])('preserves a file moved before the %s text write starts', async host => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const movedPath = 'Notes/user-moved.svg';
        if (host === 'atomic') {
            fixture.beforeTextTransform.mockImplementationOnce(async file => { fixture.moveFile(file, movedPath); });
        } else {
            (fixture.vault as any).process = undefined;
            fixture.vault.read.mockImplementationOnce(async file => {
                const before = fixture.texts.get(file.path)!;
                fixture.moveFile(file, movedPath);
                return before;
            });
        }
        await expect(saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter))
            .rejects.toThrow(/replaced or moved/);
        expect(fixture.texts.get(movedPath)).toBe(`old:${primary}.svg`);
        expect(fixture.vault.modify).not.toHaveBeenCalled();
    });

    test('preserves a binary moved during its snapshot read', async () => {
        const fixture = createArtifactVault();
        fixture.seed('Source');
        const bytes = new Uint8Array([1, 2, 3]).buffer;
        await fixture.vault.createBinary('Notes/source.png', bytes);
        fixture.vault.readBinary.mockImplementationOnce(async file => {
            fixture.moveFile(file, 'Notes/user-moved.png');
            return bytes;
        });
        await expect(saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), {
            ...artifact('generated'), companions: [{ path: 'source.png', content: new Uint8Array([4, 5, 6]).buffer,
                binary: true, mimeType: 'image/png' }]
        }, fixture.reporter)).rejects.toThrow(/replaced or moved/);
        expect(new Uint8Array(fixture.binaries.get('Notes/user-moved.png')!)).toEqual(new Uint8Array(bytes));
        expect(fixture.vault.modifyBinary).not.toHaveBeenCalled();
    });

    test.each(['moved', 'replaced'])('preserves a file %s while atomic compensation waits for the host', async change => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const savedFile = fixture.entries.get(primary) as TFile;
        const movedPath = 'Notes/user-moved.canvas';
        let restoring = false;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md`) {
                restoring = true;
                throw new Error('wrapper write failed');
            }
        });
        fixture.beforeTextTransform.mockImplementation(async file => {
            if (!restoring || file !== savedFile) return;
            if (change === 'moved') fixture.moveFile(file, movedPath);
            else fixture.entries.set(primary, Object.assign(new TFile(), { path: primary }));
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter)
            .catch(error => error);
        expect(fixture.texts.get(change === 'moved' ? movedPath : primary)).toBe('generated');
        const recovery = failure.recovery.find((entry: { path: string }) => entry.path === primary);
        expect(recovery.reason).toMatch(/replaced or moved/);
        expect(fixture.texts.get(recovery.recoveryPath)).toBe(`old:${primary}`);
    });

    test('does not begin a legacy text write when cancelled during its snapshot read', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        (fixture.vault as any).process = undefined;
        fixture.vault.read.mockImplementation(async file => {
            fixture.reporter.requestCancel();
            return fixture.texts.get(file.path) ?? '';
        });
        await expect(saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('new'), fixture.reporter))
            .rejects.toThrow(/cancelled/);
        expect(fixture.vault.modify).not.toHaveBeenCalled();
        expect(fixture.texts.get(`${primary}.svg`)).toBe(`old:${primary}.svg`);
    });

    test('stops creating parent directories after cancellation during folder creation', async () => {
        const fixture = createArtifactVault();
        fixture.vault.createFolder.mockImplementation(async path => {
            fixture.reporter.requestCancel();
            const folder = Object.assign(new TFolder(), { path, children: [] });
            fixture.entries.set(path, folder);
            return folder;
        });
        await expect(saveDiagramArtifactFile(fixture.app, { ...DEFAULT_SETTINGS,
            useCustomSummarizeToMermaidSavePath: true, summarizeToMermaidSavePath: 'Output/Nested'
        }, fixture.source('Source'), artifact('new'), fixture.reporter)).rejects.toThrow(/cancelled/);
        expect(fixture.vault.createFolder).toHaveBeenCalledTimes(1);
        expect(fixture.vault.create).not.toHaveBeenCalled();
    });

    test('does not begin a binary write when cancelled during its snapshot read', async () => {
        const fixture = createArtifactVault();
        fixture.seed('Source');
        await fixture.vault.createBinary('Notes/preview.bin', new Uint8Array([1]).buffer);
        fixture.vault.readBinary.mockImplementation(async () => {
            fixture.reporter.requestCancel();
            return new Uint8Array([1]).buffer;
        });
        await expect(saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), {
            ...artifact('new'), companions: [{ path: 'preview.bin', content: new Uint8Array([2]).buffer,
                binary: true, mimeType: 'application/octet-stream' }]
        }, fixture.reporter)).rejects.toThrow(/cancelled/);
        expect(fixture.vault.modifyBinary).not.toHaveBeenCalled();
        expect(new Uint8Array(fixture.binaries.get('Notes/preview.bin')!)).toEqual(new Uint8Array([1]));
    });

    test('serializes overlapping saves so a failed writer cannot undo its successor', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const paused = deferred<void>();
        const release = deferred<void>();
        let firstWrapper = true;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md` && firstWrapper) {
                firstWrapper = false;
                paused.resolve();
                await release.promise;
            }
        });
        const first = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('first'), fixture.reporter).catch(error => error);
        await paused.promise;
        const second = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('second'), fixture.reporter);
        await new Promise(resolve => setImmediate(resolve));
        const beforeFailure = fixture.texts.get(primary);
        release.reject(new Error('first wrapper failed'));
        expect(await first).toBeInstanceOf(Error);
        await expect(second).resolves.toBe(`${primary}.md`);
        expect(beforeFailure).toBe('first');
        expect(fixture.texts.get(primary)).toBe('second');
        expect(fixture.texts.get(`${primary}.svg`)).toBe('<svg>second</svg>');
    });

    test('lets independent artifacts in the same folder complete while another writer is paused', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const other = fixture.seed('Other');
        const paused = deferred<void>();
        const release = deferred<void>();
        let firstWrapper = true;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md` && firstWrapper) {
                firstWrapper = false;
                paused.resolve();
                await release.promise;
            }
        });
        const first = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('first'), fixture.reporter).catch(error => error);
        await paused.promise;
        let secondComplete = false;
        const second = saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Other'), artifact('second'), fixture.reporter)
            .then(() => { secondComplete = true; });
        await new Promise(resolve => setImmediate(resolve));
        const completedIndependently = secondComplete;
        release.reject(new Error('first wrapper failed'));
        await Promise.all([first, second]);
        expect(completedIndependently).toBe(true);
        expect(fixture.texts.get(other)).toBe('second');
    });

    test('preserves external edits and exposes the preimage through a recovery copy', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        let fail = true;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md` && fail) {
                fail = false;
                fixture.texts.set(primary, 'external edit');
                throw new Error('wrapper write failed');
            }
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(fixture.texts.get(primary)).toBe('external edit');
        expect(failure.name).toBe('DiagramArtifactSaveError');
        expect(failure.message).toContain('wrapper write failed');
        const recovery = failure.recovery.find((entry: { path: string }) => entry.path === primary);
        expect(recovery.recoveryPath).toBeTruthy();
        expect(fixture.texts.get(recovery.recoveryPath)).toBe(`old:${primary}`);
        expect(failure.message).toContain(recovery.recoveryPath);
    });

    test('reports restoration errors instead of swallowing them', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        fixture.beforeTextWrite.mockImplementation(async (path, content) => {
            if (path === `${primary}.md`) throw new Error('wrapper write failed');
            if (path === primary && content === `old:${primary}`) throw new Error('restore denied');
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(failure.message).toContain('restore denied');
        const recovery = failure.recovery.find((entry: { path: string }) => entry.path === primary);
        expect(fixture.texts.get(recovery.recoveryPath)).toBe(`old:${primary}`);
    });

    test('retains a created file changed by another writer when later persistence fails', async () => {
        const fixture = createArtifactVault();
        const primary = 'Notes/Source_diagram.canvas';
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md`) {
                fixture.texts.set(primary, 'external edit');
                throw new Error('wrapper write failed');
            }
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(fixture.texts.get(primary)).toBe('external edit');
        expect(fixture.entries.has(primary)).toBe(true);
        expect(failure.recovery).toEqual(expect.arrayContaining([expect.objectContaining({ path: primary })]));
    });

    test('preserves a binary recovery copy when no atomic binary restoration primitive exists', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const binaryPath = 'Notes/source.png';
        const original = new Uint8Array([1, 2, 3]).buffer;
        await fixture.vault.createBinary(binaryPath, original);
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md`) throw new Error('wrapper write failed');
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), {
            ...artifact('generated'), companions: [{ path: 'source.png', content: new Uint8Array([4, 5, 6]).buffer, mimeType: 'image/png', binary: true }]
        }, fixture.reporter).catch(error => error);
        expect(failure.name).toBe('DiagramArtifactSaveError');
        const recovery = failure.recovery.find((entry: { path: string }) => entry.path === binaryPath);
        expect(new Uint8Array(fixture.binaries.get(recovery.recoveryPath)!)).toEqual(new Uint8Array(original));
    });

    test('keeps legacy hosts functional without performing a non-atomic text rollback', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        const legacyApp = { vault: { ...fixture.vault, process: undefined } } as unknown as App;
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path === `${primary}.md`) {
                fixture.texts.set(primary, 'external edit');
                throw new Error('wrapper write failed');
            }
        });
        const failure = await saveDiagramArtifactFile(legacyApp, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(fixture.texts.get(primary)).toBe('external edit');
        const recovery = failure.recovery.find((entry: { path: string }) => entry.path === primary);
        expect(recovery.reason).toMatch(/no atomic text/);
        expect(fixture.texts.get(recovery.recoveryPath)).toBe(`old:${primary}`);
        expect(fixture.vault.modify).not.toHaveBeenCalledWith(fixture.entries.get(primary), `old:${primary}`);
    });

    test('rejects companion collisions before any artifact is written', async () => {
        const fixture = createArtifactVault();
        await expect(saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), {
            ...artifact('generated'), companions: [{ path: 'Source_diagram.canvas', content: 'collision', mimeType: 'text/plain' }]
        }, fixture.reporter)).rejects.toThrow(/collides/);
        expect(fixture.vault.create).not.toHaveBeenCalled();
        expect(fixture.vault.modify).not.toHaveBeenCalled();
    });

    test('reports a failed recovery copy while preserving the conflicting edit', async () => {
        const fixture = createArtifactVault();
        const primary = fixture.seed('Source');
        fixture.beforeTextWrite.mockImplementation(async path => {
            if (path.includes('.notemd-recovery-')) throw new Error('recovery storage denied');
            if (path === `${primary}.md`) {
                fixture.texts.set(primary, 'external edit');
                throw new Error('wrapper write failed');
            }
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(fixture.texts.get(primary)).toBe('external edit');
        expect(failure.message).toContain('wrapper write failed');
        expect(failure.message).toContain('recovery storage denied');
        expect(failure.recovery).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: primary, recoveryError: 'recovery storage denied' })
        ]));
    });

    test('reports a partially created file even when the create call rejects', async () => {
        const fixture = createArtifactVault();
        const create = fixture.vault.create.getMockImplementation()!;
        fixture.vault.create.mockImplementationOnce(async (path, content) => {
            await create(path, content);
            throw new Error('write acknowledgement failed');
        });
        const failure = await saveDiagramArtifactFile(fixture.app, DEFAULT_SETTINGS, fixture.source('Source'), artifact('generated'), fixture.reporter).catch(error => error);
        expect(fixture.texts.get('Notes/Source_diagram.canvas.svg')).toBe('<svg>generated</svg>');
        expect(failure.recovery).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: 'Notes/Source_diagram.canvas.svg' })
        ]));
    });
});
