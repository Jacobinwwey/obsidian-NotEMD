import NotemdPlugin from '../main';
import { App, TFile } from 'obsidian';
import { handleFileRename, handleFileDelete } from '../fileUtils'; // Import functions

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

describe('File Operations', () => {
  let plugin: NotemdPlugin;
  
  beforeEach(async () => {
    const mockApp = new MockApp() as unknown as App;
    // Create plugin instance and manually assign app
    plugin = new NotemdPlugin(mockApp, {
      id: 'notemd-test',
      name: 'Notemd Test',
      version: '0.0.1',
      author: 'Test',
      description: 'Test plugin',
      isDesktopOnly: false,
      minAppVersion: '1.0.0'
    });
    plugin.app = mockApp;
    plugin.loadData = jest.fn().mockResolvedValue({});
    plugin.saveData = jest.fn().mockResolvedValue(undefined);
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
        };
  });

  describe('handleFileRename', () => {
    it('should update backlinks when a file is renamed', async () => {
      const oldPath = 'old.md';
      const newPath = 'new.md';
      const oldName = 'old';
      const newName = 'new';

      // Mock files with backlinks
      const files = [
        { path: 'file1.md', content: '[[old]]' },
        { path: 'file2.md', content: '[[old]]' }
      ];

      plugin.app.vault.getMarkdownFiles = jest.fn(() => files.map(f => ({
        path: f.path,
        extension: 'md',
        basename: f.path.replace('.md',''),
        stat: { size: 0, ctime: 0, mtime: 0 },
        vault: plugin.app.vault,
        name: f.path.split('/').pop() || '',
        parent: null
      } /* Removed 'as unknown as TFile' */)));
      plugin.app.vault.read = jest.fn((file) =>
        Promise.resolve(files.find(f => f.path === file.path)?.content || '')
      );
      plugin.app.vault.modify = jest.fn();

      await handleFileRename(plugin.app, oldPath, newPath); // Call imported function

      expect(plugin.app.vault.modify).toHaveBeenCalledTimes(2);
      expect(plugin.app.vault.modify).toHaveBeenCalledWith(
        expect.anything(), 
        expect.stringContaining(`[[${newName}]]`)
      );
    });
  });

  describe('handleFileDelete', () => {
    it('should remove backlinks when a file is deleted', async () => {
      const path = 'deleted.md';
      const fileName = 'deleted';

      // Mock files with backlinks
      const files = [
        { path: 'file1.md', content: '- [[deleted]]' },
        { path: 'file2.md', content: '[[deleted]]' }
      ];

      plugin.app.vault.getMarkdownFiles = jest.fn(() => files.map(f => ({
        path: f.path,
        extension: 'md',
        basename: f.path.replace('.md',''),
        stat: { size: 0, ctime: 0, mtime: 0 },
        vault: plugin.app.vault,
        name: f.path.split('/').pop() || '',
        parent: null
      } /* Removed 'as unknown as TFile' */)));
      plugin.app.vault.read = jest.fn((file) =>
        Promise.resolve(files.find(f => f.path === file.path)?.content || '')
      );
      plugin.app.vault.modify = jest.fn();

      await handleFileDelete(plugin.app, path); // Call imported function

      expect(plugin.app.vault.modify).toHaveBeenCalledTimes(2);
      expect(plugin.app.vault.modify).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.stringContaining(`[[${fileName}]]`)
      );
    });
  });
});
