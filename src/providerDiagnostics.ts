import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import { callLLM, getDebugInfo } from './llmUtils';

export const DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_RESPONSE_PREVIEW_CHARS = 8000;

type CallLLMFn = typeof callLLM;

export interface ProviderDiagnosticProbeOptions {
    timeoutMs?: number;
    prompt?: string;
    content?: string;
    now?: Date;
    callLLMImpl?: CallLLMFn;
}

export interface ProviderDiagnosticProbeResult {
    success: boolean;
    elapsedMs: number;
    responseText?: string;
    errorMessage?: string;
    debugInfo?: string;
    logs: string[];
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
        `API Key: ${redactApiKey(provider.apiKey)}`,
        '',
        '=== Runtime Settings ===',
        `Stable API Calls: ${settings.enableStableApiCall ? 'enabled' : 'disabled'}`,
        `Retry Interval Seconds: ${settings.apiCallInterval}`,
        `Max Retries: ${settings.apiCallMaxRetries}`,
        `API Debug Mode (forced in diagnostic run): enabled`,
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
    const payload = options.prompt && options.content
        ? { prompt: options.prompt, content: options.content }
        : buildDefaultProviderDiagnosticPayload(provider.name);
    const timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS;
    const runtimeStartedAtMs = Date.now();
    const startedAt = options.now ?? new Date(runtimeStartedAtMs);

    const logs: string[] = [];
    const reporter = createInMemoryProgressReporter(logs);

    const runtimeSettings: NotemdSettings = {
        ...settings,
        enableApiErrorDebugMode: true,
        enableStableApiCall: true
    };

    reporter.log(`Developer diagnostic started for ${provider.name}.`);
    reporter.log(`Using model '${provider.model}' at '${provider.baseUrl}'.`);
    reporter.log(`Timeout configured to ${timeoutMs}ms.`);

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

        responseText = await callLLMImpl(
            provider,
            payload.prompt,
            payload.content,
            runtimeSettings,
            reporter,
            provider.model,
            controller.signal
        );

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
        responseText,
        errorMessage,
        debugInfo,
        logs,
        report
    };
}
