import { buildCliInvocationContract } from '../cliContracts';

describe('CLI invocation contract', () => {
    test('exports versioned typed contracts for provider diagnostic operations', () => {
        const contract = buildCliInvocationContract();

        expect(contract.version).toBe(1);
        expect(contract.operations.map(operation => operation.operationId)).toEqual([
            'provider.diagnostic.run',
            'provider.diagnostic.stability-run'
        ]);
        expect(contract.operations[0].inputSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['providerName', 'model', 'callMode', 'timeoutMs', 'stabilityRuns'])
        }));
        expect(contract.operations[0].resultSchema).toEqual(expect.objectContaining({
            type: 'object',
            required: expect.arrayContaining(['success', 'elapsedMs', 'callMode', 'requestedCallMode', 'logs', 'report'])
        }));
    });
});
