import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';
import { RenderHost } from './renderHost';

export class InlineRenderHost implements RenderHost {
    async render(renderer: DiagramRenderer, spec: DiagramSpec): Promise<RenderArtifact> {
        return renderer.render(spec);
    }
}
