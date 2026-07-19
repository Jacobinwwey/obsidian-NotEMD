import { App, Notice } from 'obsidian';
import type { DiagramHistoryEntry, DiagramHistoryExportKind, DiagramHistoryQuery } from '../diagram/history/diagramHistoryRepository';
import { collectDiagramHistoryArtifactPaths } from '../diagram/history/diagramHistoryActions';
import { formatI18n, getI18nStrings } from '../i18n';

export interface DiagramHistoryStore {
    loadPage: (query: DiagramHistoryQuery) => Promise<{ items: DiagramHistoryEntry[]; page: number; totalPages: number; totalItems: number }>;
    removeEntry: (id: string) => Promise<unknown>;
    deleteArtifacts?: (entry: DiagramHistoryEntry) => Promise<boolean>;
    reopenArtifact?: (entry: DiagramHistoryEntry) => Promise<boolean>;
    recordCompleted?: (entry: DiagramHistoryEntry) => Promise<unknown>;
    recordArtifactPath?: (id: string, path: string) => Promise<unknown>;
    recordExportPath?: (id: string, kind: DiagramHistoryExportKind, path: string) => Promise<unknown>;
}

export interface DiagramHistoryViewOptions {
    app?: App;
    store: DiagramHistoryStore;
    uiLocale?: string;
    onEmptyAction?: () => void;
}

export interface DiagramHistoryViewController {
    refresh(): Promise<void>;
    focusSearch(): void;
    destroy(): void;
}

const INTENTS = ['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'pie', 'mindmap', 'timeline', 'quadrant', 'xychart', 'sankey', 'block', 'packet', 'kanban', 'architecture', 'circuit'];
const SOURCE_FORMATS = ['mermaid', 'drawio', 'drawnix', 'circuitikz'];
const EXPORT_FORMATS = ['svg', 'png', 'pdf'];

export function mountDiagramHistoryView(parent: HTMLElement, options: DiagramHistoryViewOptions): DiagramHistoryViewController {
    const view = new DiagramHistoryView(options);
    view.mount(parent);
    return view;
}

class DiagramHistoryView implements DiagramHistoryViewController {
    private query: DiagramHistoryQuery = { page: 1, pageSize: 20 };
    private filtersOpen = false;
    private requestId = 0;
    private root: HTMLElement | null = null;
    private searchInput: HTMLInputElement | null = null;

    constructor(private readonly options: DiagramHistoryViewOptions) {}

    mount(parent: HTMLElement): void {
        this.root = parent;
        void this.refresh();
    }

    async refresh(): Promise<void> {
        if (!this.root) return;
        const requestId = ++this.requestId;
        const root = this.root;
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).diagramHistory;
        root.empty();
        const loading = root.createDiv({ cls: 'notemd-diagram-history-loading', attr: { 'data-notemd-history-loading': 'true', role: 'status', 'aria-live': 'polite' } });
        loading.setText(copy.loading);
        try {
            const page = await this.options.store.loadPage({ ...this.query });
            if (requestId !== this.requestId || this.root !== root) return;
            this.renderPage(page);
        } catch (error) {
            if (requestId !== this.requestId || this.root !== root) return;
            root.empty();
            this.renderError(error);
        }
    }

    focusSearch(): void { this.searchInput?.focus(); }

    destroy(): void {
        this.requestId++;
        this.root?.empty();
        this.root = null;
        this.searchInput = null;
    }

    private renderPage(page: { items: DiagramHistoryEntry[]; page: number; totalPages: number; totalItems: number }): void {
        if (!this.root) return;
        const root = this.root;
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).diagramHistory;
        root.empty();
        root.setAttribute('data-notemd-history-view', 'true');
        const toolbar = root.createDiv({ cls: 'notemd-diagram-history-header notemd-diagram-history-toolbar', attr: { role: 'search', 'aria-label': copy.title } });
        this.searchInput = toolbar.createEl('input', {
            type: 'search',
            placeholder: copy.searchPlaceholder,
            attr: { 'aria-label': copy.searchPlaceholder, 'data-notemd-history-search': 'true' }
        });
        this.searchInput.value = this.query.search ?? '';
        this.searchInput.oninput = () => {
            this.query.search = this.searchInput?.value || undefined;
            this.query.page = 1;
            void this.refresh();
        };
        toolbar.createDiv({ cls: 'notemd-diagram-history-count', text: formatI18n(copy.count, { count: page.totalItems }) });
        const filterToggle = toolbar.createEl('button', {
            text: this.filtersOpen ? copy.hideFilters : copy.filters,
            cls: 'notemd-diagram-history-filter-toggle',
            attr: { 'data-notemd-history-filters-toggle': 'true', 'aria-expanded': String(this.filtersOpen) }
        });
        filterToggle.onclick = () => { this.filtersOpen = !this.filtersOpen; void this.refresh(); };
        if (this.filtersOpen) this.renderFilters(toolbar, copy);
        root.createDiv({ text: copy.newestFirst, cls: 'notemd-diagram-history-sort-hint' });
        const list = root.createDiv({ cls: 'notemd-diagram-history-list', attr: { role: 'list', 'aria-label': copy.title } });
        if (page.items.length === 0) this.renderEmpty(list, copy);
        page.items.forEach(entry => this.renderEntry(list, entry, copy));
        const pager = root.createDiv({ cls: 'notemd-diagram-history-pager' });
        const previous = pager.createEl('button', { text: copy.previous });
        previous.disabled = page.page <= 1;
        previous.onclick = () => { this.query.page = Math.max(1, page.page - 1); void this.refresh(); };
        pager.createSpan({ text: formatI18n(copy.page, { page: page.page, total: page.totalPages }) });
        const next = pager.createEl('button', { text: copy.next });
        next.disabled = page.page >= page.totalPages;
        next.onclick = () => { this.query.page = page.page + 1; void this.refresh(); };
    }

    private renderFilters(toolbar: HTMLElement, copy: ReturnType<typeof getI18nStrings>['diagramHistory']): void {
        const filters = toolbar.createDiv({ cls: 'notemd-diagram-history-filters' });
        this.addSelect(filters, copy.allTypes, INTENTS, this.query.intent, value => { this.query.intent = value as DiagramHistoryQuery['intent']; });
        this.addSelect(filters, copy.allFormats, SOURCE_FORMATS, this.query.sourceFormat, value => { this.query.sourceFormat = value as DiagramHistoryQuery['sourceFormat']; });
        this.addSelect(filters, copy.anyExport, EXPORT_FORMATS, this.query.exportKind, value => { this.query.exportKind = value as DiagramHistoryQuery['exportKind']; });
        this.addDate(filters, copy.completedFrom, this.query.completedFrom, value => { this.query.completedFrom = value; });
        this.addDate(filters, copy.completedTo, this.query.completedTo, value => { this.query.completedTo = value === undefined ? undefined : value + 86_399_999; });
    }

    private addSelect(parent: HTMLElement, label: string, values: string[], current: string | undefined, update: (value: string | undefined) => void): void {
        const select = parent.createEl('select', { attr: { 'aria-label': label, 'data-notemd-history-filter': 'true' } });
        select.createEl('option', { value: '', text: label });
        values.forEach(value => select.createEl('option', { value, text: value }));
        select.value = current ?? '';
        select.onchange = () => { update(select.value || undefined); this.query.page = 1; void this.refresh(); };
    }

    private addDate(parent: HTMLElement, label: string, current: number | undefined, update: (value: number | undefined) => void): void {
        const input = parent.createEl('input', { type: 'date', attr: { 'aria-label': label, 'data-notemd-history-filter': 'true' } });
        if (current !== undefined) input.value = new Date(current).toISOString().slice(0, 10);
        input.onchange = () => {
            update(input.value ? new Date(`${input.value}T00:00:00`).getTime() : undefined);
            this.query.page = 1;
            void this.refresh();
        };
    }

    private renderEmpty(list: HTMLElement, copy: ReturnType<typeof getI18nStrings>['diagramHistory']): void {
        const hasFilters = Boolean(this.query.search || this.query.intent || this.query.sourceFormat || this.query.exportKind || this.query.completedFrom || this.query.completedTo);
        const empty = list.createDiv({ cls: 'notemd-diagram-history-empty' });
        empty.createEl('strong', { text: hasFilters ? copy.noResults : copy.emptyTitle });
        const action = empty.createEl('button', { text: hasFilters ? copy.clearFilters : copy.openSource });
        action.onclick = () => {
            if (hasFilters) {
                this.query = { page: 1, pageSize: this.query.pageSize };
                void this.refresh();
            } else {
                this.options.onEmptyAction?.();
            }
        };
    }

    private renderEntry(list: HTMLElement, entry: DiagramHistoryEntry, copy: ReturnType<typeof getI18nStrings>['diagramHistory']): void {
        const item = list.createDiv({ cls: 'notemd-diagram-history-item', attr: { 'data-notemd-history-entry': 'true', role: 'listitem' } });
        const header = item.createDiv({ cls: 'notemd-diagram-history-entry-header', attr: { 'data-notemd-history-entry-header': 'true' } });
        header.createEl('strong', { text: entry.title, attr: { title: entry.title } });
        if (entry.sourcePath) header.createDiv({ text: entry.sourcePath, cls: 'notemd-diagram-history-entry-source', attr: { title: entry.sourcePath } });
        item.createDiv({ text: `${new Date(entry.completedAt).toLocaleString()} · ${entry.intent} · ${entry.sourceFormat}`, cls: 'notemd-diagram-history-entry-meta' });
        const artifacts = item.createDiv({ cls: 'notemd-diagram-history-entry-artifacts', attr: { 'data-notemd-history-entry-artifacts': 'true' } });
        const exportNames = Object.keys(entry.exportPaths);
        artifacts.setText(exportNames.length ? formatI18n(copy.exports, { formats: exportNames.join(', ').toUpperCase() }) : copy.noExports);
        const actions = item.createDiv({ cls: 'notemd-diagram-history-actions', attr: { 'data-notemd-history-entry-actions': 'true' } });
        if (entry.artifactPath && this.options.store.reopenArtifact) {
            const reopen = actions.createEl('button', { text: copy.reopen, cls: 'mod-cta' });
            reopen.onclick = async () => { if (!(await this.options.store.reopenArtifact!(entry))) new Notice(copy.reopenFailed); };
        }
        if (entry.sourcePath && this.options.app) {
            const openSource = actions.createEl('button', { text: copy.openSource });
            openSource.onclick = () => { void this.options.app!.workspace.openLinkText(entry.sourcePath!, '', false); };
        }
        collectDiagramHistoryArtifactPaths(entry).forEach(path => {
            if (!this.options.app) return;
            const openArtifact = actions.createEl('button', { text: formatI18n(copy.openFile, { name: path.split('/').pop() ?? path }) });
            openArtifact.onclick = () => { void this.options.app!.workspace.openLinkText(path, '', false); };
        });
        const remove = actions.createEl('button', { text: copy.removeIndex });
        remove.onclick = async () => { await this.options.store.removeEntry(entry.id); await this.refresh(); };
        if (this.options.store.deleteArtifacts && collectDiagramHistoryArtifactPaths(entry).length > 0) {
            const deleteArtifacts = actions.createEl('button', { text: copy.deleteArtifacts, cls: 'mod-warning' });
            deleteArtifacts.onclick = async () => {
                if (await this.options.store.deleteArtifacts!(entry)) {
                    await this.options.store.removeEntry(entry.id);
                    await this.refresh();
                }
            };
        }
    }

    private renderError(error: unknown): void {
        if (!this.root) return;
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).diagramHistory;
        const panel = this.root.createDiv({ cls: 'notemd-diagram-history-error' });
        panel.createEl('strong', { text: error instanceof Error ? error.message : String(error) });
        const retry = panel.createEl('button', { text: copy.retry, attr: { 'data-notemd-history-retry': 'true' } });
        retry.onclick = () => { void this.refresh(); };
    }
}
