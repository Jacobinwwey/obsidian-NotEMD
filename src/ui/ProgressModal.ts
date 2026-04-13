import { App, Modal, Setting } from 'obsidian';
import { ProgressReporter } from '../types'; // Adjust import path
import { formatI18n, getCurrentUiLocale, getI18nStrings } from '../i18n';
import { formatTimeForLocale } from '../i18n/localeFormat';

// ProgressModal now implements ProgressReporter
export class ProgressModal extends Modal implements ProgressReporter {
    private progressEl: HTMLElement;
    private statusEl: HTMLElement;
    private progressBarContainerEl: HTMLElement;
    private logEl: HTMLElement;
    private cancelButton: HTMLElement;
    private isCancelled = false;
    private startTime: number = 0;
    private timeRemainingEl: HTMLElement;
    // Store the AbortController for the current operation
    private currentAbortController: AbortController | null = null;
    activeTasks = 0;
    private logContent: string[] = []; // Store logs
    private readonly uiLocale: string;

    constructor(app: App, uiLocale = 'auto') {
        super(app);
        this.uiLocale = uiLocale;
    }

    private getStrings() {
        return getI18nStrings({ uiLocale: this.uiLocale });
    }

    private getResolvedUiLocale() {
        return getCurrentUiLocale({ uiLocale: this.uiLocale });
    }

    updateActiveTasks(delta: number) {
        const i18n = this.getStrings();
        this.activeTasks += delta;
        this.updateStatus(formatI18n(i18n.sidebar.status.processingActive, { count: this.activeTasks }));
    }

    onOpen() {
        const i18n = this.getStrings();
        const { contentEl } = this;
        contentEl.addClass('notemd-progress-modal');

        // Header
        new Setting(contentEl).setName(i18n.progressModal.heading).setHeading();

        // Status section
        const statusContainer = contentEl.createEl('div', { cls: 'notemd-status-container' });
        this.statusEl = statusContainer.createEl('p', { text: i18n.progressModal.starting, cls: 'notemd-status-text' });

        // Progress bar
        this.progressBarContainerEl = contentEl.createEl('div', { cls: 'notemd-progress-bar-container' });
        this.progressBarContainerEl.addClass('is-hidden'); // Hide initially
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });

        // Time remaining indicator
        this.timeRemainingEl = contentEl.createEl('p', {
            text: i18n.progressModal.timeRemainingCalculating,
            cls: 'notemd-time-remaining'
        });

        // Log output
        this.logEl = contentEl.createEl('div', { cls: 'notemd-log-output' });

        // Cancel button
        const buttonContainer = contentEl.createEl('div', { cls: 'notemd-button-container' });
        this.cancelButton = buttonContainer.createEl('button', {
            text: i18n.progressModal.cancelProgress,
            cls: 'notemd-cancel-button'
        });
        this.cancelButton.onclick = () => this.requestCancel(); // Call requestCancel method

        // Record start time
        this.startTime = Date.now();
    }

    updateStatus(text: string, percent?: number) { // Made percent optional
        const i18n = this.getStrings();
        if (this.statusEl) this.statusEl.setText(text);
        if (this.progressEl && percent !== undefined && percent >= 0) { // Check if percent is defined and non-negative
            const clampedPercent = Math.min(100, Math.max(0, percent));
            // REMOVED: this.progressEl.style.width = `${clampedPercent}%`;
            this.progressEl.dataset.progress = String(clampedPercent); // Store progress in data attribute
            this.progressEl.setText(`${Math.round(clampedPercent)}%`);
            this.progressEl.removeClass('is-error'); // Ensure error class is removed

            // Update time remaining estimate
            if (percent > 0 && this.startTime > 0) {
                const elapsed = (Date.now() - this.startTime) / 1000; // in seconds
                const estimatedTotal = elapsed / (percent / 100);
                const remaining = Math.max(0, estimatedTotal - elapsed);
                if (this.timeRemainingEl) {
                    this.timeRemainingEl.setText(formatI18n(i18n.progressModal.timeRemaining, { time: this.formatTime(remaining) }));
                }
            } else if (this.timeRemainingEl) {
                this.timeRemainingEl.setText(i18n.progressModal.timeRemainingCalculating);
            }
            if (this.progressBarContainerEl) this.progressBarContainerEl.removeClass('is-hidden'); // Show progress bar
        } else if (this.progressEl && percent !== undefined && percent < 0) { // Handle negative percent for error/cancel state
            // REMOVED: this.progressEl.style.width = `100%`;
            this.progressEl.dataset.progress = '100'; // Set data attribute for error state
            this.progressEl.addClass('is-error'); // Use CSS class for error state
            this.progressEl.setText(i18n.progressModal.cancelledOrError);
            if (this.timeRemainingEl) this.timeRemainingEl.setText(i18n.progressModal.processingStopped);
            if (this.progressBarContainerEl) this.progressBarContainerEl.removeClass('is-hidden'); // Ensure bar is visible
        }
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    log(message: string) {
        if (this.logEl) {
            const timestamp = `[${formatTimeForLocale(new Date(), this.getResolvedUiLocale())}]`;
            const fullMessage = `${timestamp} ${message}`;
            this.logContent.push(fullMessage);

            const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
            entry.createEl('span', {
                text: `${timestamp} `,
                cls: 'notemd-log-time'
            });
            entry.createEl('span', {
                text: message,
                cls: 'notemd-log-message'
            });
            // Auto-scroll to bottom
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    getLogs(): string {
        return this.logContent.join('\n');
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    get cancelled() {
        return this.isCancelled;
    }

    // Implement ProgressReporter methods
    requestCancel() {
        if (!this.isCancelled) {
            const i18n = this.getStrings();
            this.isCancelled = true;
            this.updateStatus(i18n.progressModal.cancelling, -1); // Indicate cancellation visually
            this.log(i18n.progressModal.userRequestedCancellation);
            // Abort the ongoing fetch request, if any
            this.currentAbortController?.abort();
            this.cancelButton?.setAttribute('disabled', 'true'); // Disable button
        }
    }

    clearDisplay() {
        const i18n = this.getStrings();
        this.logEl?.empty();
        this.updateStatus(i18n.progressModal.starting, 0);
        this.isCancelled = false;
        this.currentAbortController = null; // Clear controller on display clear
        if (this.cancelButton) this.cancelButton.removeAttribute('disabled');
        if (this.progressBarContainerEl) this.progressBarContainerEl.addClass('is-hidden'); // Hide progress bar
        if (this.timeRemainingEl) this.timeRemainingEl.setText(''); // Clear time remaining
        this.startTime = Date.now(); // Reset start time
    }

    // Implement the abortController property from the interface
    get abortController(): AbortController | null | undefined {
        return this.currentAbortController;
    }
    set abortController(controller: AbortController | null | undefined) {
        this.currentAbortController = controller ?? null;
    }
}
