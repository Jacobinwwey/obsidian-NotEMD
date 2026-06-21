/**
 * Slide Export — environment prober
 *
 * Detects whether slidev CLI, playwright-chromium, and ffmpeg
 * are available on the user's system. Runs all probes in parallel.
 */

import type { EnvironmentReport, ExportCapabilities, ProbeResult } from './types';
import { execFileAsync, getOsPlatform, isDesktopApp, resolveNpxCommand, resolvePlaywrightBrowsersPath, resolveSlidevCommand, safeRequire } from './platformUtils';

const MIN_NODE_MAJOR = 20;

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
	const result = await execFileAsync(slidev.command, [...slidev.argsPrefix, '--version'], { timeout: 45_000 });
	if (result.exitCode === 0) {
		const version = result.stdout.trim() || 'available';
		const help = await execFileAsync(slidev.command, [...slidev.argsPrefix, 'build', '--help'], { timeout: 45_000 });
		const helpText = `${help.stdout}\n${help.stderr}`;
		if (help.exitCode !== 0 || !helpText.includes('--standalone-bundle')) {
			return {
				tool: 'slidev',
				installed: false,
				version: `${version} (${slidev.description})`,
				error: `Slidev found via ${slidev.description}, but it does not expose --standalone-bundle`,
			};
		}
		return { tool: 'slidev', installed: true, version: `${version} (${slidev.description})` };
	}
	return { tool: 'slidev', installed: false, version: null, error: `Not available via ${slidev.description}` };
}

export async function probePlaywright(): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('playwright', 'Not a desktop app');

	const npx = resolveNpxCommand();

	// Try a lightweight probe: ask playwright to list browsers
	const result = await execFileAsync(npx, ['playwright', '--version'], { timeout: 15_000 });
	if (result.exitCode === 0) {
		return { tool: 'playwright', installed: true, version: result.stdout.trim() || 'available' };
	}

	const fs: any = safeRequire('fs');
	if (!fs) {
		return { tool: 'playwright', installed: false, version: null, error: 'Playwright chromium not installed (auto-install available)' };
	}

	const browserPath = resolvePlaywrightBrowsersPath();
	if (browserPath) {
		try {
			const entries = fs.readdirSync(browserPath);
			if (entries.length > 0) {
				return { tool: 'playwright', installed: true, version: 'chromium (cached)' };
			}
		} catch {
			// Fall through to the missing-tool result below.
		}
	}

	return { tool: 'playwright', installed: false, version: null, error: 'Playwright chromium not installed (auto-install available)' };
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
			capabilities: { html: false, pdf: false, png: false, mp4: false },
		};
	}

	const [node, slidev, playwright, ffmpeg] = await Promise.all([
		probeNode(),
		probeSlidev(searchRoots),
		probePlaywright(),
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
