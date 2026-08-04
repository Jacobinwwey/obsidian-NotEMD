import { normalizeMermaidDefinition } from './mermaidDefinitionShared';
import { RenderArtifact } from '../types';
import { RenderWebviewTheme } from '../theme';
import { loadDefaultBundledMermaidPreviewDeps } from './mermaidRuntime';
import {
    MermaidPreviewDeps,
    renderNormalizedMermaidDefinitionSvgForRasterExportWithDeps,
    renderNormalizedMermaidDefinitionSvgWithDeps
} from './mermaidPreviewShared';

export type { MermaidPreviewDeps } from './mermaidPreviewShared';

export async function renderMermaidArtifactSvg(
    artifact: RenderArtifact,
    deps?: MermaidPreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    if (artifact.target !== 'mermaid') {
        throw new Error(`renderMermaidArtifactSvg only supports mermaid artifacts, received "${artifact.target}".`);
    }

    const source = normalizeMermaidDefinition(artifact.content);
    const resolvedDeps = deps ?? await loadDefaultBundledMermaidPreviewDeps();
    return renderNormalizedMermaidDefinitionSvgWithDeps(source, resolvedDeps, theme);
}

export async function renderMermaidArtifactSvgForRasterExport(
    artifact: RenderArtifact,
    deps?: MermaidPreviewDeps,
    theme: RenderWebviewTheme = 'system'
): Promise<string> {
    if (artifact.target !== 'mermaid') {
        throw new Error(`renderMermaidArtifactSvgForRasterExport only supports mermaid artifacts, received "${artifact.target}".`);
    }

    const source = normalizeMermaidDefinition(artifact.content);
    const resolvedDeps = deps ?? await loadDefaultBundledMermaidPreviewDeps();
    return renderNormalizedMermaidDefinitionSvgForRasterExportWithDeps(source, resolvedDeps, theme);
}
