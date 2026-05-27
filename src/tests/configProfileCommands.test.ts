import { LLMProviderConfig } from '../types';
import {
    buildPluginConfigFilePath,
    executeExportCliCapabilityManifestCommand,
    executeExportCliInvocationContractCommand,
    executeExportCliPublicSurfaceCommand,
    executeExportProviderProfilesCommand,
    executeExportRedactedProviderProfilesCommand,
    executeImportProviderProfilesCommand,
    MissingProviderProfileImportFileError
} from '../operations/configProfileCommands';

function createHost() {
    return {
        configDir: '.obsidian',
        exists: jest.fn().mockResolvedValue(false),
        mkdir: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue(''),
        write: jest.fn().mockResolvedValue(undefined)
    };
}

describe('config/profile commands', () => {
    const providers: LLMProviderConfig[] = [
        {
            name: 'DeepSeek',
            apiKey: 'test',
            baseUrl: 'https://deepseek.test',
            model: 'deepseek-chat',
            temperature: 0.3,
            localOnly: true
        }
    ];

    test('builds plugin config file paths under plugin-scoped config directory', () => {
        expect(buildPluginConfigFilePath('.obsidian', 'notemd-test', 'notemd-providers.json'))
            .toBe('.obsidian/plugins/notemd-test/notemd-providers.json');
    });

    test('exports provider profiles through plugin config host and preserves localOnly', async () => {
        const host = createHost();

        const result = await executeExportProviderProfilesCommand({
            pluginId: 'notemd-test',
            providers,
            host,
            now: new Date('2026-05-05T12:00:00.000Z')
        });

        expect(host.mkdir).toHaveBeenCalledWith('.obsidian/plugins/notemd-test');
        expect(host.write).toHaveBeenCalledWith(
            '.obsidian/plugins/notemd-test/notemd-providers.json',
            expect.stringContaining('"localOnly": true')
        );
        expect(result.outputPath).toBe('.obsidian/plugins/notemd-test/notemd-providers.json');
        expect(result.profile.exportedAt).toBe('2026-05-05T12:00:00.000Z');
    });

    test('exports redacted provider profiles through plugin config host', async () => {
        const host = createHost();

        const result = await executeExportRedactedProviderProfilesCommand({
            pluginId: 'notemd-test',
            providers,
            host,
            now: new Date('2026-05-05T12:00:00.000Z')
        });

        expect(host.write).toHaveBeenCalledWith(
            '.obsidian/plugins/notemd-test/notemd-providers-redacted.json',
            expect.stringContaining('"redacted": true')
        );
        expect(host.write).toHaveBeenCalledWith(
            '.obsidian/plugins/notemd-test/notemd-providers-redacted.json',
            expect.not.stringContaining('"apiKey": "test"')
        );
        expect(result.outputPath).toBe('.obsidian/plugins/notemd-test/notemd-providers-redacted.json');
        expect(result.profile.providers[0].apiKey).toBe('[REDACTED]');
    });

    test('imports provider profiles and falls back to first imported provider when active/default are unavailable', async () => {
        const host = createHost();
        host.exists.mockResolvedValue(true);
        host.read.mockResolvedValue(JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-05-05T12:00:00.000Z',
            providers: [
                {
                    name: 'OpenAI',
                    apiKey: 'new',
                    baseUrl: 'https://openai.test',
                    model: 'gpt-4.1',
                    temperature: 0.2,
                    localOnly: false
                }
            ]
        }));

        const result = await executeImportProviderProfilesCommand({
            pluginId: 'notemd-test',
            existingProviders: [],
            activeProvider: 'DeepSeek',
            defaultActiveProvider: 'DeepSeek',
            host
        });

        expect(result.activeProvider).toBe('OpenAI');
        expect(result.activeProviderReset).toBe(true);
        expect(result.importedProviders).toHaveLength(1);
    });

    test('imports provider profiles with canonicalized active provider names', async () => {
        const host = createHost();
        host.exists.mockResolvedValue(true);
        host.read.mockResolvedValue(JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-05-05T12:00:00.000Z',
            providers: [
                {
                    name: 'Xiaomi',
                    apiKey: 'legacy-key',
                    baseUrl: 'https://legacy.example/v1',
                    model: 'mimo-latest',
                    temperature: 0.4,
                    localOnly: false
                }
            ]
        }));

        const result = await executeImportProviderProfilesCommand({
            pluginId: 'notemd-test',
            existingProviders: [],
            activeProvider: 'Xiaomi',
            defaultActiveProvider: 'Xiaomi MiMo',
            host
        });

        expect(result.activeProvider).toBe('Xiaomi MiMo');
        expect(result.activeProviderReset).toBe(false);
        expect(result.importedProviders).toHaveLength(1);
        expect(result.importedProviders[0].name).toBe('Xiaomi MiMo');
    });

    test('throws typed error when provider profile import file is missing', async () => {
        const host = createHost();

        await expect(executeImportProviderProfilesCommand({
            pluginId: 'notemd-test',
            existingProviders: providers,
            activeProvider: 'DeepSeek',
            defaultActiveProvider: 'DeepSeek',
            host
        })).rejects.toBeInstanceOf(MissingProviderProfileImportFileError);
    });

    test('exports CLI capability manifest, invocation contract, and public surface through shared host pathing', async () => {
        const host = createHost();
        host.exists.mockResolvedValue(true);

        const capabilityResult = await executeExportCliCapabilityManifestCommand({
            pluginId: 'notemd-test',
            host,
            buildCliCapabilityManifestImpl: jest.fn().mockReturnValue({ version: 1, commands: [] }) as any
        });
        const contractResult = await executeExportCliInvocationContractCommand({
            pluginId: 'notemd-test',
            host,
            buildCliInvocationContractImpl: jest.fn().mockReturnValue({ version: 1, operations: [] }) as any
        });
        const publicSurfaceResult = await executeExportCliPublicSurfaceCommand({
            pluginId: 'notemd-test',
            host,
            buildCliPublicSurfaceImpl: jest.fn().mockReturnValue({ version: 1, commands: [] }) as any
        });

        expect(capabilityResult.outputPath).toBe('.obsidian/plugins/notemd-test/notemd-cli-capabilities.json');
        expect(contractResult.outputPath).toBe('.obsidian/plugins/notemd-test/notemd-cli-contract.json');
        expect(publicSurfaceResult.outputPath).toBe('.obsidian/plugins/notemd-test/notemd-cli-public-surface.json');
        expect(host.write).toHaveBeenCalledTimes(3);
    });
});
