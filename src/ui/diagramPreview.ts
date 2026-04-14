import { RenderArtifact } from '../rendering/types';

export function unwrapMermaidFence(content: string): string {
    const trimmed = content.trim();
    const fenceMatch = trimmed.match(/^```mermaid\s*\n([\s\S]*?)\n```$/i);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function supportsInlineMermaidPreview(artifact: RenderArtifact): boolean {
    return artifact.target === 'mermaid' && artifact.mimeType === 'text/vnd.mermaid';
}
