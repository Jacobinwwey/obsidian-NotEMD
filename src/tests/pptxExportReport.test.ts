import { buildSlidevPptxExportReport, buildSlidevVisibleNativePptxExperimentReport } from '../slideExport/pptxExporter';
import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxSlide,
	type SlidevPptxTextBox,
	type SlidevPptxTextSourceKind,
} from '../slideExport/pptxModel';

jest.mock('obsidian', () => ({
	Platform: { isDesktopApp: true },
}));

function editableTextBoxForReport(text: string, sourceKind?: SlidevPptxTextSourceKind): SlidevPptxTextBox {
	return {
		text,
		sourceKind,
		x: 1,
		y: 1,
		w: 4,
		h: 0.5,
		fontSize: 14,
		fontFace: 'Aptos',
		color: '111827',
		bold: false,
		italic: false,
		underline: false,
		align: 'left',
		bullet: false,
		order: 10,
		richTextParagraphs: [
			{
				runs: [
					{
						text,
						fontSize: 14,
						fontFace: 'Aptos',
						color: '111827',
						bold: false,
						italic: false,
						underline: false,
						code: sourceKind === 'code',
						link: false,
					},
				],
			},
		],
		unmodeledRunReasons: [],
	};
}

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
		expect(report.editableLayerContract).toEqual({
			visualFidelityStrategy: 'frozen-background-first',
			visibleTextSource: 'background-image',
			editableTextShapeFill: 'transparent',
			editableTableTextFill: 'transparent',
			backgroundTextPolicy: 'preserve-rendered-text',
			textSelectionSurface: 'named-transparent-shapes',
			mermaidSvgVisualPolicy: 'background-image',
			mermaidSvgTextPolicy: 'transparent-editable-label-overlays',
			officeNativeMermaidSvgElementEditability: 'not-claimed',
			fontPortabilityPolicy: 'report-only-no-default-font-embedding',
		});
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

	test('reports editable text boxes by source kind', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Source kinds',
				backgroundColor: 'FFFFFF',
				texts: [
					editableTextBoxForReport('Body text'),
					editableTextBoxForReport('const value = 1;', 'code'),
					editableTextBoxForReport('Graph edge label', 'mermaid-text'),
					editableTextBoxForReport('SVG legend', 'svg-text'),
					editableTextBoxForReport('Table cell overlay', 'table-cell-overlay'),
				],
				tables: [],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: [],
			},
			{
				slideNumber: 2,
				title: 'More code',
				backgroundColor: 'FFFFFF',
				texts: [editableTextBoxForReport('pnpm build', 'code')],
				tables: [],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: [],
			},
		];

		const report = buildSlidevPptxExportReport(
			'/vault/export/deck/index.html',
			'/vault/deck.md',
			'/vault/export/deck.pptx',
			'/vault/export/deck.pptx.report.json',
			slides,
		);

		expect(report.editableBodyTextBoxCount).toBe(1);
		expect(report.editableCodeTextBoxCount).toBe(2);
		expect(report.editableMermaidTextBoxCount).toBe(1);
		expect(report.editableSvgTextBoxCount).toBe(1);
		expect(report.editableTableCellOverlayTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage).toEqual(
			expect.objectContaining({
				editableBodyTextBoxCount: 1,
				editableCodeTextBoxCount: 2,
				editableMermaidTextBoxCount: 1,
				editableSvgTextBoxCount: 1,
				editableTableCellOverlayTextBoxCount: 1,
			}),
		);
		expect(report.textSourceCoverage).toEqual([
			{
				sourceKind: 'body',
				slideCount: 1,
				textBoxCount: 1,
				textLineCount: 1,
				characterCount: 'Body text'.length,
				richTextParagraphCount: 1,
				richTextRunCount: 1,
			},
			{
				sourceKind: 'code',
				slideCount: 2,
				textBoxCount: 2,
				textLineCount: 2,
				characterCount: 'const value = 1;'.length + 'pnpm build'.length,
				richTextParagraphCount: 2,
				richTextRunCount: 2,
			},
			{
				sourceKind: 'mermaid-text',
				slideCount: 1,
				textBoxCount: 1,
				textLineCount: 1,
				characterCount: 'Graph edge label'.length,
				richTextParagraphCount: 1,
				richTextRunCount: 1,
			},
			{
				sourceKind: 'svg-text',
				slideCount: 1,
				textBoxCount: 1,
				textLineCount: 1,
				characterCount: 'SVG legend'.length,
				richTextParagraphCount: 1,
				richTextRunCount: 1,
			},
			{
				sourceKind: 'table-cell-overlay',
				slideCount: 1,
				textBoxCount: 1,
				textLineCount: 1,
				characterCount: 'Table cell overlay'.length,
				richTextParagraphCount: 1,
				richTextRunCount: 1,
			},
		]);
		expect(report.editablePrimitiveCoverage.textSourceCoverage).toEqual(report.textSourceCoverage);
		expect(report.slides[0]).toEqual(
			expect.objectContaining({
				editableBodyTextBoxCount: 1,
				editableCodeTextBoxCount: 1,
				editableMermaidTextBoxCount: 1,
				editableSvgTextBoxCount: 1,
				editableTableCellOverlayTextBoxCount: 1,
			}),
		);
		expect(report.slides[0].textSourceCoverage).toEqual([
			expect.objectContaining({ sourceKind: 'body', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
			expect.objectContaining({ sourceKind: 'code', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
			expect.objectContaining({ sourceKind: 'mermaid-text', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
			expect.objectContaining({ sourceKind: 'svg-text', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
			expect.objectContaining({
				sourceKind: 'table-cell-overlay',
				slideCount: 1,
				textBoxCount: 1,
				richTextRunCount: 1,
			}),
		]);
		expect(report.slides[1]).toEqual(
			expect.objectContaining({
				editableBodyTextBoxCount: 0,
				editableCodeTextBoxCount: 1,
				editableMermaidTextBoxCount: 0,
				editableSvgTextBoxCount: 0,
				editableTableCellOverlayTextBoxCount: 0,
			}),
		);
		expect(report.slides[1].textSourceCoverage).toEqual([
			expect.objectContaining({
				sourceKind: 'code',
				slideCount: 1,
				textBoxCount: 1,
				textLineCount: 1,
				characterCount: 'pnpm build'.length,
				richTextParagraphCount: 1,
				richTextRunCount: 1,
			}),
		]);
	});

	test('reports Office emitted font runs for mixed Latin and CJK text', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Mixed script',
				backgroundColor: 'FFFFFF',
				texts: [
					{
						text: 'API 架构 v2',
						x: 1,
						y: 1,
						w: 5,
						h: 1,
						fontSize: 18,
						fontFace: 'Avenir Next',
						color: '111827',
						bold: false,
						italic: false,
						underline: false,
						align: 'left',
						bullet: false,
						order: 10,
						richTextParagraphs: [
							{
								runs: [
									{
										text: 'API 架构 v2',
										fontSize: 18,
										fontFace: 'Avenir Next',
										color: '111827',
										bold: false,
										italic: false,
										underline: false,
										code: false,
										link: false,
									},
								],
							},
						],
						unmodeledRunReasons: [],
					},
				],
				tables: [],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: [],
			},
		];

		const report = buildSlidevPptxExportReport(
			'/vault/export/deck/index.html',
			'/vault/deck.md',
			'/vault/export/deck.pptx',
			'/vault/export/deck.pptx.report.json',
			slides,
		);

		expect(report.richTextRunCount).toBe(1);
		expect(report.fontContract).toEqual(
			expect.objectContaining({
				fontFamilies: ['Avenir Next'],
				cjkFontFamilies: ['Avenir Next'],
				writerEastAsiaFallbackFontFamilies: ['Avenir Next'],
				officeFontFamilies: ['Avenir Next', 'Microsoft YaHei'],
				officeCjkFontFamilies: ['Microsoft YaHei'],
				officeLatinFontFamilies: ['Avenir Next'],
				officeTextRunCount: 3,
				officeEastAsiaFallbackRunCount: 1,
				officeEastAsiaFallbackCharacterCount: 2,
			}),
		);
		expect(report.fontContract.fontUsages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					fontFace: 'Avenir Next',
					writerEastAsiaFallbackRunCount: 1,
					writerEastAsiaFallbackCharacterCount: 2,
				}),
			]),
		);
	});

	test('reports visible-native experiment contract and residue sampling separately from the default contract', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Visible native',
				backgroundColor: 'FFFFFF',
				backgroundImage: {
					data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
					mimeType: 'image/png',
					x: 0,
					y: 0,
					w: PPTX_SLIDE_WIDTH_IN,
					h: PPTX_SLIDE_HEIGHT_IN,
					name: 'Residual background',
					order: 0,
				},
				texts: [
					{
						text: 'Native visible text',
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
						richTextParagraphs: [],
						unmodeledRunReasons: [],
					},
				],
				tables: [],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: ['Slide 1 visible-native background residue sampling is suspicious (1 region(s), max ratio 0.2).'],
			},
		];

		const report = buildSlidevVisibleNativePptxExperimentReport(
			'/vault/export/deck/index.html',
			'/vault/deck.md',
			'/vault/export/deck.visible-native-experiment.pptx',
			'/vault/export/deck.visible-native-experiment.pptx.report.json',
			slides,
			{
				slideCount: 1,
				sampledSlideCount: 1,
				suspiciousSlideCount: 1,
				checkedRegionCount: 3,
				suspiciousRegionCount: 1,
				maxTextLikePixelRatio: 0.2,
				threshold: {
					colorDistance: 62,
					textLikePixelRatio: 0.075,
					minTextLikePixels: 8,
				},
				slides: [
					{
						slideNumber: 1,
						sampledTextBoxCount: 3,
						sampledTableCellCount: 0,
						checkedRegionCount: 3,
						suspiciousRegionCount: 1,
						maxTextLikePixelRatio: 0.2,
						suspicious: true,
					},
				],
			},
		);

		expect(report.visibleTextLayer).toBe('native-text-experiment');
		expect(report.editableLayerRenderMode).toBe('visible-native-experiment');
		expect(report.editableLayerContract).toEqual(
			expect.objectContaining({
				visualFidelityStrategy: 'visible-native-experiment',
				visibleTextSource: 'native-text',
				editableTextShapeFill: 'visible',
				editableTableTextFill: 'visible',
				backgroundTextPolicy: 'hide-extracted-text-before-capture',
				textSelectionSurface: 'visible-native-text',
				mermaidSvgVisualPolicy: 'background-image',
				mermaidSvgTextPolicy: 'transparent-editable-label-overlays',
				officeNativeMermaidSvgElementEditability: 'not-claimed',
			}),
		);
		expect(report.visibleNativeExperiment).toEqual(
			expect.objectContaining({
				status: 'experimental',
				nativeLayer: 'visible-text-and-table',
				backgroundCapture: 'after-extracted-dom-hidden',
				visualReference: 'default-frozen-background-required',
			}),
		);
		expect(report.visibleNativeExperiment?.residueSampling).toEqual(
			expect.objectContaining({
				slideCount: 1,
				sampledSlideCount: 1,
				suspiciousSlideCount: 1,
				checkedRegionCount: 3,
				suspiciousRegionCount: 1,
				maxTextLikePixelRatio: 0.2,
			}),
		);
		expect(report.warnings[0]).toContain('Visible-native PPTX is experimental');
		expect(report.warnings[1]).toContain('residue sampling is suspicious');
	});
});
