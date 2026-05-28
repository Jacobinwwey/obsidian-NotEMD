import {
    detectOpenAICompatibleEndpointFamily,
    inferKnownOpenAICompatibleProviderNames,
    normalizeOpenAICompatibleEndpointBaseUrl
} from '../openaiCompatibleEndpointFamily';

describe('openai-compatible endpoint family detection', () => {
    test('normalizes shared OpenAI-compatible endpoint suffixes before family detection', () => {
        expect(normalizeOpenAICompatibleEndpointBaseUrl('https://api.ppinfra.com/v3/openai/chat/completions'))
            .toBe('https://api.ppinfra.com/v3/openai');
        expect(normalizeOpenAICompatibleEndpointBaseUrl('https://models.github.ai/inference/models'))
            .toBe('https://models.github.ai/inference');
        expect(normalizeOpenAICompatibleEndpointBaseUrl('https://api.openai.com/v1/responses'))
            .toBe('https://api.openai.com/v1');
        expect(normalizeOpenAICompatibleEndpointBaseUrl('https://api.x.ai/v1/models?view=full#catalog'))
            .toBe('https://api.x.ai/v1');
    });

    test('detects the richer hosted gateway families from base URLs', () => {
        expect(detectOpenAICompatibleEndpointFamily('https://api.ppinfra.com/v3/openai')).toBe('ppio');
        expect(detectOpenAICompatibleEndpointFamily('https://models.github.ai/inference')).toBe('github-models');
        expect(detectOpenAICompatibleEndpointFamily('https://models.github.ai/v1/models')).toBe('github-models');
        expect(detectOpenAICompatibleEndpointFamily('https://aihubmix.com/v1')).toBe('aihubmix');
        expect(detectOpenAICompatibleEndpointFamily('https://openrouter.ai/api/v1')).toBe('openrouter');
        expect(detectOpenAICompatibleEndpointFamily('https://ai-gateway.vercel.sh/v1/ai/chat/completions')).toBe('vercel-ai-gateway');
        expect(detectOpenAICompatibleEndpointFamily('https://ai-gateway.vercel.sh/v1/ai/responses')).toBe('vercel-ai-gateway');
        expect(detectOpenAICompatibleEndpointFamily('https://api.x.ai/v1/language-models')).toBe('xai');
        expect(detectOpenAICompatibleEndpointFamily('http://localhost:8000/v3')).toBe('ovms');
        expect(detectOpenAICompatibleEndpointFamily('http://localhost:8000/v1/config')).toBe('ovms');
        expect(detectOpenAICompatibleEndpointFamily('http://localhost:4000/v1')).toBe('litellm-proxy');
        expect(detectOpenAICompatibleEndpointFamily('https://custom-openai-compatible.example/v1')).toBeUndefined();
    });

    test('infers known official provider identities from OpenAI-compatible hosts without over-claiming custom endpoints', () => {
        expect(inferKnownOpenAICompatibleProviderNames('https://api.openai.com/v1')).toEqual(['OpenAI']);
        expect(inferKnownOpenAICompatibleProviderNames('https://dashscope.aliyuncs.com/compatible-mode/v1')).toEqual(['Qwen Code', 'Qwen']);
        expect(inferKnownOpenAICompatibleProviderNames('https://api.xiaomimimo.com/v1')).toEqual(['Xiaomi MiMo']);
        expect(inferKnownOpenAICompatibleProviderNames('https://api.x.ai/v1/language-models')).toEqual(['xAI']);
        expect(inferKnownOpenAICompatibleProviderNames('https://api.fireworks.ai/inference/v1')).toEqual(['Fireworks']);
        expect(inferKnownOpenAICompatibleProviderNames('https://router.huggingface.co/v1')).toEqual(['Hugging Face']);
        expect(inferKnownOpenAICompatibleProviderNames('https://custom-openai-compatible.example/v1')).toEqual([]);
        expect(inferKnownOpenAICompatibleProviderNames('http://localhost:4000/v1')).toEqual([]);
    });
});
