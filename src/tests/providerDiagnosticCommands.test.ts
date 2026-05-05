import NotemdPlugin from '../main';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import * as providerDiagnosticCommand from '../operations/providerDiagnosticCommand';

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

    test('developer diagnostic command delegates to extracted provider diagnostic command operation', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.app = mockApp;
        plugin.settings = {
            ...mockSettings,
            enableDeveloperMode: true,
            _firstLaunch: false
        };
        plugin.loadSettings = jest.fn().mockResolvedValue(undefined);

        const commandSpy = jest.spyOn(providerDiagnosticCommand, 'executeProviderDiagnosticCommand').mockResolvedValue({
            input: {
                providerName: 'DeepSeek',
                model: mockSettings.providers[0].model,
                callMode: 'runtime-stable',
                timeoutMs: mockSettings.developerDiagnosticTimeoutMs,
                stabilityRuns: mockSettings.developerDiagnosticStabilityRuns
            },
            provider: mockSettings.providers[0],
            reportPath: 'vault/diag.txt',
            result: {
                success: true,
                elapsedMs: 1,
                callMode: 'runtime-stable',
                requestedCallMode: 'runtime-stable',
                logs: [],
                report: 'ok'
            }
        } as any);

        await (plugin as any).runDeveloperProviderDiagnosticCommand();

        expect(commandSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                settings: expect.objectContaining({ activeProvider: 'DeepSeek' }),
                saveReport: expect.any(Function),
                sanitizeTimeoutMs: expect.any(Function)
            })
        );
    });
});
