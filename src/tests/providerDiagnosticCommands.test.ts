import NotemdPlugin from '../main';
import { Notice } from 'obsidian';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as configProfileCommands from '../operations/configProfileCommands';
import * as providerDiagnosticCommandHostAdapter from '../operations/providerDiagnosticCommandHostAdapter';

function createManifest() {
    return {
        id: 'notemd-test',
        name: 'Notemd Test',
        version: '0.0.1',
        author: 'Test',
        description: 'Test plugin',
        isDesktopOnly: false,
        minAppVersion: '1.0.0'
    };
}

describe('provider diagnostic command surface', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('registers developer provider diagnostic commands', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            enableDeveloperMode: true,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
        plugin.registerView = jest.fn();
        plugin.registerEvent = jest.fn();
        plugin.addRibbonIcon = jest.fn(() => ({ setAttribute: jest.fn() } as any)) as any;
        plugin.addStatusBarItem = jest.fn(() => ({ setText: jest.fn() } as any)) as any;
        plugin.addSettingTab = jest.fn();
        plugin.registerExtensions = jest.fn();
        const addCommandSpy = jest.fn();
        (plugin as any).addCommand = addCommandSpy;

        await plugin.onload();

        const ids = addCommandSpy.mock.calls.map((call: any[]) => call[0]?.id);
        expect(ids).toContain('run-developer-provider-diagnostic');
        expect(ids).toContain('run-developer-provider-stability-diagnostic');
        expect(ids).toContain('export-provider-profiles');
        expect(ids).toContain('import-provider-profiles');
        expect(ids).toContain('export-cli-capability-manifest');
        expect(ids).toContain('export-cli-invocation-contract');
    });

    test('developer diagnostic command delegates to extracted provider diagnostic host adapter', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            enableDeveloperMode: true,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(providerDiagnosticCommandHostAdapter, 'runProviderDiagnosticCommandWithHost')
            .mockResolvedValue({
                kind: 'success',
                notice: {
                    message: 'diag ok',
                    duration: 8000
                },
                execution: {} as any
            });

        await (plugin as any).runDeveloperProviderDiagnosticCommand();

        expect(commandSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                loadSettings: expect.any(Function),
                getSettings: expect.any(Function),
                getUiStrings: expect.any(Function),
                sanitizeTimeoutMs: expect.any(Function),
                sanitizeRuns: expect.any(Function),
                reportHost: expect.objectContaining({
                    exists: expect.any(Function),
                    create: expect.any(Function)
                })
            })
        );
        expect(Notice).toHaveBeenCalledWith('diag ok', 8000);
    });

    test('developer stability diagnostic delegates to extracted provider diagnostic host adapter', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            enableDeveloperMode: true,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(providerDiagnosticCommandHostAdapter, 'runProviderDiagnosticStabilityCommandWithHost')
            .mockResolvedValue({
                kind: 'finished',
                notice: {
                    message: 'stability ok',
                    duration: 12000
                },
                execution: {} as any
            });

        await (plugin as any).runDeveloperProviderStabilityDiagnosticCommand();

        expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
            loadSettings: expect.any(Function),
            getSettings: expect.any(Function),
            getUiStrings: expect.any(Function),
            sanitizeTimeoutMs: expect.any(Function),
            sanitizeRuns: expect.any(Function),
            reportHost: expect.objectContaining({
                exists: expect.any(Function),
                create: expect.any(Function)
            })
        }));
        expect(Notice).toHaveBeenCalledWith('stability ok', 12000);
    });

    test('provider profile export command delegates to extracted config/profile operation', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(configProfileCommands, 'executeExportProviderProfilesCommand')
            .mockResolvedValue({
                outputPath: '.obsidian/plugins/notemd-test/notemd-providers.json',
                profile: { providers: mockSettings.providers, formatVersion: 1, exportedAt: '2026-05-05T00:00:00.000Z' }
            } as any);

        await (plugin as any).exportProviderProfilesCommand();

        expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            providers: mockSettings.providers,
            host: expect.objectContaining({ configDir: '.obsidian' })
        }));
    });

    test('provider profile import command delegates to extracted config/profile operation and persists imported state', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(configProfileCommands, 'executeImportProviderProfilesCommand')
            .mockResolvedValue({
                inputPath: '.obsidian/plugins/notemd-test/notemd-providers.json',
                importedProviders: [
                    ...mockSettings.providers,
                    {
                        name: 'OpenAI',
                        apiKey: 'new',
                        baseUrl: 'https://openai.test',
                        model: 'gpt-4.1',
                        temperature: 0.2
                    }
                ],
                newCount: 1,
                updatedCount: 1,
                activeProvider: 'OpenAI',
                activeProviderReset: true
            } as any);

        await (plugin as any).importProviderProfilesCommand();

        expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            activeProvider: mockSettings.activeProvider,
            host: expect.objectContaining({ configDir: '.obsidian' })
        }));
        expect(plugin.settings.activeProvider).toBe('OpenAI');
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    test('CLI capability manifest export command delegates to extracted config/profile operation', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(configProfileCommands, 'executeExportCliCapabilityManifestCommand')
            .mockResolvedValue({
                outputPath: '.obsidian/plugins/notemd-test/notemd-cli-capabilities.json',
                manifest: { version: 1, commands: [] }
            } as any);

        await (plugin as any).exportCliCapabilityManifestCommand();

        expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            host: expect.objectContaining({ configDir: '.obsidian' })
        }));
    });

    test('CLI invocation contract export command delegates to extracted config/profile operation', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        (plugin as any).manifest = createManifest();
        plugin.settings = {
            ...mockSettings,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
        const commandSpy = jest
            .spyOn(configProfileCommands, 'executeExportCliInvocationContractCommand')
            .mockResolvedValue({
                outputPath: '.obsidian/plugins/notemd-test/notemd-cli-contract.json',
                contract: { version: 1, operations: [] }
            } as any);

        await (plugin as any).exportCliInvocationContractCommand();

        expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
            pluginId: 'notemd-test',
            host: expect.objectContaining({ configDir: '.obsidian' })
        }));
    });
});
