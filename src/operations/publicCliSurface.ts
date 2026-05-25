import { buildCliInvocationContract } from '../cliContracts';
import { CliPublicSurface, CliCapabilityCommand, CliInvocationContractOperation, OperationSchema } from './types';
import { buildCliCapabilityManifest } from './capabilityManifest';

function getSchemaRequiredKeys(schema: OperationSchema): string[] {
    return Array.isArray(schema.required)
        ? schema.required.filter((value): value is string => typeof value === 'string')
        : [];
}

function getSchemaPropertyKeys(schema: OperationSchema): string[] {
    if (!schema.properties || typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
        return [];
    }

    return Object.keys(schema.properties as Record<string, unknown>);
}

function isEmptyObjectInputSchema(schema: OperationSchema): boolean {
    return schema.type === 'object'
        && getSchemaRequiredKeys(schema).length === 0
        && getSchemaPropertyKeys(schema).length === 0;
}

function hasSensitiveOutputHandling(command: CliCapabilityCommand): boolean {
    return command.outputHandlingTags?.includes('contains-provider-credentials') ?? false;
}

function isBoundedPublicCliCommand(
    command: CliCapabilityCommand,
    contract: CliInvocationContractOperation | undefined
): contract is CliInvocationContractOperation {
    return !!contract
        && !hasSensitiveOutputHandling(command)
        && command.automationLevel === 'safe'
        && command.requiredContext === 'none'
        && command.mappingKind === 'exact'
        && command.surfaces.includes('official-cli-command')
        && isEmptyObjectInputSchema(contract.inputSchema);
}

export function buildCliPublicSurface(pluginId = 'notemd'): CliPublicSurface {
    const capabilityManifest = buildCliCapabilityManifest(pluginId);
    const contractMap = new Map(
        buildCliInvocationContract().operations.map(operation => [operation.operationId, operation])
    );

    return {
        version: 1,
        commands: capabilityManifest.commands
            .map(command => {
                const contract = contractMap.get(command.operationId);
                if (!isBoundedPublicCliCommand(command, contract)) {
                    return null;
                }

                return {
                    ...command,
                    commandExample: `obsidian command id=${command.id}`,
                    inputSchema: contract.inputSchema,
                    resultSchema: contract.resultSchema
                };
            })
            .filter((command): command is CliPublicSurface['commands'][number] => command !== null)
    };
}
