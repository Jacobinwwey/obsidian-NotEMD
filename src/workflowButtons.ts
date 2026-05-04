import type { NotemdEnglishStrings } from './i18n/locales/en';

type SidebarActionTranslationKey = keyof NotemdEnglishStrings['sidebar']['actions'];

export type AutomationLevel = 'safe' | 'requires-active-file' | 'requires-selection' | 'interactive-ui';
export type RequiredContext = 'none' | 'active-file' | 'editor-selection' | 'folder-selection' | 'preview-ui';
export type SideEffectClass = 'read-only' | 'write-file' | 'batch-write' | 'preview-ui' | 'destructive';

export interface CliCapabilityCommand {
    id: string;
    operationId: string;
    automationLevel: AutomationLevel;
    requiredContext: RequiredContext;
    sideEffectClass: SideEffectClass;
}

export interface CliCapabilityManifest {
    version: 1;
    commands: CliCapabilityCommand[];
}

export const SIDEBAR_ACTION_DEFINITIONS = [
    { id: 'process-current-add-links', label: 'Process file (add links)', translationKey: 'processCurrentAddLinks', category: 'core', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'process-folder-add-links', label: 'Process folder (add links)', translationKey: 'processFolderAddLinks', category: 'core', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'generate-from-title', label: 'Generate from title', translationKey: 'generateFromTitle', category: 'generation', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'batch-generate-from-titles', label: 'Batch generate from titles', translationKey: 'batchGenerateFromTitles', category: 'generation', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'research-and-summarize', label: 'Research & summarize', translationKey: 'researchAndSummarize', category: 'generation', automationLevel: 'requires-selection', requiredContext: 'editor-selection', sideEffectClass: 'write-file' },
    { id: 'summarize-as-mermaid', label: 'Summarise as Mermaid diagram', translationKey: 'summarizeAsMermaid', category: 'generation', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'generate-experimental-diagram', label: 'Generate diagram (experimental)', translationKey: 'generateExperimentalDiagram', category: 'generation', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'preview-experimental-diagram', label: 'Preview diagram (experimental)', translationKey: 'previewExperimentalDiagram', category: 'generation', automationLevel: 'interactive-ui', requiredContext: 'preview-ui', sideEffectClass: 'preview-ui' },
    { id: 'translate-current-file', label: 'Translate current file', translationKey: 'translateCurrentFile', category: 'translation', automationLevel: 'requires-selection', requiredContext: 'editor-selection', sideEffectClass: 'write-file' },
    { id: 'batch-translate-folder', label: 'Batch translate folder', translationKey: 'batchTranslateFolder', category: 'translation', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'extract-concepts-current', label: 'Extract concepts (current file)', translationKey: 'extractConceptsCurrent', category: 'knowledge', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'extract-concepts-folder', label: 'Extract concepts (folder)', translationKey: 'extractConceptsFolder', category: 'knowledge', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'extract-original-text', label: 'Extract specific original text', translationKey: 'extractOriginalText', category: 'knowledge', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'batch-mermaid-fix', label: 'Batch Mermaid fix', translationKey: 'batchMermaidFix', category: 'utilities', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'fix-formula-current', label: 'Fix formula formats (current)', translationKey: 'fixFormulaCurrent', category: 'utilities', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'write-file' },
    { id: 'batch-fix-formula', label: 'Batch fix formula formats', translationKey: 'batchFixFormula', category: 'utilities', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'batch-write' },
    { id: 'check-duplicates-current', label: 'Check duplicates (current file)', translationKey: 'checkDuplicatesCurrent', category: 'utilities', automationLevel: 'requires-active-file', requiredContext: 'active-file', sideEffectClass: 'read-only' },
    { id: 'check-remove-duplicate-concepts', label: 'Check & remove duplicates', translationKey: 'checkRemoveDuplicateConcepts', category: 'utilities', automationLevel: 'interactive-ui', requiredContext: 'folder-selection', sideEffectClass: 'destructive' },
    { id: 'test-llm-connection', label: 'Test LLM connection', translationKey: 'testLlmConnection', category: 'utilities', automationLevel: 'safe', requiredContext: 'none', sideEffectClass: 'read-only' }
] as const;

export type SidebarActionId = typeof SIDEBAR_ACTION_DEFINITIONS[number]['id'];
export type ActionCategory = typeof SIDEBAR_ACTION_DEFINITIONS[number]['category'];

export interface CustomWorkflowButton {
    id: string;
    name: string;
    actions: SidebarActionId[];
}

export interface ParsedWorkflowButtonsResult {
    buttons: CustomWorkflowButton[];
    errors: string[];
}

export interface ResolvedWorkflowButtonsResult {
    buttons: CustomWorkflowButton[];
    errors: string[];
    rawDsl: string;
    usedFallback: boolean;
}

const ACTION_ID_SET = new Set<string>(SIDEBAR_ACTION_DEFINITIONS.map(def => def.id));
const ACTION_DEFINITION_MAP = new Map<SidebarActionId, typeof SIDEBAR_ACTION_DEFINITIONS[number]>(
    SIDEBAR_ACTION_DEFINITIONS.map(def => [def.id, def])
);

export const DEFAULT_CUSTOM_WORKFLOW_BUTTON_NAME = 'One-Click Extract';
export const DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL =
    `${DEFAULT_CUSTOM_WORKFLOW_BUTTON_NAME}::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix`;

export function getSidebarActionDefinition(actionId: SidebarActionId) {
    return ACTION_DEFINITION_MAP.get(actionId);
}

export function getSidebarActionAutomationLevel(actionId: SidebarActionId): AutomationLevel | undefined {
    return getSidebarActionDefinition(actionId)?.automationLevel;
}

export function getSidebarActionRequiredContext(actionId: SidebarActionId): RequiredContext | undefined {
    return getSidebarActionDefinition(actionId)?.requiredContext;
}

export function getSidebarActionSideEffectClass(actionId: SidebarActionId): SideEffectClass | undefined {
    return getSidebarActionDefinition(actionId)?.sideEffectClass;
}

export function buildCliCapabilityManifest(): CliCapabilityManifest {
    return {
        version: 1,
        commands: [
            {
                id: 'notemd:test-llm-connection',
                operationId: 'provider.diagnostic.run',
                automationLevel: getSidebarActionAutomationLevel('test-llm-connection')!,
                requiredContext: getSidebarActionRequiredContext('test-llm-connection')!,
                sideEffectClass: getSidebarActionSideEffectClass('test-llm-connection')!
            },
            {
                id: 'notemd:run-developer-provider-diagnostic',
                operationId: 'provider.diagnostic.run',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            },
            {
                id: 'notemd:run-developer-provider-stability-diagnostic',
                operationId: 'provider.diagnostic.stability-run',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            },
            {
                id: 'notemd:notemd-generate-diagram',
                operationId: 'diagram.generate',
                automationLevel: getSidebarActionAutomationLevel('generate-experimental-diagram')!,
                requiredContext: getSidebarActionRequiredContext('generate-experimental-diagram')!,
                sideEffectClass: getSidebarActionSideEffectClass('generate-experimental-diagram')!
            },
            {
                id: 'notemd:notemd-summarize-as-mermaid',
                operationId: 'diagram.generate-mermaid',
                automationLevel: getSidebarActionAutomationLevel('summarize-as-mermaid')!,
                requiredContext: getSidebarActionRequiredContext('summarize-as-mermaid')!,
                sideEffectClass: getSidebarActionSideEffectClass('summarize-as-mermaid')!
            },
            {
                id: 'notemd:notemd-preview-diagram',
                operationId: 'diagram.preview',
                automationLevel: getSidebarActionAutomationLevel('preview-experimental-diagram')!,
                requiredContext: getSidebarActionRequiredContext('preview-experimental-diagram')!,
                sideEffectClass: getSidebarActionSideEffectClass('preview-experimental-diagram')!
            },
            {
                id: 'notemd:export-provider-profiles',
                operationId: 'provider.profile.export',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'read-only'
            },
            {
                id: 'notemd:import-provider-profiles',
                operationId: 'provider.profile.import',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file'
            }
        ]
    };
}

export function getSidebarActionLabel(strings: NotemdEnglishStrings, actionId: SidebarActionId): string {
    const definition = getSidebarActionDefinition(actionId);
    if (!definition) {
        return actionId;
    }

    return strings.sidebar.actions[definition.translationKey as SidebarActionTranslationKey]?.label || definition.label;
}

export function getSidebarActionTooltip(strings: NotemdEnglishStrings, actionId: SidebarActionId): string {
    const definition = getSidebarActionDefinition(actionId);
    if (!definition) {
        return actionId;
    }

    const actionStrings = strings.sidebar.actions[definition.translationKey as SidebarActionTranslationKey];
    return actionStrings?.tooltip || actionStrings?.label || definition.label;
}

export function getLocalizedWorkflowButtonName(strings: NotemdEnglishStrings, workflowName: string): string {
    return workflowName === DEFAULT_CUSTOM_WORKFLOW_BUTTON_NAME
        ? strings.sidebar.defaultWorkflowName
        : workflowName;
}

function slugifyName(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || 'custom-workflow';
}

function parseActions(rawActions: string): SidebarActionId[] {
    return rawActions
        .split('>')
        .map(part => part.trim())
        .filter(Boolean) as SidebarActionId[];
}

export function parseCustomWorkflowButtonsDsl(dsl: string): ParsedWorkflowButtonsResult {
    const errors: string[] = [];
    const buttons: CustomWorkflowButton[] = [];
    const usedIds = new Set<string>();
    const lines = dsl.split('\n');

    for (let index = 0; index < lines.length; index++) {
        const rawLine = lines[index];
        const line = rawLine.trim();

        if (!line || line.startsWith('#')) {
            continue;
        }

        const separator = line.indexOf('::');
        if (separator < 0) {
            errors.push(`Line ${index + 1}: missing "::" separator.`);
            continue;
        }

        const name = line.slice(0, separator).trim();
        const actionsPart = line.slice(separator + 2).trim();

        if (!name) {
            errors.push(`Line ${index + 1}: button name cannot be empty.`);
            continue;
        }
        if (!actionsPart) {
            errors.push(`Line ${index + 1}: action list cannot be empty.`);
            continue;
        }

        const actions = parseActions(actionsPart);
        if (actions.length === 0) {
            errors.push(`Line ${index + 1}: action list cannot be empty.`);
            continue;
        }

        const unknownActions = actions.filter(action => !ACTION_ID_SET.has(action));
        if (unknownActions.length > 0) {
            errors.push(`Line ${index + 1}: Unknown action(s): ${unknownActions.join(', ')}`);
            continue;
        }

        let idBase = slugifyName(name);
        let uniqueId = idBase;
        let suffix = 2;
        while (usedIds.has(uniqueId)) {
            uniqueId = `${idBase}-${suffix}`;
            suffix++;
        }
        usedIds.add(uniqueId);

        buttons.push({
            id: uniqueId,
            name,
            actions
        });
    }

    return { buttons, errors };
}

export function resolveCustomWorkflowButtons(dsl: string): ResolvedWorkflowButtonsResult {
    const normalizedDsl = dsl?.trim() ? dsl : DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL;
    const parsed = parseCustomWorkflowButtonsDsl(normalizedDsl);

    if (parsed.buttons.length > 0) {
        return {
            buttons: parsed.buttons,
            errors: parsed.errors,
            rawDsl: normalizedDsl,
            usedFallback: false
        };
    }

    const fallback = parseCustomWorkflowButtonsDsl(DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL);
    return {
        buttons: fallback.buttons,
        errors: parsed.errors.length > 0 ? parsed.errors : fallback.errors,
        rawDsl: DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL,
        usedFallback: true
    };
}

export function getWorkflowActionHelpText(strings: NotemdEnglishStrings): string {
    return SIDEBAR_ACTION_DEFINITIONS
        .map(def => `${def.id}  =>  ${getSidebarActionLabel(strings, def.id)}`)
        .join('\n');
}

export function serializeCustomWorkflowButtons(buttons: Array<Pick<CustomWorkflowButton, 'name' | 'actions'>>): string {
    return buttons
        .filter(button => button.name.trim() && button.actions.length > 0)
        .map(button => `${button.name.trim()}::${button.actions.join('>')}`)
        .join('\n');
}

export function createEmptyWorkflowButton(index: number): CustomWorkflowButton {
    return {
        id: `workflow-${index}`,
        name: `Workflow ${index}`,
        actions: ['process-current-add-links']
    };
}
