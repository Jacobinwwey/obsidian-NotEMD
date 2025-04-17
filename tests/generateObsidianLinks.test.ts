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
      processedFileFolder: ''
    };
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

    it('should filter out invalid links', () => {
      const content = "Valid: [[AI]] Invalid: [[123]] [[ ]]";
      const result = plugin.generateObsidianLinks(content);
      expect(result).toContain('[[AI]]');
      // Update expectations since filtering was removed
      expect(result).toContain('[[123]]');
      expect(result).toContain('[[ ]]');
    });
});
