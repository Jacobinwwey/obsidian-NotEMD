import type { OperationSchema } from './types';
import { getOperationDefinition } from './registry';
import { validateContractValue } from './schemaRuntime';

export {
    assertContractValue,
    assertOperationSchema,
    validateContractValue
} from './schemaRuntime';
export type { ContractValidationIssue } from './schemaRuntime';

// The maintainer bridge also runs in the Node-backed CLI helper. Keep its input
// contract in JSON so the TypeScript validator and the Node help surface cannot
// silently drift in required/optional field names.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const maintainerCliContractMetadata = require('./maintainerCliContractMetadata.json') as {
    inputSchemas: Record<string, OperationSchema>;
};

const MAINTAINER_CLI_INPUT_SCHEMAS = maintainerCliContractMetadata.inputSchemas;

const LOCAL_KNOWLEDGE_INSPECT_RESULT_SCHEMA: OperationSchema = {
    type: 'object',
    properties: {
        taskScope: {
            type: 'string',
            enum: ['generateTitle', 'batchGenerateFromTitles', 'researchSummarize', 'diagramGeneration']
        },
        globalEnabled: { type: 'boolean' },
        taskEnabled: { type: 'boolean' },
        effectivePathSource: { type: 'string', enum: ['override', 'task-specific', 'default'] },
        effectiveConfiguredPaths: { type: 'array', items: { type: 'string' } },
        sourcePath: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        query: { type: 'string' },
        queryDerivation: { type: 'string', enum: ['explicit', 'basename', 'diagram-source'] },
        queryDiagnostics: { type: 'object' },
        currentFilePath: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        retrievalOptions: { type: 'object' },
        retrieverBuildStatus: {
            type: 'string',
            enum: ['disabled', 'no-paths', 'no-candidate-files', 'no-retrievable-sections', 'ready']
        },
        retrieverCreated: { type: 'boolean' },
        candidateFilePaths: { type: 'array', items: { type: 'string' } },
        context: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        contextBlocks: { type: 'array' },
        retrieval: { type: 'object' }
    }
};

const MAINTAINER_CLI_RESULT_SCHEMAS: Record<string, OperationSchema> = {
    'local-knowledge.inspect': LOCAL_KNOWLEDGE_INSPECT_RESULT_SCHEMA
};

export function getMaintainerCliInputSchema(operationId: string): OperationSchema | undefined {
    return MAINTAINER_CLI_INPUT_SCHEMAS[operationId];
}

export function getOperationResultSchema(operationId: string): OperationSchema | undefined {
    return getOperationDefinition(operationId)?.resultSchema || MAINTAINER_CLI_RESULT_SCHEMAS[operationId];
}

/**
 * Validate a host result at the operation boundary. `null` is an intentional
 * cancellation/no-result value for UI-backed commands; all non-null values
 * must satisfy the registry schema while unknown fields remain forward-safe.
 */
export function assertOperationResult(operationId: string, value: unknown): void {
    if (value == null) {
        return;
    }

    const schema = getOperationResultSchema(operationId);
    if (!schema) {
        throw new Error(`No operation result schema is registered for operation "${operationId}".`);
    }

    const issues = validateContractValue(value, schema);
    if (issues.length > 0) {
        throw new Error(`Operation "${operationId}" returned an invalid result: ${issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
    }
}

/** Validate the host-adapter input, while intentionally allowing unknown legacy fields. */
export function assertMaintainerCliInput(operationId: string, input: unknown): void {
    const schema = getMaintainerCliInputSchema(operationId);
    if (!schema) {
        throw new Error(`No maintainer CLI input schema is registered for operation "${operationId}".`);
    }

    const issues = validateContractValue(input ?? {}, schema);
    if (issues.length === 0) {
        return;
    }

    const message = issues.map(issue => {
        const key = issue.path.replace(/^\$\./, '').replace(/\[.*$/, '');
        if (issue.message.startsWith('must be one of:')) {
            return `Maintainer CLI operation expects "${key}" to be one of: ${issue.message.slice('must be one of:'.length).trim()}.`;
        }
        if (issue.message === 'is required') {
            return `Maintainer CLI operation requires a non-empty "${key}" string.`;
        }
        if (issue.message === 'must be an array') {
            return `Maintainer CLI operation expects "${key}" to be an array of strings when provided.`;
        }
        if (issue.message === 'must be a string') {
            return `Maintainer CLI operation expects "${key}" to be a string when provided.`;
        }
        if (issue.message === 'must be a finite number') {
            return `Maintainer CLI operation expects "${key}" to be a finite number when provided.`;
        }
        return `Maintainer CLI operation input ${issue.path} ${issue.message}.`;
    }).join(' ');
    throw new Error(message);
}
