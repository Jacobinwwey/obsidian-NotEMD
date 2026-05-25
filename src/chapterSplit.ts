import { App, TFile, TFolder } from 'obsidian';
import { MarkdownChapterPlan, planMarkdownChapterSections } from './markdownSectionUtils';
import { ChapterSplitHeadingLevelSetting, ProgressReporter } from './types';

export interface ChapterSplitPlanFile {
    title: string;
    outputPath: string;
    markdown: string;
    breadcrumb: string[];
    nestedHeadings: Array<{ level: number; text: string }>;
}

export interface ChapterSplitPlanResult {
    sourcePath: string;
    outputFolderPath: string;
    tocPath: string;
    manifestPath: string;
    splitLevel: number | null;
    chapters: ChapterSplitPlanFile[];
    tocMarkdown: string;
}

export interface ChapterSplitResult extends ChapterSplitPlanResult {
    chapterCount: number;
    removedStaleFileCount: number;
}

export interface ChapterSplitOptions {
    splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
}

interface ChapterSplitManifest {
    version: 1;
    sourcePath: string;
    generatedPaths: string[];
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

function formatChapterLink(order: number, chapter: ChapterSplitPlanFile): string {
    return `- [[${buildWikiLinkTarget(chapter.outputPath)}|${String(order).padStart(2, '0')}. ${chapter.title}]]`;
}

function formatNestedHeadingLink(chapter: ChapterSplitPlanFile, heading: { level: number; text: string }, splitLevel: number | null): string {
    const indentLevel = splitLevel === null ? 1 : Math.max(1, heading.level - splitLevel);
    return `${'  '.repeat(indentLevel)}- [[${buildWikiLinkTarget(chapter.outputPath)}#${heading.text}|${heading.text}]]`;
}

function buildTocMarkdown(sourcePath: string, sourceBasename: string, splitLevel: number | null, chapters: ChapterSplitPlanFile[]): string {
    const lines = [
        `# ${sourceBasename} TOC`,
        '',
        `Source: [[${buildWikiLinkTarget(sourcePath)}|${sourceBasename}]]`,
        ''
    ];

    chapters.forEach((chapter, index) => {
        lines.push(formatChapterLink(index + 1, chapter));
        chapter.nestedHeadings.forEach(heading => {
            lines.push(formatNestedHeadingLink(chapter, heading, splitLevel));
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

    return {
        sourcePath: params.sourcePath,
        outputFolderPath,
        tocPath,
        manifestPath,
        splitLevel: chapterPlan.splitLevel,
        chapters,
        tocMarkdown: buildTocMarkdown(params.sourcePath, params.sourceBasename, chapterPlan.splitLevel, chapters)
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
        return parsed?.version === 1 ? parsed : null;
    } catch {
        return null;
    }
}

async function cleanupStaleGeneratedFiles(
    app: App,
    manifest: ChapterSplitManifest | null,
    nextPaths: Set<string>,
    reporter?: ProgressReporter
): Promise<number> {
    if (!manifest) {
        return 0;
    }

    let removedCount = 0;
    for (const path of manifest.generatedPaths) {
        if (nextPaths.has(path)) {
            continue;
        }

        const existing = app.vault.getFileByPath(path);
        if (existing) {
            await app.vault.delete(existing);
            removedCount += 1;
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
            removedCount += 1;
            reporter?.log(`Removed stale chapter split file: ${path}`);
        }
    }

    return removedCount;
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

    await ensureFolder(app, plan.outputFolderPath);

    const existingManifest = await loadManifest(app, plan.manifestPath);
    const nextPaths = new Set<string>([
        plan.tocPath,
        plan.manifestPath,
        ...plan.chapters.map(chapter => chapter.outputPath)
    ]);
    const removedStaleFileCount = await cleanupStaleGeneratedFiles(app, existingManifest, nextPaths, reporter);

    for (const chapter of plan.chapters) {
        await writeMarkdownFile(app, chapter.outputPath, chapter.markdown);
    }

    await writeMarkdownFile(app, plan.tocPath, plan.tocMarkdown);
    const manifest: ChapterSplitManifest = {
        version: 1,
        sourcePath: file.path,
        generatedPaths: [plan.tocPath, ...plan.chapters.map(chapter => chapter.outputPath)]
    };
    await writeMarkdownFile(app, plan.manifestPath, JSON.stringify(manifest, null, 2));

    return {
        ...plan,
        chapterCount: plan.chapters.length,
        removedStaleFileCount
    };
}
