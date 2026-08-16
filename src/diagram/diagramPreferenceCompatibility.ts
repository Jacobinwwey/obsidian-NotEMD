import { NotemdSettings } from '../types';
import { DiagramIntent, RenderTarget } from './types';

type DiagramPreferenceSettings = Pick<
    NotemdSettings,
    'preferredDiagramIntent' | 'preferredDiagramRenderTarget' | 'experimentalDiagramCompatibilityMode'
>;

export function applyDiagramIntentPreference(
    settings: DiagramPreferenceSettings,
    intent: DiagramIntent | undefined
): void {
    settings.preferredDiagramIntent = intent;

    if (intent === 'drawnixMindmap') {
        settings.preferredDiagramRenderTarget = 'drawnix';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (intent === 'circuit') {
        settings.preferredDiagramRenderTarget = 'circuitikz';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (settings.preferredDiagramRenderTarget === 'circuitikz' || settings.preferredDiagramRenderTarget === 'drawnix') {
        settings.preferredDiagramRenderTarget = undefined;
    }
}

export function applyDiagramRenderTargetPreference(
    settings: DiagramPreferenceSettings,
    target: RenderTarget | undefined
): void {
    settings.preferredDiagramRenderTarget = target;

    if (target === 'drawnix') {
        settings.preferredDiagramIntent = 'drawnixMindmap';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }
    if (target === 'circuitikz') {
        settings.preferredDiagramIntent = 'circuit';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (settings.preferredDiagramIntent === 'drawnixMindmap' || settings.preferredDiagramIntent === 'circuit') {
        settings.preferredDiagramIntent = undefined;
    }
}
