// Configuration for a single LLM Provider
export interface LLMProviderConfig {
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    apiVersion?: string;  // Only used for Azure OpenAI
}

// Main settings structure for the plugin
export interface NotemdSettings {
    providers: LLMProviderConfig[];
    activeProvider: string;
    // Concept Note Settings
    useCustomConceptNoteFolder: boolean;
    conceptNoteFolder: string;
    // Processed File Settings
    useCustomProcessedFileFolder: boolean;
    processedFileFolder: string;
    // Concept Log File Settings
    generateConceptLogFile: boolean;
    useCustomConceptLogFolder: boolean;
    conceptLogFolderPath: string;
    useCustomConceptLogFileName: boolean;
    conceptLogFileName: string;
    // Other settings
    chunkWordCount: number;
    maxTokens: number;
    enableDuplicateDetection: boolean;
    processMode: string; // Keep for potential future use
    moveOriginalFileOnProcess: boolean;
    tavilyApiKey: string;
    searchProvider: 'tavily' | 'duckduckgo';
    ddgMaxResults: number;
    ddgFetchTimeout: number;
    maxResearchContentTokens: number;
    enableResearchInGenerateContent: boolean;
    tavilyMaxResults: number;
    tavilySearchDepth: 'basic' | 'advanced';
    // Multi-model settings
    useMultiModelSettings: boolean;
    addLinksProvider: string;
    researchProvider: string;
    generateTitleProvider: string;
    translateProvider: string;
    summarizeToMermaidProvider: string;
    extractConceptsProvider: string;
    // Stable API Call Settings
    enableStableApiCall: boolean;
    apiCallInterval: number;
    apiCallMaxRetries: number;
    // Task-specific models (used if useMultiModelSettings is true)
    addLinksModel?: string;
    researchModel?: string;
    generateTitleModel?: string;
    translateModel?: string;
    summarizeToMermaidModel?: string;
    extractConceptsModel?: string;
    // Custom Add Links Output Filename Settings
    useCustomAddLinksSuffix: boolean;
    addLinksCustomSuffix: string;
    // Custom Translation Output Filename Settings
    useCustomTranslationSuffix: boolean;
    translationCustomSuffix: string;
    useCustomTranslationSavePath: boolean; // New: Toggle for custom translation save path
    translationSavePath: string;
    // Custom Summarize to Mermaid Output Filename Settings
    useCustomSummarizeToMermaidSuffix: boolean;
    summarizeToMermaidCustomSuffix: string;
    useCustomSummarizeToMermaidSavePath: boolean;
    summarizeToMermaidSavePath: string;
    // Custom Generate from Title Output Folder Settings
    useCustomGenerateTitleOutputFolder: boolean; // Toggle for custom output folder
    generateTitleOutputFolderName: string; // The custom folder name (defaults to _complete)
    // Custom Duplicate Check Scope Settings (Refined)
    duplicateCheckScopeMode: 'vault' | 'include' | 'exclude' | 'concept_folder_only'; // Added 'concept_folder_only' mode
    duplicateCheckScopePaths: string; // New: Newline-separated list of paths for include/exclude modes
    // Extract Concepts Task Settings
    extractConceptsMinimalTemplate: boolean;
    extractConceptsAddBacklink: boolean;
    // Add Links Post-Processing
    removeCodeFencesOnAddLinks: boolean; // New: Option to remove ```markdown and ``` fences
    // Language Settings
    language: string; // Stores the selected language code (e.g., 'en', 'es', 'fr')
    availableLanguages: Array<{ code: string; name: string }>; // List of available languages
    useDifferentLanguagesForTasks: boolean;
    generateTitleLanguage: string;
    researchSummarizeLanguage: string;
    addLinksLanguage: string;
    summarizeToMermaidLanguage: string;
    extractConceptsLanguage: string;

    // Custom Prompt Settings
    enableGlobalCustomPrompts: boolean; // Master toggle for custom prompts""
    useCustomPromptForAddLinks: boolean;
    customPromptAddLinks: string;
    useCustomPromptForGenerateTitle: boolean;
    customPromptGenerateTitle: string;
    useCustomPromptForResearchSummarize: boolean;
    customPromptResearchSummarize: string;
    useCustomPromptForSummarizeToMermaid: boolean;
    customPromptSummarizeToMermaid: string;
    useCustomPromptForExtractConcepts: boolean;
    customPromptExtractConcepts: string;
    useCustomPromptForTranslate: boolean;
    translatePrompt: string;
    translateSummarizeToMermaidOutput: boolean;

    // Focused Learning Domain
    enableFocusedLearning: boolean;
    focusedLearningDomain: string;

    // Language / translation behavior
    disableAutoTranslation: boolean; // true => only explicit "Translate" task performs translation

    // Batch processing settings
    enableBatchParallelism: boolean;
    batchConcurrency: number;
    batchSize: number;
    batchInterDelayMs: number;
    apiCallIntervalMs: number;
    autoMermaidFixAfterGenerate: boolean;
    extractQuestions: string;
    extractOriginalTextProvider: string;
    extractOriginalTextModel: string;
    extractOriginalTextLanguage: string;
    translateExtractOriginalTextOutput: boolean;
    useCustomPromptForExtractOriginalText: boolean;
    customPromptExtractOriginalText: string;
}

// Defines the keys for tasks that can have custom prompts
export type TaskKey = 'addLinks' | 'generateTitle' | 'researchSummarize' | 'translate' | 'summarizeToMermaid' | 'extractConcepts' | 'extractOriginalText';

// Interface for search results
export interface SearchResult {
    title: string;
    url: string;
    content: string; // Snippet or fetched content
}

// Custom error types for better error handling
export class NotemdError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'NotemdError';
    }
}

// Network related error types
export class NetworkError extends NotemdError {
    constructor(
        message: string,
        public readonly code: 'NETWORK_ERROR' | 'API_ERROR' | 'TIMEOUT' | 'RATE_LIMIT' = 'NETWORK_ERROR',
        originalError?: Error
    ) {
        super(message, code, originalError);
        this.name = 'NetworkError';
    }
}

// File operation error types
export class FileOperationError extends NotemdError {
    constructor(
        message: string,
        public readonly code: 'FILE_NOT_FOUND' | 'FILE_ACCESS_DENIED' | 'FILE_ALREADY_EXISTS' | 'FILE_OPERATION_FAILED' = 'FILE_OPERATION_FAILED',
        originalError?: Error
    ) {
        super(message, code, originalError);
        this.name = 'FileOperationError';
    }
}

// Validation error types
export class ValidationError extends NotemdError {
    constructor(
        message: string,
        public readonly code: 'INVALID_INPUT' | 'INVALID_STATE' | 'INVALID_CONFIGURATION' = 'INVALID_INPUT',
        originalError?: Error
    ) {
        super(message, code, originalError);
        this.name = 'ValidationError';
    }
}

// API response types
export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
}

export interface TavilyResponse {
    results: TavilySearchResult[];
}

export interface DDGSearchResult {
    title: string;
    url: string;
    snippet: string;
}

// Interface for progress reporting (used by Modal and Sidebar View)
export interface ProgressReporter {
    log(message: string): void;
    updateStatus(text: string, percent?: number): void;
    requestCancel(): void;
    clearDisplay(): void;
    get cancelled(): boolean;
    // Property to hold the AbortController for the current fetch
    abortController?: AbortController | null;
    activeTasks: number; // NEW: For concurrency display
    updateActiveTasks(delta: number): void; // NEW
}