import { DiagramSpec } from '../diagram/types';
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

    constructor(private readonly registry: RendererRegistry, host?: RenderHost) {
        this.host = host ?? new InlineRenderHost();
    }

    async render(spec: DiagramSpec, options: RenderOptions = {}): Promise<RenderArtifact> {
        const renderer = this.registry.resolve(spec, options.target);
        if (!renderer) {
            const requestedTarget = options.target ? ` for target "${options.target}"` : '';
            throw new Error(`No renderer registered${requestedTarget} and diagram intent "${spec.intent}".`);
        }

        return this.host.render(renderer, spec);
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
