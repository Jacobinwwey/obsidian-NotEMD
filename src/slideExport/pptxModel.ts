export const PPTX_SLIDE_WIDTH_IN = 13.3333333333;
export const PPTX_SLIDE_HEIGHT_IN = 7.5;
export const PPTX_SLIDE_WIDTH_EMU = 12192000;
export const PPTX_SLIDE_HEIGHT_EMU = 6858000;

export type SlidevPptxTextAlign = 'left' | 'center' | 'right' | 'justify';

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
	warnings: string[];
}

export interface SlidevPptxDocument {
	title: string;
	author?: string;
	slides: SlidevPptxSlide[];
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
	editableTextSlideCount: number;
	pagesWithoutEditableText: number[];
	backgroundImageSlideCount: number;
	imageFallbackCount: number;
	warnings: string[];
}

export interface SlidevPptxExportResult {
	path: string;
	reportPath: string;
	report: SlidevPptxExportReport;
}
