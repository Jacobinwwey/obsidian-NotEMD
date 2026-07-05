import { RenderArtifact } from '../rendering/types';

export function unwrapMermaidFence(content: string): string {
    const trimmed = content.trim();
    const fenceMatch = trimmed.match(/^```mermaid\s*\n([\s\S]*?)\n```$/i);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function supportsInlineMermaidPreview(artifact: RenderArtifact): boolean {
    return artifact.target === 'mermaid' && artifact.mimeType === 'text/vnd.mermaid';
}

export function supportsInlineCanvasPreview(artifact: RenderArtifact): boolean {
    return artifact.target === 'json-canvas' && artifact.mimeType === 'application/json';
}

export function supportsInlineVegaLitePreview(artifact: RenderArtifact): boolean {
    return artifact.target === 'vega-lite' && artifact.mimeType === 'application/json';
}

export function supportsIframeHtmlPreview(artifact: RenderArtifact): boolean {
    return (artifact.target === 'html' || artifact.target === 'editable-html-svg')
        && artifact.mimeType === 'text/html';
}

export function supportsSourceOnlyDiagramPreview(artifact: RenderArtifact): boolean {
    return artifact.content.trim().length > 0
        && !supportsInlineMermaidPreview(artifact)
        && !supportsInlineCanvasPreview(artifact)
        && !supportsInlineVegaLitePreview(artifact)
        && !supportsIframeHtmlPreview(artifact);
}

export function supportsDiagramPreviewModal(artifact: RenderArtifact): boolean {
    return supportsInlineMermaidPreview(artifact)
        || supportsInlineCanvasPreview(artifact)
        || supportsInlineVegaLitePreview(artifact)
        || supportsIframeHtmlPreview(artifact)
        || supportsSourceOnlyDiagramPreview(artifact);
}
