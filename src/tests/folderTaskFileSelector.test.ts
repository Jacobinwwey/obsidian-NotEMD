import { TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';
import { selectFolderTaskFiles } from '../folderTaskFileSelector';
import { NotemdSettings } from '../types';

function createFile(path: string): TFile {
    const name = path.split('/').pop() || path;
    const basename = name.replace(/\.[^.]+$/, '');
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
    return {
        path,
        name,
        basename,
        extension
    } as unknown as TFile;
}

function withSettings(overrides: Partial<NotemdSettings>): NotemdSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...overrides
    };
}

describe('folderTaskFileSelector', () => {
    test('uses legacy recursive behavior for process-folder task when no filter is configured', () => {
        const settings = withSettings({});
        const files = [
            createFile('Notes/A.md'),
            createFile('Notes/Sub/B.md'),
            createFile('Elsewhere/C.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md', 'txt'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/A.md', 'Notes/Sub/B.md']);
    });

    test('keeps legacy non-recursive behavior for batch-translate-folder by default', () => {
        const settings = withSettings({});
        const files = [
            createFile('Notes/A.md'),
            createFile('Notes/Sub/B.md'),
            createFile('Notes/Sub/C.txt')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'batch-translate-folder',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/A.md']);
    });

    test('supports includeSubfolders override for batch-translate-folder', () => {
        const settings = withSettings({
            folderTaskIncludeSubfoldersMode: 'include'
        });
        const files = [
            createFile('Notes/A.md'),
            createFile('Notes/Sub/B.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'batch-translate-folder',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/A.md', 'Notes/Sub/B.md']);
    });

    test('supports match target = basename with contains mode', () => {
        const settings = withSettings({
            folderTaskFileFilterMode: 'contains',
            folderTaskFileFilterTarget: 'basename',
            folderTaskFileFilterPattern: 'topic',
            folderTaskFileFilterCaseSensitive: false
        });
        const files = [
            createFile('Notes/Topic-1.md'),
            createFile('Notes/Another.md'),
            createFile('Notes/Sub/Topic-2.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/Topic-1.md', 'Notes/Sub/Topic-2.md']);
    });

    test('supports match target = relativePath with regex mode', () => {
        const settings = withSettings({
            folderTaskFileFilterMode: 'regex',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterPattern: '^Sub\\/.*\\.md$',
            folderTaskFileFilterCaseSensitive: true
        });
        const files = [
            createFile('Notes/A.md'),
            createFile('Notes/Sub/B.md'),
            createFile('Notes/Sub/C.txt')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md', 'txt'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/Sub/B.md']);
    });

    test('supports glob mode with invert filtering', () => {
        const settings = withSettings({
            folderTaskFileFilterMode: 'glob',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterPattern: 'Drafts/**',
            folderTaskFileFilterInvert: true
        });
        const files = [
            createFile('Notes/Drafts/A.md'),
            createFile('Notes/Published/B.md'),
            createFile('Notes/C.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/Published/B.md', 'Notes/C.md']);
    });

    test('throws deterministic error when regex pattern is invalid', () => {
        const settings = withSettings({
            folderTaskFileFilterMode: 'regex',
            folderTaskFileFilterPattern: '['
        });
        const files = [createFile('Notes/A.md')];

        expect(() => selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        })).toThrow('Invalid folder task regex pattern');
    });

    test('treats empty pattern as no-op even when invert is enabled', () => {
        const settings = withSettings({
            folderTaskFileFilterMode: 'contains',
            folderTaskFileFilterPattern: '   ',
            folderTaskFileFilterInvert: true
        });
        const files = [
            createFile('Notes/A.md'),
            createFile('Notes/B.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/A.md', 'Notes/B.md']);
    });
});
