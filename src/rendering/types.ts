import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';

export interface RenderArtifact {
    target: RenderTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
}

export interface RenderOptions {
    target?: RenderTarget;
}

export interface DiagramRenderer {
    id: string;
    target: RenderTarget;
    supports(spec: DiagramSpec): boolean;
    render(spec: DiagramSpec): Promise<RenderArtifact>;
}
