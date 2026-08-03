import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact, RenderOptions } from '../types';
import { RenderHost } from './renderHost';

export class InlineRenderHost implements RenderHost {
    async render(renderer: DiagramRenderer, spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact> {
        return options ? renderer.render(spec, options) : renderer.render(spec);
    }
}
