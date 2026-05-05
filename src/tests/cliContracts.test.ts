import { buildCliInvocationContract } from '../cliContracts';

describe('CLI invocation contract', () => {
    test('exports versioned typed contracts for registry-backed operations', () => {
        const contract = buildCliInvocationContract();
        const operationIds = contract.operations.map(operation => operation.operationId);
        const processCurrent = contract.operations.find(operation => operation.operationId === 'file.process-add-links');
        const processFolder = contract.operations.find(operation => operation.operationId === 'file.process-folder-add-links');
        const generateFromTitle = contract.operations.find(operation => operation.operationId === 'content.generate-from-title');
        const batchGenerate = contract.operations.find(operation => operation.operationId === 'content.batch-generate-from-titles');
        const researchSummarize = contract.operations.find(operation => operation.operationId === 'research.summarize-topic');
        const translateFile = contract.operations.find(operation => operation.operationId === 'translate.file');
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
                    outputPath: expect.any(Object)
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
                    sourcePath: expect.any(Object)
                })
            })
        }));

        expect(batchGenerate).toEqual(expect.objectContaining({
            operationId: 'content.batch-generate-from-titles',
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    sourceFolderPath: expect.any(Object),
                    completeFolderPath: expect.any(Object)
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
                    outputPath: expect.any(Object)
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
                    outputPath: expect.any(Object)
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
                    modified: expect.any(Object)
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
                    modifiedCount: expect.any(Object),
                    errors: expect.any(Object)
                })
            })
        }));
    });
});
