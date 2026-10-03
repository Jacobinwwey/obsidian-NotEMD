/** Relocate persisted source-visual references together with their companion files. */
export function rewriteSourceVisualManifestCompanionPaths(
    content: string,
    companionPathMap: ReadonlyMap<string, string>
): string {
    try {
        const parsed = JSON.parse(content) as unknown;
        if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { visuals?: unknown }).visuals)) {
            return content;
        }
        const visuals = (parsed as { visuals: unknown[] }).visuals.map(visual => {
            if (!visual || typeof visual !== 'object' || !Array.isArray((visual as { companionPaths?: unknown }).companionPaths)) {
                return visual;
            }
            const companionPaths = (visual as { companionPaths: unknown[] }).companionPaths.map(path => (
                typeof path === 'string' ? companionPathMap.get(path) ?? path : path
            ));
            return { ...(visual as Record<string, unknown>), companionPaths };
        });
        return JSON.stringify({ ...(parsed as Record<string, unknown>), visuals }, null, 2) + '\n';
    } catch {
        // Other text companions are not source-visual manifests.
        return content;
    }
}

export function rewriteDrawnixArtifactCompanionPaths(
    content: string,
    companionPathMap: ReadonlyMap<string, string>
): string {
    try {
        const parsed = JSON.parse(content) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return content;
        const root = parsed as Record<string, unknown>;
        if (root.type !== 'drawnix' || !root.metadata || typeof root.metadata !== 'object' || Array.isArray(root.metadata)) return content;
        const metadata = root.metadata as Record<string, unknown>;
        if (!metadata.notemd || typeof metadata.notemd !== 'object' || Array.isArray(metadata.notemd)) return content;
        const notemd = metadata.notemd as Record<string, unknown>;
        if (!Array.isArray(notemd.sourceVisuals)) return content;
        notemd.sourceVisuals = notemd.sourceVisuals.map(visual => {
            if (!visual || typeof visual !== 'object' || Array.isArray(visual)) return visual;
            const sourceVisual = visual as Record<string, unknown>;
            if (!Array.isArray(sourceVisual.companionPaths)) return visual;
            return {
                ...sourceVisual,
                companionPaths: sourceVisual.companionPaths.map(path => (
                    typeof path === 'string' ? companionPathMap.get(path) ?? path : path
                ))
            };
        });
        return `${JSON.stringify(root, null, 2)}\n`;
    } catch {
        // Non-Drawnix source documents do not contain this metadata contract.
        return content;
    }
}
