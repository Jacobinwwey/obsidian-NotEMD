import type {
	SlidevPptxFontContractSummary,
	SlidevPptxFontUsage,
	SlidevPptxOfficeFontRiskReason,
	SlidevPptxRichTextParagraph,
	SlidevPptxSlide,
	SlidevPptxSlideEditabilitySummary,
	SlidevPptxTextBox,
} from './pptxModel';

export const PPTX_WRITER_EAST_ASIA_FONT_FACE = 'Microsoft YaHei';

const PPTX_WRITER_LATIN_FONT_FACE_OVERRIDES = new Map<string, string>([
	['avenir next', 'Noto Sans'],
	['fira code', 'DejaVu Sans Mono'],
]);

type ExtractedTextRun = {
	text: string;
	fontFace: string;
};

export interface SlidevPptxOfficeTextRun {
	text: string;
	sourceFontFace: string;
	fontFace: string;
	usesEastAsiaFont: boolean;
}

type FontUsageAccumulator = {
	fontFace: string;
	textBoxIds: Set<string>;
	richTextRunCount: number;
	tableCellCount: number;
	characterCount: number;
	cjkCharacterCount: number;
	latinCharacterCount: number;
	writerEastAsiaFallbackRunCount: number;
	writerEastAsiaFallbackCharacterCount: number;
	officeMissingFontRiskReasons: Set<SlidevPptxOfficeFontRiskReason>;
};

type OfficeFontAccumulator = {
	fontFace: string;
	textRunCount: number;
	characterCount: number;
	cjkCharacterCount: number;
	latinCharacterCount: number;
	eastAsiaFallbackRunCount: number;
	eastAsiaFallbackCharacterCount: number;
};

function normalizeFontFace(value: string): string {
	const fontFace = String(value || '')
		.split(',')
		.map((part) => part.trim().replace(/^["']|["']$/g, ''))
		.find(Boolean);
	return fontFace || 'Aptos';
}

function resolvePptxOfficeLatinFontFace(fontFace: string): string {
	const normalized = normalizeFontFace(fontFace);
	return PPTX_WRITER_LATIN_FONT_FACE_OVERRIDES.get(normalized.toLowerCase()) || normalized;
}

export function pptxTextContainsCjk(text: string): boolean {
	return /[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

function pptxTextUsesEastAsiaFont(text: string): boolean {
	return /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef\uac00-\ud7af]/.test(text);
}

export function splitPptxTextIntoOfficeFontRuns(text: string, fontFace: string): SlidevPptxOfficeTextRun[] {
	const sourceFontFace = normalizeFontFace(fontFace);
	const characters = Array.from(String(text || ''));
	if (characters.length === 0) {
		return [];
	}

	const runs: SlidevPptxOfficeTextRun[] = [];
	let currentText = '';
	let currentUsesEastAsiaFont = pptxTextUsesEastAsiaFont(characters[0]);

	const flush = (): void => {
		if (currentText.length === 0) {
			return;
		}
		runs.push({
			text: currentText,
			sourceFontFace,
			fontFace: currentUsesEastAsiaFont
				? PPTX_WRITER_EAST_ASIA_FONT_FACE
				: resolvePptxOfficeLatinFontFace(sourceFontFace),
			usesEastAsiaFont: currentUsesEastAsiaFont,
		});
		currentText = '';
	};

	for (const character of characters) {
		const usesEastAsiaFont = pptxTextUsesEastAsiaFont(character);
		if (usesEastAsiaFont !== currentUsesEastAsiaFont) {
			flush();
			currentUsesEastAsiaFont = usesEastAsiaFont;
		}
		currentText += character;
	}
	flush();
	return runs;
}

function countCjkCharacters(text: string): number {
	const matches = text.match(/[\u3400-\u9fff\uf900-\ufaff]/g);
	return matches ? matches.length : 0;
}

function countLatinCharacters(text: string): number {
	const matches = text.match(/[A-Za-z\u00c0-\u024f]/g);
	return matches ? matches.length : 0;
}

function hasText(run: ExtractedTextRun): boolean {
	return run.text.length > 0 && run.text.trim().length > 0;
}

function hasOfficeText(run: SlidevPptxOfficeTextRun): boolean {
	return run.text.length > 0 && run.text.trim().length > 0;
}

function paragraphsContainRuns(paragraphs: SlidevPptxRichTextParagraph[]): boolean {
	return paragraphs.some((paragraph) => paragraph.runs.some((run) => String(run.text || '').trim().length > 0));
}

function extractedTextRunsForTextBox(textBox: SlidevPptxTextBox): ExtractedTextRun[] {
	const paragraphs = Array.isArray(textBox.richTextParagraphs) ? textBox.richTextParagraphs : [];
	if (paragraphsContainRuns(paragraphs)) {
		return paragraphs.flatMap((paragraph) =>
			paragraph.runs
				.map((run) => ({
					text: String(run.text || ''),
					fontFace: normalizeFontFace(run.fontFace),
				}))
				.filter(hasText),
		);
	}
	return textBox.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => ({
			text: line.trimEnd() || ' ',
			fontFace: normalizeFontFace(textBox.fontFace),
		}))
		.filter(hasText);
}

function officeTextRunsForExtractedRun(run: ExtractedTextRun): SlidevPptxOfficeTextRun[] {
	return splitPptxTextIntoOfficeFontRuns(run.text, run.fontFace).filter(hasOfficeText);
}

function isCssGenericFontFace(fontFace: string): boolean {
	return /^(?:-apple-system|blinkmacsystemfont|emoji|math|monospace|sans-serif|serif|system-ui|ui-monospace|ui-rounded|ui-sans-serif|ui-serif)$/i.test(
		fontFace,
	);
}

function isLocalPlatformFontFace(fontFace: string): boolean {
	return /^(?:PingFang SC|PingFang TC|PingFang HK|Hiragino Sans|Hiragino Kaku Gothic ProN|Apple Color Emoji|Segoe UI Emoji|Noto Color Emoji)$/i.test(
		fontFace,
	);
}

function isPortableOfficeFontFace(fontFace: string): boolean {
	return /^(?:Aptos|Aptos Display|Aptos Mono|Arial|Arial Unicode MS|Calibri|Calibri Light|Cambria|Candara|Consolas|Courier New|DengXian|Georgia|Microsoft JhengHei|Microsoft YaHei|SimHei|SimSun|Times New Roman|Verdana|Yu Gothic|Meiryo|Malgun Gothic)$/i.test(
		fontFace,
	);
}

function officeFontRiskReasons(fontFace: string): SlidevPptxOfficeFontRiskReason[] {
	if (/^(?:var\(|--)/i.test(fontFace)) {
		return ['unresolved-css-family'];
	}
	if (isCssGenericFontFace(fontFace)) {
		return ['css-generic-family'];
	}
	if (isPortableOfficeFontFace(fontFace)) {
		return [];
	}
	if (isLocalPlatformFontFace(fontFace)) {
		return ['local-platform-family'];
	}
	return ['non-office-family'];
}

function accumulatorFor(
	accumulators: Map<string, FontUsageAccumulator>,
	fontFace: string,
): FontUsageAccumulator {
	const normalized = normalizeFontFace(fontFace);
	const existing = accumulators.get(normalized);
	if (existing) {
		return existing;
	}
	const created: FontUsageAccumulator = {
		fontFace: normalized,
		textBoxIds: new Set(),
		richTextRunCount: 0,
		tableCellCount: 0,
		characterCount: 0,
		cjkCharacterCount: 0,
		latinCharacterCount: 0,
		writerEastAsiaFallbackRunCount: 0,
		writerEastAsiaFallbackCharacterCount: 0,
		officeMissingFontRiskReasons: new Set(officeFontRiskReasons(normalized)),
	};
	accumulators.set(normalized, created);
	return created;
}

function recordText(
	accumulators: Map<string, FontUsageAccumulator>,
	run: ExtractedTextRun,
	recordSource: (accumulator: FontUsageAccumulator) => void,
): void {
	const text = run.text;
	if (!text.trim()) {
		return;
	}
	const accumulator = accumulatorFor(accumulators, run.fontFace);
	const cjkCharacterCount = countCjkCharacters(text);
	recordSource(accumulator);
	accumulator.characterCount += text.length;
	accumulator.cjkCharacterCount += cjkCharacterCount;
	accumulator.latinCharacterCount += countLatinCharacters(text);
	const fallbackRuns = officeTextRunsForExtractedRun(run).filter(
		(officeRun) =>
			officeRun.usesEastAsiaFont &&
			officeRun.fontFace === PPTX_WRITER_EAST_ASIA_FONT_FACE &&
			officeRun.sourceFontFace !== PPTX_WRITER_EAST_ASIA_FONT_FACE,
	);
	if (fallbackRuns.length > 0) {
		accumulator.writerEastAsiaFallbackRunCount += fallbackRuns.length;
		accumulator.writerEastAsiaFallbackCharacterCount += fallbackRuns.reduce(
			(total, officeRun) => total + countCjkCharacters(officeRun.text),
			0,
		);
	}
}

function recordTextBoxRun(
	accumulators: Map<string, FontUsageAccumulator>,
	run: ExtractedTextRun,
	textBoxId: string,
): void {
	recordText(accumulators, run, (accumulator) => {
		accumulator.textBoxIds.add(textBoxId);
		accumulator.richTextRunCount += 1;
	});
}

function recordTableCellText(accumulators: Map<string, FontUsageAccumulator>, run: ExtractedTextRun): void {
	recordText(accumulators, run, (accumulator) => {
		accumulator.tableCellCount += 1;
	});
}

function sortedUnique(values: string[]): string[] {
	return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function usageFromAccumulator(accumulator: FontUsageAccumulator): SlidevPptxFontUsage {
	const riskReasons = Array.from(accumulator.officeMissingFontRiskReasons).sort();
	return {
		fontFace: accumulator.fontFace,
		textBoxCount: accumulator.textBoxIds.size,
		richTextRunCount: accumulator.richTextRunCount,
		tableCellCount: accumulator.tableCellCount,
		characterCount: accumulator.characterCount,
		cjkCharacterCount: accumulator.cjkCharacterCount,
		latinCharacterCount: accumulator.latinCharacterCount,
		writerEastAsiaFallbackRunCount: accumulator.writerEastAsiaFallbackRunCount,
		writerEastAsiaFallbackCharacterCount: accumulator.writerEastAsiaFallbackCharacterCount,
		officeMissingFontRisk: riskReasons.length > 0,
		officeMissingFontRiskReasons: riskReasons,
	};
}

function collectFontUsages(slides: SlidevPptxSlide[]): SlidevPptxFontUsage[] {
	const accumulators = new Map<string, FontUsageAccumulator>();
	for (const slide of slides) {
		for (let textBoxIndex = 0; textBoxIndex < slide.texts.length; textBoxIndex += 1) {
			const textBox = slide.texts[textBoxIndex];
			const textBoxId = `${slide.slideNumber}:${textBoxIndex}`;
			for (const run of extractedTextRunsForTextBox(textBox)) {
				recordTextBoxRun(accumulators, run, textBoxId);
			}
		}
		for (const table of slide.tables) {
			for (const row of table.rows) {
				for (const cell of row) {
					recordTableCellText(
						accumulators,
						{
							text: cell.text,
							fontFace: normalizeFontFace(cell.fontFace),
						},
					);
				}
			}
		}
	}
	return Array.from(accumulators.values())
		.map(usageFromAccumulator)
		.sort((left, right) => left.fontFace.localeCompare(right.fontFace));
}

function officeAccumulatorFor(
	accumulators: Map<string, OfficeFontAccumulator>,
	fontFace: string,
): OfficeFontAccumulator {
	const normalized = normalizeFontFace(fontFace);
	const existing = accumulators.get(normalized);
	if (existing) {
		return existing;
	}
	const created: OfficeFontAccumulator = {
		fontFace: normalized,
		textRunCount: 0,
		characterCount: 0,
		cjkCharacterCount: 0,
		latinCharacterCount: 0,
		eastAsiaFallbackRunCount: 0,
		eastAsiaFallbackCharacterCount: 0,
	};
	accumulators.set(normalized, created);
	return created;
}

function recordOfficeTextRun(
	accumulators: Map<string, OfficeFontAccumulator>,
	run: SlidevPptxOfficeTextRun,
): void {
	if (!run.text.trim()) {
		return;
	}
	const accumulator = officeAccumulatorFor(accumulators, run.fontFace);
	const cjkCharacterCount = countCjkCharacters(run.text);
	accumulator.textRunCount += 1;
	accumulator.characterCount += run.text.length;
	accumulator.cjkCharacterCount += cjkCharacterCount;
	accumulator.latinCharacterCount += countLatinCharacters(run.text);
	if (
		run.usesEastAsiaFont &&
		run.fontFace === PPTX_WRITER_EAST_ASIA_FONT_FACE &&
		run.sourceFontFace !== PPTX_WRITER_EAST_ASIA_FONT_FACE
	) {
		accumulator.eastAsiaFallbackRunCount += 1;
		accumulator.eastAsiaFallbackCharacterCount += cjkCharacterCount;
	}
}

function collectOfficeFontUsages(slides: SlidevPptxSlide[]): OfficeFontAccumulator[] {
	const accumulators = new Map<string, OfficeFontAccumulator>();
	for (const slide of slides) {
		for (const textBox of slide.texts) {
			for (const run of extractedTextRunsForTextBox(textBox)) {
				for (const officeRun of officeTextRunsForExtractedRun(run)) {
					recordOfficeTextRun(accumulators, officeRun);
				}
			}
		}
		for (const table of slide.tables) {
			for (const row of table.rows) {
				for (const cell of row) {
					const officeRuns = splitPptxTextIntoOfficeFontRuns(cell.text, cell.fontFace).filter(hasOfficeText);
					for (const officeRun of officeRuns) {
						recordOfficeTextRun(accumulators, officeRun);
					}
				}
			}
		}
	}
	return Array.from(accumulators.values()).sort((left, right) => left.fontFace.localeCompare(right.fontFace));
}

export function buildSlidevPptxFontContractSummary(slides: SlidevPptxSlide[]): SlidevPptxFontContractSummary {
	const fontUsages = collectFontUsages(slides);
	const officeFontUsages = collectOfficeFontUsages(slides);
	const fontFamilies = fontUsages.map((usage) => usage.fontFace);
	const cjkFontFamilies = fontUsages.filter((usage) => usage.cjkCharacterCount > 0).map((usage) => usage.fontFace);
	const latinFontFamilies = fontUsages.filter((usage) => usage.latinCharacterCount > 0).map((usage) => usage.fontFace);
	const writerEastAsiaFallbackFontFamilies = fontUsages
		.filter((usage) => usage.writerEastAsiaFallbackRunCount > 0)
		.map((usage) => usage.fontFace);
	const officeMissingFontRiskFamilies = fontUsages
		.filter((usage) => usage.officeMissingFontRisk)
		.map((usage) => usage.fontFace);

	return {
		fontFamilyCount: fontFamilies.length,
		fontFamilies,
		cjkFontFamilies,
		latinFontFamilies,
		writerEastAsiaFontFace: PPTX_WRITER_EAST_ASIA_FONT_FACE,
		writerEastAsiaFallbackFontFamilies,
		officeFontFamilyCount: officeFontUsages.length,
		officeFontFamilies: officeFontUsages.map((usage) => usage.fontFace),
		officeCjkFontFamilies: officeFontUsages
			.filter((usage) => usage.cjkCharacterCount > 0)
			.map((usage) => usage.fontFace),
		officeLatinFontFamilies: officeFontUsages
			.filter((usage) => usage.latinCharacterCount > 0)
			.map((usage) => usage.fontFace),
		officeTextRunCount: officeFontUsages.reduce((total, usage) => total + usage.textRunCount, 0),
		officeEastAsiaFallbackRunCount: officeFontUsages.reduce(
			(total, usage) => total + usage.eastAsiaFallbackRunCount,
			0,
		),
		officeEastAsiaFallbackCharacterCount: officeFontUsages.reduce(
			(total, usage) => total + usage.eastAsiaFallbackCharacterCount,
			0,
		),
		officeMissingFontRiskCount: officeMissingFontRiskFamilies.length,
		officeMissingFontRiskFamilies,
		fontUsages,
		fontEmbeddingPolicy: 'not-embedded',
		embeddedFontCount: 0,
		embeddedFontFamilies: [],
	};
}

export function fontFamiliesForSlideSummary(slide: SlidevPptxSlide): Pick<
	SlidevPptxSlideEditabilitySummary,
	'fontFamilies' | 'cjkFontFamilies' | 'writerEastAsiaFallbackFontFamilies' | 'officeMissingFontRiskFamilies'
> {
	const summary = buildSlidevPptxFontContractSummary([slide]);
	return {
		fontFamilies: sortedUnique(summary.fontFamilies),
		cjkFontFamilies: sortedUnique(summary.cjkFontFamilies),
		writerEastAsiaFallbackFontFamilies: sortedUnique(summary.writerEastAsiaFallbackFontFamilies),
		officeMissingFontRiskFamilies: sortedUnique(summary.officeMissingFontRiskFamilies),
	};
}
