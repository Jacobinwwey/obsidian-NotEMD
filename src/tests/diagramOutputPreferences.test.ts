import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import {
    addDiagramOutputPreference,
    applyDiagramTypeOutputPreference,
    getDiagramOutputChoices,
    getExecutableDiagramOutputRequests,
    migrateDiagramOutputPreferences,
    removeDiagramOutputPreference,
    resolveDiagramOutputPlan
} from '../diagram/diagramOutputPreferences';
import type { NotemdSettings } from '../types';

function preferences(overrides: Partial<NotemdSettings> = {}): NotemdSettings {
    return { experimentalDiagramCompatibilityMode: 'best-fit', ...overrides } as NotemdSettings;
}

describe('diagram output preferences', () => {
    test('migrates legacy HTML meaning and renderer affinity without changing presentation settings', () => {
        const settings = preferences({ preferredDiagramRenderTarget: 'editable-html-svg', preferredDiagramTypeId: 'nested' });
        const before = JSON.stringify(settings);
        expect(migrateDiagramOutputPreferences(settings)).toEqual({ version: 1, requestedOutputs: ['html-diagram'] });
        expect(JSON.stringify(settings)).toBe(before);
        expect(resolveDiagramOutputPlan('nested', ['html-diagram'], settings.preferredDiagramRenderTarget).target).toBe('editable-html-svg');
        expect(migrateDiagramOutputPreferences(preferences({ preferredDiagramRenderTarget: 'html' })).requestedOutputs).toEqual(['html-summary']);
    });

    test('keeps Drawnix source, diagram HTML and SVG on a single target', () => {
        const plan = resolveDiagramOutputPlan('drawnix-knowledge-map', ['source:drawnix', 'html-diagram', 'svg']);
        expect(plan.target).toBe('drawnix');
        expect(plan.outputs).toEqual(['source:drawnix', 'html-diagram', 'svg']);
        expect(plan.inactiveOutputs).toEqual([]);
    });

    test('type selection preserves incompatible requests and supplies a declared default', () => {
        const settings = preferences({ preferredDiagramRenderTarget: 'drawnix', preferredDiagramTypeId: 'drawnix-knowledge-map' });
        applyDiagramTypeOutputPreference(settings, 'nested');
        expect(settings.diagramOutputPreferences?.requestedOutputs).toEqual(['source:drawnix']);
        const plan = resolveDiagramOutputPlan('nested', settings.diagramOutputPreferences!.requestedOutputs);
        expect(plan.outputs).toEqual(['html-diagram']);
        expect(plan.inactiveOutputs).toContainEqual({ id: 'source:drawnix', reason: 'incompatible-type' });
        expect(plan.usedDefaultOutput).toBe(true);
    });

    test('latest explicit output selects a compatible type without manual reset', () => {
        const settings = preferences({ preferredDiagramTypeId: 'nested', preferredDiagramIntent: 'nested', preferredDiagramRenderTarget: 'editable-html-svg' });
        addDiagramOutputPreference(settings, 'source:drawnix');
        expect(settings.preferredDiagramTypeId).toBe('drawnix-knowledge-map');
        expect(settings.preferredDiagramRenderTarget).toBe('drawnix');
        expect(settings.diagramOutputPreferences?.requestedOutputs).toEqual(['html-diagram', 'source:drawnix']);
    });

    test('retains compatible derivatives while marking old native requests inactive', () => {
        const plan = resolveDiagramOutputPlan('nested', ['source:drawnix', 'svg', 'pdf', 'html-summary']);
        expect(plan.outputs).toEqual(['svg', 'pdf', 'html-summary']);
        expect(plan.target).toBe('editable-html-svg');
        expect(plan.usedDefaultOutput).toBe(false);
    });

    test('latest compatible native source wins without pretending both sources were delivered', () => {
        const plan = resolveDiagramOutputPlan('flowchart', ['source:mermaid', 'svg', 'source:drawio']);
        expect(plan.target).toBe('drawio');
        expect(plan.outputs).toEqual(['svg', 'source:drawio']);
        expect(plan.inactiveOutputs).toContainEqual({ id: 'source:mermaid', reason: 'different-source' });
    });

    test('preserves unknown saved IDs as visible removable inactive preferences', () => {
        const settings = preferences({ diagramOutputPreferences: { version: 1, requestedOutputs: ['future-format', 'svg', 'svg'] } });
        expect(migrateDiagramOutputPreferences(settings).requestedOutputs).toEqual(['future-format', 'svg']);
        const choices = getDiagramOutputChoices(settings);
        expect(choices[0].status).toBe('supported');
        expect(choices.find(choice => choice.id === 'future-format')).toMatchObject({ selected: true, status: 'unsupported' });
        removeDiagramOutputPreference(settings, 'future-format');
        expect(settings.diagramOutputPreferences?.requestedOutputs).toEqual(['svg']);
    });

    test('selection operations leave all presentation configuration untouched', () => {
        const settings = preferences({ preferredDiagramTypeId: 'nested', slideExportFormat: 'mp4', slideExportHtmlMode: 'standalone' } as Partial<NotemdSettings>);
        const keys = Object.keys(settings).filter(key => key.startsWith('slideExport'));
        const before = keys.map(key => [key, settings[key as keyof NotemdSettings]]);
        addDiagramOutputPreference(settings, 'source:drawnix');
        applyDiagramTypeOutputPreference(settings, 'nested');
        expect(keys.map(key => [key, settings[key as keyof NotemdSettings]])).toEqual(before);
    });

    test('preserves unknown schema fields and execution isolation across selection changes', () => {
        const saved = { version: 2, requestedOutputs: ['source:drawnix'], futurePolicy: { mode: 'future' } };
        const settings = preferences({ preferredDiagramTypeId: 'nested', preferredDiagramRenderTarget: 'editable-html-svg', diagramOutputPreferences: saved });
        expect(migrateDiagramOutputPreferences(settings)).toEqual(saved);
        addDiagramOutputPreference(settings, 'svg');
        expect(settings.diagramOutputPreferences).toEqual({ ...saved, requestedOutputs: ['source:drawnix', 'svg'] });
        expect(getExecutableDiagramOutputRequests(settings.diagramOutputPreferences!)).toEqual(['unsupported-preferences-version:2']);
        removeDiagramOutputPreference(settings, 'source:drawnix');
        expect(settings.diagramOutputPreferences).toEqual({ ...saved, requestedOutputs: ['svg'] });
        expect(getExecutableDiagramOutputRequests(settings.diagramOutputPreferences!)).toEqual(['unsupported-preferences-version:2']);
    });

    test.each(EXECUTABLE_DIAGRAM_TYPES.map(type => [type.id] as const))('always produces a nonempty compatible default for %s', typeId => {
        const plan = resolveDiagramOutputPlan(typeId, []);
        const type = EXECUTABLE_DIAGRAM_TYPES.find(candidate => candidate.id === typeId)!;
        expect(type.compatibleTargets).toContain(plan.target);
        expect(plan.outputs.length).toBeGreaterThan(0);
        expect(plan.inactiveOutputs).toEqual([]);
    });
});
