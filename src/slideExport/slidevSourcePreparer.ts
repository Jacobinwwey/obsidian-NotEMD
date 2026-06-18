/**
 * Slide Export source preparation.
 *
 * Converts ordinary long-form Markdown into a real Slidev deck before the CLI
 * build/export step. Existing Slidev decks are passed through unchanged.
 */

import type { App, TFile } from 'obsidian';
import type { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';
import { callLLM } from '../llmUtils';
import type { ExportProgressCallback, SlideExportConfig, SlidevExportSource } from './types';
import { resolveWorkspaceHomeCandidates, safeRequire } from './platformUtils';

interface SlidevSkillContext {
	rootPath: string | null;
	skillText: string;
	referenceFiles: SlidevSkillReference[];
}

interface SlidevSkillReference {
	relativePath: string;
	content: string;
}

interface SlidevDeckGenerationProfile {
	provider: LLMProviderConfig;
	modelName: string;
	settings: NotemdSettings;
	reporter: ProgressReporter;
}

interface SlidevSourcePreparationOptions {
	deckGeneration?: SlidevDeckGenerationProfile;
}

const MAX_DETERMINISTIC_SLIDE_CHARS = 1350;
const MAX_LLM_REFERENCE_CHARS = 120000;
const LARGE_MERMAID_LINE_THRESHOLD = 32;

export async function prepareSlidevExportSource(
	app: App,
	sourceFile: TFile,
	config: SlideExportConfig,
	options: SlidevSourcePreparationOptions = {},
	onProgress?: ExportProgressCallback,
): Promise<SlidevExportSource> {
	const sourceMarkdown = await app.vault.read(sourceFile);
	if (isSlidevDeckMarkdown(sourceMarkdown)) {
		onProgress?.('slidev-source', 'Current file is already a Slidev deck.');
		return {
			inputFilePath: sourceFile.path,
			outputBasename: sourceFile.basename,
			sourceLabel: sourceFile.path,
		};
	}

	onProgress?.('slidev-source', 'Preparing Slidev deck from Markdown...');
	const skillContext = loadSlidevSkillContext();
	if (skillContext.rootPath) {
		onProgress?.('slidev-source', `Loaded Slidev skill from ${skillContext.rootPath} (${skillContext.referenceFiles.length} references).`);
	} else {
		onProgress?.('slidev-source', 'Slidev skill directory not found; using built-in deterministic preparation.');
	}
	const generatedDeck = options.deckGeneration
		? await tryGenerateDeckWithLlm(sourceFile, sourceMarkdown, skillContext, options.deckGeneration, onProgress)
		: null;

	const deckMarkdown = applySlidevPresentationGuardrails(
		generatedDeck ?? buildDeterministicSlidevDeck(sourceMarkdown, sourceFile.basename),
		config.slidevTheme || 'default',
	);
	const preparedDeckPath = await writePreparedDeck(app, sourceFile, config, deckMarkdown);

	onProgress?.('slidev-source', `Prepared Slidev deck: ${preparedDeckPath}`);
	return {
		inputFilePath: preparedDeckPath,
		outputBasename: sourceFile.basename,
		sourceLabel: preparedDeckPath,
		preparedDeckPath,
		skillRootPath: skillContext.rootPath ?? undefined,
		skillReferencePaths: skillContext.referenceFiles.map(reference => reference.relativePath),
	};
}

export function isSlidevDeckMarkdown(markdown: string): boolean {
	const slideSeparators = findSlideSeparators(markdown);
	if (slideSeparators.length > 0) {
		return true;
	}

	const headmatter = readLeadingYamlBlock(markdown);
	if (!headmatter) {
		return false;
	}

	return /(^|\n)\s*(theme|layout|transition|class|background|canvasWidth|aspectRatio|drawings|record|routerMode|mdc|highlighter)\s*:/i.test(headmatter);
}

export function buildDeterministicSlidevDeck(markdown: string, fallbackTitle: string): string {
	const title = extractTitle(markdown) || fallbackTitle;
	const updatedLine = markdown.split(/\r?\n/).find(line => /^>\s*(updated|更新)\s*[:：]/i.test(line.trim()));
	const segments = splitMarkdownIntoSegments(markdown);
	const slides: string[] = [];

	slides.push([
		buildDeckHeadmatter(title),
		`# ${title}`,
		updatedLine ? updatedLine.trim() : '',
	].filter(Boolean).join('\n\n'));

	for (const segment of segments) {
		if (segment.headingLevel === 1) {
			continue;
		}
		if (segment.headingLevel === 2) {
			slides.push(buildSectionSlide(segment.headingText));
			const body = segment.body.trim();
			if (body) {
				slides.push(...buildContentSlides(`## ${segment.headingText}`, body));
			}
			continue;
		}

		const heading = `${'#'.repeat(segment.headingLevel)} ${segment.headingText}`;
		slides.push(...buildContentSlides(heading, segment.body.trim()));
	}

	if (slides.length === 1) {
		slides.push(...buildContentSlides('## Notes', markdown.trim()));
	}

	slides.push([
		'---',
		'layout: center',
		'---',
		'',
		'# End',
	].join('\n'));

	return slides
		.map(slide => slide.trim())
		.filter(Boolean)
		.join('\n\n---\n\n')
		+ '\n';
}

export function applySlidevPresentationGuardrails(deckMarkdown: string, deckTheme = 'default'): string {
	const separatorLines = findSlideSeparators(deckMarkdown);
	if (separatorLines.length === 0) {
		return normalizeDeckTheme(deckMarkdown, deckTheme);
	}

	const themedDeckMarkdown = normalizeDeckTheme(deckMarkdown, deckTheme);
	const lines = themedDeckMarkdown.split(/\r?\n/);
	const slides: string[] = [];
	let startLine = 0;
	for (const separatorLine of findSlideSeparators(themedDeckMarkdown)) {
		slides.push(lines.slice(startLine, separatorLine).join('\n'));
		startLine = separatorLine + 1;
	}
	slides.push(lines.slice(startLine).join('\n'));

	const enhancedDeck = slides
		.map(slide => applySlideGuardrails(slide))
		.map(slide => slide.trim())
		.filter(Boolean);

	return joinSlidevSlides(enhancedDeck);
}

function normalizeDeckTheme(deckMarkdown: string, deckTheme: string): string {
	const lines = deckMarkdown.split(/\r?\n/);
	if (lines[0]?.trim() !== '---') {
		return deckMarkdown;
	}

	for (let index = 1; index < lines.length; index++) {
		if (lines[index].trim() === '---') {
			lines.splice(index, 0, `theme: ${formatYamlTheme(deckTheme)}`);
			return lines.join('\n');
		}
		if (/^theme\s*:/i.test(lines[index].trim())) {
			lines[index] = `theme: ${formatYamlTheme(deckTheme)}`;
			return lines.join('\n');
		}
	}

	return deckMarkdown;
}

function applySlideGuardrails(slideMarkdown: string): string {
	const normalizedSlide = normalizeSlideFrontmatter(slideMarkdown);
	const mermaidLineCount = countLargestMermaidBlockLines(normalizedSlide);
	if (mermaidLineCount < LARGE_MERMAID_LINE_THRESHOLD) {
		return normalizedSlide;
	}

	const zoom = resolveDiagramSlideZoom(mermaidLineCount);
	return ensureSlideFrontmatterValue(normalizedSlide, 'zoom', zoom);
}

function countLargestMermaidBlockLines(markdown: string): number {
	const lines = markdown.split(/\r?\n/);
	let inMermaidFence = false;
	let currentLines = 0;
	let largestBlock = 0;

	for (const line of lines) {
		if (!inMermaidFence && /^(```+|~~~+)\s*mermaid(?:\s+\{[^}]+\})?\s*$/i.test(line.trim())) {
			inMermaidFence = true;
			currentLines = 0;
			continue;
		}

		if (inMermaidFence && /^(```+|~~~+)\s*$/.test(line.trim())) {
			largestBlock = Math.max(largestBlock, currentLines);
			inMermaidFence = false;
			currentLines = 0;
			continue;
		}

		if (inMermaidFence) {
			currentLines += 1;
		}
	}

	return Math.max(largestBlock, currentLines);
}

function resolveDiagramSlideZoom(mermaidLineCount: number): string {
	if (mermaidLineCount >= 68) {
		return '0.28';
	}
	if (mermaidLineCount >= 56) {
		return '0.34';
	}
	if (mermaidLineCount >= 44) {
		return '0.40';
	}
	return '0.52';
}

function ensureSlideFrontmatterValue(slideMarkdown: string, key: string, value: string): string {
	const normalizedSlide = normalizeSlideFrontmatter(slideMarkdown);
	const normalizedLines = normalizedSlide.split(/\r?\n/);
	const frontmatterEnd = findSlideFrontmatterEnd(normalizedLines);
	if (frontmatterEnd > 0 && hasFrontmatterValue(normalizedLines, frontmatterEnd, key)) {
		return normalizedLines
			.map((line, index) => index < frontmatterEnd && new RegExp(`^${key}\\s*:`, 'i').test(line.trim())
				? `${key}: ${value}`
				: line)
			.join('\n');
	}

	if (frontmatterEnd > 0) {
		return [
			...normalizedLines.slice(0, frontmatterEnd),
			`${key}: ${value}`,
			...normalizedLines.slice(frontmatterEnd),
		].join('\n');
	}

	return [
		`${key}: ${value}`,
		'---',
		normalizedSlide.replace(/^\s+/, ''),
	].join('\n');
}

function normalizeSlideFrontmatter(slideMarkdown: string): string {
	const lines = slideMarkdown.replace(/^\s+/, '').split(/\r?\n/);
	const frontmatterEnd = findSlideFrontmatterEnd(lines);
	if (frontmatterEnd > 0 || !startsWithFrontmatterValue(lines)) {
		return lines.join('\n');
	}

	const bodyStart = findBareFrontmatterBodyStart(lines);
	if (bodyStart <= 0) {
		return lines.join('\n');
	}

	return [
		...lines.slice(0, bodyStart),
		'---',
		...lines.slice(bodyStart),
	].join('\n');
}

function findSlideFrontmatterEnd(lines: string[]): number {
	const firstContentLine = lines.findIndex(line => line.trim().length > 0);
	if (firstContentLine < 0 || !/^[A-Za-z][\w-]*\s*:/.test(lines[firstContentLine].trim())) {
		return -1;
	}

	for (let index = firstContentLine + 1; index < lines.length; index++) {
		const line = lines[index].trim();
		if (line === '---') {
			return index;
		}
		if (line.startsWith('#') || line.startsWith('```')) {
			return -1;
		}
	}

	return -1;
}

function startsWithFrontmatterValue(lines: string[]): boolean {
	const firstContentLine = lines.findIndex(line => line.trim().length > 0);
	return firstContentLine >= 0 && /^[A-Za-z][\w-]*\s*:/.test(lines[firstContentLine].trim());
}

function findBareFrontmatterBodyStart(lines: string[]): number {
	for (let index = 0; index < lines.length; index++) {
		const trimmed = lines[index].trim();
		if (!trimmed) {
			return index;
		}
		if (index > 0 && (trimmed.startsWith('#') || trimmed.startsWith('```') || trimmed.startsWith(':::'))) {
			return index;
		}
	}

	return -1;
}

function hasFrontmatterValue(lines: string[], frontmatterEnd: number, key: string): boolean {
	const pattern = new RegExp(`^${key}\\s*:`, 'i');
	return lines.slice(0, frontmatterEnd).some(line => pattern.test(line.trim()));
}

function joinSlidevSlides(slides: string[]): string {
	if (slides.length === 0) {
		return '';
	}

	let deckMarkdown = slides[0];
	for (const slide of slides.slice(1)) {
		deckMarkdown += slideStartsWithFrontmatter(slide)
			? `\n\n---\n${slide}`
			: `\n\n---\n\n${slide}`;
	}

	return deckMarkdown + '\n';
}

function slideStartsWithFrontmatter(slideMarkdown: string): boolean {
	const lines = slideMarkdown.split(/\r?\n/);
	return startsWithFrontmatterValue(lines) && findSlideFrontmatterEnd(lines) > 0;
}

function buildDeckHeadmatter(title: string): string {
	return [
		'---',
		'theme: default',
		`title: ${quoteYamlString(title)}`,
		'highlighter: shiki',
		'lineNumbers: false',
		'mdc: true',
		'transition: slide-left',
		'---',
	].join('\n');
}

function buildSectionSlide(title: string): string {
	return [
		'---',
		'layout: section',
		'---',
		'',
		`# ${title}`,
	].join('\n');
}

function buildContentSlides(heading: string, body: string): string[] {
	if (!body) {
		return [heading];
	}

	const blocks = splitMarkdownBlocks(body);
	const slides: string[] = [];
	let currentBlocks: string[] = [];
	let currentLength = heading.length;

	for (const block of blocks) {
		const projectedLength = currentLength + block.length + 2;
		if (currentBlocks.length > 0 && projectedLength > MAX_DETERMINISTIC_SLIDE_CHARS) {
			slides.push([heading, ...currentBlocks].join('\n\n'));
			currentBlocks = [];
			currentLength = heading.length;
		}
		currentBlocks.push(block);
		currentLength += block.length + 2;
	}

	if (currentBlocks.length > 0) {
		slides.push([heading, ...currentBlocks].join('\n\n'));
	}

	return slides.length > 0 ? slides : [heading];
}

function splitMarkdownIntoSegments(markdown: string): Array<{ headingLevel: number; headingText: string; body: string }> {
	const lines = markdown.split(/\r?\n/);
	const segments: Array<{ headingLevel: number; headingText: string; bodyLines: string[] }> = [];
	let current: { headingLevel: number; headingText: string; bodyLines: string[] } | null = null;
	let fence: string | null = null;

	for (const line of lines) {
		const fenceMarker = line.match(/^\s*(```+|~~~+)/)?.[1] ?? null;
		if (fenceMarker) {
			if (!fence) {
				fence = fenceMarker.slice(0, 3);
			} else if (fenceMarker.startsWith(fence)) {
				fence = null;
			}
			if (current) {
				current.bodyLines.push(line);
			}
			continue;
		}

		const heading = !fence ? line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/) : null;
		if (heading) {
			current = {
				headingLevel: heading[1].length,
				headingText: heading[2].trim(),
				bodyLines: [],
			};
			segments.push(current);
			continue;
		}

		if (current) {
			current.bodyLines.push(line);
		}
	}

	return segments.map(segment => ({
		headingLevel: segment.headingLevel,
		headingText: segment.headingText,
		body: segment.bodyLines.join('\n').trim(),
	}));
}

function splitMarkdownBlocks(markdown: string): string[] {
	const lines = markdown.split(/\r?\n/);
	const blocks: string[] = [];
	let currentLines: string[] = [];
	let fence: string | null = null;
	let inTable = false;

	const flush = () => {
		const block = currentLines.join('\n').trim();
		if (block) {
			blocks.push(block);
		}
		currentLines = [];
		inTable = false;
	};

	for (const line of lines) {
		const fenceMarker = line.match(/^\s*(```+|~~~+)/)?.[1] ?? null;
		if (fenceMarker) {
			currentLines.push(line);
			if (!fence) {
				fence = fenceMarker.slice(0, 3);
			} else if (fenceMarker.startsWith(fence)) {
				fence = null;
				flush();
			}
			continue;
		}

		if (fence) {
			currentLines.push(line);
			continue;
		}

		if (/^\s*\|.+\|\s*$/.test(line)) {
			if (!inTable && currentLines.length > 0) {
				flush();
			}
			inTable = true;
			currentLines.push(line);
			continue;
		}

		if (inTable) {
			flush();
		}

		if (line.trim() === '') {
			flush();
			continue;
		}

		currentLines.push(line);
	}

	flush();
	return blocks;
}

function findSlideSeparators(markdown: string): number[] {
	const lines = markdown.split(/\r?\n/);
	const separators: number[] = [];
	let fence: string | null = null;
	let firstYamlClosed = !/^---\s*(?:\r?\n|$)/.test(markdown);
	let lastSlideSeparator = -1;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const fenceMarker = line.match(/^\s*(```+|~~~+)/)?.[1] ?? null;
		if (fenceMarker) {
			if (!fence) {
				fence = fenceMarker.slice(0, 3);
			} else if (fenceMarker.startsWith(fence)) {
				fence = null;
			}
			continue;
		}

		if (fence || !/^---\s*$/.test(line)) {
			continue;
		}

		if (!firstYamlClosed && index === 0) {
			continue;
		}
		if (!firstYamlClosed) {
			firstYamlClosed = true;
			continue;
		}

		if (isSlideFrontmatterClosingLine(lines, lastSlideSeparator + 1, index)) {
			continue;
		}

		separators.push(index);
		lastSlideSeparator = index;
	}

	return separators;
}

function isSlideFrontmatterClosingLine(lines: string[], startIndex: number, closingIndex: number): boolean {
	if (startIndex < 0 || startIndex >= closingIndex) {
		return false;
	}

	const firstContentLine = lines
		.slice(startIndex, closingIndex)
		.findIndex(line => line.trim().length > 0);
	if (firstContentLine < 0) {
		return false;
	}

	const absoluteFirstContentLine = startIndex + firstContentLine;
	if (!/^[A-Za-z][\w-]*\s*:/.test(lines[absoluteFirstContentLine].trim())) {
		return false;
	}

	for (let index = absoluteFirstContentLine; index < closingIndex; index++) {
		const line = lines[index].trim();
		if (!line) {
			continue;
		}
		if (line.startsWith('#') || line.startsWith('```') || line.startsWith(':::')) {
			return false;
		}
	}

	return true;
}

function readLeadingYamlBlock(markdown: string): string | null {
	const lines = markdown.split(/\r?\n/);
	if (!/^---\s*$/.test(lines[0] ?? '')) {
		return null;
	}

	const block: string[] = [];
	for (let index = 1; index < lines.length; index++) {
		if (/^---\s*$/.test(lines[index])) {
			return block.join('\n');
		}
		block.push(lines[index]);
	}

	return null;
}

function extractTitle(markdown: string): string | null {
	const title = markdown.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1]?.trim();
	return title || null;
}

async function tryGenerateDeckWithLlm(
	sourceFile: TFile,
	sourceMarkdown: string,
	skillContext: SlidevSkillContext,
	deckGeneration: SlidevDeckGenerationProfile,
	onProgress?: ExportProgressCallback,
): Promise<string | null> {
	if (!skillContext.skillText && skillContext.referenceFiles.length === 0) {
		onProgress?.('slidev-source', 'Slidev skill context unavailable; using deterministic deck preparation.');
		return null;
	}

	onProgress?.('slidev-source', `Generating Slidev deck with ${deckGeneration.provider.name} and Slidev skill references...`);
	try {
		const prompt = buildSlidevDeckPrompt(sourceFile, sourceMarkdown, skillContext);
		const response = await callLLM(
			deckGeneration.provider,
			prompt.system,
			prompt.user,
			deckGeneration.settings,
			deckGeneration.reporter,
			deckGeneration.modelName,
			deckGeneration.reporter.abortController?.signal,
		);
		const deckMarkdown = extractMarkdownDeck(response);
		if (!isSlidevDeckMarkdown(deckMarkdown)) {
			onProgress?.('slidev-source', 'LLM response was not a valid Slidev deck; using deterministic deck preparation.');
			return null;
		}
		return deckMarkdown.trim() + '\n';
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		onProgress?.('slidev-source', `LLM deck preparation failed: ${message}; using deterministic deck preparation.`);
		return null;
	}
}

function buildSlidevDeckPrompt(
	sourceFile: TFile,
	sourceMarkdown: string,
	skillContext: SlidevSkillContext,
): { system: string; user: string } {
	const referenceIndex = skillContext.referenceFiles
		.map(reference => `- ${reference.relativePath}`)
		.join('\n');
	const referenceText = skillContext.referenceFiles
		.map(reference => `## ${reference.relativePath}\n\n${reference.content.trim()}`)
		.join('\n\n');
	const sourceTitle = extractTitle(sourceMarkdown) || sourceFile.basename;

	const system = [
		'You convert long-form Markdown notes into polished Slidev decks.',
		'Use the official Slidev skill instructions and references provided below.',
		'Return only a complete Slidev Markdown deck. Do not wrap it in a code fence.',
		'The deck must start with Slidev headmatter and use --- slide separators.',
		'Preserve fenced code blocks, Mermaid diagrams, tables, and important technical details.',
		'Split dense source sections into multiple readable slides instead of making one overflowing slide.',
		'For large diagrams, tables, or code blocks, use per-slide frontmatter such as zoom: 0.55-0.75 or Transform so nothing is clipped on a 16:9 canvas.',
	].join('\n');

	const user = [
		'# Slidev Skill',
		skillContext.skillText.trim(),
		'',
		'# Available Slidev Skill References',
		referenceIndex,
		'',
		'# Slidev Skill Reference Contents',
		truncateText(referenceText, MAX_LLM_REFERENCE_CHARS),
		'',
		'# Source Note',
		`Path: ${sourceFile.path}`,
		`Deck title: ${sourceTitle}`,
		'',
		sourceMarkdown,
	].join('\n');

	return { system, user };
}

function loadSlidevSkillContext(): SlidevSkillContext {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs || !path) {
		return { rootPath: null, skillText: '', referenceFiles: [] };
	}

	const skillRoot = resolveSlidevSkillRoot(fs, path);
	if (!skillRoot) {
		return { rootPath: null, skillText: '', referenceFiles: [] };
	}

	const readFile = (relativePath: string): string => {
		try {
			return fs.readFileSync(path.join(skillRoot, relativePath), 'utf8');
		} catch {
			return '';
		}
	};

	const referencesRoot = path.join(skillRoot, 'references');
	const referenceFiles = fs.existsSync(referencesRoot)
		? fs.readdirSync(referencesRoot)
			.filter((name: string) => name.endsWith('.md'))
			.sort()
			.map((name: string) => {
				const relativePath = `references/${name}`;
				return { relativePath, content: readFile(relativePath) };
			})
			.filter((reference: SlidevSkillReference) => reference.content.trim().length > 0)
		: [];

	return {
		rootPath: skillRoot,
		skillText: readFile('SKILL.md'),
		referenceFiles,
	};
}

function resolveSlidevSkillRoot(fs: any, path: any): string | null {
	const workspaceHomes = resolveWorkspaceHomeCandidates();
	const candidates = [
		process.env.NOTEMD_SLIDEV_SKILL_DIR,
		...workspaceHomes.flatMap(home => [
			path.join(home, 'slidev', 'skills', 'slidev'),
			path.join(home, '.agents', 'skills', 'slidev'),
			path.join(home, '.claude', 'skills', 'slidev'),
			path.join(home, '.codex', 'skills', 'slidev'),
		]),
	].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);

	for (const candidate of candidates) {
		try {
			if (fs.existsSync(path.join(candidate, 'SKILL.md'))) {
				return candidate;
			}
		} catch {
			// Try the next candidate.
		}
	}

	return null;
}

function extractMarkdownDeck(response: string): string {
	const fencedBlocks = [...response.matchAll(/```[^\n]*\n([\s\S]*?)\n```/gi)];
	for (const block of fencedBlocks) {
		const candidate = block[1].trim();
		if (isSlidevDeckMarkdown(candidate)) {
			return candidate;
		}
	}

	const trimmed = response.trim();
	if (isSlidevDeckMarkdown(trimmed)) {
		return trimmed;
	}

	const frontmatterStart = trimmed.search(/^---\s*$/m);
	if (frontmatterStart >= 0) {
		const candidate = trimmed.slice(frontmatterStart).trim();
		if (isSlidevDeckMarkdown(candidate)) {
			return candidate;
		}
	}

	return trimmed;
}

function truncateText(text: string, maxChars: number): string {
	if (text.length <= maxChars) {
		return text;
	}
	return `${text.slice(0, maxChars)}\n\n[Truncated to fit the deck generation prompt budget.]`;
}

async function writePreparedDeck(app: App, sourceFile: TFile, config: SlideExportConfig, deckMarkdown: string): Promise<string> {
	const directoryPath = normalizeVaultPath(`${config.outputSubfolder}/_slidev-sources`);
	const filePath = normalizeVaultPath(`${directoryPath}/${sourceFile.basename}.slidev.md`);
	await ensureVaultDirectory(app, directoryPath);
	await app.vault.adapter.write(filePath, deckMarkdown);
	return filePath;
}

async function ensureVaultDirectory(app: App, directoryPath: string): Promise<void> {
	const adapter = app.vault.adapter;
	const parts = directoryPath.split('/').filter(Boolean);
	let current = '';
	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		if (await adapter.exists(current)) {
			continue;
		}
		await adapter.mkdir(current);
	}
}

function normalizeVaultPath(path: string): string {
	return path
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\/{2,}/g, '/')
		.replace(/\/$/, '');
}

function quoteYamlString(value: string): string {
	return JSON.stringify(value);
}

function formatYamlTheme(value: string): string {
	return /^[A-Za-z0-9_-]+$/.test(value) ? value : quoteYamlString(value);
}
