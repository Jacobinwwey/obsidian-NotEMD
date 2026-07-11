import { NotemdSettings } from '../types';
import { DiagramIntent } from './types';

type DiagramPreferenceSettings = Pick<
    NotemdSettings,
    'preferredDiagramIntent' | 'preferredDiagramRenderTarget' | 'experimentalDiagramCompatibilityMode'
>;

export function applyDiagramIntentPreference(
    settings: DiagramPreferenceSettings,
    intent: DiagramIntent | undefined
): void {
    settings.preferredDiagramIntent = intent;

    if (intent === 'circuit') {
        settings.preferredDiagramRenderTarget = 'circuitikz';
        settings.experimentalDiagramCompatibilityMode = 'best-fit';
        return;
    }

    if (settings.preferredDiagramRenderTarget === 'circuitikz') {
        settings.preferredDiagramRenderTarget = undefined;
    }
}
