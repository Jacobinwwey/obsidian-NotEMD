import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxDecorativePrimitiveDiagnostics,
	type SlidevPptxDecorativePrimitiveSkipReason,
	type SlidevPptxFallbackOnlyElementKind,
	type SlidevPptxInlineTextRun,
	type SlidevPptxRichTextParagraph,
	type SlidevPptxSlide,
	type SlidevPptxSolidRectangle,
	type SlidevPptxSolidRectangleSourceKind,
	type SlidevPptxTable,
	type SlidevPptxTableBorderModel,
	type SlidevPptxTableCell,
	type SlidevPptxTextAlign,
	type SlidevPptxTextBox,
	type SlidevPptxTextSourceKind,
	type SlidevPptxUnmodeledTextRunReason,
	type SlidevPptxVerticalAlign,
} from './pptxModel';

interface RawSlideTextBox {
	text: string;
	sourceKind?: SlidevPptxTextSourceKind;
	x: number;
	y: number;
	w: number;
	h: number;
	fontSize: number;
	fontFace: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike?: boolean;
	align: SlidevPptxTextAlign;
	verticalAlign?: SlidevPptxVerticalAlign;
	bullet: boolean;
	bulletLevel?: number;
	lineSpacingPt?: number;
	charSpacingPt?: number;
	paragraphSpacingBeforePt?: number;
	paragraphSpacingAfterPt?: number;
	paddingLeftIn?: number;
	paddingRightIn?: number;
	paddingTopIn?: number;
	paddingBottomIn?: number;
	order: number;
	richTextParagraphs: RawSlideRichTextParagraph[];
	unmodeledRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

interface RawSlideInlineTextRun {
	text: string;
	fontSize: number;
	fontFace: string;
	color: string;
	backgroundColor?: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike?: boolean;
	charSpacingPt?: number;
	code: boolean;
	link: boolean;
	hyperlinkTarget?: string;
}

interface RawSlideRichTextParagraph {
	runs: RawSlideInlineTextRun[];
}

interface RawSlideTableCell {
	text: string;
	rowSpan: number;
	colSpan: number;
	fontSize: number;
	fontFace: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike?: boolean;
	align: SlidevPptxTextAlign;
	verticalAlign: SlidevPptxVerticalAlign;
	fillColor: string | null;
	borderColor: string | null;
	borderWidthPt: number;
	lineSpacingPt?: number;
	charSpacingPt?: number;
	paddingLeftIn?: number;
	paddingRightIn?: number;
	paddingTopIn?: number;
	paddingBottomIn?: number;
	textLeftInsetIn?: number;
	textRightInsetIn?: number;
	textTopInsetIn?: number;
	textBottomInsetIn?: number;
	richTextParagraphs?: RawSlideRichTextParagraph[];
	unmodeledRunReasons?: SlidevPptxUnmodeledTextRunReason[];
}

interface RawSlideTable {
	x: number;
	y: number;
	w: number;
	h: number;
	colWidths: number[];
	rowHeights: number[];
	rows: RawSlideTableCell[][];
	borderModel?: SlidevPptxTableBorderModel;
	borderSpacingXIn?: number;
	borderSpacingYIn?: number;
	order: number;
}

interface RawSlideSolidRectangle {
	sourceKind: SlidevPptxSolidRectangleSourceKind;
	x: number;
	y: number;
	w: number;
	h: number;
	fillColor: string;
	borderColor?: string;
	borderWidthPt?: number;
	cornerRadiusAdjustment?: number;
	order: number;
}

interface RawDecorativePrimitiveSkipReasonCount {
	reason: SlidevPptxDecorativePrimitiveSkipReason;
	count: number;
}

interface RawDecorativePrimitiveDiagnostics {
	candidateCount: number;
	acceptedCount: number;
	skippedCount: number;
	skipReasonCounts: RawDecorativePrimitiveSkipReasonCount[];
}

interface RawSlideExtraction {
	title: string;
	backgroundColor: string;
	texts: RawSlideTextBox[];
	tables: RawSlideTable[];
	shapes: RawSlideSolidRectangle[];
	decorativePrimitiveDiagnostics?: RawDecorativePrimitiveDiagnostics;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	consumedTableTextCandidateCount: number;
	warnings: string[];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalizeHexColor(value: string, fallback: string): string {
	const normalized = String(value || '')
		.trim()
		.replace(/^#/, '')
		.toUpperCase();
	return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function normalizeHyperlinkTarget(value: unknown): string | undefined {
	const target = String(value || '').trim();
	if (!target || target.length > 2048 || /[\u0000-\u001f\u007f]/.test(target)) {
		return undefined;
	}
	if (/^(?:javascript|data|vbscript):/i.test(target)) {
		return undefined;
	}
	return target;
}

function normalizeUnmodeledTextRunReasons(value: unknown): SlidevPptxUnmodeledTextRunReason[] {
	return Array.from(new Set(Array.isArray(value) ? value : []))
		.filter(
			(reason): reason is SlidevPptxUnmodeledTextRunReason =>
				reason === 'inline-code' ||
				reason === 'inline-formatting' ||
				reason === 'link' ||
				reason === 'syntax-highlight',
		)
		.sort();
}

function normalizeInlineTextRun(raw: RawSlideInlineTextRun): SlidevPptxInlineTextRun | null {
	const text = String(raw.text || '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u200b-\u200d\ufeff]/g, '');
	if (text.length === 0) {
		return null;
	}
	const hyperlinkTarget = normalizeHyperlinkTarget(raw.hyperlinkTarget);
	const charSpacingPt = normalizeOptionalCharSpacingPt(raw.charSpacingPt);
	const backgroundColor = raw.backgroundColor ? normalizeHexColor(raw.backgroundColor, '') : '';
	return {
		text: text.slice(0, 4000),
		fontSize: clamp(Number(raw.fontSize) || 12, 5, 144),
		fontFace: String(raw.fontFace || 'Aptos').slice(0, 120),
		color: normalizeHexColor(raw.color, '111827'),
		...(backgroundColor ? { backgroundColor } : {}),
		bold: Boolean(raw.bold),
		italic: Boolean(raw.italic),
		underline: Boolean(raw.underline),
		strike: Boolean(raw.strike),
		...(charSpacingPt !== undefined ? { charSpacingPt } : {}),
		code: Boolean(raw.code),
		link: Boolean(raw.link),
		...(hyperlinkTarget ? { hyperlinkTarget } : {}),
	};
}

function normalizeTextSourceKind(value: unknown): SlidevPptxTextSourceKind {
	return value === 'code' ||
		value === 'mermaid-text' ||
		value === 'svg-text' ||
		value === 'table-cell-overlay'
		? value
		: 'body';
}

function normalizeTextValue(value: unknown, sourceKind: SlidevPptxTextSourceKind): string {
	const source = String(value || '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u200b-\u200d\ufeff]/g, '');
	if (sourceKind === 'code') {
		const lines = source.split('\n');
		while (lines.length > 0 && lines[0].trim().length === 0) {
			lines.shift();
		}
		while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
			lines.pop();
		}
		return lines.map((line) => line.replace(/\s+$/g, '')).join('\n');
	}
	return source.replace(/[^\S\n]+/g, ' ').trim();
}

function normalizeOptionalPositiveNumber(value: unknown, min: number, max: number): number | undefined {
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) {
		return undefined;
	}
	return clamp(numeric, min, max);
}

function normalizeOptionalBulletLevel(value: unknown): number | undefined {
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric < 0) {
		return undefined;
	}
	return Math.floor(clamp(numeric, 0, 8));
}

type FallbackRichTextStyle = Pick<
	SlidevPptxInlineTextRun,
	'fontSize' | 'fontFace' | 'color' | 'bold' | 'italic' | 'underline' | 'strike' | 'charSpacingPt'
>;

function buildFallbackRichTextParagraphs(text: string, style: FallbackRichTextStyle): SlidevPptxRichTextParagraph[] {
	return text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, lines) => line.length > 0 || lines.length === 1)
		.map((line) => ({
			runs: [
				{
					text: line || ' ',
					fontSize: style.fontSize,
					fontFace: style.fontFace,
					color: style.color,
					bold: style.bold,
					italic: style.italic,
					underline: style.underline,
					strike: style.strike,
					charSpacingPt: style.charSpacingPt,
					code: false,
					link: false,
				},
			],
		}));
}

function normalizeRichTextParagraphs(
	rawParagraphs: RawSlideRichTextParagraph[] | undefined,
	text: string,
	style: FallbackRichTextStyle,
): SlidevPptxRichTextParagraph[] {
	const paragraphs = Array.isArray(rawParagraphs)
		? rawParagraphs
				.map((paragraph) => ({
					runs: Array.isArray(paragraph.runs)
						? paragraph.runs
								.map(normalizeInlineTextRun)
								.filter((run): run is SlidevPptxInlineTextRun => run !== null)
						: [],
				}))
				.filter((paragraph) => paragraph.runs.some((run) => run.text.trim().length > 0))
		: [];
	return paragraphs.length > 0 ? paragraphs : buildFallbackRichTextParagraphs(text, style);
}

function normalizeTextBox(raw: RawSlideTextBox): SlidevPptxTextBox | null {
	const sourceKind = normalizeTextSourceKind(raw.sourceKind);
	const text = normalizeTextValue(raw.text, sourceKind);
	if (!text.trim()) {
		return null;
	}
	const bullet = Boolean(raw.bullet);
	const bulletLevel = bullet ? normalizeOptionalBulletLevel(raw.bulletLevel) ?? 0 : undefined;
	const lineSpacingPt = normalizeOptionalPositiveNumber(raw.lineSpacingPt, 1, 200);
	const charSpacingPt = normalizeOptionalCharSpacingPt(raw.charSpacingPt);
	const paragraphSpacingBeforePt = normalizeOptionalPositiveNumber(raw.paragraphSpacingBeforePt, 0.1, 72);
	const paragraphSpacingAfterPt = normalizeOptionalPositiveNumber(raw.paragraphSpacingAfterPt, 0.1, 72);
	const paddingLeftIn = normalizeOptionalPositiveNumber(raw.paddingLeftIn, 0.001, 2);
	const paddingRightIn = normalizeOptionalPositiveNumber(raw.paddingRightIn, 0.001, 2);
	const paddingTopIn = normalizeOptionalPositiveNumber(raw.paddingTopIn, 0.001, 2);
	const paddingBottomIn = normalizeOptionalPositiveNumber(raw.paddingBottomIn, 0.001, 2);

	const textBox: Omit<SlidevPptxTextBox, 'richTextParagraphs'> = {
		text: text.slice(0, 4000),
		sourceKind,
		x: clamp(Number(raw.x) || 0, 0, PPTX_SLIDE_WIDTH_IN),
		y: clamp(Number(raw.y) || 0, 0, PPTX_SLIDE_HEIGHT_IN),
		w: clamp(Number(raw.w) || 0.1, 0.05, PPTX_SLIDE_WIDTH_IN),
		h: clamp(Number(raw.h) || 0.1, 0.05, PPTX_SLIDE_HEIGHT_IN),
		fontSize: clamp(Number(raw.fontSize) || 12, 5, 144),
		fontFace: String(raw.fontFace || 'Aptos').slice(0, 120),
		color: normalizeHexColor(raw.color, '111827'),
		bold: Boolean(raw.bold),
		italic: Boolean(raw.italic),
		underline: Boolean(raw.underline),
		strike: Boolean(raw.strike),
		align: raw.align === 'center' || raw.align === 'right' || raw.align === 'justify' ? raw.align : 'left',
		verticalAlign: normalizeVerticalAlign(raw.verticalAlign || 'top'),
		bullet,
		...(bulletLevel !== undefined ? { bulletLevel } : {}),
		...(lineSpacingPt !== undefined ? { lineSpacingPt } : {}),
		...(charSpacingPt !== undefined ? { charSpacingPt } : {}),
		...(paragraphSpacingBeforePt !== undefined ? { paragraphSpacingBeforePt } : {}),
		...(paragraphSpacingAfterPt !== undefined ? { paragraphSpacingAfterPt } : {}),
		...(paddingLeftIn !== undefined ? { paddingLeftIn } : {}),
		...(paddingRightIn !== undefined ? { paddingRightIn } : {}),
		...(paddingTopIn !== undefined ? { paddingTopIn } : {}),
		...(paddingBottomIn !== undefined ? { paddingBottomIn } : {}),
		order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 1000,
		unmodeledRunReasons: normalizeUnmodeledTextRunReasons(raw.unmodeledRunReasons),
	};
	return {
		...textBox,
		richTextParagraphs: normalizeRichTextParagraphs(raw.richTextParagraphs, text, textBox),
	};
}

function normalizeVerticalAlign(value: string): SlidevPptxVerticalAlign {
	if (value === 'middle' || value === 'bottom') {
		return value;
	}
	return 'top';
}

function normalizeOptionalCharSpacingPt(value: unknown): number | undefined {
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || Math.abs(numeric) < 0.01) {
		return undefined;
	}
	return clamp(numeric, -20, 200);
}

function normalizeTableCell(raw: RawSlideTableCell): SlidevPptxTableCell {
	const text = String(raw.text || '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u200b-\u200d\ufeff]/g, '')
		.trim()
		.slice(0, 4000);
	const lineSpacingPt = normalizeOptionalPositiveNumber(raw.lineSpacingPt, 1, 200);
	const charSpacingPt = normalizeOptionalCharSpacingPt(raw.charSpacingPt);
	const paddingLeftIn = normalizeOptionalPositiveNumber(raw.paddingLeftIn, 0.001, 2);
	const paddingRightIn = normalizeOptionalPositiveNumber(raw.paddingRightIn, 0.001, 2);
	const paddingTopIn = normalizeOptionalPositiveNumber(raw.paddingTopIn, 0.001, 2);
	const paddingBottomIn = normalizeOptionalPositiveNumber(raw.paddingBottomIn, 0.001, 2);
	const textLeftInsetIn = normalizeOptionalPositiveNumber(raw.textLeftInsetIn, 0.001, 2);
	const textRightInsetIn = normalizeOptionalPositiveNumber(raw.textRightInsetIn, 0.001, 2);
	const textTopInsetIn = normalizeOptionalPositiveNumber(raw.textTopInsetIn, 0.001, 2);
	const textBottomInsetIn = normalizeOptionalPositiveNumber(raw.textBottomInsetIn, 0.001, 2);

	const tableCell: SlidevPptxTableCell = {
		text,
		rowSpan: clamp(Math.round(Number(raw.rowSpan) || 1), 1, 50),
		colSpan: clamp(Math.round(Number(raw.colSpan) || 1), 1, 50),
		fontSize: clamp(Number(raw.fontSize) || 12, 5, 144),
		fontFace: String(raw.fontFace || 'Aptos').slice(0, 120),
		color: normalizeHexColor(raw.color, '111827'),
		bold: Boolean(raw.bold),
		italic: Boolean(raw.italic),
		underline: Boolean(raw.underline),
		strike: Boolean(raw.strike),
		align: raw.align === 'center' || raw.align === 'right' || raw.align === 'justify' ? raw.align : 'left',
		verticalAlign: normalizeVerticalAlign(raw.verticalAlign),
		fillColor: raw.fillColor ? normalizeHexColor(raw.fillColor, '') || null : null,
		borderColor: raw.borderColor ? normalizeHexColor(raw.borderColor, '') || null : null,
		borderWidthPt: clamp(Number(raw.borderWidthPt) || 0, 0, 12),
		...(lineSpacingPt !== undefined ? { lineSpacingPt } : {}),
		...(charSpacingPt !== undefined ? { charSpacingPt } : {}),
		...(paddingLeftIn !== undefined ? { paddingLeftIn } : {}),
		...(paddingRightIn !== undefined ? { paddingRightIn } : {}),
		...(paddingTopIn !== undefined ? { paddingTopIn } : {}),
		...(paddingBottomIn !== undefined ? { paddingBottomIn } : {}),
		...(textLeftInsetIn !== undefined ? { textLeftInsetIn } : {}),
		...(textRightInsetIn !== undefined ? { textRightInsetIn } : {}),
		...(textTopInsetIn !== undefined ? { textTopInsetIn } : {}),
		...(textBottomInsetIn !== undefined ? { textBottomInsetIn } : {}),
	};
	const richTextParagraphs = normalizeRichTextParagraphs(raw.richTextParagraphs, text, tableCell);
	return {
		...tableCell,
		richTextParagraphs,
		unmodeledRunReasons: normalizeUnmodeledTextRunReasons(raw.unmodeledRunReasons),
	};
}

function normalizeTableBorderModel(value: unknown): SlidevPptxTableBorderModel | undefined {
	return value === 'collapsed' || value === 'separate' ? value : undefined;
}

function normalizeSizeSeries(values: number[], expectedLength: number, totalSize: number): number[] {
	if (expectedLength <= 0) {
		return [];
	}
	const fallback = totalSize / expectedLength;
	const source = Array.from({ length: expectedLength }, (_unused, index) => {
		const value = Number(values[index]);
		return Number.isFinite(value) && value > 0 ? value : fallback;
	});
	const sum = source.reduce((total, value) => total + value, 0);
	if (sum <= 0) {
		return Array.from({ length: expectedLength }, () => fallback);
	}
	return source.map((value) => clamp((value / sum) * totalSize, 0.01, totalSize));
}

function normalizeTable(raw: RawSlideTable): SlidevPptxTable | null {
	const rows = Array.isArray(raw.rows)
		? raw.rows.map((row) => (Array.isArray(row) ? row.map(normalizeTableCell) : []))
		: [];
	if (rows.length === 0 || rows.every((row) => row.length === 0)) {
		return null;
	}

	const x = clamp(Number(raw.x) || 0, 0, PPTX_SLIDE_WIDTH_IN);
	const y = clamp(Number(raw.y) || 0, 0, PPTX_SLIDE_HEIGHT_IN);
	const w = clamp(Number(raw.w) || 0.1, 0.05, PPTX_SLIDE_WIDTH_IN);
	const h = clamp(Number(raw.h) || 0.1, 0.05, PPTX_SLIDE_HEIGHT_IN);
	const widestRow = rows.reduce(
		(max, row) =>
			Math.max(
				max,
				row.reduce((total, cell) => total + cell.colSpan, 0),
			),
		1,
	);
	const colCount = Math.max(widestRow, Array.isArray(raw.colWidths) ? raw.colWidths.length : 0, 1);
	const borderModel = normalizeTableBorderModel(raw.borderModel);
	const borderSpacingXIn = normalizeOptionalPositiveNumber(raw.borderSpacingXIn, 0.001, 2);
	const borderSpacingYIn = normalizeOptionalPositiveNumber(raw.borderSpacingYIn, 0.001, 2);

	return {
		x,
		y,
		w,
		h,
		colWidths: normalizeSizeSeries(Array.isArray(raw.colWidths) ? raw.colWidths : [], colCount, w),
		rowHeights: normalizeSizeSeries(Array.isArray(raw.rowHeights) ? raw.rowHeights : [], rows.length, h),
		rows,
		...(borderModel !== undefined ? { borderModel } : {}),
		...(borderSpacingXIn !== undefined ? { borderSpacingXIn } : {}),
		...(borderSpacingYIn !== undefined ? { borderSpacingYIn } : {}),
		order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 1000,
	};
}

function normalizeSolidRectangle(raw: RawSlideSolidRectangle): SlidevPptxSolidRectangle | null {
	const sourceKind: SlidevPptxSolidRectangleSourceKind =
		raw.sourceKind === 'decorative-rectangle' || raw.sourceKind === 'decorative-line'
			? raw.sourceKind
			: 'code-background';
	const fillColor = normalizeHexColor(raw.fillColor, '');
	if (!fillColor) {
		return null;
	}
	const x = clamp(Number(raw.x) || 0, 0, PPTX_SLIDE_WIDTH_IN);
	const y = clamp(Number(raw.y) || 0, 0, PPTX_SLIDE_HEIGHT_IN);
	const w = clamp(Number(raw.w) || 0, 0, PPTX_SLIDE_WIDTH_IN);
	const h = clamp(Number(raw.h) || 0, 0, PPTX_SLIDE_HEIGHT_IN);
	if (w < 0.01 || h < 0.01) {
		return null;
	}
	const borderColor = raw.borderColor ? normalizeHexColor(raw.borderColor, '') : '';
	const borderWidthPt = normalizeOptionalPositiveNumber(raw.borderWidthPt, 0.1, 12);
	const cornerRadiusAdjustment = clamp(Number(raw.cornerRadiusAdjustment) || 0, 0, 50000);
	return {
		sourceKind,
		x,
		y,
		w,
		h,
		fillColor,
		...(borderColor ? { borderColor } : {}),
		...(borderColor && borderWidthPt !== undefined ? { borderWidthPt } : {}),
		...(cornerRadiusAdjustment > 0 ? { cornerRadiusAdjustment } : {}),
		order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 1000,
	};
}

const DECORATIVE_PRIMITIVE_SKIP_REASONS: readonly SlidevPptxDecorativePrimitiveSkipReason[] = [
	'unsupported-root',
	'unsupported-code-root',
	'unsupported-document-root',
	'unsupported-mermaid-root',
	'unsupported-svg-root',
	'unsupported-table-root',
	'unsupported-element',
	'table-owned-decoration',
	'not-visible',
	'unsupported-paint',
	'low-opacity',
	'non-uniform-radius',
	'no-opaque-fill-or-single-border',
	'oversized',
	'same-parent-fill',
	'consumed-ancestor',
	'line-too-wide',
	'line-too-small',
];

function isDecorativePrimitiveSkipReason(value: unknown): value is SlidevPptxDecorativePrimitiveSkipReason {
	return DECORATIVE_PRIMITIVE_SKIP_REASONS.includes(value as SlidevPptxDecorativePrimitiveSkipReason);
}

function normalizeDecorativePrimitiveDiagnostics(
	raw: RawDecorativePrimitiveDiagnostics | undefined,
): SlidevPptxDecorativePrimitiveDiagnostics {
	const reasonCounts = new Map<SlidevPptxDecorativePrimitiveSkipReason, number>();
	for (const item of Array.isArray(raw?.skipReasonCounts) ? raw!.skipReasonCounts : []) {
		if (!isDecorativePrimitiveSkipReason(item.reason)) continue;
		const count = Math.max(0, Math.round(Number(item.count) || 0));
		if (count > 0) {
			reasonCounts.set(item.reason, (reasonCounts.get(item.reason) || 0) + count);
		}
	}
	const skipReasonCounts = DECORATIVE_PRIMITIVE_SKIP_REASONS.map((reason) => ({
		reason,
		count: reasonCounts.get(reason) || 0,
	})).filter((item) => item.count > 0);
	const skippedCount = Math.max(
		0,
		Math.round(Number(raw?.skippedCount) || skipReasonCounts.reduce((total, item) => total + item.count, 0)),
	);
	const acceptedCount = Math.max(0, Math.round(Number(raw?.acceptedCount) || 0));
	const candidateCount = Math.max(
		acceptedCount + skippedCount,
		Math.round(Number(raw?.candidateCount) || 0),
	);
	return {
		candidateCount,
		acceptedCount,
		skippedCount,
		skipReasonCounts,
	};
}

export async function extractSlidevPptxSlideFromPage(page: any, slideNumber: number): Promise<SlidevPptxSlide> {
	const raw = (await page.evaluate((currentSlide: number): RawSlideExtraction => {
		const slideWidthIn = 13.3333333333;
		const slideHeightIn = 7.5;
		const warnings: string[] = [];
		const visibleSlideRoot = (): Element => {
			const candidates = Array.from(
				document.querySelectorAll('.slidev-page, .slidev-layout, .slidev-slide-content, #app'),
			);
			const rootPriority = (element: Element): number => {
				if (element.matches('.slidev-page')) return 4;
				if (element.matches('.slidev-layout')) return 3;
				if (element.matches('.slidev-slide-content')) return 2;
				if (element.matches('#app')) return 1;
				return 0;
			};
			let best: { element: Element; area: number; priority: number } | null = null;
			for (const candidate of candidates) {
				const style = window.getComputedStyle(candidate);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') < 0.04) {
					continue;
				}
				const rect = candidate.getBoundingClientRect();
				if (rect.width < 2 || rect.height < 2) continue;
				const visibleLeft = Math.max(0, rect.left);
				const visibleTop = Math.max(0, rect.top);
				const visibleRight = Math.min(window.innerWidth, rect.right);
				const visibleBottom = Math.min(window.innerHeight, rect.bottom);
				if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) continue;
				const area = (visibleRight - visibleLeft) * (visibleBottom - visibleTop);
				const priority = rootPriority(candidate);
				const comparableAreaDelta = best ? Math.max(16, best.area * 0.02) : 0;
				if (
					!best ||
					area > best.area + comparableAreaDelta ||
					(area >= best.area - comparableAreaDelta && priority > best.priority)
				) {
					best = { element: candidate, area, priority };
				}
			}
			return best?.element || document.body;
		};
		const root = visibleSlideRoot();

		const rootRect = root.getBoundingClientRect();
		const rootLeft = rootRect.left || 0;
		const rootTop = rootRect.top || 0;
		const rootWidth = rootRect.width || window.innerWidth || 1280;
		const rootHeight = rootRect.height || window.innerHeight || 720;
		const rootOffsetWidth = root instanceof HTMLElement ? root.offsetWidth || rootWidth : rootWidth;
		const rootOffsetHeight = root instanceof HTMLElement ? root.offsetHeight || rootHeight : rootHeight;
		const rootScaleX = rootOffsetWidth > 0 ? rootWidth / rootOffsetWidth : 1;
		const rootScaleY = rootOffsetHeight > 0 ? rootHeight / rootOffsetHeight : rootScaleX;
		const rootVisualScale = Math.max(0.05, Math.min(rootScaleX || 1, rootScaleY || rootScaleX || 1));
		const pxToInX = (value: number): number => ((value - rootLeft) / rootWidth) * slideWidthIn;
		const pxToInY = (value: number): number => ((value - rootTop) / rootHeight) * slideHeightIn;
		const sizeToInX = (value: number): number => (value / rootWidth) * slideWidthIn;
		const sizeToInY = (value: number): number => (value / rootHeight) * slideHeightIn;
		const pxToPt = (value: number): number =>
			value * rootVisualScale * Math.min(slideWidthIn / rootWidth, slideHeightIn / rootHeight) * 72;
		const cssPx = (value: string): number => {
			const parsed = Number.parseFloat(value || '0');
			return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
		};
		const spacingPtFor = (style: CSSStyleDeclaration, property: 'marginTop' | 'marginBottom'): number | undefined => {
			const spacing = pxToPt(cssPx(style[property]));
			return spacing > 0 ? Math.min(72, spacing) : undefined;
		};
		const lineSpacingPtFor = (style: CSSStyleDeclaration): number | undefined => {
			if (!style.lineHeight || style.lineHeight === 'normal') return undefined;
			const lineHeight = pxToPt(cssPx(style.lineHeight));
			return lineHeight > 0 ? Math.min(200, lineHeight) : undefined;
		};
		const charSpacingPtFor = (style: CSSStyleDeclaration): number | undefined => {
			if (!style.letterSpacing || style.letterSpacing === 'normal') return undefined;
			const letterSpacing = Number.parseFloat(style.letterSpacing);
			if (!Number.isFinite(letterSpacing) || Math.abs(letterSpacing) < 0.01) return undefined;
			return Math.max(-20, Math.min(200, pxToPt(letterSpacing)));
		};
		const bodyInsetsFor = (
			style: CSSStyleDeclaration,
		): Pick<
			RawSlideTextBox,
			'paddingLeftIn' | 'paddingRightIn' | 'paddingTopIn' | 'paddingBottomIn'
		> => {
			const maxInsetIn = 2;
			const paddingLeftIn = Math.min(maxInsetIn, sizeToInX(cssPx(style.paddingLeft) + cssPx(style.borderLeftWidth)));
			const paddingRightIn = Math.min(maxInsetIn, sizeToInX(cssPx(style.paddingRight) + cssPx(style.borderRightWidth)));
			const paddingTopIn = Math.min(maxInsetIn, sizeToInY(cssPx(style.paddingTop) + cssPx(style.borderTopWidth)));
			const paddingBottomIn = Math.min(maxInsetIn, sizeToInY(cssPx(style.paddingBottom) + cssPx(style.borderBottomWidth)));
			return {
				...(paddingLeftIn > 0 ? { paddingLeftIn } : {}),
				...(paddingRightIn > 0 ? { paddingRightIn } : {}),
				...(paddingTopIn > 0 ? { paddingTopIn } : {}),
				...(paddingBottomIn > 0 ? { paddingBottomIn } : {}),
			};
		};
		const borderSpacingFor = (
			style: CSSStyleDeclaration,
		): Pick<RawSlideTable, 'borderSpacingXIn' | 'borderSpacingYIn'> => {
			const parts = String(style.borderSpacing || '')
				.trim()
				.split(/\s+/)
				.filter(Boolean);
			const spacingXPx = cssPx(parts[0] || '0');
			const spacingYPx = cssPx(parts[1] || parts[0] || '0');
			const borderSpacingXIn = Math.min(2, sizeToInX(spacingXPx));
			const borderSpacingYIn = Math.min(2, sizeToInY(spacingYPx));
			return {
				...(borderSpacingXIn > 0 ? { borderSpacingXIn } : {}),
				...(borderSpacingYIn > 0 ? { borderSpacingYIn } : {}),
			};
		};
		const textContentRectFor = (element: Element): DOMRect | null => {
			let left = Number.POSITIVE_INFINITY;
			let top = Number.POSITIVE_INFINITY;
			let right = Number.NEGATIVE_INFINITY;
			let bottom = Number.NEGATIVE_INFINITY;
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			let current = walker.nextNode();
			while (current) {
				if (normalize(current.textContent || '').length > 0) {
					const range = document.createRange();
					range.selectNodeContents(current);
					for (const rect of Array.from(range.getClientRects())) {
						if (rect.width < 0.5 || rect.height < 0.5) continue;
						left = Math.min(left, rect.left);
						top = Math.min(top, rect.top);
						right = Math.max(right, rect.right);
						bottom = Math.max(bottom, rect.bottom);
					}
					range.detach();
				}
				current = walker.nextNode();
			}
			if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
				return null;
			}
			return DOMRect.fromRect({
				x: left,
				y: top,
				width: Math.max(0, right - left),
				height: Math.max(0, bottom - top),
			});
		};
		const tableCellTextInsetsFor = (
			element: Element,
			cellRect: DOMRect,
		): Pick<
			RawSlideTableCell,
			'textLeftInsetIn' | 'textRightInsetIn' | 'textTopInsetIn' | 'textBottomInsetIn'
		> => {
			const textRect = textContentRectFor(element);
			if (!textRect) return {};
			const textLeftInsetIn = Math.min(2, sizeToInX(Math.max(0, textRect.left - cellRect.left)));
			const textRightInsetIn = Math.min(2, sizeToInX(Math.max(0, cellRect.right - textRect.right)));
			const textTopInsetIn = Math.min(2, sizeToInY(Math.max(0, textRect.top - cellRect.top)));
			const textBottomInsetIn = Math.min(2, sizeToInY(Math.max(0, cellRect.bottom - textRect.bottom)));
			return {
				...(textLeftInsetIn > 0 ? { textLeftInsetIn } : {}),
				...(textRightInsetIn > 0 ? { textRightInsetIn } : {}),
				...(textTopInsetIn > 0 ? { textTopInsetIn } : {}),
				...(textBottomInsetIn > 0 ? { textBottomInsetIn } : {}),
			};
		};
		const paragraphTextLayoutFor = (
			style: CSSStyleDeclaration,
		): Pick<RawSlideTextBox, 'lineSpacingPt' | 'paragraphSpacingBeforePt' | 'paragraphSpacingAfterPt'> => {
			const lineSpacingPt = lineSpacingPtFor(style);
			const paragraphSpacingBeforePt = spacingPtFor(style, 'marginTop');
			const paragraphSpacingAfterPt = spacingPtFor(style, 'marginBottom');
			return {
				...(lineSpacingPt ? { lineSpacingPt } : {}),
				...(paragraphSpacingBeforePt ? { paragraphSpacingBeforePt } : {}),
				...(paragraphSpacingAfterPt ? { paragraphSpacingAfterPt } : {}),
			};
		};
		const blockTextLayoutFor = (
			style: CSSStyleDeclaration,
		): Pick<
			RawSlideTextBox,
			| 'lineSpacingPt'
			| 'charSpacingPt'
			| 'paragraphSpacingBeforePt'
			| 'paragraphSpacingAfterPt'
			| 'paddingLeftIn'
			| 'paddingRightIn'
			| 'paddingTopIn'
			| 'paddingBottomIn'
		> => ({
			...paragraphTextLayoutFor(style),
			...(charSpacingPtFor(style) !== undefined ? { charSpacingPt: charSpacingPtFor(style) } : {}),
			...bodyInsetsFor(style),
		});
		const listLevelFor = (element: Element): number => {
			let level = 0;
			let parentListItem = element.parentElement?.closest('li');
			while (parentListItem) {
				level += 1;
				parentListItem = parentListItem.parentElement?.closest('li') || null;
			}
			return Math.min(8, level);
		};
		const collectShadowRoots = (element: Element): ShadowRoot[] => {
			const shadowRoots: ShadowRoot[] = [];
			const visit = (current: Element): void => {
				const shadowRoot = current.shadowRoot;
				if (shadowRoot) {
					shadowRoots.push(shadowRoot);
					for (const shadowElement of Array.from(shadowRoot.querySelectorAll('*'))) {
						visit(shadowElement);
					}
				}
				for (const child of Array.from(current.children)) {
					visit(child);
				}
			};
			visit(element);
			return shadowRoots;
		};
		const shadowRoots = collectShadowRoots(root);
		const queryAllInComposedRoot = (selector: string): Element[] => [
			...Array.from(root.querySelectorAll(selector)),
			...shadowRoots.flatMap((shadowRoot) => Array.from(shadowRoot.querySelectorAll(selector))),
		];
		const allElementsInComposedRoot = (): Element[] => [
			...Array.from(root.querySelectorAll('*')),
			...shadowRoots.flatMap((shadowRoot) => Array.from(shadowRoot.querySelectorAll('*'))),
		];
		const shadowHostFor = (element: Element): Element | null => {
			const rootNode = element.getRootNode();
			return rootNode instanceof ShadowRoot ? rootNode.host : null;
		};
		const orderMap = new Map<Element, number>();
		allElementsInComposedRoot().forEach((element, index) => {
			orderMap.set(element, (index + 1) * 10);
		});
		const orderFor = (element: Element, fallback: number): number => orderMap.get(element) || fallback;
		const normalize = (value: string): string =>
			value
				.replace(/\r\n?/g, '\n')
				.replace(/[\u200b-\u200d\ufeff]/g, '')
				.replace(/[^\S\n]+/g, ' ')
				.trim();
		const normalizeCode = (value: string): string => {
			const lines = String(value || '')
				.replace(/\r\n?/g, '\n')
				.replace(/[\u200b-\u200d\ufeff]/g, '')
				.replace(/\t/g, '    ')
				.split('\n');
			while (lines.length > 0 && lines[0].trim().length === 0) {
				lines.shift();
			}
			while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
				lines.pop();
			}
			return lines.map((line) => line.replace(/\s+$/g, '')).join('\n');
		};
		const rgbToHex = (value: string): string => {
			const source = String(value || '').trim();
			if (!source || source === 'transparent') return '';
			if (source.startsWith('#')) {
				const raw = source.slice(1).toUpperCase();
				return raw.length === 3
					? raw
							.split('')
							.map((part) => part + part)
							.join('')
					: raw;
			}
			const match = source.match(
				/rgba?\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*(?:,|\/)\s*(\d+(?:\.\d+)?%?))?/i,
			);
			if (!match) return '';
			const alphaRaw = match[4];
			const alpha =
				alphaRaw === undefined
					? 1
					: alphaRaw.endsWith('%')
						? Number.parseFloat(alphaRaw) / 100
						: Number(alphaRaw);
			if (alpha <= 0.02) return '';
			return [match[1], match[2], match[3]]
				.map((part) =>
					Math.max(0, Math.min(255, Math.round(Number(part) || 0)))
						.toString(16)
						.padStart(2, '0'),
				)
				.join('')
				.toUpperCase();
		};
		const colorAlpha = (value: string): number => {
			const source = String(value || '').trim();
			if (!source || source === 'transparent') return 0;
			if (source.startsWith('#')) return 1;
			const match = source.match(
				/rgba?\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*(?:,|\/)\s*(\d+(?:\.\d+)?%?))?/i,
			);
			if (!match) return 0;
			const alphaRaw = match[4];
			if (alphaRaw === undefined) return 1;
			return alphaRaw.endsWith('%') ? Number.parseFloat(alphaRaw) / 100 : Number(alphaRaw);
		};
		const visibleSolidFillFor = (style: CSSStyleDeclaration): string => {
			if (style.backgroundImage && style.backgroundImage !== 'none') return '';
			return rgbToHex(style.backgroundColor);
		};
		const opaqueSolidFillFor = (style: CSSStyleDeclaration): string => {
			if (style.backgroundImage && style.backgroundImage !== 'none') return '';
			if (colorAlpha(style.backgroundColor) < 0.98) return '';
			return rgbToHex(style.backgroundColor);
		};
		const sanitizeFontFace = (value: string): string => {
			const font = String(value || '')
				.split(',')
				.map((part) => part.trim().replace(/^["']|["']$/g, ''))
				.find(Boolean);
			return font || 'Aptos';
		};
		const directText = (element: Element): boolean =>
			Array.from(element.childNodes).some(
				(node) => node.nodeType === Node.TEXT_NODE && normalize(node.textContent || '').length > 0,
			);
		const hasCandidateDescendant = (element: Element): boolean =>
			Boolean(element.querySelector('h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,pre,figcaption'));
		const selected = new Set<Element>();
		const baseCandidates = Array.from(
			root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,pre,figcaption'),
		);
		const fallbackCandidates = Array.from(root.querySelectorAll('div,span,a,code')).filter(
			(element) => directText(element) && !hasCandidateDescendant(element),
		);
		const allCandidates = [...baseCandidates, ...fallbackCandidates];
		const shapes: RawSlideSolidRectangle[] = [];
		const hasSelectedAncestor = (element: Element): boolean => {
			let parent = element.parentElement;
			while (parent && parent !== root) {
				if (selected.has(parent)) return true;
				parent = parent.parentElement;
			}
			return false;
		};
		const isVisible = (element: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean => {
			if (element.closest('script,style,noscript,svg')) return false;
			if (style.display === 'none' || style.visibility === 'hidden') return false;
			if (Number(style.opacity || '1') < 0.04) return false;
			if (rect.width < 2 || rect.height < 2) return false;
			if (rect.right < rootLeft || rect.bottom < rootTop) return false;
			if (rect.left > rootLeft + rootWidth || rect.top > rootTop + rootHeight) return false;
			return true;
		};
		const hasVisibleBox = (element: Element): boolean => {
			const style = window.getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			if (style.display === 'none' || style.visibility === 'hidden') return false;
			if (Number(style.opacity || '1') < 0.04) return false;
			if (rect.width < 2 || rect.height < 2) return false;
			if (rect.right < rootLeft || rect.bottom < rootTop) return false;
			if (rect.left > rootLeft + rootWidth || rect.top > rootTop + rootHeight) return false;
			return true;
		};
		const collectFallbackOnlyElementKinds = (): SlidevPptxFallbackOnlyElementKind[] => {
			const kinds = new Set<SlidevPptxFallbackOnlyElementKind>();
			const addIfVisible = (kind: SlidevPptxFallbackOnlyElementKind, selector: string): void => {
				for (const element of Array.from(root.querySelectorAll(selector))) {
					if (hasVisibleBox(element)) {
						kinds.add(kind);
						return;
					}
				}
			};
			addIfVisible('mermaid', '.mermaid, [id^="mermaid-"], svg[id^="mermaid-"]');
			addIfVisible('svg', 'svg');
			addIfVisible('canvas', 'canvas');
			addIfVisible('image', 'img, picture');
			addIfVisible('video', 'video');
			addIfVisible('iframe', 'iframe');
			addIfVisible('math', 'math, .katex, .MathJax');
			return Array.from(kinds).sort();
		};
		const alignFor = (style: CSSStyleDeclaration): SlidevPptxTextAlign => {
			if (style.textAlign === 'center') return 'center';
			if (style.textAlign === 'right' || style.textAlign === 'end') return 'right';
			if (style.textAlign === 'justify') return 'justify';
			if (style.display.includes('flex') || style.display.includes('grid')) {
				const flexDirection = String(style.flexDirection || 'row');
				const isColumn = /column/i.test(flexDirection);
				const isRowReverse = /row-reverse/i.test(flexDirection);
				const horizontalAxisValue = isColumn
					? String(style.alignItems || '')
					: String(style.justifyContent || '');
				if (horizontalAxisValue === 'center') return 'center';
				if (
					horizontalAxisValue === 'end' ||
					horizontalAxisValue === 'flex-end' ||
					horizontalAxisValue === 'right'
				) {
					return isRowReverse ? 'left' : 'right';
				}
				if (!isColumn && (horizontalAxisValue === 'start' || horizontalAxisValue === 'flex-start')) {
					return isRowReverse ? 'right' : 'left';
				}
			}
			return 'left';
		};
		const effectiveColor = (style: CSSStyleDeclaration): string => {
			const webkitFill =
				(style as any).webkitTextFillColor || style.getPropertyValue('-webkit-text-fill-color') || '';
			return rgbToHex(webkitFill) || rgbToHex(style.color) || '111827';
		};
		const inlineRunBackgroundColor = (style: CSSStyleDeclaration, sourceElement: Element): string | undefined => {
			if (!sourceElement.closest('td,th')) return undefined;
			if (style.backgroundImage && style.backgroundImage !== 'none') return undefined;
			if (colorAlpha(style.backgroundColor) < 0.3) return undefined;
			const color = rgbToHex(style.backgroundColor);
			if (!color) return undefined;
			const inlineCode = Boolean(sourceElement.closest('code') && !sourceElement.closest('pre'));
			const semanticHighlight = Boolean(sourceElement.closest('mark'));
			const tagName = sourceElement.tagName.toUpperCase();
			const inlineStyledElement = /^(SPAN|A|B|STRONG|EM|I|U|S|DEL|INS)$/.test(tagName);
			if (!inlineCode && !semanticHighlight && !inlineStyledElement) return undefined;
			const parentColor = sourceElement.parentElement
				? rgbToHex(window.getComputedStyle(sourceElement.parentElement).backgroundColor)
				: '';
			if (!inlineCode && !semanticHighlight && parentColor === color) return undefined;
			return color;
		};
		const textRunReasonsFor = (
			element: Element,
			style: CSSStyleDeclaration,
			tagName: string,
		): SlidevPptxUnmodeledTextRunReason[] => {
			const reasons = new Set<SlidevPptxUnmodeledTextRunReason>();
			const hasText = (candidate: Element): boolean => normalize(candidate.textContent || '').length > 0;
			if (tagName === 'CODE' || tagName === 'PRE' || element.querySelector('code')) {
				reasons.add('inline-code');
			}
			if (element.querySelector('a[href]')) {
				reasons.add('link');
			}
			if (
				(element.closest('.shiki') || element.querySelector('.shiki, .token, code[class*="language-"]')) &&
				codeHighlightPaintRequiresFallbackFor(element)
			) {
				reasons.add('syntax-highlight');
			}
			for (const child of Array.from(element.querySelectorAll('b,strong,em,i,u,s,strike,del,a,code,span,mark,sup,sub'))) {
				if (!hasText(child)) continue;
				const childStyle = window.getComputedStyle(child);
				if (
					childStyle.fontWeight !== style.fontWeight ||
					childStyle.fontStyle !== style.fontStyle ||
					childStyle.textDecorationLine !== style.textDecorationLine ||
					childStyle.fontFamily !== style.fontFamily ||
					childStyle.fontSize !== style.fontSize ||
					childStyle.letterSpacing !== style.letterSpacing ||
					effectiveColor(childStyle) !== effectiveColor(style)
				) {
					reasons.add('inline-formatting');
				}
			}
			return Array.from(reasons).sort();
		};
		const textSourceKindFor = (element: Element, tagName: string): SlidevPptxTextSourceKind => {
			if (
				tagName === 'PRE' ||
				element.closest('pre,.shiki') ||
				element.querySelector('.shiki, .token, code[class*="language-"]')
			) {
				return 'code';
			}
			return 'body';
		};
		const textForElement = (element: Element, tagName: string, sourceKind: SlidevPptxTextSourceKind): string => {
			const rawText =
				tagName === 'PRE' || sourceKind === 'code'
					? element.textContent || ''
					: (element instanceof HTMLElement ? element.innerText : element.textContent) || '';
			return sourceKind === 'code' ? normalizeCode(rawText) : normalize(rawText);
		};
		const runStyleFor = (
			style: CSSStyleDeclaration,
			sourceElement: Element,
		): Omit<RawSlideInlineTextRun, 'text'> => {
			const fontSizePx = Number.parseFloat(style.fontSize || '16') || 16;
			const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
			const linkElement = sourceElement.closest('a[href]') as HTMLAnchorElement | null;
			const hyperlinkTarget = linkElement?.href || linkElement?.getAttribute('href') || undefined;
			const textDecoration = `${style.textDecorationLine || ''} ${style.textDecoration || ''}`;
			const backgroundColor = inlineRunBackgroundColor(style, sourceElement);
			return {
				fontSize: pxToPt(fontSizePx),
				fontFace: sanitizeFontFace(style.fontFamily),
				color: effectiveColor(style),
				...(backgroundColor ? { backgroundColor } : {}),
				bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(style.fontWeight),
				italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
				underline:
					textDecoration.includes('underline') || Boolean(sourceElement.closest('u,ins,a[href]')),
				strike: textDecoration.includes('line-through') || Boolean(sourceElement.closest('s,strike,del')),
				...(charSpacingPtFor(style) !== undefined ? { charSpacingPt: charSpacingPtFor(style) } : {}),
				code: Boolean(sourceElement.closest('code,pre')),
				link: Boolean(linkElement),
				hyperlinkTarget,
			};
		};
		const mergeAdjacentRuns = (runs: RawSlideInlineTextRun[]): RawSlideInlineTextRun[] => {
			const merged: RawSlideInlineTextRun[] = [];
			for (const run of runs) {
				const previous = merged[merged.length - 1];
				if (
					previous &&
					previous.fontSize === run.fontSize &&
					previous.fontFace === run.fontFace &&
					previous.color === run.color &&
					previous.backgroundColor === run.backgroundColor &&
					previous.bold === run.bold &&
					previous.italic === run.italic &&
					previous.underline === run.underline &&
					previous.strike === run.strike &&
					previous.charSpacingPt === run.charSpacingPt &&
					previous.code === run.code &&
					previous.link === run.link &&
					previous.hyperlinkTarget === run.hyperlinkTarget
				) {
					previous.text += run.text;
				} else {
					merged.push({ ...run });
				}
			}
			return merged;
		};
		const collectRichTextParagraphs = (
			element: Element,
			tagName: string,
			baseStyle: CSSStyleDeclaration,
		): RawSlideRichTextParagraph[] => {
			const paragraphs: RawSlideRichTextParagraph[] = [];
			let currentRuns: RawSlideInlineTextRun[] = [];
			const preserveWhitespace = tagName === 'PRE';
			const flushParagraph = (): void => {
				const normalizedRuns = mergeAdjacentRuns(currentRuns).map((run) => ({
					...run,
					text: preserveWhitespace ? run.text.replace(/\r\n?/g, '\n') : run.text.replace(/[^\S\n]+/g, ' '),
				}));
				if (!preserveWhitespace && normalizedRuns.length > 0) {
					normalizedRuns[0].text = normalizedRuns[0].text.replace(/^\s+/, '');
					normalizedRuns[normalizedRuns.length - 1].text = normalizedRuns[
						normalizedRuns.length - 1
					].text.replace(/\s+$/, '');
				}
				const runs = normalizedRuns.filter((run) => run.text.length > 0);
				if (runs.some((run) => run.text.trim().length > 0)) {
					paragraphs.push({ runs });
				}
				currentRuns = [];
			};
			const appendText = (text: string, sourceElement: Element): void => {
				const normalizedText = preserveWhitespace ? text.replace(/\r\n?/g, '\n') : text.replace(/\s+/g, ' ');
				if (normalizedText.length === 0) return;
				const style = window.getComputedStyle(sourceElement);
				currentRuns.push({
					text: normalizedText,
					...runStyleFor(style, sourceElement),
				});
			};
			const visit = (node: Node): void => {
				if (node.nodeType === Node.TEXT_NODE) {
					const parent = node.parentElement || element;
					const parentStyle = window.getComputedStyle(parent);
					if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') return;
					if (Number(parentStyle.opacity || '1') < 0.04) return;
					appendText(node.textContent || '', parent);
					return;
				}
				if (!(node instanceof Element)) return;
				if (node.closest('script,style,noscript,svg')) return;
				if (node.tagName.toUpperCase() === 'BR') {
					flushParagraph();
					return;
				}
				for (const child of Array.from(node.childNodes)) {
					visit(child);
				}
			};
			visit(element);
			flushParagraph();
			if (paragraphs.length === 0) {
				const text =
					tagName === 'PRE'
						? element.textContent || ''
						: (element instanceof HTMLElement ? element.innerText : element.textContent) || '';
				const normalizedText = preserveWhitespace ? text.replace(/\r\n?/g, '\n') : normalize(text);
				if (normalizedText.trim()) {
					return [
						{
							runs: [
								{
									text: normalizedText,
									...runStyleFor(baseStyle, element),
								},
							],
						},
					];
				}
			}
			return paragraphs;
		};
		const sameRunStyle = (left: RawSlideInlineTextRun, right: RawSlideInlineTextRun): boolean =>
			left.fontSize === right.fontSize &&
			left.fontFace === right.fontFace &&
			left.color === right.color &&
			left.backgroundColor === right.backgroundColor &&
			left.bold === right.bold &&
			left.italic === right.italic &&
			left.underline === right.underline &&
			left.strike === right.strike &&
			left.charSpacingPt === right.charSpacingPt &&
			left.code === right.code &&
			left.link === right.link &&
			left.hyperlinkTarget === right.hyperlinkTarget;
		type BrowserLineSegment = {
			top: number;
			left: number;
			right: number;
			bottom: number;
			run: RawSlideInlineTextRun;
		};
		const mergeAdjacentLineSegments = (segments: BrowserLineSegment[]): BrowserLineSegment[] => {
			const merged: BrowserLineSegment[] = [];
			for (const segment of segments) {
				const previous = merged[merged.length - 1];
				if (previous && sameRunStyle(previous.run, segment.run)) {
					previous.run.text += segment.run.text;
					previous.top = Math.min(previous.top, segment.top);
					previous.left = Math.min(previous.left, segment.left);
					previous.right = Math.max(previous.right, segment.right);
					previous.bottom = Math.max(previous.bottom, segment.bottom);
				} else {
					merged.push({
						...segment,
						run: { ...segment.run },
					});
				}
			}
			return merged;
		};
		const normalizeBrowserLineSegments = (
			segments: BrowserLineSegment[],
			preserveWhitespace: boolean,
		): BrowserLineSegment[] => {
			const normalized = mergeAdjacentLineSegments(
				segments.map((segment) => ({
					...segment,
					run: {
						...segment.run,
						text: preserveWhitespace
							? segment.run.text.replace(/\r\n?/g, '\n')
							: segment.run.text.replace(/[^\S\n]+/g, ' '),
					},
				})),
			);
			if (normalized.length === 0) return [];
			if (preserveWhitespace) {
				normalized[normalized.length - 1].run.text = normalized[normalized.length - 1].run.text.replace(/\s+$/g, '');
			} else {
				while (normalized.length > 0) {
					normalized[0].run.text = normalized[0].run.text.replace(/^\s+/, '');
					if (normalized[0].run.text.length > 0) break;
					normalized.shift();
				}
				while (normalized.length > 0) {
					normalized[normalized.length - 1].run.text = normalized[normalized.length - 1].run.text.replace(/\s+$/g, '');
					if (normalized[normalized.length - 1].run.text.length > 0) break;
					normalized.pop();
				}
			}
			return normalized.filter((segment) => segment.run.text.length > 0);
		};
		const collectBrowserLineTextBoxes = (
			element: Element,
			tagName: string,
			baseStyle: CSSStyleDeclaration,
			sourceKind: SlidevPptxTextSourceKind,
			bullet: boolean,
			baseOrder: number,
			unmodeledRunReasons: SlidevPptxUnmodeledTextRunReason[],
		): RawSlideTextBox[] => {
			const preserveWhitespace = sourceKind === 'code' || tagName === 'PRE';
			const sourceText =
				tagName === 'PRE' || sourceKind === 'code'
					? element.textContent || ''
					: (element instanceof HTMLElement ? element.innerText : element.textContent) || '';
			const maxPreciseLineCharacters = sourceKind === 'code' ? 2400 : 1400;
			if (sourceText.length > maxPreciseLineCharacters) return [];
			type LineGroup = {
				top: number;
				left: number;
				right: number;
				bottom: number;
				segments: BrowserLineSegment[];
			};
			const groups: LineGroup[] = [];
			let activeSegment: BrowserLineSegment | null = null;
			const appendRun = (
				group: LineGroup,
				text: string,
				style: CSSStyleDeclaration,
				sourceElement: Element,
				rect: DOMRect,
			): void => {
				if (!text) return;
				const run = {
					text,
					...runStyleFor(style, sourceElement),
				};
				const previous = group.segments[group.segments.length - 1];
				if (previous && sameRunStyle(previous.run, run)) {
					previous.run.text += text;
					previous.top = Math.min(previous.top, rect.top);
					previous.left = Math.min(previous.left, rect.left);
					previous.right = Math.max(previous.right, rect.right);
					previous.bottom = Math.max(previous.bottom, rect.bottom);
					activeSegment = previous;
				} else {
					activeSegment = {
						top: rect.top,
						left: rect.left,
						right: rect.right,
						bottom: rect.bottom,
						run,
					};
					group.segments.push(activeSegment);
				}
			};
			const groupForRect = (rect: DOMRect): LineGroup => {
				let group = groups.find(
					(candidate) => Math.abs(candidate.top - rect.top) < Math.max(3, rect.height * 0.35),
				);
				if (!group) {
					group = {
						top: rect.top,
						left: rect.left,
						right: rect.right,
						bottom: rect.bottom,
						segments: [],
					};
					groups.push(group);
				} else {
					group.left = Math.min(group.left, rect.left);
					group.right = Math.max(group.right, rect.right);
					group.bottom = Math.max(group.bottom, rect.bottom);
				}
				return group;
			};
			const visit = (node: Node): void => {
				if (node.nodeType === Node.TEXT_NODE) {
					const parent = node.parentElement || element;
					const parentStyle = window.getComputedStyle(parent);
					if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') return;
					if (Number(parentStyle.opacity || '1') < 0.04) return;
					const text = node.textContent || '';
					for (let offset = 0; offset < text.length; offset += 1) {
						const char = text[offset];
						const range = document.createRange();
						range.setStart(node, offset);
						range.setEnd(node, offset + 1);
						const rect = range.getBoundingClientRect();
						range.detach();
						if (rect.width < 0.5 || rect.height < 0.5) {
							if (activeSegment && /\s/.test(char)) {
								activeSegment.run.text += char;
							}
							continue;
						}
						if (rect.right < rootLeft || rect.bottom < rootTop) continue;
						if (rect.left > rootLeft + rootWidth || rect.top > rootTop + rootHeight) continue;
						appendRun(groupForRect(rect), char, parentStyle, parent, rect);
					}
					return;
				}
				if (!(node instanceof Element)) return;
				if (node.closest('script,style,noscript,svg')) return;
				if (node.tagName.toUpperCase() === 'BR') {
					activeSegment = null;
					return;
				}
				for (const child of Array.from(node.childNodes)) {
					visit(child);
				}
			};
			visit(element);
			const lineTextBoxes = groups
				.sort((left, right) => left.top - right.top || left.left - right.left)
				.map((group, lineIndex): RawSlideTextBox[] => {
					const segments = normalizeBrowserLineSegments(group.segments, preserveWhitespace);
					const lineText = segments.map((segment) => segment.run.text).join('');
					const text = preserveWhitespace ? lineText.replace(/\s+$/g, '') : normalize(lineText);
					if (!text) return [];
					return segments.map((segment, segmentIndex): RawSlideTextBox => {
						const run = segment.run;
						const fontSizePx = Math.max(1, (run.fontSize * 96) / 72);
						const rectWidth = Math.max(1, segment.right - segment.left);
						const rectHeight = Math.max(1, segment.bottom - segment.top);
						return {
							text: run.text,
							sourceKind,
							x: pxToInX(segment.left),
							y: pxToInY(segment.top),
							w: Math.max(sizeToInX(rectWidth), sizeToInX(fontSizePx * 0.65)),
							h: Math.max(sizeToInY(rectHeight), sizeToInY(fontSizePx * 1.1)),
							fontSize: run.fontSize,
							fontFace: run.fontFace,
							color: run.color,
							bold: run.bold,
							italic: run.italic,
							underline: run.underline,
							strike: run.strike,
							...(run.charSpacingPt !== undefined ? { charSpacingPt: run.charSpacingPt } : {}),
							align: alignFor(baseStyle),
							bullet: false,
							order: baseOrder + lineIndex * 0.01 + segmentIndex * 0.0001,
							richTextParagraphs: [{ runs: [run] }],
							unmodeledRunReasons,
						};
					});
				})
				.flat();
			return bullet || groups.length > 1 ? lineTextBoxes : [];
		};
		const verticalAlignFor = (style: CSSStyleDeclaration): SlidevPptxVerticalAlign => {
			const verticalAlign = String(style.verticalAlign || '');
			if (verticalAlign === 'middle') return 'middle';
			if (verticalAlign === 'bottom' || verticalAlign === 'text-bottom') return 'bottom';
			if (style.display.includes('flex') || style.display.includes('grid')) {
				const flexDirection = String(style.flexDirection || 'row');
				const isColumn = /column/i.test(flexDirection);
				const isColumnReverse = /column-reverse/i.test(flexDirection);
				const verticalAxisValue = isColumn
					? String(style.justifyContent || '')
					: String(style.alignItems || '');
				if (verticalAxisValue === 'center') return 'middle';
				if (isColumn && (verticalAxisValue === 'start' || verticalAxisValue === 'flex-start')) {
					return isColumnReverse ? 'bottom' : 'top';
				}
				if (verticalAxisValue === 'end' || verticalAxisValue === 'flex-end') {
					return isColumnReverse ? 'top' : 'bottom';
				}
			}
			return 'top';
		};
		const parseSpan = (element: Element, attribute: 'rowspan' | 'colspan'): number => {
			const parsed = Number.parseInt(element.getAttribute(attribute) || '1', 10);
			return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 1;
		};
		const strongestBorder = (style: CSSStyleDeclaration): { color: string | null; widthPt: number } => {
			const candidates = [
				{
					width: style.borderTopWidth,
					style: style.borderTopStyle,
					color: style.borderTopColor,
				},
				{
					width: style.borderRightWidth,
					style: style.borderRightStyle,
					color: style.borderRightColor,
				},
				{
					width: style.borderBottomWidth,
					style: style.borderBottomStyle,
					color: style.borderBottomColor,
				},
				{
					width: style.borderLeftWidth,
					style: style.borderLeftStyle,
					color: style.borderLeftColor,
				},
			];
			let best: { color: string | null; widthPt: number } = {
				color: null,
				widthPt: 0,
			};
			for (const candidate of candidates) {
				const widthPx = Number.parseFloat(candidate.width || '0') || 0;
				const color = rgbToHex(candidate.color);
				if (widthPx <= 0 || !color || candidate.style === 'none' || candidate.style === 'hidden') {
					continue;
				}
				const widthPt = pxToPt(widthPx);
				if (widthPt > best.widthPt) {
					best = { color, widthPt };
				}
			}
			return best;
		};
		const uniformBorderRadiusPxFor = (style: CSSStyleDeclaration): number | null => {
			const radii = [
				style.borderTopLeftRadius,
				style.borderTopRightRadius,
				style.borderBottomRightRadius,
				style.borderBottomLeftRadius,
			].map(cssPx);
			const maxRadius = Math.max(...radii);
			const minRadius = Math.min(...radii);
			if (maxRadius <= 1) return 0;
			return maxRadius - minRadius <= 1 ? maxRadius : null;
		};
		const cornerRadiusAdjustmentFor = (radiusPx: number, rect: DOMRect): number => {
			const minSide = Math.min(rect.width, rect.height);
			if (radiusPx <= 1 || minSide <= 0) return 0;
			return Math.min(50000, Math.max(0, Math.round((radiusPx / minSide) * 100000)));
		};
		const sameRect = (left: DOMRect, right: DOMRect): boolean =>
			Math.abs(left.left - right.left) <= 1 &&
			Math.abs(left.top - right.top) <= 1 &&
			Math.abs(left.width - right.width) <= 1 &&
			Math.abs(left.height - right.height) <= 1;
		const hasConsumedAncestorWithSameFill = (element: Element, fillColor: string, rect: DOMRect): boolean => {
			let parent = element.parentElement;
			while (parent && parent !== root) {
				if (
					parent.hasAttribute('data-notemd-pptx-consumed-shape') &&
					parent.getAttribute('data-notemd-pptx-consumed-shape-fill') === fillColor
				) {
					const parentRect = parent.getBoundingClientRect();
					if (sameRect(parentRect, rect) || parentRect.width * parentRect.height >= rect.width * rect.height) {
						return true;
					}
				}
				parent = parent.parentElement;
			}
			return false;
		};
		const codeShapeOwnerFor = (element: Element): Element | null =>
			element.closest('pre,.shiki') || element.closest('code');
		type VisibleBorderSide = {
			side: 'top' | 'right' | 'bottom' | 'left';
			color: string;
			widthPx: number;
			widthPt: number;
		};
		const visibleBorderSidesFor = (style: CSSStyleDeclaration): VisibleBorderSide[] => {
			const sides: Array<{ side: VisibleBorderSide['side']; width: string; color: string; borderStyle: string }> = [
				{ side: 'top', width: style.borderTopWidth, color: style.borderTopColor, borderStyle: style.borderTopStyle },
				{ side: 'right', width: style.borderRightWidth, color: style.borderRightColor, borderStyle: style.borderRightStyle },
				{ side: 'bottom', width: style.borderBottomWidth, color: style.borderBottomColor, borderStyle: style.borderBottomStyle },
				{ side: 'left', width: style.borderLeftWidth, color: style.borderLeftColor, borderStyle: style.borderLeftStyle },
			];
			return sides
				.map((side) => {
					const widthPx = Number.parseFloat(side.width || '0') || 0;
					const color = colorAlpha(side.color) >= 0.98 ? rgbToHex(side.color) : '';
					if (widthPx <= 0 || !color || side.borderStyle === 'none' || side.borderStyle === 'hidden') return null;
					return { side: side.side, color, widthPx, widthPt: pxToPt(widthPx) };
				})
				.filter((side): side is VisibleBorderSide => side !== null);
		};
		const hasUnsupportedPrimitivePaint = (style: CSSStyleDeclaration): boolean => {
			const backgroundImage = String(style.backgroundImage || '').trim();
			const boxShadow = String(style.boxShadow || '').trim();
			const filter = String(style.filter || '').trim();
			const transform = String(style.transform || '').trim();
			return (
				(Boolean(backgroundImage) && backgroundImage !== 'none') ||
				(Boolean(boxShadow) && boxShadow !== 'none') ||
				(Boolean(filter) && filter !== 'none') ||
				(Boolean(transform) && transform !== 'none')
			);
		};
		const hasVisibleBorderPaint = (style: CSSStyleDeclaration): boolean =>
			[
				{ width: style.borderTopWidth, color: style.borderTopColor, borderStyle: style.borderTopStyle },
				{ width: style.borderRightWidth, color: style.borderRightColor, borderStyle: style.borderRightStyle },
				{ width: style.borderBottomWidth, color: style.borderBottomColor, borderStyle: style.borderBottomStyle },
				{ width: style.borderLeftWidth, color: style.borderLeftColor, borderStyle: style.borderLeftStyle },
			].some((side) => {
				const widthPx = Number.parseFloat(side.width || '0') || 0;
				return widthPx > 0 && side.borderStyle !== 'none' && side.borderStyle !== 'hidden' && colorAlpha(side.color) > 0.02;
			});
		const codeHighlightPaintRequiresFallbackFor = (rootElement: Element): boolean => {
			const candidates = [rootElement, ...Array.from(rootElement.querySelectorAll('*'))];
			for (const element of candidates) {
				if (!(element instanceof HTMLElement)) continue;
				if (element.closest('table,[data-notemd-pptx-consumed-table="1"]')) continue;
				if (!codeShapeOwnerFor(element)) continue;
				const style = window.getComputedStyle(element);
				const rect = element.getBoundingClientRect();
				if (!isVisible(element, style, rect)) continue;
				if (hasUnsupportedPrimitivePaint(style)) return true;
				const fillColor = visibleSolidFillFor(style);
				if (
					fillColor &&
					!element.hasAttribute('data-notemd-pptx-consumed-shape') &&
					!hasConsumedAncestorWithSameFill(element, fillColor, rect)
				) {
					return true;
				}
				if (hasVisibleBorderPaint(style) && !element.hasAttribute('data-notemd-pptx-consumed-shape')) {
					return true;
				}
			}
			return false;
		};
		const codeHighlightPaintRequiresFallback = (): boolean => {
			for (const element of allElementsInComposedRoot()) {
				if (!(element instanceof HTMLElement)) continue;
				if (!codeShapeOwnerFor(element)) continue;
				if (codeHighlightPaintRequiresFallbackFor(element)) return true;
			}
			return false;
		};
		const parentBackgroundFillFor = (element: Element): string => {
			const parent = element.parentElement;
			return parent ? rgbToHex(window.getComputedStyle(parent).backgroundColor) : '';
		};
		const markConsumedShape = (
			element: Element,
			sourceKind: SlidevPptxSolidRectangleSourceKind,
			fillColor: string,
		): void => {
			element.setAttribute('data-notemd-pptx-consumed-shape', sourceKind);
			element.setAttribute('data-notemd-pptx-consumed-shape-fill', fillColor);
		};
		const collectCodeBackgroundRectangles = (): void => {
			const codeBackgroundCandidates = allElementsInComposedRoot().filter((element) => {
				if (!(element instanceof HTMLElement)) return false;
				if (element.closest('table,[data-notemd-pptx-consumed-table="1"],svg,script,style,noscript')) return false;
				return Boolean(codeShapeOwnerFor(element));
			});
			for (const element of codeBackgroundCandidates) {
				const style = window.getComputedStyle(element);
				const rect = element.getBoundingClientRect();
				if (!isVisible(element, style, rect)) continue;
				if (rect.width < 4 || rect.height < 4) continue;
				const borderRadiusPx = uniformBorderRadiusPxFor(style);
				if (borderRadiusPx === null) continue;
				const fillColor = visibleSolidFillFor(style);
				if (!fillColor) continue;
				if (hasConsumedAncestorWithSameFill(element, fillColor, rect)) continue;
				const border = strongestBorder(style);
				const cornerRadiusAdjustment = cornerRadiusAdjustmentFor(borderRadiusPx, rect);
				const owner = codeShapeOwnerFor(element) || element;
				const ownerOrder = orderFor(owner, orderFor(element, order));
				shapes.push({
					sourceKind: 'code-background',
					x: pxToInX(rect.left),
					y: pxToInY(rect.top),
					w: sizeToInX(rect.width),
					h: sizeToInY(rect.height),
					fillColor,
					...(border.color && border.widthPt > 0 ? { borderColor: border.color, borderWidthPt: border.widthPt } : {}),
					...(cornerRadiusAdjustment > 0 ? { cornerRadiusAdjustment } : {}),
					order: ownerOrder - 0.3,
				});
				markConsumedShape(element, 'code-background', fillColor);
			}
		};
		const lineBoxForBorderSide = (side: VisibleBorderSide, rect: DOMRect): DOMRect => {
			const width = side.side === 'left' || side.side === 'right' ? side.widthPx : rect.width;
			const height = side.side === 'top' || side.side === 'bottom' ? side.widthPx : rect.height;
			const left = side.side === 'right' ? rect.right - side.widthPx : rect.left;
			const top = side.side === 'bottom' ? rect.bottom - side.widthPx : rect.top;
			return new DOMRect(left, top, width, height);
		};
		let decorativePrimitiveDiagnostics: RawDecorativePrimitiveDiagnostics = {
			candidateCount: 0,
			acceptedCount: 0,
			skippedCount: 0,
			skipReasonCounts: [],
		};
		const collectDecorativeSolidRectangles = (): void => {
			const slideArea = Math.max(1, rootWidth * rootHeight);
			let candidateCount = 0;
			let acceptedCount = 0;
			const skipCounts = new Map<SlidevPptxDecorativePrimitiveSkipReason, number>();
			const recordSkip = (reason: SlidevPptxDecorativePrimitiveSkipReason): void => {
				skipCounts.set(reason, (skipCounts.get(reason) || 0) + 1);
			};
			const hasBorderPaintSignal = (style: CSSStyleDeclaration): boolean =>
				[
					{ width: style.borderTopWidth, color: style.borderTopColor, borderStyle: style.borderTopStyle },
					{ width: style.borderRightWidth, color: style.borderRightColor, borderStyle: style.borderRightStyle },
					{ width: style.borderBottomWidth, color: style.borderBottomColor, borderStyle: style.borderBottomStyle },
					{ width: style.borderLeftWidth, color: style.borderLeftColor, borderStyle: style.borderLeftStyle },
				].some((side) => {
					const widthPx = Number.parseFloat(side.width || '0') || 0;
					return widthPx > 0 && side.borderStyle !== 'none' && side.borderStyle !== 'hidden' && colorAlpha(side.color) > 0.02;
				});
			const hasDecorativePaintSignal = (style: CSSStyleDeclaration): boolean => {
				const backgroundImage = String(style.backgroundImage || '').trim();
				const boxShadow = String(style.boxShadow || '').trim();
				const filter = String(style.filter || '').trim();
				const transform = String(style.transform || '').trim();
				return (
					colorAlpha(style.backgroundColor) > 0.02 ||
					(Boolean(backgroundImage) && backgroundImage !== 'none') ||
					hasBorderPaintSignal(style) ||
					(Boolean(boxShadow) && boxShadow !== 'none') ||
					(Boolean(filter) && filter !== 'none') ||
					(Boolean(transform) && transform !== 'none')
				);
			};
			const acceptShape = (
				element: Element,
				shape: RawSlideSolidRectangle,
				sourceKind: SlidevPptxSolidRectangleSourceKind,
				fillColor: string,
			): void => {
				shapes.push(shape);
				markConsumedShape(element, sourceKind, fillColor);
				acceptedCount += 1;
			};
			const protectedRootSkipReasonFor = (
				element: HTMLElement,
			): SlidevPptxDecorativePrimitiveSkipReason | null => {
				if (element.closest('[data-notemd-pptx-consumed-table="1"]')) return 'table-owned-decoration';
				if (element.closest('table')) return 'unsupported-table-root';
				if (element.closest('pre,.shiki,code')) return 'unsupported-code-root';
				if (element.closest('.mermaid,[id^="mermaid-"]')) return 'unsupported-mermaid-root';
				if (element.closest('svg')) return 'unsupported-svg-root';
				if (element.closest('script,style,noscript')) return 'unsupported-document-root';
				return null;
			};
			for (const element of allElementsInComposedRoot()) {
				if (!(element instanceof HTMLElement)) continue;
				if (element.hasAttribute('data-notemd-pptx-consumed-shape')) continue;
				const style = window.getComputedStyle(element);
				if (!hasDecorativePaintSignal(style)) continue;
				candidateCount += 1;
				const rect = element.getBoundingClientRect();
				if (!hasVisibleBox(element)) {
					recordSkip('not-visible');
					continue;
				}
				const protectedRootSkipReason = protectedRootSkipReasonFor(element);
				if (protectedRootSkipReason) {
					recordSkip(protectedRootSkipReason);
					continue;
				}
				if (element.matches('br,hr,img,picture,canvas,video,iframe,math,.katex,.MathJax')) {
					recordSkip('unsupported-element');
					continue;
				}
				if (hasUnsupportedPrimitivePaint(style)) {
					recordSkip('unsupported-paint');
					continue;
				}
				const opacity = Number(style.opacity || '1');
				if (!Number.isFinite(opacity) || opacity < 0.98) {
					recordSkip('low-opacity');
					continue;
				}
				const borderRadiusPx = uniformBorderRadiusPxFor(style);
				if (borderRadiusPx === null) {
					recordSkip('non-uniform-radius');
					continue;
				}
				const fillColor = opaqueSolidFillFor(style);
				const borderSides = visibleBorderSidesFor(style);
				const isThinFill =
					fillColor &&
					((rect.width <= 8 && rect.height >= 24) || (rect.height <= 8 && rect.width >= 24));

				if (isThinFill) {
					const lineRect = rect;
					if (hasConsumedAncestorWithSameFill(element, fillColor, lineRect)) {
						recordSkip('consumed-ancestor');
						continue;
					}
					acceptShape(
						element,
						{
							sourceKind: 'decorative-line',
							x: pxToInX(lineRect.left),
							y: pxToInY(lineRect.top),
							w: sizeToInX(lineRect.width),
							h: sizeToInY(lineRect.height),
							fillColor,
							order: orderFor(element, order) - 0.25,
						},
						'decorative-line',
						fillColor,
					);
					continue;
				}

				if (fillColor && rect.width >= 8 && rect.height >= 8) {
					const area = rect.width * rect.height;
					if (area > slideArea * 0.45) {
						recordSkip('oversized');
						continue;
					}
					if (fillColor === parentBackgroundFillFor(element) && borderSides.length === 0) {
						recordSkip('same-parent-fill');
						continue;
					}
					if (hasConsumedAncestorWithSameFill(element, fillColor, rect)) {
						recordSkip('consumed-ancestor');
						continue;
					}
					const border = strongestBorder(style);
					const cornerRadiusAdjustment = cornerRadiusAdjustmentFor(borderRadiusPx, rect);
					acceptShape(
						element,
						{
							sourceKind: 'decorative-rectangle',
							x: pxToInX(rect.left),
							y: pxToInY(rect.top),
							w: sizeToInX(rect.width),
							h: sizeToInY(rect.height),
							fillColor,
							...(border.color && border.widthPt > 0 ? { borderColor: border.color, borderWidthPt: border.widthPt } : {}),
							...(cornerRadiusAdjustment > 0 ? { cornerRadiusAdjustment } : {}),
							order: orderFor(element, order) - 0.25,
						},
						'decorative-rectangle',
						fillColor,
					);
					continue;
				}

				if (borderSides.length !== 1) {
					recordSkip('no-opaque-fill-or-single-border');
					continue;
				}
				const lineSide = borderSides[0];
				if (lineSide.widthPx > 8) {
					recordSkip('line-too-wide');
					continue;
				}
				if (rect.width < 24 && rect.height < 24) {
					recordSkip('line-too-small');
					continue;
				}
				const lineRect = lineBoxForBorderSide(lineSide, rect);
				if (lineRect.width < 2 || lineRect.height < 2) {
					recordSkip('line-too-small');
					continue;
				}
				if (hasConsumedAncestorWithSameFill(element, lineSide.color, lineRect)) {
					recordSkip('consumed-ancestor');
					continue;
				}
				acceptShape(
					element,
					{
						sourceKind: 'decorative-line',
						x: pxToInX(lineRect.left),
						y: pxToInY(lineRect.top),
						w: sizeToInX(lineRect.width),
						h: sizeToInY(lineRect.height),
						fillColor: lineSide.color,
						order: orderFor(element, order) - 0.25,
					},
					'decorative-line',
					lineSide.color,
				);
			}
			const skipReasonCounts = Array.from(skipCounts.entries())
				.map(([reason, count]) => ({ reason, count }))
				.sort((left, right) => left.reason.localeCompare(right.reason));
			decorativePrimitiveDiagnostics = {
				candidateCount,
				acceptedCount,
				skippedCount: skipReasonCounts.reduce((total, item) => total + item.count, 0),
				skipReasonCounts,
			};
		};
		const tables: RawSlideTable[] = [];
		const textBoxes: RawSlideTextBox[] = [];
		let order = 10;

		for (const tableElement of queryAllInComposedRoot('table')) {
			if (!(tableElement instanceof HTMLElement)) continue;
			if (tableElement.parentElement?.closest('[data-notemd-pptx-consumed-table="1"]')) continue;
			if (tableElement.closest('script,style,noscript,svg')) continue;
			const tableStyle = window.getComputedStyle(tableElement);
			const tableRect = tableElement.getBoundingClientRect();
			if (!isVisible(tableElement, tableStyle, tableRect)) continue;
			if (tableRect.width < 10 || tableRect.height < 10) continue;

			const rowElements = Array.from(tableElement.querySelectorAll('tr')).filter((rowElement) => {
				const rowStyle = window.getComputedStyle(rowElement);
				const rowRect = rowElement.getBoundingClientRect();
				return isVisible(rowElement, rowStyle, rowRect);
			});
			if (rowElements.length === 0) continue;

			const occupied: boolean[][] = [];
			const rowHeightsPx: number[] = [];
			const placements: Array<{
				element: Element;
				rowIndex: number;
				colIndex: number;
				rowSpan: number;
				colSpan: number;
				rect: DOMRect;
			}> = [];
			let maxCols = 0;

			for (let rowIndex = 0; rowIndex < rowElements.length; rowIndex += 1) {
				const rowElement = rowElements[rowIndex];
				const rowRect = rowElement.getBoundingClientRect();
				rowHeightsPx.push(rowRect.height);
				if (!occupied[rowIndex]) occupied[rowIndex] = [];
				let colIndex = 0;
				for (const cellElement of Array.from(rowElement.children)) {
					const tagName = cellElement.tagName.toUpperCase();
					if (tagName !== 'TD' && tagName !== 'TH') continue;
					const cellStyle = window.getComputedStyle(cellElement);
					const cellRect = cellElement.getBoundingClientRect();
					if (!isVisible(cellElement, cellStyle, cellRect)) continue;
					while (occupied[rowIndex]?.[colIndex]) {
						colIndex += 1;
					}
					const rowSpan = parseSpan(cellElement, 'rowspan');
					const colSpan = parseSpan(cellElement, 'colspan');
					placements.push({
						element: cellElement,
						rowIndex,
						colIndex,
						rowSpan,
						colSpan,
						rect: cellRect,
					});
					maxCols = Math.max(maxCols, colIndex + colSpan);
					for (
						let rowOffset = 0;
						rowOffset < rowSpan && rowIndex + rowOffset < rowElements.length;
						rowOffset += 1
					) {
						if (!occupied[rowIndex + rowOffset]) occupied[rowIndex + rowOffset] = [];
						for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
							occupied[rowIndex + rowOffset][colIndex + colOffset] = true;
						}
					}
					colIndex += colSpan;
				}
			}
			if (maxCols === 0 || placements.length === 0) continue;

			const colWidthsPx = Array.from({ length: maxCols }, () => 0);
			const rows: RawSlideTableCell[][] = Array.from({ length: rowElements.length }, () => []);
			for (const placement of placements) {
				const cellStyle = window.getComputedStyle(placement.element);
				const cellTagName = placement.element.tagName.toUpperCase();
				const cellText = normalize(
					placement.element instanceof HTMLElement
						? placement.element.innerText
						: placement.element.textContent || '',
				);
				const perColumnWidth = placement.rect.width / Math.max(1, placement.colSpan);
				for (
					let colOffset = 0;
					colOffset < placement.colSpan && placement.colIndex + colOffset < maxCols;
					colOffset += 1
				) {
					colWidthsPx[placement.colIndex + colOffset] = Math.max(
						colWidthsPx[placement.colIndex + colOffset],
						perColumnWidth,
					);
				}
				const fontSizePx = Number.parseFloat(cellStyle.fontSize || '16') || 16;
				const fontWeight = Number.parseInt(cellStyle.fontWeight || '400', 10);
				const border = strongestBorder(cellStyle);
				const cellLineSpacingPt = lineSpacingPtFor(cellStyle);
				const cellCharSpacingPt = charSpacingPtFor(cellStyle);
				const cellTextDecoration = `${cellStyle.textDecorationLine || ''} ${cellStyle.textDecoration || ''}`;
				const richTextParagraphs = collectRichTextParagraphs(placement.element, cellTagName, cellStyle);
				const unmodeledRunReasons = textRunReasonsFor(placement.element, cellStyle, cellTagName);
				rows[placement.rowIndex].push({
					text: cellText,
					rowSpan: placement.rowSpan,
					colSpan: placement.colSpan,
					fontSize: pxToPt(fontSizePx),
					fontFace: sanitizeFontFace(cellStyle.fontFamily),
					color: effectiveColor(cellStyle),
					bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(cellStyle.fontWeight),
					italic: cellStyle.fontStyle === 'italic' || cellStyle.fontStyle === 'oblique',
					underline: cellTextDecoration.includes('underline'),
					strike: cellTextDecoration.includes('line-through'),
					align: alignFor(cellStyle),
					verticalAlign: verticalAlignFor(cellStyle),
					fillColor: rgbToHex(cellStyle.backgroundColor) || null,
					borderColor: border.color,
					borderWidthPt: border.widthPt,
					...(cellLineSpacingPt ? { lineSpacingPt: cellLineSpacingPt } : {}),
					...(cellCharSpacingPt !== undefined ? { charSpacingPt: cellCharSpacingPt } : {}),
					...bodyInsetsFor(cellStyle),
					...tableCellTextInsetsFor(placement.element, placement.rect),
					richTextParagraphs,
					unmodeledRunReasons,
				});
				if (cellText) {
					placement.element.setAttribute('data-notemd-pptx-text-source-kind', 'table-cell-overlay');
					textBoxes.push({
						text: cellText,
						sourceKind: 'table-cell-overlay',
						x: pxToInX(placement.rect.left),
						y: pxToInY(placement.rect.top),
						w: sizeToInX(placement.rect.width),
						h: sizeToInY(placement.rect.height),
						fontSize: pxToPt(fontSizePx),
						fontFace: sanitizeFontFace(cellStyle.fontFamily),
						color: effectiveColor(cellStyle),
						bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(cellStyle.fontWeight),
						italic: cellStyle.fontStyle === 'italic' || cellStyle.fontStyle === 'oblique',
						underline: cellTextDecoration.includes('underline'),
						strike: cellTextDecoration.includes('line-through'),
						align: alignFor(cellStyle),
						verticalAlign: verticalAlignFor(cellStyle),
						bullet: false,
						...blockTextLayoutFor(cellStyle),
						order: orderFor(placement.element, order + 1),
						richTextParagraphs,
						unmodeledRunReasons,
					});
				}
			}

			tableElement.setAttribute('data-notemd-pptx-consumed-table', '1');
			tables.push({
				x: pxToInX(tableRect.left),
				y: pxToInY(tableRect.top),
				w: sizeToInX(tableRect.width),
				h: sizeToInY(tableRect.height),
				colWidths: colWidthsPx.map(sizeToInX),
				rowHeights: rowHeightsPx.map(sizeToInY),
				rows,
				borderModel: tableStyle.borderCollapse === 'collapse' ? 'collapsed' : 'separate',
				...borderSpacingFor(tableStyle),
				order: orderFor(tableElement, order),
			});
			order += 10;
		}
		collectCodeBackgroundRectangles();
		collectDecorativeSolidRectangles();
		const fallbackOnlyElementKinds = Array.from(
			new Set<SlidevPptxFallbackOnlyElementKind>([
				...collectFallbackOnlyElementKinds(),
				...(codeHighlightPaintRequiresFallback() ? ['code-highlight' as const] : []),
			]),
		).sort();
		let consumedTableTextCandidateCount = 0;

		for (const element of allCandidates) {
			if (selected.has(element) || hasSelectedAncestor(element)) continue;
			if (element.closest('[data-notemd-pptx-consumed-table="1"]')) {
				consumedTableTextCandidateCount += 1;
				continue;
			}
			const style = window.getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			if (!isVisible(element, style, rect)) continue;
			const tagName = element.tagName.toUpperCase();
			const sourceKind = textSourceKindFor(element, tagName);
			const text = textForElement(element, tagName, sourceKind);
			if (!text.trim()) continue;
			selected.add(element);
			element.setAttribute('data-notemd-pptx-text-source-kind', sourceKind);
			const fontSizePx = Number.parseFloat(style.fontSize || '16') || 16;
			const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
			const listStyle = style.listStyleType || '';
			const textDecoration = `${style.textDecorationLine || ''} ${style.textDecoration || ''}`;
			const baseOrder = orderFor(element, order);
			const bullet = tagName === 'LI' && listStyle !== 'none';
			const unmodeledRunReasons = textRunReasonsFor(element, style, tagName);
			const browserLineTextBoxes = collectBrowserLineTextBoxes(
				element,
				tagName,
				style,
				sourceKind,
				bullet,
				baseOrder,
				unmodeledRunReasons,
			);
			if (browserLineTextBoxes.length > 0) {
				if (bullet && element instanceof HTMLElement) {
					element.setAttribute('data-notemd-pptx-marker-color', '1');
					element.style.setProperty('--notemd-pptx-marker-color', `#${effectiveColor(style)}`);
				}
				textBoxes.push(...browserLineTextBoxes);
			} else {
				textBoxes.push({
					text,
					sourceKind,
					x: pxToInX(rect.left),
					y: pxToInY(rect.top),
					w: sizeToInX(rect.width),
					h: sizeToInY(rect.height),
					fontSize: pxToPt(fontSizePx),
					fontFace: sanitizeFontFace(style.fontFamily),
					color: effectiveColor(style),
					bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(style.fontWeight),
					italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
					underline: textDecoration.includes('underline'),
					strike: textDecoration.includes('line-through'),
					align: alignFor(style),
					verticalAlign: verticalAlignFor(style),
					bullet,
					...(bullet ? { bulletLevel: listLevelFor(element) } : {}),
					...blockTextLayoutFor(style),
					order: baseOrder,
					richTextParagraphs: collectRichTextParagraphs(element, tagName, style),
					unmodeledRunReasons,
				});
			}
			element.setAttribute('data-notemd-pptx-hidden-text', '1');
			order += 10;
		}

		const svgTextSourceKindFor = (element: Element): SlidevPptxTextSourceKind => {
			const ownerSvg = element instanceof SVGElement ? element.ownerSVGElement : null;
			const shadowHost = shadowHostFor(element);
			const inMermaid = Boolean(
				element.closest('.mermaid,[id^="mermaid-"]') ||
					(ownerSvg?.id && ownerSvg.id.startsWith('mermaid-')) ||
					ownerSvg?.closest?.('.mermaid,[id^="mermaid-"]') ||
					shadowHost?.matches?.('.mermaid,[id^="mermaid-"]') ||
					shadowHost?.closest?.('.mermaid,[id^="mermaid-"]'),
			);
			return inMermaid ? 'mermaid-text' : 'svg-text';
		};
		const svgTextFillFor = (style: CSSStyleDeclaration): string =>
			(style as any).fill || style.getPropertyValue('fill') || '';
		const svgTextColorFor = (style: CSSStyleDeclaration): string =>
			rgbToHex(svgTextFillFor(style)) || rgbToHex(style.color) || '111827';
		const svgTextIsVisible = (element: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean => {
			if (style.display === 'none' || style.visibility === 'hidden') return false;
			if (Number(style.opacity || '1') < 0.04) return false;
			const fill = svgTextFillFor(style);
			if (rgbToHex(fill) === '' && rgbToHex(style.color) === '' && String(fill || '') === 'none') {
				return false;
			}
			if (rect.width < 1 || rect.height < 1) return false;
			if (rect.right < rootLeft || rect.bottom < rootTop) return false;
			if (rect.left > rootLeft + rootWidth || rect.top > rootTop + rootHeight) return false;
			return true;
		};
		const hasVisibleTspanText = (element: Element): boolean =>
			Array.from(element.querySelectorAll('tspan')).some((child) => normalize(child.textContent || '').length > 0);
		for (const svgTextElement of queryAllInComposedRoot('svg text, svg tspan')) {
			const tagName = svgTextElement.tagName.toUpperCase();
			if (tagName === 'TEXT' && hasVisibleTspanText(svgTextElement)) {
				continue;
			}
			const text = normalize(svgTextElement.textContent || '');
			if (!text) continue;
			const style = window.getComputedStyle(svgTextElement);
			const rect = svgTextElement.getBoundingClientRect();
			if (!svgTextIsVisible(svgTextElement, style, rect)) continue;
			const fontSizePx = Number.parseFloat(style.fontSize || '16') || 16;
			const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
			const sourceKind = svgTextSourceKindFor(svgTextElement);
			const textDecoration = `${style.textDecorationLine || ''} ${style.textDecoration || ''}`;
			textBoxes.push({
				text,
				sourceKind,
				x: pxToInX(rect.left),
				y: pxToInY(rect.top),
				w: Math.max(sizeToInX(rect.width), sizeToInX(fontSizePx * 0.75)),
				h: Math.max(sizeToInY(rect.height), sizeToInY(fontSizePx * 1.2)),
				fontSize: pxToPt(fontSizePx),
				fontFace: sanitizeFontFace(style.fontFamily),
				color: svgTextColorFor(style),
				bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(style.fontWeight),
				italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
				underline: textDecoration.includes('underline'),
				strike: textDecoration.includes('line-through'),
				...(charSpacingPtFor(style) !== undefined ? { charSpacingPt: charSpacingPtFor(style) } : {}),
				align: 'left',
				bullet: false,
				order: orderFor(svgTextElement, order),
				richTextParagraphs: [
					{
						runs: [
							{
								text,
								...runStyleFor(style, svgTextElement),
								color: svgTextColorFor(style),
							},
						],
					},
				],
				unmodeledRunReasons: [],
			});
			svgTextElement.setAttribute('data-notemd-pptx-hidden-text', '1');
			svgTextElement.setAttribute('data-notemd-pptx-text-source-kind', sourceKind);
			order += 10;
		}

		if (textBoxes.length === 0) {
			warnings.push(`Slide ${currentSlide} has no extracted editable text.`);
		}

		const heading = textBoxes.find((item) => item.text.length > 0)?.text || `Slide ${currentSlide}`;
		const bodyBg = rgbToHex(window.getComputedStyle(document.body).backgroundColor);
		const rootBg = rgbToHex(window.getComputedStyle(root).backgroundColor);

		return {
			title: heading.slice(0, 120),
			backgroundColor: rootBg || bodyBg || 'FFFFFF',
			texts: textBoxes,
			tables,
			shapes,
			decorativePrimitiveDiagnostics,
			fallbackOnlyElementKinds,
			consumedTableTextCandidateCount,
			warnings,
		};
	}, slideNumber)) as RawSlideExtraction;

	const texts = raw.texts.map(normalizeTextBox).filter((textBox): textBox is SlidevPptxTextBox => textBox !== null);
	const tables = (Array.isArray(raw.tables) ? raw.tables : [])
		.map(normalizeTable)
		.filter((table): table is SlidevPptxTable => table !== null);
	const shapes = (Array.isArray(raw.shapes) ? raw.shapes : [])
		.map(normalizeSolidRectangle)
		.filter((shape): shape is SlidevPptxSolidRectangle => shape !== null);
	return {
		slideNumber,
		title: raw.title || `Slide ${slideNumber}`,
		backgroundColor: normalizeHexColor(raw.backgroundColor, 'FFFFFF'),
		texts,
		tables,
		shapes,
		decorativePrimitiveDiagnostics: normalizeDecorativePrimitiveDiagnostics(raw.decorativePrimitiveDiagnostics),
		fallbackOnlyElementKinds: Array.from(
			new Set(Array.isArray(raw.fallbackOnlyElementKinds) ? raw.fallbackOnlyElementKinds : []),
		)
			.filter(
				(kind): kind is SlidevPptxFallbackOnlyElementKind =>
					kind === 'canvas' ||
					kind === 'code-highlight' ||
					kind === 'iframe' ||
					kind === 'image' ||
					kind === 'math' ||
					kind === 'mermaid' ||
					kind === 'svg' ||
					kind === 'video',
			)
			.sort(),
		consumedTableTextCandidateCount: Math.max(0, Math.round(Number(raw.consumedTableTextCandidateCount) || 0)),
		warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
	};
}
