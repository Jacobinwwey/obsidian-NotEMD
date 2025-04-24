import { App, Modal } from 'obsidian';

/**
 * Shows a modal to confirm deletion of files identified as duplicates.
 * @param app Obsidian App instance.
 * @param reportList Array of objects containing path, reason, and counterparts for files to be deleted.
 * @returns Promise resolving to true if deletion is confirmed, false otherwise.
 */
export function showDeletionConfirmationModal(app: App, reportList: { path: string; reason: string; counterparts: string[] }[]): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = new Modal(app);
        modal.titleEl.setText('Confirm Duplicate Deletion');
        modal.contentEl.addClass('notemd-confirm-delete-modal'); // For potential styling

        modal.contentEl.createEl('p', { text: `The following ${reportList.length} concept notes are identified as potential duplicates and will be moved to system trash:` });

        const listEl = modal.contentEl.createEl('ul', { cls: 'notemd-delete-list' });
        reportList.forEach(item => {
            const li = listEl.createEl('li');
            li.createSpan({ text: `${item.path} `, cls: 'notemd-delete-path' });
            li.createSpan({ text: `(Reason: ${item.reason})`, cls: 'notemd-delete-reason' });
            if (item.counterparts && item.counterparts.length > 0) {
                li.createEl('br'); // New line for counterparts
                li.createSpan({ text: `Conflicts with: ${item.counterparts.join(', ')}`, cls: 'notemd-delete-counterparts' });
            }
        });

        modal.contentEl.createEl('p', { text: 'This action cannot be easily undone from within Obsidian, but files can usually be recovered from the system trash.', cls: 'mod-warning' });

        const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });

        const confirmButton = buttonContainer.createEl('button', { text: `Delete ${reportList.length} Files`, cls: 'mod-warning' });
        confirmButton.onclick = () => {
            modal.close();
            resolve(true);
        };

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => {
            modal.close();
            resolve(false);
        };

        modal.open();
    });
}
