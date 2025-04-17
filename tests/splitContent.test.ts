import NotemdPlugin from '../main';
import { App } from 'obsidian';

// Mock App class
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

describe('splitContent', () => {
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
      processedFileFolder: ''
    };
  });

  it('should split content into chunks based on word count', () => {
    const content = 'word '.repeat(5000);
    const chunks = plugin.splitContent(content);
    expect(chunks.length).toBe(1); // Content is not split due to no paragraph breaks
    expect(chunks[0].split(/\s+/).length).toBe(5000);
  });

  it('should preserve paragraph boundaries when splitting', () => {
    const para1 = 'para1\n\n';
    const para2 = 'para2\n\n';
    const para3 = 'para3';
    const content = para1 + para2 + para3;
    const chunks = plugin.splitContent(content);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(content);
  });

  it('should handle empty content', () => {
    const chunks = plugin.splitContent('');
    expect(chunks.length).toBe(0);
  });
});
