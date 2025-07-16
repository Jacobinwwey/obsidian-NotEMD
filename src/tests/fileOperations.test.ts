import NotemdPlugin from '../main';
import { TFile } from 'obsidian';
import { handleFileRename, handleFileDelete } from '../fileUtils'; // Import functions
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('File Operations', () => {
  let plugin: NotemdPlugin;
  
  beforeEach(async () => {
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
    plugin.settings = mockSettings;
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

      mockApp.vault.getMarkdownFiles = jest.fn(() => files.map(f => ({
        path: f.path,
        extension: 'md',
        basename: f.path.replace('.md',''),
        stat: { size: 0, ctime: 0, mtime: 0 },
        vault: mockApp.vault,
        name: f.path.split('/').pop() || '',
        parent: null
      } as TFile)));
      mockApp.vault.read = jest.fn((file) =>
        Promise.resolve(files.find(f => f.path === file.path)?.content || '')
      );
      mockApp.vault.modify = jest.fn();

      await handleFileRename(plugin.app, oldPath, newPath); // Call imported function

      expect(mockApp.vault.modify).toHaveBeenCalledTimes(2);
      expect(mockApp.vault.modify).toHaveBeenCalledWith(
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

      mockApp.vault.getMarkdownFiles = jest.fn(() => files.map(f => ({
        path: f.path,
        extension: 'md',
        basename: f.path.replace('.md',''),
        stat: { size: 0, ctime: 0, mtime: 0 },
        vault: mockApp.vault,
        name: f.path.split('/').pop() || '',
        parent: null
      } as TFile)));
      mockApp.vault.read = jest.fn((file) =>
        Promise.resolve(files.find(f => f.path === file.path)?.content || '')
      );
      mockApp.vault.modify = jest.fn();

      await handleFileDelete(plugin.app, path); // Call imported function

      expect(mockApp.vault.modify).toHaveBeenCalledTimes(2);
      expect(mockApp.vault.modify).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.stringContaining(`[[${fileName}]]`)
      );
    });
  });
});
