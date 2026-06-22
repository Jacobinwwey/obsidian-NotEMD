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
						lineSpacingPt: 28,
						paragraphSpacingBeforePt: 6,
						paragraphSpacingAfterPt: 10,
						paddingLeftIn: 0.1,
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
										hyperlinkTarget: 'https://example.com/architecture',
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
									lineSpacingPt: 18,
									paddingLeftIn: 0.1,
									paddingRightIn: 0.1,
									paddingTopIn: 0.05,
									paddingBottomIn: 0.05,
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
				shapes: [
					{
						sourceKind: 'code-background',
						x: 1,
						y: 3.25,
						w: 4,
						h: 0.6,
						fillColor: '0F172A',
						order: 25,
					},
					{
						sourceKind: 'decorative-rectangle',
						x: 5.25,
						y: 3.25,
						w: 2,
						h: 0.6,
						fillColor: 'E0F2FE',
						order: 26,
					},
					{
						sourceKind: 'decorative-line',
						x: 1,
						y: 4,
						w: 6,
						h: 0.04,
						fillColor: '64748B',
						order: 27,
					},
				],
				decorativePrimitiveDiagnostics: {
					candidateCount: 5,
					acceptedCount: 2,
					skippedCount: 3,
					skipReasonCounts: [
						{ reason: 'oversized', count: 1 },
						{ reason: 'unsupported-paint', count: 2 },
					],
				},
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
		expect(report.editableSolidRectangleCount).toBe(3);
		expect(report.editableCodeBackgroundRectangleCount).toBe(1);
		expect(report.editableDecorativeRectangleCount).toBe(1);
		expect(report.editableDecorativeLineCount).toBe(1);
		expect(report.decorativePrimitiveCandidateCount).toBe(5);
		expect(report.decorativePrimitiveAcceptedCount).toBe(2);
		expect(report.decorativePrimitiveSkippedCount).toBe(3);
		expect(report.decorativePrimitiveSkipReasonCounts).toEqual([
			{ reason: 'oversized', count: 1 },
			{ reason: 'unsupported-paint', count: 2 },
		]);
		expect(report.richTextBoxCount).toBe(1);
		expect(report.richTextRunCount).toBe(2);
		expect(report.hyperlinkRunCount).toBe(1);
		expect(report.hyperlinkTargetCount).toBe(1);
		expect(report.lineSpacingTextBoxCount).toBe(1);
		expect(report.paragraphSpacingTextBoxCount).toBe(1);
		expect(report.bodyInsetTextBoxCount).toBe(1);
		expect(report.bulletedTextBoxCount).toBe(0);
		expect(report.editableTableCellCount).toBe(2);
		expect(report.lineSpacingTableCellCount).toBe(1);
		expect(report.bodyInsetTableCellCount).toBe(1);
		expect(report.fallbackOnlyElementKinds).toEqual(['canvas', 'mermaid', 'svg']);
		expect(report.unmodeledTextRunReasons).toEqual(['inline-formatting', 'link']);
		expect(report.editablePrimitiveCoverage.editableTextSlideRatio).toBe(0.5);
		expect(report.editablePrimitiveCoverage.editableSolidRectangleCount).toBe(3);
		expect(report.editablePrimitiveCoverage.editableCodeBackgroundRectangleCount).toBe(1);
		expect(report.editablePrimitiveCoverage.editableDecorativeRectangleCount).toBe(1);
		expect(report.editablePrimitiveCoverage.editableDecorativeLineCount).toBe(1);
		expect(report.editablePrimitiveCoverage.decorativePrimitiveCandidateCount).toBe(5);
		expect(report.editablePrimitiveCoverage.decorativePrimitiveAcceptedCount).toBe(2);
		expect(report.editablePrimitiveCoverage.decorativePrimitiveSkippedCount).toBe(3);
		expect(report.editablePrimitiveCoverage.decorativePrimitiveSkipReasonCounts).toEqual([
			{ reason: 'oversized', count: 1 },
			{ reason: 'unsupported-paint', count: 2 },
		]);
		expect(report.editablePrimitiveCoverage.richTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage.richTextBoxRatio).toBe(1);
		expect(report.editablePrimitiveCoverage.richTextRunCount).toBe(2);
		expect(report.editablePrimitiveCoverage.richTextRunCharacterCount).toBe('Architecture overview'.length);
		expect(report.editablePrimitiveCoverage.hyperlinkRunCount).toBe(1);
		expect(report.editablePrimitiveCoverage.hyperlinkTargetCount).toBe(1);
		expect(report.editablePrimitiveCoverage.lineSpacingTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage.paragraphSpacingTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage.bodyInsetTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage.bulletedTextBoxCount).toBe(0);
		expect(report.editablePrimitiveCoverage.lineSpacingTableCellCount).toBe(1);
		expect(report.editablePrimitiveCoverage.bodyInsetTableCellCount).toBe(1);
		expect(report.editablePrimitiveCoverage.backgroundFallbackSlideRatio).toBe(0.5);
		expect(report.editableLayerContract).toEqual({
			visualFidelityStrategy: 'frozen-background-first',
			visibleTextSource: 'native-text-and-background-image',
			editableTextShapeFill: 'visible',
			editableTableTextFill: 'visible',
			editableTableCellOverlayTextFill: 'visible',
			backgroundTextPolicy: 'hide-modeled-text-before-capture',
			textSelectionSurface: 'visible-native-text',
			selectableNativeTextSources: ['body', 'code', 'svg-text', 'table-cell-overlay'],
			visibleNativeTextSources: ['body', 'code', 'svg-text', 'table-cell-overlay'],
			transparentOverlayTextSources: [],
			backgroundHiddenTextSources: ['body', 'code', 'svg-text', 'table-cell-overlay'],
			backgroundPreservedTextSources: ['mermaid-text'],
			mermaidSvgVisualPolicy: 'background-image',
			mermaidSvgTextPolicy: 'background-image-only',
			officeNativeMermaidSvgElementEditability: 'not-claimed',
			fontPortabilityPolicy: 'report-only-no-default-font-embedding',
		});
		expect(report.visibleTextLayer).toBe('native-text-and-background-image');
		expect(report.editableLayerRenderMode).toBe('visible-native-text');
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
				hyperlinkRunCount: 1,
				hyperlinkTargetCount: 1,
				lineSpacingTableCellCount: 1,
				bodyInsetTableCellCount: 1,
				fontFamilies: ['Aptos', 'Inter', 'Noto Sans CJK SC'],
				cjkFontFamilies: ['Noto Sans CJK SC'],
				writerEastAsiaFallbackFontFamilies: ['Noto Sans CJK SC'],
				officeMissingFontRiskFamilies: ['Inter', 'Noto Sans CJK SC'],
				decorativePrimitiveCandidateCount: 5,
				decorativePrimitiveAcceptedCount: 2,
				decorativePrimitiveSkippedCount: 3,
				decorativePrimitiveSkipReasonCounts: [
					{ reason: 'oversized', count: 1 },
					{ reason: 'unsupported-paint', count: 2 },
				],
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
		expect(report.editableMermaidTextBoxCount).toBe(0);
		expect(report.editableSvgTextBoxCount).toBe(1);
		expect(report.editableTableCellOverlayTextBoxCount).toBe(1);
		expect(report.editablePrimitiveCoverage).toEqual(
			expect.objectContaining({
				editableBodyTextBoxCount: 1,
				editableCodeTextBoxCount: 2,
				editableMermaidTextBoxCount: 0,
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
				editableMermaidTextBoxCount: 0,
				editableSvgTextBoxCount: 1,
				editableTableCellOverlayTextBoxCount: 1,
			}),
		);
		expect(report.slides[0].textSourceCoverage).toEqual([
			expect.objectContaining({ sourceKind: 'body', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
			expect.objectContaining({ sourceKind: 'code', slideCount: 1, textBoxCount: 1, richTextRunCount: 1 }),
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

	test('reports table border models and measured cell text inset drift', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Collapsed table',
				backgroundColor: 'FFFFFF',
				texts: [],
				tables: [
					{
						x: 1,
						y: 1,
						w: 4,
						h: 0.8,
						colWidths: [4],
						rowHeights: [0.8],
						borderModel: 'collapsed',
						order: 10,
						rows: [
							[
								{
									text: 'Measured drift',
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
									paddingLeftIn: 0.1,
									paddingRightIn: 0.1,
									paddingTopIn: 0.05,
									paddingBottomIn: 0.05,
									textLeftInsetIn: 0.13,
									textRightInsetIn: 0.16,
									textTopInsetIn: 0.08,
									textBottomInsetIn: 0.08,
								},
							],
						],
					},
				],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: [],
			},
			{
				slideNumber: 2,
				title: 'Separate table',
				backgroundColor: 'FFFFFF',
				texts: [],
				tables: [
					{
						x: 1,
						y: 1,
						w: 4,
						h: 0.8,
						colWidths: [4],
						rowHeights: [0.8],
						borderModel: 'separate',
						borderSpacingXIn: 0.12,
						borderSpacingYIn: 0.14,
						order: 10,
						rows: [
							[
								{
									text: 'Matched inset',
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
									paddingLeftIn: 0.08,
									paddingRightIn: 0.08,
									paddingTopIn: 0.04,
									paddingBottomIn: 0.04,
									textLeftInsetIn: 0.08,
									textRightInsetIn: 0.08,
									textTopInsetIn: 0.04,
									textBottomInsetIn: 0.04,
								},
							],
						],
					},
				],
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

		expect(report).toEqual(
			expect.objectContaining({
				collapsedTableBorderModelCount: 1,
				separateTableBorderModelCount: 1,
				tableCellTextInsetCount: 2,
				tableCellTextInsetDeltaCount: 0,
				maxTableCellTextInsetDeltaIn: 0,
			}),
		);
		expect(report.editablePrimitiveCoverage).toEqual(
			expect.objectContaining({
				collapsedTableBorderModelCount: 1,
				separateTableBorderModelCount: 1,
				tableCellTextInsetCount: 2,
				tableCellTextInsetDeltaCount: 0,
				maxTableCellTextInsetDeltaIn: 0,
			}),
		);
		expect(report.slides[0]).toEqual(
			expect.objectContaining({
				collapsedTableBorderModelCount: 1,
				separateTableBorderModelCount: 0,
				tableCellTextInsetCount: 1,
				tableCellTextInsetDeltaCount: 0,
				maxTableCellTextInsetDeltaIn: 0,
			}),
		);
		expect(report.slides[1]).toEqual(
			expect.objectContaining({
				collapsedTableBorderModelCount: 0,
				separateTableBorderModelCount: 1,
				tableCellTextInsetCount: 1,
				tableCellTextInsetDeltaCount: 0,
				maxTableCellTextInsetDeltaIn: 0,
			}),
		);
	});

	test('reports only text boxes emitted by the default PPTX writer as editable', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Native table owns cell text',
				backgroundColor: 'FFFFFF',
				texts: [
					editableTextBoxForReport('Table overlay candidate', 'table-cell-overlay'),
					editableTextBoxForReport('Mermaid candidate', 'mermaid-text'),
				],
				tables: [
					{
						x: 1,
						y: 1,
						w: 3,
						h: 0.6,
						colWidths: [3],
						rowHeights: [0.6],
						order: 20,
						rows: [
							[
								{
									text: 'Visible native table cell',
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
				fallbackOnlyElementKinds: ['mermaid'],
				consumedTableTextCandidateCount: 1,
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

		expect(report.textBoxCount).toBe(0);
		expect(report.editableMermaidTextBoxCount).toBe(0);
		expect(report.editableTableCellOverlayTextBoxCount).toBe(0);
		expect(report.editableTableCellCount).toBe(1);
		expect(report.textSourceCoverage).toEqual([]);
		expect(report.slides[0]).toEqual(
			expect.objectContaining({
				editableTextBoxCount: 0,
				editableMermaidTextBoxCount: 0,
				editableTableCellOverlayTextBoxCount: 0,
				editableTableCellCount: 1,
			}),
		);
	});

	test('reports default visible-native background residue sampling', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Residue check',
				backgroundColor: 'FFFFFF',
				texts: [editableTextBoxForReport('Visible native text', 'body')],
				tables: [],
				fallbackOnlyElementKinds: [],
				consumedTableTextCandidateCount: 0,
				warnings: [
					'Slide 1 default visible-native background residue sampling is suspicious after 3 attempts (1 region(s), max ratio 0.2).',
				],
			},
		];

		const report = buildSlidevPptxExportReport(
			'/vault/export/deck/index.html',
			'/vault/deck.md',
			'/vault/export/deck.pptx',
			'/vault/export/deck.pptx.report.json',
			slides,
			{
				status: 'verified',
				nativeLayer: 'visible-text-and-table',
				backgroundCapture: 'after-modeled-dom-hidden',
				residueSampling: {
					slideCount: 1,
					sampledSlideCount: 1,
					suspiciousSlideCount: 1,
					checkedRegionCount: 1,
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
							sampledTextBoxCount: 1,
							sampledTableCellCount: 0,
							checkedRegionCount: 1,
							suspiciousRegionCount: 1,
							maxTextLikePixelRatio: 0.2,
							suspicious: true,
						},
					],
				},
				warnings: [
					'Slide 1 default visible-native background residue sampling is suspicious after 3 attempts (1 region(s), max ratio 0.2).',
				],
			},
		);

		expect(report.visibleNativeBackgroundCapture).toEqual(
			expect.objectContaining({
				status: 'verified',
				nativeLayer: 'visible-text-and-table',
				backgroundCapture: 'after-modeled-dom-hidden',
			}),
		);
		expect(report.visibleNativeBackgroundCapture?.residueSampling).toEqual(
			expect.objectContaining({
				slideCount: 1,
				sampledSlideCount: 1,
				suspiciousSlideCount: 1,
				checkedRegionCount: 1,
				suspiciousRegionCount: 1,
				maxTextLikePixelRatio: 0.2,
			}),
		);
		expect(report.warnings[0]).toContain('default visible-native background residue sampling is suspicious');
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
				officeFontFamilies: ['Microsoft YaHei', 'Noto Sans'],
				officeCjkFontFamilies: ['Microsoft YaHei'],
				officeLatinFontFamilies: ['Noto Sans'],
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

	test('reports selected PPTX font policy without claiming default font embedding', () => {
		const slides: SlidevPptxSlide[] = [
			{
				slideNumber: 1,
				title: 'Custom fonts',
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
					{
						text: 'const ok = true;',
						sourceKind: 'code',
						x: 1,
						y: 2,
						w: 5,
						h: 0.5,
						fontSize: 14,
						fontFace: 'Fira Code',
						color: '111827',
						bold: false,
						italic: false,
						underline: false,
						align: 'left',
						bullet: false,
						order: 20,
						richTextParagraphs: [],
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
			undefined,
			'default-emitted-text',
			{
				latinFontFace: 'Aptos',
				eastAsiaFontFace: 'Noto Sans CJK SC',
				monospaceFontFace: 'JetBrains Mono',
			},
		);

		expect(report.fontContract).toEqual(
			expect.objectContaining({
				selectedLatinFontFace: 'Aptos',
				selectedEastAsiaFontFace: 'Noto Sans CJK SC',
				selectedMonospaceFontFace: 'JetBrains Mono',
				writerEastAsiaFontFace: 'Noto Sans CJK SC',
				officeFontFamilies: ['Aptos', 'JetBrains Mono', 'Noto Sans CJK SC'],
				officeCjkFontFamilies: ['Noto Sans CJK SC'],
				officeLatinFontFamilies: ['Aptos', 'JetBrains Mono'],
				userSystemFontFamilies: ['JetBrains Mono'],
				officeOutputMissingFontRiskFamilies: ['JetBrains Mono', 'Noto Sans CJK SC'],
				fontEmbeddingPolicy: 'not-embedded',
				embeddedFontCount: 0,
			}),
		);
		expect(report.fontContract.fontSelectionPolicy).toEqual(
			expect.objectContaining({
				latinFontFace: 'Aptos',
				eastAsiaFontFace: 'Noto Sans CJK SC',
				monospaceFontFace: 'JetBrains Mono',
				embeddingPolicy: 'not-embedded',
				sourceFontFaceOverrides: {
					'Avenir Next': 'Aptos',
					'Fira Code': 'JetBrains Mono',
				},
			}),
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
				editableTableCellOverlayTextFill: 'visible',
				backgroundTextPolicy: 'hide-extracted-text-before-capture',
				textSelectionSurface: 'visible-native-text',
				selectableNativeTextSources: ['body', 'code', 'mermaid-text', 'svg-text', 'table-cell-overlay'],
				visibleNativeTextSources: ['body', 'code', 'mermaid-text', 'svg-text', 'table-cell-overlay'],
				transparentOverlayTextSources: [],
				backgroundHiddenTextSources: ['body', 'code', 'mermaid-text', 'svg-text', 'table-cell-overlay'],
				backgroundPreservedTextSources: [],
				mermaidSvgVisualPolicy: 'background-image',
				mermaidSvgTextPolicy: 'visible-native-text',
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
