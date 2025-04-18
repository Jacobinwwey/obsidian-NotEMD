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

describe('processContentWithLLM', () => {
  let plugin: NotemdPlugin;
  // Create a mock progress reporter
  const mockReporter = {
    log: jest.fn(),
    updateStatus: jest.fn(),
    requestCancel: jest.fn(),
    clearDisplay: jest.fn(),
    get cancelled() { return false; } // Default to not cancelled for tests
  };
  
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
      providers: [{
        name: 'DeepSeek',
        apiKey: 'test',
        baseUrl: 'http://test',
        model: 'test',
        temperature: 0.5
      }],
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
      conceptLogFileName: 'Generate.log'
    };
  });

  it('should process content through LLM and return enhanced content', async () => {
    const mockResponse = "Processed content with [[links]]";
    // Create a proper mock Response
    const mockResponseObj = new Response(JSON.stringify({
      choices: [{message: {content: mockResponse}}]
    }), {
      status: 200,
      statusText: 'OK',
      headers: new Headers()
    });
    
    global.fetch = jest.fn(() => Promise.resolve(mockResponseObj));

    const content = "Test content";
    // Pass the mock reporter
    const result = await plugin.processContentWithLLM(content, mockReporter);
    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalled();
    // Optionally check if reporter methods were called (if needed)
    // expect(mockReporter.log).toHaveBeenCalled();
    // expect(mockReporter.updateStatus).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API error'))
    );

    // Pass the mock reporter
    await expect(plugin.processContentWithLLM("test", mockReporter))
      .rejects
      .toThrow('API error');
  });
});
