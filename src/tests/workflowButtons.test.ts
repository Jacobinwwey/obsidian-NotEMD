import {
    SIDEBAR_ACTION_DEFINITIONS,
    createEmptyWorkflowButton,
    DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL,
    getSidebarActionAutomationLevel,
    getSidebarActionRequiredContext,
    getSidebarActionSideEffectClass,
    parseCustomWorkflowButtonsDsl,
    resolveCustomWorkflowButtons,
    serializeCustomWorkflowButtons
} from '../workflowButtons';

describe('workflowButtons parser', () => {
    test('parses valid DSL lines into workflow buttons', () => {
        const dsl = [
            'One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix',
            'Quick Mermaid::summarize-as-mermaid>batch-mermaid-fix'
        ].join('\n');

        const result = parseCustomWorkflowButtonsDsl(dsl);

        expect(result.errors).toEqual([]);
        expect(result.buttons).toHaveLength(2);
        expect(result.buttons[0].name).toBe('One-Click Extract');
        expect(result.buttons[0].actions).toEqual([
            'process-current-add-links',
            'batch-generate-from-titles',
            'batch-mermaid-fix'
        ]);
        expect(result.buttons[1].actions).toEqual([
            'summarize-as-mermaid',
            'batch-mermaid-fix'
        ]);
    });

    test('returns validation errors when unknown action exists', () => {
        const dsl = 'Bad Flow::process-current-add-links>not-a-real-action';
        const result = parseCustomWorkflowButtonsDsl(dsl);

        expect(result.buttons).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Unknown action');
    });

    test('resolveCustomWorkflowButtons falls back to default when DSL is invalid', () => {
        const result = resolveCustomWorkflowButtons('Broken line without separator');

        expect(result.buttons).toHaveLength(1);
        expect(result.buttons[0].name).toBe('One-Click Extract');
        expect(result.rawDsl).toBe(DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL);
        expect(result.usedFallback).toBe(true);
    });

    test('serializes workflow button objects back to DSL', () => {
        const dsl = serializeCustomWorkflowButtons([
            {
                name: 'Quick Flow',
                actions: ['process-current-add-links', 'batch-mermaid-fix']
            },
            {
                name: 'Mermaid Report',
                actions: ['summarize-as-mermaid', 'batch-mermaid-fix']
            }
        ]);

        expect(dsl).toBe(
            'Quick Flow::process-current-add-links>batch-mermaid-fix\nMermaid Report::summarize-as-mermaid>batch-mermaid-fix'
        );
    });

    test('creates an empty workflow template with valid default action', () => {
        const item = createEmptyWorkflowButton(3);
        expect(item.name).toBe('Workflow 3');
        expect(item.actions).toEqual(['process-current-add-links']);
    });

    test('developer diagnostics stay out of sidebar workflow action ids', () => {
        const actionIds = SIDEBAR_ACTION_DEFINITIONS.map(def => def.id);
        expect(actionIds).not.toContain('run-developer-provider-diagnostic');
        expect(actionIds).not.toContain('run-developer-provider-stability-diagnostic');
    });

    test('exposes automation metadata for current action ids', () => {
        expect(getSidebarActionAutomationLevel('test-llm-connection')).toBe('safe');
        expect(getSidebarActionRequiredContext('test-llm-connection')).toBe('none');
        expect(getSidebarActionSideEffectClass('test-llm-connection')).toBe('read-only');

        expect(getSidebarActionAutomationLevel('generate-experimental-diagram')).toBe('requires-active-file');
        expect(getSidebarActionRequiredContext('generate-experimental-diagram')).toBe('active-file');
        expect(getSidebarActionSideEffectClass('generate-experimental-diagram')).toBe('write-file');

        expect(getSidebarActionAutomationLevel('preview-experimental-diagram')).toBe('interactive-ui');
        expect(getSidebarActionRequiredContext('preview-experimental-diagram')).toBe('preview-ui');
        expect(getSidebarActionSideEffectClass('preview-experimental-diagram')).toBe('preview-ui');
    });
});
