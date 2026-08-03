import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import type { ResolvedSourceVisual } from '../diagram/sourceVisuals';
import { RenderWebviewTheme } from './theme';

export type RenderArtifactTarget = RenderTarget | 'circuitikz' | 'drawio' | 'drawnix';

export interface RenderArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
    previewSvg?: RenderArtifactPreviewSvg;
    companions?: RenderArtifactCompanion[];
    sourceVisualManifest?: RenderArtifactSourceVisualManifestEntry[];
}

export interface RenderArtifactCompanion {
    path: string;
    content: string | ArrayBuffer;
    mimeType: string;
    binary?: boolean;
    sourceVisualId?: string;
}

export interface RenderArtifactSourceVisualManifestEntry {
    id: string;
    kind: ResolvedSourceVisual['kind'];
    status: ResolvedSourceVisual['status'];
    sourceHash: string;
    sourcePath?: string;
    companionPaths: string[];
    diagnostic?: string;
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
    sourceVisuals?: readonly ResolvedSourceVisual[];
    sourceVisualManifestHash?: string;
}

export interface DiagramRenderer {
    id: string;
    target: RenderTarget;
    supports(spec: DiagramSpec): boolean;
    render(spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact>;
}
