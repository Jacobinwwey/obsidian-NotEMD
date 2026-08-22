import { NotemdSettings } from '../types';
import {
    DiagramCatalogTypeId,
    DiagramIntent,
    RenderTarget,
    isSupportedDiagramIntent
} from './types';
import {
    findDefaultDiagramType,
    getExecutableDiagramType
} from './diagramTypeCatalog';

type DiagramPreferenceSettings = Pick<
    NotemdSettings,
    'preferredDiagramIntent'
    | 'preferredDiagramTypeId'
    | 'preferredDiagramRenderTarget'
    | 'experimentalDiagramCompatibilityMode'
>;

export function resolvePreferredDiagramTypeId(
    settings: Pick<NotemdSettings, 'preferredDiagramIntent' | 'preferredDiagramTypeId'>
): DiagramCatalogTypeId | undefined {
    if (settings.preferredDiagramTypeId) {
        try {
            return getExecutableDiagramType(settings.preferredDiagramTypeId).id;
        } catch {
            // A stale catalog id must not prevent older semantic settings from loading.
        }
    }

    if (settings.preferredDiagramIntent && isSupportedDiagramIntent(settings.preferredDiagramIntent)) {
        return findDefaultDiagramType(settings.preferredDiagramIntent).id;
    }

    return undefined;
}

export function resolveDiagramTypeId(selection: string | undefined): DiagramCatalogTypeId | undefined {
    if (!selection || selection === 'auto') {
        return undefined;
    }

    try {
        return getExecutableDiagramType(selection as DiagramCatalogTypeId).id;
    } catch {
        if (isSupportedDiagramIntent(selection)) {
            return findDefaultDiagramType(selection).id;
        }
        return undefined;
    }
}

export function getDiagramTypeSelectionValue(typeId: DiagramCatalogTypeId | undefined): string {
    if (!typeId) {
        return 'auto';
    }

    const type = getExecutableDiagramType(typeId);
    return type.variant && type.variant !== 'auto' ? type.id : type.intent;
}

export function applyDiagramTypePreference(
    settings: DiagramPreferenceSettings,
    typeId: DiagramCatalogTypeId | undefined
): void {
    if (!typeId) {
        settings.preferredDiagramTypeId = undefined;
        settings.preferredDiagramIntent = undefined;
        return;
    }

    const type = getExecutableDiagramType(typeId);
    settings.preferredDiagramTypeId = type.id;
    settings.preferredDiagramIntent = type.intent;

    if (settings.preferredDiagramRenderTarget
        && !type.compatibleTargets.includes(settings.preferredDiagramRenderTarget)) {
        // Preserve progressive disclosure: an incompatible explicit target is
        // cleared to Auto so the planner can choose the type's default target.
        settings.preferredDiagramRenderTarget = undefined;
    }

    if (type.defaultTarget !== 'mermaid' && type.variant && type.variant !== 'auto') {
        settings.preferredDiagramRenderTarget = type.defaultTarget;
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
    }

    if (type.intent === 'drawnixMindmap') {
        settings.preferredDiagramRenderTarget = 'drawnix';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (type.intent === 'circuit') {
        settings.preferredDiagramRenderTarget = 'circuitikz';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
    }
}

export function applyDiagramIntentPreference(
    settings: DiagramPreferenceSettings,
    intent: DiagramIntent | undefined
): void {
    applyDiagramTypePreference(settings, intent ? findDefaultDiagramType(intent).id : undefined);
}

export function applyDiagramRenderTargetPreference(
    settings: DiagramPreferenceSettings,
    target: RenderTarget | undefined
): void {
    settings.preferredDiagramRenderTarget = target;

    if (target === 'drawnix') {
        settings.preferredDiagramTypeId = 'drawnix-knowledge-map';
        settings.preferredDiagramIntent = 'drawnixMindmap';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }
    if (target === 'circuitikz') {
        settings.preferredDiagramTypeId = 'circuit';
        settings.preferredDiagramIntent = 'circuit';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (target) {
        const selectedTypeId = resolvePreferredDiagramTypeId(settings);
        if (selectedTypeId) {
            const selectedType = getExecutableDiagramType(selectedTypeId);
            if (!selectedType.compatibleTargets.includes(target)) {
                // A target choice must not leave an impossible type/target pair
                // in persisted settings. Clear the semantic preference and let
                // the planner infer a compatible type on the next run.
                settings.preferredDiagramTypeId = undefined;
                settings.preferredDiagramIntent = undefined;
            }
        }
    }

    if (settings.preferredDiagramIntent === 'drawnixMindmap' || settings.preferredDiagramIntent === 'circuit') {
        settings.preferredDiagramTypeId = undefined;
        settings.preferredDiagramIntent = undefined;
    }
}
