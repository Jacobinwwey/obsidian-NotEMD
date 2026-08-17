import {
    assertOperationSchema,
    assertMaintainerCliInput,
    validateContractValue
} from '../operations/contractSchemas';
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
});
