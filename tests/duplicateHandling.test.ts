import NotemdPlugin from '../main';
import { App } from 'obsidian';
import { findDuplicates, handleDuplicates } from '../fileUtils'; // Import the functions

class MockApp {
  vault = {
    getMarkdownFiles: jest.fn(() => []),
    getAbstractFileByPath: jest.fn(),
    read: jest.fn(),
    modify: jest.fn(),
    create: jest.fn(),
    createFolder: jest.fn(),
    getAllLoadedFiles: jest.fn(() => []),
    on: jest.fn()
  };
  workspace = {
    getActiveFile: jest.fn()
  };
}

describe('Duplicate Handling', () => {
  let plugin: NotemdPlugin;
  
  beforeEach(() => {
    const mockApp = new MockApp() as unknown as App;
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
      chunkWordCount: 3000,
      maxTokens: 4096,
      enableDuplicateDetection: true,
      processMode: 'single',
      providers: [],
      activeProvider: 'DeepSeek',
			// New settings defaults for tests
			useCustomConceptNoteFolder: false,
			conceptNoteFolder: '',
			useCustomProcessedFileFolder: false,
			processedFileFolder: '',
			// Add defaults for the new log settings
			generateConceptLogFile: false,
			useCustomConceptLogFolder: false,
			conceptLogFolderPath: '',
			useCustomConceptLogFileName: false,
			conceptLogFileName: 'Generate.log',
			// Add missing properties from recent updates
			moveOriginalFileOnProcess: false,
			tavilyApiKey: '',
			searchProvider: 'tavily',
			ddgMaxResults: 5,
			ddgFetchTimeout: 15,
			maxResearchContentTokens: 3000,
			enableResearchInGenerateContent: false, // Add the new setting for tests
			tavilyMaxResults: 5, // Add default for test
      tavilySearchDepth: 'basic', // Add default for test
      // Add missing multi-model and stable API call settings
      useMultiModelSettings: false,
      addLinksProvider: 'DeepSeek',
      researchProvider: 'DeepSeek',
      generateTitleProvider: 'DeepSeek',
      enableStableApiCall: false,
            apiCallInterval: 5,
            apiCallMaxRetries: 3,
            // Added missing properties from TS errors
            useCustomAddLinksSuffix: false,
            addLinksCustomSuffix: '',
            useCustomGenerateTitleOutputFolder: false,
            generateTitleOutputFolderName: '_complete',
            // Add missing duplicate check scope settings
            duplicateCheckScopeMode: 'vault',
            duplicateCheckScopePaths: '',
            removeCodeFencesOnAddLinks: false, // Added missing property for tests
            language: 'en', // Added missing property
            availableLanguages: [{ code: 'en', name: 'English' }], // Added missing property
            // Custom Prompt Settings Defaults
            enableGlobalCustomPrompts: false,
            useCustomPromptForAddLinks: false,
            customPromptAddLinks: '',
            useCustomPromptForGenerateTitle: false,
            customPromptGenerateTitle: '',
            useCustomPromptForResearchSummarize: false,
            customPromptResearchSummarize: '',
            
        };
        // Removed corrupted line: plugin.app = mockApp as annckApp after settings
	});

	describe('findDuplicates', () => { // Corrected describe block
    it('should find duplicate words in content', () => {
      const content = "word word another test test";
      const duplicates = findDuplicates(content); // Call imported function
      expect(duplicates.size).toBe(2);
      expect(duplicates.has('word')).toBe(true);
      expect(duplicates.has('test')).toBe(true);
    });

    it('should ignore case and punctuation', () => {
      const content = "Word, word! Test test.";
      const duplicates = findDuplicates(content); // Call imported function
      expect(duplicates.size).toBe(2);
    });

    it('should ignore short words', () => {
      const content = "a a b b the the";
      const duplicates = findDuplicates(content); // Call imported function
      // The implementation actually counts duplicates, not unique words
      expect(duplicates.size).toBe(1); // Only 'the' is long enough (3+ chars)
    });
  });

  describe('handleDuplicates', () => {
    it('should detect and report duplicates', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const content = "duplicate duplicate";
      await handleDuplicates(content, plugin.settings); // Call imported function, pass settings
      // Match the actual console output format
      expect(consoleSpy).toHaveBeenCalledWith(
        "Potential duplicate/consistency issues found in content:",
        expect.arrayContaining([expect.stringContaining('duplicate')])
      );
    });

    it('should respect disabled duplicate detection', async () => {
      plugin.settings.enableDuplicateDetection = false;
      const consoleSpy = jest.spyOn(console, 'log');
      await handleDuplicates("test test", plugin.settings); // Call imported function, pass settings
      // The implementation logs a message when disabled
      expect(consoleSpy).toHaveBeenCalledWith(
        "Duplicate detection is disabled in settings."
      );
    });
  });
});
