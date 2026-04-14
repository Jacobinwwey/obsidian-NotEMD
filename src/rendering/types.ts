import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import { RenderWebviewTheme } from './theme';

export interface RenderArtifact {
    target: RenderTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
}

export interface RenderOptions {
    target?: RenderTarget;
    theme?: RenderWebviewTheme;
}

export interface DiagramRenderer {
    id: string;
    target: RenderTarget;
    supports(spec: DiagramSpec): boolean;
    render(spec: DiagramSpec): Promise<RenderArtifact>;
}
