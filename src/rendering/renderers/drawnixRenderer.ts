import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramSpec } from '../../diagram/types';
import {
    exportDrawnixMindMapProjection,
    stringifyDrawnixMindMapExportedData,
    validateDrawnixMindMapExportedData
} from '../../diagram/adapters/drawnix/drawnixExporter';
import { buildDrawnixMindMapProjection } from '../../diagram/adapters/drawnix/drawnixMindMapProjection';
import { buildSourceVisualCompanions } from '../../diagram/sourceVisualArtifactBuilder';
import { DiagramRenderer, RenderArtifact, RenderOptions } from '../types';
import { renderDrawnixMindMapSvg } from './drawnixMindMapSvgRenderer';

const SUPPORTED_DRAWNIX_INTENTS = new Set<DiagramSpec['intent']>(['drawnixMindmap']);

export class DrawnixRenderer implements DiagramRenderer {
    readonly id = 'drawnix';
    readonly target = 'drawnix' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWNIX_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec, options: RenderOptions = {}): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const projection = buildDrawnixMindMapProjection(spec);
        const sourceVisualCompanions = await buildSourceVisualCompanions(options.sourceVisuals, {
            inlineMermaidVisuals: true
        });
        const embeddedVisualsById = new Map(
            sourceVisualCompanions.previewVisuals.map(visual => [visual.id, visual] as const)
        );
        const sourceVisualMetadata = sourceVisualCompanions.manifest.map(visual => {
            const embedded = embeddedVisualsById.get(visual.id);
            return embedded
                ? {
                    ...visual,
                    embeddedSvg: embedded.svg,
                    sourceContent: embedded.sourceContent,
                    title: embedded.title,
                    lineStart: embedded.lineStart,
                    lineEnd: embedded.lineEnd
                }
                : visual;
        });
        const data = exportDrawnixMindMapProjection(projection, sourceVisualMetadata);
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
                content: renderDrawnixMindMapSvg(projection, sourceVisualCompanions.previewVisuals),
                mimeType: 'image/svg+xml'
            },
            companions: sourceVisualCompanions.companions,
            sourceVisualManifest: sourceVisualCompanions.manifest,
            diagnostics: sourceVisualCompanions.diagnostics.length > 0
                ? sourceVisualCompanions.diagnostics
                : undefined
        };
    }
}
