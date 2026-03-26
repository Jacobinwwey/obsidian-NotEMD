import { LLMProviderConfig } from './types';

export type LLMProviderCategory = 'cloud' | 'gateway' | 'local';
export type LLMProviderTransport = 'openai-compatible' | 'anthropic' | 'google' | 'azure-openai' | 'ollama';
export type LLMProviderApiKeyMode = 'required' | 'optional' | 'none';
export type LLMProviderApiTestMode = 'models-then-chat' | 'chat-only';
export type LLMProviderValidationLevel = 'warning' | 'error';

export interface LLMProviderDefinition {
    name: string;
    category: LLMProviderCategory;
    transport: LLMProviderTransport;
    apiKeyMode: LLMProviderApiKeyMode;
    apiTestMode: LLMProviderApiTestMode;
    description: string;
    setupHint: string;
    defaultConfig: LLMProviderConfig;
}

export interface LLMProviderValidationIssue {
    level: LLMProviderValidationLevel;
    message: string;
}

export const LLM_PROVIDER_DEFINITIONS: LLMProviderDefinition[] = [
    {
        name: 'DeepSeek',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'models-then-chat',
        description: 'DeepSeek native endpoint with reasoning-model quirks handled automatically.',
        setupHint: 'Best for DeepSeek-hosted chat/reasoning models such as deepseek-reasoner and deepseek-chat.',
        defaultConfig: {
            name: 'DeepSeek',
            apiKey: '',
            baseUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-reasoner',
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
        setupHint: 'Use DashScope Qwen model IDs such as qwen-plus, qwen-max, qwen-flash, qwen3-coder-plus or qwq-plus.',
        defaultConfig: {
            name: 'Qwen',
            apiKey: '',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-plus',
            temperature: 0.3
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
        setupHint: 'Use Moonshot-hosted Kimi model IDs such as kimi-k2.5.',
        defaultConfig: {
            name: 'Moonshot',
            apiKey: '',
            baseUrl: 'https://api.moonshot.cn/v1',
            model: 'kimi-k2.5',
            temperature: 0.3
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
        name: 'MiniMax',
        category: 'cloud',
        transport: 'openai-compatible',
        apiKeyMode: 'required',
        apiTestMode: 'chat-only',
        description: 'MiniMax chat completions endpoint for domestic MiniMax text models.',
        setupHint: 'Use MiniMax text/chat models such as MiniMax-M1 or MiniMax-Text-01.',
        defaultConfig: {
            name: 'MiniMax',
            apiKey: '',
            baseUrl: 'https://api.minimaxi.com/v1',
            model: 'MiniMax-M1',
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

const PROVIDER_INDEX = new Map(LLM_PROVIDER_DEFINITIONS.map((definition, index) => [definition.name, index]));
const PROVIDER_MAP = new Map(LLM_PROVIDER_DEFINITIONS.map(definition => [definition.name, definition]));

export function getLLMProviderDefinition(name: string): LLMProviderDefinition | undefined {
    return PROVIDER_MAP.get(name);
}

export function createDefaultProviders(): LLMProviderConfig[] {
    return LLM_PROVIDER_DEFINITIONS.map(definition => ({ ...definition.defaultConfig }));
}

export function isOpenAICompatibleProvider(name: string): boolean {
    return getLLMProviderDefinition(name)?.transport === 'openai-compatible';
}

function looksLikeDoubaoEndpointId(model: string): boolean {
    return /^ep-[a-z0-9-]{8,}$/i.test(model.trim());
}

export function getProviderValidationIssues(provider: Pick<LLMProviderConfig, 'name' | 'model' | 'baseUrl'>): LLMProviderValidationIssue[] {
    if (provider.name !== 'Doubao') {
        return [];
    }

    const normalizedModel = (provider.model || '').trim();
    if (!normalizedModel || normalizedModel === 'ep-xxxxxxxxxxxxxxxx') {
        return [{
            level: 'error',
            message: 'Doubao needs a real Ark endpoint ID in the model field before testing or running tasks.'
        }];
    }

    if (!looksLikeDoubaoEndpointId(normalizedModel)) {
        return [{
            level: 'warning',
            message: 'Doubao usually expects an Ark endpoint ID such as ep-xxxxxxxx. If you are intentionally using a raw model ID, verify that your Ark deployment accepts it.'
        }];
    }

    return [];
}

export function hasBlockingProviderValidationIssues(provider: Pick<LLMProviderConfig, 'name' | 'model' | 'baseUrl'>): boolean {
    return getProviderValidationIssues(provider).some(issue => issue.level === 'error');
}

export function getOrderedProviderNames(providers: LLMProviderConfig[]): string[] {
    return providers
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
