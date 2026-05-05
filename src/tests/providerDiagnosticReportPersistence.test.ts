import { persistProviderDiagnosticReport } from '../operations/providerDiagnosticReportPersistence';

describe('provider diagnostic report persistence', () => {
    test('persists a new diagnostic report at the base generated path', async () => {
        const host = {
            exists: jest.fn().mockResolvedValue(false),
            create: jest.fn().mockResolvedValue(undefined)
        };

        const outputPath = await persistProviderDiagnosticReport({
            providerName: 'DeepSeek',
            reportContent: 'diagnostic report',
            host,
            now: new Date('2026-05-05T12:00:00.000Z')
        });

        expect(outputPath).toBe('Notemd_Provider_Diagnostic_DeepSeek_2026-05-05T12-00-00-000Z.txt');
        expect(host.create).toHaveBeenCalledWith(outputPath, 'diagnostic report');
    });

    test('appends a numeric suffix when the base report path already exists', async () => {
        const host = {
            exists: jest
                .fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false),
            create: jest.fn().mockResolvedValue(undefined)
        };

        const outputPath = await persistProviderDiagnosticReport({
            providerName: 'DeepSeek',
            reportContent: 'diagnostic report',
            host,
            now: new Date('2026-05-05T12:00:00.000Z')
        });

        expect(outputPath).toBe('Notemd_Provider_Diagnostic_DeepSeek_2026-05-05T12-00-00-000Z_2.txt');
        expect(host.create).toHaveBeenCalledWith(outputPath, 'diagnostic report');
    });
});
