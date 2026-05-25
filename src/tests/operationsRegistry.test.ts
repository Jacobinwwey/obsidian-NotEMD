import { getOperationDefinition, listOperationDefinitions } from '../operations/registry';

describe('operations registry', () => {
    test('lists first-class operation definitions for current CLI-grade seams', () => {
        const definitions = listOperationDefinitions();
        const ids = definitions.map(definition => definition.id);

        expect(ids).toEqual(expect.arrayContaining([
            'provider.connection.test',
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate',
            'diagram.preview',
            'editor.create-link-and-generate',
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
            'cli.capability-manifest.export',
            'cli.invocation-contract.export',
            'cli.public-surface.export',
            'provider.profile.export',
            'provider.profile.export-redacted',
            'provider.profile.import'
        ]));
    });

    test('returns structured metadata for provider connection test', () => {
        const definition = getOperationDefinition('provider.connection.test');

        expect(definition).toEqual(expect.objectContaining({
            id: 'provider.connection.test',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'read-only',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({ commandId: 'test-llm-connection', mappingKind: 'exact' })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    providerName: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    kind: expect.any(Object),
                    statusMessage: expect.any(Object),
                    providerName: expect.any(Object),
                    success: expect.any(Object)
                })
            })
        }));
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
                required: expect.arrayContaining(['kind', 'executionMode', 'sourcePath', 'actionLabel']),
                properties: expect.objectContaining({
                    kind: expect.any(Object),
                    executionMode: expect.any(Object),
                    sourcePath: expect.any(Object),
                    actionLabel: expect.any(Object),
                    operationInput: expect.any(Object),
                    generation: expect.any(Object),
                    followThrough: expect.any(Object),
                    outputPath: expect.any(Object),
                    previewOpened: expect.any(Object),
                    errorMessage: expect.any(Object)
                })
            })
        }));
    });

    test('returns typed metadata for diagram preview', () => {
        const definition = getOperationDefinition('diagram.preview');

        expect(definition).toEqual(expect.objectContaining({
            id: 'diagram.preview',
            version: 1,
            automationLevel: 'interactive-ui',
            requiredContext: 'preview-ui',
            sideEffectClass: 'preview-ui',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'notemd-preview-diagram',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    sourceMarkdown: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                required: expect.arrayContaining(['kind', 'sourcePath', 'actionLabel']),
                properties: expect.objectContaining({
                    kind: expect.any(Object),
                    sourcePath: expect.any(Object),
                    actionLabel: expect.any(Object),
                    previewOpened: expect.any(Object),
                    artifact: expect.any(Object),
                    errorMessage: expect.any(Object)
                })
            })
        }));
    });

    test('returns structured metadata for note-processing operations', () => {
        const createWikiAndGenerate = getOperationDefinition('editor.create-link-and-generate');
        const processCurrent = getOperationDefinition('file.process-add-links');
        const processFolder = getOperationDefinition('file.process-folder-add-links');
        const generateFromTitle = getOperationDefinition('content.generate-from-title');
        const batchGenerate = getOperationDefinition('content.batch-generate-from-titles');
        const researchSummarize = getOperationDefinition('research.summarize-topic');
        const translateFile = getOperationDefinition('translate.file');
        const translateFolder = getOperationDefinition('translate.folder-batch');
        const extractOriginalText = getOperationDefinition('content.extract-original-text');
        const extractAndGenerate = getOperationDefinition('workflow.extract-and-generate');

        expect(createWikiAndGenerate).toEqual(expect.objectContaining({
            id: 'editor.create-link-and-generate',
            version: 1,
            automationLevel: 'requires-selection',
            requiredContext: 'editor-selection',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'create-wiki-link-and-generate-from-selection',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    selectionText: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    notePath: expect.any(Object),
                    word: expect.any(Object),
                    created: expect.any(Object)
                })
            })
        }));

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
                    requestedOutputFolderPath: expect.any(Object),
                    outputFolderPath: expect.any(Object),
                    outputFolderCreated: expect.any(Object),
                    usedCustomOutputFolder: expect.any(Object),
                    outputPath: expect.any(Object),
                    created: expect.any(Object),
                    overwritten: expect.any(Object),
                    movedOriginalFile: expect.any(Object),
                    moveOriginalFile: expect.any(Object),
                    chunkCount: expect.any(Object),
                    conceptCount: expect.any(Object),
                    conceptNoteFolderPath: expect.any(Object),
                    removedCodeFences: expect.any(Object)
                })
            })
        }));

        expect(translateFolder).toEqual(expect.objectContaining({
            id: 'translate.folder-batch',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    processedFileCount: expect.any(Object),
                    translatedCount: expect.any(Object),
                    cancelled: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
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
                    completeFolderPath: expect.any(Object),
                    completeFolderCreated: expect.any(Object),
                    processedFileCount: expect.any(Object),
                    generatedCount: expect.any(Object),
                    movedCount: expect.any(Object),
                    cancelled: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
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
                    outputPath: expect.any(Object),
                    created: expect.any(Object),
                    overwritten: expect.any(Object),
                    openedInWorkspace: expect.any(Object),
                    chunkCount: expect.any(Object)
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
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    outputPath: expect.any(Object),
                    outputDirectory: expect.any(Object),
                    outputSuffix: expect.any(Object),
                    questionCount: expect.any(Object),
                    mergedMode: expect.any(Object)
                })
            })
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
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    candidateCount: expect.any(Object),
                    deletionRequested: expect.any(Object),
                    deletionConfirmed: expect.any(Object),
                    removedCount: expect.any(Object),
                    cancelled: expect.any(Object),
                    candidates: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
                })
            })
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
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    processedFileCount: expect.any(Object),
                    modifiedCount: expect.any(Object),
                    movedErrorFileCount: expect.any(Object),
                    remainingErrorFileCount: expect.any(Object),
                    reportPath: expect.any(Object),
                    reportCreated: expect.any(Object),
                    cancelled: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
                })
            })
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
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    outputPath: expect.any(Object),
                    modified: expect.any(Object),
                    replacementCount: expect.any(Object)
                })
            })
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
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    folderPath: expect.any(Object),
                    processedFileCount: expect.any(Object),
                    modifiedCount: expect.any(Object),
                    cancelled: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
                })
            })
        }));
    });

    test('returns structured metadata for config export operations', () => {
        const providerProfileExport = getOperationDefinition('provider.profile.export');
        const providerProfileRedactedExport = getOperationDefinition('provider.profile.export-redacted');
        const providerProfileImport = getOperationDefinition('provider.profile.import');
        const cliCapabilityExport = getOperationDefinition('cli.capability-manifest.export');
        const cliContractExport = getOperationDefinition('cli.invocation-contract.export');
        const cliPublicSurfaceExport = getOperationDefinition('cli.public-surface.export');

        expect(providerProfileExport).toEqual(expect.objectContaining({
            id: 'provider.profile.export',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            outputHandlingTags: ['contains-provider-credentials'],
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'export-provider-profiles',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object)
                })
            })
        }));

        expect(providerProfileRedactedExport).toEqual(expect.objectContaining({
            id: 'provider.profile.export-redacted',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'export-provider-profiles-redacted',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object)
                })
            })
        }));
        expect(providerProfileRedactedExport?.outputHandlingTags).toBeUndefined();

        expect(providerProfileImport).toEqual(expect.objectContaining({
            id: 'provider.profile.import',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            inputHandlingTags: ['contains-provider-credentials'],
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'import-provider-profiles',
                    mappingKind: 'exact'
                })
            ]),
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    inputPath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    inputPath: expect.any(Object),
                    activeProvider: expect.any(Object)
                })
            })
        }));

        expect(cliCapabilityExport).toEqual(expect.objectContaining({
            id: 'cli.capability-manifest.export',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'export-cli-capability-manifest',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    manifest: expect.any(Object)
                })
            })
        }));

        expect(cliContractExport).toEqual(expect.objectContaining({
            id: 'cli.invocation-contract.export',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'export-cli-invocation-contract',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    contract: expect.any(Object)
                })
            })
        }));

        expect(cliPublicSurfaceExport).toEqual(expect.objectContaining({
            id: 'cli.public-surface.export',
            version: 1,
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            commandBindings: expect.arrayContaining([
                expect.objectContaining({
                    commandId: 'export-cli-public-surface',
                    mappingKind: 'exact'
                })
            ]),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    surface: expect.any(Object)
                })
            })
        }));
    });
});
