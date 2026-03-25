export const SIDEBAR_ACTION_DEFINITIONS = [
    { id: 'process-current-add-links', label: 'Process file (add links)', category: 'core' },
    { id: 'process-folder-add-links', label: 'Process folder (add links)', category: 'core' },
    { id: 'generate-from-title', label: 'Generate from title', category: 'generation' },
    { id: 'batch-generate-from-titles', label: 'Batch generate from titles', category: 'generation' },
    { id: 'research-and-summarize', label: 'Research & summarize', category: 'generation' },
    { id: 'summarize-as-mermaid', label: 'Summarise as Mermaid diagram', category: 'generation' },
    { id: 'translate-current-file', label: 'Translate current file', category: 'translation' },
    { id: 'batch-translate-folder', label: 'Batch translate folder', category: 'translation' },
    { id: 'extract-concepts-current', label: 'Extract concepts (current file)', category: 'knowledge' },
    { id: 'extract-concepts-folder', label: 'Extract concepts (folder)', category: 'knowledge' },
    { id: 'extract-original-text', label: 'Extract specific original text', category: 'knowledge' },
    { id: 'batch-mermaid-fix', label: 'Batch Mermaid fix', category: 'utilities' },
    { id: 'fix-formula-current', label: 'Fix formula formats (current)', category: 'utilities' },
    { id: 'batch-fix-formula', label: 'Batch fix formula formats', category: 'utilities' },
    { id: 'check-duplicates-current', label: 'Check duplicates (current file)', category: 'utilities' },
    { id: 'check-remove-duplicate-concepts', label: 'Check & remove duplicates', category: 'utilities' },
    { id: 'test-llm-connection', label: 'Test LLM connection', category: 'utilities' }
] as const;

export type SidebarActionId = typeof SIDEBAR_ACTION_DEFINITIONS[number]['id'];

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

export const DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL =
    'One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix';

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

export function getWorkflowActionHelpText(): string {
    return SIDEBAR_ACTION_DEFINITIONS
        .map(def => `${def.id}  =>  ${def.label}`)
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
