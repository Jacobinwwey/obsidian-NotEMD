import NotemdPlugin from '../main';
import { App } from 'obsidian';

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
      tavilySearchDepth: 'basic' // Add default for test
		};
		plugin.app = mockApp as any; // Assign mockApp after settings
	});

	describe('findDuplicates', () => {
    it('should find duplicate words in content', () => {
      const content = "word word another test test";
      const duplicates = plugin.findDuplicates(content);
      expect(duplicates.size).toBe(2);
      expect(duplicates.has('word')).toBe(true);
      expect(duplicates.has('test')).toBe(true);
    });

    it('should ignore case and punctuation', () => {
      const content = "Word, word! Test test.";
      const duplicates = plugin.findDuplicates(content);
      expect(duplicates.size).toBe(2);
    });

    it('should ignore short words', () => {
      const content = "a a b b the the";
      const duplicates = plugin.findDuplicates(content);
      // The implementation actually counts duplicates, not unique words
      expect(duplicates.size).toBe(1); // Only 'the' is long enough (3+ chars)
    });
  });

  describe('handleDuplicates', () => {
    it('should detect and report duplicates', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const content = "duplicate duplicate";
      await plugin.handleDuplicates(content);
      // Match the actual console output format
      expect(consoleSpy).toHaveBeenCalledWith(
        "Potential duplicate/consistency issues found in content:",
        expect.arrayContaining([expect.stringContaining('duplicate')])
      );
    });

    it('should respect disabled duplicate detection', async () => {
      plugin.settings.enableDuplicateDetection = false;
      const consoleSpy = jest.spyOn(console, 'log');
      await plugin.handleDuplicates("test test");
      // The implementation logs a message when disabled
      expect(consoleSpy).toHaveBeenCalledWith(
        "Duplicate detection is disabled in settings."
      );
    });
  });
});
