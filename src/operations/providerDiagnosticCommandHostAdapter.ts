import { formatI18n } from '../i18n';
import { NotemdSettings } from '../types';
import {
    executeProviderDiagnosticCommand,
    executeProviderDiagnosticStabilityCommand,
    ExecuteProviderDiagnosticCommandResult,
    ExecuteProviderDiagnosticStabilityCommandResult,
    MissingActiveProviderError
} from './providerDiagnosticCommand';
import {
    persistProviderDiagnosticReport,
    ProviderDiagnosticReportHost
} from './providerDiagnosticReportPersistence';

export interface ProviderDiagnosticHostNotice {
    message: string;
    duration: number;
}

export interface ProviderDiagnosticCommandUiStrings {
    notices: {
        noActiveProviderConfigured: string;
    };
    settings: {
        developer: {
            diagnosticSuccess: string;
            diagnosticCapturedFailure: string;
            stabilityFinished: string;
        };
    };
}

export interface ProviderDiagnosticCommandHost {
    loadSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getUiStrings: () => ProviderDiagnosticCommandUiStrings;
    sanitizeTimeoutMs: (rawValue: number) => number;
    sanitizeRuns: (rawValue: number) => number;
    reportHost: ProviderDiagnosticReportHost;
    now?: () => Date;
}

export type ProviderDiagnosticCommandHostResult =
    | {
        kind: 'success' | 'captured-failure';
        notice: ProviderDiagnosticHostNotice;
        execution: ExecuteProviderDiagnosticCommandResult;
    }
    | {
        kind: 'missing-provider';
        notice: ProviderDiagnosticHostNotice;
    };

export type ProviderDiagnosticStabilityCommandHostResult =
    | {
        kind: 'finished';
        notice: ProviderDiagnosticHostNotice;
        execution: ExecuteProviderDiagnosticStabilityCommandResult;
    }
    | {
        kind: 'missing-provider';
        notice: ProviderDiagnosticHostNotice;
    };

function createMissingProviderNotice(uiStrings: ProviderDiagnosticCommandUiStrings): ProviderDiagnosticHostNotice {
    return {
        message: uiStrings.notices.noActiveProviderConfigured,
        duration: 8000
    };
}

function createDiagnosticSaveReport(
    host: ProviderDiagnosticCommandHost
): (providerName: string, reportContent: string) => Promise<string> {
    return (providerName: string, reportContent: string) => persistProviderDiagnosticReport({
        providerName,
        reportContent,
        host: host.reportHost,
        now: host.now?.()
    });
}

export async function runProviderDiagnosticCommandWithHost(
    host: ProviderDiagnosticCommandHost,
    executeCommandImpl: typeof executeProviderDiagnosticCommand = executeProviderDiagnosticCommand
): Promise<ProviderDiagnosticCommandHostResult> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();

    try {
        const execution = await executeCommandImpl({
            settings: host.getSettings(),
            sanitizeTimeoutMs: host.sanitizeTimeoutMs,
            sanitizeRuns: host.sanitizeRuns,
            saveReport: createDiagnosticSaveReport(host)
        });

        if (execution.result.success) {
            return {
                kind: 'success',
                notice: {
                    message: formatI18n(uiStrings.settings.developer.diagnosticSuccess, {
                        callMode: execution.result.callMode,
                        path: execution.reportPath
                    }),
                    duration: 8000
                },
                execution
            };
        }

        return {
            kind: 'captured-failure',
            notice: {
                message: formatI18n(uiStrings.settings.developer.diagnosticCapturedFailure, {
                    callMode: execution.result.callMode,
                    path: execution.reportPath
                }),
                duration: 12000
            },
            execution
        };
    } catch (error: unknown) {
        if (error instanceof MissingActiveProviderError) {
            return {
                kind: 'missing-provider',
                notice: createMissingProviderNotice(uiStrings)
            };
        }

        throw error;
    }
}

export async function runProviderDiagnosticStabilityCommandWithHost(
    host: ProviderDiagnosticCommandHost,
    executeCommandImpl: typeof executeProviderDiagnosticStabilityCommand = executeProviderDiagnosticStabilityCommand
): Promise<ProviderDiagnosticStabilityCommandHostResult> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();

    try {
        const execution = await executeCommandImpl({
            settings: host.getSettings(),
            sanitizeTimeoutMs: host.sanitizeTimeoutMs,
            sanitizeRuns: host.sanitizeRuns,
            saveReport: createDiagnosticSaveReport(host)
        });

        return {
            kind: 'finished',
            notice: {
                message: formatI18n(uiStrings.settings.developer.stabilityFinished, {
                    callMode: execution.result.callMode,
                    successCount: execution.result.successCount,
                    runs: execution.result.runs,
                    path: execution.reportPath
                }),
                duration: 12000
            },
            execution
        };
    } catch (error: unknown) {
        if (error instanceof MissingActiveProviderError) {
            return {
                kind: 'missing-provider',
                notice: createMissingProviderNotice(uiStrings)
            };
        }

        throw error;
    }
}
