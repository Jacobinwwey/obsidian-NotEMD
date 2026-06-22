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

export interface SlidevPptxTextBox {
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

export interface SlidevPptxDocument {
	title: string;
	author?: string;
	slides: SlidevPptxSlide[];
}

export interface SlidevPptxSlideEditabilitySummary {
	slideNumber: number;
	editableTextBoxCount: number;
	editableTableCount: number;
	editableTableCellCount: number;
	editableTextCharacterCount: number;
	editableTableCellCharacterCount: number;
	backgroundFallbackPresent: boolean;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	consumedTableTextCandidateCount: number;
	warnings: string[];
}

export interface SlidevPptxEditablePrimitiveCoverage {
	editableTextBoxCount: number;
	editableTextSlideCount: number;
	editableTextSlideRatio: number;
	editableTextCharacterCount: number;
	editableTableCount: number;
	editableTableSlideCount: number;
	editableTableSlideRatio: number;
	editableTableCellCount: number;
	editableTableCellCharacterCount: number;
	backgroundFallbackSlideCount: number;
	backgroundFallbackSlideRatio: number;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
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
	editableTableCellCount: number;
	editableTextSlideCount: number;
	pagesWithoutEditableText: number[];
	backgroundImageSlideCount: number;
	imageFallbackCount: number;
	editablePrimitiveCoverage: SlidevPptxEditablePrimitiveCoverage;
	fallbackOnlyElementKinds: SlidevPptxFallbackOnlyElementKind[];
	unmodeledTextRunReasons: SlidevPptxUnmodeledTextRunReason[];
	slides: SlidevPptxSlideEditabilitySummary[];
	visibleTextLayer: 'background-image';
	editableLayerRenderMode: 'transparent-structure';
	warnings: string[];
}

export interface SlidevPptxExportResult {
	path: string;
	reportPath: string;
	report: SlidevPptxExportReport;
}
