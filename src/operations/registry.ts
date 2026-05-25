import {
    getSidebarActionAutomationLevel,
    getSidebarActionRequiredContext,
    getSidebarActionSideEffectClass,
    SidebarActionId
} from '../workflowButtons';
import { CHAPTER_SPLIT_HEADING_LEVEL_VALUES } from '../types';
import { OperationCommandBinding, OperationDefinition, OperationSchema } from './types';

const COMMAND_TRIGGER_SURFACES = ['command-palette', 'hotkey', 'official-cli-command'] as const;

function createStaticCommandBinding(
    commandId: string,
    metadata: Pick<OperationCommandBinding, 'automationLevel' | 'requiredContext' | 'sideEffectClass'>,
    overrides: Partial<Omit<OperationCommandBinding, 'commandId' | 'automationLevel' | 'requiredContext' | 'sideEffectClass'>> = {}
): OperationCommandBinding {
    return {
        commandId,
        automationLevel: metadata.automationLevel,
        requiredContext: metadata.requiredContext,
        sideEffectClass: metadata.sideEffectClass,
        surfaces: [...COMMAND_TRIGGER_SURFACES],
        mappingKind: 'exact',
        ...overrides
    };
}

function createWorkflowCommandBinding(
    commandId: string,
    actionId: SidebarActionId,
    overrides: Partial<Omit<OperationCommandBinding, 'commandId' | 'automationLevel' | 'requiredContext' | 'sideEffectClass'>> = {}
): OperationCommandBinding {
    return createStaticCommandBinding(commandId, {
        automationLevel: getSidebarActionAutomationLevel(actionId)!,
        requiredContext: getSidebarActionRequiredContext(actionId)!,
        sideEffectClass: getSidebarActionSideEffectClass(actionId)!
    }, overrides);
}

const PROVIDER_DIAGNOSTIC_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['providerName', 'model', 'callMode', 'timeoutMs', 'stabilityRuns'],
    properties: {
        providerName: { type: 'string' },
        model: { type: 'string' },
        callMode: { type: 'string' },
        timeoutMs: { type: 'number' },
        stabilityRuns: { type: 'number' }
    }
};

const PROVIDER_DIAGNOSTIC_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['success', 'elapsedMs', 'callMode', 'requestedCallMode', 'logs', 'report'],
    properties: {
        success: { type: 'boolean' },
        elapsedMs: { type: 'number' },
        callMode: { type: 'string' },
        requestedCallMode: { type: 'string' },
        responseText: { type: 'string' },
        errorMessage: { type: 'string' },
        debugInfo: { type: 'string' },
        logs: { type: 'array' },
        report: { type: 'string' }
    }
};

const PROVIDER_DIAGNOSTIC_STABILITY_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['runs', 'callMode', 'requestedCallMode', 'successCount', 'failureCount', 'totalElapsedMs', 'runResults', 'report'],
    properties: {
        runs: { type: 'number' },
        callMode: { type: 'string' },
        requestedCallMode: { type: 'string' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
        totalElapsedMs: { type: 'number' },
        runResults: { type: 'array' },
        report: { type: 'string' }
    }
};

const PROVIDER_CONNECTION_TEST_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        providerName: { type: 'string' },
        enableApiErrorDebugMode: { type: 'boolean' }
    }
};

const PROVIDER_CONNECTION_TEST_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        kind: {
            type: 'string',
            enum: ['success', 'failure', 'error']
        },
        statusMessage: { type: 'string' },
        providerName: { type: 'string' },
        success: { type: 'boolean' },
        message: { type: 'string' },
        errorMessage: { type: 'string' },
        errorDetails: { type: 'string' }
    }
};

const DIAGRAM_GENERATE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['sourceMarkdown', 'compatibilityMode', 'outputMode'],
    properties: {
        sourcePath: { type: 'string' },
        sourceMarkdown: { type: 'string' },
        requestedIntent: { type: 'string' },
        compatibilityMode: {
            type: 'string',
            enum: ['best-fit', 'legacy-mermaid']
        },
        outputMode: {
            type: 'string',
            enum: ['artifact', 'mermaid']
        },
        targetLanguage: { type: 'string' }
    }
};

const DIAGRAM_GENERATE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['kind', 'executionMode', 'sourcePath', 'actionLabel'],
    properties: {
        kind: {
            type: 'string',
            enum: ['success', 'error']
        },
        executionMode: {
            type: 'string',
            enum: ['save-mermaid', 'save-artifact', 'preview-artifact']
        },
        sourcePath: { type: 'string' },
        actionLabel: { type: 'string' },
        operationInput: { type: 'object' },
        generation: { type: 'object' },
        followThrough: {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    enum: ['save-mermaid', 'save-artifact', 'preview-artifact']
                },
                outputPath: { type: 'string' },
                previewOpened: { type: 'boolean' },
                autoFixAttempted: { type: 'boolean' },
                artifactTarget: { type: 'string' }
            }
        },
        outputPath: { type: 'string' },
        previewOpened: { type: 'boolean' },
        errorMessage: { type: 'string' }
    }
};

const DIAGRAM_PREVIEW_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['sourceMarkdown'],
    properties: {
        sourcePath: { type: 'string' },
        sourceMarkdown: { type: 'string' }
    }
};

const DIAGRAM_PREVIEW_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['kind', 'sourcePath', 'actionLabel'],
    properties: {
        kind: {
            type: 'string',
            enum: ['success', 'error']
        },
        sourcePath: { type: 'string' },
        actionLabel: { type: 'string' },
        artifact: { type: 'object' },
        previewOpened: { type: 'boolean' },
        errorMessage: { type: 'string' }
    }
};

const STRING_ARRAY_SCHEMA: OperationSchema = {
    type: 'array',
    items: { type: 'string' }
};

const ERROR_ARRAY_SCHEMA: OperationSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            file: { type: 'string' },
            message: { type: 'string' }
        }
    }
};

const PROCESS_FILE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' }
    }
};

const PROCESS_FILE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        requestedOutputFolderPath: { type: 'string' },
        outputFolderPath: { type: 'string' },
        outputFolderCreated: { type: 'boolean' },
        usedCustomOutputFolder: { type: 'boolean' },
        outputPath: { type: 'string' },
        created: { type: 'boolean' },
        overwritten: { type: 'boolean' },
        movedOriginalFile: { type: 'boolean' },
        moveOriginalFile: { type: 'boolean' },
        chunkCount: { type: 'number' },
        conceptCount: { type: 'number' },
        conceptNoteFolderPath: { type: 'string' },
        removedCodeFences: { type: 'boolean' }
    }
};

const PROCESS_FOLDER_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' }
    }
};

const PROCESS_FOLDER_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        processedFileCount: { type: 'number' },
        savedCount: { type: 'number' },
        cancelled: { type: 'boolean' },
        fileResults: {
            type: 'array',
            items: PROCESS_FILE_RESULT_SCHEMA
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const GENERATE_FROM_TITLE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' }
    }
};

const GENERATE_FROM_TITLE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        outputPath: { type: 'string' },
        title: { type: 'string' },
        researchEnabled: { type: 'boolean' },
        researchContextUsed: { type: 'boolean' },
        modified: { type: 'boolean' }
    }
};

const BATCH_GENERATE_FROM_TITLES_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' }
    }
};

const BATCH_GENERATE_FROM_TITLES_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourceFolderPath: { type: 'string' },
        completeFolderPath: { type: 'string' },
        completeFolderCreated: { type: 'boolean' },
        processedFileCount: { type: 'number' },
        generatedCount: { type: 'number' },
        movedCount: { type: 'number' },
        cancelled: { type: 'boolean' },
        fileResults: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    sourcePath: { type: 'string' },
                    outputPath: { type: 'string' },
                    title: { type: 'string' },
                    researchEnabled: { type: 'boolean' },
                    researchContextUsed: { type: 'boolean' },
                    modified: { type: 'boolean' },
                    completeDestinationPath: { type: 'string' },
                    movedToCompleteFolder: { type: 'boolean' },
                    skippedMoveBecauseDestinationExists: { type: 'boolean' },
                    skippedMoveBecauseSourceMissing: { type: 'boolean' }
                }
            }
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const CHAPTER_SPLIT_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    required: ['sourcePath'],
    properties: {
        sourcePath: { type: 'string' },
        splitHeadingLevel: {
            type: 'string',
            enum: [...CHAPTER_SPLIT_HEADING_LEVEL_VALUES]
        }
    }
};

const CHAPTER_SPLIT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    required: [
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
    ],
    properties: {
        sourcePath: { type: 'string' },
        requestedSplitHeadingLevel: {
            type: 'string',
            enum: [...CHAPTER_SPLIT_HEADING_LEVEL_VALUES]
        },
        chapterNotePaths: STRING_ARRAY_SCHEMA,
        managedArtifactPaths: STRING_ARRAY_SCHEMA,
        outputFolderPath: { type: 'string' },
        tocPath: { type: 'string' },
        manifestPath: { type: 'string' },
        splitLevel: {
            anyOf: [
                { type: 'number' },
                { type: 'null' }
            ]
        },
        chapters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['title', 'outputPath', 'markdown', 'breadcrumb', 'nestedHeadings'],
                properties: {
                    title: { type: 'string' },
                    outputPath: { type: 'string' },
                    markdown: { type: 'string' },
                    breadcrumb: STRING_ARRAY_SCHEMA,
                    nestedHeadings: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['level', 'text'],
                            properties: {
                                level: { type: 'number' },
                                text: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        tocMarkdown: { type: 'string' },
        chapterCount: { type: 'number' },
        removedStaleFileCount: { type: 'number' },
        removedStalePaths: STRING_ARRAY_SCHEMA
    }
};

const RESEARCH_SUMMARIZE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        topic: { type: 'string' }
    }
};

const RESEARCH_SUMMARIZE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        topic: { type: 'string' }
    }
};

const TRANSLATE_FILE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        targetLanguage: { type: 'string' },
        openOutputFile: { type: 'boolean' }
    }
};

const TRANSLATE_FILE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        targetLanguage: { type: 'string' },
        requestedOutputFolderPath: { type: 'string' },
        outputFolderPath: { type: 'string' },
        outputFolderCreated: { type: 'boolean' },
        usedFallbackOutputFolder: { type: 'boolean' },
        outputPath: { type: 'string' },
        created: { type: 'boolean' },
        overwritten: { type: 'boolean' },
        openedInWorkspace: { type: 'boolean' },
        chunkCount: { type: 'number' }
    }
};

const TRANSLATE_FOLDER_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        targetLanguage: { type: 'string' }
    }
};

const TRANSLATE_FOLDER_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        requestedOutputFolderPath: { type: 'string' },
        outputFolderPath: { type: 'string' },
        outputFolderCreated: { type: 'boolean' },
        targetLanguage: { type: 'string' },
        processedFileCount: { type: 'number' },
        translatedCount: { type: 'number' },
        cancelled: { type: 'boolean' },
        fileResults: {
            type: 'array',
            items: TRANSLATE_FILE_RESULT_SCHEMA
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const EXTRACT_CONCEPTS_FILE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        conceptFolderPath: { type: 'string' }
    }
};

const EXTRACT_CONCEPTS_FILE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        conceptCount: { type: 'number' },
        createdNotePaths: STRING_ARRAY_SCHEMA
    }
};

const EXTRACT_CONCEPTS_FOLDER_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        conceptFolderPath: { type: 'string' }
    }
};

const EXTRACT_CONCEPTS_FOLDER_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        processedFileCount: { type: 'number' },
        conceptCount: { type: 'number' },
        createdNotePaths: STRING_ARRAY_SCHEMA,
        errors: ERROR_ARRAY_SCHEMA
    }
};

const EXTRACT_ORIGINAL_TEXT_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        outputDirectory: { type: 'string' },
        outputSuffix: { type: 'string' },
        questions: STRING_ARRAY_SCHEMA
    }
};

const EXTRACT_ORIGINAL_TEXT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        outputPath: { type: 'string' },
        outputDirectory: { type: 'string' },
        outputSuffix: { type: 'string' },
        questionCount: { type: 'number' },
        mergedMode: { type: 'boolean' }
    }
};

const EXTRACT_AND_GENERATE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        conceptFolderPath: { type: 'string' }
    }
};

const EXTRACT_AND_GENERATE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        conceptFolderPath: { type: 'string' },
        completeFolderPath: { type: 'string' }
    }
};

const DUPLICATE_CHECK_FILE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' }
    }
};

const DUPLICATE_CHECK_FILE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        duplicateCount: { type: 'number' },
        duplicates: STRING_ARRAY_SCHEMA
    }
};

const CONCEPT_DEDUPE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        conceptFolderPath: { type: 'string' },
        duplicateCheckScopeMode: { type: 'string' }
    }
};

const CONCEPT_DEDUPE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        conceptFolderPath: { type: 'string' },
        duplicateCheckScopeMode: { type: 'string' },
        conceptNoteCount: { type: 'number' },
        comparedNoteCount: { type: 'number' },
        candidateCount: { type: 'number' },
        deletionRequested: { type: 'boolean' },
        deletionConfirmed: { type: 'boolean' },
        removedCount: { type: 'number' },
        cancelled: { type: 'boolean' },
        candidates: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                    reason: { type: 'string' },
                    counterparts: STRING_ARRAY_SCHEMA
                }
            }
        },
        fileResults: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                    deleted: { type: 'boolean' },
                    skippedBecauseMissing: { type: 'boolean' }
                }
            }
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const BATCH_MERMAID_FIX_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' }
    }
};

const BATCH_MERMAID_FIX_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        processedFileCount: { type: 'number' },
        modifiedCount: { type: 'number' },
        movedErrorFileCount: { type: 'number' },
        remainingErrorFileCount: { type: 'number' },
        reportPath: { type: 'string' },
        reportCreated: { type: 'boolean' },
        cancelled: { type: 'boolean' },
        fileResults: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    sourcePath: { type: 'string' },
                    currentPath: { type: 'string' },
                    modified: { type: 'boolean' },
                    initialErrorCount: { type: 'number' },
                    finalErrorCount: { type: 'number' },
                    deepDebugApplied: { type: 'boolean' },
                    movedToErrorFolder: { type: 'boolean' },
                    errorFolderDestinationPath: { type: 'string' },
                    skippedMoveBecauseDestinationExists: { type: 'boolean' }
                }
            }
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const FIX_FORMULA_FILE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' }
    }
};

const FIX_FORMULA_FILE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        outputPath: { type: 'string' },
        modified: { type: 'boolean' },
        replacementCount: { type: 'number' }
    }
};

const BATCH_FIX_FORMULA_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' }
    }
};

const BATCH_FIX_FORMULA_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        folderPath: { type: 'string' },
        processedFileCount: { type: 'number' },
        modifiedCount: { type: 'number' },
        cancelled: { type: 'boolean' },
        fileResults: {
            type: 'array',
            items: FIX_FORMULA_FILE_RESULT_SCHEMA
        },
        errors: ERROR_ARRAY_SCHEMA
    }
};

const CREATE_LINK_AND_GENERATE_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        sourcePath: { type: 'string' },
        selectionText: { type: 'string' },
        conceptFolderPath: { type: 'string' }
    }
};

const CREATE_LINK_AND_GENERATE_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        notePath: { type: 'string' },
        word: { type: 'string' },
        created: { type: 'boolean' }
    }
};

const EMPTY_OBJECT_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {}
};

const PROVIDER_PROFILE_IMPORT_INPUT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        inputPath: { type: 'string' }
    }
};

const PROVIDER_PROFILE_EXPORT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        outputPath: { type: 'string' },
        profile: { type: 'object' }
    }
};

const PROVIDER_PROFILE_IMPORT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        inputPath: { type: 'string' },
        importedProviders: { type: 'array' },
        activeProvider: { type: 'string' },
        activeProviderReset: { type: 'boolean' },
        newCount: { type: 'number' },
        updatedCount: { type: 'number' }
    }
};

const CLI_CAPABILITY_MANIFEST_EXPORT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        outputPath: { type: 'string' },
        manifest: { type: 'object' }
    }
};

const CLI_INVOCATION_CONTRACT_EXPORT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        outputPath: { type: 'string' },
        contract: { type: 'object' }
    }
};

const CLI_PUBLIC_SURFACE_EXPORT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        outputPath: { type: 'string' },
        surface: { type: 'object' }
    }
};

const OPERATION_DEFINITIONS: OperationDefinition[] = [
    {
        version: 1,
        id: 'provider.diagnostic.run',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createStaticCommandBinding('run-developer-provider-diagnostic', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            })
        ],
        inputSchema: PROVIDER_DIAGNOSTIC_INPUT_SCHEMA,
        resultSchema: PROVIDER_DIAGNOSTIC_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'provider.diagnostic.stability-run',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createStaticCommandBinding('run-developer-provider-stability-diagnostic', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            })
        ],
        inputSchema: PROVIDER_DIAGNOSTIC_INPUT_SCHEMA,
        resultSchema: PROVIDER_DIAGNOSTIC_STABILITY_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'diagram.generate',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createWorkflowCommandBinding('notemd-generate-diagram', 'generate-diagram', {
                defaultInput: { outputMode: 'artifact' }
            }),
            createWorkflowCommandBinding('notemd-summarize-as-mermaid', 'summarize-as-mermaid', {
                defaultInput: {
                    outputMode: 'mermaid',
                    compatibilityMode: 'legacy-mermaid'
                }
            }),
            createWorkflowCommandBinding('notemd-generate-experimental-diagram', 'generate-diagram', {
                mappingKind: 'legacy-alias',
                includeInCapabilityManifest: false,
                defaultInput: { outputMode: 'artifact' }
            })
        ],
        inputSchema: DIAGRAM_GENERATE_INPUT_SCHEMA,
        resultSchema: DIAGRAM_GENERATE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'diagram.preview',
        automationLevel: 'interactive-ui',
        requiredContext: 'preview-ui',
        sideEffectClass: 'preview-ui',
        commandBindings: [
            createWorkflowCommandBinding('notemd-preview-diagram', 'preview-diagram'),
            createWorkflowCommandBinding('notemd-preview-experimental-diagram', 'preview-diagram', {
                mappingKind: 'legacy-alias',
                includeInCapabilityManifest: false
            })
        ],
        inputSchema: DIAGRAM_PREVIEW_INPUT_SCHEMA,
        resultSchema: DIAGRAM_PREVIEW_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'provider.connection.test',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createWorkflowCommandBinding('test-llm-connection', 'test-llm-connection')
        ],
        inputSchema: PROVIDER_CONNECTION_TEST_INPUT_SCHEMA,
        resultSchema: PROVIDER_CONNECTION_TEST_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'editor.create-link-and-generate',
        automationLevel: 'requires-selection',
        requiredContext: 'editor-selection',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('create-wiki-link-and-generate-from-selection', {
                automationLevel: 'requires-selection',
                requiredContext: 'editor-selection',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: CREATE_LINK_AND_GENERATE_INPUT_SCHEMA,
        resultSchema: CREATE_LINK_AND_GENERATE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'file.process-add-links',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('process-with-notemd', 'process-current-add-links')
        ],
        inputSchema: PROCESS_FILE_INPUT_SCHEMA,
        resultSchema: PROCESS_FILE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'file.process-folder-add-links',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('process-folder-with-notemd', 'process-folder-add-links')
        ],
        inputSchema: PROCESS_FOLDER_INPUT_SCHEMA,
        resultSchema: PROCESS_FOLDER_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'content.generate-from-title',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('generate-content-from-title', 'generate-from-title')
        ],
        inputSchema: GENERATE_FROM_TITLE_INPUT_SCHEMA,
        resultSchema: GENERATE_FROM_TITLE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'content.batch-generate-from-titles',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('batch-generate-content-from-titles', 'batch-generate-from-titles')
        ],
        inputSchema: BATCH_GENERATE_FROM_TITLES_INPUT_SCHEMA,
        resultSchema: BATCH_GENERATE_FROM_TITLES_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'content.split-note-by-chapters',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('split-note-by-chapters', 'split-note-by-chapters')
        ],
        inputSchema: CHAPTER_SPLIT_INPUT_SCHEMA,
        resultSchema: CHAPTER_SPLIT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'research.summarize-topic',
        automationLevel: 'requires-selection',
        requiredContext: 'editor-selection',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('research-and-summarize-topic', 'research-and-summarize')
        ],
        inputSchema: RESEARCH_SUMMARIZE_INPUT_SCHEMA,
        resultSchema: RESEARCH_SUMMARIZE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'translate.file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('translate-file', 'translate-current-file')
        ],
        inputSchema: TRANSLATE_FILE_INPUT_SCHEMA,
        resultSchema: TRANSLATE_FILE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'translate.folder-batch',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('batch-translate-folder', 'batch-translate-folder')
        ],
        inputSchema: TRANSLATE_FOLDER_INPUT_SCHEMA,
        resultSchema: TRANSLATE_FOLDER_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'concept.extract-file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('extract-concepts-from-current-file', 'extract-concepts-current')
        ],
        inputSchema: EXTRACT_CONCEPTS_FILE_INPUT_SCHEMA,
        resultSchema: EXTRACT_CONCEPTS_FILE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'concept.extract-folder',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('batch-extract-concepts-from-folder', 'extract-concepts-folder')
        ],
        inputSchema: EXTRACT_CONCEPTS_FOLDER_INPUT_SCHEMA,
        resultSchema: EXTRACT_CONCEPTS_FOLDER_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'content.extract-original-text',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('extract-original-text', 'extract-original-text')
        ],
        inputSchema: EXTRACT_ORIGINAL_TEXT_INPUT_SCHEMA,
        resultSchema: EXTRACT_ORIGINAL_TEXT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'workflow.extract-and-generate',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createStaticCommandBinding('extract-concepts-and-generate-titles', {
                automationLevel: 'requires-active-file',
                requiredContext: 'active-file',
                sideEffectClass: 'batch-write'
            })
        ],
        inputSchema: EXTRACT_AND_GENERATE_INPUT_SCHEMA,
        resultSchema: EXTRACT_AND_GENERATE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'duplicate.check-file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'read-only',
        commandBindings: [
            createWorkflowCommandBinding('check-for-duplicates', 'check-duplicates-current')
        ],
        inputSchema: DUPLICATE_CHECK_FILE_INPUT_SCHEMA,
        resultSchema: DUPLICATE_CHECK_FILE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'concept.dedupe',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'destructive',
        commandBindings: [
            createWorkflowCommandBinding('check-and-remove-duplicate-concept-notes', 'check-remove-duplicate-concepts')
        ],
        inputSchema: CONCEPT_DEDUPE_INPUT_SCHEMA,
        resultSchema: CONCEPT_DEDUPE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'mermaid.batch-fix',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('batch-mermaid-fix', 'batch-mermaid-fix')
        ],
        inputSchema: BATCH_MERMAID_FIX_INPUT_SCHEMA,
        resultSchema: BATCH_MERMAID_FIX_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'formula.fix-file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file',
        commandBindings: [
            createWorkflowCommandBinding('fix-formula-formats', 'fix-formula-current')
        ],
        inputSchema: FIX_FORMULA_FILE_INPUT_SCHEMA,
        resultSchema: FIX_FORMULA_FILE_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'formula.batch-fix',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write',
        commandBindings: [
            createWorkflowCommandBinding('batch-fix-formula-formats', 'batch-fix-formula')
        ],
        inputSchema: BATCH_FIX_FORMULA_INPUT_SCHEMA,
        resultSchema: BATCH_FIX_FORMULA_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'cli.capability-manifest.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('export-cli-capability-manifest', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: EMPTY_OBJECT_INPUT_SCHEMA,
        resultSchema: CLI_CAPABILITY_MANIFEST_EXPORT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'cli.invocation-contract.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('export-cli-invocation-contract', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: EMPTY_OBJECT_INPUT_SCHEMA,
        resultSchema: CLI_INVOCATION_CONTRACT_EXPORT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'cli.public-surface.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('export-cli-public-surface', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: EMPTY_OBJECT_INPUT_SCHEMA,
        resultSchema: CLI_PUBLIC_SURFACE_EXPORT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'provider.profile.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        outputHandlingTags: ['contains-provider-credentials'],
        commandBindings: [
            createStaticCommandBinding('export-provider-profiles', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: EMPTY_OBJECT_INPUT_SCHEMA,
        resultSchema: PROVIDER_PROFILE_EXPORT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'provider.profile.export-redacted',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('export-provider-profiles-redacted', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: EMPTY_OBJECT_INPUT_SCHEMA,
        resultSchema: PROVIDER_PROFILE_EXPORT_RESULT_SCHEMA
    },
    {
        version: 1,
        id: 'provider.profile.import',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        inputHandlingTags: ['contains-provider-credentials'],
        commandBindings: [
            createStaticCommandBinding('import-provider-profiles', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ],
        inputSchema: PROVIDER_PROFILE_IMPORT_INPUT_SCHEMA,
        resultSchema: PROVIDER_PROFILE_IMPORT_RESULT_SCHEMA
    }
];

const OPERATION_DEFINITION_MAP = new Map(OPERATION_DEFINITIONS.map(definition => [definition.id, definition]));

export function listOperationDefinitions(): OperationDefinition[] {
    return [...OPERATION_DEFINITIONS];
}

export function getOperationDefinition(id: string): OperationDefinition | undefined {
    return OPERATION_DEFINITION_MAP.get(id);
}
