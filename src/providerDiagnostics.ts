import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import {
    callLLM,
    callOpenAICompatibleDiagnosticWithMode,
    getDebugInfo,
    OpenAICompatibleDiagnosticCallMode
} from './llmUtils';
import { getLLMProviderDefinition } from './llmProviders';

export const DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_RESPONSE_PREVIEW_CHARS = 8000;
export const DEFAULT_PROVIDER_DIAGNOSTIC_CALL_MODE: ProviderDiagnosticCallMode = 'runtime-stable';
export const DEFAULT_PROVIDER_DIAGNOSTIC_STABILITY_RUNS = 3;
export const MAX_PROVIDER_DIAGNOSTIC_STABILITY_RUNS = 10;

type CallLLMFn = typeof callLLM;
type OpenAICompatibleDiagnosticFn = typeof callOpenAICompatibleDiagnosticWithMode;

export type ProviderDiagnosticCallMode =
    | 'runtime-stable'
    | 'runtime-requesturl-first'
    | 'openai-direct-stream'
    | 'openai-direct-buffered'
    | 'openai-requesturl-only';

export interface ProviderDiagnosticCallModeOption {
    value: ProviderDiagnosticCallMode;
    label: string;
    description: string;
    openaiCompatibleOnly: boolean;
}

const PROVIDER_DIAGNOSTIC_CALL_MODE_OPTIONS: ProviderDiagnosticCallModeOption[] = [
    {
        value: 'runtime-stable',
        label: 'Runtime stable (auto)',
        description: 'Use the plugin stable runtime path (stream -> non-stream -> requestUrl fallback).',
        openaiCompatibleOnly: false
    },
    {
        value: 'runtime-requesturl-first',
        label: 'Runtime requestUrl-first',
        description: 'Use requestUrl-first runtime behavior before streamed fallback parsing.',
        openaiCompatibleOnly: false
    },
    {
        value: 'openai-direct-stream',
        label: 'OpenAI direct streaming',
        description: 'Force direct desktop/web streaming transport without requestUrl.',
        openaiCompatibleOnly: true
    },
    {
        value: 'openai-direct-buffered',
        label: 'OpenAI direct buffered',
        description: 'Force direct desktop/web buffered transport without requestUrl.',
        openaiCompatibleOnly: true
    },
    {
        value: 'openai-requesturl-only',
        label: 'OpenAI requestUrl-only',
        description: 'Force requestUrl-only call path with no direct-transport fallback.',
        openaiCompatibleOnly: true
    }
];

export interface ProviderDiagnosticProbeOptions {
    timeoutMs?: number;
    prompt?: string;
    content?: string;
    now?: Date;
    callMode?: ProviderDiagnosticCallMode;
    callLLMImpl?: CallLLMFn;
    callOpenAICompatibleDiagnosticImpl?: OpenAICompatibleDiagnosticFn;
}

export interface ProviderDiagnosticOperationInput {
    providerName: string;
    model: string;
    callMode: ProviderDiagnosticCallMode;
    timeoutMs: number;
    stabilityRuns: number;
}

export interface ProviderDiagnosticProbeResult {
    success: boolean;
    elapsedMs: number;
    callMode: ProviderDiagnosticCallMode;
    requestedCallMode: ProviderDiagnosticCallMode;
    responseText?: string;
    errorMessage?: string;
    debugInfo?: string;
    logs: string[];
    report: string;
}

export interface ProviderDiagnosticStabilityProbeOptions extends ProviderDiagnosticProbeOptions {
    runs?: number;
}

export interface ProviderDiagnosticStabilityProbeResult {
    runs: number;
    callMode: ProviderDiagnosticCallMode;
    requestedCallMode: ProviderDiagnosticCallMode;
    successCount: number;
    failureCount: number;
    totalElapsedMs: number;
    runResults: ProviderDiagnosticProbeResult[];
    report: string;
}

function redactApiKey(apiKey: string): string {
    if (!apiKey) {
        return '(empty)';
    }

    if (apiKey.length <= 6) {
        return '[REDACTED]';
    }

    return `${apiKey.slice(0, 3)}...${apiKey.slice(-3)} (redacted)`;
}

function normalizeMultiline(input: string): string {
    return input.replace(/\r\n/g, '\n');
}

function clipPreview(input: string, maxChars: number = MAX_RESPONSE_PREVIEW_CHARS): string {
    if (input.length <= maxChars) {
        return input;
    }

    const omittedCount = input.length - maxChars;
    return `${input.slice(0, maxChars)}\n\n...[${omittedCount} chars omitted]`;
}

function isOpenAICompatibleOnlyMode(mode: ProviderDiagnosticCallMode): boolean {
    return mode === 'openai-direct-stream'
        || mode === 'openai-direct-buffered'
        || mode === 'openai-requesturl-only';
}

function getProviderTransport(provider: LLMProviderConfig): string {
    return getLLMProviderDefinition(provider.name)?.transport ?? 'openai-compatible';
}

function resolveProviderDiagnosticCallMode(
    provider: LLMProviderConfig,
    requestedMode: ProviderDiagnosticCallMode
): ProviderDiagnosticCallMode {
    const transport = getProviderTransport(provider);
    if (isOpenAICompatibleOnlyMode(requestedMode) && transport !== 'openai-compatible') {
        return DEFAULT_PROVIDER_DIAGNOSTIC_CALL_MODE;
    }
    return requestedMode;
}

function normalizeStabilityRuns(input: number | undefined): number {
    const numeric = Number.isFinite(input) ? Math.floor(input as number) : DEFAULT_PROVIDER_DIAGNOSTIC_STABILITY_RUNS;
    if (numeric < 1) {
        return 1;
    }
    return Math.min(numeric, MAX_PROVIDER_DIAGNOSTIC_STABILITY_RUNS);
}

export function getProviderDiagnosticCallModeOptions(provider: LLMProviderConfig): ProviderDiagnosticCallModeOption[] {
    const transport = getProviderTransport(provider);
    if (transport === 'openai-compatible') {
        return PROVIDER_DIAGNOSTIC_CALL_MODE_OPTIONS.map(option => ({ ...option }));
    }

    return PROVIDER_DIAGNOSTIC_CALL_MODE_OPTIONS
        .filter(option => !option.openaiCompatibleOnly)
        .map(option => ({ ...option }));
}

export function buildDefaultProviderDiagnosticPayload(providerName: string): { prompt: string; content: string } {
    const prompt = 'You are a diagnostic assistant. Return plain markdown text only. Do not use code fences.';
    const contentBlock = 'Please produce a long, structured diagnostic response with: summary, numbered findings, risk notes, and a final checklist. Expand each section with details and keep the total response length large.';
    const repeated = Array.from({ length: 18 }, (_, idx) => `Input block ${idx + 1}: ${contentBlock}`).join('\n\n');

    return {
        prompt,
        content: `Provider diagnostic target: ${providerName}\n\n${repeated}`
    };
}

export function buildProviderDiagnosticFileName(providerName: string, now: Date): string {
    const safeProviderName = providerName
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') || 'provider';

    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `Notemd_Provider_Diagnostic_${safeProviderName}_${timestamp}.txt`;
}

export function buildProviderDiagnosticOperationInput(
    provider: LLMProviderConfig,
    settings: NotemdSettings
): ProviderDiagnosticOperationInput {
    return {
        providerName: provider.name,
        model: provider.model,
        callMode: (settings.developerDiagnosticCallMode as ProviderDiagnosticCallMode) || DEFAULT_PROVIDER_DIAGNOSTIC_CALL_MODE,
        timeoutMs: settings.developerDiagnosticTimeoutMs ?? DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS,
        stabilityRuns: settings.developerDiagnosticStabilityRuns ?? DEFAULT_PROVIDER_DIAGNOSTIC_STABILITY_RUNS
    };
}

function createInMemoryProgressReporter(logs: string[]): ProgressReporter {
    let cancelled = false;

    const reporter: ProgressReporter = {
        log(message: string) {
            logs.push(`[${new Date().toISOString()}] ${message}`);
        },
        updateStatus(_text: string, _percent?: number): void {
            // No-op for settings diagnostics; only log timeline is required.
        },
        requestCancel(): void {
            cancelled = true;
            if (reporter.abortController) {
                reporter.abortController.abort();
            }
        },
        clearDisplay(): void {
            // No-op for in-memory reporter.
        },
        get cancelled(): boolean {
            return cancelled;
        },
        abortController: null,
        activeTasks: 0,
        updateActiveTasks(delta: number): void {
            reporter.activeTasks += delta;
        },
        getLogs(): string {
            return logs.join('\n');
        }
    };

    return reporter;
}

function buildProviderDiagnosticReport(params: {
    provider: LLMProviderConfig;
    settings: NotemdSettings;
    startedAt: Date;
    timeoutMs: number;
    callMode: ProviderDiagnosticCallMode;
    requestedCallMode: ProviderDiagnosticCallMode;
    success: boolean;
    elapsedMs: number;
    logs: string[];
    responseText?: string;
    errorMessage?: string;
    debugInfo?: string;
}): string {
    const {
        provider,
        settings,
        startedAt,
        timeoutMs,
        callMode,
        requestedCallMode,
        success,
        elapsedMs,
        logs,
        responseText,
        errorMessage,
        debugInfo
    } = params;

    const sections: string[] = [
        `Notemd Provider Diagnostic Report`,
        `Generated At: ${startedAt.toISOString()}`,
        '',
        '=== Provider Context ===',
        `Provider: ${provider.name}`,
        `Base URL: ${provider.baseUrl}`,
        `Model: ${provider.model}`,
        `Temperature: ${provider.temperature}`,
        `Top-p: ${provider.topP ?? '(default)'}`,
        `Reasoning Effort: ${provider.reasoningEffort || '(default)'}`,
        `DeepSeek Thinking Enabled: ${provider.thinkingEnabled === true ? 'yes' : 'no'}`,
        `Provider Max Output Tokens: ${provider.maxOutputTokens ?? '(global setting)'}`,
        `API Key: ${redactApiKey(provider.apiKey)}`,
        '',
        '=== Runtime Settings ===',
        `Stable API Calls: ${settings.enableStableApiCall ? 'enabled' : 'disabled'}`,
        `Retry Interval Seconds: ${settings.apiCallInterval}`,
        `Max Retries: ${settings.apiCallMaxRetries}`,
        `API Debug Mode (forced in diagnostic run): enabled`,
        `Requested Call Mode: ${requestedCallMode}`,
        `Effective Call Mode: ${callMode}`,
        `Timeout: ${timeoutMs}ms`,
        '',
        '=== Result ===',
        `Result: ${success ? 'SUCCESS' : 'FAILED'}`,
        `Elapsed: ${elapsedMs}ms`
    ];

    if (errorMessage) {
        sections.push(`Error: ${errorMessage}`);
    }

    if (debugInfo) {
        sections.push('', '=== Debug Details ===', normalizeMultiline(debugInfo));
    }

    if (responseText && responseText.trim()) {
        sections.push('', '=== Response Preview ===', clipPreview(normalizeMultiline(responseText)));
    }

    sections.push('', '=== Runtime Logs ===');
    if (logs.length > 0) {
        sections.push(logs.join('\n'));
    } else {
        sections.push('(no logs captured)');
    }

    return sections.join('\n');
}

export async function runProviderDiagnosticProbe(
    provider: LLMProviderConfig,
    settings: NotemdSettings,
    options: ProviderDiagnosticProbeOptions = {}
): Promise<ProviderDiagnosticProbeResult> {
    const callLLMImpl = options.callLLMImpl ?? callLLM;
    const callOpenAICompatibleDiagnosticImpl = options.callOpenAICompatibleDiagnosticImpl ?? callOpenAICompatibleDiagnosticWithMode;
    const payload = options.prompt && options.content
        ? { prompt: options.prompt, content: options.content }
        : buildDefaultProviderDiagnosticPayload(provider.name);
    const timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS;
    const requestedCallMode = options.callMode ?? DEFAULT_PROVIDER_DIAGNOSTIC_CALL_MODE;
    const callMode = resolveProviderDiagnosticCallMode(provider, requestedCallMode);
    const runtimeStartedAtMs = Date.now();
    const startedAt = options.now ?? new Date(runtimeStartedAtMs);
    const providerTransport = getProviderTransport(provider);

    const logs: string[] = [];
    const reporter = createInMemoryProgressReporter(logs);

    const forceStable = callMode !== 'runtime-requesturl-first';
    const runtimeSettings: NotemdSettings = {
        ...settings,
        enableApiErrorDebugMode: true,
        enableStableApiCall: forceStable
    };

    reporter.log(`Developer diagnostic started for ${provider.name}.`);
    reporter.log(`Using model '${provider.model}' at '${provider.baseUrl}'.`);
    reporter.log(`Requested call mode: ${requestedCallMode}. Effective call mode: ${callMode}.`);
    reporter.log(`Resolved provider transport: ${providerTransport}.`);
    reporter.log(`Timeout configured to ${timeoutMs}ms.`);

    if (requestedCallMode !== callMode && isOpenAICompatibleOnlyMode(requestedCallMode)) {
        reporter.log(
            `Call mode '${requestedCallMode}' is only supported for OpenAI-compatible providers. Falling back to '${callMode}'.`
        );
    }

    const controller = new AbortController();
    reporter.abortController = controller;

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let success = false;
    let responseText: string | undefined;
    let errorMessage: string | undefined;
    let debugInfo: string | undefined;

    try {
        timeoutHandle = setTimeout(() => {
            reporter.log(`Diagnostic timeout reached (${timeoutMs}ms). Aborting request.`);
            controller.abort();
        }, timeoutMs);

        if (isOpenAICompatibleOnlyMode(callMode)) {
            responseText = await callOpenAICompatibleDiagnosticImpl(
                provider,
                provider.model,
                payload.prompt,
                payload.content,
                reporter,
                runtimeSettings,
                callMode as OpenAICompatibleDiagnosticCallMode,
                controller.signal
            );
        } else {
            responseText = await callLLMImpl(
                provider,
                payload.prompt,
                payload.content,
                runtimeSettings,
                reporter,
                provider.model,
                controller.signal
            );
        }

        success = true;
        reporter.log(`Diagnostic completed successfully. Response length: ${responseText.length} chars.`);
    } catch (error: unknown) {
        errorMessage = error instanceof Error ? error.message : String(error);
        debugInfo = getDebugInfo(error as any);
        reporter.log(`Diagnostic failed: ${errorMessage}`);
        if (debugInfo) {
            reporter.log(`Diagnostic debug details:\n${debugInfo}`);
        }
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
        reporter.abortController = null;
    }

    const elapsedMs = Date.now() - runtimeStartedAtMs;
    const report = buildProviderDiagnosticReport({
        provider,
        settings: runtimeSettings,
        startedAt,
        timeoutMs,
        callMode,
        requestedCallMode,
        success,
        elapsedMs,
        logs,
        responseText,
        errorMessage,
        debugInfo
    });

    return {
        success,
        elapsedMs,
        callMode,
        requestedCallMode,
        responseText,
        errorMessage,
        debugInfo,
        logs,
        report
    };
}

function buildProviderDiagnosticStabilityReport(params: {
    provider: LLMProviderConfig;
    requestedCallMode: ProviderDiagnosticCallMode;
    callMode: ProviderDiagnosticCallMode;
    runs: number;
    successCount: number;
    failureCount: number;
    totalElapsedMs: number;
    runResults: ProviderDiagnosticProbeResult[];
}): string {
    const {
        provider,
        requestedCallMode,
        callMode,
        runs,
        successCount,
        failureCount,
        totalElapsedMs,
        runResults
    } = params;

    const lines: string[] = [
        'Notemd Provider Diagnostic Stability Report',
        `Generated At: ${new Date().toISOString()}`,
        '',
        '=== Provider Context ===',
        `Provider: ${provider.name}`,
        `Base URL: ${provider.baseUrl}`,
        `Model: ${provider.model}`,
        `Requested Call Mode: ${requestedCallMode}`,
        `Effective Call Mode: ${callMode}`,
        '',
        '=== Summary ===',
        `Runs: ${runs}`,
        `Success: ${successCount}`,
        `Failed: ${failureCount}`,
        `Total Elapsed: ${totalElapsedMs}ms`,
        `Average Elapsed: ${runs > 0 ? Math.round(totalElapsedMs / runs) : 0}ms`,
        ''
    ];

    runResults.forEach((run, index) => {
        lines.push(`=== Run ${index + 1} ===`);
        lines.push(`Result: ${run.success ? 'SUCCESS' : 'FAILED'}`);
        lines.push(`Elapsed: ${run.elapsedMs}ms`);
        if (run.errorMessage) {
            lines.push(`Error: ${run.errorMessage}`);
        }
        if (run.debugInfo) {
            lines.push('Debug:');
            lines.push(normalizeMultiline(run.debugInfo));
        }
        lines.push('');
    });

    return lines.join('\n');
}

export async function runProviderDiagnosticStabilityProbe(
    provider: LLMProviderConfig,
    settings: NotemdSettings,
    options: ProviderDiagnosticStabilityProbeOptions = {}
): Promise<ProviderDiagnosticStabilityProbeResult> {
    const runs = normalizeStabilityRuns(options.runs);
    const requestedCallMode = options.callMode ?? DEFAULT_PROVIDER_DIAGNOSTIC_CALL_MODE;
    const callMode = resolveProviderDiagnosticCallMode(provider, requestedCallMode);

    const runResults: ProviderDiagnosticProbeResult[] = [];
    const startedAtMs = Date.now();

    for (let runIndex = 0; runIndex < runs; runIndex += 1) {
        const runResult = await runProviderDiagnosticProbe(provider, settings, {
            ...options,
            callMode
        });
        runResults.push(runResult);
    }

    const totalElapsedMs = Date.now() - startedAtMs;
    const successCount = runResults.filter(run => run.success).length;
    const failureCount = runResults.length - successCount;
    const report = buildProviderDiagnosticStabilityReport({
        provider,
        requestedCallMode,
        callMode,
        runs,
        successCount,
        failureCount,
        totalElapsedMs,
        runResults
    });

    return {
        runs,
        callMode,
        requestedCallMode,
        successCount,
        failureCount,
        totalElapsedMs,
        runResults,
        report
    };
}
