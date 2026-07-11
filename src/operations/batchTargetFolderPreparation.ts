export type BatchTargetPathInspection =
    | { kind: 'missing' }
    | { kind: 'file' }
    | { kind: 'folder'; childCount: number; sample: string[] };

export interface BatchTargetFolderPreparationRequest {
    path: string;
    inspect: () => Promise<BatchTargetPathInspection>;
    createFolder: (path: string) => Promise<void>;
    confirmMissing: (path: string) => Promise<{ confirmed: boolean; remember: boolean }>;
    confirmNonEmpty: (details: { path: string; childCount: number; sample: string[] }) => Promise<boolean>;
    rememberAutoCreate: (enabled: boolean) => Promise<void>;
    autoCreateMissing: boolean;
    interactive: boolean;
}

export type BatchTargetFolderPreparationResult = {
    status: 'ready' | 'cancelled' | 'requires-interaction';
    path: string;
    reason?: 'missing' | 'non-empty' | 'path-is-file';
};

export async function prepareBatchTargetFolder(
    request: BatchTargetFolderPreparationRequest
): Promise<BatchTargetFolderPreparationResult> {
    const inspection = await request.inspect();
    if (inspection.kind === 'file') {
        return { status: 'requires-interaction', path: request.path, reason: 'path-is-file' };
    }
    if (inspection.kind === 'missing') {
        if (!request.autoCreateMissing && !request.interactive) {
            return { status: 'requires-interaction', path: request.path, reason: 'missing' };
        }
        if (!request.autoCreateMissing) {
            const decision = await request.confirmMissing(request.path);
            if (!decision.confirmed) {
                return { status: 'cancelled', path: request.path, reason: 'missing' };
            }
            if (decision.remember) {
                await request.rememberAutoCreate(true);
            }
        }
        await request.createFolder(request.path);
        return { status: 'ready', path: request.path };
    }
    if (inspection.childCount === 0) {
        return { status: 'ready', path: request.path };
    }
    if (!request.interactive) {
        return { status: 'requires-interaction', path: request.path, reason: 'non-empty' };
    }
    const confirmed = await request.confirmNonEmpty({ path: request.path, childCount: inspection.childCount, sample: inspection.sample });
    return confirmed
        ? { status: 'ready', path: request.path }
        : { status: 'cancelled', path: request.path, reason: 'non-empty' };
}
