import mermaid from 'mermaid';
import type { DiagramSpec } from '../src/diagram/types';
import { EditableHtmlSvgRenderer } from '../src/rendering/renderers/editableHtmlSvgRenderer';
import { renderClassMermaid } from '../src/diagram/adapters/mermaid/classAdapter';
import { renderSequenceMermaid } from '../src/diagram/adapters/mermaid/sequenceAdapter';
export { validateDiagramSpec } from '../src/diagram/spec';
export { rasterizeSvgToImageArrayBuffer } from '../src/rendering/preview/pngPreview';

export async function renderEditable(spec: DiagramSpec): Promise<{ svg: string }> {
    const artifact = await new EditableHtmlSvgRenderer().render(spec);
    if (!artifact.previewSvg) throw new Error('Acceptance editable renderer produced no SVG.');
    return { svg: artifact.previewSvg.content };
}

async function renderMermaidSource(content: string): Promise<{ svg: string; source: string }> {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    const source = content.trim().split(String.fromCharCode(10)).slice(1, -1).join(String.fromCharCode(10));
    return { svg: (await mermaid.render('acceptance-mermaid', source)).svg, source: content };
}

export function renderClass(spec: DiagramSpec): Promise<{ svg: string; source: string }> {
    return renderMermaidSource(renderClassMermaid(spec));
}

export function renderSequence(spec: DiagramSpec): Promise<{ svg: string; source: string }> {
    return renderMermaidSource(renderSequenceMermaid(spec));
}
