import { normalizeNameForFilePath } from './utils';
import { ChapterSplitHeadingLevelSetting } from './types';

export interface MarkdownSection {
    title: string;
    level: number;
    breadcrumb: string[];
    markdown: string;
    searchText: string;
}

export interface MarkdownHeadingSummary {
    level: number;
    text: string;
}

export interface MarkdownChapterSection {
    title: string;
    order: number;
    outputFileName: string;
    markdown: string;
    breadcrumb: string[];
    nestedHeadings: MarkdownHeadingSummary[];
}

export interface MarkdownChapterPlan {
    splitLevel: number | null;
    chapters: MarkdownChapterSection[];
}

export interface MarkdownChapterPlanOptions {
    splitHeadingLevel?: ChapterSplitHeadingLevelSetting;
}

interface SectionAccumulator {
    title: string;
    level: number;
    breadcrumb: string[];
    lines: string[];
}

function isFenceDelimiter(line: string): boolean {
    return /^(```|~~~)/.test(line.trim());
}

function trimSectionMarkdown(markdown: string): string {
    return markdown.replace(/^\s+|\s+$/g, '');
}

export function stripMarkdownForSearch(markdown: string): string {
    if (!markdown.trim()) {
        return '';
    }

    const lines = markdown.split(/\r?\n/);
    const keptLines: string[] = [];
    let inFence = false;

    for (const line of lines) {
        if (isFenceDelimiter(line)) {
            inFence = !inFence;
            continue;
        }

        if (inFence) {
            continue;
        }

        keptLines.push(line);
    }

    return keptLines
        .join('\n')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function finalizeSection(section: SectionAccumulator | null): MarkdownSection | null {
    if (!section) {
        return null;
    }

    const markdown = trimSectionMarkdown(section.lines.join('\n'));
    if (!markdown) {
        return null;
    }

    return {
        title: section.title,
        level: section.level,
        breadcrumb: [...section.breadcrumb],
        markdown,
        searchText: stripMarkdownForSearch(markdown)
    };
}

export function parseMarkdownSections(markdown: string, sourceTitle: string): MarkdownSection[] {
    const lines = markdown.split(/\r?\n/);
    const sections: MarkdownSection[] = [];
    const headingStack: Array<{ level: number; title: string }> = [];
    let inFence = false;
    let currentSection: SectionAccumulator | null = {
        title: sourceTitle,
        level: 0,
        breadcrumb: [sourceTitle],
        lines: []
    };

    for (const line of lines) {
        if (isFenceDelimiter(line)) {
            inFence = !inFence;
            currentSection?.lines.push(line);
            continue;
        }

        if (!inFence) {
            const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
            if (headingMatch) {
                const finalized = finalizeSection(currentSection);
                if (finalized) {
                    sections.push(finalized);
                }

                const level = headingMatch[1].length;
                const title = headingMatch[2].trim();
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                    headingStack.pop();
                }
                headingStack.push({ level, title });

                currentSection = {
                    title,
                    level,
                    breadcrumb: headingStack.map(item => item.title),
                    lines: [line]
                };
                continue;
            }
        }

        currentSection?.lines.push(line);
    }

    const finalized = finalizeSection(currentSection);
    if (finalized) {
        sections.push(finalized);
    }

    return sections;
}

export function resolveConfiguredChapterSplitHeadingLevel(
    setting: ChapterSplitHeadingLevelSetting | undefined
): number | null {
    switch (setting) {
        case 'h1':
            return 1;
        case 'h2':
            return 2;
        case 'h3':
            return 3;
        case 'h4':
            return 4;
        case 'h5':
            return 5;
        case 'h6':
            return 6;
        default:
            return null;
    }
}

export function resolveChapterSplitHeadingLevel(
    sections: MarkdownSection[],
    configuredSplitLevel?: number | null
): number | null {
    if (configuredSplitLevel !== undefined && configuredSplitLevel !== null) {
        const hasConfiguredLevel = sections.some(section => section.level === configuredSplitLevel);
        if (!hasConfiguredLevel) {
            throw new Error(`Configured chapter split heading level H${configuredSplitLevel} was not found in the note.`);
        }
        return configuredSplitLevel;
    }

    const headingSections = sections.filter(section => section.level > 0);
    if (headingSections.length === 0) {
        return null;
    }

    const h1Sections = headingSections.filter(section => section.level === 1);
    const hasH2Sections = headingSections.some(section => section.level === 2);
    if (h1Sections.length === 1 && hasH2Sections) {
        return 2;
    }

    return Math.min(...headingSections.map(section => section.level));
}

function buildFallbackSlug(order: number): string {
    return `chapter-${String(order).padStart(2, '0')}`;
}

function buildChapterFileName(title: string, order: number): string {
    const normalized = normalizeNameForFilePath(title)
        .normalize('NFKC')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{Letter}\p{Number}\p{Mark}-]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    const slug = normalized || buildFallbackSlug(order);
    return `${String(order).padStart(2, '0')}-${slug}.md`;
}

function collectNestedHeadings(chapterSections: MarkdownSection[], splitLevel: number): MarkdownHeadingSummary[] {
    return chapterSections
        .filter(section => section.level > splitLevel)
        .map(section => ({
            level: section.level,
            text: section.title
        }));
}

export function planMarkdownChapterSections(
    markdown: string,
    sourcePath: string,
    sourceTitle: string,
    options: MarkdownChapterPlanOptions = {}
): MarkdownChapterPlan {
    const sections = parseMarkdownSections(markdown, sourceTitle);
    const splitLevel = resolveChapterSplitHeadingLevel(
        sections,
        resolveConfiguredChapterSplitHeadingLevel(options.splitHeadingLevel)
    );

    if (splitLevel === null) {
        return {
            splitLevel: null,
            chapters: [
                {
                    title: sourceTitle,
                    order: 1,
                    outputFileName: buildChapterFileName(sourceTitle, 1),
                    markdown: trimSectionMarkdown(markdown),
                    breadcrumb: [sourceTitle],
                    nestedHeadings: []
                }
            ]
        };
    }

    const splitIndexes = sections
        .map((section, index) => ({ section, index }))
        .filter(item => item.section.level === splitLevel);

    const preambleSections = sections.filter(section => section.level < splitLevel);
    const chapters: MarkdownChapterSection[] = splitIndexes.map(({ section, index }, chapterIndex) => {
        const nextStartIndex = splitIndexes[chapterIndex + 1]?.index ?? sections.length;
        const groupedSections = sections.slice(index, nextStartIndex);
        const groupedMarkdown = groupedSections.map(item => item.markdown).join('\n\n');
        const order = chapterIndex + 1;
        const markdownWithPreamble = chapterIndex === 0 && preambleSections.length > 0
            ? `${preambleSections.map(item => item.markdown).join('\n\n')}\n\n${groupedMarkdown}`
            : groupedMarkdown;

        return {
            title: section.title,
            order,
            outputFileName: buildChapterFileName(section.title, order),
            markdown: trimSectionMarkdown(markdownWithPreamble),
            breadcrumb: [...section.breadcrumb],
            nestedHeadings: collectNestedHeadings(groupedSections, splitLevel)
        };
    });

    return {
        splitLevel,
        chapters
    };
}
