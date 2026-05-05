import { mockSettings } from './__mocks__/settings';
import {
    executeProviderDiagnosticCommand,
    executeProviderDiagnosticStabilityCommand,
    MissingActiveProviderError
} from '../operations/providerDiagnosticCommand';

describe('provider diagnostic command operation', () => {
    test('builds input, runs single diagnostic probe, and persists the report', async () => {
        const saveReport = jest.fn().mockResolvedValue('vault/diag.txt');
        const runProbe = jest.fn().mockResolvedValue({
            success: true,
            elapsedMs: 12,
            callMode: 'runtime-stable',
            requestedCallMode: 'runtime-stable',
            logs: [],
            report: 'single report'
        });

        const result = await executeProviderDiagnosticCommand({
            settings: mockSettings,
            sanitizeTimeoutMs: (raw) => raw,
            sanitizeRuns: (raw) => raw,
            saveReport,
            runProviderDiagnosticProbeImpl: runProbe as any
        });

        expect(runProbe).toHaveBeenCalledWith(
            expect.objectContaining({ name: mockSettings.activeProvider }),
            mockSettings,
            expect.objectContaining({
                callMode: 'runtime-stable',
                timeoutMs: mockSettings.developerDiagnosticTimeoutMs
            })
        );
        expect(saveReport).toHaveBeenCalledWith(mockSettings.activeProvider, 'single report');
        expect(result.reportPath).toBe('vault/diag.txt');
        expect(result.provider.name).toBe(mockSettings.activeProvider);
    });

    test('runs stability diagnostic with sanitized runs and report suffix', async () => {
        const saveReport = jest.fn().mockResolvedValue('vault/stability.txt');
        const runProbe = jest.fn().mockResolvedValue({
            runs: 2,
            callMode: 'runtime-stable',
            requestedCallMode: 'runtime-stable',
            successCount: 2,
            failureCount: 0,
            totalElapsedMs: 30,
            runResults: [],
            report: 'stability report'
        });

        const result = await executeProviderDiagnosticStabilityCommand({
            settings: {
                ...mockSettings,
                developerDiagnosticStabilityRuns: 99
            },
            sanitizeTimeoutMs: (raw) => raw,
            sanitizeRuns: () => 2,
            saveReport,
            runProviderDiagnosticStabilityProbeImpl: runProbe as any
        });

        expect(runProbe).toHaveBeenCalledWith(
            expect.objectContaining({ name: mockSettings.activeProvider }),
            expect.any(Object),
            expect.objectContaining({
                runs: 2,
                timeoutMs: mockSettings.developerDiagnosticTimeoutMs
            })
        );
        expect(saveReport).toHaveBeenCalledWith(`${mockSettings.activeProvider}_stability`, 'stability report');
        expect(result.result.runs).toBe(2);
    });

    test('throws typed error when no active provider is configured', async () => {
        await expect(executeProviderDiagnosticCommand({
            settings: {
                ...mockSettings,
                activeProvider: 'Missing Provider'
            },
            sanitizeTimeoutMs: (raw) => raw,
            sanitizeRuns: (raw) => raw,
            saveReport: jest.fn()
        })).rejects.toBeInstanceOf(MissingActiveProviderError);
    });
});
