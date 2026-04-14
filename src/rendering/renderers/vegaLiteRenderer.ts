import { renderVegaLiteSpec } from '../../diagram/adapters/vega/vegaLiteAdapter';
import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';

export class VegaLiteRenderer implements DiagramRenderer {
    readonly id = 'vega-lite';
    readonly target = 'vega-lite' as const;

    supports(spec: DiagramSpec): boolean {
        return spec.intent === 'dataChart';
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        return {
            target: this.target,
            content: renderVegaLiteSpec(spec),
            mimeType: 'application/json',
            sourceIntent: spec.intent
        };
    }
}
