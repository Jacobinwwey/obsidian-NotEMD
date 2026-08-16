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
