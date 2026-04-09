import { App, Modal, Notice } from 'obsidian';
import { getI18nStrings } from '../i18n';

// --- Error Modal for Copyable Messages ---
export class ErrorModal extends Modal {
    title: string;
    errorMessage: string;

    constructor(app: App, title: string, errorMessage: string) {
        super(app);
        this.title = title;
        this.errorMessage = errorMessage;
    }

    onOpen() {
        const i18n = getI18nStrings({ uiLocale: 'auto' });
        const { contentEl } = this;
        contentEl.addClass('notemd-error-modal');

        contentEl.createEl('h3', { text: this.title });

        // Display error in a preformatted block for easy selection/copying
        const errorBlock = contentEl.createEl('pre', { cls: 'notemd-error-message-block' });
        errorBlock.setText(this.errorMessage);

        // Add a copy button
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        const copyButton = buttonContainer.createEl('button', { text: i18n.errorModal.copyDetails, cls: 'mod-cta' });
        copyButton.onclick = () => {
            navigator.clipboard.writeText(this.errorMessage).then(() => {
                new Notice(i18n.errorModal.copySuccessNotice);
                copyButton.setText(i18n.errorModal.copied);
                setTimeout(() => copyButton.setText(i18n.errorModal.copyDetails), 2000);
            }).catch(err => {
                new Notice(i18n.errorModal.copyFailedNotice);
                console.error('Failed to copy error to clipboard:', err);
            });
        };

        const closeButton = buttonContainer.createEl('button', { text: i18n.common.close });
        closeButton.onclick = () => {
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
