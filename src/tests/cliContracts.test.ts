import { buildCliInvocationContract } from '../cliContracts';

describe('CLI invocation contract', () => {
    test('exports versioned typed contracts for registry-backed operations', () => {
        const contract = buildCliInvocationContract();
        const operationIds = contract.operations.map(operation => operation.operationId);
        const providerProfileExport = contract.operations.find(operation => operation.operationId === 'provider.profile.export');
        const providerProfileImport = contract.operations.find(operation => operation.operationId === 'provider.profile.import');
        const cliCapabilityExport = contract.operations.find(operation => operation.operationId === 'cli.capability-manifest.export');
        const cliContractExport = contract.operations.find(operation => operation.operationId === 'cli.invocation-contract.export');
        const createWikiAndGenerate = contract.operations.find(operation => operation.operationId === 'editor.create-link-and-generate');
        const processCurrent = contract.operations.find(operation => operation.operationId === 'file.process-add-links');
        const processFolder = contract.operations.find(operation => operation.operationId === 'file.process-folder-add-links');
        const generateFromTitle = contract.operations.find(operation => operation.operationId === 'content.generate-from-title');
        const batchGenerate = contract.operations.find(operation => operation.operationId === 'content.batch-generate-from-titles');
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

        expect(contract.version).toBe(1);
        expect(operationIds).toEqual(expect.arrayContaining([
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate',
            'provider.profile.export',
            'provider.profile.import',
            'cli.capability-manifest.export',
            'cli.invocation-contract.export',
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
            required: expect.arrayContaining(['plan', 'spec', 'artifact'])
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
                    topic: expect.any(Object)
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
                    removedCount: expect.any(Object)
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
                    modifiedCount: expect.any(Object),
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
