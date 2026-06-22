import type {
	SlidevPptxFontContractSummary,
	SlidevPptxFontPolicy,
	SlidevPptxFontUsage,
	SlidevPptxOfficeFontRiskReason,
	SlidevPptxRichTextParagraph,
	SlidevPptxSlide,
	SlidevPptxSlideEditabilitySummary,
	SlidevPptxTableCell,
	SlidevPptxTextBox,
} from './pptxModel';

export const PPTX_WRITER_EAST_ASIA_FONT_FACE = 'Microsoft YaHei';
export const PPTX_WRITER_LATIN_FONT_FACE = 'Noto Sans';
export const PPTX_WRITER_MONOSPACE_FONT_FACE = 'DejaVu Sans Mono';

export const SLIDEV_PPTX_LATIN_FONT_FACE_PRESETS = [
	PPTX_WRITER_LATIN_FONT_FACE,
	'Aptos',
	'Arial',
	'Calibri',
	'Inter',
] as const;

export const SLIDEV_PPTX_EAST_ASIA_FONT_FACE_PRESETS = [
	PPTX_WRITER_EAST_ASIA_FONT_FACE,
	'Noto Sans CJK SC',
	'Microsoft JhengHei',
	'DengXian',
	'SimSun',
] as const;

export const SLIDEV_PPTX_MONOSPACE_FONT_FACE_PRESETS = [
	PPTX_WRITER_MONOSPACE_FONT_FACE,
	'Aptos Mono',
	'Consolas',
	'Courier New',
	'Fira Code',
] as const;

const DEFAULT_SOURCE_FONT_FACE_OVERRIDES: Record<string, 'latin' | 'monospace'> = {
	'Avenir Next': 'latin',
	'Fira Code': 'monospace',
};

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
	tableCellIds: Set<string>;
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

export function normalizePptxFontFace(value: string, fallback = 'Aptos'): string {
	const fontFace = String(value || '')
		.split(',')
		.map((part) => part.trim().replace(/^["']|["']$/g, ''))
		.find(Boolean);
	return fontFace || fallback;
}

function normalizeFontFace(value: string): string {
	return normalizePptxFontFace(value);
}

function sortedUnique(values: string[]): string[] {
	return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function builtInFontPresetFaces(): Set<string> {
	return new Set(
		[
			...SLIDEV_PPTX_LATIN_FONT_FACE_PRESETS,
			...SLIDEV_PPTX_EAST_ASIA_FONT_FACE_PRESETS,
			...SLIDEV_PPTX_MONOSPACE_FONT_FACE_PRESETS,
		].map((fontFace) => fontFace.toLowerCase()),
	);
}

export function resolveSlidevPptxFontPolicy(policy?: Partial<SlidevPptxFontPolicy>): SlidevPptxFontPolicy {
	const latinFontFace = normalizePptxFontFace(policy?.latinFontFace || PPTX_WRITER_LATIN_FONT_FACE);
	const eastAsiaFontFace = normalizePptxFontFace(policy?.eastAsiaFontFace || PPTX_WRITER_EAST_ASIA_FONT_FACE);
	const monospaceFontFace = normalizePptxFontFace(policy?.monospaceFontFace || PPTX_WRITER_MONOSPACE_FONT_FACE);
	const sourceFontFaceOverrides: Record<string, string> = {};

	for (const [sourceFontFace, targetRole] of Object.entries(DEFAULT_SOURCE_FONT_FACE_OVERRIDES)) {
		sourceFontFaceOverrides[sourceFontFace] = targetRole === 'monospace' ? monospaceFontFace : latinFontFace;
	}
	for (const [sourceFontFace, targetFontFace] of Object.entries(policy?.sourceFontFaceOverrides || {})) {
		const normalizedSourceFontFace = normalizePptxFontFace(sourceFontFace, '');
		const normalizedTargetFontFace = normalizePptxFontFace(targetFontFace, '');
		if (normalizedSourceFontFace && normalizedTargetFontFace) {
			sourceFontFaceOverrides[normalizedSourceFontFace] = normalizedTargetFontFace;
		}
	}

	const presetFaces = builtInFontPresetFaces();
	const selectedFontFaces = [latinFontFace, eastAsiaFontFace, monospaceFontFace];
	const userSystemFontFaces = sortedUnique([
		...(policy?.userSystemFontFaces || []).map((fontFace) => normalizePptxFontFace(fontFace, '')).filter(Boolean),
		...selectedFontFaces.filter((fontFace) => !presetFaces.has(fontFace.toLowerCase())),
	]);

	return {
		latinFontFace,
		eastAsiaFontFace,
		monospaceFontFace,
		sourceFontFaceOverrides,
		userSystemFontFaces,
		embeddingPolicy: 'not-embedded',
	};
}

function overrideTargetFontFace(sourceFontFace: string, policy: SlidevPptxFontPolicy): string | null {
	const normalizedSourceFontFace = sourceFontFace.toLowerCase();
	for (const [candidateSourceFontFace, targetFontFace] of Object.entries(policy.sourceFontFaceOverrides)) {
		if (normalizePptxFontFace(candidateSourceFontFace).toLowerCase() === normalizedSourceFontFace) {
			return normalizePptxFontFace(targetFontFace);
		}
	}
	return null;
}

function sourceFontFaceLooksMonospace(fontFace: string): boolean {
	return /(?:mono|monospace|code|consolas|courier)/i.test(fontFace);
}

function resolvePptxOfficeLatinFontFace(fontFace: string, policy: SlidevPptxFontPolicy): string {
	const normalized = normalizeFontFace(fontFace);
	const override = overrideTargetFontFace(normalized, policy);
	if (override) {
		return override;
	}
	if (sourceFontFaceLooksMonospace(normalized)) {
		return policy.monospaceFontFace;
	}
	if (isCssGenericFontFace(normalized)) {
		return policy.latinFontFace;
	}
	return normalized;
}

export function pptxTextContainsCjk(text: string): boolean {
	return /[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

function pptxTextUsesEastAsiaFont(text: string): boolean {
	return /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef\uac00-\ud7af]/.test(text);
}

export function splitPptxTextIntoOfficeFontRuns(
	text: string,
	fontFace: string,
	policy?: Partial<SlidevPptxFontPolicy>,
): SlidevPptxOfficeTextRun[] {
	const fontPolicy = resolveSlidevPptxFontPolicy(policy);
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
			fontFace: currentUsesEastAsiaFont ? fontPolicy.eastAsiaFontFace : resolvePptxOfficeLatinFontFace(sourceFontFace, fontPolicy),
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

function extractedTextRunsForTableCell(cell: SlidevPptxTableCell): ExtractedTextRun[] {
	const paragraphs = Array.isArray(cell.richTextParagraphs) ? cell.richTextParagraphs : [];
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
	return cell.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => ({
			text: line.trimEnd() || ' ',
			fontFace: normalizeFontFace(cell.fontFace),
		}))
		.filter(hasText);
}

function officeTextRunsForExtractedRun(
	run: ExtractedTextRun,
	policy?: Partial<SlidevPptxFontPolicy>,
): SlidevPptxOfficeTextRun[] {
	return splitPptxTextIntoOfficeFontRuns(run.text, run.fontFace, policy).filter(hasOfficeText);
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

function officeFontRiskReasonsForPolicy(fontFace: string, policy: SlidevPptxFontPolicy): SlidevPptxOfficeFontRiskReason[] {
	if (policy.userSystemFontFaces.some((systemFontFace) => systemFontFace.toLowerCase() === fontFace.toLowerCase())) {
		return ['local-platform-family'];
	}
	return officeFontRiskReasons(fontFace);
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
		tableCellIds: new Set(),
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
	policy: SlidevPptxFontPolicy,
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
	const fallbackRuns = officeTextRunsForExtractedRun(run, policy).filter(
		(officeRun) =>
			officeRun.usesEastAsiaFont &&
			officeRun.fontFace === policy.eastAsiaFontFace &&
			officeRun.sourceFontFace !== policy.eastAsiaFontFace,
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
	policy: SlidevPptxFontPolicy,
): void {
	recordText(accumulators, run, policy, (accumulator) => {
		accumulator.textBoxIds.add(textBoxId);
		accumulator.richTextRunCount += 1;
	});
}

function recordTableCellText(
	accumulators: Map<string, FontUsageAccumulator>,
	run: ExtractedTextRun,
	tableCellId: string,
	policy: SlidevPptxFontPolicy,
): void {
	recordText(accumulators, run, policy, (accumulator) => {
		accumulator.tableCellIds.add(tableCellId);
		accumulator.richTextRunCount += 1;
	});
}

function usageFromAccumulator(accumulator: FontUsageAccumulator): SlidevPptxFontUsage {
	const riskReasons = Array.from(accumulator.officeMissingFontRiskReasons).sort();
	return {
		fontFace: accumulator.fontFace,
		textBoxCount: accumulator.textBoxIds.size,
		richTextRunCount: accumulator.richTextRunCount,
		tableCellCount: accumulator.tableCellIds.size,
		characterCount: accumulator.characterCount,
		cjkCharacterCount: accumulator.cjkCharacterCount,
		latinCharacterCount: accumulator.latinCharacterCount,
		writerEastAsiaFallbackRunCount: accumulator.writerEastAsiaFallbackRunCount,
		writerEastAsiaFallbackCharacterCount: accumulator.writerEastAsiaFallbackCharacterCount,
		officeMissingFontRisk: riskReasons.length > 0,
		officeMissingFontRiskReasons: riskReasons,
	};
}

function collectFontUsages(slides: SlidevPptxSlide[], policy: SlidevPptxFontPolicy): SlidevPptxFontUsage[] {
	const accumulators = new Map<string, FontUsageAccumulator>();
	for (const slide of slides) {
		for (let textBoxIndex = 0; textBoxIndex < slide.texts.length; textBoxIndex += 1) {
			const textBox = slide.texts[textBoxIndex];
			const textBoxId = `${slide.slideNumber}:${textBoxIndex}`;
			for (const run of extractedTextRunsForTextBox(textBox)) {
				recordTextBoxRun(accumulators, run, textBoxId, policy);
			}
		}
		for (let tableIndex = 0; tableIndex < slide.tables.length; tableIndex += 1) {
			const table = slide.tables[tableIndex];
			for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
				const row = table.rows[rowIndex];
				for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
					const tableCellId = `${slide.slideNumber}:${tableIndex}:${rowIndex}:${cellIndex}`;
					for (const run of extractedTextRunsForTableCell(row[cellIndex])) {
						recordTableCellText(accumulators, run, tableCellId, policy);
					}
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
	policy: SlidevPptxFontPolicy,
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
		run.fontFace === policy.eastAsiaFontFace &&
		run.sourceFontFace !== policy.eastAsiaFontFace
	) {
		accumulator.eastAsiaFallbackRunCount += 1;
		accumulator.eastAsiaFallbackCharacterCount += cjkCharacterCount;
	}
}

function collectOfficeFontUsages(slides: SlidevPptxSlide[], policy: SlidevPptxFontPolicy): OfficeFontAccumulator[] {
	const accumulators = new Map<string, OfficeFontAccumulator>();
	for (const slide of slides) {
		for (const textBox of slide.texts) {
			for (const run of extractedTextRunsForTextBox(textBox)) {
				for (const officeRun of officeTextRunsForExtractedRun(run, policy)) {
					recordOfficeTextRun(accumulators, officeRun, policy);
				}
			}
		}
		for (const table of slide.tables) {
			for (const row of table.rows) {
				for (const cell of row) {
					for (const run of extractedTextRunsForTableCell(cell)) {
						const officeRuns = officeTextRunsForExtractedRun(run, policy);
						for (const officeRun of officeRuns) {
							recordOfficeTextRun(accumulators, officeRun, policy);
						}
					}
				}
			}
		}
	}
	return Array.from(accumulators.values()).sort((left, right) => left.fontFace.localeCompare(right.fontFace));
}

export function buildSlidevPptxFontContractSummary(
	slides: SlidevPptxSlide[],
	policy?: Partial<SlidevPptxFontPolicy>,
): SlidevPptxFontContractSummary {
	const fontPolicy = resolveSlidevPptxFontPolicy(policy);
	const fontUsages = collectFontUsages(slides, fontPolicy);
	const officeFontUsages = collectOfficeFontUsages(slides, fontPolicy);
	const fontFamilies = fontUsages.map((usage) => usage.fontFace);
	const cjkFontFamilies = fontUsages.filter((usage) => usage.cjkCharacterCount > 0).map((usage) => usage.fontFace);
	const latinFontFamilies = fontUsages.filter((usage) => usage.latinCharacterCount > 0).map((usage) => usage.fontFace);
	const writerEastAsiaFallbackFontFamilies = fontUsages
		.filter((usage) => usage.writerEastAsiaFallbackRunCount > 0)
		.map((usage) => usage.fontFace);
	const officeMissingFontRiskFamilies = fontUsages
		.filter((usage) => usage.officeMissingFontRisk)
		.map((usage) => usage.fontFace);
	const officeOutputMissingFontRiskFamilies = officeFontUsages
		.filter((usage) => officeFontRiskReasonsForPolicy(usage.fontFace, fontPolicy).length > 0)
		.map((usage) => usage.fontFace);

	return {
		fontFamilyCount: fontFamilies.length,
		fontFamilies,
		cjkFontFamilies,
		latinFontFamilies,
		writerEastAsiaFontFace: fontPolicy.eastAsiaFontFace,
		writerEastAsiaFallbackFontFamilies,
		fontSelectionPolicy: fontPolicy,
		selectedLatinFontFace: fontPolicy.latinFontFace,
		selectedEastAsiaFontFace: fontPolicy.eastAsiaFontFace,
		selectedMonospaceFontFace: fontPolicy.monospaceFontFace,
		userSystemFontFamilies: fontPolicy.userSystemFontFaces,
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
		officeOutputMissingFontRiskFamilies,
		fontUsages,
		fontEmbeddingPolicy: fontPolicy.embeddingPolicy,
		embeddedFontCount: 0,
		embeddedFontFamilies: [],
	};
}

export function fontFamiliesForSlideSummary(
	slide: SlidevPptxSlide,
	policy?: Partial<SlidevPptxFontPolicy>,
): Pick<
	SlidevPptxSlideEditabilitySummary,
	'fontFamilies' | 'cjkFontFamilies' | 'writerEastAsiaFallbackFontFamilies' | 'officeMissingFontRiskFamilies'
> {
	const summary = buildSlidevPptxFontContractSummary([slide], policy);
	return {
		fontFamilies: sortedUnique(summary.fontFamilies),
		cjkFontFamilies: sortedUnique(summary.cjkFontFamilies),
		writerEastAsiaFallbackFontFamilies: sortedUnique(summary.writerEastAsiaFallbackFontFamilies),
		officeMissingFontRiskFamilies: sortedUnique(summary.officeMissingFontRiskFamilies),
	};
}
