import {
    createDefaultProviders,
    getKnownModelMaxOutputTokens,
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
        expect(getLLMProviderDefinition('DeepSeek')?.defaultConfig.baseUrl).toBe('https://api.deepseek.com');
        expect(getLLMProviderDefinition('DeepSeek')?.defaultConfig.model).toBe('deepseek-v4-pro');
        expect(getLLMProviderDefinition('Qwen')?.defaultConfig.model).toBe('qwen3-235b-a22b');
        expect(getLLMProviderDefinition('Moonshot')?.defaultConfig.model).toBe('kimi-k2-0905-preview');
        expect(getLLMProviderDefinition('MiniMax')?.defaultConfig.model).toBe('MiniMax-M2.7');
    });

    test('known model metadata exposes cline-aligned max output token caps per provider/model pair', () => {
        expect(getKnownModelMaxOutputTokens('OpenAI', 'gpt-4o')).toBe(4_096);
        expect(getKnownModelMaxOutputTokens('OpenAI', 'gpt-4.1')).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('DeepSeek', 'deepseek-v3')).toBe(8_000);
        expect(getKnownModelMaxOutputTokens('DeepSeek', 'deepseek-r1')).toBe(8_000);
        expect(getKnownModelMaxOutputTokens('Anthropic', 'claude-3-5-sonnet-20240620')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('Anthropic', 'claude-sonnet-4-6')).toBe(64_000);
        expect(getKnownModelMaxOutputTokens('Google', 'gemini-2.0-flash-exp')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('Google', 'gemini-2.5-pro')).toBe(65_536);
        expect(getKnownModelMaxOutputTokens('Azure OpenAI', 'gpt-4o')).toBe(4_096);
        expect(getKnownModelMaxOutputTokens('Qwen', 'qwen3-235b-a22b')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Qwen', 'qwen-plus')).toBe(129_024);
        expect(getKnownModelMaxOutputTokens('Qwen Code', 'qwen3-coder-plus')).toBe(65_536);
        expect(getKnownModelMaxOutputTokens('Doubao', 'deepseek-r1-250120')).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('Moonshot', 'kimi-k2-0905-preview')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Moonshot', 'kimi-k2.5')).toBe(32_000);
        expect(getKnownModelMaxOutputTokens('GLM', 'glm-5')).toBe(128_000);
        expect(getKnownModelMaxOutputTokens('Z AI', 'glm-5')).toBe(128_000);
        expect(getKnownModelMaxOutputTokens('MiniMax', 'MiniMax-M2.7')).toBe(128_000);
        expect(getKnownModelMaxOutputTokens('Mistral', 'devstral-2512')).toBe(256_000);
        expect(getKnownModelMaxOutputTokens('xAI', 'grok-4')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('OpenRouter', 'anthropic/claude-3.7-sonnet')).toBe(64_000);
        expect(getKnownModelMaxOutputTokens('Requesty', 'anthropic/claude-3-7-sonnet-latest')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('Groq', 'moonshotai/kimi-k2-instruct-0905')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Groq', 'deepseek-r1-distill-llama-70b')).toBe(131_072);
        expect(getKnownModelMaxOutputTokens('Fireworks', 'accounts/fireworks/models/kimi-k2p5')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Fireworks', 'accounts/fireworks/models/qwen3-vl-30b-a3b-thinking')).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('Huawei Cloud MaaS', 'DeepSeek-V3')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('OpenAI', 'unknown-model')).toBeUndefined();
        expect(getKnownModelMaxOutputTokens('Unknown Provider', 'gpt-4o')).toBeUndefined();
    });
});
