import NotemdPlugin from '../main';
import { splitContent } from '../utils'; // Import the function
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('splitContent', () => {
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

  it('should split content into chunks based on word count', () => {
    const content = 'word '.repeat(5000);
    const chunks = splitContent(content, plugin.settings); // Call imported function
    expect(chunks.length).toBe(1); // Content is not split due to no paragraph breaks
    expect(chunks[0].split(/\s+/).length).toBe(5000);
  });


  it('should preserve paragraph boundaries when splitting', () => {
    const para1 = 'para1\n\n';
    const para2 = 'para2\n\n';
    const para3 = 'para3';
    const content = para1 + para2 + para3;
    const chunks = splitContent(content, plugin.settings); // Call imported function
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(content);
  });

  it('should handle empty content', () => {
    const chunks = splitContent('', plugin.settings); // Call imported function
    expect(chunks.length).toBe(0);
  });

  it('should split content exceeding word count across paragraphs', () => {
    // Set a smaller word count for easier testing
    plugin.settings.chunkWordCount = 50;

    const para1 = 'word '.repeat(30) + '\n\n'; // 30 words
    const para2 = 'word '.repeat(30) + '\n\n'; // 30 words (Total 60, exceeds 50)
    const para3 = 'word '.repeat(30);          // 30 words (Total 90)
    const content = para1 + para2 + para3;

    const chunks = splitContent(content, plugin.settings); // Call imported function

    // Expecting 2 chunks:
    // Chunk 1: para1 (30 words) - doesn't exceed 50
    // Chunk 2: para2 + para3 (60 words) - para2 is added, exceeds limit, so para2+para3 form next chunk
    // Correction: The logic adds paragraphs until the *next* add exceeds the limit.
    // Chunk 1: para1 (30 words)
    // Chunk 2: para2 (30 words) - Adding para3 (30) would exceed 50, so para2 becomes chunk 2
    // Chunk 3: para3 (30 words)
    expect(chunks.length).toBe(3);
    expect(chunks[0].trim()).toBe('word '.repeat(30).trim());
    expect(chunks[1].trim()).toBe('word '.repeat(30).trim());
    expect(chunks[2].trim()).toBe('word '.repeat(30).trim());

     // Reset word count for other tests if necessary (though beforeEach handles it)
     plugin.settings.chunkWordCount = 3000;
  });

});
