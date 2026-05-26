import { TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';
import {
    applyFolderTaskSelectionOverride,
    createFolderTaskSelectionPresetOverride,
    createCurrentFolderTaskFileSelectionProfile,
    getFolderTaskRegexValidationError,
    getFolderTaskFileSelectionProfiles,
    isAdvancedFolderTaskFileSelectionEnabled,
    looksLikeFolderTaskPatternPath,
    resolveExistingFolderTaskFolderPath,
    resolveFolderTaskProfileFolderSelectionUiState,
    selectFolderTaskFiles
} from '../folderTaskFileSelector';
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

const ADVANCED_FILE_SELECTION_FLAGS: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableAdvancedFileSelectionProfiles'> = {
    enableDeveloperMode: true,
    enableAdvancedFileSelectionProfiles: true
};

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
            ...ADVANCED_FILE_SELECTION_FLAGS,
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
            ...ADVANCED_FILE_SELECTION_FLAGS,
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
            ...ADVANCED_FILE_SELECTION_FLAGS,
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
            ...ADVANCED_FILE_SELECTION_FLAGS,
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
            ...ADVANCED_FILE_SELECTION_FLAGS,
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

    test('getFolderTaskRegexValidationError returns null for valid and empty patterns', () => {
        expect(getFolderTaskRegexValidationError('^chapter-\\d+\\.md$', true)).toBeNull();
        expect(getFolderTaskRegexValidationError('   ', false)).toBeNull();
    });

    test('getFolderTaskRegexValidationError reports deterministic syntax failures', () => {
        const message = getFolderTaskRegexValidationError('[', true);

        expect(typeof message).toBe('string');
        expect(message).toBeTruthy();
    });

    test('treats empty pattern as no-op even when invert is enabled', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
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

    test('applyFolderTaskSelectionOverride returns original object when advanced mode is enabled and no override is provided', () => {
        const settings = withSettings(ADVANCED_FILE_SELECTION_FLAGS);
        const applied = applyFolderTaskSelectionOverride(settings);

        expect(applied).toBe(settings);
    });

    test('applyFolderTaskSelectionOverride applies only provided override fields', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskIncludeSubfoldersMode: 'legacy',
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false
        });

        const applied = applyFolderTaskSelectionOverride(settings, {
            includeSubfoldersMode: 'exclude',
            fileFilterMode: 'contains',
            fileFilterPattern: 'Topic',
            fileFilterTarget: 'basename',
            fileFilterCaseSensitive: true
        });

        expect(applied).not.toBe(settings);
        expect(applied.folderTaskIncludeSubfoldersMode).toBe('exclude');
        expect(applied.folderTaskFileFilterMode).toBe('contains');
        expect(applied.folderTaskFileFilterPattern).toBe('Topic');
        expect(applied.folderTaskFileFilterTarget).toBe('basename');
        expect(applied.folderTaskFileFilterCaseSensitive).toBe(true);
        expect(applied.folderTaskFileFilterInvert).toBe(false);
    });

    test('applyFolderTaskSelectionOverride resolves named saved profile before applying explicit overrides', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-drafts',
                    name: 'Draft notes',
                    folderPathHint: 'Notes/Drafts',
                    includeSubfoldersMode: 'exclude',
                    fileFilterMode: 'glob',
                    fileFilterPattern: 'draft-*',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: true,
                    fileFilterInvert: false
                }
            ],
            folderTaskIncludeSubfoldersMode: 'legacy',
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: '',
            folderTaskFileFilterTarget: 'relativePath',
            folderTaskFileFilterCaseSensitive: false,
            folderTaskFileFilterInvert: false
        });

        const applied = applyFolderTaskSelectionOverride(settings, {
            profileId: 'profile-drafts',
            fileFilterPattern: 'draft-2026-*',
            fileFilterInvert: true
        });

        expect(applied.folderTaskIncludeSubfoldersMode).toBe('exclude');
        expect(applied.folderTaskFileFilterMode).toBe('glob');
        expect(applied.folderTaskFileFilterTarget).toBe('basename');
        expect(applied.folderTaskFileFilterCaseSensitive).toBe(true);
        expect(applied.folderTaskFileFilterPattern).toBe('draft-2026-*');
        expect(applied.folderTaskFileFilterInvert).toBe(true);
    });

    test('applyFolderTaskSelectionOverride resolves saved profile by name when profile id is not provided', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-topic',
                    name: 'Topic only',
                    folderPathHint: '',
                    includeSubfoldersMode: 'include',
                    fileFilterMode: 'regex',
                    fileFilterPattern: '^topic-.*$',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: false,
                    fileFilterInvert: false
                }
            ],
            folderTaskFileFilterMode: 'none',
            folderTaskFileFilterPattern: ''
        });

        const applied = applyFolderTaskSelectionOverride(settings, {
            profileName: 'Topic only'
        });

        expect(applied.folderTaskIncludeSubfoldersMode).toBe('include');
        expect(applied.folderTaskFileFilterMode).toBe('regex');
        expect(applied.folderTaskFileFilterPattern).toBe('^topic-.*$');
        expect(applied.folderTaskFileFilterTarget).toBe('basename');
        expect(applied.folderTaskFileFilterCaseSensitive).toBe(false);
    });

    test('resolveFolderTaskProfileFolderSelectionUiState locks to saved profile folder by default', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-drafts',
                    name: 'Draft notes',
                    folderPathHint: 'Notes/Drafts',
                    includeSubfoldersMode: 'exclude',
                    fileFilterMode: 'regex',
                    fileFilterPattern: '^draft-.*$',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: false,
                    fileFilterInvert: false
                }
            ]
        });
        const profile = getFolderTaskFileSelectionProfiles(settings)[0];

        const state = resolveFolderTaskProfileFolderSelectionUiState({
            availableFolders: ['/', 'Notes', 'Notes/Drafts', 'Notes/Published'],
            selectedProfile: profile,
            currentFolderPath: 'Notes/Published',
            allowTemporaryFolderOverride: false
        });

        expect(state).toEqual({
            folderPath: 'Notes/Drafts',
            hasProfileFolderHint: true,
            profileFolderHint: 'Notes/Drafts',
            allowTemporaryFolderOverride: false,
            folderSelectionDisabled: true
        });
    });

    test('resolveFolderTaskProfileFolderSelectionUiState allows one-run folder override without mutating profile binding', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-drafts',
                    name: 'Draft notes',
                    folderPathHint: 'Notes/Drafts',
                    includeSubfoldersMode: 'exclude',
                    fileFilterMode: 'regex',
                    fileFilterPattern: '^draft-.*$',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: false,
                    fileFilterInvert: false
                }
            ]
        });
        const profile = getFolderTaskFileSelectionProfiles(settings)[0];

        const state = resolveFolderTaskProfileFolderSelectionUiState({
            availableFolders: ['/', 'Notes', 'Notes/Drafts', 'Notes/Published'],
            selectedProfile: profile,
            currentFolderPath: 'Notes/Published',
            allowTemporaryFolderOverride: true
        });

        expect(state).toEqual({
            folderPath: 'Notes/Published',
            hasProfileFolderHint: true,
            profileFolderHint: 'Notes/Drafts',
            allowTemporaryFolderOverride: true,
            folderSelectionDisabled: false
        });
        expect(profile.folderPathHint).toBe('Notes/Drafts');
    });

    test('resolveFolderTaskProfileFolderSelectionUiState falls back to free folder selection when no valid profile hint exists', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskFileSelectionProfiles: [
                {
                    id: 'profile-topic',
                    name: 'Topic only',
                    folderPathHint: 'Missing/Path',
                    includeSubfoldersMode: 'include',
                    fileFilterMode: 'contains',
                    fileFilterPattern: 'Topic',
                    fileFilterTarget: 'basename',
                    fileFilterCaseSensitive: false,
                    fileFilterInvert: false
                }
            ]
        });
        const profile = getFolderTaskFileSelectionProfiles(settings)[0];

        const state = resolveFolderTaskProfileFolderSelectionUiState({
            availableFolders: ['/', 'Notes', 'Notes/Published'],
            selectedProfile: profile,
            currentFolderPath: 'Notes/Published',
            allowTemporaryFolderOverride: false
        });

        expect(state).toEqual({
            folderPath: 'Notes/Published',
            hasProfileFolderHint: false,
            profileFolderHint: null,
            allowTemporaryFolderOverride: false,
            folderSelectionDisabled: false
        });
    });

    test('resolveExistingFolderTaskFolderPath normalizes root and trailing slashes', () => {
        expect(resolveExistingFolderTaskFolderPath(['/', 'Notes', 'Notes/Drafts'], '')).toBe('/');
        expect(resolveExistingFolderTaskFolderPath(['/', 'Notes', 'Notes/Drafts'], '/Notes/Drafts/')).toBe('Notes/Drafts');
        expect(resolveExistingFolderTaskFolderPath(['/', 'Notes', 'Notes/Drafts'], 'Notes/Drafts')).toBe('Notes/Drafts');
    });

    test('resolveExistingFolderTaskFolderPath returns null for missing folders', () => {
        expect(resolveExistingFolderTaskFolderPath(['/', 'Notes', 'Notes/Drafts'], 'Missing/Path')).toBeNull();
    });

    test('looksLikeFolderTaskPatternPath distinguishes folder paths from wildcard-like patterns', () => {
        expect(looksLikeFolderTaskPatternPath('docs/index*')).toBe(true);
        expect(looksLikeFolderTaskPatternPath('^index(?:\\..+)?$')).toBe(true);
        expect(looksLikeFolderTaskPatternPath('Notes/Drafts')).toBe(false);
        expect(looksLikeFolderTaskPatternPath('/')).toBe(false);
    });

    test('createFolderTaskSelectionPresetOverride builds basename-friendly presets', () => {
        expect(createFolderTaskSelectionPresetOverride('glob-index-family')).toEqual({
            includeSubfoldersMode: 'exclude',
            fileFilterMode: 'glob',
            fileFilterPattern: 'index*',
            fileFilterTarget: 'basename',
            fileFilterCaseSensitive: false,
            fileFilterInvert: false
        });
    });

    test('createFolderTaskSelectionPresetOverride builds cross-folder relative-path presets', () => {
        expect(createFolderTaskSelectionPresetOverride('glob-index-cross-folder')).toEqual({
            includeSubfoldersMode: 'include',
            fileFilterMode: 'glob',
            fileFilterPattern: '**/index*.md',
            fileFilterTarget: 'relativePath',
            fileFilterCaseSensitive: false,
            fileFilterInvert: false
        });
    });

    test('createCurrentFolderTaskFileSelectionProfile mirrors current default folder-task settings', () => {
        const settings = withSettings({
            ...ADVANCED_FILE_SELECTION_FLAGS,
            folderTaskIncludeSubfoldersMode: 'exclude',
            folderTaskFileFilterMode: 'glob',
            folderTaskFileFilterPattern: 'draft-*',
            folderTaskFileFilterTarget: 'basename',
            folderTaskFileFilterCaseSensitive: true,
            folderTaskFileFilterInvert: true
        });

        expect(createCurrentFolderTaskFileSelectionProfile(settings, 'Current defaults')).toEqual({
            id: '__current_defaults__',
            name: 'Current defaults',
            folderPathHint: '',
            includeSubfoldersMode: 'exclude',
            fileFilterMode: 'glob',
            fileFilterPattern: 'draft-*',
            fileFilterTarget: 'basename',
            fileFilterCaseSensitive: true,
            fileFilterInvert: true
        });
    });

    test('advanced file selection stays disabled until both developer mode and advanced toggle are enabled', () => {
        expect(isAdvancedFolderTaskFileSelectionEnabled(withSettings({}))).toBe(false);
        expect(isAdvancedFolderTaskFileSelectionEnabled(withSettings({
            enableDeveloperMode: true,
            enableAdvancedFileSelectionProfiles: false
        }))).toBe(false);
        expect(isAdvancedFolderTaskFileSelectionEnabled(withSettings(ADVANCED_FILE_SELECTION_FLAGS))).toBe(true);
    });

    test('legacy selection ignores hidden advanced filter settings when advanced mode is disabled', () => {
        const settings = withSettings({
            enableDeveloperMode: false,
            enableAdvancedFileSelectionProfiles: false,
            folderTaskFileFilterMode: 'contains',
            folderTaskFileFilterTarget: 'basename',
            folderTaskFileFilterPattern: 'topic'
        });
        const files = [
            createFile('Notes/Topic-1.md'),
            createFile('Notes/Another.md')
        ];

        const selected = selectFolderTaskFiles({
            taskKind: 'process-folder-add-links',
            folderPath: 'Notes',
            files,
            allowedExtensions: ['md'],
            settings
        });

        expect(selected.map(file => file.path)).toEqual(['Notes/Topic-1.md', 'Notes/Another.md']);
        expect(getFolderTaskFileSelectionProfiles(settings)).toEqual([]);
    });
});
