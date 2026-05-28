import { LLMProviderConfig } from './types';
import {
    detectOpenAICompatibleEndpointFamily,
    inferKnownOpenAICompatibleProviderNames
} from './openaiCompatibleEndpointFamily';

export type LLMProviderCategory = 'cloud' | 'gateway' | 'local';
export type LLMProviderTransport = 'openai-compatible' | 'anthropic' | 'google' | 'azure-openai' | 'ollama';
export type LLMProviderApiKeyMode = 'required' | 'optional' | 'none';
export type LLMProviderApiTestMode = 'models-then-chat' | 'chat-only';
export type LLMProviderValidationLevel = 'warning' | 'error';
export type LLMProviderSettingFieldId =
    | 'apiKey'
    | 'baseUrl'
    | 'model'
    | 'temperature'
    | 'topP'
    | 'reasoningEffort'
    | 'thinkingEnabled'
    | 'apiVersion'
    | 'maxOutputTokens';
export type LLMProviderSettingFieldGroup = 'core' | 'contextual' | 'advanced' | 'developer';
export type LLMProviderModelDiscoveryMode =
    | 'none'
    | 'aihubmix-models'
    | 'github-models'
    | 'ppio-models'
    | 'ovms-models'
    | 'openai-compatible-models'
    | 'openrouter-models'
    | 'litellm-proxy-models'
    | 'huaweicloud-modelarts-models'
    | 'anthropic-models'
    | 'together-models'
    | 'vercel-ai-gateway-models'
    | 'ollama-tags'
    | 'google-models'
    | 'xai-language-models';

export interface LLMProviderSettingFieldDefinition {
    id: LLMProviderSettingFieldId;
    group: LLMProviderSettingFieldGroup;
}

export interface LLMProviderModelDiscoveryDefinition {
    mode: LLMProviderModelDiscoveryMode;
    disableReasonKey?: 'azureDeployment' | 'liteLlmProxy' | 'huaweicloudDeployment';
}

export interface LLMProviderDefinition {
    name: string;
    category: LLMProviderCategory;
    transport: LLMProviderTransport;
    apiKeyMode: LLMProviderApiKeyMode;
    apiTestMode: LLMProviderApiTestMode;
    description: string;
    setupHint: string;
    defaultConfig: LLMProviderConfig;
    settingFields: LLMProviderSettingFieldDefinition[];
    modelDiscovery: LLMProviderModelDiscoveryDefinition;
}

export interface LLMProviderValidationIssue {
    level: LLMProviderValidationLevel;
    message: string;
}

const DEEPSEEK_RECOMMENDED_THINKING_OUTPUT_TOKENS = 8000;
const PROVIDER_NAME_ALIASES = new Map<string, string>([
    ['Xiaomi', 'Xiaomi MiMo']
]);
const PROVIDER_NAMES_ALLOWING_GLOBAL_CONSISTENT_MODEL_TOKEN_FALLBACK = new Set([
    'AIHubMix',
    'GitHub Models',
    'PPIO'
]);
const MODEL_PROVIDER_PREFIX_ALIASES = new Map<string, string[]>([
    ['alibaba', ['Qwen']],
    ['anthropic', ['Anthropic']],
    ['deepseek', ['DeepSeek']],
    ['deepseek-ai', ['DeepSeek']],
    ['gemini', ['Google']],
    ['google', ['Google']],
    ['minimax', ['MiniMax']],
    ['mistral', ['Mistral']],
    ['mistralai', ['Mistral']],
    ['moonshot', ['Moonshot']],
    ['moonshotai', ['Moonshot']],
    ['openai', ['OpenAI']],
    ['qwen', ['Qwen', 'Qwen Code']],
    ['x-ai', ['xAI']],
    ['xai', ['xAI']],
    ['xiaomi', ['Xiaomi MiMo']],
    ['z-ai', ['Z AI']],
    ['zai', ['Z AI']]
]);
const OPENAI_COMPATIBLE_REASONING_PROVIDER_NAMES = new Set([
    'DeepSeek',
    'OpenAI',
    'OpenAI Compatible',
    'Azure OpenAI'
]);
const OPENAI_COMPATIBLE_MODEL_DISCOVERY_PROVIDER_NAMES = new Set([
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
    'LMStudio',
    'OpenAI',
    'Mistral',
    'Groq',
    'Fireworks',
    'LiteLLM',
    'Nebius',
    'Cerebras',
    'Hugging Face',
    'OpenRouter',
    'xAI',
    'Requesty',
    'GitHub Models',
    'New API',
    'OpenAI Compatible'
]);

type ProviderDefinitionInput = Omit<LLMProviderDefinition, 'settingFields' | 'modelDiscovery'>;

const KNOWN_MODEL_MAX_OUTPUT_TOKENS: Partial<Record<string, Record<string, number>>> = {
    'DeepSeek': {
        'deepseek-chat': 384_000,
        'deepseek-reasoner': 384_000,
        'deepseek-v4-flash': 384_000,
        'deepseek-v4-pro': 384_000,
        'deepseek-v3': 8_000,
        'deepseek-r1': 8_000
    },
    'OpenAI': {
        'chatgpt-4o-latest': 16_384,
        'gpt-4.1': 32_768,
        'gpt-4.1-mini': 32_768,
        'gpt-4.1-nano': 32_768,
        'gpt-4o': 4_096,
        'gpt-4o-mini': 16_384,
        'gpt-5-2025-08-07': 8_192,
        'gpt-5-chat-latest': 8_192,
        'gpt-5-codex': 8_192,
        'gpt-5-mini-2025-08-07': 8_192,
        'gpt-5-nano-2025-08-07': 8_192,
        'gpt-5.1': 8_192,
        'gpt-5.1-2025-11-13': 8_192,
        'gpt-5.1-chat-latest': 8_192,
        'gpt-5.1-codex': 8_192,
        'gpt-5.2': 8_192,
        'gpt-5.2-codex': 8_192,
        'o1-mini': 65_536,
        'o1-preview': 32_768,
        'o3-mini': 100_000,
        'o4-mini': 100_000
    },
    'Anthropic': {
        'claude-3-5-sonnet-20240620': 8_192,
        'claude-3-5-haiku-20241022': 8_192,
        'claude-3-5-sonnet-20241022': 8_192,
        'claude-3-7-sonnet-20250219': 128_000,
        'claude-3-haiku-20240307': 4_096,
        'claude-3-opus-20240229': 4_096,
        'claude-haiku-4-5-20251001': 64_000,
        'claude-opus-4-1-20250805': 32_000,
        'claude-opus-4-20250514': 32_000,
        'claude-opus-4-5-20251101': 64_000,
        'claude-opus-4-6': 128_000,
        'claude-opus-4-6:1m': 128_000,
        'claude-opus-4-6:1m:fast': 128_000,
        'claude-opus-4-6:fast': 128_000,
        'claude-opus-4-7': 128_000,
        'claude-opus-4-7:1m': 128_000,
        'claude-sonnet-4-20250514': 64_000,
        'claude-sonnet-4-20250514:1m': 64_000,
        'claude-sonnet-4-5-20250929': 64_000,
        'claude-sonnet-4-5-20250929:1m': 64_000,
        'claude-sonnet-4-6': 64_000,
        'claude-sonnet-4-6:1m': 64_000
    },
    'Google': {
        'gemini-1.5-flash-002': 8_192,
        'gemini-1.5-flash-8b-exp-0827': 8_192,
        'gemini-1.5-flash-exp-0827': 8_192,
        'gemini-1.5-pro-002': 8_192,
        'gemini-1.5-pro-exp-0827': 8_192,
        'gemini-2.0-flash-001': 8_192,
        'gemini-2.0-flash-exp': 8_192,
        'gemini-2.0-flash-lite-preview-02-05': 8_192,
        'gemini-2.0-flash-thinking-exp-01-21': 65_536,
        'gemini-2.0-flash-thinking-exp-1219': 8_192,
        'gemini-2.0-pro-exp-02-05': 8_192,
        'gemini-2.5-flash': 65_536,
        'gemini-2.5-flash-lite-preview-06-17': 64_000,
        'gemini-2.5-pro': 65_536,
        'gemini-3-flash-preview': 65_536,
        'gemini-3-pro-preview': 65_536,
        'gemini-3.1-pro-preview': 65_536,
        'gemini-exp-1206': 8_192
    },
    'Azure OpenAI': {
        'chatgpt-4o-latest': 16_384,
        'gpt-4.1': 32_768,
        'gpt-4.1-mini': 32_768,
        'gpt-4.1-nano': 32_768,
        'gpt-4o': 4_096,
        'gpt-4o-mini': 16_384
    },
    'Qwen': {
        'deepseek-r1': 8_000,
        'deepseek-v3': 8_000,
        'qwen-coder-plus': 129_024,
        'qwen-coder-plus-latest': 129_024,
        'qwen-max': 30_720,
        'qwen-max-latest': 30_720,
        'qwen-plus': 129_024,
        'qwen-plus-latest': 16_384,
        'qwen-turbo': 1_000_000,
        'qwen-turbo-latest': 16_384,
        'qwen-vl-max': 30_720,
        'qwen-vl-max-latest': 129_024,
        'qwen-vl-plus': 6_000,
        'qwen-vl-plus-latest': 129_024,
        'qwen2.5-coder-0.5b-instruct': 8_192,
        'qwen2.5-coder-1.5b-instruct': 8_192,
        'qwen2.5-coder-14b-instruct': 8_192,
        'qwen2.5-coder-32b-instruct': 8_192,
        'qwen2.5-coder-3b-instruct': 8_192,
        'qwen2.5-coder-7b-instruct': 8_192,
        'qwen3-0.6b': 8_192,
        'qwen3-1.7b': 8_192,
        'qwen3-14b': 8_192,
        'qwen3-235b-a22b': 16_384,
        'qwen3-30b-a3b': 16_384,
        'qwen3-32b': 16_384,
        'qwen3-4b': 8_192,
        'qwen3-8b': 8_192,
        'qwen3-coder-480b-a35b-instruct': 65_536,
        'qwen3-coder-plus': 65_536,
        'qwq-plus': 8_192,
        'qwq-plus-latest': 8_192
    },
    'Qwen Code': {
        'qwen3-coder-flash': 65_536,
        'qwen3-coder-plus': 65_536
    },
    'Doubao': {
        'deepseek-r1-250120': 32_768,
        'deepseek-v3-250324': 12_288,
        'doubao-1-5-pro-256k-250115': 12_288,
        'doubao-1-5-pro-32k-250115': 12_288
    },
    'Moonshot': {
        'kimi-k2-0711-preview': 32_000,
        'kimi-k2-0905-preview': 16_384,
        'kimi-k2-thinking': 32_000,
        'kimi-k2-thinking-turbo': 32_000,
        'kimi-k2-turbo-preview': 32_000,
        'kimi-k2.5': 32_000
    },
    'Xiaomi MiMo': {
        'mimo-latest': 32_768,
        'mimo-v2.5-pro': 65_536,
        'mimo-v2.5': 65_536,
        'mimo-v2-omni': 65_536
    },
    'GLM': {
        'glm-4.5': 98_304,
        'glm-4.5-air': 98_304,
        'glm-4.6': 128_000,
        'glm-4.7': 131_000,
        'glm-5': 128_000,
        'glm-5.1': 128_000
    },
    'Z AI': {
        'glm-4.5': 98_304,
        'glm-4.5-air': 98_304,
        'glm-4.6': 128_000,
        'glm-4.7': 131_000,
        'glm-5': 128_000,
        'glm-5.1': 128_000
    },
    'MiniMax': {
        'minimax-m2': 128_000,
        'minimax-m2.1': 128_000,
        'minimax-m2.1-lightning': 128_000,
        'minimax-m2.5': 128_000,
        'minimax-m2.5-highspeed': 128_000,
        'minimax-m2.7': 128_000,
        'minimax-m2.7-highspeed': 128_000
    },
    'LiteLLM': {
        'anthropic/claude-3-7-sonnet-20250219': 128_000
    },
    'Nebius': {
        'deepseek-ai/deepseek-r1-0528': 128_000,
        'openai/gpt-oss-120b': 32_766,
        'qwen/qwen2.5-32b-instruct-fast': 8_192,
        'qwen/qwen2.5-coder-32b-instruct-fast': 128_000,
        'qwen/qwen3-coder-480b-a35b-instruct': 163_800
    },
    'Cerebras': {
        'gpt-oss-120b': 32_766,
        'openai/gpt-oss-120b': 32_766,
        'openai/gpt-oss-20b': 32_766,
        'qwen-3-235b-a22b-instruct-2507': 64_000,
        'zai-glm-4.7': 40_000
    },
    'Hugging Face': {
        'deepseek-ai/deepseek-r1-0528': 64_000,
        'moonshotai/kimi-k2-instruct': 131_072,
        'openai/gpt-oss-120b': 32_766,
        'openai/gpt-oss-20b': 32_766
    },
    'Vercel AI Gateway': {
        'anthropic/claude-sonnet-4.5': 64_000
    },
    'OpenRouter': {
        'anthropic/claude-opus-4.6': 128_000,
        'anthropic/claude-opus-4.6:1m': 128_000,
        'anthropic/claude-sonnet-4.5': 64_000,
        'anthropic/claude-sonnet-4.5:1m': 64_000,
        'anthropic/claude-3.7-sonnet': 64_000,
        'anthropic/claude-3-7-sonnet': 64_000,
        'anthropic/claude-3.7-sonnet:beta': 64_000,
        'anthropic/claude-3-7-sonnet:beta': 64_000,
        'anthropic/claude-3.7-sonnet:thinking': 64_000,
        'anthropic/claude-3.5-sonnet': 8_192,
        'anthropic/claude-3.5-sonnet:beta': 8_192,
        'anthropic/claude-3.5-sonnet-20240620': 8_192,
        'anthropic/claude-3.5-sonnet-20240620:beta': 8_192,
        'google/gemini-2.0-flash-exp': 8_192,
        'openai/gpt-oss-120b:exacto': 32_766,
        'qwen/qwen3-coder': 65_536
    },
    'Requesty': {
        'anthropic/claude-3-7-sonnet-latest': 8_192,
        'anthropic/claude-sonnet-4.5': 64_000
    },
    'Mistral': {
        'codestral-2501': 256_000,
        'devstral-2512': 256_000,
        'devstral-medium-latest': 128_000,
        'devstral-small-2505': 128_000,
        'labs-devstral-small-2512': 256_000,
        'ministral-14b-2512': 256_000,
        'ministral-3b-2410': 128_000,
        'ministral-8b-2410': 128_000,
        'mistral-large-2411': 128_000,
        'mistral-large-2512': 256_000,
        'mistral-medium-latest': 128_000,
        'mistral-small-2501': 32_000,
        'mistral-small-latest': 128_000,
        'open-codestral-mamba': 256_000,
        'open-mistral-nemo-2407': 128_000,
        'pixtral-12b-2409': 128_000,
        'pixtral-large-2411': 131_000
    },
    'xAI': {
        'grok-2': 8_192,
        'grok-2-1212': 8_192,
        'grok-2-latest': 8_192,
        'grok-2-vision': 8_192,
        'grok-2-vision-1212': 8_192,
        'grok-2-vision-latest': 8_192,
        'grok-3': 8_192,
        'grok-3-beta': 8_192,
        'grok-3-fast': 8_192,
        'grok-3-fast-beta': 8_192,
        'grok-3-mini': 8_192,
        'grok-3-mini-beta': 8_192,
        'grok-3-mini-fast': 8_192,
        'grok-3-mini-fast-beta': 8_192,
        'grok-4': 8_192,
        'grok-4-fast-reasoning': 30_000,
        'grok-beta': 8_192,
        'grok-vision-beta': 8_192
    },
    'Groq': {
        'compound-beta': 8_192,
        'compound-beta-mini': 8_192,
        'deepseek-r1-distill-llama-70b': 131_072,
        'llama-3.1-8b-instant': 131_072,
        'llama-3.3-70b-versatile': 32_768,
        'meta-llama/llama-4-maverick-17b-128e-instruct': 8_192,
        'meta-llama/llama-4-scout-17b-16e-instruct': 8_192,
        'moonshotai/kimi-k2-instruct': 16_384,
        'moonshotai/kimi-k2-instruct-0905': 16_384,
        'openai/gpt-oss-120b': 32_766,
        'openai/gpt-oss-20b': 32_766
    },
    'Fireworks': {
        'accounts/fireworks/models/deepseek-v3p2': 16_384,
        'accounts/fireworks/models/glm-4p7': 16_384,
        'accounts/fireworks/models/glm-5': 16_384,
        'accounts/fireworks/models/gpt-oss-120b': 16_384,
        'accounts/fireworks/models/kimi-k2p5': 16_384,
        'accounts/fireworks/models/minimax-m2p1': 16_384,
        'accounts/fireworks/models/minimax-m2p5': 16_384,
        'accounts/fireworks/models/qwen3-vl-30b-a3b-instruct': 32_768,
        'accounts/fireworks/models/qwen3-vl-30b-a3b-thinking': 32_768
    },
    'Huawei Cloud MaaS': {
        'deepseek-r1': 16_384,
        'deepseek-r1-250528': 16_384,
        'deepseek-v3': 16_384,
        'qwen3-235b-a22b': 8_192,
        'qwen3-32b': 8_192
    }
};

function supportsReasoningEffortSetting(definition: ProviderDefinitionInput): boolean {
    return OPENAI_COMPATIBLE_REASONING_PROVIDER_NAMES.has(definition.name);
}

function resolveModelDiscoveryMode(definition: ProviderDefinitionInput): LLMProviderModelDiscoveryDefinition {
    if (definition.transport === 'ollama') {
        return { mode: 'ollama-tags' };
    }

    if (definition.transport === 'google') {
        return { mode: 'google-models' };
    }

    if (definition.transport === 'anthropic') {
        return { mode: 'anthropic-models' };
    }

    if (definition.name === 'Huawei Cloud MaaS') {
        return { mode: 'huaweicloud-modelarts-models' };
    }

    if (definition.name === 'Together') {
        return { mode: 'together-models' };
    }

    if (definition.name === 'AIHubMix') {
        return { mode: 'aihubmix-models' };
    }

    if (definition.name === 'GitHub Models') {
        return { mode: 'github-models' };
    }

    if (definition.name === 'PPIO') {
        return { mode: 'ppio-models' };
    }

    if (definition.name === 'OVMS') {
        return { mode: 'ovms-models' };
    }

    if (definition.name === 'OpenRouter') {
        return { mode: 'openrouter-models' };
    }

    if (definition.name === 'LiteLLM') {
        return { mode: 'litellm-proxy-models' };
    }

    if (definition.name === 'Vercel AI Gateway') {
        return { mode: 'vercel-ai-gateway-models' };
    }

    if (definition.name === 'xAI') {
        return { mode: 'xai-language-models' };
    }

    if (definition.transport === 'openai-compatible' && OPENAI_COMPATIBLE_MODEL_DISCOVERY_PROVIDER_NAMES.has(definition.name)) {
        return { mode: 'openai-compatible-models' };
    }

    switch (definition.name) {
        case 'Azure OpenAI':
            return {
                mode: 'none',
                disableReasonKey: 'azureDeployment'
            };
        default:
            return { mode: 'none' };
    }
}

function buildProviderSettingFields(definition: ProviderDefinitionInput): LLMProviderSettingFieldDefinition[] {
    const fields: LLMProviderSettingFieldDefinition[] = [];

    if (definition.apiKeyMode !== 'none') {
        fields.push({ id: 'apiKey', group: 'core' });
    }

    fields.push(
        { id: 'baseUrl', group: 'core' },
        { id: 'model', group: 'core' }
    );

    if (definition.transport === 'azure-openai') {
        fields.push({ id: 'apiVersion', group: 'core' });
    }

    fields.push({ id: 'temperature', group: 'advanced' });

    if (definition.transport === 'openai-compatible') {
        fields.push({ id: 'topP', group: 'advanced' });
    }

    if (supportsReasoningEffortSetting(definition)) {
        fields.push({ id: 'reasoningEffort', group: 'advanced' });
    }

    if (definition.name === 'DeepSeek') {
        fields.push({ id: 'thinkingEnabled', group: 'advanced' });
    }

    fields.push({ id: 'maxOutputTokens', group: 'developer' });

    return fields;
}

function createProviderDefinition(definition: ProviderDefinitionInput): LLMProviderDefinition {
    return {
        ...definition,
        settingFields: buildProviderSettingFields(definition),
        modelDiscovery: resolveModelDiscoveryMode(definition)
    };
}

const RAW_LLM_PROVIDER_DEFINITIONS: ProviderDefinitionInput[] = [
    {
        name: 'DeepSeek',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'DeepSeek native OpenAI-compatible endpoint for current V4 chat/reasoning models.',
        setupHint: 'Use the official base URL https://api.deepseek.com with current model IDs such as deepseek-v4-pro or deepseek-v4-flash. Legacy aliases deepseek-chat and deepseek-reasoner are being retired upstream.',
        defaultConfig: {
            name: 'DeepSeek',
            apiKey: '',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.5
        }
    },
    {
        name: 'Qwen',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Alibaba Cloud DashScope compatible-mode endpoint for Qwen and QwQ models.',
        setupHint: 'Use DashScope Qwen model IDs such as qwen3-235b-a22b, qwen3-32b, qwen-plus, qwen-max or qwq-plus.',
        defaultConfig: {
            name: 'Qwen',
            apiKey: '',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen3-235b-a22b',
            temperature: 0.3
        }
    },
    {
        name: 'Qwen Code',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Alibaba Cloud DashScope coding-focused compatible endpoint for Qwen coder models.',
        setupHint: 'Use DashScope coding model IDs such as qwen3-coder-plus or other Qwen Code models available in your account.',
        defaultConfig: {
            name: 'Qwen Code',
            apiKey: '',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen3-coder-plus',
            temperature: 0.2
        }
    },
    {
        name: 'Doubao',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Volcengine Ark compatible endpoint for Doubao and other ByteDance-hosted models.',
        setupHint: 'Use your Ark endpoint ID in the model field, for example ep-xxxxxxxxxxxxxxxx, or a model ID supported by your Ark deployment.',
        defaultConfig: {
            name: 'Doubao',
            apiKey: '',
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'ep-xxxxxxxxxxxxxxxx',
            temperature: 0.3
        }
    },
    {
        name: 'Moonshot',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Moonshot AI Kimi endpoint with native OpenAI-style chat and model listing.',
        setupHint: 'Use Moonshot-hosted Kimi model IDs such as kimi-k2-0905-preview, kimi-k2.5 or kimi-k2-thinking.',
        defaultConfig: {
            name: 'Moonshot',
            apiKey: '',
            baseUrl: 'https://api.moonshot.cn/v1',
            model: 'kimi-k2-0905-preview',
            temperature: 0.3
        }
    },
    {
        name: 'Xiaomi MiMo',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Xiaomi MiMo OpenAI-compatible endpoint for MiMo chat, coding, and multimodal models.',
        setupHint: 'Use the MiMo OpenAI-compatible base URL such as https://api.xiaomimimo.com/v1 or your token-plan endpoint, with model IDs like mimo-v2.5-pro.',
        defaultConfig: {
            name: 'Xiaomi MiMo',
            apiKey: '',
            baseUrl: 'https://api.xiaomimimo.com/v1',
            model: 'mimo-v2.5-pro',
            temperature: 1.0
        }
    },
    {
        name: 'GLM',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Zhipu BigModel OpenAI-compatible endpoint for GLM models.',
        setupHint: 'Use BigModel model IDs such as glm-5 or other GLM models available in your account.',
        defaultConfig: {
            name: 'GLM',
            apiKey: '',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            model: 'glm-5',
            temperature: 0.3
        }
    },
    {
        name: 'Z AI',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'International Z AI endpoint for GLM/Zhipu models through the OpenAI-compatible API.',
        setupHint: 'Use Z AI model IDs such as glm-5 on the international endpoint. Keep using the GLM preset for the mainland China BigModel endpoint.',
        defaultConfig: {
            name: 'Z AI',
            apiKey: '',
            baseUrl: 'https://api.z.ai/api/paas/v4',
            model: 'glm-5',
            temperature: 0.3
        }
    },
    {
        name: 'MiniMax',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'MiniMax chat completions endpoint for domestic MiniMax text models.',
        setupHint: 'Use MiniMax text/chat models such as MiniMax-M2.7, MiniMax-M2.5 or their highspeed variants.',
        defaultConfig: {
            name: 'MiniMax',
            apiKey: '',
            baseUrl: 'https://api.minimaxi.com/v1',
            model: 'MiniMax-M2.7',
            temperature: 0.3
        }
    },
    {
        name: 'Baidu Qianfan',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Baidu Qianfan OpenAI-compatible endpoint for ERNIE and other hosted models.',
        setupHint: 'Use Qianfan model IDs such as ernie-4.5-turbo-32k or other Qianfan-hosted models available in your account.',
        defaultConfig: {
            name: 'Baidu Qianfan',
            apiKey: '',
            baseUrl: 'https://qianfan.baidubce.com/v2',
            model: 'ernie-4.5-turbo-32k',
            temperature: 0.3
        }
    },
    {
        name: 'SiliconFlow',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'SiliconFlow OpenAI-compatible endpoint for hosted OSS models and reasoning models.',
        setupHint: 'Use SiliconFlow model IDs such as Qwen/QwQ-32B, DeepSeek-R1, or other SiliconFlow-hosted model names.',
        defaultConfig: {
            name: 'SiliconFlow',
            apiKey: '',
            baseUrl: 'https://api.siliconflow.cn/v1',
            model: 'Qwen/QwQ-32B',
            temperature: 0.3
        }
    },
    {
        name: 'Huawei Cloud MaaS',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Huawei Cloud ModelArts MaaS endpoint for hosted DeepSeek, Qwen, and other models.',
        setupHint: 'Use a Huawei Cloud MaaS model ID such as DeepSeek-V3 or another model exposed by your ModelArts MaaS deployment.',
        defaultConfig: {
            name: 'Huawei Cloud MaaS',
            apiKey: '',
            baseUrl: 'https://api.modelarts-maas.com/v1',
            model: 'DeepSeek-V3',
            temperature: 0.3
        }
    },
    {
        name: 'OpenAI',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Official OpenAI-compatible endpoint with o-series safeguards.',
        setupHint: 'Use for OpenAI-hosted GPT/o-series models or Azure-compatible OpenAI-style gateways that do not need Azure deployment mode.',
        defaultConfig: {
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        }
    },
    {
        name: 'Anthropic',
        category: 'cloud',
        transport: 'anthropic',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Anthropic Messages API for Claude models.',
        setupHint: 'Use for Claude models on the native Anthropic endpoint.',
        defaultConfig: {
            name: 'Anthropic',
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        }
    },
    {
        name: 'Google',
        category: 'cloud',
        transport: 'google',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Google Gemini Generative Language API.',
        setupHint: 'Use for Gemini-hosted models on the native Google endpoint.',
        defaultConfig: {
            name: 'Google',
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1',
            model: 'gemini-2.0-flash-exp',
            temperature: 0.5
        }
    },
    {
        name: 'Mistral',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Official Mistral chat completions endpoint.',
        setupHint: 'Use for Mistral-hosted models such as mistral-large-latest and codestral variants.',
        defaultConfig: {
            name: 'Mistral',
            apiKey: '',
            baseUrl: 'https://api.mistral.ai/v1',
            model: 'mistral-large-latest',
            temperature: 0.5
        }
    },
    {
        name: 'Azure OpenAI',
        category: 'cloud',
        transport: 'azure-openai',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Azure OpenAI deployment mode with API version support.',
        setupHint: 'Use when your endpoint requires Azure deployment names plus api-version.',
        defaultConfig: {
            name: 'Azure OpenAI',
            apiKey: '',
            baseUrl: '',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        }
    },
    {
        name: 'OpenRouter',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'OpenRouter gateway for many hosted models across providers.',
        setupHint: 'Use full OpenRouter model IDs such as anthropic/claude-3.7-sonnet or google/gemini-2.5-pro.',
        defaultConfig: {
            name: 'OpenRouter',
            apiKey: '',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'anthropic/claude-3.7-sonnet',
            temperature: 0.7
        }
    },
    {
        name: 'xAI',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'xAI Grok models through the native xAI endpoint.',
        setupHint: 'Use for Grok models such as grok-4 and grok-code-fast-1.',
        defaultConfig: {
            name: 'xAI',
            apiKey: '',
            baseUrl: 'https://api.x.ai/v1',
            model: 'grok-4',
            temperature: 0.7
        }
    },
    {
        name: 'Groq',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Groq OpenAI-compatible endpoint for very low-latency inference.',
        setupHint: 'Good fit for fast hosted OSS models on Groq, including Kimi, GPT-OSS, Llama and DeepSeek variants.',
        defaultConfig: {
            name: 'Groq',
            apiKey: '',
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'moonshotai/kimi-k2-instruct-0905',
            temperature: 0.3
        }
    },
    {
        name: 'Together',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Together AI OpenAI-compatible endpoint for hosted OSS models.',
        setupHint: 'Enter any Together model ID you have access to; the endpoint is OpenAI-compatible.',
        defaultConfig: {
            name: 'Together',
            apiKey: '',
            baseUrl: 'https://api.together.xyz/v1',
            model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            temperature: 0.5
        }
    },
    {
        name: 'AIHubMix',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'AIHubMix unified OpenAI-compatible gateway for GPT, Claude, Gemini, DeepSeek, Qwen, and other hosted models.',
        setupHint: 'Use the official AIHubMix OpenAI-compatible base URL https://aihubmix.com/v1 with a model ID available to your account, such as gpt-4o-mini or gpt-5.',
        defaultConfig: {
            name: 'AIHubMix',
            apiKey: '',
            baseUrl: 'https://aihubmix.com/v1',
            model: 'gpt-4o-mini',
            temperature: 0.5
        }
    },
    {
        name: 'GitHub Models',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'GitHub Models OpenAI-compatible inference endpoint with a hosted catalog for GitHub-token-backed model access.',
        setupHint: 'Use a GitHub token that has access to GitHub Models, point Base URL at https://models.github.ai/inference, and choose a catalog model such as gpt-4o-mini or Phi-4.',
        defaultConfig: {
            name: 'GitHub Models',
            apiKey: '',
            baseUrl: 'https://models.github.ai/inference',
            model: 'gpt-4o-mini',
            temperature: 0.5
        }
    },
    {
        name: 'PPIO',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'PPIO multi-provider OpenAI-compatible gateway with bounded model discovery across chat, embedding, and reranker registries.',
        setupHint: 'Use the official PPIO OpenAI-compatible base URL https://api.ppinfra.com/v3/openai with a model ID available to your account, such as qwen/qwen3-32b or openai/gpt-4o-mini.',
        defaultConfig: {
            name: 'PPIO',
            apiKey: '',
            baseUrl: 'https://api.ppinfra.com/v3/openai',
            model: 'qwen/qwen3-32b',
            temperature: 0.5
        }
    },
    {
        name: 'New API',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'optional',
        apiTestMode: 'chat-only',
        description: 'Self-hosted New API gateway using the native OpenAI-compatible `/v1/models` and chat-completions surfaces.',
        setupHint: 'Use your New API server root such as http://localhost:3000/v1 with the model ID exposed by your deployment. Keep the API key empty only if your instance explicitly allows anonymous access.',
        defaultConfig: {
            name: 'New API',
            apiKey: '',
            baseUrl: 'http://localhost:3000/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        }
    },
    {
        name: 'OVMS',
        category: 'local',
        transport: 'openai-compatible',
        apiKeyMode: 'optional',
        apiTestMode: 'chat-only',
        description: 'OpenVINO Model Server local OpenAI-compatible endpoint with bounded local model discovery.',
        setupHint: 'Use the current OVMS OpenAI-compatible base URL such as http://localhost:8000/v3. Model discovery prefers the modern `/v3/models` endpoint and only falls back to legacy local config surfaces when needed.',
        defaultConfig: {
            name: 'OVMS',
            apiKey: '',
            baseUrl: 'http://localhost:8000/v3',
            model: 'openvino-model',
            temperature: 0.5
        }
    },
    {
        name: 'Fireworks',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Fireworks AI inference endpoint for hosted OSS and reasoning models.',
        setupHint: 'Use Fireworks model IDs such as accounts/fireworks/models/kimi-k2p5 or other Fireworks-hosted endpoints.',
        defaultConfig: {
            name: 'Fireworks',
            apiKey: '',
            baseUrl: 'https://api.fireworks.ai/inference/v1',
            model: 'accounts/fireworks/models/kimi-k2p5',
            temperature: 0.5
        }
    },
    {
        name: 'LiteLLM',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'optional',
        apiTestMode: 'chat-only',
        description: 'LiteLLM proxy preset for self-hosted multi-provider OpenAI-compatible routing.',
        setupHint: 'Use the model alias exposed by your LiteLLM proxy and point Base URL at the proxy root or /v1 endpoint, for example http://localhost:4000/v1.',
        defaultConfig: {
            name: 'LiteLLM',
            apiKey: '',
            baseUrl: 'http://localhost:4000/v1',
            model: 'your-proxy-model',
            temperature: 0.5
        }
    },
    {
        name: 'Nebius',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Nebius Token Factory OpenAI-compatible endpoint for hosted OSS and frontier models.',
        setupHint: 'Use the official Nebius AI Studio base URL https://api.studio.nebius.com/v1 with a model ID available to your account, such as openai/gpt-oss-120b or nvidia/nemotron-3-super-120b-a12b.',
        defaultConfig: {
            name: 'Nebius',
            apiKey: '',
            baseUrl: 'https://api.studio.nebius.com/v1',
            model: 'openai/gpt-oss-120b',
            temperature: 0.3
        }
    },
    {
        name: 'Cerebras',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Cerebras Inference OpenAI-compatible endpoint for fast hosted models.',
        setupHint: 'Use the Cerebras base URL https://api.cerebras.ai/v1 with current model IDs such as gpt-oss-120b or zai-glm-4.7.',
        defaultConfig: {
            name: 'Cerebras',
            apiKey: '',
            baseUrl: 'https://api.cerebras.ai/v1',
            model: 'gpt-oss-120b',
            temperature: 0.5
        }
    },
    {
        name: 'Hugging Face',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'Hugging Face Inference Providers router through the OpenAI-compatible chat-completions API.',
        setupHint: 'Use the router base URL https://router.huggingface.co/v1 with a model ID available to your token, such as openai/gpt-oss-120b.',
        defaultConfig: {
            name: 'Hugging Face',
            apiKey: '',
            baseUrl: 'https://router.huggingface.co/v1',
            model: 'openai/gpt-oss-120b',
            temperature: 0.5
        }
    },
    {
        name: 'Vercel AI Gateway',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Vercel AI Gateway OpenAI-compatible endpoint for multi-provider routing behind one API key.',
        setupHint: 'Use the official base URL https://ai-gateway.vercel.sh/v1 with a provider-prefixed model ID such as anthropic/claude-sonnet-4.5 or alibaba/qwen3.6-plus.',
        defaultConfig: {
            name: 'Vercel AI Gateway',
            apiKey: '',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        }
    },
    {
        name: 'Requesty',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'Requesty router for multi-provider access behind a single API key.',
        setupHint: 'Use provider-prefixed model IDs on Requesty, for example anthropic/claude-3-7-sonnet-latest.',
        defaultConfig: {
            name: 'Requesty',
            apiKey: '',
            baseUrl: 'https://router.requesty.ai/v1',
            model: 'anthropic/claude-3-7-sonnet-latest',
            temperature: 0.5
        }
    },
    {
        name: 'OpenAI Compatible',
        category: 'gateway',
        transport: 'openai-compatible',
        apiKeyMode: 'optional',
        apiTestMode: 'chat-only',
        description: 'Generic OpenAI-compatible endpoint for LiteLLM, vLLM, Perplexity, Vercel AI Gateway and custom proxies.',
        setupHint: 'Set your own Base URL, API key and model ID. This preset is intended for custom OpenAI-compatible gateways.',
        defaultConfig: {
            name: 'OpenAI Compatible',
            apiKey: '',
            baseUrl: 'https://your-openai-compatible-endpoint/v1',
            model: 'your-model-id',
            temperature: 0.5
        }
    },
    {
        name: 'LMStudio',
        category: 'local',
        transport: 'openai-compatible',
        apiKeyMode: 'optional',
        apiTestMode: 'chat-only',
        description: 'Local OpenAI-compatible LM Studio server.',
        setupHint: 'LM Studio often accepts EMPTY as the bearer token while exposing /v1/chat/completions locally.',
        defaultConfig: {
            name: 'LMStudio',
            apiKey: 'EMPTY',
            baseUrl: 'http://localhost:1234/v1',
            model: 'local-model',
            temperature: 0.7
        }
    },
    {
        name: 'Ollama',
        category: 'local',
        transport: 'ollama',
        apiKeyMode: 'none',
        apiTestMode: 'chat-only',
        description: 'Native Ollama local endpoint.',
        setupHint: 'Use locally pulled model names such as llama3.1, qwen2.5 or deepseek-r1.',
        defaultConfig: {
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        }
    }
];

export const LLM_PROVIDER_DEFINITIONS: LLMProviderDefinition[] = RAW_LLM_PROVIDER_DEFINITIONS.map(createProviderDefinition);

const PROVIDER_INDEX = new Map(LLM_PROVIDER_DEFINITIONS.map((definition, index) => [definition.name, index]));
const PROVIDER_MAP = new Map(LLM_PROVIDER_DEFINITIONS.map(definition => [definition.name, definition]));

export function resolveCanonicalProviderName(name: string): string {
    return PROVIDER_NAME_ALIASES.get(name) ?? name;
}

export function canonicalizeProviderConfig(provider: LLMProviderConfig): LLMProviderConfig {
    const canonicalName = resolveCanonicalProviderName(provider.name);
    if (canonicalName === provider.name) {
        return provider;
    }

    const definition = PROVIDER_MAP.get(canonicalName);
    return definition
        ? { ...definition.defaultConfig, ...provider, name: canonicalName }
        : { ...provider, name: canonicalName };
}

export function canonicalizeProviderConfigs(providers: LLMProviderConfig[]): LLMProviderConfig[] {
    const providersByName = new Map<string, LLMProviderConfig>();

    providers.forEach(provider => {
        if (!provider || typeof provider.name !== 'string') {
            return;
        }

        const canonicalProvider = canonicalizeProviderConfig(provider);
        const existingProvider = providersByName.get(canonicalProvider.name);

        providersByName.set(
            canonicalProvider.name,
            existingProvider
                ? { ...existingProvider, ...canonicalProvider }
                : canonicalProvider
        );
    });

    return Array.from(providersByName.values());
}

export function getLLMProviderDefinition(name: string): LLMProviderDefinition | undefined {
    return PROVIDER_MAP.get(resolveCanonicalProviderName(name));
}

function normalizeModelId(modelName: string): string {
    return modelName.trim().toLowerCase();
}

function getKnownModelMaxOutputTokensForProvider(providerName: string, normalizedModelName: string): number | undefined {
    const providerModels = KNOWN_MODEL_MAX_OUTPUT_TOKENS[resolveCanonicalProviderName(providerName)];
    if (!providerModels) {
        return undefined;
    }

    return providerModels[normalizedModelName];
}

function pickConsistentKnownModelMaxOutputTokens(candidates: number[]): number | undefined {
    const uniqueCandidates = Array.from(new Set(
        candidates.filter(candidate => Number.isFinite(candidate) && candidate > 0)
    ));

    if (uniqueCandidates.length !== 1) {
        return undefined;
    }

    return uniqueCandidates[0];
}

function getGloballyConsistentKnownModelMaxOutputTokens(normalizedModelName: string): number | undefined {
    const candidates = Object.keys(KNOWN_MODEL_MAX_OUTPUT_TOKENS)
        .map(providerName => getKnownModelMaxOutputTokensForProvider(providerName, normalizedModelName))
        .filter((candidate): candidate is number => typeof candidate === 'number');

    return pickConsistentKnownModelMaxOutputTokens(candidates);
}

function getPrefixMappedKnownModelMaxOutputTokens(normalizedModelName: string): number | undefined {
    const slashIndex = normalizedModelName.indexOf('/');
    if (slashIndex <= 0 || slashIndex >= normalizedModelName.length - 1) {
        return undefined;
    }

    const providerPrefix = normalizedModelName.slice(0, slashIndex);
    const upstreamModelName = normalizedModelName.slice(slashIndex + 1);
    const upstreamProviders = MODEL_PROVIDER_PREFIX_ALIASES.get(providerPrefix);
    if (!upstreamProviders || upstreamProviders.length === 0) {
        return undefined;
    }

    const candidates = upstreamProviders
        .map(providerName => getKnownModelMaxOutputTokensForProvider(providerName, upstreamModelName))
        .filter((candidate): candidate is number => typeof candidate === 'number');

    return pickConsistentKnownModelMaxOutputTokens(candidates);
}

function getHostMappedKnownModelMaxOutputTokens(
    providerName: string,
    normalizedModelName: string,
    baseUrl?: string
): number | undefined {
    if (resolveCanonicalProviderName(providerName) !== 'OpenAI Compatible' || !baseUrl?.trim()) {
        return undefined;
    }

    const inferredProviders = inferKnownOpenAICompatibleProviderNames(baseUrl)
        .map(resolveCanonicalProviderName)
        .filter((candidate, index, array) => candidate && array.indexOf(candidate) === index);

    if (inferredProviders.length === 0) {
        return undefined;
    }

    const candidates = inferredProviders
        .map(candidateProviderName => getKnownModelMaxOutputTokensForProvider(candidateProviderName, normalizedModelName))
        .filter((candidate): candidate is number => typeof candidate === 'number');

    return pickConsistentKnownModelMaxOutputTokens(candidates);
}

export function getKnownModelMaxOutputTokens(
    providerName: string,
    modelName: string,
    options?: { allowGlobalConsistentFallback?: boolean; baseUrl?: string; ownerHint?: string }
): number | undefined {
    if (!modelName.trim()) {
        return undefined;
    }

    const normalizedModelName = normalizeModelId(modelName);
    const providerKnownLimit = getKnownModelMaxOutputTokensForProvider(providerName, normalizedModelName);
    if (typeof providerKnownLimit === 'number') {
        return providerKnownLimit;
    }

    const hostMappedLimit = getHostMappedKnownModelMaxOutputTokens(providerName, normalizedModelName, options?.baseUrl);
    if (typeof hostMappedLimit === 'number') {
        return hostMappedLimit;
    }

    if (typeof options?.ownerHint === 'string' && options.ownerHint.trim() && !normalizedModelName.includes('/')) {
        const ownerHintKey = options.ownerHint.trim().toLowerCase();
        const upstreamProviders = MODEL_PROVIDER_PREFIX_ALIASES.get(ownerHintKey);
        if (upstreamProviders && upstreamProviders.length > 0) {
            const ownerHintCandidates = upstreamProviders
                .map(candidateProviderName => getKnownModelMaxOutputTokensForProvider(candidateProviderName, normalizedModelName))
                .filter((candidate): candidate is number => typeof candidate === 'number');
            const ownerHintLimit = pickConsistentKnownModelMaxOutputTokens(ownerHintCandidates);
            if (typeof ownerHintLimit === 'number') {
                return ownerHintLimit;
            }
        }
    }

    const prefixMappedLimit = getPrefixMappedKnownModelMaxOutputTokens(normalizedModelName);
    if (typeof prefixMappedLimit === 'number') {
        return prefixMappedLimit;
    }

    if (normalizedModelName.includes('/')) {
        const globallyConsistentPrefixedLimit = getGloballyConsistentKnownModelMaxOutputTokens(normalizedModelName);
        if (typeof globallyConsistentPrefixedLimit === 'number') {
            return globallyConsistentPrefixedLimit;
        }
    }

    const canonicalProviderName = resolveCanonicalProviderName(providerName);
    if (
        options?.allowGlobalConsistentFallback === true
        || PROVIDER_NAMES_ALLOWING_GLOBAL_CONSISTENT_MODEL_TOKEN_FALLBACK.has(canonicalProviderName)
    ) {
        return getGloballyConsistentKnownModelMaxOutputTokens(normalizedModelName);
    }

    return undefined;
}

export function createDefaultProviders(): LLMProviderConfig[] {
    return LLM_PROVIDER_DEFINITIONS.map(definition => ({ ...definition.defaultConfig }));
}

export function isOpenAICompatibleProvider(name: string): boolean {
    return getLLMProviderDefinition(name)?.transport === 'openai-compatible';
}

export function getProviderSettingFields(name: string): LLMProviderSettingFieldDefinition[] {
    return getLLMProviderDefinition(name)?.settingFields ?? [];
}

export function getProviderModelDiscoveryDefinition(name: string): LLMProviderModelDiscoveryDefinition {
    return getLLMProviderDefinition(name)?.modelDiscovery ?? { mode: 'none' };
}

function inferOpenAICompatibleDiscoveryMode(provider: LLMProviderConfig): LLMProviderModelDiscoveryDefinition | undefined {
    const family = detectOpenAICompatibleEndpointFamily(provider.baseUrl);
    if (!family) {
        return undefined;
    }

    switch (family) {
        case 'aihubmix':
            return { mode: 'aihubmix-models' };
        case 'github-models':
            return { mode: 'github-models' };
        case 'ovms':
            return { mode: 'ovms-models' };
        case 'ppio':
            return { mode: 'ppio-models' };
        case 'openrouter':
            return { mode: 'openrouter-models' };
        case 'requesty':
            return { mode: 'openai-compatible-models' };
        case 'vercel-ai-gateway':
            return { mode: 'vercel-ai-gateway-models' };
        case 'together':
            return { mode: 'together-models' };
        case 'huaweicloud-modelarts':
            return { mode: 'huaweicloud-modelarts-models' };
        case 'xai':
            return { mode: 'xai-language-models' };
        case 'litellm-proxy':
            return { mode: 'litellm-proxy-models' };
        case 'cerebras':
            return { mode: 'openai-compatible-models' };
        default:
            return undefined;
    }
}

export function resolveProviderModelDiscoveryDefinition(provider: LLMProviderConfig): LLMProviderModelDiscoveryDefinition {
    const configuredDefinition = getProviderModelDiscoveryDefinition(provider.name);
    if (configuredDefinition.mode !== 'openai-compatible-models') {
        return configuredDefinition;
    }

    return inferOpenAICompatibleDiscoveryMode(provider) ?? configuredDefinition;
}

export function getProviderDiscoveryIdentity(provider: LLMProviderConfig): string {
    const discovery = resolveProviderModelDiscoveryDefinition(provider);
    return JSON.stringify({
        name: provider.name,
        mode: discovery.mode,
        disableReasonKey: discovery.disableReasonKey ?? '',
        baseUrl: provider.baseUrl.trim(),
        apiKey: provider.apiKey.trim(),
        apiVersion: provider.apiVersion?.trim() ?? ''
    });
}

function getProviderFieldValue(provider: LLMProviderConfig, fieldId: LLMProviderSettingFieldId): unknown {
    switch (fieldId) {
        case 'apiKey':
            return provider.apiKey;
        case 'baseUrl':
            return provider.baseUrl;
        case 'model':
            return provider.model;
        case 'temperature':
            return provider.temperature;
        case 'topP':
            return provider.topP;
        case 'reasoningEffort':
            return provider.reasoningEffort;
        case 'thinkingEnabled':
            return provider.thinkingEnabled;
        case 'apiVersion':
            return provider.apiVersion;
        case 'maxOutputTokens':
            return provider.maxOutputTokens;
        default:
            return undefined;
    }
}

function hasExplicitProviderFieldValue(
    provider: LLMProviderConfig,
    definition: LLMProviderDefinition,
    field: LLMProviderSettingFieldDefinition
): boolean {
    const currentValue = getProviderFieldValue(provider, field.id);
    const defaultValue = getProviderFieldValue(definition.defaultConfig, field.id);

    switch (field.id) {
        case 'temperature':
            return Number.isFinite(Number(currentValue)) && Number(currentValue) !== Number(defaultValue);
        case 'topP':
            return Number.isFinite(Number(currentValue));
        case 'reasoningEffort':
            return typeof currentValue === 'string' && currentValue.trim() !== '' && currentValue.trim().toLowerCase() !== 'none';
        case 'thinkingEnabled':
            return currentValue === true;
        case 'maxOutputTokens':
            return Number.isFinite(Number(currentValue)) && Number(currentValue) > 0;
        default:
            return currentValue !== undefined && currentValue !== null && currentValue !== defaultValue;
    }
}

export function hasPersistedAdvancedProviderSettings(provider: LLMProviderConfig): boolean {
    const definition = getLLMProviderDefinition(provider.name);
    if (!definition) {
        return false;
    }

    return definition.settingFields.some(field =>
        (field.group === 'advanced' || field.group === 'developer')
        && hasExplicitProviderFieldValue(provider, definition, field)
    );
}

export function shouldShowProviderSettingField(
    provider: LLMProviderConfig,
    field: LLMProviderSettingFieldDefinition,
    options?: { developerMode?: boolean }
): boolean {
    if (field.group !== 'developer') {
        return true;
    }

    const definition = getLLMProviderDefinition(provider.name);
    if (!definition) {
        return options?.developerMode === true;
    }

    return options?.developerMode === true || hasExplicitProviderFieldValue(provider, definition, field);
}

function looksLikeDoubaoEndpointId(model: string): boolean {
    return /^ep-[a-z0-9-]{8,}$/i.test(model.trim());
}

function resolveEffectiveOutputTokenLimit(
    provider: Pick<LLMProviderConfig, 'maxOutputTokens'>,
    fallbackMaxTokens?: number
): number | undefined {
    const providerOverride = Number(provider.maxOutputTokens);
    if (Number.isFinite(providerOverride) && providerOverride > 0) {
        return providerOverride;
    }

    if (Number.isFinite(fallbackMaxTokens) && fallbackMaxTokens! > 0) {
        return fallbackMaxTokens;
    }

    return undefined;
}

export function getProviderValidationIssues(
    provider: Pick<LLMProviderConfig, 'name' | 'model' | 'baseUrl' | 'maxOutputTokens' | 'thinkingEnabled'>,
    fallbackMaxTokens?: number
): LLMProviderValidationIssue[] {
    const issues: LLMProviderValidationIssue[] = [];

    if (provider.name === 'Doubao') {
        const normalizedModel = (provider.model || '').trim();
        if (!normalizedModel || normalizedModel === 'ep-xxxxxxxxxxxxxxxx') {
            issues.push({
                level: 'error',
                message: 'Doubao needs a real Ark endpoint ID in the model field before testing or running tasks.'
            });
            return issues;
        }

        if (!looksLikeDoubaoEndpointId(normalizedModel)) {
            issues.push({
                level: 'warning',
                message: 'Doubao usually expects an Ark endpoint ID such as ep-xxxxxxxx. If you are intentionally using a raw model ID, verify that your Ark deployment accepts it.'
            });
        }
    }

    if (provider.name === 'DeepSeek' && provider.thinkingEnabled === true) {
        const effectiveMaxTokens = resolveEffectiveOutputTokenLimit(provider, fallbackMaxTokens);
        if (typeof effectiveMaxTokens === 'number' && effectiveMaxTokens < DEEPSEEK_RECOMMENDED_THINKING_OUTPUT_TOKENS) {
            issues.push({
                level: 'warning',
                message: `DeepSeek thinking mode can consume the output cap before the final answer. Raise Max Output Tokens to at least ${DEEPSEEK_RECOMMENDED_THINKING_OUTPUT_TOKENS} for long-form tasks, or disable thinking if you want a smaller cap.`
            });
        }
    }

    return issues;
}

export function hasBlockingProviderValidationIssues(
    provider: Pick<LLMProviderConfig, 'name' | 'model' | 'baseUrl' | 'maxOutputTokens' | 'thinkingEnabled'>,
    fallbackMaxTokens?: number
): boolean {
    return getProviderValidationIssues(provider, fallbackMaxTokens).some(issue => issue.level === 'error');
}

export function getOrderedProviderNames(providers: LLMProviderConfig[]): string[] {
    return canonicalizeProviderConfigs(providers)
        .map(provider => provider.name)
        .sort((left, right) => {
            const leftIndex = PROVIDER_INDEX.get(left);
            const rightIndex = PROVIDER_INDEX.get(right);

            if (leftIndex !== undefined && rightIndex !== undefined) {
                return leftIndex - rightIndex;
            }
            if (leftIndex !== undefined) {
                return -1;
            }
            if (rightIndex !== undefined) {
                return 1;
            }
            return left.localeCompare(right);
        });
}

export function getProviderCategoryLabel(category: LLMProviderCategory): string {
    switch (category) {
        case 'cloud':
            return 'Cloud';
        case 'gateway':
            return 'Gateway';
        case 'local':
            return 'Local';
        default:
            return 'Provider';
    }
}
