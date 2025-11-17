import { App, Modal, Setting } from 'obsidian';
import { ProgressReporter } from '../types'; // Adjust import path

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

    constructor(app: App) {
        super(app);
    }

    updateActiveTasks(delta: number) {
        this.activeTasks += delta;
        this.updateStatus(`Processing... (Active: ${this.activeTasks})`);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('notemd-progress-modal');

        // Header
        new Setting(contentEl).setName('Notemd processing').setHeading();

        // Status section
        const statusContainer = contentEl.createEl('div', { cls: 'notemd-status-container' });
        this.statusEl = statusContainer.createEl('p', { text: 'Starting...', cls: 'notemd-status-text' });

        // Progress bar
        this.progressBarContainerEl = contentEl.createEl('div', { cls: 'notemd-progress-bar-container' });
        this.progressBarContainerEl.addClass('is-hidden'); // Hide initially
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });

        // Time remaining indicator
        this.timeRemainingEl = contentEl.createEl('p', {
            text: 'Estimated time remaining: calculating...',
            cls: 'notemd-time-remaining'
        });

        // Log output
        this.logEl = contentEl.createEl('div', { cls: 'notemd-log-output' });

        // Cancel button
        const buttonContainer = contentEl.createEl('div', { cls: 'notemd-button-container' });
        this.cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'notemd-cancel-button'
        });
        this.cancelButton.onclick = () => this.requestCancel(); // Call requestCancel method

        // Record start time
        this.startTime = Date.now();
    }

    updateStatus(text: string, percent?: number) { // Made percent optional
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
                    this.timeRemainingEl.setText(`Estimated time remaining: ${this.formatTime(remaining)}`);
                }
            } else if (this.timeRemainingEl) {
                this.timeRemainingEl.setText('Estimated time remaining: calculating...');
            }
            if (this.progressBarContainerEl) this.progressBarContainerEl.removeClass('is-hidden'); // Show progress bar
        } else if (this.progressEl && percent !== undefined && percent < 0) { // Handle negative percent for error/cancel state
            // REMOVED: this.progressEl.style.width = `100%`;
            this.progressEl.dataset.progress = '100'; // Set data attribute for error state
            this.progressEl.addClass('is-error'); // Use CSS class for error state
            this.progressEl.setText('Cancelled/Error');
            if (this.timeRemainingEl) this.timeRemainingEl.setText('Processing stopped.');
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
            const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
            entry.createEl('span', {
                text: `[${new Date().toLocaleTimeString()}] `,
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
            this.isCancelled = true;
            this.updateStatus('Cancelling...', -1); // Indicate cancellation visually
            this.log('User requested cancellation.');
            // Abort the ongoing fetch request, if any
            this.currentAbortController?.abort();
            this.cancelButton?.setAttribute('disabled', 'true'); // Disable button
        }
    }

    clearDisplay() {
        this.logEl?.empty();
        this.updateStatus('Starting...', 0);
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
