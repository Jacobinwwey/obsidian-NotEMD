import { DiagramIntent, DiagramSpec, RenderTarget } from '../diagram/types';
import type { DrawnixKnowledgeMapDelivery } from '../diagram/types';
import type { DrawnixKnowledgeMapFidelityLedger } from '../diagram/adapters/drawnix/drawnixKnowledgeMapPresentationTypes';
import type { ResolvedSourceVisual } from '../diagram/sourceVisuals';
import { RenderWebviewTheme } from './theme';

export type RenderArtifactTarget = RenderTarget | 'circuitikz' | 'drawio' | 'drawnix';

export interface RenderArtifactPreviewPanelArtifact {
    target: RenderArtifactTarget;
    content: string;
    mimeType: string;
    sourceIntent: DiagramIntent;
    diagnostics?: RenderArtifactDiagnostic[];
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
    previewSvg?: RenderArtifactPreviewSvg;
    companions?: RenderArtifactCompanion[];
    sourceVisualManifest?: RenderArtifactSourceVisualManifestEntry[];
    /**
     * Ordered visual panels let a single source document retain every
     * renderable block without pretending that the source is one diagram.
     */
    previewPanels?: RenderArtifactPreviewPanel[];
    drawnixKnowledgeMapPresentation?: DrawnixKnowledgeMapPresentationArtifact;
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

export interface DrawnixKnowledgeMapPresentationPanelArtifact {
    sliceId: string;
    fileName: string;
    content: string;
}

/**
 * A static, manifest-owned delivery that accompanies the editable Drawnix
 * board. Its files are persisted in a sibling `.presentation` directory.
 */
export interface DrawnixKnowledgeMapPresentationArtifact {
    version: 1;
    catalogTypeId: 'drawnix-knowledge-map';
    semanticSpecHash: string;
    overview: DrawnixKnowledgeMapPresentationPanelArtifact;
    details: DrawnixKnowledgeMapPresentationPanelArtifact[];
    fidelityLedger: DrawnixKnowledgeMapFidelityLedger;
}

export interface RenderOptions {
    target?: RenderTarget;
    theme?: RenderWebviewTheme;
    sourceVisuals?: readonly ResolvedSourceVisual[];
    sourceVisualManifestHash?: string;
    /** Opt-in Drawnix source/SVG Mermaid companions under the artifact .assets scope. */
    drawnixExportMermaidCompanions?: boolean;
    /** Host-level selection that routes Drawnix rendering to a dedicated delivery operation. */
    drawnixKnowledgeMapDelivery?: DrawnixKnowledgeMapDelivery;
}

export interface DiagramRenderer {
    id: string;
    target: RenderTarget;
    supports(spec: DiagramSpec): boolean;
    render(spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact>;
}
