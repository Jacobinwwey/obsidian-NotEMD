import { BatchGenerateContentForTitlesResult } from './fileUtils';
import { FolderTaskFileSelectionOverride } from './folderTaskFileSelector';
import {
    LocalKnowledgeInspectRequest,
    LocalKnowledgeInspectResult,
    LocalKnowledgeTaskScope
} from './localKnowledgeBase';
import {
    DiagramCommandInputOverrides,
    DiagramCommandOptions,
    DiagramCommandRunResult
} from './operations/diagramCommandHostAdapter';
import {
    ExportCliCapabilityManifestCommandResult,
    ExportCliInvocationContractCommandResult,
    ExportCliPublicSurfaceCommandResult,
    ExportRedactedProviderProfilesCommandResult
} from './operations/configProfileCommands';
import { ChapterSplitResult } from './chapterSplit';
import { ResearchSummarizeResult } from './searchUtils';
import { CHAPTER_SPLIT_HEADING_LEVEL_VALUES, ChapterSplitHeadingLevelSetting, ProgressReporter } from './types';

export type MaintainerCliOperationId =
    | 'content.batch-generate-from-titles'
    | 'content.split-note-by-chapters'
    | 'research.summarize-topic'
    | 'diagram.generate'
    | 'local-knowledge.inspect'
    | 'provider.profile.export-redacted'
    | 'cli.capability-manifest.export'
    | 'cli.invocation-contract.export'
    | 'cli.public-surface.export';

export interface MaintainerCliOperationRequest {
    operationId: MaintainerCliOperationId;
    input?: unknown;
}

export type MaintainerCliOperationResult =
    | BatchGenerateContentForTitlesResult
    | ChapterSplitResult
    | ResearchSummarizeResult
    | DiagramCommandRunResult
    | LocalKnowledgeInspectResult
    | ExportRedactedProviderProfilesCommandResult
    | ExportCliCapabilityManifestCommandResult
    | ExportCliInvocationContractCommandResult
    | ExportCliPublicSurfaceCommandResult
    | null;

export interface MaintainerCliBridgeHost {
    batchGenerateContentForTitlesCommand: (
        reporter?: ProgressReporter,
        folderPathOverride?: string,
        fileSelectionOverride?: FolderTaskFileSelectionOverride
    ) => Promise<BatchGenerateContentForTitlesResult | null>;
    splitNoteByChaptersForPathCommand: (
        sourcePath: string,
        reporter?: ProgressReporter,
        options?: {
            splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
        }
    ) => Promise<ChapterSplitResult | null>;
    researchAndSummarizeForPathCommand: (
        sourcePath: string,
        topicOverride?: string,
        reporter?: ProgressReporter
    ) => Promise<ResearchSummarizeResult | null>;
    generateDiagramForPathCommand: (
        sourcePath: string,
        reporter?: ProgressReporter,
        options?: DiagramCommandOptions
    ) => Promise<DiagramCommandRunResult | null>;
    inspectLocalKnowledgeCommand: (
        request: LocalKnowledgeInspectRequest,
        reporter?: ProgressReporter
    ) => Promise<LocalKnowledgeInspectResult>;
    exportRedactedProviderProfilesCommand: () => Promise<ExportRedactedProviderProfilesCommandResult | null>;
    exportCliCapabilityManifestCommand: () => Promise<ExportCliCapabilityManifestCommandResult | null>;
    exportCliInvocationContractCommand: () => Promise<ExportCliInvocationContractCommandResult | null>;
    exportCliPublicSurfaceCommand: () => Promise<ExportCliPublicSurfaceCommandResult | null>;
}

function asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}

function assertNoInput(input: unknown): void {
    if (input == null) {
        return;
    }

    if (typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Maintainer CLI export operations do not accept positional input payloads.');
    }

    if (Object.keys(input as Record<string, unknown>).length > 0) {
        throw new Error('Maintainer CLI export operations do not accept input fields.');
    }
}

function requireString(input: Record<string, unknown>, key: string): string {
    const value = input[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`Maintainer CLI operation requires a non-empty "${key}" string.`);
    }

    return value.trim();
}

function optionalString(input: Record<string, unknown>, key: string): string | undefined {
    const value = input[key];
    if (value == null || value === '') {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`Maintainer CLI operation expects "${key}" to be a string when provided.`);
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}

function optionalBoolean(input: Record<string, unknown>, key: string): boolean | undefined {
    const value = input[key];
    if (value == null) {
        return undefined;
    }
    if (typeof value !== 'boolean') {
        throw new Error(`Maintainer CLI operation expects "${key}" to be a boolean when provided.`);
    }
    return value;
}

function optionalNumber(input: Record<string, unknown>, key: string): number | undefined {
    const value = input[key];
    if (value == null || value === '') {
        return undefined;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Maintainer CLI operation expects "${key}" to be a finite number when provided.`);
    }

    return value;
}

function optionalStringArray(input: Record<string, unknown>, key: string): string[] | undefined {
    if (!Object.prototype.hasOwnProperty.call(input, key)) {
        return undefined;
    }

    const value = input[key];
    if (value == null) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Maintainer CLI operation expects "${key}" to be an array of strings when provided.`);
    }

    return value.map((entry, index) => {
        if (typeof entry !== 'string') {
            throw new Error(`Maintainer CLI operation expects "${key}[${index}]" to be a string.`);
        }

        return entry.trim();
    }).filter(Boolean);
}

function optionalEnum<T extends string>(
    input: Record<string, unknown>,
    key: string,
    allowed: readonly T[]
): T | undefined {
    const value = input[key];
    if (value == null || value === '') {
        return undefined;
    }
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
        throw new Error(`Maintainer CLI operation expects "${key}" to be one of: ${allowed.join(', ')}.`);
    }

    return value as T;
}

function buildFileSelectionOverride(input: Record<string, unknown>): FolderTaskFileSelectionOverride | undefined {
    const profileId = optionalString(input, 'fileSelectionProfileId');
    const profileName = optionalString(input, 'fileSelectionProfileName');
    const includeSubfoldersMode = optionalEnum(input, 'includeSubfoldersMode', ['legacy', 'include', 'exclude'] as const);
    const fileFilterMode = optionalEnum(input, 'fileFilterMode', ['none', 'contains', 'regex', 'glob'] as const);
    const fileFilterPattern = optionalString(input, 'fileFilterPattern');
    const fileFilterTarget = optionalEnum(input, 'fileFilterTarget', ['relativePath', 'basename'] as const);
    const fileFilterCaseSensitive = optionalBoolean(input, 'fileFilterCaseSensitive');
    const fileFilterInvert = optionalBoolean(input, 'fileFilterInvert');

    const override: FolderTaskFileSelectionOverride = {};
    if (profileId) {
        override.profileId = profileId;
    }
    if (profileName) {
        override.profileName = profileName;
    }
    if (includeSubfoldersMode) {
        override.includeSubfoldersMode = includeSubfoldersMode;
    }
    if (fileFilterMode) {
        override.fileFilterMode = fileFilterMode;
    }
    if (fileFilterPattern !== undefined) {
        override.fileFilterPattern = fileFilterPattern;
    }
    if (fileFilterTarget) {
        override.fileFilterTarget = fileFilterTarget;
    }
    if (fileFilterCaseSensitive !== undefined) {
        override.fileFilterCaseSensitive = fileFilterCaseSensitive;
    }
    if (fileFilterInvert !== undefined) {
        override.fileFilterInvert = fileFilterInvert;
    }

    return Object.keys(override).length > 0 ? override : undefined;
}

function buildChapterSplitOptions(input: Record<string, unknown>): {
    splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
} | undefined {
    const splitHeadingLevel = optionalEnum(input, 'splitHeadingLevel', CHAPTER_SPLIT_HEADING_LEVEL_VALUES);

    if (!splitHeadingLevel) {
        return undefined;
    }

    return {
        splitHeadingLevel
    };
}

function buildDiagramCommandOptions(input: Record<string, unknown>): DiagramCommandOptions {
    const executionMode = optionalEnum(
        input,
        'executionMode',
        ['save-artifact', 'save-mermaid'] as const
    ) || 'save-artifact';
    const inputOverrides: DiagramCommandInputOverrides = {};
    const requestedIntent = optionalString(input, 'requestedIntent');
    const requestedRenderTarget = optionalEnum(input, 'requestedRenderTarget', [
        'mermaid', 'json-canvas', 'vega-lite', 'html', 'editable-html-svg', 'drawio', 'drawnix', 'circuitikz'
    ] as const);
    const compatibilityMode = optionalEnum(input, 'compatibilityMode', ['best-fit', 'legacy-mermaid'] as const);
    const targetLanguage = optionalString(input, 'targetLanguage');

    if (requestedIntent) {
        inputOverrides.requestedIntent = requestedIntent as DiagramCommandInputOverrides['requestedIntent'];
    }
    if (requestedRenderTarget) {
        inputOverrides.requestedRenderTarget = requestedRenderTarget;
    }
    if (compatibilityMode) {
        inputOverrides.compatibilityMode = compatibilityMode;
    }
    if (targetLanguage) {
        inputOverrides.targetLanguage = targetLanguage;
    }

    return {
        executionMode,
        inputOverrides: Object.keys(inputOverrides).length > 0 ? inputOverrides : undefined
    };
}

function buildLocalKnowledgeInspectRequest(input: Record<string, unknown>): LocalKnowledgeInspectRequest {
    const taskScope = optionalEnum(
        input,
        'taskScope',
        ['generateTitle', 'batchGenerateFromTitles', 'researchSummarize', 'diagramGeneration'] as const satisfies readonly LocalKnowledgeTaskScope[]
    );

    if (!taskScope) {
        throw new Error('Maintainer CLI operation expects "taskScope" to be one of: generateTitle, batchGenerateFromTitles, researchSummarize, diagramGeneration.');
    }

    const sourcePath = optionalString(input, 'sourcePath');
    const currentFilePath = optionalString(input, 'currentFilePath');
    const query = optionalString(input, 'query');
    const knowledgePaths = optionalStringArray(input, 'knowledgePaths');
    const topK = optionalNumber(input, 'topK');
    const slidingWindowSize = optionalNumber(input, 'slidingWindowSize');
    const maxSnippetChars = optionalNumber(input, 'maxSnippetChars');

    return {
        taskScope,
        ...(sourcePath !== undefined ? { sourcePath } : {}),
        ...(currentFilePath !== undefined ? { currentFilePath } : {}),
        ...(query !== undefined ? { query } : {}),
        ...(knowledgePaths !== undefined ? { knowledgePaths } : {}),
        ...(topK !== undefined ? { topK } : {}),
        ...(slidingWindowSize !== undefined ? { slidingWindowSize } : {}),
        ...(maxSnippetChars !== undefined ? { maxSnippetChars } : {})
    };
}

export async function invokeMaintainerCliOperation(
    host: MaintainerCliBridgeHost,
    request: MaintainerCliOperationRequest,
    reporter?: ProgressReporter
): Promise<MaintainerCliOperationResult> {
    const input = asObject(request.input);

    switch (request.operationId) {
        case 'content.batch-generate-from-titles':
            return host.batchGenerateContentForTitlesCommand(
                reporter,
                requireString(input, 'folderPath'),
                buildFileSelectionOverride(input)
            );
        case 'content.split-note-by-chapters':
            return host.splitNoteByChaptersForPathCommand(
                requireString(input, 'sourcePath'),
                reporter,
                buildChapterSplitOptions(input)
            );
        case 'research.summarize-topic':
            return host.researchAndSummarizeForPathCommand(
                requireString(input, 'sourcePath'),
                optionalString(input, 'topic'),
                reporter
            );
        case 'diagram.generate':
            return host.generateDiagramForPathCommand(
                requireString(input, 'sourcePath'),
                reporter,
                buildDiagramCommandOptions(input)
            );
        case 'local-knowledge.inspect':
            return host.inspectLocalKnowledgeCommand(
                buildLocalKnowledgeInspectRequest(input),
                reporter
            );
        case 'provider.profile.export-redacted':
            assertNoInput(request.input);
            return host.exportRedactedProviderProfilesCommand();
        case 'cli.capability-manifest.export':
            assertNoInput(request.input);
            return host.exportCliCapabilityManifestCommand();
        case 'cli.invocation-contract.export':
            assertNoInput(request.input);
            return host.exportCliInvocationContractCommand();
        case 'cli.public-surface.export':
            assertNoInput(request.input);
            return host.exportCliPublicSurfaceCommand();
        default: {
            const exhaustiveCheck: never = request.operationId;
            throw new Error(`Unsupported maintainer CLI operation: ${exhaustiveCheck}`);
        }
    }
}
