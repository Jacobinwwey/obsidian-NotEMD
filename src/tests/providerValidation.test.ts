import {
    getProviderValidationIssues,
    hasBlockingProviderValidationIssues
} from '../llmProviders';

describe('provider validation', () => {
    test('Doubao placeholder endpoint ID is treated as blocking', () => {
        const provider = {
            name: 'Doubao',
            apiKey: 'test-key',
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'ep-xxxxxxxxxxxxxxxx',
            temperature: 0.3
        };

        const issues = getProviderValidationIssues(provider);

        expect(issues).toEqual([
            expect.objectContaining({
                level: 'error'
            })
        ]);
        expect(issues[0].message).toContain('real Ark endpoint ID');
        expect(hasBlockingProviderValidationIssues(provider)).toBe(true);
    });

    test('Doubao model that does not look like an endpoint ID returns a non-blocking warning', () => {
        const provider = {
            name: 'Doubao',
            apiKey: 'test-key',
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'doubao-pro-32k',
            temperature: 0.3
        };

        const issues = getProviderValidationIssues(provider);

        expect(issues).toEqual([
            expect.objectContaining({
                level: 'warning'
            })
        ]);
        expect(issues[0].message).toContain('usually expects an Ark endpoint ID');
        expect(hasBlockingProviderValidationIssues(provider)).toBe(false);
    });

    test('Doubao endpoint-like IDs pass without issues', () => {
        const provider = {
            name: 'Doubao',
            apiKey: 'test-key',
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'ep-20260326-abc123xyz789',
            temperature: 0.3
        };

        expect(getProviderValidationIssues(provider)).toEqual([]);
        expect(hasBlockingProviderValidationIssues(provider)).toBe(false);
    });

    test('other providers are not affected by Doubao-specific validation', () => {
        const provider = {
            name: 'Qwen',
            apiKey: 'test-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-plus',
            temperature: 0.3
        };

        expect(getProviderValidationIssues(provider)).toEqual([]);
        expect(hasBlockingProviderValidationIssues(provider)).toBe(false);
    });

    test('DeepSeek thinking mode warns when the effective output cap is too low', () => {
        const provider = {
            name: 'DeepSeek',
            apiKey: 'test-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.5,
            thinkingEnabled: true,
            maxOutputTokens: 2048
        };

        const issues = getProviderValidationIssues(provider, 8192);

        expect(issues).toEqual([
            expect.objectContaining({
                level: 'warning'
            })
        ]);
        expect(issues[0].message).toContain('Raise Max Output Tokens to at least 8000');
        expect(hasBlockingProviderValidationIssues(provider, 8192)).toBe(false);
    });

    test('DeepSeek thinking mode inherits the global cap when no provider override is set', () => {
        const provider = {
            name: 'DeepSeek',
            apiKey: 'test-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.5,
            thinkingEnabled: true
        };

        const lowGlobalIssues = getProviderValidationIssues(provider, 2048);
        expect(lowGlobalIssues).toEqual([
            expect.objectContaining({
                level: 'warning'
            })
        ]);

        expect(getProviderValidationIssues(provider, 8192)).toEqual([]);
        expect(hasBlockingProviderValidationIssues(provider, 8192)).toBe(false);
    });
});
