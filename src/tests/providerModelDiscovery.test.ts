import { requestUrl } from 'obsidian';
import { discoverProviderModels } from '../providerModelDiscovery';

jest.mock('obsidian');

describe('provider model discovery', () => {
    const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

    beforeEach(() => {
        mockedRequestUrl.mockReset();
    });

    test('discovers models from OpenAI-compatible providers via /models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'gpt-4o' },
                    { id: 'gpt-4.1' },
                    { id: 'gpt-4o' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-4o'],
            source: 'remote'
        });
    });

    test('normalizes OpenAI-compatible chat/completions endpoints before fetching models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'gpt-4.1' }] }
        } as any);

        await discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models'
        }));
    });

    test('sends gateway headers for Requesty/OpenRouter-compatible discovery calls', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'claude-3.7-sonnet' }] }
        } as any);

        await discoverProviderModels({
            name: 'Requesty',
            apiKey: 'rq-test',
            baseUrl: 'https://router.requesty.ai/v1',
            model: 'claude-3.7-sonnet',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: 'Bearer rq-test',
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                'X-Title': 'Notemd Obsidian Plugin'
            })
        }));
    });

    test('discovers models from Ollama providers via /tags', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { model: 'llama3.1:latest', name: 'llama3.1:latest' },
                    { name: 'qwen2.5:14b' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:11434/api/tags'
        }));
        expect(result.models).toEqual(['llama3.1:latest', 'qwen2.5:14b']);
    });

    test('normalizes Ollama /tags endpoints before fetching model tags', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { models: [{ model: 'llama3.1:latest' }] }
        } as any);

        await discoverProviderModels({
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api/tags',
            model: 'llama3',
            temperature: 0.7
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:11434/api/tags'
        }));
    });

    test('discovers models from Google providers via v1 models list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { name: 'models/gemini-2.5-pro' },
                    { name: 'models/gemini-2.5-flash' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key'
        }));
        expect(result.models).toEqual(['gemini-2.5-flash', 'gemini-2.5-pro']);
    });

    test('normalizes Google /models endpoints before fetching model list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { models: [{ name: 'models/gemini-2.5-pro' }] }
        } as any);

        await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key'
        }));
    });

    test('fails with a clear error when required discovery prerequisites are missing', async () => {
        await expect(discoverProviderModels({
            name: 'Google',
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        })).rejects.toThrow('Google model discovery requires an API key.');

        await expect(discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: '',
            model: 'gpt-4.1',
            temperature: 0.5
        })).rejects.toThrow('OpenAI model discovery requires a Base URL / endpoint.');
    });

    test('surfaces non-success model-discovery responses as actionable errors', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 401,
            text: 'Unauthorized',
            json: {}
        } as any);

        await expect(discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        })).rejects.toThrow('Model discovery request failed: 401 Unauthorized');
    });

    test('returns an empty none-source result for unsupported providers', async () => {
        const result = await discoverProviderModels({
            name: 'Azure OpenAI',
            apiKey: 'azure-key',
            baseUrl: 'https://example.openai.azure.com',
            model: 'deployment-name',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        });

        expect(mockedRequestUrl).not.toHaveBeenCalled();
        expect(result).toEqual({
            models: [],
            source: 'none'
        });
    });
});
