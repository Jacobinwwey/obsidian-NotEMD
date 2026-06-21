import * as fs from 'fs';
import * as path from 'path';
import {
    applySlidevPresentationGuardrails,
    buildDeterministicSlidevDeck,
    buildDeterministicSlidevOutline,
    generateSlidevExportOutline,
    isSlidevDeckMarkdown,
    prepareSlidevExportSource,
    prepareSlidevExportSourceFromOutline,
} from '../slideExport/slidevSourcePreparer';
import type { SlideExportConfig } from '../slideExport/types';
import type { TFile } from 'obsidian';
import { callLLM } from '../llmUtils';
import { NOTEMD_SLOT_ZONE_ATTR } from '../slideExport/slidevLayoutAudit';
import { getVaultBasePath, resolveWorkspaceHomeCandidates, safeRequire } from '../slideExport/platformUtils';

jest.mock('../llmUtils', () => ({
    callLLM: jest.fn(),
}));

jest.mock('../slideExport/platformUtils', () => ({
    getVaultBasePath: jest.fn(() => null),
    safeRequire: jest.fn(() => null),
    resolveWorkspaceHomeCandidates: jest.fn(() => []),
}));

const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>;
const mockGetVaultBasePath = getVaultBasePath as jest.MockedFunction<typeof getVaultBasePath>;
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

function createDeckGenerationProfile() {
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

    return {
        provider: { name: 'Mock', type: 'openai-compatible', apiKey: 'key', baseUrl: 'https://example.test', models: [] } as any,
        modelName: 'mock-model',
        settings: {} as any,
        reporter,
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
        mockGetVaultBasePath.mockReturnValue(null);
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

    test('deterministic outline captures dense tables and diagrams before export', () => {
        const outline = buildDeterministicSlidevOutline([
            '# Architecture',
            '',
            '## Runtime',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
            '',
            '## Metrics',
            '',
            '| Metric | Value |',
            '|---|---|',
            '| Latency | 120ms |',
        ].join('\n'), 'architecture');

        expect(outline).toContain('# Slidev Export Outline: Architecture');
        expect(outline).toContain('## Deterministic layout budget');
        expect(outline).toContain('Pre-split candidates:');
        expect(outline).toContain('Source-preserving fit reviews:');
        expect(outline).toContain('Runtime');
        expect(outline).toContain('preserve Mermaid source and audit fit');
        expect(outline).toContain('split or transform wide tables');
    });

    test('existing Slidev decks are copied into an isolated prepared export workspace instead of exporting the source file directly', async () => {
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

        expect(result.inputFilePath).toBe('export/_slidev-sources/existing-slidev/existing-slidev.slidev.md');
        expect(result.preparedDeckPath).toBe('export/_slidev-sources/existing-slidev/existing-slidev.slidev.md');
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/existing-slidev/existing-slidev.slidev.md',
            expect.stringContaining('fonts:\n  provider: none')
        );
    });

    test('existing Slidev decks preserve explicit font provider configuration', async () => {
        const markdown = [
            '---',
            'theme: default',
            'fonts:',
            '  provider: google',
            '---',
            '',
            '# First',
        ].join('\n');
        const app = createApp(markdown);

        await prepareSlidevExportSource(
            app,
            createFile('docs/fonted-slidev.md'),
            config,
            {},
            jest.fn()
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('fonts:\n  provider: google');
        expect(writtenDeck).not.toContain('provider: none');
    });

    test('existing Slidev decks preserve explicit Mermaid slide zoom in the working copy', async () => {
        const markdown = [
            '---',
            'theme: default',
            '---',
            '',
            '# First',
            '',
            '---',
            'layout: default',
            'zoom: 0.46',
            '---',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n');
        const app = createApp(markdown);

        await prepareSlidevExportSource(
            app,
            createFile('docs/explicit-zoom-slidev.md'),
            config,
            {},
            jest.fn()
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('zoom: 0.46');
        expect(writtenDeck).toContain('```mermaid\nflowchart TB\n  A --> B\n```');
    });

    test('existing Slidev decks reached from saved outline use the same offline working copy guardrails', async () => {
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

        const result = await prepareSlidevExportSourceFromOutline(
            app,
            createFile('docs/existing-slidev.md'),
            '# Outline',
            config,
            {},
            jest.fn()
        );

        expect(result.inputFilePath).toBe('export/_slidev-sources/existing-slidev/existing-slidev.slidev.md');
        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('fonts:\n  provider: none');
    });

    test('existing Slidev decks decorate component-heavy slot zones with ownership wrappers before writing the working copy', async () => {
        const markdown = [
            '---',
            'theme: default',
            '---',
            '',
            '# First',
            '',
            '---',
            'layout: custom-grid',
            '---',
            '',
            '::summary::',
            '',
            '<div class="summary-card">Summary</div>',
            '',
            '::details::',
            '',
            '<div class="space-y-3">',
            '  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 12 with explicit structured text.</div>',
            '</div>',
        ].join('\n');
        const app = createApp(markdown);

        await prepareSlidevExportSource(
            app,
            createFile('docs/existing-slidev.md'),
            config,
            {},
            jest.fn()
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain(`<div ${NOTEMD_SLOT_ZONE_ATTR}="summary">`);
        expect(writtenDeck).toContain(`<div ${NOTEMD_SLOT_ZONE_ATTR}="details">`);
    });

    test('existing Slidev decks copy sibling layouts into the isolated working copy when desktop filesystem access is available', async () => {
        const markdown = [
            '---',
            'theme: default',
            'title: Existing Deck',
            '---',
            '',
            '# First',
            '',
            '![Diagram](./wide-schematic.svg)',
        ].join('\n');
        const app = createApp(markdown);
        const tempVaultRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'notemd-slidev-support-workspace-'));
        const sourceDirectory = path.join(tempVaultRoot, 'docs');
        const layoutsDirectory = path.join(sourceDirectory, 'layouts');
        fs.mkdirSync(layoutsDirectory, { recursive: true });
        fs.writeFileSync(path.join(layoutsDirectory, 'custom-grid.vue'), '<template><slot /></template>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'wide-schematic.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>', 'utf8');

        app.vault.adapter.write = jest.fn(async (vaultPath: string, content: string) => {
            const absolutePath = path.join(tempVaultRoot, vaultPath);
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, content, 'utf8');
        });
        mockGetVaultBasePath.mockReturnValue(tempVaultRoot);
        mockSafeRequire.mockImplementation((moduleName: string) => require(moduleName));

        const result = await prepareSlidevExportSource(
            app,
            createFile('docs/existing-slidev.md'),
            config,
            {},
            jest.fn()
        );

        expect(result.inputFilePath).toBe('export/_slidev-sources/existing-slidev/existing-slidev.slidev.md');
        expect(fs.existsSync(path.join(tempVaultRoot, 'export/_slidev-sources/existing-slidev/layouts/custom-grid.vue'))).toBe(true);
        expect(fs.existsSync(path.join(tempVaultRoot, 'export/_slidev-sources/existing-slidev/wide-schematic.svg'))).toBe(true);
    });

    test('existing Slidev decks copy frontmatter and media local file references into the isolated working copy', async () => {
        const markdown = [
            '---',
            'theme: default',
            'background: ./assets/deck-background.svg',
            'favicon: ./assets/favicon.svg?version=1',
            '---',
            '',
            '# Background',
            '',
            '---',
            'layout: image-right',
            "image: './assets/hero image.svg'",
            'background: url("./assets/slide-background.svg")',
            '---',
            '',
            '# Media',
            '',
            '<video controls poster="./assets/poster.svg">',
            '  <source src="./media/clip.mp4" type="video/mp4">',
            '</video>',
            '<img srcset="./assets/small.svg 1x, ./assets/large.svg 2x" src="./assets/small.svg">',
            '<link rel="stylesheet" href="./assets/local-theme.css">',
            '',
            '---',
            'background: ../outside.svg',
            'image: https://example.test/remote.svg',
            'poster: /absolute/poster.svg',
            '---',
            '',
            '# Rejected',
        ].join('\n');
        const app = createApp(markdown);
        const tempVaultRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'notemd-slidev-frontmatter-assets-'));
        const sourceDirectory = path.join(tempVaultRoot, 'docs/decks');
        fs.mkdirSync(path.join(sourceDirectory, 'assets'), { recursive: true });
        fs.mkdirSync(path.join(sourceDirectory, 'media'), { recursive: true });
        fs.writeFileSync(path.join(sourceDirectory, 'assets/deck-background.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/favicon.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/hero image.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/slide-background.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/poster.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/small.svg'), '<svg/>', 'utf8');
        fs.writeFileSync(path.join(sourceDirectory, 'assets/large.svg'), '<svg/>', 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'assets/local-theme.css'), [
			'@import "./imported-theme.css";',
			'@import "https://example.test/remote-theme.css";',
			'@import "../../outside.css";',
			'@font-face { font-family: FixtureTheme; src: url("./theme-font.woff2") format("woff2"); }',
			'.themed-backdrop { background-image: url("../media/theme-pattern.svg"); }',
			'.remote-backdrop { background-image: url("https://example.test/remote-pattern.svg"); }',
			'.bad-backdrop { background-image: url("../../outside.svg"); }',
			'.bad-null { background-image: url("bad\0asset.svg"); }',
		].join('\n'), 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'assets/imported-theme.css'), [
			'@font-face { font-family: FixtureImported; src: url("./imported-font.woff2") format("woff2"); }',
			'.imported-backdrop { background-image: url("../media/imported-pattern.svg"); }',
		].join('\n'), 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'assets/theme-font.woff2'), 'fake font payload', 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'assets/imported-font.woff2'), 'fake imported font payload', 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'media/clip.mp4'), 'fake video payload', 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'media/theme-pattern.svg'), '<svg/>', 'utf8');
		fs.writeFileSync(path.join(sourceDirectory, 'media/imported-pattern.svg'), '<svg/>', 'utf8');
		fs.writeFileSync(path.join(tempVaultRoot, 'docs/outside.svg'), '<svg/>', 'utf8');
		fs.writeFileSync(path.join(tempVaultRoot, 'docs/outside.css'), 'body{}', 'utf8');

        app.vault.adapter.write = jest.fn(async (vaultPath: string, content: string) => {
            const absolutePath = path.join(tempVaultRoot, vaultPath);
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, content, 'utf8');
        });
        mockGetVaultBasePath.mockReturnValue(tempVaultRoot);
        mockSafeRequire.mockImplementation((moduleName: string) => require(moduleName));

        await prepareSlidevExportSource(
            app,
            createFile('docs/decks/background-assets.md'),
            config,
            {},
            jest.fn()
        );

        const workspaceRoot = path.join(tempVaultRoot, 'export/_slidev-sources/background-assets');
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/deck-background.svg'))).toBe(true);
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/favicon.svg'))).toBe(true);
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/hero image.svg'))).toBe(true);
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/slide-background.svg'))).toBe(true);
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/poster.svg'))).toBe(true);
        expect(fs.existsSync(path.join(workspaceRoot, 'assets/small.svg'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'assets/large.svg'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'assets/local-theme.css'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'assets/imported-theme.css'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'assets/theme-font.woff2'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'assets/imported-font.woff2'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'media/clip.mp4'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'media/theme-pattern.svg'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'media/imported-pattern.svg'))).toBe(true);
		expect(fs.existsSync(path.join(workspaceRoot, 'outside.svg'))).toBe(false);
		expect(fs.existsSync(path.join(workspaceRoot, 'outside.css'))).toBe(false);
		expect(fs.existsSync(path.join(workspaceRoot, 'absolute/poster.svg'))).toBe(false);
		const copiedThemeCss = fs.readFileSync(path.join(workspaceRoot, 'assets/local-theme.css'), 'utf8');
		expect(copiedThemeCss).toContain('@import "./imported-theme.css";');
		expect(copiedThemeCss).toContain('@import "https://example.test/remote-theme.css";');
		expect(copiedThemeCss).toContain('url("../media/theme-pattern.svg")');
		expect(copiedThemeCss).toContain('url("https://example.test/remote-pattern.svg")');
		expect(copiedThemeCss).not.toContain('outside.css');
		expect(copiedThemeCss).not.toContain('outside.svg');
		expect(copiedThemeCss).not.toContain('\0');
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

    test('presentation guardrails leave large Mermaid zoom to rendered audit', () => {
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

        expect(guardedDeck).toContain('layout: default\n---');
        expect(guardedDeck).not.toContain('zoom:');
        expect(guardedDeck).toContain('```mermaid\nflowchart TB');
    });

    test('presentation guardrails preserve Mermaid fences with inline options without fixed zoom', () => {
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

        expect(guardedDeck).toContain('layout: default\n---');
        expect(guardedDeck).not.toContain('zoom:');
        expect(guardedDeck).toContain('```mermaid {scale:0.7}\nflowchart TB');
    });

    test('presentation guardrails strip generated Mermaid zoom so rendered audit owns fit', () => {
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
            'zoom: 0.46',
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

        expect(guardedDeck).toContain('layout: default\n---');
        expect(guardedDeck).not.toContain('zoom: 0.46');
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

        expect(guardedDeck).toContain('---\n\n## Large Diagram');
        expect(guardedDeck).not.toContain('zoom: 0.7');
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

    test('presentation guardrails disable remote font provider when fonts are not configured', () => {
        const deck = [
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Architecture',
        ].join('\n');

        const guardedDeck = applySlidevPresentationGuardrails(deck, 'default');

        expect(guardedDeck).toContain('fonts:\n  provider: none');
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
            inputFilePath: 'export/_slidev-sources/slides/slides.slidev.md',
            outputBasename: 'slides',
            sourceLabel: 'export/_slidev-sources/slides/slides.slidev.md',
            preparedDeckPath: 'export/_slidev-sources/slides/slides.slidev.md',
        });
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/slides/slides.slidev.md',
            expect.stringContaining('fonts:\n  provider: none')
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

    test('writes a reviewable outline artifact before outline-based export', async () => {
        const app = createApp('# Architecture\n\n## Runtime\n\nContent');
        const file = createFile('architecture.zh-CN.md');

        const outlinePath = await generateSlidevExportOutline(app, file, config, {}, jest.fn());

        expect(outlinePath).toBe('export/_slidev-outlines/architecture.zh-CN.outline.md');
        expect(app.vault.adapter.mkdir).toHaveBeenCalledWith('export');
        expect(app.vault.adapter.mkdir).toHaveBeenCalledWith('export/_slidev-outlines');
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-outlines/architecture.zh-CN.outline.md',
            expect.stringContaining('# Slidev Export Outline: Architecture')
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
        expect(userPrompt).toContain('# Deterministic Layout Budget');
        expect(userPrompt).toContain('Pre-split candidates:');
        expect(userPrompt).toContain('Source-preserving fit reviews:');
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

    test('accepts LLM decks only when source Mermaid fences stay byte-stable', async () => {
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
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# LLM Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'));
        const app = createApp([
            '# Architecture',
            '',
            '## Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'));

        await prepareSlidevExportSource(
            app,
            createFile('architecture.zh-CN.md'),
            config,
            { deckGeneration: createDeckGenerationProfile() },
            jest.fn()
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('# LLM Diagram');
        expect(writtenDeck).toContain('```mermaid\nflowchart TB\n  A --> B\n```');
    });

    test('rejects one-step LLM decks that only change Mermaid fence metadata', async () => {
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
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Metadata Changed Diagram',
            '',
            '```mermaid {scale:0.5}',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'));
        const app = createApp([
            '# Architecture',
            '',
            '## Diagram',
            '',
            '```mermaid {scale:0.7}',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'));
        const onProgress = jest.fn();

        await prepareSlidevExportSource(
            app,
            createFile('architecture.zh-CN.md'),
            config,
            { deckGeneration: createDeckGenerationProfile() },
            onProgress
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('```mermaid {scale:0.7}\nflowchart TB\n  A --> B\n```');
        expect(writtenDeck).not.toContain('```mermaid {scale:0.5}');
        expect(onProgress).toHaveBeenCalledWith(
            'slidev-source',
            expect.stringContaining('LLM deck changed source Mermaid fences')
        );
    });

    test('rejects one-step LLM decks that split or rewrite source Mermaid fences', async () => {
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
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Split Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
            '',
            '---',
            '',
            '```mermaid',
            'flowchart TB',
            '  C --> D',
            '```',
        ].join('\n'));
        const sourceMarkdown = [
            '# Architecture',
            '',
            '## Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '  B --> C',
            '```',
        ].join('\n');
        const app = createApp(sourceMarkdown);
        const onProgress = jest.fn();

        await prepareSlidevExportSource(
            app,
            createFile('architecture.zh-CN.md'),
            config,
            { deckGeneration: createDeckGenerationProfile() },
            onProgress
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('```mermaid\nflowchart TB\n  A --> B\n  B --> C\n```');
        expect(writtenDeck).not.toContain('C --> D');
        expect(onProgress).toHaveBeenCalledWith(
            'slidev-source',
            expect.stringContaining('LLM deck changed source Mermaid fences')
        );
    });

    test('uses a saved outline as deck-generation guidance during export continuation', async () => {
        const skillRoot = '/skills/slidev';
        process.env.NOTEMD_SLIDEV_SKILL_DIR = skillRoot;
        const files = new Map([
            [`${skillRoot}/SKILL.md`, 'Slidev skill instructions'],
            [`${skillRoot}/references/core-syntax.md`, 'Use --- separators.'],
            [`${skillRoot}/references/layout-fit.md`, 'Split dense slides and control zoom.'],
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
                        ? ['core-syntax.md', 'layout-fit.md']
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
            '# Runtime',
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

        await prepareSlidevExportSourceFromOutline(
            app,
            file,
            '# Saved Outline\n\n1. Cover\n2. Runtime with zoom safety',
            config,
            {
                deckGeneration: {
                    provider: { name: 'Mock', type: 'openai-compatible', apiKey: 'key', baseUrl: 'https://example.test', models: [] } as any,
                    modelName: 'mock-model',
                    settings: {} as any,
                    reporter,
                },
            }
        );

        const userPrompt = mockCallLLM.mock.calls[0][2];
        expect(userPrompt).toContain('# Deterministic Layout Budget');
        expect(userPrompt).toContain('Pre-split candidates:');
        expect(userPrompt).toContain('Source-preserving fit reviews:');
        expect(userPrompt).toContain('# Saved Slidev Export Outline');
        expect(userPrompt).toContain('Runtime with zoom safety');
        expect(userPrompt).toContain('Split dense slides and control zoom.');
        expect(app.vault.adapter.write).toHaveBeenCalledWith(
            'export/_slidev-sources/architecture.zh-CN.slidev.md',
            expect.stringMatching(/^---\ntheme: default/)
        );
    });

    test('rejects outline continuation decks that rewrite source Mermaid fences', async () => {
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
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# Rewritten Diagram',
            '',
            '```mermaid',
            'flowchart LR',
            '  A --> B',
            '```',
        ].join('\n'));
        const app = createApp([
            '# Architecture',
            '',
            '## Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
        ].join('\n'));
        const onProgress = jest.fn();

        await prepareSlidevExportSourceFromOutline(
            app,
            createFile('architecture.zh-CN.md'),
            '# Saved Outline\n\n1. Keep source Mermaid unchanged',
            config,
            { deckGeneration: createDeckGenerationProfile() },
            onProgress
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('```mermaid\nflowchart TB\n  A --> B\n```');
        expect(writtenDeck).not.toContain('flowchart LR');
        expect(onProgress).toHaveBeenCalledWith(
            'slidev-source',
            expect.stringContaining('LLM deck from outline changed source Mermaid fences')
        );
    });

    test('rejects outline continuation decks that split one source Mermaid fence into multiple diagrams', async () => {
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
            '---',
            'theme: default',
            'title: Architecture',
            '---',
            '',
            '# First Derived Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '```',
            '',
            '---',
            '',
            '# Second Derived Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  C --> D',
            '```',
        ].join('\n'));
        const sourceMarkdown = [
            '# Architecture',
            '',
            '## Diagram',
            '',
            '```mermaid',
            'flowchart TB',
            '  A --> B',
            '  B --> C',
            '  C --> D',
            '```',
        ].join('\n');
        const app = createApp(sourceMarkdown);
        const onProgress = jest.fn();

        await prepareSlidevExportSourceFromOutline(
            app,
            createFile('architecture.zh-CN.md'),
            '# Saved Outline\n\n1. Preserve the original Mermaid diagram as one fence',
            config,
            { deckGeneration: createDeckGenerationProfile() },
            onProgress
        );

        const writtenDeck = (app.vault.adapter.write as jest.Mock).mock.calls[0][1] as string;
        expect(writtenDeck).toContain('```mermaid\nflowchart TB\n  A --> B\n  B --> C\n  C --> D\n```');
        expect(writtenDeck).not.toContain('# First Derived Diagram');
        expect(writtenDeck).not.toContain('# Second Derived Diagram');
        expect((writtenDeck.match(/```mermaid/g) || []).length).toBe(1);
        expect(onProgress).toHaveBeenCalledWith(
            'slidev-source',
            expect.stringContaining('LLM deck from outline changed source Mermaid fences')
        );
    });
});
