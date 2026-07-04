/**
 * Slide Export — environment prober
 *
 * Detects whether slidev CLI, playwright-chromium, and ffmpeg
 * are available on the user's system. Runs all probes in parallel.
 */

import type { EnvironmentReport, ExportCapabilities, ProbeResult } from './types';
import { execFileAsync, getOsPlatform, isDesktopApp, resolvePlaywrightBrowsersPath, resolveSlidevCommand } from './platformUtils';
import { findMissingSlidevBuildOptions, formatSlidevBuildRequirementError } from './slidevCompatibility';

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

	const roots = Array.from(new Set([typeof process !== 'undefined' ? process.cwd() : '', ...searchRoots].filter(Boolean)));
	const script = [
		'const fs = require("fs");',
		'const roots = process.argv.slice(1);',
		'const resolveOptions = roots.length > 0 ? { paths: roots } : undefined;',
		'const entry = require.resolve("playwright-chromium", resolveOptions);',
		'const packageJson = require(require.resolve("playwright-chromium/package.json", resolveOptions));',
		'const runtime = require(entry);',
		'const executablePath = runtime.chromium?.executablePath?.();',
		'if (!executablePath || !fs.existsSync(executablePath)) {',
		'  throw new Error(`playwright-chromium found, but Chromium executable is unavailable: ${executablePath || "unknown"}`);',
		'}',
		'console.log(`${packageJson.version} (${executablePath})`);',
	].join('\n');
	const browserPath = resolvePlaywrightBrowsersPath();
	const result = await execFileAsync('node', ['-e', script, ...roots], {
		timeout: 15_000,
		env: browserPath ? { PLAYWRIGHT_BROWSERS_PATH: browserPath } : undefined,
	});
	if (result.exitCode === 0) {
		return { tool: 'playwright', installed: true, version: `playwright-chromium ${result.stdout.trim() || 'available'}` };
	}

	const stderr = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
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
