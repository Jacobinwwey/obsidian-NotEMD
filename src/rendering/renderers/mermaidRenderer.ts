import { DiagramSpec } from '../../diagram/types';
import { renderFlowchartMermaid } from '../../diagram/adapters/mermaid/flowchartAdapter';
import { renderMindmapMermaid } from '../../diagram/adapters/mermaid/mindmapAdapter';
import { DiagramRenderer, RenderArtifact } from '../types';

export class MermaidRenderer implements DiagramRenderer {
    readonly id = 'mermaid';
    readonly target = 'mermaid' as const;

    supports(spec: DiagramSpec): boolean {
        return spec.intent === 'mindmap' || spec.intent === 'flowchart';
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        if (spec.intent === 'mindmap') {
            return {
                target: this.target,
                content: renderMindmapMermaid(spec),
                mimeType: 'text/vnd.mermaid',
                sourceIntent: spec.intent
            };
        }

        if (spec.intent === 'flowchart') {
            return {
                target: this.target,
                content: renderFlowchartMermaid(spec),
                mimeType: 'text/vnd.mermaid',
                sourceIntent: spec.intent
            };
        }

        throw new Error(`MermaidRenderer does not support diagram intent "${spec.intent}".`);
    }
}
