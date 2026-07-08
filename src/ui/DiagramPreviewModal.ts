import { App, Modal, Notice } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import {
    renderPreviewArtifactSvg,
    saveDiagramPreviewPng,
    saveDiagramPreviewSvg,
    saveDiagramSourceArtifact,
    supportsPreviewSvgExport
} from '../rendering/preview/previewExport';
import { RenderPreviewSession } from '../rendering/host/renderHost';
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

export class DiagramPreviewModal extends Modal {
    private session: RenderPreviewSession;
    private currentHistoryEntryId: string | null = null;

    constructor(
        app: App,
        session: RenderPreviewSession,
        private readonly uiLocale = 'auto'
    ) {
        super(app);
        this.session = session;
    }

    onOpen() {
        this.modalEl.addClass('notemd-diagram-preview-shell');
        this.currentHistoryEntryId = rememberDiagramPreviewSession(this.session).id;
        this.renderModal();
    }

    onClose() {
        this.modalEl.removeClass('notemd-diagram-preview-shell');
        this.contentEl.empty();
    }

    private renderModal(): void {
        const i18n = getI18nStrings({ uiLocale: this.uiLocale });
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('notemd-diagram-preview-modal');
        contentEl.setAttribute('data-render-theme', this.session.payload.resolvedTheme ?? this.session.payload.theme);

        contentEl.createEl('h3', {
            text: this.session.payload.previewTitle
                || formatI18n(i18n.previewModal.title, {
                    target: getRenderTargetDisplayName(this.session.payload.artifact.target)
                })
        });

        const layout = contentEl.createDiv({ cls: 'notemd-diagram-preview-layout' });
        const rail = layout.createDiv({ cls: 'notemd-diagram-preview-rail' });
        const actions = rail.createDiv({ cls: 'notemd-diagram-preview-actions' });
        const copyButton = actions.createEl('button', {
            text: i18n.previewModal.copySource,
            cls: 'mod-cta'
        });
        copyButton.onclick = () => {
            const clipboard = navigator.clipboard;
            if (!clipboard?.writeText) {
                new Notice(i18n.previewModal.copyFailedNotice);
                return;
            }

            clipboard.writeText(this.session.payload.artifact.content).then(() => {
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

        if (this.session.payload.sourcePath && supportsPreviewSvgExport(this.session.payload.artifact)) {
            const exportButton = actions.createEl('button', {
                text: i18n.previewModal.exportSvg
            });
            exportButton.onclick = async () => {
                exportButton.disabled = true;
                exportButton.setText(i18n.previewModal.exportingSvg);
                try {
                    const outputPath = await saveDiagramPreviewSvg(
                        this.app,
                        this.session.payload.sourcePath as string,
                        this.session.payload.artifact,
                        { theme: this.session.payload.resolvedTheme ?? this.session.payload.theme }
                    );
                    new Notice(formatI18n(i18n.previewModal.exportSuccessNotice, { path: outputPath }));
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    new Notice(formatI18n(i18n.previewModal.exportFailedNotice, { message }));
                    console.error('Failed to export diagram preview SVG:', error);
                } finally {
                    exportButton.disabled = false;
                    exportButton.setText(i18n.previewModal.exportSvg);
                }
            };

            const exportPngButton = actions.createEl('button', {
                text: i18n.previewModal.exportPng
            });
            exportPngButton.onclick = async () => {
                exportPngButton.disabled = true;
                exportPngButton.setText(i18n.previewModal.exportingPng);
                try {
                    const outputPath = await saveDiagramPreviewPng(
                        this.app,
                        this.session.payload.sourcePath as string,
                        this.session.payload.artifact,
                        { theme: this.session.payload.resolvedTheme ?? this.session.payload.theme }
                    );
                    new Notice(formatI18n(i18n.previewModal.exportPngSuccessNotice, { path: outputPath }));
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    new Notice(formatI18n(i18n.previewModal.exportPngFailedNotice, { message }));
                    console.error('Failed to export diagram preview PNG:', error);
                } finally {
                    exportPngButton.disabled = false;
                    exportPngButton.setText(i18n.previewModal.exportPng);
                }
            };
        }

        const closeButton = actions.createEl('button', { text: i18n.common.close });
        closeButton.onclick = () => this.close();

        this.renderHistoryPanel(rail, i18n);

        const stage = layout.createDiv({ cls: 'notemd-diagram-preview-stage' });
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

    private renderHistoryPanel(container: HTMLElement, i18n: ReturnType<typeof getI18nStrings>): void {
        const historyEl = container.createDiv({ cls: 'notemd-diagram-preview-history' });
        historyEl.createEl('h4', {
            text: i18n.previewModal.historyTitle,
            cls: 'notemd-diagram-preview-history-title'
        });

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
        if (supportsInlineMermaidPreview(this.session.payload.artifact) || supportsInlineVegaLitePreview(this.session.payload.artifact)) {
            this.renderIframePreview(container);
            return;
        }

        if (supportsInlineCanvasPreview(this.session.payload.artifact)) {
            const rendered = await this.tryRenderCanvas(container);
            if (rendered) {
                return;
            }
        }

        if (supportsIframeHtmlPreview(this.session.payload.artifact)) {
            this.renderIframePreview(container);
            return;
        }

        if (supportsPreviewSvgExport(this.session.payload.artifact)) {
            const rendered = await this.tryRenderPreviewSvg(container);
            if (rendered) {
                return;
            }
        }

        if (supportsSourceOnlyDiagramPreview(this.session.payload.artifact)) {
            this.renderSourceOnlyPreview(container);
            return;
        }

        this.renderIframePreview(container);
    }

    private async tryRenderCanvas(container: HTMLElement): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(this.session.payload.artifact, {
                theme: this.session.payload.resolvedTheme ?? this.session.payload.theme
            });
            container.empty();
            container.addClass('is-json-canvas');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render JSON Canvas preview. Falling back to srcdoc preview.', error);
            return false;
        }
    }

    private async tryRenderPreviewSvg(container: HTMLElement): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(this.session.payload.artifact, {
                theme: this.session.payload.resolvedTheme ?? this.session.payload.theme
            });
            container.empty();
            container.addClass('is-svg-preview');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render diagram SVG preview. Falling back to source preview.', error);
            return false;
        }
    }

    private renderIframePreview(container: HTMLElement): void {
        container.empty();
        const iframe = container.createEl('iframe', { cls: 'notemd-diagram-preview-frame' });
        iframe.setAttribute('sandbox', this.getIframeSandboxPolicy());
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.srcdoc = this.session.htmlSrcdoc;
    }

    private renderSourceOnlyPreview(container: HTMLElement): void {
        container.empty();
        container.addClass('is-source-only');
        const sourceBlock = container.createEl('pre', { cls: 'notemd-diagram-preview-source-only' });
        sourceBlock.createEl('code', {
            text: this.session.payload.artifact.content,
            cls: 'notemd-diagram-preview-source-only-code'
        });
    }

    private getIframeSandboxPolicy(): string {
        if (
            this.session.payload.artifact.target === 'vega-lite'
            || this.session.payload.artifact.target === 'mermaid'
        ) {
            return 'allow-scripts allow-same-origin';
        }

        return 'allow-same-origin';
    }
}
