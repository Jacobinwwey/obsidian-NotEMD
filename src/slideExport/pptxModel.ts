export const PPTX_SLIDE_WIDTH_IN = 13.3333333333;
export const PPTX_SLIDE_HEIGHT_IN = 7.5;
export const PPTX_SLIDE_WIDTH_EMU = 12192000;
export const PPTX_SLIDE_HEIGHT_EMU = 6858000;

export type SlidevPptxTextAlign = 'left' | 'center' | 'right' | 'justify';

export type SlidevPptxFallbackOnlyElementKind =
	| 'canvas'
	| 'code-highlight'
	| 'iframe'
	| 'image'
	| 'math'
	| 'mermaid'
	| 'svg'
	| 'video';

export type SlidevPptxUnmodeledTextRunReason = 'inline-code' | 'inline-formatting' | 'link' | 'syntax-highlight';

export type SlidevPptxTextSourceKind = 'body' | 'code' | 'mermaid-text' | 'svg-text' | 'table-cell-overlay';

export interface SlidevPptxInlineTextRun {
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

export interface SlidevPptxRichTextParagraph {
	runs: SlidevPptxInlineTextRun[];
}

export interface SlidevPptxTextBox {
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
	richTextParagraphs: SlidevPptxRichTextParagraph[];
	unmodeledRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

export type SlidevPptxVerticalAlign = 'top' | 'middle' | 'bottom';

export interface SlidevPptxTableCell {
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

export interface SlidevPptxTable {
	x: number;
	y: number;
	w: number;
	h: number;
	colWidths: number[];
	rowHeights: number[];
	rows: SlidevPptxTableCell[][];
	order: number;
}

export interface SlidevPptxImage {
	data: Uint8Array;
	mimeType: 'image/png' | 'image/jpeg';
	x: number;
	y: number;
	w: number;
	h: number;
	name: string;
	order: number;
}

export interface SlidevPptxSlide {
	slideNumber: number;
	title: string;
	backgroundColor: string;
	backgroundImage?: SlidevPptxImage;
	texts: SlidevPptxTextBox[];
	tables: SlidevPptxTable[];
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	consumedTableTextCandidateCount: number;
	warnings: string[];
}

export interface SlidevPptxVisibleNativeSlideResidueSampling {
	slideNumber: number;
	sampledTextBoxCount: number;
	sampledTableCellCount: number;
	checkedRegionCount: number;
	suspiciousRegionCount: number;
	maxTextLikePixelRatio: number;
	suspicious: boolean;
}

export interface SlidevPptxVisibleNativeResidueSamplingSummary {
	slideCount: number;
	sampledSlideCount: number;
	suspiciousSlideCount: number;
	checkedRegionCount: number;
	suspiciousRegionCount: number;
	maxTextLikePixelRatio: number;
	threshold: {
		colorDistance: number;
		textLikePixelRatio: number;
		minTextLikePixels: number;
	};
	slides: SlidevPptxVisibleNativeSlideResidueSampling[];
}

export interface SlidevPptxVisibleNativeExperimentReport {
	status: 'experimental';
	nativeLayer: 'visible-text-and-table';
	backgroundCapture: 'after-extracted-dom-hidden';
	visualReference: 'default-frozen-background-required';
	residueSampling: SlidevPptxVisibleNativeResidueSamplingSummary;
	warnings: string[];
}

export interface SlidevPptxDocument {
	title: string;
	author?: string;
	slides: SlidevPptxSlide[];
}

export interface SlidevPptxSlideEditabilitySummary {
	slideNumber: number;
	editableTextBoxCount: number;
	editableBodyTextBoxCount: number;
	editableCodeTextBoxCount: number;
	editableMermaidTextBoxCount: number;
	editableSvgTextBoxCount: number;
	editableTableCellOverlayTextBoxCount: number;
	editableTableCount: number;
	editableTableCellCount: number;
	editableTextCharacterCount: number;
	editableTableCellCharacterCount: number;
	richTextBoxCount: number;
	richTextRunCount: number;
	richTextRunCharacterCount: number;
	backgroundFallbackPresent: boolean;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	fontFamilies: string[];
	cjkFontFamilies: string[];
	writerEastAsiaFallbackFontFamilies: string[];
	officeMissingFontRiskFamilies: string[];
	consumedTableTextCandidateCount: number;
	warnings: string[];
}

export interface SlidevPptxEditablePrimitiveCoverage {
	editableTextBoxCount: number;
	editableBodyTextBoxCount: number;
	editableCodeTextBoxCount: number;
	editableMermaidTextBoxCount: number;
	editableSvgTextBoxCount: number;
	editableTableCellOverlayTextBoxCount: number;
	editableTextSlideCount: number;
	editableTextSlideRatio: number;
	editableTextCharacterCount: number;
	editableTableCount: number;
	editableTableSlideCount: number;
	editableTableSlideRatio: number;
	editableTableCellCount: number;
	editableTableCellCharacterCount: number;
	richTextBoxCount: number;
	richTextBoxRatio: number;
	richTextRunCount: number;
	richTextRunCharacterCount: number;
	backgroundFallbackSlideCount: number;
	backgroundFallbackSlideRatio: number;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

export type SlidevPptxOfficeFontRiskReason =
	| 'css-generic-family'
	| 'local-platform-family'
	| 'non-office-family'
	| 'unresolved-css-family';

export interface SlidevPptxFontUsage {
	fontFace: string;
	textBoxCount: number;
	richTextRunCount: number;
	tableCellCount: number;
	characterCount: number;
	cjkCharacterCount: number;
	latinCharacterCount: number;
	writerEastAsiaFallbackRunCount: number;
	writerEastAsiaFallbackCharacterCount: number;
	officeMissingFontRisk: boolean;
	officeMissingFontRiskReasons: SlidevPptxOfficeFontRiskReason[];
}

export interface SlidevPptxFontContractSummary {
	fontFamilyCount: number;
	fontFamilies: string[];
	cjkFontFamilies: string[];
	latinFontFamilies: string[];
	writerEastAsiaFontFace: string;
	writerEastAsiaFallbackFontFamilies: string[];
	officeFontFamilyCount: number;
	officeFontFamilies: string[];
	officeCjkFontFamilies: string[];
	officeLatinFontFamilies: string[];
	officeTextRunCount: number;
	officeEastAsiaFallbackRunCount: number;
	officeEastAsiaFallbackCharacterCount: number;
	officeMissingFontRiskCount: number;
	officeMissingFontRiskFamilies: string[];
	fontUsages: SlidevPptxFontUsage[];
	fontEmbeddingPolicy: 'not-embedded';
	embeddedFontCount: 0;
	embeddedFontFamilies: [];
}

export interface SlidevPptxExportReport {
	formatVersion: 1;
	source: {
		htmlPath: string;
		deckPath: string | null;
	};
	output: {
		pptxPath: string;
		reportPath: string;
	};
	slideCount: number;
	textBoxCount: number;
	tableCount: number;
	consumedTableCount: number;
	consumedTableTextCandidateCount: number;
	richTextBoxCount: number;
	richTextRunCount: number;
	editableTableCellCount: number;
	editableBodyTextBoxCount: number;
	editableCodeTextBoxCount: number;
	editableMermaidTextBoxCount: number;
	editableSvgTextBoxCount: number;
	editableTableCellOverlayTextBoxCount: number;
	editableTextSlideCount: number;
	pagesWithoutEditableText: number[];
	backgroundImageSlideCount: number;
	imageFallbackCount: number;
	editablePrimitiveCoverage: SlidevPptxEditablePrimitiveCoverage;
	fontContract: SlidevPptxFontContractSummary;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	slides: SlidevPptxSlideEditabilitySummary[];
	visibleTextLayer: 'background-image' | 'native-text-experiment';
	editableLayerRenderMode: 'transparent-structure' | 'visible-native-experiment';
	visibleNativeExperiment?: SlidevPptxVisibleNativeExperimentReport;
	warnings: string[];
}

export interface SlidevPptxExportResult {
	path: string;
	reportPath: string;
	report: SlidevPptxExportReport;
}
