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
                preferredDiagramRenderTarget: 'editable-html-svg',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        });

        expect(input.sourcePath).toBe('Notes/Topic.md');
        expect(input.sourceMarkdown).toBe('# Topic');
        expect(input.requestedIntent).toBe('flowchart');
        expect(input.requestedRenderTarget).toBe('editable-html-svg');
        expect(input.compatibilityMode).toBe('best-fit');
        expect(input.outputMode).toBe('artifact');
    });

    test('forces legacy-mermaid compatibility for mermaid output mode', () => {
        const compatibilityMode = resolveDiagramOperationCompatibilityMode('save-mermaid', 'best-fit');
        expect(compatibilityMode).toBe('legacy-mermaid');
    });

    test('applies explicit overrides ahead of plugin defaults for maintainer dispatch', () => {
        const input = buildDiagramOperationInput({
            sourcePath: 'Notes/Topic.md',
            sourceMarkdown: '# Topic',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: 'flowchart',
                experimentalDiagramCompatibilityMode: 'legacy-mermaid',
                summarizeToMermaidLanguage: 'en'
            },
            requestedIntentOverride: 'erDiagram',
            compatibilityModeOverride: 'best-fit',
            targetLanguageOverride: 'zh-CN'
        });

        expect(input.requestedIntent).toBe('erDiagram');
        expect(input.compatibilityMode).toBe('best-fit');
        expect(input.targetLanguage).toBe('zh-CN');
    });

    test('ignores render target preferences for mermaid output mode', () => {
        const input = buildDiagramOperationInput({
            sourcePath: 'Notes/Topic.md',
            sourceMarkdown: '# Topic',
            executionMode: 'save-mermaid',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: 'flowchart',
                preferredDiagramRenderTarget: 'editable-html-svg',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        });

        expect(input.outputMode).toBe('mermaid');
        expect(input.compatibilityMode).toBe('legacy-mermaid');
        expect(input.requestedRenderTarget).toBeUndefined();
    });

    test('accepts Draw.io and Drawnix render target preferences for artifact mode', () => {
        for (const preferredDiagramRenderTarget of ['drawio', 'drawnix'] as const) {
            const input = buildDiagramOperationInput({
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                executionMode: 'save-artifact',
                settings: {
                    ...mockSettings,
                    preferredDiagramRenderTarget,
                    experimentalDiagramCompatibilityMode: 'best-fit'
                }
            });

            expect(input.requestedRenderTarget).toBe(preferredDiagramRenderTarget);
        }
    });
});
