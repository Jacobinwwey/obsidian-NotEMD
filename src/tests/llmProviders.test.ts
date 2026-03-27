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
            'Qwen Code',
            'Doubao',
            'Moonshot',
            'GLM',
            'Z AI',
            'MiniMax',
            'Baidu Qianfan',
            'SiliconFlow',
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
            'Huawei Cloud MaaS',
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
        expect(isOpenAICompatibleProvider('Qwen Code')).toBe(true);
        expect(isOpenAICompatibleProvider('Doubao')).toBe(true);
        expect(isOpenAICompatibleProvider('Moonshot')).toBe(true);
        expect(isOpenAICompatibleProvider('GLM')).toBe(true);
        expect(isOpenAICompatibleProvider('Z AI')).toBe(true);
        expect(isOpenAICompatibleProvider('MiniMax')).toBe(true);
        expect(isOpenAICompatibleProvider('Baidu Qianfan')).toBe(true);
        expect(isOpenAICompatibleProvider('SiliconFlow')).toBe(true);
        expect(isOpenAICompatibleProvider('Huawei Cloud MaaS')).toBe(true);
        expect(isOpenAICompatibleProvider('Anthropic')).toBe(false);
        expect(getLLMProviderDefinition('Ollama')?.transport).toBe('ollama');
    });

    test('china-focused provider presets expose chat-first API test metadata', () => {
        expect(getLLMProviderDefinition('Qwen')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('Qwen Code')).toEqual(expect.objectContaining({
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
        expect(getLLMProviderDefinition('Z AI')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('MiniMax')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('Baidu Qianfan')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('SiliconFlow')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('Huawei Cloud MaaS')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
    });

    test('selected china-focused preset defaults stay aligned with current cline model defaults', () => {
        expect(getLLMProviderDefinition('Qwen')?.defaultConfig.model).toBe('qwen3-235b-a22b');
        expect(getLLMProviderDefinition('Moonshot')?.defaultConfig.model).toBe('kimi-k2-0905-preview');
        expect(getLLMProviderDefinition('MiniMax')?.defaultConfig.model).toBe('MiniMax-M2.7');
    });
});
