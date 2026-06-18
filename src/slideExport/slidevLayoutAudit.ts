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

export function patchDeckWithLayoutAudit(
	deckMarkdown: string,
	audits: SlidevLayoutAudit[],
	config: Partial<SlidevLayoutAuditConfig> = {},
): SlidevDeckPatchResult {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
	const slides = splitSlideDeck(deckMarkdown);
	const changedSlides: number[] = [];
	const blockedSlides: Array<{ slide: number; reason: string }> = [];

	for (const audit of audits) {
		if (audit.slide <= 0 || audit.slide > slides.length) {
			continue;
		}

		const currentSlide = slides[audit.slide - 1];
		const bestScale = chooseBestRecommendedScale(audit.findings);
		if (bestScale === null || bestScale >= 0.995) {
			continue;
		}

		const currentZoom = readSlideZoom(currentSlide) ?? 1;
		const nextZoom = clampZoom(currentZoom * bestScale * 0.98);
		if (nextZoom >= currentZoom - 0.01) {
			continue;
		}

		if (nextZoom < resolvedConfig.minReadableScale) {
			blockedSlides.push({
				slide: audit.slide,
				reason: `required zoom ${nextZoom.toFixed(3)} is below readable floor ${resolvedConfig.minReadableScale.toFixed(2)}`,
			});
			continue;
		}

		slides[audit.slide - 1] = ensureSlideFrontmatterValue(currentSlide, 'zoom', nextZoom.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));
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
