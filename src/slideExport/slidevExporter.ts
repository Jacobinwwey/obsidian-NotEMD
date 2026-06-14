/**
 * Slide Export — Slidev CLI wrapper
 *
 * Orchestrates `npx @slidev/cli build/export` via child_process.
 * All arguments passed as arrays to execFile — no shell interpolation.
 */

import type { App, TFile } from 'obsidian';
import type { SlideExportConfig, ExecResult, ExportProgressCallback } from './types';
import { execFileAsync, getVaultBasePath, resolveNpxCommand } from './platformUtils';

/**
 * Export Markdown as a Slidev SPA (HTML build).
 * npx -y @slidev/cli build --output <dir> --router-mode hash <input.md>
 */
export async function exportSlidevHtml(
	app: App,
	sourceFile: TFile,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<string> {
	onProgress?.('slidev-build', 'Building Slidev SPA...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${sourceFile.path}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}/${sourceFile.basename}-slides`;
	const npx = resolveNpxCommand();

	const args = [
		'-y', '@slidev/cli', 'build',
		'--output', outputDir,
		'--base', './',
		'--router-mode', 'hash',
		inputPath,
	];
	if (config.slidevTheme) {
		args.push('--theme', config.slidevTheme);
	}

	const result = await execFileAsync(npx, args, { cwd: vaultRoot, timeout: config.timeoutMs });
	if (result.exitCode !== 0) {
		throw new Error(`Slidev build failed (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}

	onProgress?.('slidev-build', 'HTML build complete');
	return `${config.outputSubfolder}/${sourceFile.basename}-slides/index.html`;
}

/**
 * Export slides as PDF or PNG.
 * npx -y @slidev/cli export --format <pdf|png> [--with-clicks] <input.md>
 */
export async function exportSlidevImages(
	app: App,
	sourceFile: TFile,
	config: SlideExportConfig,
	format: 'pdf' | 'png',
	onProgress?: ExportProgressCallback,
): Promise<string> {
	onProgress?.('slidev-export', `Exporting ${format.toUpperCase()}...`);
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${sourceFile.path}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}`;
	const npx = resolveNpxCommand();

	const args = [
		'-y', '@slidev/cli', 'export',
		'--format', format,
		'--output', outputDir,
		inputPath,
	];
	if (config.withClicks && format === 'png') {
		args.push('--with-clicks');
	}
	if (config.slidevTheme) {
		args.push('--theme', config.slidevTheme);
	}

	const result = await execFileAsync(npx, args, { cwd: vaultRoot, timeout: config.timeoutMs });
	if (result.exitCode !== 0) {
		throw new Error(`Slidev export failed (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}

	if (format === 'pdf') {
		onProgress?.('slidev-export', 'PDF export complete');
		return `${config.outputSubfolder}/${sourceFile.basename}.pdf`;
	}
	onProgress?.('slidev-export', 'PNG sequence exported');
	return `${config.outputSubfolder}/`;
}

/**
 * Auto-install slidev CLI via npx -y (pre-warms the npx cache).
 */
export async function autoInstallSlidev(
	onProgress?: ExportProgressCallback,
): Promise<ExecResult> {
	onProgress?.('install-slidev', 'Installing Slidev CLI (may take a moment)...');
	const npx = resolveNpxCommand();
	const result = await execFileAsync(npx, ['-y', '@slidev/cli', '--version'], { timeout: 120_000 });
	onProgress?.('install-slidev', result.exitCode === 0 ? 'Slidev CLI installed' : 'Slidev CLI install failed');
	return result;
}

/**
 * Auto-install Playwright chromium browser.
 */
export async function autoInstallPlaywright(
	onProgress?: ExportProgressCallback,
): Promise<ExecResult> {
	onProgress?.('install-playwright', 'Downloading Playwright Chromium (may take a moment)...');
	const npx = resolveNpxCommand();
	const result = await execFileAsync(npx, ['playwright', 'install', 'chromium'], { timeout: 300_000 });
	onProgress?.('install-playwright', result.exitCode === 0 ? 'Playwright Chromium installed' : 'Playwright install failed');
	return result;
}
