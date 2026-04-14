import { DiagramSpec } from '../diagram/types';
import { InlineRenderHost } from './host/inlineRenderHost';
import { RenderHost } from './host/renderHost';
import { RendererRegistry } from './rendererRegistry';
import { RenderArtifact, RenderOptions } from './types';

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
}
