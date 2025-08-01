import { NotemdSettings } from '../../types';

export const mockSettings: NotemdSettings = {
    chunkWordCount: 3000,
    maxTokens: 4096,
    enableDuplicateDetection: true,
    processMode: 'single',
    providers: [{ name: 'DeepSeek', apiKey: 'test', baseUrl: 'test', model: 'test', temperature: 0.5 }],
    activeProvider: 'DeepSeek',
    useCustomConceptNoteFolder: true,
    conceptNoteFolder: 'Concepts',
    useCustomProcessedFileFolder: false,
    processedFileFolder: '',
    generateConceptLogFile: false,
    useCustomConceptLogFolder: false,
    conceptLogFolderPath: '',
    useCustomConceptLogFileName: false,
    conceptLogFileName: 'Generate.log',
    moveOriginalFileOnProcess: false,
    tavilyApiKey: '',
    searchProvider: 'tavily',
    ddgMaxResults: 5,
    ddgFetchTimeout: 15,
    maxResearchContentTokens: 3000,
    enableResearchInGenerateContent: false,
    tavilyMaxResults: 5,
    tavilySearchDepth: 'basic',
    useMultiModelSettings: false,
    addLinksProvider: 'DeepSeek',
    researchProvider: 'DeepSeek',
    generateTitleProvider: 'DeepSeek',
    enableStableApiCall: false,
    apiCallInterval: 5,
    apiCallMaxRetries: 3,
    useCustomAddLinksSuffix: false,
    addLinksCustomSuffix: '',
    useCustomGenerateTitleOutputFolder: false,
    generateTitleOutputFolderName: '_complete',
    duplicateCheckScopeMode: 'vault',
    duplicateCheckScopePaths: '',
    removeCodeFencesOnAddLinks: false,
    language: 'en',
    availableLanguages: [{ code: 'en', name: 'English' }],
    useDifferentLanguagesForTasks: false,
    generateTitleLanguage: 'en',
    researchSummarizeLanguage: 'en',
    addLinksLanguage: 'en',
    summarizeToMermaidLanguage: 'en',
    enableGlobalCustomPrompts: false,
    useCustomPromptForAddLinks: false,
    customPromptAddLinks: '',
    useCustomPromptForGenerateTitle: false,
    customPromptGenerateTitle: '',
    useCustomPromptForResearchSummarize: false,
    customPromptResearchSummarize: '',
    translateProvider: 'DeepSeek',
    useCustomTranslationSuffix: false,
    translationCustomSuffix: '_translated',
    useCustomTranslationSavePath: false,
    translationSavePath: 'translations',
    summarizeToMermaidProvider: 'DeepSeek',
    summarizeToMermaidModel: '',
    useCustomPromptForSummarizeToMermaid: false,
    customPromptSummarizeToMermaid: '',
    useCustomSummarizeToMermaidSuffix: false,
    summarizeToMermaidCustomSuffix: '_summ',
    useCustomSummarizeToMermaidSavePath: false,
    summarizeToMermaidSavePath: '',
    translateSummarizeToMermaidOutput: false,
    enableFocusedLearning: false,
    focusedLearningDomain: ''
};
