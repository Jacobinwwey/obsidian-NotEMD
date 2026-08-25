import { DiagramSpec } from '../diagram/types';
import { RenderCache } from './cache/renderCache';
import { InlineRenderHost } from './host/inlineRenderHost';
import { PreviewCapableRenderHost, RenderHost, RenderPreviewSession } from './host/renderHost';
import { RendererRegistry } from './rendererRegistry';
import { RenderArtifact, RenderOptions } from './types';
import { RenderWebviewPayloadOptions } from './webview/contract';
import { diagnoseDiagramLayout } from '../diagram/layout/layoutDiagnostics';
import { LAYOUT_SAFETY_VERSION } from '../diagram/layout/layoutSafety';
import { validateJsonCanvasArtifactContent } from './preview/canvasPreview';

function isPreviewCapableHost(host: RenderHost): host is PreviewCapableRenderHost {
    return typeof (host as PreviewCapableRenderHost).createSession === 'function';
}

export interface PreviewRenderOptions extends RenderOptions, RenderWebviewPayloadOptions {}

export class RendererService {
    private readonly host: RenderHost;
    private readonly cache: RenderCache;
    private readonly inFlightRenders = new Map<string, Promise<RenderArtifact>>();

    constructor(private readonly registry: RendererRegistry, host?: RenderHost, cache?: RenderCache) {
        this.host = host ?? new InlineRenderHost();
        this.cache = cache ?? new RenderCache();
    }

    async render(spec: DiagramSpec, options: RenderOptions = {}): Promise<RenderArtifact> {
        const cachedArtifact = this.cache.get(spec, options);
        if (cachedArtifact) {
            return cachedArtifact;
        }

        const renderer = this.registry.resolve(spec, options.target);
        if (!renderer) {
            const requestedTarget = options.target ? ` for target "${options.target}"` : '';
            throw new Error(`No renderer registered${requestedTarget} and diagram intent "${spec.intent}".`);
        }

        const cacheKey = this.cache.buildKey(spec, options);
        const existingRender = this.inFlightRenders.get(cacheKey);
        if (existingRender) {
            return existingRender;
        }

        const renderPromise = this.host.render(renderer, spec, options)
            .then((artifact) => {
                // The plugin owns deterministic geometry for editable SVG and
                // JSON Canvas previews. Enforce their budgets before caching or
                // persisting the artifact. Mermaid/Vega/Drawnix retain their
                // runtime/consumer-specific validators because this service
                // does not own their final layout engine.
                const layoutDiagnostics = artifact.target === 'editable-html-svg'
                    ? diagnoseDiagramLayout(spec)
                    : [];
                const layoutErrors = layoutDiagnostics.filter(diagnostic => diagnostic.severity === 'error');
                if (layoutErrors.length > 0) {
                    throw new Error(`Diagram layout safety gate rejected the artifact: ${layoutErrors.map(diagnostic => diagnostic.message).join(' ')}`);
                }
                const diagnostics = [...(artifact.diagnostics ?? []), ...layoutDiagnostics];
                if (artifact.target === 'json-canvas') {
                    try {
                        validateJsonCanvasArtifactContent(artifact.content);
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : String(error);
                        throw new Error(`Diagram layout safety gate rejected the JSON Canvas artifact: ${message}`);
                    }
                }
                const safeArtifact: RenderArtifact = {
                    ...artifact,
                    layoutSafetyVersion: artifact.layoutSafetyVersion ?? LAYOUT_SAFETY_VERSION,
                    diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
                    previewSvg: artifact.previewSvg
                        ? {
                            ...artifact.previewSvg,
                            layoutSafetyVersion: artifact.previewSvg.layoutSafetyVersion ?? LAYOUT_SAFETY_VERSION,
                            diagnostics: diagnostics.length > 0
                                ? [...(artifact.previewSvg.diagnostics ?? []), ...layoutDiagnostics]
                                : artifact.previewSvg.diagnostics
                        }
                        : undefined
                };
                this.cache.set(spec, options, safeArtifact);
                return safeArtifact;
            })
            .finally(() => {
                this.inFlightRenders.delete(cacheKey);
            });

        this.inFlightRenders.set(cacheKey, renderPromise);
        return renderPromise;
    }

    async preparePreviewSession(
        spec: DiagramSpec,
        options: PreviewRenderOptions = {}
    ): Promise<RenderPreviewSession | null> {
        const artifact = await this.render(spec, options);
        if (!isPreviewCapableHost(this.host)) {
            return null;
        }

        return this.host.createSession(artifact, options);
    }
}
