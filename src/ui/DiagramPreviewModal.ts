import { mountDiagramSvg } from '../rendering/preview/svgHostSanitizer';
import { App, Modal, Notice } from 'obsidian';
import { DiagramPreviewViewport } from './DiagramPreviewViewport';
import { formatI18n, getI18nStrings } from '../i18n';
import {
    renderPreviewArtifactSvg,
    saveDiagramPreviewPdfToFolder,
    saveDiagramPreviewPanelSvgToFolder,
    saveDiagramPreviewPanelPngToFolder,
    saveDiagramPreviewPanelPdfToFolder,
    saveDiagramPreviewPngToFolder,
    saveDiagramPreviewSvgToFolder,
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
import { selectDiagramPreviewExport, type DiagramPreviewExportFormat } from './DiagramPreviewExportFolderModal';
import { retryDiagramExportRun, startDiagramExportRun } from '../diagram/diagramExportRun';
import type { DiagramExportRun, DiagramExportRequest } from '../diagram/diagramExportRun';
import { getDiagramOutputLabel } from './diagramOutputSelector';
import { resolveDiagramOutputPlan } from '../diagram/diagramOutputPreferences';
import { findDefaultDiagramType } from '../diagram/diagramTypeCatalog';

type PreviewExportTarget = { id: string } & Record<DiagramPreviewExportFormat, (folderPath: string) => Promise<string>>;

export interface DiagramPreviewModalOptions {
    exportRun?: DiagramExportRun;
    exportRequest?: DiagramExportRequest;
    onExportRunSaved?: (run: DiagramExportRun) => Promise<void>;
    exportPpi?: number;
    obsidianCompatiblePng?: boolean;
    historyEntryId?: string;
    historyStore?: DiagramHistoryStore;
}

export class DiagramPreviewModal extends Modal {
    private session: RenderPreviewSession;
    private exporting = false;
    private readonly exportButtons = new Set<HTMLButtonElement>();
    private currentHistoryEntryId: string | null = null;
    private readonly exportPpi: number;
    private readonly obsidianCompatiblePng: boolean;
    private readonly pngAbort = new AbortController();
    private readonly historyStore?: DiagramHistoryStore;
    private readonly historyEntryId?: string;
    private historyDrawer: DiagramHistoryDrawer | null = null;
    private readonly previewViewports = new Set<DiagramPreviewViewport>();
    private exportRun?: DiagramExportRun;
    private exportHistoryError?: string;
    private readonly exportRequest?: DiagramExportRequest;
    private readonly exportSession: RenderPreviewSession;
    private readonly onExportRunSaved?: (run: DiagramExportRun) => Promise<void>;
    private exportReporter: { cancelled: boolean; log: (message: string) => void } = { cancelled: false, log: () => undefined };

    constructor(
        app: App,
        session: RenderPreviewSession,
        private readonly uiLocale = 'auto',
        options: DiagramPreviewModalOptions = {}
    ) {
        super(app);
        this.session = session;
        this.exportSession = session;
        this.exportRun = options.exportRun;
        this.exportRequest = options.exportRequest;
        this.onExportRunSaved = options.onExportRunSaved;
        this.exportPpi = resolvePreviewExportPpi(options.exportPpi);
        this.obsidianCompatiblePng = options.obsidianCompatiblePng ?? true;
        this.historyStore = options.historyStore;
        this.historyEntryId = options.historyEntryId;
    }

    onOpen() {
        this.modalEl.addClass('notemd-diagram-preview-shell');
        this.currentHistoryEntryId = rememberDiagramPreviewSession(this.session).id;
        this.resetHistoryDrawer();
        this.renderModal();
    }

    onClose() {
        this.exportReporter.cancelled = true;
        this.pngAbort.abort();
        this.destroyPreviewViewports();
        this.historyDrawer?.destroy();
        this.historyDrawer = null;
        this.modalEl.removeClass('notemd-diagram-preview-shell');
        this.contentEl.empty();
    }

    private renderModal(): void {
        this.destroyPreviewViewports();
        this.exportButtons.clear();
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
                attr: { 'aria-haspopup': 'dialog' }
            });
            exportMenuButton.disabled = this.exporting;
            this.exportButtons.add(exportMenuButton);
            exportMenuButton.onclick = () => this.exportPreview();
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
        if (this.session === this.exportSession) this.renderExportRun(stage);

        const previewContainer = stage.createDiv({ cls: 'notemd-diagram-preview-body' });
        void this.renderPreview(previewContainer);
    }

    private renderExportRun(stage: HTMLElement): void {
        if (!this.exportRun && !this.exportRequest) return;
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).diagramOutputs;
        const run = this.exportRun;
        const panel = stage.createEl('details', { cls: 'notemd-diagram-export-run', attr: { 'data-diagram-export-run': '', 'aria-live': 'polite' } });
        // A successful status alone is insufficient when delivery or history still needs attention.
        panel.open = !(run?.status === 'completed' && run.outputs.length > 0
            && run.outputs.every(output => output.status === 'completed' && !output.error)
            && !this.exportHistoryError
            && !this.session.payload.artifact.diagnostics?.some(diagnostic => diagnostic.severity === 'error'));
        panel.createEl('summary', { text: run
            ? formatI18n(copy.runStatus, { status: copy[run.status], count: run.outputs.filter(output => output.status === 'completed').length, total: run.outputs.length })
            : copy.exportSelected });
        if (this.exportHistoryError) panel.createEl('p', { text: this.exportHistoryError, attr: { role: 'alert' } });
        if (!run && this.exportRequest) {
            const request = this.exportRequest;
            const typeId = request.generation.plan.catalogTypeId ?? findDefaultDiagramType(request.generation.spec.intent).id;
            const plan = resolveDiagramOutputPlan(typeId, request.requestedOutputs, request.generation.artifact.target);
            panel.createEl('p', { text: formatI18n(copy.effective, { outputs: plan.outputs.map(id => getDiagramOutputLabel(id, { uiLocale: this.uiLocale })).join(', ') }) });
            if (plan.inactiveOutputs.length) panel.createEl('p', { text: formatI18n(copy.inactive, { outputs: plan.inactiveOutputs.map(output => getDiagramOutputLabel(output.id, { uiLocale: this.uiLocale })).join(', ') }) });
        }
        if (run) {
            const list = panel.createEl('ul');
            for (const output of run.outputs) {
                const item = list.createEl('li');
                item.createEl('span', { text: formatI18n(copy.outputStatus, { output: getDiagramOutputLabel(output.id, { uiLocale: this.uiLocale }), status: copy[output.status] }) });
                if (output.status === 'completed') {
                    const link = item.createEl('a', { text: output.path, href: '#', attr: { 'data-diagram-export-path': output.path } });
                    link.onclick = event => { event.preventDefault(); void this.app.workspace.openLinkText(output.path, run.sourcePath, true); };
                }
                if (output.error) item.createEl('small', { text: output.error });
            }
            if (run.plan.inactiveOutputs.length) panel.createEl('p', { text: formatI18n(copy.inactive, { outputs: run.plan.inactiveOutputs.map(output => getDiagramOutputLabel(output.id, { uiLocale: this.uiLocale })).join(', ') }) });
            if (run.plan.usedDefaultOutput) panel.createEl('p', { text: copy.fallback });
            panel.createEl('p', { text: formatI18n(copy.runManifest, { path: run.manifestPath }) });
        }
        if (run?.outputs.every(output => output.status === 'completed')) return;
        const button = panel.createEl('button', { text: run ? copy.retry : copy.exportSelected, attr: { 'data-diagram-export-retry': '' } });
        const feedback = panel.createEl('p', { attr: { role: 'alert' } });
        button.onclick = async () => {
            button.disabled = true;
            button.setText(copy.retrying);
            this.exportReporter = { cancelled: false, log: message => feedback.setText(message) };
            try {
                const request = this.exportRequest;
                const saved = run ? await retryDiagramExportRun(this.app, run.manifestPath, this.exportReporter)
                    : await startDiagramExportRun(this.app, request!.sourcePath, request!.generation, request!.requestedOutputs, request!.ppi, this.exportReporter, undefined, request!);
                this.exportRun = saved;
                try {
                    await this.onExportRunSaved?.(saved);
                    this.exportHistoryError = undefined;
                } catch (error) {
                    this.exportHistoryError = formatI18n(copy.historyFailed, { message: error instanceof Error ? error.message : String(error) });
                }
                if (!this.exportReporter.cancelled) this.renderModal();
            } catch (error) {
                feedback.setText(error instanceof Error ? error.message : String(error));
            } finally {
                button.disabled = false;
                button.setText(run ? copy.retry : copy.exportSelected);
            }
        };
    }

    private resetHistoryDrawer(): void {
        this.historyDrawer?.destroy();
        this.historyDrawer = this.historyStore
            ? new DiagramHistoryDrawer(this.contentEl, {
                app: this.app,
                store: this.historyStore,
                uiLocale: this.uiLocale
            })
            : null;
    }

    private destroyPreviewViewports(): void {
        this.previewViewports.forEach(viewport => viewport.destroy());
        this.previewViewports.clear();
    }

    private async exportPreview(): Promise<void> {
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) return;
        const panels = this.session.payload.artifact.previewPanels;
        const targets = panels && panels.length > 1
            ? panels.map(panel => this.createPanelExportTarget(sourcePath, panel))
            : [this.createArtifactExportTarget(sourcePath, this.session.payload.artifact)];
        await this.exportTargets(sourcePath, targets);
    }

    private async exportPanel(panel: NonNullable<RenderArtifact['previewPanels']>[number]): Promise<void> {
        const sourcePath = this.session.payload.sourcePath;
        if (!sourcePath) return;
        await this.exportTargets(sourcePath, [this.createPanelExportTarget(sourcePath, panel)]);
    }

    private createArtifactExportTarget(sourcePath: string, artifact: RenderArtifact): PreviewExportTarget {
        return {
            id: sourcePath,
            SVG: folder => saveDiagramPreviewSvgToFolder(this.app, sourcePath, folder, artifact, this.createBundledPreviewRenderDeps()),
            PNG: folder => saveDiagramPreviewPngToFolder(this.app, sourcePath, folder, artifact, this.createPngExportDeps()),
            PDF: folder => saveDiagramPreviewPdfToFolder(this.app, sourcePath, folder, artifact, {
                ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi
            })
        };
    }

    private createPanelExportTarget(sourcePath: string, panel: NonNullable<RenderArtifact['previewPanels']>[number]): PreviewExportTarget {
        return {
            id: panel.id,
            SVG: folder => saveDiagramPreviewPanelSvgToFolder(this.app, sourcePath, panel.id, folder, panel.artifact, this.createBundledPreviewRenderDeps()),
            PNG: folder => saveDiagramPreviewPanelPngToFolder(this.app, sourcePath, panel.id, folder, panel.artifact, this.createPngExportDeps()),
            PDF: folder => saveDiagramPreviewPanelPdfToFolder(this.app, sourcePath, panel.id, folder, panel.artifact, {
                ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi
            })
        };
    }

    private createPngExportDeps() {
        return {
            ...this.createBundledPreviewRenderDeps(), ppi: this.exportPpi,
            obsidianCompatiblePng: this.obsidianCompatiblePng, signal: this.pngAbort.signal,
            onPngSaved: (delivery: { path: string; files: string[] }) => this.recordExportPath('png', delivery.path, delivery.files)
        };
    }

    private async exportTargets(sourcePath: string, targets: PreviewExportTarget[]): Promise<void> {
        if (this.exporting || this.pngAbort.signal.aborted) return;
        this.exporting = true;
        this.exportButtons.forEach(button => { button.disabled = true; });
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        try {
            const selection = await selectDiagramPreviewExport(this.app, sourcePath, this.uiLocale);
            if (!selection || this.pngAbort.signal.aborted) return;
            let totalSuccess = 0;
            const batchFailures: string[] = [];
            const progressLabels = { SVG: copy.exportingSvg, PNG: copy.exportingPng, PDF: copy.exportingPdf };
            let completedOutputs = 0;
            for (const format of selection.formats) {
                let successCount = 0;
                let lastOutputPath = '';
                const failures: string[] = [];
                for (const target of targets) {
                    if (this.pngAbort.signal.aborted) return;
                    this.exportButtons.forEach(button => button.setText(`${progressLabels[format]} (${completedOutputs + 1}/${targets.length * selection.formats.length})`));
                    try {
                        lastOutputPath = await target[format](selection.folderPath);
                        await this.recordExportPath(format.toLowerCase() as DiagramHistoryExportKind, lastOutputPath);
                        successCount += 1;
                        totalSuccess += 1;
                    } catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        failures.push(target.id + ': ' + message);
                        batchFailures.push(format + ' · ' + target.id + ': ' + message);
                        console.error('Failed to export diagram preview ' + format + ' (' + target.id + '):', error);
                    }
                    completedOutputs += 1;
                }
                if (failures.length) {
                    new Notice(formatI18n(copy.exportFolderBatchPartialNotice, {
                        success: successCount, total: targets.length, format, failures: failures.join('; ')
                    }));
                } else if (targets.length === 1) {
                    const successNotices = { SVG: copy.exportSuccessNotice, PNG: copy.exportPngSuccessNotice, PDF: copy.exportPdfSuccessNotice };
                    new Notice(formatI18n(successNotices[format], { path: lastOutputPath }));
                } else {
                    new Notice(formatI18n(copy.exportFolderBatchSuccessNotice, {
                        success: successCount, total: targets.length, format, path: selection.folderPath || '/'
                    }));
                }
            }
            // The last notice describes the whole selection, so a later success cannot hide an earlier failure.
            if (selection.formats.length > 1) {
                new Notice(formatI18n(batchFailures.length ? copy.exportFolderBatchPartialNotice : copy.exportFolderBatchSuccessNotice, {
                    success: totalSuccess, total: targets.length * selection.formats.length,
                    format: selection.formats.join(', '), failures: batchFailures.join('; '), path: selection.folderPath || '/'
                }));
            }
        } finally {
            this.exporting = false;
            this.exportButtons.forEach(button => { button.disabled = false; button.setText(copy.exportMenu); });
        }
    }

    private renderDiagnosticsPanel(container: HTMLElement, i18n: ReturnType<typeof getI18nStrings>): void {
        const diagnostics = this.session.payload.artifact.diagnostics ?? [];
        if (diagnostics.length === 0) {
            return;
        }

        const diagnosticCounts = summarizeRenderArtifactDiagnostics(diagnostics);
        const panel = container.createEl('details', { cls: 'notemd-diagram-preview-diagnostics' });
        // Keep non-blocking evidence out of the preview's way, but expose the diagnostic groups when errors exist.
        panel.open = diagnosticCounts.hasErrors;
        const heading = panel.createEl('summary', { cls: 'notemd-diagram-preview-diagnostics-heading' });
        heading.createEl('span', {
            text: i18n.previewModal.diagnosticsTitle,
            cls: 'notemd-diagram-preview-diagnostics-title'
        });

        heading.createEl('span', {
            text: formatRenderArtifactDiagnosticSummary(diagnosticCounts, i18n.previewModal.diagnosticSummary),
            cls: 'notemd-diagram-preview-diagnostics-summary'
        });

        const list = panel.createDiv({ cls: 'notemd-diagram-preview-diagnostics-list' });
        const groups = new Map<string, typeof diagnostics>();
        for (const diagnostic of diagnostics) {
            const key = `${diagnostic.severity}:${diagnostic.kind}`;
            const group = groups.get(key);
            if (group) group.push(diagnostic);
            else groups.set(key, [diagnostic]);
        }
        for (const entries of groups.values()) {
            const { kind, severity } = entries[0];
            // Separate severity even within a tag so opening an error never exposes warnings as if they were errors.
            const group = list.createEl('details', { cls: 'notemd-diagram-preview-diagnostic-group' });
            group.open = severity === 'error';
            const heading = group.createEl('summary', { cls: 'notemd-diagram-preview-diagnostic-group-heading' });
            heading.createEl('span', { text: kind, cls: 'notemd-diagram-preview-diagnostic-group-tag' });
            heading.createEl('span', {
                text: formatRenderArtifactDiagnosticSummary(
                    summarizeRenderArtifactDiagnostics(entries), i18n.previewModal.diagnosticSummary
                ),
                cls: 'notemd-diagram-preview-diagnostic-group-counts'
            });
            for (const diagnostic of entries) {
                const item = group.createDiv({
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
    }

    private async recordArtifactPath(path: string): Promise<void> {
        if (this.historyEntryId && this.historyStore?.recordArtifactPath) {
            await this.historyStore.recordArtifactPath(this.historyEntryId, path);
        }
    }

    private async recordExportPath(kind: DiagramHistoryExportKind, path: string, companionPaths?: readonly string[]): Promise<void> {
        if (this.historyEntryId && this.historyStore?.recordExportPath) {
            if (companionPaths) await this.historyStore.recordExportPath(this.historyEntryId, kind, path, companionPaths);
            else await this.historyStore.recordExportPath(this.historyEntryId, kind, path);
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
        container.addClass('notemd-diagram-preview-scroll-region');
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
                    attr: { 'aria-haspopup': 'dialog' }
                });
                panelExportButton.disabled = this.exporting;
                this.exportButtons.add(panelExportButton);
                panelExportButton.onclick = () => this.exportPanel(panel);
            }
            const panelBody = panelContainer.createDiv({ cls: 'notemd-diagram-preview-panel-body' });
            await this.renderArtifactPreview(panelBody, panel.artifact);
        }
    }

    private async renderArtifactPreview(container: HTMLElement, artifact: RenderArtifact): Promise<void> {
        if (supportsSourceOnlyDiagramPreview(artifact) && !supportsPreviewSvgExport(artifact)) {
            this.renderSourceOnlyPreview(container, artifact);
            return;
        }
        const viewport = new DiagramPreviewViewport(container, getI18nStrings({ uiLocale: this.uiLocale }).previewModal);
        this.previewViewports.add(viewport);
        await this.renderArtifactContents(viewport.contentEl, artifact, viewport);
        viewport.refresh();
    }

    private async renderArtifactContents(container: HTMLElement, artifact: RenderArtifact, viewport: DiagramPreviewViewport): Promise<void> {
        if (supportsInlineMermaidPreview(artifact) || supportsInlineVegaLitePreview(artifact)) {
            this.renderIframePreview(container, artifact, viewport);
            return;
        }

        if (supportsInlineCanvasPreview(artifact)) {
            const rendered = await this.tryRenderCanvas(container, artifact);
            if (rendered) {
                return;
            }
        }

        if (supportsIframeHtmlPreview(artifact)) {
            this.renderIframePreview(container, artifact, viewport);
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

        this.renderIframePreview(container, artifact, viewport);
    }

    private async tryRenderCanvas(container: HTMLElement, artifact: RenderArtifact): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(
                artifact,
                this.createBundledPreviewRenderDeps()
            );
            container.empty();
            container.addClass('is-json-canvas');
            mountDiagramSvg(container, svg);
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
            mountDiagramSvg(container, svg);
            return true;
        } catch (error) {
            console.error('Failed to render diagram SVG preview. Falling back to source preview.', error);
            return false;
        }
    }

    private renderIframePreview(container: HTMLElement, artifact: RenderArtifact, viewport: DiagramPreviewViewport): void {
        container.empty();
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const iframe = container.createEl('iframe', { cls: 'notemd-diagram-preview-frame' });
        iframe.setAttribute('title', this.session.payload.previewTitle ?? getRenderTargetDisplayName(artifact.target));
        iframe.setAttribute('sandbox', this.getIframeSandboxPolicy(artifact));
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        let settled = false;
        const timeout = typeof window !== 'undefined'
            ? window.setTimeout(() => {
                if (settled) return;
                settled = true;
                iframe.addClass('is-load-failed');
                container.createEl('p', {
                    text: copy.previewLoadTimeout,
                    cls: 'notemd-diagram-preview-error'
                });
            }, 8000)
            : undefined;
        iframe.onload = () => {
            settled = true;
            if (timeout !== undefined) globalThis.clearTimeout(timeout);
            viewport.attachIframe(iframe);
        };
        iframe.onerror = () => {
            settled = true;
            if (timeout !== undefined) globalThis.clearTimeout(timeout);
            container.createEl('p', {
                text: copy.previewLoadFailed,
                cls: 'notemd-diagram-preview-error'
            });
        };
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
