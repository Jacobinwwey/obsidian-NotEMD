import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramIntent, DiagramSpec } from '../../diagram/types';
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

function resolveMermaidIntent(source: string | undefined): DiagramIntent {
    const firstDirective = source
        ?.split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .find(line => line.length > 0 && !line.startsWith('%%')) ?? '';
    if (firstDirective === 'sequencediagram') return 'sequence';
    if (firstDirective === 'classdiagram') return 'classDiagram';
    if (firstDirective === 'erdiagram') return 'erDiagram';
    if (firstDirective.startsWith('statediagram')) return 'stateDiagram';
    if (firstDirective === 'mindmap') return 'mindmap';
    return 'flowchart';
}

export class DrawnixRenderer implements DiagramRenderer {
    readonly id = 'drawnix';
    readonly target = 'drawnix' as const;

    supports(spec: DiagramSpec): boolean {
        return SUPPORTED_DRAWNIX_INTENTS.has(spec.intent) && spec.nodes.length > 0;
    }

    async render(spec: DiagramSpec, options: RenderOptions = {}): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        const projection = buildDrawnixMindMapProjection(spec);
        const emitMermaidCompanions = options.drawnixExportMermaidCompanions === true;
        const sourceVisualCompanions = await buildSourceVisualCompanions(options.sourceVisuals, {
            inlineMermaidVisuals: !emitMermaidCompanions,
            emitSourceVisualCompanions: emitMermaidCompanions
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
        const content = stringifyDrawnixMindMapExportedData(data);
        const previewSvgContent = renderDrawnixMindMapSvg(projection, sourceVisualCompanions.previewVisuals);
        const validationErrors = validateDrawnixMindMapExportedData(data);
        if (validationErrors.length > 0) {
            throw new Error(`Drawnix mind-map validation failed: ${validationErrors.join('; ')}`);
        }

        const coverageDiagnostics = (spec.sourceCoverageDiagnostics ?? []).map(diagnostic => ({
            severity: diagnostic.kind === 'edge-dropped' || diagnostic.kind === 'node-compressed'
                ? 'warning' as const
                : 'info' as const,
            kind: `drawnix-source-coverage-${diagnostic.kind}`,
            message: diagnostic.message,
            advice: diagnostic.sourceIds?.length
                ? `Source ids: ${diagnostic.sourceIds.join(', ')}${diagnostic.targetId ? `; target: ${diagnostic.targetId}` : ''}`
                : diagnostic.targetId
                    ? `Target: ${diagnostic.targetId}`
                    : undefined
        }));
        const diagnostics = [...coverageDiagnostics, ...sourceVisualCompanions.diagnostics];

        return {
            target: this.target,
            content,
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: spec.intent,
            previewSvg: {
                content: previewSvgContent,
                mimeType: 'image/svg+xml'
            },
            companions: sourceVisualCompanions.companions,
            sourceVisualManifest: sourceVisualCompanions.manifest,
            previewPanels: sourceVisualCompanions.previewVisuals.length > 0
                ? [
                    {
                        id: 'drawnix-primary',
                        title: projection.title,
                        artifact: {
                            target: this.target,
                            content,
                            mimeType: 'application/vnd.drawnix+json',
                            sourceIntent: spec.intent,
                            previewSvg: { content: previewSvgContent, mimeType: 'image/svg+xml' }
                        }
                    },
                    ...sourceVisualCompanions.previewVisuals.map(visual => ({
                        id: visual.id,
                        title: visual.title,
                        artifact: {
                            target: 'mermaid' as const,
                            content: `\`\`\`mermaid\n${visual.sourceContent?.trim() ?? ''}\n\`\`\``,
                            mimeType: 'text/vnd.mermaid',
                            sourceIntent: resolveMermaidIntent(visual.sourceContent),
                            previewSvg: { content: visual.svg, mimeType: 'image/svg+xml' as const }
                        }
                    }))
                ]
                : undefined,
            diagnostics: diagnostics.length > 0
                ? diagnostics
                : undefined
        };
    }
}
