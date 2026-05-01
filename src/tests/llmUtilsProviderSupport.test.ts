import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import { requestUrl } from 'obsidian';
import {
    callDeepSeekAPI,
    callLLM,
    callLMStudioApi,
    callMistralApi,
    callOpenAIApi,
    callOpenRouterAPI,
    callXaiApi,
    getDebugInfo,
    handleApiError,
    testAPI
} from '../llmUtils';
import { createDefaultProviders } from '../llmProviders';
import { DEFAULT_SETTINGS } from '../constants';
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

function mockDesktopTransportInterruptedResponse(
    transportModule: typeof http | typeof https,
    options: {
        errorMessage?: string;
        partialBody?: string;
        statusCode?: number;
        headers?: Record<string, string>;
    } = {}
): void {
    const {
        errorMessage = 'socket hang up',
        partialBody = '',
        statusCode = 200,
        headers = { 'x-request-id': 'desktop-debug-request' }
    } = options;

    (transportModule.request as unknown as jest.Mock).mockImplementationOnce((_options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
            statusCode?: number;
            headers?: Record<string, string>;
        };
        response.statusCode = statusCode;
        response.headers = headers;

        const request = new EventEmitter() as EventEmitter & {
            write: jest.Mock;
            end: jest.Mock;
            destroy: jest.Mock;
        };

        request.write = jest.fn();
        request.destroy = jest.fn();
        request.end = jest.fn(() => {
            callback(response);
            if (partialBody) {
                response.emit('data', Buffer.from(partialBody));
            }
            response.emit('error', new Error(errorMessage));
        });

        return request;
    });
}

function mockDesktopTransportStreamingSuccess(
    transportModule: typeof http | typeof https,
    frames: string[],
    options: {
        statusCode?: number;
        headers?: Record<string, string>;
    } = {}
): void {
    const {
        statusCode = 200,
        headers = {
            'content-type': 'text/event-stream',
            'x-request-id': 'desktop-stream-request'
        }
    } = options;

    (transportModule.request as unknown as jest.Mock).mockImplementationOnce((_options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
            statusCode?: number;
            headers?: Record<string, string>;
        };
        response.statusCode = statusCode;
        response.headers = headers;

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
            frames.forEach(frame => response.emit('data', Buffer.from(frame)));
            response.emit('end');
        });

        return request;
    });
}

function mockDesktopTransportStreamingInterruption(
    transportModule: typeof http | typeof https,
    options: {
        frames?: string[];
        errorMessage?: string;
        statusCode?: number;
        headers?: Record<string, string>;
    } = {}
): void {
    const {
        frames = [],
        errorMessage = 'socket hang up',
        statusCode = 200,
        headers = {
            'content-type': 'text/event-stream',
            'x-request-id': 'desktop-stream-request'
        }
    } = options;

    (transportModule.request as unknown as jest.Mock).mockImplementationOnce((_options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
            statusCode?: number;
            headers?: Record<string, string>;
        };
        response.statusCode = statusCode;
        response.headers = headers;

        const request = new EventEmitter() as EventEmitter & {
            write: jest.Mock;
            end: jest.Mock;
            destroy: jest.Mock;
        };

        request.write = jest.fn();
        request.destroy = jest.fn();
        request.end = jest.fn(() => {
            callback(response);
            frames.forEach(frame => response.emit('data', Buffer.from(frame)));
            response.emit('error', new Error(errorMessage));
        });

        return request;
    });
}

function mockFetchSuccess(
    responseBody: unknown,
    options: {
        status?: number;
        headers?: Record<string, string>;
    } = {}
): jest.Mock {
    const {
        status = 200,
        headers = {}
    } = options;

    const fetchMock = jest.fn().mockResolvedValue({
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(headers),
        body: undefined,
        text: jest.fn().mockResolvedValue(JSON.stringify(responseBody))
    });

    Object.defineProperty(globalThis, 'fetch', {
        value: fetchMock,
        configurable: true,
        writable: true
    });

    return fetchMock;
}

function createStreamingReader(chunks: string[], errorMessage?: string): { read: jest.Mock; releaseLock: jest.Mock } {
    const encodedChunks = chunks.map(chunk => new TextEncoder().encode(chunk));
    let index = 0;

    return {
        read: jest.fn().mockImplementation(async () => {
            if (index < encodedChunks.length) {
                return { done: false, value: encodedChunks[index++] };
            }

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
    };
}

function mockFetchStreamingSuccess(
    frames: string[],
    options: {
        status?: number;
        headers?: Record<string, string>;
    } = {}
): jest.Mock {
    const {
        status = 200,
        headers = {
            'content-type': 'text/event-stream',
            'x-request-id': 'fetch-stream-request'
        }
    } = options;
    const reader = createStreamingReader(frames);

    const fetchMock = jest.fn().mockResolvedValue({
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(headers),
        body: {
            getReader: () => reader
        },
        text: jest.fn().mockResolvedValue(frames.join(''))
    });

    Object.defineProperty(globalThis, 'fetch', {
        value: fetchMock,
        configurable: true,
        writable: true
    });

    return fetchMock;
}

function mockFetchStreamingInterruption(
    frames: string[],
    errorMessage: string,
    options: {
        status?: number;
        headers?: Record<string, string>;
    } = {}
): jest.Mock {
    const {
        status = 200,
        headers = {
            'content-type': 'text/event-stream',
            'x-request-id': 'fetch-stream-request'
        }
    } = options;
    const reader = createStreamingReader(frames, errorMessage);

    const fetchMock = jest.fn().mockResolvedValue({
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(headers),
        body: {
            getReader: () => reader
        },
        text: jest.fn().mockResolvedValue(frames.join(''))
    });

    Object.defineProperty(globalThis, 'fetch', {
        value: fetchMock,
        configurable: true,
        writable: true
    });

    return fetchMock;
}

async function withDesktopNodeTransportDisabled<T>(run: () => Promise<T>): Promise<T> {
    const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'versions');
    const originalVersions = process.versions;

    Object.defineProperty(process, 'versions', {
        value: { ...originalVersions, node: undefined },
        configurable: true,
        enumerable: originalDescriptor?.enumerable ?? true,
        writable: false
    });

    try {
        return await run();
    } finally {
        if (originalDescriptor) {
            Object.defineProperty(process, 'versions', originalDescriptor);
        } else {
            Object.defineProperty(process, 'versions', {
                value: originalVersions,
                configurable: true,
                enumerable: true,
                writable: false
            });
        }
    }
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
        Object.defineProperty(globalThis, 'fetch', {
            value: undefined,
            configurable: true,
            writable: true
        });
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

    test('callLLM sends DeepSeek advanced provider settings using current chat/completions fields', async () => {
        const provider: LLMProviderConfig = {
            name: 'DeepSeek',
            apiKey: 'deepseek-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.2,
            maxOutputTokens: 3210,
            topP: 0.65,
            reasoningEffort: 'high',
            thinkingEnabled: true
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'deepseek-advanced-ok' } }] },
            text: '{"choices":[{"message":{"content":"deepseek-advanced-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Need careful reasoning', settings, reporter);

        expect(result).toBe('deepseek-advanced-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody).toEqual(expect.objectContaining({
            model: 'deepseek-v4-pro',
            max_tokens: 3210,
            top_p: 0.65,
            reasoning_effort: 'high',
            thinking: { type: 'enabled' },
            temperature: 0.2
        }));
        expect(requestBody.max_completion_tokens).toBeUndefined();
    });

    test('callLLM keeps reasoning-model safeguards while still applying OpenAI provider overrides', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-5.4',
            temperature: 0.6,
            maxOutputTokens: 4096,
            topP: 0.8,
            reasoningEffort: 'high'
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'openai-reasoning-ok' } }] },
            text: '{"choices":[{"message":{"content":"openai-reasoning-ok"}}]}'
        });

        const result = await callLLM(provider, 'System prompt', 'Need careful reasoning', settings, reporter);

        expect(result).toBe('openai-reasoning-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody).toEqual(expect.objectContaining({
            model: 'gpt-5.4',
            max_tokens: 4096,
            top_p: 0.8,
            reasoning_effort: 'high'
        }));
        expect(requestBody.temperature).toBeUndefined();
        expect(requestBody.messages).toEqual([
            {
                role: 'user',
                content: 'System prompt\n\nNeed careful reasoning'
            }
        ]);
    });

    test('callLLM uses the known model max when the global max token setting is still at the default auto baseline', async () => {
        const provider = createDefaultProviders().find(candidate => candidate.name === 'Qwen Code');

        expect(provider).toBeDefined();

        const configuredProvider: LLMProviderConfig = {
            ...provider!,
            apiKey: 'qwen-code-key'
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'qwen-code-ok' } }] },
            text: '{"choices":[{"message":{"content":"qwen-code-ok"}}]}'
        });

        const result = await callLLM(
            configuredProvider,
            'System prompt',
            'Return a large code sample',
            { ...settings, maxTokens: DEFAULT_SETTINGS.maxTokens },
            reporter
        );

        expect(result).toBe('qwen-code-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody).toEqual(expect.objectContaining({
            model: 'qwen3-coder-plus',
            max_tokens: 65_536
        }));
    });

    test('callLLM preserves a user-selected max token setting when it is already below the known model max', async () => {
        const provider = createDefaultProviders().find(candidate => candidate.name === 'Qwen Code');

        expect(provider).toBeDefined();

        const configuredProvider: LLMProviderConfig = {
            ...provider!,
            apiKey: 'qwen-code-key'
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'qwen-code-low-ok' } }] },
            text: '{"choices":[{"message":{"content":"qwen-code-low-ok"}}]}'
        });

        await expect(
            callLLM(configuredProvider, 'System prompt', 'Keep a small cap', { ...settings, maxTokens: 4_096 }, reporter)
        ).resolves.toBe('qwen-code-low-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.max_tokens).toBe(4_096);
    });

    test('callLLM defers to API provider for unknown models when maxTokens is default (Cline-aligned)', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'unknown-openai-model',
            temperature: 0.5
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'unknown-model-ok' } }] },
            text: '{"choices":[{"message":{"content":"unknown-model-ok"}}]}'
        });

        await expect(
            callLLM(provider, 'System prompt', 'Unknown model content', { ...settings, maxTokens: DEFAULT_SETTINGS.maxTokens }, reporter)
        ).resolves.toBe('unknown-model-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.max_tokens).toBeUndefined();
    });


    test('callLLM preserves user maxTokens for unknown models when custom value is set (backward-compatible)', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'unknown-openai-model',
            temperature: 0.5
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'unknown-custom-ok' } }] },
            text: '{"choices":[{"message":{"content":"unknown-custom-ok"}}]}'
        });

        await expect(
            callLLM(provider, 'System prompt', 'Unknown model with custom cap', { ...settings, maxTokens: 4_096 }, reporter)
        ).resolves.toBe('unknown-custom-ok');

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        expect(requestBody.max_tokens).toBe(4_096);
    });
    test.each([
        {
            name: 'Anthropic',
            provider: {
                name: 'Anthropic',
                apiKey: 'anthropic-key',
                baseUrl: 'https://api.anthropic.com',
                model: 'claude-3-5-sonnet-20240620',
                temperature: 0.5,
                maxOutputTokens: 12_345
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { content: [{ text: 'anthropic-cap-ok' }] },
                text: '{"content":[{"text":"anthropic-cap-ok"}]}'
            },
            assertBody: (requestBody: any) => {
                expect(requestBody.max_tokens).toBe(8_192);
            }
        },
        {
            name: 'Google',
            provider: {
                name: 'Google',
                apiKey: 'google-key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.5,
                maxOutputTokens: 9_876
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { candidates: [{ content: { parts: [{ text: 'google-cap-ok' }] } }] },
                text: '{"candidates":[{"content":{"parts":[{"text":"google-cap-ok"}]}}]}'
            },
            assertBody: (requestBody: any) => {
                expect(requestBody.generationConfig.maxOutputTokens).toBe(8_192);
            }
        },
        {
            name: 'Azure OpenAI',
            provider: {
                name: 'Azure OpenAI',
                apiKey: 'azure-key',
                baseUrl: 'https://azure.example.com',
                model: 'gpt-4o',
                temperature: 0.5,
                apiVersion: '2025-01-01-preview',
                maxOutputTokens: 7_654
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { choices: [{ message: { content: 'azure-cap-ok' } }] },
                text: '{"choices":[{"message":{"content":"azure-cap-ok"}}]}'
            },
            assertBody: (requestBody: any) => {
                expect(requestBody.max_tokens).toBe(4_096);
            }
        },
        {
            name: 'Ollama',
            provider: {
                name: 'Ollama',
                apiKey: '',
                baseUrl: 'http://localhost:11434/api',
                model: 'llama3',
                temperature: 0.7,
                maxOutputTokens: 4_321
            } as LLMProviderConfig,
            response: {
                status: 200,
                json: { message: { content: 'ollama-cap-ok' } },
                text: '{"message":{"content":"ollama-cap-ok"}}'
            },
            assertBody: (requestBody: any) => {
                expect(requestBody.options.num_predict).toBe(4_321);
            }
        }
    ])('callLLM clamps provider maxOutputTokens overrides to the known model max for $name transport', async ({ provider, response, assertBody }) => {
        (requestUrl as jest.Mock).mockResolvedValue(response);

        await expect(
            callLLM(provider, 'System prompt', 'Override content', { ...settings, maxTokens: 4_096 }, reporter)
        ).resolves.toEqual(expect.any(String));

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[0][0].body);
        assertBody(requestBody);
    });

    test('callLLM fails clearly when DeepSeek thinking mode exhausts tokens before final content', async () => {
        const provider: LLMProviderConfig = {
            name: 'DeepSeek',
            apiKey: 'deepseek-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.2,
            maxOutputTokens: 256,
            topP: 0.65,
            reasoningEffort: 'high',
            thinkingEnabled: true
        };

        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: '',
                        reasoning_content: 'thinking only'
                    },
                    finish_reason: 'length'
                }]
            },
            text: '{"choices":[{"message":{"role":"assistant","content":"","reasoning_content":"thinking only"},"finish_reason":"length"}]}'
        });

        await expect(callLLM(provider, 'System prompt', 'Need careful reasoning', settings, reporter)).rejects.toThrow(
            'DeepSeek returned reasoning output but no final content before hitting the output token limit. Increase the provider Max tokens override or disable thinking mode.'
        );
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

    test('testAPI keeps DeepSeek connection probes minimal even when advanced provider settings are enabled', async () => {
        const provider: LLMProviderConfig = {
            name: 'DeepSeek',
            apiKey: 'deepseek-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.2,
            maxOutputTokens: 256,
            topP: 0.65,
            reasoningEffort: 'high',
            thinkingEnabled: true
        };

        (requestUrl as jest.Mock)
            .mockResolvedValueOnce({
                status: 500,
                json: { error: { message: 'models probe failed' } },
                text: '{"error":{"message":"models probe failed"}}'
            })
            .mockResolvedValueOnce({
                status: 200,
                json: { choices: [{ message: { content: 'ok' } }] },
                text: '{"choices":[{"message":{"content":"ok"}}]}'
            });

        const result = await testAPI(provider);

        expect(result.success).toBe(true);
        expect(requestUrl).toHaveBeenCalledTimes(2);

        const requestBody = JSON.parse((requestUrl as jest.Mock).mock.calls[1][0].body);
        expect(requestBody).toEqual(expect.objectContaining({
            model: 'deepseek-v4-pro',
            max_tokens: 1,
            temperature: 0
        }));
        expect(requestBody.top_p).toBeUndefined();
        expect(requestBody.reasoning_effort).toBeUndefined();
        expect(requestBody.thinking).toBeUndefined();
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

    test('handleApiError emits shared transport debug metadata with sanitized secrets for all providers', () => {
        const debugInfo = {
            attempts: [
                {
                    transport: 'requestUrl',
                    requestMethod: 'POST',
                    requestUrl: 'https://api.example.com/v1/chat/completions?key=top-secret',
                    durationMs: 68000,
                    errorMessage: 'net::ERR_CONNECTION_CLOSED'
                },
                {
                    transport: 'desktop-http',
                    requestMethod: 'POST',
                    requestUrl: 'https://api.example.com/v1/chat/completions?key=top-secret',
                    durationMs: 61000,
                    status: 502,
                    responseHeaders: {
                        'x-request-id': 'req-123',
                        authorization: 'Bearer very-secret'
                    },
                    partialResponseText: '{"error":"upstream timeout"}',
                    errorMessage: 'socket hang up'
                }
            ]
        };

        expect(() => handleApiError('Qwen', {
            status: 502,
            text: '{"error":{"message":"upstream timeout"}}',
            __notemdDebug: debugInfo
        }, reporter, true)).toThrow('Qwen API error: 502 - upstream timeout');

        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('[Qwen] Debug details:'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 [requestUrl]'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Attempt 2 [desktop-http]'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Request: POST https://api.example.com/v1/chat/completions?key=[REDACTED]'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Duration: 68000ms'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Response Headers: {"x-request-id":"req-123","authorization":"[REDACTED]"}'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Partial Response: {"error":"upstream timeout"}'));
    });

    test('callLLM logs partial desktop fallback responses in debug mode when the fallback transport is interrupted', async () => {
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
            enableApiErrorDebugMode: true,
            apiCallMaxRetries: 0
        };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportInterruptedResponse(https, {
            partialBody: '{"id":"chatcmpl-partial","choices":['
        });

        await expect(callLLM(provider, 'System prompt', 'Slow content', settings, reporter)).rejects.toThrow(
            'OpenAI API request failed: socket hang up'
        );

        const debugLog = (reporter.log as jest.Mock).mock.calls
            .map(call => String(call[0]))
            .find(entry => entry.includes('[OpenAI] Debug details:'));

        expect(debugLog).toContain('Attempt 1 [requestUrl]');
        expect(debugLog).toContain('Attempt 2 [desktop-http-stream]');
        expect(debugLog).toContain('Partial Response: {"id":"chatcmpl-partial","choices":[');
        expect(debugLog).toContain('Response Headers: {"x-request-id":"desktop-debug-request"}');
    });

    test('getDebugInfo includes stack and shared transport attempts', () => {
        const error = Object.assign(new Error('socket hang up'), {
            __notemdDebug: {
                attempts: [
                    {
                        transport: 'desktop-http',
                        requestMethod: 'POST',
                        requestUrl: 'https://api.example.com/v1/chat/completions?key=super-secret',
                        durationMs: 60000,
                        partialResponseText: '{"message":"partial"}'
                    }
                ]
            }
        });

        const debugInfo = getDebugInfo(error);

        expect(debugInfo).toContain('Stack:');
        expect(debugInfo).toContain('Attempt 1 [desktop-http]');
        expect(debugInfo).toContain('Request: POST https://api.example.com/v1/chat/completions?key=[REDACTED]');
        expect(debugInfo).toContain('Partial Response: {"message":"partial"}');
    });

    test('callLLM uses desktop streaming transport as primary long-request path for OpenAI-compatible providers when stable mode is enabled', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: true };
        mockDesktopTransportStreamingSuccess(https, [
            '{"choices":[{"message":{"content":"primary-desktop-ok"}}]}'
        ], {
            headers: {
                'content-type': 'application/json',
                'x-request-id': 'desktop-primary-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Primary desktop content', settings, reporter)).resolves.toBe('primary-desktop-ok');
        expect(requestUrl).not.toHaveBeenCalled();
        expect(https.request).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Using desktop HTTP streaming transport as primary long-request path'));
    });

    test('callLLM falls back to direct desktop non-stream transport when primary desktop streaming transport fails in stable mode', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: true };
        mockDesktopTransportFailure(https, 'socket hang up');
        mockDesktopTransportSuccess(https, {
            choices: [{ message: { content: 'desktop-non-stream-after-primary-failure' } }]
        });

        await expect(callLLM(provider, 'System prompt', 'Fallback content', settings, reporter)).resolves.toBe('desktop-non-stream-after-primary-failure');
        expect(https.request).toHaveBeenCalledTimes(2);
        expect(requestUrl).not.toHaveBeenCalled();
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Primary desktop HTTP streaming transport failed'));
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('desktop HTTP transport (non-stream)'));
    });

    test('callLLM falls back to requestUrl only after both primary desktop streaming and direct desktop non-stream transports fail in stable mode', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: true };
        mockDesktopTransportFailure(https, 'socket hang up');
        mockDesktopTransportFailure(https, 'read ECONNRESET');
        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            json: { choices: [{ message: { content: 'requesturl-after-direct-non-stream-failure' } }] },
            text: '{"choices":[{"message":{"content":"requesturl-after-direct-non-stream-failure"}}]}'
        });

        await expect(callLLM(provider, 'System prompt', 'Fallback content', settings, reporter)).resolves.toBe('requesturl-after-direct-non-stream-failure');
        expect(https.request).toHaveBeenCalledTimes(2);
        expect(requestUrl).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('Direct desktop HTTP transport (non-stream) fallback failed'));
    });

    test('callLLM does not attempt non-stream or requestUrl fallback when primary desktop streaming transport aborts in stable mode', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = {
            ...settings,
            enableStableApiCall: true,
            apiCallMaxRetries: 0
        };

        mockDesktopTransportFailure(https, 'The operation was aborted.');

        await expect(callLLM(provider, 'System prompt', 'Cancelled content', settings, reporter)).rejects.toThrow(
            'OpenAI API request failed: The operation was aborted.'
        );
        expect(https.request).toHaveBeenCalledTimes(1);
        expect(requestUrl).not.toHaveBeenCalled();
    });

    test('callLLM falls back to web fetch transport after a transient requestUrl failure when desktop transport is unavailable', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        const fetchMock = mockFetchSuccess({
            choices: [{ message: { content: 'web-fetch-ok' } }]
        }, {
            headers: { 'x-request-id': 'fetch-runtime' }
        });

        await withDesktopNodeTransportDisabled(async () => {
            await expect(callLLM(provider, 'System prompt', 'Fetch fallback content', settings, reporter)).resolves.toBe('web-fetch-ok');
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('web fetch transport'));
    });

    test('testAPI falls back to web fetch transport after a transient requestUrl failure when desktop transport is unavailable', async () => {
        const provider: LLMProviderConfig = {
            name: 'Qwen',
            apiKey: 'dashscope-key',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-plus',
            temperature: 0.2
        };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        const fetchMock = mockFetchSuccess({
            choices: [{ message: { content: 'ok' } }]
        }, {
            headers: { 'x-request-id': 'fetch-testapi' }
        });

        await withDesktopNodeTransportDisabled(async () => {
            await expect(testAPI(provider)).resolves.toEqual(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Successfully connected to Qwen')
            }));
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('callLLM assembles OpenAI-compatible SSE chunks from desktop fallback after a transient requestUrl failure', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(https, [
            'data: {"choices":[{"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n'
        ]);

        await expect(callLLM(provider, 'System prompt', 'Streamed content', settings, reporter)).resolves.toBe('Hello world');
        expect(https.request).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM captures partial parsed SSE content in debug mode when desktop streaming fallback aborts', async () => {
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
            enableApiErrorDebugMode: true,
            apiCallMaxRetries: 0
        };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingInterruption(https, {
            frames: [
                'data: {"choices":[{"delta":{"content":"Partial"},"finish_reason":null}]}\n\n'
            ]
        });

        await expect(callLLM(provider, 'System prompt', 'Slow streamed content', settings, reporter)).rejects.toThrow(
            'OpenAI API request failed: socket hang up'
        );

        const debugLog = (reporter.log as jest.Mock).mock.calls
            .map(call => String(call[0]))
            .find(entry => entry.includes('[OpenAI] Debug details:'));

        expect(debugLog).toContain('Attempt 2 [desktop-http-stream]');
        expect(debugLog).toContain('Partial Parsed Response: Partial');
        expect(debugLog).toContain('Partial Response: data: {"choices":[{"delta":{"content":"Partial"},"finish_reason":null}]}');
    });

    test('callLLM assembles OpenAI-compatible SSE chunks from web fetch fallback when desktop transport is unavailable', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.2
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        const fetchMock = mockFetchStreamingSuccess([
            'data: {"choices":[{"delta":{"content":"web"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{"content":" fetch"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n'
        ]);

        await withDesktopNodeTransportDisabled(async () => {
            await expect(callLLM(provider, 'System prompt', 'Web stream content', settings, reporter)).resolves.toBe('web fetch');
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM assembles Anthropic streaming fallback chunks after a transient requestUrl failure', async () => {
        const provider: LLMProviderConfig = {
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(https, [
            'event: content_block_delta\n',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n',
            'event: content_block_delta\n',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" Anthropic"}}\n\n',
            'event: message_delta\n',
            'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
            'event: message_stop\n',
            'data: {"type":"message_stop"}\n\n'
        ], {
            headers: {
                'content-type': 'text/event-stream',
                'x-request-id': 'anthropic-stream-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Anthropic streamed content', settings, reporter)).resolves.toBe('Hello Anthropic');
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM assembles Google streaming fallback chunks after a transient requestUrl failure', async () => {
        const provider: LLMProviderConfig = {
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1',
            model: 'gemini-2.0-flash-exp',
            temperature: 0.5
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(https, [
            'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
            'data: {"candidates":[{"content":{"parts":[{"text":" Google"}]}}]}\n\n'
        ], {
            headers: {
                'content-type': 'text/event-stream',
                'x-request-id': 'google-stream-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Google streamed content', settings, reporter)).resolves.toBe('Hello Google');
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM assembles Azure OpenAI streaming fallback chunks after a transient requestUrl failure', async () => {
        const provider: LLMProviderConfig = {
            name: 'Azure OpenAI',
            apiKey: 'azure-key',
            baseUrl: 'https://azure.example.com',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(https, [
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{"content":" Azure"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n'
        ], {
            headers: {
                'content-type': 'text/event-stream',
                'x-request-id': 'azure-stream-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Azure streamed content', settings, reporter)).resolves.toBe('Hello Azure');
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM assembles Ollama streaming fallback chunks after a transient requestUrl failure', async () => {
        const provider: LLMProviderConfig = {
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(http, [
            '{"model":"llama3","message":{"role":"assistant","content":"Hello"},"done":false}\n',
            '{"model":"llama3","message":{"role":"assistant","content":" Ollama"},"done":false}\n',
            '{"model":"llama3","message":{"role":"assistant","content":""},"done":true,"done_reason":"stop"}\n'
        ], {
            headers: {
                'content-type': 'application/x-ndjson',
                'x-request-id': 'ollama-stream-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Ollama streamed content', settings, reporter)).resolves.toBe('Hello Ollama');
        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callLLM captures partial parsed Anthropic stream output in debug mode when streaming fallback aborts', async () => {
        const provider: LLMProviderConfig = {
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        };

        settings = {
            ...settings,
            enableStableApiCall: false,
            enableApiErrorDebugMode: true,
            apiCallMaxRetries: 0
        };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingInterruption(https, {
            frames: [
                'event: content_block_delta\n',
                'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Partial Claude"}}\n\n'
            ],
            headers: {
                'content-type': 'text/event-stream',
                'x-request-id': 'anthropic-stream-request'
            }
        });

        await expect(callLLM(provider, 'System prompt', 'Slow anthropic content', settings, reporter)).rejects.toThrow(
            'Anthropic API request failed: socket hang up'
        );

        const debugLog = (reporter.log as jest.Mock).mock.calls
            .map(call => String(call[0]))
            .find(entry => entry.includes('[Anthropic] Debug details:'));

        expect(debugLog).toContain('Partial Parsed Response: Partial Claude');
        expect(debugLog).toContain('Attempt 2 [desktop-http-stream]');
    });

    test('callLLM assembles Anthropic streaming fallback chunks from web fetch when desktop transport is unavailable', async () => {
        const provider: LLMProviderConfig = {
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        const fetchMock = mockFetchStreamingSuccess([
            'event: content_block_delta\n',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Web"}}\n\n',
            'event: content_block_delta\n',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" Claude"}}\n\n',
            'event: message_stop\n',
            'data: {"type":"message_stop"}\n\n'
        ], {
            headers: {
                'content-type': 'text/event-stream',
                'x-request-id': 'anthropic-fetch-stream-request'
            }
        });

        await withDesktopNodeTransportDisabled(async () => {
            await expect(callLLM(provider, 'System prompt', 'Anthropic web streamed content', settings, reporter)).resolves.toBe('Web Claude');
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('callLLM assembles Ollama streaming fallback chunks from web fetch when desktop transport is unavailable', async () => {
        const provider: LLMProviderConfig = {
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        const fetchMock = mockFetchStreamingSuccess([
            '{"model":"llama3","message":{"role":"assistant","content":"Web"},"done":false}\n',
            '{"model":"llama3","message":{"role":"assistant","content":" Ollama"},"done":false}\n',
            '{"model":"llama3","message":{"role":"assistant","content":""},"done":true,"done_reason":"stop"}\n'
        ], {
            headers: {
                'content-type': 'application/x-ndjson',
                'x-request-id': 'ollama-fetch-stream-request'
            }
        });

        await withDesktopNodeTransportDisabled(async () => {
            await expect(callLLM(provider, 'System prompt', 'Ollama web streamed content', settings, reporter)).resolves.toBe('Web Ollama');
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('callLLM captures partial parsed Ollama stream output from web fetch in debug mode when streaming fallback aborts', async () => {
        const provider: LLMProviderConfig = {
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        };

        settings = {
            ...settings,
            enableStableApiCall: false,
            enableApiErrorDebugMode: true,
            apiCallMaxRetries: 0
        };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockFetchStreamingInterruption([
            '{"model":"llama3","message":{"role":"assistant","content":"Partial Ollama"},"done":false}\n'
        ], 'socket hang up', {
            headers: {
                'content-type': 'application/x-ndjson',
                'x-request-id': 'ollama-fetch-stream-request'
            }
        });

        await withDesktopNodeTransportDisabled(async () => {
            await expect(callLLM(provider, 'System prompt', 'Interrupted ollama stream', settings, reporter)).rejects.toThrow(
                'Ollama API request failed: socket hang up'
            );
        });

        const debugLog = (reporter.log as jest.Mock).mock.calls
            .map(call => String(call[0]))
            .find(entry => entry.includes('[Ollama] Debug details:'));

        expect(debugLog).toContain('Partial Parsed Response: Partial Ollama');
        expect(debugLog).toContain('Attempt 2 [web-fetch-stream]');
    });

    test.each([
        {
            name: 'OpenAI direct wrapper',
            provider: {
                name: 'OpenAI',
                apiKey: 'openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
                temperature: 0.2
            } as LLMProviderConfig,
            callApi: callOpenAIApi,
            transportModule: https,
            expected: 'Hello OpenAI'
        },
        {
            name: 'DeepSeek direct wrapper',
            provider: {
                name: 'DeepSeek',
                apiKey: 'deepseek-key',
                baseUrl: 'https://api.deepseek.com/v1',
                model: 'deepseek-chat',
                temperature: 0.2
            } as LLMProviderConfig,
            callApi: callDeepSeekAPI,
            transportModule: https,
            expected: 'Hello DeepSeek'
        },
        {
            name: 'Mistral direct wrapper',
            provider: {
                name: 'Mistral',
                apiKey: 'mistral-key',
                baseUrl: 'https://api.mistral.ai/v1',
                model: 'mistral-large-latest',
                temperature: 0.2
            } as LLMProviderConfig,
            callApi: callMistralApi,
            transportModule: https,
            expected: 'Hello Mistral'
        },
        {
            name: 'OpenRouter direct wrapper',
            provider: {
                name: 'OpenRouter',
                apiKey: 'openrouter-key',
                baseUrl: 'https://openrouter.ai/api/v1',
                model: 'anthropic/claude-3.7-sonnet',
                temperature: 0.7
            } as LLMProviderConfig,
            callApi: callOpenRouterAPI,
            transportModule: https,
            expected: 'Hello OpenRouter'
        },
        {
            name: 'xAI direct wrapper',
            provider: {
                name: 'xAI',
                apiKey: 'xai-key',
                baseUrl: 'https://api.x.ai/v1',
                model: 'grok-4',
                temperature: 0.7
            } as LLMProviderConfig,
            callApi: callXaiApi,
            transportModule: https,
            expected: 'Hello xAI'
        },
        {
            name: 'LMStudio direct wrapper',
            provider: {
                name: 'LMStudio',
                apiKey: '',
                baseUrl: 'http://localhost:1234/v1',
                model: 'local-model',
                temperature: 0.7
            } as LLMProviderConfig,
            callApi: callLMStudioApi,
            transportModule: http,
            expected: 'Hello LMStudio'
        }
    ])('$name assembles streamed fallback chunks after a transient requestUrl failure', async ({ provider, callApi, transportModule, expected }) => {
        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(transportModule, [
            `data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n`,
            `data: {"choices":[{"delta":{"content":" ${provider.name}"},"finish_reason":null}]}\n\n`,
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n'
        ]);

        await expect(
            callApi(provider, provider.model, 'System prompt', `${provider.name} streamed content`, reporter, settings)
        ).resolves.toBe(expected);

        expect(reporter.log).toHaveBeenCalledWith(expect.stringContaining('streaming response parsing'));
    });

    test('callOpenRouterAPI preserves gateway headers when switching into streamed fallback', async () => {
        const provider: LLMProviderConfig = {
            name: 'OpenRouter',
            apiKey: 'openrouter-key',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'anthropic/claude-3.7-sonnet',
            temperature: 0.7
        };

        settings = { ...settings, enableStableApiCall: false };

        (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('net::ERR_CONNECTION_CLOSED'));
        mockDesktopTransportStreamingSuccess(https, [
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{"content":" OpenRouter"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n'
        ]);

        await expect(
            callOpenRouterAPI(provider, provider.model, 'System prompt', 'OpenRouter streamed content', reporter, settings)
        ).resolves.toBe('Hello OpenRouter');

        expect((https.request as unknown as jest.Mock).mock.calls[0][0].headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer openrouter-key',
            'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
            'X-Title': 'Notemd Obsidian Plugin',
            Accept: 'text/event-stream'
        }));
    });
});
