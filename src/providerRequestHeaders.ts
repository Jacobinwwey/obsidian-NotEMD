import { LLMProviderConfig } from './types';
import { detectOpenAICompatibleEndpointFamily } from './openaiCompatibleEndpointFamily';

const AIHUBMIX_APP_CODE = 'MLTG2087';

export function buildOpenAICompatibleProviderHeaders(provider: LLMProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    const family = detectOpenAICompatibleEndpointFamily(provider.baseUrl);

    if (provider.apiKey || provider.name === 'LMStudio') {
        const providerKey = provider.apiKey || 'EMPTY';
        headers['Authorization'] = `Bearer ${providerKey}`;
        headers['X-Api-Key'] = providerKey;
    }

    if (provider.name === 'OpenRouter' || provider.name === 'Requesty' || family === 'openrouter' || family === 'requesty') {
        headers['HTTP-Referer'] = 'https://github.com/Jacobinwwey/obsidian-NotEMD';
        headers['X-Title'] = 'Notemd Obsidian Plugin';
    }

    if (provider.name === 'GitHub Models' || family === 'github-models') {
        headers['X-GitHub-Api-Version'] = '2022-11-28';
    }

    if (provider.name === 'AIHubMix' || family === 'aihubmix') {
        headers['APP-Code'] = AIHUBMIX_APP_CODE;
    }

    if (provider.name === 'Cerebras' || family === 'cerebras') {
        headers['X-Cerebras-3rd-Party-Integration'] = 'notemd';
    }

    return headers;
}
