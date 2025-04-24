import { NotemdSettings, LLMProviderConfig } from './types';

// Default settings for the plugin
export const DEFAULT_SETTINGS: NotemdSettings = {
    providers: [
        {
            name: 'DeepSeek',
            apiKey: '',
            baseUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-reasoner',
            temperature: 0.5
        },
        {
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        },
        {
            name: 'Anthropic',
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.5
        },
        {
            name: 'Google',
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1',
            model: 'gemini-2.0-flash-exp',
            temperature: 0.5
        },
        {
            name: 'Mistral',
            apiKey: '',
            baseUrl: 'https://api.mistral.ai/v1',
            model: 'mistral-large-latest',
            temperature: 0.5
        },
        {
            name: 'Azure OpenAI',
            apiKey: '',
            baseUrl: '',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        },
        {
            name: 'LMStudio',
            apiKey: 'EMPTY', // LMStudio often requires a placeholder
            baseUrl: 'http://localhost:1234/v1',
            model: 'local-model', // User needs to set this based on their loaded model
            temperature: 0.7
        },
        {
            name: 'Ollama',
            apiKey: '', // Ollama doesn't use API keys
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3', // User needs to set this based on their pulled models
            temperature: 0.7
        },
        {
            name: 'OpenRouter',
            apiKey: '', // Required
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'gryphe/mythomax-l2-13b', // Example model, user should change
            temperature: 0.7
        }
    ],
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
    maxTokens: 4096, // Default max tokens for LLM response
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
    // Stable API Call Defaults
    enableStableApiCall: false, // Default to disabled
    apiCallInterval: 5, // Default interval 5 seconds
    apiCallMaxRetries: 3, // Default max 3 retries
    // Task-specific model defaults (empty means use provider's default)
    addLinksModel: '',
    researchModel: '',
    generateTitleModel: '',
    // Custom Add Links Output Filename Defaults
    useCustomAddLinksSuffix: false, // Default to standard '_processed.md' suffix
    addLinksCustomSuffix: '', // Default custom suffix is empty (relevant only if toggle is on)
    // Custom Generate from Title Output Folder Defaults
    useCustomGenerateTitleOutputFolder: false, // Default to using '[foldername]_complete'
    generateTitleOutputFolderName: '_complete', // Default folder name if custom is enabled but empty
};

// Constants for the Sidebar View
export const NOTEMD_SIDEBAR_VIEW_TYPE = "notemd-sidebar-view";
export const NOTEMD_SIDEBAR_DISPLAY_TEXT = "Notemd Processor";
export const NOTEMD_SIDEBAR_ICON = "wand"; // Example icon
