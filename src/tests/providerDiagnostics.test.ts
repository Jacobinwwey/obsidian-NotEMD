import { mockSettings } from './__mocks__/settings';
import { LLMProviderConfig } from '../types';
import {
    DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS,
    buildDefaultProviderDiagnosticPayload,
    buildProviderDiagnosticFileName,
    getProviderDiagnosticCallModeOptions,
    runProviderDiagnosticProbe,
    runProviderDiagnosticStabilityProbe
} from '../providerDiagnostics';

describe('provider diagnostics runtime helper', () => {
    const provider: LLMProviderConfig = {
        name: 'OpenAI',
        apiKey: 'sk-test-secret-key',
        baseUrl: 'https://example.com/v1',
        model: 'gpt-4.1',
        temperature: 0.2
    };

    test('builds deterministic default diagnostic payload', () => {
        const payload = buildDefaultProviderDiagnosticPayload(provider.name);
        expect(payload.prompt).toContain('diagnostic assistant');
        expect(payload.content.length).toBeGreaterThan(1000);
    });

    test('runs provider diagnostic probe and captures success report', async () => {
        const callLLMImpl = jest.fn(async (_provider, _prompt, _content, _settings, reporter) => {
            reporter.log('mock provider returned after long processing');
            return 'diagnostic success output';
        });

        const result = await runProviderDiagnosticProbe(provider, mockSettings, {
            timeoutMs: DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS,
            callLLMImpl,
            now: new Date('2026-03-30T00:00:00.000Z')
        });

        expect(callLLMImpl).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);
        expect(result.callMode).toBe('runtime-stable');
        expect(result.report).toContain('Result: SUCCESS');
        expect(result.report).toContain('mock provider returned after long processing');
        expect(result.report).toContain('diagnostic success output');
    });

    test('returns openai-specific diagnostic call mode options for openai-compatible providers', () => {
        const options = getProviderDiagnosticCallModeOptions(provider);
        const values = options.map(option => option.value);
        expect(values).toContain('openai-direct-stream');
        expect(values).toContain('openai-direct-buffered');
        expect(values).toContain('openai-requesturl-only');
    });

    test('hides openai-specific diagnostic call mode options for non-openai providers', () => {
        const anthropicProvider: LLMProviderConfig = {
            name: 'Anthropic',
            apiKey: 'ak-test',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.3
        };
        const options = getProviderDiagnosticCallModeOptions(anthropicProvider);
        const values = options.map(option => option.value);
        expect(values).not.toContain('openai-direct-stream');
        expect(values).not.toContain('openai-direct-buffered');
        expect(values).not.toContain('openai-requesturl-only');
    });

    test('falls back to runtime-stable mode when an openai-only mode is requested for non-openai transport', async () => {
        const anthropicProvider: LLMProviderConfig = {
            name: 'Anthropic',
            apiKey: 'ak-test',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.3
        };

        const callLLMImpl = jest.fn(async (_provider, _prompt, _content, _settings, reporter) => {
            reporter.log('anthropic runtime path used');
            return 'ok';
        });

        const result = await runProviderDiagnosticProbe(anthropicProvider, mockSettings, {
            callMode: 'openai-direct-buffered',
            callLLMImpl
        });

        expect(result.success).toBe(true);
        expect(result.requestedCallMode).toBe('openai-direct-buffered');
        expect(result.callMode).toBe('runtime-stable');
        expect(callLLMImpl).toHaveBeenCalledTimes(1);
        expect(result.report).toContain(`Requested Call Mode: openai-direct-buffered`);
        expect(result.report).toContain(`Effective Call Mode: runtime-stable`);
    });

    test('uses openai diagnostic transport implementation for openai-only diagnostic mode', async () => {
        const callLLMImpl = jest.fn(async () => 'should-not-be-used');
        const callOpenAICompatibleDiagnosticImpl = jest.fn(async (_provider, _model, _prompt, _content, reporter) => {
            reporter.log('forced openai direct mode executed');
            return 'openai-direct-ok';
        });

        const result = await runProviderDiagnosticProbe(provider, mockSettings, {
            callMode: 'openai-direct-stream',
            callLLMImpl,
            callOpenAICompatibleDiagnosticImpl
        });

        expect(result.success).toBe(true);
        expect(result.callMode).toBe('openai-direct-stream');
        expect(callOpenAICompatibleDiagnosticImpl).toHaveBeenCalledTimes(1);
        expect(callLLMImpl).not.toHaveBeenCalled();
        expect(result.report).toContain('openai-direct-stream');
        expect(result.report).toContain('forced openai direct mode executed');
    });

    test('captures failure report with debug details when provider throws', async () => {
        const err = new Error('OpenAI API request failed: net::ERR_CONNECTION_CLOSED');
        (err as any).__notemdDebug = {
            attempts: [
                {
                    transport: 'requestUrl',
                    requestMethod: 'POST',
                    requestUrl: 'https://example.com/chat/completions?key=secret',
                    status: 0,
                    errorMessage: 'net::ERR_CONNECTION_CLOSED'
                }
            ]
        };

        const callLLMImpl = jest.fn(async () => {
            throw err;
        });

        const result = await runProviderDiagnosticProbe(provider, mockSettings, {
            callLLMImpl,
            now: new Date('2026-03-30T00:00:00.000Z')
        });

        expect(result.success).toBe(false);
        expect(result.report).toContain('Result: FAILED');
        expect(result.report).toContain('ERR_CONNECTION_CLOSED');
        expect(result.report).toContain('Attempt 1 [requestUrl]');
        expect(result.report).toContain('[REDACTED]');
    });

    test('builds safe report filename', () => {
        const name = buildProviderDiagnosticFileName('OpenAI Compatible/Proxy', new Date('2026-03-30T01:02:03.456Z'));
        expect(name).toBe('Notemd_Provider_Diagnostic_OpenAI_Compatible_Proxy_2026-03-30T01-02-03-456Z.txt');
    });

    test('runs stability probe for selected call mode and aggregates success/failure', async () => {
        let runIndex = 0;
        const callOpenAICompatibleDiagnosticImpl = jest.fn(async () => {
            runIndex += 1;
            if (runIndex === 2) {
                throw new Error('simulated intermittent failure');
            }
            return `run-${runIndex}-ok`;
        });

        const result = await runProviderDiagnosticStabilityProbe(provider, mockSettings, {
            callMode: 'openai-direct-buffered',
            runs: 3,
            callOpenAICompatibleDiagnosticImpl
        });

        expect(result.runs).toBe(3);
        expect(result.callMode).toBe('openai-direct-buffered');
        expect(result.successCount).toBe(2);
        expect(result.failureCount).toBe(1);
        expect(result.runResults).toHaveLength(3);
        expect(callOpenAICompatibleDiagnosticImpl).toHaveBeenCalledTimes(3);
        expect(result.report).toContain('Notemd Provider Diagnostic Stability Report');
        expect(result.report).toContain('Runs: 3');
        expect(result.report).toContain('Failed: 1');
    });
});
