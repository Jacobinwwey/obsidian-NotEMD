import { RenderPreviewSession } from '../rendering/host/renderHost';
import { RenderTarget } from '../diagram/types';

export interface DiagramPreviewHistoryEntry {
    id: string;
    key: string;
    label: string;
    sourcePath?: string;
    target: RenderTarget;
    session: RenderPreviewSession;
    openedAt: number;
}

const MAX_DIAGRAM_PREVIEW_HISTORY = 12;
let diagramPreviewHistory: DiagramPreviewHistoryEntry[] = [];

function basename(path: string): string {
    const trimmed = path.trim().replace(/\/+$/, '');
    const lastSlash = trimmed.lastIndexOf('/');
    return lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
}

function buildHistoryKey(session: RenderPreviewSession): string {
    const { payload } = session;
    return [
        payload.sourcePath ?? '',
        payload.artifact.target,
        payload.previewTitle ?? '',
        payload.theme,
        payload.resolvedTheme,
        payload.artifactSaved ? 'saved' : 'source',
        JSON.stringify(payload.artifact.diagnostics ?? []),
        payload.artifact.content
    ].join('::');
}

function buildHistoryLabel(session: RenderPreviewSession): string {
    if (session.payload.sourcePath?.trim()) {
        return basename(session.payload.sourcePath);
    }

    return session.payload.previewTitle ?? `${session.payload.artifact.target} preview`;
}

function cloneEntry(entry: DiagramPreviewHistoryEntry): DiagramPreviewHistoryEntry {
    return { ...entry };
}

export function rememberDiagramPreviewSession(session: RenderPreviewSession): DiagramPreviewHistoryEntry {
    const key = buildHistoryKey(session);
    const now = Date.now();
    const existingIndex = diagramPreviewHistory.findIndex(entry => entry.key === key);

    if (existingIndex >= 0) {
        const existing = diagramPreviewHistory.splice(existingIndex, 1)[0];
        const refreshed: DiagramPreviewHistoryEntry = {
            ...existing,
            label: buildHistoryLabel(session),
            sourcePath: session.payload.sourcePath,
            target: session.payload.artifact.target,
            session,
            openedAt: now
        };
        diagramPreviewHistory.unshift(refreshed);
        return cloneEntry(refreshed);
    }

    const entry: DiagramPreviewHistoryEntry = {
        id: `diagram-preview-${now}-${Math.random().toString(36).slice(2, 8)}`,
        key,
        label: buildHistoryLabel(session),
        sourcePath: session.payload.sourcePath,
        target: session.payload.artifact.target,
        session,
        openedAt: now
    };
    diagramPreviewHistory.unshift(entry);
    if (diagramPreviewHistory.length > MAX_DIAGRAM_PREVIEW_HISTORY) {
        diagramPreviewHistory = diagramPreviewHistory.slice(0, MAX_DIAGRAM_PREVIEW_HISTORY);
    }

    return cloneEntry(entry);
}

export function listDiagramPreviewHistory(): DiagramPreviewHistoryEntry[] {
    return diagramPreviewHistory.map(cloneEntry);
}

export function getDiagramPreviewHistoryEntry(entryId: string): DiagramPreviewHistoryEntry | null {
    const entry = diagramPreviewHistory.find(item => item.id === entryId);
    return entry ? cloneEntry(entry) : null;
}

export function clearDiagramPreviewHistory(): void {
    diagramPreviewHistory = [];
}
