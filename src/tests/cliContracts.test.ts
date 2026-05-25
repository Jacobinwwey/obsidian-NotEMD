import { buildCliInvocationContract } from '../cliContracts';

describe('CLI invocation contract', () => {
    test('exports versioned typed contracts for registry-backed operations', () => {
        const contract = buildCliInvocationContract();
        const operationIds = contract.operations.map(operation => operation.operationId);
        const providerConnectionTest = contract.operations.find(operation => operation.operationId === 'provider.connection.test');
        const providerProfileExport = contract.operations.find(operation => operation.operationId === 'provider.profile.export');
        const providerProfileRedactedExport = contract.operations.find(operation => operation.operationId === 'provider.profile.export-redacted');
        const providerProfileImport = contract.operations.find(operation => operation.operationId === 'provider.profile.import');
        const cliCapabilityExport = contract.operations.find(operation => operation.operationId === 'cli.capability-manifest.export');
        const cliContractExport = contract.operations.find(operation => operation.operationId === 'cli.invocation-contract.export');
        const cliPublicSurfaceExport = contract.operations.find(operation => operation.operationId === 'cli.public-surface.export');
        const diagramGenerate = contract.operations.find(operation => operation.operationId === 'diagram.generate');
        const createWikiAndGenerate = contract.operations.find(operation => operation.operationId === 'editor.create-link-and-generate');
        const processCurrent = contract.operations.find(operation => operation.operationId === 'file.process-add-links');
        const processFolder = contract.operations.find(operation => operation.operationId === 'file.process-folder-add-links');
        const generateFromTitle = contract.operations.find(operation => operation.operationId === 'content.generate-from-title');
        const batchGenerate = contract.operations.find(operation => operation.operationId === 'content.batch-generate-from-titles');
        const chapterSplit = contract.operations.find(operation => operation.operationId === 'content.split-note-by-chapters');
        const researchSummarize = contract.operations.find(operation => operation.operationId === 'research.summarize-topic');
        const translateFile = contract.operations.find(operation => operation.operationId === 'translate.file');
        const translateFolder = contract.operations.find(operation => operation.operationId === 'translate.folder-batch');
        const extractOriginalText = contract.operations.find(operation => operation.operationId === 'content.extract-original-text');
        const extractAndGenerate = contract.operations.find(operation => operation.operationId === 'workflow.extract-and-generate');
        const checkDuplicates = contract.operations.find(operation => operation.operationId === 'duplicate.check-file');
        const dedupeConcepts = contract.operations.find(operation => operation.operationId === 'concept.dedupe');
        const batchMermaidFix = contract.operations.find(operation => operation.operationId === 'mermaid.batch-fix');
        const fixFormulaFile = contract.operations.find(operation => operation.operationId === 'formula.fix-file');
        const batchFixFormula = contract.operations.find(operation => operation.operationId === 'formula.batch-fix');
        const diagramPreview = contract.operations.find(operation => operation.operationId === 'diagram.preview');

        expect(contract.version).toBe(1);
        expect(operationIds).toEqual(expect.arrayContaining([
            'provider.connection.test',
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate',
            'diagram.preview',
            'provider.profile.export',
            'provider.profile.export-redacted',
            'provider.profile.import',
            'cli.capability-manifest.export',
            'cli.invocation-contract.export',
            'cli.public-surface.export',
            'editor.create-link-and-generate',
            'file.process-add-links',
            'file.process-folder-add-links',
            'content.generate-from-title',
            'content.batch-generate-from-titles',
            'content.split-note-by-chapters',
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
            'formula.batch-fix'
        ]));
        expect(contract.operations[0].inputSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['providerName', 'model', 'callMode', 'timeoutMs', 'stabilityRuns'])
        }));
        expect(contract.operations[0].resultSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['success', 'elapsedMs', 'callMode', 'requestedCallMode', 'logs', 'report'])
        }));
        expect(contract.operations[2].inputSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['sourceMarkdown', 'compatibilityMode', 'outputMode'])
        }));
        expect(contract.operations[2].resultSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['kind', 'executionMode', 'sourcePath', 'actionLabel'])
        }));

        expect(diagramGenerate).toEqual(expect.objectContaining({
            operationId: 'diagram.generate',
            resultSchema: expect.objectContaining({
                type: 'object',
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

        expect(providerConnectionTest).toEqual(expect.objectContaining({
            operationId: 'provider.connection.test',
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

        expect(diagramPreview).toEqual(expect.objectContaining({
            operationId: 'diagram.preview',
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

        expect(providerProfileExport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.export',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object)
                })
            })
        }));

        expect(providerProfileRedactedExport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.export-redacted',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    profile: expect.any(Object)
                })
            })
        }));

        expect(translateFolder).toEqual(expect.objectContaining({
            operationId: 'translate.folder-batch',
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

        expect(providerProfileImport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.import',
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
            operationId: 'cli.capability-manifest.export',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    manifest: expect.any(Object)
                })
            })
        }));

        expect(cliContractExport).toEqual(expect.objectContaining({
            operationId: 'cli.invocation-contract.export',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    contract: expect.any(Object)
                })
            })
        }));

        expect(cliPublicSurfaceExport).toEqual(expect.objectContaining({
            operationId: 'cli.public-surface.export',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    surface: expect.any(Object)
                })
            })
        }));

        expect(createWikiAndGenerate).toEqual(expect.objectContaining({
            operationId: 'editor.create-link-and-generate',
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
            operationId: 'file.process-add-links',
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

        expect(processFolder).toEqual(expect.objectContaining({
            operationId: 'file.process-folder-add-links',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    folderPath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    processedFileCount: expect.any(Object),
                    savedCount: expect.any(Object),
                    cancelled: expect.any(Object),
                    fileResults: expect.any(Object),
                    errors: expect.any(Object)
                })
            })
        }));

        expect(generateFromTitle).toEqual(expect.objectContaining({
            operationId: 'content.generate-from-title',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    title: expect.any(Object),
                    researchEnabled: expect.any(Object),
                    researchContextUsed: expect.any(Object),
                    localKnowledgeContextUsed: expect.any(Object),
                    localKnowledgeRetrieval: expect.any(Object),
                    modified: expect.any(Object)
                })
            })
        }));

        expect(batchGenerate).toEqual(expect.objectContaining({
            operationId: 'content.batch-generate-from-titles',
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
        expect(batchGenerate?.resultSchema).toEqual(expect.objectContaining({
            properties: expect.objectContaining({
                fileResults: expect.objectContaining({
                    items: expect.objectContaining({
                        properties: expect.objectContaining({
                            localKnowledgeContextUsed: expect.any(Object),
                            localKnowledgeRetrieval: expect.any(Object)
                        })
                    })
                })
            })
        }));

        expect(chapterSplit).toEqual(expect.objectContaining({
            operationId: 'content.split-note-by-chapters',
            inputSchema: expect.objectContaining({
                type: 'object',
                required: expect.arrayContaining(['sourcePath']),
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    splitHeadingLevel: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                required: expect.arrayContaining([
                    'sourcePath',
                    'requestedSplitHeadingLevel',
                    'chapterNotePaths',
                    'managedArtifactPaths',
                    'outputFolderPath',
                    'tocPath',
                    'manifestPath',
                    'splitLevel',
                    'chapters',
                    'tocMarkdown',
                    'chapterCount',
                    'removedStaleFileCount',
                    'removedStalePaths'
                ]),
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    requestedSplitHeadingLevel: expect.any(Object),
                    chapterNotePaths: expect.any(Object),
                    managedArtifactPaths: expect.any(Object),
                    outputFolderPath: expect.any(Object),
                    tocPath: expect.any(Object),
                    manifestPath: expect.any(Object),
                    splitLevel: expect.any(Object),
                    chapters: expect.any(Object),
                    tocMarkdown: expect.any(Object),
                    chapterCount: expect.any(Object),
                    removedStaleFileCount: expect.any(Object),
                    removedStalePaths: expect.any(Object)
                })
            })
        }));

        expect(researchSummarize).toEqual(expect.objectContaining({
            operationId: 'research.summarize-topic',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    topic: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object),
                    topic: expect.any(Object),
                    localKnowledgeContextUsed: expect.any(Object),
                    localKnowledgeRetrieval: expect.any(Object)
                })
            })
        }));

        expect(translateFile).toEqual(expect.objectContaining({
            operationId: 'translate.file',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
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
            operationId: 'content.extract-original-text',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputDirectory: expect.any(Object)
                })
            }),
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
            operationId: 'workflow.extract-and-generate',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    conceptFolderPath: expect.any(Object),
                    completeFolderPath: expect.any(Object)
                })
            })
        }));

        expect(checkDuplicates).toEqual(expect.objectContaining({
            operationId: 'duplicate.check-file',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    duplicateCount: expect.any(Object),
                    duplicates: expect.any(Object)
                })
            })
        }));

        expect(dedupeConcepts).toEqual(expect.objectContaining({
            operationId: 'concept.dedupe',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    conceptFolderPath: expect.any(Object)
                })
            }),
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
            operationId: 'mermaid.batch-fix',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    folderPath: expect.any(Object)
                })
            }),
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
            operationId: 'formula.fix-file',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourcePath: expect.any(Object)
                })
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    modified: expect.any(Object),
                    replacementCount: expect.any(Object)
                })
            })
        }));

        expect(batchFixFormula).toEqual(expect.objectContaining({
            operationId: 'formula.batch-fix',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    folderPath: expect.any(Object)
                })
            }),
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
});
