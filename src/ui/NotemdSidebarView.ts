import { Editor, ItemView, MarkdownView, Notice, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import NotemdPlugin from '../main';
import { ApiLivenessEvent, ApiLivenessPhase, NotemdSettings, ProgressReporter } from '../types';
import { NOTEMD_SIDEBAR_ICON, NOTEMD_SIDEBAR_VIEW_TYPE } from '../constants';
import { findDuplicates } from '../fileUtils';
import { FFMPEG_INSTALL_HINTS, type EnvironmentReport, type ProbeResult } from '../slideExport/types';
import { NOTEMD_SLIDEV_FORK_RELEASE_URL, NOTEMD_SLIDEV_INSTALL_COMMAND } from '../slideExport/slidevDistribution';
import {
    ActionCategory,
    CustomWorkflowButton,
    getLocalizedWorkflowButtonName,
    getSidebarActionLabel,
    getSidebarActionTooltip,
    normalizeSidebarActionId,
    resolveCustomWorkflowButtons,
    SIDEBAR_ACTION_DEFINITIONS,
    SidebarActionId
} from '../workflowButtons';
import { formatI18n, getCurrentUiLocale, getI18nStrings } from '../i18n';
import { formatTimeForLocale } from '../i18n/localeFormat';
import { isSupportedInputFileForTask, readSupportedInputFile } from '../inputFileSupport';
import { isDirectPreviewableDiagramExtension } from '../operations/diagramCommandHostAdapter';

interface WorkflowExecutionContext {
    preferredFolderPath: string | null;
    lastGeneratedCompleteFolderPath: string | null;
}

type ApiLivenessVisualPhase = 'idle' | 'waiting' | 'accepted' | 'receiving' | 'received' | 'error';
type ApiActivityTerminalState = 'received' | 'interrupted';

interface ApiActivityHistoryEntry {
    timestamp: string;
    phase: ApiLivenessPhase;
    requestAttempt?: number;
    transport?: string;
    statusCode?: number;
    retrying?: boolean;
}

interface ApiActivityRequestRecord {
    requestId: string;
    providerName: string;
    accepted: boolean;
    receiving: boolean;
    lastPhase: ApiLivenessPhase;
    requestAttempt?: number;
    transport?: string;
    statusCode?: number;
    retrying?: boolean;
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    terminalState?: ApiActivityTerminalState;
    history: ApiActivityHistoryEntry[];
}

const API_ACTIVITY_RECENT_LIMIT = 6;
const API_ACTIVITY_HISTORY_LIMIT = 20;
const API_ACTIVITY_VISIBLE_HISTORY_LIMIT = 6;
const SLIDE_EXPORT_FORMATS: Array<NotemdSettings['slideExportDefaultFormat']> = ['html', 'pdf', 'png', 'mp4'];

const ACTION_CATEGORY_CONFIG: Record<ActionCategory, { openByDefault: boolean }> = {
    core: { openByDefault: true },
    generation: { openByDefault: true },
    knowledge: { openByDefault: false },
    translation: { openByDefault: false },
    utilities: { openByDefault: false },
    export: { openByDefault: false }
};

function quotePosixShellPath(path: string): string {
    return `'${path.replace(/'/g, `'\\''`)}'`;
}

function quoteWindowsCommandPath(path: string): string {
    return `"${path.replace(/"/g, '""')}"`;
}

const SINGLE_FILE_ACTION_IDS = new Set<SidebarActionId>([
    'process-current-add-links',
    'generate-from-title',
    'research-and-summarize',
    'summarize-as-mermaid',
    'generate-diagram',
    'preview-diagram',
    'translate-current-file',
    'extract-concepts-current',
    'extract-original-text',
    'fix-formula-current',
    'check-duplicates-current',
    'export-slides'
]);

function isSingleFileAction(actionId: SidebarActionId): boolean {
    return SINGLE_FILE_ACTION_IDS.has(actionId);
}

function isSingleFileWorkflow(button: CustomWorkflowButton): boolean {
    return button.actions.length > 0 && button.actions.every(actionId => isSingleFileAction(actionId));
}

export class NotemdSidebarView extends ItemView implements ProgressReporter {
    plugin: NotemdPlugin;

    private statusEl: HTMLElement | null = null;
    private progressAreaEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private progressBarContainerEl: HTMLElement | null = null;
    private progressValueEl: HTMLElement | null = null;
    private timeRemainingEl: HTMLElement | null = null;
    private apiLivenessRowEl: HTMLElement | null = null;
    private apiLivenessTextEl: HTMLElement | null = null;
    private apiActivityEl: HTMLElement | null = null;
    private apiActivityContentEl: HTMLElement | null = null;
    private apiActivityEmptyEl: HTMLElement | null = null;
    private apiActivityActiveSectionEl: HTMLElement | null = null;
    private apiActivityActiveListEl: HTMLElement | null = null;
    private apiActivityRecentSectionEl: HTMLElement | null = null;
    private apiActivityRecentListEl: HTMLElement | null = null;
    private logEl: HTMLElement | null = null;
    private cancelButton: HTMLButtonElement | null = null;
    private languageSelector: HTMLSelectElement | null = null;
    private slideExportFormatSelector: HTMLSelectElement | null = null;
    private slideExportOutlineToggleButton: HTMLButtonElement | null = null;
    private slideExportDirectActionsEl: HTMLElement | null = null;
    private slideExportOutlineActionsEl: HTMLElement | null = null;
    private slideExportControlsSectionEl: (HTMLElement & { open?: boolean }) | null = null;
    private slideExportEnvironmentPanelEl: HTMLElement | null = null;
    private apiLivenessPhase: ApiLivenessVisualPhase = 'idle';
    private apiLivenessTimer: ReturnType<typeof setTimeout> | null = null;
    private apiLivenessRequests = new Map<string, ApiActivityRequestRecord>();
    private apiLivenessRecentRequests: ApiActivityRequestRecord[] = [];
    private expandedApiActivityRequestIds = new Set<string>();

    private logContent: string[] = [];
    private startTime = 0;
    private isProcessing = false;
    private isCancelled = false;
    private currentAbortController: AbortController | null = null;
    private slideExportOutlineMode = false;
    activeTasks = 0;

    private actionButtons = new Map<string, HTMLButtonElement>();
    private workflowButtons: HTMLButtonElement[] = [];

    private getStrings() {
        return getI18nStrings({ uiLocale: this.plugin.settings.uiLocale });
    }

    private getResolvedUiLocale() {
        return getCurrentUiLocale({ uiLocale: this.plugin.settings.uiLocale });
    }

    constructor(leaf: WorkspaceLeaf, plugin: NotemdPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return NOTEMD_SIDEBAR_VIEW_TYPE;
    }

    getDisplayText() {
        return this.getStrings().plugin.viewName;
    }

    getIcon() {
        return NOTEMD_SIDEBAR_ICON;
    }

    startProcessing(initialStatus: string) {
        this.clearDisplay();
        this.currentAbortController = new AbortController();
        this.isProcessing = true;
        this.isCancelled = false;
        this.startTime = Date.now();
        this.updateStatus(initialStatus, 0);
        this.updateButtonStates();
    }

    finishProcessing() {
        this.isProcessing = false;
        this.updateButtonStates();
    }

    clearDisplay() {
        const i18n = this.getStrings();
        this.logContent = [];
        if (this.logEl) this.logEl.empty();
        if (this.statusEl) this.statusEl.setText(i18n.common.ready);
        if (this.progressAreaEl) this.progressAreaEl.addClass('is-idle');
        if (this.progressEl) {
            this.progressEl.dataset.progress = '0';
            this.progressEl.setText('');
            this.progressEl.removeClass('is-error');
            this.progressEl.style.width = '0%';
        }
        if (this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            this.progressBarContainerEl.addClass('is-idle');
        }
        if (this.progressValueEl) {
            this.progressValueEl.setText(i18n.common.ready);
            this.progressValueEl.addClass('is-idle');
            this.progressValueEl.removeClass('is-error');
        }
        if (this.timeRemainingEl) this.timeRemainingEl.setText(i18n.common.standby);
        this.resetApiLiveness();
        if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.removeClass('is-active');
        }
        this.isProcessing = false;
        this.isCancelled = false;
        this.startTime = 0;
        this.currentAbortController = null;
        this.updateButtonStates();
    }

    updateStatus(text: string, percent?: number) {
        const i18n = this.getStrings();
        if (this.statusEl) this.statusEl.setText(text);

        if (percent !== undefined && (percent < 0 || percent >= 100)) {
            this.isProcessing = false;
        }

        this.updateButtonStates();

        if (percent !== undefined && this.progressEl && this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            this.progressBarContainerEl.removeClass('is-idle');
            if (this.progressAreaEl) this.progressAreaEl.removeClass('is-idle');
            if (percent >= 0) {
                const clampedPercent = Math.min(100, Math.max(0, percent));
                this.progressEl.dataset.progress = String(clampedPercent);
                this.progressEl.setText('');
                this.progressEl.removeClass('is-error');
                this.progressEl.style.width = `${clampedPercent}%`;
                if (this.progressValueEl) {
                    this.progressValueEl.setText(`${Math.round(clampedPercent)}%`);
                    this.progressValueEl.removeClass('is-idle');
                    this.progressValueEl.removeClass('is-error');
                }

                if (percent > 0 && this.startTime > 0) {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    const estimatedTotal = elapsed / (percent / 100);
                    const remaining = Math.max(0, estimatedTotal - elapsed);
                    if (this.timeRemainingEl) {
                        this.timeRemainingEl.setText(
                            formatI18n(i18n.sidebar.status.timeRemaining, { time: this.formatTime(remaining) })
                        );
                    }
                } else if (this.timeRemainingEl) {
                    this.timeRemainingEl.setText(i18n.sidebar.status.timeRemainingCalculating);
                }
            } else {
                this.progressEl.dataset.progress = '100';
                this.progressEl.addClass('is-error');
                this.progressEl.setText('');
                this.progressEl.style.width = '100%';
                if (this.progressValueEl) {
                    this.progressValueEl.setText(i18n.sidebar.status.stopped);
                    this.progressValueEl.removeClass('is-idle');
                    this.progressValueEl.addClass('is-error');
                }
                if (this.timeRemainingEl) this.timeRemainingEl.setText(i18n.sidebar.status.processingStopped);
            }
        }
    }

    log(message: string) {
        if (!this.logEl) {
            return;
        }
        const timestamp = `[${formatTimeForLocale(new Date(), this.getResolvedUiLocale())}]`;
        const fullMessage = `${timestamp} ${message}`;
        this.logContent.push(fullMessage);

        const entry = this.logEl.createEl('div', { cls: 'notemd-log-entry' });
        entry.createEl('span', { text: timestamp, cls: 'notemd-log-time' });
        const messageEl = entry.createEl('span', { cls: 'notemd-log-message' });
        messageEl.setText(` ${message}`);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    getLogs(): string {
        return this.logContent.join('\n');
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    get cancelled() {
        return this.isCancelled;
    }

    requestCancel() {
        if (this.isProcessing && !this.isCancelled) {
            const i18n = this.getStrings();
            this.isCancelled = true;
            this.updateStatus(i18n.sidebar.status.cancelling, -1);
            this.log(i18n.sidebar.status.userRequestedCancellation);
            this.currentAbortController?.abort();
            this.updateButtonStates();
        }
    }

    get abortController(): AbortController | null | undefined {
        return this.currentAbortController;
    }
    set abortController(controller: AbortController | null | undefined) {
        this.currentAbortController = controller ?? null;
    }

    updateActiveTasks(delta: number): void {
        const i18n = this.getStrings();
        this.activeTasks += delta;
        this.updateStatus(formatI18n(i18n.sidebar.status.processingActive, { count: this.activeTasks }));
    }

    updateApiLiveness(event: ApiLivenessEvent): void {
        const i18n = this.getStrings();
        const requestRecord = this.recordApiLivenessEvent(event);

        switch (event.phase) {
            case 'request-start':
                requestRecord.accepted = false;
                requestRecord.receiving = false;
                this.syncApiLivenessWhileActive(i18n);
                this.renderApiActivity(i18n);
                break;
            case 'response-headers':
                requestRecord.accepted = true;
                this.syncApiLivenessWhileActive(i18n);
                this.renderApiActivity(i18n);
                break;
            case 'response-chunk':
                requestRecord.accepted = true;
                requestRecord.receiving = true;
                this.syncApiLivenessWhileActive(i18n);
                this.renderApiActivity(i18n);
                break;
            case 'request-complete':
                requestRecord.accepted = true;
                requestRecord.receiving = false;
                this.archiveApiLivenessRequest(event.requestId, 'received', i18n);
                if (!this.syncApiLivenessWhileActive(i18n)) {
                    this.setApiLivenessState('received', i18n.sidebar.status.apiResponseReceived);
                }
                break;
            case 'request-error':
                if (event.retrying) {
                    requestRecord.accepted = false;
                    requestRecord.receiving = false;
                    if (!this.syncApiLivenessWhileActive(i18n)) {
                        this.setApiLivenessState('waiting', i18n.sidebar.status.awaitingApiOutput);
                    }
                    this.renderApiActivity(i18n);
                    break;
                }
                requestRecord.receiving = false;
                this.archiveApiLivenessRequest(event.requestId, 'interrupted', i18n);
                if (!this.syncApiLivenessWhileActive(i18n)) {
                    this.setApiLivenessState('error', i18n.sidebar.status.apiOutputInterrupted);
                }
                break;
        }
    }

    private ensureApiLivenessRequest(requestId: string, providerName?: string) {
        const existingState = this.apiLivenessRequests.get(requestId);
        if (existingState) {
            if (providerName) {
                existingState.providerName = providerName;
            }
            return existingState;
        }

        this.apiLivenessRecentRequests = this.apiLivenessRecentRequests.filter(record => record.requestId !== requestId);
        this.expandedApiActivityRequestIds.delete(requestId);

        const now = new Date().toISOString();
        const createdState: ApiActivityRequestRecord = {
            requestId,
            providerName: providerName || 'Unknown',
            accepted: false,
            receiving: false,
            lastPhase: 'request-start',
            startedAt: now,
            updatedAt: now,
            history: []
        };
        this.apiLivenessRequests.set(requestId, createdState);
        return createdState;
    }

    private recordApiLivenessEvent(event: ApiLivenessEvent): ApiActivityRequestRecord {
        const requestRecord = this.ensureApiLivenessRequest(event.requestId, event.providerName);
        const timestamp = new Date().toISOString();

        requestRecord.providerName = event.providerName;
        requestRecord.lastPhase = event.phase;
        requestRecord.requestAttempt = event.requestAttempt ?? requestRecord.requestAttempt;
        requestRecord.transport = event.transport ?? requestRecord.transport;
        requestRecord.statusCode = event.statusCode ?? requestRecord.statusCode;
        requestRecord.retrying = event.retrying;
        requestRecord.updatedAt = timestamp;
        requestRecord.terminalState = undefined;
        requestRecord.completedAt = undefined;
        requestRecord.history.push({
            timestamp,
            phase: event.phase,
            requestAttempt: event.requestAttempt,
            transport: event.transport,
            statusCode: event.statusCode,
            retrying: event.retrying
        });
        if (requestRecord.history.length > API_ACTIVITY_HISTORY_LIMIT) {
            requestRecord.history.splice(0, requestRecord.history.length - API_ACTIVITY_HISTORY_LIMIT);
        }

        return requestRecord;
    }

    private archiveApiLivenessRequest(
        requestId: string,
        terminalState: ApiActivityTerminalState,
        i18n = this.getStrings()
    ) {
        const existingState = this.apiLivenessRequests.get(requestId);
        if (!existingState) {
            this.renderApiActivity(i18n);
            return;
        }

        const archivedAt = new Date().toISOString();
        const archivedState: ApiActivityRequestRecord = {
            ...existingState,
            receiving: false,
            retrying: false,
            terminalState,
            completedAt: archivedAt,
            updatedAt: archivedAt,
            history: existingState.history.map(entry => ({ ...entry }))
        };

        this.apiLivenessRequests.delete(requestId);
        this.apiLivenessRecentRequests = [
            archivedState,
            ...this.apiLivenessRecentRequests.filter(record => record.requestId !== requestId)
        ].slice(0, API_ACTIVITY_RECENT_LIMIT);
        this.renderApiActivity(i18n);
    }

    private syncApiLivenessWhileActive(i18n = this.getStrings()): boolean {
        if (this.apiLivenessRequests.size === 0) {
            return false;
        }

        const requestStates = Array.from(this.apiLivenessRequests.values());

        if (requestStates.some(state => state.receiving)) {
            if (this.apiLivenessPhase !== 'receiving') {
                this.setApiLivenessState('receiving', i18n.sidebar.status.receivingApiOutput, true);
            }
            return true;
        }

        if (requestStates.some(state => state.accepted)) {
            this.setApiLivenessState('accepted', i18n.sidebar.status.apiRequestAcceptedAwaitingBody);
            return true;
        }

        this.setApiLivenessState('waiting', i18n.sidebar.status.awaitingApiOutput);
        return true;
    }

    private clearApiLivenessTimer() {
        if (this.apiLivenessTimer !== null) {
            clearTimeout(this.apiLivenessTimer);
            this.apiLivenessTimer = null;
        }
    }

    private resetApiLiveness() {
        const i18n = this.getStrings();
        this.apiLivenessRequests.clear();
        this.apiLivenessRecentRequests = [];
        this.expandedApiActivityRequestIds.clear();
        this.setApiLivenessState('idle', i18n.common.standby);
        this.renderApiActivity(i18n);
    }

    private setApiLivenessState(
        phase: ApiLivenessVisualPhase,
        text: string,
        scheduleHealthyReminder = false
    ) {
        this.apiLivenessPhase = phase;
        this.clearApiLivenessTimer();

        if (this.apiLivenessTextEl) {
            this.apiLivenessTextEl.setText(text);
        }

        if (this.apiLivenessRowEl) {
            this.apiLivenessRowEl.removeClass('is-idle');
            this.apiLivenessRowEl.removeClass('is-waiting');
            this.apiLivenessRowEl.removeClass('is-accepted');
            this.apiLivenessRowEl.removeClass('is-active');
            this.apiLivenessRowEl.removeClass('is-error');

            const className = phase === 'idle'
                ? 'is-idle'
                : phase === 'waiting'
                    ? 'is-waiting'
                    : phase === 'accepted'
                        ? 'is-accepted'
                    : phase === 'error'
                        ? 'is-error'
                        : 'is-active';
            this.apiLivenessRowEl.addClass(className);
        }

        if (scheduleHealthyReminder) {
            this.apiLivenessTimer = setTimeout(() => {
                if (this.apiLivenessPhase === 'receiving') {
                    this.setApiLivenessState('receiving', this.getStrings().sidebar.status.apiTaskHealthyWaiting);
                }
            }, 30000);
        }
    }

    private renderApiActivity(i18n = this.getStrings()) {
        if (
            !this.apiActivityEmptyEl
            || !this.apiActivityContentEl
            || !this.apiActivityActiveSectionEl
            || !this.apiActivityActiveListEl
            || !this.apiActivityRecentSectionEl
            || !this.apiActivityRecentListEl
        ) {
            return;
        }

        const activeRecords = Array.from(this.apiLivenessRequests.values());
        const recentRecords = this.apiLivenessRecentRequests;
        this.apiActivityActiveListEl.empty();
        this.apiActivityRecentListEl.empty();

        if (activeRecords.length === 0 && recentRecords.length === 0) {
            this.apiActivityEmptyEl.setText(i18n.sidebar.apiActivityEmpty);
            this.apiActivityEmptyEl.removeClass('is-hidden');
            this.apiActivityActiveSectionEl.addClass('is-hidden');
            this.apiActivityRecentSectionEl.addClass('is-hidden');
            return;
        }

        this.apiActivityEmptyEl.setText('');
        this.apiActivityEmptyEl.addClass('is-hidden');
        this.renderApiActivitySection(
            this.apiActivityActiveSectionEl,
            this.apiActivityActiveListEl,
            i18n.sidebar.apiActivityActiveSection,
            activeRecords,
            i18n
        );
        this.renderApiActivitySection(
            this.apiActivityRecentSectionEl,
            this.apiActivityRecentListEl,
            i18n.sidebar.apiActivityRecentSection,
            recentRecords,
            i18n
        );
    }

    private renderApiActivitySection(
        sectionEl: HTMLElement,
        listEl: HTMLElement,
        title: string,
        records: ApiActivityRequestRecord[],
        i18n = this.getStrings()
    ) {
        if (records.length === 0) {
            sectionEl.addClass('is-hidden');
            return;
        }

        sectionEl.removeClass('is-hidden');
        const titleEl = sectionEl.querySelector?.('.notemd-api-activity-section-title') as HTMLElement | null;
        if (titleEl) {
            titleEl.setText(title);
        }

        records.forEach(record => {
            const item = listEl.createDiv({ cls: 'notemd-api-activity-item' });
            const headerEl = item.createDiv({ cls: 'notemd-api-activity-item-header' });
            headerEl.createEl('div', { text: record.providerName, cls: 'notemd-api-activity-item-title' });
            const toggleButtonEl = headerEl.createEl('button', {
                text: this.expandedApiActivityRequestIds.has(record.requestId)
                    ? i18n.sidebar.apiActivityHideHistory
                    : i18n.sidebar.apiActivityShowHistory,
                cls: 'notemd-api-activity-toggle-button'
            });
            toggleButtonEl.onclick = () => {
                this.toggleApiActivityHistory(record.requestId, i18n);
            };
            item.createEl('div', {
                text: this.buildApiActivitySummary(record, i18n),
                cls: 'notemd-api-activity-item-meta'
            });

            if (!this.expandedApiActivityRequestIds.has(record.requestId)) {
                return;
            }

            const historyEl = item.createDiv({ cls: 'notemd-api-activity-history' });
            record.history.slice(-API_ACTIVITY_VISIBLE_HISTORY_LIMIT).forEach(entry => {
                historyEl.createEl('div', {
                    text: this.buildApiActivityHistorySummary(entry),
                    cls: 'notemd-api-activity-history-entry'
                });
            });
        });
    }

    private toggleApiActivityHistory(requestId: string, i18n = this.getStrings()) {
        if (this.expandedApiActivityRequestIds.has(requestId)) {
            this.expandedApiActivityRequestIds.delete(requestId);
        } else {
            this.expandedApiActivityRequestIds.add(requestId);
        }
        this.renderApiActivity(i18n);
    }

    private buildApiActivityHistorySummary(entry: ApiActivityHistoryEntry): string {
        const parts: string[] = [entry.phase];
        if (entry.requestAttempt !== undefined) {
            parts.push(`attempt=${entry.requestAttempt}`);
        }
        if (entry.transport) {
            parts.push(`transport=${entry.transport}`);
        }
        if (entry.statusCode !== undefined) {
            parts.push(`status=${entry.statusCode}`);
        }
        if (entry.retrying !== undefined) {
            parts.push(`retrying=${entry.retrying}`);
        }
        return parts.join(' | ');
    }

    private buildApiActivitySummary(record: ApiActivityRequestRecord, i18n = this.getStrings()): string {
        const parts = [formatI18n(i18n.sidebar.apiActivityRequestLabel, { id: record.requestId })];

        if (record.requestAttempt !== undefined) {
            parts.push(formatI18n(i18n.sidebar.apiActivityAttemptLabel, { attempt: record.requestAttempt }));
        }

        parts.push(this.getApiActivityStatusLabel(record, i18n));

        if (record.transport) {
            parts.push(record.transport);
        }

        if (record.statusCode !== undefined) {
            parts.push(`HTTP ${record.statusCode}`);
        }

        return parts.join(' | ');
    }

    private getApiActivityStatusLabel(record: ApiActivityRequestRecord, i18n = this.getStrings()): string {
        if (record.terminalState === 'received') {
            return i18n.sidebar.apiActivityStatusReceived;
        }
        if (record.terminalState === 'interrupted') {
            return i18n.sidebar.apiActivityStatusInterrupted;
        }
        if (record.retrying) {
            return i18n.sidebar.apiActivityStatusRetrying;
        }
        if (record.receiving) {
            return i18n.sidebar.apiActivityStatusReceiving;
        }
        if (record.accepted) {
            return i18n.sidebar.apiActivityStatusAccepted;
        }
        return i18n.sidebar.apiActivityStatusWaiting;
    }

    private buildApiActivityReport(i18n = this.getStrings()): string | null {
        const activeRequests = Array.from(this.apiLivenessRequests.values());
        const recentRequests = this.apiLivenessRecentRequests;

        if (activeRequests.length === 0 && recentRequests.length === 0) {
            return null;
        }

        const lines = [
            i18n.sidebar.apiActivityReportTitle,
            formatI18n(i18n.sidebar.apiActivityReportGeneratedAt, { timestamp: new Date().toISOString() }),
            '',
            i18n.sidebar.apiActivityReportActiveSection
        ];

        if (activeRequests.length === 0) {
            lines.push(i18n.sidebar.apiActivityReportNone);
        } else {
            activeRequests.forEach(record => lines.push(...this.buildApiActivityReportLines(record, i18n)));
        }

        lines.push('', i18n.sidebar.apiActivityReportRecentSection);
        if (recentRequests.length === 0) {
            lines.push(i18n.sidebar.apiActivityReportNone);
        } else {
            recentRequests.forEach(record => lines.push(...this.buildApiActivityReportLines(record, i18n)));
        }

        return lines.join('\n');
    }

    private buildApiActivityReportLines(record: ApiActivityRequestRecord, i18n = this.getStrings()): string[] {
        const lines = [
            formatI18n(i18n.sidebar.apiActivityReportRequestLabel, { id: record.requestId }),
            formatI18n(i18n.sidebar.apiActivityReportProviderLabel, { provider: record.providerName }),
            formatI18n(i18n.sidebar.apiActivityReportSummaryLabel, { summary: this.buildApiActivitySummary(record, i18n) }),
            formatI18n(i18n.sidebar.apiActivityReportStartedAt, { timestamp: record.startedAt })
        ];

        if (record.completedAt) {
            lines.push(formatI18n(i18n.sidebar.apiActivityReportCompletedAt, { timestamp: record.completedAt }));
        }

        lines.push(i18n.sidebar.apiActivityReportHistoryLabel);
        record.history.forEach(entry => {
            const parts = [entry.timestamp, entry.phase];
            if (entry.requestAttempt !== undefined) {
                parts.push(`attempt=${entry.requestAttempt}`);
            }
            if (entry.transport) {
                parts.push(`transport=${entry.transport}`);
            }
            if (entry.statusCode !== undefined) {
                parts.push(`status=${entry.statusCode}`);
            }
            if (entry.retrying !== undefined) {
                parts.push(`retrying=${entry.retrying}`);
            }
            lines.push(`- ${parts.join(' | ')}`);
        });
        lines.push('');

        return lines;
    }

    private updateButtonStates() {
        const processing = this.isProcessing;
        this.actionButtons.forEach(button => {
            button.disabled = processing;
        });
        this.workflowButtons.forEach(button => {
            button.disabled = processing;
        });
        if (this.languageSelector) {
            this.languageSelector.disabled = processing;
        }
        if (this.slideExportFormatSelector) {
            this.slideExportFormatSelector.disabled = processing;
        }
        if (this.slideExportOutlineToggleButton) {
            this.slideExportOutlineToggleButton.disabled = processing;
        }

        if (this.cancelButton) {
            this.cancelButton.disabled = !processing || this.isCancelled;
            if (this.cancelButton.disabled) this.cancelButton.removeClass('is-active');
            else this.cancelButton.addClass('is-active');
        }
    }

    private createReporterProxy(clearEnabled = false): ProgressReporter {
        const view = this;
        return {
            log(message: string) {
                view.log(message);
            },
            updateStatus(text: string, percent?: number) {
                view.updateStatus(text, percent);
            },
            requestCancel() {
                view.requestCancel();
            },
            clearDisplay() {
                if (clearEnabled) {
                    view.clearDisplay();
                }
            },
            get cancelled() {
                return view.cancelled;
            },
            get abortController() {
                return view.abortController;
            },
            set abortController(controller: AbortController | null | undefined) {
                view.abortController = controller;
            },
            get activeTasks() {
                return view.activeTasks;
            },
            set activeTasks(value: number) {
                view.activeTasks = value;
            },
            updateActiveTasks(delta: number) {
                view.updateActiveTasks(delta);
            },
            updateApiLiveness(event: ApiLivenessEvent) {
                view.updateApiLiveness(event);
            },
            getLogs() {
                return view.getLogs();
            }
        };
    }

    private createSection(
        parent: HTMLElement,
        title: string,
        description: string,
        openByDefault: boolean
    ): HTMLElement {
        const details = parent.createEl('details', { cls: 'notemd-section-card' });
        details.open = openByDefault;
        const summary = details.createEl('summary', { cls: 'notemd-section-summary' });
        summary.createEl('span', { text: title });
        details.createEl('p', { text: description, cls: 'notemd-section-description' });
        return details.createDiv({ cls: 'notemd-button-grid' });
    }

    private createActionButton(
        parent: HTMLElement,
        actionId: SidebarActionId,
        category: ActionCategory
    ) {
        const i18n = this.getStrings();
        const label = getSidebarActionLabel(i18n, actionId);
        const classes = ['notemd-action-button'];
        if (isSingleFileAction(actionId)) {
            classes.push('mod-cta');
            classes.push('is-primary');
        }
        const button = parent.createEl('button', {
            text: label,
            cls: classes.join(' ')
        });
        button.dataset.category = category;
        button.title = getSidebarActionTooltip(i18n, actionId);
        button.onclick = async () => {
            await this.runSingleAction(actionId);
        };
        this.actionButtons.set(actionId, button);
    }

    private getConfiguredConceptFolderPath(): string | null {
        if (this.plugin.settings.useCustomConceptNoteFolder && this.plugin.settings.conceptNoteFolder.trim()) {
            return this.plugin.settings.conceptNoteFolder.trim();
        }
        return null;
    }

    private async runSingleAction(actionId: SidebarActionId): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }
        const actionLabel = getSidebarActionLabel(i18n, actionId);
        this.startProcessing(formatI18n(i18n.sidebar.status.runningAction, { label: actionLabel }));
        const reporter = this.createReporterProxy();

        try {
            await this.executeAction(actionId, reporter);
            if (!this.cancelled) {
                this.updateStatus(formatI18n(i18n.sidebar.status.actionComplete, { label: actionLabel }), 100);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const failureMessage = formatI18n(i18n.sidebar.status.actionFailed, { message });
            this.log(failureMessage);
            this.updateStatus(failureMessage, -1);
        } finally {
            this.finishProcessing();
        }
    }

    private async runCustomWorkflow(button: CustomWorkflowButton): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }
        const workflowName = getLocalizedWorkflowButtonName(i18n, button.name);
        this.startProcessing(formatI18n(i18n.sidebar.status.workflowStart, { name: workflowName }));
        const reporter = this.createReporterProxy();
        const context: WorkflowExecutionContext = {
            preferredFolderPath: this.getConfiguredConceptFolderPath(),
            lastGeneratedCompleteFolderPath: null
        };
        const continueOnError = this.plugin.settings.customWorkflowErrorStrategy === 'continue_on_error';
        let failedSteps = 0;
        this.log(formatI18n(i18n.sidebar.status.workflowStart, { name: workflowName }));

        try {
            for (let i = 0; i < button.actions.length; i++) {
                if (this.cancelled) {
                    break;
                }
                const actionId = button.actions[i];
                const actionLabel = getSidebarActionLabel(i18n, actionId);
                const progress = Math.floor((i / button.actions.length) * 100);
                this.updateStatus(
                    formatI18n(i18n.sidebar.status.stepLabel, {
                        current: i + 1,
                        total: button.actions.length,
                        label: actionLabel
                    }),
                    progress
                );
                this.log(
                    formatI18n(i18n.sidebar.status.stepLog, {
                        current: i + 1,
                        total: button.actions.length,
                        label: actionLabel
                    })
                );
                try {
                    await this.executeAction(actionId, reporter, context);
                } catch (error: unknown) {
                    failedSteps++;
                    const message = error instanceof Error ? error.message : String(error);
                    this.log(formatI18n(i18n.sidebar.status.stepFailed, { message }));
                    if (!continueOnError) {
                        throw error;
                    }
                }
            }

            if (!this.cancelled) {
                if (failedSteps > 0) {
                    const failureSummary = formatI18n(i18n.sidebar.status.workflowFinishedWithErrors, {
                        name: workflowName,
                        count: failedSteps
                    });
                    this.updateStatus(failureSummary, -1);
                    new Notice(failureSummary);
                } else {
                    const completeMessage = formatI18n(i18n.sidebar.status.workflowComplete, { name: workflowName });
                    this.updateStatus(completeMessage, 100);
                    new Notice(completeMessage);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(formatI18n(i18n.sidebar.status.workflowFailedLog, { message }));
            this.updateStatus(i18n.sidebar.status.workflowFailed, -1);
            new Notice(formatI18n(i18n.sidebar.status.actionFailed, { message: `${workflowName}: ${message}` }));
        } finally {
            this.finishProcessing();
        }
    }

    private async executeAction(
        actionId: SidebarActionId,
        reporter: ProgressReporter,
        context?: WorkflowExecutionContext
    ): Promise<void> {
        switch (normalizeSidebarActionId(actionId)) {
            case 'process-current-add-links': {
                await this.plugin.processWithNotemdCommand(reporter);
                if (context && !context.preferredFolderPath) {
                    context.preferredFolderPath = this.getConfiguredConceptFolderPath();
                }
                break;
            }
            case 'process-folder-add-links': {
                await this.plugin.processFolderWithNotemdCommand(reporter, context?.preferredFolderPath || undefined);
                break;
            }
            case 'generate-from-title': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.generateContentForTitleCommand(activeFile, reporter);
                break;
            }
            case 'batch-generate-from-titles': {
                const folderOverride = context?.preferredFolderPath || this.getConfiguredConceptFolderPath() || undefined;
                const result = await this.plugin.batchGenerateContentForTitlesCommand(reporter, folderOverride);
                if (result && context) {
                    context.preferredFolderPath = result.sourceFolderPath;
                    context.lastGeneratedCompleteFolderPath = result.completeFolderPath;
                }
                break;
            }
            case 'research-and-summarize': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }

                let targetView: MarkdownView | null = null;
                let targetEditor: Editor | null = null;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view instanceof MarkdownView && leaf.view.file?.path === activeFile.path) {
                        targetView = leaf.view;
                        targetEditor = leaf.view.editor;
                    }
                });

                if (!targetView || !targetEditor) {
                    throw new Error('Could not find active Markdown editor view.');
                }
                await this.plugin.researchAndSummarizeCommand(targetEditor, targetView, reporter);
                break;
            }
            case 'summarize-as-mermaid': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || !isSupportedInputFileForTask(this.plugin.settings, 'summarize-as-mermaid', activeFile)) {
                    throw new Error('No supported diagram input file selected.');
                }
                await this.plugin.summarizeToMermaidCommand(activeFile, reporter);
                break;
            }
            case 'generate-diagram': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || !isSupportedInputFileForTask(this.plugin.settings, 'generate-diagram', activeFile)) {
                    throw new Error('No supported diagram input file selected.');
                }
                await this.plugin.generateDiagramCommand(activeFile, reporter, { executionMode: 'save-artifact' });
                break;
            }
            case 'preview-diagram': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || !isDirectPreviewableDiagramExtension(activeFile.extension)) {
                    throw new Error('No supported diagram source or artifact file selected.');
                }
                await this.plugin.previewDiagramCommand(activeFile, reporter);
                break;
            }
            case 'translate-current-file': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    throw new Error('No active file selected.');
                }
                await this.plugin.translateFileCommand(activeFile, reporter.abortController?.signal, reporter);
                break;
            }
            case 'batch-translate-folder': {
                const targetFolderPath = context?.preferredFolderPath;
                if (targetFolderPath) {
                    const abstract = this.app.vault.getAbstractFileByPath(targetFolderPath);
                    if (abstract instanceof TFolder) {
                        await this.plugin.batchTranslateFolderCommand(abstract, reporter);
                        break;
                    }
                }
                await this.plugin.batchTranslateFolderCommand(undefined, reporter);
                break;
            }
            case 'extract-concepts-current': {
                await this.plugin.extractConceptsCommand(reporter);
                break;
            }
            case 'extract-concepts-folder': {
                const folderOverride = context?.preferredFolderPath || undefined;
                if (folderOverride) {
                    await this.plugin.batchExtractConceptsForFolderCommand(reporter, {
                        folderPathOverride: folderOverride
                    });
                } else {
                    await this.plugin.batchExtractConceptsForFolderCommand(reporter);
                }
                break;
            }
            case 'extract-original-text': {
                await this.plugin.extractOriginalTextCommand(reporter);
                break;
            }
            case 'batch-extract-original-text': {
                const folderOverride = context?.preferredFolderPath || undefined;
                if (folderOverride) {
                    await this.plugin.batchExtractOriginalTextCommand(reporter, {
                        folderPathOverride: folderOverride
                    });
                } else {
                    await this.plugin.batchExtractOriginalTextCommand(reporter);
                }
                break;
            }
            case 'split-note-by-chapters': {
                await this.plugin.splitNoteByChaptersCommand(reporter);
                break;
            }
            case 'batch-mermaid-fix': {
                const folderOverride = context?.lastGeneratedCompleteFolderPath || context?.preferredFolderPath || undefined;
                await this.plugin.batchMermaidFixCommand(reporter, folderOverride);
                break;
            }
            case 'fix-formula-current': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || (activeFile.extension !== 'md' && activeFile.extension !== 'txt')) {
                    throw new Error('No active .md/.txt file selected.');
                }
                await this.plugin.fixFormulaFormatsCommand(activeFile, reporter);
                break;
            }
            case 'batch-fix-formula': {
                const folderOverride = context?.lastGeneratedCompleteFolderPath || context?.preferredFolderPath || undefined;
                if (folderOverride) {
                    await this.plugin.batchFixFormulaFormatsCommand(reporter, folderOverride);
                } else {
                    await this.plugin.batchFixFormulaFormatsCommand(reporter);
                }
                break;
            }
            case 'check-duplicates-current': {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || !isSupportedInputFileForTask(this.plugin.settings, 'check-duplicates-current', activeFile)) {
                    throw new Error(this.getStrings().notices.noActiveTextFileSelected);
                }

                const content = await readSupportedInputFile(this.plugin.app, activeFile, this.plugin.settings);
                const duplicates = findDuplicates(content);
                const message = formatI18n(this.getStrings().notices.duplicateTermsFound, { count: duplicates.size });
                reporter.log(message);
                new Notice(formatI18n(this.getStrings().notices.duplicateTermsCheckLogConsole, { count: duplicates.size }));
                if (duplicates.size > 0) {
                    reporter.log(`Potential duplicates: ${Array.from(duplicates).join(', ')}`);
                    console.log(`Potential duplicates in ${activeFile.name}:`, Array.from(duplicates));
                }
                break;
            }
            case 'check-remove-duplicate-concepts': {
                await this.plugin.checkAndRemoveDuplicateConceptNotesCommand(reporter);
                break;
            }
            case 'test-llm-connection': {
                await this.plugin.testLlmConnectionCommand(reporter);
                break;
            }
            case 'probe-slide-export-env': {
                await this.runSlideExportEnvironmentProbe();
                break;
            }
            case 'export-slides': {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                    throw new Error('No active Markdown file selected.');
                }
                await this.plugin.exportSlidesCommand(activeFile, reporter);
                break;
            }
            default: {
                throw new Error(`Unsupported action: ${actionId}`);
            }
        }
    }

    private buildLanguageSelector(parent: HTMLElement) {
        const i18n = this.getStrings();
        const row = parent.createDiv({ cls: 'notemd-inline-control' });
        row.createEl('label', { text: i18n.common.language, cls: 'notemd-inline-label' });
        this.languageSelector = row.createEl('select', { cls: 'notemd-language-select' });
        const selector = this.languageSelector;
        this.plugin.settings.availableLanguages.forEach(lang => {
            selector.add(new Option(lang.name, lang.code));
        });
        selector.value = this.plugin.settings.language;
        selector.onchange = async () => {
            this.plugin.settings.language = selector.value;
            await this.plugin.saveSettings();
            new Notice(formatI18n(i18n.sidebar.languageChangedNotice, { language: selector.value }));
        };
    }

    private buildSlideExportFormatSelector(parent: HTMLElement) {
        const i18n = this.getStrings();
        const row = parent.createDiv({ cls: 'notemd-inline-control notemd-slide-export-format-control' });
        row.createEl('label', {
            text: i18n.slideExport.defaultFormatName,
            cls: 'notemd-inline-label'
        });

        const selector = row.createEl('select', { cls: 'notemd-slide-export-format-select' }) as HTMLSelectElement;
        selector.title = i18n.slideExport.defaultFormatDesc;
        SLIDE_EXPORT_FORMATS.forEach(format => {
            const option = selector.createEl('option', { text: format.toUpperCase() }) as HTMLOptionElement;
            option.value = format;
        });

        const currentFormat = this.plugin.settings.slideExportDefaultFormat;
        selector.value = SLIDE_EXPORT_FORMATS.includes(currentFormat) ? currentFormat : 'html';
        selector.onchange = async () => {
            const selectedFormat = selector.value as NotemdSettings['slideExportDefaultFormat'];
            if (!SLIDE_EXPORT_FORMATS.includes(selectedFormat)) {
                return;
            }
            this.plugin.settings.slideExportDefaultFormat = selectedFormat;
            await this.plugin.saveSettings();
        };

        this.slideExportFormatSelector = selector;
    }

    private buildSlideExportControls(parent: HTMLElement) {
        const i18n = this.getStrings();
        this.slideExportControlsSectionEl = this.resolveContainingDetails(parent);

        const probeButton = this.createSecondarySlideExportActionButton(
            parent,
            'notemd-slide-export-probe-button',
            getSidebarActionLabel(i18n, 'probe-slide-export-env'),
            getSidebarActionTooltip(i18n, 'probe-slide-export-env'),
            () => this.runSlideExportEnvironmentProbe()
        );
        this.actionButtons.set('probe-slide-export-env', probeButton);

        this.buildSlideExportFormatSelector(parent);

        const toggleButton = parent.createEl('button', { cls: 'notemd-slide-export-outline-toggle' }) as HTMLButtonElement;
        toggleButton.type = 'button';
        toggleButton.title = i18n.slideExport.outlineBeforeExportTooltip;
        toggleButton.setAttr('role', 'switch');
        toggleButton.onclick = () => {
            this.slideExportOutlineMode = !this.slideExportOutlineMode;
            this.syncSlideExportOutlineControls();
        };
        toggleButton.createEl('span', { cls: 'notemd-slide-export-outline-toggle-track' });
        toggleButton.createEl('span', { text: i18n.slideExport.outlineBeforeExportToggle, cls: 'notemd-slide-export-outline-toggle-label' });
        this.slideExportOutlineToggleButton = toggleButton;

        this.slideExportDirectActionsEl = parent.createDiv({ cls: 'notemd-slide-export-direct-actions' });
        const directButton = this.createPrimarySlideExportActionButton(
            this.slideExportDirectActionsEl,
            'notemd-slide-export-direct-button',
            i18n.slideExport.oneShotExportButton,
            i18n.slideExport.oneShotExportTooltip,
            () => this.runSlideExportFileAction(
                i18n.slideExport.oneShotExportButton,
                (file, reporter) => this.plugin.exportSlidesCommand(file, reporter)
            )
        );
        this.actionButtons.set('slide-export-one-shot', directButton);

        this.slideExportOutlineActionsEl = parent.createDiv({ cls: 'notemd-slide-export-outline-actions is-hidden' });
        const outlineButton = this.createSlideExportStepButton(
            this.slideExportOutlineActionsEl,
            '1',
            i18n.slideExport.generateOutlineButton,
            i18n.slideExport.generateOutlineTooltip,
            () => this.runSlideExportFileAction(
                i18n.slideExport.generateOutlineButton,
                (file, reporter) => this.plugin.generateSlidevExportOutlineCommand(file, reporter)
            )
        );
        const continueButton = this.createSlideExportStepButton(
            this.slideExportOutlineActionsEl,
            '2',
            i18n.slideExport.continueFromOutlineButton,
            i18n.slideExport.continueFromOutlineTooltip,
            () => this.runSlideExportFileAction(
                i18n.slideExport.continueFromOutlineButton,
                (file, reporter) => this.plugin.exportSlidesFromOutlineCommand(file, reporter)
            )
        );
        this.actionButtons.set('slide-export-outline-generate', outlineButton);
        this.actionButtons.set('slide-export-outline-continue', continueButton);

        this.slideExportEnvironmentPanelEl = parent.createDiv({ cls: 'notemd-slide-export-env-panel is-hidden' });
        this.syncSlideExportOutlineControls();
    }

    private createPrimarySlideExportActionButton(
        parent: HTMLElement,
        className: string,
        label: string,
        tooltip: string,
        onClick: () => Promise<void>
    ): HTMLButtonElement {
        return this.appendSlideExportActionButton(parent, [className, 'mod-cta', 'is-primary'], label, tooltip, onClick);
    }

    private createSecondarySlideExportActionButton(
        parent: HTMLElement,
        className: string,
        label: string,
        tooltip: string,
        onClick: () => Promise<void>
    ): HTMLButtonElement {
        return this.appendSlideExportActionButton(parent, [className, 'notemd-slide-export-secondary-button'], label, tooltip, onClick);
    }

    private appendSlideExportActionButton(
        parent: HTMLElement,
        classNames: string[],
        label: string,
        tooltip: string,
        onClick: () => Promise<void>
    ): HTMLButtonElement {
        const classes = ['notemd-action-button', ...classNames];
        const button = parent.createEl('button', {
            text: label,
            cls: classes.join(' ')
        }) as HTMLButtonElement;
        button.title = tooltip;
        button.onclick = onClick;
        return button;
    }

    private resolveContainingDetails(element: HTMLElement): (HTMLElement & { open?: boolean }) | null {
        const parentElement = element.parentElement ?? (element as any).parent ?? null;
        if (!parentElement || !('open' in parentElement)) {
            return null;
        }
        return parentElement as HTMLElement & { open?: boolean };
    }

    private createSlideExportStepButton(
        parent: HTMLElement,
        stepNumber: string,
        label: string,
        tooltip: string,
        onClick: () => Promise<void>
    ): HTMLButtonElement {
        const button = parent.createEl('button', {
            cls: 'notemd-action-button notemd-slide-export-step-button'
        }) as HTMLButtonElement;
        button.title = tooltip;
        button.onclick = onClick;
        button.createEl('span', { text: stepNumber, cls: 'notemd-slide-export-step-index' });
        button.createEl('span', { text: label, cls: 'notemd-slide-export-step-label' });
        return button;
    }

    private syncSlideExportOutlineControls() {
        this.slideExportOutlineToggleButton?.setAttr('aria-checked', this.slideExportOutlineMode ? 'true' : 'false');
        if (this.slideExportOutlineMode) {
            this.slideExportOutlineToggleButton?.addClass('is-enabled');
            this.slideExportDirectActionsEl?.addClass('is-hidden');
            this.slideExportDirectActionsEl?.setAttr('aria-hidden', 'true');
            this.slideExportOutlineActionsEl?.removeClass('is-hidden');
            this.slideExportOutlineActionsEl?.setAttr('aria-hidden', 'false');
            return;
        }
        this.slideExportOutlineToggleButton?.removeClass('is-enabled');
        this.slideExportDirectActionsEl?.removeClass('is-hidden');
        this.slideExportDirectActionsEl?.setAttr('aria-hidden', 'false');
        this.slideExportOutlineActionsEl?.addClass('is-hidden');
        this.slideExportOutlineActionsEl?.setAttr('aria-hidden', 'true');
    }

    private getActiveMarkdownFileForSlideExport(): TFile {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
            throw new Error(this.getStrings().notices.noActiveMarkdownFileSelected);
        }
        return activeFile;
    }

    private async runSlideExportFileAction(
        label: string,
        operation: (file: TFile, reporter: ProgressReporter) => Promise<unknown>
    ): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }

        this.openSlideExportControlsSection();
        this.startProcessing(formatI18n(i18n.sidebar.status.runningAction, { label }));
        const reporter = this.createReporterProxy();
        try {
            const file = this.getActiveMarkdownFileForSlideExport();
            await operation(file, reporter);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const failureMessage = formatI18n(i18n.sidebar.status.actionFailed, { message });
            this.log(failureMessage);
            this.updateStatus(failureMessage, -1);
        } finally {
            this.finishProcessing();
        }
    }

    async runSlideExportEnvironmentProbe(): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }

        this.openSlideExportControlsSection();
        this.startProcessing(i18n.slideExport.probingEnvironment);
        this.renderSlideExportEnvironmentLoading();
        const reporter = this.createReporterProxy();
        try {
            reporter.log(i18n.slideExport.probingEnvironment);
            const { probeEnvironment, getVaultBasePath } = await import('../slideExport');
            const vaultRoot = getVaultBasePath(this.app);
            const report = await probeEnvironment(vaultRoot ? [vaultRoot] : []);
            this.renderSlideExportEnvironmentReport(report);
            this.logSlideExportEnvironmentSummary(report);
            this.updateStatus(i18n.slideExport.environmentCheckComplete, 100);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.renderSlideExportEnvironmentFailure(message);
            this.log(formatI18n(i18n.slideExport.environmentCheckFailed, { message }));
            this.updateStatus(formatI18n(i18n.slideExport.environmentCheckFailed, { message }), -1);
        } finally {
            this.finishProcessing();
        }
    }

    private openSlideExportControlsSection() {
        if (this.slideExportControlsSectionEl) {
            this.slideExportControlsSectionEl.open = true;
        }
    }

    private renderSlideExportEnvironmentLoading() {
        const i18n = this.getStrings();
        const panel = this.ensureSlideExportEnvironmentPanel();
        panel.empty();
        panel.removeClass('is-hidden');
        panel.createEl('div', { text: i18n.slideExport.environmentCheckingTitle, cls: 'notemd-slide-export-env-title' });
        panel.createEl('p', { text: i18n.slideExport.environmentCheckingDesc, cls: 'notemd-slide-export-env-desc' });
    }

    private renderSlideExportEnvironmentFailure(message: string) {
        const i18n = this.getStrings();
        const panel = this.ensureSlideExportEnvironmentPanel();
        panel.empty();
        panel.removeClass('is-hidden');
        panel.createEl('div', { text: i18n.slideExport.environmentCheckFailedTitle, cls: 'notemd-slide-export-env-title' });
        panel.createEl('p', {
            text: formatI18n(i18n.slideExport.environmentCheckFailed, { message }),
            cls: 'notemd-slide-export-env-desc is-error'
        });
    }

    private renderSlideExportEnvironmentReport(report: EnvironmentReport) {
        const i18n = this.getStrings();
        const panel = this.ensureSlideExportEnvironmentPanel();
        panel.empty();
        panel.removeClass('is-hidden');

        const availableCount = SLIDE_EXPORT_FORMATS.filter(format => report.capabilities[format]).length;
        const titleRow = panel.createDiv({ cls: 'notemd-slide-export-env-heading' });
        titleRow.createEl('div', { text: i18n.slideExport.environmentReportTitle, cls: 'notemd-slide-export-env-title' });
        titleRow.createEl('div', {
            text: formatI18n(i18n.slideExport.environmentCapabilitySummary, { count: availableCount, total: SLIDE_EXPORT_FORMATS.length }),
            cls: 'notemd-slide-export-env-badge'
        });

        if (!report.isDesktop) {
            panel.createEl('p', {
                text: i18n.slideExport.mobileUnsupportedError,
                cls: 'notemd-slide-export-env-desc is-error'
            });
            return;
        }

        const toolGrid = panel.createDiv({ cls: 'notemd-slide-export-env-tool-grid' });
        this.renderSlideExportToolRow(toolGrid, 'node', 'Node.js', report.node, report);
        this.renderSlideExportToolRow(toolGrid, 'slidev', 'Slidev CLI', report.slidev, report);
        this.renderSlideExportToolRow(toolGrid, 'playwright', 'Playwright Chromium', report.playwright, report);
        this.renderSlideExportToolRow(toolGrid, 'ffmpeg', 'ffmpeg', report.ffmpeg, report);

        const capabilityList = panel.createDiv({ cls: 'notemd-slide-export-env-capabilities' });
        const capabilityLabels: Record<NotemdSettings['slideExportDefaultFormat'], string> = {
            html: 'HTML',
            pdf: 'PDF',
            png: 'PNG',
            mp4: 'MP4'
        };
        for (const format of SLIDE_EXPORT_FORMATS) {
            const item = capabilityList.createDiv({
                cls: report.capabilities[format]
                    ? 'notemd-slide-export-env-capability is-available'
                    : 'notemd-slide-export-env-capability is-unavailable'
            });
            item.createEl('span', {
                text: report.capabilities[format] ? i18n.slideExport.availableShort : i18n.slideExport.unavailableShort,
                cls: 'notemd-slide-export-env-capability-state'
            });
            item.createEl('span', { text: capabilityLabels[format] });
        }
    }

    private renderSlideExportToolRow(
        parent: HTMLElement,
        tool: ProbeResult['tool'],
        label: string,
        result: ProbeResult,
        report: EnvironmentReport
    ) {
        const i18n = this.getStrings();
        const guidance = this.getSlideExportToolGuidance(tool, report);
        const row = parent.createDiv({
            cls: result.installed
                ? 'notemd-slide-export-env-tool is-installed'
                : 'notemd-slide-export-env-tool is-missing'
        });
        const header = row.createDiv({ cls: 'notemd-slide-export-env-tool-header' });
        header.createEl('span', { text: label, cls: 'notemd-slide-export-env-tool-name' });
        header.createEl('span', {
            text: result.installed ? i18n.slideExport.installedStatus : i18n.slideExport.missingStatus,
            cls: 'notemd-slide-export-env-tool-status'
        });
        row.createEl('div', {
            text: result.installed
                ? (result.version || i18n.slideExport.availableShort)
                : (result.error || i18n.slideExport.missingStatus),
            cls: 'notemd-slide-export-env-tool-detail'
        });

        if (!result.installed) {
            const command = row.createEl('code', {
                text: guidance.command,
                cls: 'notemd-slide-export-env-command'
            });
            command.setAttr('data-command', guidance.command);
            const footer = row.createDiv({ cls: 'notemd-slide-export-env-tool-footer' });
            const copyButton = footer.createEl('button', {
                text: i18n.slideExport.copyInstallCommand,
                cls: 'notemd-slide-export-env-copy-button'
            }) as HTMLButtonElement;
            copyButton.onclick = () => this.copySlideExportInstallCommand(guidance.command);

            const link = footer.createEl('a', {
                text: guidance.websiteLabel,
                cls: 'notemd-slide-export-env-link'
            });
            link.setAttr('href', guidance.websiteUrl);
            link.setAttr('target', '_blank');
            link.setAttr('rel', 'noopener noreferrer');

            if (tool === 'slidev' || tool === 'playwright') {
                const installButton = footer.createEl('button', {
                    text: i18n.slideExport.probeInstallBtn,
                    cls: 'notemd-slide-export-env-install-button'
                }) as HTMLButtonElement;
                installButton.onclick = () => this.installSlideExportTool(tool);
            }
        }
    }

    private getSlideExportToolGuidance(tool: ProbeResult['tool'], report: EnvironmentReport): { command: string; websiteUrl: string; websiteLabel: string } {
        const i18n = this.getStrings();
        switch (tool) {
            case 'node':
                return {
                    command: 'node --version',
                    websiteUrl: 'https://nodejs.org/en/download',
                    websiteLabel: i18n.slideExport.nodeWebsiteLabel
                };
            case 'slidev':
                return {
                    command: this.getSlidevForkInstallCommand(report.platform),
                    websiteUrl: NOTEMD_SLIDEV_FORK_RELEASE_URL,
                    websiteLabel: i18n.slideExport.slidevWebsiteLabel
                };
            case 'playwright':
                return {
                    command: 'npx playwright install chromium',
                    websiteUrl: 'https://playwright.dev/docs/intro',
                    websiteLabel: i18n.slideExport.playwrightWebsiteLabel
                };
            case 'ffmpeg':
                return {
                    command: FFMPEG_INSTALL_HINTS[report.platform] || FFMPEG_INSTALL_HINTS.unknown,
                    websiteUrl: 'https://ffmpeg.org/download.html',
                    websiteLabel: i18n.slideExport.ffmpegWebsiteLabel
                };
        }
    }

    private copySlideExportInstallCommand(command: string): void {
        const i18n = this.getStrings();
        navigator.clipboard
            .writeText(command)
            .then(
                () => new Notice(i18n.slideExport.copyInstallCommandSuccess),
                () => new Notice(i18n.slideExport.copyInstallCommandFailed)
            );
    }

    private async installSlideExportTool(tool: 'slidev' | 'playwright'): Promise<void> {
        const i18n = this.getStrings();
        if (this.isProcessing || this.plugin.getIsBusy()) {
            new Notice(i18n.notices.processingAlreadyRunning);
            return;
        }

        this.startProcessing(formatI18n(i18n.slideExport.installingTool, {
            tool: tool === 'slidev' ? 'Slidev CLI' : 'Playwright Chromium'
        }));
        const reporter = this.createReporterProxy();
        try {
            const { installSlidevForVault, autoInstallPlaywright, probeEnvironment, getVaultBasePath } = await import('../slideExport');
            const vaultRoot = getVaultBasePath(this.app);
            let result;
            if (tool === 'slidev') {
                if (!vaultRoot) {
                    throw new Error('Vault filesystem path is unavailable; open a local vault before installing the NoteMD Slidev fork.');
                }
                result = await installSlidevForVault(vaultRoot, (phase, detail) => reporter.log(detail ? `${phase}: ${detail}` : phase));
            } else {
                result = await autoInstallPlaywright((phase, detail) => reporter.log(detail ? `${phase}: ${detail}` : phase));
            }
            if (result.exitCode !== 0) {
                throw new Error(result.stderr || result.error?.message || i18n.common.unknownError);
            }
            reporter.log(i18n.slideExport.installComplete);
            const report = await probeEnvironment(vaultRoot ? [vaultRoot] : []);
            this.renderSlideExportEnvironmentReport(report);
            this.logSlideExportEnvironmentSummary(report);
            this.updateStatus(i18n.slideExport.environmentCheckComplete, 100);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            reporter.log(formatI18n(i18n.slideExport.installFailed, { message }));
            this.updateStatus(formatI18n(i18n.slideExport.installFailed, { message }), -1);
        } finally {
            this.finishProcessing();
        }
    }

    private getSlidevForkInstallCommand(platform: EnvironmentReport['platform']): string {
        const vaultRoot = this.getVaultRootForInstallCommand();
        if (!vaultRoot) {
            return NOTEMD_SLIDEV_INSTALL_COMMAND;
        }
        const cdCommand = platform === 'win32'
            ? `cd /d ${quoteWindowsCommandPath(vaultRoot)}`
            : `cd ${quotePosixShellPath(vaultRoot)}`;
        return `${cdCommand}\n${NOTEMD_SLIDEV_INSTALL_COMMAND}`;
    }

    private getVaultRootForInstallCommand(): string | null {
        const adapter = this.app?.vault?.adapter as any;
        if (typeof adapter?.getBasePath === 'function') {
            return adapter.getBasePath();
        }
        return typeof adapter?.basePath === 'string' ? adapter.basePath : null;
    }

    private ensureSlideExportEnvironmentPanel(): HTMLElement {
        if (this.slideExportEnvironmentPanelEl) {
            return this.slideExportEnvironmentPanelEl;
        }
        throw new Error('Slide export environment panel is not mounted.');
    }

    private logSlideExportEnvironmentSummary(report: EnvironmentReport) {
        const i18n = this.getStrings();
        const missingTools = [report.node, report.slidev, report.playwright, report.ffmpeg]
            .filter(result => !result.installed)
            .map(result => result.tool);
        const availableFormats = SLIDE_EXPORT_FORMATS.filter(format => report.capabilities[format]).join(', ') || i18n.slideExport.noneShort;
        this.log(formatI18n(i18n.slideExport.environmentAvailableFormats, { formats: availableFormats }));
        if (missingTools.length > 0) {
            this.log(formatI18n(i18n.slideExport.environmentMissingTools, { tools: missingTools.join(', ') }));
        }
    }

    private buildDiagramIntentSelector(parent: HTMLElement) {
        const i18n = this.getStrings();
        const row = parent.createDiv({ cls: 'notemd-inline-control' });
        row.createEl('label', { text: i18n.settings.developer.experimentalDiagramPipeline.intentName, cls: 'notemd-inline-label' });
        const selector = row.createEl('select', { cls: 'notemd-language-select' });

        const intents = [
            { value: 'auto', label: i18n.settings.developer.experimentalDiagramPipeline.intentAuto },
            { value: 'flowchart', label: i18n.settings.developer.experimentalDiagramPipeline.intentFlowchart },
            { value: 'sequence', label: i18n.settings.developer.experimentalDiagramPipeline.intentSequence },
            { value: 'classDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentClassDiagram },
            { value: 'erDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentErDiagram },
            { value: 'stateDiagram', label: i18n.settings.developer.experimentalDiagramPipeline.intentStateDiagram },
            { value: 'dataChart', label: i18n.settings.developer.experimentalDiagramPipeline.intentDataChart },
        ];

        intents.forEach(item => {
            selector.add(new Option(item.label, item.value));
        });

        selector.value = this.plugin.settings.preferredDiagramIntent || 'auto';
        selector.onchange = async () => {
            const newValue = selector.value === 'auto' ? undefined : selector.value;
            this.plugin.settings.preferredDiagramIntent = newValue;
            await this.plugin.saveSettings();
            const displayName = intents.find(i => i.value === selector.value)?.label || selector.value;
        };
    }

    async onOpen() {
        const i18n = this.getStrings();
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('notemd-sidebar-container');
        const shell = container.createDiv({ cls: 'notemd-sidebar-shell' });
        const scrollArea = shell.createDiv({ cls: 'notemd-sidebar-scroll' });
        const footer = shell.createDiv({ cls: 'notemd-sidebar-footer mod-docked' });
        const footerScroll = footer.createDiv({ cls: 'notemd-sidebar-footer-scroll' });

        const hero = scrollArea.createDiv({ cls: 'notemd-hero-card' });
        hero.createEl('h3', { text: i18n.sidebar.heroTitle });
        hero.createEl('p', { text: i18n.sidebar.heroDesc });

        const workflowResolution = resolveCustomWorkflowButtons(this.plugin.settings.customWorkflowButtonsDsl);
        const quickBody = this.createSection(
            scrollArea,
            i18n.sidebar.quickWorkflowTitle,
            i18n.sidebar.quickWorkflowDesc,
            true
        );

        workflowResolution.buttons.forEach(buttonConfig => {
            const workflowName = getLocalizedWorkflowButtonName(i18n, buttonConfig.name);
            const workflowClasses = ['notemd-action-button', 'notemd-workflow-button'];
            if (isSingleFileWorkflow(buttonConfig)) {
                workflowClasses.push('mod-cta', 'is-primary');
            }
            const workflowButton = quickBody.createEl('button', {
                text: workflowName,
                cls: workflowClasses.join(' ')
            });
            workflowButton.dataset.category = 'workflow';
            workflowButton.title = buttonConfig.actions.map(actionId => getSidebarActionLabel(i18n, actionId)).join(' > ');
            workflowButton.onclick = async () => {
                await this.runCustomWorkflow(buttonConfig);
            };
            this.workflowButtons.push(workflowButton);
        });

        if (workflowResolution.usedFallback && workflowResolution.errors.length > 0) {
            const warn = quickBody.createDiv({ cls: 'notemd-workflow-warning' });
            warn.setText(formatI18n(i18n.sidebar.workflowFallbackWarning, { count: workflowResolution.errors.length }));
        }

        const actionsByCategory = new Map<ActionCategory, Array<typeof SIDEBAR_ACTION_DEFINITIONS[number]>>();
        SIDEBAR_ACTION_DEFINITIONS.forEach(def => {
            const existing = actionsByCategory.get(def.category) || [];
            existing.push(def);
            actionsByCategory.set(def.category, existing);
        });

        (Object.keys(ACTION_CATEGORY_CONFIG) as ActionCategory[]).forEach(category => {
            const defs = actionsByCategory.get(category) || [];
            if (defs.length === 0) {
                return;
            }

            const categoryTitle = i18n.sidebar.sectionTitles[category];
            const body = this.createSection(
                scrollArea,
                categoryTitle,
                formatI18n(i18n.sidebar.builtInActionsPrefix, { category: categoryTitle }),
                ACTION_CATEGORY_CONFIG[category].openByDefault
            );

            if (category === 'export') {
                this.buildSlideExportControls(body);
            } else {
                defs.forEach(def => {
                    this.createActionButton(body, def.id, def.category);
                });
            }

            if (category === 'generation') {
                this.buildDiagramIntentSelector(body);
            }

            if (category === 'translation') {
                this.buildLanguageSelector(body);
            }
        });

        const progressArea = footerScroll.createDiv({ cls: 'notemd-progress-area is-idle' });
        this.progressAreaEl = progressArea;
        const progressMeta = progressArea.createDiv({ cls: 'notemd-progress-meta' });
        this.statusEl = progressMeta.createEl('p', { text: i18n.common.ready, cls: 'notemd-status-text' });
        this.progressValueEl = progressMeta.createEl('span', { text: i18n.common.ready, cls: 'notemd-progress-value is-idle' });
        this.apiLivenessRowEl = progressArea.createDiv({ cls: 'notemd-api-liveness is-idle' });
        this.apiLivenessRowEl.createEl('span', { cls: 'notemd-api-liveness-dot' });
        this.apiLivenessTextEl = this.apiLivenessRowEl.createEl('span', {
            text: i18n.common.standby,
            cls: 'notemd-api-liveness-text'
        });
        this.apiActivityEl = progressArea.createDiv({ cls: 'notemd-api-activity' });
        const apiActivityHeader = this.apiActivityEl.createDiv({ cls: 'notemd-api-activity-header' });
        apiActivityHeader.createEl('span', { text: i18n.sidebar.apiActivityTitle, cls: 'notemd-api-activity-title' });
        const copyApiActivityButton = apiActivityHeader.createEl('button', {
            text: i18n.sidebar.copyApiActivity,
            cls: 'notemd-copy-api-activity-button'
        });
        copyApiActivityButton.onclick = () => {
            const report = this.buildApiActivityReport(i18n);
            if (!report) {
                new Notice(i18n.sidebar.apiActivityEmpty);
                return;
            }

            navigator.clipboard
                .writeText(report)
                .then(
                    () => new Notice(i18n.sidebar.copyApiActivitySuccess),
                    () => new Notice(i18n.sidebar.copyApiActivityFailed)
                );
        };
        this.apiActivityContentEl = this.apiActivityEl.createDiv({ cls: 'notemd-api-activity-content' });
        this.apiActivityEmptyEl = this.apiActivityContentEl.createEl('p', {
            text: i18n.sidebar.apiActivityEmpty,
            cls: 'notemd-api-activity-empty'
        });
        this.apiActivityActiveSectionEl = this.apiActivityContentEl.createDiv({ cls: 'notemd-api-activity-section is-hidden' });
        this.apiActivityActiveSectionEl.createEl('div', {
            text: i18n.sidebar.apiActivityActiveSection,
            cls: 'notemd-api-activity-section-title'
        });
        this.apiActivityActiveListEl = this.apiActivityActiveSectionEl.createDiv({ cls: 'notemd-api-activity-list' });
        this.apiActivityRecentSectionEl = this.apiActivityContentEl.createDiv({ cls: 'notemd-api-activity-section is-hidden' });
        this.apiActivityRecentSectionEl.createEl('div', {
            text: i18n.sidebar.apiActivityRecentSection,
            cls: 'notemd-api-activity-section-title'
        });
        this.apiActivityRecentListEl = this.apiActivityRecentSectionEl.createDiv({ cls: 'notemd-api-activity-list' });
        this.progressBarContainerEl = progressArea.createEl('div', { cls: 'notemd-progress-bar-container mod-sidebar is-idle' });
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'notemd-progress-bar-fill' });
        this.timeRemainingEl = progressArea.createEl('p', { text: i18n.common.standby, cls: 'notemd-time-remaining' });

        this.cancelButton = progressArea.createEl('button', { text: i18n.sidebar.cancelProcessing, cls: 'notemd-cancel-button' });
        this.cancelButton.onclick = () => this.requestCancel();

        const logCard = footerScroll.createDiv({ cls: 'notemd-log-card mod-persistent' });
        const logHeader = logCard.createDiv({ cls: 'notemd-log-header' });
        logHeader.createEl('h5', { text: i18n.sidebar.logOutputTitle });
        const logHeaderActions = logHeader.createDiv({ cls: 'notemd-log-header-actions' });
        const debugToggleLabel = logHeaderActions.createEl('label', { cls: 'notemd-debug-toggle' });
        const debugToggleInput = debugToggleLabel.createEl('input', {
            cls: 'notemd-debug-toggle-input',
            type: 'checkbox'
        }) as HTMLInputElement;
        debugToggleInput.checked = this.plugin.settings.enableApiErrorDebugMode;
        debugToggleInput.onchange = async () => {
            this.plugin.settings.enableApiErrorDebugMode = debugToggleInput.checked;
            await this.plugin.saveSettings();
        };
        debugToggleLabel.createEl('span', { text: i18n.sidebar.quickDeepDebugToggle });

        const copyLogButton = logHeaderActions.createEl('button', { text: i18n.sidebar.copyLog, cls: 'notemd-copy-log-button' });
        copyLogButton.onclick = () => {
            if (this.logContent.length > 0) {
                navigator.clipboard
                    .writeText(this.logContent.join('\n'))
                    .then(() => new Notice(i18n.sidebar.copyLogSuccess), () => new Notice(i18n.sidebar.copyLogFailed));
            } else {
                new Notice(i18n.sidebar.logEmpty);
            }
        };
        this.logEl = logCard.createEl('div', { cls: 'notemd-log-output is-selectable mod-sidebar' });
        this.clearDisplay();
    }

    async onClose() {
        this.statusEl = null;
        this.progressAreaEl = null;
        this.progressEl = null;
        this.progressBarContainerEl = null;
        this.progressValueEl = null;
        this.timeRemainingEl = null;
        this.apiLivenessRowEl = null;
        this.apiLivenessTextEl = null;
        this.apiActivityEl = null;
        this.apiActivityContentEl = null;
        this.apiActivityEmptyEl = null;
        this.apiActivityActiveSectionEl = null;
        this.apiActivityActiveListEl = null;
        this.apiActivityRecentSectionEl = null;
        this.apiActivityRecentListEl = null;
        this.logEl = null;
        this.cancelButton = null;
        this.languageSelector = null;
        this.clearApiLivenessTimer();
        this.slideExportFormatSelector = null;
        this.slideExportOutlineToggleButton = null;
        this.slideExportDirectActionsEl = null;
        this.slideExportOutlineActionsEl = null;
        this.slideExportControlsSectionEl = null;
        this.slideExportEnvironmentPanelEl = null;
        this.expandedApiActivityRequestIds.clear();
        this.actionButtons.clear();
        this.workflowButtons = [];
    }
}
