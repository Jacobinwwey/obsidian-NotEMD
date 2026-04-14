import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';
import { RenderWebviewPayload, RenderWebviewPayloadOptions } from '../webview/contract';

export interface RenderHost {
    render(renderer: DiagramRenderer, spec: DiagramSpec): Promise<RenderArtifact>;
}

export interface RenderPreviewSession {
    htmlSrcdoc: string;
    payload: RenderWebviewPayload;
}

export interface PreviewCapableRenderHost extends RenderHost {
    createSession(artifact: RenderArtifact, options?: RenderWebviewPayloadOptions): RenderPreviewSession;
}
