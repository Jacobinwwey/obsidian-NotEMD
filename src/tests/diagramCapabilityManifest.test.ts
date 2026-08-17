import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import {
    DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION,
    getDiagramCapabilityManifest
} from '../diagram/diagramCapabilityManifest';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';

describe('diagram capability manifest', () => {
    test('is versioned and covers every shipped type from the executable catalog', () => {
        const manifest = getDiagramCapabilityManifest();

        expect(manifest.schemaVersion).toBe(DIAGRAM_CAPABILITY_MANIFEST_SCHEMA_VERSION);
        expect(manifest.shippedTypes).toHaveLength(EXECUTABLE_DIAGRAM_TYPES.length);
        expect(manifest.shippedTypes.map(type => type.id).sort()).toEqual(
            EXECUTABLE_DIAGRAM_TYPES.map(type => type.id).sort()
        );
        expect(manifest.shippedTypes.every(type => type.lifecycle === 'shipped')).toBe(true);
    });

    test('keeps target compatibility and fixture ownership executable', () => {
        const manifest = getDiagramCapabilityManifest();

        for (const type of manifest.shippedTypes) {
            expect(type.compatibleTargets).toContain(type.defaultTarget);
            expect(type.compatibleTargets.map(target => getRenderTargetDescriptor(target).target))
                .toEqual(type.compatibleTargets);
            expect(type.fixtureId).toBe(
                EXECUTABLE_DIAGRAM_TYPES.find(candidate => candidate.id === type.id)?.exampleFixtureId
            );
        }
    });

    test('keeps diagram-design layouts reference-only and out of the runtime selector', () => {
        const manifest = getDiagramCapabilityManifest();

        expect(manifest.referenceOnlyLayouts).toHaveLength(27);
        expect(manifest.referenceOnlyLayouts.every(layout => layout.lifecycle === 'reference-only')).toBe(true);
        expect(manifest.referenceOnlyLayouts.some(layout => layout.id === 'diagram-design:timeline')).toBe(true);
        expect(EXECUTABLE_DIAGRAM_TYPES.map(type => type.id)).not.toContain('timeline');
    });
});
