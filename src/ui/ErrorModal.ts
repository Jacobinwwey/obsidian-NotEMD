import { App, Modal, Notice } from 'obsidian';

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
        const { contentEl } = this;
        contentEl.addClass('notemd-error-modal');

        contentEl.createEl('h3', { text: this.title });

        // Display error in a preformatted block for easy selection/copying
        const errorBlock = contentEl.createEl('pre', { cls: 'notemd-error-message-block' });
        errorBlock.setText(this.errorMessage);

        // Add a copy button
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        const copyButton = buttonContainer.createEl('button', { text: 'Copy Error Details', cls: 'mod-cta' });
        copyButton.onclick = () => {
            navigator.clipboard.writeText(this.errorMessage).then(() => {
                new Notice('Error details copied to clipboard!');
                copyButton.setText('Copied!');
                setTimeout(() => copyButton.setText('Copy Error Details'), 2000);
            }).catch(err => {
                new Notice('Failed to copy error details. See console.');
                console.error('Failed to copy error to clipboard:', err);
            });
        };

        const closeButton = buttonContainer.createEl('button', { text: 'Close' });
        closeButton.onclick = () => {
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
