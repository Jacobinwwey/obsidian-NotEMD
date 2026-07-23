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

    test('accepts source-plus-preview render target preferences for artifact mode', () => {
        for (const preferredDiagramRenderTarget of ['drawio', 'drawnix', 'circuitikz'] as const) {
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

    test('resolves an automatic diagram type to circuit when CircuitikZ is selected', () => {
        const input = buildDiagramOperationInput({
            sourceMarkdown: '画一个共源 NMOS 放大器',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: undefined,
                preferredDiagramRenderTarget: 'circuitikz',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        });

        expect(input.requestedIntent).toBe('circuit');
        expect(input.requestedRenderTarget).toBe('circuitikz');
    });

    test('resolves an automatic diagram type to the dedicated Drawnix knowledge-map intent', () => {
        const input = buildDiagramOperationInput({
            sourceMarkdown: '# Architecture',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: undefined,
                preferredDiagramRenderTarget: 'drawnix',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        });

        expect(input.requestedIntent).toBe('drawnixMindmap');
        expect(input.requestedRenderTarget).toBe('drawnix');
    });

    test('rejects a non-circuit diagram type paired with CircuitikZ', () => {
        expect(() => buildDiagramOperationInput({
            sourceMarkdown: 'Draw a release flow.',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: 'flowchart',
                preferredDiagramRenderTarget: 'circuitikz',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        })).toThrow(/CircuitikZ source format requires the circuit diagram type/i);
    });

    test('rejects a generic diagram type paired with Drawnix knowledge-map output', () => {
        expect(() => buildDiagramOperationInput({
            sourceMarkdown: 'Draw a release flow.',
            executionMode: 'save-artifact',
            settings: {
                ...mockSettings,
                preferredDiagramIntent: 'flowchart',
                preferredDiagramRenderTarget: 'drawnix',
                experimentalDiagramCompatibilityMode: 'best-fit'
            }
        })).toThrow(/Drawnix source format requires the Drawnix knowledge-map diagram type/i);
    });
});
