import { App, Modal, Notice } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import { renderMermaidArtifactSvg } from '../rendering/preview/mermaidPreview';
import {
    renderPreviewArtifactSvg,
    saveDiagramPreviewPng,
    saveDiagramPreviewSvg,
    saveDiagramSourceArtifact,
    supportsPreviewSvgExport
} from '../rendering/preview/previewExport';
import { RenderPreviewSession } from '../rendering/host/renderHost';
import {
    supportsInlineCanvasPreview,
    supportsInlineMermaidPreview,
    supportsInlineVegaLitePreview,
} from './diagramPreview';

export class DiagramPreviewModal extends Modal {
    constructor(
        app: App,
        private readonly session: RenderPreviewSession,
        private readonly uiLocale = 'auto'
    ) {
        super(app);
    }

    onOpen() {
        const i18n = getI18nStrings({ uiLocale: this.uiLocale });
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('notemd-diagram-preview-modal');

        contentEl.createEl('h3', {
            text: formatI18n(i18n.previewModal.title, { target: this.session.payload.artifact.target })
        });

        const toolbar = contentEl.createDiv({ cls: 'notemd-diagram-preview-toolbar' });
        const copyButton = toolbar.createEl('button', {
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
            const saveSourceButton = toolbar.createEl('button', {
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
            const exportButton = toolbar.createEl('button', {
                text: i18n.previewModal.exportSvg
            });
            exportButton.onclick = async () => {
                exportButton.disabled = true;
                exportButton.setText(i18n.previewModal.exportingSvg);
                try {
                    const outputPath = await saveDiagramPreviewSvg(
                        this.app,
                        this.session.payload.sourcePath as string,
                        this.session.payload.artifact
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

            const exportPngButton = toolbar.createEl('button', {
                text: i18n.previewModal.exportPng
            });
            exportPngButton.onclick = async () => {
                exportPngButton.disabled = true;
                exportPngButton.setText(i18n.previewModal.exportingPng);
                try {
                    const outputPath = await saveDiagramPreviewPng(
                        this.app,
                        this.session.payload.sourcePath as string,
                        this.session.payload.artifact
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

        const closeButton = toolbar.createEl('button', { text: i18n.common.close });
        closeButton.onclick = () => this.close();

        if (this.session.payload.sourcePath) {
            contentEl.createEl('p', {
                text: formatI18n(i18n.previewModal.sourceFile, { path: this.session.payload.sourcePath }),
                cls: 'notemd-diagram-preview-source-path'
            });
        }

        const previewContainer = contentEl.createDiv({ cls: 'notemd-diagram-preview-body' });
        void this.renderPreview(previewContainer);
    }

    onClose() {
        this.contentEl.empty();
    }

    private async renderPreview(container: HTMLElement): Promise<void> {
        if (supportsInlineMermaidPreview(this.session.payload.artifact)) {
            const rendered = await this.tryRenderMermaid(container);
            if (rendered) {
                return;
            }
        }

        if (supportsInlineCanvasPreview(this.session.payload.artifact)) {
            const rendered = await this.tryRenderCanvas(container);
            if (rendered) {
                return;
            }
        }

        if (supportsInlineVegaLitePreview(this.session.payload.artifact)) {
            const rendered = await this.tryRenderVegaLite(container);
            if (rendered) {
                return;
            }
        }

        this.renderIframePreview(container);
    }

    private async tryRenderMermaid(container: HTMLElement): Promise<boolean> {
        try {
            const svg = await renderMermaidArtifactSvg(this.session.payload.artifact);
            container.empty();
            container.addClass('is-mermaid');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render Mermaid preview. Falling back to srcdoc preview.', error);
            return false;
        }
    }

    private async tryRenderCanvas(container: HTMLElement): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(this.session.payload.artifact);
            container.empty();
            container.addClass('is-json-canvas');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render JSON Canvas preview. Falling back to srcdoc preview.', error);
            return false;
        }
    }

    private renderIframePreview(container: HTMLElement): void {
        container.empty();
        const iframe = container.createEl('iframe', { cls: 'notemd-diagram-preview-frame' });
        iframe.setAttribute('sandbox', 'allow-same-origin');
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.srcdoc = this.session.htmlSrcdoc;
    }

    private async tryRenderVegaLite(container: HTMLElement): Promise<boolean> {
        try {
            const svg = await renderPreviewArtifactSvg(this.session.payload.artifact);
            container.empty();
            container.addClass('is-vega-lite');
            container.innerHTML = svg;
            return true;
        } catch (error) {
            console.error('Failed to render Vega-Lite preview. Falling back to srcdoc preview.', error);
            return false;
        }
    }
}
