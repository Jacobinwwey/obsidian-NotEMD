import {
    canonicalizeProviderConfig,
    canonicalizeProviderConfigs,
    createDefaultProviders,
    getProviderModelDiscoveryDefinition,
    getProviderSettingFields,
    getKnownModelMaxOutputTokens,
    getLLMProviderDefinition,
    getOrderedProviderNames,
    hasPersistedAdvancedProviderSettings,
    resolveProviderModelDiscoveryDefinition,
    shouldShowProviderSettingField,
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
            'Xiaomi MiMo',
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
            'AIHubMix',
            'GitHub Models',
            'PPIO',
            'New API',
            'OVMS',
            'Fireworks',
            'LiteLLM',
            'Nebius',
            'Cerebras',
            'Hugging Face',
            'Vercel AI Gateway',
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
        expect(isOpenAICompatibleProvider('AIHubMix')).toBe(true);
        expect(isOpenAICompatibleProvider('GitHub Models')).toBe(true);
        expect(isOpenAICompatibleProvider('PPIO')).toBe(true);
        expect(isOpenAICompatibleProvider('New API')).toBe(true);
        expect(isOpenAICompatibleProvider('OVMS')).toBe(true);
        expect(isOpenAICompatibleProvider('Qwen')).toBe(true);
        expect(isOpenAICompatibleProvider('Qwen Code')).toBe(true);
        expect(isOpenAICompatibleProvider('Doubao')).toBe(true);
        expect(isOpenAICompatibleProvider('Moonshot')).toBe(true);
        expect(isOpenAICompatibleProvider('Xiaomi MiMo')).toBe(true);
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
        expect(getLLMProviderDefinition('Xiaomi MiMo')).toEqual(expect.objectContaining({
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
        expect(getLLMProviderDefinition('AIHubMix')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('GitHub Models')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('PPIO')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('New API')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
        expect(getLLMProviderDefinition('OVMS')).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            apiTestMode: 'chat-only'
        }));
    });

    test('selected china-focused preset defaults stay aligned with current cline model defaults', () => {
        expect(getLLMProviderDefinition('DeepSeek')?.defaultConfig.baseUrl).toBe('https://api.deepseek.com');
        expect(getLLMProviderDefinition('DeepSeek')?.defaultConfig.model).toBe('deepseek-v4-pro');
        expect(getLLMProviderDefinition('Qwen')?.defaultConfig.model).toBe('qwen3-235b-a22b');
        expect(getLLMProviderDefinition('Moonshot')?.defaultConfig.model).toBe('kimi-k2-0905-preview');
        expect(getLLMProviderDefinition('Xiaomi MiMo')?.defaultConfig.baseUrl).toBe('https://api.xiaomimimo.com/v1');
        expect(getLLMProviderDefinition('Xiaomi MiMo')?.defaultConfig.model).toBe('mimo-v2.5-pro');
        expect(getLLMProviderDefinition('MiniMax')?.defaultConfig.model).toBe('MiniMax-M2.7');
        expect(getLLMProviderDefinition('LiteLLM')?.defaultConfig.baseUrl).toBe('http://localhost:4000/v1');
        expect(getLLMProviderDefinition('Nebius')?.defaultConfig.baseUrl).toBe('https://api.studio.nebius.com/v1');
        expect(getLLMProviderDefinition('Vercel AI Gateway')?.defaultConfig.baseUrl).toBe('https://ai-gateway.vercel.sh/v1');
        expect(getLLMProviderDefinition('AIHubMix')?.defaultConfig.baseUrl).toBe('https://aihubmix.com/v1');
        expect(getLLMProviderDefinition('GitHub Models')?.defaultConfig.baseUrl).toBe('https://models.github.ai/inference');
        expect(getLLMProviderDefinition('GitHub Models')?.defaultConfig.model).toBe('gpt-4o-mini');
        expect(getLLMProviderDefinition('PPIO')?.defaultConfig.baseUrl).toBe('https://api.ppinfra.com/v3/openai');
        expect(getLLMProviderDefinition('PPIO')?.defaultConfig.model).toBe('qwen/qwen3-32b');
        expect(getLLMProviderDefinition('New API')?.defaultConfig.baseUrl).toBe('http://localhost:3000/v1');
        expect(getLLMProviderDefinition('OVMS')?.defaultConfig.baseUrl).toBe('http://localhost:8000/v3');
        expect(getLLMProviderDefinition('OVMS')?.defaultConfig.model).toBe('openvino-model');
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
        expect(getKnownModelMaxOutputTokens('LiteLLM', 'anthropic/claude-3-7-sonnet-20250219')).toBe(128_000);
        expect(getKnownModelMaxOutputTokens('Nebius', 'openai/gpt-oss-120b')).toBe(32_766);
        expect(getKnownModelMaxOutputTokens('Cerebras', 'gpt-oss-120b')).toBe(32_766);
        expect(getKnownModelMaxOutputTokens('Cerebras', 'openai/gpt-oss-120b')).toBe(32_766);
        expect(getKnownModelMaxOutputTokens('Hugging Face', 'openai/gpt-oss-120b')).toBe(32_766);
        expect(getKnownModelMaxOutputTokens('Vercel AI Gateway', 'anthropic/claude-sonnet-4.5')).toBe(64_000);
        expect(getKnownModelMaxOutputTokens('GitHub Models', 'gpt-4o-mini')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('GitHub Models', 'openai/gpt-4o')).toBe(4_096);
        expect(getKnownModelMaxOutputTokens('AIHubMix', 'openai/gpt-4.1')).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('AIHubMix', 'deepseek/deepseek-r1')).toBe(8_000);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'anthropic/claude-sonnet-4.5')).toBe(64_000);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'openai/gpt-oss-120b')).toBe(32_766);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'qwen3-coder-plus')).toBeUndefined();
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'gpt-4o', {
            baseUrl: 'https://api.openai.com/v1'
        })).toBe(4_096);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'gpt-4.1', {
            ownerHint: 'openai'
        })).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'qwen3-coder-plus', {
            ownerHint: 'alibaba'
        })).toBe(65_536);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'qwen3-coder-plus', {
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        })).toBe(65_536);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'mimo-v2.5-pro', {
            baseUrl: 'https://api.xiaomimimo.com/v1'
        })).toBe(65_536);
        expect(getKnownModelMaxOutputTokens('Mistral', 'devstral-2512')).toBe(256_000);
        expect(getKnownModelMaxOutputTokens('xAI', 'grok-4')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('OpenRouter', 'anthropic/claude-3.7-sonnet')).toBe(64_000);
        expect(getKnownModelMaxOutputTokens('Requesty', 'anthropic/claude-3-7-sonnet-latest')).toBe(8_192);
        expect(getKnownModelMaxOutputTokens('Groq', 'moonshotai/kimi-k2-instruct-0905')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Groq', 'deepseek-r1-distill-llama-70b')).toBe(131_072);
        expect(getKnownModelMaxOutputTokens('Fireworks', 'accounts/fireworks/models/kimi-k2p5')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('Fireworks', 'accounts/fireworks/models/qwen3-vl-30b-a3b-thinking')).toBe(32_768);
        expect(getKnownModelMaxOutputTokens('Huawei Cloud MaaS', 'DeepSeek-V3')).toBe(16_384);
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'gpt-4o')).toBeUndefined();
        expect(getKnownModelMaxOutputTokens('OpenAI Compatible', 'gpt-4o', { allowGlobalConsistentFallback: true })).toBe(4_096);
        expect(getKnownModelMaxOutputTokens('OpenAI', 'unknown-model')).toBeUndefined();
        expect(getKnownModelMaxOutputTokens('Unknown Provider', 'gpt-4o')).toBeUndefined();
    });

    test('provider metadata exposes field taxonomy and first-batch discovery capabilities', () => {
        expect(getProviderSettingFields('OpenAI')).toEqual(expect.arrayContaining([
            { id: 'apiKey', group: 'core' },
            { id: 'baseUrl', group: 'core' },
            { id: 'model', group: 'core' },
            { id: 'temperature', group: 'advanced' },
            { id: 'topP', group: 'advanced' },
            { id: 'reasoningEffort', group: 'advanced' },
            { id: 'maxOutputTokens', group: 'developer' }
        ]));
        expect(getProviderSettingFields('Azure OpenAI')).toEqual(expect.arrayContaining([
            { id: 'apiVersion', group: 'core' }
        ]));
        expect(getProviderSettingFields('DeepSeek')).toEqual(expect.arrayContaining([
            { id: 'thinkingEnabled', group: 'advanced' }
        ]));

        expect(getProviderModelDiscoveryDefinition('OpenAI')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('Qwen')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('Groq')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('Fireworks')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('Anthropic')).toEqual({ mode: 'anthropic-models' });
        expect(getProviderModelDiscoveryDefinition('Together')).toEqual({ mode: 'together-models' });
        expect(getProviderModelDiscoveryDefinition('xAI')).toEqual({ mode: 'xai-language-models' });
        expect(getProviderModelDiscoveryDefinition('AIHubMix')).toEqual({ mode: 'aihubmix-models' });
        expect(getProviderModelDiscoveryDefinition('GitHub Models')).toEqual({ mode: 'github-models' });
        expect(getProviderModelDiscoveryDefinition('PPIO')).toEqual({ mode: 'ppio-models' });
        expect(getProviderModelDiscoveryDefinition('New API')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('OVMS')).toEqual({ mode: 'ovms-models' });
        expect(getProviderModelDiscoveryDefinition('OpenRouter')).toEqual({ mode: 'openrouter-models' });
        expect(getProviderModelDiscoveryDefinition('LMStudio')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('LiteLLM')).toEqual({ mode: 'litellm-proxy-models' });
        expect(getProviderModelDiscoveryDefinition('Ollama')).toEqual({ mode: 'ollama-tags' });
        expect(getProviderModelDiscoveryDefinition('Google')).toEqual({ mode: 'google-models' });
        expect(getProviderModelDiscoveryDefinition('Huawei Cloud MaaS')).toEqual({ mode: 'huaweicloud-modelarts-models' });
        expect(getProviderModelDiscoveryDefinition('Vercel AI Gateway')).toEqual({ mode: 'vercel-ai-gateway-models' });
        expect(getProviderModelDiscoveryDefinition('Hugging Face')).toEqual({ mode: 'openai-compatible-models' });
        expect(getProviderModelDiscoveryDefinition('Azure OpenAI')).toEqual(expect.objectContaining({
            mode: 'none',
            disableReasonKey: 'azureDeployment'
        }));
    });

    test('generic OpenAI-compatible discovery resolves richer endpoint families from configured base URLs', () => {
        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1',
            model: 'openai/gpt-4.1',
            temperature: 0.5
        })).toEqual({ mode: 'aihubmix-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/inference',
            model: 'gpt-4o-mini',
            temperature: 0.5
        })).toEqual({ mode: 'github-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        })).toEqual({ mode: 'openrouter-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'openai/gpt-5.4',
            temperature: 0.5
        })).toEqual({ mode: 'vercel-ai-gateway-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'xai-key',
            baseUrl: 'https://api.x.ai/v1/language-models',
            model: 'grok-4',
            temperature: 0.5
        })).toEqual({ mode: 'xai-language-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'huaweicloud-key',
            baseUrl: 'https://api.modelarts-maas.com/openai/v1',
            model: 'DeepSeek-V3',
            temperature: 0.5
        })).toEqual({ mode: 'huaweicloud-modelarts-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'together-key',
            baseUrl: 'https://api.together.xyz/v1',
            model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            temperature: 0.5
        })).toEqual({ mode: 'together-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: '',
            baseUrl: 'http://localhost:4000/v1',
            model: 'openai/gpt-4.1-mini',
            temperature: 0.5
        })).toEqual({ mode: 'litellm-proxy-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'ppio-key',
            baseUrl: 'https://api.ppinfra.com/v3/openai',
            model: 'qwen/qwen3-32b',
            temperature: 0.5
        })).toEqual({ mode: 'ppio-models' });

        expect(resolveProviderModelDiscoveryDefinition({
            name: 'OpenAI Compatible',
            apiKey: 'custom-key',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        })).toEqual({ mode: 'openai-compatible-models' });
    });

    test('canonicalizes legacy provider aliases without duplicating providers', () => {
        expect(canonicalizeProviderConfig({
            name: 'Xiaomi',
            apiKey: 'legacy-key',
            baseUrl: 'https://legacy.example/v1',
            model: 'mimo-latest',
            temperature: 0.4
        })).toEqual(expect.objectContaining({
            name: 'Xiaomi MiMo',
            apiKey: 'legacy-key',
            baseUrl: 'https://legacy.example/v1',
            model: 'mimo-latest',
            temperature: 0.4
        }));

        const canonicalized = canonicalizeProviderConfigs([
            {
                name: 'Xiaomi',
                apiKey: 'legacy-key',
                baseUrl: 'https://legacy.example/v1',
                model: 'mimo-latest',
                temperature: 0.4
            },
            {
                name: 'Xiaomi MiMo',
                apiKey: 'new-key',
                baseUrl: 'https://api.xiaomimimo.com/v1',
                model: 'mimo-v2.5-pro',
                temperature: 1
            }
        ]);

        expect(canonicalized).toHaveLength(1);
        expect(canonicalized[0]).toEqual(expect.objectContaining({
            name: 'Xiaomi MiMo',
            apiKey: 'new-key',
            model: 'mimo-v2.5-pro'
        }));
    });

    test('advanced visibility detection only expands when persisted advanced values are present', () => {
        expect(hasPersistedAdvancedProviderSettings({
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        })).toBe(false);

        expect(hasPersistedAdvancedProviderSettings({
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5,
            topP: 0.7
        })).toBe(true);

        expect(hasPersistedAdvancedProviderSettings({
            name: 'Azure OpenAI',
            apiKey: '',
            baseUrl: 'https://example.azure.com',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        })).toBe(false);

        expect(hasPersistedAdvancedProviderSettings({
            name: 'DeepSeek',
            apiKey: '',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.5,
            thinkingEnabled: true
        })).toBe(true);
    });

    test('developer-only provider fields stay hidden unless developer mode is on or a persisted override exists', () => {
        const developerField = getProviderSettingFields('OpenAI').find(field => field.id === 'maxOutputTokens');
        expect(developerField).toBeDefined();

        expect(shouldShowProviderSettingField({
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        }, developerField!, { developerMode: false })).toBe(false);

        expect(shouldShowProviderSettingField({
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        }, developerField!, { developerMode: true })).toBe(true);

        expect(shouldShowProviderSettingField({
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5,
            maxOutputTokens: 4096
        }, developerField!, { developerMode: false })).toBe(true);
    });
});
