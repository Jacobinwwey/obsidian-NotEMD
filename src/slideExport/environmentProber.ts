/**
 * Slide Export — environment prober
 *
 * Detects whether slidev CLI, playwright-chromium, and ffmpeg
 * are available on the user's system. Runs all probes in parallel.
 */

import type { EnvironmentReport, ExportCapabilities, ProbeResult } from './types';
import { execFileAsync, getOsPlatform, isDesktopApp, resolvePlaywrightBrowsersPath, resolveSlidevCommand } from './platformUtils';
import { findMissingSlidevBuildOptions, formatSlidevBuildRequirementError, NOTEMD_SLIDEV_MISSING_ERROR } from './slidevCompatibility';
import { PLAYWRIGHT_RESOLUTION_SCRIPT, slideExportRuntimeRoots } from './playwrightRuntime';

const MIN_NODE_MAJOR = 20;
const PLAYWRIGHT_LAUNCH_TIMEOUT_MS = 30_000;
// A fresh Windows browser installation needs time for module loading and
// first launch; the process budget also covers graceful browser shutdown.
const PLAYWRIGHT_PROBE_TIMEOUT_MS = 60_000;

function makeMissingProbe(tool: ProbeResult['tool'], error: string): ProbeResult {
	return { tool, installed: false, version: null, error };
}

export async function probeNode(): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('node', 'Not a desktop app');

	const result = await execFileAsync('node', ['--version'], { timeout: 10_000 });
	if (result.exitCode === 0 && result.stdout.trim().startsWith('v')) {
		const version = result.stdout.trim().replace(/^v/, '');
		const major = parseInt(version.split('.')[0], 10);
		if (major >= MIN_NODE_MAJOR) {
			return { tool: 'node', installed: true, version };
		}
		return { tool: 'node', installed: false, version, error: `Node.js v${version} found — v${MIN_NODE_MAJOR}+ required` };
	}
	return { tool: 'node', installed: false, version: null, error: 'node not found in PATH' };
}

export async function probeSlidev(searchRoots: string[] = []): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('slidev', 'Not a desktop app');

	const slidev = resolveSlidevCommand({ roots: searchRoots });
	if (!slidev) return makeMissingProbe('slidev', NOTEMD_SLIDEV_MISSING_ERROR);
	const result = await execFileAsync(slidev.command, [...slidev.argsPrefix, '--version'], { timeout: 45_000 });
	if (result.exitCode === 0) {
		const version = result.stdout.trim() || 'available';
		const help = await execFileAsync(slidev.command, [...slidev.argsPrefix, 'build', '--help'], { timeout: 45_000 });
		const helpText = `${help.stdout}\n${help.stderr}`;
		const missingBuildOptions = help.exitCode === 0
			? findMissingSlidevBuildOptions(helpText)
			: findMissingSlidevBuildOptions('');
		if (help.exitCode !== 0 || missingBuildOptions.length > 0) {
			return {
				tool: 'slidev',
				installed: false,
				version: `${version} (${slidev.description})`,
				error: formatSlidevBuildRequirementError(slidev.description, missingBuildOptions),
			};
		}
		return { tool: 'slidev', installed: true, version: `${version} (${slidev.description})` };
	}
	return { tool: 'slidev', installed: false, version: null, error: `Not available via ${slidev.description}` };
}

export async function probePlaywright(searchRoots: string[] = []): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('playwright', 'Not a desktop app');

	const roots = slideExportRuntimeRoots(searchRoots);
	const script = [
		PLAYWRIGHT_RESOLUTION_SCRIPT,
		'const runtime = require(require("path").dirname(packagePath));',
		'(async () => {',
		`  const browser = await runtime.chromium.launch({ headless: true, timeout: ${PLAYWRIGHT_LAUNCH_TIMEOUT_MS} });`,
		'  try { console.log(`${require(packagePath).version} (${runtime.chromium.executablePath()})`); }',
		'  finally { await browser.close(); }',
		'})().catch(error => { console.error(error); process.exitCode = 1; });',
	].join('\n');
	const browserPath = resolvePlaywrightBrowsersPath();
	const result = await execFileAsync('node', ['-e', script, ...roots], {
		cwd: searchRoots[0],
		timeout: PLAYWRIGHT_PROBE_TIMEOUT_MS,
		env: browserPath ? { PLAYWRIGHT_BROWSERS_PATH: browserPath } : undefined,
	});
	if (result.exitCode === 0) {
		return { tool: 'playwright', installed: true, version: `playwright-chromium ${result.stdout.trim() || 'available'}` };
	}

	// Spawn failures and killed probes may produce no output; preserve their
	// cause so a timeout is not misreported as an absent runtime.
	const processError = result.error as (Error & { killed?: boolean }) | undefined;
	const stderr = `${result.stderr || ''}\n${result.stdout || ''}`.trim()
		|| (processError?.killed
			? `Playwright probe was terminated before completion (${PLAYWRIGHT_PROBE_TIMEOUT_MS} ms process limit).`
			: processError?.message)
		|| `Probe process exited with code ${result.exitCode}`;
	return {
		tool: 'playwright',
		installed: false,
		version: null,
		error: stderr
			? `playwright-chromium unavailable for Slidev export: ${stderr}`
			: 'playwright-chromium unavailable for Slidev export',
	};
}

export async function probeFfmpeg(): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('ffmpeg', 'Not a desktop app');

	const result = await execFileAsync('ffmpeg', ['-version'], { timeout: 10_000 });
	if (result.exitCode === 0) {
		const firstLine = (result.stdout || '').split('\n')[0] || '';
		const version = firstLine.replace(/^ffmpeg version\s*/, '').trim().split(/\s+/)[0];
		return { tool: 'ffmpeg', installed: true, version };
	}
	return { tool: 'ffmpeg', installed: false, version: null, error: 'ffmpeg not found in PATH (manual install required)' };
}

function computeCapabilities(
	node: ProbeResult,
	slidev: ProbeResult,
	playwright: ProbeResult,
	ffmpeg: ProbeResult,
): ExportCapabilities {
	const hasBase = node.installed && slidev.installed;
	return {
		html: hasBase,
		pdf: hasBase && playwright.installed,
		png: hasBase && playwright.installed,
		pptx: hasBase && playwright.installed,
		mp4: hasBase && playwright.installed && ffmpeg.installed,
	};
}

export async function probeEnvironment(searchRoots: string[] = []): Promise<EnvironmentReport> {
	const platform = getOsPlatform();

	if (!isDesktopApp()) {
		const missing = (tool: ProbeResult['tool']): ProbeResult => makeMissingProbe(tool, 'Not a desktop app');
		return {
			isDesktop: false,
			platform,
			node: missing('node'),
			slidev: missing('slidev'),
			playwright: missing('playwright'),
			ffmpeg: missing('ffmpeg'),
			capabilities: { html: false, pdf: false, png: false, pptx: false, mp4: false },
		};
	}

	const [node, slidev, playwright, ffmpeg] = await Promise.all([
		probeNode(),
		probeSlidev(searchRoots),
		probePlaywright(searchRoots),
		probeFfmpeg(),
	]);

	return {
		isDesktop: true,
		platform,
		node,
		slidev,
		playwright,
		ffmpeg,
		capabilities: computeCapabilities(node, slidev, playwright, ffmpeg),
	};
}
