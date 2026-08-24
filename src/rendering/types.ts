import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import type { ResolvedSourceVisual } from '../diagram/sourceVisuals';
import { RenderWebviewTheme } from './theme';

export type RenderArtifactTarget = RenderTarget | 'circuitikz' | 'drawio' | 'drawnix';

export interface RenderArtifactPreviewPanelArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
    layoutSafetyVersion?: string;
    previewSvg?: RenderArtifactPreviewSvg;
}

export interface RenderArtifactPreviewPanel {
    id: string;
    title?: string;
    artifact: RenderArtifactPreviewPanelArtifact;
}

export interface RenderArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
    /** Version of the deterministic geometry contract used by the renderer. */
    layoutSafetyVersion?: string;
    previewSvg?: RenderArtifactPreviewSvg;
    companions?: RenderArtifactCompanion[];
    sourceVisualManifest?: RenderArtifactSourceVisualManifestEntry[];
    /**
     * Ordered visual panels let a single source document retain every
     * renderable block without pretending that the source is one diagram.
     */
    previewPanels?: RenderArtifactPreviewPanel[];
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
    layoutSafetyVersion?: string;
}

export interface RenderOptions {
    target?: RenderTarget;
    theme?: RenderWebviewTheme;
    sourceVisuals?: readonly ResolvedSourceVisual[];
    sourceVisualManifestHash?: string;
    /** Opt-in Drawnix source/SVG Mermaid companions under the artifact .assets scope. */
    drawnixExportMermaidCompanions?: boolean;
}

export interface DiagramRenderer {
    id: string;
    target: RenderTarget;
    supports(spec: DiagramSpec): boolean;
    render(spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact>;
}
