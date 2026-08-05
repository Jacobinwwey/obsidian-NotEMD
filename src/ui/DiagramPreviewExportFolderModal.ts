import { App, Modal, TFolder } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';

const EXPORT_FOLDER_RADIO_GROUP_NAME = 'notemd-diagram-preview-export-folder';

export type DiagramPreviewExportFormat = 'SVG' | 'PNG' | 'PDF';

export function getDiagramPreviewSourceFolder(sourcePath: string): string {
    const normalizedPath = sourcePath.trim().replace(/\\/g, '/').replace(/\/+$/, '');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    return lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : '';
}

export function normalizeDiagramPreviewExportFolderPath(folderPath: string): string {
    const trimmed = folderPath.trim().replace(/\\/g, '/');
    if (trimmed.startsWith('//') || /^[a-zA-Z]:/.test(trimmed)) {
        throw new Error('The export folder must be a Vault-relative path.');
    }
    const normalized = trimmed.replace(/^\/+|\/+$/g, '');
    if (!normalized || normalized === '.') {
        return '';
    }
    if (
        normalized.split('/').some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\0'))
    ) {
        throw new Error('The export folder must be a Vault-relative path.');
    }
    return normalized;
}

interface DiagramPreviewExportFolderModalOptions {
    app: App;
    sourcePath: string;
    uiLocale?: string;
    resolve: (folderPath: string | null) => void;
}

export class DiagramPreviewExportFolderModal extends Modal {
    private readonly sourceFolder: string;
    private readonly resolveSelection: (folderPath: string | null) => void;
    private readonly exportFormat: DiagramPreviewExportFormat;
    private completed = false;
    private customFolderInput: HTMLInputElement | null = null;
    private customFolderOption: HTMLInputElement | null = null;
    private defaultFolderOption: HTMLInputElement | null = null;
    private errorEl: HTMLElement | null = null;
    private confirmButton: HTMLButtonElement | null = null;

    constructor(
        app: App,
        private readonly sourcePath: string,
        private readonly uiLocale = 'auto',
        resolve: (folderPath: string | null) => void,
        exportFormat: DiagramPreviewExportFormat = 'SVG'
    ) {
        super(app);
        this.sourceFolder = getDiagramPreviewSourceFolder(sourcePath);
        this.resolveSelection = resolve;
        this.exportFormat = exportFormat;
    }

    onOpen(): void {
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        const formatVariables = { format: this.exportFormat };
        this.titleEl.setText(formatI18n(copy.exportFolderTitle, formatVariables));
        this.contentEl.empty();
        this.contentEl.addClass('notemd-diagram-preview-export-folder-modal');
        this.contentEl.createEl('p', {
            text: formatI18n(copy.exportFolderDescription, formatVariables),
            cls: 'notemd-diagram-preview-export-folder-description'
        });

        const options = this.contentEl.createDiv({ cls: 'notemd-diagram-preview-export-folder-options' });
        this.defaultFolderOption = this.createFolderRadioOption(
            options,
            copy.exportFolderDefaultOption.replace('{path}', this.sourceFolder || '/'),
            'source-folder',
            true
        );
        this.customFolderOption = this.createFolderRadioOption(
            options,
            copy.exportFolderCustomOption,
            'custom-folder',
            false
        );

        this.customFolderInput = this.contentEl.createEl('input', {
            type: 'text',
            cls: 'notemd-diagram-preview-export-folder-input',
            attr: {
                placeholder: copy.exportFolderCustomPlaceholder,
                'aria-label': copy.exportFolderCustomOption,
                disabled: 'true'
            }
        });
        this.customFolderInput.addEventListener('input', () => this.clearError());
        this.customFolderInput.addEventListener('focus', () => {
            if (this.customFolderOption) {
                this.customFolderOption.checked = true;
                this.updateCustomFolderState();
            }
        });

        this.errorEl = this.contentEl.createDiv({
            cls: 'notemd-diagram-preview-export-folder-error'
        });
        this.errorEl.hidden = true;

        const actions = this.contentEl.createDiv({ cls: 'notemd-diagram-preview-export-folder-actions' });
        const cancelButton = actions.createEl('button', { text: copy.exportFolderCancel });
        cancelButton.onclick = () => this.complete(null);
        this.confirmButton = actions.createEl('button', {
            text: formatI18n(copy.exportFolderConfirm, formatVariables),
            cls: 'mod-cta'
        });
        this.confirmButton.onclick = () => void this.confirmSelection();
        this.updateCustomFolderState();
    }

    onClose(): void {
        if (!this.completed) {
            this.completed = true;
            this.resolveSelection(null);
        }
        this.contentEl.empty();
    }

    private createFolderRadioOption(
        parent: HTMLElement,
        labelText: string,
        value: string,
        checked: boolean
    ): HTMLInputElement {
        const label = parent.createEl('label', { cls: 'notemd-diagram-preview-export-folder-option' });
        const input = label.createEl('input', {
            type: 'radio',
            attr: {
                name: EXPORT_FOLDER_RADIO_GROUP_NAME,
                value,
            }
        });
        input.checked = checked;
        input.addEventListener('change', () => this.updateCustomFolderState());
        label.createSpan({ text: labelText });
        return input;
    }

    private updateCustomFolderState(): void {
        const customSelected = Boolean(this.customFolderOption?.checked);
        if (this.customFolderInput) {
            this.customFolderInput.disabled = !customSelected;
        }
        if (this.defaultFolderOption && !customSelected) {
            this.defaultFolderOption.checked = true;
        }
    }

    private clearError(): void {
        if (this.errorEl) {
            this.errorEl.hidden = true;
            this.errorEl.textContent = '';
        }
    }

    private showError(message: string): void {
        if (!this.errorEl) {
            return;
        }
        this.errorEl.hidden = false;
        this.errorEl.textContent = message;
    }

    private async confirmSelection(): Promise<void> {
        if (this.confirmButton) {
            this.confirmButton.disabled = true;
        }
        this.clearError();
        const copy = getI18nStrings({ uiLocale: this.uiLocale }).previewModal;
        try {
            const folderPath = this.customFolderOption?.checked
                ? normalizeDiagramPreviewExportFolderPath(this.customFolderInput?.value ?? '')
                : this.sourceFolder;
            await this.ensureFolderExists(folderPath);
            this.complete(folderPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const normalizedMessage = message === 'The export folder must be a Vault-relative path.'
                ? copy.exportFolderInvalid
                : formatI18n(copy.exportFolderCreateFailed, { message });
            this.showError(normalizedMessage);
            if (this.confirmButton) {
                this.confirmButton.disabled = false;
            }
        }
    }

    private async ensureFolderExists(folderPath: string): Promise<void> {
        if (!folderPath) {
            return;
        }
        const existing = this.app.vault.getAbstractFileByPath(folderPath);
        if (existing) {
            if (!(existing instanceof TFolder)) {
                throw new Error(`Vault path "${folderPath}" is not a folder.`);
            }
            return;
        }
        await this.app.vault.createFolder(folderPath);
    }

    private complete(folderPath: string | null): void {
        if (this.completed) {
            return;
        }
        this.completed = true;
        this.resolveSelection(folderPath);
        this.close();
    }
}

export function selectDiagramPreviewExportFolder(
    app: App,
    sourcePath: string,
    uiLocale = 'auto',
    exportFormat: DiagramPreviewExportFormat = 'SVG'
): Promise<string | null> {
    return new Promise(resolve => {
        new DiagramPreviewExportFolderModal(app, sourcePath, uiLocale, resolve, exportFormat).open();
    });
}
