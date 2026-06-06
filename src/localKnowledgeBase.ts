type MiniSearchIndex<T = any> = import('minisearch').default<T>;
const MiniSearch = require('minisearch') as typeof import('minisearch').default;
import { App, TFile } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { parseMarkdownSections, stripMarkdownForSearch } from './markdownSectionUtils';

export type LocalKnowledgeTaskScope = 'generateTitle' | 'batchGenerateFromTitles' | 'researchSummarize' | 'diagramGeneration';
export type LocalKnowledgePathSource = 'override' | 'task-specific' | 'default';
export type LocalKnowledgeRetrieverBuildStatus =
    | 'disabled'
    | 'no-paths'
    | 'no-candidate-files'
    | 'no-retrievable-sections'
    | 'ready';

interface LocalKnowledgeDocument {
    id: string;
    path: string;
    fileTitle: string;
    heading: string;
    breadcrumb: string;
    sectionIndex: number;
    content: string;
    excerpt: string;
}

interface RetrieveContextOptions {
    currentFilePath?: string;
    topK: number;
    slidingWindowSize: number;
    maxSnippetChars: number;
}

export interface ResolvedLocalKnowledgePathConfig {
    pathSource: LocalKnowledgePathSource;
    paths: string[];
}

export interface LocalKnowledgeInspectRequest {
    taskScope: LocalKnowledgeTaskScope;
    sourcePath?: string;
    currentFilePath?: string;
    query?: string;
    knowledgePaths?: string[];
    topK?: number;
    slidingWindowSize?: number;
    maxSnippetChars?: number;
}

export type LocalKnowledgeInspectQueryDerivation = 'explicit' | 'basename' | 'diagram-source';
export type LocalKnowledgeInspectQueryCaution =
    | 'generic-navigation-basename'
    | 'diagram-source-built-from-navigation-like-note';

export interface LocalKnowledgeInspectQueryDiagnostics {
    derivedBasename: string | null;
    strippedSourceCharsUsed: number;
    cautions: LocalKnowledgeInspectQueryCaution[];
}

export interface LocalKnowledgeInspectResult {
    taskScope: LocalKnowledgeTaskScope;
    globalEnabled: boolean;
    taskEnabled: boolean;
    effectivePathSource: LocalKnowledgePathSource;
    effectiveConfiguredPaths: string[];
    sourcePath: string | null;
    query: string;
    queryDerivation: LocalKnowledgeInspectQueryDerivation;
    queryDiagnostics: LocalKnowledgeInspectQueryDiagnostics;
    currentFilePath: string | null;
    retrievalOptions: {
        topK: number;
        slidingWindowSize: number;
        maxSnippetChars: number;
        excludeCurrentFile: boolean;
    };
    retrieverBuildStatus: LocalKnowledgeRetrieverBuildStatus;
    retrieverCreated: boolean;
    candidateFilePaths: string[];
    context: string | null;
    contextBlocks: LocalKnowledgeContextBlock[];
    retrieval: LocalKnowledgeContextBuildResult;
}

export interface LocalKnowledgeRetrievalSummary {
    indexedFileCount: number;
    indexedSectionCount: number;
    matchedSectionCount: number;
    returnedHitCount: number;
    expandedSectionCount: number;
    sourcePaths: string[];
    usedSlidingWindowSize: number;
    requestedTopK: number;
    indexBuildMs: number;
    queryMs: number;
    contextCharCount: number;
    excludeCurrentFileApplied: boolean;
    excludedCurrentFileHitCount: number;
}

export interface LocalKnowledgeContextBuildResult extends LocalKnowledgeRetrievalSummary {
    query: string;
    context: string | null;
    contextBlocks: LocalKnowledgeContextBlock[];
}

export interface LocalKnowledgeContextBlock {
    index: number;
    path: string;
    heading: string;
    breadcrumb: string;
    excerpt: string;
    excerptCharCount: number;
    excerptWasTruncated: boolean;
}

export interface LocalKnowledgeBaseRetriever {
    readonly indexedFileCount: number;
    readonly indexedSectionCount: number;
    buildContextDetails: (query: string, options: RetrieveContextOptions) => LocalKnowledgeContextBuildResult;
    buildContext: (query: string, options: RetrieveContextOptions) => string | null;
}

interface LocalKnowledgeRetrieverBuildState {
    status: LocalKnowledgeRetrieverBuildStatus;
    pathSource: LocalKnowledgePathSource;
    configuredPaths: string[];
    candidateFilePaths: string[];
    indexedFileCount: number;
    indexedSectionCount: number;
    indexBuildMs: number;
    retriever: LocalKnowledgeBaseRetriever | null;
}

interface LocalKnowledgeRetrieverBuildOptions {
    respectEnablement?: boolean;
    pathOverrideList?: string[];
}

function normalizeVaultPath(value: string): string {
    return value.trim().replace(/^\/+|\/+$/g, '');
}

function normalizeForComparison(value: string): string {
    return normalizeVaultPath(value).toLowerCase();
}

function truncateSnippet(value: string, maxChars: number): string {
    if (value.length <= maxChars) {
        return value;
    }

    return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function normalizeKnowledgePathList(values: readonly string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    values.forEach(value => {
        const candidate = normalizeVaultPath(value);
        if (!candidate) {
            return;
        }

        const dedupeKey = normalizeForComparison(candidate);
        if (seen.has(dedupeKey)) {
            return;
        }

        seen.add(dedupeKey);
        normalized.push(candidate);
    });

    return normalized;
}

function buildKnowledgePathListFromValue(value: string): string[] {
    return normalizeKnowledgePathList(value.split('\n'));
}

function getTaskSpecificKnowledgePathValue(
    settings: NotemdSettings,
    taskScope?: LocalKnowledgeTaskScope
): string {
    switch (taskScope) {
        case 'generateTitle':
            return settings.localKnowledgeGenerateTitlePaths;
        case 'batchGenerateFromTitles':
            return settings.localKnowledgeBatchGenerateFromTitlesPaths;
        case 'researchSummarize':
            return settings.localKnowledgeResearchSummarizePaths;
        case 'diagramGeneration':
            return settings.localKnowledgeDiagramGenerationPaths;
        default:
            return '';
    }
}

export function resolveLocalKnowledgePathConfig(
    settings: NotemdSettings,
    taskScope?: LocalKnowledgeTaskScope,
    options: {
        overridePaths?: string[];
    } = {}
): ResolvedLocalKnowledgePathConfig {
    if (options.overridePaths !== undefined) {
        return {
            pathSource: 'override',
            paths: normalizeKnowledgePathList(options.overridePaths ?? [])
        };
    }

    const taskSpecificPaths = buildKnowledgePathListFromValue(
        getTaskSpecificKnowledgePathValue(settings, taskScope)
    );
    if (taskSpecificPaths.length > 0) {
        return {
            pathSource: 'task-specific',
            paths: taskSpecificPaths
        };
    }

    return {
        pathSource: 'default',
        paths: buildKnowledgePathListFromValue(settings.localKnowledgeBasePaths)
    };
}

export function resolveLocalKnowledgePathList(
    settings: NotemdSettings,
    taskScope?: LocalKnowledgeTaskScope
): string[] {
    return resolveLocalKnowledgePathConfig(settings, taskScope).paths;
}

export function isLocalKnowledgeEnabledForTask(
    settings: NotemdSettings,
    taskScope: LocalKnowledgeTaskScope
): boolean {
    if (!settings.enableLocalKnowledgeRetrieval) {
        return false;
    }

    switch (taskScope) {
        case 'generateTitle':
            return settings.enableLocalKnowledgeForGenerateTitle;
        case 'batchGenerateFromTitles':
            return settings.enableLocalKnowledgeForBatchGenerateFromTitles;
        case 'researchSummarize':
            return settings.enableLocalKnowledgeForResearchSummarize;
        case 'diagramGeneration':
            return settings.enableLocalKnowledgeForDiagramGeneration;
        default:
            return false;
    }
}

function isKnowledgeFileCandidate(file: TFile): boolean {
    return file.extension === 'md' || file.extension === 'txt';
}

function matchesConfiguredKnowledgePath(file: TFile, configuredPaths: string[]): boolean {
    const normalizedFilePath = normalizeForComparison(file.path);
    return configuredPaths.some(configuredPath => {
        const normalizedConfiguredPath = normalizeForComparison(configuredPath);
        return normalizedFilePath === normalizedConfiguredPath
            || normalizedFilePath.startsWith(`${normalizedConfiguredPath}/`);
    });
}

function buildContextBlocks(
    documents: LocalKnowledgeDocument[],
    maxSnippetChars: number
): LocalKnowledgeContextBlock[] {
    return documents.map((document, index) => {
        const excerpt = truncateSnippet(document.excerpt, maxSnippetChars);
        return {
            index: index + 1,
            path: document.path,
            heading: document.heading,
            breadcrumb: document.breadcrumb,
            excerpt,
            excerptCharCount: excerpt.length,
            excerptWasTruncated: excerpt.length < document.excerpt.length
        };
    });
}

function formatContextBlocks(blocks: LocalKnowledgeContextBlock[]): string | null {
    if (blocks.length === 0) {
        return null;
    }

    return blocks.map(block => {
        const headingLine = block.heading ? `Heading: ${block.heading}\n` : '';
        return [
            `[${block.index}] Path: ${block.path}`,
            headingLine ? headingLine.trimEnd() : null,
            block.breadcrumb ? `Breadcrumb: ${block.breadcrumb}` : null,
            `Excerpt: ${block.excerpt}`
        ].filter(Boolean).join('\n');
    }).join('\n\n');
}

function sanitizeRequestedTopK(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.floor(value));
}

function sanitizeSlidingWindowSize(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.floor(value));
}

function normalizeQuery(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
}

function sanitizeMaxSnippetChars(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.floor(value));
}

function normalizeOptionalPath(value?: string): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = normalizeVaultPath(value);
    return normalized.length > 0 ? normalized : undefined;
}

function buildTitleLikeQueryFromPath(sourcePath: string): string {
    return sourcePath.split('/').pop()?.replace(/\.[^.]+$/u, '')?.trim() || '';
}

function normalizeDerivedBasenameForSignalChecks(value: string): string {
    return value.trim().toLowerCase();
}

function isGenericNavigationBasename(value: string): boolean {
    const normalized = normalizeDerivedBasenameForSignalChecks(value);
    return /^(?:index|readme|home|overview|summary)(?:[._-][a-z0-9_]+)*$/iu.test(normalized);
}

export function buildDiagramLocalKnowledgeQuery(sourcePath: string | undefined, sourceMarkdown: string): string {
    const strippedMarkdown = stripMarkdownForSearch(sourceMarkdown);

    return [
        sourcePath?.split('/').pop()?.replace(/\.[^.]+$/u, ''),
        strippedMarkdown.slice(0, 1200)
    ].filter((value): value is string => Boolean(value && value.trim())).join('\n');
}

function findVaultFileByPath(app: App, sourcePath: string): TFile | null {
    return app.vault.getFileByPath(sourcePath)
        || app.vault.getFiles().find(candidate => normalizeForComparison(candidate.path) === normalizeForComparison(sourcePath))
        || null;
}

export function createEmptyLocalKnowledgeContextBuildResult(
    query: string,
    options: RetrieveContextOptions,
    overrides?: Partial<Pick<LocalKnowledgeContextBuildResult, 'indexedFileCount' | 'indexedSectionCount' | 'excludeCurrentFileApplied' | 'indexBuildMs'>>
): LocalKnowledgeContextBuildResult {
    return {
        query: normalizeQuery(query),
        context: null,
        contextBlocks: [],
        indexedFileCount: overrides?.indexedFileCount ?? 0,
        indexedSectionCount: overrides?.indexedSectionCount ?? 0,
        matchedSectionCount: 0,
        returnedHitCount: 0,
        expandedSectionCount: 0,
        sourcePaths: [],
        usedSlidingWindowSize: sanitizeSlidingWindowSize(options.slidingWindowSize),
        requestedTopK: sanitizeRequestedTopK(options.topK),
        indexBuildMs: overrides?.indexBuildMs ?? 0,
        queryMs: 0,
        contextCharCount: 0,
        excludeCurrentFileApplied: overrides?.excludeCurrentFileApplied ?? false,
        excludedCurrentFileHitCount: 0
    };
}

export function toLocalKnowledgeRetrievalSummary(
    details: LocalKnowledgeContextBuildResult
): LocalKnowledgeRetrievalSummary {
    const {
        indexedFileCount,
        indexedSectionCount,
        matchedSectionCount,
        returnedHitCount,
        expandedSectionCount,
        sourcePaths,
        usedSlidingWindowSize,
        requestedTopK,
        indexBuildMs,
        queryMs,
        contextCharCount,
        excludeCurrentFileApplied,
        excludedCurrentFileHitCount
    } = details;

    return {
        indexedFileCount,
        indexedSectionCount,
        matchedSectionCount,
        returnedHitCount,
        expandedSectionCount,
        sourcePaths,
        usedSlidingWindowSize,
        requestedTopK,
        indexBuildMs,
        queryMs,
        contextCharCount,
        excludeCurrentFileApplied,
        excludedCurrentFileHitCount
    };
}

class MiniSearchLocalKnowledgeRetriever implements LocalKnowledgeBaseRetriever {
    constructor(
        private readonly index: MiniSearchIndex<LocalKnowledgeDocument>,
        private readonly documents: Map<string, LocalKnowledgeDocument>,
        private readonly documentsByPath: Map<string, LocalKnowledgeDocument[]>,
        public readonly indexedFileCount: number,
        public readonly indexedSectionCount: number,
        private readonly indexBuildMs: number,
        private readonly excludeCurrentFile: boolean
    ) {}

    private expandHitWindow(document: LocalKnowledgeDocument, slidingWindowSize: number, consumedIds: Set<string>): LocalKnowledgeDocument[] {
        if (consumedIds.has(document.id)) {
            return [];
        }

        const fileDocuments = this.documentsByPath.get(document.path) || [];
        const start = Math.max(0, document.sectionIndex - slidingWindowSize);
        const end = Math.min(fileDocuments.length - 1, document.sectionIndex + slidingWindowSize);
        const expanded = fileDocuments
            .slice(start, end + 1)
            .filter(candidate => !consumedIds.has(candidate.id));

        if (expanded.length === 0) {
            return [];
        }

        expanded.forEach(candidate => consumedIds.add(candidate.id));
        return expanded;
    }

    buildContextDetails(query: string, options: RetrieveContextOptions): LocalKnowledgeContextBuildResult {
        const queryStartMs = Date.now();
        const normalizedQuery = normalizeQuery(query);
        if (!normalizedQuery) {
            return createEmptyLocalKnowledgeContextBuildResult(query, options, {
                indexedFileCount: this.indexedFileCount,
                indexedSectionCount: this.indexedSectionCount,
                indexBuildMs: this.indexBuildMs,
                excludeCurrentFileApplied: false
            });
        }

        const results = this.index.search(normalizedQuery, {
            prefix: (term: string) => term.length >= 4,
            fuzzy: (term: string) => term.length >= 7 ? 0.2 : false,
            boost: {
                fileTitle: 3,
                heading: 2,
                breadcrumb: 2,
                content: 1
            }
        });

        const currentFilePath = options.currentFilePath ? normalizeForComparison(options.currentFilePath) : null;
        const requestedTopK = sanitizeRequestedTopK(options.topK);
        const slidingWindowSize = sanitizeSlidingWindowSize(options.slidingWindowSize);
        const excludeCurrentFileApplied = this.excludeCurrentFile && Boolean(currentFilePath);
        const consumedDocumentIds = new Set<string>();
        const picked: LocalKnowledgeDocument[] = [];
        const sourcePaths = new Set<string>();
        let expandedSectionCount = 0;
        let excludedCurrentFileHitCount = 0;

        for (const result of results) {
            const document = this.documents.get(String(result.id));
            if (!document) {
                continue;
            }

            if (excludeCurrentFileApplied && normalizeForComparison(document.path) === currentFilePath) {
                excludedCurrentFileHitCount += 1;
                continue;
            }

            const expandedWindow = this.expandHitWindow(document, slidingWindowSize, consumedDocumentIds);
            if (expandedWindow.length === 0) {
                continue;
            }

            picked.push({
                ...document,
                excerpt: expandedWindow.map(candidate => candidate.excerpt).join('\n\n')
            });
            sourcePaths.add(document.path);
            expandedSectionCount += expandedWindow.length;
            if (requestedTopK > 0 && picked.length >= requestedTopK) {
                break;
            }
        }

        const contextBlocks = buildContextBlocks(picked, options.maxSnippetChars);
        const context = formatContextBlocks(contextBlocks);

        return {
            query: normalizedQuery,
            context,
            contextBlocks,
            indexedFileCount: this.indexedFileCount,
            indexedSectionCount: this.indexedSectionCount,
            matchedSectionCount: results.length,
            returnedHitCount: picked.length,
            expandedSectionCount,
            sourcePaths: Array.from(sourcePaths),
            usedSlidingWindowSize: slidingWindowSize,
            requestedTopK,
            indexBuildMs: this.indexBuildMs,
            queryMs: Math.max(0, Date.now() - queryStartMs),
            contextCharCount: context?.length ?? 0,
            excludeCurrentFileApplied,
            excludedCurrentFileHitCount
        };
    }

    buildContext(query: string, options: RetrieveContextOptions): string | null {
        return this.buildContextDetails(query, options).context;
    }
}

async function buildLocalKnowledgeRetrieverState(
    app: App,
    settings: NotemdSettings,
    reporter?: ProgressReporter,
    taskScope?: LocalKnowledgeTaskScope,
    options: LocalKnowledgeRetrieverBuildOptions = {}
): Promise<LocalKnowledgeRetrieverBuildState> {
    const buildStartMs = Date.now();
    const respectEnablement = options.respectEnablement !== false;
    const pathConfig = resolveLocalKnowledgePathConfig(settings, taskScope, {
        overridePaths: options.pathOverrideList
    });

    if (respectEnablement && !settings.enableLocalKnowledgeRetrieval) {
        return {
            status: 'disabled',
            pathSource: pathConfig.pathSource,
            configuredPaths: pathConfig.paths,
            candidateFilePaths: [],
            indexedFileCount: 0,
            indexedSectionCount: 0,
            indexBuildMs: 0,
            retriever: null
        };
    }

    if (pathConfig.paths.length === 0) {
        reporter?.log('Local knowledge retrieval is enabled, but no local knowledge paths are configured.');
        return {
            status: 'no-paths',
            pathSource: pathConfig.pathSource,
            configuredPaths: pathConfig.paths,
            candidateFilePaths: [],
            indexedFileCount: 0,
            indexedSectionCount: 0,
            indexBuildMs: 0,
            retriever: null
        };
    }

    const candidateFiles = app.vault
        .getFiles()
        .filter(isKnowledgeFileCandidate)
        .filter(file => matchesConfiguredKnowledgePath(file, pathConfig.paths));
    const candidateFilePaths = candidateFiles.map(file => file.path);

    if (candidateFiles.length === 0) {
        reporter?.log('No eligible local knowledge files were found for the configured knowledge base paths.');
        return {
            status: 'no-candidate-files',
            pathSource: pathConfig.pathSource,
            configuredPaths: pathConfig.paths,
            candidateFilePaths,
            indexedFileCount: 0,
            indexedSectionCount: 0,
            indexBuildMs: Math.max(0, Date.now() - buildStartMs),
            retriever: null
        };
    }

    const documents: LocalKnowledgeDocument[] = [];
    const seenFilePaths = new Set<string>();

    for (const file of candidateFiles) {
        const markdown = await app.vault.read(file);
        const sections = parseMarkdownSections(markdown, file.basename);
        seenFilePaths.add(file.path);

        sections.forEach((section, index) => {
            const excerpt = section.markdown.trim();
            const content = section.searchText.trim();
            if (!content) {
                return;
            }

            documents.push({
                id: `${file.path}::${index}`,
                path: file.path,
                fileTitle: file.basename,
                heading: section.level > 0 ? section.title : '',
                breadcrumb: section.breadcrumb.join(' > '),
                sectionIndex: index,
                content,
                excerpt
            });
        });
    }

    if (documents.length === 0) {
        reporter?.log('Local knowledge files were found, but no retrievable sections were produced.');
        return {
            status: 'no-retrievable-sections',
            pathSource: pathConfig.pathSource,
            configuredPaths: pathConfig.paths,
            candidateFilePaths,
            indexedFileCount: seenFilePaths.size,
            indexedSectionCount: 0,
            indexBuildMs: Math.max(0, Date.now() - buildStartMs),
            retriever: null
        };
    }

    const index: MiniSearchIndex<LocalKnowledgeDocument> = new MiniSearch({
        fields: ['fileTitle', 'heading', 'breadcrumb', 'content'],
        storeFields: ['path', 'fileTitle', 'heading', 'breadcrumb', 'excerpt']
    });
    index.addAll(documents);
    const indexBuildMs = Math.max(0, Date.now() - buildStartMs);
    reporter?.log(`Indexed ${documents.length} local knowledge sections from ${seenFilePaths.size} files in ${indexBuildMs}ms.`);

    const documentMap = new Map<string, LocalKnowledgeDocument>();
    documents.forEach(document => {
        documentMap.set(document.id, document);
    });

    const documentsByPath = new Map<string, LocalKnowledgeDocument[]>();
    documents.forEach(document => {
        const fileDocuments = documentsByPath.get(document.path) || [];
        fileDocuments.push(document);
        documentsByPath.set(document.path, fileDocuments);
    });
    documentsByPath.forEach(fileDocuments => {
        fileDocuments.sort((left, right) => left.sectionIndex - right.sectionIndex);
    });

    return {
        status: 'ready',
        pathSource: pathConfig.pathSource,
        configuredPaths: pathConfig.paths,
        candidateFilePaths,
        indexedFileCount: seenFilePaths.size,
        indexedSectionCount: documents.length,
        indexBuildMs,
        retriever: new MiniSearchLocalKnowledgeRetriever(
            index,
            documentMap,
            documentsByPath,
            seenFilePaths.size,
            documents.length,
            indexBuildMs,
            settings.localKnowledgeExcludeCurrentFile
        )
    };
}

async function resolveLocalKnowledgeInspectQuery(
    app: App,
    request: LocalKnowledgeInspectRequest
): Promise<{
    query: string;
    queryDerivation: LocalKnowledgeInspectQueryDerivation;
    queryDiagnostics: LocalKnowledgeInspectQueryDiagnostics;
}> {
    const explicitQuery = normalizeQuery(request.query ?? '');
    if (explicitQuery) {
        return {
            query: explicitQuery,
            queryDerivation: 'explicit',
            queryDiagnostics: {
                derivedBasename: null,
                strippedSourceCharsUsed: 0,
                cautions: []
            }
        };
    }

    const sourcePath = normalizeOptionalPath(request.sourcePath);
    if (!sourcePath) {
        throw new Error('Local knowledge inspect requires a non-empty "query" or "sourcePath".');
    }

    if (request.taskScope === 'diagramGeneration') {
        const file = findVaultFileByPath(app, sourcePath);
        if (!file || !['md', 'txt'].includes(file.extension)) {
            throw new Error(
                `Local knowledge inspect needs an existing Markdown/text "sourcePath" to derive a diagram query: ${sourcePath}.`
            );
        }

        const derivedBasename = buildTitleLikeQueryFromPath(sourcePath);
        const strippedSourceMarkdown = stripMarkdownForSearch(await app.vault.read(file));
        const strippedSourceCharsUsed = strippedSourceMarkdown.slice(0, 1200).length;
        const cautions: LocalKnowledgeInspectQueryCaution[] = [];
        if (derivedBasename && isGenericNavigationBasename(derivedBasename)) {
            cautions.push('diagram-source-built-from-navigation-like-note');
        }

        return {
            query: [
                derivedBasename,
                strippedSourceMarkdown.slice(0, 1200)
            ].filter((value): value is string => Boolean(value && value.trim())).join('\n'),
            queryDerivation: 'diagram-source',
            queryDiagnostics: {
                derivedBasename: derivedBasename || null,
                strippedSourceCharsUsed,
                cautions
            }
        };
    }

    const basenameQuery = buildTitleLikeQueryFromPath(sourcePath);
    if (!basenameQuery) {
        throw new Error(`Could not derive a local knowledge query from source path: ${sourcePath}`);
    }

    const cautions: LocalKnowledgeInspectQueryCaution[] = [];
    if (isGenericNavigationBasename(basenameQuery)) {
        cautions.push('generic-navigation-basename');
    }

    return {
        query: basenameQuery,
        queryDerivation: 'basename',
        queryDiagnostics: {
            derivedBasename: basenameQuery,
            strippedSourceCharsUsed: 0,
            cautions
        }
    };
}

export async function buildLocalKnowledgeBaseRetriever(
    app: App,
    settings: NotemdSettings,
    reporter?: ProgressReporter,
    taskScope?: LocalKnowledgeTaskScope
): Promise<LocalKnowledgeBaseRetriever | null> {
    const buildState = await buildLocalKnowledgeRetrieverState(app, settings, reporter, taskScope, {
        respectEnablement: true
    });
    return buildState.retriever;
}

export async function inspectLocalKnowledgeRetrieval(
    app: App,
    settings: NotemdSettings,
    request: LocalKnowledgeInspectRequest,
    reporter?: ProgressReporter
): Promise<LocalKnowledgeInspectResult> {
    const sourcePath = normalizeOptionalPath(request.sourcePath) ?? null;
    const currentFilePath = normalizeOptionalPath(request.currentFilePath) ?? sourcePath ?? undefined;
    const { query, queryDerivation, queryDiagnostics } = await resolveLocalKnowledgeInspectQuery(app, request);
    const topK = request.topK ?? settings.localKnowledgeTopK;
    const slidingWindowSize = request.slidingWindowSize ?? settings.localKnowledgeSlidingWindowSize;
    const maxSnippetChars = request.maxSnippetChars ?? settings.localKnowledgeMaxSnippetChars;
    const retrievalOptions = {
        topK: sanitizeRequestedTopK(topK),
        slidingWindowSize: sanitizeSlidingWindowSize(slidingWindowSize),
        maxSnippetChars: sanitizeMaxSnippetChars(maxSnippetChars),
        excludeCurrentFile: settings.localKnowledgeExcludeCurrentFile
    };
    const buildState = await buildLocalKnowledgeRetrieverState(
        app,
        settings,
        reporter,
        request.taskScope,
        {
            respectEnablement: false,
            ...(Object.prototype.hasOwnProperty.call(request, 'knowledgePaths')
                ? { pathOverrideList: request.knowledgePaths ?? [] }
                : {})
        }
    );
    const retrieval = buildState.retriever
        ? buildState.retriever.buildContextDetails(query, {
            currentFilePath,
            topK: retrievalOptions.topK,
            slidingWindowSize: retrievalOptions.slidingWindowSize,
            maxSnippetChars: retrievalOptions.maxSnippetChars
        })
        : createEmptyLocalKnowledgeContextBuildResult(query, {
            currentFilePath,
            topK: retrievalOptions.topK,
            slidingWindowSize: retrievalOptions.slidingWindowSize,
            maxSnippetChars: retrievalOptions.maxSnippetChars
        }, {
            indexedFileCount: buildState.indexedFileCount,
            indexedSectionCount: buildState.indexedSectionCount,
            excludeCurrentFileApplied: Boolean(
                settings.localKnowledgeExcludeCurrentFile && currentFilePath
            ),
            indexBuildMs: buildState.indexBuildMs
        });

    return {
        taskScope: request.taskScope,
        globalEnabled: settings.enableLocalKnowledgeRetrieval,
        taskEnabled: isLocalKnowledgeEnabledForTask(settings, request.taskScope),
        effectivePathSource: buildState.pathSource,
        effectiveConfiguredPaths: buildState.configuredPaths,
        sourcePath,
        query,
        queryDerivation,
        queryDiagnostics,
        currentFilePath: currentFilePath ?? null,
        retrievalOptions,
        retrieverBuildStatus: buildState.status,
        retrieverCreated: Boolean(buildState.retriever),
        candidateFilePaths: buildState.candidateFilePaths,
        context: retrieval.context,
        contextBlocks: retrieval.contextBlocks,
        retrieval
    };
}
