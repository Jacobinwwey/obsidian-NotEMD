import { mockSettings } from './__mocks__/settings';
import { migrateDiagramTypeOutputPreferences, getDiagramTypeOutputRequests, selectDiagramGenerationType, deselectDiagramGenerationType, setDiagramTypeOutputRequests, getDiagramGenerationSelections } from '../diagram/diagramTypeOutputPreferences';

describe('per-type diagram output preferences', () => {
    const settings = () => ({ ...mockSettings, preferredDiagramTypeId: 'nested' as const, diagramOutputPreferences: { version: 1, requestedOutputs: ['svg', 'pdf'] } });
    test('migrates legacy selection without writing settings', () => {
        const saved = settings();
        const before = JSON.stringify(saved);
        expect(migrateDiagramTypeOutputPreferences(saved)).toMatchObject({ version: 1, selectedTypeIds: ['nested'], outputsByType: { nested: ['svg', 'pdf'] } });
        expect(JSON.stringify(saved)).toBe(before);
    });
    test('edits formats independently and retains them across deselection', () => {
        const saved = settings();
        selectDiagramGenerationType(saved, 'drawnix-knowledge-map');
        setDiagramTypeOutputRequests(saved, 'drawnix-knowledge-map', ['source:drawnix', 'pdf']);
        deselectDiagramGenerationType(saved, 'drawnix-knowledge-map');
        expect(getDiagramTypeOutputRequests(saved, 'drawnix-knowledge-map')).toEqual(['source:drawnix', 'pdf']);
        selectDiagramGenerationType(saved, 'drawnix-knowledge-map');
        expect(getDiagramGenerationSelections(saved)).toEqual([
            { typeId: 'nested', requestedOutputs: ['svg', 'pdf'] },
            { typeId: 'drawnix-knowledge-map', requestedOutputs: ['source:drawnix', 'pdf'] }
        ]);
    });
    test('preserves unknown fields and types without executing them', () => {
        const saved = { ...settings(), diagramTypeOutputPreferences: { version: 1, selectedTypeIds: ['nested', 'future'], outputsByType: { nested: ['svg'], future: ['future-format'] }, futureOption: 42 } };
        setDiagramTypeOutputRequests(saved, 'nested', ['png']);
        expect(saved.diagramTypeOutputPreferences.futureOption).toBe(42);
        expect(saved.diagramTypeOutputPreferences.outputsByType.future).toEqual(['future-format']);
        expect(getDiagramGenerationSelections(saved)).toEqual([{ typeId: 'nested', requestedOutputs: ['png'] }]);
    });
    test('unknown schemas preserve the original record and fall back to legacy selection', () => {
        const saved = { ...settings(), diagramTypeOutputPreferences: { version: 9, selectedTypeIds: ['drawnix-knowledge-map'], outputsByType: { nested: ['png'] } } };
        const original = JSON.stringify(saved.diagramTypeOutputPreferences);
        expect(getDiagramGenerationSelections(saved)).toEqual([{ typeId: 'nested', requestedOutputs: ['svg', 'pdf'] }]);
        expect(() => setDiagramTypeOutputRequests(saved, 'nested', ['svg'])).toThrow(/version/i);
        expect(JSON.stringify(saved.diagramTypeOutputPreferences)).toBe(original);
    });
});
