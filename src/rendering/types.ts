import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import { RenderWebviewTheme } from './theme';

export type RenderArtifactTarget = RenderTarget | 'circuitikz';

export interface RenderArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
}

export interface RenderArtifactDiagnostic {
    severity: 'info' | 'warning' | 'error';
    kind: string;
    message: string;
    advice?: string;
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
