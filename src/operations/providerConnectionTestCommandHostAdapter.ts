import { formatI18n } from '../i18n';
import { testAPI } from '../llmUtils';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from '../types';

export interface ProviderConnectionTestNoticeHandle {
    hide?: () => void;
}

export interface ProviderConnectionTestCommandUiStrings {
    settings: {
        providerConfig: {
            testConnectionRunning: string;
            testConnectionSuccess: string;
            testConnectionFailed: string;
            testConnectionError: string;
        };
    };
    errorModal: {
        titles: {
            llmConnectionTest: string;
        };
    };
}

export interface ProviderConnectionTestCommandHost {
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getUiStrings: () => ProviderConnectionTestCommandUiStrings;
    showNotice: (message: string, duration?: number) => ProviderConnectionTestNoticeHandle | void;
    logError: (message: string, details: string) => void;
    openErrorModal?: (title: string, details: string) => void;
    saveErrorLog?: (error: unknown, reporter: ProgressReporter) => Promise<void>;
}

export type ProviderConnectionTestCommandResult =
    | {
        kind: 'success' | 'failure';
        statusMessage: string;
        provider: LLMProviderConfig;
        result: Awaited<ReturnType<typeof testAPI>>;
    }
    | {
        kind: 'error';
        statusMessage: string;
        errorMessage: string;
        errorDetails: string;
    };

function resolveActiveProvider(settings: NotemdSettings): LLMProviderConfig {
    const provider = settings.providers.find(candidate => candidate.name === settings.activeProvider);
    if (!provider) {
        throw new Error('No active provider configured');
    }

    return provider;
}

function normalizeError(error: unknown): { errorMessage: string; errorDetails: string } {
    if (error instanceof Error) {
        return {
            errorMessage: error.message,
            errorDetails: error.stack || error.message
        };
    }

    return {
        errorMessage: 'An unknown error occurred during connection test.',
        errorDetails: String(error)
    };
}

export async function runProviderConnectionTestWithHost(
    host: ProviderConnectionTestCommandHost,
    reporter: ProgressReporter,
    testApiImpl: typeof testAPI = testAPI
): Promise<ProviderConnectionTestCommandResult> {
    await host.loadSettings();
    const settings = host.getSettings();
    const providerI18n = host.getUiStrings().settings.providerConfig;
    let testingNotice: ProviderConnectionTestNoticeHandle | void = undefined;

    try {
        const provider = resolveActiveProvider(settings);
        const runningStatus = formatI18n(providerI18n.testConnectionRunning, { provider: provider.name });
        reporter.log(runningStatus);
        reporter.updateStatus(runningStatus, 50);
        testingNotice = host.showNotice(runningStatus, 0);
        const result = await testApiImpl(provider, settings.enableApiErrorDebugMode);
        testingNotice?.hide?.();

        if (result.success) {
            const successStatus = formatI18n(providerI18n.testConnectionSuccess, { message: result.message });
            reporter.log(successStatus);
            host.showNotice(successStatus, 5000);
            reporter.updateStatus(successStatus, 100);
            return {
                kind: 'success',
                statusMessage: successStatus,
                provider,
                result
            };
        }

        const failedStatus = formatI18n(providerI18n.testConnectionFailed, { message: result.message });
        reporter.log(failedStatus);
        host.showNotice(failedStatus, 10000);
        reporter.updateStatus(failedStatus, -1);
        return {
            kind: 'failure',
            statusMessage: failedStatus,
            provider,
            result
        };
    } catch (error: unknown) {
        testingNotice?.hide?.();
        const { errorMessage, errorDetails } = normalizeError(error);
        const uiStrings = host.getUiStrings();
        reporter.log(`❌ ${errorMessage}`);
        const errorStatus = formatI18n(providerI18n.testConnectionError, { message: errorMessage });
        host.showNotice(errorStatus, 10000);
        host.logError('LLM Connection Test Error:', errorDetails);
        reporter.updateStatus(errorStatus, -1);
        host.openErrorModal?.(uiStrings.errorModal.titles.llmConnectionTest, errorDetails);
        await host.saveErrorLog?.(error, reporter);
        return {
            kind: 'error',
            statusMessage: errorStatus,
            errorMessage,
            errorDetails
        };
    }
}

export async function runTestLlmConnectionCommandWithHost(
    host: ProviderConnectionTestCommandHost,
    reporter: ProgressReporter,
    testApiImpl: typeof testAPI = testAPI
): Promise<ProviderConnectionTestCommandResult> {
    return runProviderConnectionTestWithHost(host, reporter, testApiImpl);
}
