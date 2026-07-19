import { App } from 'obsidian';
import { getI18nStrings } from '../i18n';
import { mountDiagramHistoryView, type DiagramHistoryStore, type DiagramHistoryViewController } from './DiagramHistoryView';

export interface DiagramHistoryDrawerOptions {
    app: App;
    store: DiagramHistoryStore;
    uiLocale?: string;
    onClose?: () => void;
}

/** Owns the preview's history layer so the history view can be reused without nesting Obsidian Modals. */
export class DiagramHistoryDrawer {
    private layer: HTMLElement | null = null;
    private view: DiagramHistoryViewController | null = null;
    private restoreTarget: HTMLElement | null = null;
    private readonly handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && this.layer) {
            event.preventDefault();
            this.close();
        }
    };

    constructor(private readonly parent: HTMLElement, private readonly options: DiagramHistoryDrawerOptions) {}

    open(trigger?: HTMLElement): void {
        if (this.layer) {
            this.view?.focusSearch();
            return;
        }
        this.restoreTarget = trigger ?? null;
        const strings = getI18nStrings({ uiLocale: this.options.uiLocale });
        const copy = strings.diagramHistory;
        const layer = this.parent.createDiv({ cls: 'notemd-diagram-history-layer' });
        const backdrop = layer.createDiv({ cls: 'notemd-diagram-history-backdrop' });
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.onclick = () => this.close();
        const drawer = layer.createEl('aside', {
            cls: 'notemd-diagram-history-drawer',
            attr: { role: 'dialog', 'aria-modal': 'true', 'aria-label': copy.title, tabindex: '-1' }
        });
        const header = drawer.createDiv({ cls: 'notemd-diagram-history-drawer-header' });
        header.createEl('h3', { text: copy.title });
        const closeButton = header.createEl('button', { text: '×', cls: 'notemd-diagram-history-drawer-close', attr: { 'aria-label': strings.common.close } });
        closeButton.onclick = () => this.close();
        const body = drawer.createDiv({ cls: 'notemd-diagram-history-drawer-body' });
        this.layer = layer;
        layer.addEventListener('keydown', this.handleKeydown);
        this.view = mountDiagramHistoryView(body, { app: this.options.app, store: this.options.store, uiLocale: this.options.uiLocale });
        this.view.focusSearch();
    }

    close(): void {
        const layer = this.layer;
        if (!layer) return;
        layer.removeEventListener('keydown', this.handleKeydown);
        this.view?.destroy();
        this.view = null;
        this.layer = null;
        layer.remove();
        this.restoreTarget?.focus();
        this.restoreTarget = null;
        this.options.onClose?.();
    }

    toggle(trigger?: HTMLElement): void {
        if (this.layer) this.close();
        else this.open(trigger);
    }

    isOpen(): boolean { return this.layer !== null; }

    destroy(): void { this.close(); }
}
