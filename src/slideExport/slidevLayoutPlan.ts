export type SlideBlockKind = 'heading' | 'text' | 'mermaid' | 'table' | 'code' | 'image';
export type SlideSplitAxis = 'semantic' | 'rows' | 'columns';
export type SlideFitStressor = 'wide' | 'tall' | 'dense-sequence' | 'dense-graph' | 'dense-diagram';
export type PlannedSlideAction = 'keep' | 'pre-split' | 'preserve-source-fit' | 'summarize';

export interface SlideBlockGeometry {
	id: string;
	kind: SlideBlockKind;
	sourceLineStart: number;
	sourceLineEnd: number;
	intrinsicWidth: number;
	intrinsicHeight: number;
	minReadableFontPx: number;
	splitAxes: SlideSplitAxis[];
	fitStressors: SlideFitStressor[];
	densityScore: number;
	summary: string;
}

export interface SlideViewportFit {
	scale: number;
	margins: { left: number; top: number; right: number; bottom: number };
	contentAreaRatio: number;
	hardPass: boolean;
	qualityPass: boolean;
	reason: string;
}

export interface PlannedSlide {
	id: string;
	title: string;
	blocks: SlideBlockGeometry[];
	fit: SlideViewportFit;
	recommendedAction: PlannedSlideAction;
	warnings: string[];
}

export interface SlideLayoutPlan {
	sourceTitle: string;
	slides: PlannedSlide[];
	preSplitCount: number;
	fitReviewCount: number;
	warnings: string[];
}

interface MarkdownSection {
	id: string;
	title: string;
	startLine: number;
	endLine: number;
	lines: string[];
}

const SAFE_WIDTH = 1177.6;
const SAFE_HEIGHT = 633.6;
const QUALITY_SCALE_FLOOR = 0.72;
const MIN_MARGIN_PX = 18;

export function planSlidevMarkdownLayout(markdown: string, fallbackTitle: string): SlideLayoutPlan {
	const sourceTitle = extractSourceTitle(markdown) || fallbackTitle;
	const sections = collectMarkdownSections(markdown, sourceTitle);
	const slides = sections.map(section => planMarkdownSection(section));
	return {
		sourceTitle,
		slides,
		preSplitCount: slides.filter(slide => slide.recommendedAction === 'pre-split').length,
		fitReviewCount: slides.filter(slide => slide.recommendedAction === 'preserve-source-fit').length,
		warnings: slides.flatMap(slide => slide.warnings.map(warning => `${slide.title}: ${warning}`)),
	};
}

export function formatSlideLayoutPlanForPrompt(plan: SlideLayoutPlan): string {
	const lines = [
		`Title: ${plan.sourceTitle}`,
		`Pre-split candidates: ${plan.preSplitCount}`,
		`Source-preserving fit reviews: ${plan.fitReviewCount}`,
		'Rules:',
		'- Treat fit scale below 0.72 as a layout failure candidate; split table, code, and prose before shrinking text.',
		'- Keep each source Mermaid fence intact; use fit, layout, or manual review instead of rewriting one diagram into several diagrams.',
		'- Wide tables split by columns; tall tables split by rows; pathological dense tables become record-list slides.',
		'- Long code blocks split into focused excerpts; do not solve code readability by zooming below quality thresholds.',
		'Slide budgets:',
	];

	for (const slide of plan.slides) {
		const blockSummary = slide.blocks
			.map(block => {
				const fitStressors = block.fitStressors.length > 0 ? ` fit=${block.fitStressors.join('/')}` : '';
				return `${block.kind}:${Math.round(block.intrinsicWidth)}x${Math.round(block.intrinsicHeight)}${fitStressors}`;
			})
			.join(', ');
		const warnings = slide.warnings.length > 0 ? ` warnings=${slide.warnings.join(' | ')}` : '';
		lines.push(`- ${slide.title}: action=${slide.recommendedAction}; scale=${slide.fit.scale.toFixed(2)}; blocks=[${blockSummary}]${warnings}`);
	}

	return lines.join('\n');
}

function planMarkdownSection(section: MarkdownSection): PlannedSlide {
	const blocks = collectSectionBlocks(section);
	const fit = computeViewportFit(blocks);
	const warnings = collectPlanWarnings(blocks, fit);
	const recommendedAction = choosePlannedAction(blocks, fit, warnings);
	return {
		id: section.id,
		title: section.title,
		blocks,
		fit,
		recommendedAction,
		warnings,
	};
}

function collectMarkdownSections(markdown: string, sourceTitle: string): MarkdownSection[] {
	const lines = markdown.split(/\r?\n/);
	const sections: MarkdownSection[] = [];
	let current: MarkdownSection | null = null;
	let fence: string | null = null;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const fenceMarker = line.match(/^\s*(```+|~~~+)/)?.[1] ?? null;
		if (fenceMarker) {
			fence = fence ? null : fenceMarker.slice(0, 3);
		}

		const heading = !fence ? line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/) : null;
		if (heading) {
			if (current) {
				current.endLine = index;
				sections.push(current);
			}
			current = {
				id: `section-${sections.length + 1}`,
				title: heading[2].trim(),
				startLine: index + 1,
				endLine: lines.length,
				lines: [line],
			};
			continue;
		}

		if (current) {
			current.lines.push(line);
		}
	}

	if (current) {
		sections.push(current);
	}
	if (sections.length === 0) {
		return [{
			id: 'section-1',
			title: sourceTitle,
			startLine: 1,
			endLine: lines.length,
			lines,
		}];
	}

	return sections.filter(section => section.lines.some(line => line.trim().length > 0));
}

function collectSectionBlocks(section: MarkdownSection): SlideBlockGeometry[] {
	const blocks: SlideBlockGeometry[] = [];
	const lines = section.lines;
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		const trimmed = line.trim();
		if (!trimmed) {
			index++;
			continue;
		}

		const heading = trimmed.match(/^#{1,6}\s+(.+?)\s*#*$/);
		if (heading) {
			blocks.push(estimateHeadingBlock(blocks.length, section, index, heading[1].trim()));
			index++;
			continue;
		}

		const fence = trimmed.match(/^(```+|~~~+)\s*([A-Za-z0-9_-]+)?/);
		if (fence) {
			const endIndex = findFenceEnd(lines, index + 1, fence[1]);
			const bodyLines = lines.slice(index + 1, endIndex);
			blocks.push(estimateFencedBlock(blocks.length, section, index, endIndex, fence[2] || '', bodyLines));
			index = Math.min(endIndex + 1, lines.length);
			continue;
		}

		if (isMarkdownTableStart(lines, index)) {
			const endIndex = findTableEnd(lines, index + 2);
			blocks.push(estimateTableBlock(blocks.length, section, index, endIndex, lines.slice(index, endIndex + 1)));
			index = endIndex + 1;
			continue;
		}

		const paragraphEnd = findParagraphEnd(lines, index);
		blocks.push(estimateTextBlock(blocks.length, section, index, paragraphEnd, lines.slice(index, paragraphEnd + 1)));
		index = paragraphEnd + 1;
	}

	return blocks;
}

function estimateHeadingBlock(index: number, section: MarkdownSection, lineIndex: number, text: string): SlideBlockGeometry {
	return {
		id: `${section.id}-block-${index + 1}`,
		kind: 'heading',
		sourceLineStart: section.startLine + lineIndex,
		sourceLineEnd: section.startLine + lineIndex,
		intrinsicWidth: Math.min(SAFE_WIDTH, Math.max(360, text.length * 22)),
		intrinsicHeight: 72,
		minReadableFontPx: 20,
		splitAxes: [],
		fitStressors: [],
		densityScore: 0.2,
		summary: text,
	};
}

function estimateFencedBlock(
	index: number,
	section: MarkdownSection,
	startIndex: number,
	endIndex: number,
	language: string,
	bodyLines: string[],
): SlideBlockGeometry {
	if (/^mermaid$/i.test(language)) {
		return estimateMermaidBlock(index, section, startIndex, endIndex, bodyLines);
	}

	const maxLineLength = Math.max(0, ...bodyLines.map(line => line.length));
	const lineCount = Math.max(1, bodyLines.length);
	return {
		id: `${section.id}-block-${index + 1}`,
		kind: 'code',
		sourceLineStart: section.startLine + startIndex,
		sourceLineEnd: section.startLine + endIndex,
		intrinsicWidth: Math.max(620, Math.min(1800, maxLineLength * 8 + 96)),
		intrinsicHeight: Math.max(180, lineCount * 24 + 96),
		minReadableFontPx: 10,
		splitAxes: ['semantic', 'rows'],
		fitStressors: [],
		densityScore: lineCount / 16 + maxLineLength / 100,
		summary: `${language || 'code'} fence, ${lineCount} lines`,
	};
}

function estimateMermaidBlock(
	index: number,
	section: MarkdownSection,
	startIndex: number,
	endIndex: number,
	bodyLines: string[],
): SlideBlockGeometry {
	const diagramType = bodyLines.find(line => line.trim() && !line.trim().startsWith('%%'))?.trim().toLowerCase() || 'mermaid';
	const lineCount = Math.max(1, bodyLines.filter(line => line.trim().length > 0).length);
	const maxLineLength = Math.max(0, ...bodyLines.map(line => line.length));
	const fitStressors: SlideFitStressor[] = diagramType.startsWith('sequencediagram')
		? ['dense-sequence', 'wide', 'tall']
		: diagramType.startsWith('flowchart') || diagramType.startsWith('graph')
			? ['dense-graph', 'wide', 'tall']
			: ['dense-diagram'];

	return {
		id: `${section.id}-block-${index + 1}`,
		kind: 'mermaid',
		sourceLineStart: section.startLine + startIndex,
		sourceLineEnd: section.startLine + endIndex,
		intrinsicWidth: Math.max(760, Math.min(2200, maxLineLength * 9 + lineCount * 18)),
		intrinsicHeight: Math.max(320, Math.min(1800, lineCount * 30 + 180)),
		minReadableFontPx: 9,
		splitAxes: [],
		fitStressors,
		densityScore: lineCount / 24 + maxLineLength / 120,
		summary: `${diagramType}, ${lineCount} lines`,
	};
}

function estimateTableBlock(index: number, section: MarkdownSection, startIndex: number, endIndex: number, rows: string[]): SlideBlockGeometry {
	const columns = parseMarkdownTableCells(rows[0] ?? '').length || 1;
	const longestCell = Math.max(0, ...rows.flatMap(row => parseMarkdownTableCells(row).map(cell => cell.length)));
	const rowCount = Math.max(1, rows.length - 2);
	return {
		id: `${section.id}-block-${index + 1}`,
		kind: 'table',
		sourceLineStart: section.startLine + startIndex,
		sourceLineEnd: section.startLine + endIndex,
		intrinsicWidth: Math.max(520, Math.min(2200, columns * 160 + longestCell * 5)),
		intrinsicHeight: Math.max(160, rowCount * 38 + 110),
		minReadableFontPx: 10,
		splitAxes: columns >= 5 ? ['columns', 'rows'] : ['rows'],
		fitStressors: [],
		densityScore: columns / 4 + rowCount / 10 + longestCell / 80,
		summary: `${columns} columns, ${rowCount} rows`,
	};
}

function estimateTextBlock(index: number, section: MarkdownSection, startIndex: number, endIndex: number, lines: string[]): SlideBlockGeometry {
	const text = lines.join(' ').replace(/\s+/g, ' ').trim();
	const maxLineLength = Math.max(0, ...lines.map(line => line.length));
	const estimatedLines = Math.max(lines.length, Math.ceil(text.length / 72));
	return {
		id: `${section.id}-block-${index + 1}`,
		kind: text.match(/^!\[.*\]\(.+\)$/) ? 'image' : 'text',
		sourceLineStart: section.startLine + startIndex,
		sourceLineEnd: section.startLine + endIndex,
		intrinsicWidth: Math.max(420, Math.min(SAFE_WIDTH, maxLineLength * 10)),
		intrinsicHeight: Math.max(56, estimatedLines * 30 + 24),
		minReadableFontPx: 12,
		splitAxes: ['semantic'],
		fitStressors: [],
		densityScore: text.length / 500 + estimatedLines / 14,
		summary: text.slice(0, 96),
	};
}

function computeViewportFit(blocks: SlideBlockGeometry[]): SlideViewportFit {
	const contentWidth = Math.max(1, ...blocks.map(block => block.intrinsicWidth));
	const contentHeight = Math.max(1, blocks.reduce((total, block) => total + block.intrinsicHeight, 0) + Math.max(0, blocks.length - 1) * 24);
	const scale = Math.min(1, SAFE_WIDTH / contentWidth, SAFE_HEIGHT / contentHeight);
	const scaledWidth = contentWidth * scale;
	const scaledHeight = contentHeight * scale;
	const margins = {
		left: (SAFE_WIDTH - scaledWidth) / 2,
		top: (SAFE_HEIGHT - scaledHeight) / 2,
		right: (SAFE_WIDTH - scaledWidth) / 2,
		bottom: (SAFE_HEIGHT - scaledHeight) / 2,
	};
	const hardPass = scale > 0 && margins.left >= 0 && margins.top >= 0 && margins.right >= 0 && margins.bottom >= 0;
	const qualityPass = hardPass && scale >= QUALITY_SCALE_FLOOR && Math.min(margins.left, margins.top, margins.right, margins.bottom) >= MIN_MARGIN_PX;
	return {
		scale,
		margins,
		contentAreaRatio: Math.min(1, (scaledWidth * scaledHeight) / (SAFE_WIDTH * SAFE_HEIGHT)),
		hardPass,
		qualityPass,
		reason: qualityPass
			? 'fits quality budget'
			: scale < QUALITY_SCALE_FLOOR
				? 'fit scale below quality floor'
				: 'quality margin below floor',
	};
}

function collectPlanWarnings(blocks: SlideBlockGeometry[], fit: SlideViewportFit): string[] {
	const warnings: string[] = [];
	if (!fit.qualityPass) {
		warnings.push(fit.reason);
	}
	for (const block of blocks) {
		if (block.kind === 'mermaid' && block.densityScore >= 1.0) {
			warnings.push(`preserve Mermaid source; review fit stressors ${block.fitStressors.join('/')}`);
		}
		if (block.kind === 'table' && block.densityScore >= 1.6) {
			warnings.push(`split table via ${block.splitAxes.join('/')}`);
		}
		if (block.kind === 'code' && block.densityScore >= 1.2) {
			warnings.push('split code into focused excerpts');
		}
	}
	return Array.from(new Set(warnings));
}

function choosePlannedAction(blocks: SlideBlockGeometry[], fit: SlideViewportFit, warnings: string[]): PlannedSlideAction {
	if (fit.qualityPass && warnings.length === 0) {
		return 'keep';
	}
	if (blocks.some(block => block.kind === 'mermaid' && block.densityScore >= 1.0)) {
		return 'preserve-source-fit';
	}
	if (blocks.some(block => (block.kind === 'table' || block.kind === 'code') && block.densityScore >= 1.2)) {
		return 'pre-split';
	}
	if (blocks.some(block => block.kind === 'text' && block.densityScore >= 1.4)) {
		return 'summarize';
	}
	return fit.qualityPass ? 'keep' : 'pre-split';
}

function findFenceEnd(lines: string[], startIndex: number, opener: string): number {
	const marker = opener[0] === '~' ? '~~~' : '```';
	for (let index = startIndex; index < lines.length; index++) {
		if (new RegExp(`^\\s*${escapeRegExp(marker)}+\\s*$`).test(lines[index])) {
			return index;
		}
	}
	return lines.length - 1;
}

function isMarkdownTableStart(lines: string[], index: number): boolean {
	return /^\s*\|.+\|\s*$/.test(lines[index] ?? '')
		&& /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? '');
}

function findTableEnd(lines: string[], startIndex: number): number {
	let endIndex = startIndex - 1;
	for (let index = startIndex; index < lines.length; index++) {
		if (!/^\s*\|.+\|\s*$/.test(lines[index])) {
			break;
		}
		endIndex = index;
	}
	return endIndex;
}

function findParagraphEnd(lines: string[], startIndex: number): number {
	for (let index = startIndex + 1; index < lines.length; index++) {
		if (!lines[index].trim()) {
			return index - 1;
		}
		if (/^\s*(```+|~~~+)/.test(lines[index]) || isMarkdownTableStart(lines, index) || /^#{1,6}\s+\S/.test(lines[index])) {
			return index - 1;
		}
	}
	return lines.length - 1;
}

function parseMarkdownTableCells(line: string): string[] {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map(cell => cell.trim());
}

function extractSourceTitle(markdown: string): string | null {
	return markdown.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1]?.trim() || null;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
