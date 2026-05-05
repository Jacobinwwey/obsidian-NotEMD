import { STRINGS_EN } from '../i18n/locales/en';
import { mockSettings } from './__mocks__/settings';
import {
    runProviderDiagnosticCommandWithHost,
    runProviderDiagnosticStabilityCommandWithHost
} from '../operations/providerDiagnosticCommandHostAdapter';
import { MissingActiveProviderError } from '../operations/providerDiagnosticCommand';

function createHost() {
    return {
        loadSettings: jest.fn().mockResolvedValue(undefined),
        getSettings: jest.fn(() => mockSettings),
        getUiStrings: jest.fn(() => STRINGS_EN),
        sanitizeTimeoutMs: jest.fn((rawValue: number) => rawValue),
        sanitizeRuns: jest.fn((rawValue: number) => rawValue),
        now: jest.fn(() => new Date('2026-05-05T12:00:00.000Z')),
        reportHost: {
            exists: jest.fn().mockResolvedValue(false),
            create: jest.fn().mockResolvedValue(undefined)
        }
    };
}

describe('provider diagnostic command host adapter', () => {
    test('runs developer diagnostic through extracted host adapter and formats success notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockImplementation(async (params: any) => {
            const reportPath = await params.saveReport('DeepSeek', 'diagnostic report');
            return {
                input: {
                    providerName: 'DeepSeek',
                    model: mockSettings.providers[0].model,
                    callMode: 'runtime-stable',
                    timeoutMs: mockSettings.developerDiagnosticTimeoutMs,
                    stabilityRuns: mockSettings.developerDiagnosticStabilityRuns
                },
                provider: mockSettings.providers[0],
                reportPath,
                result: {
                    success: true,
                    elapsedMs: 5,
                    callMode: 'runtime-stable',
                    requestedCallMode: 'runtime-stable',
                    logs: [],
                    report: 'diagnostic report'
                }
            };
        });

        const result = await runProviderDiagnosticCommandWithHost(host, executeSpy as any);

        expect(host.loadSettings).toHaveBeenCalled();
        expect(executeSpy).toHaveBeenCalledWith(expect.objectContaining({
            settings: mockSettings,
            sanitizeTimeoutMs: expect.any(Function),
            sanitizeRuns: expect.any(Function),
            saveReport: expect.any(Function)
        }));
        expect(host.reportHost.create).toHaveBeenCalledWith(
            'Notemd_Provider_Diagnostic_DeepSeek_2026-05-05T12-00-00-000Z.txt',
            'diagnostic report'
        );
        expect(result).toMatchObject({
            kind: 'success',
            notice: {
                message: 'Developer diagnostic succeeded (runtime-stable). Report saved to: Notemd_Provider_Diagnostic_DeepSeek_2026-05-05T12-00-00-000Z.txt',
                duration: 8000
            }
        });
    });

    test('formats captured-failure notice for unsuccessful diagnostic results', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            input: {
                providerName: 'DeepSeek',
                model: mockSettings.providers[0].model,
                callMode: 'runtime-stable',
                timeoutMs: mockSettings.developerDiagnosticTimeoutMs,
                stabilityRuns: mockSettings.developerDiagnosticStabilityRuns
            },
            provider: mockSettings.providers[0],
            reportPath: 'vault/failure.txt',
            result: {
                success: false,
                elapsedMs: 5,
                callMode: 'runtime-stable',
                requestedCallMode: 'runtime-stable',
                logs: [],
                report: 'diagnostic report'
            }
        });

        const result = await runProviderDiagnosticCommandWithHost(host, executeSpy as any);

        expect(result).toMatchObject({
            kind: 'captured-failure',
            notice: {
                message: 'Developer diagnostic captured failure (runtime-stable). Report saved to: vault/failure.txt',
                duration: 12000
            }
        });
    });

    test('maps missing active provider to localized notice instead of throwing', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockRejectedValue(new MissingActiveProviderError());

        const result = await runProviderDiagnosticCommandWithHost(host, executeSpy as any);

        expect(result).toEqual({
            kind: 'missing-provider',
            notice: {
                message: STRINGS_EN.notices.noActiveProviderConfigured,
                duration: 8000
            }
        });
    });

    test('runs stability diagnostic through extracted host adapter and formats summary notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockImplementation(async (params: any) => {
            const reportPath = await params.saveReport('DeepSeek_stability', 'stability report');
            return {
                input: {
                    providerName: 'DeepSeek',
                    model: mockSettings.providers[0].model,
                    callMode: 'runtime-stable',
                    timeoutMs: mockSettings.developerDiagnosticTimeoutMs,
                    stabilityRuns: mockSettings.developerDiagnosticStabilityRuns
                },
                provider: mockSettings.providers[0],
                reportPath,
                result: {
                    runs: 3,
                    callMode: 'runtime-stable',
                    requestedCallMode: 'runtime-stable',
                    successCount: 2,
                    failureCount: 1,
                    totalElapsedMs: 10,
                    runResults: [],
                    report: 'stability report'
                }
            };
        });

        const result = await runProviderDiagnosticStabilityCommandWithHost(host, executeSpy as any);

        expect(host.reportHost.create).toHaveBeenCalledWith(
            'Notemd_Provider_Diagnostic_DeepSeek_stability_2026-05-05T12-00-00-000Z.txt',
            'stability report'
        );
        expect(result).toMatchObject({
            kind: 'finished',
            notice: {
                message: 'Developer stability diagnostic finished (runtime-stable): 2/3 succeeded. Report: Notemd_Provider_Diagnostic_DeepSeek_stability_2026-05-05T12-00-00-000Z.txt',
                duration: 12000
            }
        });
    });
});
