import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import { requestUrl } from 'obsidian';
import { callLLM, testAPI } from '../llmUtils';
import { ProgressReporter, LLMProviderConfig, NotemdSettings } from '../types';
import { mockSettings } from './__mocks__/settings';

jest.mock('http', () => ({
    request: jest.fn()
}));

jest.mock('https', () => ({
    request: jest.fn()
}));

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

function mockDesktopTransportSuccess(
    transportModule: typeof http | typeof https,
    responseBody: unknown,
    statusCode: number = 200
): void {
    (transportModule.request as unknown as jest.Mock).mockImplementationOnce((options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
            statusCode?: number;
            headers?: Record<string, string>;
        };
        response.statusCode = statusCode;
        response.headers = {};

        const request = new EventEmitter() as EventEmitter & {
            write: jest.Mock;
            end: jest.Mock;
            destroy: jest.Mock;
        };

        request.write = jest.fn();
        request.destroy = jest.fn((error?: Error) => {
            if (error) {
                request.emit('error', error);
            }
        });
        request.end = jest.fn(() => {
            callback(response);
            response.emit('data', Buffer.from(JSON.stringify(responseBody)));
            response.emit('end');
        });

        return request;
    });
}

function mockDesktopTransportFailure(
    transportModule: typeof http | typeof https,
    errorMessage: string = 'net::ERR_CONNECTION_CLOSED'
): void {
    (transportModule.request as unknown as jest.Mock).mockImplementationOnce((_options, _callback) => {
        const request = new EventEmitter() as EventEmitter & {
            write: jest.Mock;
            end: jest.Mock;
            destroy: jest.Mock;
        };

        request.write = jest.fn();
        request.destroy = jest.fn();
        request.end = jest.fn(() => {
            request.emit('error', new Error(errorMessage));
        });

        return request;
    });
}

describe('llmUtils expanded provider support', () => {
    let reporter: ProgressReporter;
    let settings: NotemdSettings;

    beforeEach(() => {
        reporter = createReporter();
        settings = { ...mockSettings, maxTokens: 2048 };
        (requestUrl as jest.Mock).mockReset();
        (http.request as unknown as jest.Mock).mockReset();
        (https.request as unknown as jest.Mock).mockReset();
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

    test('callLLM routes Qwen Code through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'Qwen Code',
            apiKey: 'dashscope-code-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen3-coder-plus',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'qwen-code-ok' } }] },
            text: '{"choices":[{"message":{"content":"qwen-code-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Write code', settings, reporter);

        expect(result).toBe('qwen-code-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer dashscope-code-key'
            })
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('qwen3-coder-plus');
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

    test('callLLM routes Z AI through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'Z AI',
            apiKey: 'zai-key',
            baseUrl: 'https://api.z.ai/api/paas/v4',
            model: 'glm-5',
            temperature: 0.3
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'zai-ok' } }] },
            text: '{"choices":[{"message":{"content":"zai-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Global content', settings, reporter);

        expect(result).toBe('zai-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.z.ai/api/paas/v4/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer zai-key'
            })
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('glm-5');
    });

    test('callLLM routes Huawei Cloud MaaS through the OpenAI-compatible runtime', async () => {
        const provider: LLMProviderConfig = {
            name: 'Huawei Cloud MaaS',
            apiKey: 'huawei-key',
            baseUrl: 'https://api.modelarts-maas.com/v1',
            model: 'DeepSeek-V3',
            temperature: 0.3
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'huawei-ok' } }] },
            text: '{"choices":[{"message":{"content":"huawei-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Hosted content', settings, reporter);

        expect(result).toBe('huawei-ok');
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.modelarts-maas.com/v1/chat/completions',
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer huawei-key'
            })
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('DeepSeek-V3');
    });

    test('callLLM retries after both requestUrl and desktop fallback fail on the first transient OpenAI disconnect', async () => {
        jest.useFakeTimers();

        try {
            const provider: LLMProviderConfig = {
                name: 'OpenAI',
                apiKey: 'openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                temperature: 0.2
            };

            settings = { ...settings, enableStableApiCall: false };

            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: { choices: [{ message: { content: 'retry-ok' } }] },
                    text: '{"choices":[{"message":{"content":"retry-ok"}}]}'
                });
            mockDesktopTransportFailure(https);

            const pendingResult = callLLM(provider, 'System prompt', 'Slow provider content', settings, reporter);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(5200);

            await expect(pendingResult).resolves.toBe('retry-ok');
            expect(requestUrl).toHaveBeenCalledTimes(2);
            expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Transient network error detected'));
            expect(https.request).toHaveBeenCalledTimes(1);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test('callLLM falls back to the stable retry sequence after requestUrl and desktop fallback both fail', async () => {
        jest.useFakeTimers();

        try {
            const provider: LLMProviderConfig = {
                name: 'OpenAI',
                apiKey: 'openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                temperature: 0.2
            };

            settings = {
                ...settings,
                enableStableApiCall: false,
                apiCallMaxRetries: 3,
                apiCallInterval: 7
            };

            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: { choices: [{ message: { content: 'stable-fallback-ok' } }] },
                    text: '{"choices":[{"message":{"content":"stable-fallback-ok"}}]}'
                });
            mockDesktopTransportFailure(https);
            mockDesktopTransportFailure(https);

            const pendingResult = callLLM(provider, 'System prompt', 'Fallback content', settings, reporter);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(14500);

            await expect(pendingResult).resolves.toBe('stable-fallback-ok');
            expect(requestUrl).toHaveBeenCalledTimes(3);
            expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Switching to stable API retry logic'));
            expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Waiting 7 seconds before retry 3'));
            expect(https.request).toHaveBeenCalledTimes(2);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test.each([
        {
            name: 'OpenAI-compatible',
            provider: {
                name: 'OpenAI',
                apiKey: 'openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                temperature: 0.2
            } as LLMProviderConfig,
            response: {
                choices: [{ message: { content: 'desktop-openai-ok' } }]
            },
            expected: 'desktop-openai-ok',
            transportModule: https
        },
        {
            name: 'Anthropic',
            provider: {
                name: 'Anthropic',
                apiKey: 'anthropic-key',
                baseUrl: 'https://api.anthropic.com',
                model: 'claude-3-5-sonnet-20240620',
                temperature: 0.5
            } as LLMProviderConfig,
            response: {
                content: [{ text: 'desktop-anthropic-ok' }]
            },
            expected: 'desktop-anthropic-ok',
            transportModule: https
        },
        {
            name: 'Google',
            provider: {
                name: 'Google',
                apiKey: 'google-key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.5
            } as LLMProviderConfig,
            response: {
                candidates: [{ content: { parts: [{ text: 'desktop-google-ok' }] } }]
            },
            expected: 'desktop-google-ok',
            transportModule: https
        },
        {
            name: 'Azure OpenAI',
            provider: {
                name: 'Azure OpenAI',
                apiKey: 'azure-key',
                baseUrl: 'https://azure.example.com',
                model: 'gpt-4o',
                temperature: 0.5,
                apiVersion: '2025-01-01-preview'
            } as LLMProviderConfig,
            response: {
                choices: [{ message: { content: 'desktop-azure-ok' } }]
            },
            expected: 'desktop-azure-ok',
            transportModule: https
        },
        {
            name: 'Ollama',
            provider: {
                name: 'Ollama',
                apiKey: '',
                baseUrl: 'http://localhost:11434/api',
                model: 'llama3',
                temperature: 0.7
            } as LLMProviderConfig,
            response: {
                message: { content: 'desktop-ollama-ok' }
            },
            expected: 'desktop-ollama-ok',
            transportModule: http
        }
    ])('callLLM falls back to desktop transport after a transient requestUrl failure for $name', async ({ provider, response, expected, transportModule }) => {
        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportSuccess(transportModule, response);

        await expect(callLLM(provider, 'System prompt', 'Desktop fallback content', settings, reporter)).resolves.toBe(expected);
        expect(requestUrl).toHaveBeenCalledTimes(1);
        expect(transportModule.request).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('desktop HTTP transport'));
    });

    test.each([
        {
            name: 'Anthropic',
            provider: {
                name: 'Anthropic',
                apiKey: 'anthropic-key',
                baseUrl: 'https://api.anthropic.com',
                model: 'claude-3-5-sonnet-20240620',
                temperature: 0.5
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { content: [{ text: 'anthropic-ok' }] },
                text: '{"content":[{"text":"anthropic-ok"}]}'
            },
            expected: 'anthropic-ok',
            transportModule: https
        },
        {
            name: 'Google',
            provider: {
                name: 'Google',
                apiKey: 'google-key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.5
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { candidates: [{ content: { parts: [{ text: 'google-ok' }] } }] },
                text: '{"candidates":[{"content":{"parts":[{"text":"google-ok"}]}}]}'
            },
            expected: 'google-ok',
            transportModule: https
        },
        {
            name: 'Azure OpenAI',
            provider: {
                name: 'Azure OpenAI',
                apiKey: 'azure-key',
                baseUrl: 'https://azure.example.com',
                model: 'gpt-4o',
                temperature: 0.5,
                apiVersion: '2025-01-01-preview'
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { choices: [{ message: { content: 'azure-ok' } }] },
                text: '{"choices":[{"message":{"content":"azure-ok"}}]}'
            },
            expected: 'azure-ok',
            transportModule: https
        },
        {
            name: 'Ollama',
            provider: {
                name: 'Ollama',
                apiKey: '',
                baseUrl: 'http://localhost:11434/api',
                model: 'llama3',
                temperature: 0.7
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { message: { content: 'ollama-ok' } },
                text: '{"message":{"content":"ollama-ok"}}'
            },
            expected: 'ollama-ok',
            transportModule: http
        }
    ])('callLLM retries transient network disconnects for $name transport after desktop fallback also fails', async ({ provider, response, expected, transportModule }) => {
        jest.useFakeTimers();

        try {
            settings = { ...settings, enableStableApiCall: false };

            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce(response);
            mockDesktopTransportFailure(transportModule);

            const pendingResult = callLLM(provider, 'System prompt', 'Transport content', settings, reporter);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(5200);

            await expect(pendingResult).resolves.toBe(expected);
            expect(requestUrl).toHaveBeenCalledTimes(2);
            expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Switching to stable API retry logic'));
            expect(transportModule.request).toHaveBeenCalledTimes(1);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test('callLLM does not retry fatal OpenAI client errors when stable API calls are disabled', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 400,
            json: { error: { message: 'Bad request' } },
            text: '{"error":{"message":"Bad request"}}'
        });

        await expect(callLLM(provider, 'System prompt', 'Broken content', settings, reporter)).rejects.toThrow(
            'OpenAI API error: 400 - Bad request'
        );
        expect(requestUrl).toHaveBeenCalledTimes(1);
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

    test('testAPI uses direct chat probing for Qwen Code', async () => {
        const provider: LLMProviderConfig = {
            name: 'Qwen Code',
            apiKey: 'dashscope-code-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen3-coder-plus',
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
        expect(requestBody.model).toBe('qwen3-coder-plus');
    });

    test('testAPI uses direct chat probing for Z AI', async () => {
        const provider: LLMProviderConfig = {
            name: 'Z AI',
            apiKey: 'zai-key',
            baseUrl: 'https://api.z.ai/api/paas/v4',
            model: 'glm-5',
            temperature: 0.3
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
            url: 'https://api.z.ai/api/paas/v4/chat/completions',
            method: 'POST'
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('glm-5');
    });

    test('testAPI uses direct chat probing for Huawei Cloud MaaS', async () => {
        const provider: LLMProviderConfig = {
            name: 'Huawei Cloud MaaS',
            apiKey: 'huawei-key',
            baseUrl: 'https://api.modelarts-maas.com/v1',
            model: 'DeepSeek-V3',
            temperature: 0.3
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
            url: 'https://api.modelarts-maas.com/v1/chat/completions',
            method: 'POST'
        }));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.model).toBe('DeepSeek-V3');
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

    test('testAPI retries transient network disconnects for models-then-chat OpenAI providers', async () => {
        jest.useFakeTimers();

        try {
            const provider: LLMProviderConfig = {
                name: 'OpenAI',
                apiKey: 'openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                temperature: 0.2
            };

            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: { choices: [{ message: { content: 'ok' } }] },
                    text: '{"choices":[{"message":{"content":"ok"}}]}'
                });

            const pendingResult = testAPI(provider);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(10500);

            await expect(pendingResult).resolves.toEqual(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Successfully connected to OpenAI')
            }));
            expect(requestUrl).toHaveBeenCalledTimes(3);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test('testAPI retries transient network disconnects for chat-only openai-compatible providers', async () => {
        jest.useFakeTimers();

        try {
            const provider: LLMProviderConfig = {
                name: 'Qwen',
                apiKey: 'dashscope-key',
                baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                model: 'qwen-plus',
                temperature: 0.2
            };

            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: { choices: [{ message: { content: 'ok' } }] },
                    text: '{"choices":[{"message":{"content":"ok"}}]}'
                });

            const pendingResult = testAPI(provider);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(5200);

            await expect(pendingResult).resolves.toEqual(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Successfully connected to Qwen')
            }));
            expect(requestUrl).toHaveBeenCalledTimes(2);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test.each([
        {
            name: 'Qwen Code',
            provider: {
                name: 'Qwen Code',
                apiKey: 'dashscope-code-key',
                baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                model: 'qwen3-coder-plus',
                temperature: 0.2
            } as LLMProviderConfig
        },
        {
            name: 'Z AI',
            provider: {
                name: 'Z AI',
                apiKey: 'zai-key',
                baseUrl: 'https://api.z.ai/api/paas/v4',
                model: 'glm-5',
                temperature: 0.3
            } as LLMProviderConfig
        },
        {
            name: 'Huawei Cloud MaaS',
            provider: {
                name: 'Huawei Cloud MaaS',
                apiKey: 'huawei-key',
                baseUrl: 'https://api.modelarts-maas.com/v1',
                model: 'DeepSeek-V3',
                temperature: 0.3
            } as LLMProviderConfig
        }
    ])('testAPI retries transient network disconnects for $name chat-only probes', async ({ provider }) => {
        jest.useFakeTimers();

        try {
            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: { choices: [{ message: { content: 'ok' } }] },
                    text: '{"choices":[{"message":{"content":"ok"}}]}'
                });

            const pendingResult = testAPI(provider);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(5200);

            await expect(pendingResult).resolves.toEqual(expect.objectContaining({
                success: true
            }));
            expect(requestUrl).toHaveBeenCalledTimes(2);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });

    test.each([
        {
            name: 'Anthropic',
            provider: {
                name: 'Anthropic',
                apiKey: 'anthropic-key',
                baseUrl: 'https://api.anthropic.com',
                model: 'claude-3-5-sonnet-20240620',
                temperature: 0.5
            } as LLMProviderConfig
        },
        {
            name: 'Google',
            provider: {
                name: 'Google',
                apiKey: 'google-key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.5
            } as LLMProviderConfig
        },
        {
            name: 'Azure OpenAI',
            provider: {
                name: 'Azure OpenAI',
                apiKey: 'azure-key',
                baseUrl: 'https://azure.example.com',
                model: 'gpt-4o',
                temperature: 0.5,
                apiVersion: '2025-01-01-preview'
            } as LLMProviderConfig
        },
        {
            name: 'Ollama',
            provider: {
                name: 'Ollama',
                apiKey: '',
                baseUrl: 'http://localhost:11434/api',
                model: 'llama3',
                temperature: 0.7
            } as LLMProviderConfig
        }
    ])('testAPI retries transient network disconnects for $name', async ({ provider }) => {
        jest.useFakeTimers();

        try {
            (requestUrl as jest.Mock)
                .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'))
                .mockResolvedValueOnce({
                    status: 200,
                    json: {},
                    text: '{}'
                });

            const pendingResult = testAPI(provider);

            await Promise.resolve();
            await jest.advanceTimersByTimeAsync(5200);

            await expect(pendingResult).resolves.toEqual(expect.objectContaining({
                success: true
            }));
            expect(requestUrl).toHaveBeenCalledTimes(2);
        } finally {
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });
});
