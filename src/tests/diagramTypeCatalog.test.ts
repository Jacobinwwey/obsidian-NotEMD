import {
    EXECUTABLE_DIAGRAM_TYPES,
    findDiagramTypeByIntent,
    getExecutableDiagramType
} from '../diagram/diagramTypeCatalog';

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
        expect(EXECUTABLE_DIAGRAM_TYPES).toHaveLength(10);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Boolean(type.exampleFixtureId))).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Boolean((type as any).semanticPattern))).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.every(type => Array.isArray((type as any).visualRoles)
            && (type as any).visualRoles.length > 0)).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.map(type => type.id)).not.toContain('timeline');
    });

    test('resolves known catalog entries and rejects unknown identifiers', () => {
        expect(getExecutableDiagramType('circuit')).toMatchObject({ intent: 'circuit' });
        expect(() => getExecutableDiagramType('timeline' as never)).toThrow(/unsupported diagram catalog type/i);
    });

    test('describes Drawnix as one native tree renderer rather than a delivery selector', () => {
        const drawnix = findDiagramTypeByIntent('drawnixMindmap');

        expect(drawnix.rendererTarget).toBe('drawnix');
        expect(drawnix.visualRoles).toEqual(expect.arrayContaining(['root', 'cross-relation']));
        expect(drawnix.semanticPattern).not.toMatch(/multi-root|presentation|full-board/i);
    });
});
