import { LLMProviderConfig } from '../types';
import { buildProviderProfileExport, parseProviderProfileImport } from '../providerProfiles';

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
});
