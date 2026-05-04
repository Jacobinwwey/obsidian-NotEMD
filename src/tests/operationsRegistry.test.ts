import { getOperationDefinition, listOperationDefinitions } from '../operations/registry';

describe('operations registry', () => {
    test('lists first-class operation definitions for current CLI-grade seams', () => {
        const definitions = listOperationDefinitions();
        const ids = definitions.map(definition => definition.id);

        expect(ids).toEqual(expect.arrayContaining([
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate',
            'provider.profile.export',
            'provider.profile.import'
        ]));
    });

    test('returns structured metadata for provider diagnostic run', () => {
        const definition = getOperationDefinition('provider.diagnostic.run');

        expect(definition).toEqual(expect.objectContaining({
            id: 'provider.diagnostic.run',
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'read-only'
        }));
    });

    test('returns structured metadata for diagram generation', () => {
        const definition = getOperationDefinition('diagram.generate');

        expect(definition).toEqual(expect.objectContaining({
            id: 'diagram.generate',
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file'
        }));
    });
});
