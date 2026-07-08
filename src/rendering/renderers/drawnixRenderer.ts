import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import { buildSemanticFigureModel } from '../../diagram/adapters/editableSvg/semanticFigureModel';
import {
    exportSemanticFigureModelToDrawnixData,
    stringifyDrawnixExportedData,
    validateDrawnixExportedDataSubset
} from '../../diagram/adapters/drawnix/drawnixExporter';
import { DiagramRenderer, RenderArtifact } from '../types';
import { renderSemanticFigureSvg } from './editableHtmlSvgRenderer';

const SUPPORTED_DRAWNIX_INTENTS = new Set<DiagramSpec['intent']>([
    'mindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram'
]);

export class DrawnixRenderer implements DiagramRenderer {
    readonly id = 'drawnix';
    readonly target = 'drawnix' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWNIX_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const model = buildSemanticFigureModel(spec);
        const data = exportSemanticFigureModelToDrawnixData(model);
        const validationErrors = validateDrawnixExportedDataSubset(data);
        if (validationErrors.length > 0) {
            throw new Error(`Drawnix subset validation failed: ${validationErrors.join('; ')}`);
        }

        return {
            target: this.target,
            content: stringifyDrawnixExportedData(data),
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: spec.intent,
            previewSvg: {
                content: renderSemanticFigureSvg(model),
                mimeType: 'image/svg+xml'
            }
        };
    }
}
