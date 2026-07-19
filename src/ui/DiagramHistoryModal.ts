import { App, Modal } from 'obsidian';
import { getI18nStrings } from '../i18n';
import { mountDiagramHistoryView, type DiagramHistoryStore, type DiagramHistoryViewController } from './DiagramHistoryView';

export class DiagramHistoryModal extends Modal {
    private view: DiagramHistoryViewController | null = null;

    constructor(
        app: App,
        private readonly store: DiagramHistoryStore,
        private readonly uiLocale = 'auto'
    ) { super(app); }

    onOpen(): void {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).diagramHistory;
        this.modalEl.addClass('notemd-diagram-history-shell');
        this.modalEl.setAttribute('aria-label', copy.title);
        this.titleEl.setText(copy.title);
        this.contentEl.empty();
        this.view = mountDiagramHistoryView(this.contentEl, {
            app: this.app,
            uiLocale: this.uiLocale,
            store: this.store
        });
    }

    onClose(): void {
        this.view?.destroy();
        this.view = null;
        this.modalEl.removeClass('notemd-diagram-history-shell');
    }
}
