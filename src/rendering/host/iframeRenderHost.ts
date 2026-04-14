import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';
import { PreviewCapableRenderHost, RenderPreviewSession } from './renderHost';
import {
    createRenderWebviewPayload,
    RenderWebviewPayloadOptions
} from '../webview/contract';
import { buildRenderWebviewHtml } from '../webview/page';

export class IframeRenderHost implements PreviewCapableRenderHost {
    async render(renderer: DiagramRenderer, spec: DiagramSpec): Promise<RenderArtifact> {
        return renderer.render(spec);
    }

    createSession(artifact: RenderArtifact, options: RenderWebviewPayloadOptions = {}): RenderPreviewSession {
        const payload = createRenderWebviewPayload(artifact, options);
        return {
            htmlSrcdoc: buildRenderWebviewHtml(payload),
            payload
        };
    }
}
