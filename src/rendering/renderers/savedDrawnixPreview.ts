import { validateDrawnixMindMapExportedData, DrawnixMindMapExportedData } from '../../diagram/adapters/drawnix/drawnixExporter';
import { buildDrawnixMindMapProjection, validateDrawnixMindMapSpec, DrawnixMindMapElement } from '../../diagram/adapters/drawnix/drawnixMindMapProjection';
import type { DiagramNode, DiagramSpec } from '../../diagram/types';
import type { RenderArtifact } from '../types';
import { renderDrawnixMindMapSvg } from './drawnixMindMapSvgRenderer';

export function createSavedDrawnixMindMapPreview(content: string): Pick<RenderArtifact, 'previewSvg' | 'diagnostics'> {
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { return {}; }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Attachment schema versions do not change the native hierarchy contract.
    const native = { ...parsed, metadata: undefined };
    if (validateDrawnixMindMapExportedData(native).length > 0) return {};
    const saved = native as DrawnixMindMapExportedData;
    const roots = saved.elements.filter((element): element is DrawnixMindMapElement => element.type === 'mindmap');
    const readNode = (element: DrawnixMindMapElement): DiagramNode => ({
        id: element.id,
        label: element.data.topic.children.map(child => child.text).join(''),
        children: element.children.map(readNode)
    });
    const nodes = roots.map(readNode);
    const edges = saved.elements.flatMap(element => element.type === 'arrow-line' ? [{
        from: element.source.id, to: element.target.id,
        label: element.texts.map(text => text.text.children.map(child => child.text).join('')).join(' ')
    }] : []);
    const spec: DiagramSpec = { intent: 'drawnixMindmap', title: nodes[0].label, nodes, edges };
    const projectionErrors = validateDrawnixMindMapSpec(spec);
    if (projectionErrors.length > 0) {
        return { diagnostics: [{
            severity: 'warning', kind: 'drawnix-source-preview-unavailable',
            message: 'The saved Drawnix content is outside the supported preview projection.',
            advice: `${projectionErrors.join(' ')} The native source remains available and unchanged.`
        }] };
    }
    const projection = buildDrawnixMindMapProjection(spec);
    return {
        previewSvg: { content: renderDrawnixMindMapSvg(projection), mimeType: 'image/svg+xml' },
        diagnostics: [{
            severity: 'info', kind: 'drawnix-derived-preview',
            message: 'Preview reconstructed from the saved Drawnix hierarchy and relationships.',
            advice: 'Layout is derived, not the native editor geometry. The source file is unchanged.'
        }]
    };
}
