import NotemdPlugin from '../main';
import { mockApp } from './__mocks__/app';

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

describe('Drawnix knowledge-map delivery settings migration', () => {
    test('persists one sanitized settings record without local-only provider credentials', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        const localProvider = {
            name: 'Local provider',
            apiKey: 'local-secret',
            model: 'local-model',
            localOnly: true
        };
        const syncProvider = {
            name: 'Cloud provider',
            apiKey: 'cloud-secret',
            model: 'cloud-model',
            localOnly: false
        };
        plugin.settings = {
            ...plugin.settings,
            providers: [localProvider, syncProvider]
        } as any;
        plugin.saveData = jest.fn().mockResolvedValue(undefined);

        await plugin.saveSettings();

        expect(plugin.saveData).toHaveBeenCalledTimes(1);
        expect(plugin.saveData).toHaveBeenCalledWith(expect.objectContaining({
            providers: [syncProvider]
        }));
        expect(plugin.saveData).not.toHaveBeenCalledWith(expect.objectContaining({
            providers: expect.arrayContaining([localProvider])
        }));
    });

    test('removes obsolete delivery selection from a persisted settings record', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.saveData = jest.fn().mockResolvedValue(undefined);
        plugin.loadData = jest.fn().mockResolvedValue({
            uiLocale: 'zh-CN',
            drawnixKnowledgeMapDelivery: 'presentation'
        });

        await plugin.loadSettings();

        expect(plugin.settings).not.toHaveProperty('drawnixKnowledgeMapDelivery');
        expect(plugin.saveData).toHaveBeenLastCalledWith(expect.not.objectContaining({
            drawnixKnowledgeMapDelivery: expect.anything()
        }));
    });

    test('does not add a delivery selection to a new settings record', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.loadData = jest.fn().mockResolvedValue({});

        await plugin.loadSettings();

        expect(plugin.settings).not.toHaveProperty('drawnixKnowledgeMapDelivery');
    });
});
