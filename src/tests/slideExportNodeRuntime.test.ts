import { execFile } from 'child_process';
import { execFileAsync } from '../slideExport/platformUtils';

jest.mock('obsidian', () => ({ Platform: { isDesktopApp: true } }));
jest.mock('os', () => ({ platform: () => 'win32' }));
jest.mock('child_process', () => ({ execFile: jest.fn((_command, _args, _options, callback) => { callback(null, 'ready', ''); return { kill: jest.fn() }; }) }));

test('Windows Slidev scripts use the probed Node executable rather than the Electron host', async () => {
    const result = await execFileAsync('E:/Vault with spaces/slidev.mjs', ['build', '中文.md']);
    expect(result.exitCode).toBe(0);
    expect(execFile).toHaveBeenCalledWith('node', ['E:/Vault with spaces/slidev.mjs', 'build', '中文.md'], expect.objectContaining({ shell: false, windowsHide: true }), expect.any(Function));
});
