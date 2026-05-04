import { listOperationDefinitions } from './registry';
import { CliCapabilityManifest } from './types';

export function buildCliCapabilityManifest(pluginId = 'notemd'): CliCapabilityManifest {
    return {
        version: 1,
        commands: listOperationDefinitions().flatMap(definition =>
            definition.commandBindings
                .filter(binding => binding.includeInCapabilityManifest !== false)
                .map(binding => ({
                    id: `${pluginId}:${binding.commandId}`,
                    localCommandId: binding.commandId,
                    operationId: definition.id,
                    operationVersion: definition.version,
                    automationLevel: binding.automationLevel,
                    requiredContext: binding.requiredContext,
                    sideEffectClass: binding.sideEffectClass,
                    surfaces: [...binding.surfaces],
                    mappingKind: binding.mappingKind,
                    defaultInput: binding.defaultInput ? { ...binding.defaultInput } : undefined
                }))
        )
    };
}
