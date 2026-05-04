import { listOperationDefinitions } from './operations/registry';
import { CliInvocationContract } from './operations/types';

export function buildCliInvocationContract(): CliInvocationContract {
    return {
        version: 1,
        operations: listOperationDefinitions()
            .filter(definition => definition.inputSchema && definition.resultSchema)
            .map(definition => ({
                operationId: definition.id,
                operationVersion: definition.version,
                inputSchema: definition.inputSchema!,
                resultSchema: definition.resultSchema!
            }))
    };
}
