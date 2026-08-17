import { createHash } from 'crypto';
import type { LLMProviderConfig, NotemdSettings } from './types';
import { getLLMProviderDefinition } from './llmProviders';

export const LLM_RESPONSE_CACHE_TTL_MS = 5 * 60 * 1000;
export const LLM_RESPONSE_CACHE_MAX_ENTRIES = 128;
const LLM_RESPONSE_CACHE_KEY_VERSION = 2;

function hashText(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeEndpoint(value: string): string {
    return value.trim().replace(/\/+$/, '');
}

/**
 * Builds a versioned, credential-free cache fingerprint. Every field that can
 * change provider semantics is explicit so a local endpoint cannot reuse a
 * response generated for a different server or generation budget.
 */
export function buildLlmResponseCacheKey(
    provider: LLMProviderConfig,
    modelName: string,
    prompt: string,
    content: string,
    settings: Pick<NotemdSettings, 'maxTokens'>
): string {
    const definition = getLLMProviderDefinition(provider.name);
    const descriptor = {
        schemaVersion: LLM_RESPONSE_CACHE_KEY_VERSION,
        providerId: (definition?.name ?? provider.name).trim().toLowerCase(),
        transport: definition?.transport ?? 'unknown',
        endpoint: normalizeEndpoint(provider.baseUrl),
        apiVersion: provider.apiVersion ?? null,
        model: modelName.trim(),
        temperature: provider.temperature ?? null,
        topP: provider.topP ?? null,
        reasoningEffort: provider.reasoningEffort ?? null,
        thinkingEnabled: provider.thinkingEnabled ?? null,
        providerMaxOutputTokens: provider.maxOutputTokens ?? null,
        globalMaxTokens: settings.maxTokens ?? null,
        promptHash: hashText(prompt),
        contentHash: hashText(content)
    };
    return `llm-cache-v${LLM_RESPONSE_CACHE_KEY_VERSION}:${hashText(JSON.stringify(descriptor))}`;
}

export interface LlmResponseCacheOptions {
    maxEntries?: number;
    ttlMs?: number;
}

interface LlmResponseCacheEntry {
    response: string;
    timestamp: number;
}

/** Small bounded LRU/TTL cache used only for successful LLM responses. */
export class LlmResponseCache {
    private readonly entries = new Map<string, LlmResponseCacheEntry>();
    private readonly maxEntries: number;
    private readonly ttlMs: number;

    constructor(options: LlmResponseCacheOptions = {}) {
        this.maxEntries = Math.max(1, Math.floor(options.maxEntries ?? LLM_RESPONSE_CACHE_MAX_ENTRIES));
        this.ttlMs = Math.max(1, Math.floor(options.ttlMs ?? LLM_RESPONSE_CACHE_TTL_MS));
    }

    get size(): number {
        return this.entries.size;
    }

    get(key: string, now = Date.now()): string | undefined {
        const entry = this.entries.get(key);
        if (!entry) {
            return undefined;
        }
        if (now - entry.timestamp >= this.ttlMs) {
            this.entries.delete(key);
            return undefined;
        }

        // Map insertion order is the LRU order. A read refreshes recency but
        // never extends TTL, so hot keys cannot remain cached forever.
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.response;
    }

    set(key: string, response: string, now = Date.now()): void {
        this.entries.delete(key);
        while (this.entries.size >= this.maxEntries) {
            const oldestKey = this.entries.keys().next().value as string | undefined;
            if (oldestKey === undefined) {
                break;
            }
            this.entries.delete(oldestKey);
        }
        this.entries.set(key, { response, timestamp: now });
    }

    clear(): void {
        this.entries.clear();
    }
}
