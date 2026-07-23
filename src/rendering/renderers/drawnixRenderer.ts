import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import {
    exportDrawnixMindMapProjection,
    stringifyDrawnixMindMapExportedData,
    validateDrawnixMindMapExportedData
} from '../../diagram/adapters/drawnix/drawnixExporter';
import { buildDrawnixMindMapProjection } from '../../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DiagramRenderer, RenderArtifact } from '../types';
import { renderDrawnixMindMapSvg } from './drawnixMindMapSvgRenderer';

const SUPPORTED_DRAWNIX_INTENTS = new Set<DiagramSpec['intent']>(['drawnixMindmap']);

export class DrawnixRenderer implements DiagramRenderer {
    readonly id = 'drawnix';
    readonly target = 'drawnix' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWNIX_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const projection = buildDrawnixMindMapProjection(spec);
        const data = exportDrawnixMindMapProjection(projection);
        const validationErrors = validateDrawnixMindMapExportedData(data);
        if (validationErrors.length > 0) {
            throw new Error(`Drawnix mind-map validation failed: ${validationErrors.join('; ')}`);
        }

        return {
            target: this.target,
            content: stringifyDrawnixMindMapExportedData(data),
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: spec.intent,
            previewSvg: {
                content: renderDrawnixMindMapSvg(projection),
                mimeType: 'image/svg+xml'
            }
        };
    }
}
