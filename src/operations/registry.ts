import { AutomationLevel, RequiredContext, SideEffectClass } from '../workflowButtons';

export interface OperationDefinition {
    id: string;
    automationLevel: AutomationLevel;
    requiredContext: RequiredContext;
    sideEffectClass: SideEffectClass;
}

const OPERATION_DEFINITIONS: OperationDefinition[] = [
    {
        id: 'provider.diagnostic.run',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only'
    },
    {
        id: 'provider.diagnostic.stability-run',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only'
    },
    {
        id: 'diagram.generate',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file'
    },
    {
        id: 'provider.profile.export',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only'
    },
    {
        id: 'provider.profile.import',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'write-file'
    }
];

const OPERATION_DEFINITION_MAP = new Map(OPERATION_DEFINITIONS.map(definition => [definition.id, definition]));

export function listOperationDefinitions(): OperationDefinition[] {
    return [...OPERATION_DEFINITIONS];
}

export function getOperationDefinition(id: string): OperationDefinition | undefined {
    return OPERATION_DEFINITION_MAP.get(id);
}
