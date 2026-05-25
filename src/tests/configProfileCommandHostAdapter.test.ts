import { STRINGS_EN } from '../i18n/locales/en';
import { mockSettings } from './__mocks__/settings';
import { MissingProviderProfileImportFileError } from '../operations/configProfileCommands';
import {
    runExportCliCapabilityManifestCommandWithHost,
    runExportCliInvocationContractCommandWithHost,
    runExportCliPublicSurfaceCommandWithHost,
    runExportProviderProfilesCommandWithHost,
    runExportRedactedProviderProfilesCommandWithHost,
    runImportProviderProfilesCommandWithHost
} from '../operations/configProfileCommandHostAdapter';

function createHost() {
    const settings = {
        ...mockSettings,
        providers: [...mockSettings.providers]
    };

    return {
        loadSettings: jest.fn().mockResolvedValue(undefined),
        saveSettings: jest.fn().mockResolvedValue(undefined),
        getSettings: jest.fn(() => settings),
        getUiStrings: jest.fn(() => STRINGS_EN),
        pluginId: 'notemd-test',
        defaultActiveProvider: 'OpenAI',
        configHost: {
            configDir: '.obsidian',
            exists: jest.fn(),
            mkdir: jest.fn(),
            read: jest.fn(),
            write: jest.fn()
        },
        logError: jest.fn()
    };
}

describe('config/profile command host adapter', () => {
    test('exports provider profiles through extracted host adapter and formats success notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            outputPath: '.obsidian/plugins/notemd-test/notemd-providers.json',
            profile: { formatVersion: 1, exportedAt: '2026-05-05T00:00:00.000Z', providers: mockSettings.providers }
        });

        const result = await runExportProviderProfilesCommandWithHost(host, executeSpy as any);

        expect(host.loadSettings).toHaveBeenCalled();
        expect(executeSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            providers: mockSettings.providers,
            host: host.configHost
        }));
        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: 'Provider settings exported successfully to .obsidian/plugins/notemd-test/notemd-providers.json'
                },
                {
                    message: 'This export contains provider credentials. Handle the file as sensitive.'
                }
            ]
        });
    });

    test('maps provider profile export errors to notice and host logger', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockRejectedValue(new Error('disk full'));

        const result = await runExportProviderProfilesCommandWithHost(host, executeSpy as any);

        expect(host.logError).toHaveBeenCalledWith('Error exporting provider settings:', expect.any(Error));
        expect(result).toMatchObject({
            kind: 'error',
            notices: [
                {
                    message: 'Error exporting settings: disk full'
                }
            ]
        });
    });

    test('exports redacted provider profiles through extracted host adapter and formats success notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            outputPath: '.obsidian/plugins/notemd-test/notemd-providers-redacted.json',
            profile: {
                formatVersion: 1,
                redacted: true,
                exportedAt: '2026-05-05T00:00:00.000Z',
                providers: [
                    {
                        ...mockSettings.providers[0],
                        apiKey: '[REDACTED]'
                    }
                ]
            }
        });

        const result = await runExportRedactedProviderProfilesCommandWithHost(host, executeSpy as any);

        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: 'Redacted provider settings exported successfully to .obsidian/plugins/notemd-test/notemd-providers-redacted.json'
                }
            ]
        });
    });

    test('imports provider profiles through extracted host adapter, persists state, and formats notices', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            inputPath: '.obsidian/plugins/notemd-test/notemd-providers.json',
            importedProviders: [
                ...mockSettings.providers,
                {
                    name: 'OpenAI',
                    apiKey: 'new-key',
                    baseUrl: 'https://api.openai.test',
                    model: 'gpt-4.1',
                    temperature: 0.2
                }
            ],
            newCount: 1,
            updatedCount: 1,
            activeProvider: 'OpenAI',
            activeProviderReset: true
        });

        const result = await runImportProviderProfilesCommandWithHost(host, executeSpy as any);

        expect(executeSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            existingProviders: mockSettings.providers,
            activeProvider: mockSettings.activeProvider,
            defaultActiveProvider: 'OpenAI',
            host: host.configHost
        }));
        expect(host.getSettings().activeProvider).toBe('OpenAI');
        expect(host.getSettings().providers).toHaveLength(mockSettings.providers.length + 1);
        expect(host.saveSettings).toHaveBeenCalled();
        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: STRINGS_EN.settings.providerConfig.activeProviderReset
                },
                {
                    message: 'Successfully imported 1 new and updated 1 existing provider settings.'
                }
            ]
        });
    });

    test('maps missing provider profile import file to localized notice', async () => {
        const host = createHost();
        const executeSpy = jest
            .fn()
            .mockRejectedValue(new MissingProviderProfileImportFileError('.obsidian/plugins/notemd-test/notemd-providers.json'));

        const result = await runImportProviderProfilesCommandWithHost(host, executeSpy as any);

        expect(host.saveSettings).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            kind: 'missing-file',
            notices: [
                {
                    message: "Import file not found at .obsidian/plugins/notemd-test/notemd-providers.json. Please place your 'notemd-providers.json' file there."
                }
            ]
        });
    });

    test('exports CLI capability manifest through extracted host adapter and formats notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            outputPath: '.obsidian/plugins/notemd-test/notemd-cli-capabilities.json',
            manifest: { version: 1, commands: [] }
        });

        const result = await runExportCliCapabilityManifestCommandWithHost(host, executeSpy as any);

        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: 'CLI capability manifest exported to .obsidian/plugins/notemd-test/notemd-cli-capabilities.json'
                }
            ]
        });
    });

    test('exports CLI invocation contract through extracted host adapter and formats notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            outputPath: '.obsidian/plugins/notemd-test/notemd-cli-contract.json',
            contract: { version: 1, operations: [] }
        });

        const result = await runExportCliInvocationContractCommandWithHost(host, executeSpy as any);

        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: 'CLI invocation contract exported to .obsidian/plugins/notemd-test/notemd-cli-contract.json'
                }
            ]
        });
    });

    test('exports public CLI surface through extracted host adapter and formats notice', async () => {
        const host = createHost();
        const executeSpy = jest.fn().mockResolvedValue({
            outputPath: '.obsidian/plugins/notemd-test/notemd-cli-public-surface.json',
            surface: { version: 1, commands: [] }
        });

        const result = await runExportCliPublicSurfaceCommandWithHost(host, executeSpy as any);

        expect(result).toMatchObject({
            kind: 'success',
            notices: [
                {
                    message: 'Public CLI surface exported to .obsidian/plugins/notemd-test/notemd-cli-public-surface.json'
                }
            ]
        });
    });
});
