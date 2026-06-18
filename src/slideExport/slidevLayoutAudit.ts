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
	slotZone?: string;
	slotOwner?: boolean;
	textLength: number;
	textPreview?: string;
	scrollWidth: number;
	scrollHeight: number;
	clientWidth: number;
	clientHeight: number;
	rect: SlidevRect;
}

export interface SlidevMeasuredSlotZone {
	name: string;
	textLength: number;
	textPreview?: string;
	ownerRect: SlidevRect;
	contentBounds: SlidevRect | null;
	scrollWidth: number;
	scrollHeight: number;
	clientWidth: number;
	clientHeight: number;
}

export interface RenderedSlideMeasurement {
	slide: number;
	slideRoot: SlidevRect | null;
	safeRect: SlidevRect | null;
	contentBounds: SlidevRect | null;
	pageScale: number | null;
	elements: SlidevMeasuredElement[];
	slotZones?: SlidevMeasuredSlotZone[];
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
	slotZone?: string;
	slotOwner?: boolean;
	scrollOverflow?: boolean;
	textPreview?: string;
	overflowAxis?: 'width' | 'height' | 'both';
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
	slotZones?: SlidevSlotZoneAudit[];
}

export interface SlidevSlotZoneAudit {
	name: string;
	textPreview?: string;
	ownerRect: SlidevRect;
	contentBounds: SlidevRect | null;
	scrollOverflow: boolean;
	overflow?: {
		left: number;
		top: number;
		right: number;
		bottom: number;
	};
	recommendedTransformScale: number | null;
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

interface FencedBlock {
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

interface MarkdownTableBlock {
	startLine: number;
	endLine: number;
	headerLine: string;
	separatorLine: string;
	dataLines: string[];
}

interface SlotSection {
	name: string;
	marker: string;
	lines: string[];
}

interface SupportedSlotZone {
	kind: 'lead' | 'section';
	name: string;
	lines: string[];
	contentLines: string[];
	ownershipWrapped: boolean;
}

interface SupportedSlotLayoutSurface {
	frontmatterLines: string[];
	layout: string | null;
	leadRole: 'default' | 'header';
	leadLines: string[];
	sections: SlotSection[];
}

interface DeckHeadmatterSlideSurface {
	headmatterLines: string[];
	bodyLines: string[];
}

const DEFAULT_CONFIG: SlidevLayoutAuditConfig = {
	overflowTolerancePx: 6,
	minReadableScale: 0.28,
	maxAutoPatchPasses: 2,
};

export const NOTEMD_SLOT_ZONE_ATTR = 'data-notemd-slot-zone';

export function analyzeRenderedSlideMeasurement(
	measurement: RenderedSlideMeasurement,
	config: Partial<SlidevLayoutAuditConfig> = {},
): SlidevLayoutAudit {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
	const findings: SlidevLayoutFinding[] = [];
	const elementKinds = Array.from(new Set(measurement.elements.map(element => element.kind)));
	const slotZones = measurement.safeRect
		? analyzeRenderedSlotZones(measurement.slotZones ?? [], measurement.safeRect, resolvedConfig.overflowTolerancePx)
		: [];

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
			slotZones: [],
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
				recommendedScale: computeFitScale(measurement.contentBounds, measurement.safeRect),
				overflowAxis: resolveOverflowAxis(contentOverflow, false, false),
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
				recommendedScale: computeElementFitScale(element, measurement.safeRect, scrollOverflow),
				slotZone: element.slotZone,
				slotOwner: element.slotOwner,
				scrollOverflow,
				textPreview: element.textPreview,
				overflowAxis: resolveOverflowAxis(
					elementOverflow,
					element.scrollWidth - element.clientWidth > resolvedConfig.overflowTolerancePx,
				element.scrollHeight - element.clientHeight > resolvedConfig.overflowTolerancePx,
			),
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
		slotZones,
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
		const nextZoom = deriveMeasuredPatchZoom(currentZoom, bestScale);

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

		if (isDeckHeadmatterSlide(currentSlide, targetIndex) && hasStructuralSplitCandidate(audit.findings)) {
			const splitResult = splitOverflowingDeckHeadmatterSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
		}

		const transformedSlotSlide = wrapOverflowingSupportedSlotLayoutZoneInTransform(
			currentSlide,
			audit,
			bestScale,
			currentZoom,
			resolvedConfig.minReadableScale,
		);
		if (transformedSlotSlide) {
			slides[targetIndex] = transformedSlotSlide;
			changedSlides.push(audit.slide);
			continue;
		}

		if (hasSupportedSlotMarkers(currentSlide)) {
			const splitResult = splitOverflowingSupportedSlotLayoutSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
		}

		if (shouldSplitTableBeforeZoom(audit.findings, nextZoom, resolvedConfig.minReadableScale)) {
			const splitResult = splitOverflowingMarkdownTableSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
		}

		if (shouldSplitCodeBeforeZoom(audit.findings, nextZoom, resolvedConfig.minReadableScale)) {
			const splitResult = splitOverflowingCodeSlide(currentSlide, audit, currentZoom, nextZoom, resolvedConfig);
			if (splitResult.slides) {
				slides.splice(targetIndex, 1, ...splitResult.slides);
				changedSlides.push(audit.slide);
				slideOffset += splitResult.slides.length - 1;
				continue;
			}
		}

		const transformedSurfaceSlide = wrapOverflowingSlideSurfaceInTransform(currentSlide, bestScale, currentZoom, resolvedConfig.minReadableScale);
		if (transformedSurfaceSlide) {
			slides[targetIndex] = transformedSurfaceSlide;
			changedSlides.push(audit.slide);
			continue;
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

function computeElementFitScale(
	element: SlidevMeasuredElement,
	safeRect: SlidevRect,
	scrollOverflow: boolean,
): number | null {
	const layoutScale = computeFitScale(element.rect, safeRect);
	if (!scrollOverflow) {
		return layoutScale;
	}

	const scrollScale = computeScrollableContentScale(element);
	if (layoutScale === null) {
		return scrollScale;
	}
	if (scrollScale === null) {
		return layoutScale;
	}
	return Math.min(layoutScale, scrollScale);
}

function analyzeRenderedSlotZones(
	zones: SlidevMeasuredSlotZone[],
	safeRect: SlidevRect,
	overflowTolerancePx: number,
): SlidevSlotZoneAudit[] {
	return zones.map(zone => {
		const contentRect = zone.contentBounds ?? zone.ownerRect;
		const overflow = measureOverflow(contentRect, safeRect, overflowTolerancePx);
		const scrollOverflow = zone.scrollWidth - zone.clientWidth > overflowTolerancePx
			|| zone.scrollHeight - zone.clientHeight > overflowTolerancePx;
		return {
			name: zone.name,
			textPreview: zone.textPreview,
			ownerRect: zone.ownerRect,
			contentBounds: zone.contentBounds,
			scrollOverflow,
			overflow: hasOverflow(overflow) ? overflow : undefined,
			recommendedTransformScale: computeSlotZoneFitScale(zone, overflowTolerancePx),
		};
	});
}

function computeSlotZoneFitScale(
	zone: SlidevMeasuredSlotZone,
	overflowTolerancePx: number,
): number | null {
	const contentRect = zone.contentBounds ?? zone.ownerRect;
	const layoutScale = computeFitScale(contentRect, zone.ownerRect);
	const widthScale = zone.scrollWidth - zone.clientWidth > overflowTolerancePx
		? zone.clientWidth / zone.scrollWidth
		: 1;
	const heightScale = zone.scrollHeight - zone.clientHeight > overflowTolerancePx
		? zone.clientHeight / zone.scrollHeight
		: 1;
	const scales = [layoutScale, widthScale, heightScale]
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1);
	return scales.length > 0 ? Math.min(...scales) : null;
}

function computeScrollableContentScale(element: SlidevMeasuredElement): number | null {
	if (element.clientWidth <= 0 || element.clientHeight <= 0) {
		return null;
	}

	const widthScale = element.scrollWidth > element.clientWidth
		? element.clientWidth / element.scrollWidth
		: 1;
	const heightScale = element.scrollHeight > element.clientHeight
		? element.clientHeight / element.scrollHeight
		: 1;
	const scale = Math.min(widthScale, heightScale);
	return scale > 0 && Number.isFinite(scale) ? Math.min(1, scale) : null;
}

function resolveOverflowAxis(
	overflow: { left: number; top: number; right: number; bottom: number },
	scrollWidthOverflow: boolean,
	scrollHeightOverflow: boolean,
): 'width' | 'height' | 'both' | undefined {
	const widthOverflow = overflow.left > 0 || overflow.right > 0 || scrollWidthOverflow;
	const heightOverflow = overflow.top > 0 || overflow.bottom > 0 || scrollHeightOverflow;
	if (widthOverflow && heightOverflow) {
		return 'both';
	}
	if (widthOverflow) {
		return 'width';
	}
	if (heightOverflow) {
		return 'height';
	}
	return undefined;
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

function deriveMeasuredPatchZoom(currentZoom: number, recommendedScale: number | null): number | null {
	if (recommendedScale === null || !Number.isFinite(recommendedScale) || recommendedScale <= 0 || recommendedScale >= 1) {
		return null;
	}

	return clampZoom(currentZoom * recommendedScale);
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

function shouldSplitTableBeforeZoom(
	findings: SlidevLayoutFinding[],
	nextZoom: number | null,
	minReadableScale: number,
): boolean {
	return findings.some(finding => finding.recommendedPatch === 'split-table')
		&& (
			findings.some(finding => finding.kind === 'unreadable-scale')
			|| (nextZoom !== null && nextZoom < minReadableScale)
			|| hasTableStructuralOverflow(findings)
		);
}

function shouldSplitCodeBeforeZoom(
	findings: SlidevLayoutFinding[],
	nextZoom: number | null,
	minReadableScale: number,
): boolean {
	return findings.some(finding => finding.recommendedPatch === 'reduce-code')
		&& (
			findings.some(finding => finding.kind === 'unreadable-scale')
			|| (nextZoom !== null && nextZoom < minReadableScale)
			|| hasCodeStructuralOverflow(findings)
		);
}

function hasSupportedSlotMarkers(slideMarkdown: string): boolean {
	return /^::[\w-]+::$/m.test(slideMarkdown);
}

function hasStructuralSplitCandidate(findings: SlidevLayoutFinding[]): boolean {
	return findings.some(finding => [
		'split-diagram',
		'split-table',
		'reduce-code',
		'split-slide',
	].includes(finding.recommendedPatch));
}

function hasTableStructuralOverflow(findings: SlidevLayoutFinding[]): boolean {
	return findings.some(finding => finding.recommendedPatch === 'split-table' && typeof finding.overflowAxis === 'string');
}

function hasCodeStructuralOverflow(findings: SlidevLayoutFinding[]): boolean {
	return findings.some(finding => finding.target === 'code'
		&& finding.scrollOverflow === true
		&& (finding.overflowAxis === 'height' || finding.overflowAxis === 'both'));
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

	const targetChunkCount = resolveStructuralChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
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

function splitOverflowingMarkdownTableSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = extractPatchableSlideSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'table slide uses deck headmatter or unsupported layout syntax' };
	}
	if (surface.bodyLines.some(line => /^(```+|~~~+)/.test(line.trim()) || /^!\[.*\]\(.+\)/.test(line.trim()))) {
		return { slides: null, reason: 'table split does not support mixed code or image slides' };
	}

	const tableBlock = findSingleMarkdownTableBlock(surface.bodyLines);
	if (!tableBlock) {
		return { slides: null, reason: 'table split requires exactly one Markdown table block' };
	}
	if (tableBlock.dataLines.length < 2) {
		return { slides: null, reason: 'table does not have enough data rows to split safely' };
	}

	const targetChunkCount = resolveStructuralChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
	const recordSlideBodies = shouldConvertTableToRecordSlides(audit.findings, tableBlock)
		? splitMarkdownTableToRecordSlides(tableBlock, targetChunkCount)
		: null;
	const splitOrientation = chooseTableSplitOrientation(audit.findings, tableBlock);

	const prefixLines = trimOuterBlankLines(surface.bodyLines.slice(0, tableBlock.startLine));
	const suffixLines = trimOuterBlankLines(surface.bodyLines.slice(tableBlock.endLine + 1));
	const continuationHeading = findFirstHeadingLine(prefixLines.length > 0 ? prefixLines : surface.bodyLines);
	const cleanFrontmatter = stripFrontmatterKey(surface.frontmatterLines, 'zoom');
	const splitSlides: string[] = [];

	const chunkedTableBodies = recordSlideBodies
		?? (splitOrientation === 'columns'
			? splitMarkdownTableByColumns(tableBlock, targetChunkCount)
			: splitMarkdownTableByRows(tableBlock, targetChunkCount));
	if (!chunkedTableBodies || chunkedTableBodies.length < 2) {
		if (recordSlideBodies) {
			return { slides: null, reason: 'table record fallback could not be distributed into multiple slides' };
		}
		return { slides: null, reason: splitOrientation === 'columns'
			? 'table columns could not be distributed into multiple slides'
			: 'table rows could not be distributed into multiple slides' };
	}

	for (let index = 0; index < chunkedTableBodies.length; index++) {
		const bodyLines: string[] = [];
		if (index === 0) {
			bodyLines.push(...prefixLines);
		} else if (continuationHeading) {
			bodyLines.push(continuationHeading, '');
		}

		bodyLines.push(...chunkedTableBodies[index]);

		if (index === chunkedTableBodies.length - 1 && suffixLines.length > 0) {
			const trailingLines = dropLeadingHeadingLine(suffixLines, continuationHeading);
			if (trailingLines.length > 0) {
				bodyLines.push('', ...trailingLines);
			}
		}

		splitSlides.push(assemblePatchedSlide(cleanFrontmatter, bodyLines));
	}

	return { slides: splitSlides };
}

function splitOverflowingCodeSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = extractPatchableSlideSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'code slide uses deck headmatter or unsupported layout syntax' };
	}
	if (surface.bodyLines.some(line => /^\|.*\|$/.test(line.trim()) || /^!\[.*\]\(.+\)/.test(line.trim()))) {
		return { slides: null, reason: 'code split does not support mixed table or image slides' };
	}

	const codeBlock = findSingleCodeFenceBlock(surface.bodyLines);
	if (!codeBlock) {
		return { slides: null, reason: 'code split requires exactly one non-Mermaid code fence' };
	}
	if (codeBlock.bodyLines.length < 2) {
		return { slides: null, reason: 'code block does not have enough lines to split safely' };
	}

	const targetChunkCount = resolveStructuralChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
	const codeChunks = splitCodeFenceIntoChunks(codeBlock.bodyLines, targetChunkCount);
	if (!codeChunks || codeChunks.length < 2) {
		return { slides: null, reason: 'code block could not be distributed into multiple slides' };
	}

	const prefixLines = trimOuterBlankLines(surface.bodyLines.slice(0, codeBlock.startLine));
	const suffixLines = trimOuterBlankLines(surface.bodyLines.slice(codeBlock.endLine + 1));
	const continuationHeading = findFirstHeadingLine(prefixLines.length > 0 ? prefixLines : surface.bodyLines);
	const cleanFrontmatter = stripFrontmatterKey(surface.frontmatterLines, 'zoom');
	const splitSlides: string[] = [];

	for (let index = 0; index < codeChunks.length; index++) {
		const bodyLines: string[] = [];
		if (index === 0) {
			bodyLines.push(...prefixLines);
		} else if (continuationHeading) {
			bodyLines.push(continuationHeading, '');
		}

		bodyLines.push(codeBlock.opener, ...codeChunks[index], codeBlock.closer);

		if (index === codeChunks.length - 1 && suffixLines.length > 0) {
			const trailingLines = dropLeadingHeadingLine(suffixLines, continuationHeading);
			if (trailingLines.length > 0) {
				bodyLines.push('', ...trailingLines);
			}
		}

		splitSlides.push(assemblePatchedSlide(cleanFrontmatter, bodyLines));
	}

	return { slides: splitSlides };
}

function splitOverflowingSupportedSlotLayoutSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = parseSupportedSlotLayoutSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'slot layout is not in the supported structural patch set' };
	}

	const targetZone = pickSlotLayoutTargetZone(surface, audit);
	if (!targetZone) {
		return { slides: null, reason: 'no supported slot zone matches the current structural patch target' };
	}

	const zoneMarkdown = targetZone.contentLines.join('\n').trim();
	if (!zoneMarkdown) {
		return { slides: null, reason: 'target slot does not contain patchable content' };
	}

	const splitResult = applyZoneStructuralSplit(zoneMarkdown, audit, currentZoom, nextZoom, config);
	if (!splitResult.slides || splitResult.slides.length < 2) {
		return { slides: null, reason: splitResult.reason ?? 'slot zone did not yield multiple structural chunks' };
	}

	const splitSlides = splitResult.slides.map(splitSlide => {
		const chunkSurface = extractPatchableSlideSurface(splitSlide);
		const chunkLines = chunkSurface ? chunkSurface.bodyLines : splitSlide.split(/\r?\n/);
		return assembleSupportedSlotLayoutSlide(surface, targetZone, trimOuterBlankLines(chunkLines));
	});

	return { slides: splitSlides };
}

function wrapOverflowingSupportedSlotLayoutZoneInTransform(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	fallbackScale: number | null,
	currentZoom: number,
	minReadableScale: number,
): string | null {
	const surface = parseSupportedSlotLayoutSurface(slideMarkdown);
	if (!surface) {
		return null;
	}

	const targetZone = pickSlotLayoutTransformZone(surface, audit);
	if (!targetZone) {
		return null;
	}

	const transformScale = resolveSupportedSlotZoneTransformScale(
		targetZone,
		audit,
		fallbackScale,
		currentZoom,
		minReadableScale,
	);
	if (transformScale === null) {
		return null;
	}

	const wrappedLines = wrapLinesInTransform(targetZone.contentLines, transformScale);
	return assembleSupportedSlotLayoutSlide(surface, targetZone, wrappedLines);
}

function splitOverflowingDeckHeadmatterSlide(
	slideMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	const surface = parseDeckHeadmatterSlideSurface(slideMarkdown);
	if (!surface) {
		return { slides: null, reason: 'deck headmatter slide surface unavailable' };
	}

	const zoneMarkdown = surface.bodyLines.join('\n').trim();
	if (!zoneMarkdown) {
		return { slides: null, reason: 'deck headmatter slide does not contain patchable body content' };
	}

	const splitResult = applyZoneStructuralSplit(zoneMarkdown, audit, currentZoom, nextZoom, config);
	if (!splitResult.slides || splitResult.slides.length < 2) {
		return { slides: null, reason: splitResult.reason ?? 'deck headmatter slide did not yield multiple structural chunks' };
	}

	const reconstructedSlides = splitResult.slides.map((splitSlide, index) => {
		const chunkSurface = extractPatchableSlideSurface(splitSlide);
		const chunkLines = chunkSurface ? chunkSurface.bodyLines : splitSlide.split(/\r?\n/);
		if (index === 0) {
			return [
				...surface.headmatterLines,
				'',
				...trimOuterBlankLines(chunkLines),
			].join('\n').trim();
		}
		return trimOuterBlankLines(chunkLines).join('\n').trim();
	});

	return { slides: reconstructedSlides };
}

function applyZoneStructuralSplit(
	zoneMarkdown: string,
	audit: SlidevLayoutAudit,
	currentZoom: number,
	nextZoom: number | null,
	config: SlidevLayoutAuditConfig,
): { slides: string[] | null; reason?: string } {
	if (shouldSplitDiagramBeforeZoom(audit.findings, nextZoom, config.minReadableScale)) {
		const result = splitOverflowingMermaidSlide(zoneMarkdown, audit, currentZoom, nextZoom, config);
		if (result.slides) {
			return result;
		}
	}

	if (shouldSplitSimpleSlideBeforeZoom(audit.findings)) {
		const result = splitOverflowingSimpleSlide(zoneMarkdown, audit, currentZoom, nextZoom, config);
		if (result.slides) {
			return result;
		}
	}

	if (shouldSplitTableBeforeZoom(audit.findings, nextZoom, config.minReadableScale)) {
		const result = splitOverflowingMarkdownTableSlide(zoneMarkdown, audit, currentZoom, nextZoom, config);
		if (result.slides) {
			return result;
		}
	}

	if (shouldSplitCodeBeforeZoom(audit.findings, nextZoom, config.minReadableScale)) {
		const result = splitOverflowingCodeSlide(zoneMarkdown, audit, currentZoom, nextZoom, config);
		if (result.slides) {
			return result;
		}
	}

	return { slides: null, reason: 'slot zone does not match a supported structural splitter' };
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

	const targetChunkCount = resolveStructuralChunkCount(audit, currentZoom, nextZoom, config.minReadableScale);
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

function wrapOverflowingSlideSurfaceInTransform(
	slideMarkdown: string,
	recommendedScale: number | null,
	currentZoom: number,
	minReadableScale: number,
): string | null {
	const transformScale = deriveMeasuredTransformScale(recommendedScale, currentZoom, minReadableScale);
	if (transformScale === null) {
		return null;
	}

	const surface = extractPatchableSlideSurface(slideMarkdown);
	if (!surface || !containsTransformableComponentSyntax(surface.bodyLines)) {
		return null;
	}

	return assemblePatchedSlide(surface.frontmatterLines, wrapLinesInTransform(surface.bodyLines, transformScale));
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
	if (!isSupportedSingleSlotLayout(layout)) {
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

function parseSupportedSlotLayoutSurface(slideMarkdown: string): SupportedSlotLayoutSurface | null {
	const normalizedSlide = normalizeSlideFrontmatter(slideMarkdown);
	if (normalizedSlide.trimStart().startsWith('---')) {
		return null;
	}

	const lines = normalizedSlide.split(/\r?\n/);
	const frontmatterEnd = findSlideFrontmatterEnd(lines);
	const frontmatterLines = frontmatterEnd > 0 ? lines.slice(0, frontmatterEnd + 1) : [];
	const bodyLines = frontmatterEnd > 0 ? lines.slice(frontmatterEnd + 1) : lines;
	const layout = readFrontmatterScalar(frontmatterLines, 'layout');
	if (!bodyLines.some(line => /^::[\w-]+::$/.test(line.trim()))) {
		return null;
	}

	const slotLines = parseSlotSections(bodyLines);
	if (!slotLines) {
		return null;
	}

	const hasExplicitDefaultSection = slotLines.sections.some(section => section.name === 'default');
	if (slotLines.leadLines.length > 0 && hasExplicitDefaultSection) {
		return null;
	}

	const leadRole = layout === 'two-cols-header' && slotLines.leadLines.length > 0
		? 'header'
		: 'default';

	return {
		frontmatterLines,
		layout,
		leadRole,
		leadLines: slotLines.leadLines,
		sections: slotLines.sections,
	};
}

function parseDeckHeadmatterSlideSurface(slideMarkdown: string): DeckHeadmatterSlideSurface | null {
	const lines = slideMarkdown.split(/\r?\n/);
	if (lines[0]?.trim() !== '---') {
		return null;
	}

	for (let index = 1; index < lines.length; index++) {
		if (lines[index].trim() === '---') {
			return {
				headmatterLines: lines.slice(0, index + 1),
				bodyLines: trimOuterBlankLines(lines.slice(index + 1)),
			};
		}
	}

	return null;
}

function parseSlotSections(bodyLines: string[]): { leadLines: string[]; sections: SlotSection[] } | null {
	const sections: SlotSection[] = [];
	const leadLines: string[] = [];
	let currentSection: SlotSection | null = null;

	for (const line of bodyLines) {
		const markerMatch = line.trim().match(/^::([\w-]+)::$/);
		if (markerMatch) {
			if (currentSection) {
				currentSection.lines = trimOuterBlankLines(currentSection.lines);
				sections.push(currentSection);
			}
			currentSection = {
				name: markerMatch[1],
				marker: line.trim(),
				lines: [],
			};
			continue;
		}

		if (currentSection) {
			currentSection.lines.push(line);
		} else {
			leadLines.push(line);
		}
	}

	if (!currentSection) {
		return null;
	}

	currentSection.lines = trimOuterBlankLines(currentSection.lines);
	sections.push(currentSection);
	return {
		leadLines: trimOuterBlankLines(leadLines),
		sections,
	};
}

function pickSlotLayoutTargetZone(
	surface: SupportedSlotLayoutSurface,
	audit: SlidevLayoutAudit,
): SupportedSlotZone | null {
	const zones = collectSupportedSlotZones(surface);
	const zoneByGeometry = pickZoneBySlotZoneGeometry(zones, audit.slotZones ?? []);
	if (zoneByGeometry) {
		return zoneByGeometry;
	}

	const zoneBySlotName = pickZoneByFindingSlotSignals(zones, audit.findings);
	if (zoneBySlotName) {
		return zoneBySlotName;
	}

	const matchers: Array<(lines: string[]) => boolean> = [];
	if (audit.findings.some(finding => finding.recommendedPatch === 'split-diagram')) {
		matchers.push(lines => findSingleMermaidFenceBlock(lines) !== null);
	}
	if (audit.findings.some(finding => finding.recommendedPatch === 'split-table')) {
		matchers.push(lines => findSingleMarkdownTableBlock(lines) !== null);
	}
	if (audit.findings.some(finding => finding.recommendedPatch === 'reduce-code')) {
		matchers.push(lines => findSingleCodeFenceBlock(lines) !== null);
	}
	const hasComponentZone = zones.some(zone => containsTransformableComponentSyntax(zone.lines) || containsTransformWrapper(zone.lines));
	if (!hasComponentZone && audit.findings.some(finding => finding.recommendedPatch === 'split-slide')) {
		matchers.push(lines => collectSimpleSlideBlocks(trimOuterBlankLines(lines)).length >= 2);
	}

	for (const matcher of matchers) {
		const matchedZones = zones.filter(zone => matcher(zone.contentLines));
		if (matchedZones.length === 1) {
			return matchedZones[0];
		}
		if (matchedZones.length > 1) {
			const hintedZone = pickZoneByFindingTextHints(matchedZones, audit.findings);
			if (hintedZone) {
				return hintedZone;
			}
			return matchedZones[0];
		}
	}

	return null;
}

function pickSlotLayoutTransformZone(
	surface: SupportedSlotLayoutSurface,
	audit: SlidevLayoutAudit,
): SupportedSlotZone | null {
	const zones = collectSupportedSlotZones(surface);
	const zoneByGeometry = pickZoneBySlotZoneGeometry(zones, audit.slotZones ?? []);
	if (zoneByGeometry && containsTransformableComponentSyntax(zoneByGeometry.contentLines) && !containsTransformWrapper(zoneByGeometry.contentLines)) {
		return zoneByGeometry;
	}

	const zoneBySlotName = pickZoneByFindingSlotSignals(zones, audit.findings);
	if (zoneBySlotName && containsTransformableComponentSyntax(zoneBySlotName.contentLines) && !zoneBySlotName.ownershipWrapped) {
		return zoneBySlotName;
	}
	const componentZones = zones.filter(zone =>
		containsTransformableComponentSyntax(zone.contentLines) || containsTransformWrapper(zone.contentLines)
	);

	const transformableZones = zones.filter(zone =>
		containsTransformableComponentSyntax(zone.contentLines)
		&& !containsTransformWrapper(zone.contentLines)
	);
	if (componentZones.length > 1) {
		return transformableZones.length > 0 ? pickZoneByFindingTextHints(transformableZones, audit.findings) : null;
	}
	if (transformableZones.length !== 1) {
		return transformableZones.length > 1 ? pickZoneByFindingTextHints(transformableZones, audit.findings) : null;
	}

	return transformableZones[0];
}

function collectSupportedSlotZones(
	surface: SupportedSlotLayoutSurface,
): SupportedSlotZone[] {
	return [
		{
			kind: 'lead' as const,
			name: surface.leadRole,
			lines: surface.leadLines,
			contentLines: unwrapSlotZoneOwnerWrapper(surface.leadLines)?.contentLines ?? surface.leadLines,
			ownershipWrapped: unwrapSlotZoneOwnerWrapper(surface.leadLines) !== null,
		},
		...surface.sections.map(section => ({
			kind: 'section' as const,
			name: section.name,
			lines: section.lines,
			contentLines: unwrapSlotZoneOwnerWrapper(section.lines)?.contentLines ?? section.lines,
			ownershipWrapped: unwrapSlotZoneOwnerWrapper(section.lines) !== null,
		})),
	].filter(zone => zone.lines.some(line => line.trim().length > 0));
}

function pickZoneByFindingSlotSignals(
	zones: SupportedSlotZone[],
	findings: SlidevLayoutFinding[],
): SupportedSlotZone | null {
	const slotScores = new Map<string, {
		findingCount: number;
		totalScore: number;
		slotOwnerCount: number;
		slotOwnerScore: number;
	}>();
	for (const finding of findings) {
		if (!finding.slotZone) {
			continue;
		}
		const entry = slotScores.get(finding.slotZone) ?? {
			findingCount: 0,
			totalScore: 0,
			slotOwnerCount: 0,
			slotOwnerScore: 0,
		};
		const severityScore = computeSlotFindingSeverityScore(finding);
		entry.findingCount += 1;
		entry.totalScore += severityScore;
		if (finding.slotOwner) {
			entry.slotOwnerCount += 1;
			entry.slotOwnerScore += severityScore;
		}
		slotScores.set(finding.slotZone, entry);
	}
	if (slotScores.size === 0) {
		return null;
	}

	const rankedSlots = Array.from(slotScores.entries()).sort((left, right) => {
		const [, leftScore] = left;
		const [, rightScore] = right;
		return (
			rightScore.slotOwnerScore - leftScore.slotOwnerScore
			|| rightScore.slotOwnerCount - leftScore.slotOwnerCount
			|| rightScore.totalScore - leftScore.totalScore
			|| rightScore.findingCount - leftScore.findingCount
		);
	});
	if (rankedSlots.length > 1) {
		const [, first] = rankedSlots[0];
		const [, second] = rankedSlots[1];
		const sameRank = first.slotOwnerScore === second.slotOwnerScore
			&& first.slotOwnerCount === second.slotOwnerCount
			&& first.totalScore === second.totalScore
			&& first.findingCount === second.findingCount;
		if (sameRank) {
			return null;
		}
	}

	return zones.find(zone => zone.name === rankedSlots[0][0]) ?? null;
}

function pickZoneBySlotZoneGeometry(
	zones: SupportedSlotZone[],
	slotZones: SlidevSlotZoneAudit[],
): SupportedSlotZone | null {
	const candidates = slotZones
		.filter(slotZone => zones.some(zone => zone.name === slotZone.name))
		.map(slotZone => ({
			slotZone,
			severityScore: computeSlotZoneSeverityScore(slotZone),
		}))
		.filter(candidate =>
			candidate.slotZone.scrollOverflow
			|| (candidate.slotZone.overflow ? hasOverflow(candidate.slotZone.overflow) : false)
			|| (typeof candidate.slotZone.recommendedTransformScale === 'number' && candidate.slotZone.recommendedTransformScale < 0.995)
		);
	if (candidates.length === 0) {
		return null;
	}

	const rankedZones = candidates.sort((left, right) => (
		right.severityScore - left.severityScore
		|| Number(left.slotZone.recommendedTransformScale ?? 1) - Number(right.slotZone.recommendedTransformScale ?? 1)
		|| Number(right.slotZone.scrollOverflow) - Number(left.slotZone.scrollOverflow)
	));
	if (rankedZones.length > 1) {
		const first = rankedZones[0];
		const second = rankedZones[1];
		const sameRank = Math.abs(first.severityScore - second.severityScore) < 0.001
			&& Math.abs(Number(first.slotZone.recommendedTransformScale ?? 1) - Number(second.slotZone.recommendedTransformScale ?? 1)) < 0.001
			&& first.slotZone.scrollOverflow === second.slotZone.scrollOverflow;
		if (sameRank) {
			return null;
		}
	}

	return zones.find(zone => zone.name === rankedZones[0].slotZone.name) ?? null;
}

function computeSlotFindingSeverityScore(finding: SlidevLayoutFinding): number {
	let score = 1;
	if (finding.overflow) {
		score += finding.overflow.left + finding.overflow.top + finding.overflow.right + finding.overflow.bottom;
	}
	if (finding.scrollOverflow) {
		score += 24;
	}
	if (typeof finding.recommendedScale === 'number' && Number.isFinite(finding.recommendedScale)) {
		score += Math.max(0, (1 - finding.recommendedScale) * 100);
	}
	if (finding.kind === 'unreadable-scale') {
		score += 32;
	}
	if (finding.slotOwner) {
		score += 8;
	}

	return score;
}

function computeSlotZoneSeverityScore(slotZone: SlidevSlotZoneAudit): number {
	let score = 1;
	if (slotZone.overflow) {
		score += slotZone.overflow.left + slotZone.overflow.top + slotZone.overflow.right + slotZone.overflow.bottom;
	}
	if (slotZone.scrollOverflow) {
		score += 24;
	}
	if (typeof slotZone.recommendedTransformScale === 'number' && Number.isFinite(slotZone.recommendedTransformScale)) {
		score += Math.max(0, (1 - slotZone.recommendedTransformScale) * 100);
	}

	return score;
}

function pickZoneByFindingTextHints<T extends { contentLines: string[] }>(
	zones: T[],
	findings: SlidevLayoutFinding[],
): T | null {
	const hints = Array.from(new Set(findings
		.map(finding => normalizeTextForMatching(finding.textPreview ?? ''))
		.filter(hint => hint.length >= 12)));
	if (hints.length === 0) {
		return null;
	}

	const scoredZones = zones
		.map(zone => ({
			zone,
			score: scoreZoneTextHints(zone.contentLines, hints),
		}))
		.filter(candidate => candidate.score > 0)
		.sort((left, right) => right.score - left.score);
	if (scoredZones.length === 0) {
		return null;
	}
	if (scoredZones.length > 1 && scoredZones[0].score === scoredZones[1].score) {
		return null;
	}

	return scoredZones[0].zone;
}

function scoreZoneTextHints(lines: string[], hints: string[]): number {
	const zoneText = normalizeTextForMatching(lines
		.join('\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, ' ')
		.replace(/^#{1,6}\s+/gm, ' ')
		.replace(/^::[\w-]+::$/gm, ' ')
	);
	if (!zoneText) {
		return 0;
	}

	return hints.reduce((score, hint) => score + (zoneText.includes(hint) ? hint.length : 0), 0);
}

function normalizeTextForMatching(value: string): string {
	return value
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
		.trim();
}

function assembleSupportedSlotLayoutSlide(
	surface: SupportedSlotLayoutSurface,
	targetZone: { kind: 'lead' | 'section'; name: string },
	replacementLines: string[],
): string {
	const bodyLines: string[] = [];
	const zones = collectSupportedSlotZones(surface);
	const matchedTargetZone = zones.find(zone => zone.kind === targetZone.kind && zone.name === targetZone.name) ?? null;
	const nextReplacementLines = matchedTargetZone?.ownershipWrapped
		? wrapLinesInSlotZoneOwner(replacementLines, targetZone.name)
		: replacementLines;
	const nextLeadLines = targetZone.kind === 'lead'
		? nextReplacementLines
		: surface.leadLines;

	if (nextLeadLines.length > 0) {
		bodyLines.push(...trimOuterBlankLines(nextLeadLines));
	}

	for (const section of surface.sections) {
		if (bodyLines.length > 0) {
			bodyLines.push('');
		}
			bodyLines.push(section.marker);
			bodyLines.push('');
			const sectionLines = targetZone.kind === 'section' && targetZone.name === section.name
				? nextReplacementLines
				: section.lines;
			bodyLines.push(...trimOuterBlankLines(sectionLines));
		}

	return assemblePatchedSlide(surface.frontmatterLines, bodyLines);
}

function isDeckHeadmatterSlide(slideMarkdown: string, slideIndex: number): boolean {
	return slideIndex === 0 && slideMarkdown.trimStart().startsWith('---');
}

function isSupportedSingleSlotLayout(layout: string | null): boolean {
	return layout === null || [
		'default',
		'center',
		'full',
		'none',
		'intro',
		'quote',
		'statement',
		'fact',
		'image-left',
		'image-right',
		'iframe-left',
		'iframe-right',
	].includes(layout);
}

function deriveMeasuredTransformScale(
	recommendedScale: number | null,
	currentZoom: number,
	minReadableScale: number,
): number | null {
	if (recommendedScale === null || !Number.isFinite(recommendedScale) || recommendedScale <= 0 || recommendedScale >= 0.995) {
		return null;
	}

	if (currentZoom * recommendedScale < minReadableScale) {
		return null;
	}

	return clampZoom(recommendedScale);
}

function resolveSupportedSlotZoneTransformScale(
	targetZone: SupportedSlotZone,
	audit: SlidevLayoutAudit,
	fallbackScale: number | null,
	currentZoom: number,
	minReadableScale: number,
): number | null {
	const zoneScale = audit.slotZones?.find(zone => zone.name === targetZone.name)?.recommendedTransformScale ?? null;
	return deriveMeasuredTransformScale(zoneScale, currentZoom, minReadableScale)
		?? deriveMeasuredTransformScale(fallbackScale, currentZoom, minReadableScale);
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

function findSingleMermaidFenceBlock(lines: string[]): FencedBlock | null {
	let block: FencedBlock | null = null;
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

function findSingleCodeFenceBlock(lines: string[]): FencedBlock | null {
	let block: FencedBlock | null = null;
	let activeFenceMarker: string | null = null;
	let opener = '';
	let startLine = -1;
	let bodyLines: string[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const trimmed = line.trim();
		const openingMatch = trimmed.match(/^(```+|~~~+)(.*)$/);
		if (!activeFenceMarker && openingMatch) {
			if (/^(```+|~~~+)\s*mermaid(?:\s+\{[^}]+\})?\s*$/i.test(trimmed)) {
				return null;
			}
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

function findSingleMarkdownTableBlock(lines: string[]): MarkdownTableBlock | null {
	let tableBlock: MarkdownTableBlock | null = null;

	for (let index = 0; index < lines.length - 1; index++) {
		if (!isMarkdownTableRow(lines[index]) || !isMarkdownTableSeparator(lines[index + 1])) {
			continue;
		}

		if (tableBlock) {
			return null;
		}

		let endLine = index + 1;
		const dataLines: string[] = [];
		for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
			if (!isMarkdownTableRow(lines[rowIndex])) {
				break;
			}
			dataLines.push(lines[rowIndex]);
			endLine = rowIndex;
		}

		tableBlock = {
			startLine: index,
			endLine,
			headerLine: lines[index],
			separatorLine: lines[index + 1],
			dataLines: trimOuterBlankLines(dataLines),
		};
		index = endLine;
	}

	return tableBlock;
}

function chooseTableSplitOrientation(
	findings: SlidevLayoutFinding[],
	tableBlock: MarkdownTableBlock,
): 'rows' | 'columns' {
	const columnCount = parseMarkdownTableCells(tableBlock.headerLine).length;
	const tableFinding = findings.find(finding => finding.target === 'table')
		?? findings.find(finding => finding.recommendedPatch === 'split-table' && typeof finding.overflowAxis === 'string');
	if (tableFinding?.overflowAxis === 'width' || tableFinding?.overflowAxis === 'both') {
		return columnCount > 2 ? 'columns' : 'rows';
	}
	return 'rows';
}

function shouldConvertTableToRecordSlides(
	findings: SlidevLayoutFinding[],
	tableBlock: MarkdownTableBlock,
): boolean {
	const tableFinding = findings.find(finding => finding.target === 'table')
		?? findings.find(finding => finding.recommendedPatch === 'split-table' && typeof finding.overflowAxis === 'string');
	if (!tableFinding || (tableFinding.overflowAxis !== 'width' && tableFinding.overflowAxis !== 'both')) {
		return false;
	}

	const headerCells = parseMarkdownTableCells(tableBlock.headerLine);
	const rowCells = tableBlock.dataLines.map(parseMarkdownTableCells);
	const longestTokenLength = Math.max(
		0,
		...rowCells.flatMap(cells => cells.map(cell => longestUnbrokenTokenLength(cell))),
	);
	return headerCells.length >= 5 && longestTokenLength >= 28;
}

function resolveStructuralChunkCount(
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

function splitCodeFenceIntoChunks(bodyLines: string[], targetChunkCount: number): string[][] | null {
	const codeSegments = collectCodeFenceSegments(bodyLines);
	if (codeSegments.length >= 2) {
		const chunkedSegments = chunkLineBlocks(codeSegments, Math.max(2, Math.min(targetChunkCount, codeSegments.length)));
		if (chunkedSegments.length >= 2) {
			return chunkedSegments;
		}
	}

	return splitCodeLinesByBudget(bodyLines, targetChunkCount);
}

function splitMarkdownTableByRows(tableBlock: MarkdownTableBlock, targetChunkCount: number): string[][] | null {
	const rowBlocks = tableBlock.dataLines.map(line => [line]);
	const chunkedRowBlocks = chunkLineBlocks(rowBlocks, Math.max(2, Math.min(targetChunkCount, rowBlocks.length)));
	if (chunkedRowBlocks.length < 2) {
		return null;
	}

	return chunkedRowBlocks.map(rows => [
		tableBlock.headerLine,
		tableBlock.separatorLine,
		...rows.map(line => line.trimEnd()),
	]);
}

function splitMarkdownTableByColumns(tableBlock: MarkdownTableBlock, targetChunkCount: number): string[][] | null {
	const headerCells = parseMarkdownTableCells(tableBlock.headerLine);
	const rowCells = tableBlock.dataLines.map(parseMarkdownTableCells);
	if (headerCells.length < 3 || rowCells.some(cells => cells.length !== headerCells.length)) {
		return null;
	}

	const trailingColumnIndexes = Array.from({ length: headerCells.length - 1 }, (_, index) => index + 1);
	const columnGroups = chunkIndexList(trailingColumnIndexes, Math.max(2, Math.min(targetChunkCount, trailingColumnIndexes.length)));
	if (columnGroups.length < 2) {
		return null;
	}

	return columnGroups.map(group => {
		const selectedIndexes = [0, ...group];
		return [
			formatMarkdownTableLine(selectTableCells(headerCells, selectedIndexes)),
			formatMarkdownTableSeparator(selectedIndexes.length),
			...rowCells.map(cells => formatMarkdownTableLine(selectTableCells(cells, selectedIndexes))),
		];
	});
}

function splitMarkdownTableToRecordSlides(tableBlock: MarkdownTableBlock, targetChunkCount: number): string[][] | null {
	const headerCells = parseMarkdownTableCells(tableBlock.headerLine);
	const rowCells = tableBlock.dataLines.map(parseMarkdownTableCells);
	if (headerCells.length < 2 || rowCells.some(cells => cells.length !== headerCells.length)) {
		return null;
	}

	const recordBlocks = rowCells.map(cells => formatMarkdownTableRecordBlock(headerCells, cells));
	const chunkedRecordBlocks = chunkLineBlocks(recordBlocks, Math.max(2, Math.min(targetChunkCount, recordBlocks.length)));
	if (chunkedRecordBlocks.length < 2) {
		return null;
	}

	return chunkedRecordBlocks.map(blocks => blocks.flatMap((line, index, lines) => {
		const emitted = [line];
		if (index < lines.length - 1 && line.trim().length > 0 && lines[index + 1]?.trim().startsWith('- ')) {
			emitted.push('');
		}
		return emitted;
	}));
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
		const currentHasContent = current.some(hasSubstantiveLine);
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

	if (current.some(hasSubstantiveLine)) {
		segments.push(trimOuterBlankLines(current));
	}

	return segments.filter(segment => segment.some(hasSubstantiveLine));
}

function hasSubstantiveLine(line: string): boolean {
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

	if (currentChunk.some(hasSubstantiveLine)) {
		chunks.push(trimOuterBlankLines(currentChunk));
	}

	return chunks.filter(chunk => chunk.some(hasSubstantiveLine));
}

function collectCodeFenceSegments(lines: string[]): string[][] {
	const segments: string[][] = [];
	let current: string[] = [];

	for (const line of lines) {
		current.push(line);
		if (line.trim().length === 0) {
			if (current.some(hasSubstantiveLine)) {
				segments.push(trimOuterBlankLines(current));
			}
			current = [];
		}
	}

	if (current.some(hasSubstantiveLine)) {
		segments.push(trimOuterBlankLines(current));
	}

	return segments.filter(segment => segment.some(hasSubstantiveLine));
}

function chunkIndexList(indexes: number[], chunkCount: number): number[][] {
	if (indexes.length < 2) {
		return [indexes];
	}

	const chunkSize = Math.max(1, Math.ceil(indexes.length / Math.max(2, chunkCount)));
	const groups: number[][] = [];
	for (let index = 0; index < indexes.length; index += chunkSize) {
		groups.push(indexes.slice(index, index + chunkSize));
	}
	return groups.filter(group => group.length > 0);
}

function splitCodeLinesByBudget(lines: string[], chunkCount: number): string[][] | null {
	const trimmedLines = trimOuterBlankLines(lines);
	if (trimmedLines.length < 2) {
		return null;
	}

	const targetLineBudget = Math.max(1, Math.ceil(trimmedLines.length / Math.max(2, chunkCount)));
	const chunks: string[][] = [];
	let currentChunk: string[] = [];

	for (const line of trimmedLines) {
		currentChunk.push(line);
		if (currentChunk.length >= targetLineBudget && chunks.length < chunkCount - 1) {
			chunks.push(trimOuterBlankLines(currentChunk));
			currentChunk = [];
		}
	}

	if (currentChunk.length > 0) {
		chunks.push(trimOuterBlankLines(currentChunk));
	}

	return chunks.length >= 2 ? chunks : null;
}

function parseMarkdownTableCells(line: string): string[] {
	const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
	return trimmed.split('|').map(cell => cell.trim());
}

function selectTableCells(cells: string[], indexes: number[]): string[] {
	return indexes.map(index => cells[index] ?? '');
}

function formatMarkdownTableLine(cells: string[]): string {
	return `| ${cells.join(' | ')} |`;
}

function formatMarkdownTableSeparator(columnCount: number): string {
	return `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`;
}

function formatMarkdownTableRecordBlock(headers: string[], cells: string[]): string[] {
	const primaryLabel = headers[0] || 'Item';
	const primaryValue = cells[0] || '';
	const lines = [`- ${primaryLabel}: ${primaryValue}`];
	for (let index = 1; index < headers.length; index++) {
		lines.push(`  - ${headers[index]}: ${cells[index] || ''}`);
	}
	return lines;
}

function longestUnbrokenTokenLength(value: string): number {
	return value
		.split(/\s+/)
		.reduce((longest, token) => Math.max(longest, token.length), 0);
}

function isMarkdownTableRow(line: string): boolean {
	const trimmed = line.trim();
	return trimmed.length > 0
		&& trimmed.includes('|')
		&& !trimmed.startsWith('```')
		&& !trimmed.startsWith('~~~')
		&& !trimmed.startsWith('#');
}

function isMarkdownTableSeparator(line: string): boolean {
	const compact = line.trim().replace(/\s+/g, '');
	return compact.length > 0 && /^[:|\-]+$/.test(compact) && compact.includes('-');
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

function containsTransformableComponentSyntax(lines: string[]): boolean {
	return lines.some(line => /^\s*<[A-Za-z][\w-]*(?:\s|>|\/)/.test(line.trim()) || /^\s*<\/[A-Za-z][\w-]*\s*>/.test(line.trim()));
}

function containsTransformWrapper(lines: string[]): boolean {
	return lines.some(line => /<(Transform)\b/i.test(line.trim()));
}

function wrapLinesInTransform(lines: string[], scale: number): string[] {
	const trimmedLines = trimOuterBlankLines(lines);
	return [
		`<Transform :scale="${formatZoom(scale)}" origin="top left">`,
		...trimmedLines,
		'</Transform>',
	];
}

function wrapLinesInSlotZoneOwner(lines: string[], zoneName: string): string[] {
	const trimmedLines = trimOuterBlankLines(lines);
	return [
		`<div ${NOTEMD_SLOT_ZONE_ATTR}="${zoneName}">`,
		...trimmedLines,
		'</div>',
	];
}

function unwrapSlotZoneOwnerWrapper(lines: string[]): { zoneName: string; contentLines: string[] } | null {
	const trimmedLines = trimOuterBlankLines(lines);
	if (trimmedLines.length < 2) {
		return null;
	}

	const openingMatch = trimmedLines[0].trim().match(new RegExp(`^<div\\s+${NOTEMD_SLOT_ZONE_ATTR}="([^"]+)"\\s*>$`, 'i'));
	if (!openingMatch || trimmedLines[trimmedLines.length - 1].trim() !== '</div>') {
		return null;
	}

	return {
		zoneName: openingMatch[1],
		contentLines: trimOuterBlankLines(trimmedLines.slice(1, -1)),
	};
}

export function decorateComponentHeavySlotZones(deckMarkdown: string): string {
	const slides = splitSlideDeck(deckMarkdown);
	let changed = false;
	const decoratedSlides = slides.map(slideMarkdown => {
		const decoratedSlide = decorateComponentHeavySlotZonesInSlide(slideMarkdown);
		if (decoratedSlide !== slideMarkdown) {
			changed = true;
		}
		return decoratedSlide;
	});
	return changed ? joinSlideDeck(decoratedSlides) : deckMarkdown;
}

function decorateComponentHeavySlotZonesInSlide(slideMarkdown: string): string {
	const surface = parseSupportedSlotLayoutSurface(slideMarkdown);
	if (!surface) {
		return slideMarkdown;
	}

	const nextLeadLines = decorateSlotZoneOwnershipLines(surface.leadLines, surface.leadRole);
	const nextSections = surface.sections.map(section => ({
		...section,
		lines: decorateSlotZoneOwnershipLines(section.lines, section.name),
	}));
	return assemblePatchedSlide(surface.frontmatterLines, buildSupportedSlotLayoutBodyLines({
		...surface,
		leadLines: nextLeadLines,
		sections: nextSections,
	}));
}

function decorateSlotZoneOwnershipLines(lines: string[], zoneName: string): string[] {
	if (!containsTransformableComponentSyntax(lines) || unwrapSlotZoneOwnerWrapper(lines)) {
		return lines;
	}

	return wrapLinesInSlotZoneOwner(lines, zoneName);
}

function buildSupportedSlotLayoutBodyLines(surface: SupportedSlotLayoutSurface): string[] {
	const bodyLines: string[] = [];
	if (surface.leadLines.length > 0) {
		bodyLines.push(...trimOuterBlankLines(surface.leadLines));
	}

	for (const section of surface.sections) {
		if (bodyLines.length > 0) {
			bodyLines.push('');
		}
		bodyLines.push(section.marker);
		bodyLines.push('');
		bodyLines.push(...trimOuterBlankLines(section.lines));
	}

	return bodyLines;
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
		if (line.startsWith('#') || line.startsWith('```') || line.startsWith(':::') || isSlotMarkerLine(line)) {
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
		if (index > 0 && (trimmed.startsWith('#') || trimmed.startsWith('```') || trimmed.startsWith(':::') || isSlotMarkerLine(trimmed))) {
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
		if (line.startsWith('#') || line.startsWith('```') || line.startsWith(':::') || isSlotMarkerLine(line)) {
			return false;
		}
	}

	return true;
}

function isSlotMarkerLine(line: string): boolean {
	return /^::[\w-]+::$/.test(line.trim());
}
