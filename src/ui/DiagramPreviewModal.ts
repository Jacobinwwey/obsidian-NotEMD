import { App, Menu, Modal, Notice } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import {
    renderPreviewArtifactSvg,
    saveDiagramPreviewPdf,
    saveDiagramPreviewPanelSvgToFolder,
    saveDiagramPreviewPanelPngToFolder,
    saveDiagramPreviewPanelPdfToFolder,
    saveDiagramPreviewPng,
    saveDiagramPreviewSvg,
    saveDiagramSourceArtifact,
    supportsPreviewSvgExport
} from '../rendering/preview/previewExport';
import { resolvePreviewExportPpi } from '../rendering/preview/pngPreview';
import { RenderPreviewSession } from '../rendering/host/renderHost';
import { IframeRenderHost } from '../rendering/host/iframeRenderHost';
import type { RenderArtifact } from '../rendering/types';
import {
    supportsIframeHtmlPreview,
    supportsInlineCanvasPreview,
    supportsInlineMermaidPreview,
    supportsInlineVegaLitePreview,
    supportsSourceOnlyDiagramPreview,
} from './diagramPreview';
import { getRenderTargetDisplayName } from '../rendering/targetLabel';
import {
    getDiagramPreviewHistoryEntry,
    listDiagramPreviewHistory,
    rememberDiagramPreviewSession
} from './diagramPreviewHistory';
import {
    formatRenderArtifactDiagnosticSummary,
    summarizeRenderArtifactDiagnostics
} from '../rendering/diagnostics';
import { DiagramHistoryDrawer } from './DiagramHistoryDrawer';
import { DiagramHistoryModal } from './DiagramHistoryModal';
import type { DiagramHistoryExportKind } from '../diagram/history/diagramHistoryRepository';
import type { DiagramHistoryStore } from './DiagramHistoryView';
import {
    getBundledMermaidPreviewDeps,
    getBundledVegaLitePreviewDeps
} from '../rendering/webview/bundledPreviewDeps';
import { selectDiagramPreviewExportFolder } from './DiagramPreviewExportFolderModal';

export class DiagramPreviewModal extends Modal {
    private session: RenderPreviewSession;
    private currentHistoryEntryId: string | null = null;
    private readonly exportPpi: number;
    private readonly historyStore?: DiagramHistoryStore;
    private readonly historyEntryId?: string;
    private historyDrawer: DiagramHistoryDrawer | null = null;

    constructor(
        app: App,
        session: RenderPreviewSession,
        private readonly uiLocale = 'auto',
        options: { exportPpi?: number; historyEntryId?: string; historyStore?: DiagramHistoryStore } = {}
    ) {
        super(app);
        this.session = session;
        this.exportPpi = resolvePreviewExportPpi(options.exportPpi);
        this.historyStore = options.historyStore;
        this.historyEntryId = options.historyEntryId;
    }

    onOpen() {
        this.modalEl.addClass('notemd-diagram-preview-shell');
        this.currentHistoryEntryId = rememberDiagramPreviewSession(this.session).id;
        if (this.historyStore) {
            this.historyDrawer = new DiagramHistoryDrawer(this.contentEl, {
                app: this.app,
                store: this.historyStore,
                uiLocale: this.uiLocale
            });
        }
        this.renderModal();
    }

    onClose() {
        this.historyDrawer?.destroy();
        this.historyDrawer = null;
        this.modalEl.removeClass('notemd-diagram-preview-shell');
        this.contentEl.empty();
    }

    private renderModal(): void {
        const i18n = getI18nStrings({ uiLocale: this.uiLocale });
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('notemd-diagram-preview-modal');
        contentEl.setAttribute('data-render-theme', this.session.payload.resolvedTheme ?? this.session.payload.theme);

        const heading = contentEl.createDiv({ cls: 'notemd-diagram-preview-heading' });
        heading.createEl('h3', {
            text: this.session.payload.previewTitle
                || formatI18n(i18n.previewModal.title, {
                    target: getRenderTargetDisplayName(this.session.payload.artifact.target)
                })
        });
        heading.createDiv({
            text: getRenderTargetDisplayName(this.session.payload.artifact.target),
            cls: 'notemd-diagram-preview-target-badge'
        });

        const actions = contentEl.createDiv({
            cls: 'notemd-diagram-preview-actions',
            attr: { role: 'toolbar', 'aria-label': i18n.previewModal.title }
        });
        if (this.session.payload.sourcePath && supportsPreviewSvgExport(this.session.payload.artifact)) {
            const exportMenuButton = actions.createEl('button', {
                text: i18n.previewModal.exportMenu,
                cls: 'mod-cta notemd-diagram-preview-export',
                attr: { 'aria-haspopup': 'menu' }
            });
            exportMenuButton.onclick = (event: MouseEvent) => this.showExportMenu(event);
        }
        const copyButton = actions.createEl('button', {
            text: i18n.previewModal.copySource
        });
        copyButton.onclick = () => {
            const clipboard = navigator.clipboard;
            if (!clipboard?.writeText) {
                new Notice(i18n.previewModal.copyFailedNotice);
                return;
            }

            clipboard.writeText(this.getCopySourceContent()).then(() => {
                new Notice(i18n.previewModal.copySuccessNotice);
            }).catch((error) => {
                new Notice(i18n.previewModal.copyFailedNotice);
                console.error('Failed to copy diagram source:', error);
            });
        };

        if (this.session.payload.sourcePath && !this.session.payload.artifactSaved) {
            const saveSourceButton = actions.createEl('button', {
                text: i18n.previewModal.saveSource
            });
            saveSourceButton.onclick = async () => {
                saveSourceButton.disabled = true;
                saveSourceButton.setText(i18n.previewModal.savingSource);
                try {
                    const outputPath = await saveDiagramSourceArtifact(
                        this.app,
                        this.session.payload.sourcePath as string,
                        this.session.payload.artifact
                    );
                    await this.recordArtifactPath(outputPath);
                    new Notice(formatI18n(i18n.previewModal.saveSourceSuccessNotice, { path: outputPath }));
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    new Notice(formatI18n(i18n.previewModal.saveSourceFailedNotice, { message }));
                    console.error('Failed to save diagram source artifact:', error);
                } finally {
                    saveSourceButton.disabled = false;
                    saveSourceButton.setText(i18n.previewModal.saveSource);
                }
            };
        }

        if (this.historyStore) {
            const historyButton = actions.createEl('button', { text: i18n.previewModal.historyTitle });
            historyButton.onclick = () => this.historyDrawer?.toggle(historyButton);
        }

        const closeButton = actions.createEl('button', { text: i18n.common.close });
        closeButton.onclick = () => this.close();

        const stage = contentEl.createDiv({ cls: 'notemd-diagram-preview-stage' });
        if (this.session.payload.sourcePath) {
            stage.createEl('p', {
                text: formatI18n(i18n.previewModal.sourceFile, { path: this.session.payload.sourcePath }),
                cls: 'notemd-diagram-preview-source-path'
            });
        }
        this.renderDiagnosticsPanel(stage, i18n);

        const previewContainer = stage.createDiv({ cls: 'notemd-diagram-preview-body' });
        void this.renderPreview(previewContainer);
    }

    private showExportMenu(event: MouseEvent): void {
        const menu = new Menu();
        menu.addItem(item => item.setTitle('SVG').setIcon('image').onClick(async () => this.exportSvg()));
        menu.addItem(item => item.setTitle('PNG').setIcon('image').onClick(async () => this.exportPng()));
        menu.addItem(item => item.setTitle('PDF').setIcon('file-text').onClick(async () => this.exportPdf()));
        menu.showAtMouseEvent(event);
    }

    private showPanelExportMenu(event: MouseEvent, panel: NonNullable<RenderArtifact['previewPanels']>[number]): void {
        const menu = new Menu();
        menu.addItem(item => item.setTitle('SVG').setIcon('image').onClick(async () => this.exportPanelSvg(panel)));
        menu.addItem(item => item.setTitle('PNG').setIcon('image').onClick(async () => this.exportPanelPng(panel)));
        menu.addItem(item => item.setTitle('PDF').setIcon('file-text').onClick(async () => this.exportPanelPdf(panel)));
        menu.showAtMouseEvent(event);
    }

    private async exportSvg(): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const panels = this.session.payload.artifact.previewPanels;
        if (panels && panels.length > 1) {
            await this.exportPreviewPanelsAsSeparateSvgFiles(panels, copy);
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewSvg(
                this.app,
                this.session.payload.sourcePath as string,
                this.session.payload.artifact,
                this.createBundledPreviewRenderDeps()
            );
            await this.recordExportPath('svg', outputPath);
            new Notice(formatI18n(copy.exportSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportFailedNotice, { message }));
            console.error('Failed to export diagram preview SVG:', error);
        }
    }

    private async exportPreviewPanelsAsSeparateSvgFiles(
        panels: NonNullable<RenderArtifact['previewPanels']>,
        copy: ReturnType<typeof getI18nStrings>['previewModal']
    ): Promise<void> {
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }

        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'SVG');
        if (folderPath === null) {
            return;
        }

        let successCount = 0;
        const failures: string[] = [];
        for (const panel of panels) {
            try {
                const outputPath = await saveDiagramPreviewPanelSvgToFolder(
                    this.app,
                    sourcePath,
                    panel.id,
                    folderPath,
                    panel.artifact,
                    this.createBundledPreviewRenderDeps()
                );
                await this.recordExportPath('svg', outputPath);
                successCount += 1;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                failures.push(`${panel.id}: ${message}`);
                console.error(`Failed to export diagram preview panel SVG (${panel.id}):`, error);
            }
        }

        if (failures.length > 0) {
            new Notice(formatI18n(copy.exportFolderBatchPartialNotice, {
                success: successCount,
                total: panels.length,
                format: 'SVG',
                failures: failures.join('; ')
            }));
            return;
        }

        new Notice(formatI18n(copy.exportFolderBatchSuccessNotice, {
            success: successCount,
            total: panels.length,
            format: 'SVG',
            path: folderPath || '/'
        }));
    }

    private async exportPng(): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const panels = this.session.payload.artifact.previewPanels;
        if (panels && panels.length > 1) {
            await this.exportPreviewPanelsAsSeparatePngFiles(panels, copy);
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewPng(
                this.app,
                this.session.payload.sourcePath as string,
                this.session.payload.artifact,
                { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
            );
            await this.recordExportPath('png', outputPath);
            new Notice(formatI18n(copy.exportPngSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportPngFailedNotice, { message }));
            console.error('Failed to export diagram preview PNG:', error);
        }
    }

    private async exportPdf(): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const panels = this.session.payload.artifact.previewPanels;
        if (panels && panels.length > 1) {
            await this.exportPreviewPanelsAsSeparatePdfFiles(panels, copy);
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewPdf(
                this.app,
                this.session.payload.sourcePath as string,
                this.session.payload.artifact,
                { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
            );
            await this.recordExportPath('pdf', outputPath);
            new Notice(formatI18n(copy.exportPdfSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportPdfFailedNotice, { message }));
            console.error('Failed to export diagram preview PDF:', error);
        }
    }

    private async exportPreviewPanelsAsSeparatePngFiles(
        panels: NonNullable<RenderArtifact['previewPanels']>,
        copy: ReturnType<typeof getI18nStrings>['previewModal']
    ): Promise<void> {
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }

        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'PNG');
        if (folderPath === null) {
            return;
        }

        let successCount = 0;
        const failures: string[] = [];
        for (const panel of panels) {
            try {
                const outputPath = await saveDiagramPreviewPanelPngToFolder(
                    this.app,
                    sourcePath,
                    panel.id,
                    folderPath,
                    panel.artifact,
                    { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
                );
                await this.recordExportPath('png', outputPath);
                successCount += 1;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                failures.push(`${panel.id}: ${message}`);
                console.error(`Failed to export diagram preview panel PNG (${panel.id}):`, error);
            }
        }

        this.showPanelBatchExportNotice(copy, 'PNG', successCount, panels.length, folderPath, failures);
    }

    private async exportPreviewPanelsAsSeparatePdfFiles(
        panels: NonNullable<RenderArtifact['previewPanels']>,
        copy: ReturnType<typeof getI18nStrings>['previewModal']
    ): Promise<void> {
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }

        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'PDF');
        if (folderPath === null) {
            return;
        }

        let successCount = 0;
        const failures: string[] = [];
        for (const panel of panels) {
            try {
                const outputPath = await saveDiagramPreviewPanelPdfToFolder(
                    this.app,
                    sourcePath,
                    panel.id,
                    folderPath,
                    panel.artifact,
                    { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
                );
                await this.recordExportPath('pdf', outputPath);
                successCount += 1;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                failures.push(`${panel.id}: ${message}`);
                console.error(`Failed to export diagram preview panel PDF (${panel.id}):`, error);
            }
        }

        this.showPanelBatchExportNotice(copy, 'PDF', successCount, panels.length, folderPath, failures);
    }

    private showPanelBatchExportNotice(
        copy: ReturnType<typeof getI18nStrings>['previewModal'],
        format: 'PNG' | 'PDF',
        successCount: number,
        totalCount: number,
        folderPath: string,
        failures: string[]
    ): void {
        if (failures.length > 0) {
            new Notice(formatI18n(copy.exportFolderBatchPartialNotice, {
                success: successCount,
                total: totalCount,
                format,
                failures: failures.join('; ')
            }));
            return;
        }

        new Notice(formatI18n(copy.exportFolderBatchSuccessNotice, {
            success: successCount,
            total: totalCount,
            format,
            path: folderPath || '/'
        }));
    }

    private async exportPanelSvg(panel: NonNullable<RenderArtifact['previewPanels']>[number]): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }
        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'SVG');
        if (folderPath === null) {
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewPanelSvgToFolder(
                this.app,
                sourcePath,
                panel.id,
                folderPath,
                panel.artifact,
                this.createBundledPreviewRenderDeps()
            );
            await this.recordExportPath('svg', outputPath);
            new Notice(formatI18n(copy.exportSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportFailedNotice, { message }));
            console.error('Failed to export diagram preview panel SVG:', error);
        }
    }

    private async exportPanelPng(panel: NonNullable<RenderArtifact['previewPanels']>[number]): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }
        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'PNG');
        if (folderPath === null) {
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewPanelPngToFolder(
                this.app,
                sourcePath,
                panel.id,
                folderPath,
                panel.artifact,
                { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
            );
            await this.recordExportPath('png', outputPath);
            new Notice(formatI18n(copy.exportPngSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportPngFailedNotice, { message }));
            console.error('Failed to export diagram preview panel PNG:', error);
        }
    }

    private async exportPanelPdf(panel: NonNullable<RenderArtifact['previewPanels']>[number]): Promise<void> {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) {
            return;
        }
        const folderPath = await selectDiagramPreviewExportFolder(this.app, sourcePath, this.uiLocale, 'PDF');
        if (folderPath === null) {
            return;
        }
        try {
            const outputPath = await saveDiagramPreviewPanelPdfToFolder(
                this.app,
                sourcePath,
                panel.id,
                folderPath,
                panel.artifact,
                { ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi }
            );
            await this.recordExportPath('pdf', outputPath);
            new Notice(formatI18n(copy.exportPdfSuccessNotice, { path: outputPath }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(formatI18n(copy.exportPdfFailedNotice, { message }));
            console.error('Failed to export diagram preview panel PDF:', error);
        }
    }

    private renderDiagnosticsPanel(container: HTMLElement, i18n: ReturnType<typeof getI18nStrings>): void {
        const diagnostics = this.session.payload.artifact.diagnostics ?? [];
        if (diagnostics.length === 0) {
            return;
        }

        const panel = container.createDiv({ cls: 'notemd-diagram-preview-diagnostics' });
        panel.createEl('h4', {
            text: i18n.previewModal.diagnosticsTitle,
            cls: 'notemd-diagram-preview-diagnostics-title'
        });

        const summary = formatRenderArtifactDiagnosticSummary(
            summarizeRenderArtifactDiagnostics(diagnostics),
            i18n.previewModal.diagnosticSummary
        );
        if (summary) {
            panel.createDiv({
                text: summary,
                cls: 'notemd-diagram-preview-diagnostics-summary'
            });
        }

        const list = panel.createDiv({ cls: 'notemd-diagram-preview-diagnostics-list' });
        for (const diagnostic of diagnostics) {
            const item = list.createDiv({
                cls: `notemd-diagram-preview-diagnostic is-${diagnostic.severity}`
            });
            item.createDiv({
                text: `${diagnostic.severity.toUpperCase()} · ${diagnostic.kind}`,
                cls: 'notemd-diagram-preview-diagnostic-meta'
            });
            item.createDiv({
                text: diagnostic.message,
                cls: 'notemd-diagram-preview-diagnostic-message'
            });
            if (diagnostic.advice?.trim()) {
                item.createDiv({
                    text: formatI18n(i18n.previewModal.diagnosticAdvice, { advice: diagnostic.advice }),
                    cls: 'notemd-diagram-preview-diagnostic-advice'
                });
            }
        }
    }

    private async recordArtifactPath(path: string): Promise<void> {
        if (this.historyEntryId && this.historyStore?.recordArtifactPath) {
            await this.historyStore.recordArtifactPath(this.historyEntryId, path);
        }
    }

    private async recordExportPath(kind: DiagramHistoryExportKind, path: string): Promise<void> {
        if (this.historyEntryId && this.historyStore?.recordExportPath) {
            await this.historyStore.recordExportPath(this.historyEntryId, kind, path);
        }
    }

    /* Legacy session history is superseded by the Vault-scoped drawer. */
    private renderHistoryPanel(container: HTMLElement, i18n: ReturnType<typeof getI18nStrings>): void {
        const historyEl = container.createDiv({
            cls: 'notemd-diagram-preview-history',
            attr: { role: 'region', 'aria-label': i18n.previewModal.historyTitle }
        });
        historyEl.createEl('h4', {
            text: i18n.previewModal.historyTitle,
            cls: 'notemd-diagram-preview-history-title'
        });
        if (this.historyStore) {
            const manage = historyEl.createEl('button', {
                text: i18n.previewModal.manageVaultHistory,
                cls: 'notemd-diagram-preview-history-manage',
                attr: { 'aria-label': i18n.previewModal.manageVaultHistory }
            });
            manage.onclick = () => new DiagramHistoryModal(this.app, this.historyStore!, this.uiLocale).open();
        }

        const historyList = historyEl.createDiv({ cls: 'notemd-diagram-preview-history-list' });
        for (const entry of listDiagramPreviewHistory()) {
            const item = historyList.createDiv({
                cls: `notemd-diagram-preview-history-item${entry.id === this.currentHistoryEntryId ? ' is-active' : ''}`
            });
            const button = item.createEl('button', {
                text: entry.label,
                cls: 'notemd-diagram-preview-history-button'
            });
            if (entry.id === this.currentHistoryEntryId) {
                button.disabled = true;
            }
            button.onclick = () => {
                const selected = getDiagramPreviewHistoryEntry(entry.id);
                if (!selected) {
                    return;
                }
                this.session = selected.session;
                this.currentHistoryEntryId = rememberDiagramPreviewSession(selected.session).id;
                this.renderModal();
            };

            const metaParts = [getRenderTargetDisplayName(entry.target)];
            if (entry.sourcePath) {
                metaParts.push(entry.sourcePath);
            }
            const diagnosticSummary = formatRenderArtifactDiagnosticSummary(
                summarizeRenderArtifactDiagnostics(entry.session.payload.artifact.diagnostics ?? []),
                i18n.previewModal.diagnosticSummary
            );
            if (diagnosticSummary) {
                metaParts.push(diagnosticSummary);
            }
            item.createDiv({
                text: metaParts.join(' · '),
                cls: 'notemd-diagram-preview-history-meta'
            });
        }
    }

    private async renderPreview(container: HTMLElement): Promise<void> {
        const panels = this.session.payload.artifact.previewPanels;
        if (!panels || panels.length === 0) {
            await this.renderArtifactPreview(container, this.session.payload.artifact);
            return;
        }

        container.empty();
        container.addClass('notemd-diagram-preview-panels');
        const i18n = getI18nStrings({ uiLocale: this.uiLocale });
        for (const [index, panel] of panels.entries()) {
            const panelContainer = container.createDiv({
                cls: 'notemd-diagram-preview-panel',
                attr: { 'data-preview-panel-id': panel.id }
            });
            const panelHeader = panelContainer.createDiv({ cls: 'notemd-diagram-preview-panel-header' });
            panelHeader.createEl('h4', {
                text: panel.title ?? formatI18n(i18n.previewModal.panelTitle, {
                    index: index + 1,
                    total: panels.length
                }),
                cls: 'notemd-diagram-preview-panel-title'
            });
            if (this.session.payload.sourcePath && supportsPreviewSvgExport(panel.artifact)) {
                const panelExportButton = panelHeader.createEl('button', {
                    text: i18n.previewModal.exportMenu,
                    cls: 'notemd-diagram-preview-panel-export',
                    attr: { 'aria-haspopup': 'menu' }
                });
                panelExportButton.onclick = (event: MouseEvent) => this.showPanelExportMenu(event, panel);
            }
            const panelBody = panelContainer.createDiv({ cls: 'notemd-diagram-preview-panel-body' });
            await this.renderArtifactPreview(panelBody, panel.artifact);
        }
    }

    private async renderArtifactPreview(container: HTMLElement, artifact: RenderArtifact): Promise<void> {
        if (supportsInlineMermaidPreview(artifact) || supportsInlineVegaLitePreview(artifact)) {
            this.renderIframePreview(container, artifact);
            return;
        }

        if (supportsInlineCanvasPreview(artifact)) {
            const rendered = await this.tryRenderCanvas(container, artifact);
            if (rendered) {
                return;
            }
        }

        if (supportsIframeHtmlPreview(artifact)) {
            this.renderIframePreview(container, artifact);
            return;
        }

        if (supportsPreviewSvgExport(artifact)) {
            const rendered = await this.tryRenderPreviewSvg(container, artifact);
            if (rendered) {
                return;
            }
        }

        if (supportsSourceOnlyDiagramPreview(artifact)) {
            this.renderSourceOnlyPreview(container, artifact);
            return;
        }

        this.renderIframePreview(container, artifact);
    }

    private async tryRenderCanvas(container: HTMLElement, artifact: RenderArtifact): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(
                artifact,
                this.createBundledPreviewRenderDeps()
            );
            container.empty();
            container.addClass('is-json-canvas');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render JSON Canvas preview. Falling back to srcdoc preview.', error);
            return false;
        }
    }

    private async tryRenderPreviewSvg(container: HTMLElement, artifact: RenderArtifact): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(
                artifact,
                this.createBundledPreviewRenderDeps()
            );
            container.empty();
            container.addClass('is-svg-preview');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render diagram SVG preview. Falling back to source preview.', error);
            return false;
        }
    }

    private renderIframePreview(container: HTMLElement, artifact: RenderArtifact): void {
        container.empty();
        const iframe = container.createEl('iframe', { cls: 'notemd-diagram-preview-frame' });
        iframe.setAttribute('sandbox', this.getIframeSandboxPolicy(artifact));
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.srcdoc = new IframeRenderHost().createSession(artifact, {
            theme: this.session.payload.theme,
            sourcePath: this.session.payload.sourcePath,
            artifactSaved: this.session.payload.artifactSaved,
            previewTitle: this.session.payload.previewTitle
        }).htmlSrcdoc;
    }

    private renderSourceOnlyPreview(container: HTMLElement, artifact: RenderArtifact): void {
        container.empty();
        container.addClass('is-source-only');
        const sourceBlock = container.createEl('pre', { cls: 'notemd-diagram-preview-source-only' });
        sourceBlock.createEl('code', {
            text: artifact.content,
            cls: 'notemd-diagram-preview-source-only-code'
        });
    }

    private createBundledPreviewRenderDeps() {
        return {
            mermaid: getBundledMermaidPreviewDeps(),
            vegaLiteDepsLoader: async () => getBundledVegaLitePreviewDeps(),
            theme: this.session.payload.resolvedTheme ?? this.session.payload.theme
        };
    }

    private getCopySourceContent(): string {
        const artifact = this.session.payload.artifact;
        const panels = artifact.previewPanels;
        if (
            panels && panels.length > 0
            && (artifact.target === 'mermaid' || artifact.target === 'vega-lite')
        ) {
            return panels.map(panel => panel.artifact.content.trim()).join('\n\n');
        }
        return artifact.content;
    }

    private getIframeSandboxPolicy(artifact: RenderArtifact): string {
        if (
            artifact.target === 'vega-lite'
            || artifact.target === 'mermaid'
        ) {
            return 'allow-scripts allow-same-origin';
        }

        return 'allow-same-origin';
    }
}
