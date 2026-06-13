/**
 * Slide Export — environment prober
 *
 * Detects whether slidev CLI, playwright-chromium, and ffmpeg
 * are available on the user's system. Runs all probes in parallel.
 */

import type { EnvironmentReport, ExportCapabilities, ProbeResult } from './types';
import { execFileAsync, getOsPlatform, isDesktopApp, resolveNpxCommand } from './platformUtils';

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

export async function probeSlidev(): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('slidev', 'Not a desktop app');

	const npx = resolveNpxCommand();
	const result = await execFileAsync(npx, ['@slidev/cli', '--version'], { timeout: 45_000 });
	if (result.exitCode === 0) {
		const version = result.stdout.trim() || 'available';
		return { tool: 'slidev', installed: true, version };
	}
	return { tool: 'slidev', installed: false, version: null, error: 'Not installed (auto-install via npx)' };
}

export async function probePlaywright(): Promise<ProbeResult> {
	if (!isDesktopApp()) return makeMissingProbe('playwright', 'Not a desktop app');

	const npx = resolveNpxCommand();

	// Try a lightweight probe: ask playwright to list browsers
	const result = await execFileAsync(npx, ['playwright', '--version'], { timeout: 15_000 });
	if (result.exitCode === 0) {
		return { tool: 'playwright', installed: true, version: result.stdout.trim() || 'available' };
	}

	// Fallback: check if chromium binary directory exists
	const fs: any = require('fs');
	const path: any = require('path');
	const home = process.env.HOME || process.env.USERPROFILE || '';
	const cacheDirs = [
		path.join(home, '.cache', 'ms-playwright'),
		path.join(home, 'AppData', 'Local', 'ms-playwright'),
	];
	for (const dir of cacheDirs) {
		try {
			const entries = fs.readdirSync(dir);
			if (entries.length > 0) {
				return { tool: 'playwright', installed: true, version: 'chromium (cached)' };
			}
		} catch { /* dir doesn't exist */ }
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

export async function probeEnvironment(): Promise<EnvironmentReport> {
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
		probeSlidev(),
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
