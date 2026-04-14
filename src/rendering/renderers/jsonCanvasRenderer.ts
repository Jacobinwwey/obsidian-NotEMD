import { renderJsonCanvas } from '../../diagram/adapters/canvas/canvasAdapter';
import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';

export class JsonCanvasRenderer implements DiagramRenderer {
    readonly id = 'json-canvas';
    readonly target = 'json-canvas' as const;

    supports(spec: DiagramSpec): boolean {
        return spec.intent === 'canvasMap';
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        return {
            target: this.target,
            content: renderJsonCanvas(spec),
            mimeType: 'application/json',
            sourceIntent: spec.intent
        };
    }
}
