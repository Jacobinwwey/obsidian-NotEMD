import { webcrypto } from 'crypto';
import type { App } from 'obsidian';
import { startDiagramExportRun, retryDiagramExportRun } from '../diagram/diagramExportRun';
import type { DiagramGenerationResult } from '../diagram/diagramGenerationService';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="30">中文 café</text></svg>';
const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe('recoverable diagram multi-format export', () => {
    beforeAll(() => { Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto }); });
    function fixture() {
        const files = new Map<string, ArrayBuffer>();
        const folders = new Set<string>();
        const adapter = {
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
            renderPdf: jest.fn(async () => encode('%PDF-1.4\nvalid test document')),
            renderSummary: jest.fn(async () => '<!doctype html><html><body>中文 café</body></html>')
        };
        const reporter = { cancelled: false, log: jest.fn() };
        return { files, app, adapter, generation, deps, reporter };
    }

    test('writes the requested formats from one shared SVG and preserves Unicode', async () => {
        const test = fixture();
        const run = await startDiagramExportRun(test.app, 'Notes/中文.md', test.generation, ['source:mermaid','svg','png','pdf','html-diagram','html-summary'], 300, test.reporter, test.deps);
        expect(run.status).toBe('completed');
        expect(run.outputs).toHaveLength(6);
        expect(run.outputs.every(output => output.status === 'completed')).toBe(true);
        expect(test.deps.renderSvg).toHaveBeenCalledTimes(1);
        expect(test.deps.renderSummary).toHaveBeenCalledTimes(1);
        const html = new TextDecoder().decode(test.files.get(run.outputs.find(output => output.id === 'html-diagram')!.path));
        expect(html).toContain('charset="utf-8"');
        expect(html).not.toContain('\ufffd');
        expect(test.adapter.rename).toHaveBeenCalled();
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
            if (to.endsWith('/source/artifact.md')) test.reporter.cancelled = true;
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

    test.each(['../outside.png', '/absolute.png', 'C:/private.png', 'artifact.md', 'ARTIFACT.md'])('refuses unsafe or colliding companion %s before publishing files', async path => {
        const test = fixture();
        test.generation.artifact.companions = [{ path, content: 'invalid', mimeType: 'text/plain' }];
        await expect(startDiagramExportRun(test.app, 'topic.md', test.generation, ['source:mermaid'], 300, test.reporter, test.deps)).rejects.toThrow(/path/i);
        expect(test.files.size).toBe(0);
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
