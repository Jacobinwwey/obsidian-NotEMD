import { autoInstallPlaywright } from '../slideExport/slidevExporter';
import { probePlaywright } from '../slideExport/environmentProber';
import * as platform from '../slideExport/platformUtils';
import * as path from 'path';

jest.mock('../slideExport/platformUtils');
const exec = jest.mocked(platform.execFileAsync);
const ok = { exitCode: 0, stdout: '', stderr: '' };

beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(platform.isDesktopApp).mockReturnValue(true);
	jest.mocked(platform.resolveNpmCommand).mockReturnValue('npm.cmd');
	exec.mockResolvedValue({ ...ok, stdout: 'E:/vault/node_modules/playwright-chromium/cli.js' });
});

test('installs the vault-resolved Chromium CLI and verifies launch before reporting success', async () => {
	const progress = jest.fn();
	await autoInstallPlaywright(progress, 'E:/vault');
	expect(exec).toHaveBeenCalledWith('node', expect.arrayContaining(['install', 'chromium']), expect.objectContaining({ cwd: 'E:/vault' }));
	expect(exec.mock.calls.some(([, args]) => args.some(arg => arg.includes('chromium.launch')))).toBe(true);
});

test('a successful download with a failed browser launch is an installation failure', async () => {
	exec.mockImplementation(async (_command, args) => args.some(arg => arg.includes('chromium.launch'))
		? { exitCode: 1, stdout: '', stderr: 'browser cannot launch' } : { ...ok, stdout: 'E:/vault/node_modules/playwright-chromium/cli.js' });
	const progress = jest.fn();
	const result = await autoInstallPlaywright(progress, 'E:/vault');
	expect(result.exitCode).not.toBe(0);
	expect(progress).not.toHaveBeenCalledWith('install-playwright', 'Playwright Chromium installed');
});

test('probe uses vault cwd and tests headless launch rather than executable existence alone', async () => {
	await probePlaywright(['E:/vault']);
	expect(exec).toHaveBeenCalledWith('node', expect.arrayContaining([expect.stringContaining('chromium.launch')]), expect.objectContaining({ cwd: 'E:/vault' }));
});

test('probe retains process errors when a failed launch emits no output', async () => {
	exec.mockResolvedValue({ exitCode: -1, stdout: '', stderr: '', error: new Error('spawn node ETIMEDOUT') });
	const report = await probePlaywright(['E:/vault']);
	expect(report.installed).toBe(false);
	expect(report.error).toContain('spawn node ETIMEDOUT');
});

test('cold browser probes allow module loading and cleanup outside the launch budget', async () => {
	await probePlaywright(['E:/vault']);
	expect(exec).toHaveBeenCalledWith('node', expect.arrayContaining([expect.stringContaining('timeout: 30000')]), expect.objectContaining({ timeout: 60000 }));
});

test('terminated probes report the process limit without dumping the evaluation script', async () => {
	exec.mockResolvedValue({ exitCode: -1, stdout: '', stderr: '', error: Object.assign(new Error('Command failed: node -e internal script'), { killed: true }) });
	const report = await probePlaywright(['E:/vault']);
	expect(report.error).toContain('60000 ms');
	expect(report.error).not.toContain('internal script');
});

test('installs a missing package into the vault before downloading its browser revision', async () => {
	exec.mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'module missing' });
	await autoInstallPlaywright(undefined, 'E:/vault');
	expect(exec).toHaveBeenCalledWith('npm.cmd', ['install', '-D', 'playwright-chromium'], expect.objectContaining({
		cwd: 'E:/vault', env: { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' },
	}));
	expect(exec.mock.calls.findIndex(([command]) => command === 'npm.cmd')).toBeLessThan(
		exec.mock.calls.findIndex(([, args]) => args.includes('chromium')),
	);
});

test('failed package installation stops without reporting success', async () => {
	exec.mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'module missing' });
	exec.mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'npm failed' });
	const result = await autoInstallPlaywright(undefined, 'E:/vault');
	expect(result.stderr).toBe('npm failed');
	expect(exec).toHaveBeenCalledTimes(2);
});

test('external Slidev runtime is a fallback after the vault, without unrelated cwd packages', async () => {
	jest.mocked(platform.safeRequire).mockImplementation(name => name === 'path' ? path : null);
	jest.mocked(platform.resolveSlidevCommand).mockReturnValue({ command: 'E:/slidev/bin/slidev.mjs', argsPrefix: [], source: 'configured-path', description: 'external' });
	await probePlaywright(['E:/vault']);
	const args = exec.mock.calls[0][1];
	expect(args.slice(2)).toEqual(['E:/vault', path.dirname('E:/slidev/bin/slidev.mjs')]);
});

test.each(['0', 'E:/not-created/browser-cache'])('honors explicit browser cache %s before existing home caches', value => {
	const original = process.env.PLAYWRIGHT_BROWSERS_PATH;
	process.env.PLAYWRIGHT_BROWSERS_PATH = value;
	try {
		const actual = jest.requireActual<typeof platform>('../slideExport/platformUtils');
		expect(actual.resolvePlaywrightBrowsersPath()).toBe(value);
	} finally {
		if (original === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
		else process.env.PLAYWRIGHT_BROWSERS_PATH = original;
	}
});
