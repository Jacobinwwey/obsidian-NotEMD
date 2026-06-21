import { PPTX_SLIDE_HEIGHT_IN, PPTX_SLIDE_WIDTH_IN, type SlidevPptxSlide, type SlidevPptxTextAlign, type SlidevPptxTextBox } from './pptxModel';

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

interface RawSlideExtraction {
	title: string;
	backgroundColor: string;
	texts: RawSlideTextBox[];
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
		const textBoxes: RawSlideTextBox[] = [];
		let order = 10;

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
				order,
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
			warnings,
		};
	}, slideNumber) as RawSlideExtraction;

	const texts = raw.texts
		.map(normalizeTextBox)
		.filter((textBox): textBox is SlidevPptxTextBox => textBox !== null);
	return {
		slideNumber,
		title: raw.title || `Slide ${slideNumber}`,
		backgroundColor: normalizeHexColor(raw.backgroundColor, 'FFFFFF'),
		texts,
		warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
	};
}
