import { LLMProviderConfig } from '../types';
import {
    buildProviderProfileExport,
    buildRedactedProviderProfileExport,
    parseProviderProfileImport
} from '../providerProfiles';

describe('provider profile helpers', () => {
    const existingProviders: LLMProviderConfig[] = [
        {
            name: 'DeepSeek',
            apiKey: 'existing',
            baseUrl: 'https://deepseek.test',
            model: 'deepseek-chat',
            temperature: 0.3,
            localOnly: true
        }
    ];

    test('builds versioned provider profile export payload', () => {
        const result = buildProviderProfileExport(existingProviders, new Date('2026-05-04T12:00:00.000Z'));

        expect(result.formatVersion).toBe(1);
        expect(result.exportedAt).toBe('2026-05-04T12:00:00.000Z');
        expect(result.providers).toHaveLength(1);
        expect(result.providers[0].localOnly).toBe(true);
    });

    test('builds redacted provider profile export payload', () => {
        const result = buildRedactedProviderProfileExport(existingProviders, new Date('2026-05-04T12:00:00.000Z'));

        expect(result).toEqual(expect.objectContaining({
            formatVersion: 1,
            redacted: true,
            exportedAt: '2026-05-04T12:00:00.000Z'
        }));
        expect(result.providers).toHaveLength(1);
        expect(result.providers[0]).toEqual(expect.objectContaining({
            name: 'DeepSeek',
            apiKey: 'exi...ing (redacted)',
            localOnly: true
        }));
    });

    test('imports versioned provider profile payload and preserves localOnly semantics', () => {
        const json = JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-05-04T12:00:00.000Z',
            providers: [
                {
                    name: 'DeepSeek',
                    apiKey: 'updated',
                    baseUrl: 'https://deepseek.test',
                    model: 'deepseek-v2',
                    temperature: 0.1,
                    localOnly: true
                },
                {
                    name: 'OpenAI',
                    apiKey: 'new',
                    baseUrl: 'https://openai.test',
                    model: 'gpt-4.1',
                    temperature: 0.2,
                    localOnly: false
                }
            ]
        });

        const result = parseProviderProfileImport(json, existingProviders);

        expect(result.newCount).toBe(1);
        expect(result.updatedCount).toBe(1);
        expect(result.importedProviders).toHaveLength(2);
        expect(result.importedProviders.find(provider => provider.name === 'DeepSeek')?.localOnly).toBe(true);
        expect(result.importedProviders.find(provider => provider.name === 'OpenAI')?.localOnly).toBe(false);
    });

    test('canonicalizes legacy provider names during import', () => {
        const json = JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-05-04T12:00:00.000Z',
            providers: [
                {
                    name: 'Xiaomi',
                    apiKey: 'legacy-key',
                    baseUrl: 'https://legacy.example/v1',
                    model: 'mimo-latest',
                    temperature: 0.4,
                    localOnly: false
                }
            ]
        });

        const result = parseProviderProfileImport(json, [
            {
                name: 'Xiaomi MiMo',
                apiKey: '',
                baseUrl: 'https://api.xiaomimimo.com/v1',
                model: 'mimo-v2.5-pro',
                temperature: 1.0
            }
        ]);

        expect(result.newCount).toBe(0);
        expect(result.updatedCount).toBe(1);
        expect(result.importedProviders).toHaveLength(1);
        expect(result.importedProviders[0]).toEqual(expect.objectContaining({
            name: 'Xiaomi MiMo',
            apiKey: 'legacy-key',
            baseUrl: 'https://legacy.example/v1',
            model: 'mimo-latest'
        }));
    });

    test('rejects redacted provider profile payloads during import', () => {
        const json = JSON.stringify({
            formatVersion: 1,
            redacted: true,
            exportedAt: '2026-05-04T12:00:00.000Z',
            providers: [
                {
                    name: 'DeepSeek',
                    apiKey: 'exi...ing (redacted)',
                    baseUrl: 'https://deepseek.test',
                    model: 'deepseek-chat',
                    temperature: 0.3,
                    localOnly: true
                }
            ]
        });

        expect(() => parseProviderProfileImport(json, existingProviders)).toThrow(
            'Redacted provider profile exports cannot be imported.'
        );
    });
});
