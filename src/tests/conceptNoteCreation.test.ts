import { TFolder } from 'obsidian';
import { createConceptNotes } from '../fileUtils';
import { NotemdSettings } from '../types';
import { mockApp, mockVault } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('createConceptNotes', () => {
    let settings: NotemdSettings;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Default settings for tests
        settings = { ...mockSettings };
    });

    it('should create new concept notes', async () => {
        const concepts = new Set(['AI', 'Machine Learning']);
        mockVault.getAbstractFileByPath.mockImplementation((path) => {
            if (path === 'Concepts') {
                const folder = new TFolder();
                Object.assign(folder, { path: 'Concepts', children: [] });
                return folder;
            }
            return null;
        });

        await createConceptNotes(mockApp, settings, concepts, null);

        expect(mockVault.create).toHaveBeenCalledTimes(2);
        expect(mockVault.create).toHaveBeenCalledWith('Concepts/AI.md', '# AI');
        expect(mockVault.create).toHaveBeenCalledWith('Concepts/Machine Learning.md', '# Machine Learning');
    });
});
