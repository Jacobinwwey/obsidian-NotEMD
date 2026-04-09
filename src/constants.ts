import { NotemdSettings } from './types';
import { createDefaultProviders } from './llmProviders';
import { DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL } from './workflowButtons';

// Default settings for the plugin
export const DEFAULT_SETTINGS: NotemdSettings = {
    providers: createDefaultProviders(),
    activeProvider: 'DeepSeek',
    // Concept Note Defaults
    useCustomConceptNoteFolder: false,
    conceptNoteFolder: '',
    // Processed File Defaults
    useCustomProcessedFileFolder: false,
    processedFileFolder: '',
    // Concept Log File Defaults - START
    generateConceptLogFile: false,
    useCustomConceptLogFolder: false,
    conceptLogFolderPath: '',
    useCustomConceptLogFileName: false,
    conceptLogFileName: 'Generate.log',
    // Concept Log File Defaults - END
    // Other Defaults
    chunkWordCount: 3000,
    maxTokens: 8192, // Default max tokens for LLM response
    enableDuplicateDetection: true, // Enable by default
    processMode: 'single',
    moveOriginalFileOnProcess: false, // Default to creating copies
    tavilyApiKey: '', // Default Tavily API Key to empty
    searchProvider: 'tavily', // Default search provider
    ddgMaxResults: 5, // Default max results for DuckDuckGo
    ddgFetchTimeout: 15, // Default timeout (seconds) for fetching DDG result content
    maxResearchContentTokens: 3000, // Default token limit for research content
    enableResearchInGenerateContent: false, // Default to false: Generate from Title does NOT research by default
    tavilyMaxResults: 5, // Default Tavily max results
    tavilySearchDepth: 'basic', // Default Tavily search depth
    // Multi-model defaults
    useMultiModelSettings: false, // Default to using the single activeProvider
    addLinksProvider: 'DeepSeek', // Default to the primary activeProvider initially
    researchProvider: 'DeepSeek', // Default to the primary activeProvider initially
    generateTitleProvider: 'DeepSeek', // Default to the primary activeProvider initially
    translateProvider: 'DeepSeek',
    extractConceptsProvider: 'DeepSeek',
    // Stable API Call Defaults
    enableStableApiCall: false, // Default to disabled
    apiCallInterval: 5, // Default interval 5 seconds
    apiCallMaxRetries: 3, // Default max 3 retries
    // API Debugging
    enableApiErrorDebugMode: false,
    // Developer diagnostics
    enableDeveloperMode: false,
    developerDiagnosticCallMode: 'runtime-stable',
    developerDiagnosticStabilityRuns: 3,
    developerDiagnosticTimeoutMs: 10 * 60 * 1000,
    // Task-specific model defaults (empty means use provider's default)
    addLinksModel: '',
    researchModel: '',
    generateTitleModel: '',
    translateModel: '',
    summarizeToMermaidModel: '',
    extractConceptsModel: '',
    // Custom Add Links Output Filename Defaults
    useCustomAddLinksSuffix: false, // Default to standard '_processed.md' suffix
    addLinksCustomSuffix: '', // Default custom suffix is empty (relevant only if toggle is on)
    // Custom Translation Output Filename Defaults
    useCustomTranslationSuffix: false,
    translationCustomSuffix: '_translated',
    useCustomTranslationSavePath: false, // Default: save in the same folder
    translationSavePath: '', // Default path is empty when custom path is disabled
    // Custom Generate from Title Output Folder Defaults
    useCustomGenerateTitleOutputFolder: false, // Default to using '[foldername]_complete'
    generateTitleOutputFolderName: '_complete', // Default folder name if custom is enabled but empty
    // Custom Duplicate Check Scope Defaults (Refined)
    duplicateCheckScopeMode: 'vault', // Default to checking the entire vault
    duplicateCheckScopePaths: '', // Default to empty list of paths
    // Extract Concepts Task Defaults
    extractConceptsMinimalTemplate: true,
    extractConceptsAddBacklink: false,
    // Add Links Post-Processing Defaults
    removeCodeFencesOnAddLinks: false, // Default to NOT removing code fences
    // Language Settings Defaults
    uiLocale: 'auto',
    language: 'en', // Default to English
    availableLanguages: [ // Default list of available languages
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'zh-CN', name: '简体中文' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'ru', name: 'Русский' },
        { code: 'ar', name: 'العربية' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'bn', name: 'বাংলা' },
        { code: 'nl', name: 'Nederlands' },
        { code: 'sv', name: 'Svenska' },
        { code: 'fi', name: 'Suomi' },
        { code: 'da', name: 'Dansk' },
        { code: 'no', name: 'Norsk' },
        { code: 'pl', name: 'Polski' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'he', name: 'עברית' },
        { code: 'th', name: 'ไทย' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'cs', name: 'Čeština' },
        { code: 'hu', name: 'Magyar' },
        { code: 'ro', name: 'Română' },
        { code: 'uk', name: 'Українська' },
        { code: 'vi', name: 'Tiếng Việt' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'ms', name: 'Bahasa Melayu' }
    ],
    useDifferentLanguagesForTasks: false,
    generateTitleLanguage: 'en',
    researchSummarizeLanguage: 'en',
    addLinksLanguage: 'en',
    summarizeToMermaidLanguage: 'en',
    extractConceptsLanguage: 'en',
    // Custom Prompt Settings Defaults
    enableGlobalCustomPrompts: false,
    useCustomPromptForAddLinks: false,
    customPromptAddLinks: '',
    useCustomPromptForGenerateTitle: false,
    customPromptGenerateTitle: '',
    useCustomPromptForResearchSummarize: false,
    customPromptResearchSummarize: '',
    summarizeToMermaidProvider: 'DeepSeek',
    useCustomPromptForSummarizeToMermaid: false,
    customPromptSummarizeToMermaid: '',
    useCustomPromptForExtractConcepts: false,
    customPromptExtractConcepts: '',
    useCustomPromptForTranslate: false,
    translatePrompt: '',
    translateSummarizeToMermaidOutput: false,
    useCustomSummarizeToMermaidSuffix: false,
    summarizeToMermaidCustomSuffix: '_summ',
    useCustomSummarizeToMermaidSavePath: false,
    summarizeToMermaidSavePath: '',
    // Focused Learning Domain
    enableFocusedLearning: false,
    focusedLearningDomain: '',
    disableAutoTranslation: false,
    // Batch processing settings
    enableBatchParallelism: false,
    batchConcurrency: 1,
    batchSize: 50,
    batchInterDelayMs: 1000,
    apiCallIntervalMs: 500,
    autoMermaidFixAfterGenerate: true,
    customWorkflowButtonsDsl: DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL,
    customWorkflowErrorStrategy: 'stop_on_error',
    extractQuestions: '',
    extractOriginalTextProvider: 'DeepSeek',
    extractOriginalTextModel: '',
    extractOriginalTextLanguage: 'en',
    extractOriginalTextMergedMode: false,
    translateExtractOriginalTextOutput: false,
    extractOriginalTextUseCustomOutput: false,
    extractOriginalTextCustomPath: '',
    extractOriginalTextCustomSuffix: '_Extracted',
    useCustomPromptForExtractOriginalText: false,
    customPromptExtractOriginalText: '',
    enableMermaidErrorDetection: false,
    moveMermaidErrorFiles: false,
    mermaidErrorFolderPath: 'MermaidErrors',
};

// Constants for the Sidebar View
export const NOTEMD_SIDEBAR_VIEW_TYPE = "notemd-sidebar-view";
export const NOTEMD_SIDEBAR_DISPLAY_TEXT = "Notemd Processor";
export const NOTEMD_SIDEBAR_ICON = "wand"; // Example icon
