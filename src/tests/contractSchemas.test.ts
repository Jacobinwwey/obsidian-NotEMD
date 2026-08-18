import {
    assertOperationSchema,
    assertMaintainerCliInput,
    assertOperationResult,
    validateContractValue
} from '../operations/contractSchemas';
import { assertOperationRegistry } from '../operations/operationContractRegistry';
import { buildCliInvocationContract } from '../cliContracts';

describe('operation contract schemas', () => {
    test('validates nested values and reports the exact failing path', () => {
        const issues = validateContractValue(
            {
                sourcePath: 'docs/index.md',
                knowledgePaths: ['maintainer'],
                topK: 'two'
            },
            {
                type: 'object',
                required: ['sourcePath'],
                properties: {
                    sourcePath: { type: 'string' },
                    knowledgePaths: { type: 'array', items: { type: 'string' } },
                    topK: { type: 'number' }
                }
            }
        );

        expect(issues).toEqual([
            { path: '$.topK', message: 'must be a finite number' }
        ]);
    });

    test('rejects required fields that are not declared in object properties', () => {
        expect(() => assertOperationSchema({
            type: 'object',
            required: ['sourcePath'],
            properties: {}
        })).toThrow('required field "sourcePath" must be declared in properties');

        expect(() => assertOperationSchema({
            type: 'object',
            required: ['sourcePath']
        })).toThrow('required fields need object properties');
    });

    test('rejects duplicate required fields instead of silently normalizing them', () => {
        expect(() => assertOperationSchema({
            type: 'object',
            required: ['sourcePath', 'sourcePath'],
            properties: { sourcePath: { type: 'string' } }
        })).toThrow('required fields must be unique');
    });

    test('rejects malformed operation registries before they can be exported', () => {
        expect(() => assertOperationRegistry([
            {
                version: 1,
                id: 'duplicate.operation',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only',
                commandBindings: [{
                    commandId: 'same-command',
                    automationLevel: 'safe',
                    requiredContext: 'none',
                    sideEffectClass: 'read-only',
                    surfaces: ['official-cli-command'],
                    mappingKind: 'exact'
                }],
                inputSchema: { type: 'object', properties: {} },
                resultSchema: { type: 'object', properties: {} }
            },
            {
                version: 1,
                id: 'duplicate.operation',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only',
                commandBindings: [{
                    commandId: 'same-command',
                    automationLevel: 'safe',
                    requiredContext: 'none',
                    sideEffectClass: 'read-only',
                    surfaces: ['official-cli-command'],
                    mappingKind: 'exact'
                }],
                inputSchema: { type: 'object', properties: {} },
                resultSchema: { type: 'object', properties: {} }
            }
        ])).toThrow('duplicate operation id');
    });

    test('validates all registry schemas before exporting the invocation contract', () => {
        const contract = buildCliInvocationContract();

        expect(contract.operations.length).toBeGreaterThan(0);
        for (const operation of contract.operations) {
            expect(() => assertOperationSchema(operation.inputSchema)).not.toThrow();
            expect(() => assertOperationSchema(operation.resultSchema)).not.toThrow();
        }
    });

    test('rejects invalid maintainer input before the host operation can run', () => {
        expect(() => assertMaintainerCliInput('diagram.generate', {
            sourcePath: 'docs/index.md',
            requestedRenderTarget: 'unsupported-target'
        })).toThrow('requestedRenderTarget');

        expect(() => assertMaintainerCliInput('local-knowledge.inspect', {
            taskScope: 'diagramGeneration',
            knowledgePaths: 'maintainer'
        })).toThrow('knowledgePaths');
    });

    test('keeps unknown legacy fields forward-compatible', () => {
        expect(() => assertMaintainerCliInput('diagram.generate', {
            sourcePath: 'docs/index.md',
            drawnixKnowledgeMapDelivery: 'legacy-value'
        })).not.toThrow();
    });

    test('validates runtime operation results at the registry boundary', () => {
        expect(() => assertOperationResult('diagram.generate', {
            kind: 'success',
            executionMode: 'save-artifact',
            sourcePath: 'docs/index.md',
            actionLabel: 'Generate diagram',
            previewOpened: 'yes'
        })).toThrow('$.previewOpened must be a boolean');

        expect(() => assertOperationResult('diagram.generate', {
            kind: 'success',
            executionMode: 'save-artifact',
            sourcePath: 'docs/index.md',
            actionLabel: 'Generate diagram',
            futureResultField: { version: 2 }
        })).not.toThrow();

        expect(() => assertOperationResult('diagram.generate', null)).not.toThrow();
    });
});
