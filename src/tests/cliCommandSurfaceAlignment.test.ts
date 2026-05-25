import { buildCliCapabilityManifest } from '../operations/capabilityManifest';
import NotemdPlugin from '../main';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

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

describe('CLI command surface alignment', () => {
    test('keeps capability-manifest commands aligned with real plugin command registrations', async () => {
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

        const mainCommandIds = new Set(addCommandSpy.mock.calls.map((call: any[]) => call[0]?.id));
        const manifestCommandIds = new Set(buildCliCapabilityManifest().commands.map(command => command.localCommandId));

        for (const commandId of manifestCommandIds) {
            expect(mainCommandIds.has(commandId)).toBe(true);
        }
    });
});
