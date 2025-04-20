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

describe('generateObsidianLinks', () => {
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
    plugin.app = mockApp; // Explicitly assign the mock app instance
    plugin.settings = {
      chunkWordCount: 3000,
      maxTokens: 4096,
      enableDuplicateDetection: true,
      processMode: 'single',
      providers: [],
      activeProvider: 'DeepSeek',
      // New settings defaults for tests, enabling concept notes for this test
      useCustomConceptNoteFolder: true,
      conceptNoteFolder: 'concepts', // Use the value from the old setting
      useCustomProcessedFileFolder: false,
      processedFileFolder: '',
      // Add defaults for the new log settings
      generateConceptLogFile: false,
      useCustomConceptLogFolder: false,
      conceptLogFolderPath: '',
      useCustomConceptLogFileName: false,
<<<<<<< HEAD
      conceptLogFileName: 'Generate.log'
    };
=======
      conceptLogFileName: 'Generate.log',
      moveOriginalFileOnProcess: false, // Add missing property
      tavilyApiKey: '', // Add the new Tavily API key setting
      searchProvider: 'tavily', // Add the new search provider setting
      ddgMaxResults: 5, // Add default for test
      ddgFetchTimeout: 15, // Add default for test
      maxResearchContentTokens: 3000, // Add default for test
      enableResearchInGenerateContent: false, // Add the new setting for tests
      tavilyMaxResults: 5, // Add default for test
      tavilySearchDepth: 'basic' // Add default for test
    };
     // Mock createConceptNotes to return a resolved promise
     plugin.createConceptNotes = jest.fn().mockResolvedValue(undefined);
>>>>>>> add-LMCG
  });

  it('should extract concepts from LLM output and generate links', () => {
    const content = `This is about [[AI]] and [[machine learning]].`;
    const result = plugin.generateObsidianLinks(content);
    expect(result).toBe(content);
  });

  it('should handle content with no links', () => {
    const content = 'This has no links';
    const result = plugin.generateObsidianLinks(content);
    expect(result).toBe(content);
  });

<<<<<<< HEAD
    it('should filter out invalid links', () => {
      const content = "Valid: [[AI]] Invalid: [[123]] [[ ]]";
      const result = plugin.generateObsidianLinks(content);
      expect(result).toContain('[[AI]]');
      // Update expectations since filtering was removed
      expect(result).toContain('[[123]]');
      expect(result).toContain('[[ ]]');
=======
    it('should return original content and trigger concept note creation', () => {
      const content = "Valid: [[AI]] Invalid: [[123]] [[ ]] Also [[Machine Learning]].";
      const result = plugin.generateObsidianLinks(content);

      // Expect the original content to be returned
      expect(result).toBe(content);

      // Expect createConceptNotes to have been called with valid concepts
      expect(plugin.createConceptNotes).toHaveBeenCalledTimes(1);
      const expectedConcepts = new Set(['AI', 'Machine Learning']);
      expect(plugin.createConceptNotes).toHaveBeenCalledWith(expectedConcepts);
    });

    it('should not trigger concept note creation if setting is disabled', () => {
        plugin.settings.useCustomConceptNoteFolder = false; // Disable setting
        const content = "Link: [[Concept]]";
        const result = plugin.generateObsidianLinks(content);
        expect(result).toBe(content);
        expect(plugin.createConceptNotes).not.toHaveBeenCalled();
    });

     it('should not trigger concept note creation if folder path is empty', () => {
        plugin.settings.conceptNoteFolder = ''; // Empty path
        const content = "Link: [[Concept]]";
        const result = plugin.generateObsidianLinks(content);
        expect(result).toBe(content);
        expect(plugin.createConceptNotes).not.toHaveBeenCalled();
    });

     it('should not trigger concept note creation if no valid concepts found', () => {
        const content = "Invalid links: [[1]] [[]]";
        const result = plugin.generateObsidianLinks(content);
        expect(result).toBe(content);
        expect(plugin.createConceptNotes).not.toHaveBeenCalled();
>>>>>>> add-LMCG
    });
});
