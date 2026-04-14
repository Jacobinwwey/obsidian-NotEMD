import { RenderArtifact } from '../types';
import {
    ResolvedRenderTheme,
    RenderWebviewTheme,
    resolveRenderTheme
} from '../theme';

export type { RenderWebviewTheme, ResolvedRenderTheme } from '../theme';

export interface RenderWebviewPayload {
    artifact: RenderArtifact;
    theme: RenderWebviewTheme;
    resolvedTheme: ResolvedRenderTheme;
    sourcePath?: string;
    artifactSaved?: boolean;
}

export interface RenderWebviewPayloadOptions {
    theme?: RenderWebviewTheme;
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
        sourcePath: options.sourcePath,
        artifactSaved: options.artifactSaved ?? false
    };
}
