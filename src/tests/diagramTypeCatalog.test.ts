import {
    EXECUTABLE_DIAGRAM_TYPES,
    findDefaultDiagramType,
    findDiagramType,
    findDiagramTypeByIntent,
    getExecutableDiagramType
} from '../diagram/diagramTypeCatalog';
import { getDiagramPromptProfile } from '../diagram/prompts/diagramPromptProfileCatalog';

describe('executable diagram type catalog', () => {
    test('binds the persisted Drawnix intent to its user-facing type', () => {
        expect(findDiagramTypeByIntent('drawnixMindmap')).toMatchObject({
            id: 'drawnix-knowledge-map',
            semanticPattern: 'Filename-rooted knowledge tree with material cross-branch relationships',
            promptProfileId: 'drawnix-knowledge-map',
            rendererOperationId: 'drawnix-knowledge-map-tree'
        });
    });

    test('contains only complete, example-backed type definitions', () => {
        expect(EXECUTABLE_DIAGRAM_TYPES).toHaveLength(15);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Boolean(type.exampleFixtureId))).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Boolean((type as any).semanticPattern))).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Array.isArray((type as any).visualRoles)
            && (type as any).visualRoles.length > 0)).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.map(type => type.id)).toEqual(expect.arrayContaining([
            'timeline',
            'swimlane',
            'quadrant',
            'radar-chart',
            'org-chart'
        ]));
    });

    test('resolves known catalog entries and rejects unknown identifiers', () => {
        expect(getExecutableDiagramType('circuit')).toMatchObject({ intent: 'circuit' });
        expect(getExecutableDiagramType('radar-chart')).toMatchObject({ intent: 'radar' });
        expect(getExecutableDiagramType('org-chart')).toMatchObject({ intent: 'orgChart' });
    });

    test('has explicit payload and layout ownership for every executable type', () => {
        for (const type of EXECUTABLE_DIAGRAM_TYPES) {
            expect(type.payloadKind).toBeTruthy();
            expect(type.layoutProfileId).toBeTruthy();
            expect(getDiagramPromptProfile(type.promptProfileId).payloadKind).toBe(type.payloadKind);
        }
    });

    test('supports explicit variant lookup without weakening the legacy default lookup', () => {
        expect(findDiagramType('dataChart')).toMatchObject({ id: 'data-chart', variant: 'auto' });
        expect(findDefaultDiagramType('dataChart')).toMatchObject({ id: 'data-chart' });
        expect(() => findDiagramType('dataChart', 'line')).toThrow(/No executable diagram catalog type/i);
        expect(findDiagramTypeByIntent('dataChart')).toMatchObject({ id: 'data-chart', variant: 'auto' });
    });

    test('describes Drawnix as one native tree renderer rather than a delivery selector', () => {
        const drawnix = findDiagramTypeByIntent('drawnixMindmap');

        expect(drawnix.rendererTarget).toBe('drawnix');
        expect(drawnix.visualRoles).toEqual(expect.arrayContaining(['root', 'cross-relation']));
        expect(drawnix.semanticPattern).not.toMatch(/multi-root|presentation|full-board/i);
    });
});
