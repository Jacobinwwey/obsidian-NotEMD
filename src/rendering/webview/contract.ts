import { RenderArtifact } from '../types';

export type RenderWebviewTheme = 'system' | 'light' | 'dark';

export interface RenderWebviewPayload {
    artifact: RenderArtifact;
    theme: RenderWebviewTheme;
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
    return {
        artifact,
        theme: options.theme ?? 'system',
        sourcePath: options.sourcePath,
        artifactSaved: options.artifactSaved ?? false
    };
}
