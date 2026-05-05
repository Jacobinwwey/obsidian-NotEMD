import { LLMProviderConfig, NotemdSettings } from '../types';
import {
    buildProviderDiagnosticOperationInput,
    ProviderDiagnosticProbeResult,
    ProviderDiagnosticStabilityProbeResult,
    runProviderDiagnosticProbe,
    runProviderDiagnosticStabilityProbe
} from '../providerDiagnostics';

export class MissingActiveProviderError extends Error {
    constructor() {
        super('No active provider configured');
        this.name = 'MissingActiveProviderError';
    }
}

export interface ExecuteProviderDiagnosticCommandParams {
    settings: NotemdSettings;
    sanitizeTimeoutMs: (rawValue: number) => number;
    sanitizeRuns: (rawValue: number) => number;
    saveReport: (providerName: string, reportContent: string) => Promise<string>;
    runProviderDiagnosticProbeImpl?: typeof runProviderDiagnosticProbe;
    runProviderDiagnosticStabilityProbeImpl?: typeof runProviderDiagnosticStabilityProbe;
}

export interface ExecuteProviderDiagnosticCommandResult {
    input: ReturnType<typeof buildProviderDiagnosticOperationInput>;
    provider: LLMProviderConfig;
    reportPath: string;
    result: ProviderDiagnosticProbeResult;
}

export interface ExecuteProviderDiagnosticStabilityCommandResult {
    input: ReturnType<typeof buildProviderDiagnosticOperationInput>;
    provider: LLMProviderConfig;
    reportPath: string;
    result: ProviderDiagnosticStabilityProbeResult;
}

function resolveActiveProvider(settings: NotemdSettings): LLMProviderConfig {
    const provider = settings.providers.find(candidate => candidate.name === settings.activeProvider);
    if (!provider) {
        throw new MissingActiveProviderError();
    }

    return provider;
}

export async function executeProviderDiagnosticCommand(
    params: ExecuteProviderDiagnosticCommandParams
): Promise<ExecuteProviderDiagnosticCommandResult> {
    const provider = resolveActiveProvider(params.settings);
    const input = buildProviderDiagnosticOperationInput(provider, params.settings);
    const timeoutMs = params.sanitizeTimeoutMs(input.timeoutMs);
    const runProbe = params.runProviderDiagnosticProbeImpl ?? runProviderDiagnosticProbe;
    const result = await runProbe(provider, params.settings, {
        callMode: input.callMode,
        timeoutMs
    });
    const reportPath = await params.saveReport(provider.name, result.report);

    return {
        input,
        provider,
        reportPath,
        result
    };
}

export async function executeProviderDiagnosticStabilityCommand(
    params: ExecuteProviderDiagnosticCommandParams
): Promise<ExecuteProviderDiagnosticStabilityCommandResult> {
    const provider = resolveActiveProvider(params.settings);
    const input = buildProviderDiagnosticOperationInput(provider, params.settings);
    const timeoutMs = params.sanitizeTimeoutMs(input.timeoutMs);
    const runs = params.sanitizeRuns(input.stabilityRuns);
    const runProbe = params.runProviderDiagnosticStabilityProbeImpl ?? runProviderDiagnosticStabilityProbe;
    const result = await runProbe(provider, params.settings, {
        callMode: input.callMode,
        timeoutMs,
        runs
    });
    const reportPath = await params.saveReport(`${provider.name}_stability`, result.report);

    return {
        input,
        provider,
        reportPath,
        result
    };
}
