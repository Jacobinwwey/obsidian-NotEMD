import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import { buildSemanticFigureModel } from '../../diagram/adapters/editableSvg/semanticFigureModel';
import {
    collectDrawioVisibleLabelMismatches,
    exportSemanticFigureModelToDrawioXml
} from '../../diagram/adapters/drawio/drawioExporter';
import { DiagramRenderer, RenderArtifact } from '../types';
import { renderSemanticFigureSvg } from './editableHtmlSvgRenderer';

const SUPPORTED_DRAWIO_INTENTS = new Set<DiagramSpec['intent']>([
    'mindmap',
    'flowchart',
    'sequence',
    'classDiagram',
    'erDiagram',
    'stateDiagram'
]);

export class DrawioRenderer implements DiagramRenderer {
    readonly id = 'drawio';
    readonly target = 'drawio' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWIO_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const model = buildSemanticFigureModel(spec);
        const content = exportSemanticFigureModelToDrawioXml(model);
        const labelMismatches = collectDrawioVisibleLabelMismatches(content, model);
        if (labelMismatches.length > 0) {
            throw new Error(`Draw.io visible label mismatches: ${labelMismatches.join('; ')}`);
        }

        return {
            target: this.target,
            content,
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: spec.intent,
            previewSvg: {
                content: renderSemanticFigureSvg(model),
                mimeType: 'image/svg+xml'
            }
        };
    }
}
