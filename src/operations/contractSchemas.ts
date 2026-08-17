import { CHAPTER_SPLIT_HEADING_LEVEL_VALUES } from '../types';
import type { OperationSchema } from './types';

export interface ContractValidationIssue {
    path: string;
    message: string;
}

const SCHEMA_TYPES = new Set(['object', 'array', 'string', 'number', 'boolean', 'null']);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatSchemaPath(path: string, key: string): string {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
        ? `${path}.${key}`
        : `${path}[${JSON.stringify(key)}]`;
}

function schemaTypeMatches(value: unknown, type: string): boolean {
    switch (type) {
        case 'object':
            return isRecord(value);
        case 'array':
            return Array.isArray(value);
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        default:
            return false;
    }
}

function valuesEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) {
        return true;
    }
    return typeof left === 'object'
        && typeof right === 'object'
        && JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Validates the shape of a schema before it is published as a contract.
 * Contract data is deliberately JSON-compatible so generated manifests never
 * contain executable functions or host-specific references.
 */
export function assertOperationSchema(schema: OperationSchema, path = '$'): void {
    if (!isRecord(schema)) {
        throw new Error(`Invalid operation schema at ${path}: expected an object.`);
    }

    const declaredType = schema.type;
    if (declaredType !== undefined && (typeof declaredType !== 'string' || !SCHEMA_TYPES.has(declaredType))) {
        throw new Error(`Invalid operation schema at ${path}: unknown type.`);
    }

    if (schema.required !== undefined) {
        if (!Array.isArray(schema.required) || schema.required.some(value => typeof value !== 'string')) {
            throw new Error(`Invalid operation schema at ${path}: required must be an array of strings.`);
        }
    }

    if (schema.enum !== undefined && (!Array.isArray(schema.enum) || schema.enum.length === 0)) {
        throw new Error(`Invalid operation schema at ${path}: enum must be a non-empty array.`);
    }

    if (schema.anyOf !== undefined) {
        if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
            throw new Error(`Invalid operation schema at ${path}: anyOf must be a non-empty array.`);
        }
        schema.anyOf.forEach((branch, index) => {
            assertOperationSchema(branch as OperationSchema, `${path}.anyOf[${index}]`);
        });
    }

    if (schema.properties !== undefined) {
        if (!isRecord(schema.properties)) {
            throw new Error(`Invalid operation schema at ${path}: properties must be an object.`);
        }
        Object.entries(schema.properties).forEach(([key, child]) => {
            assertOperationSchema(child as OperationSchema, formatSchemaPath(path, key));
        });
    }

    if (schema.items !== undefined) {
        assertOperationSchema(schema.items as OperationSchema, `${path}.items`);
    }
}

function validateContractValueInternal(
    value: unknown,
    schema: OperationSchema,
    path: string
): ContractValidationIssue[] {
    const issues: ContractValidationIssue[] = [];

    if (Array.isArray(schema.anyOf)) {
        const branchIssues = schema.anyOf.map(branch => validateContractValueInternal(
            value,
            branch as OperationSchema,
            path
        ));
        if (branchIssues.some(branch => branch.length === 0)) {
            return [];
        }
        return branchIssues[0] || [{ path, message: 'does not match any allowed shape' }];
    }

    if (Array.isArray(schema.enum) && !schema.enum.some(candidate => valuesEqual(value, candidate))) {
        return [{
            path,
            message: `must be one of: ${schema.enum.map(candidate => String(candidate)).join(', ')}`
        }];
    }

    if (typeof schema.type === 'string' && !schemaTypeMatches(value, schema.type)) {
        return [{
            path,
            message: schema.type === 'number'
                ? 'must be a finite number'
                : `must be ${schema.type === 'array' ? 'an' : 'a'} ${schema.type}`
        }];
    }

    if (schema.type === 'object' && isRecord(value)) {
        const required = Array.isArray(schema.required) ? schema.required : [];
        for (const key of required) {
            if (!Object.prototype.hasOwnProperty.call(value, key)) {
                issues.push({ path: formatSchemaPath(path, key), message: 'is required' });
            }
        }

        if (isRecord(schema.properties)) {
            for (const [key, childSchema] of Object.entries(schema.properties)) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    issues.push(...validateContractValueInternal(
                        value[key],
                        childSchema as OperationSchema,
                        formatSchemaPath(path, key)
                    ));
                }
            }
        }
    }

    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
        value.forEach((entry, index) => {
            issues.push(...validateContractValueInternal(entry, schema.items as OperationSchema, `${path}[${index}]`));
        });
    }

    return issues;
}

export function validateContractValue(
    value: unknown,
    schema: OperationSchema
): ContractValidationIssue[] {
    assertOperationSchema(schema);
    return validateContractValueInternal(value, schema, '$');
}

export function assertContractValue(value: unknown, schema: OperationSchema): void {
    const issues = validateContractValue(value, schema);
    if (issues.length > 0) {
        throw new Error(`Contract validation failed: ${issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
    }
}

const MAINTAINER_CLI_INPUT_SCHEMAS: Record<string, OperationSchema> = {
    'content.batch-generate-from-titles': {
        type: 'object',
        required: ['folderPath'],
        properties: {
            folderPath: { type: 'string' },
            fileSelectionProfileId: { type: 'string' },
            fileSelectionProfileName: { type: 'string' },
            includeSubfoldersMode: { type: 'string', enum: ['legacy', 'include', 'exclude'] },
            fileFilterMode: { type: 'string', enum: ['none', 'contains', 'regex', 'glob'] },
            fileFilterPattern: { type: 'string' },
            fileFilterTarget: { type: 'string', enum: ['relativePath', 'basename'] },
            fileFilterCaseSensitive: { type: 'boolean' },
            fileFilterInvert: { type: 'boolean' }
        }
    },
    'content.split-note-by-chapters': {
        type: 'object',
        required: ['sourcePath'],
        properties: {
            sourcePath: { type: 'string' },
            splitHeadingLevel: { type: 'string', enum: [...CHAPTER_SPLIT_HEADING_LEVEL_VALUES] }
        }
    },
    'research.summarize-topic': {
        type: 'object',
        required: ['sourcePath'],
        properties: {
            sourcePath: { type: 'string' },
            topic: { type: 'string' }
        }
    },
    'diagram.generate': {
        type: 'object',
        required: ['sourcePath'],
        properties: {
            sourcePath: { type: 'string' },
            executionMode: { type: 'string', enum: ['save-artifact', 'save-mermaid'] },
            requestedIntent: { type: 'string' },
            requestedRenderTarget: {
                type: 'string',
                enum: ['mermaid', 'json-canvas', 'vega-lite', 'html', 'editable-html-svg', 'drawio', 'drawnix', 'circuitikz']
            },
            compatibilityMode: { type: 'string', enum: ['best-fit', 'legacy-mermaid'] },
            targetLanguage: { type: 'string' }
        }
    },
    'local-knowledge.inspect': {
        type: 'object',
        required: ['taskScope'],
        properties: {
            taskScope: {
                type: 'string',
                enum: ['generateTitle', 'batchGenerateFromTitles', 'researchSummarize', 'diagramGeneration']
            },
            sourcePath: { type: 'string' },
            currentFilePath: { type: 'string' },
            query: { type: 'string' },
            knowledgePaths: { type: 'array', items: { type: 'string' } },
            topK: { type: 'number' },
            slidingWindowSize: { type: 'number' },
            maxSnippetChars: { type: 'number' }
        }
    },
    'provider.profile.export-redacted': { type: 'object', properties: {} },
    'cli.capability-manifest.export': { type: 'object', properties: {} },
    'cli.invocation-contract.export': { type: 'object', properties: {} },
    'cli.public-surface.export': { type: 'object', properties: {} }
};

export function getMaintainerCliInputSchema(operationId: string): OperationSchema | undefined {
    return MAINTAINER_CLI_INPUT_SCHEMAS[operationId];
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
