/**
 * Slide Export — Environment Probe Modal
 *
 * Displays tool detection results, auto-install buttons for slidev/playwright,
 * manual install instructions for ffmpeg, and a capability matrix.
 */

import type { App } from 'obsidian';
import { Modal, Notice } from 'obsidian';
import type { EnvironmentReport } from './types';
import { FFMPEG_INSTALL_HINTS } from './types';
import { probeEnvironment } from './environmentProber';
import { autoInstallPlaywright, installSlidevForVault } from './slidevExporter';
import { getVaultBasePath } from './platformUtils';

export class EnvironmentProbeModal extends Modal {
	private report: EnvironmentReport | null = null;
	private readonly uiLocale: string;
	private onReportUpdated?: (report: EnvironmentReport) => void;

	constructor(app: App, uiLocale = 'auto', onReportUpdated?: (report: EnvironmentReport) => void) {
		super(app);
		this.uiLocale = uiLocale;
		this.onReportUpdated = onReportUpdated;
	}

	onOpen(): void {
		this.modalEl.addClass('notemd-slide-export-probe-modal');
		this.titleEl.setText('Slide Export Environment');
		this.renderProbeUI();
		void this.runProbe();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderProbeUI(): void {
		const { contentEl } = this;
		contentEl.empty();

		if (!this.report) {
			contentEl.createEl('div', {
				text: 'Probing environment...',
				cls: 'notemd-slide-export-probing',
			});
			return;
		}

		if (!this.report.isDesktop) {
			contentEl.createEl('p', {
				text: 'Slide export is only available on desktop (Windows, macOS, Linux). Mobile devices are not supported.',
				cls: 'notemd-slide-export-mobile-notice',
			});
			return;
		}

		// --- Tool status rows ---
		const grid = contentEl.createDiv({ cls: 'notemd-slide-export-probe-grid' });

		const tools: Array<{
			key: string;
			label: string;
			result: EnvironmentReport['node'] | EnvironmentReport['slidev'] | EnvironmentReport['playwright'] | EnvironmentReport['ffmpeg'];
			autoInstallable: boolean;
		}> = [
			{ key: 'node', label: 'Node.js', result: this.report.node, autoInstallable: false },
			{ key: 'slidev', label: 'Slidev CLI', result: this.report.slidev, autoInstallable: true },
			{ key: 'playwright', label: 'Playwright', result: this.report.playwright, autoInstallable: true },
			{ key: 'ffmpeg', label: 'ffmpeg', result: this.report.ffmpeg, autoInstallable: false },
		];

		for (const { key, label, result, autoInstallable } of tools) {
			const row = grid.createDiv({ cls: 'notemd-slide-export-probe-row' });

			const statusIcon = result.installed ? '✓' : '✗';
			const statusClass = result.installed ? 'notemd-slide-export-status-ok' : 'notemd-slide-export-status-missing';

			const statusSpan = row.createEl('span', {
				cls: `notemd-slide-export-probe-status ${statusClass}`,
			});
			statusSpan.createEl('span', { text: statusIcon, cls: 'notemd-slide-export-probe-icon' });
			statusSpan.createEl('span', { text: ` ${label}: ${result.installed ? (result.version || 'installed') : 'not found'}` });

			if (!result.installed) {
				if (autoInstallable) {
					const btn = row.createEl('button', {
						text: 'Install',
						cls: 'mod-cta notemd-slide-export-install-btn',
					});
					btn.onclick = () => void this.handleAutoInstall(key as 'slidev' | 'playwright');
				} else if (key === 'ffmpeg') {
					row.createEl('pre', {
						text: FFMPEG_INSTALL_HINTS[this.report!.platform] || FFMPEG_INSTALL_HINTS.unknown,
						cls: 'notemd-slide-export-install-hint',
					});
				} else if (key === 'node') {
					row.createEl('p', {
						text: 'Node.js 20+ is required. Install or upgrade via https://nodejs.org/',
						cls: 'notemd-slide-export-install-hint',
					});
				}
			}

			if (result.error && result.installed) {
				row.createEl('small', { text: result.error, cls: 'notemd-slide-export-probe-warn' });
			}
		}

		// --- Capability matrix ---
		const capSection = contentEl.createDiv({ cls: 'notemd-slide-export-capabilities' });
		capSection.createEl('h4', { text: 'Available Export Formats' });

		const formats: Array<{ key: string; label: string; available: boolean }> = [
			{ key: 'html', label: 'HTML (playable slides)', available: this.report.capabilities.html },
			{ key: 'pdf', label: 'PDF', available: this.report.capabilities.pdf },
			{ key: 'png', label: 'PNG (image sequence)', available: this.report.capabilities.png },
			{ key: 'mp4', label: 'MP4 (video)', available: this.report.capabilities.mp4 },
		];

		for (const fmt of formats) {
			const cap = capSection.createDiv({
				cls: fmt.available
					? 'notemd-slide-export-cap-available'
					: 'notemd-slide-export-cap-unavailable',
			});
			cap.createEl('span', { text: fmt.available ? '✓' : '✗', cls: 'notemd-slide-export-probe-icon' });
			cap.createEl('span', { text: ` ${fmt.label}` });
		}

		// --- Buttons ---
		const btnRow = contentEl.createDiv({ cls: 'notemd-slide-export-probe-buttons' });
		btnRow.createEl('button', { text: 'Re-check' }).onclick = () => void this.runProbe();
		btnRow.createEl('button', { text: 'Close' }).onclick = () => this.close();
	}

	private async runProbe(): Promise<void> {
		this.report = null;
		this.renderProbeUI();
		try {
			const vaultRoot = getVaultBasePath(this.app);
			this.report = await probeEnvironment(vaultRoot ? [vaultRoot] : []);
			this.onReportUpdated?.(this.report);
		} catch (err) {
			new Notice(`Environment probe failed: ${err instanceof Error ? err.message : String(err)}`);
		}
		this.renderProbeUI();
	}

	private async handleAutoInstall(tool: 'slidev' | 'playwright'): Promise<void> {
		new Notice(`Installing ${tool === 'slidev' ? 'Slidev CLI' : 'Playwright Chromium'}...`, 5000);

		let result;
		if (tool === 'slidev') {
			const vaultRoot = getVaultBasePath(this.app);
			if (!vaultRoot) {
				new Notice('Vault filesystem path is unavailable; open a local vault before installing the NoteMD Slidev fork.');
				return;
			}
			result = await installSlidevForVault(vaultRoot, (phase) => new Notice(phase, 3000));
		} else {
			result = await autoInstallPlaywright((phase) => new Notice(phase, 3000));
		}

		if (result.exitCode !== 0) {
			new Notice(`Installation failed. Check console for details.`);
			console.error(`[slideExport] ${tool} install failed:`, result.stderr || result.error);
		} else {
			new Notice(`${tool === 'slidev' ? 'Slidev CLI' : 'Playwright Chromium'} installed successfully.`);
		}

		await this.runProbe();
	}
}
