import { buildSlidevPptxExportReport } from '../slideExport/pptxExporter';
import { PPTX_SLIDE_HEIGHT_IN, PPTX_SLIDE_WIDTH_IN, type SlidevPptxSlide } from '../slideExport/pptxModel';

jest.mock('obsidian', () => ({
	Platform: { isDesktopApp: true },
}));

describe('pptx export report', () => {
	test('summarizes editable primitives, consumed table text, and fallback-only visual kinds', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Architecture',
				backgroundColor: 'FFFFFF',
				backgroundImage: {
					data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
					mimeType: 'image/png',
					x: 0,
					y: 0,
					w: PPTX_SLIDE_WIDTH_IN,
					h: PPTX_SLIDE_HEIGHT_IN,
					name: 'Fallback',
					order: 0,
				},
				texts: [
					{
						text: 'Architecture overview',
						x: 1,
						y: 1,
						w: 5,
						h: 1,
						fontSize: 24,
						fontFace: 'Aptos',
						color: '111827',
						bold: true,
						italic: false,
						underline: false,
						align: 'left',
						bullet: false,
						order: 10,
						richTextParagraphs: [
							{
								runs: [
									{
										text: 'Architecture ',
										fontSize: 24,
										fontFace: 'Aptos',
										color: '111827',
										bold: true,
										italic: false,
										underline: false,
										code: false,
										link: false,
									},
									{
										text: 'overview',
										fontSize: 24,
										fontFace: 'Inter',
										color: '2563EB',
										bold: true,
										italic: false,
										underline: true,
										code: false,
										link: true,
									},
								],
							},
						],
						unmodeledRunReasons: ['inline-formatting', 'link'],
					},
				],
				tables: [
					{
						x: 1,
						y: 2,
						w: 4,
						h: 1,
						colWidths: [2, 2],
						rowHeights: [1],
						order: 20,
						rows: [
							[
								{
									text: '决策',
									rowSpan: 1,
									colSpan: 1,
									fontSize: 12,
									fontFace: 'Noto Sans CJK SC',
									color: '111827',
									bold: false,
									italic: false,
									underline: false,
									align: 'left',
									verticalAlign: 'top',
									fillColor: null,
									borderColor: null,
									borderWidthPt: 0,
								},
								{
									text: 'Risk',
									rowSpan: 1,
									colSpan: 1,
									fontSize: 12,
									fontFace: 'Aptos',
									color: '111827',
									bold: false,
									italic: false,
									underline: false,
									align: 'left',
									verticalAlign: 'top',
									fillColor: null,
									borderColor: null,
									borderWidthPt: 0,
								},
							],
						],
					},
				],
				fallbackOnlyElementKinds: ['mermaid', 'svg'],
				consumedTableTextCandidateCount: 2,
				warnings: [],
			},
			{
				slideNumber: 2,
				title: 'Diagram',
				backgroundColor: 'FFFFFF',
				texts: [],
				tables: [],
				fallbackOnlyElementKinds: ['canvas'],
				consumedTableTextCandidateCount: 0,
				warnings: ['Slide 2 has no extracted editable text.'],
			},
		];

		const report = buildSlidevPptxExportReport(
			'/vault/export/deck/index.html',
			'/vault/deck.md',
			'/vault/export/deck.pptx',
			'/vault/export/deck.pptx.report.json',
			slides,
		);

		expect(report.textBoxCount).toBe(1);
		expect(report.tableCount).toBe(1);
		expect(report.consumedTableCount).toBe(1);
		expect(report.consumedTableTextCandidateCount).toBe(2);
		expect(report.richTextBoxCount).toBe(1);
		expect(report.richTextRunCount).toBe(2);
		expect(report.editableTableCellCount).toBe(2);
		expect(report.fallbackOnlyElementKinds).toEqual(['canvas', 'mermaid', 'svg']);
		expect(report.unmodeledTextRunReasons).toEqual(['inline-formatting', 'link']);
		expect(report.editablePrimitiveCoverage.editableTextSlideRatio).toBe(0.5);
		expect(report.editablePrimitiveCoverage.richTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage.richTextBoxRatio).toBe(1);
		expect(report.editablePrimitiveCoverage.richTextRunCount).toBe(2);
		expect(report.editablePrimitiveCoverage.richTextRunCharacterCount).toBe('Architecture overview'.length);
		expect(report.editablePrimitiveCoverage.backgroundFallbackSlideRatio).toBe(0.5);
		expect(report.fontContract).toEqual(
			expect.objectContaining({
				fontFamilyCount: 3,
				fontFamilies: ['Aptos', 'Inter', 'Noto Sans CJK SC'],
				cjkFontFamilies: ['Noto Sans CJK SC'],
				latinFontFamilies: ['Aptos', 'Inter'],
				writerEastAsiaFontFace: 'Microsoft YaHei',
				writerEastAsiaFallbackFontFamilies: ['Noto Sans CJK SC'],
				officeMissingFontRiskCount: 2,
				officeMissingFontRiskFamilies: ['Inter', 'Noto Sans CJK SC'],
				fontEmbeddingPolicy: 'not-embedded',
				embeddedFontCount: 0,
				embeddedFontFamilies: [],
			}),
		);
		expect(report.fontContract.fontUsages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					fontFace: 'Inter',
					officeMissingFontRisk: true,
					officeMissingFontRiskReasons: ['non-office-family'],
				}),
				expect.objectContaining({
					fontFace: 'Noto Sans CJK SC',
					cjkCharacterCount: 2,
					writerEastAsiaFallbackRunCount: 1,
					writerEastAsiaFallbackCharacterCount: 2,
					officeMissingFontRiskReasons: ['non-office-family'],
				}),
			]),
		);
		expect(report.slides[0]).toEqual(
			expect.objectContaining({
				slideNumber: 1,
				editableTextBoxCount: 1,
				editableTableCount: 1,
				editableTableCellCount: 2,
				richTextBoxCount: 1,
				richTextRunCount: 2,
				fontFamilies: ['Aptos', 'Inter', 'Noto Sans CJK SC'],
				cjkFontFamilies: ['Noto Sans CJK SC'],
				writerEastAsiaFallbackFontFamilies: ['Noto Sans CJK SC'],
				officeMissingFontRiskFamilies: ['Inter', 'Noto Sans CJK SC'],
				consumedTableTextCandidateCount: 2,
			}),
		);
		expect(report.slides[1].warnings).toEqual(['Slide 2 has no extracted editable text.']);
	});
});
