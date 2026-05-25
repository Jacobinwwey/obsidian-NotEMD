import { invokeMaintainerCliOperation } from '../maintainerCliBridge';

describe('maintainer CLI bridge', () => {
    test('dispatches bounded content operations with parsed input fields', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn().mockResolvedValue({ generatedCount: 3 }),
            splitNoteByChaptersForPathCommand: jest.fn().mockResolvedValue({ tocPath: 'Docs/Topic_toc.md' }),
            researchAndSummarizeForPathCommand: jest.fn().mockResolvedValue({ outputPath: 'Docs/Topic.md' }),
            generateDiagramForPathCommand: jest.fn().mockResolvedValue({ kind: 'success', outputPath: 'Docs/Topic_diagram.md' }),
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
            input: { sourcePath: 'docs/index.zh-CN.md' }
        });
        expect(host.splitNoteByChaptersForPathCommand).toHaveBeenCalledWith('docs/index.zh-CN.md', undefined);

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
                    compatibilityMode: 'legacy-mermaid',
                    targetLanguage: 'en'
                }
            }
        );
    });

    test('dispatches redacted provider profile export', async () => {
        const host = {
            batchGenerateContentForTitlesCommand: jest.fn(),
            splitNoteByChaptersForPathCommand: jest.fn(),
            researchAndSummarizeForPathCommand: jest.fn(),
            generateDiagramForPathCommand: jest.fn(),
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
});
