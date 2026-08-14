import { DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact, RenderOptions } from '../types';
import { renderDrawnixKnowledgeMapBoardArtifact } from './drawnixKnowledgeMapBoardArtifactRenderer';
import { renderDrawnixKnowledgeMapPresentationArtifact } from './drawnixKnowledgeMapPresentationRenderer';

const SUPPORTED_DRAWNIX_INTENTS = new Set<DiagramSpec['intent']>(['drawnixMindmap']);

/**
 * Host-facing renderer selector. Each delivery owns its complete projection
 * and artifact contract rather than sharing a layout mode switch.
 */
export class DrawnixRenderer implements DiagramRenderer {
    readonly id = 'drawnix';
    readonly target = 'drawnix' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWNIX_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec, options: RenderOptions = {}): Promise<RenderArtifact> {
        return options.drawnixKnowledgeMapDelivery === 'presentation'
            ? renderDrawnixKnowledgeMapPresentationArtifact(spec, options)
            : renderDrawnixKnowledgeMapBoardArtifact(spec, options);
    }
}
