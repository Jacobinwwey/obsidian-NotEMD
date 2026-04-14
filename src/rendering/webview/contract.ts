import { RenderArtifact } from '../types';
import {
    ResolvedRenderTheme,
    RenderWebviewTheme,
    resolveRenderTheme
} from '../theme';
import { getRenderTargetDisplayName } from '../targetLabel';

export type { RenderWebviewTheme, ResolvedRenderTheme } from '../theme';

export interface RenderWebviewPayload {
    artifact: RenderArtifact;
    theme: RenderWebviewTheme;
    resolvedTheme: ResolvedRenderTheme;
    previewTitle?: string;
    sourcePath?: string;
    artifactSaved?: boolean;
}

export interface RenderWebviewPayloadOptions {
    theme?: RenderWebviewTheme;
    previewTitle?: string;
    sourcePath?: string;
    artifactSaved?: boolean;
}

export function createRenderWebviewPayload(
    artifact: RenderArtifact,
    options: RenderWebviewPayloadOptions = {}
): RenderWebviewPayload {
    const theme = options.theme ?? 'system';
    return {
        artifact,
        theme,
        resolvedTheme: resolveRenderTheme(theme),
        previewTitle: options.previewTitle ?? `${getRenderTargetDisplayName(artifact.target)} preview`,
        sourcePath: options.sourcePath,
        artifactSaved: options.artifactSaved ?? false
    };
}
