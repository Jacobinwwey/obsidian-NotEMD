import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import { RenderWebviewTheme } from './theme';

export type RenderArtifactTarget = RenderTarget | 'circuitikz' | 'drawio' | 'drawnix';

export interface RenderArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
    previewSvg?: RenderArtifactPreviewSvg;
}

export interface RenderArtifactDiagnostic {
    severity: 'info' | 'warning' | 'error';
    kind: string;
    message: string;
    advice?: string;
}

export interface RenderArtifactPreviewSvg {
    content: string;
    mimeType: 'image/svg+xml';
    diagnostics?: RenderArtifactDiagnostic[];
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
