import {
    getSidebarActionAutomationLevel,
    getSidebarActionRequiredContext,
    getSidebarActionSideEffectClass,
    SidebarActionId
} from '../workflowButtons';
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
    required: ['plan', 'spec', 'artifact'],
    properties: {
        plan: { type: 'object' },
        spec: { type: 'object' },
        artifact: { type: 'object' },
        renderError: { type: 'string' }
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
        outputPath: { type: 'string' }
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
        outputFolderPath: { type: 'string' },
        translatedCount: { type: 'number' },
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
        questionCount: { type: 'number' }
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

const OPERATION_DEFINITIONS: OperationDefinition[] = [
    {
        version: 1,
        id: 'provider.diagnostic.run',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createWorkflowCommandBinding('test-llm-connection', 'test-llm-connection', {
                mappingKind: 'future-target'
            }),
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
            createWorkflowCommandBinding('notemd-generate-diagram', 'generate-experimental-diagram', {
                defaultInput: { outputMode: 'artifact' }
            }),
            createWorkflowCommandBinding('notemd-summarize-as-mermaid', 'summarize-as-mermaid', {
                defaultInput: {
                    outputMode: 'mermaid',
                    compatibilityMode: 'legacy-mermaid'
                }
            }),
            createWorkflowCommandBinding('notemd-generate-experimental-diagram', 'generate-experimental-diagram', {
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
            createWorkflowCommandBinding('notemd-preview-diagram', 'preview-experimental-diagram'),
            createWorkflowCommandBinding('notemd-preview-experimental-diagram', 'preview-experimental-diagram', {
                mappingKind: 'legacy-alias',
                includeInCapabilityManifest: false
            })
        ]
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
        id: 'provider.profile.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only',
        commandBindings: [
            createStaticCommandBinding('export-provider-profiles', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            })
        ]
    },
    {
        version: 1,
        id: 'provider.profile.import',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file',
        commandBindings: [
            createStaticCommandBinding('import-provider-profiles', {
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            })
        ]
    }
];

const OPERATION_DEFINITION_MAP = new Map(OPERATION_DEFINITIONS.map(definition => [definition.id, definition]));

export function listOperationDefinitions(): OperationDefinition[] {
    return [...OPERATION_DEFINITIONS];
}

export function getOperationDefinition(id: string): OperationDefinition | undefined {
    return OPERATION_DEFINITION_MAP.get(id);
}
