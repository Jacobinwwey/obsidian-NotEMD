'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');

const SENSITIVE_QUERY_PARAMS = new Set([
    'access_token',
    'api-key',
    'api_key',
    'authorization',
    'key',
    'token',
    'x-api-key'
]);

const SENSITIVE_HEADERS = new Set([
    'api-key',
    'authorization',
    'proxy-authorization',
    'x-api-key'
]);

function isOpenAIReasoningModel(modelName) {
    const normalized = String(modelName || '').toLowerCase();
    return normalized.startsWith('o1')
        || normalized.startsWith('o3')
        || normalized.startsWith('o4')
        || normalized.startsWith('gpt-5');
}

function isDeepSeekReasoningModel(modelName) {
    const normalized = String(modelName || '').toLowerCase();
    return normalized === 'deepseek-reasoner'
        || normalized.includes('deepseek-reasoner')
        || normalized.includes('-r1');
}

function isOpenRouterReasoningModel(modelName) {
    const normalized = String(modelName || '').toLowerCase();
    return normalized.includes('deepseek-r1')
        || normalized.includes('reasoner')
        || normalized.includes('openai/o1')
        || normalized.includes('openai/o3')
        || normalized.includes('openai/o4')
        || normalized.includes('gpt-5');
}

function shouldUseCombinedUserPrompt(providerName, modelName) {
    switch (providerName) {
        case 'DeepSeek':
            return isDeepSeekReasoningModel(modelName);
        case 'OpenRouter':
            return isOpenRouterReasoningModel(modelName);
        default:
            return isOpenAIReasoningModel(modelName);
    }
}

function buildOpenAICompatibleHeaders(providerName, apiKey) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (apiKey || providerName === 'LMStudio') {
        headers.Authorization = `Bearer ${apiKey || 'EMPTY'}`;
    }

    if (providerName === 'OpenRouter' || providerName === 'Requesty') {
        headers['HTTP-Referer'] = 'https://github.com/Jacobinwwey/obsidian-NotEMD';
        headers['X-Title'] = 'Notemd Obsidian Plugin';
    }

    return headers;
}

function buildOpenAICompatibleMessages(providerName, modelName, prompt, content) {
    if (shouldUseCombinedUserPrompt(providerName, modelName)) {
        return [{ role: 'user', content: [prompt, content].filter(Boolean).join('\n\n') }];
    }

    return [
        { role: 'system', content: prompt },
        { role: 'user', content }
    ];
}

function buildOpenAICompatibleRequestBody(config, stream) {
    const requestBody = {
        model: config.model,
        messages: buildOpenAICompatibleMessages(config.providerName, config.model, config.prompt, config.content)
    };

    const isReasoningModel = shouldUseCombinedUserPrompt(config.providerName, config.model);
    if (config.providerName === 'DeepSeek') {
        if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
            requestBody.max_completion_tokens = config.maxTokens;
        }
        if (!isDeepSeekReasoningModel(config.model) && typeof config.temperature === 'number') {
            requestBody.temperature = config.temperature;
        }
    } else if (!isReasoningModel) {
        if (typeof config.temperature === 'number') {
            requestBody.temperature = config.temperature;
        }
        if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
            requestBody.max_tokens = config.maxTokens;
        }
    } else if (config.providerName === 'OpenRouter' && String(config.model || '').toLowerCase().includes('deepseek')) {
        requestBody.temperature = 0.7;
    }

    if (stream) {
        requestBody.stream = true;
    }

    return requestBody;
}

function sanitizeUrl(url) {
    try {
        const parsed = new URL(url);
        for (const [key] of parsed.searchParams.entries()) {
            if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
                parsed.searchParams.set(key, '[REDACTED]');
            }
        }
        return parsed.toString();
    } catch (_error) {
        return url;
    }
}

function sanitizeHeaders(headers) {
    if (!headers) {
        return {};
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
        sanitized[key] = SENSITIVE_HEADERS.has(String(key).toLowerCase()) ? '[REDACTED]' : String(value);
    }
    return sanitized;
}

function normalizeHeaders(headers) {
    if (!headers) {
        return {};
    }

    const normalized = {};
    for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            normalized[key] = value.join(', ');
        } else if (value !== undefined && value !== null) {
            normalized[key] = String(value);
        }
    }
    return normalized;
}

function splitBufferedText(buffer, delimiter, flush) {
    const parts = buffer.split(delimiter);
    if (flush) {
        return { frames: parts, remainder: '' };
    }

    return {
        frames: parts.slice(0, -1),
        remainder: parts[parts.length - 1] || ''
    };
}

function extractSsePayload(frame) {
    const normalizedFrame = frame.replace(/\r\n/g, '\n').trim();
    if (!normalizedFrame) {
        return null;
    }

    const dataLines = normalizedFrame
        .split('\n')
        .filter(line => line.startsWith('data:'));

    if (!dataLines.length) {
        return null;
    }

    return dataLines
        .map(line => line.slice(5).trimStart())
        .join('\n')
        .trim();
}

function parseJsonPayload(transport, payload) {
    return JSON.parse(payload);
}

function createProtocolAccumulator(transport) {
    switch (transport) {
        case 'openai-compatible':
        case 'azure-openai':
            return {
                transport,
                buffer: '',
                rawText: '',
                parsedText: '',
                parsedReasoningText: '',
                sawDone: false,
                sawFinishReason: false
            };
        case 'anthropic':
            return {
                transport,
                buffer: '',
                rawText: '',
                parsedText: '',
                sawStop: false
            };
        case 'google':
            return {
                transport,
                buffer: '',
                rawText: '',
                parsedText: ''
            };
        case 'ollama':
            return {
                transport,
                buffer: '',
                rawText: '',
                parsedText: '',
                sawDone: false
            };
        default:
            throw new Error(`Unsupported diagnostic transport: ${transport}`);
    }
}

function processOpenAICompatibleFrame(state, frame) {
    const payload = extractSsePayload(frame);
    if (!payload) {
        return;
    }

    if (payload === '[DONE]') {
        state.sawDone = true;
        return;
    }

    const data = parseJsonPayload(state.transport, payload);
    const choice = data && Array.isArray(data.choices) ? data.choices[0] : undefined;
    const delta = choice && choice.delta ? choice.delta : {};
    if (typeof delta.content === 'string') {
        state.parsedText += delta.content;
    }
    if (typeof delta.reasoning_content === 'string') {
        state.parsedReasoningText += delta.reasoning_content;
    }
    if (choice && choice.finish_reason) {
        state.sawFinishReason = true;
    }
}

function drainOpenAICompatibleBuffer(state, flush) {
    const { frames, remainder } = splitBufferedText(state.buffer, '\n\n', flush);
    state.buffer = remainder;
    frames.forEach(frame => processOpenAICompatibleFrame(state, frame));
}

function processAnthropicFrame(state, frame) {
    const payload = extractSsePayload(frame);
    if (!payload) {
        return;
    }

    const data = parseJsonPayload(state.transport, payload);
    if (data && data.type === 'content_block_start' && data.content_block && data.content_block.type === 'text' && typeof data.content_block.text === 'string') {
        state.parsedText += data.content_block.text;
    }
    if (data && data.type === 'content_block_delta' && data.delta && data.delta.type === 'text_delta' && typeof data.delta.text === 'string') {
        state.parsedText += data.delta.text;
    }
    if ((data && data.type === 'message_delta' && data.delta && data.delta.stop_reason) || (data && data.type === 'message_stop')) {
        state.sawStop = true;
    }
}

function drainAnthropicBuffer(state, flush) {
    const { frames, remainder } = splitBufferedText(state.buffer, '\n\n', flush);
    state.buffer = remainder;
    frames.forEach(frame => processAnthropicFrame(state, frame));
}

function processGoogleFrame(state, frame) {
    const payload = extractSsePayload(frame);
    if (!payload) {
        return;
    }

    const data = parseJsonPayload(state.transport, payload);
    const parts = (((data || {}).candidates || [])[0] || {}).content?.parts || [];
    for (const part of parts) {
        if (typeof part.text === 'string') {
            state.parsedText += part.text;
        }
    }
}

function drainGoogleBuffer(state, flush) {
    const { frames, remainder } = splitBufferedText(state.buffer, '\n\n', flush);
    state.buffer = remainder;
    frames.forEach(frame => processGoogleFrame(state, frame));
}

function processOllamaLine(state, line) {
    const normalized = line.trim();
    if (!normalized) {
        return;
    }

    const data = parseJsonPayload(state.transport, normalized);
    if (data && data.message && typeof data.message.content === 'string') {
        state.parsedText += data.message.content;
    }
    if (data && data.done) {
        state.sawDone = true;
    }
}

function drainOllamaBuffer(state, flush) {
    const { frames, remainder } = splitBufferedText(state.buffer, '\n', flush);
    state.buffer = remainder;
    frames.forEach(frame => processOllamaLine(state, frame));
}

function ingestProtocolChunk(transport, state, chunkText) {
    state.rawText += chunkText;
    state.buffer += chunkText;

    switch (transport) {
        case 'openai-compatible':
        case 'azure-openai':
            drainOpenAICompatibleBuffer(state, false);
            return;
        case 'anthropic':
            drainAnthropicBuffer(state, false);
            return;
        case 'google':
            drainGoogleBuffer(state, false);
            return;
        case 'ollama':
            drainOllamaBuffer(state, false);
            return;
        default:
            throw new Error(`Unsupported diagnostic transport: ${transport}`);
    }
}

function finalizeProtocolAccumulator(transport, state) {
    switch (transport) {
        case 'openai-compatible':
        case 'azure-openai':
            drainOpenAICompatibleBuffer(state, true);
            return {
                rawText: state.rawText,
                parsedText: state.parsedText.trim() ? state.parsedText : state.parsedReasoningText
            };
        case 'anthropic':
            drainAnthropicBuffer(state, true);
            return {
                rawText: state.rawText,
                parsedText: state.parsedText
            };
        case 'google':
            drainGoogleBuffer(state, true);
            return {
                rawText: state.rawText,
                parsedText: state.parsedText
            };
        case 'ollama':
            drainOllamaBuffer(state, true);
            return {
                rawText: state.rawText,
                parsedText: state.parsedText
            };
        default:
            throw new Error(`Unsupported diagnostic transport: ${transport}`);
    }
}

function buildDiagnosticPlan(config) {
    const normalized = {
        providerName: config.providerName || 'OpenAI Compatible',
        transport: config.transport,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey || '',
        model: config.model,
        prompt: config.prompt || '',
        content: config.content || '',
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.5,
        maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : 2048,
        apiVersion: config.apiVersion,
        anthropicVersion: config.anthropicVersion || '2023-06-01',
        mode: config.mode || 'fallback',
        timeoutMs: typeof config.timeoutMs === 'number' ? config.timeoutMs : 360000
    };

    switch (normalized.transport) {
        case 'openai-compatible': {
            const url = `${normalized.baseUrl}/chat/completions`;
            const bufferedBody = buildOpenAICompatibleRequestBody(normalized, false);
            const streamingBody = buildOpenAICompatibleRequestBody(normalized, true);
            return {
                meta: normalized,
                bufferedRequest: {
                    url,
                    method: 'POST',
                    headers: buildOpenAICompatibleHeaders(normalized.providerName, normalized.apiKey),
                    body: JSON.stringify(bufferedBody)
                },
                streamingRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        ...buildOpenAICompatibleHeaders(normalized.providerName, normalized.apiKey),
                        Accept: 'text/event-stream'
                    },
                    body: JSON.stringify(streamingBody)
                }
            };
        }
        case 'azure-openai': {
            if (!normalized.apiVersion) {
                throw new Error('azure-openai diagnostics require --api-version');
            }
            const url = `${normalized.baseUrl}/openai/deployments/${normalized.model}/chat/completions?api-version=${normalized.apiVersion}`;
            const baseBody = {
                messages: [
                    { role: 'system', content: normalized.prompt },
                    { role: 'user', content: normalized.content }
                ],
                temperature: normalized.temperature,
                max_tokens: normalized.maxTokens
            };
            return {
                meta: normalized,
                bufferedRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': normalized.apiKey
                    },
                    body: JSON.stringify(baseBody)
                },
                streamingRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': normalized.apiKey,
                        Accept: 'text/event-stream'
                    },
                    body: JSON.stringify({
                        ...baseBody,
                        stream: true
                    })
                }
            };
        }
        case 'anthropic': {
            const url = `${normalized.baseUrl}/v1/messages`;
            const baseBody = {
                model: normalized.model,
                system: normalized.prompt,
                messages: [{ role: 'user', content: normalized.content }],
                temperature: normalized.temperature,
                max_tokens: normalized.maxTokens
            };
            return {
                meta: normalized,
                bufferedRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': normalized.apiKey,
                        'anthropic-version': normalized.anthropicVersion
                    },
                    body: JSON.stringify(baseBody)
                },
                streamingRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': normalized.apiKey,
                        'anthropic-version': normalized.anthropicVersion,
                        Accept: 'text/event-stream'
                    },
                    body: JSON.stringify({
                        ...baseBody,
                        stream: true
                    })
                }
            };
        }
        case 'google': {
            const urlWithKey = `${normalized.baseUrl}/models/${normalized.model}:generateContent?key=${normalized.apiKey}`;
            const streamUrl = new URL(urlWithKey);
            streamUrl.pathname = streamUrl.pathname.replace(':generateContent', ':streamGenerateContent');
            streamUrl.searchParams.set('alt', 'sse');
            const body = {
                contents: [{ role: 'user', parts: [{ text: `${normalized.prompt}\n\n${normalized.content}` }] }],
                generationConfig: {
                    temperature: normalized.temperature,
                    maxOutputTokens: normalized.maxTokens
                }
            };
            return {
                meta: normalized,
                bufferedRequest: {
                    url: urlWithKey,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                },
                streamingRequest: {
                    url: streamUrl.toString(),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream'
                    },
                    body: JSON.stringify(body)
                }
            };
        }
        case 'ollama': {
            const url = `${normalized.baseUrl}/chat`;
            const baseBody = {
                model: normalized.model,
                messages: [
                    { role: 'system', content: normalized.prompt },
                    { role: 'user', content: normalized.content }
                ],
                options: {
                    temperature: normalized.temperature,
                    num_predict: normalized.maxTokens
                },
                stream: false
            };
            return {
                meta: normalized,
                bufferedRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(baseBody)
                },
                streamingRequest: {
                    url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/x-ndjson'
                    },
                    body: JSON.stringify({
                        ...baseBody,
                        stream: true
                    })
                }
            };
        }
        default:
            throw new Error(`Unsupported transport: ${normalized.transport}`);
    }
}

function requestWithNode(options, timeoutMs, accumulator) {
    return new Promise((resolve) => {
        const startedAt = Date.now();
        const parsedUrl = new URL(options.url);
        const transport = parsedUrl.protocol === 'https:' ? https : http;
        const headers = {
            ...(options.headers || {})
        };

        if (options.body && !Object.keys(headers).some(key => key.toLowerCase() === 'content-length')) {
            headers['Content-Length'] = Buffer.byteLength(options.body, 'utf8').toString();
        }
        if (!Object.keys(headers).some(key => key.toLowerCase() === 'accept-encoding')) {
            headers['Accept-Encoding'] = 'identity';
        }

        let firstByteMs;
        const request = transport.request({
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || undefined,
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: options.method,
            headers
        }, (response) => {
            const chunks = [];
            let finished = false;

            response.on('data', (chunk) => {
                if (firstByteMs === undefined) {
                    firstByteMs = Date.now() - startedAt;
                }
                const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
                chunks.push(text);
                if (accumulator) {
                    ingestProtocolChunk(accumulator.transport, accumulator, text);
                }
            });

            response.on('end', () => {
                finished = true;
                const parsed = accumulator ? finalizeProtocolAccumulator(accumulator.transport, accumulator) : null;
                resolve({
                    ok: true,
                    status: response.statusCode || 0,
                    durationMs: Date.now() - startedAt,
                    firstByteMs,
                    headers: normalizeHeaders(response.headers),
                    body: chunks.join(''),
                    parsedText: parsed ? parsed.parsedText : undefined
                });
            });

            const handleResponseError = (error) => {
                const partial = accumulator ? finalizeProtocolAccumulator(accumulator.transport, accumulator) : null;
                resolve({
                    ok: false,
                    status: response.statusCode || 0,
                    durationMs: Date.now() - startedAt,
                    firstByteMs,
                    headers: normalizeHeaders(response.headers),
                    partialBody: chunks.join(''),
                    partialParsedText: partial ? partial.parsedText : undefined,
                    error: error.message || String(error),
                    finished
                });
            };

            response.on('error', handleResponseError);
            response.on('aborted', () => handleResponseError(new Error('response aborted')));
            response.on('close', () => {
                if (!finished) {
                    handleResponseError(new Error('response stream closed before completion'));
                }
            });
        });

        request.on('error', (error) => {
            resolve({
                ok: false,
                durationMs: Date.now() - startedAt,
                firstByteMs,
                error: error.message || String(error)
            });
        });

        request.setTimeout(timeoutMs, () => {
            request.destroy(new Error(`request timeout after ${timeoutMs}ms`));
        });

        if (options.body) {
            request.write(options.body);
        }
        request.end();
    });
}

async function runAttempt(label, requestOptions, transport, timeoutMs) {
    const accumulator = label === 'streaming' ? createProtocolAccumulator(transport) : null;
    const result = await requestWithNode(requestOptions, timeoutMs, accumulator);
    return {
        label,
        request: {
            method: requestOptions.method,
            url: requestOptions.url,
            headers: requestOptions.headers
        },
        response: result.ok ? {
            status: result.status,
            durationMs: result.durationMs,
            firstByteMs: result.firstByteMs,
            headers: result.headers,
            body: result.body,
            parsedText: result.parsedText
        } : {
            status: result.status,
            durationMs: result.durationMs,
            firstByteMs: result.firstByteMs,
            headers: result.headers,
            partialBody: result.partialBody,
            partialParsedText: result.partialParsedText
        },
        error: result.ok ? undefined : result.error
    };
}

async function runDiagnostic(config) {
    const plan = buildDiagnosticPlan(config);
    const attempts = [];
    const mode = plan.meta.mode;
    const timeoutMs = plan.meta.timeoutMs;

    if (mode === 'buffered') {
        attempts.push(await runAttempt('buffered', plan.bufferedRequest, plan.meta.transport, timeoutMs));
    } else if (mode === 'streaming') {
        attempts.push(await runAttempt('streaming', plan.streamingRequest, plan.meta.transport, timeoutMs));
    } else if (mode === 'compare') {
        attempts.push(await runAttempt('buffered', plan.bufferedRequest, plan.meta.transport, timeoutMs));
        attempts.push(await runAttempt('streaming', plan.streamingRequest, plan.meta.transport, timeoutMs));
    } else if (mode === 'fallback') {
        const bufferedAttempt = await runAttempt('buffered', plan.bufferedRequest, plan.meta.transport, timeoutMs);
        attempts.push(bufferedAttempt);
        if (bufferedAttempt.error) {
            attempts.push(await runAttempt('streaming', plan.streamingRequest, plan.meta.transport, timeoutMs));
        }
    } else {
        throw new Error(`Unsupported diagnostic mode: ${mode}`);
    }

    return {
        meta: {
            transport: plan.meta.transport,
            providerName: plan.meta.providerName,
            mode: plan.meta.mode,
            timeoutMs: plan.meta.timeoutMs
        },
        attempts
    };
}

function formatDiagnosticText(report) {
    const lines = [];
    lines.push(`Provider: ${report.meta.providerName}`);
    lines.push(`Transport: ${report.meta.transport}`);
    lines.push(`Mode: ${report.meta.mode}`);

    report.attempts.forEach((attempt, index) => {
        lines.push('');
        lines.push(`Attempt ${index + 1} [${attempt.label}]`);
        lines.push(`Request: ${attempt.request.method} ${sanitizeUrl(attempt.request.url)}`);
        lines.push(`Request Headers: ${JSON.stringify(sanitizeHeaders(attempt.request.headers))}`);
        if (attempt.response && typeof attempt.response.status === 'number') {
            lines.push(`Status: ${attempt.response.status}`);
        }
        if (typeof attempt.response?.firstByteMs === 'number') {
            lines.push(`First Byte: ${attempt.response.firstByteMs}ms`);
        }
        if (typeof attempt.response?.durationMs === 'number') {
            lines.push(`Duration: ${attempt.response.durationMs}ms`);
        }
        if (attempt.error) {
            lines.push(`Error: ${attempt.error}`);
        }
        if (attempt.response?.headers && Object.keys(attempt.response.headers).length > 0) {
            lines.push(`Response Headers: ${JSON.stringify(sanitizeHeaders(attempt.response.headers))}`);
        }
        if (attempt.response?.parsedText) {
            lines.push(`Parsed Response: ${attempt.response.parsedText}`);
        }
        if (attempt.response?.partialParsedText) {
            lines.push(`Partial Parsed Response: ${attempt.response.partialParsedText}`);
        }
        if (attempt.response?.body) {
            lines.push(`Response Body: ${attempt.response.body}`);
        }
        if (attempt.response?.partialBody) {
            lines.push(`Partial Response: ${attempt.response.partialBody}`);
        }
    });

    return lines.join('\n');
}

function printUsage() {
    console.log(`Usage:
  node scripts/diagnose-llm-provider.js \\
    --transport <openai-compatible|anthropic|google|azure-openai|ollama> \\
    --provider-name <name> \\
    --base-url <url> \\
    --api-key <key> \\
    --model <model> \\
    --prompt <text>|--prompt-file <path> \\
    --content <text>|--content-file <path> \\
    [--mode <fallback|compare|buffered|streaming>] \\
    [--api-version <azure-version>] \\
    [--temperature <number>] \\
    [--max-tokens <number>] \\
    [--timeout-ms <milliseconds>] \\
    [--json] \\
    [--output <path>]
`);
}

function parseCliArgs(argv) {
    const args = {
        mode: 'fallback',
        temperature: 0.5,
        maxTokens: 2048,
        timeoutMs: 360000,
        json: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        const next = argv[index + 1];

        switch (current) {
            case '--transport':
                args.transport = next;
                index += 1;
                break;
            case '--provider-name':
                args.providerName = next;
                index += 1;
                break;
            case '--base-url':
                args.baseUrl = next;
                index += 1;
                break;
            case '--api-key':
                args.apiKey = next;
                index += 1;
                break;
            case '--model':
                args.model = next;
                index += 1;
                break;
            case '--prompt':
                args.prompt = next;
                index += 1;
                break;
            case '--prompt-file':
                args.prompt = fs.readFileSync(next, 'utf8');
                index += 1;
                break;
            case '--content':
                args.content = next;
                index += 1;
                break;
            case '--content-file':
                args.content = fs.readFileSync(next, 'utf8');
                index += 1;
                break;
            case '--mode':
                args.mode = next;
                index += 1;
                break;
            case '--api-version':
                args.apiVersion = next;
                index += 1;
                break;
            case '--anthropic-version':
                args.anthropicVersion = next;
                index += 1;
                break;
            case '--temperature':
                args.temperature = Number(next);
                index += 1;
                break;
            case '--max-tokens':
                args.maxTokens = Number(next);
                index += 1;
                break;
            case '--timeout-ms':
                args.timeoutMs = Number(next);
                index += 1;
                break;
            case '--output':
                args.output = next;
                index += 1;
                break;
            case '--json':
                args.json = true;
                break;
            case '--help':
            case '-h':
                args.help = true;
                break;
            default:
                if (current.startsWith('--')) {
                    throw new Error(`Unknown argument: ${current}`);
                }
        }
    }

    return args;
}

function validateCliConfig(config) {
    if (config.help) {
        return;
    }

    for (const key of ['transport', 'baseUrl', 'model']) {
        if (!config[key]) {
            throw new Error(`Missing required argument: --${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`);
        }
    }

    if (!config.prompt) {
        throw new Error('Missing required argument: --prompt or --prompt-file');
    }
    if (!config.content) {
        throw new Error('Missing required argument: --content or --content-file');
    }
    if (config.transport !== 'ollama' && config.transport !== 'google' && config.transport !== 'openai-compatible' && config.transport !== 'anthropic' && config.transport !== 'azure-openai') {
        throw new Error(`Unsupported transport: ${config.transport}`);
    }
}

module.exports = {
    buildDiagnosticPlan,
    createProtocolAccumulator,
    ingestProtocolChunk,
    finalizeProtocolAccumulator,
    formatDiagnosticText,
    parseCliArgs,
    printUsage,
    runDiagnostic,
    sanitizeHeaders,
    sanitizeUrl,
    validateCliConfig
};
