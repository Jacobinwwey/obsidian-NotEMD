import { App, Modal } from 'obsidian';
import type { DiagramHistoryEntry, DiagramHistoryQuery } from '../diagram/history/diagramHistoryRepository';

export class DiagramHistoryModal extends Modal {
    private query: DiagramHistoryQuery = { page: 1, pageSize: 20 };

    constructor(
        app: App,
        private readonly loadPage: (query: DiagramHistoryQuery) => Promise<{ items: DiagramHistoryEntry[]; page: number; totalPages: number; totalItems: number }>,
        private readonly removeEntry: (id: string) => Promise<void>
    ) { super(app); }

    onOpen(): void { void this.render(); }

    private async render(): Promise<void> {
        this.contentEl.empty();
        this.titleEl.setText('Diagram history');
        const toolbar = this.contentEl.createDiv({ cls: 'notemd-diagram-history-toolbar' });
        const search = toolbar.createEl('input', { type: 'search', placeholder: 'Search title, note, type, or format…' });
        search.value = this.query.search ?? '';
        search.oninput = () => { this.query.search = search.value; this.query.page = 1; void this.render(); };
        const addFilter = (label: string, values: string[], current: string | undefined, update: (value: string | undefined) => void) => {
            const select = toolbar.createEl('select', { attr: { 'aria-label': label } });
            select.createEl('option', { value: '', text: label });
            for (const value of values) select.createEl('option', { value, text: value });
            select.value = current ?? '';
            select.onchange = () => { update(select.value || undefined); this.query.page = 1; void this.render(); };
        };
        addFilter('All diagram types', ['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'pie', 'mindmap', 'timeline', 'quadrant', 'xychart', 'sankey', 'block', 'packet', 'kanban', 'architecture', 'circuit'], this.query.intent, value => { this.query.intent = value as DiagramHistoryQuery['intent']; });
        addFilter('All source formats', ['mermaid', 'drawio', 'drawnix', 'circuitikz'], this.query.sourceFormat, value => { this.query.sourceFormat = value as DiagramHistoryQuery['sourceFormat']; });
        addFilter('Any export', ['svg', 'png', 'pdf'], this.query.exportKind, value => { this.query.exportKind = value as DiagramHistoryQuery['exportKind']; });
        const pageSize = toolbar.createEl('select', { attr: { 'aria-label': 'Items per page' } });
        for (const size of [10, 20, 50]) pageSize.createEl('option', { value: String(size), text: `${size} per page` });
        pageSize.value = String(this.query.pageSize ?? 20);
        pageSize.onchange = () => { this.query.pageSize = Number(pageSize.value); this.query.page = 1; void this.render(); };
        const page = await this.loadPage(this.query);
        this.contentEl.createEl('p', { text: `${page.totalItems} diagrams · newest first`, cls: 'setting-item-description' });
        const list = this.contentEl.createDiv({ cls: 'notemd-diagram-history-list' });
        for (const entry of page.items) {
            const item = list.createDiv({ cls: 'notemd-diagram-history-item' });
            item.createEl('strong', { text: entry.title });
            item.createDiv({ text: `${new Date(entry.completedAt).toLocaleString()} · ${entry.intent} · ${entry.sourceFormat}` });
            if (entry.sourcePath) item.createDiv({ text: entry.sourcePath, cls: 'setting-item-description' });
            const exports = Object.keys(entry.exportPaths);
            item.createDiv({ text: exports.length ? `Exports: ${exports.join(', ').toUpperCase()}` : 'No visual exports recorded' });
            const remove = item.createEl('button', { text: 'Remove from history' });
            remove.onclick = async () => { await this.removeEntry(entry.id); await this.render(); };
        }
        const pager = this.contentEl.createDiv({ cls: 'notemd-diagram-history-pager' });
        const previous = pager.createEl('button', { text: 'Previous' });
        previous.disabled = page.page <= 1;
        previous.onclick = () => { this.query.page = Math.max(1, page.page - 1); void this.render(); };
        pager.createSpan({ text: `${page.page} / ${page.totalPages}` });
        const next = pager.createEl('button', { text: 'Next' });
        next.disabled = page.page >= page.totalPages;
        next.onclick = () => { this.query.page = page.page + 1; void this.render(); };
    }
}
