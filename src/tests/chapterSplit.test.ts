import { TFile, TFolder } from 'obsidian';
import { buildChapterSplitPlan, splitNoteByChapters } from '../chapterSplit';

function createFile(path: string): TFile {
    const name = path.split('/').pop() || path;
    return Object.assign(new (TFile as any)(), {
        path,
        name,
        extension: 'md',
        basename: name.replace(/\.[^.]+$/, ''),
        parent: { path: path.split('/').slice(0, -1).join('/') || '/' }
    });
}

function createFolder(path: string): TFolder {
    return Object.assign(new (TFolder as any)(), {
        path,
        name: path.split('/').pop() || path,
        children: []
    });
}

describe('chapterSplit', () => {
    test('builds deterministic output paths, chapter files, and toc content from heading structure', () => {
        const markdown = [
            '# Platform',
            'Intro',
            '',
            '## Overview',
            'Overview body',
            '',
            '### Scope',
            'Scope body',
            '',
            '## Delivery',
            'Delivery body'
        ].join('\n');

        const plan = buildChapterSplitPlan({
            sourcePath: 'Docs/Platform.md',
            sourceBasename: 'Platform',
            markdown
        });

        expect(plan.outputFolderPath).toBe('Docs/Platform_chapters');
        expect(plan.tocPath).toBe('Docs/Platform_chapters/Platform_TOC.md');
        expect(plan.manifestPath).toBe('Docs/Platform_chapters/.notemd-chapter-split.json');
        expect(plan.requestedSplitHeadingLevel).toBe('auto');
        expect(plan.chapterNotePaths).toEqual([
            'Docs/Platform_chapters/01-overview.md',
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(plan.managedArtifactPaths).toEqual([
            'Docs/Platform_chapters/Platform_TOC.md',
            'Docs/Platform_chapters/.notemd-chapter-split.json',
            'Docs/Platform_chapters/01-overview.md',
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(plan.chapters).toHaveLength(2);
        expect(plan.chapters[0]).toEqual(expect.objectContaining({
            title: 'Overview',
            outputPath: 'Docs/Platform_chapters/01-overview.md'
        }));
        expect(plan.chapters[0].markdown).toContain('## Overview');
        expect(plan.chapters[0].markdown).toContain('### Scope');
        expect(plan.chapters[1]).toEqual(expect.objectContaining({
            title: 'Delivery',
            outputPath: 'Docs/Platform_chapters/02-delivery.md'
        }));
        expect(plan.tocMarkdown).toContain('[[Docs/Platform_chapters/01-overview|01. Overview]]');
        expect(plan.tocMarkdown).toContain('[[Docs/Platform_chapters/01-overview#Scope|Scope]]');
        expect(plan.tocMarkdown).toContain('[[Docs/Platform_chapters/02-delivery|02. Delivery]]');
    });

    test('uses a stable fallback chapter file name when the title normalizes to an empty slug', () => {
        const markdown = [
            '# Topic',
            '',
            '## ???',
            'Body'
        ].join('\n');

        const plan = buildChapterSplitPlan({
            sourcePath: 'Docs/Topic.md',
            sourceBasename: 'Topic',
            markdown,
            splitHeadingLevel: 'h2'
        });

        expect(plan.chapters[0].outputPath).toBe('Docs/Topic_chapters/01-chapter-01.md');
        expect(plan.requestedSplitHeadingLevel).toBe('h2');
    });

    test('keeps unicode chapter titles in output paths instead of collapsing to fallback slugs', () => {
        const markdown = [
            '# 架构路线图',
            '',
            '## 系统设计',
            '内容'
        ].join('\n');

        const plan = buildChapterSplitPlan({
            sourcePath: 'Docs/架构路线图.md',
            sourceBasename: '架构路线图',
            markdown
        });

        expect(plan.chapters[0].outputPath).toBe('Docs/架构路线图_chapters/01-系统设计.md');
    });

    test('preserves the source basename when the source file name already contains separators', () => {
        const markdown = [
            '# Topic',
            '',
            '## Delivery',
            'Body'
        ].join('\n');

        const plan = buildChapterSplitPlan({
            sourcePath: 'Docs/chapter-split-source.md',
            sourceBasename: 'chapter-split-source',
            markdown
        });

        expect(plan.outputFolderPath).toBe('Docs/chapter-split-source_chapters');
        expect(plan.tocPath).toBe('Docs/chapter-split-source_chapters/chapter-split-source_TOC.md');
    });

    test('reruns chapter split against existing generated files and removes stale files even when abstract lookups are non-TFile values', async () => {
        const reporter = {
            log: jest.fn()
        };
        const folders = new Map<string, TFolder>();
        const files = new Map<string, { file: TFile; content: string }>();
        const ensureFolder = (path: string) => {
            const folder = createFolder(path);
            folders.set(path, folder);
            return folder;
        };
        const addFile = (path: string, content: string) => {
            const file = createFile(path);
            files.set(path, { file, content });
            return file;
        };

        ensureFolder('Docs');
        addFile('Docs/Platform.md', [
            '# Platform',
            'Intro',
            '',
            '## Overview',
            'Overview body',
            '',
            '## Delivery',
            'Delivery body'
        ].join('\n'));

        const app = {
            vault: {
                read: jest.fn(async (file: TFile) => files.get(file.path)?.content ?? ''),
                getAbstractFileByPath: jest.fn((path: string) => {
                    if (folders.has(path)) {
                        return folders.get(path);
                    }
                    if (files.has(path)) {
                        return { path };
                    }
                    return null;
                }),
                getFileByPath: jest.fn((path: string) => files.get(path)?.file ?? null),
                createFolder: jest.fn(async (path: string) => {
                    if (folders.has(path)) {
                        throw new Error('Folder already exists.');
                    }
                    ensureFolder(path);
                }),
                create: jest.fn(async (path: string, content: string) => {
                    if (files.has(path)) {
                        throw new Error('File already exists.');
                    }
                    addFile(path, content);
                }),
                modify: jest.fn(async (file: TFile, content: string) => {
                    files.set(file.path, { file, content });
                }),
                delete: jest.fn(async (file: TFile) => {
                    files.delete(file.path);
                })
            }
        } as any;

        const sourceFile = files.get('Docs/Platform.md')!.file;
        const firstRun = await splitNoteByChapters(app, sourceFile, reporter as any);
        expect(firstRun.outputFolderPath).toBe('Docs/Platform_chapters');
        expect(firstRun.requestedSplitHeadingLevel).toBe('auto');
        expect(firstRun.chapterNotePaths).toEqual([
            'Docs/Platform_chapters/01-overview.md',
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(firstRun.managedArtifactPaths).toEqual([
            'Docs/Platform_chapters/Platform_TOC.md',
            'Docs/Platform_chapters/.notemd-chapter-split.json',
            'Docs/Platform_chapters/01-overview.md',
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(files.has('Docs/Platform_chapters/02-delivery.md')).toBe(true);

        files.set('Docs/Platform.md', {
            file: sourceFile,
            content: [
                '# Platform',
                'Intro',
                '',
                '## Overview',
                'Overview body updated'
            ].join('\n')
        });

        const secondRun = await splitNoteByChapters(app, sourceFile, reporter as any);

        expect(secondRun.chapterCount).toBe(1);
        expect(secondRun.removedStaleFileCount).toBe(1);
        expect(secondRun.removedStalePaths).toEqual([
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(secondRun.chapterNotePaths).toEqual([
            'Docs/Platform_chapters/01-overview.md'
        ]);
        expect(secondRun.managedArtifactPaths).toEqual([
            'Docs/Platform_chapters/Platform_TOC.md',
            'Docs/Platform_chapters/.notemd-chapter-split.json',
            'Docs/Platform_chapters/01-overview.md'
        ]);
        expect(files.has('Docs/Platform_chapters/02-delivery.md')).toBe(false);
        expect(files.get('Docs/Platform_chapters/01-overview.md')?.content).toContain('Overview body updated');
        expect(reporter.log).toHaveBeenCalledWith('Removed stale chapter split file: Docs/Platform_chapters/02-delivery.md');
    });

    test('falls back to adapter-level overwrite and cleanup when vault file lookups lag behind on-disk files', async () => {
        const reporter = {
            log: jest.fn()
        };
        const folders = new Map<string, TFolder>();
        const files = new Map<string, { file: TFile; content: string }>();
        const ensureFolder = (path: string) => {
            const folder = createFolder(path);
            folders.set(path, folder);
            return folder;
        };
        const addFile = (path: string, content: string) => {
            const file = createFile(path);
            files.set(path, { file, content });
            return file;
        };

        ensureFolder('Docs');
        addFile('Docs/Platform.md', [
            '# Platform',
            'Intro',
            '',
            '## Overview',
            'Overview body',
            '',
            '## Delivery',
            'Delivery body'
        ].join('\n'));

        const app = {
            vault: {
                read: jest.fn(async (file: TFile) => files.get(file.path)?.content ?? ''),
                getAbstractFileByPath: jest.fn((path: string) => {
                    if (folders.has(path)) {
                        return folders.get(path);
                    }
                    return files.has(path) ? { path } : null;
                }),
                getFileByPath: jest.fn((path: string) => {
                    if (path.startsWith('Docs/Platform_chapters/')) {
                        return null;
                    }
                    return files.get(path)?.file ?? null;
                }),
                createFolder: jest.fn(async (path: string) => {
                    if (folders.has(path)) {
                        throw new Error('Folder already exists.');
                    }
                    ensureFolder(path);
                }),
                create: jest.fn(async (path: string, content: string) => {
                    if (files.has(path)) {
                        throw new Error('File already exists.');
                    }
                    addFile(path, content);
                }),
                modify: jest.fn(async (file: TFile, content: string) => {
                    files.set(file.path, { file, content });
                }),
                delete: jest.fn(async (file: TFile) => {
                    files.delete(file.path);
                }),
                adapter: {
                    exists: jest.fn(async (path: string) => files.has(path)),
                    read: jest.fn(async (path: string) => files.get(path)?.content ?? ''),
                    write: jest.fn(async (path: string, content: string) => {
                        const existing = files.get(path);
                        files.set(path, { file: existing?.file ?? createFile(path), content });
                    }),
                    remove: jest.fn(async (path: string) => {
                        files.delete(path);
                    })
                }
            }
        } as any;

        const sourceFile = files.get('Docs/Platform.md')!.file;
        await splitNoteByChapters(app, sourceFile, reporter as any);

        files.set('Docs/Platform.md', {
            file: sourceFile,
            content: [
                '# Platform',
                'Intro',
                '',
                '## Overview',
                'Overview body updated'
            ].join('\n')
        });

        const rerun = await splitNoteByChapters(app, sourceFile, reporter as any);

        expect(rerun.chapterCount).toBe(1);
        expect(rerun.removedStaleFileCount).toBe(1);
        expect(rerun.removedStalePaths).toEqual([
            'Docs/Platform_chapters/02-delivery.md'
        ]);
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'Docs/Platform_chapters/01-overview.md',
            expect.stringContaining('Overview body updated')
        );
        expect(app.vault.adapter.remove).toHaveBeenCalledWith('Docs/Platform_chapters/02-delivery.md');
        expect(files.has('Docs/Platform_chapters/02-delivery.md')).toBe(false);
    });
});
