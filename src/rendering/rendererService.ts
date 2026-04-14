import { DiagramSpec } from '../diagram/types';
import { RenderCache } from './cache/renderCache';
import { InlineRenderHost } from './host/inlineRenderHost';
import { PreviewCapableRenderHost, RenderHost, RenderPreviewSession } from './host/renderHost';
import { RendererRegistry } from './rendererRegistry';
import { RenderArtifact, RenderOptions } from './types';
import { RenderWebviewPayloadOptions } from './webview/contract';

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

        const renderPromise = this.host.render(renderer, spec)
            .then((artifact) => {
                this.cache.set(spec, options, artifact);
                return artifact;
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
