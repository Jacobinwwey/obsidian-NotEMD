import { LLMProviderConfig } from './types';
import { redactApiKey } from './providerSecrets';
import { canonicalizeProviderConfigs } from './llmProviders';

export interface ProviderProfileExport {
    providers: LLMProviderConfig[];
    exportedAt: string;
    formatVersion: 1;
}

export interface RedactedProviderProfileExport {
    providers: LLMProviderConfig[];
    exportedAt: string;
    formatVersion: 1;
    redacted: true;
}

export interface ProviderProfileImportSummary {
    importedProviders: LLMProviderConfig[];
    newCount: number;
    updatedCount: number;
}

export function buildProviderProfileExport(providers: LLMProviderConfig[], now: Date = new Date()): ProviderProfileExport {
    return {
        providers,
        exportedAt: now.toISOString(),
        formatVersion: 1
    };
}

export function buildRedactedProviderProfileExport(
    providers: LLMProviderConfig[],
    now: Date = new Date()
): RedactedProviderProfileExport {
    return {
        providers: providers.map(provider => ({
            ...provider,
            apiKey: redactApiKey(provider.apiKey)
        })),
        exportedAt: now.toISOString(),
        formatVersion: 1,
        redacted: true
    };
}

export function parseProviderProfileImport(jsonData: string, existingProviders: LLMProviderConfig[]): ProviderProfileImportSummary {
    const parsed = JSON.parse(jsonData) as ProviderProfileExport | RedactedProviderProfileExport | LLMProviderConfig[];
    if (!Array.isArray(parsed) && 'redacted' in parsed && parsed.redacted === true) {
        throw new Error('Redacted provider profile exports cannot be imported.');
    }

    const importedProviders = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.providers)
            ? parsed.providers
            : null;

    if (!importedProviders) {
        throw new Error('Imported file does not contain a valid provider array.');
    }

    const existingProvidersMap = new Map(
        canonicalizeProviderConfigs(existingProviders).map(provider => [provider.name, provider])
    );
    let updatedCount = 0;
    let newCount = 0;

    canonicalizeProviderConfigs(importedProviders).forEach(importedProvider => {
        if (importedProvider && typeof importedProvider.name === 'string') {
            if (existingProvidersMap.has(importedProvider.name)) {
                existingProvidersMap.set(importedProvider.name, importedProvider);
                updatedCount += 1;
            } else {
                existingProvidersMap.set(importedProvider.name, importedProvider);
                newCount += 1;
            }
        }
    });

    return {
        importedProviders: Array.from(existingProvidersMap.values()),
        newCount,
        updatedCount
    };
}
