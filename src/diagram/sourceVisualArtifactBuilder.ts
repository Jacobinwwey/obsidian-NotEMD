import { renderMermaidArtifactSvg } from '../rendering/preview/mermaidPreview';
import {
    RenderArtifactCompanion,
    RenderArtifactDiagnostic,
    RenderArtifactSourceVisualManifestEntry
} from '../rendering/types';
import { ResolvedSourceVisual } from './sourceVisuals';

export interface SourceVisualCompanionBuildResult {
    companions: RenderArtifactCompanion[];
    manifest: RenderArtifactSourceVisualManifestEntry[];
    diagnostics: RenderArtifactDiagnostic[];
}

export interface SourceVisualCompanionBuildOptions {
    renderMermaidSvg?: (definition: string) => Promise<string>;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeSvg(svg: string): string {
    return svg
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
        .replace(/\s+(?:href|xlink:href|src)\s*=\s*(?:"(?:(?:https?:|javascript:|data:text\/html|data:application\/javascript)[^"]*)"|'(?:(?:https?:|javascript:|data:text\/html|data:application\/javascript)[^']*)')/gi, '');
}

function buildFallbackMermaidSvg(definition: string): string {
    const lines = definition.split('\n').slice(0, 80);
    const lineHeight = 18;
    const height = Math.max(96, lines.length * lineHeight + 48);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" role="img"><rect width="960" height="${height}" fill="#ffffff"/><text x="24" y="32" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#172033">Mermaid source visual</text>${lines.map((line, index) => `<text x="24" y="${56 + index * lineHeight}" font-family="Consolas, monospace" font-size="13" fill="#334155">${escapeHtml(line)}</text>`).join('')}</svg>`;
}

async function defaultMermaidSvgRenderer(definition: string): Promise<string> {
    return await renderMermaidArtifactSvg({
        target: 'mermaid',
        content: definition,
        mimeType: 'text/vnd.mermaid',
        sourceIntent: 'mindmap'
    });
}

function companionName(visual: ResolvedSourceVisual, suffix: string): string {
    return `source-visual-${visual.id.replace(/[^a-zA-Z0-9_-]+/g, '-')}${suffix}`;
}

function buildManifestCompanion(manifest: readonly RenderArtifactSourceVisualManifestEntry[]): RenderArtifactCompanion {
    return {
        path: 'source-visual-manifest.json',
        content: JSON.stringify({ version: 1, visuals: manifest }, null, 2) + '\n',
        mimeType: 'application/json'
    };
}

export async function buildSourceVisualCompanions(
    visuals: readonly ResolvedSourceVisual[] | undefined,
    options: SourceVisualCompanionBuildOptions = {}
): Promise<SourceVisualCompanionBuildResult> {
    const companions: RenderArtifactCompanion[] = [];
    const manifest: RenderArtifactSourceVisualManifestEntry[] = [];
    const diagnostics: RenderArtifactDiagnostic[] = [];
    const renderMermaidSvg = options.renderMermaidSvg ?? defaultMermaidSvgRenderer;

    for (const visual of visuals ?? []) {
        const companionPaths: string[] = [];
        if (visual.status === 'resolved' && visual.kind === 'mermaid' && typeof visual.content === 'string') {
            const sourcePath = companionName(visual, '.mermaid.md');
            const svgPath = companionName(visual, '.svg');
            companions.push({
                path: sourcePath,
                content: `\`\`\`mermaid\n${visual.content.trim()}\n\`\`\`\n`,
                mimeType: 'text/markdown',
                sourceVisualId: visual.id
            });
            let svg: string;
            try {
                svg = await renderMermaidSvg(visual.content);
            } catch (error: unknown) {
                svg = buildFallbackMermaidSvg(visual.content);
                diagnostics.push({
                    severity: 'warning',
                    kind: 'source-visual-mermaid-render',
                    message: `Mermaid source visual ${visual.id} could not be rendered; a source-preserving SVG was emitted.`,
                    advice: error instanceof Error ? error.message : String(error)
                });
            }
            companions.push({
                path: svgPath,
                content: sanitizeSvg(svg),
                mimeType: 'image/svg+xml',
                sourceVisualId: visual.id
            });
            companionPaths.push(sourcePath, svgPath);
        } else if (visual.status === 'resolved' && visual.kind === 'image' && visual.content instanceof ArrayBuffer) {
            const imagePath = companionName(visual, `.${visual.vaultPath?.split('.').pop()?.toLowerCase() || 'bin'}`);
            companions.push({
                path: imagePath,
                content: visual.content,
                mimeType: visual.mimeType ?? 'application/octet-stream',
                binary: true,
                sourceVisualId: visual.id
            });
            companionPaths.push(imagePath);
        } else {
            diagnostics.push({
                severity: 'warning',
                kind: 'source-visual-unresolved',
                message: visual.diagnostic ?? `Source visual ${visual.id} was not resolved.`,
                advice: 'The source reference remains in the manifest so it can be repaired without regenerating the diagram.'
            });
        }

        manifest.push({
            id: visual.id,
            kind: visual.kind,
            status: visual.status,
            sourceHash: visual.sourceHash,
            sourcePath: visual.vaultPath ?? visual.targetPath,
            companionPaths,
            diagnostic: visual.diagnostic
        });
    }

    if (manifest.length > 0) {
        companions.push(buildManifestCompanion(manifest));
    }

    return { companions, manifest, diagnostics };
}
