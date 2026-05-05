import { TFile } from 'obsidian';
import * as llmUtils from '../llmUtils';
import { extractOriginalText } from '../extractOriginalText';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

const reporter: ProgressReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() {
        return false;
    },
    activeTasks: 0,
    updateActiveTasks: jest.fn(),
    abortController: new AbortController()
};

describe('extractOriginalText', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns a structured extraction result and leaves success notice to the host layer', async () => {
        const file = {
            path: 'Notes/Topic.md',
            basename: 'Topic',
            name: 'Topic.md',
            parent: { path: 'Notes' }
        } as TFile;

        const plugin = {
            settings: {
                ...mockSettings,
                extractQuestions: 'Question one?\nQuestion two?'
            },
            getProviderAndModelForTask: jest.fn(() => ({
                provider: mockSettings.providers[0],
                modelName: mockSettings.providers[0].model
            })),
            getPromptForTask: jest.fn((_taskKey: string, replacements?: Record<string, string>) => replacements?.USER_INPUT || '')
        };

        (mockApp.vault.read as jest.Mock).mockResolvedValue('Reference content');
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(llmUtils, 'callLLM').mockResolvedValue('Extracted answer');

        const result = await extractOriginalText(mockApp, plugin as any, file, reporter);

        expect(result).toEqual({
            sourcePath: 'Notes/Topic.md',
            outputPath: 'Notes/Topic_Extracted.md',
            outputDirectory: 'Notes',
            outputSuffix: '_Extracted',
            questionCount: 2,
            mergedMode: false
        });
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Topic_Extracted.md',
            'Extracted answer\n\nExtracted answer'
        );
    });
});
