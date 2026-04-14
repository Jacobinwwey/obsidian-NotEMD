import { renderClassMermaid } from '../../diagram/adapters/mermaid/classAdapter';
import { DiagramSpec } from '../../diagram/types';
import { renderErMermaid } from '../../diagram/adapters/mermaid/erAdapter';
import { renderFlowchartMermaid } from '../../diagram/adapters/mermaid/flowchartAdapter';
import { renderMindmapMermaid } from '../../diagram/adapters/mermaid/mindmapAdapter';
import { renderSequenceMermaid } from '../../diagram/adapters/mermaid/sequenceAdapter';
import { renderStateMermaid } from '../../diagram/adapters/mermaid/stateAdapter';
import { validateMermaidDefinition } from '../../diagram/adapters/mermaid/validator';
import { DiagramRenderer, RenderArtifact } from '../types';

export class MermaidRenderer implements DiagramRenderer {
    readonly id = 'mermaid';
    readonly target = 'mermaid' as const;

    supports(spec: DiagramSpec): boolean {
        return spec.intent === 'mindmap'
            || spec.intent === 'flowchart'
            || spec.intent === 'sequence'
            || spec.intent === 'classDiagram'
            || spec.intent === 'erDiagram'
            || spec.intent === 'stateDiagram';
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        if (spec.intent === 'mindmap') {
            return this.buildArtifact(spec, renderMindmapMermaid(spec));
        }

        if (spec.intent === 'flowchart') {
            return this.buildArtifact(spec, renderFlowchartMermaid(spec));
        }

        if (spec.intent === 'sequence') {
            return this.buildArtifact(spec, renderSequenceMermaid(spec));
        }

        if (spec.intent === 'erDiagram') {
            return this.buildArtifact(spec, renderErMermaid(spec));
        }

        if (spec.intent === 'classDiagram') {
            return this.buildArtifact(spec, renderClassMermaid(spec));
        }

        if (spec.intent === 'stateDiagram') {
            return this.buildArtifact(spec, renderStateMermaid(spec));
        }

        throw new Error(`MermaidRenderer does not support diagram intent "${spec.intent}".`);
    }

    private async buildArtifact(spec: DiagramSpec, content: string): Promise<RenderArtifact> {
        return {
            target: this.target,
            content: await validateMermaidDefinition(content),
            mimeType: 'text/vnd.mermaid',
            sourceIntent: spec.intent
        };
    }
}
