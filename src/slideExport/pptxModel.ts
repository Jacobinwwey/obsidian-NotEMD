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

export const SLIDEV_PPTX_VISIBLE_TEXT_SOURCE_KINDS: readonly SlidevPptxTextSourceKind[] = [
	'body',
	'code',
	'svg-text',
	'table-cell-overlay',
];

export const SLIDEV_PPTX_BACKGROUND_OWNED_TEXT_SOURCE_KINDS: readonly SlidevPptxTextSourceKind[] = [
	'mermaid-text',
];

export interface SlidevPptxInlineTextRun {
	text: string;
	fontSize: number;
	fontFace: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike?: boolean;
	charSpacingPt?: number;
	code: boolean;
	link: boolean;
	hyperlinkTarget?: string;
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
	richTextParagraphs: SlidevPptxRichTextParagraph[];
	unmodeledRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

export type SlidevPptxVerticalAlign = 'top' | 'middle' | 'bottom';

export type SlidevPptxTableBorderModel = 'collapsed' | 'separate';

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
}

export interface SlidevPptxTable {
	x: number;
	y: number;
	w: number;
	h: number;
	colWidths: number[];
	rowHeights: number[];
	rows: SlidevPptxTableCell[][];
	borderModel?: SlidevPptxTableBorderModel;
	borderSpacingXIn?: number;
	borderSpacingYIn?: number;
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

export type SlidevPptxSolidRectangleSourceKind = 'code-background' | 'decorative-rectangle' | 'decorative-line';

export type SlidevPptxDecorativePrimitiveSkipReason =
	| 'unsupported-root'
	| 'unsupported-code-root'
	| 'unsupported-document-root'
	| 'unsupported-mermaid-root'
	| 'unsupported-svg-root'
	| 'unsupported-table-root'
	| 'unsupported-element'
	| 'not-visible'
	| 'unsupported-paint'
	| 'low-opacity'
	| 'non-uniform-radius'
	| 'no-opaque-fill-or-single-border'
	| 'oversized'
	| 'same-parent-fill'
	| 'consumed-ancestor'
	| 'line-too-wide'
	| 'line-too-small';

export interface SlidevPptxDecorativePrimitiveSkipReasonCount {
	reason: SlidevPptxDecorativePrimitiveSkipReason;
	count: number;
}

export interface SlidevPptxDecorativePrimitiveDiagnostics {
	candidateCount: number;
	acceptedCount: number;
	skippedCount: number;
	skipReasonCounts: SlidevPptxDecorativePrimitiveSkipReasonCount[];
}

export interface SlidevPptxSolidRectangle {
	sourceKind: SlidevPptxSolidRectangleSourceKind;
	x: number;
	y: number;
	w: number;
	h: number;
	fillColor: string;
	borderColor?: string;
	borderWidthPt?: number;
	/** DrawingML roundRect adjustment value, 0..50000. */
	cornerRadiusAdjustment?: number;
	order: number;
}

export interface SlidevPptxSlide {
	slideNumber: number;
	title: string;
	backgroundColor: string;
	backgroundImage?: SlidevPptxImage;
	texts: SlidevPptxTextBox[];
	tables: SlidevPptxTable[];
	shapes?: SlidevPptxSolidRectangle[];
	decorativePrimitiveDiagnostics?: SlidevPptxDecorativePrimitiveDiagnostics;
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

export interface SlidevPptxVisibleNativeBackgroundCaptureReport {
	status: 'verified';
	nativeLayer: 'visible-text-and-table';
	backgroundCapture: 'after-modeled-dom-hidden';
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
	hyperlinkRunCount: number;
	hyperlinkTargetCount: number;
	lineSpacingTextBoxCount: number;
	paragraphSpacingTextBoxCount: number;
	bodyInsetTextBoxCount: number;
	lineSpacingTableCellCount: number;
	bodyInsetTableCellCount: number;
	collapsedTableBorderModelCount: number;
	separateTableBorderModelCount: number;
	tableCellTextInsetCount: number;
	tableCellTextInsetDeltaCount: number;
	maxTableCellTextInsetDeltaIn: number;
	editableSolidRectangleCount: number;
	editableCodeBackgroundRectangleCount: number;
	editableDecorativeRectangleCount: number;
	editableDecorativeLineCount: number;
	decorativePrimitiveCandidateCount: number;
	decorativePrimitiveAcceptedCount: number;
	decorativePrimitiveSkippedCount: number;
	decorativePrimitiveSkipReasonCounts: SlidevPptxDecorativePrimitiveSkipReasonCount[];
	bulletedTextBoxCount: number;
	backgroundFallbackPresent: boolean;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	fontFamilies: string[];
	cjkFontFamilies: string[];
	writerEastAsiaFallbackFontFamilies: string[];
	officeMissingFontRiskFamilies: string[];
	textSourceCoverage: SlidevPptxTextSourceCoverage[];
	consumedTableTextCandidateCount: number;
	warnings: string[];
}

export interface SlidevPptxTextSourceCoverage {
	sourceKind: SlidevPptxTextSourceKind;
	slideCount: number;
	textBoxCount: number;
	textLineCount: number;
	characterCount: number;
	richTextParagraphCount: number;
	richTextRunCount: number;
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
	hyperlinkRunCount: number;
	hyperlinkTargetCount: number;
	lineSpacingTextBoxCount: number;
	paragraphSpacingTextBoxCount: number;
	bodyInsetTextBoxCount: number;
	lineSpacingTableCellCount: number;
	bodyInsetTableCellCount: number;
	collapsedTableBorderModelCount: number;
	separateTableBorderModelCount: number;
	tableCellTextInsetCount: number;
	tableCellTextInsetDeltaCount: number;
	maxTableCellTextInsetDeltaIn: number;
	editableSolidRectangleCount: number;
	editableCodeBackgroundRectangleCount: number;
	editableDecorativeRectangleCount: number;
	editableDecorativeLineCount: number;
	decorativePrimitiveCandidateCount: number;
	decorativePrimitiveAcceptedCount: number;
	decorativePrimitiveSkippedCount: number;
	decorativePrimitiveSkipReasonCounts: SlidevPptxDecorativePrimitiveSkipReasonCount[];
	bulletedTextBoxCount: number;
	backgroundFallbackSlideCount: number;
	backgroundFallbackSlideRatio: number;
	textSourceCoverage: SlidevPptxTextSourceCoverage[];
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
}

export type SlidevPptxOfficeFontRiskReason =
	| 'css-generic-family'
	| 'local-platform-family'
	| 'non-office-family'
	| 'unresolved-css-family';

export interface SlidevPptxFontPolicy {
	latinFontFace: string;
	eastAsiaFontFace: string;
	monospaceFontFace: string;
	sourceFontFaceOverrides: Record<string, string>;
	userSystemFontFaces: string[];
	embeddingPolicy: 'not-embedded';
}

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
	fontSelectionPolicy: SlidevPptxFontPolicy;
	selectedLatinFontFace: string;
	selectedEastAsiaFontFace: string;
	selectedMonospaceFontFace: string;
	userSystemFontFamilies: string[];
	officeFontFamilyCount: number;
	officeFontFamilies: string[];
	officeCjkFontFamilies: string[];
	officeLatinFontFamilies: string[];
	officeTextRunCount: number;
	officeEastAsiaFallbackRunCount: number;
	officeEastAsiaFallbackCharacterCount: number;
	officeMissingFontRiskCount: number;
	officeMissingFontRiskFamilies: string[];
	officeOutputMissingFontRiskFamilies: string[];
	fontUsages: SlidevPptxFontUsage[];
	fontEmbeddingPolicy: 'not-embedded';
	embeddedFontCount: 0;
	embeddedFontFamilies: [];
}

export interface SlidevPptxEditableLayerContract {
	visualFidelityStrategy: 'frozen-background-first' | 'visible-native-experiment';
	visibleTextSource:
		| 'native-text'
		| 'native-text-and-background-image';
	editableTextShapeFill: 'visible';
	editableTableTextFill: 'visible';
	editableTableCellOverlayTextFill: 'visible';
	backgroundTextPolicy:
		| 'hide-extracted-text-before-capture'
		| 'hide-modeled-text-before-capture';
	textSelectionSurface: 'visible-native-text';
	selectableNativeTextSources: SlidevPptxTextSourceKind[];
	visibleNativeTextSources: SlidevPptxTextSourceKind[];
	transparentOverlayTextSources: [];
	backgroundHiddenTextSources: SlidevPptxTextSourceKind[];
	backgroundPreservedTextSources: SlidevPptxTextSourceKind[];
	mermaidSvgVisualPolicy: 'background-image';
	mermaidSvgTextPolicy: 'background-image-only' | 'visible-native-text';
	officeNativeMermaidSvgElementEditability: 'not-claimed';
	fontPortabilityPolicy: 'report-only-no-default-font-embedding';
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
	hyperlinkRunCount: number;
	hyperlinkTargetCount: number;
	lineSpacingTextBoxCount: number;
	paragraphSpacingTextBoxCount: number;
	bodyInsetTextBoxCount: number;
	lineSpacingTableCellCount: number;
	bodyInsetTableCellCount: number;
	collapsedTableBorderModelCount: number;
	separateTableBorderModelCount: number;
	tableCellTextInsetCount: number;
	tableCellTextInsetDeltaCount: number;
	maxTableCellTextInsetDeltaIn: number;
	editableSolidRectangleCount: number;
	editableCodeBackgroundRectangleCount: number;
	editableDecorativeRectangleCount: number;
	editableDecorativeLineCount: number;
	decorativePrimitiveCandidateCount: number;
	decorativePrimitiveAcceptedCount: number;
	decorativePrimitiveSkippedCount: number;
	decorativePrimitiveSkipReasonCounts: SlidevPptxDecorativePrimitiveSkipReasonCount[];
	bulletedTextBoxCount: number;
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
	textSourceCoverage: SlidevPptxTextSourceCoverage[];
	fontContract: SlidevPptxFontContractSummary;
	editableLayerContract: SlidevPptxEditableLayerContract;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	slides: SlidevPptxSlideEditabilitySummary[];
	visibleTextLayer:
		| 'background-image'
		| 'native-text-and-background-image'
		| 'native-text-experiment';
	editableLayerRenderMode:
		| 'transparent-structure'
		| 'visible-native-text'
		| 'visible-native-experiment';
	visibleNativeBackgroundCapture?: SlidevPptxVisibleNativeBackgroundCaptureReport;
	visibleNativeExperiment?: SlidevPptxVisibleNativeExperimentReport;
	warnings: string[];
}

export interface SlidevPptxExportResult {
	path: string;
	reportPath: string;
	report: SlidevPptxExportReport;
}
