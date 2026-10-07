import { App, Modal, TFile, loadPdfJs } from 'obsidian';
import { getI18nStrings } from '../i18n';
import { DiagramPreviewViewport } from './DiagramPreviewViewport';
import { PDF_PREVIEW_CANVAS_SIDE_LIMIT, PdfPreviewDetailRenderer } from './PdfPreviewDetailRenderer';

const PDF_PIXEL_BUDGET = 32_000_000;
const PDF_PAGE_PIXEL_LIMIT = 4_000_000;

/** Binary decoders own their resources; the viewport only owns navigation geometry. */
export class BinaryDiagramPreviewModal extends Modal {
    private readonly viewports: DiagramPreviewViewport[] = [];
    private closed = false;
    private loadingTask?: { destroy(): Promise<void> };
    private activeRender?: { cancel(): void };
    private imageUrl?: string;
    private cancelImage?: () => void;
    private readonly pdfDetails = new PdfPreviewDetailRenderer();

    constructor(app: App, private readonly file: TFile, private readonly bytes: Uint8Array, private readonly uiLocale: string) {
        super(app);
    }

    async openPreview(): Promise<void> {
        this.open();
        try {
            if (this.file.extension.toLowerCase() === 'png') await this.renderPng();
            else await this.renderPdf();
        } catch (error) {
            this.close();
            throw error;
        }
    }

    onOpen(): void {
        this.modalEl.classList.add('notemd-diagram-preview-shell', 'notemd-binary-preview');
        this.contentEl.replaceChildren();
        const title = this.contentEl.ownerDocument.createElement('h2');
        title.textContent = this.file.name;
        this.contentEl.appendChild(title);
        const style = this.contentEl.ownerDocument.createElement('style');
        style.textContent = '.notemd-binary-preview .notemd-pdf-page{position:relative;background:white}.notemd-binary-preview canvas{display:block}.notemd-binary-preview .textLayer{position:absolute;z-index:1;inset:0;overflow:hidden;line-height:1;text-align:initial;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0}.notemd-binary-preview .textLayer :is(span,br){color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0 0}.notemd-binary-preview .textLayer ::selection{background:rgba(0,100,255,.3)}';
        this.contentEl.appendChild(style);
    }

    private ensureOpen(): void {
        if (this.closed) throw new Error('Diagram preview closed.');
    }

    private async renderPng(): Promise<void> {
        const viewport = new DiagramPreviewViewport(this.contentEl, getI18nStrings({ uiLocale: this.uiLocale }).previewModal);
        this.viewports.push(viewport);
        const image = this.contentEl.ownerDocument.createElement('img');
        image.alt = this.file.name;
        this.imageUrl = URL.createObjectURL(new Blob([this.bytes.slice().buffer], { type: 'image/png' }));
        await new Promise<void>((resolve, reject) => {
            this.cancelImage = () => reject(new Error('Diagram preview closed.'));
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(`Unable to decode PNG: ${this.file.path}`));
            image.src = this.imageUrl!;
        }).finally(() => { image.onload = null; image.onerror = null; this.cancelImage = undefined; });
        this.ensureOpen();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Invalid PNG dimensions: ${this.file.path}`);
        image.style.maxWidth = 'none';
        image.style.width = `${image.naturalWidth}px`;
        image.style.height = `${image.naturalHeight}px`;
        image.draggable = false;
        viewport.contentEl.appendChild(image);
        viewport.setSourceDimensions(image.naturalWidth, image.naturalHeight);
    }

    private async renderPdf(): Promise<void> {
        const pdfjs = await loadPdfJs();
        this.ensureOpen();
        const loadingTask = pdfjs.getDocument({ data: this.bytes.slice() });
        this.loadingTask = loadingTask;
        const pdf = await loadingTask.promise;
        this.ensureOpen();
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const panels = this.contentEl.ownerDocument.createElement('div');
        panels.className = 'notemd-diagram-preview-panels notemd-diagram-preview-scroll-region';
        this.contentEl.appendChild(panels);
        // Sequential decoding and a document-wide raster budget prevent large PDFs exhausting GPU memory.
        const pageBudget = Math.min(PDF_PAGE_PIXEL_LIMIT, PDF_PIXEL_BUDGET / pdf.numPages);
        for (let number = 1; number <= pdf.numPages; number++) {
            this.ensureOpen();
            const page = await pdf.getPage(number);
            let retainedForDetails = false;
            try {
                this.ensureOpen();
                const original = page.getViewport({ scale: 1 });
                // Area alone cannot bound long, narrow pages within the browser canvas limit.
                const scale = Math.min(1.5, Math.sqrt(pageBudget / (original.width * original.height)),
                    PDF_PREVIEW_CANVAS_SIDE_LIMIT / original.width, PDF_PREVIEW_CANVAS_SIDE_LIMIT / original.height);
                const pageViewport = page.getViewport({ scale });
                const panel = panels.ownerDocument.createElement('section');
                panel.className = 'notemd-diagram-preview-panel';
                const title = panel.ownerDocument.createElement('h3');
                title.className = 'notemd-diagram-preview-panel-title';
                title.textContent = copy.panelTitle.replace('{index}', String(number)).replace('{total}', String(pdf.numPages));
                panel.appendChild(title);
                const body = panel.ownerDocument.createElement('div');
                body.className = 'notemd-diagram-preview-panel-body';
                panel.appendChild(body);
                panels.appendChild(panel);
                // A page owns its fit, zoom and lock state; the outer region only scrolls between pages.
                const viewport = new DiagramPreviewViewport(body, copy);
                this.viewports.push(viewport);
                const container = this.contentEl.ownerDocument.createElement('div');
                container.className = 'notemd-pdf-page';
                // Navigation and selectable text use stable PDF coordinates, independent of
                // the document's base raster budget and later detail-render density.
                container.style.width = `${original.width}px`;
                container.style.height = `${original.height}px`;
                container.style.setProperty('--scale-factor', '1');
                const canvas = container.ownerDocument.createElement('canvas');
                canvas.width = Math.ceil(pageViewport.width);
                canvas.height = Math.ceil(pageViewport.height);
                canvas.style.width = `${original.width}px`;
                canvas.style.height = `${original.height}px`;
                container.appendChild(canvas);
                viewport.contentEl.appendChild(container);
                viewport.setSourceDimensions(original.width, original.height);
                const canvasContext = canvas.getContext('2d');
                if (!canvasContext) throw new Error('PDF canvas context is unavailable.');
                // Snapshot rendering must also complete in background vault windows, where
                // display-intent requestAnimationFrame callbacks can be suspended.
                const render = page.render({ canvasContext, viewport: pageViewport, intent: 'print' });
                this.activeRender = render;
                await render.promise;
                this.ensureOpen();
                const textContent = await page.getTextContent();
                this.ensureOpen();
                const textLayer = container.ownerDocument.createElement('div');
                textLayer.className = 'textLayer';
                container.appendChild(textLayer);
                // Obsidian ships pdf.js independently: support both maintained text-layer APIs.
                const textRender = pdfjs.TextLayer
                    ? new pdfjs.TextLayer({ textContentSource: textContent, container: textLayer, viewport: original })
                    : pdfjs.renderTextLayer?.({ textContentSource: textContent, textContent, container: textLayer, viewport: original, textDivs: [] });
                if (!textRender) throw new Error('PDF text selection is unavailable in this Obsidian version.');
                this.activeRender = textRender;
                await (pdfjs.TextLayer ? textRender.render() : textRender.promise);
                this.ensureOpen();
                this.pdfDetails.attachPage(page, container, viewport, scale);
                retainedForDetails = true;
            } finally {
                this.activeRender = undefined;
                if (!retainedForDetails) page.cleanup();
            }
        }
    }

    onClose(): void {
        if (this.closed) return;
        this.closed = true;
        this.cancelImage?.();
        this.activeRender?.cancel();
        this.pdfDetails.destroy();
        this.viewports.splice(0).forEach(viewport => viewport.destroy());
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = undefined;
        void this.loadingTask?.destroy().catch(error => console.warn('PDF preview cleanup failed.', error));
        this.loadingTask = undefined;
        this.contentEl.querySelectorAll('canvas').forEach(canvas => { canvas.width = 0; canvas.height = 0; });
        this.contentEl.replaceChildren();
    }
}
