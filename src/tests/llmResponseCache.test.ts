import type { LLMProviderConfig, NotemdSettings } from '../types';
import {
    LLM_RESPONSE_CACHE_MAX_ENTRIES,
    LLM_RESPONSE_CACHE_TTL_MS,
    LlmResponseCache,
    buildLlmResponseCacheKey
} from '../llmResponseCache';

const settings = { maxTokens: 4096 } as NotemdSettings;

function createProvider(overrides: Partial<LLMProviderConfig> = {}): LLMProviderConfig {
    return {
        name: 'OpenAI Compatible',
        apiKey: 'secret-api-key',
        baseUrl: 'https://example.test/v1',
        model: 'model-a',
        temperature: 0.2,
        ...overrides
    };
}

describe('LLM response cache policy', () => {
    test('isolates endpoint and generation parameters without embedding credentials', () => {
        const baseKey = buildLlmResponseCacheKey(createProvider(), 'model-a', 'Prompt', 'Content', settings);

        expect(baseKey).not.toContain('secret-api-key');
        expect(baseKey).not.toContain('Prompt');
        expect(baseKey).not.toContain('Content');
        expect(buildLlmResponseCacheKey(
            createProvider({ baseUrl: 'https://other.example.test/v1' }),
            'model-a', 'Prompt', 'Content', settings
        )).not.toBe(baseKey);
        expect(buildLlmResponseCacheKey(
            createProvider({ temperature: 0.8 }),
            'model-a', 'Prompt', 'Content', settings
        )).not.toBe(baseKey);
        expect(buildLlmResponseCacheKey(
            createProvider({ topP: 0.6 }),
            'model-a', 'Prompt', 'Content', settings
        )).not.toBe(baseKey);
        expect(buildLlmResponseCacheKey(
            createProvider({ maxOutputTokens: 2048 }),
            'model-a', 'Prompt', 'Content', settings
        )).not.toBe(baseKey);
        expect(buildLlmResponseCacheKey(
            createProvider(),
            'model-a', 'Prompt changed', 'Content', settings
        )).not.toBe(baseKey);
    });

    test('expires entries and evicts the least recently used entry at capacity', () => {
        const cache = new LlmResponseCache({ maxEntries: 2, ttlMs: 100 });

        cache.set('a', 'A', 1_000);
        cache.set('b', 'B', 1_001);
        expect(cache.get('a', 1_050)).toBe('A');
        cache.set('c', 'C', 1_051);
        expect(cache.get('b', 1_052)).toBeUndefined();
        expect(cache.get('a', 1_052)).toBe('A');
        expect(cache.get('c', 1_052)).toBe('C');
        expect(cache.get('a', 1_200)).toBeUndefined();
        expect(cache.size).toBe(1);
    });

    test('publishes bounded defaults as part of the compatibility contract', () => {
        expect(LLM_RESPONSE_CACHE_TTL_MS).toBeGreaterThan(0);
        expect(LLM_RESPONSE_CACHE_MAX_ENTRIES).toBeGreaterThan(0);
    });
});
