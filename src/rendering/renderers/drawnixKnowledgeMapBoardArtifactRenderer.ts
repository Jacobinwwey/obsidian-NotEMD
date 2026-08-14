import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramIntent, DiagramSpec } from '../../diagram/types';
import {
    createDrawnixKnowledgeMapReplayRecord,
    exportDrawnixMindMapProjection,
    stringifyDrawnixMindMapExportedData,
    validateDrawnixMindMapExportedData
} from '../../diagram/adapters/drawnix/drawnixExporter';
import { buildDrawnixMindMapProjection } from '../../diagram/adapters/drawnix/drawnixMindMapProjection';
import { buildSourceVisualCompanions } from '../../diagram/sourceVisualArtifactBuilder';
import { RenderArtifact, RenderOptions } from '../types';
import { renderDrawnixMindMapSvg } from './drawnixMindMapSvgRenderer';

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

/**
 * Produces the editable Drawnix board and the legacy full-spread SVG
 * companion. Presentation delivery derives from this stable semantic export.
 */
export async function renderDrawnixKnowledgeMapBoardArtifact(
    spec: DiagramSpec,
    options: RenderOptions = {}
): Promise<RenderArtifact> {
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
    const replay = createDrawnixKnowledgeMapReplayRecord(spec);
    const data = exportDrawnixMindMapProjection(projection, sourceVisualMetadata, replay);
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
        target: 'drawnix',
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
                        target: 'drawnix',
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
