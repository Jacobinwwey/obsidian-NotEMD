import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxFallbackOnlyElementKind,
	type SlidevPptxInlineTextRun,
	type SlidevPptxRichTextParagraph,
	type SlidevPptxSlide,
	type SlidevPptxTable,
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
	align: SlidevPptxTextAlign;
	bullet: boolean;
	order: number;
	richTextParagraphs: RawSlideRichTextParagraph[];
	unmodeledRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

interface RawSlideInlineTextRun {
	text: string;
	fontSize: number;
	fontFace: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	code: boolean;
	link: boolean;
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
	align: SlidevPptxTextAlign;
	verticalAlign: SlidevPptxVerticalAlign;
	fillColor: string | null;
	borderColor: string | null;
	borderWidthPt: number;
}

interface RawSlideTable {
	x: number;
	y: number;
	w: number;
	h: number;
	colWidths: number[];
	rowHeights: number[];
	rows: RawSlideTableCell[][];
	order: number;
}

interface RawSlideExtraction {
	title: string;
	backgroundColor: string;
	texts: RawSlideTextBox[];
	tables: RawSlideTable[];
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

function normalizeInlineTextRun(raw: RawSlideInlineTextRun): SlidevPptxInlineTextRun | null {
	const text = String(raw.text || '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u200b-\u200d\ufeff]/g, '');
	if (text.length === 0) {
		return null;
	}
	return {
		text: text.slice(0, 4000),
		fontSize: clamp(Number(raw.fontSize) || 12, 5, 144),
		fontFace: String(raw.fontFace || 'Aptos').slice(0, 120),
		color: normalizeHexColor(raw.color, '111827'),
		bold: Boolean(raw.bold),
		italic: Boolean(raw.italic),
		underline: Boolean(raw.underline),
		code: Boolean(raw.code),
		link: Boolean(raw.link),
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

function buildFallbackRichTextParagraphs(
	text: string,
	textBox: Omit<SlidevPptxTextBox, 'richTextParagraphs'>,
): SlidevPptxRichTextParagraph[] {
	return text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, lines) => line.length > 0 || lines.length === 1)
		.map((line) => ({
			runs: [
				{
					text: line || ' ',
					fontSize: textBox.fontSize,
					fontFace: textBox.fontFace,
					color: textBox.color,
					bold: textBox.bold,
					italic: textBox.italic,
					underline: textBox.underline,
					code: false,
					link: false,
				},
			],
		}));
}

function normalizeRichTextParagraphs(
	rawParagraphs: RawSlideRichTextParagraph[] | undefined,
	text: string,
	textBox: Omit<SlidevPptxTextBox, 'richTextParagraphs'>,
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
	return paragraphs.length > 0 ? paragraphs : buildFallbackRichTextParagraphs(text, textBox);
}

function normalizeTextBox(raw: RawSlideTextBox): SlidevPptxTextBox | null {
	const sourceKind = normalizeTextSourceKind(raw.sourceKind);
	const text = normalizeTextValue(raw.text, sourceKind);
	if (!text.trim()) {
		return null;
	}

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
		align: raw.align === 'center' || raw.align === 'right' || raw.align === 'justify' ? raw.align : 'left',
		bullet: Boolean(raw.bullet),
		order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 1000,
		unmodeledRunReasons: Array.from(new Set(Array.isArray(raw.unmodeledRunReasons) ? raw.unmodeledRunReasons : []))
			.filter(
				(reason): reason is SlidevPptxUnmodeledTextRunReason =>
					reason === 'inline-code' ||
					reason === 'inline-formatting' ||
					reason === 'link' ||
					reason === 'syntax-highlight',
			)
			.sort(),
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

function normalizeTableCell(raw: RawSlideTableCell): SlidevPptxTableCell {
	return {
		text: String(raw.text || '')
			.replace(/\r\n?/g, '\n')
			.replace(/[\u200b-\u200d\ufeff]/g, '')
			.trim()
			.slice(0, 4000),
		rowSpan: clamp(Math.round(Number(raw.rowSpan) || 1), 1, 50),
		colSpan: clamp(Math.round(Number(raw.colSpan) || 1), 1, 50),
		fontSize: clamp(Number(raw.fontSize) || 12, 5, 144),
		fontFace: String(raw.fontFace || 'Aptos').slice(0, 120),
		color: normalizeHexColor(raw.color, '111827'),
		bold: Boolean(raw.bold),
		italic: Boolean(raw.italic),
		underline: Boolean(raw.underline),
		align: raw.align === 'center' || raw.align === 'right' || raw.align === 'justify' ? raw.align : 'left',
		verticalAlign: normalizeVerticalAlign(raw.verticalAlign),
		fillColor: raw.fillColor ? normalizeHexColor(raw.fillColor, '') || null : null,
		borderColor: raw.borderColor ? normalizeHexColor(raw.borderColor, '') || null : null,
		borderWidthPt: clamp(Number(raw.borderWidthPt) || 0, 0, 12),
	};
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

	return {
		x,
		y,
		w,
		h,
		colWidths: normalizeSizeSeries(Array.isArray(raw.colWidths) ? raw.colWidths : [], colCount, w),
		rowHeights: normalizeSizeSeries(Array.isArray(raw.rowHeights) ? raw.rowHeights : [], rows.length, h),
		rows,
		order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 1000,
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
				if (
					rect.right <= 0 ||
					rect.bottom <= 0 ||
					rect.left >= window.innerWidth ||
					rect.top >= window.innerHeight
				)
					continue;
				const area = rect.width * rect.height;
				const priority = rootPriority(candidate);
				if (!best || area > best.area + 1 || (Math.abs(area - best.area) <= 1 && priority > best.priority)) {
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
			addIfVisible('code-highlight', 'pre code, .shiki, .token, code[class*="language-"]');
			return Array.from(kinds).sort();
		};
		const alignFor = (style: CSSStyleDeclaration): SlidevPptxTextAlign => {
			if (style.textAlign === 'center') return 'center';
			if (style.textAlign === 'right' || style.textAlign === 'end') return 'right';
			if (style.textAlign === 'justify') return 'justify';
			return 'left';
		};
		const effectiveColor = (style: CSSStyleDeclaration): string => {
			const webkitFill =
				(style as any).webkitTextFillColor || style.getPropertyValue('-webkit-text-fill-color') || '';
			return rgbToHex(webkitFill) || rgbToHex(style.color) || '111827';
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
			if (element.closest('.shiki') || element.querySelector('.shiki, .token, code[class*="language-"]')) {
				reasons.add('syntax-highlight');
			}
			for (const child of Array.from(element.querySelectorAll('b,strong,em,i,u,a,code,span,mark,sup,sub'))) {
				if (!hasText(child)) continue;
				const childStyle = window.getComputedStyle(child);
				if (
					childStyle.fontWeight !== style.fontWeight ||
					childStyle.fontStyle !== style.fontStyle ||
					childStyle.textDecorationLine !== style.textDecorationLine ||
					childStyle.fontFamily !== style.fontFamily ||
					childStyle.fontSize !== style.fontSize ||
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
			return {
				fontSize: pxToPt(fontSizePx),
				fontFace: sanitizeFontFace(style.fontFamily),
				color: effectiveColor(style),
				bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(style.fontWeight),
				italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
				underline:
					style.textDecorationLine.includes('underline') || Boolean(sourceElement.closest('u,ins,a[href]')),
				code: Boolean(sourceElement.closest('code,pre')),
				link: Boolean(sourceElement.closest('a[href]')),
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
					previous.bold === run.bold &&
					previous.italic === run.italic &&
					previous.underline === run.underline &&
					previous.code === run.code &&
					previous.link === run.link
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
		const verticalAlignFor = (style: CSSStyleDeclaration): SlidevPptxVerticalAlign => {
			const verticalAlign = String(style.verticalAlign || '');
			if (verticalAlign === 'middle') return 'middle';
			if (verticalAlign === 'bottom' || verticalAlign === 'text-bottom') return 'bottom';
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
				rows[placement.rowIndex].push({
					text: cellText,
					rowSpan: placement.rowSpan,
					colSpan: placement.colSpan,
					fontSize: pxToPt(fontSizePx),
					fontFace: sanitizeFontFace(cellStyle.fontFamily),
					color: effectiveColor(cellStyle),
					bold: Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(cellStyle.fontWeight),
					italic: cellStyle.fontStyle === 'italic' || cellStyle.fontStyle === 'oblique',
					underline: cellStyle.textDecorationLine.includes('underline'),
					align: alignFor(cellStyle),
					verticalAlign: verticalAlignFor(cellStyle),
					fillColor: rgbToHex(cellStyle.backgroundColor) || null,
					borderColor: border.color,
					borderWidthPt: border.widthPt,
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
						underline: cellStyle.textDecorationLine.includes('underline'),
						align: alignFor(cellStyle),
						bullet: false,
						order: orderFor(placement.element, order + 1),
						richTextParagraphs: collectRichTextParagraphs(placement.element, cellTagName, cellStyle),
						unmodeledRunReasons: textRunReasonsFor(placement.element, cellStyle, cellTagName),
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
				order: orderFor(tableElement, order),
			});
			order += 10;
		}
		const fallbackOnlyElementKinds = collectFallbackOnlyElementKinds();
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
				underline: style.textDecorationLine.includes('underline'),
				align: alignFor(style),
				bullet: tagName === 'LI' && listStyle !== 'none',
				order: orderFor(element, order),
				richTextParagraphs: collectRichTextParagraphs(element, tagName, style),
				unmodeledRunReasons: textRunReasonsFor(element, style, tagName),
			});
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
				underline: style.textDecorationLine.includes('underline'),
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
			fallbackOnlyElementKinds,
			consumedTableTextCandidateCount,
			warnings,
		};
	}, slideNumber)) as RawSlideExtraction;

	const texts = raw.texts.map(normalizeTextBox).filter((textBox): textBox is SlidevPptxTextBox => textBox !== null);
	const tables = (Array.isArray(raw.tables) ? raw.tables : [])
		.map(normalizeTable)
		.filter((table): table is SlidevPptxTable => table !== null);
	return {
		slideNumber,
		title: raw.title || `Slide ${slideNumber}`,
		backgroundColor: normalizeHexColor(raw.backgroundColor, 'FFFFFF'),
		texts,
		tables,
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
