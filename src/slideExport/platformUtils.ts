/**
 * Slide Export — platform utilities
 *
 * Safe access to Node.js builtins on desktop Obsidian (Electron).
 * Every function returns null/false on mobile — no crashes.
 */

import { Platform } from 'obsidian';
import type { ExecResult } from './types';

export interface ResolvedSlidevCommand {
	command: string;
	argsPrefix: string[];
	description: string;
	source: 'configured-path' | 'local-fork' | 'project-bin' | 'npx';
}

export interface SlidevCommandSearchOptions {
	roots?: string[];
}

/**
 * Check whether we are on a desktop (Electron) Obsidian client.
 * Uses the Obsidian Platform global, falling back to feature detection.
 */
export function isDesktopApp(): boolean {
	try {
		if (typeof Platform?.isDesktopApp === 'boolean') {
			return Platform.isDesktopApp;
		}
	} catch {
		// Fall through to runtime checks below.
	}

	try {
		const runtimePlatform = (globalThis as any).Platform;
		if (typeof runtimePlatform?.isDesktopApp === 'boolean') {
			return runtimePlatform.isDesktopApp;
		}
	} catch {
		// Fall through to Electron feature detection below.
	}

	return typeof process !== 'undefined'
		&& !!process.versions?.electron
		&& typeof require === 'function';
}

/**
 * Get the vault's absolute filesystem path.
 * Returns null on mobile or if the adapter does not expose getBasePath.
 */
export function getVaultBasePath(app: { vault: { adapter: any } }): string | null {
	if (!isDesktopApp()) return null;
	const adapter = app.vault.adapter;
	if (typeof adapter.getBasePath === 'function') return adapter.getBasePath();
	if (typeof adapter.basePath === 'string') return adapter.basePath;
	return null;
}

/**
 * Safely require a Node.js builtin module.
 * Returns null if unavailable (mobile / restricted env).
 */
export function safeRequire(moduleName: string): any {
	if (!isDesktopApp()) return null;
	try {
		return require(moduleName);
	} catch {
		return null;
	}
}

/**
 * Execute a command via child_process.execFile.
 * Arguments passed as array — never concatenated into a shell string.
 */
export async function execFileAsync(
	command: string,
	args: string[],
	options?: { cwd?: string; timeout?: number; env?: Record<string, string> },
): Promise<ExecResult> {
	const childProcess = safeRequire('child_process');
	if (!childProcess) {
		return {
			exitCode: -1,
			stdout: '',
			stderr: 'child_process unavailable (mobile or restricted env)',
			error: new Error('child_process not available'),
		};
	}

	// On Windows, child_process.execFile cannot spawn a bare name like "node" or
	// a batch shim ("npx.cmd", "npm.cmd", "slidev.cmd") without shell resolution —
	// it throws EINVAL synchronously. We need shell:true so Node resolves the PATHEXT
	// and runs .cmd/.bat/.exe shims the same way `child_process.exec` would, while
	// still passing our args as an array (no shell interpolation risk because execFile
	// with shell:true still substitutes via cmd.exe only when command itself is a batch).
	// On macOS/Linux, shell stays false — direct exec, no shell overhead.
	const os: any = safeRequire('os');
	const isWindows = os?.platform?.() === 'win32';

	return new Promise<ExecResult>((resolve) => {
		const proc = childProcess.execFile(
			command,
			args,
			{
				cwd: options?.cwd,
				timeout: options?.timeout ?? 120_000,
				env: { ...process.env, ...options?.env },
				maxBuffer: 10 * 1024 * 1024,
				shell: isWindows,
				windowsHide: true,
			},
			(error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
				const stdoutStr = typeof stdout === 'string' ? stdout : stdout?.toString?.('utf8') ?? '';
				const stderrStr = typeof stderr === 'string' ? stderr : stderr?.toString?.('utf8') ?? '';
				resolve({
					exitCode: error ? (error as any).code ?? 1 : 0,
					stdout: stdoutStr,
					stderr: stderrStr,
					error: error ?? undefined,
				});
			},
		);

		if (options?.timeout) {
			setTimeout(() => {
				try { proc.kill(); } catch { /* already exited */ }
			}, options.timeout + 2_000);
		}
	});
}

/**
 * Build platform-specific npx command.
 * On Windows: 'npx.cmd'; elsewhere: 'npx'.
 */
export function resolveNpxCommand(): string {
	const os: any = safeRequire('os');
	if (os && typeof os.platform === 'function') {
		return os.platform() === 'win32' ? 'npx.cmd' : 'npx';
	}
	return 'npx';
}

export function resolveNpmCommand(): string {
	const os: any = safeRequire('os');
	if (os && typeof os.platform === 'function') {
		return os.platform() === 'win32' ? 'npm.cmd' : 'npm';
	}
	return 'npm';
}

export function resolveWorkspaceHomeCandidates(): string[] {
	const path: any = safeRequire('path');
	const candidates: string[] = [];

	const pushCandidate = (candidate: string | undefined | null) => {
		if (typeof candidate !== 'string' || candidate.trim().length === 0) {
			return;
		}

		const normalized = path?.resolve?.(candidate) ?? candidate;
		if (!candidates.includes(normalized)) {
			candidates.push(normalized);
		}
	};

	pushCandidate(process.env.NOTEMD_WORKSPACE_HOME);
	pushCandidate(process.env.HOME);
	pushCandidate(process.env.USERPROFILE);

	const cwd = typeof process !== 'undefined' ? process.cwd() : '';
	if (typeof cwd === 'string' && cwd.length > 0) {
		pushCandidate(cwd.match(/^\/home\/[^/]+/)?.[0]);
		if (cwd === '/root' || cwd.startsWith('/root/')) {
			pushCandidate('/root');
		}
		if (path?.dirname) {
			pushCandidate(path.dirname(cwd));
			pushCandidate(path.dirname(path.dirname(cwd)));
		}
	}

	return candidates;
}

export function resolvePlaywrightBrowsersPath(): string | null {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs || !path) {
		return null;
	}

	for (const home of resolveWorkspaceHomeCandidates()) {
		for (const candidate of [
			path.join(home, '.cache', 'ms-playwright'),
			path.join(home, 'Library', 'Caches', 'ms-playwright'),
			path.join(home, 'AppData', 'Local', 'ms-playwright'),
			path.join(home, 'AppData', 'Roaming', 'ms-playwright'),
		]) {
			try {
				if (fs.existsSync(candidate)) {
					return candidate;
				}
			} catch {
				// Try the next candidate.
			}
		}
	}

	// Windows falls back to the PLAYWRIGHT_BROWSERS_PATH env var if set.
	if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
		try {
			if (fs.existsSync(process.env.PLAYWRIGHT_BROWSERS_PATH)) {
				return process.env.PLAYWRIGHT_BROWSERS_PATH;
			}
		} catch {
			// Fall through to null.
		}
	}

	return null;
}

export function resolveSlidevCommand(options: SlidevCommandSearchOptions = {}): ResolvedSlidevCommand {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	const workspaceHomes = resolveWorkspaceHomeCandidates();
	const configuredPaths = [
		process.env.NOTEMD_SLIDEV_BIN,
		process.env.SLIDEV_CLI_PATH,
	].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);
	const localForkPaths = [
		...workspaceHomes.map(home => path?.join?.(home, 'slidev', 'packages', 'slidev', 'bin', 'slidev.mjs')),
	].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);
	const projectBinPaths = resolveSlidevProjectBinCandidates(options.roots ?? [], path);

	for (const candidate of configuredPaths) {
		try {
			if (fs?.existsSync?.(candidate)) {
				return {
					command: candidate,
					argsPrefix: [],
					description: candidate,
					source: 'configured-path',
				};
			}
		} catch {
			// Try the next candidate.
		}
	}

	for (const candidate of localForkPaths) {
		try {
			if (fs?.existsSync?.(candidate)) {
				return {
					command: candidate,
					argsPrefix: [],
					description: candidate,
					source: 'local-fork',
				};
			}
		} catch {
			// Try the next candidate.
		}
	}

	for (const candidate of projectBinPaths) {
		try {
			if (fs?.existsSync?.(candidate)) {
				return {
					command: candidate,
					argsPrefix: [],
					description: candidate,
					source: 'project-bin',
				};
			}
		} catch {
			// Try the next candidate.
		}
	}

	return {
		command: resolveNpxCommand(),
		argsPrefix: ['-y', '@slidev/cli'],
		description: 'npx -y @slidev/cli',
		source: 'npx',
	};
}

function resolveSlidevProjectBinCandidates(roots: string[], path: any): string[] {
	const candidates: string[] = [];
	const pushRoot = (root: string | undefined | null) => {
		if (typeof root !== 'string' || root.trim().length === 0 || !path?.join) {
			return;
		}
		const binName = getOsPlatform() === 'win32' ? 'slidev.cmd' : 'slidev';
		const normalizedRoot = path.resolve ? path.resolve(root) : root;
		const candidate = path.join(normalizedRoot, 'node_modules', '.bin', binName);
		if (!candidates.includes(candidate)) {
			candidates.push(candidate);
		}
	};

	for (const root of roots) {
		pushRoot(root);
	}
	if (typeof process !== 'undefined') {
		pushRoot(process.cwd());
	}
	return candidates;
}

/**
 * Detect the OS platform string.
 */
export function getOsPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown' {
	const os: any = safeRequire('os');
	if (!os || typeof os.platform !== 'function') return 'unknown';
	const p = os.platform();
	if (p === 'win32' || p === 'darwin' || p === 'linux') return p;
	return 'unknown';
}
