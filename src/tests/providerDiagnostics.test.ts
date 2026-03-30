import { mockSettings } from './__mocks__/settings';
import { LLMProviderConfig } from '../types';
import {
    DEFAULT_PROVIDER_DIAGNOSTIC_TIMEOUT_MS,
    buildDefaultProviderDiagnosticPayload,
    buildProviderDiagnosticFileName,
    runProviderDiagnosticProbe
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
        expect(result.report).toContain('Result: SUCCESS');
        expect(result.report).toContain('mock provider returned after long processing');
        expect(result.report).toContain('diagnostic success output');
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
});
