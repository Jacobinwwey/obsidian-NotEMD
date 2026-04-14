import mermaid from 'mermaid';
import { RenderArtifact } from '../types';

export interface MermaidPreviewDeps {
    initialize(config: Record<string, unknown>): void;
    render(id: string, source: string): Promise<{ svg: string }> | { svg: string };
}

function createPreviewId(): string {
    return `notemd-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function unwrapMermaidFence(content: string): string {
    const trimmed = content.trim();
    const fenceMatch = trimmed.match(/^```mermaid\s*\n([\s\S]*?)\n```$/i);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export async function renderMermaidArtifactSvg(
    artifact: RenderArtifact,
    deps: MermaidPreviewDeps = mermaid as unknown as MermaidPreviewDeps
): Promise<string> {
    if (artifact.target !== 'mermaid') {
        throw new Error(`renderMermaidArtifactSvg only supports mermaid artifacts, received "${artifact.target}".`);
    }

    deps.initialize({
        startOnLoad: false,
        securityLevel: 'loose'
    });

    const source = unwrapMermaidFence(artifact.content);
    const result = await deps.render(createPreviewId(), source);
    return result.svg;
}
