import type { App } from 'obsidian';
import type { ProgressReporter } from '../types';
import type { RenderArtifact, RenderArtifactCompanion } from '../rendering/types';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';
import type { DiagramGenerationResult } from './diagramGenerationService';
import { findDefaultDiagramType, getExecutableDiagramType } from './diagramTypeCatalog';
import { assertValidDiagramSpec } from './spec';
import { isSupportedRenderTarget } from './types';
import type { DiagramSpec } from './types';
import { getDiagramSourceOutputId, isDiagramOutputId, resolveDiagramOutputPlan } from './diagramOutputPreferences';
import type { DiagramOutputId, DiagramOutputPlan } from './diagramOutputPreferences';
import { normalizeDiagramEvidenceRefs } from './diagramSpecResponseParser';

type ExportReporter = Pick<ProgressReporter, 'cancelled' | 'log'>;
type ExportStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
interface ExportFileReceipt { path: string; sha256: string }

export interface DiagramExportOutput {
    id: DiagramOutputId;
    path: string;
    status: ExportStatus;
    error?: string;
    files: ExportFileReceipt[];
}

export interface DiagramExportRun {
    status: 'completed' | 'partial' | 'cancelled';
    manifestPath: string;
    sourcePath: string;
    plan: DiagramOutputPlan;
    outputs: DiagramExportOutput[];
}

export interface DiagramExportDependencies {
    renderSvg: (artifact: RenderArtifact) => Promise<string>;
    renderPng: (svg: string, ppi: number) => Promise<ArrayBuffer>;
    renderPdf: (svg: string) => Promise<ArrayBuffer>;
    renderSummary: (spec: DiagramSpec) => Promise<string>;
}

export interface DiagramExportRequest {
    sourcePath: string;
    generation: DiagramGenerationResult;
    requestedOutputs: string[];
    ppi: number;
    outputFolder?: string;
}

interface SavedCompanion extends Omit<RenderArtifactCompanion, 'content'> { content: string }
interface ExportManifest extends DiagramExportRun {
    version: 1;
    generation: Omit<DiagramGenerationResult, 'artifact'> & {
        artifact: Omit<RenderArtifact, 'companions'> & { companions?: SavedCompanion[] };
    };
    requestedOutputs: string[];
    ppi: number;
    cache: { svg?: string; summary?: string };
}

const MANIFEST_NAME = 'run.notemd-diagram.json';
const activeRuns = new WeakMap<App['vault']['adapter'], Set<string>>();
const encoder = new TextEncoder();

async function withExportRunLock<T>(app: App, manifestPath: string, operation: () => Promise<T>): Promise<T> {
    let active = activeRuns.get(app.vault.adapter);
    if (!active) { active = new Set(); activeRuns.set(app.vault.adapter, active); }
    const key = manifestPath.toLowerCase();
    if (active.has(key)) throw new Error('This diagram export is already executing or being retried.');
    active.add(key);
    try { return await operation(); } finally { active.delete(key); }
}

function encodeBase64(bytes: Uint8Array): string {
    let text = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return btoa(text);
}

function decodeBase64(text: string): ArrayBuffer {
    return Uint8Array.from(atob(text), character => character.charCodeAt(0)).buffer;
}

async function hashBytes(bytes: ArrayBuffer): Promise<string> {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function asBytes(content: string | ArrayBuffer): ArrayBuffer {
    return typeof content === 'string' ? encoder.encode(content).buffer as ArrayBuffer : content;
}

/** Vault-relative paths are checked before any adapter access, including on recovery. */
function validatePath(path: string): string {
    if (typeof path !== 'string' || !path || path.includes('\\') || /[<>:"|?*]/.test(path)
        || [...path].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
        || path.split('/').some(segment => !segment || segment === '.' || segment === '..' || /[. ]$/.test(segment)
            || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) {
        throw new Error('Invalid diagram export path. Use a relative path inside the Vault.');
    }
    return path;
}

function runDirectory(manifestPath: string): string {
    validatePath(manifestPath);
    if (!manifestPath.endsWith(`/${MANIFEST_NAME}`)) throw new Error('Invalid diagram export manifest path.');
    return manifestPath.slice(0, -MANIFEST_NAME.length - 1);
}

function outputPath(directory: string, id: DiagramOutputId, artifact: RenderArtifact): string {
    const fileName = id.startsWith('source:') ? `source/artifact${getRenderTargetDescriptor(artifact.target).sourceExtension}`
        : id === 'html-diagram' ? 'diagram.html' : id === 'html-summary' ? 'summary.html' : `diagram.${id}`;
    return `${directory}/${fileName}`;
}

function restoreArtifact(manifest: ExportManifest): RenderArtifact {
    return {
        ...manifest.generation.artifact,
        companions: manifest.generation.artifact.companions?.map(companion => ({
            ...companion, content: companion.binary ? decodeBase64(companion.content) : companion.content
        }))
    };
}

function nativeFiles(artifact: RenderArtifact, path: string): Array<{ path: string; content: string | ArrayBuffer }> {
    const directory = path.slice(0, path.lastIndexOf('/'));
    return [{ path, content: artifact.content }, ...(artifact.companions ?? []).map(companion => ({ path: `${directory}/${companion.path}`, content: companion.content }))];
}

function parseManifest(text: string, path: string): ExportManifest {
    const manifest = JSON.parse(text) as ExportManifest;
    const directory = runDirectory(path);
    if (!manifest || manifest.version !== 1 || manifest.manifestPath !== path
        || !Array.isArray(manifest.outputs) || !manifest.plan || !manifest.cache || !manifest.generation
        || !Array.isArray(manifest.requestedOutputs) || !manifest.requestedOutputs.every(id => typeof id === 'string')
        || !Number.isFinite(manifest.ppi) || manifest.ppi < 72 || manifest.ppi > 600) {
        throw new Error('Unsupported or malformed diagram export manifest.');
    }
    validatePath(manifest.sourcePath);
    if (!['completed', 'partial', 'cancelled'].includes(manifest.status) || !isSupportedRenderTarget(manifest.plan.target)
        || typeof manifest.plan.usedDefaultOutput !== 'boolean' || !Array.isArray(manifest.plan.outputs) || !manifest.plan.outputs.every(isDiagramOutputId)
        || !Array.isArray(manifest.plan.inactiveOutputs) || manifest.plan.inactiveOutputs.some(output => !output || typeof output.id !== 'string'
            || !['unknown-output', 'incompatible-type', 'different-source'].includes(output.reason))) throw new Error('Invalid saved diagram export plan.');
    getExecutableDiagramType(manifest.plan.typeId);
    const artifact = manifest.generation.artifact;
    if (!artifact || !isSupportedRenderTarget(artifact.target) || typeof artifact.content !== 'string'
        || (artifact.companions !== undefined && (!Array.isArray(artifact.companions)
            || artifact.companions.some(companion => typeof companion.content !== 'string')))) {
        throw new Error('Invalid saved diagram artifact.');
    }
    // Older run snapshots admitted quoted-reference objects; recover them through
    // the same edge normalization used for newly generated specs.
    manifest.generation.spec = { ...manifest.generation.spec, evidenceRefs: normalizeDiagramEvidenceRefs(manifest.generation.spec.evidenceRefs) };
    assertValidDiagramSpec(manifest.generation.spec);
    for (const companion of artifact.companions ?? []) validatePath(companion.path);
    if ((manifest.cache.svg !== undefined && typeof manifest.cache.svg !== 'string')
        || (manifest.cache.summary !== undefined && typeof manifest.cache.summary !== 'string')) throw new Error('Invalid diagram export cache.');
    const nativePaths = nativeFiles(restoreArtifact(manifest), `${directory}/source/artifact${getRenderTargetDescriptor(artifact.target).sourceExtension}`).map(file => file.path);
    const keys = nativePaths.map(path => path.toLowerCase());
    if (keys.some((key, index) => keys.some((other, otherIndex) => index !== otherIndex && (key === other || key.startsWith(`${other}/`))))) throw new Error('Diagram companion paths collide with another export file.');
    const seen = new Set<string>();
    for (const output of manifest.outputs) {
        if (!isDiagramOutputId(output.id) || seen.has(output.id) || output.path !== outputPath(directory, output.id, artifact)
            || !['pending', 'completed', 'failed', 'cancelled'].includes(output.status) || !Array.isArray(output.files)) {
            throw new Error('Invalid diagram export output path or state.');
        }
        seen.add(output.id);
        for (const file of output.files) {
            validatePath(file.path);
            if (!(output.id.startsWith('source:') ? nativePaths.includes(file.path) : file.path === output.path)
                || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Invalid diagram export receipt path.');
        }
        const expectedFiles = output.id.startsWith('source:') ? nativePaths : [output.path];
        if (new Set(output.files.map(file => file.path)).size !== output.files.length
            || (output.status === 'completed' && (output.files.length !== expectedFiles.length || expectedFiles.some(path => !output.files.some(file => file.path === path))))) {
            throw new Error('Missing or duplicate diagram export receipt.');
        }
    }
    return manifest;
}

async function ensureDirectory(app: App, directory: string): Promise<void> {
    const parts = directory.split('/');
    for (let length = 1; length <= parts.length; length++) {
        const path = parts.slice(0, length).join('/');
        if (!(await app.vault.adapter.exists(path))) await app.vault.adapter.mkdir(path);
    }
}

class ExportCancelled extends Error { constructor() { super('Diagram export cancelled.'); } }
function checkCancellation(reporter: ExportReporter): void {
    if (reporter.cancelled) throw new ExportCancelled();
}

/** Only newly owned staging files are removed. Published files are never overwritten. */
async function commitFile(app: App, path: string, content: string | ArrayBuffer, reporter: ExportReporter): Promise<ExportFileReceipt> {
    const adapter = app.vault.adapter;
    checkCancellation(reporter);
    const bytes = asBytes(content);
    const sha256 = await hashBytes(bytes);
    if (await adapter.exists(path)) {
        if (await hashBytes(await adapter.readBinary(path)) === sha256) return { path, sha256 };
        throw new Error(`Export file changed or already exists: ${path}`);
    }
    await ensureDirectory(app, path.slice(0, path.lastIndexOf('/')));
    const staging = `${path}.${crypto.randomUUID()}.pending`;
    try {
        await adapter.writeBinary(staging, bytes);
        if (await hashBytes(await adapter.readBinary(staging)) !== sha256) throw new Error('Export write verification failed.');
        checkCancellation(reporter);
        if (await adapter.exists(path)) throw new Error(`Export file appeared during save: ${path}`);
        await adapter.rename(staging, path);
        return { path, sha256 };
    } finally {
        if (await adapter.exists(staging)) await adapter.remove(staging);
    }
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildDiagramHtml(svg: string, spec: DiagramSpec): string {
    // SVG is an image resource, never executable markup in the HTML document.
    const encodedSvg = encodeBase64(encoder.encode(svg));
    const encodedSpec = JSON.stringify(spec).replace(/</g, '\\u003c').replace(/&/g, '\\u0026');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"><title>${escapeHtml(spec.title ?? 'Diagram')}</title><style>body{margin:0;font:16px system-ui,sans-serif;background:#f5f5f5;color:#222}header{display:flex;gap:1rem;align-items:center;padding:1rem;flex-wrap:wrap}main{overflow:auto;height:calc(100vh - 90px);background:white}img{display:block;max-width:none;margin:auto}button,input{font:inherit}</style></head><body><header><strong>${escapeHtml(spec.title ?? 'Diagram')}</strong><button id="fit" type="button">Fit / 适应窗口</button><label>Zoom / 缩放 <input id="zoom" type="range" min="10" max="300" value="100"></label></header><main id="viewport"><img id="diagram" alt="${escapeHtml(spec.title ?? 'Diagram')}" src="data:image/svg+xml;base64,${encodedSvg}"></main><script id="diagram-spec" type="application/json">${encodedSpec}</script><script>const picture=document.getElementById('diagram'),zoom=document.getElementById('zoom');function resize(){picture.style.width=(picture.naturalWidth*Number(zoom.value)/100)+'px'}function fit(){zoom.value=String(Math.min(100,Math.max(10,(document.getElementById('viewport').clientWidth-24)/picture.naturalWidth*100)));resize()}zoom.addEventListener('input',resize);document.getElementById('fit').addEventListener('click',fit);picture.addEventListener('load',fit);if(picture.complete)fit();</script></body></html>`;
}

function validateDelivery(id: DiagramOutputId, content: string | ArrayBuffer): void {
    if (typeof content === 'string') {
        if (!content.trim() || (id === 'svg' && !/<svg\b/.test(content))
            || (id.startsWith('html-') && !/<html\b/i.test(content))) throw new Error(`Invalid ${id} export.`);
    } else {
        const bytes = new Uint8Array(content);
        const valid = id === 'png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
            : id === 'pdf' && new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-';
        if (!valid) throw new Error(`Invalid ${id} export signature.`);
    }
}

function defaultDependencies(): DiagramExportDependencies {
    return {
        renderSvg: async artifact => {
            const [{ renderPreviewArtifactSvg }, bundled] = await Promise.all([
                import('../rendering/preview/previewExport'), import('../rendering/webview/bundledPreviewDeps')
            ]);
            return renderPreviewArtifactSvg(artifact, {
                mermaid: bundled.getBundledMermaidPreviewDeps(),
                vegaLiteDepsLoader: async () => bundled.getBundledVegaLitePreviewDeps(), theme: 'light'
            });
        },
        renderPng: async (svg, ppi) => (await import('../rendering/preview/pngPreview')).rasterizeSvgToPngArrayBuffer(svg, undefined, { ppi }),
        renderPdf: async svg => (await import('../rendering/preview/pdfPreview')).buildPdfFromSvg(svg),
        renderSummary: async spec => {
            const { HtmlRenderer } = await import('../rendering/renderers/htmlRenderer');
            return (await new HtmlRenderer().render(spec)).content;
        }
    };
}

async function executeRun(app: App, manifest: ExportManifest, reporter: ExportReporter, deps: DiagramExportDependencies, previousText?: string): Promise<DiagramExportRun> {
    const adapter = app.vault.adapter;
    const artifact = restoreArtifact(manifest);
    let savedText = previousText;
    async function checkpoint(): Promise<void> {
        const text = JSON.stringify(manifest);
        if (savedText !== undefined) {
            // DataAdapter.rename refuses an existing destination. process provides the
            // host's serialized read/modify/write boundary and preserves external edits.
            await adapter.process(manifest.manifestPath, current => {
                if (current !== savedText) throw new Error('Diagram export manifest changed during execution.');
                return text;
            });
            if (await adapter.read(manifest.manifestPath) !== text) throw new Error('Diagram manifest write verification failed.');
            savedText = text;
            return;
        }
        const staging = `${manifest.manifestPath}.${crypto.randomUUID()}.pending`;
        try {
            await adapter.write(staging, text);
            if (await adapter.read(staging) !== text) throw new Error('Diagram manifest write verification failed.');
            await adapter.rename(staging, manifest.manifestPath);
            savedText = text;
        } finally {
            if (await adapter.exists(staging)) await adapter.remove(staging);
        }
    }
    async function sharedSvg(): Promise<string> {
        if (manifest.cache.svg === undefined) {
            const svg = await deps.renderSvg(artifact);
            checkCancellation(reporter);
            validateDelivery('svg', svg);
            manifest.cache.svg = svg;
            await checkpoint();
        }
        return manifest.cache.svg;
    }
    async function renderOutput(id: DiagramOutputId): Promise<string | ArrayBuffer> {
        if (id.startsWith('source:')) {
            if (id !== getDiagramSourceOutputId(artifact.target)) throw new Error('The renderer degraded to a different source format.');
            return artifact.content;
        }
        if (id === 'html-summary') {
            if (manifest.cache.summary === undefined) {
                const summary = artifact.target === 'html' ? artifact.content : await deps.renderSummary(manifest.generation.spec);
                checkCancellation(reporter);
                validateDelivery(id, summary);
                manifest.cache.summary = summary;
                await checkpoint();
            }
            return manifest.cache.summary;
        }
        const svg = await sharedSvg();
        if (id === 'svg') return svg;
        if (id === 'html-diagram') return buildDiagramHtml(svg, manifest.generation.spec);
        if (id === 'png') return deps.renderPng(svg, manifest.ppi);
        return deps.renderPdf(svg);
    }

    await checkpoint();
    for (const output of manifest.outputs) {
        if (reporter.cancelled) {
            if (output.status !== 'completed') output.status = 'cancelled';
            continue;
        }
        try {
            // Verify partial native deliveries too; retry must not overwrite an edited companion.
            for (const file of output.files) {
                if (!(await adapter.exists(file.path)) || await hashBytes(await adapter.readBinary(file.path)) !== file.sha256) {
                    throw new Error(`Export file changed or was removed: ${file.path}`);
                }
            }
            if (output.status === 'completed') continue;
            const content = await renderOutput(output.id);
            checkCancellation(reporter);
            validateDelivery(output.id, content);
            const deliveries = output.id.startsWith('source:') ? nativeFiles(artifact, output.path) : [{ path: output.path, content }];
            for (const file of deliveries) {
                const receipt = await commitFile(app, file.path, file.content, reporter);
                output.files = [...output.files.filter(existing => existing.path !== receipt.path), receipt];
                await checkpoint();
            }
            output.status = 'completed';
            delete output.error;
            reporter.log(`Diagram export saved: ${output.id} → ${output.path}`);
        } catch (error) {
            output.status = error instanceof ExportCancelled ? 'cancelled' : 'failed';
            output.error = error instanceof Error ? error.message : String(error);
            reporter.log(`${output.id}: ${output.error}`);
        }
        await checkpoint();
        // A missing converter must still leave a usable source artifact, with the failed request visible.
        if (!reporter.cancelled && output === manifest.outputs[manifest.outputs.length - 1]
            && !manifest.outputs.some(candidate => candidate.status === 'completed')) {
            const fallbackId = getDiagramSourceOutputId(artifact.target);
            if (!manifest.outputs.some(candidate => candidate.id === fallbackId)) {
                manifest.outputs.push({ id: fallbackId, path: outputPath(runDirectory(manifest.manifestPath), fallbackId, artifact), status: 'pending', files: [] });
                manifest.plan.outputs.push(fallbackId);
                manifest.plan.usedDefaultOutput = true;
            }
        }
    }
    manifest.status = reporter.cancelled ? 'cancelled'
        : manifest.outputs.every(output => output.status === 'completed') && manifest.plan.inactiveOutputs.length === 0 ? 'completed' : 'partial';
    await checkpoint();
    return { status: manifest.status, manifestPath: manifest.manifestPath, sourcePath: manifest.sourcePath, plan: manifest.plan, outputs: manifest.outputs };
}

export async function startDiagramExportRun(
    app: App, sourcePath: string, generation: DiagramGenerationResult, requestedOutputs: readonly string[], ppi: number,
    reporter: ExportReporter, deps?: DiagramExportDependencies, outputFolder?: string
): Promise<DiagramExportRun> {
    validatePath(sourcePath);
    if (!Number.isFinite(ppi) || ppi < 72 || ppi > 600) throw new Error('Diagram export PPI must be between 72 and 600.');
    const typeId = generation.plan.catalogTypeId ?? findDefaultDiagramType(generation.spec.intent).id;
    const plan = resolveDiagramOutputPlan(typeId, requestedOutputs, generation.artifact.target);
    if (outputFolder) validatePath(outputFolder);
    const destination = outputFolder === undefined ? sourcePath : `${outputFolder ? `${outputFolder}/` : ''}${sourcePath.split('/').pop()!}`;
    const base = destination.replace(/\.[^/.]+$/, '');
    const directory = `${base}_diagram-${crypto.randomUUID()}`;
    const artifact = generation.artifact;
    const manifest: ExportManifest = {
        version: 1, manifestPath: `${directory}/${MANIFEST_NAME}`, sourcePath, status: 'partial',
        generation: { ...generation, artifact: { ...artifact, companions: artifact.companions?.map(companion => ({
            ...companion, binary: companion.content instanceof ArrayBuffer,
            content: typeof companion.content === 'string' ? companion.content : encodeBase64(new Uint8Array(companion.content))
        })) } },
        requestedOutputs: [...requestedOutputs], plan, ppi, cache: {},
        outputs: plan.outputs.map(id => ({ id, path: outputPath(directory, id, artifact), status: 'pending', files: [] }))
    };
    // JSON roundtrip freezes mutable renderer/settings objects for the complete run.
    const snapshot = parseManifest(JSON.stringify(manifest), manifest.manifestPath);
    checkCancellation(reporter);
    return withExportRunLock(app, manifest.manifestPath, async () => {
        const parent = directory.includes('/') ? directory.slice(0, directory.lastIndexOf('/')) : '';
        if (parent) await ensureDirectory(app, parent);
        if (await app.vault.adapter.exists(directory)) throw new Error('Diagram export directory already exists.');
        await app.vault.adapter.mkdir(directory);
        return executeRun(app, snapshot, reporter, deps ?? defaultDependencies());
    });
}

export async function retryDiagramExportRun(app: App, manifestPath: string, reporter: ExportReporter, deps?: DiagramExportDependencies): Promise<DiagramExportRun> {
    runDirectory(manifestPath);
    return withExportRunLock(app, manifestPath, async () => {
        const text = await app.vault.adapter.read(manifestPath);
        const manifest = parseManifest(text, manifestPath);
        return await executeRun(app, manifest, reporter, deps ?? defaultDependencies(), text);
    });
}

export async function readDiagramExportRun(app: App, manifestPath: string): Promise<{ run: DiagramExportRun; generation: DiagramGenerationResult }> {
    runDirectory(manifestPath);
    const manifest = parseManifest(await app.vault.adapter.read(manifestPath), manifestPath);
    return {
        run: { status: manifest.status, manifestPath, sourcePath: manifest.sourcePath, plan: manifest.plan, outputs: manifest.outputs },
        generation: { ...manifest.generation, artifact: restoreArtifact(manifest) }
    };
}
