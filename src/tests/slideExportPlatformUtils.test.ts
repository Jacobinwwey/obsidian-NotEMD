describe('platformUtils — command execution resolution', () => {
	afterEach(() => {
		jest.resetModules();
		jest.dontMock('obsidian');
		jest.dontMock('os');
		jest.dontMock('child_process');
	});

	async function loadPlatformUtils(osPlatform: 'win32' | 'linux' | 'darwin', execFile: jest.Mock) {
		jest.resetModules();
		jest.doMock('obsidian', () => ({
			Platform: { isDesktopApp: true },
		}));
		jest.doMock('os', () => ({
			platform: () => osPlatform,
		}));
		jest.doMock('child_process', () => ({
			execFile,
		}));
		return import('../slideExport/platformUtils');
	}

	test('uses direct execFile first on Windows instead of routing every command through cmd.exe', async () => {
		const execFile = jest.fn((_command, _args, _options, callback) => {
			callback(null, 'ok', '');
			return {};
		});
		const { execFileAsync } = await loadPlatformUtils('win32', execFile);

		const result = await execFileAsync('node', ['--version'], { timeout: 10_000 });

		expect(result.exitCode).toBe(0);
		expect(execFile).toHaveBeenCalledTimes(1);
		expect(execFile.mock.calls[0][2]).toEqual(expect.objectContaining({
			shell: false,
			windowsHide: true,
		}));
	});

	test('falls back to quoted Windows batch execution only after direct command resolution fails', async () => {
		const spawnError = Object.assign(new Error('spawn EINVAL'), { code: 'EINVAL' });
		const execFile = jest.fn((_command, _args, _options, callback) => {
			if (execFile.mock.calls.length === 1) {
				callback(spawnError, '', '');
				return {};
			}
			callback(null, '10.0.0', '');
			return {};
		});
		const { execFileAsync } = await loadPlatformUtils('win32', execFile);

		const result = await execFileAsync('npx.cmd', ['--version'], { timeout: 10_000 });

		expect(result).toEqual({ exitCode: 0, stdout: '10.0.0', stderr: '' });
		expect(execFile).toHaveBeenCalledTimes(2);
		expect(execFile.mock.calls[0][2]).toEqual(expect.objectContaining({ shell: false }));
		expect(execFile.mock.calls[1][0].toLowerCase()).toContain('cmd');
		expect(execFile.mock.calls[1][1]).toEqual(expect.arrayContaining(['/d', '/s', '/c']));
		expect(execFile.mock.calls[1][1].join(' ')).toContain('call "');
		expect(execFile.mock.calls[1][1].join(' ')).toContain('npx.cmd"');
		expect(execFile.mock.calls[1][2]).toEqual(expect.objectContaining({
			shell: false,
			windowsVerbatimArguments: true,
		}));
	});

	test('does not use shell fallback for POSIX command failures', async () => {
		const spawnError = Object.assign(new Error('spawn EINVAL'), { code: 'EINVAL' });
		const execFile = jest.fn((_command, _args, _options, callback) => {
			callback(spawnError, '', '');
			return {};
		});
		const { execFileAsync } = await loadPlatformUtils('linux', execFile);

		const result = await execFileAsync('npx', ['--version'], { timeout: 10_000 });

		expect(result.exitCode).toBe(1);
		expect(result.error).toBe(spawnError);
		expect(execFile).toHaveBeenCalledTimes(1);
		expect(execFile.mock.calls[0][2]).toEqual(expect.objectContaining({ shell: false }));
	});
});
