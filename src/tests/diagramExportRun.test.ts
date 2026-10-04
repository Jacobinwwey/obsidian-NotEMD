import { webcrypto } from 'crypto';
import type { App } from 'obsidian';
import { startDiagramExportRun, retryDiagramExportRun, readDiagramExportRun, normalizeDiagramExportCacheFolder } from '../diagram/diagramExportRun';
import type { DiagramGenerationResult } from '../diagram/diagramGenerationService';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="30">中文 café</text></svg>';
const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe('recoverable diagram multi-format export', () => {
    beforeAll(() => { Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto }); });
    function fixture() {
        const files = new Map<string, ArrayBuffer>();
        const folders = new Set<string>();
        const adapter = {
            list: jest.fn(async (folder: string) => ({ files: [...files.keys()].filter(path => path.slice(0, Math.max(0, path.lastIndexOf('/'))) === folder), folders: [...folders] })),
            stat: jest.fn(async (path: string) => folders.has(path) ? { type: 'folder' } : files.has(path) ? { type: 'file' } : null),
            exists: jest.fn(async (path: string) => files.has(path) || folders.has(path)),
            mkdir: jest.fn(async (path: string) => { folders.add(path); }),
            read: jest.fn(async (path: string) => new TextDecoder().decode(files.get(path))),
            readBinary: jest.fn(async (path: string) => { if (!files.has(path)) throw new Error('Missing file'); return files.get(path)!.slice(0); }),
            write: jest.fn(async (path: string, content: string) => { files.set(path, encode(content)); }),
            writeBinary: jest.fn(async (path: string, content: ArrayBuffer) => { files.set(path, content.slice(0)); }),
            process: jest.fn(async (path: string, update: (text: string) => string) => {
                const text = update(new TextDecoder().decode(files.get(path)));
                files.set(path, encode(text));
                return text;
            }),
            rename: jest.fn(async (from: string, to: string) => {
                if (files.has(to)) throw new Error('Destination file already exists!');
                files.set(to, files.get(from)!); files.delete(from);
            }),
            remove: jest.fn(async (path: string) => { files.delete(path); })
        };
        const app = { vault: { adapter } } as unknown as App;
        const generation: DiagramGenerationResult = {
            spec: { intent: 'flowchart', title: '中文 café', nodes: [{ id: 'a', label: '中文 café' }], edges: [] },
            plan: { intent: 'flowchart', catalogTypeId: 'flowchart', confidence: 1, reasons: [], renderTarget: 'mermaid', fallbackTargets: [], mermaidDiagramType: 'flowchart', legacyCompatibilityMode: false },
            artifact: { target: 'mermaid', content: 'flowchart TD\n a[中文 café]', mimeType: 'text/vnd.mermaid', sourceIntent: 'flowchart' }
        };
        const deps = {
            renderSvg: jest.fn<Promise<string>, [DiagramGenerationResult['artifact']]>(async () => svg),
            renderPng: jest.fn(async () => new Uint8Array([137,80,78,71,13,10,26,10,1]).buffer),
            decodePng: jest.fn(async () => true),
            renderPdf: jest.fn(async () => encode('%PDF-1.4\nvalid test document')),
            renderSummary: jest.fn(async () => '<!doctype html><html><body>中文 café</body></html>')
        };
        const reporter = { cancelled: false, log: jest.fn() };
        return { files, folders, app, adapter, generation, deps, reporter };
    }

    test('adds a verified companion while retaining the PPI-labelled original and both receipts', async () => {
        const test = fixture();
        test.deps.decodePng.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps);
        const output = run.outputs[0];
        expect(run.status).toBe('completed');
        expect(output.files.map(file => file.path)).toEqual(['Notes/topic_flowchart_300ppi.png', 'Notes/topic_flowchart_obsidian_299ppi.png']);
        expect(output.path).toBe(output.files[1].path);
        expect(JSON.parse(new TextDecoder().decode(test.files.get(run.manifestPath))).obsidianCompatiblePng).toBe(true);
        await expect(readDiagramExportRun(test.app, run.manifestPath)).resolves.toBeDefined();
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.deps.renderPng).toHaveBeenCalledTimes(2);
    });

    test('compatibility off freezes unchecked single original across retry', async () => {
        const test = fixture();
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps, { obsidianCompatiblePng: false });
        expect(run.outputs[0].path).toBe('Notes/topic_flowchart_300ppi.png');
        expect(run.outputs[0].files).toHaveLength(1);
        expect(test.deps.decodePng).not.toHaveBeenCalled();
        await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(test.deps.decodePng).not.toHaveBeenCalled();
    });

    test('failed compatibility still commits the original and can be retried', async () => {
        const test = fixture();
        test.deps.decodePng.mockResolvedValue(false);
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps);
        expect(run.status).toBe('partial');
        expect(run.outputs[0].files.map(file => file.path)).toEqual(['Notes/topic_flowchart_300ppi.png']);
        expect(run.outputs[0].status).toBe('failed');
        test.deps.decodePng.mockResolvedValueOnce(false).mockResolvedValue(true);
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.outputs[0].files).toHaveLength(2);
    });

    test.each(['density', 'snapshot', 'path', 'receipt'])('rejects tampered PNG %s before retry writes', async field => {
        const test = fixture();
        test.deps.decodePng.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps);
        const manifest = JSON.parse(await test.adapter.read(run.manifestPath));
        if (field === 'density') manifest.outputs[0].compatiblePpi = 300;
        if (field === 'snapshot') manifest.obsidianCompatiblePng = false;
        if (field === 'path') manifest.outputs[0].path = 'outside.png';
        if (field === 'receipt') manifest.outputs[0].files[1].path = 'outside.png';
        test.files.set(run.manifestPath, encode(JSON.stringify(manifest)));
        test.adapter.writeBinary.mockClear();
        await expect(retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps)).rejects.toThrow();
        expect(test.adapter.writeBinary).not.toHaveBeenCalled();
    });

    test('cancellation after the original is committed preserves the frozen companion path on retry', async () => {
        const test = fixture();
        test.deps.decodePng.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const rename = test.adapter.rename.getMockImplementation()!;
        test.adapter.rename.mockImplementation(async (from, to) => {
            await rename(from, to);
            if (to.endsWith('_300ppi.png')) test.reporter.cancelled = true;
        });
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps);
        expect(run.status).toBe('cancelled');
        expect(run.outputs[0].files).toHaveLength(1);
        const original = test.files.get(run.outputs[0].files[0].path);
        test.adapter.rename.mockImplementation(rename);
        test.reporter.cancelled = false;
        test.deps.decodePng.mockResolvedValue(true);
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.outputs[0].path).toBe('Notes/topic_flowchart_obsidian_299ppi.png');
        expect(retried.outputs[0].files).toHaveLength(2);
        expect(test.files.get(retried.outputs[0].files[0].path)).toEqual(original);
    });

    test('recovers legacy v3 PNGs without applying current compatibility or renaming files', async () => {
        const test = fixture();
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['png'], 300, test.reporter, test.deps, { obsidianCompatiblePng: false });
        const manifest = JSON.parse(await test.adapter.read(run.manifestPath));
        manifest.version = 3;
        delete manifest.obsidianCompatiblePng;
        const legacyPath = 'Notes/topic_flowchart.png';
        test.files.set(legacyPath, test.files.get(manifest.outputs[0].path)!);
        manifest.outputs[0].path = legacyPath;
        manifest.outputs[0].files[0].path = legacyPath;
        manifest.outputs[0].status = 'failed';
        test.files.set(run.manifestPath, encode(JSON.stringify(manifest)));
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.outputs[0].path).toBe(legacyPath);
        expect(test.deps.decodePng).not.toHaveBeenCalled();
    });

    test('writes the requested formats from one shared SVG and preserves Unicode', async () => {
        const test = fixture();
        const run = await startDiagramExportRun(test.app, 'Notes/中文.md', test.generation, ['source:mermaid','svg','png','pdf','html-diagram','html-summary'], 300, test.reporter, test.deps);
        expect(run.status).toBe('completed');
        expect(run.outputs.find(output => output.id === 'pdf')!.path).toBe('Notes/中文_flowchart.pdf');
        expect(run.outputs.find(output => output.id === 'source:mermaid')!.path).toBe('Notes/中文_flowchart.md');
        expect(run.outputs).toHaveLength(6);
        expect(run.outputs.every(output => output.status === 'completed')).toBe(true);
        expect(run.outputs.every(output => output.path.slice(0, output.path.lastIndexOf('/')) === 'Notes')).toBe(true);
        expect(run.manifestPath.slice(0, run.manifestPath.lastIndexOf('/'))).toBe('Notes/notemd_assert');
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
        expect(test.deps.renderSummary).toHaveBeenCalledTimes(1);
        const html = new TextDecoder().decode(test.files.get(run.outputs.find(output => output.id === 'html-diagram')!.path));
        expect(html).toContain('charset="utf-8"');
        expect(html).not.toContain('\ufffd');
        expect(test.adapter.rename).toHaveBeenCalled();
    });

    test.each(['Exports', ''])('writes directly into an explicitly selected folder %s, including the vault root', async folder => {
        const test = fixture();
        const run = await startDiagramExportRun(test.app, 'Notes/中文.md', test.generation, ['source:mermaid', 'svg', 'html-diagram'], 300, test.reporter, test.deps, { outputFolder: folder });
        expect(run.status).toBe('completed');
        for (const output of run.outputs) {
            expect(output.path.split('/').slice(0, -1).join('/')).toBe(folder);
        }
        expect(test.adapter.mkdir).not.toHaveBeenCalledWith('');
    });

    test('uses distinct filenames for repeated exports without replacing existing files', async () => {
        const test = fixture();
        const first = await startDiagramExportRun(test.app, 'Notes/中文.md', test.generation, ['svg'], 300, test.reporter, test.deps);
        test.files.set(first.outputs[0].path, encode('user edited output'));
        const next = await startDiagramExportRun(test.app, 'Notes/中文.md', test.generation, ['svg'], 300, test.reporter, test.deps);
        expect(first.outputs[0].path).not.toBe(next.outputs[0].path);
        expect(next.outputs[0].path).toBe('Notes/中文_flowchart-2.svg');
        expect(new TextDecoder().decode(test.files.get(first.outputs[0].path))).toBe('user edited output');
        expect(test.folders).toEqual(new Set(['Notes', 'Notes/notemd_assert']));
    });

    test('concurrent exports can initialize one shared cache folder without losing a batch', async () => {
        const test = fixture();
        test.adapter.mkdir.mockImplementation(async path => {
            if (test.folders.has(path)) throw new Error('Already exists');
            test.folders.add(path);
        });
        const runs = await Promise.all(['Notes/A.md', 'Notes/B.md'].map(path => startDiagramExportRun(
            test.app, path, test.generation, ['svg'], 300, test.reporter, test.deps, { cacheFolder: 'Shared/Cache' }
        )));
        expect(runs.every(run => run.status === 'completed')).toBe(true);
        expect(runs[0].manifestPath).not.toBe(runs[1].manifestPath);
    });

    test('reserves case-insensitive stems across concurrent runs and all extensions', async () => {
        const test = fixture();
        test.files.set('Notes/TOPIC_FLOWCHART.pdf', encode('existing'));
        test.folders.add('Notes');
        const runs = await Promise.all(['svg', 'pdf'].map(format => startDiagramExportRun(
            test.app, 'Notes/topic.md', test.generation, [format], 300, test.reporter, test.deps
        )));
        expect(runs.map(run => run.outputs[0].path).sort()).toEqual(['Notes/topic_flowchart-2.svg', 'Notes/topic_flowchart-3.pdf']);
        expect(runs.every(run => run.status === 'completed')).toBe(true);
    });

    test.each(['../private', '/outside', 'E:/private', 'CON', 'Cache/../private'])('rejects unsafe cache folder %s before any writes', async cacheFolder => {
        const test = fixture();
        await expect(startDiagramExportRun(test.app, 'topic.md', test.generation, ['svg'], 300, test.reporter, test.deps, { cacheFolder })).rejects.toThrow(/path|folder/);
        expect(test.files.size).toBe(0);
        expect(test.folders.size).toBe(0);
    });

    test('normalizes Windows folder separators without accepting absolute or parent paths', () => {
        expect(normalizeDiagramExportCacheFolder('  Shared\\中文/ ')).toBe('Shared/中文');
        expect(normalizeDiagramExportCacheFolder('  ')).toBe('');
        expect(() => normalizeDiagramExportCacheFolder('/')).toThrow();
        expect(() => normalizeDiagramExportCacheFolder('..\\private')).toThrow();
    });

    test('retains completed files after failure and retries only the failed output', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('PDF dependency unavailable'));
        const first = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['svg','pdf'], 300, test.reporter, test.deps);
        expect(first.status).toBe('partial');
        const firstSvg = first.outputs.find(output => output.id === 'svg')!;
        const bytes = test.files.get(firstSvg.path)!.slice(0);
        const retried = await retryDiagramExportRun(test.app, first.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
        expect(test.deps.renderPdf).toHaveBeenCalledTimes(2);
        expect(test.files.get(firstSvg.path)).toEqual(bytes);
    });

    test('degrades unavailable image exports to a usable source without hiding the failed request', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('PDF unavailable'));
        const run = await startDiagramExportRun(test.app, '中文.md', test.generation, ['pdf'], 300, test.reporter, test.deps);
        expect(run.status).toBe('partial');
        expect(run.outputs.map(output => [output.id, output.status])).toEqual([['pdf', 'failed'], ['source:mermaid', 'completed']]);
        expect(run.plan.usedDefaultOutput).toBe(true);
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
    });

    test('cancellation prevents a late render from committing and preserves earlier files', async () => {
        const test = fixture();
        test.deps.renderPdf.mockImplementationOnce(async () => { test.reporter.cancelled = true; return encode('%PDF-1.4'); });
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['svg','pdf','html-diagram'], 300, test.reporter, test.deps);
        expect(run.status).toBe('cancelled');
        expect(run.outputs[0].status).toBe('completed');
        expect(test.files.has(run.outputs[0].path)).toBe(true);
        expect(test.files.has(run.outputs[1].path)).toBe(false);
        expect(test.files.has(run.outputs[2].path)).toBe(false);
    });

    test('does not overwrite a user-edited successful artifact during retry', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('retry me'));
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['svg','pdf'], 300, test.reporter, test.deps);
        test.files.set(run.outputs[0].path, encode('user edit'));
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('partial');
        expect(new TextDecoder().decode(test.files.get(run.outputs[0].path))).toBe('user edit');
        expect(retried.outputs[0].error).toMatch(/changed/i);
    });

    test('resumes cancellation between a native source and its companion without rewriting the source', async () => {
        const test = fixture();
        test.generation.artifact.companions = [{ path: 'images/中文.svg', content: svg, mimeType: 'image/svg+xml' }];
        const rename = test.adapter.rename.getMockImplementation()!;
        test.adapter.rename.mockImplementation(async (from, to) => {
            await rename(from, to);
            if (to.endsWith('_flowchart.md')) test.reporter.cancelled = true;
        });
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['source:mermaid'], 300, test.reporter, test.deps);
        expect(run.status).toBe('cancelled');
        expect(run.outputs[0].files).toHaveLength(1);
        const source = test.files.get(run.outputs[0].path)!.slice(0);
        test.adapter.rename.mockImplementation(rename);
        test.adapter.rename.mockClear();
        test.reporter.cancelled = false;
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.outputs[0].files).toHaveLength(2);
        expect(test.files.get(run.outputs[0].path)).toEqual(source);
        expect(test.adapter.rename.mock.calls.every(([, to]) => to !== run.outputs[0].path)).toBe(true);
    });

    test('rejects manifest path traversal before reading from the Vault', async () => {
        const test = fixture();
        await expect(retryDiagramExportRun(test.app, '../private.json', test.reporter, test.deps)).rejects.toThrow(/path/i);
        expect(test.adapter.read).not.toHaveBeenCalled();
    });

    test('native companion bytes survive persistence and are verified on retry', async () => {
        const test = fixture();
        test.generation.artifact.companions = [{ path: 'images/中文.png', content: new Uint8Array([137, 80, 78, 71]).buffer, binary: true, mimeType: 'image/png' }];
        test.deps.renderPdf.mockRejectedValueOnce(new Error('later'));
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['source:mermaid', 'pdf'], 300, test.reporter, test.deps);
        expect(run.outputs[0].files).toHaveLength(2);
        const companion = run.outputs[0].files[1];
        expect(new Uint8Array(test.files.get(companion.path)!)).toEqual(new Uint8Array([137, 80, 78, 71]));
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.outputs[0].files).toEqual(run.outputs[0].files);
    });

    test.each(['../outside.png', '/absolute.png', 'C:/private.png'])('refuses unsafe companion %s before publishing files', async path => {
        const test = fixture();
        test.generation.artifact.companions = [{ path, content: 'invalid', mimeType: 'text/plain' }];
        await expect(startDiagramExportRun(test.app, 'topic.md', test.generation, ['source:mermaid'], 300, test.reporter, test.deps)).rejects.toThrow(/path/i);
        expect(test.files.size).toBe(0);
    });

    test.each(['images/a.svg', 'IMAGES/A.SVG', 'images/a.svg/child'])('rejects duplicate, case-colliding and file-parent companion paths %s', async path => {
        const test = fixture();
        test.generation.artifact.companions = ['images/a.svg', path].map(path => ({ path, content: svg, mimeType: 'image/svg+xml' }));
        await expect(startDiagramExportRun(test.app, 'topic.md', test.generation, ['source:mermaid'], 300, test.reporter, test.deps)).rejects.toThrow(/path/i);
        expect(test.files.size).toBe(0);
    });

    test('reads and retries legacy v1 directory snapshots in place', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('legacy converter unavailable'));
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['svg', 'pdf'], 300, test.reporter, test.deps);
        const manifest = JSON.parse(new TextDecoder().decode(test.files.get(run.manifestPath)));
        const directory = 'Notes/topic_diagram-legacy';
        manifest.version = 1;
        delete manifest.outputStem;
        manifest.manifestPath = `${directory}/run.notemd-diagram.json`;
        for (const output of manifest.outputs) {
            const oldPath = output.path;
            output.path = `${directory}/diagram.${output.id}`;
            output.files.forEach((file: { path: string }) => { file.path = output.path; });
            if (test.files.has(oldPath)) test.files.set(output.path, test.files.get(oldPath)!);
        }
        test.files.set(manifest.manifestPath, encode(JSON.stringify(manifest)));
        const loaded = await readDiagramExportRun(test.app, manifest.manifestPath);
        expect(loaded.run.outputs[0].path).toBe(`${directory}/diagram.svg`);
        test.adapter.rename.mockClear();
        const retried = await retryDiagramExportRun(test.app, manifest.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
        expect(test.adapter.rename.mock.calls.map(([, to]) => to)).toEqual([`${directory}/diagram.pdf`]);
        expect(JSON.parse(await test.adapter.read(manifest.manifestPath)).version).toBe(1);
    });

    test('reads and retries legacy v2 sibling snapshots without renaming completed files', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('unavailable'));
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['svg', 'pdf'], 300, test.reporter, test.deps);
        const manifest = JSON.parse(await test.adapter.read(run.manifestPath));
        manifest.version = 2;
        manifest.outputStem = 'Notes/topic_diagram-legacy';
        manifest.manifestPath = 'Notes/notemd_assert/topic_diagram-legacy.run.notemd-diagram.json';
        for (const output of manifest.outputs) {
            const oldPath = output.path;
            output.path = `${manifest.outputStem}.${output.id}`;
            output.files.forEach((file: { path: string }) => { file.path = output.path; });
            if (test.files.has(oldPath)) test.files.set(output.path, test.files.get(oldPath)!);
        }
        test.files.set(manifest.manifestPath, encode(JSON.stringify(manifest)));
        test.adapter.rename.mockClear();
        const retried = await retryDiagramExportRun(test.app, manifest.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.adapter.rename.mock.calls.map(([, to]) => to)).toEqual(['Notes/topic_diagram-legacy.pdf']);
        expect(JSON.parse(await test.adapter.read(manifest.manifestPath)).version).toBe(2);
    });

    test.each(['output', 'receipt', 'companion', 'version'])('rejects tampered v3 %s paths before writing on retry', async field => {
        const test = fixture();
        test.generation.artifact.companions = [{ path: 'images/a.svg', content: svg, mimeType: 'image/svg+xml' }];
        const run = await startDiagramExportRun(test.app, 'topic.md', test.generation, ['source:mermaid'], 300, test.reporter, test.deps);
        const manifest = JSON.parse(await test.adapter.read(run.manifestPath));
        if (field === 'output') manifest.outputs[0].path = 'unrelated.md';
        if (field === 'receipt') manifest.outputs[0].files[0].path = 'unrelated.md';
        if (field === 'companion') manifest.generation.artifact.companions[0].path = 'images/unrelated.svg';
        if (field === 'version') manifest.version = 1;
        test.files.set(run.manifestPath, encode(JSON.stringify(manifest)));
        test.adapter.process.mockClear();
        test.adapter.writeBinary.mockClear();
        await expect(retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps)).rejects.toThrow(/path/i);
        expect(test.adapter.process).not.toHaveBeenCalled();
        expect(test.adapter.writeBinary).not.toHaveBeenCalled();
    });

    test.each(['Notes/topic.md', 'topic.md'])('scopes Drawnix companions and all manifest references for %s without mutating generation', async sourcePath => {
        const test = fixture();
        test.generation.plan.catalogTypeId = 'drawnix-knowledge-map';
        const visual = { id: 'v1', kind: 'image' as const, status: 'resolved' as const, sourceHash: 'abc', companionPaths: ['images/中文.svg'] };
        test.generation.artifact = {
            target: 'drawnix', sourceIntent: 'flowchart', mimeType: 'application/json',
            content: JSON.stringify({ type: 'drawnix', children: [], metadata: { notemd: { sourceVisuals: [visual] } } }),
            sourceVisualManifest: [visual],
            companions: [
                { path: 'images/中文.svg', content: svg, mimeType: 'image/svg+xml' },
                { path: 'source-visuals.json', content: JSON.stringify({ visuals: [visual] }), mimeType: 'application/json' }
            ]
        };
        const original = JSON.stringify(test.generation);
        const runs = [];
        for (let index = 0; index < 2; index++) {
            const run = await startDiagramExportRun(test.app, sourcePath, test.generation, ['source:drawnix', 'svg'], 300, test.reporter, test.deps);
            expect(run.status).toBe('completed');
            const native = run.outputs.find(output => output.id === 'source:drawnix')!;
            const scope = run.manifestPath.replace('.run.notemd-diagram.json', '.assets');
            const reference = `${scope}/images/中文.svg`;
            expect(native.files[1].path).toBe(reference);
            const drawnix = JSON.parse(await test.adapter.read(native.path));
            expect(drawnix.metadata.notemd.sourceVisuals[0].companionPaths).toEqual([reference]);
            const companionManifest = JSON.parse(await test.adapter.read(native.files[2].path));
            expect(companionManifest.visuals[0].companionPaths).toEqual([reference]);
            const restored = await readDiagramExportRun(test.app, run.manifestPath);
            expect(restored.generation.artifact.sourceVisualManifest![0].companionPaths).toEqual([reference]);
            expect(JSON.stringify(test.generation)).toBe(original);
            const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
            expect(retried.outputs).toEqual(run.outputs);
            runs.push(run);
        }
        const firstPaths = new Set(runs[0].outputs.flatMap(output => output.files.map(file => file.path)));
        expect(runs[1].outputs.flatMap(output => output.files).every(file => !firstPaths.has(file.path))).toBe(true);
    });

    test('keeps custom cache, attachments and staging separate from selected outputs and retries from the saved location', async () => {
        const test = fixture();
        test.generation.artifact.companions = [{ path: 'images/中文.svg', content: svg, mimeType: 'image/svg+xml' }];
        test.deps.renderPdf.mockRejectedValueOnce(new Error('retry'));
        const run = await startDiagramExportRun(test.app, 'Notes/topic.md', test.generation, ['source:mermaid', 'pdf'], 300, test.reporter, test.deps, {
            outputFolder: 'Exports', cacheFolder: 'Shared/图形中间文件'
        });
        expect(run.manifestPath.startsWith('Shared/图形中间文件/')).toBe(true);
        expect(run.outputs.every(output => output.path.startsWith('Exports/') && !output.path.slice(8).includes('/'))).toBe(true);
        expect(run.outputs[0].files[1].path.startsWith('Shared/图形中间文件/')).toBe(true);
        expect(test.adapter.writeBinary.mock.calls.every(([path]) => path.startsWith('Shared/图形中间文件/'))).toBe(true);
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(retried.manifestPath).toBe(run.manifestPath);
        expect([...test.files.keys()].some(path => path.endsWith('.pending'))).toBe(false);
    });

    test('rejects concurrent retries of the same manifest', async () => {
        const test = fixture();
        test.deps.renderPdf.mockRejectedValueOnce(new Error('later'));
        const run = await startDiagramExportRun(test.app, 'topic.md', test.generation, ['svg','pdf'], 300, test.reporter, test.deps);
        let release!: (bytes: ArrayBuffer) => void;
        let started!: () => void;
        const rendering = new Promise<void>(resolve => { started = resolve; });
        test.deps.renderPdf.mockImplementationOnce(() => { started(); return new Promise(resolve => { release = resolve; }); });
        const retry = retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        await rendering;
        await expect(retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps)).rejects.toThrow(/already/);
        release(encode('%PDF-1.4'));
        expect((await retry).status).toBe('completed');
    });

    test('preserves an externally edited manifest during a checkpoint', async () => {
        const test = fixture();
        const original = test.adapter.process.getMockImplementation()!;
        test.adapter.process.mockImplementationOnce(async (path, update) => {
            test.files.set(path, encode('user edited manifest'));
            return original(path, update);
        });
        await expect(startDiagramExportRun(test.app, 'topic.md', test.generation, ['svg'], 300, test.reporter, test.deps)).rejects.toThrow(/manifest changed/);
        const manifestPath = [...test.files.keys()].find(path => path.endsWith('run.notemd-diagram.json'))!;
        expect(new TextDecoder().decode(test.files.get(manifestPath))).toBe('user edited manifest');
    });

    test('recovers quoted references in earlier snapshots without rerendering successful images', async () => {
        const test = fixture();
        test.deps.renderSummary.mockRejectedValueOnce(new Error('old summary failure'));
        const run = await startDiagramExportRun(test.app, 'topic.md', test.generation, ['svg','html-summary'], 300, test.reporter, test.deps);
        const manifest = JSON.parse(new TextDecoder().decode(test.files.get(run.manifestPath)));
        manifest.generation.spec.evidenceRefs = [{ id: 'e1', quote: '中文原文' }];
        test.files.set(run.manifestPath, encode(JSON.stringify(manifest)));
        const retried = await retryDiagramExportRun(test.app, run.manifestPath, test.reporter, test.deps);
        expect(retried.status).toBe('completed');
        expect(test.deps.renderSummary).toHaveBeenLastCalledWith(expect.objectContaining({ evidenceRefs: ['中文原文'] }));
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
    });

    test('freezes requested outputs and generation before asynchronous rendering', async () => {
        const test = fixture();
        const requests = ['svg', 'pdf'];
        test.deps.renderSvg.mockImplementationOnce(async artifact => {
            requests.push('png');
            test.generation.artifact.content = 'changed after start';
            expect(artifact.content).toContain('中文');
            return svg;
        });
        const run = await startDiagramExportRun(test.app, 'topic.md', test.generation, requests, 300, test.reporter, test.deps);
        expect(run.outputs.map(output => output.id)).toEqual(['svg', 'pdf']);
    });
});
