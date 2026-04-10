const {
    buildDiagnosticPlan,
    createProtocolAccumulator,
    ingestProtocolChunk,
    finalizeProtocolAccumulator,
    formatDiagnosticText,
    parseCliArgs,
    validateCliConfig
} = require('../../scripts/lib/llm-provider-diagnostic.js');

describe('llm provider diagnostic script helpers', () => {
    test('buildDiagnosticPlan creates OpenRouter compare requests with gateway headers and streamed fallback body', () => {
        const plan = buildDiagnosticPlan({
            transport: 'openai-compatible',
            providerName: 'OpenRouter',
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: 'secret-openrouter-key',
            model: 'anthropic/claude-3.7-sonnet',
            prompt: 'System prompt',
            content: 'User content',
            temperature: 0.7,
            maxTokens: 2048,
            mode: 'compare'
        });

        expect(plan.bufferedRequest.url).toBe('https://openrouter.ai/api/v1/chat/completions');
        expect(plan.bufferedRequest.headers).toEqual(expect.objectContaining({
            Authorization: 'Bearer secret-openrouter-key',
            'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
            'X-Title': 'Notemd Obsidian Plugin'
        }));

        const bufferedBody = JSON.parse(plan.bufferedRequest.body);
        const streamingBody = JSON.parse(plan.streamingRequest.body);
        expect(bufferedBody.stream).toBeUndefined();
        expect(streamingBody.stream).toBe(true);
        expect(plan.streamingRequest.headers.Accept).toBe('text/event-stream');
    });

    test.each([
        {
            transport: 'openai-compatible',
            chunk: 'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
            expected: 'Hello world'
        },
        {
            transport: 'anthropic',
            chunk: 'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" Claude"}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n',
            expected: 'Hello Claude'
        },
        {
            transport: 'google',
            chunk: 'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\ndata: {"candidates":[{"content":{"parts":[{"text":" Gemini"}]}}]}\n\n',
            expected: 'Hello Gemini'
        },
        {
            transport: 'ollama',
            chunk: '{"message":{"content":"Hello"},"done":false}\n{"message":{"content":" Ollama"},"done":false}\n{"message":{"content":""},"done":true}\n',
            expected: 'Hello Ollama'
        }
    ])('finalizeProtocolAccumulator assembles parsed text for $transport streams', ({ transport, chunk, expected }) => {
        const state = createProtocolAccumulator(transport);
        ingestProtocolChunk(transport, state, chunk);

        const finalized = finalizeProtocolAccumulator(transport, state);

        expect(finalized.parsedText).toBe(expected);
        expect(finalized.rawText).toContain('Hello');
    });

    test('formatDiagnosticText redacts sensitive headers and query params while keeping parsed response details', () => {
        const output = formatDiagnosticText({
            meta: {
                transport: 'openai-compatible',
                providerName: 'OpenRouter',
                mode: 'compare'
            },
            attempts: [
                {
                    label: 'buffered',
                    request: {
                        method: 'POST',
                        url: 'https://openrouter.ai/api/v1/chat/completions?api-key=secret',
                        headers: {
                            Authorization: 'Bearer secret-openrouter-key',
                            'X-Api-Key': 'top-secret'
                        }
                    },
                    response: {
                        status: 200,
                        firstByteMs: 5123,
                        durationMs: 120034,
                        headers: {
                            'x-request-id': 'req_123'
                        },
                        partialParsedText: 'Partial OpenRouter',
                        partialBody: 'data: {"choices":[{"delta":{"content":"Partial OpenRouter"}}]}'
                    },
                    error: 'socket hang up'
                }
            ]
        });

        expect(output).toContain('api-key=%5BREDACTED%5D');
        expect(output).toContain('"Authorization":"[REDACTED]"');
        expect(output).toContain('"X-Api-Key":"[REDACTED]"');
        expect(output).toContain('Partial Parsed Response: Partial OpenRouter');
        expect(output).not.toContain('secret-openrouter-key');
        expect(output).not.toContain('top-secret');
    });

    test('parseCliArgs and validateCliConfig support file-based prompt/content and required fields', () => {
        const args = parseCliArgs([
            '--transport', 'openai-compatible',
            '--provider-name', 'OpenRouter',
            '--base-url', 'https://openrouter.ai/api/v1',
            '--api-key', 'secret-key',
            '--model', 'anthropic/claude-3.7-sonnet',
            '--prompt', 'System prompt',
            '--content', 'User content',
            '--mode', 'compare',
            '--timeout-ms', '300000',
            '--json'
        ]);

        expect(args).toEqual(expect.objectContaining({
            transport: 'openai-compatible',
            providerName: 'OpenRouter',
            mode: 'compare',
            timeoutMs: 300000,
            json: true
        }));
        expect(() => validateCliConfig(args)).not.toThrow();
    });
});
