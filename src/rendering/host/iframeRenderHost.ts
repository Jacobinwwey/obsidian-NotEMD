import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact, RenderOptions } from '../types';
import { PreviewCapableRenderHost, RenderPreviewSession } from './renderHost';
import {
    createRenderWebviewPayload,
    RenderWebviewPayloadOptions
} from '../webview/contract';
import { buildRenderWebviewHtml } from '../webview/page';

export class IframeRenderHost implements PreviewCapableRenderHost {
    async render(renderer: DiagramRenderer, spec: DiagramSpec, options?: RenderOptions): Promise<RenderArtifact> {
        return options ? renderer.render(spec, options) : renderer.render(spec);
    }

    createSession(artifact: RenderArtifact, options: RenderWebviewPayloadOptions = {}): RenderPreviewSession {
        const payload = createRenderWebviewPayload(artifact, options);
        return {
            htmlSrcdoc: buildRenderWebviewHtml(payload),
            payload
        };
    }
}
