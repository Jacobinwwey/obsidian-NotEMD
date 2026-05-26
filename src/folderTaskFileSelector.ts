import { TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants';
import { FolderTaskFileSelectionProfile, NotemdSettings } from './types';

export type FolderTaskFileFilterMode = 'none' | 'contains' | 'regex' | 'glob';
export type FolderTaskFileFilterTarget = 'relativePath' | 'basename';
export type FolderTaskIncludeSubfoldersMode = 'legacy' | 'include' | 'exclude';
export type FolderTaskSelectionPresetId =
    | 'contains-index-family'
    | 'regex-index-variants'
    | 'glob-index-family'
    | 'glob-index-cross-folder';

export type FolderTaskKind =
    | 'process-folder-add-links'
    | 'extract-concepts-folder'
    | 'batch-extract-original-text'
    | 'batch-generate-from-titles'
    | 'batch-mermaid-fix'
    | 'batch-fix-formula'
    | 'batch-translate-folder';

export interface FolderTaskFileFilterConfig {
    mode: FolderTaskFileFilterMode;
    pattern: string;
    target: FolderTaskFileFilterTarget;
    caseSensitive: boolean;
    invert: boolean;
}

export interface FolderTaskFileSelectionOverride {
    profileId?: string;
    profileName?: string;
    includeSubfoldersMode?: FolderTaskIncludeSubfoldersMode;
    fileFilterMode?: FolderTaskFileFilterMode;
    fileFilterPattern?: string;
    fileFilterTarget?: FolderTaskFileFilterTarget;
    fileFilterCaseSensitive?: boolean;
    fileFilterInvert?: boolean;
}

export interface FolderTaskInteractiveSelection {
    folderPath: string;
    fileSelectionOverride?: FolderTaskFileSelectionOverride;
}

export interface FolderTaskProfileFolderSelectionUiState {
    folderPath: string;
    hasProfileFolderHint: boolean;
    profileFolderHint: string | null;
    allowTemporaryFolderOverride: boolean;
    folderSelectionDisabled: boolean;
}

export interface FolderTaskFileSelectionOptions {
    taskKind: FolderTaskKind;
    folderPath: string;
    files: TFile[];
    allowedExtensions: string[];
    settings: NotemdSettings;
    exclude?: (file: TFile, relativePath: string) => boolean;
}

interface FolderTaskFilterMatcher {
    matcher: (value: string) => boolean;
    noOp: boolean;
}

const LEGACY_INCLUDE_SUBFOLDERS_BY_TASK: Record<FolderTaskKind, boolean> = {
    'process-folder-add-links': true,
    'extract-concepts-folder': true,
    'batch-extract-original-text': true,
    'batch-generate-from-titles': true,
    'batch-mermaid-fix': true,
    'batch-fix-formula': true,
    'batch-translate-folder': false
};

export function isAdvancedFolderTaskFileSelectionEnabled(
    settings: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableAdvancedFileSelectionProfiles'>
): boolean {
    return settings.enableDeveloperMode && settings.enableAdvancedFileSelectionProfiles;
}

function resolveFolderTaskRuntimeSettings(settings: NotemdSettings): NotemdSettings {
    if (isAdvancedFolderTaskFileSelectionEnabled(settings)) {
        return settings;
    }

    return {
        ...settings,
        folderTaskFileSelectionProfiles: [],
        folderTaskFileFilterMode: DEFAULT_SETTINGS.folderTaskFileFilterMode,
        folderTaskFileFilterPattern: DEFAULT_SETTINGS.folderTaskFileFilterPattern,
        folderTaskFileFilterTarget: DEFAULT_SETTINGS.folderTaskFileFilterTarget,
        folderTaskFileFilterCaseSensitive: DEFAULT_SETTINGS.folderTaskFileFilterCaseSensitive,
        folderTaskFileFilterInvert: DEFAULT_SETTINGS.folderTaskFileFilterInvert,
        folderTaskIncludeSubfoldersMode: DEFAULT_SETTINGS.folderTaskIncludeSubfoldersMode
    };
}

function normalizeFolderPath(folderPath: string): string {
    const trimmed = folderPath.trim();
    if (!trimmed || trimmed === '/') {
        return '/';
    }
    return trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
}

function resolveIncludeSubfolders(
    taskKind: FolderTaskKind,
    mode: FolderTaskIncludeSubfoldersMode
): boolean {
    if (mode === 'include') {
        return true;
    }
    if (mode === 'exclude') {
        return false;
    }
    return LEGACY_INCLUDE_SUBFOLDERS_BY_TASK[taskKind];
}

function getRelativePathWithinFolder(filePath: string, folderPath: string): string | null {
    if (folderPath === '/') {
        return filePath;
    }

    const prefix = `${folderPath}/`;
    if (!filePath.startsWith(prefix)) {
        return null;
    }

    const relativePath = filePath.slice(prefix.length);
    return relativePath.length > 0 ? relativePath : null;
}

function matchesFolderScope(relativePath: string, includeSubfolders: boolean): boolean {
    if (includeSubfolders) {
        return true;
    }
    return !relativePath.includes('/');
}

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileGlobPattern(pattern: string, caseSensitive: boolean): RegExp {
    let source = '^';
    for (let index = 0; index < pattern.length; index++) {
        const char = pattern[index];
        if (char === '*') {
            if (pattern[index + 1] === '*') {
                source += '.*';
                index += 1;
            } else {
                source += '[^/]*';
            }
            continue;
        }
        if (char === '?') {
            source += '.';
            continue;
        }
        source += escapeRegex(char);
    }
    source += '$';
    return new RegExp(source, caseSensitive ? undefined : 'i');
}

function resolveFilterConfig(settings: NotemdSettings): FolderTaskFileFilterConfig {
    const runtimeSettings = resolveFolderTaskRuntimeSettings(settings);
    return {
        mode: runtimeSettings.folderTaskFileFilterMode,
        pattern: runtimeSettings.folderTaskFileFilterPattern,
        target: runtimeSettings.folderTaskFileFilterTarget,
        caseSensitive: runtimeSettings.folderTaskFileFilterCaseSensitive,
        invert: runtimeSettings.folderTaskFileFilterInvert
    };
}

function normalizeFolderTaskFileSelectionProfile(
    profile: Partial<FolderTaskFileSelectionProfile> | null | undefined,
    index: number
): FolderTaskFileSelectionProfile {
    const fallback = DEFAULT_SETTINGS;
    const normalizedName = typeof profile?.name === 'string' && profile.name.trim().length > 0
        ? profile.name.trim()
        : `Profile ${index + 1}`;

    return {
        id: typeof profile?.id === 'string' && profile.id.trim().length > 0
            ? profile.id.trim()
            : `folder-task-profile-${index + 1}`,
        name: normalizedName,
        folderPathHint: typeof profile?.folderPathHint === 'string' ? profile.folderPathHint.trim() : '',
        includeSubfoldersMode: profile?.includeSubfoldersMode ?? fallback.folderTaskIncludeSubfoldersMode,
        fileFilterMode: profile?.fileFilterMode ?? fallback.folderTaskFileFilterMode,
        fileFilterPattern: typeof profile?.fileFilterPattern === 'string'
            ? profile.fileFilterPattern
            : fallback.folderTaskFileFilterPattern,
        fileFilterTarget: profile?.fileFilterTarget ?? fallback.folderTaskFileFilterTarget,
        fileFilterCaseSensitive: profile?.fileFilterCaseSensitive ?? fallback.folderTaskFileFilterCaseSensitive,
        fileFilterInvert: profile?.fileFilterInvert ?? fallback.folderTaskFileFilterInvert
    };
}

export function getFolderTaskFileSelectionProfiles(settings: NotemdSettings): FolderTaskFileSelectionProfile[] {
    const runtimeSettings = resolveFolderTaskRuntimeSettings(settings);
    const rawProfiles = Array.isArray(settings.folderTaskFileSelectionProfiles)
        ? runtimeSettings.folderTaskFileSelectionProfiles
        : [];
    return rawProfiles.map((profile, index) => normalizeFolderTaskFileSelectionProfile(profile, index));
}

export function createCurrentFolderTaskFileSelectionProfile(
    settings: NotemdSettings,
    profileName = 'Current default filter settings'
): FolderTaskFileSelectionProfile {
    const runtimeSettings = resolveFolderTaskRuntimeSettings(settings);
    return normalizeFolderTaskFileSelectionProfile({
        id: '__current_defaults__',
        name: profileName,
        folderPathHint: '',
        includeSubfoldersMode: runtimeSettings.folderTaskIncludeSubfoldersMode,
        fileFilterMode: runtimeSettings.folderTaskFileFilterMode,
        fileFilterPattern: runtimeSettings.folderTaskFileFilterPattern,
        fileFilterTarget: runtimeSettings.folderTaskFileFilterTarget,
        fileFilterCaseSensitive: runtimeSettings.folderTaskFileFilterCaseSensitive,
        fileFilterInvert: runtimeSettings.folderTaskFileFilterInvert
    }, 0);
}

export function resolveExistingFolderTaskFolderPath(
    availableFolders: string[],
    folderPath: string | null | undefined
): string | null {
    const normalized = normalizeFolderPath(typeof folderPath === 'string' ? folderPath : '');
    return availableFolders.includes(normalized) ? normalized : null;
}

export function looksLikeFolderTaskPatternPath(folderPath: string | null | undefined): boolean {
    const normalized = typeof folderPath === 'string' ? folderPath.trim() : '';
    if (!normalized) {
        return false;
    }
    return /[*?[\]{}()|\\^$]/.test(normalized);
}

export function createFolderTaskSelectionPresetOverride(
    presetId: FolderTaskSelectionPresetId
): FolderTaskFileSelectionOverride {
    switch (presetId) {
        case 'contains-index-family':
            return {
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'contains',
                fileFilterPattern: 'index',
                fileFilterTarget: 'basename',
                fileFilterCaseSensitive: false,
                fileFilterInvert: false
            };
        case 'regex-index-variants':
            return {
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'regex',
                fileFilterPattern: '^index(?:\\..+)?(?:_summ)?$',
                fileFilterTarget: 'basename',
                fileFilterCaseSensitive: false,
                fileFilterInvert: false
            };
        case 'glob-index-family':
            return {
                includeSubfoldersMode: 'exclude',
                fileFilterMode: 'glob',
                fileFilterPattern: 'index*',
                fileFilterTarget: 'basename',
                fileFilterCaseSensitive: false,
                fileFilterInvert: false
            };
        case 'glob-index-cross-folder':
            return {
                includeSubfoldersMode: 'include',
                fileFilterMode: 'glob',
                fileFilterPattern: '**/index*.md',
                fileFilterTarget: 'relativePath',
                fileFilterCaseSensitive: false,
                fileFilterInvert: false
            };
    }
}

export function resolveFolderTaskProfileFolderSelectionUiState(params: {
    availableFolders: string[];
    selectedProfile: FolderTaskFileSelectionProfile | null;
    currentFolderPath?: string;
    allowTemporaryFolderOverride?: boolean;
    fallbackFolderPath?: string;
}): FolderTaskProfileFolderSelectionUiState {
    const availableFolders = params.availableFolders;
    const fallbackFolderPath = availableFolders.includes(params.fallbackFolderPath || '/')
        ? (params.fallbackFolderPath || '/')
        : '/';
    const hasExplicitCurrentFolderPath = typeof params.currentFolderPath === 'string'
        && availableFolders.includes(params.currentFolderPath);
    const normalizedCurrentFolderPath = hasExplicitCurrentFolderPath
        ? params.currentFolderPath!
        : fallbackFolderPath;
    const profileFolderHint = params.selectedProfile?.folderPathHint || '';
    const hasProfileFolderHint = Boolean(profileFolderHint) && availableFolders.includes(profileFolderHint);

    if (!hasProfileFolderHint) {
        return {
            folderPath: normalizedCurrentFolderPath,
            hasProfileFolderHint: false,
            profileFolderHint: null,
            allowTemporaryFolderOverride: false,
            folderSelectionDisabled: false
        };
    }

    const allowTemporaryFolderOverride = Boolean(params.allowTemporaryFolderOverride);
    if (!allowTemporaryFolderOverride) {
        return {
            folderPath: profileFolderHint,
            hasProfileFolderHint: true,
            profileFolderHint,
            allowTemporaryFolderOverride: false,
            folderSelectionDisabled: true
        };
    }

    return {
        folderPath: hasExplicitCurrentFolderPath ? normalizedCurrentFolderPath : profileFolderHint,
        hasProfileFolderHint: true,
        profileFolderHint,
        allowTemporaryFolderOverride: true,
        folderSelectionDisabled: false
    };
}

export function resolveFolderTaskFileSelectionProfile(
    settings: NotemdSettings,
    override?: FolderTaskFileSelectionOverride
): FolderTaskFileSelectionProfile | null {
    if (!override) {
        return null;
    }

    const profiles = getFolderTaskFileSelectionProfiles(settings);
    const normalizedProfileId = typeof override.profileId === 'string' ? override.profileId.trim() : '';
    if (normalizedProfileId) {
        return profiles.find(profile => profile.id === normalizedProfileId) || null;
    }

    const normalizedProfileName = typeof override.profileName === 'string' ? override.profileName.trim() : '';
    if (normalizedProfileName) {
        return profiles.find(profile => profile.name === normalizedProfileName) || null;
    }

    return null;
}

export function createFolderTaskSelectionOverrideFromProfile(
    profile: FolderTaskFileSelectionProfile
): FolderTaskFileSelectionOverride {
    return {
        profileId: profile.id,
        includeSubfoldersMode: profile.includeSubfoldersMode,
        fileFilterMode: profile.fileFilterMode,
        fileFilterPattern: profile.fileFilterPattern,
        fileFilterTarget: profile.fileFilterTarget,
        fileFilterCaseSensitive: profile.fileFilterCaseSensitive,
        fileFilterInvert: profile.fileFilterInvert
    };
}

export function mergeFolderTaskSelectionOverrides(
    base?: FolderTaskFileSelectionOverride,
    override?: FolderTaskFileSelectionOverride
): FolderTaskFileSelectionOverride | undefined {
    if (!base) {
        return override;
    }
    if (!override) {
        return base;
    }

    return {
        ...base,
        ...override
    };
}

export function getFolderTaskRegexValidationError(pattern: string, caseSensitive: boolean): string | null {
    const normalizedPattern = pattern.trim();
    if (!normalizedPattern) {
        return null;
    }

    try {
        // Compile-only validation for deterministic syntax checking.
        // eslint-disable-next-line no-new
        new RegExp(normalizedPattern, caseSensitive ? undefined : 'i');
        return null;
    } catch (error: unknown) {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return 'Unknown regex syntax error';
    }
}

export function applyFolderTaskSelectionOverride(
    settings: NotemdSettings,
    override?: FolderTaskFileSelectionOverride
): NotemdSettings {
    const runtimeSettings = resolveFolderTaskRuntimeSettings(settings);
    if (!isAdvancedFolderTaskFileSelectionEnabled(settings)) {
        return runtimeSettings;
    }

    if (!override) {
        return runtimeSettings;
    }

    const profile = resolveFolderTaskFileSelectionProfile(runtimeSettings, override);
    const baseSettings = profile
        ? {
            ...runtimeSettings,
            folderTaskIncludeSubfoldersMode: profile.includeSubfoldersMode,
            folderTaskFileFilterMode: profile.fileFilterMode,
            folderTaskFileFilterPattern: profile.fileFilterPattern,
            folderTaskFileFilterTarget: profile.fileFilterTarget,
            folderTaskFileFilterCaseSensitive: profile.fileFilterCaseSensitive,
            folderTaskFileFilterInvert: profile.fileFilterInvert
        }
        : runtimeSettings;

    return {
        ...baseSettings,
        folderTaskIncludeSubfoldersMode: override.includeSubfoldersMode ?? baseSettings.folderTaskIncludeSubfoldersMode,
        folderTaskFileFilterMode: override.fileFilterMode ?? baseSettings.folderTaskFileFilterMode,
        folderTaskFileFilterPattern: override.fileFilterPattern ?? baseSettings.folderTaskFileFilterPattern,
        folderTaskFileFilterTarget: override.fileFilterTarget ?? baseSettings.folderTaskFileFilterTarget,
        folderTaskFileFilterCaseSensitive: override.fileFilterCaseSensitive ?? baseSettings.folderTaskFileFilterCaseSensitive,
        folderTaskFileFilterInvert: override.fileFilterInvert ?? baseSettings.folderTaskFileFilterInvert
    };
}

function createFilterMatcher(filterConfig: FolderTaskFileFilterConfig): FolderTaskFilterMatcher {
    const normalizedPattern = filterConfig.pattern.trim();
    if (filterConfig.mode === 'none' || !normalizedPattern) {
        return {
            matcher: () => true,
            noOp: true
        };
    }

    if (filterConfig.mode === 'contains') {
        if (filterConfig.caseSensitive) {
            return {
                matcher: (value: string) => value.includes(normalizedPattern),
                noOp: false
            };
        }
        const lowerPattern = normalizedPattern.toLowerCase();
        return {
            matcher: (value: string) => value.toLowerCase().includes(lowerPattern),
            noOp: false
        };
    }

    if (filterConfig.mode === 'regex') {
        const validationError = getFolderTaskRegexValidationError(normalizedPattern, filterConfig.caseSensitive);
        if (validationError) {
            throw new Error(`Invalid folder task regex pattern "${normalizedPattern}": ${validationError}`);
        }
        const regex = new RegExp(normalizedPattern, filterConfig.caseSensitive ? undefined : 'i');
        return {
            matcher: (value: string) => regex.test(value),
            noOp: false
        };
    }

    const globRegex = compileGlobPattern(normalizedPattern, filterConfig.caseSensitive);
    return {
        matcher: (value: string) => globRegex.test(value),
        noOp: false
    };
}

function resolveFilterTargetValue(
    filterTarget: FolderTaskFileFilterTarget,
    file: TFile,
    relativePath: string
): string {
    if (filterTarget === 'relativePath') {
        return relativePath;
    }

    if (typeof file.basename === 'string' && file.basename.length > 0) {
        return file.basename;
    }
    return file.name.replace(/\.[^.]+$/, '');
}

function resolveFileExtension(file: TFile): string {
    if (typeof file.extension === 'string' && file.extension.length > 0) {
        return file.extension.toLowerCase();
    }

    const name = typeof file.name === 'string' && file.name.length > 0
        ? file.name
        : (file.path.split('/').pop() || file.path);
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex === name.length - 1) {
        return '';
    }
    return name.slice(dotIndex + 1).toLowerCase();
}

export function selectFolderTaskFiles(options: FolderTaskFileSelectionOptions): TFile[] {
    const folderPath = normalizeFolderPath(options.folderPath);
    const runtimeSettings = resolveFolderTaskRuntimeSettings(options.settings);
    const includeSubfolders = resolveIncludeSubfolders(
        options.taskKind,
        runtimeSettings.folderTaskIncludeSubfoldersMode
    );
    const allowedExtensions = new Set(options.allowedExtensions.map(ext => ext.toLowerCase()));
    const filterConfig = resolveFilterConfig(runtimeSettings);
    const filterMatcher = createFilterMatcher(filterConfig);

    const selectedFiles: TFile[] = [];
    for (const file of options.files) {
        const extension = resolveFileExtension(file);
        if (!allowedExtensions.has(extension)) {
            continue;
        }

        const relativePath = getRelativePathWithinFolder(file.path, folderPath);
        if (!relativePath) {
            continue;
        }

        if (!matchesFolderScope(relativePath, includeSubfolders)) {
            continue;
        }

        if (options.exclude && options.exclude(file, relativePath)) {
            continue;
        }

        const targetValue = resolveFilterTargetValue(filterConfig.target, file, relativePath);
        const matched = filterMatcher.matcher(targetValue);
        const finalMatch = filterMatcher.noOp ? true : (filterConfig.invert ? !matched : matched);
        if (finalMatch) {
            selectedFiles.push(file);
        }
    }
    return selectedFiles;
}
