export interface CliInvocationContract {
    version: 1;
    operations: Array<{
        operationId: string;
        inputSchema: Record<string, unknown>;
        resultSchema: Record<string, unknown>;
    }>;
}

export function buildCliInvocationContract(): CliInvocationContract {
    return {
        version: 1,
        operations: [
            {
                operationId: 'provider.diagnostic.run',
                inputSchema: {
                    type: 'object',
                    required: ['providerName', 'model', 'callMode', 'timeoutMs', 'stabilityRuns'],
                    properties: {
                        providerName: { type: 'string' },
                        model: { type: 'string' },
                        callMode: { type: 'string' },
                        timeoutMs: { type: 'number' },
                        stabilityRuns: { type: 'number' }
                    }
                },
                resultSchema: {
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
                }
            },
            {
                operationId: 'provider.diagnostic.stability-run',
                inputSchema: {
                    type: 'object',
                    required: ['providerName', 'model', 'callMode', 'timeoutMs', 'stabilityRuns'],
                    properties: {
                        providerName: { type: 'string' },
                        model: { type: 'string' },
                        callMode: { type: 'string' },
                        timeoutMs: { type: 'number' },
                        stabilityRuns: { type: 'number' }
                    }
                },
                resultSchema: {
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
                }
            }
        ]
    };
}
