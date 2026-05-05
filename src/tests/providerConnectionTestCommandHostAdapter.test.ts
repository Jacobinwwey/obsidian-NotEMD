import { STRINGS_EN } from '../i18n/locales/en';
import { mockSettings } from './__mocks__/settings';
import {
    runInteractiveProviderConnectionTestCommandWithHost,
    runProviderConnectionTestWithHost,
    runTestLlmConnectionCommandWithHost
} from '../operations/providerConnectionTestCommandHostAdapter';

function createHost() {
    const runningNotice = {
        hide: jest.fn()
    };

    return {
        runningNotice,
        host: {
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => STRINGS_EN),
            showNotice: jest.fn().mockReturnValue(runningNotice),
            logError: jest.fn(),
            openErrorModal: jest.fn(),
            saveErrorLog: jest.fn().mockResolvedValue(undefined)
        }
    };
}

function createReporter() {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        clearDisplay: jest.fn(),
        cancelled: false
    };
}

describe('provider connection test command host adapter', () => {
    test('interactive wrapper short-circuits while host is busy', async () => {
        const reporter = createReporter();
        const { host } = createHost();
        const interactiveHost = {
            ...host,
            getReporter: jest.fn(() => reporter),
            isBusy: jest.fn(() => true),
            setBusy: jest.fn(),
            getBusyNotice: jest.fn(() => 'busy now')
        };
        const testApiSpy = jest.fn();

        const result = await runInteractiveProviderConnectionTestCommandWithHost(
            interactiveHost as any,
            undefined,
            testApiSpy as any
        );

        expect(result).toBeNull();
        expect(testApiSpy).not.toHaveBeenCalled();
        expect(interactiveHost.showNotice).toHaveBeenCalledWith('busy now');
        expect(interactiveHost.setBusy).not.toHaveBeenCalled();
    });

    test('interactive wrapper uses host reporter and clears display before delegated run', async () => {
        const reporter = createReporter();
        const { host } = createHost();
        const interactiveHost = {
            ...host,
            getReporter: jest.fn(() => reporter),
            isBusy: jest.fn(() => false),
            setBusy: jest.fn(),
            getBusyNotice: jest.fn(() => 'busy now')
        };
        const testApiSpy = jest.fn().mockResolvedValue({
            success: true,
            message: 'pong'
        });

        const result = await runInteractiveProviderConnectionTestCommandWithHost(
            interactiveHost as any,
            undefined,
            testApiSpy as any
        );

        expect(interactiveHost.setBusy).toHaveBeenNthCalledWith(1, true);
        expect(reporter.clearDisplay).toHaveBeenCalledTimes(1);
        expect(testApiSpy).toHaveBeenCalledWith(mockSettings.providers[0], mockSettings.enableApiErrorDebugMode);
        expect(interactiveHost.setBusy).toHaveBeenLastCalledWith(false);
        expect(result).toMatchObject({
            kind: 'success',
            statusMessage: '✅ Success: pong'
        });
    });

    test('runs provider connection test and reports success through extracted host adapter', async () => {
        const { host, runningNotice } = createHost();
        const reporter = createReporter();
        const testApiSpy = jest.fn().mockResolvedValue({
            success: true,
            message: 'pong'
        });

        const result = await runTestLlmConnectionCommandWithHost(host as any, reporter as any, testApiSpy as any);

        expect(host.loadSettings).toHaveBeenCalled();
        expect(testApiSpy).toHaveBeenCalledWith(mockSettings.providers[0], mockSettings.enableApiErrorDebugMode);
        expect(host.showNotice).toHaveBeenNthCalledWith(1, 'Testing connection to DeepSeek...', 0);
        expect(runningNotice.hide).toHaveBeenCalled();
        expect(host.showNotice).toHaveBeenNthCalledWith(2, '✅ Success: pong', 5000);
        expect(reporter.log).toHaveBeenCalledWith('Testing connection to DeepSeek...');
        expect(reporter.log).toHaveBeenCalledWith('✅ Success: pong');
        expect(reporter.updateStatus).toHaveBeenNthCalledWith(1, 'Testing connection to DeepSeek...', 50);
        expect(reporter.updateStatus).toHaveBeenNthCalledWith(2, '✅ Success: pong', 100);
        expect(result).toMatchObject({
            kind: 'success',
            statusMessage: '✅ Success: pong'
        });
    });

    test('reports unsuccessful provider connection test through extracted host adapter', async () => {
        const { host, runningNotice } = createHost();
        const reporter = createReporter();
        const testApiSpy = jest.fn().mockResolvedValue({
            success: false,
            message: 'bad key'
        });

        const result = await runTestLlmConnectionCommandWithHost(host as any, reporter as any, testApiSpy as any);

        expect(host.showNotice).toHaveBeenNthCalledWith(2, '❌ Failed: bad key. Check console.', 10000);
        expect(runningNotice.hide).toHaveBeenCalled();
        expect(reporter.updateStatus).toHaveBeenNthCalledWith(2, '❌ Failed: bad key. Check console.', -1);
        expect(result).toMatchObject({
            kind: 'failure',
            statusMessage: '❌ Failed: bad key. Check console.'
        });
    });

    test('maps connection test errors to notice, modal, and error-log persistence', async () => {
        const { host, runningNotice } = createHost();
        const reporter = createReporter();
        const testApiSpy = jest.fn().mockRejectedValue(new Error('socket hang up'));

        const result = await runTestLlmConnectionCommandWithHost(host as any, reporter as any, testApiSpy as any);

        expect(runningNotice.hide).toHaveBeenCalled();
        expect(reporter.log).toHaveBeenCalledWith('❌ socket hang up');
        expect(host.showNotice).toHaveBeenNthCalledWith(2, 'Error during connection test: socket hang up', 10000);
        expect(host.logError).toHaveBeenCalledWith('LLM Connection Test Error:', expect.stringContaining('socket hang up'));
        expect(reporter.updateStatus).toHaveBeenNthCalledWith(2, 'Error during connection test: socket hang up', -1);
        expect(host.openErrorModal).toHaveBeenCalledWith('LLM Connection Test Error', expect.stringContaining('socket hang up'));
        expect(host.saveErrorLog).toHaveBeenCalledWith(expect.any(Error), reporter);
        expect(result).toMatchObject({
            kind: 'error',
            statusMessage: 'Error during connection test: socket hang up'
        });
    });

    test('treats missing active provider as connection-test error path for compatibility', async () => {
        const { host } = createHost();
        host.getSettings.mockReturnValue({
            ...mockSettings,
            activeProvider: 'Missing Provider'
        });
        const reporter = createReporter();
        const testApiSpy = jest.fn();

        const result = await runTestLlmConnectionCommandWithHost(host as any, reporter as any, testApiSpy as any);

        expect(testApiSpy).not.toHaveBeenCalled();
        expect(host.showNotice).toHaveBeenCalledWith('Error during connection test: No active provider configured', 10000);
        expect(result).toMatchObject({
            kind: 'error',
            statusMessage: 'Error during connection test: No active provider configured'
        });
    });

    test('supports settings-tab style reuse without modal or error-log handlers', async () => {
        const { runningNotice } = createHost();
        const reporter = createReporter();
        const host = {
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => STRINGS_EN),
            showNotice: jest.fn().mockReturnValue(runningNotice),
            logError: jest.fn()
        };
        const testApiSpy = jest.fn().mockRejectedValue(new Error('settings failure'));

        const result = await runProviderConnectionTestWithHost(host as any, reporter as any, testApiSpy as any);

        expect(host.showNotice).toHaveBeenNthCalledWith(1, 'Testing connection to DeepSeek...', 0);
        expect(host.showNotice).toHaveBeenNthCalledWith(2, 'Error during connection test: settings failure', 10000);
        expect(host.logError).toHaveBeenCalledWith('LLM Connection Test Error:', expect.stringContaining('settings failure'));
        expect(result).toMatchObject({
            kind: 'error',
            statusMessage: 'Error during connection test: settings failure'
        });
    });
});
