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

	const os: any = safeRequire('os');
	const isWindows = os?.platform?.() === 'win32';
	if (isWindows && isWindowsNodeScript(command)) {
		return execFileOnce(childProcess, process.execPath, [command, ...args], options, {
			windowsVerbatimArguments: false,
		});
	}

	const directResult = await execFileOnce(childProcess, command, args, options, {
		windowsVerbatimArguments: false,
	});
	if (!isWindows || !shouldRetryWithWindowsCommandResolution(directResult.error)) {
		return directResult;
	}

	const resolvedCommand = resolveWindowsCommand(command, options);
	const commandForBatch = resolvedCommand ?? command;
	if (isWindowsBatchFile(commandForBatch)) {
		return execWindowsBatchFile(childProcess, commandForBatch, args, options);
	}

	if (isWindowsNodeScript(commandForBatch)) {
		return execFileOnce(childProcess, process.execPath, [commandForBatch, ...args], options, {
			windowsVerbatimArguments: false,
		});
	}

	return directResult;
}

function execFileOnce(
	childProcess: any,
	command: string,
	args: string[],
	options: { cwd?: string; timeout?: number; env?: Record<string, string> } | undefined,
	executionOptions: { windowsVerbatimArguments: boolean },
): Promise<ExecResult> {
	return new Promise<ExecResult>((resolve) => {
		let settled = false;
		let killTimer: ReturnType<typeof setTimeout> | null = null;
		const settle = (result: ExecResult) => {
			if (settled) {
				return;
			}
			settled = true;
			if (killTimer) {
				clearTimeout(killTimer);
			}
			resolve(result);
		};

		try {
			const proc = childProcess.execFile(
				command,
				args,
				{
					cwd: options?.cwd,
					timeout: options?.timeout ?? 120_000,
					env: { ...process.env, ...options?.env },
					maxBuffer: 10 * 1024 * 1024,
					shell: false,
					windowsVerbatimArguments: executionOptions.windowsVerbatimArguments,
					windowsHide: true,
				},
				(error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
					settle(createExecResult(error, stdout, stderr));
				},
			);

			if (options?.timeout && !settled) {
				killTimer = setTimeout(() => {
					try { proc.kill(); } catch { /* already exited */ }
				}, options.timeout + 2_000);
			}
		} catch (error) {
			settle(createExecResult(error instanceof Error ? error : new Error(String(error)), '', ''));
		}
	});
}

function execWindowsBatchFile(
	childProcess: any,
	command: string,
	args: string[],
	options: { cwd?: string; timeout?: number; env?: Record<string, string> } | undefined,
): Promise<ExecResult> {
	const cmdExe = process.env.ComSpec || 'cmd.exe';
	const commandLine = [
		'call',
		quoteCmdArgument(command),
		...args.map(quoteCmdArgument),
	].join(' ');
	return execFileOnce(childProcess, cmdExe, ['/d', '/s', '/c', commandLine], options, {
		windowsVerbatimArguments: true,
	});
}

function createExecResult(error: Error | null, stdout: string | Buffer, stderr: string | Buffer): ExecResult {
	const stdoutStr = typeof stdout === 'string' ? stdout : stdout?.toString?.('utf8') ?? '';
	const stderrStr = typeof stderr === 'string' ? stderr : stderr?.toString?.('utf8') ?? '';
	return {
		exitCode: error ? normalizeExecErrorCode(error) : 0,
		stdout: stdoutStr,
		stderr: stderrStr,
		error: error ?? undefined,
	};
}

function normalizeExecErrorCode(error: Error): number {
	const code = (error as any).code;
	return typeof code === 'number' ? code : 1;
}

function shouldRetryWithWindowsCommandResolution(error: Error | undefined): boolean {
	if (!error) {
		return false;
	}

	const code = String((error as any).code ?? '').toUpperCase();
	const message = String(error.message ?? '').toUpperCase();
	return code === 'EINVAL'
		|| code === 'ENOENT'
		|| message.includes('SPAWN EINVAL')
		|| message.includes('SPAWN ENOENT');
}

function resolveWindowsCommand(
	command: string,
	options: { cwd?: string; env?: Record<string, string> } | undefined,
): string | null {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs || !path || typeof command !== 'string' || command.trim().length === 0) {
		return null;
	}

	const env = { ...process.env, ...options?.env };
	const cwd = options?.cwd ?? process.cwd();
	const pathValue = env.Path ?? env.PATH ?? '';
	const pathEntries = String(pathValue).split(path.delimiter).filter(Boolean);
	const pathExts = String(env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
	const candidates = path.extname(command)
		? [command]
		: pathExts.map((extension: string) => `${command}${extension}`);

	if (/[\\/]/.test(command)) {
		for (const candidate of candidates) {
			const absoluteCandidate = path.resolve(cwd, candidate);
			if (fs.existsSync(absoluteCandidate)) {
				return absoluteCandidate;
			}
		}
		return null;
	}

	for (const entry of [cwd, ...pathEntries]) {
		for (const candidate of candidates) {
			const absoluteCandidate = path.join(entry, candidate);
			if (fs.existsSync(absoluteCandidate)) {
				return absoluteCandidate;
			}
		}
	}

	return null;
}

function isWindowsBatchFile(command: string): boolean {
	return /\.(cmd|bat)$/i.test(command);
}

function isWindowsNodeScript(command: string): boolean {
	return /\.(mjs|cjs|js)$/i.test(command);
}

function quoteCmdArgument(value: string): string {
	const source = String(value);
	let quoted = '"';
	let backslashCount = 0;

	for (const char of source) {
		if (char === '\\') {
			backslashCount += 1;
			continue;
		}

		if (char === '"') {
			quoted += '\\'.repeat(backslashCount * 2 + 1);
			quoted += '"';
			backslashCount = 0;
			continue;
		}

		quoted += '\\'.repeat(backslashCount);
		quoted += char;
		backslashCount = 0;
	}

	quoted += '\\'.repeat(backslashCount * 2);
	quoted += '"';
	return quoted;
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
