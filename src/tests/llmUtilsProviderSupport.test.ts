import { requestUrl } from 'obsidian';
import { callLLM, testAPI } from '../llmUtils';
import { ProgressReporter, LLMProviderConfig, NotemdSettings } from '../types';
import { mockSettings } from './__mocks__/settings';

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

describe('llmUtils expanded provider support', () => {
    let reporter: ProgressReporter;
    let settings: NotemdSettings;

    beforeEach(() => {
        reporter = createReporter();
        settings = { ...mockSettings, maxTokens: 2048 };
        (requestUrl as jest.Mock).mockReset();
    });

    test('callLLM routes Groq through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'Groq',
            apiKey: 'groq-key',
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'moonshotai/kimi-k2-instruct-0905',
            temperature: 0.3
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'groq-ok' } }] },
            text: '{"choices":[{"message":{"content":"groq-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'User content', settings, reporter);

        expect(result).toBe('groq-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.groq.com/openai/v1/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer groq-key'
            })
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('moonshotai/kimi-k2-instruct-0905');
        expect(requestBody.messages).toEqual([
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: 'User content' }
        ]);
    });

    test('callLLM routes Qwen through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'Qwen',
            apiKey: 'dashscope-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-plus',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'qwen-ok' } }] },
            text: '{"choices":[{"message":{"content":"qwen-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', '中文内容', settings, reporter);

        expect(result).toBe('qwen-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer dashscope-key'
            })
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('qwen-plus');
    });

    test('callLLM routes SiliconFlow through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'SiliconFlow',
            apiKey: 'sf-key',
            baseUrl: 'https://api.siliconflow.cn/v1',
            model: 'Qwen/QwQ-32B',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'siliconflow-ok' } }] },
            text: '{"choices":[{"message":{"content":"siliconflow-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Provider content', settings, reporter);

        expect(result).toBe('siliconflow-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.siliconflow.cn/v1/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer sf-key'
            })
        }));
    });

    test('OpenAI Compatible preset can call unauthenticated local gateways', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI Compatible',
            apiKey: '',
            baseUrl: 'http://localhost:4000/v1',
            model: 'custom-model',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'gateway-ok' } }] },
            text: '{"choices":[{"message":{"content":"gateway-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Gateway content', settings, reporter);

        expect(result).toBe('gateway-ok');
        expect((requestUrl as jest.Mock).mock.calls[0][0].headers.Authorization).toBeUndefined();
    });

    test('testAPI uses gateway headers for Requesty model probing', async () => {
        const provider: LLMProviderConfig = {
            name: 'Requesty',
            apiKey: 'rq-key',
            baseUrl: 'https://router.requesty.ai/v1',
            model: 'anthropic/claude-3-7-sonnet-latest',
            temperature: 0.5
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { data: [] },
            text: '{"data":[]}'
        });

        const result = await testAPI(provider);

        expect(result.success).toBe(true);
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://router.requesty.ai/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer rq-key',
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                'X-Title': 'Notemd Obsidian Plugin'
            })
        }));
    });

    test('testAPI uses direct chat probing for Qwen instead of models endpoint', async () => {
        const provider: LLMProviderConfig = {
            name: 'Qwen',
            apiKey: 'dashscope-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-plus',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'ok' } }] },
            text: '{"choices":[{"message":{"content":"ok"}}]}'
        });

        const result = await testAPI(provider);

        expect(result.success).toBe(true);
        expect(requestUrl).toHaveBeenCalledTimes(1);
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            method: 'POST'
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('qwen-plus');
    });

    test('testAPI uses direct chat probing for Baidu Qianfan', async () => {
        const provider: LLMProviderConfig = {
            name: 'Baidu Qianfan',
            apiKey: 'qianfan-key',
            baseUrl: 'https://qianfan.baidubce.com/v2',
            model: 'ernie-4.5-turbo-32k',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'ok' } }] },
            text: '{"choices":[{"message":{"content":"ok"}}]}'
        });

        const result = await testAPI(provider);

        expect(result.success).toBe(true);
        expect(requestUrl).toHaveBeenCalledTimes(1);
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://qianfan.baidubce.com/v2/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer qianfan-key'
            })
        }));
        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('ernie-4.5-turbo-32k');
    });
});
