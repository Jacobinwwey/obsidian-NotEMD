import { mockSettings } from './__mocks__/settings';
import {
    buildDiagramOperationInput,
    resolveDiagramOperationCompatibilityMode
} from '../diagram/diagramGenerationService';

describe('diagram operation input helpers', () => {
    test('builds operation input for artifact generation from plugin settings', () => {
        const input = buildDiagramOperationInput({
            sourcePath: 'Notes/Topic.md',
            sourceMarkdown: '# Topic',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: 'flowchart',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        });

        expect(input.sourcePath).toBe('Notes/Topic.md');
        expect(input.sourceMarkdown).toBe('# Topic');
        expect(input.requestedIntent).toBe('flowchart');
        expect(input.compatibilityMode).toBe('best-fit');
        expect(input.outputMode).toBe('artifact');
    });

    test('forces legacy-mermaid compatibility for mermaid output mode', () => {
        const compatibilityMode = resolveDiagramOperationCompatibilityMode('save-mermaid', 'best-fit');
        expect(compatibilityMode).toBe('legacy-mermaid');
    });
});
