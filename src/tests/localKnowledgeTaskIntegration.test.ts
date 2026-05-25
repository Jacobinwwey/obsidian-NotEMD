jest.mock('../llmUtils', () => ({
    callLLM: jest.fn(),
    getDebugInfo: jest.fn(() => '')
}));

jest.mock('../searchUtils', () => {
    const actual = jest.requireActual('../searchUtils');
    return {
        ...actual,
        _performResearch: jest.fn()
    };
});

import { TFile } from 'obsidian';
import { generateContentForTitle } from '../fileUtils';
import { researchAndSummarize, researchAndSummarizeFile, _performResearch } from '../searchUtils';
import { runDiagramGenerateOperation } from '../operations/diagramGenerateOperation';
import { callLLM } from '../llmUtils';
import { mockSettings } from './__mocks__/settings';
import { mockApp } from './__mocks__/app';
import { ProgressReporter } from '../types';

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

function createFile(path: string): TFile {
    const name = path.split('/').pop() || path;
    return Object.assign(new (TFile as any)(), {
        path,
        name,
        extension: 'md',
        basename: name.replace(/\.[^.]+$/, ''),
        parent: { path: path.split('/').slice(0, -1).join('/') || '/' }
    });
}

describe('local knowledge integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('');
    });

    test('generateContentForTitle injects supplemental local knowledge only when the caller enables it', async () => {
        const file = createFile('Notes/Topic.md');
        const reporter = createReporter();
        const buildContext = jest.fn(() => 'Path: Knowledge/Reference.md\nExcerpt: Relevant local context.');
        (callLLM as jest.Mock).mockResolvedValue('## Topic\nGenerated content');

        await generateContentForTitle(mockApp as any, mockSettings, file, reporter, {
            enableLocalKnowledge: true,
            localKnowledgeRetriever: {
                buildContext,
                indexedFileCount: 1,
                indexedSectionCount: 1
            } as any
        });

        expect(buildContext).toHaveBeenCalledWith('Topic', expect.objectContaining({
            currentFilePath: 'Notes/Topic.md',
            slidingWindowSize: mockSettings.localKnowledgeSlidingWindowSize
        }));
        expect(callLLM).toHaveBeenCalledWith(
            expect.anything(),
            '',
            expect.stringContaining('Relevant local context.'),
            mockSettings,
            reporter,
            expect.any(String)
        );
    });

    test('researchAndSummarize can continue with local knowledge context even when web research returns no results', async () => {
        const reporter = createReporter();
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const file = createFile('Notes/Topic.md');
            const editor = {
                getSelection: jest.fn(() => ''),
                replaceSelection: jest.fn(),
                getValue: jest.fn(() => '# Topic'),
                setValue: jest.fn()
            } as any;
            const view = { file } as any;
            (_performResearch as jest.Mock).mockResolvedValue(null);
            (callLLM as jest.Mock).mockResolvedValue('Local summary');
            (mockApp.vault.getFiles as jest.Mock).mockReturnValue([createFile('Knowledge/Reference.md')]);
            (mockApp.vault.read as jest.Mock).mockImplementation(async (target: TFile) => {
                if (target.path === 'Knowledge/Reference.md') {
                    return '# Reference\n## Topic\nLocal supporting evidence.';
                }
                return '# Topic';
            });

            await researchAndSummarize(mockApp as any, {
                ...mockSettings,
                enableLocalKnowledgeRetrieval: true,
                localKnowledgeBasePaths: 'Knowledge',
                localKnowledgeTopK: 1,
                localKnowledgeSlidingWindowSize: 0,
                localKnowledgeMaxSnippetChars: 120,
                enableLocalKnowledgeForResearchSummarize: true
            } as any, editor, view, reporter);

            expect(callLLM).toHaveBeenCalledWith(
                expect.anything(),
                '',
                expect.stringContaining('Local supporting evidence.'),
                expect.anything(),
                reporter,
                expect.any(String)
            );
            expect(editor.setValue).toHaveBeenCalledWith(expect.stringContaining('Local summary'));
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test('researchAndSummarizeFile appends summary directly through vault writes for CLI-style execution', async () => {
        const reporter = createReporter();
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const file = createFile('Notes/Topic.md');
            (_performResearch as jest.Mock).mockResolvedValue(null);
            (callLLM as jest.Mock).mockResolvedValue('CLI local summary');
            (mockApp.vault.getFiles as jest.Mock).mockReturnValue([createFile('Knowledge/Reference.md')]);
            (mockApp.vault.read as jest.Mock).mockImplementation(async (target: TFile) => {
                if (target.path === 'Knowledge/Reference.md') {
                    return '# Reference\n## Topic\nLocal CLI evidence.';
                }
                return '# Topic';
            });

            const result = await researchAndSummarizeFile(mockApp as any, {
                ...mockSettings,
                enableLocalKnowledgeRetrieval: true,
                localKnowledgeBasePaths: 'Knowledge',
                localKnowledgeTopK: 1,
                localKnowledgeSlidingWindowSize: 0,
                localKnowledgeMaxSnippetChars: 120,
                enableLocalKnowledgeForResearchSummarize: true
            } as any, file, reporter, 'Topic');

            expect(callLLM).toHaveBeenCalledWith(
                expect.anything(),
                '',
                expect.stringContaining('Local CLI evidence.'),
                expect.anything(),
                reporter,
                expect.any(String)
            );
            expect(mockApp.vault.modify).toHaveBeenCalledWith(
                file,
                expect.stringContaining('## Research Summary (via Local KB): Topic')
            );
            expect(result).toEqual(expect.objectContaining({
                sourcePath: 'Notes/Topic.md',
                outputPath: 'Notes/Topic.md',
                topic: 'Topic',
                sourceLabel: 'Local KB',
                localKnowledgeContextUsed: true,
                appended: true
            }));
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test('runDiagramGenerateOperation forwards supplemental local knowledge to the LLM source payload', async () => {
        const reporter = createReporter();
        const llmCall = jest.fn().mockResolvedValue('{"intent":"flowchart","title":"Topic","nodes":[],"edges":[],"sections":[],"callouts":[],"dataSeries":[],"layoutHints":{},"sourceLanguage":"en","outputLanguage":"en","evidenceRefs":[]}');
        const generateDiagramArtifactImpl = jest.fn().mockResolvedValue({
            plan: {
                intent: 'flowchart',
                confidence: 1,
                reasons: [],
                renderTarget: 'mermaid',
                fallbackTargets: [],
                mermaidDiagramType: null,
                legacyCompatibilityMode: false
            },
            spec: {
                intent: 'flowchart',
                title: 'Topic',
                nodes: [],
                edges: [],
                sections: [],
                callouts: [],
                dataSeries: [],
                layoutHints: {},
                sourceLanguage: 'en',
                outputLanguage: 'en',
                evidenceRefs: []
            },
            artifact: {
                target: 'mermaid',
                content: 'graph TD\nA-->B',
                mimeType: 'text/vnd.mermaid',
                sourceIntent: 'flowchart'
            }
        });

        await runDiagramGenerateOperation({
            input: {
                sourcePath: 'Notes/Topic.md',
                sourceMarkdown: '# Topic',
                compatibilityMode: 'best-fit',
                outputMode: 'artifact',
                targetLanguage: 'en',
                localKnowledgeContext: 'Path: Knowledge/Reference.md\nExcerpt: Deployment topology.'
            },
            settings: mockSettings,
            provider: mockSettings.providers[0],
            modelName: mockSettings.providers[0].model,
            reporter,
            getLegacyMermaidPrompt: () => 'legacy',
            callLLMImpl: llmCall as any,
            generateDiagramArtifactImpl: generateDiagramArtifactImpl as any
        });

        expect(generateDiagramArtifactImpl).toHaveBeenCalledWith(
            expect.stringContaining('Deployment topology.'),
            expect.objectContaining({
                compatibilityMode: 'best-fit'
            })
        );
    });
});
