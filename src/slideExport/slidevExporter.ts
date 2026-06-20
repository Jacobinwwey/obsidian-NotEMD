/**
 * Slide Export — Slidev CLI wrapper
 *
 * Orchestrates Slidev CLI build/export via child_process.
 * All arguments passed as arrays to execFile — no shell interpolation.
 */

import type { App } from 'obsidian';
import type { SlideExportConfig, ExecResult, ExportProgressCallback, SlidevExportSource, SlidevHtmlActualMode, SlidevHtmlExportOutcome } from './types';
import { execFileAsync, getVaultBasePath, resolveNpxCommand, resolvePlaywrightBrowsersPath, resolveSlidevCommand, safeRequire } from './platformUtils';
import { extractLocalAssetReferences } from './slidevSourcePreparer';

function createBuildArgs(
	inputPath: string,
	outputDir: string,
	config: SlideExportConfig,
	extraArgs: string[],
): string[] {
	const args = [
		'build',
		'--out', outputDir,
		'--base', './',
		'--router-mode', 'hash',
		...extraArgs,
	];
	if (config.slidevTheme) {
		args.push('--theme', config.slidevTheme);
	}
	args.push(inputPath);
	return args;
}

function ensureDirectoryExists(directoryPath: string): void {
	const fs: any = safeRequire('fs');
	fs?.mkdirSync?.(directoryPath, { recursive: true });
}

function recreateDirectory(directoryPath: string): void {
	const fs: any = safeRequire('fs');
	fs?.rmSync?.(directoryPath, { recursive: true, force: true });
	fs?.mkdirSync?.(directoryPath, { recursive: true });
}

function copyPreparedLocalFileReferencesToExport(
	source: SlidevExportSource,
	vaultRoot: string,
	outputDir: string,
	onProgress?: ExportProgressCallback,
): void {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs?.existsSync || !fs?.readFileSync || !path?.join || !path?.dirname || !path?.relative || !path?.isAbsolute) {
		return;
	}

	const preparedDeckPath = source.preparedDeckPath ?? source.inputFilePath;
	const absolutePreparedDeckPath = path.join(vaultRoot, preparedDeckPath);
	if (!fs.existsSync(absolutePreparedDeckPath)) {
		return;
	}

	const preparedDeckDirectory = path.dirname(absolutePreparedDeckPath);
	const copiedAssets: string[] = [];
	const deckMarkdown = fs.readFileSync(absolutePreparedDeckPath, 'utf8');
	for (const referencePath of extractLocalAssetReferences(deckMarkdown)) {
		const absoluteSourceAsset = path.join(preparedDeckDirectory, referencePath);
		if (!isInsideDirectory(path, preparedDeckDirectory, absoluteSourceAsset) || !fs.existsSync(absoluteSourceAsset)) {
			continue;
		}
		const stat = fs.statSync?.(absoluteSourceAsset);
		if (!stat?.isFile?.()) {
			continue;
		}

		const absoluteTargetAsset = path.join(outputDir, referencePath);
		if (!isInsideDirectory(path, outputDir, absoluteTargetAsset)) {
			continue;
		}
		fs.mkdirSync?.(path.dirname(absoluteTargetAsset), { recursive: true });
		if (fs.copyFileSync) {
			fs.copyFileSync(absoluteSourceAsset, absoluteTargetAsset);
		} else {
			fs.cpSync?.(absoluteSourceAsset, absoluteTargetAsset);
		}
		copiedAssets.push(referencePath);
	}

	if (copiedAssets.length > 0) {
		onProgress?.('slidev-build', `Copied local export assets: ${copiedAssets.join(', ')}`);
	}
}

function isInsideDirectory(path: any, directoryPath: string, candidatePath: string): boolean {
	const relativePath = path.relative(directoryPath, candidatePath);
	return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasStandaloneLoaderBinding(entryModuleCode: string, loaderRef: string): boolean {
	const escapedLoaderRef = escapeRegExp(loaderRef);
	return new RegExp(`(^|[^A-Za-z0-9_$])${escapedLoaderRef}\\s*=`).test(entryModuleCode);
}

export function detectStandaloneBundleLoaderGaps(html: string): string[] {
	const entryRefMatch = html.match(/window\.__require\(['"](\.\/index-[^'"]+\.js)['"]\)/);
	if (!entryRefMatch) {
		return [];
	}

	const entryModulePath = entryRefMatch[1];
	const escapedEntryModulePath = escapeRegExp(entryModulePath);
	const entryModuleMatch = html.match(new RegExp(`"${escapedEntryModulePath}":"((?:\\\\.|[^"])*)"`));
	if (!entryModuleMatch) {
		return [];
	}

	let entryModuleCode = '';
	try {
		entryModuleCode = JSON.parse(`"${entryModuleMatch[1]}"`);
	} catch {
		return [];
	}

	const loaderRefs = Array.from(entryModuleCode.matchAll(/load:([A-Za-z_$][A-Za-z0-9_$]*)/g)).map(match => match[1]);
	if (loaderRefs.length === 0) {
		return [];
	}

	const uniqueRefs = Array.from(new Set(loaderRefs));
	return uniqueRefs.filter(ref => !hasStandaloneLoaderBinding(entryModuleCode, ref));
}

/**
 * Export Markdown as a Slidev SPA (HTML build).
 */
export async function exportSlidevHtml(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<string> {
	return (await exportSlidevHtmlWithOutcome(app, source, config, onProgress)).path;
}

export async function exportSlidevHtmlWithOutcome(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<SlidevHtmlExportOutcome> {
	if ((config.htmlMode ?? 'standalone') === 'server-script') {
		return exportSlidevServerHtml(app, source, config, 'server-script', onProgress);
	}
	return exportSlidevStandaloneHtml(app, source, config, onProgress);
}

async function exportSlidevStandaloneHtml(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<SlidevHtmlExportOutcome> {
	onProgress?.('slidev-build', 'Building standalone Slidev HTML...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${source.inputFilePath}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}/${source.outputBasename}-slides`;
	const slidev = resolveSlidevCommand();
	recreateDirectory(outputDir);
	const args = [
		...slidev.argsPrefix,
		...createBuildArgs(inputPath, outputDir, config, ['--standalone-bundle']),
	];

	const result = await execFileAsync(slidev.command, args, { cwd: vaultRoot, timeout: config.timeoutMs });
	if (result.exitCode !== 0) {
		throw new Error(`Slidev standalone build failed via ${slidev.description} (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}
	copyPreparedLocalFileReferencesToExport(source, vaultRoot, outputDir, onProgress);

	const standaloneHtmlPath = `${config.outputSubfolder}/${source.outputBasename}-slides/index-standalone.html`;
	const standaloneHtml = await app.vault.adapter.read(standaloneHtmlPath);
	const loaderGaps = detectStandaloneBundleLoaderGaps(standaloneHtml);
	if (loaderGaps.length === 0) {
		onProgress?.('slidev-build', `Standalone HTML created via ${slidev.description}`);
		return {
			path: standaloneHtmlPath,
			requestedMode: 'standalone',
			actualMode: 'standalone',
			requiresLocalServer: false,
			fallbackPath: null,
			standaloneAttempt: {
				attempted: true,
				accepted: true,
				outputPath: standaloneHtmlPath,
				preservedFailurePath: null,
				loaderGaps: [],
				failureReason: null,
			},
		};
	}

	onProgress?.('slidev-build', `Standalone bundle missed loader bindings (${loaderGaps.join(', ')}); falling back to server-script HTML...`);
	const fallbackOutcome = await exportSlidevServerHtml(app, source, config, 'server-script-fallback', onProgress);
	const preservedFailurePath = `${config.outputSubfolder}/${source.outputBasename}-slides/index-standalone.failed.html`;
	await app.vault.adapter.write(preservedFailurePath, standaloneHtml);
	onProgress?.('slidev-build', `Preserved rejected standalone bundle at ${preservedFailurePath}`);
	return {
		...fallbackOutcome,
		requestedMode: 'standalone',
		fallbackPath: fallbackOutcome.path,
		standaloneAttempt: {
			attempted: true,
			accepted: false,
			outputPath: standaloneHtmlPath,
			preservedFailurePath,
			loaderGaps,
			failureReason: 'loader-gaps',
		},
	};
}

async function exportSlidevServerHtml(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	actualMode: SlidevHtmlActualMode,
	onProgress?: ExportProgressCallback,
): Promise<SlidevHtmlExportOutcome> {
	onProgress?.('slidev-build', 'Building Slidev SPA...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${source.inputFilePath}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}/${source.outputBasename}-slides`;
	const slidev = resolveSlidevCommand();
	recreateDirectory(outputDir);
	const args = [
		...slidev.argsPrefix,
		...createBuildArgs(inputPath, outputDir, config, []),
	];

	const result = await execFileAsync(slidev.command, args, { cwd: vaultRoot, timeout: config.timeoutMs });
	if (result.exitCode !== 0) {
		throw new Error(`Slidev build failed via ${slidev.description} (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}
	copyPreparedLocalFileReferencesToExport(source, vaultRoot, outputDir, onProgress);

	const exportPath = `${config.outputSubfolder}/${source.outputBasename}-slides/index.html`;

	onProgress?.('slidev-build', 'Creating server scripts...');
	const { createServerScripts } = await import('./serverScripts');
	await createServerScripts(app, exportPath);

	onProgress?.('slidev-build', `HTML build complete via ${slidev.description} (requires local server)`);
	return {
		path: exportPath,
		requestedMode: config.htmlMode ?? 'standalone',
		actualMode,
		requiresLocalServer: true,
		fallbackPath: actualMode === 'server-script-fallback' ? exportPath : null,
		standaloneAttempt: {
			attempted: false,
			accepted: false,
			outputPath: null,
			preservedFailurePath: null,
			loaderGaps: [],
			failureReason: null,
		},
	};
}

/**
 * Export slides as a PDF.
 */
export async function exportSlidevPdf(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<string> {
	onProgress?.('slidev-export', 'Exporting PDF...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${source.inputFilePath}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}`;
	const slidev = resolveSlidevCommand();
	ensureDirectoryExists(outputDir);
	const outputPath = `${outputDir}/${source.outputBasename}.pdf`;
	const playwrightBrowsersPath = resolvePlaywrightBrowsersPath();

	const args = [
		...slidev.argsPrefix,
		'export',
		'--format', 'pdf',
		'--output', outputPath,
		inputPath,
	];
	if (config.slidevTheme) {
		args.push('--theme', config.slidevTheme);
	}

	const result = await execFileAsync(slidev.command, args, {
		cwd: vaultRoot,
		timeout: config.timeoutMs,
		env: playwrightBrowsersPath ? { PLAYWRIGHT_BROWSERS_PATH: playwrightBrowsersPath } : undefined,
	});
	if (result.exitCode !== 0) {
		throw new Error(`Slidev export failed via ${slidev.description} (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}

	onProgress?.('slidev-export', 'PDF export complete');
	return `${config.outputSubfolder}/${source.outputBasename}.pdf`;
}

/**
 * Export slides as a PNG sequence.
 */
export async function exportSlidevPng(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<string> {
	onProgress?.('slidev-export', 'Exporting PNG...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const inputPath = `${vaultRoot}/${source.inputFilePath}`;
	const outputDir = `${vaultRoot}/${config.outputSubfolder}/${source.outputBasename}-slides-png`;
	const slidev = resolveSlidevCommand();
	recreateDirectory(outputDir);
	const playwrightBrowsersPath = resolvePlaywrightBrowsersPath();

	const args = [
		...slidev.argsPrefix,
		'export',
		'--format', 'png',
		'--output', outputDir,
		inputPath,
	];
	if (config.withClicks) {
		args.push('--with-clicks');
	}
	if (config.slidevTheme) {
		args.push('--theme', config.slidevTheme);
	}

	const result = await execFileAsync(slidev.command, args, {
		cwd: vaultRoot,
		timeout: config.timeoutMs,
		env: playwrightBrowsersPath ? { PLAYWRIGHT_BROWSERS_PATH: playwrightBrowsersPath } : undefined,
	});
	if (result.exitCode !== 0) {
		throw new Error(`Slidev export failed via ${slidev.description} (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}

	onProgress?.('slidev-export', 'PNG sequence exported');
	return `${config.outputSubfolder}/${source.outputBasename}-slides-png`;
}

/**
 * Auto-install slidev CLI via npx -y (pre-warms the npx cache).
 */
export async function autoInstallSlidev(
	onProgress?: ExportProgressCallback,
): Promise<ExecResult> {
	const slidev = resolveSlidevCommand();
	if (slidev.source === 'local-fork') {
		onProgress?.('install-slidev', 'Using local Slidev fork...');
		const result = await execFileAsync(slidev.command, ['--version'], { timeout: 120_000 });
		onProgress?.('install-slidev', result.exitCode === 0 ? 'Local Slidev fork is available' : 'Local Slidev fork failed');
		return result;
	}

	onProgress?.('install-slidev', 'Installing Slidev CLI (may take a moment)...');
	const result = await execFileAsync(slidev.command, [...slidev.argsPrefix, '--version'], { timeout: 120_000 });
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

/**
 * Auto-install http-server for serving HTML exports.
 */
export async function autoInstallHttpServer(
	onProgress?: ExportProgressCallback,
): Promise<ExecResult> {
	onProgress?.('install-http-server', 'Installing http-server...');
	const npx = resolveNpxCommand();
	const result = await execFileAsync(npx, ['-y', 'http-server', '--version'], { timeout: 60_000 });
	onProgress?.('install-http-server', result.exitCode === 0 ? 'http-server installed' : 'http-server install failed');
	return result;
}
