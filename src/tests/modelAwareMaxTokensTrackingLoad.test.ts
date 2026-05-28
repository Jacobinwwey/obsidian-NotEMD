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

describe('model-aware max token tracking settings load', () => {
    test('loadSettings drops malformed persisted global model-aware tracking', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.loadData = jest.fn().mockResolvedValue({
            providers: [
                {
                    name: 'OpenAI',
                    apiKey: 'openai-key',
                    baseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                    temperature: 0.5
                }
            ],
            activeProvider: 'OpenAI',
            globalModelAwareMaxTokensTracking: {
                providerName: 'OpenAI',
                modelName: '',
                discoveryIdentity: 'tracked',
                resolvedMaxTokens: 4096
            }
        });

        await plugin.loadSettings();

        expect(plugin.settings.globalModelAwareMaxTokensTracking).toBeUndefined();
    });

    test('loadSettings preserves valid persisted global model-aware tracking for an existing provider', async () => {
        const plugin = new NotemdPlugin(mockApp, createManifest() as any);
        plugin.loadData = jest.fn().mockResolvedValue({
            providers: [
                {
                    name: 'OpenAI',
                    apiKey: 'openai-key',
                    baseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                    temperature: 0.5
                }
            ],
            activeProvider: 'OpenAI',
            globalModelAwareMaxTokensTracking: {
                providerName: 'OpenAI',
                modelName: 'gpt-4o',
                discoveryIdentity: 'tracked',
                resolvedMaxTokens: 4096
            }
        });

        await plugin.loadSettings();

        expect(plugin.settings.globalModelAwareMaxTokensTracking).toEqual({
            providerName: 'OpenAI',
            modelName: 'gpt-4o',
            discoveryIdentity: 'tracked',
            resolvedMaxTokens: 4096
        });
    });
});
