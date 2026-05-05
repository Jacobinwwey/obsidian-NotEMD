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
            'file.process-add-links',
            'file.process-folder-add-links',
            'content.generate-from-title',
            'content.batch-generate-from-titles',
            'research.summarize-topic',
            'translate.file',
            'translate.folder-batch',
            'concept.extract-file',
            'concept.extract-folder',
            'content.extract-original-text',
            'workflow.extract-and-generate',
            'duplicate.check-file',
            'concept.dedupe',
            'mermaid.batch-fix',
            'formula.fix-file',
            'formula.batch-fix',
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
        const processCurrent = getOperationDefinition('file.process-add-links');
        const processFolder = getOperationDefinition('file.process-folder-add-links');
        const generateFromTitle = getOperationDefinition('content.generate-from-title');
        const batchGenerate = getOperationDefinition('content.batch-generate-from-titles');
        const researchSummarize = getOperationDefinition('research.summarize-topic');
        const translateFile = getOperationDefinition('translate.file');
        const extractOriginalText = getOperationDefinition('content.extract-original-text');
        const extractAndGenerate = getOperationDefinition('workflow.extract-and-generate');

        expect(processCurrent).toEqual(expect.objectContaining({
            id: 'file.process-add-links',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'process-with-notemd',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object)
                })
            })
        }));

        expect(processFolder).toEqual(expect.objectContaining({
            id: 'file.process-folder-add-links',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'folder-selection',
            sideEffectClass: 'batch-write',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'process-folder-with-notemd',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(generateFromTitle).toEqual(expect.objectContaining({
            id: 'content.generate-from-title',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'generate-content-from-title',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(batchGenerate).toEqual(expect.objectContaining({
            id: 'content.batch-generate-from-titles',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'folder-selection',
            sideEffectClass: 'batch-write',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'batch-generate-content-from-titles',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourceFolderPath: expect.any(Object),
                    completeFolderPath: expect.any(Object)
                })
            })
        }));

        expect(researchSummarize).toEqual(expect.objectContaining({
            id: 'research.summarize-topic',
            version: 1,
            automationLevel: 'requires-selection',
            requiredContext: 'editor-selection',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'research-and-summarize-topic',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    topic: expect.any(Object)
                })
            })
        }));

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

    test('returns structured metadata for utility operations', () => {
        const checkDuplicates = getOperationDefinition('duplicate.check-file');
        const dedupeConcepts = getOperationDefinition('concept.dedupe');
        const batchMermaidFix = getOperationDefinition('mermaid.batch-fix');
        const fixFormulaFile = getOperationDefinition('formula.fix-file');
        const batchFixFormula = getOperationDefinition('formula.batch-fix');

        expect(checkDuplicates).toEqual(expect.objectContaining({
            id: 'duplicate.check-file',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'read-only',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'check-for-duplicates',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    duplicateCount: expect.any(Object),
                    duplicates: expect.any(Object)
                })
            })
        }));

        expect(dedupeConcepts).toEqual(expect.objectContaining({
            id: 'concept.dedupe',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'folder-selection',
            sideEffectClass: 'destructive',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'check-and-remove-duplicate-concept-notes',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(batchMermaidFix).toEqual(expect.objectContaining({
            id: 'mermaid.batch-fix',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'folder-selection',
            sideEffectClass: 'batch-write',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'batch-mermaid-fix',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(fixFormulaFile).toEqual(expect.objectContaining({
            id: 'formula.fix-file',
            version: 1,
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'fix-formula-formats',
                    mappingKind: 'exact'
                })
            ])
        }));

        expect(batchFixFormula).toEqual(expect.objectContaining({
            id: 'formula.batch-fix',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'folder-selection',
            sideEffectClass: 'batch-write',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'batch-fix-formula-formats',
                    mappingKind: 'exact'
                })
            ])
        }));
    });
});
