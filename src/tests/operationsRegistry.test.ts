import { getOperationDefinition, listOperationDefinitions } from '../operations/registry';

describe('operations registry', () => {
    test('lists first-class operation definitions for current CLI-grade seams', () => {
        const definitions = listOperationDefinitions();
        const ids = definitions.map(definition => definition.id);

        expect(ids).toEqual(expect.arrayContaining([
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate',
            'diagram.preview',
            'provider.profile.export',
            'provider.profile.import'
        ]));
    });

    test('returns structured metadata for provider diagnostic run', () => {
        const definition = getOperationDefinition('provider.diagnostic.run');

        expect(definition).toEqual(expect.objectContaining({
            id: 'provider.diagnostic.run',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'read-only',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({ commandId: 'test-llm-connection', mappingKind: 'future-target' }),
                expect.objectContaining({ commandId: 'run-developer-provider-diagnostic', mappingKind: 'exact' })
            ])
        }));
    });

    test('returns structured metadata for diagram generation', () => {
        const definition = getOperationDefinition('diagram.generate');

        expect(definition).toEqual(expect.objectContaining({
            id: 'diagram.generate',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'read-only',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'notemd-generate-diagram',
                    mappingKind: 'exact',
                    defaultInput: expect.objectContaining({ outputMode: 'artifact' })
                }),
                expect.objectContaining({
                    commandId: 'notemd-summarize-as-mermaid',
                    mappingKind: 'exact',
                    defaultInput: expect.objectContaining({ outputMode: 'mermaid' })
                })
            ]),
            inputSchema: expect.objectContaining({
                required: expect.arrayContaining(['sourceMarkdown', 'compatibilityMode', 'outputMode'])
            }),
            resultSchema: expect.objectContaining({
                required: expect.arrayContaining(['plan', 'spec', 'artifact'])
            })
        }));
    });
});
