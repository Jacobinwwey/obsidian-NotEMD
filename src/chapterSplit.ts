import { App, TFile, TFolder } from 'obsidian';
import { MarkdownChapterPlan, planMarkdownChapterSections } from './markdownSectionUtils';
import { ChapterSplitHeadingLevelSetting, ProgressReporter } from './types';

export interface ChapterSplitPlanFile {
    title: string;
    outputPath: string;
    markdown: string;
    breadcrumb: string[];
    nestedHeadings: Array<{ level: number; text: string; blockId: string }>;
}

export interface ChapterSplitTocMetadata {
    sourcePath: string;
    sourceBasename: string;
    requestedSplitHeadingLevel: ChapterSplitHeadingLevelSetting;
    resolvedSplitHeadingLevel: number | null;
    chapterCount: number;
    managedArtifactCount: number;
    outputFolderPath: string;
    tocPath: string;
    manifestPath: string;
    chapterTitles: string[];
    chapterNotePaths: string[];
}

export interface ChapterSplitPlanResult {
    sourcePath: string;
    requestedSplitHeadingLevel: ChapterSplitHeadingLevelSetting;
    chapterNotePaths: string[];
    managedArtifactPaths: string[];
    outputFolderPath: string;
    tocPath: string;
    manifestPath: string;
    splitLevel: number | null;
    chapters: ChapterSplitPlanFile[];
    tocMetadata: ChapterSplitTocMetadata;
    tocMarkdown: string;
}

export interface ChapterSplitResult extends ChapterSplitPlanResult {
    chapterCount: number;
    removedStaleFileCount: number;
    removedStalePaths: string[];
}

export interface ChapterSplitOptions {
    splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
}

interface ChapterSplitManifest {
    version: 1 | 2;
    sourcePath: string;
    generatedPaths: string[];
    generatedFileHashes?: Record<string, string>;
}

interface VaultAdapterWithFileOps {
    exists?: (normalizedPath: string) => Promise<boolean>;
    read?: (normalizedPath: string) => Promise<string>;
    write?: (normalizedPath: string, data: string) => Promise<void>;
    remove?: (normalizedPath: string) => Promise<void>;
}

function trimVaultPath(path: string): string {
    return path.replace(/^\/+|\/+$/g, '');
}

function resolveOutputBasename(sourceBasename: string): string {
    const trimmed = sourceBasename.trim();
    return trimmed.length > 0 ? trimmed : 'Untitled';
}

function buildOutputFolderPath(sourcePath: string, sourceBasename: string): string {
    const parentPath = trimVaultPath(sourcePath.split('/').slice(0, -1).join('/'));
    const folderName = `${resolveOutputBasename(sourceBasename)}_chapters`;
    return parentPath ? `${parentPath}/${folderName}` : folderName;
}

function buildWikiLinkTarget(path: string): string {
    return path.replace(/\.md$/i, '');
}

function toYamlString(value: string): string {
    return JSON.stringify(value);
}

function appendYamlStringArray(lines: string[], key: string, values: string[]): void {
    if (values.length === 0) {
        lines.push(`${key}: []`);
        return;
    }

    lines.push(`${key}:`);
    values.forEach(value => {
        lines.push(`  - ${toYamlString(value)}`);
    });
}

function formatRequestedSplitHeadingLevelLabel(value: ChapterSplitHeadingLevelSetting): string {
    return value === 'auto' ? 'Auto' : value.toUpperCase();
}

function formatResolvedSplitHeadingLevelLabel(value: number | null): string {
    return value === null ? 'None' : `H${value}`;
}

function formatChapterLink(order: number, chapter: ChapterSplitPlanFile): string {
    return `- [[${buildWikiLinkTarget(chapter.outputPath)}|${String(order).padStart(2, '0')}. ${chapter.title}]]`;
}

function formatNestedHeadingLink(chapter: ChapterSplitPlanFile, heading: { level: number; text: string; blockId: string }, splitLevel: number | null): string {
    const indentLevel = splitLevel === null ? 1 : Math.max(1, heading.level - splitLevel);
    return `${'  '.repeat(indentLevel)}- [[${buildWikiLinkTarget(chapter.outputPath)}#^${heading.blockId}|${heading.text}]]`;
}

function buildTocFrontMatter(metadata: ChapterSplitTocMetadata): string {
    const lines = [
        '---',
        'notemdGenerated: true',
        'notemdArtifactKind: "chapter-split-toc"',
        `sourcePath: ${toYamlString(metadata.sourcePath)}`,
        `sourceBasename: ${toYamlString(metadata.sourceBasename)}`,
        `requestedSplitHeadingLevel: ${toYamlString(metadata.requestedSplitHeadingLevel)}`,
        `resolvedSplitHeadingLevel: ${metadata.resolvedSplitHeadingLevel === null ? 'null' : metadata.resolvedSplitHeadingLevel}`,
        `chapterCount: ${metadata.chapterCount}`,
        `managedArtifactCount: ${metadata.managedArtifactCount}`,
        `outputFolderPath: ${toYamlString(metadata.outputFolderPath)}`,
        `tocPath: ${toYamlString(metadata.tocPath)}`,
        `manifestPath: ${toYamlString(metadata.manifestPath)}`
    ];

    appendYamlStringArray(lines, 'chapterNotePaths', metadata.chapterNotePaths);
    appendYamlStringArray(lines, 'chapterTitles', metadata.chapterTitles);
    lines.push('---');

    return lines.join('\n');
}

function buildTocMarkdown(metadata: ChapterSplitTocMetadata, chapters: ChapterSplitPlanFile[]): string {
    const lines = [
        buildTocFrontMatter(metadata),
        `# ${metadata.sourceBasename} TOC`,
        '',
        `Source: [[${buildWikiLinkTarget(metadata.sourcePath)}|${metadata.sourceBasename}]]`,
        `Requested split: ${formatRequestedSplitHeadingLevelLabel(metadata.requestedSplitHeadingLevel)}`,
        `Resolved split level: ${formatResolvedSplitHeadingLevelLabel(metadata.resolvedSplitHeadingLevel)}`,
        `Chapters: ${metadata.chapterCount}`,
        `Managed artifacts: ${metadata.managedArtifactCount}`,
        ''
    ];

    chapters.forEach((chapter, index) => {
        lines.push(formatChapterLink(index + 1, chapter));
        chapter.nestedHeadings.forEach(heading => {
            lines.push(formatNestedHeadingLink(chapter, heading, metadata.resolvedSplitHeadingLevel));
        });
    });

    return lines.join('\n').trim();
}

export function buildChapterSplitPlan(params: {
    sourcePath: string;
    sourceBasename: string;
    markdown: string;
    splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
}): ChapterSplitPlanResult {
    const outputFolderPath = buildOutputFolderPath(params.sourcePath, params.sourceBasename);
    const tocPath = `${outputFolderPath}/${params.sourceBasename}_TOC.md`;
    const manifestPath = `${outputFolderPath}/.notemd-chapter-split.json`;
    const chapterPlan: MarkdownChapterPlan = planMarkdownChapterSections(
        params.markdown,
        params.sourcePath,
        params.sourceBasename,
        {
            splitHeadingLevel: params.splitHeadingLevel
        }
    );
    const chapters: ChapterSplitPlanFile[] = chapterPlan.chapters.map(chapter => ({
        title: chapter.title,
        outputPath: `${outputFolderPath}/${chapter.outputFileName}`,
        markdown: chapter.markdown,
        breadcrumb: chapter.breadcrumb,
        nestedHeadings: chapter.nestedHeadings
    }));
    const chapterNotePaths = chapters.map(chapter => chapter.outputPath);
    const requestedSplitHeadingLevel = params.splitHeadingLevel ?? 'auto';
    const managedArtifactPaths = [tocPath, manifestPath, ...chapterNotePaths];
    const tocMetadata: ChapterSplitTocMetadata = {
        sourcePath: params.sourcePath,
        sourceBasename: params.sourceBasename,
        requestedSplitHeadingLevel,
        resolvedSplitHeadingLevel: chapterPlan.splitLevel,
        chapterCount: chapters.length,
        managedArtifactCount: managedArtifactPaths.length,
        outputFolderPath,
        tocPath,
        manifestPath,
        chapterTitles: chapters.map(chapter => chapter.title),
        chapterNotePaths: [...chapterNotePaths]
    };

    return {
        sourcePath: params.sourcePath,
        requestedSplitHeadingLevel,
        chapterNotePaths,
        managedArtifactPaths,
        outputFolderPath,
        tocPath,
        manifestPath,
        splitLevel: chapterPlan.splitLevel,
        chapters,
        tocMetadata,
        tocMarkdown: buildTocMarkdown(tocMetadata, chapters)
    };
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
    const existing = app.vault.getAbstractFileByPath(folderPath);
    if (!existing) {
        await app.vault.createFolder(folderPath);
        return;
    }

    if (!(existing instanceof TFolder)) {
        throw new Error(`Chapter split output path "${folderPath}" exists but is not a folder.`);
    }
}

function getVaultAdapter(app: App): VaultAdapterWithFileOps {
    return app.vault.adapter as unknown as VaultAdapterWithFileOps;
}

function normalizeContentForHash(content: string): string {
    return content.replace(/\r\n?/g, '\n');
}

function hashContent(content: string): string {
    let hash = 0x811c9dc5;
    const normalized = normalizeContentForHash(content);

    for (let index = 0; index < normalized.length; index += 1) {
        hash ^= normalized.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
}

function isFileAlreadyExistsError(error: unknown): boolean {
    return error instanceof Error
        && error.message.toLowerCase().includes('file already exists');
}

async function writeMarkdownFile(app: App, path: string, content: string): Promise<void> {
    const existing = app.vault.getFileByPath(path);
    if (existing) {
        await app.vault.modify(existing, content);
        return;
    }

    try {
        await app.vault.create(path, content);
    } catch (error) {
        if (!isFileAlreadyExistsError(error)) {
            throw error;
        }

        const refreshed = app.vault.getFileByPath(path);
        if (refreshed) {
            await app.vault.modify(refreshed, content);
            return;
        }

        const adapter = getVaultAdapter(app);
        if (typeof adapter.write === 'function') {
            await adapter.write(path, content);
            return;
        }

        throw error;
    }
}

async function readMarkdownFileByPath(app: App, path: string): Promise<string | null> {
    const existing = app.vault.getFileByPath(path);
    if (existing) {
        return app.vault.read(existing);
    }

    const adapter = getVaultAdapter(app);
    if (typeof adapter.exists === 'function' && typeof adapter.read === 'function' && await adapter.exists(path)) {
        return adapter.read(path);
    }

    return null;
}

async function loadManifest(app: App, manifestPath: string): Promise<ChapterSplitManifest | null> {
    const existing = app.vault.getFileByPath(manifestPath);
    try {
        const adapter = getVaultAdapter(app);
        if (!existing) {
            if (typeof adapter.exists !== 'function' || typeof adapter.read !== 'function') {
                return null;
            }
            if (!(await adapter.exists(manifestPath))) {
                return null;
            }
        }

        const raw = existing
            ? await app.vault.read(existing)
            : await adapter.read!(manifestPath);
        const parsed = JSON.parse(raw) as ChapterSplitManifest;

        if (parsed?.version === 1 && Array.isArray(parsed.generatedPaths)) {
            return {
                version: 1,
                sourcePath: parsed.sourcePath,
                generatedPaths: parsed.generatedPaths
            };
        }

        if (parsed?.version === 2 && Array.isArray(parsed.generatedPaths)) {
            return {
                version: 2,
                sourcePath: parsed.sourcePath,
                generatedPaths: parsed.generatedPaths,
                generatedFileHashes: parsed.generatedFileHashes ?? {}
            };
        }

        return null;
    } catch {
        return null;
    }
}

async function collectManuallyEditedManagedPaths(
    app: App,
    manifest: ChapterSplitManifest | null,
    nextContentByPath: Map<string, string>,
    nextPaths: Set<string>
): Promise<string[]> {
    if (!manifest?.generatedFileHashes) {
        return [];
    }

    const conflictingPaths: string[] = [];

    for (const path of manifest.generatedPaths) {
        const recordedHash = manifest.generatedFileHashes[path];
        if (!recordedHash) {
            continue;
        }

        const currentContent = await readMarkdownFileByPath(app, path);
        if (currentContent === null) {
            continue;
        }

        const currentHash = hashContent(currentContent);
        if (currentHash === recordedHash) {
            continue;
        }

        if (nextContentByPath.has(path) || !nextPaths.has(path)) {
            conflictingPaths.push(path);
        }
    }

    return conflictingPaths;
}

function throwIfManagedArtifactsWereEdited(conflictingPaths: string[]): void {
    if (conflictingPaths.length === 0) {
        return;
    }

    const uniquePaths = [...new Set(conflictingPaths)].sort();
    throw new Error(
        `Refusing to overwrite manually edited chapter split artifacts: ${uniquePaths.join(', ')}`
    );
}

async function cleanupStaleGeneratedFiles(
    app: App,
    manifest: ChapterSplitManifest | null,
    nextPaths: Set<string>,
    reporter?: ProgressReporter
): Promise<string[]> {
    if (!manifest) {
        return [];
    }

    const removedPaths: string[] = [];
    for (const path of manifest.generatedPaths) {
        if (nextPaths.has(path)) {
            continue;
        }

        const existing = app.vault.getFileByPath(path);
        if (existing) {
            await app.vault.delete(existing);
            removedPaths.push(path);
            reporter?.log(`Removed stale chapter split file: ${path}`);
            continue;
        }

        const adapter = getVaultAdapter(app);
        if (
            typeof adapter.exists === 'function'
            && typeof adapter.remove === 'function'
            && await adapter.exists(path)
        ) {
            await adapter.remove(path);
            removedPaths.push(path);
            reporter?.log(`Removed stale chapter split file: ${path}`);
        }
    }

    return removedPaths;
}

export async function splitNoteByChapters(
    app: App,
    file: TFile,
    reporter?: ProgressReporter,
    options: ChapterSplitOptions = {}
): Promise<ChapterSplitResult> {
    const markdown = await app.vault.read(file);
    const plan = buildChapterSplitPlan({
        sourcePath: file.path,
        sourceBasename: file.basename,
        markdown,
        splitHeadingLevel: options.splitHeadingLevel
    });
    const nextContentByPath = new Map<string, string>([
        [plan.tocPath, plan.tocMarkdown],
        ...plan.chapters.map(chapter => [chapter.outputPath, chapter.markdown] as const)
    ]);

    await ensureFolder(app, plan.outputFolderPath);

    const existingManifest = await loadManifest(app, plan.manifestPath);
    const nextPaths = new Set<string>(plan.managedArtifactPaths);
    throwIfManagedArtifactsWereEdited(
        await collectManuallyEditedManagedPaths(app, existingManifest, nextContentByPath, nextPaths)
    );
    const removedStalePaths = await cleanupStaleGeneratedFiles(app, existingManifest, nextPaths, reporter);

    for (const chapter of plan.chapters) {
        await writeMarkdownFile(app, chapter.outputPath, chapter.markdown);
    }

    await writeMarkdownFile(app, plan.tocPath, plan.tocMarkdown);
    const manifest: ChapterSplitManifest = {
        version: 2,
        sourcePath: file.path,
        generatedPaths: [plan.tocPath, ...plan.chapterNotePaths],
        generatedFileHashes: Object.fromEntries(
            [plan.tocPath, ...plan.chapterNotePaths].map(path => [
                path,
                hashContent(nextContentByPath.get(path) || '')
            ])
        )
    };
    await writeMarkdownFile(app, plan.manifestPath, JSON.stringify(manifest, null, 2));

    return {
        ...plan,
        chapterCount: plan.chapters.length,
        removedStaleFileCount: removedStalePaths.length,
        removedStalePaths
    };
}
