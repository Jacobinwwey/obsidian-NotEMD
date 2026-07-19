import { invokeMaintainerCliOperation } from '../maintainerCliBridge';

const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');
type MaintainerOperationHelp = Record<string, {
    summary: string;
    required: string[];
    optional: string[];
    exampleInput?: string;
    additionalExamples?: string[];
}>;

function createMaintainerCliHost() {
    return {
        batchGenerateContentForTitlesCommand: jest.fn().mockResolvedValue({ generatedCount: 3 }),
        splitNoteByChaptersForPathCommand: jest.fn().mockResolvedValue({
            tocPath: 'Docs/Topic_toc.md',
            managedArtifactPaths: ['Docs/Topic_toc.md']
        }),
        researchAndSummarizeForPathCommand: jest.fn().mockResolvedValue({
            sourcePath: 'Docs/Topic.md',
            outputPath: 'Docs/Topic.md',
            topic: 'RAG',
            sourceLabel: 'Local KB',
            researchContextUsed: false,
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval: {
                indexedFileCount: 1,
                indexedSectionCount: 1,
                matchedSectionCount: 1,
                returnedHitCount: 1,
                expandedSectionCount: 1,
                sourcePaths: ['Knowledge/RAG.md'],
                usedSlidingWindowSize: 0,
                requestedTopK: 1,
                indexBuildMs: 10,
                queryMs: 3,
                contextCharCount: 48,
                excludeCurrentFileApplied: true,
                excludedCurrentFileHitCount: 0
            },
            appended: true
        }),
        generateDiagramForPathCommand: jest.fn().mockResolvedValue({ kind: 'success', outputPath: 'Docs/Topic_diagram.md' }),
        inspectLocalKnowledgeCommand: jest.fn().mockResolvedValue({
            taskScope: 'diagramGeneration',
            query: 'Architecture'
        }),
        exportRedactedProviderProfilesCommand: jest.fn().mockResolvedValue({ outputPath: 'redacted.json' }),
        exportCliCapabilityManifestCommand: jest.fn().mockResolvedValue({ outputPath: 'capability.json' }),
        exportCliInvocationContractCommand: jest.fn().mockResolvedValue({ outputPath: 'contract.json' }),
        exportCliPublicSurfaceCommand: jest.fn().mockResolvedValue({ outputPath: 'surface.json' })
    };
}

describe('maintainer CLI bridge', () => {
    test('dispatches bounded content operations with parsed input fields', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn().mockResolvedValue({ generatedCount: 3 }),
            splitNoteByChaptersForPathCommand: jest.fn().mockResolvedValue({
                tocPath: 'Docs/Topic_toc.md',
                managedArtifactPaths: ['Docs/Topic_toc.md']
            }),
            researchAndSummarizeForPathCommand: jest.fn().mockResolvedValue({
                sourcePath: 'Docs/Topic.md',
                outputPath: 'Docs/Topic.md',
                topic: 'RAG',
                sourceLabel: 'Local KB',
                researchContextUsed: false,
                localKnowledgeContextUsed: true,
                localKnowledgeRetrieval: {
                    indexedFileCount: 1,
                    indexedSectionCount: 1,
                    matchedSectionCount: 1,
                    returnedHitCount: 1,
                    expandedSectionCount: 1,
                    sourcePaths: ['Knowledge/RAG.md'],
                    usedSlidingWindowSize: 0,
                    requestedTopK: 1,
                    indexBuildMs: 10,
                    queryMs: 3,
                    contextCharCount: 48,
                    excludeCurrentFileApplied: true,
                    excludedCurrentFileHitCount: 0
                },
                appended: true
            }),
            generateDiagramForPathCommand: jest.fn().mockResolvedValue({ kind: 'success', outputPath: 'Docs/Topic_diagram.md' }),
            inspectLocalKnowledgeCommand: jest.fn().mockResolvedValue({
                taskScope: 'diagramGeneration',
                query: 'Architecture'
            }),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await invokeMaintainerCliOperation(host as any, {
            operationId: 'content.batch-generate-from-titles',
            input: {
                folderPath: 'docs',
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'regex',
                fileFilterPattern: 'index',
                fileFilterTarget: 'basename'
            }
        });
        expect(host.batchGenerateContentForTitlesCommand).toHaveBeenCalledWith(
            undefined,
            'docs',
            expect.objectContaining({
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'regex',
                fileFilterPattern: 'index',
                fileFilterTarget: 'basename'
            })
        );

        await invokeMaintainerCliOperation(host as any, {
            operationId: 'content.split-note-by-chapters',
            input: {
                sourcePath: 'docs/index.zh-CN.md',
                splitHeadingLevel: 'h3'
            }
        });
        expect(host.splitNoteByChaptersForPathCommand).toHaveBeenCalledWith(
            'docs/index.zh-CN.md',
            undefined,
            { splitHeadingLevel: 'h3' }
        );

        await invokeMaintainerCliOperation(host as any, {
            operationId: 'research.summarize-topic',
            input: { sourcePath: 'docs/index.zh-CN.md', topic: 'RAG' }
        });
        expect(host.researchAndSummarizeForPathCommand).toHaveBeenCalledWith('docs/index.zh-CN.md', 'RAG', undefined);

        await invokeMaintainerCliOperation(host as any, {
            operationId: 'diagram.generate',
            input: {
                sourcePath: 'docs/index.zh-CN.md',
                executionMode: 'save-mermaid',
                requestedIntent: 'erDiagram',
                requestedRenderTarget: 'circuitikz',
                compatibilityMode: 'legacy-mermaid',
                targetLanguage: 'en'
            }
        });
        expect(host.generateDiagramForPathCommand).toHaveBeenCalledWith(
            'docs/index.zh-CN.md',
            undefined,
            {
                executionMode: 'save-mermaid',
                inputOverrides: {
                    requestedIntent: 'erDiagram',
                    requestedRenderTarget: 'circuitikz',
                    compatibilityMode: 'legacy-mermaid',
                    targetLanguage: 'en'
                }
            }
        );

        await invokeMaintainerCliOperation(host as any, {
            operationId: 'local-knowledge.inspect',
            input: {
                taskScope: 'diagramGeneration',
                sourcePath: 'docs/index.zh-CN.md',
                query: 'Architecture',
                knowledgePaths: ['Knowledge/Scoped', 'Knowledge/Exact.md'],
                topK: 4,
                slidingWindowSize: 2,
                maxSnippetChars: 640
            }
        });
        expect(host.inspectLocalKnowledgeCommand).toHaveBeenCalledWith(
            {
                taskScope: 'diagramGeneration',
                sourcePath: 'docs/index.zh-CN.md',
                query: 'Architecture',
                knowledgePaths: ['Knowledge/Scoped', 'Knowledge/Exact.md'],
                topK: 4,
                slidingWindowSize: 2,
                maxSnippetChars: 640
            },
            undefined
        );
    });

    test('shared maintainer example inputs stay executable against bridge validation', async () => {
        const host = createMaintainerCliHost();
        const help = OPERATION_HELP as MaintainerOperationHelp;
        const operationBindings: Record<string, keyof ReturnType<typeof createMaintainerCliHost>> = {
            'content.batch-generate-from-titles': 'batchGenerateContentForTitlesCommand',
            'content.split-note-by-chapters': 'splitNoteByChaptersForPathCommand',
            'research.summarize-topic': 'researchAndSummarizeForPathCommand',
            'diagram.generate': 'generateDiagramForPathCommand',
            'local-knowledge.inspect': 'inspectLocalKnowledgeCommand'
        };

        for (const [operationId, methodName] of Object.entries(operationBindings)) {
            const exampleInput = help[operationId]?.exampleInput;
            expect(exampleInput).toBeDefined();

            await invokeMaintainerCliOperation(host as any, {
                operationId: operationId as any,
                input: JSON.parse(exampleInput as string)
            });

            expect(host[methodName]).toHaveBeenCalledTimes(1);
        }
    });

    test('local knowledge inspect additional examples stay executable and preserve task-scoped payloads', async () => {
        const host = createMaintainerCliHost();
        const help = OPERATION_HELP as MaintainerOperationHelp;
        const additionalExamples = help['local-knowledge.inspect']?.additionalExamples || [];

        expect(additionalExamples.length).toBeGreaterThan(0);

        for (const exampleInput of additionalExamples) {
            await invokeMaintainerCliOperation(host as any, {
                operationId: 'local-knowledge.inspect',
                input: JSON.parse(exampleInput)
            });
        }

        expect(host.inspectLocalKnowledgeCommand).toHaveBeenCalledTimes(additionalExamples.length);
        expect(host.inspectLocalKnowledgeCommand.mock.calls.map(([request]) => request)).toEqual(
            additionalExamples.map((exampleInput) => JSON.parse(exampleInput))
        );
    });

    test('dispatches redacted provider profile export', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn().mockResolvedValue({ outputPath: 'redacted.json' }),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        const result = await invokeMaintainerCliOperation(host as any, {
            operationId: 'provider.profile.export-redacted'
        });

        expect(host.exportRedactedProviderProfilesCommand).toHaveBeenCalled();
        expect(result).toEqual({ outputPath: 'redacted.json' });
    });

    test('dispatches CLI public surface export', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn().mockResolvedValue({ outputPath: 'surface.json' })
        };

        const result = await invokeMaintainerCliOperation(host as any, {
            operationId: 'cli.public-surface.export',
            input: {}
        });

        expect(host.exportCliPublicSurfaceCommand).toHaveBeenCalled();
        expect(result).toEqual({ outputPath: 'surface.json' });
    });

    test('rejects unexpected export input payloads', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'cli.capability-manifest.export',
            input: { extra: true }
        })).rejects.toThrow('do not accept input fields');
    });

    test('rejects missing bounded-operation path fields', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'diagram.generate',
            input: {}
        })).rejects.toThrow('requires a non-empty "sourcePath" string');
    });

    test('rejects invalid chapter split heading overrides', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'content.split-note-by-chapters',
            input: {
                sourcePath: 'docs/index.zh-CN.md',
                splitHeadingLevel: 'h9'
            }
        })).rejects.toThrow('expects "splitHeadingLevel" to be one of');
    });

    test('rejects invalid local knowledge inspect task scope', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'local-knowledge.inspect',
            input: {
                taskScope: 'bad-scope'
            }
        })).rejects.toThrow('expects "taskScope" to be one of');
    });

    test('rejects non-array local knowledge inspect knowledgePaths payloads', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
            inspectLocalKnowledgeCommand: jest.fn(),
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'local-knowledge.inspect',
            input: {
                taskScope: 'generateTitle',
                knowledgePaths: 'Knowledge/Scoped'
            }
        })).rejects.toThrow('expects "knowledgePaths" to be an array');
    });
});
