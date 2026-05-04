import { buildCliInvocationContract } from '../cliContracts';

describe('CLI invocation contract', () => {
    test('exports versioned typed contracts for registry-backed operations', () => {
        const contract = buildCliInvocationContract();

        expect(contract.version).toBe(1);
        expect(contract.operations.map(operation => operation.operationId)).toEqual([
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run',
            'diagram.generate'
        ]);
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
    });
});
