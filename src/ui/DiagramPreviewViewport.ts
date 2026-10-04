import type { NotemdEnglishStrings } from '../i18n/locales/en';

const ZOOM_STEP = 1.25;
const MAX_ZOOM = 8;
const MIN_ZOOM = 0.005;

type PreviewZoomCopy = Pick<NotemdEnglishStrings['previewModal'], 'zoomIn' | 'zoomOut' | 'zoomFit' | 'zoomActual' | 'zoomLevel' | 'zoomViewport'>;

/** Owns display geometry only. Exporters always receive the original artifact. */
export class DiagramPreviewViewport {
    readonly contentEl: HTMLDivElement;
    private readonly viewport: HTMLDivElement;
    private readonly stage: HTMLDivElement;
    private readonly controls: HTMLDivElement;
    private readonly readout: HTMLOutputElement;
    private readonly zoomInButton: HTMLButtonElement;
    private readonly zoomOutButton: HTMLButtonElement;
    private readonly cleanup: Array<() => void> = [];
    private readonly observers: Array<ResizeObserver | MutationObserver> = [];
    private sourceWidth = 1;
    private sourceHeight = 1;
    private scale = 1;
    private fitScale = 1;
    private followsFit = true;
    private destroyed = false;
    private iframe?: HTMLIFrameElement;

    constructor(container: HTMLElement, copy: PreviewZoomCopy) {
        const doc = container.ownerDocument;
        this.controls = doc.createElement('div');
        this.controls.className = 'notemd-diagram-zoom-controls';
        this.controls.setAttribute('role', 'group');
        this.controls.setAttribute('aria-label', copy.zoomLevel);
        const button = (text: string, label: string, action: () => void) => {
            const element = doc.createElement('button');
            element.type = 'button';
            element.textContent = text;
            element.title = label;
            element.setAttribute('aria-label', label);
            element.addEventListener('click', action);
            this.cleanup.push(() => element.removeEventListener('click', action));
            this.controls.appendChild(element);
            return element;
        };
        this.zoomOutButton = button('−', copy.zoomOut, () => this.zoom(this.scale / ZOOM_STEP));
        this.readout = doc.createElement('output');
        this.readout.setAttribute('aria-label', copy.zoomLevel);
        this.readout.setAttribute('aria-live', 'polite');
        this.controls.appendChild(this.readout);
        this.zoomInButton = button('+', copy.zoomIn, () => this.zoom(this.scale * ZOOM_STEP));
        button(copy.zoomFit, copy.zoomFit, () => this.fit());
        button('1:1', copy.zoomActual, () => this.zoom(1));
        this.viewport = doc.createElement('div');
        this.viewport.className = 'notemd-diagram-zoom-viewport';
        this.viewport.tabIndex = 0;
        this.viewport.setAttribute('role', 'region');
        this.viewport.setAttribute('aria-label', copy.zoomViewport);
        this.stage = doc.createElement('div');
        this.stage.className = 'notemd-diagram-zoom-stage';
        this.contentEl = doc.createElement('div');
        this.contentEl.className = 'notemd-diagram-zoom-content';
        this.stage.appendChild(this.contentEl);
        this.viewport.appendChild(this.stage);
        container.append(this.controls, this.viewport);
        this.bindNavigation(this.viewport);
        const win = doc.defaultView;
        if (win?.ResizeObserver) {
            const observer = new win.ResizeObserver(() => this.refresh());
            observer.observe(this.viewport);
            this.observers.push(observer);
        }
    }

    refresh(): void {
        if (this.destroyed) return;
        const doc = this.iframe?.contentDocument;
        const svg = (doc ?? this.contentEl).querySelector('svg');
        const viewBox = svg?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
        const width = viewBox?.[2] ?? Number(svg?.getAttribute('width'));
        const height = viewBox?.[3] ?? Number(svg?.getAttribute('height'));
        if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
            this.sourceWidth = width;
            this.sourceHeight = height;
            (svg as SVGElement).style.width = `${width}px`;
            (svg as SVGElement).style.height = `${height}px`;
            (svg as SVGElement).style.maxWidth = 'none';
        } else if (doc?.body) {
            this.sourceWidth = Math.max(1, this.viewport.clientWidth);
            this.sourceHeight = Math.max(doc.body.scrollHeight, doc.body.offsetHeight, 260);
        } else {
            this.sourceWidth = Math.max(1, this.contentEl.scrollWidth, this.viewport.clientWidth);
            this.sourceHeight = Math.max(1, this.contentEl.scrollHeight, 260);
        }
        if (this.iframe) {
            this.iframe.style.width = `${this.sourceWidth}px`;
            this.iframe.style.height = `${this.sourceHeight}px`;
        }
        const availableWidth = this.viewport.clientWidth;
        const availableHeight = this.viewport.clientHeight;
        // Hidden popouts have no usable geometry. ResizeObserver will retry.
        if (availableWidth <= 0 || availableHeight <= 0) return;
        this.fitScale = Math.min(1, availableWidth / this.sourceWidth, availableHeight / this.sourceHeight);
        if (this.followsFit) this.scale = this.fitScale;
        this.paint();
    }

    attachIframe(iframe: HTMLIFrameElement): void {
        if (this.destroyed) return;
        this.iframe = iframe;
        const doc = iframe.contentDocument;
        if (doc?.body) {
            this.bindNavigation(doc);
            const win = this.contentEl.ownerDocument.defaultView;
            if (win?.MutationObserver) {
                // Watch renderer replacement, not our own style writes.
                const observer = new win.MutationObserver(() => this.refresh());
                observer.observe(doc.body, { childList: true, subtree: true });
                this.observers.push(observer);
            }
            if (win?.ResizeObserver) {
                const observer = new win.ResizeObserver(() => this.refresh());
                observer.observe(doc.body);
                this.observers.push(observer);
            }
        }
        this.refresh();
    }

    private fit(): void {
        this.followsFit = true;
        this.refresh();
        this.viewport.scrollLeft = 0;
        this.viewport.scrollTop = 0;
    }

    private zoom(nextScale: number, anchorX = this.viewport.clientWidth / 2, anchorY = this.viewport.clientHeight / 2): void {
        const left = this.contentOffsetX();
        const top = this.contentOffsetY();
        const sourceX = (this.viewport.scrollLeft + anchorX - left) / this.scale;
        const sourceY = (this.viewport.scrollTop + anchorY - top) / this.scale;
        this.scale = Math.min(MAX_ZOOM, Math.max(Math.min(MIN_ZOOM, this.fitScale), nextScale));
        this.followsFit = false;
        this.paint();
        this.viewport.scrollLeft = sourceX * this.scale + this.contentOffsetX() - anchorX;
        this.viewport.scrollTop = sourceY * this.scale + this.contentOffsetY() - anchorY;
    }

    private contentOffsetX(): number {
        return Math.max(0, (this.viewport.clientWidth - this.sourceWidth * this.scale) / 2);
    }

    private contentOffsetY(): number {
        return Math.max(0, (this.viewport.clientHeight - this.sourceHeight * this.scale) / 2);
    }

    private paint(): void {
        this.stage.style.width = `${Math.max(this.viewport.clientWidth, this.sourceWidth * this.scale)}px`;
        this.stage.style.height = `${Math.max(this.viewport.clientHeight, this.sourceHeight * this.scale)}px`;
        this.contentEl.style.width = `${this.sourceWidth}px`;
        this.contentEl.style.height = `${this.sourceHeight}px`;
        this.contentEl.style.transform = `translate(${this.contentOffsetX()}px, ${this.contentOffsetY()}px) scale(${this.scale})`;
        this.readout.textContent = `${Number((this.scale * 100).toFixed(1))}%`;
        this.viewport.setAttribute('data-zoom-scale', String(this.scale));
        this.zoomInButton.disabled = this.scale >= MAX_ZOOM;
        this.zoomOutButton.disabled = this.scale <= Math.min(MIN_ZOOM, this.fitScale);
    }

    private bindNavigation(target: HTMLElement | Document): void {
        let drag: { x: number; y: number; left: number; top: number; pointerId: number } | undefined;
        const interactive = (event: Event) => (event.target as Element | null)?.closest?.('button, input, textarea, select, a, [contenteditable="true"]');
        const keydown = (event: KeyboardEvent) => {
            if (interactive(event) || event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === '+' || event.key === '=') this.zoom(this.scale * ZOOM_STEP);
            else if (event.key === '-') this.zoom(this.scale / ZOOM_STEP);
            else if (event.key === '0') this.fit();
            else if (event.key === '1') this.zoom(1);
            else return;
            event.preventDefault();
            event.stopPropagation();
        };
        const wheel = (event: WheelEvent) => {
            // Keep ordinary wheel scrolling intact; Ctrl/Cmd+wheel zooms at the pointer.
            if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) return;
            event.preventDefault();
            const bounds = this.viewport.getBoundingClientRect();
            const frameBounds = target.nodeType === 9
                ? this.iframe?.getBoundingClientRect() : undefined;
            const x = frameBounds ? frameBounds.left + event.clientX * this.scale : event.clientX;
            const y = frameBounds ? frameBounds.top + event.clientY * this.scale : event.clientY;
            this.zoom(this.scale * Math.exp(-event.deltaY * 0.002), x - bounds.left, y - bounds.top);
        };
        const pointerdown = (event: PointerEvent) => {
            if (event.button !== 0 || interactive(event)) return;
            drag = { x: event.clientX, y: event.clientY, left: this.viewport.scrollLeft,
                top: this.viewport.scrollTop, pointerId: event.pointerId };
            this.viewport.classList.add('is-panning');
            (event.target as Element)?.setPointerCapture?.(event.pointerId);
        };
        const pointermove = (event: PointerEvent) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            const factor = target.nodeType === 9 ? this.scale : 1;
            this.viewport.scrollLeft = drag.left - (event.clientX - drag.x) * factor;
            this.viewport.scrollTop = drag.top - (event.clientY - drag.y) * factor;
        };
        const pointerup = () => { drag = undefined; this.viewport.classList.remove('is-panning'); };
        const listen = <K extends keyof DocumentEventMap>(name: K, callback: (event: DocumentEventMap[K]) => void, options?: AddEventListenerOptions) => {
            target.addEventListener(name, callback as EventListener, options);
            this.cleanup.push(() => target.removeEventListener(name, callback as EventListener, options));
        };
        listen('keydown', keydown);
        listen('wheel', wheel, { passive: false });
        listen('pointerdown', pointerdown);
        listen('pointermove', pointermove);
        listen('pointerup', pointerup);
        listen('pointercancel', pointerup);
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.observers.forEach(observer => observer.disconnect());
        this.cleanup.splice(0).forEach(dispose => dispose());
    }
}