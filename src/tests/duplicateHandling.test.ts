import NotemdPlugin from '../main';
import { findDuplicates, handleDuplicates } from '../fileUtils'; // Import the functions
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('Duplicate Handling', () => {
  let plugin: NotemdPlugin;
  
  beforeEach(() => {
    plugin = new NotemdPlugin(mockApp, {
      id: 'notemd-test',
      name: 'Notemd Test',
      version: '0.0.1',
      author: 'Test',
      description: 'Test plugin',
      isDesktopOnly: false,
      minAppVersion: '1.0.0'
    });
    plugin.settings = mockSettings;
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
