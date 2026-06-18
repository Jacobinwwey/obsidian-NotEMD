export type SlidevMeasuredElementKind = 'mermaid' | 'table' | 'code' | 'image' | 'text' | 'other';

export interface SlidevRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
}

export interface SlidevMeasuredElement {
	kind: SlidevMeasuredElementKind;
	selector: string;
	textLength: number;
	scrollWidth: number;
	scrollHeight: number;
	clientWidth: number;
	clientHeight: number;
	rect: SlidevRect;
}

export interface RenderedSlideMeasurement {
	slide: number;
	slideRoot: SlidevRect | null;
	safeRect: SlidevRect | null;
	contentBounds: SlidevRect | null;
	pageScale: number | null;
	elements: SlidevMeasuredElement[];
	errors: string[];
}

export type SlidevLayoutFindingKind = 'overflow' | 'unreadable-scale' | 'render-error';
export type SlidevLayoutPatchKind = 'reduce-zoom' | 'split-diagram' | 'split-table' | 'reduce-code' | 'split-slide' | 'manual-review';

export interface SlidevLayoutFinding {
	kind: SlidevLayoutFindingKind;
	target: SlidevMeasuredElementKind | 'content' | 'slide-root';
	message: string;
	recommendedPatch: SlidevLayoutPatchKind;
	recommendedScale: number | null;
	overflow?: {
		left: number;
		top: number;
		right: number;
		bottom: number;
	};
}

export interface SlidevLayoutAudit {
	slide: number;
	safeRect: SlidevRect | null;
	contentBounds: SlidevRect | null;
	pageScale: number | null;
	findings: SlidevLayoutFinding[];
	elementKinds: SlidevMeasuredElementKind[];
}

export interface SlidevLayoutAuditSummary {
	slideCount: number;
	overflowCount: number;
	unreadableCount: number;
	renderErrorCount: number;
	retryCount: number;
}

export interface SlidevLayoutAuditConfig {
	overflowTolerancePx: number;
	minReadableScale: number;
	maxAutoPatchPasses: number;
}

export interface SlidevDeckPatchResult {
	deckMarkdown: string;
	changed: boolean;
	changedSlides: number[];
	blockedSlides: Array<{ slide: number; reason: string }>;
}

interface MermaidFenceBlock {
	startLine: number;
	endLine: number;
	opener: string;
	closer: string;
	bodyLines: string[];
}

interface PatchableSlideSurface {
	frontmatterLines: string[];
	bodyLines: string[];
}

interface MermaidSplitPlan {
	repeatedLines: string[];
	segments: string[][];
}

const DEFAULT_CONFIG: SlidevLayoutAuditConfig = {
	overflowTolerancePx: 6,
	minReadableScale: 0.28,
	maxAutoPatchPasses: 2,
};

export function analyzeRenderedSlideMeasurement(
	measurement: RenderedSlideMeasurement,
	config: Partial<SlidevLayoutAuditConfig> = {},
): SlidevLayoutAudit {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
	const findings: SlidevLayoutFinding[] = [];
	const elementKinds = Array.from(new Set(measurement.elements.map(element => element.kind)));

	if (measurement.errors.length > 0 || !measurement.slideRoot || !measurement.safeRect) {
		findings.push({
			kind: 'render-error',
			target: 'slide-root',
			message: measurement.errors[0] || 'Slide root or safe rect unavailable',
			recommendedPatch: 'manual-review',
			recommendedScale: null,
		});
		return {
			slide: measurement.slide,
			safeRect: measurement.safeRect,
			contentBounds: measurement.contentBounds,
			pageScale: measurement.pageScale,
			findings,
			elementKinds,
		};
	}

	if (measurement.contentBounds) {
		const contentOverflow = measureOverflow(measurement.contentBounds, measurement.slideRoot, resolvedConfig.overflowTolerancePx);
		if (hasOverflow(contentOverflow)) {
			findings.push({
				kind: 'overflow',
				target: 'content',
				message: 'Slide content exceeds the safe visible rectangle',
				recommendedPatch: dominantPatchTarget(elementKinds),
				recommendedScale: computeFitScale(measurement.contentBounds, measurement.slideRoot),
				overflow: contentOverflow,
			});
		}
	}

	for (const element of measurement.elements) {
		const elementOverflow = measureOverflow(element.rect, measurement.slideRoot, resolvedConfig.overflowTolerancePx);
		const scrollOverflow = element.scrollWidth - element.clientWidth > resolvedConfig.overflowTolerancePx
			|| element.scrollHeight - element.clientHeight > resolvedConfig.overflowTolerancePx;

		if (!hasOverflow(elementOverflow) && !scrollOverflow) {
			continue;
		}

		findings.push({
			kind: 'overflow',
			target: element.kind,
			message: describeElementOverflow(element.kind, scrollOverflow),
			recommendedPatch: patchTargetForElement(element.kind),
			recommendedScale: computeFitScale(element.rect, measurement.slideRoot),
			overflow: elementOverflow,
		});
	}

	if (measurement.pageScale !== null && measurement.pageScale < resolvedConfig.minReadableScale) {
		findings.push({
			kind: 'unreadable-scale',
			target: 'content',
			message: `Slide zoom ${measurement.pageScale.toFixed(3)} is below the readable floor ${resolvedConfig.minReadableScale.toFixed(2)}`,
			recommendedPatch: dominantPatchTarget(elementKinds),
			recommendedScale: null,
		});
	}

	return {
		slide: measurement.slide,
		safeRect: measurement.safeRect,
		contentBounds: measurement.contentBounds,
		pageScale: measurement.pageScale,
		findings,
		elementKinds,
	};
}

export function summarizeLayoutAudits(
	audits: SlidevLayoutAudit[],
	retryCount = 0,
): SlidevLayoutAuditSummary {
	return {
		slideCount: audits.length,
		overflowCount: audits.reduce((total, audit) => total + audit.findings.filter(finding => finding.kind === 'overflow').length, 0),
		unreadableCount: audits.reduce((total, audit) => total + audit.findings.filter(finding => finding.kind === 'unreadable-scale').length, 0),
		renderErrorCount: audits.reduce((total, audit) => total + audit.findings.filter(finding => finding.kind === 'render-error').length, 0),
		retryCount,
	};
}

export function countSlideDeckSlides(deckMarkdown: string): number {
	return splitSlideDeck(deckMarkdown).length;
}

export function patchDeckWithLayoutAudit(
	deckMarkdown: string,
	audits: SlidevLayoutAudit[],
	config: Partial<SlidevLayoutAuditConfig> = {},
): SlidevDeckPatchResult {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
	const slides = splitSlideDeck(deckMarkdown);
	const changedSlides: number[] = [];
	const blockedSlides: Array<{ slide: number; reason: string }> = [];
	let slideOffset = 0;

	for (const audit of audits) {
		const targetIndex = audit.slide - 1 + slideOffset;
		if (audit.slide <= 0 || targetIndex < 0 || targetIndex >= slides.length) {
			continue;
		}

		const currentSlide = slides[targetIndex];
		const bestScale = chooseBestRecommendedScale(audit.findings);
		const currentZoom = readSlideZoom(currentSlide) ?? 1;
		const nextZoom = bestScale === null ? null : clampZoom(currentZoom * bestScale * 0.98);

		if (shouldSplitDiagramBeforeZoom(audit.findings, nextZoom, resolvedConfig.minReadableScale)) {
			const splitResult = splitOverflowingMermaidSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
			if (nextZoom === null || nextZoom < resolvedConfig.minReadableScale) {
				blockedSlides.push({
					slide: audit.slide,
					reason: splitResult.reason ?? 'diagram overflow requires manual review',
				});
				continue;
			}
		}

		if (shouldSplitSimpleSlideBeforeZoom(audit.findings)) {
			const splitResult = splitOverflowingSimpleSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
		}

		if (bestScale === null || bestScale >= 0.995 || nextZoom === null || nextZoom >= currentZoom - 0.01) {
			continue;
		}

		if (isDeckHeadmatterSlide(currentSlide, targetIndex)) {
			blockedSlides.push({
				slide: audit.slide,
				reason: 'first slide deck headmatter cannot be rewritten with per-slide zoom safely',
			});
			continue;
		}

		if (nextZoom < resolvedConfig.minReadableScale) {
			blockedSlides.push({
				slide: audit.slide,
				reason: `required zoom ${nextZoom.toFixed(3)} is below readable floor ${resolvedConfig.minReadableScale.toFixed(2)}`,
			});
			continue;
		}

		slides[targetIndex] = ensureSlideFrontmatterValue(currentSlide, 'zoom', formatZoom(nextZoom));
		changedSlides.push(audit.slide);
	}

	return {
		deckMarkdown: joinSlideDeck(slides),
		changed: changedSlides.length > 0,
		changedSlides,
		blockedSlides,
	};
}

function describeElementOverflow(kind: SlidevMeasuredElementKind, scrollOverflow: boolean): string {
	if (scrollOverflow) {
		switch (kind) {
			case 'table':
				return 'Table content overflows its scroll box';
			case 'code':
				return 'Code block overflows its scroll box';
			default:
				return `${kind} content overflows its scroll box`;
		}
	}

	switch (kind) {
		case 'mermaid':
			return 'Mermaid diagram exceeds the safe visible rectangle';
		case 'table':
			return 'Table exceeds the safe visible rectangle';
		case 'code':
			return 'Code block exceeds the safe visible rectangle';
		default:
			return `${kind} element exceeds the safe visible rectangle`;
	}
}

function dominantPatchTarget(elementKinds: SlidevMeasuredElementKind[]): SlidevLayoutPatchKind {
	if (elementKinds.includes('mermaid')) {
		return 'split-diagram';
	}
	if (elementKinds.includes('table')) {
		return 'split-table';
	}
	if (elementKinds.includes('code')) {
		return 'reduce-code';
	}
	return 'split-slide';
}

function patchTargetForElement(kind: SlidevMeasuredElementKind): SlidevLayoutPatchKind {
	switch (kind) {
		case 'mermaid':
			return 'split-diagram';
		case 'table':
			return 'split-table';
		case 'code':
			return 'reduce-code';
		default:
			return 'reduce-zoom';
	}
}

function measureOverflow(rect: SlidevRect, safeRect: SlidevRect, tolerancePx: number) {
	return {
		left: Math.max(0, safeRect.left - rect.left - tolerancePx),
		top: Math.max(0, safeRect.top - rect.top - tolerancePx),
		right: Math.max(0, rect.right - safeRect.right - tolerancePx),
		bottom: Math.max(0, rect.bottom - safeRect.bottom - tolerancePx),
	};
}

function hasOverflow(overflow: { left: number; top: number; right: number; bottom: number }): boolean {
	return overflow.left > 0 || overflow.top > 0 || overflow.right > 0 || overflow.bottom > 0;
}

function computeFitScale(rect: SlidevRect, safeRect: SlidevRect): number | null {
	if (rect.width <= 0 || rect.height <= 0 || safeRect.width <= 0 || safeRect.height <= 0) {
		return null;
	}

	const relativeRight = rect.right - safeRect.left;
	const relativeBottom = rect.bottom - safeRect.top;
	const widthScale = relativeRight > safeRect.width
		? safeRect.width / relativeRight
		: safeRect.width / rect.width;
	const heightScale = relativeBottom > safeRect.height
		? safeRect.height / relativeBottom
		: safeRect.height / rect.height;

	return Math.min(1, widthScale, heightScale);
}

function chooseBestRecommendedScale(findings: SlidevLayoutFinding[]): number | null {
	const scales = findings
		.map(finding => finding.recommendedScale)
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1);

	if (scales.length === 0) {
		return null;
	}

	return Math.min(...scales);
}

function clampZoom(value: number): number {
	return Math.max(0.18, Math.min(1, Number.isFinite(value) ? value : 1));
}

function formatZoom(value: number): string {
	return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function readSlideZoom(slideMarkdown: string): number | null {
	const match = slideMarkdown.match(/(^|\n)zoom:\s*([0-9]+(?:\.[0-9]+)?)/i);
	if (!match) {
		return null;
	}

	const value = Number(match[2]);
	return Number.isFinite(value) ? value : null;
}

function splitSlideDeck(deckMarkdown: string): string[] {
	const lines = deckMarkdown.split(/\r?\n/);
	const slides: string[] = [];
	let fence: string | null = null;
	let inHeadmatter = false;
	let headmatterClosed = false;
	let current: string[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const trimmed = line.trim();
		const fenceMarker = trimmed.match(/^(```+|~~~+)/)?.[1] ?? null;
		if (fenceMarker) {
			if (!fence) {
				fence = fenceMarker.slice(0, 3);
			} else if (fenceMarker.startsWith(fence)) {
				fence = null;
			}
		}

		if (!headmatterClosed && index === 0 && trimmed === '---') {
			inHeadmatter = true;
			current.push(line);
			continue;
		}

		if (inHeadmatter && trimmed === '---') {
			inHeadmatter = false;
			headmatterClosed = true;
			current.push(line);
			continue;
		}

		if (!fence && headmatterClosed && trimmed === '---' && !isFrontmatterClosingBoundary(current)) {
			slides.push(current.join('\n').trim());
			current = [];
			continue;
		}

		current.push(line);
	}

	if (current.join('\n').trim()) {
		slides.push(current.join('\n').trim());
	}

	return slides;
}

function shouldSplitDiagramBeforeZoom(
	findings: SlidevLayoutFinding[],
	nextZoom: number | null,
	minReadableScale: number,
): boolean {
	if (!findings.some(finding => finding.recommendedPatch === 'split-diagram')) {
		return false;
	}

	if (findings.some(finding => finding.kind === 'unreadable-scale')) {
		return true;
	}

	return nextZoom !== null && nextZoom < minReadableScale;
}

function shouldSplitSimpleSlideBeforeZoom(findings: SlidevLayoutFinding[]): boolean {
	return findings.some(finding => finding.recommendedPatch === 'split-slide');
}

function splitOverflowingMermaidSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = extractPatchableSlideSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'diagram slide uses deck headmatter or unsupported layout syntax' };
	}

	const mermaidBlock = findSingleMermaidFenceBlock(surface.bodyLines);
	if (!mermaidBlock) {
		return { slides: null, reason: 'diagram split requires exactly one Mermaid fence' };
	}

	const targetChunkCount = resolveDiagramChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
	const mermaidChunks = splitMermaidFenceIntoChunks(mermaidBlock.bodyLines, targetChunkCount);
	if (!mermaidChunks || mermaidChunks.length < 2) {
		return { slides: null, reason: 'Mermaid structure does not expose safe top-level split boundaries' };
	}

	const prefixLines = trimOuterBlankLines(surface.bodyLines.slice(0, mermaidBlock.startLine));
	const suffixLines = trimOuterBlankLines(surface.bodyLines.slice(mermaidBlock.endLine + 1));
	const continuationHeading = findFirstHeadingLine(prefixLines.length > 0 ? prefixLines : surface.bodyLines);
	const cleanFrontmatter = stripFrontmatterKey(surface.frontmatterLines, 'zoom');
	const splitSlides: string[] = [];

	for (let index = 0; index < mermaidChunks.length; index++) {
		const bodyLines: string[] = [];
		if (index === 0) {
			bodyLines.push(...prefixLines);
		} else if (continuationHeading) {
			bodyLines.push(continuationHeading, '');
		}

		bodyLines.push(mermaidBlock.opener, ...mermaidChunks[index], mermaidBlock.closer);

		if (index === mermaidChunks.length - 1 && suffixLines.length > 0) {
			const trailingLines = dropLeadingHeadingLine(suffixLines, continuationHeading);
			if (trailingLines.length > 0) {
				bodyLines.push('', ...trailingLines);
			}
		}

		splitSlides.push(assemblePatchedSlide(cleanFrontmatter, bodyLines));
	}

	return { slides: splitSlides };
}

function splitOverflowingSimpleSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = extractPatchableSlideSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'content slide uses deck headmatter or unsupported layout syntax' };
	}
	if (surface.bodyLines.some(line => /^(```+|~~~+)/.test(line.trim()) || /^\|.*\|$/.test(line.trim()) || /^!\[.*\]\(.+\)/.test(line.trim()))) {
		return { slides: null, reason: 'content split only supports paragraph and list slides' };
	}

	const normalizedBody = trimOuterBlankLines(surface.bodyLines);
	const headingIndex = normalizedBody.findIndex(line => /^#{1,6}\s+\S/.test(line.trim()));
	const headingLine = headingIndex >= 0 ? normalizedBody[headingIndex].trim() : null;
	const leadLines = headingIndex >= 0
		? trimOuterBlankLines(normalizedBody.slice(0, headingIndex + 1))
		: [];
	const contentLines = headingIndex >= 0
		? trimOuterBlankLines(normalizedBody.slice(headingIndex + 1))
		: normalizedBody;
	const blocks = collectSimpleSlideBlocks(contentLines);
	if (blocks.length < 2) {
		return { slides: null, reason: 'content slide does not expose enough paragraph or list blocks to split safely' };
	}

	const targetChunkCount = resolveDiagramChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
	const chunkedBlocks = chunkLineBlocks(blocks, Math.max(2, Math.min(targetChunkCount, blocks.length)));
	if (chunkedBlocks.length < 2) {
		return { slides: null, reason: 'content blocks could not be distributed into multiple slides' };
	}

	const cleanFrontmatter = stripFrontmatterKey(surface.frontmatterLines, 'zoom');
	const splitSlides = chunkedBlocks.map((chunk, index) => {
		const bodyLines = index === 0
			? [...leadLines]
			: headingLine
				? [headingLine, '']
				: [];
		appendSlideBlock(bodyLines, chunk);
		return assemblePatchedSlide(cleanFrontmatter, bodyLines);
	});

	return { slides: splitSlides };
}

function extractPatchableSlideSurface(slideMarkdown: string): PatchableSlideSurface | null {
	const normalizedSlide = normalizeSlideFrontmatter(slideMarkdown);
	if (normalizedSlide.trimStart().startsWith('---')) {
		return null;
	}

	const lines = normalizedSlide.split(/\r?\n/);
	const frontmatterEnd = findSlideFrontmatterEnd(lines);
	const frontmatterLines = frontmatterEnd > 0 ? lines.slice(0, frontmatterEnd + 1) : [];
	const bodyLines = frontmatterEnd > 0 ? lines.slice(frontmatterEnd + 1) : lines;
	const layout = readFrontmatterScalar(frontmatterLines, 'layout');
	if (layout && !['default', 'center'].includes(layout)) {
		return null;
	}
	if (bodyLines.some(line => /^::[\w-]+::$/.test(line.trim()) || /^:::\s*/.test(line.trim()) || /<(Transform|v-click|v-switch)\b/i.test(line.trim()))) {
		return null;
	}

	return {
		frontmatterLines,
		bodyLines,
	};
}

function isDeckHeadmatterSlide(slideMarkdown: string, slideIndex: number): boolean {
	return slideIndex === 0 && slideMarkdown.trimStart().startsWith('---');
}

function readFrontmatterScalar(frontmatterLines: string[], key: string): string | null {
	const keyPattern = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'i');
	for (const line of frontmatterLines.slice(0, -1)) {
		const match = line.trim().match(keyPattern);
		if (match) {
			return match[1].trim().replace(/^['"]|['"]$/g, '');
		}
	}
	return null;
}

function stripFrontmatterKey(frontmatterLines: string[], key: string): string[] {
	if (frontmatterLines.length === 0) {
		return [];
	}

	const keyPattern = new RegExp(`^${key}\\s*:`, 'i');
	const contentLines = frontmatterLines.slice(0, -1).filter(line => !keyPattern.test(line.trim()));
	if (contentLines.length === 0) {
		return [];
	}

	return [...contentLines, '---'];
}

function findSingleMermaidFenceBlock(lines: string[]): MermaidFenceBlock | null {
	let block: MermaidFenceBlock | null = null;
	let activeFenceMarker: string | null = null;
	let opener = '';
	let startLine = -1;
	let bodyLines: string[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const trimmed = line.trim();
		const openingMatch = trimmed.match(/^(```+|~~~+)\s*mermaid(?:\s+\{[^}]+\})?\s*$/i);
		if (!activeFenceMarker && openingMatch) {
			if (block) {
				return null;
			}
			activeFenceMarker = openingMatch[1][0] === '~' ? '~~~' : '```';
			opener = line;
			startLine = index;
			bodyLines = [];
			continue;
		}

		if (activeFenceMarker && new RegExp(`^${escapeRegExp(activeFenceMarker)}+\\s*$`).test(trimmed)) {
			block = {
				startLine,
				endLine: index,
				opener,
				closer: line,
				bodyLines: trimOuterBlankLines(bodyLines),
			};
			activeFenceMarker = null;
			continue;
		}

		if (activeFenceMarker) {
			bodyLines.push(line);
		}
	}

	return activeFenceMarker ? null : block;
}

function resolveDiagramChunkCount(
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	minReadableScale: number,
): number {
	const effectiveZoom = nextZoom
		?? (audit.pageScale !== null && audit.pageScale > 0 ? audit.pageScale : currentZoom);
	const requiredFactor = minReadableScale / Math.max(effectiveZoom, 0.01);
	return Math.max(2, Math.min(4, Math.ceil(requiredFactor)));
}

function splitMermaidFenceIntoChunks(bodyLines: string[], targetChunkCount: number): string[][] | null {
	const splitPlan = buildMermaidSplitPlan(bodyLines);
	if (!splitPlan || splitPlan.segments.length < 2) {
		return null;
	}

	const cappedChunkCount = Math.max(2, Math.min(targetChunkCount, splitPlan.segments.length));
	const chunkedSegments = chunkLineBlocks(splitPlan.segments, cappedChunkCount);
	if (chunkedSegments.length < 2) {
		return null;
	}

	return chunkedSegments.map(chunk => trimOuterBlankLines([
		...splitPlan.repeatedLines,
		...chunk,
	]));
}

function buildMermaidSplitPlan(bodyLines: string[]): MermaidSplitPlan | null {
	const trimmedBody = trimOuterBlankLines(bodyLines);
	const typeIndex = trimmedBody.findIndex(line => {
		const trimmed = line.trim();
		return trimmed.length > 0 && !trimmed.startsWith('%%');
	});
	if (typeIndex < 0) {
		return null;
	}

	const repeatedPrefix = trimOuterBlankLines(trimmedBody.slice(0, typeIndex));
	const typeLine = trimmedBody[typeIndex];
	const diagramBody = trimOuterBlankLines(trimmedBody.slice(typeIndex + 1));
	const normalizedType = typeLine.trim().toLowerCase();

	if (normalizedType.startsWith('sequencediagram')) {
		return buildSequenceDiagramSplitPlan(repeatedPrefix, typeLine, diagramBody);
	}

	if (normalizedType.startsWith('flowchart') || normalizedType.startsWith('graph') || normalizedType.startsWith('mindmap')) {
		const segments = collectMermaidTopLevelSegments(diagramBody, {
			openPatterns: [/^subgraph\b/i],
			closePattern: /^end\b/i,
		});
		return segments.length > 1
			? {
				repeatedLines: [...repeatedPrefix, typeLine],
				segments,
			}
			: null;
	}

	return null;
}

function buildSequenceDiagramSplitPlan(
	repeatedPrefix: string[],
	typeLine: string,
	bodyLines: string[],
): MermaidSplitPlan | null {
	const segments = collectMermaidTopLevelSegments(bodyLines, {
		openPatterns: [/^(alt|opt|loop|par|critical|rect|box)\b/i],
		closePattern: /^end\b/i,
	});
	if (segments.length < 2) {
		return null;
	}

	const repeatedLines = [...repeatedPrefix, typeLine];
	let bodyStart = 0;
	while (bodyStart < segments.length && isSequenceInvariantSegment(segments[bodyStart])) {
		repeatedLines.push(...segments[bodyStart], '');
		bodyStart += 1;
	}

	const bodySegments = segments.slice(bodyStart);
	if (bodySegments.length < 2) {
		return null;
	}

	return {
		repeatedLines: trimOuterBlankLines(repeatedLines),
		segments: bodySegments,
	};
}

function isSequenceInvariantSegment(segment: string[]): boolean {
	const meaningfulLines = segment.map(line => line.trim()).filter(Boolean);
	return meaningfulLines.length > 0 && meaningfulLines.every(line => /^(%%|autonumber\b|title\b|participant\b|actor\b|create\s+participant\b|destroy\s+participant\b|box\b|end\b)/i.test(line));
}

function collectMermaidTopLevelSegments(
	lines: string[],
	options: {
		openPatterns: RegExp[];
		closePattern: RegExp;
	},
): string[][] {
	const segments: string[][] = [];
	let current: string[] = [];
	let depth = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		const currentHasContent = current.some(hasSubstantiveMermaidLine);
		if (depth === 0 && currentHasContent && trimmed.length > 0) {
			segments.push(trimOuterBlankLines(current));
			current = [];
		}

		current.push(line);
		if (options.openPatterns.some(pattern => pattern.test(trimmed))) {
			depth += 1;
		}
		if (options.closePattern.test(trimmed)) {
			depth = Math.max(0, depth - 1);
		}
	}

	if (current.some(hasSubstantiveMermaidLine)) {
		segments.push(trimOuterBlankLines(current));
	}

	return segments.filter(segment => segment.some(hasSubstantiveMermaidLine));
}

function hasSubstantiveMermaidLine(line: string): boolean {
	const trimmed = line.trim();
	return trimmed.length > 0 && !trimmed.startsWith('%%');
}

function chunkLineBlocks(blocks: string[][], chunkCount: number): string[][] {
	const targetLineBudget = Math.max(1, Math.ceil(blocks.reduce((total, block) => total + countMeaningfulLines(block), 0) / chunkCount));
	const chunks: string[][] = [];
	let currentChunk: string[] = [];
	let currentLineCount = 0;

	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index];
		const blockLineCount = countMeaningfulLines(block);
		const remainingSegments = blocks.length - index;
		const remainingChunkSlots = chunkCount - chunks.length;
		const shouldSealChunk = currentLineCount > 0
			&& chunks.length < chunkCount - 1
			&& (
				currentLineCount + blockLineCount > targetLineBudget
				|| remainingSegments === remainingChunkSlots
			);

		if (shouldSealChunk) {
			chunks.push(trimOuterBlankLines(currentChunk));
			currentChunk = [];
			currentLineCount = 0;
		}

		currentChunk.push(...block);
		currentLineCount += blockLineCount;
	}

	if (currentChunk.some(hasSubstantiveMermaidLine)) {
		chunks.push(trimOuterBlankLines(currentChunk));
	}

	return chunks.filter(chunk => chunk.some(hasSubstantiveMermaidLine));
}

function collectSimpleSlideBlocks(lines: string[]): string[][] {
	const blocks: string[][] = [];
	let index = 0;

	while (index < lines.length) {
		while (index < lines.length && lines[index].trim().length === 0) {
			index += 1;
		}
		if (index >= lines.length) {
			break;
		}

		const line = lines[index];
		const block: string[] = [line];
		index += 1;

		if (isTopLevelListItem(line)) {
			while (index < lines.length) {
				const nextLine = lines[index];
				if (nextLine.trim().length > 0 && isTopLevelListItem(nextLine)) {
					break;
				}
				block.push(nextLine);
				index += 1;
			}
			blocks.push(trimOuterBlankLines(block));
			continue;
		}

		while (index < lines.length) {
			const nextLine = lines[index];
			if (nextLine.trim().length === 0) {
				block.push(nextLine);
				index += 1;
				break;
			}
			if (isTopLevelListItem(nextLine)) {
				break;
			}
			block.push(nextLine);
			index += 1;
		}
		blocks.push(trimOuterBlankLines(block));
	}

	return blocks.filter(block => block.some(line => line.trim().length > 0));
}

function isTopLevelListItem(line: string): boolean {
	return /^\s{0,3}(?:[-*+]|\d+\.)\s+\S/.test(line);
}

function appendSlideBlock(lines: string[], block: string[]): void {
	if (block.length === 0) {
		return;
	}
	if (lines.length > 0 && lines[lines.length - 1].trim().length > 0) {
		lines.push('');
	}
	lines.push(...trimOuterBlankLines(block));
}

function countMeaningfulLines(lines: string[]): number {
	return lines.reduce((total, line) => total + (line.trim().length > 0 ? 1 : 0), 0);
}

function trimOuterBlankLines(lines: string[]): string[] {
	let start = 0;
	let end = lines.length;
	while (start < end && lines[start].trim().length === 0) {
		start += 1;
	}
	while (end > start && lines[end - 1].trim().length === 0) {
		end -= 1;
	}
	return lines.slice(start, end);
}

function findFirstHeadingLine(lines: string[]): string | null {
	for (const line of lines) {
		if (/^#{1,6}\s+\S/.test(line.trim())) {
			return line.trim();
		}
	}
	return null;
}

function dropLeadingHeadingLine(lines: string[], headingLine: string | null): string[] {
	if (!headingLine) {
		return lines;
	}

	const trimmedHeading = headingLine.trim();
	let index = 0;
	while (index < lines.length && lines[index].trim().length === 0) {
		index += 1;
	}
	if (index < lines.length && lines[index].trim() === trimmedHeading) {
		return trimOuterBlankLines(lines.slice(index + 1));
	}
	return lines;
}

function assemblePatchedSlide(frontmatterLines: string[], bodyLines: string[]): string {
	const normalizedBody = trimOuterBlankLines(bodyLines);
	if (frontmatterLines.length === 0) {
		return normalizedBody.join('\n').trim();
	}

	return [
		...frontmatterLines,
		'',
		...normalizedBody,
	].join('\n').trim();
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function joinSlideDeck(slides: string[]): string {
	if (slides.length === 0) {
		return '';
	}

	let deckMarkdown = slides[0].trim();
	for (const slide of slides.slice(1)) {
		deckMarkdown += slideStartsWithFrontmatter(slide)
			? `\n\n---\n${slide.trim()}`
			: `\n\n---\n\n${slide.trim()}`;
	}

	return `${deckMarkdown}\n`;
}

function ensureSlideFrontmatterValue(slideMarkdown: string, key: string, value: string): string {
	const normalizedSlide = normalizeSlideFrontmatter(slideMarkdown);
	const lines = normalizedSlide.split(/\r?\n/);
	const frontmatterEnd = findSlideFrontmatterEnd(lines);
	const keyPattern = new RegExp(`^${key}\\s*:`, 'i');

	if (frontmatterEnd > 0) {
		let replaced = false;
		const nextLines = lines.map((line, index) => {
			if (index < frontmatterEnd && keyPattern.test(line.trim())) {
				replaced = true;
				return `${key}: ${value}`;
			}
			return line;
		});

		if (replaced) {
			return nextLines.join('\n');
		}

		nextLines.splice(frontmatterEnd, 0, `${key}: ${value}`);
		return nextLines.join('\n');
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
		if (line.startsWith('#') || line.startsWith('```') || line.startsWith(':::')) {
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

function slideStartsWithFrontmatter(slideMarkdown: string): boolean {
	const lines = slideMarkdown.split(/\r?\n/);
	return startsWithFrontmatterValue(lines) && findSlideFrontmatterEnd(lines) > 0;
}

function isFrontmatterClosingBoundary(lines: string[]): boolean {
	const firstContentLine = lines.findIndex(line => line.trim().length > 0);
	if (firstContentLine < 0 || !/^[A-Za-z][\w-]*\s*:/.test(lines[firstContentLine].trim())) {
		return false;
	}

	for (let index = firstContentLine; index < lines.length; index++) {
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
