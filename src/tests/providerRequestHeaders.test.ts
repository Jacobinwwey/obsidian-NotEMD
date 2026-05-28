import { buildOpenAICompatibleProviderHeaders } from '../providerRequestHeaders';
import { LLMProviderConfig } from '../types';

function createProvider(overrides: Partial<LLMProviderConfig>): LLMProviderConfig {
    return {
        name: 'OpenAI Compatible',
        apiKey: '',
        baseUrl: 'https://example.com/v1',
        model: 'test-model',
        temperature: 0.5,
        ...overrides
    };
}

describe('provider request headers', () => {
    test('adds Authorization and X-Api-Key for keyed OpenAI-compatible providers', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            apiKey: 'sk-test'
        }));

        expect(headers).toEqual(expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-test',
            'X-Api-Key': 'sk-test'
        }));
    });

    test('uses EMPTY token semantics for LMStudio compatibility', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'LMStudio',
            apiKey: ''
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer EMPTY',
            'X-Api-Key': 'EMPTY'
        }));
    });

    test('adds gateway referer/title headers for OpenRouter-style providers', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenRouter',
            apiKey: 'router-key'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer router-key',
            'X-Api-Key': 'router-key',
            'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
            'X-Title': 'Notemd Obsidian Plugin'
        }));
    });

    test('detects OpenRouter-style gateway headers from generic OpenAI-compatible base URLs', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenAI Compatible',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer router-key',
            'X-Api-Key': 'router-key',
            'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
            'X-Title': 'Notemd Obsidian Plugin'
        }));
    });

    test('adds GitHub API version headers for GitHub Models compatibility', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'GitHub Models',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/inference'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer github-token',
            'X-Api-Key': 'github-token',
            'X-GitHub-Api-Version': '2022-11-28'
        }));
    });

    test('adds AIHubMix compatibility headers for the hosted registry/runtime family', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'AIHubMix',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer aihubmix-key',
            'X-Api-Key': 'aihubmix-key',
            'APP-Code': 'MLTG2087'
        }));
    });

    test('detects AIHubMix compatibility headers from generic OpenAI-compatible base URLs', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenAI Compatible',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer aihubmix-key',
            'X-Api-Key': 'aihubmix-key',
            'APP-Code': 'MLTG2087'
        }));
    });

    test('detects GitHub Models compatibility headers from generic OpenAI-compatible base URLs', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenAI Compatible',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/inference'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer github-token',
            'X-Api-Key': 'github-token',
            'X-GitHub-Api-Version': '2022-11-28'
        }));
    });

    test('adds Cerebras integration headers without dropping generic auth compatibility', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'Cerebras',
            apiKey: 'cerebras-key'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer cerebras-key',
            'X-Api-Key': 'cerebras-key',
            'X-Cerebras-3rd-Party-Integration': 'notemd'
        }));
    });

    test('detects Cerebras integration headers from generic OpenAI-compatible base URLs', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenAI Compatible',
            apiKey: 'cerebras-key',
            baseUrl: 'https://api.cerebras.ai/v1'
        }));

        expect(headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer cerebras-key',
            'X-Api-Key': 'cerebras-key',
            'X-Cerebras-3rd-Party-Integration': 'notemd'
        }));
    });

    test('keeps manual/anonymous endpoints free of synthetic auth headers', () => {
        const headers = buildOpenAICompatibleProviderHeaders(createProvider({
            name: 'OpenAI Compatible',
            apiKey: ''
        }));

        expect(headers).toEqual({
            'Content-Type': 'application/json'
        });
    });
});
