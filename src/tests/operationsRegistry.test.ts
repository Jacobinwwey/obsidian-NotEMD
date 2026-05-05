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
            'translate.file',
            'translate.folder-batch',
            'concept.extract-file',
            'concept.extract-folder',
            'content.extract-original-text',
            'workflow.extract-and-generate',
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

    test('returns structured metadata for note-processing operations', () => {
        const translateFile = getOperationDefinition('translate.file');
        const extractOriginalText = getOperationDefinition('content.extract-original-text');
        const extractAndGenerate = getOperationDefinition('workflow.extract-and-generate');

        expect(translateFile).toEqual(expect.objectContaining({
            id: 'translate.file',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'translate-file',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    targetLanguage: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object)
                })
            })
        }));

        expect(extractOriginalText).toEqual(expect.objectContaining({
            id: 'content.extract-original-text',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'extract-original-text',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(extractAndGenerate).toEqual(expect.objectContaining({
            id: 'workflow.extract-and-generate',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'batch-write',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'extract-concepts-and-generate-titles',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    conceptFolderPath: expect.any(Object),
                    completeFolderPath: expect.any(Object)
                })
            })
        }));
    });
});
