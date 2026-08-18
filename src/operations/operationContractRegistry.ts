import { assertOperationSchema } from './schemaRuntime';
import type { OperationDefinition } from './types';

/**
 * Fails closed at the registry boundary so malformed contracts cannot be
 * exported as a plausible CLI manifest or discovered only at invocation time.
 */
export function assertOperationRegistry(definitions: readonly OperationDefinition[]): void {
    const operationIds = new Set<string>();
    const commandIds = new Set<string>();

    for (const definition of definitions) {
        if (typeof definition.id !== 'string' || definition.id.trim().length === 0) {
            throw new Error('Operation registry contains an empty operation id.');
        }
        if (operationIds.has(definition.id)) {
            throw new Error(`Operation registry contains duplicate operation id "${definition.id}".`);
        }
        operationIds.add(definition.id);

        if (definition.version !== 1) {
            throw new Error(`Operation "${definition.id}" has unsupported contract version.`);
        }
        if (!definition.inputSchema || !definition.resultSchema) {
            throw new Error(`Operation "${definition.id}" must declare both input and result schemas.`);
        }
        assertOperationSchema(definition.inputSchema, `${definition.id}.inputSchema`);
        assertOperationSchema(definition.resultSchema, `${definition.id}.resultSchema`);

        if (!Array.isArray(definition.commandBindings) || definition.commandBindings.length === 0) {
            throw new Error(`Operation "${definition.id}" must declare at least one command binding.`);
        }

        for (const binding of definition.commandBindings) {
            if (typeof binding.commandId !== 'string' || binding.commandId.trim().length === 0) {
                throw new Error(`Operation "${definition.id}" contains an empty command id.`);
            }
            if (commandIds.has(binding.commandId)) {
                throw new Error(`Operation registry contains duplicate command id "${binding.commandId}".`);
            }
            commandIds.add(binding.commandId);

            if (!Array.isArray(binding.surfaces) || binding.surfaces.length === 0
                || new Set(binding.surfaces).size !== binding.surfaces.length) {
                throw new Error(`Command "${binding.commandId}" must declare unique trigger surfaces.`);
            }
        }
    }
}
