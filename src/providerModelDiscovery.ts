import { requestUrl } from 'obsidian';
import { LLMProviderConfig } from './types';
import {
    getProviderModelDiscoveryDefinition
} from './llmProviders';

type ProviderModelDiscoveryResult = {
    models: string[];
    source: 'remote' | 'none';
};

function trimTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, '');
}

function normalizeEndpointBaseUrl(baseUrl: string, suffixes: string[]): string {
    let normalized = trimTrailingSlashes(baseUrl.trim());
    if (!normalized) {
        return normalized;
    }

    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
            break;
        }
    }

    return trimTrailingSlashes(normalized);
}

function requireBaseUrl(provider: LLMProviderConfig): string {
    const normalized = provider.baseUrl.trim();
    if (!normalized) {
        throw new Error(`${provider.name} model discovery requires a Base URL / endpoint.`);
    }

    return normalized;
}

function normalizeOpenAICompatibleBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/chat/completions', '/models']);
}

function normalizeOllamaBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/tags']);
}

function normalizeGoogleBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/models']);
}

function buildOpenAICompatibleHeaders(provider: LLMProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (provider.apiKey || provider.name === 'LMStudio') {
        headers['Authorization'] = `Bearer ${provider.apiKey || 'EMPTY'}`;
    }

    if (provider.name === 'OpenRouter' || provider.name === 'Requesty') {
        headers['HTTP-Referer'] = 'https://github.com/Jacobinwwey/obsidian-NotEMD';
        headers['X-Title'] = 'Notemd Obsidian Plugin';
    }

    return headers;
}

function normalizeModelList(values: Iterable<string>): string[] {
    const seen = new Set<string>();
    const models: string[] = [];

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        models.push(trimmed);
    }

    return models.sort((left, right) => left.localeCompare(right));
}

async function fetchJson(url: string, options?: { headers?: Record<string, string> }): Promise<any> {
    const response = await requestUrl({
        url,
        method: 'GET',
        headers: options?.headers ?? {},
        throw: false
    });

    if (response.status < 200 || response.status >= 300) {
        throw new Error(`Model discovery request failed: ${response.status} ${response.text || ''}`.trim());
    }

    return response.json;
}

async function discoverOpenAICompatibleModels(provider: LLMProviderConfig): Promise<string[]> {
    const baseUrl = normalizeOpenAICompatibleBaseUrl(requireBaseUrl(provider));

    const data = await fetchJson(`${baseUrl}/models`, {
        headers: buildOpenAICompatibleHeaders(provider)
    });

    const modelIds = Array.isArray(data?.data)
        ? data.data
            .map((entry: any) => typeof entry?.id === 'string' ? entry.id : '')
        : [];

    return normalizeModelList(modelIds);
}

async function discoverOllamaModels(provider: LLMProviderConfig): Promise<string[]> {
    const baseUrl = normalizeOllamaBaseUrl(requireBaseUrl(provider));

    const data = await fetchJson(`${baseUrl}/tags`);
    const modelIds = Array.isArray(data?.models)
        ? data.models
            .flatMap((entry: any) => [
                typeof entry?.model === 'string' ? entry.model : '',
                typeof entry?.name === 'string' ? entry.name : ''
            ])
        : [];

    return normalizeModelList(modelIds);
}

async function discoverGoogleModels(provider: LLMProviderConfig): Promise<string[]> {
    const baseUrl = normalizeGoogleBaseUrl(requireBaseUrl(provider));
    const apiKey = provider.apiKey.trim();
    if (!apiKey) {
        throw new Error(`${provider.name} model discovery requires an API key.`);
    }

    const data = await fetchJson(`${baseUrl}/models?key=${encodeURIComponent(apiKey)}`);
    const modelIds = Array.isArray(data?.models)
        ? data.models
            .map((entry: any) => typeof entry?.name === 'string' ? entry.name.replace(/^models\//, '') : '')
        : [];

    return normalizeModelList(modelIds);
}

export async function discoverProviderModels(provider: LLMProviderConfig): Promise<ProviderModelDiscoveryResult> {
    const definition = getProviderModelDiscoveryDefinition(provider.name);

    switch (definition.mode) {
        case 'openai-compatible-models':
            return { models: await discoverOpenAICompatibleModels(provider), source: 'remote' };
        case 'ollama-tags':
            return { models: await discoverOllamaModels(provider), source: 'remote' };
        case 'google-models':
            return { models: await discoverGoogleModels(provider), source: 'remote' };
        case 'none':
        default:
            return { models: [], source: 'none' };
    }
}
