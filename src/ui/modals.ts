import { App, Modal } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';

/**
 * Shows a modal to confirm deletion of files identified as duplicates.
 * @param app Obsidian App instance.
 * @param reportList Array of objects containing path, reason, and counterparts for files to be deleted.
 * @returns Promise resolving to true if deletion is confirmed, false otherwise.
 */
export function showDeletionConfirmationModal(
    app: App,
    reportList: { path: string; reason: string; counterparts: string[] }[],
    uiLocale?: string
): Promise<boolean> {
    return new Promise((resolve) => {
        const i18n = getI18nStrings({ uiLocale });
        const modal = new Modal(app);
        modal.titleEl.setText(i18n.duplicateModal.title);
        modal.contentEl.addClass('notemd-confirm-delete-modal'); // For potential styling

        modal.contentEl.createEl('p', {
            text: formatI18n(i18n.duplicateModal.intro, { count: reportList.length })
        });

        const listEl = modal.contentEl.createEl('ul', { cls: 'notemd-delete-list' });
        reportList.forEach(item => {
            const li = listEl.createEl('li');
            li.createSpan({ text: `${item.path} `, cls: 'notemd-delete-path' });
            li.createSpan({
                text: `(${formatI18n(i18n.duplicateModal.reason, { reason: item.reason })})`,
                cls: 'notemd-delete-reason'
            });
            if (item.counterparts && item.counterparts.length > 0) {
                li.createEl('br'); // New line for counterparts
                li.createSpan({
                    text: formatI18n(i18n.duplicateModal.conflictsWith, { files: item.counterparts.join(', ') }),
                    cls: 'notemd-delete-counterparts'
                });
            }
        });

        modal.contentEl.createEl('p', { text: i18n.duplicateModal.warning, cls: 'mod-warning' });

        const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });

        const confirmButton = buttonContainer.createEl('button', {
            text: formatI18n(i18n.duplicateModal.deleteFiles, { count: reportList.length }),
            cls: 'mod-warning'
        });
        confirmButton.onclick = () => {
            modal.close();
            resolve(true);
        };

        const cancelButton = buttonContainer.createEl('button', { text: i18n.common.cancel });
        cancelButton.onclick = () => {
            modal.close();
            resolve(false);
        };

        modal.open();
    });
}

export type ConceptNotePathWarningChoice = 'configure' | 'skip-once' | 'skip-forever';

export function showConceptNotePathWarningModal(
    app: App,
    options: {
        uiLocale?: string;
        actions: string[];
    }
): Promise<ConceptNotePathWarningChoice> {
    return new Promise((resolve) => {
        const i18n = getI18nStrings({ uiLocale: options.uiLocale });
        const modal = new Modal(app);
        modal.titleEl.setText(i18n.notices.conceptNotePathRequiredTitle);
        modal.contentEl.addClass('notemd-concept-path-warning-modal');

        modal.contentEl.createEl('p', {
            text: i18n.notices.conceptNotePathRequiredBody
        });
        modal.contentEl.createEl('p', {
            text: formatI18n(i18n.notices.conceptNotePathRequiredActionList, {
                actions: options.actions.join(' / ')
            }),
            cls: 'setting-item-description'
        });
        modal.contentEl.createEl('p', {
            text: i18n.notices.conceptNotePathRequiredConfigureHint,
            cls: 'setting-item-description'
        });

        const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });

        const configureButton = buttonContainer.createEl('button', {
            text: i18n.common.configure,
            cls: 'mod-cta'
        });
        configureButton.onclick = () => {
            modal.close();
            resolve('configure');
        };

        const skipOnceButton = buttonContainer.createEl('button', {
            text: options.uiLocale?.toLowerCase().startsWith('zh') ? '本次不提示' : 'Skip once'
        });
        skipOnceButton.onclick = () => {
            modal.close();
            resolve('skip-once');
        };

        const skipForeverButton = buttonContainer.createEl('button', {
            text: options.uiLocale?.toLowerCase().startsWith('zh') ? '不再提示' : 'Do not show again'
        });
        skipForeverButton.onclick = () => {
            modal.close();
            resolve('skip-forever');
        };

        modal.onClose = () => resolve('skip-once');
        modal.open();
    });
}
