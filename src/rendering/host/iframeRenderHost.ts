import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';
import { RenderHost } from './renderHost';
import {
    createRenderWebviewPayload,
    RenderWebviewPayload,
    RenderWebviewPayloadOptions
} from '../webview/contract';
import { buildRenderWebviewHtml } from '../webview/page';

export interface IframeRenderSession {
    htmlSrcdoc: string;
    payload: RenderWebviewPayload;
}

export class IframeRenderHost implements RenderHost {
    async render(renderer: DiagramRenderer, spec: DiagramSpec): Promise<RenderArtifact> {
        return renderer.render(spec);
    }

    createSession(artifact: RenderArtifact, options: RenderWebviewPayloadOptions = {}): IframeRenderSession {
        const payload = createRenderWebviewPayload(artifact, options);
        return {
            htmlSrcdoc: buildRenderWebviewHtml(payload),
            payload
        };
    }
}
