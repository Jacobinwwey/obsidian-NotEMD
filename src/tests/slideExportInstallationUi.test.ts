import { NotemdSidebarView } from '../ui/NotemdSidebarView';
import { autoInstallPlaywright, getVaultBasePath, probeEnvironment } from '../slideExport';

jest.mock('../slideExport', () => ({
	autoInstallPlaywright: jest.fn(),
	getVaultBasePath: jest.fn(),
	probeEnvironment: jest.fn(),
}));

test.each([true, false])('sidebar reports installation success only when refreshed tool is usable: %s', async installed => {
	jest.clearAllMocks();
	const sidebar = Object.create(NotemdSidebarView.prototype) as any;
	const reporter = { log: jest.fn() };
	Object.assign(sidebar, {
		app: {}, isProcessing: false, plugin: { getIsBusy: () => false },
		getStrings: () => ({
			common: { unknownError: 'Unknown error' },
			slideExport: { installingTool: 'Installing {tool}', installComplete: 'Installed', installFailed: 'Failed: {message}', environmentCheckComplete: 'Checked' },
		}),
		startProcessing: jest.fn(), createReporterProxy: () => reporter,
		renderSlideExportEnvironmentReport: jest.fn(), logSlideExportEnvironmentSummary: jest.fn(),
		updateStatus: jest.fn(), finishProcessing: jest.fn(),
	});
	jest.mocked(getVaultBasePath).mockReturnValue('E:/vault');
	jest.mocked(autoInstallPlaywright).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
	jest.mocked(probeEnvironment).mockResolvedValue({ playwright: { installed, error: 'browser unavailable' } } as any);
	await sidebar.installSlideExportTool('playwright');
	expect(autoInstallPlaywright).toHaveBeenCalledWith(expect.any(Function), 'E:/vault');
	expect(reporter.log.mock.calls.some(([message]) => message === 'Installed')).toBe(installed);
	expect(sidebar.updateStatus).toHaveBeenLastCalledWith(installed ? 'Checked' : 'Failed: browser unavailable', installed ? 100 : -1);
	expect(sidebar.finishProcessing).toHaveBeenCalledTimes(1);
});
