import {
    createDefaultProviders,
    getLLMProviderDefinition,
    getOrderedProviderNames,
    isOpenAICompatibleProvider
} from '../llmProviders';

describe('llmProviders registry', () => {
    test('default provider presets include the expanded provider set', () => {
        const providers = createDefaultProviders();
        const providerNames = providers.map(provider => provider.name);

        expect(providerNames).toEqual(expect.arrayContaining([
            'DeepSeek',
            'Qwen',
            'Doubao',
            'Moonshot',
            'GLM',
            'MiniMax',
            'OpenAI',
            'Anthropic',
            'Google',
            'Mistral',
            'Azure OpenAI',
            'OpenRouter',
            'xAI',
            'Groq',
            'Together',
            'Fireworks',
            'Requesty',
            'OpenAI Compatible',
            'LMStudio',
            'Ollama'
        ]));
    });

    test('provider ordering follows registry order instead of plain alphabetical sorting', () => {
        const ordered = getOrderedProviderNames([
            { name: 'Ollama', apiKey: '', baseUrl: '', model: '', temperature: 0 },
            { name: 'Groq', apiKey: '', baseUrl: '', model: '', temperature: 0 },
            { name: 'Anthropic', apiKey: '', baseUrl: '', model: '', temperature: 0 },
            { name: 'OpenAI Compatible', apiKey: '', baseUrl: '', model: '', temperature: 0 }
        ]);

        expect(ordered).toEqual(['Anthropic', 'Groq', 'OpenAI Compatible', 'Ollama']);
    });

    test('registry exposes provider transport metadata', () => {
        expect(isOpenAICompatibleProvider('Groq')).toBe(true);
        expect(isOpenAICompatibleProvider('Requesty')).toBe(true);
        expect(isOpenAICompatibleProvider('Qwen')).toBe(true);
        expect(isOpenAICompatibleProvider('Doubao')).toBe(true);
        expect(isOpenAICompatibleProvider('Moonshot')).toBe(true);
        expect(isOpenAICompatibleProvider('GLM')).toBe(true);
        expect(isOpenAICompatibleProvider('MiniMax')).toBe(true);
        expect(isOpenAICompatibleProvider('Anthropic')).toBe(false);
        expect(getLLMProviderDefinition('Ollama')?.transport).toBe('ollama');
    });

    test('china-focused provider presets expose chat-first API test metadata', () => {
        expect(getLLMProviderDefinition('Qwen')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('Doubao')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('Moonshot')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('GLM')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('MiniMax')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
    });
});
