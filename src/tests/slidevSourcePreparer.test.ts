import {
    applySlidevPresentationGuardrails,
    buildDeterministicSlidevDeck,
    isSlidevDeckMarkdown,
    prepareSlidevExportSource,
} from '../slideExport/slidevSourcePreparer';
import type { SlideExportConfig } from '../slideExport/types';
import type { TFile } from 'obsidian';
import { callLLM } from '../llmUtils';
import { resolveWorkspaceHomeCandidates, safeRequire } from '../slideExport/platformUtils';

jest.mock('../llmUtils', () => ({
    callLLM: jest.fn(),
}));

jest.mock('../slideExport/platformUtils', () => ({
    safeRequire: jest.fn(() => null),
    resolveWorkspaceHomeCandidates: jest.fn(() => []),
}));

const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>;
const mockSafeRequire = safeRequire as jest.MockedFunction<typeof safeRequire>;
const mockResolveWorkspaceHomeCandidates = resolveWorkspaceHomeCandidates as jest.MockedFunction<typeof resolveWorkspaceHomeCandidates>;

function createFile(path: string): TFile {
    const name = path.split('/').pop() || path;
    const basename = name.replace(/\.[^.]+$/, '');
    return {
        basename,
        extension: 'md',
        name,
        path,
        parent: null,
        vault: null as any,
        stat: { ctime: 0, mtime: 0, size: 0 },
    } as TFile;
}

function createApp(content: string): any {
    return {
        vault: {
            read: jest.fn(async () => content),
            adapter: {
                exists: jest.fn(async () => false),
                mkdir: jest.fn(async () => undefined),
                write: jest.fn(async () => undefined),
            },
        },
    };
}

const config: SlideExportConfig = {
    format: 'html',
    withClicks: false,
    outputSubfolder: 'export',
    ffmpegFps: 1,
    ffmpegCrf: 23,
    slidevTheme: '',
    timeoutMs: 120000,
    htmlMode: 'standalone',
};

describe('slidevSourcePreparer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.NOTEMD_SLIDEV_SKILL_DIR;
        mockResolveWorkspaceHomeCandidates.mockReturnValue([]);
    });

    test('detects an existing Slidev deck with headmatter and separators', () => {
        expect(isSlidevDeckMarkdown([
            '---',
            'theme: default',
            'title: Existing Deck',
            '---',
            '',
            '# First',
            '',
            '---',
            '',
            '# Second',
        ].join('\n'))).toBe(true);
    });

    test('does not treat ordinary Markdown as a Slidev deck', () => {
        expect(isSlidevDeckMarkdown([
            '# Architecture',
            '',
            '## System',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'))).toBe(false);
    });

    test('deterministic conversion creates headmatter, slide separators, and preserved Mermaid fences', () => {
        const deck = buildDeterministicSlidevDeck([
            '# Architecture',
            '',
            '> Updated: 2026-06-17',
            '',
            '## System',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
            '',
            '### Runtime',
            '',
            '| Layer | Role |',
            '|---|---|',
            '| UI | Obsidian |',
        ].join('\n'), 'architecture');

        expect(deck).toContain('theme: default');
        expect(deck).toContain('title: "Architecture"');
        expect(deck.match(/^---$/gm)?.length ?? 0).toBeGreaterThan(3);
        expect(deck).toContain('```mermaid\nflowchart TB\n  A --> B\n```');
        expect(deck).toContain('| Layer | Role |');
        expect(deck).toContain('layout: section');
    });

    test('existing Slidev decks are copied into the prepared export workspace instead of exporting the source file directly', async () => {
        const markdown = [
            '---',
            'theme: default',
            'title: Existing Deck',
            '---',
            '',
            '# First',
            '',
            '---',
            '',
            '# Second',
        ].join('\n');
        const app = createApp(markdown);
        app.vault.adapter.exists = jest.fn(async () => false);
        app.vault.adapter.mkdir = jest.fn(async () => undefined);
        app.vault.adapter.write = jest.fn(async () => undefined);

        const result = await prepareSlidevExportSource(
            app,
            createFile('docs/existing-slidev.md'),
            config,
            {},
            jest.fn()
        );

        expect(result.inputFilePath).toBe('export/_slidev-sources/existing-slidev.slidev.md');
        expect(result.preparedDeckPath).toBe('export/_slidev-sources/existing-slidev.slidev.md');
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/existing-slidev.slidev.md',
            markdown
        );
    });

    test('deterministic conversion does not split inside fenced code blocks', () => {
        const longCode = Array.from({ length: 120 }, (_, index) => `console.log(${index})`).join('\n');
        const deck = buildDeterministicSlidevDeck([
            '# Code Walkthrough',
            '',
            '## Implementation',
            '',
            '```ts',
            longCode,
            '```',
        ].join('\n'), 'code');

        expect(deck.match(/```ts/g)).toHaveLength(1);
        expect(deck.match(/```/g)).toHaveLength(2);
        expect(deck).toContain('console.log(119)');
    });

    test('presentation guardrails zoom large Mermaid slides', () => {
        const mermaidLines = Array.from({ length: 58 }, (_, index) => `    A${index} --> A${index + 1}`).join('\n');
        const deck = [
            '---',
            'theme: default',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            'layout: default',
            '---',
            '',
            '# Large Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            mermaidLines,
            '```',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck);

        expect(guardedDeck).toContain('layout: default\nzoom: 0.34\n---');
        expect(guardedDeck).toContain('```mermaid\nflowchart TB');
    });

    test('presentation guardrails detect Mermaid fences with inline options', () => {
        const mermaidLines = Array.from({ length: 46 }, (_, index) => `    A${index} --> A${index + 1}`).join('\n');
        const deck = [
            '---',
            'theme: default',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            'layout: default',
            '---',
            '',
            '# Large Diagram',
            '',
            '```mermaid {scale:0.7}',
            'flowchart TB',
            mermaidLines,
            '```',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck);

        expect(guardedDeck).toContain('layout: default\nzoom: 0.40\n---');
        expect(guardedDeck).toContain('```mermaid {scale:0.7}\nflowchart TB');
    });

    test('presentation guardrails normalize bare slide frontmatter values', () => {
        const deck = [
            '---',
            'theme: default',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            'zoom: 0.7',
            '',
            '## Large Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck);

        expect(guardedDeck).toContain('zoom: 0.7\n---\n\n## Large Diagram');
    });

    test('presentation guardrails keep normal Markdown slides out of frontmatter', () => {
        const deck = [
            '---',
            'theme: default',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            '## CLI Reality',
            '',
            '**Current host facts**:',
            '',
            '- command surface only',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck);

        expect(guardedDeck).toContain('---\n\n## CLI Reality\n\n**Current host facts**:');
    });

    test('presentation guardrails keep generated decks on the configured theme', () => {
        const deck = [
            '---',
            'theme: seriph',
            'title: Architecture',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            '',
            '## System',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck, 'default');

        expect(guardedDeck).toContain('theme: default');
        expect(guardedDeck).not.toContain('theme: seriph');
    });

    test('copies an existing Slidev deck into the prepared export workspace', async () => {
        const markdown = [
            '---',
            'theme: default',
            '---',
            '',
            '# First',
            '',
            '---',
            '',
            '# Second',
        ].join('\n');
        const app = createApp(markdown);
        const file = createFile('slides.md');

        const source = await prepareSlidevExportSource(app, file, config);

        expect(source).toEqual({
            inputFilePath: 'export/_slidev-sources/slides.slidev.md',
            outputBasename: 'slides',
            sourceLabel: 'export/_slidev-sources/slides.slidev.md',
            preparedDeckPath: 'export/_slidev-sources/slides.slidev.md',
        });
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/slides.slidev.md',
            markdown
        );
    });

    test('writes an intermediate Slidev deck for ordinary Markdown', async () => {
        const app = createApp('# Architecture\n\n## System\n\nContent');
        const file = createFile('architecture.zh-CN.md');

        const source = await prepareSlidevExportSource(app, file, config);

        expect(source.inputFilePath).toBe('export/_slidev-sources/architecture.zh-CN.slidev.md');
        expect(source.outputBasename).toBe('architecture.zh-CN');
        expect(app.vault.adapter.mkdir).toHaveBeenCalledWith('export');
        expect(app.vault.adapter.mkdir).toHaveBeenCalledWith('export/_slidev-sources');
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/architecture.zh-CN.slidev.md',
            expect.stringContaining('title: "Architecture"')
        );
    });

    test('loads all Slidev skill references for LLM deck preparation', async () => {
        const skillRoot = '/skills/slidev';
        process.env.NOTEMD_SLIDEV_SKILL_DIR = skillRoot;
        const files = new Map([
            [`${skillRoot}/SKILL.md`, 'Slidev skill instructions'],
            [`${skillRoot}/references/core-syntax.md`, 'Use --- separators.'],
            [`${skillRoot}/references/diagram-mermaid.md`, 'Render Mermaid fences.'],
            [`${skillRoot}/references/style-icons.md`, 'Use icon components.'],
        ]);
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'path') {
                return {
                    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
                };
            }
            if (name === 'fs') {
                return {
                    existsSync: (path: string) => files.has(path) || path === `${skillRoot}/references`,
                    readFileSync: (path: string) => files.get(path) || '',
                    readdirSync: (path: string) => path === `${skillRoot}/references`
                        ? ['diagram-mermaid.md', 'core-syntax.md', 'style-icons.md']
                        : [],
                };
            }
            return null;
        });
        mockCallLLM.mockResolvedValue([
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            '',
            '# Mermaid',
        ].join('\n'));
        const app = createApp('# Architecture\n\n## Diagram\n\n```mermaid\nflowchart TB\nA-->B\n```');
        const file = createFile('architecture.zh-CN.md');
        const reporter = {
            abortController: new AbortController(),
            activeTasks: 0,
            log: jest.fn(),
            updateStatus: jest.fn(),
            requestCancel: jest.fn(),
            clearDisplay: jest.fn(),
            updateActiveTasks: jest.fn(),
            get cancelled() {
                return false;
            },
        };
        const onProgress = jest.fn();

        const source = await prepareSlidevExportSource(app, file, config, {
            deckGeneration: {
                provider: { name: 'Mock', type: 'openai-compatible', apiKey: 'key', baseUrl: 'https://example.test', models: [] } as any,
                modelName: 'mock-model',
                settings: {} as any,
                reporter,
            },
        }, onProgress);

        expect(source.skillRootPath).toBe(skillRoot);
        expect(source.skillReferencePaths).toEqual([
            'references/core-syntax.md',
            'references/diagram-mermaid.md',
            'references/style-icons.md',
        ]);
        expect(mockCallLLM).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.stringContaining('references/style-icons.md'),
            expect.anything(),
            reporter,
            'mock-model',
            expect.anything(),
        );
        const userPrompt = mockCallLLM.mock.calls[0][2];
        expect(userPrompt).toContain('Use --- separators.');
        expect(userPrompt).toContain('Render Mermaid fences.');
        expect(userPrompt).toContain('Use icon components.');
        expect(onProgress).toHaveBeenCalledWith('slidev-source', `Loaded Slidev skill from ${skillRoot} (3 references).`);
    });

    test('extracts a valid Slidev deck from an explanatory LLM response', async () => {
        const skillRoot = '/skills/slidev';
        process.env.NOTEMD_SLIDEV_SKILL_DIR = skillRoot;
        const files = new Map([
            [`${skillRoot}/SKILL.md`, 'Slidev skill instructions'],
            [`${skillRoot}/references/core-syntax.md`, 'Use --- separators.'],
        ]);
        mockSafeRequire.mockImplementation((name: string) => {
            if (name === 'path') {
                return {
                    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
                };
            }
            if (name === 'fs') {
                return {
                    existsSync: (path: string) => files.has(path) || path === `${skillRoot}/references`,
                    readFileSync: (path: string) => files.get(path) || '',
                    readdirSync: (path: string) => path === `${skillRoot}/references`
                        ? ['core-syntax.md']
                        : [],
                };
            }
            return null;
        });
        mockCallLLM.mockResolvedValue([
            'Here is the deck:',
            '',
            '```md',
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Architecture',
            '',
            '---',
            '',
            '# Runtime',
            '```',
        ].join('\n'));
        const app = createApp('# Architecture\n\n## Runtime\n\nContent');
        const file = createFile('architecture.zh-CN.md');
        const reporter = {
            abortController: new AbortController(),
            activeTasks: 0,
            log: jest.fn(),
            updateStatus: jest.fn(),
            requestCancel: jest.fn(),
            clearDisplay: jest.fn(),
            updateActiveTasks: jest.fn(),
            get cancelled() {
                return false;
            },
        };

        await prepareSlidevExportSource(app, file, config, {
            deckGeneration: {
                provider: { name: 'Mock', type: 'openai-compatible', apiKey: 'key', baseUrl: 'https://example.test', models: [] } as any,
                modelName: 'mock-model',
                settings: {} as any,
                reporter,
            },
        });

        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/architecture.zh-CN.slidev.md',
            expect.stringMatching(/^---\ntheme: default/)
        );
    });
});
