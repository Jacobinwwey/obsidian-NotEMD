type MiniSearchIndex<T = any> = import('minisearch').default<T>;
const MiniSearch = require('minisearch') as typeof import('minisearch').default;
import { App, TFile } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { parseMarkdownSections } from './markdownSectionUtils';

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
}

export interface LocalKnowledgeBaseRetriever {
    readonly indexedFileCount: number;
    readonly indexedSectionCount: number;
    buildContextDetails: (query: string, options: RetrieveContextOptions) => LocalKnowledgeContextBuildResult;
    buildContext: (query: string, options: RetrieveContextOptions) => string | null;
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

function buildKnowledgePathList(settings: NotemdSettings): string[] {
    return settings.localKnowledgeBasePaths
        .split('\n')
        .map(path => normalizeVaultPath(path))
        .filter(Boolean);
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

function formatHitContext(documents: LocalKnowledgeDocument[], maxSnippetChars: number): string | null {
    if (documents.length === 0) {
        return null;
    }

    return documents.map((document, index) => {
        const headingLine = document.heading ? `Heading: ${document.heading}\n` : '';
        return [
            `[${index + 1}] Path: ${document.path}`,
            headingLine ? headingLine.trimEnd() : null,
            document.breadcrumb ? `Breadcrumb: ${document.breadcrumb}` : null,
            `Excerpt: ${truncateSnippet(document.excerpt, maxSnippetChars)}`
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

export function createEmptyLocalKnowledgeContextBuildResult(
    query: string,
    options: RetrieveContextOptions,
    overrides?: Partial<Pick<LocalKnowledgeContextBuildResult, 'indexedFileCount' | 'indexedSectionCount' | 'excludeCurrentFileApplied' | 'indexBuildMs'>>
): LocalKnowledgeContextBuildResult {
    return {
        query: normalizeQuery(query),
        context: null,
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

        const context = formatHitContext(picked, options.maxSnippetChars);

        return {
            query: normalizedQuery,
            context,
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

export async function buildLocalKnowledgeBaseRetriever(
    app: App,
    settings: NotemdSettings,
    reporter?: ProgressReporter
): Promise<LocalKnowledgeBaseRetriever | null> {
    const buildStartMs = Date.now();
    if (!settings.enableLocalKnowledgeRetrieval) {
        return null;
    }

    const configuredPaths = buildKnowledgePathList(settings);
    if (configuredPaths.length === 0) {
        reporter?.log('Local knowledge retrieval is enabled, but no local knowledge paths are configured.');
        return null;
    }

    const candidateFiles = app.vault
        .getFiles()
        .filter(isKnowledgeFileCandidate)
        .filter(file => matchesConfiguredKnowledgePath(file, configuredPaths));

    if (candidateFiles.length === 0) {
        reporter?.log('No eligible local knowledge files were found for the configured knowledge base paths.');
        return null;
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
        return null;
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

    return new MiniSearchLocalKnowledgeRetriever(
        index,
        documentMap,
        documentsByPath,
        seenFilePaths.size,
        documents.length,
        indexBuildMs,
        settings.localKnowledgeExcludeCurrentFile
    );
}
