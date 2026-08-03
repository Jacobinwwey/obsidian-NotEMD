import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact, RenderOptions } from '../types';
import { RenderWebviewPayload, RenderWebviewPayloadOptions } from '../webview/contract';

export interface RenderHost {
    render(renderer: DiagramRenderer, spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact>;
}

export interface RenderPreviewSession {
    htmlSrcdoc: string;
    payload: RenderWebviewPayload;
}

export interface PreviewCapableRenderHost extends RenderHost {
    createSession(artifact: RenderArtifact, options?: RenderWebviewPayloadOptions): RenderPreviewSession;
}
