import {
    createEmptyWorkflowButton,
    DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL,
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
});
