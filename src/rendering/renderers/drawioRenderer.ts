import { assertValidDiagramSpec } from '../../diagram/spec';
import { buildEntityRelationshipScene } from '../../diagram/adapters/er/entityRelationshipLayout';
import { exportEntityRelationshipDrawio } from '../../diagram/adapters/er/entityRelationshipDrawio';
import { renderEntityRelationshipSvg } from '../../diagram/adapters/er/entityRelationshipSvg';
import { LAYOUT_SAFETY_VERSION } from '../../diagram/layout/layoutSafety';
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
        return (SUPPORTED_DRAWIO_INTENTS.has(spec.intent) && spec.nodes.length > 0)
            || (spec.intent === 'erDiagram' && spec.payload?.kind === 'entity-relationship');
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        if (spec.intent === 'erDiagram') {
            const scene = buildEntityRelationshipScene(spec);
            return { target: this.target, content: exportEntityRelationshipDrawio(scene), mimeType: 'application/vnd.jgraph.mxfile', sourceIntent: spec.intent,
                layoutSafetyVersion: LAYOUT_SAFETY_VERSION,
                previewSvg: { content: renderEntityRelationshipSvg(scene), mimeType: 'image/svg+xml', layoutSafetyVersion: LAYOUT_SAFETY_VERSION } };
        }

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
