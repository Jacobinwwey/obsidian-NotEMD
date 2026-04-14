import NotemdPlugin from '../main';
import { ProgressReporter } from '../types';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as llmUtils from '../llmUtils';
import * as diagramGenerationService from '../diagram/diagramGenerationService';

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

describe('experimental mermaid pipeline integration', () => {
    let plugin: NotemdPlugin;
    let reporter: ProgressReporter;

    beforeEach(() => {
        jest.clearAllMocks();
        plugin = new NotemdPlugin(mockApp, {
            id: 'notemd-test',
            name: 'Notemd Test',
            version: '0.0.1',
            author: 'Test',
            description: 'Test plugin',
            isDesktopOnly: false,
            minAppVersion: '1.0.0'
        });
        plugin.settings = {
            ...mockSettings
        };
        reporter = createReporter();
    });

    test('uses legacy mermaid prompt path when experimental pipeline is disabled', async () => {
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');
        const experimentalSpy = jest.spyOn(diagramGenerationService, 'generateDiagramArtifact');

        const result = await (plugin as any).generateMermaidSummaryContent(
            '# Notes',
            plugin.settings.providers[0],
            'test-model',
            reporter
        );

        expect(result).toBe('legacy-output');
        expect(experimentalSpy).not.toHaveBeenCalled();
        expect(llmUtils.callLLM).toHaveBeenCalledTimes(1);
    });

    test('uses experimental pipeline result when enabled and successful', async () => {
        plugin.settings.enableExperimentalDiagramPipeline = true;
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockResolvedValue({
            plan: {
                intent: 'flowchart',
                confidence: 0.8,
                reasons: ['workflow detected'],
                renderTarget: 'mermaid',
                fallbackTargets: [],
                mermaidDiagramType: 'flowchart',
                legacyCompatibilityMode: true
            },
            spec: {
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate' },
                    { id: 'publish', label: 'Publish' }
                ],
                edges: [{ from: 'validate', to: 'publish' }]
            },
            artifact: {
                target: 'mermaid',
                content: '```mermaid\nflowchart TD\n```',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            }
        });
        const legacySpy = jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');

        const result = await (plugin as any).generateMermaidSummaryContent(
            '# Notes',
            plugin.settings.providers[0],
            'test-model',
            reporter
        );

        expect(result).toContain('flowchart TD');
        expect(legacySpy).not.toHaveBeenCalled();
    });

    test('falls back to legacy path when experimental pipeline fails', async () => {
        plugin.settings.enableExperimentalDiagramPipeline = true;
        jest.spyOn(diagramGenerationService, 'generateDiagramArtifact').mockRejectedValue(new Error('spec parse failed'));
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('legacy-output');

        const result = await (plugin as any).generateMermaidSummaryContent(
            '# Notes',
            plugin.settings.providers[0],
            'test-model',
            reporter
        );

        expect(result).toBe('legacy-output');
        expect(llmUtils.callLLM).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringMatching(/falling back/i));
    });
});
