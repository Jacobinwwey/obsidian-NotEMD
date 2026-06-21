import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxSlide,
	type SlidevPptxTable,
	type SlidevPptxTableCell,
	type SlidevPptxTextAlign,
	type SlidevPptxTextBox,
	type SlidevPptxVerticalAlign,
} from './pptxModel';

interface RawSlideTextBox {
	text: string;
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
	warnings: string[];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalizeHexColor(value: string, fallback: string): string {
	const normalized = String(value || '').trim().replace(/^#/, '').toUpperCase();
	return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function normalizeTextBox(raw: RawSlideTextBox): SlidevPptxTextBox | null {
	const text = String(raw.text || '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u200b-\u200d\ufeff]/g, '')
		.trim();
	if (!text) {
		return null;
	}

	return {
		text: text.slice(0, 4000),
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
	return source.map(value => clamp(value / sum * totalSize, 0.01, totalSize));
}

function normalizeTable(raw: RawSlideTable): SlidevPptxTable | null {
	const rows = Array.isArray(raw.rows)
		? raw.rows.map(row => (Array.isArray(row) ? row.map(normalizeTableCell) : []))
		: [];
	if (rows.length === 0 || rows.every(row => row.length === 0)) {
		return null;
	}

	const x = clamp(Number(raw.x) || 0, 0, PPTX_SLIDE_WIDTH_IN);
	const y = clamp(Number(raw.y) || 0, 0, PPTX_SLIDE_HEIGHT_IN);
	const w = clamp(Number(raw.w) || 0.1, 0.05, PPTX_SLIDE_WIDTH_IN);
	const h = clamp(Number(raw.h) || 0.1, 0.05, PPTX_SLIDE_HEIGHT_IN);
	const widestRow = rows.reduce((max, row) => Math.max(max, row.reduce((total, cell) => total + cell.colSpan, 0)), 1);
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
	const raw = await page.evaluate((currentSlide: number): RawSlideExtraction => {
		const slideWidthIn = 13.3333333333;
		const slideHeightIn = 7.5;
		const warnings: string[] = [];
		const visibleSlideRoot = (): Element => {
			const candidates = Array.from(document.querySelectorAll('.slidev-page, .slidev-layout, .slidev-slide-content, #app'));
			let best: { element: Element; area: number } | null = null;
			for (const candidate of candidates) {
				const style = window.getComputedStyle(candidate);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') < 0.04) {
					continue;
				}
				const rect = candidate.getBoundingClientRect();
				if (rect.width < 2 || rect.height < 2) continue;
				if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) continue;
				const area = rect.width * rect.height;
				if (!best || area > best.area) {
					best = { element: candidate, area };
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
		const pxToInX = (value: number): number => (value - rootLeft) / rootWidth * slideWidthIn;
		const pxToInY = (value: number): number => (value - rootTop) / rootHeight * slideHeightIn;
		const sizeToInX = (value: number): number => value / rootWidth * slideWidthIn;
		const sizeToInY = (value: number): number => value / rootHeight * slideHeightIn;
		const pxToPt = (value: number): number => value * 72 / 96;
		const orderMap = new Map<Element, number>();
		Array.from(root.querySelectorAll('*')).forEach((element, index) => {
			orderMap.set(element, (index + 1) * 10);
		});
		const orderFor = (element: Element, fallback: number): number => orderMap.get(element) || fallback;
		const normalize = (value: string): string => value
			.replace(/\r\n?/g, '\n')
			.replace(/[\u200b-\u200d\ufeff]/g, '')
			.replace(/[^\S\n]+/g, ' ')
			.trim();
		const rgbToHex = (value: string): string => {
			const source = String(value || '').trim();
			if (!source || source === 'transparent') return '';
			if (source.startsWith('#')) {
				const raw = source.slice(1).toUpperCase();
				return raw.length === 3 ? raw.split('').map(part => part + part).join('') : raw;
			}
			const match = source.match(/rgba?\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)(?:\s*(?:,|\/)\s*(\d+(?:\.\d+)?%?))?/i);
			if (!match) return '';
			const alphaRaw = match[4];
			const alpha = alphaRaw === undefined
				? 1
				: alphaRaw.endsWith('%')
					? Number.parseFloat(alphaRaw) / 100
					: Number(alphaRaw);
			if (alpha <= 0.02) return '';
			return [match[1], match[2], match[3]]
				.map(part => Math.max(0, Math.min(255, Math.round(Number(part) || 0))).toString(16).padStart(2, '0'))
				.join('')
				.toUpperCase();
		};
		const sanitizeFontFace = (value: string): string => {
			const font = String(value || '')
				.split(',')
				.map(part => part.trim().replace(/^["']|["']$/g, ''))
				.find(Boolean);
			return font || 'Aptos';
		};
		const directText = (element: Element): boolean => Array.from(element.childNodes).some(node => (
			node.nodeType === Node.TEXT_NODE && normalize(node.textContent || '').length > 0
		));
		const hasCandidateDescendant = (element: Element): boolean => Boolean(element.querySelector(
			'h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,pre,figcaption'
		));
		const selected = new Set<Element>();
		const baseCandidates = Array.from(root.querySelectorAll(
			'h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,pre,figcaption'
		));
		const fallbackCandidates = Array.from(root.querySelectorAll('div,span,a,code')).filter(element => (
			directText(element) && !hasCandidateDescendant(element)
		));
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
		const alignFor = (style: CSSStyleDeclaration): SlidevPptxTextAlign => {
			if (style.textAlign === 'center') return 'center';
			if (style.textAlign === 'right' || style.textAlign === 'end') return 'right';
			if (style.textAlign === 'justify') return 'justify';
			return 'left';
		};
		const effectiveColor = (style: CSSStyleDeclaration): string => {
			const webkitFill = (style as any).webkitTextFillColor || style.getPropertyValue('-webkit-text-fill-color') || '';
			return rgbToHex(webkitFill) || rgbToHex(style.color) || '111827';
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
				{ width: style.borderTopWidth, style: style.borderTopStyle, color: style.borderTopColor },
				{ width: style.borderRightWidth, style: style.borderRightStyle, color: style.borderRightColor },
				{ width: style.borderBottomWidth, style: style.borderBottomStyle, color: style.borderBottomColor },
				{ width: style.borderLeftWidth, style: style.borderLeftStyle, color: style.borderLeftColor },
			];
			let best: { color: string | null; widthPt: number } = { color: null, widthPt: 0 };
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
		let order = 10;

		for (const tableElement of Array.from(root.querySelectorAll('table'))) {
			if (!(tableElement instanceof HTMLElement)) continue;
			if (tableElement.parentElement?.closest('[data-notemd-pptx-consumed-table="1"]')) continue;
			if (tableElement.closest('script,style,noscript,svg')) continue;
			const tableStyle = window.getComputedStyle(tableElement);
			const tableRect = tableElement.getBoundingClientRect();
			if (!isVisible(tableElement, tableStyle, tableRect)) continue;
			if (tableRect.width < 10 || tableRect.height < 10) continue;

			const rowElements = Array.from(tableElement.querySelectorAll('tr')).filter(rowElement => {
				const rowStyle = window.getComputedStyle(rowElement);
				const rowRect = rowElement.getBoundingClientRect();
				return isVisible(rowElement, rowStyle, rowRect);
			});
			if (rowElements.length === 0) continue;

			const occupied: boolean[][] = [];
			const rowHeightsPx: number[] = [];
			const placements: Array<{ element: Element; rowIndex: number; colIndex: number; rowSpan: number; colSpan: number; rect: DOMRect }> = [];
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
					placements.push({ element: cellElement, rowIndex, colIndex, rowSpan, colSpan, rect: cellRect });
					maxCols = Math.max(maxCols, colIndex + colSpan);
					for (let rowOffset = 0; rowOffset < rowSpan && rowIndex + rowOffset < rowElements.length; rowOffset += 1) {
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
				const perColumnWidth = placement.rect.width / Math.max(1, placement.colSpan);
				for (let colOffset = 0; colOffset < placement.colSpan && placement.colIndex + colOffset < maxCols; colOffset += 1) {
					colWidthsPx[placement.colIndex + colOffset] = Math.max(colWidthsPx[placement.colIndex + colOffset], perColumnWidth);
				}
				const fontSizePx = Number.parseFloat(cellStyle.fontSize || '16') || 16;
				const fontWeight = Number.parseInt(cellStyle.fontWeight || '400', 10);
				const border = strongestBorder(cellStyle);
				rows[placement.rowIndex].push({
					text: normalize(placement.element instanceof HTMLElement ? placement.element.innerText : placement.element.textContent || ''),
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
		const textBoxes: RawSlideTextBox[] = [];

		for (const element of allCandidates) {
			if (selected.has(element) || hasSelectedAncestor(element)) continue;
			const style = window.getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			if (!isVisible(element, style, rect)) continue;
			const tagName = element.tagName.toUpperCase();
			const rawText = tagName === 'PRE'
				? element.textContent || ''
				: (element instanceof HTMLElement ? element.innerText : element.textContent) || '';
			const text = normalize(rawText);
			if (!text) continue;
			selected.add(element);
			const fontSizePx = Number.parseFloat(style.fontSize || '16') || 16;
			const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
			const listStyle = style.listStyleType || '';
			textBoxes.push({
				text,
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
			});
			element.setAttribute('data-notemd-pptx-hidden-text', '1');
			order += 10;
		}

		const hideStyle = document.createElement('style');
		hideStyle.id = 'notemd-pptx-hide-text';
		hideStyle.textContent = [
			'[data-notemd-pptx-hidden-text="1"],',
			'[data-notemd-pptx-hidden-text="1"] * {',
			'color: transparent !important;',
			'-webkit-text-fill-color: transparent !important;',
			'text-shadow: none !important;',
			'text-decoration-color: transparent !important;',
			'}',
			'[data-notemd-pptx-hidden-text="1"]::marker { color: transparent !important; }',
			'[data-notemd-pptx-consumed-table="1"],',
			'[data-notemd-pptx-consumed-table="1"] * {',
			'color: transparent !important;',
			'-webkit-text-fill-color: transparent !important;',
			'text-shadow: none !important;',
			'text-decoration-color: transparent !important;',
			'}',
		].join('\n');
		document.head.appendChild(hideStyle);

		if (textBoxes.length === 0) {
			warnings.push(`Slide ${currentSlide} has no extracted editable text.`);
		}

		const heading = textBoxes.find(item => item.text.length > 0)?.text || `Slide ${currentSlide}`;
		const bodyBg = rgbToHex(window.getComputedStyle(document.body).backgroundColor);
		const rootBg = rgbToHex(window.getComputedStyle(root).backgroundColor);

		return {
			title: heading.slice(0, 120),
			backgroundColor: rootBg || bodyBg || 'FFFFFF',
			texts: textBoxes,
			tables,
			warnings,
		};
	}, slideNumber) as RawSlideExtraction;

	const texts = raw.texts
		.map(normalizeTextBox)
		.filter((textBox): textBox is SlidevPptxTextBox => textBox !== null);
	const tables = (Array.isArray(raw.tables) ? raw.tables : [])
		.map(normalizeTable)
		.filter((table): table is SlidevPptxTable => table !== null);
	return {
		slideNumber,
		title: raw.title || `Slide ${slideNumber}`,
		backgroundColor: normalizeHexColor(raw.backgroundColor, 'FFFFFF'),
		texts,
		tables,
		warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
	};
}
