import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import notoSansScRegularDataUrl from '../../assets/NotoSansSC-Regular.ttf';
import { resolveSvgDimensions, sanitizeSvgForExport } from './pngPreview';
import {
    normalizeSvgFontFamilyDeclarations,
    PREVIEW_FONT_FAMILY
} from './previewTypography';

const PDF_POINTS_PER_CSS_PIXEL = 72 / 96;
const PDF_FONT_FILE_NAME = 'NotoSansSC-Regular.ttf';
const PDF_FONT_FAMILY = PREVIEW_FONT_FAMILY;
const PDF_FONT_STYLES = ['normal', 'bold', 'italic', 'bolditalic'] as const;
export type PdfPageOrientation = 'portrait' | 'landscape';

export interface SvgPdfDocumentLike {
    output(type: 'arraybuffer'): ArrayBuffer;
    addFileToVFS?(fileName: string, data: string): void;
    addFont?(fileName: string, family: string, style: string): void;
    setFont?(family: string, style?: string): void;
}

export interface SvgPdfExportDeps {
    parseSvg(svg: string): unknown;
    createDocument(
        pageWidthPt: number,
        pageHeightPt: number,
        orientation: PdfPageOrientation
    ): SvgPdfDocumentLike;
    renderSvg(
        element: unknown,
        document: SvgPdfDocumentLike,
        options: { x: number; y: number; width: number; height: number }
    ): Promise<unknown> | unknown;
}

function parseSvgDocument(svg: string): Element {
    if (typeof DOMParser === 'undefined') {
        throw new Error('PDF export requires a browser SVG parser.');
    }

    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = document.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'svg' || root.querySelector('parsererror')) {
        throw new Error('Preview renderer returned malformed SVG markup for PDF export.');
    }

    return root;
}

function createSvgPdfDocument(
    pageWidthPt: number,
    pageHeightPt: number,
    orientation: PdfPageOrientation
): SvgPdfDocumentLike {
    return new jsPDF({
        orientation,
        unit: 'pt',
        format: [pageWidthPt, pageHeightPt],
        compress: true,
        putOnlyUsedFonts: true
    });
}

function extractBase64Data(dataUrl: string): string {
    const separatorIndex = dataUrl.indexOf(',');
    return separatorIndex >= 0 ? dataUrl.slice(separatorIndex + 1) : dataUrl;
}

function registerPdfFont(document: SvgPdfDocumentLike): void {
    if (
        typeof document.addFileToVFS !== 'function'
        || typeof document.addFont !== 'function'
    ) {
        return;
    }

    document.addFileToVFS(PDF_FONT_FILE_NAME, extractBase64Data(notoSansScRegularDataUrl));
    for (const style of PDF_FONT_STYLES) {
        document.addFont(PDF_FONT_FILE_NAME, PDF_FONT_FAMILY, style);
    }
    document.setFont?.(PDF_FONT_FAMILY, 'normal');
}

async function renderSvgToPdf(
    element: unknown,
    document: SvgPdfDocumentLike,
    options: { x: number; y: number; width: number; height: number }
): Promise<unknown> {
    return svg2pdf(element as Element, document as jsPDF, options);
}

const DEFAULT_SVG_PDF_EXPORT_DEPS: SvgPdfExportDeps = {
    parseSvg: parseSvgDocument,
    createDocument: createSvgPdfDocument,
    renderSvg: renderSvgToPdf
};

export async function buildPdfFromSvg(
    svg: string,
    deps: SvgPdfExportDeps = DEFAULT_SVG_PDF_EXPORT_DEPS
): Promise<ArrayBuffer> {
    // svg2pdf.js does not implement HTML foreignObject layout. Convert the
    // browser-rendered label containers to explicit SVG text/tspan nodes first;
    // this preserves Mermaid's source line breaks instead of asking Mermaid to
    // lay out a second, PDF-specific version of the diagram.
    const pdfSvg = normalizeSvgFontFamilyDeclarations(sanitizeSvgForExport(svg));
    const dimensions = resolveSvgDimensions(pdfSvg);
    const pageWidthPt = dimensions.width * PDF_POINTS_PER_CSS_PIXEL;
    const pageHeightPt = dimensions.height * PDF_POINTS_PER_CSS_PIXEL;
    const orientation: PdfPageOrientation = pageWidthPt > pageHeightPt ? 'landscape' : 'portrait';
    const document = deps.createDocument(pageWidthPt, pageHeightPt, orientation);
    registerPdfFont(document);
    const element = deps.parseSvg(pdfSvg);

    await deps.renderSvg(element, document, {
        x: 0,
        y: 0,
        width: pageWidthPt,
        height: pageHeightPt
    });

    const output = document.output('arraybuffer');
    if (!(output instanceof ArrayBuffer) || output.byteLength === 0) {
        throw new Error('SVG PDF renderer returned an empty document.');
    }
    return output;
}
