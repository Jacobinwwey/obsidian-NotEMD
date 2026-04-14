import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';

export interface RenderHost {
    render(renderer: DiagramRenderer, spec: DiagramSpec): Promise<RenderArtifact>;
}
