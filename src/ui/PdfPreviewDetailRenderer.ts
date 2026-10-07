import type { DiagramPreviewGeometry, DiagramPreviewViewport } from './DiagramPreviewViewport';

const DETAIL_PIXEL_BUDGET = 24_000_000;
const TILE_PIXEL_LIMIT = 8_000_000;
export const PDF_PREVIEW_CANVAS_SIDE_LIMIT = 8192;
const OVERSCAN_SCREEN_PIXELS = 64;
const RENDER_DELAY_MS = 50;

interface PdfPageSource {
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: Record<string, unknown>): { promise: Promise<unknown>; cancel(): void };
    cleanup(): void;
}

interface DetailTile {
    left: number;
    top: number;
    width: number;
    height: number;
    density: number;
    key: string;
}

interface PreviewPage {
    page: PdfPageSource;
    container: HTMLElement;
    width: number;
    height: number;
    baseDensity: number;
    unsubscribe: () => void;
    revision: number;
    desired?: DetailTile;
    displayed?: { tile: DetailTile; canvas: HTMLCanvasElement };
    failedKey?: string;
    settledKey?: string;
}

/** A document owns one detail render at a time and a shared displayed/in-flight raster budget. */
export class PdfPreviewDetailRenderer {
    private readonly pages: PreviewPage[] = [];
    private timer?: ReturnType<typeof setTimeout>;
    private active?: { page: PreviewPage; cancel: () => void };
    private closed = false;

    attachPage(page: PdfPageSource, container: HTMLElement, viewport: DiagramPreviewViewport, baseDensity: number): void {
        const dimensions = page.getViewport({ scale: 1 });
        const preview: PreviewPage = { page, container, ...dimensions, baseDensity, revision: 0, unsubscribe: () => {} };
        this.pages.push(preview);
        preview.unsubscribe = viewport.subscribeGeometry(geometry => this.update(preview, geometry));
    }

    private update(preview: PreviewPage, geometry: DiagramPreviewGeometry): void {
        if (this.closed) return;
        const visible = geometry.visibleSource;
        const density = geometry.scale * geometry.pixelRatio;
        if (!visible || density <= preview.baseDensity) {
            preview.desired = undefined;
            preview.settledKey = undefined;
            preview.revision++;
            this.cancelActive(preview);
            this.releaseDisplayed(preview);
            return;
        }
        const overscan = OVERSCAN_SCREEN_PIXELS / geometry.scale;
        const left = Math.max(0, visible.left - overscan);
        const top = Math.max(0, visible.top - overscan);
        const width = Math.min(preview.width, visible.left + visible.width + overscan) - left;
        const height = Math.min(preview.height, visible.top + visible.height + overscan) - top;
        // A large/high-DPI monitor can exceed GPU-safe canvas limits. Reduce only its tile,
        // never allocate a full page at the requested zoom factor.
        const tileDensity = Math.min(density, Math.sqrt(TILE_PIXEL_LIMIT / (width * height)), PDF_PREVIEW_CANVAS_SIDE_LIMIT / width, PDF_PREVIEW_CANVAS_SIDE_LIMIT / height);
        let tile: DetailTile = { left, top, width: Math.max(1, Math.floor(width * tileDensity)),
            height: Math.max(1, Math.floor(height * tileDensity)), density: tileDensity, key: '' };
        tile.key = [tile.left, tile.top, tile.width, tile.height, tile.density].join(':');
        const displayed = preview.displayed?.tile;
        if (displayed && displayed.density >= tile.density && displayed.left <= visible.left && displayed.top <= visible.top
            && displayed.left + (displayed.width + 1) / displayed.density >= visible.left + visible.width
            && displayed.top + (displayed.height + 1) / displayed.density >= visible.top + visible.height) {
            // Overscan serves small pans directly; PDF operators need not replay for every pixel.
            tile = displayed;
        }
        if (preview.desired?.key === tile.key) return;
        preview.desired = tile;
        preview.failedKey = undefined;
        preview.revision++;
        this.cancelActive(preview);
        this.schedule();
    }

    private cancelActive(preview: PreviewPage): void {
        if (this.active?.page !== preview) return;
        this.active.cancel();
    }

    private schedule(): void {
        if (this.closed || this.active || this.timer !== undefined) return;
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.renderNext();
        }, RENDER_DELAY_MS);
    }

    private releaseDisplayed(preview: PreviewPage): void {
        if (!preview.displayed) return;
        this.releaseCanvas(preview.displayed.canvas);
        preview.displayed = undefined;
    }

    private releaseCanvas(canvas: HTMLCanvasElement): void {
        canvas.remove();
        canvas.width = 0;
        canvas.height = 0;
    }

    private reservePixels(pixels: number): void {
        let displayed = this.pages.reduce((sum, page) => sum + (page.displayed ? page.displayed.canvas.width * page.displayed.canvas.height : 0), 0);
        for (const page of this.pages) {
            if (displayed + pixels <= DETAIL_PIXEL_BUDGET) break;
            if (page.displayed) {
                displayed -= page.displayed.canvas.width * page.displayed.canvas.height;
                this.releaseDisplayed(page);
            }
        }
    }

    private async renderNext(): Promise<void> {
        if (this.closed || this.active) return;
        const preview = this.pages.find(page => page.desired && page.desired.key !== page.settledKey && page.desired.key !== page.failedKey);
        if (!preview?.desired) return;
        const tile = preview.desired;
        const revision = preview.revision;
        this.reservePixels(tile.width * tile.height);
        const canvas = preview.container.ownerDocument.createElement('canvas');
        canvas.className = 'notemd-pdf-detail-tile';
        canvas.width = tile.width;
        canvas.height = tile.height;
        Object.assign(canvas.style, { position: 'absolute', left: `${tile.left}px`, top: `${tile.top}px`,
            width: `${tile.width / tile.density}px`, height: `${tile.height / tile.density}px`, pointerEvents: 'none', zIndex: '0' });
        try {
            const canvasContext = canvas.getContext('2d');
            if (!canvasContext) throw new Error('PDF detail canvas context is unavailable.');
            const task = preview.page.render({ canvas, canvasContext, viewport: preview.page.getViewport({ scale: tile.density }),
                transform: [1, 0, 0, 1, -tile.left * tile.density, -tile.top * tile.density], intent: 'print' });
            let cancelled = false;
            this.active = { page: preview, cancel: () => { if (!cancelled) { cancelled = true; task.cancel(); } } };
            await task.promise;
            if (!this.closed && preview.revision === revision) {
                this.releaseDisplayed(preview);
                preview.container.appendChild(canvas);
                preview.displayed = { canvas, tile };
                preview.settledKey = tile.key;
            }
        } catch (error) {
            if (!this.closed && preview.revision === revision) {
                preview.failedKey = tile.key;
                console.warn('PDF preview detail rendering failed.', error);
            }
        } finally {
            if (preview.displayed?.canvas !== canvas) this.releaseCanvas(canvas);
            this.active = undefined;
            if (this.closed) preview.page.cleanup();
            else void this.renderNext();
        }
    }

    destroy(): void {
        if (this.closed) return;
        this.closed = true;
        if (this.timer !== undefined) clearTimeout(this.timer);
        this.timer = undefined;
        for (const preview of this.pages) {
            preview.unsubscribe();
            this.releaseDisplayed(preview);
            if (this.active?.page === preview) this.active.cancel();
            else preview.page.cleanup();
        }
    }
}
