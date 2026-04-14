import { App, Modal, Notice } from 'obsidian';
import mermaid from 'mermaid';
import { formatI18n, getI18nStrings } from '../i18n';
import { renderVegaLiteArtifactSvg } from '../rendering/preview/vegaLitePreview';
import { RenderPreviewSession } from '../rendering/host/renderHost';
import {
    supportsInlineMermaidPreview,
    supportsInlineVegaLitePreview,
    unwrapMermaidFence
} from './diagramPreview';

function createPreviewId(): string {
    return `notemd-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'loose'
            });

            const source = unwrapMermaidFence(this.session.payload.artifact.content);
            const result = await (mermaid as any).render(createPreviewId(), source);
            container.empty();
            container.addClass('is-mermaid');
            container.innerHTML = result.svg;
            return true;
        } catch (error) {
            console.error('Failed to render Mermaid preview. Falling back to srcdoc preview.', error);
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
            const svg = await renderVegaLiteArtifactSvg(this.session.payload.artifact);
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
