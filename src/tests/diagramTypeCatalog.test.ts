import {
    EXECUTABLE_DIAGRAM_TYPES,
    findDiagramTypeByIntent,
    getExecutableDiagramType
} from '../diagram/diagramTypeCatalog';
import { resolveDrawnixKnowledgeMapDelivery } from '../diagram/diagramPreferenceCompatibility';

describe('executable diagram type catalog', () => {
    test('binds the persisted Drawnix intent to its user-facing type', () => {
        expect(findDiagramTypeByIntent('drawnixMindmap')).toMatchObject({
            id: 'drawnix-knowledge-map',
            promptProfileId: 'drawnix-knowledge-map',
            rendererOperationId: 'drawnix-knowledge-map-board'
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

    test('keeps full-board delivery for legacy and malformed settings', () => {
        expect(resolveDrawnixKnowledgeMapDelivery({})).toBe('full-board');
        expect(resolveDrawnixKnowledgeMapDelivery({ drawnixKnowledgeMapDelivery: 'presentation' })).toBe('presentation');
        expect(resolveDrawnixKnowledgeMapDelivery({ drawnixKnowledgeMapDelivery: 'unexpected' as never })).toBe('full-board');
    });
});
