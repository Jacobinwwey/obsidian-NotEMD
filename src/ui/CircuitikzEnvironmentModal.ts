import { App, Modal } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import type { CircuitikzEnvironmentReport } from '../diagram/adapters/circuitikz/circuitikzEnvironment';
import type { CircuitikzEnvironmentDesktopContext } from '../latexEnvironment/circuitikzEnvironmentDesktop';
import type { ManagedTectonicInstallProgress } from '../latexEnvironment/managedTectonicInstaller';
import type { NotemdSettings } from '../types';

type DesktopEnvironmentModule = Pick<typeof import('../latexEnvironment/circuitikzEnvironmentDesktop'),
    | 'probeConfiguredCircuitikzEnvironment'
    | 'installConfiguredManagedTectonic'
    | 'removeConfiguredManagedTectonic'
    | 'clearConfiguredManagedTectonicStaleLock'>;

type EnvironmentState =
    | 'idle'
    | 'checking'
    | 'installing'
    | 'ready'
    | 'missing'
    | 'incomplete'
    | 'unsupported'
    | 'failed'
    | 'cancelled';

export interface CircuitikzEnvironmentModalOptions {
    settings: NotemdSettings;
    uiLocale?: string;
    isDesktop: boolean;
    loadDesktopModule?: () => Promise<DesktopEnvironmentModule>;
}

const TECTONIC_RELEASE_URL = 'https://github.com/tectonic-typesetting/tectonic/releases/tag/tectonic%400.16.9';
const TECTONIC_LICENSE_URL = 'https://github.com/tectonic-typesetting/tectonic/blob/tectonic%400.16.9/LICENSE';
const MAX_LOG_ENTRIES = 80;

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function trimLogLine(value: string): string {
    const normalized = value.replace(/\r/g, '').trim();
    return normalized.length > 500 ? `${normalized.slice(0, 497)}…` : normalized;
}

export class CircuitikzEnvironmentModal extends Modal {
    private state: EnvironmentState = 'idle';
    private context: CircuitikzEnvironmentDesktopContext | null = null;
    private report: CircuitikzEnvironmentReport | null = null;
    private errorMessage = '';
    private logs: string[] = [];
    private progress: ManagedTectonicInstallProgress | null = null;
    private activeController: AbortController | null = null;
    private readonly loadDesktopModule: () => Promise<DesktopEnvironmentModule>;

    constructor(app: App, private readonly options: CircuitikzEnvironmentModalOptions) {
        super(app);
        this.loadDesktopModule = options.loadDesktopModule
            ?? (() => import('../latexEnvironment/circuitikzEnvironmentDesktop'));
    }

    onOpen(): void {
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).circuitikzEnvironment;
        this.modalEl.addClass('notemd-circuitikz-environment-shell');
        this.modalEl.setAttribute('aria-label', copy.title);
        this.titleEl.setText(copy.title);
        if (!this.options.isDesktop) {
            this.state = 'unsupported';
            this.render();
            return;
        }
        void this.probeEnvironment();
    }

    onClose(): void {
        this.activeController?.abort();
        this.activeController = null;
        this.contentEl.empty();
        this.modalEl.removeClass('notemd-circuitikz-environment-shell');
    }

    private appendLog(value: string): void {
        for (const rawLine of value.split('\n')) {
            const line = trimLogLine(rawLine);
            if (line) this.logs.push(line);
        }
        if (this.logs.length > MAX_LOG_ENTRIES) {
            this.logs.splice(0, this.logs.length - MAX_LOG_ENTRIES);
        }
    }

    private async probeEnvironment(): Promise<void> {
        if (!this.options.isDesktop) return;
        const controller = new AbortController();
        this.activeController?.abort();
        this.activeController = controller;
        this.state = 'checking';
        this.errorMessage = '';
        this.progress = null;
        this.render();
        try {
            const desktop = await this.loadDesktopModule();
            const outcome = await desktop.probeConfiguredCircuitikzEnvironment(this.options.settings, {
                isDesktop: true,
                signal: controller.signal,
                onCommandOutput: text => this.appendLog(text)
            });
            if (controller.signal.aborted) {
                this.state = 'cancelled';
            } else {
                this.context = outcome.context;
                this.report = outcome.report;
                this.state = outcome.report.status;
            }
        } catch (error) {
            if (controller.signal.aborted) {
                this.state = 'cancelled';
            } else {
                this.state = 'failed';
                this.errorMessage = error instanceof Error ? error.message : String(error);
                this.appendLog(this.errorMessage);
            }
        } finally {
            if (this.activeController === controller) this.activeController = null;
            this.render();
        }
    }

    private async installManagedRuntime(): Promise<void> {
        if (!this.options.isDesktop) return;
        const controller = new AbortController();
        this.activeController?.abort();
        this.activeController = controller;
        this.state = 'installing';
        this.errorMessage = '';
        this.progress = { phase: 'download' };
        this.render();
        let probeAfterInstall = false;
        try {
            const desktop = await this.loadDesktopModule();
            const result = await desktop.installConfiguredManagedTectonic(this.options.settings, {
                signal: controller.signal,
                onProgress: progress => {
                    this.progress = progress;
                    if (progress.detail) this.appendLog(progress.detail);
                    this.render();
                }
            });
            if (result.status === 'installed') {
                this.appendLog(result.message);
                probeAfterInstall = true;
            } else if (result.status === 'cancelled') {
                this.state = 'cancelled';
            } else {
                this.state = 'failed';
                this.errorMessage = result.message;
                this.appendLog(result.message);
            }
        } catch (error) {
            if (controller.signal.aborted) {
                this.state = 'cancelled';
            } else {
                this.state = 'failed';
                this.errorMessage = error instanceof Error ? error.message : String(error);
                this.appendLog(this.errorMessage);
            }
        } finally {
            if (this.activeController === controller) this.activeController = null;
            this.render();
        }
        if (probeAfterInstall) await this.probeEnvironment();
    }

    private async removeManagedRuntime(): Promise<void> {
        const controller = new AbortController();
        this.activeController?.abort();
        this.activeController = controller;
        this.state = 'checking';
        this.errorMessage = '';
        this.render();
        let probeAfterRemoval = false;
        try {
            const desktop = await this.loadDesktopModule();
            const result = await desktop.removeConfiguredManagedTectonic(this.options.settings, {
                signal: controller.signal
            });
            if (result.status === 'cancelled' || controller.signal.aborted) {
                this.state = 'cancelled';
            } else {
                const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).circuitikzEnvironment;
                this.appendLog(copy.removalComplete);
                probeAfterRemoval = true;
            }
        } catch (error) {
            if (controller.signal.aborted) {
                this.state = 'cancelled';
            } else {
                this.state = 'failed';
                this.errorMessage = error instanceof Error ? error.message : String(error);
                this.appendLog(this.errorMessage);
            }
        } finally {
            if (this.activeController === controller) this.activeController = null;
            this.render();
        }
        if (probeAfterRemoval) await this.probeEnvironment();
    }

    private async clearStaleManagedRuntimeLock(): Promise<void> {
        this.state = 'checking';
        this.errorMessage = '';
        this.progress = null;
        this.render();
        try {
            const desktop = await this.loadDesktopModule();
            const result = await desktop.clearConfiguredManagedTectonicStaleLock(this.options.settings);
            this.appendLog(result.message);
            if (result.status === 'cleared' || result.status === 'absent') {
                await this.probeEnvironment();
                return;
            }
            this.state = 'failed';
            this.errorMessage = result.message;
        } catch (error) {
            this.state = 'failed';
            this.errorMessage = error instanceof Error ? error.message : String(error);
            this.appendLog(this.errorMessage);
        }
        this.render();
    }

    private cancelOperation(): void {
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).circuitikzEnvironment;
        this.appendLog(copy.cancelled);
        this.activeController?.abort();
        this.state = 'cancelled';
        this.render();
    }

    private statusLabel(copy: ReturnType<typeof getI18nStrings>['circuitikzEnvironment']): string {
        const labels: Record<EnvironmentState, string> = {
            idle: copy.statusIdle,
            checking: copy.statusChecking,
            installing: copy.statusInstalling,
            ready: copy.statusReady,
            missing: copy.statusMissing,
            incomplete: copy.statusIncomplete,
            unsupported: copy.statusUnsupported,
            failed: copy.statusFailed,
            cancelled: copy.statusCancelled
        };
        return labels[this.state];
    }

    private sourceLabel(copy: ReturnType<typeof getI18nStrings>['circuitikzEnvironment'], source?: string): string {
        if (source === 'custom') return copy.sourceCustom;
        if (source === 'managed') return copy.sourceManaged;
        if (source === 'system') return copy.sourceSystem;
        return '—';
    }

    private renderFact(list: HTMLElement, label: string, value: string): void {
        const item = list.createDiv({ cls: 'notemd-circuitikz-environment-fact' });
        item.createEl('dt', { text: label });
        item.createEl('dd', { text: value || '—' });
    }

    private renderCapability(
        container: HTMLElement,
        label: string,
        available: boolean,
        availableText: string,
        unavailableText: string
    ): void {
        const item = container.createDiv({ cls: 'notemd-circuitikz-environment-capability' });
        item.setAttr('data-notemd-capability', available ? 'available' : 'unavailable');
        item.createSpan({ text: label });
        item.createEl('strong', { text: available ? availableText : unavailableText });
    }

    private render(): void {
        const copy = getI18nStrings({ uiLocale: this.options.uiLocale }).circuitikzEnvironment;
        this.contentEl.empty();
        const root = this.contentEl.createDiv({ cls: 'notemd-circuitikz-environment' });

        const boundaries = root.createDiv({ cls: 'notemd-circuitikz-environment-boundaries' });
        const preview = boundaries.createDiv({ cls: 'notemd-circuitikz-environment-boundary is-preview' });
        preview.createEl('span', { text: copy.previewEyebrow, cls: 'notemd-circuitikz-environment-eyebrow' });
        preview.createEl('h3', { text: copy.previewTitle });
        preview.createEl('p', { text: copy.previewDescription });
        const native = boundaries.createDiv({ cls: 'notemd-circuitikz-environment-boundary is-native' });
        native.createEl('span', { text: copy.nativeEyebrow, cls: 'notemd-circuitikz-environment-eyebrow' });
        native.createEl('h3', { text: copy.nativeTitle });
        native.createEl('p', { text: copy.nativeDescription });

        const status = root.createDiv({ cls: `notemd-circuitikz-environment-status is-${this.state}` });
        status.setAttr('data-notemd-environment-status', this.state);
        status.setAttr('aria-live', 'polite');
        status.createEl('strong', { text: this.statusLabel(copy) });
        if (this.errorMessage) status.createEl('p', { text: this.errorMessage });

        const facts = root.createEl('dl', { cls: 'notemd-circuitikz-environment-facts' });
        const selected = this.report?.selected;
        const selectedAttempt = selected
            ? this.report?.attempts.find(attempt => attempt.candidate.executable === selected.executable)
            : undefined;
        this.renderFact(facts, copy.selectedCompiler, selected ? selected.kind : copy.noCompilerSelected);
        this.renderFact(facts, copy.compilerSource, this.sourceLabel(copy, selected?.source));
        this.renderFact(facts, copy.compilerVersion, selectedAttempt?.version ?? '—');
        this.renderFact(facts, copy.executablePath, selected?.executable ?? '—');
        this.renderFact(facts, copy.platform, this.context?.platform ?? '—');
        this.renderFact(facts, copy.architecture, this.context?.architecture ?? '—');
        this.renderFact(facts, copy.managedVersion, this.context?.managedRuntimeVersion ?? '—');
        this.renderFact(facts, copy.downloadSize, formatBytes(this.context?.managedArtifact?.compressedBytes ?? 0));
        this.renderFact(facts, copy.installPath, this.context?.runtimeRoot ?? '—');

        const capabilitySection = root.createDiv({ cls: 'notemd-circuitikz-environment-capability-section' });
        capabilitySection.createEl('h3', { text: copy.capabilityHeading });
        const capabilityList = capabilitySection.createDiv({ cls: 'notemd-circuitikz-environment-capabilities' });
        const capabilities = this.report?.capabilities;
        this.renderCapability(capabilityList, copy.capabilityCompileDiagnostics, Boolean(capabilities?.compileDiagnostics), copy.capabilityAvailable, copy.capabilityUnavailable);
        this.renderCapability(capabilityList, copy.capabilityNativePdf, Boolean(capabilities?.nativePdf), copy.capabilityAvailable, copy.capabilityUnavailable);
        this.renderCapability(capabilityList, copy.capabilityRepairAcceptance, Boolean(capabilities?.repairAcceptance), copy.capabilityAvailable, copy.capabilityUnavailable);

        if (this.context && !this.context.managedArtifact) {
            root.createEl('p', { text: copy.managedUnavailable, cls: 'notemd-circuitikz-environment-inline-note' });
        }

        if (this.progress) {
            const progressSection = root.createDiv({ cls: 'notemd-circuitikz-environment-progress' });
            progressSection.createEl('h3', { text: copy.progressHeading });
            progressSection.createEl('p', { text: this.progress.detail ?? this.progress.phase });
            const progress = progressSection.createEl('progress');
            const total = this.progress.totalBytes ?? this.context?.managedArtifact?.compressedBytes ?? 0;
            const received = this.progress.receivedBytes ?? 0;
            progress.setAttr('max', String(Math.max(1, total)));
            progress.setAttr('value', String(Math.min(received, total)));
            if (total > 0) {
                progressSection.createEl('span', {
                    text: formatI18n(copy.progressBytes, {
                        received: formatBytes(received),
                        total: formatBytes(total)
                    })
                });
            }
        }

        const actions = root.createDiv({ cls: 'notemd-circuitikz-environment-actions' });
        const busy = this.state === 'checking' || this.state === 'installing';
        if (this.options.isDesktop) {
            const check = actions.createEl('button', { text: copy.checkEnvironment });
            check.setAttr('type', 'button');
            check.setAttr('data-notemd-environment-action', 'check');
            check.disabled = busy;
            check.addEventListener('click', () => { void this.probeEnvironment(); });

            if (this.context?.managedArtifact) {
                const install = actions.createEl('button', {
                    text: this.context.managedExecutablePath ? copy.repairManaged : copy.installRecommended,
                    cls: 'mod-cta'
                });
                install.setAttr('type', 'button');
                install.setAttr('data-notemd-environment-action', 'install');
                install.disabled = busy;
                install.addEventListener('click', () => { void this.installManagedRuntime(); });
            }

            if (this.context?.managedExecutablePath) {
                const remove = actions.createEl('button', { text: copy.removeManaged, cls: 'mod-warning' });
                remove.setAttr('type', 'button');
                remove.setAttr('data-notemd-environment-action', 'remove');
                remove.disabled = busy;
                remove.addEventListener('click', () => { void this.removeManagedRuntime(); });
            }

            const clearStaleLock = actions.createEl('button', { text: copy.clearStaleLock });
            clearStaleLock.setAttr('type', 'button');
            clearStaleLock.setAttr('data-notemd-environment-action', 'clear-stale-lock');
            clearStaleLock.disabled = busy;
            clearStaleLock.addEventListener('click', () => { void this.clearStaleManagedRuntimeLock(); });

            if (busy && this.activeController) {
                const cancel = actions.createEl('button', { text: copy.cancelOperation });
                cancel.setAttr('type', 'button');
                cancel.setAttr('data-notemd-environment-action', 'cancel');
                cancel.addEventListener('click', () => this.cancelOperation());
            }
        }
        actions.createEl('a', {
            text: copy.licenseLink,
            href: TECTONIC_LICENSE_URL,
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });
        actions.createEl('a', {
            text: copy.releaseLink,
            href: TECTONIC_RELEASE_URL,
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });

        const logSection = root.createDiv({ cls: 'notemd-circuitikz-environment-log-section' });
        logSection.createEl('h3', { text: copy.logsHeading });
        logSection.createEl('pre', {
            text: this.logs.length > 0 ? this.logs.join('\n') : copy.noLogs,
            cls: 'notemd-circuitikz-environment-log'
        });
    }
}
