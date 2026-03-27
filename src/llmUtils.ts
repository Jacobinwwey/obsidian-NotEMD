import { Notice, requestUrl } from 'obsidian';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import { getLLMProviderDefinition } from './llmProviders';
import { DEFAULT_SETTINGS } from './constants';
import { cancellableDelay } from './utils';
import { ErrorModal } from './ui/ErrorModal'; // Import ErrorModal

function providerRequiresApiKey(provider: LLMProviderConfig): boolean {
    return getLLMProviderDefinition(provider.name)?.apiKeyMode === 'required';
}

function ensureProviderApiKey(provider: LLMProviderConfig): void {
    if (providerRequiresApiKey(provider) && !provider.apiKey) {
        throw new Error(`API key is missing for ${provider.name} provider.`);
    }
}

function isOpenAIReasoningModel(modelName: string): boolean {
    const normalized = modelName.toLowerCase();
    return normalized.startsWith('o1') || normalized.startsWith('o3') || normalized.startsWith('o4') || normalized.startsWith('gpt-5');
}

function isDeepSeekReasoningModel(modelName: string): boolean {
    const normalized = modelName.toLowerCase();
    return normalized === 'deepseek-reasoner' || normalized.includes('deepseek-reasoner') || normalized.includes('-r1');
}

function isOpenRouterReasoningModel(modelName: string): boolean {
    const normalized = modelName.toLowerCase();
    return normalized.includes('deepseek-r1')
        || normalized.includes('reasoner')
        || normalized.includes('openai/o1')
        || normalized.includes('openai/o3')
        || normalized.includes('openai/o4')
        || normalized.includes('gpt-5');
}

function shouldUseCombinedUserPrompt(providerName: string, modelName: string): boolean {
    switch (providerName) {
        case 'DeepSeek':
            return isDeepSeekReasoningModel(modelName);
        case 'OpenRouter':
            return isOpenRouterReasoningModel(modelName);
        default:
            return isOpenAIReasoningModel(modelName);
    }
}

function buildOpenAICompatibleHeaders(provider: LLMProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (provider.apiKey || provider.name === 'LMStudio') {
        headers['Authorization'] = `Bearer ${provider.apiKey || 'EMPTY'}`;
    }

    if (provider.name === 'OpenRouter' || provider.name === 'Requesty') {
        headers['HTTP-Referer'] = 'https://github.com/Jacobinwwey/obsidian-NotEMD';
        headers['X-Title'] = 'Notemd Obsidian Plugin';
    }

    return headers;
}

const TRANSIENT_NETWORK_ERROR_PATTERNS = [
    'err_connection_closed',
    'err_connection_reset',
    'err_network_changed',
    'err_timed_out',
    'econnreset',
    'econnaborted',
    'etimedout',
    'socket hang up',
    'network request failed'
];

function buildOpenAICompatibleMessages(providerName: string, modelName: string, prompt: string, content: string) {
    if (shouldUseCombinedUserPrompt(providerName, modelName)) {
        return [
            {
                role: 'user',
                content: [prompt, content].filter(Boolean).join('\n\n')
            }
        ];
    }

    return [
        { role: 'system', content: prompt },
        { role: 'user', content: content }
    ];
}

function isTransientNetworkErrorMessage(errorMessage: string): boolean {
    const normalized = errorMessage.trim().toLowerCase();
    return TRANSIENT_NETWORK_ERROR_PATTERNS.some(pattern => normalized.includes(pattern));
}

const CONNECTION_TEST_MAX_ATTEMPTS = DEFAULT_SETTINGS.apiCallMaxRetries + 1;
const CONNECTION_TEST_RETRY_DELAY_MS = DEFAULT_SETTINGS.apiCallInterval * 1000;

async function waitForConnectionTestRetry(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, CONNECTION_TEST_RETRY_DELAY_MS));
}

async function requestUrlForConnectionTest(
    requestFactory: () => Promise<any>,
    fallbackFactory?: () => Promise<any>
): Promise<any> {
    let lastError: Error | null = null;
    let shouldUseStableRetrySequence = false;
    let maxAttempts = 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await requestFactory();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            lastError = error instanceof Error ? error : new Error(errorMessage);
            const isTransientNetworkError = isTransientNetworkErrorMessage(errorMessage);

            if (attempt === 1 && isTransientNetworkError && fallbackFactory) {
                try {
                    return await fallbackFactory();
                } catch (fallbackError: unknown) {
                    const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                    lastError = fallbackError instanceof Error ? fallbackError : new Error(fallbackMessage);

                    if (!isTransientNetworkErrorMessage(fallbackMessage)) {
                        throw lastError;
                    }
                }
            }

            if (!shouldUseStableRetrySequence && attempt === 1 && isTransientNetworkError) {
                shouldUseStableRetrySequence = true;
                maxAttempts = CONNECTION_TEST_MAX_ATTEMPTS;
            }

            if (!isTransientNetworkError || attempt >= maxAttempts) {
                throw lastError;
            }

            await waitForConnectionTestRetry();
        }
    }

    throw lastError || new Error('Connection test failed after multiple retries.');
}

function buildConnectionTestFallbackFactory(
    options: RuntimeRequestOptions
): (() => Promise<RuntimeRequestResponse>) | undefined {
    if (canUseDesktopHttpTransport(options.url) || !canUseWebFetchTransport(options.url)) {
        return undefined;
    }

    return () => requestViaWebFetchTransport(options);
}

type RuntimeRequestOptions = {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    throw?: boolean;
};

type RuntimeRequestResponse = {
    status: number;
    text: string;
    json: any;
    headers?: Record<string, string>;
    __notemdDebug?: RuntimeDebugInfo;
};

type TransportDebugAttempt = {
    transport: string;
    requestMethod: string;
    requestUrl: string;
    requestHeaders?: Record<string, string>;
    durationMs?: number;
    status?: number;
    responseHeaders?: Record<string, string>;
    responseText?: string;
    partialResponseText?: string;
    errorMessage?: string;
};

type RuntimeDebugInfo = {
    attempts: TransportDebugAttempt[];
};

const SENSITIVE_DEBUG_QUERY_PARAMS = new Set([
    'access_token',
    'api-key',
    'api_key',
    'authorization',
    'key',
    'token',
    'x-api-key'
]);

const SENSITIVE_DEBUG_HEADERS = new Set([
    'api-key',
    'authorization',
    'proxy-authorization',
    'x-api-key'
]);

function hasHeader(headers: Record<string, string>, headerName: string): boolean {
    const normalizedTarget = headerName.toLowerCase();
    return Object.keys(headers).some(key => key.toLowerCase() === normalizedTarget);
}

function createAbortError(): Error {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error;
}

function parseRuntimeResponseBody(responseText: string): any {
    if (!responseText.trim()) {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch (_error) {
        return null;
    }
}

function canUseWebFetchTransport(targetUrl: string): boolean {
    if (typeof globalThis.fetch !== 'function') {
        return false;
    }

    try {
        const protocol = new URL(targetUrl).protocol;
        return protocol === 'https:' || protocol === 'http:';
    } catch (_error) {
        return false;
    }
}

function sanitizeUrlForDebug(rawUrl: string): string {
    try {
        const parsedUrl = new URL(rawUrl);
        if (parsedUrl.username || parsedUrl.password) {
            parsedUrl.username = '[REDACTED]';
            parsedUrl.password = '[REDACTED]';
        }

        parsedUrl.searchParams.forEach((_value, key) => {
            if (SENSITIVE_DEBUG_QUERY_PARAMS.has(key.toLowerCase())) {
                parsedUrl.searchParams.set(key, '[REDACTED]');
            }
        });

        return parsedUrl.toString().replace(/%5BREDACTED%5D/g, '[REDACTED]');
    } catch (_error) {
        return rawUrl;
    }
}

function sanitizeHeadersForDebug(headers?: Record<string, unknown> | null): Record<string, string> | undefined {
    if (!headers) {
        return undefined;
    }

    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined || value === null) {
            continue;
        }

        const normalizedKey = key.toLowerCase();
        sanitizedHeaders[key] = SENSITIVE_DEBUG_HEADERS.has(normalizedKey)
            ? '[REDACTED]'
            : Array.isArray(value)
                ? value.join(', ')
                : String(value);
    }

    return Object.keys(sanitizedHeaders).length > 0 ? sanitizedHeaders : undefined;
}

function createTransportDebugAttempt(
    transport: string,
    options: RuntimeRequestOptions,
    details: Omit<TransportDebugAttempt, 'transport' | 'requestMethod' | 'requestUrl' | 'requestHeaders'>
): TransportDebugAttempt {
    return {
        transport,
        requestMethod: options.method,
        requestUrl: sanitizeUrlForDebug(options.url),
        requestHeaders: sanitizeHeadersForDebug(options.headers),
        ...details
    };
}

function getTransportDebugAttempts(value: any): TransportDebugAttempt[] {
    return value?.__notemdDebug?.attempts ?? [];
}

function mergeTransportDebugAttempts(...groups: Array<TransportDebugAttempt[] | undefined>): TransportDebugAttempt[] {
    const merged: TransportDebugAttempt[] = [];
    for (const group of groups) {
        if (group?.length) {
            merged.push(...group);
        }
    }
    return merged;
}

function attachTransportDebugToError(error: unknown, attempts: TransportDebugAttempt[]): Error {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    (normalizedError as any).__notemdDebug = { attempts };
    return normalizedError;
}

function attachTransportDebugToResponse(
    response: RuntimeRequestResponse,
    attempts: TransportDebugAttempt[]
): RuntimeRequestResponse {
    response.__notemdDebug = { attempts };
    return response;
}

function normalizeRuntimeResponse(
    rawResponse: { status?: number; text?: string; json?: any; headers?: Record<string, unknown> },
    attempts: TransportDebugAttempt[]
): RuntimeRequestResponse {
    const responseText = typeof rawResponse.text === 'string'
        ? rawResponse.text
        : rawResponse.json
            ? JSON.stringify(rawResponse.json)
            : '';

    return attachTransportDebugToResponse({
        status: rawResponse.status ?? 0,
        text: responseText,
        json: rawResponse.json ?? parseRuntimeResponseBody(responseText),
        headers: sanitizeHeadersForDebug(rawResponse.headers) ?? {}
    }, attempts);
}

async function requestViaObsidianTransport(options: RuntimeRequestOptions): Promise<RuntimeRequestResponse> {
    const startedAt = Date.now();

    try {
        const response = await requestUrl(options);
        const attempt = createTransportDebugAttempt('requestUrl', options, {
            durationMs: Date.now() - startedAt,
            status: response.status,
            responseHeaders: sanitizeHeadersForDebug(response.headers),
            responseText: typeof response.text === 'string' ? response.text : undefined
        });

        return normalizeRuntimeResponse(response, [attempt]);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const attempt = createTransportDebugAttempt('requestUrl', options, {
            durationMs: Date.now() - startedAt,
            status: typeof (error as any)?.status === 'number' ? (error as any).status : undefined,
            responseHeaders: sanitizeHeadersForDebug((error as any)?.headers || (error as any)?.response?.headers),
            responseText: (error as any)?.text || (error as any)?.response?.text || '',
            errorMessage
        });

        throw attachTransportDebugToError(error, [attempt]);
    }
}

function extractFetchHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

async function readFetchResponseText(
    response: Response,
    transport: string,
    options: RuntimeRequestOptions,
    startedAt: number
): Promise<string> {
    if (!response.body || typeof response.body.getReader !== 'function') {
        return await response.text();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            if (value) {
                chunks.push(decoder.decode(value, { stream: true }));
            }
        }
        chunks.push(decoder.decode());
        return chunks.join('');
    } catch (error: unknown) {
        const partialResponseText = `${chunks.join('')}${decoder.decode()}`;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const attempt = createTransportDebugAttempt(transport, options, {
            durationMs: Date.now() - startedAt,
            status: response.status,
            responseHeaders: sanitizeHeadersForDebug(extractFetchHeaders(response.headers)),
            partialResponseText: partialResponseText || undefined,
            errorMessage
        });

        throw attachTransportDebugToError(error, [attempt]);
    }
}

async function requestViaWebFetchTransport(
    options: RuntimeRequestOptions,
    signal?: AbortSignal
): Promise<RuntimeRequestResponse> {
    const startedAt = Date.now();

    try {
        const response = await globalThis.fetch(options.url, {
            method: options.method,
            headers: options.headers,
            body: options.body,
            signal
        });
        const responseHeaders = extractFetchHeaders(response.headers);
        const responseText = await readFetchResponseText(response, 'web-fetch', options, startedAt);
        const attempt = createTransportDebugAttempt('web-fetch', options, {
            durationMs: Date.now() - startedAt,
            status: response.status,
            responseHeaders: sanitizeHeadersForDebug(responseHeaders),
            responseText
        });

        return normalizeRuntimeResponse({
            status: response.status,
            text: responseText,
            json: parseRuntimeResponseBody(responseText),
            headers: responseHeaders
        }, [attempt]);
    } catch (error: unknown) {
        if (getTransportDebugAttempts(error).length > 0) {
            throw error;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const attempt = createTransportDebugAttempt('web-fetch', options, {
            durationMs: Date.now() - startedAt,
            errorMessage
        });

        throw attachTransportDebugToError(error, [attempt]);
    }
}

function canUseDesktopHttpTransport(targetUrl: string): boolean {
    if (typeof process === 'undefined' || !process.versions?.node) {
        return false;
    }

    try {
        const protocol = new URL(targetUrl).protocol;
        if (protocol === 'https:') {
            require('https');
            return true;
        }
        if (protocol === 'http:') {
            require('http');
            return true;
        }
    } catch (_error) {
        return false;
    }

    return false;
}

async function requestViaDesktopHttpTransport(
    options: RuntimeRequestOptions,
    signal?: AbortSignal
): Promise<RuntimeRequestResponse> {
    return await new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const parsedUrl = new URL(options.url);
        const transport = parsedUrl.protocol === 'https:' ? require('https') : require('http');
        const headers = { ...(options.headers ?? {}) };

        if (options.body && !hasHeader(headers, 'Content-Length')) {
            headers['Content-Length'] = Buffer.byteLength(options.body, 'utf8').toString();
        }
        if (!hasHeader(headers, 'Accept-Encoding')) {
            headers['Accept-Encoding'] = 'identity';
        }

        let settled = false;
        let abortListener: (() => void) | null = null;

        const cleanup = () => {
            if (abortListener && signal) {
                signal.removeEventListener('abort', abortListener);
            }
            abortListener = null;
        };

        const rejectOnce = (error: unknown) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        };

        const resolveOnce = (value: RuntimeRequestResponse) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(value);
        };

        const request = transport.request({
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || undefined,
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: options.method,
            headers
        }, (response: any) => {
            const chunks: Buffer[] = [];
            let responseEnded = false;
            const responseHeaders = response.headers as Record<string, unknown> | undefined;
            const statusCode = response.statusCode ?? 0;

            const rejectWithTransportDebug = (error: unknown) => {
                const responseText = chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '';
                const errorMessage = error instanceof Error ? error.message : String(error);
                const attempt = createTransportDebugAttempt('desktop-http', options, {
                    durationMs: Date.now() - startedAt,
                    status: statusCode,
                    responseHeaders: sanitizeHeadersForDebug(responseHeaders),
                    partialResponseText: responseEnded ? undefined : responseText || undefined,
                    responseText: responseEnded ? responseText || undefined : undefined,
                    errorMessage
                });

                rejectOnce(attachTransportDebugToError(error, [attempt]));
            };

            response.on('data', (chunk: Buffer | string) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            response.on('end', () => {
                responseEnded = true;
                const responseText = Buffer.concat(chunks).toString('utf8');
                const attempt = createTransportDebugAttempt('desktop-http', options, {
                    durationMs: Date.now() - startedAt,
                    status: statusCode,
                    responseHeaders: sanitizeHeadersForDebug(responseHeaders),
                    responseText
                });

                resolveOnce(normalizeRuntimeResponse({
                    status: statusCode,
                    text: responseText,
                    json: parseRuntimeResponseBody(responseText),
                    headers: responseHeaders
                }, [attempt]));
            });
            response.on('error', rejectWithTransportDebug);
            response.on('aborted', () => {
                rejectWithTransportDebug(new Error('response aborted'));
            });
            response.on('close', () => {
                if (!responseEnded) {
                    rejectWithTransportDebug(new Error('response stream closed before completion'));
                }
            });
        });

        request.on('error', (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const attempt = createTransportDebugAttempt('desktop-http', options, {
                durationMs: Date.now() - startedAt,
                errorMessage
            });

            rejectOnce(attachTransportDebugToError(error, [attempt]));
        });

        if (signal?.aborted) {
            const abortError = createAbortError();
            request.destroy(abortError);
            rejectOnce(attachTransportDebugToError(abortError, [
                createTransportDebugAttempt('desktop-http', options, {
                    durationMs: Date.now() - startedAt,
                    errorMessage: abortError.message
                })
            ]));
            return;
        }

        abortListener = () => {
            const abortError = createAbortError();
            request.destroy(abortError);
            rejectOnce(attachTransportDebugToError(abortError, [
                createTransportDebugAttempt('desktop-http', options, {
                    durationMs: Date.now() - startedAt,
                    errorMessage: abortError.message
                })
            ]));
        };

        if (signal) {
            signal.addEventListener('abort', abortListener, { once: true });
        }

        if (options.body) {
            request.write(options.body);
        }

        request.end();
    });
}

async function requestRuntimeUrlWithDesktopFallback(
    providerName: string,
    options: RuntimeRequestOptions,
    progressReporter?: ProgressReporter | null,
    signal?: AbortSignal
): Promise<RuntimeRequestResponse> {
    try {
        return await requestViaObsidianTransport(options);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const requestUrlAttempts = getTransportDebugAttempts(error);
        const fallbackTransport = canUseDesktopHttpTransport(options.url)
            ? 'desktop-http'
            : canUseWebFetchTransport(options.url)
                ? 'web-fetch'
                : null;

        if (!isTransientNetworkErrorMessage(errorMessage) || !fallbackTransport) {
            throw error;
        }

        if (progressReporter) {
            progressReporter.log(
                `[${providerName}] requestUrl transport closed unexpectedly (${errorMessage}). Retrying this attempt via ${fallbackTransport === 'desktop-http' ? 'desktop HTTP transport' : 'web fetch transport'}.`
            );
        }

        try {
            const fallbackResponse = fallbackTransport === 'desktop-http'
                ? await requestViaDesktopHttpTransport(options, signal)
                : await requestViaWebFetchTransport(options, signal);
            return attachTransportDebugToResponse(
                fallbackResponse,
                mergeTransportDebugAttempts(requestUrlAttempts, getTransportDebugAttempts(fallbackResponse))
            );
        } catch (fallbackError: unknown) {
            throw attachTransportDebugToError(
                fallbackError,
                mergeTransportDebugAttempts(requestUrlAttempts, getTransportDebugAttempts(fallbackError))
            );
        }
    }
}

function buildOpenAICompatibleRequestBody(
    provider: LLMProviderConfig,
    modelName: string,
    prompt: string,
    content: string,
    maxTokens: number,
    temperature: number,
    options?: { connectionTest?: boolean }
) {
    const requestBody: any = {
        model: modelName,
        messages: buildOpenAICompatibleMessages(provider.name, modelName, prompt, content)
    };

    const tokenLimit = options?.connectionTest ? 1 : maxTokens;
    const deterministicTemperature = options?.connectionTest ? 0 : temperature;
    const isDeepSeekProvider = provider.name === 'DeepSeek';
    const isReasoningModel = shouldUseCombinedUserPrompt(provider.name, modelName);

    if (isDeepSeekProvider) {
        if (typeof tokenLimit === 'number' && tokenLimit > 0) {
            requestBody.max_completion_tokens = tokenLimit;
        }
        if (!isDeepSeekReasoningModel(modelName)) {
            requestBody.temperature = deterministicTemperature;
        }
        return requestBody;
    }

    if (!isReasoningModel) {
        if (typeof deterministicTemperature === 'number') {
            requestBody.temperature = deterministicTemperature;
        }
        if (typeof tokenLimit === 'number' && tokenLimit > 0) {
            requestBody.max_tokens = tokenLimit;
        }
    } else if (provider.name === 'OpenRouter' && modelName.toLowerCase().includes('deepseek')) {
        requestBody.temperature = 0.7;
    }

    return requestBody;
}

function extractOpenAICompatibleText(providerName: string, data: any, fallbackText: string): string {
    const choice = data?.choices?.[0];
    if (choice && (choice.finish_reason === 'error' || choice.error)) {
        const errorMessage = choice.error?.message || `${providerName} reported finish_reason: error`;
        const errorCode = choice.error?.code || 'N/A';
        throw new Error(`${providerName} API reported an error: ${errorMessage} (Code: ${errorCode})`);
    }

    const message = choice?.message;
    const rawContent = message?.content;

    if (typeof rawContent === 'string' && rawContent.trim()) {
        return rawContent;
    }

    if (Array.isArray(rawContent)) {
        const joined = rawContent
            .map(part => typeof part === 'string' ? part : part?.text || '')
            .join('')
            .trim();
        if (joined) {
            return joined;
        }
    }

    if (typeof message?.reasoning === 'string' && message.reasoning.trim()) {
        return message.reasoning;
    }

    if (fallbackText?.trim()) {
        return fallbackText;
    }

    throw new Error(`Unexpected response format from ${providerName}`);
}

async function testOpenAICompatibleAPI(provider: LLMProviderConfig): Promise<{ success: boolean; message: string }> {
    ensureProviderApiKey(provider);

    let response;
    const headers = buildOpenAICompatibleHeaders(provider);
    const apiTestMode = getLLMProviderDefinition(provider.name)?.apiTestMode ?? 'chat-only';

    if (apiTestMode === 'models-then-chat') {
        let response;
        const modelsUrl = `${provider.baseUrl}/models`;

        try {
            const modelsRequest = {
                url: modelsUrl,
                method: 'GET',
                headers,
                throw: false
            };
            response = await requestUrlForConnectionTest(
                () => requestViaObsidianTransport(modelsRequest),
                buildConnectionTestFallbackFactory(modelsRequest)
            );
        } catch (_error) {
            response = null;
        }

        if (response && response.status >= 200 && response.status < 300) {
            return { success: true, message: `Successfully connected to ${provider.name} at ${provider.baseUrl}.` };
        }
    }

    const chatUrl = `${provider.baseUrl}/chat/completions`;
    const responseBody = buildOpenAICompatibleRequestBody(
        provider,
        provider.model,
        provider.name === 'LMStudio' ? 'You are a helpful assistant.' : '',
        provider.name === 'LMStudio' ? 'This is a connection test.' : 'Test',
        1,
        0,
        { connectionTest: true }
    );

    const chatRequest = {
        url: chatUrl,
        method: 'POST',
        headers,
        body: JSON.stringify(responseBody),
        throw: false
    };
    response = await requestUrlForConnectionTest(
        () => requestViaObsidianTransport(chatRequest),
        buildConnectionTestFallbackFactory(chatRequest)
    );

    if (response.status < 200 || response.status >= 300) {
        const errorText = response.text;
        if (provider.name === 'LMStudio' && errorText.includes('Could not find model')) {
            throw new Error(`LMStudio API error: Model '${provider.model}' not found or loaded on the server.`);
        }
        throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
    }

    return { success: true, message: `Successfully connected to ${provider.name} at ${provider.baseUrl} using model '${provider.model}'.` };
}



/**
 * Tests the connection to a given LLM provider.
 * @param provider The provider configuration to test.
 * @param debugMode Whether to include detailed debug info in failure messages.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function testAPI(provider: LLMProviderConfig, debugMode: boolean = false): Promise<{ success: boolean; message: string }> {
    try {
        const providerDefinition = getLLMProviderDefinition(provider.name);

        if (providerDefinition?.transport === 'openai-compatible') {
            return await testOpenAICompatibleAPI(provider);
        }

        let response;
        let url: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let options: any = { method: 'GET' }; // Default to GET

        switch (providerDefinition?.transport) {
            case 'ollama':
                const ollamaUrl = `${provider.baseUrl}/chat`;
                const ollamaOptions = {
                    url: ollamaUrl,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [{ role: 'user', content: 'Test connection' }],
                        stream: false
                    }),
                    throw: false
                };
                response = await requestUrlForConnectionTest(
                    () => requestViaObsidianTransport(ollamaOptions),
                    buildConnectionTestFallbackFactory(ollamaOptions)
                );
                if (response.status < 200 || response.status >= 300) {
                    const errorText = response.text;
                    if (errorText.includes("model") && errorText.includes("not found")) {
                        throw new Error(`Ollama API error: Model '${provider.model}' not found. Please make sure it is pulled and available.`);
                    }
                    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
                }
                // No need to call .json() on the response text, it's already parsed
                return { success: true, message: `Successfully connected to Ollama at ${provider.baseUrl} using model '${provider.model}'.` };

            case 'anthropic':
                url = `${provider.baseUrl}/v1/messages`;
                options.url = url;
                options.method = 'POST';
                options.headers = { 
                    'Content-Type': 'application/json', 
                    'x-api-key': provider.apiKey, 
                    'anthropic-version': '2023-06-01' 
                };
                options.body = JSON.stringify({ 
                    model: provider.model, 
                    messages: [{ role: 'user', content: 'Test' }], 
                    max_tokens: 1 
                });
                options.throw = false;
                response = await requestUrlForConnectionTest(
                    () => requestViaObsidianTransport(options),
                    buildConnectionTestFallbackFactory(options)
                );
                if (response.status < 200 || response.status >= 300) throw new Error(`Anthropic API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Anthropic API.` };

            case 'google':
                url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
                options.url = url;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } });
                options.throw = false;
                response = await requestUrlForConnectionTest(
                    () => requestViaObsidianTransport(options),
                    buildConnectionTestFallbackFactory(options)
                );
                if (response.status < 200 || response.status >= 300) throw new Error(`Google API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Google API.` };
            case 'azure-openai':
                if (!provider.apiVersion || !provider.baseUrl || !provider.model) { throw new Error('Azure requires Base URL, Model (Deployment Name), and API Version.'); }
                url = `${provider.baseUrl}/openai/deployments/${provider.model}/chat/completions?api-version=${provider.apiVersion}`;
                options.url = url;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'api-key': provider.apiKey };
                
                const isReasoningAzure = provider.model.includes('o1') || provider.model.includes('o3');
                const azureBody: any = { messages: [{ role: 'user', content: 'Test' }] };
                if (!isReasoningAzure) {
                    azureBody.max_tokens = 1;
                    azureBody.temperature = 0;
                }
                options.body = JSON.stringify(azureBody);
                options.throw = false;
                
                response = await requestUrlForConnectionTest(
                    () => requestViaObsidianTransport(options),
                    buildConnectionTestFallbackFactory(options)
                );
                if (response.status < 200 || response.status >= 300) throw new Error(`Azure OpenAI API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Azure OpenAI deployment '${provider.model}'.` };

            default:
                return { success: false, message: `Connection test not implemented for provider: ${provider.name}` };
        }
    } catch (error: unknown) { // Changed to unknown
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Connection test failed for ${provider.name}:`, error);
        
        let finalMessage = `Connection failed: ${message}`;
        if (debugMode) {
            const debugInfo = getDebugInfo(error);
            if (debugInfo) {
                finalMessage += `\n\n[DEBUG MODE ENABLED]\n${debugInfo}`;
            }
        }
        return { success: false, message: finalMessage };
    }
}

/**
 * Calls the specified LLM provider API with retry logic.
 * @param provider The provider configuration.
 * @param modelName The specific model to use.
 * @param prompt The system prompt.
 * @param content The user content.
 * @param settings The plugin settings for retry configuration.
 * @param progressReporter The progress reporter instance.
 * @returns A promise resolving to the LLM response string.
 */
async function callApiWithRetry(
    provider: LLMProviderConfig,
    modelName: string,
    prompt: string,
    content: string,
    settings: NotemdSettings,
    progressReporter: ProgressReporter,
    apiCallFunction: (provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal) => Promise<string>,
    signal?: AbortSignal // Accept optional signal
): Promise<string> {
    
    let lastError: Error | null = null;
    const stableRetryMaxAttempts = settings.apiCallMaxRetries + 1;
    const stableRetryIntervalSeconds = settings.apiCallInterval;
    let maxAttempts = settings.enableStableApiCall ? stableRetryMaxAttempts : 1;
    let intervalSeconds = settings.enableStableApiCall ? stableRetryIntervalSeconds : 0;
    let usingStableRetrySequence = settings.enableStableApiCall;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (progressReporter.cancelled) {
            // console.log(`${provider.name} API Call: Cancellation detected before attempt ${attempt}`);
            throw new Error("Processing cancelled by user before API attempt.");
        }

        try {
            // Pass settings and signal to the underlying API call function
            return await apiCallFunction(provider, modelName, prompt, content, progressReporter, settings, signal);
        } catch (error: unknown) { // Changed to unknown
            const errorMessage = error instanceof Error ? error.message : String(error);
            lastError = error instanceof Error ? error : new Error(errorMessage); // Store Error object if possible
            progressReporter.log(`${provider.name} API Call: Attempt ${attempt} failed: ${errorMessage}`);
            console.warn(`${provider.name} API Call: Attempt ${attempt} failed: ${errorMessage}`);

            // Handle cancellation specifically
            if ((error instanceof Error && error.name === 'AbortError') || errorMessage.includes("cancelled by user")) {
                // console.log(`${provider.name} API Call: Cancellation detected during attempt ${attempt}.`);
                throw new Error("API call cancelled by user."); // Propagate cancellation
            }

            const isTransientNetworkError = isTransientNetworkErrorMessage(errorMessage);

            if (!usingStableRetrySequence && attempt === 1 && isTransientNetworkError) {
                usingStableRetrySequence = true;
                maxAttempts = stableRetryMaxAttempts;
                intervalSeconds = stableRetryIntervalSeconds;
                progressReporter.log(
                    `Transient network error detected. Switching to stable API retry logic (${Math.max(maxAttempts - attempt, 0)} retries remaining, ${intervalSeconds} seconds interval).`
                );
            }

            // Don't retry on certain fatal errors
            // Check 1: HTTP Status Code (Client Errors)
            const httpStatusMatch = errorMessage.match(/API error: (\d+)/);
            const httpStatusCode = httpStatusMatch ? parseInt(httpStatusMatch[1], 10) : null;
            if (httpStatusCode && (httpStatusCode === 400 || httpStatusCode === 401 || httpStatusCode === 403 || httpStatusCode === 404)) {
                throw lastError; // Throw fatal client HTTP errors immediately
            }
            // Check 2: Specific Error Codes reported *within* JSON (Server Errors)
            const jsonErrorCodeMatch = errorMessage.match(/\(Code: (\d+)\)/);
            const jsonErrorCode = jsonErrorCodeMatch ? parseInt(jsonErrorCodeMatch[1], 10) : null;
            if (jsonErrorCode && jsonErrorCode >= 500) { // Treat 5xx errors reported in JSON as fatal for retries
                 progressReporter.log(`[callApiWithRetry] Detected non-retryable error code ${jsonErrorCode} within API response.`);
                 throw lastError;
            }
            // Check 3: Specific non-retryable messages (optional, add if needed)
            // if (errorMessage.includes("some specific non-retryable text")) {
            //     throw lastError;
            // }


            // Check cancellation again before waiting for retry
            if (progressReporter.cancelled) {
                // console.log(`${provider.name} API Call: Cancellation detected after failed attempt ${attempt} (before retry wait).`);
                throw new Error("Processing cancelled by user during API retry sequence.");
            }

            if (attempt < maxAttempts) {
                const retryDelaySeconds = intervalSeconds;
                progressReporter.log(`Waiting ${retryDelaySeconds} seconds before retry ${attempt + 1}...`);

                await cancellableDelay(retryDelaySeconds * 1000, progressReporter);
            }

            if (attempt >= maxAttempts) {
                break;
            }
        }
    }

    console.error(`${provider.name} API Call: All configured attempts failed.`);
    throw lastError || new Error(`${provider.name} API call failed after multiple retries.`);
}


// --- Provider-Specific API Call Implementations ---

// Helper function to safe-parse error details from API responses
function getErrorDetails(errorText: string): string {
    try {
        const errorJson = JSON.parse(errorText);
        // Check for common error message structures
        if (errorJson.error && typeof errorJson.error.message === 'string') {
            return errorJson.error.message;
        }
        if (errorJson.error && typeof errorJson.error === 'string') {
            return errorJson.error;
        }
        if (errorJson.message && typeof errorJson.message === 'string') {
            return errorJson.message;
        }
        return errorText; // Fallback to raw text if no known structure is found
    } catch (e) {
        return errorText; // If parsing fails, return the original raw text
    }
}

/**
 * Extracts detailed debug information from an error object.
 * @param error The error object.
 * @returns A formatted string with stack trace and raw response if available.
 */
export function getDebugInfo(error: any): string {
    const infoLines: string[] = [];
    const attempts = getTransportDebugAttempts(error);

    attempts.forEach((attempt, index) => {
        infoLines.push(`Attempt ${index + 1} [${attempt.transport}]`);
        infoLines.push(`Request: ${attempt.requestMethod} ${sanitizeUrlForDebug(attempt.requestUrl)}`);
        const sanitizedRequestHeaders = sanitizeHeadersForDebug(attempt.requestHeaders);
        if (sanitizedRequestHeaders && Object.keys(sanitizedRequestHeaders).length > 0) {
            infoLines.push(`Request Headers: ${JSON.stringify(sanitizedRequestHeaders)}`);
        }
        if (typeof attempt.durationMs === 'number') {
            infoLines.push(`Duration: ${attempt.durationMs}ms`);
        }
        if (typeof attempt.status === 'number') {
            infoLines.push(`Status: ${attempt.status}`);
        }
        if (attempt.errorMessage) {
            infoLines.push(`Error: ${attempt.errorMessage}`);
        }
        const sanitizedResponseHeaders = sanitizeHeadersForDebug(attempt.responseHeaders);
        if (sanitizedResponseHeaders && Object.keys(sanitizedResponseHeaders).length > 0) {
            infoLines.push(`Response Headers: ${JSON.stringify(sanitizedResponseHeaders)}`);
        }
        if (attempt.partialResponseText) {
            infoLines.push(`Partial Response: ${attempt.partialResponseText}`);
        } else if (attempt.responseText) {
            infoLines.push(`Raw Response: ${attempt.responseText}`);
        }
    });

    const stack = error instanceof Error ? error.stack : '';
    const rawText = (error as any).text || (error as any).response?.text || '';
    if (!attempts.length && rawText) {
        infoLines.push(`Raw Response: ${rawText}`);
    }
    if (stack) {
        infoLines.push(`Stack: ${stack}`);
    }

    return infoLines.join('\n').trim();
}

/**
 * Modularized API Error Handler.
 * Implements the "DeepSeek-style" verbose debugging design.
 * @param providerName The name of the provider (e.g., "DeepSeek", "OpenAI", "Tavily").
 * @param errorOrResponse The error object caught from catch block, or a response object with bad status.
 * @param progressReporter The reporter to log to.
 * @param debugMode Whether to enable verbose logging (DeepSeek design).
 */
export function handleApiError(
    providerName: string,
    errorOrResponse: any,
    progressReporter: ProgressReporter,
    debugMode: boolean
): never {
    let status: number | undefined;
    let rawText: string = '';
    let message: string = '';

    // Determine input type
    if (errorOrResponse instanceof Error) {
        message = errorOrResponse.message;
        // Check for Obsidian requestUrl error properties
        if ((errorOrResponse as any).status) {
            status = (errorOrResponse as any).status;
            rawText = (errorOrResponse as any).text || '';
        }
    } else if (errorOrResponse && typeof errorOrResponse.status === 'number') {
        // Response object
        status = errorOrResponse.status;
        rawText = errorOrResponse.text || (errorOrResponse.json ? JSON.stringify(errorOrResponse.json) : '');
    } else {
        message = String(errorOrResponse);
    }

    // Try to extract a clean message
    const detailedMessage = rawText ? getErrorDetails(rawText) : message;

    // Verbose Debugging Logic (DeepSeek Design)
    if (debugMode) {
        if (status) {
            progressReporter.log(`[${providerName}] Request failed with status ${status}`);
        }
        if (rawText) {
            progressReporter.log(`[${providerName}] Error response: ${rawText}`);
        } else if (message) {
            progressReporter.log(`[${providerName}] Error details: ${message}`);
        }

        const extraDebug = getDebugInfo(errorOrResponse);
        if (extraDebug) {
            progressReporter.log(`[${providerName}] Debug details:\n${extraDebug}`);
        }
    }

    // Standardized Error Throwing
    if (status) {
        throw new Error(`${providerName} API error: ${status} - ${detailedMessage}`);
    } else {
        throw new Error(`${providerName} API request failed: ${detailedMessage || message}`);
    }
}


// Helper function to manage AbortController/Signal
function getAbortSignal(progressReporter: ProgressReporter, providedSignal?: AbortSignal): { signal: AbortSignal, controller: AbortController | null } {
    if (providedSignal) {
        return { signal: providedSignal, controller: null };
    }
    const controller = new AbortController();
    progressReporter.abortController = controller;
    return { signal: controller.signal, controller: controller };
}

async function executeDeepSeekAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for DeepSeek provider.`);
    const url = `${provider.baseUrl}/chat/completions`;
    
    // DeepSeek reasoning models (deepseek-reasoner, deepseek-r1) require special handling:
    // 1. Use ONLY 'user' role messages (no 'system' role)
    // 2. For exact model "deepseek-reasoner": NO temperature parameter at all
    // 3. Use max_completion_tokens instead of max_tokens
    const isDeepseekReasoner = modelName === 'deepseek-reasoner' || modelName.includes('deepseek-reasoner');
    const isReasoningModel = isDeepseekReasoner || modelName.includes('-r1');
    
    const requestBody: any = {
        model: modelName,
        messages: isReasoningModel 
            ? [{ role: 'user', content: `${prompt}\n\n${content}` }]
            : [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        max_completion_tokens: settings.maxTokens
    };
    
    // Only set temperature for non-reasoner models
    // For exact "deepseek-reasoner" model, exclude temperature completely
    if (modelName !== 'deepseek-reasoner' && !isReasoningModel) {
        requestBody.temperature = provider.temperature;
    }
    
    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        progressReporter.log(`[DeepSeek] Calling API with model: ${modelName}, isReasoner: ${isDeepseekReasoner}`);
        progressReporter.log(`[DeepSeek] Request body: ${JSON.stringify(requestBody, null, 2)}`);
        
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('DeepSeek', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            // Delegate error handling
            handleApiError('DeepSeek', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        
        if (response.status < 200 || response.status >= 300) {
            handleApiError('DeepSeek', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        
        // For reasoning models, response includes both reasoning_content and content
        // We want the final answer (content), not the reasoning process
        const message = data.choices?.[0]?.message;
        if (!message) {
            progressReporter.log(`[DeepSeek] Unexpected response structure: ${JSON.stringify(data)}`);
            throw new Error(`Unexpected response format from DeepSeek API - no message in choices`);
        }
        
        // Get the final content (for reasoning models, this is the answer after reasoning)
        const responseContent = message.content || '';
        
        if (!responseContent) {
            // For debugging: log if there's reasoning_content but no content
            if (message.reasoning_content) {
                progressReporter.log(`[DeepSeek] Response has reasoning_content but no content field`);
            }
            progressReporter.log(`[DeepSeek] Response structure: ${JSON.stringify(data)}`);
            throw new Error(`Unexpected response format from DeepSeek API - empty content`);
        }
        
        progressReporter.log(`[DeepSeek] API call successful, received ${responseContent.length} characters`);
        return responseContent;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for OpenAI provider.`);
    const url = `${provider.baseUrl}/chat/completions`;
    
    // OpenAI reasoning models (o1, o1-mini, o1-preview, o3-mini) don't support system role or temperature
    // They only accept 'user' and 'assistant' roles
    const isReasoningModel = modelName.startsWith('o1') || modelName.startsWith('o3');
    
    const requestBody: any = {
        model: modelName,
        messages: isReasoningModel 
            ? [{ role: 'user', content: `${prompt}\n\n${content}` }]
            : [{ role: 'system', content: prompt }, { role: 'user', content: content }],
    };
    
    // Reasoning models don't support temperature or max_tokens parameters
    if (!isReasoningModel) {
        requestBody.temperature = provider.temperature;
        requestBody.max_tokens = settings.maxTokens;
    }
    
    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('OpenAI', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('OpenAI', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('OpenAI', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from OpenAI API`); }
        return data.choices[0].message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeAnthropicApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for Anthropic provider.`);
    const url = `${provider.baseUrl}/v1/messages`;
    const requestBody = {
        model: modelName,
        system: prompt, // Pass the prompt as the system message
        messages: [{ role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    
    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('Anthropic', {
                url: url,
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-api-key': provider.apiKey, 
                    'anthropic-version': '2023-06-01' 
                }, 
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('Anthropic', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('Anthropic', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.content?.[0]?.text) { throw new Error(`Unexpected response format from Anthropic API`); }
        return data.content[0].text;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeGoogleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for Google provider.`);
    const urlWithKey = `${provider.baseUrl}/models/${modelName}:generateContent?key=${provider.apiKey}`;
    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] }],
        generationConfig: { temperature: provider.temperature, maxOutputTokens: settings.maxTokens }
    };

    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('Google', {
                url: urlWithKey,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('Google', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('Google', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) { throw new Error(`Unexpected response format from Google API`); }
        return data.candidates[0].content.parts[0].text;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeMistralApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for Mistral provider.`);
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };

    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('Mistral', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('Mistral', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('Mistral', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Mistral API`); }
        return data.choices[0].message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeAzureOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for Azure OpenAI provider.`);
    if (!provider.apiVersion || !provider.baseUrl) { throw new Error('API version and Base URL are required for Azure OpenAI'); }
    const url = `${provider.baseUrl}/openai/deployments/${modelName}/chat/completions?api-version=${provider.apiVersion}`;
    const requestBody = {
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };

    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('Azure OpenAI', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api-key': provider.apiKey },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('Azure OpenAI', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('Azure OpenAI', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Azure OpenAI API`); }
        return data.choices[0].message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeLMStudioApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    // Note: LMStudio might not require an API key, or use a placeholder like 'EMPTY'.
    const url = `${provider.baseUrl}/chat/completions`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
    };

    if (typeof provider.temperature === 'number') {
        requestBody.temperature = provider.temperature;
    }
    if (typeof settings.maxTokens === 'number' && settings.maxTokens > 0) {
        requestBody.max_tokens = settings.maxTokens;
    }

    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('LMStudio', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}` },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('LMStudio', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('LMStudio', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from LMStudio`); }
        return data.choices[0].message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeOllamaApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    // Note: Ollama does not use API keys.
    const url = `${provider.baseUrl}/chat`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        options: { temperature: provider.temperature, num_predict: settings.maxTokens },
        stream: false
    };
    
    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('Ollama', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('Ollama', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('Ollama', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.message?.content) { throw new Error(`Unexpected response format from Ollama`); }
        return data.message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

// Updated executeOpenRouterAPI with safer parsing and enhanced logging
async function executeOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for OpenRouter provider.`);
    const url = `${provider.baseUrl}/chat/completions`;

    // Check for reasoning models (e.g., DeepSeek R1, OpenAI o1/o3)
    const isDeepSeekReasoner = modelName.includes('deepseek-r1') || modelName.includes('reasoner');
    const isOpenAIReasoner = modelName.includes('openai/o1') || modelName.includes('openai/o3');
    const isReasoningModel = isDeepSeekReasoner || isOpenAIReasoner;

    const requestBody: any = {
        model: modelName, // User specifies the full model string e.g., "google/gemini-pro"
        messages: isReasoningModel 
            ? [{ role: 'user', content: `${prompt}\n\n${content}` }]
            : [{ role: 'system', content: prompt }, { role: 'user', content: content }],
    };

    // Only add specific parameters for non-reasoning models, or as required
    if (!isReasoningModel) {
        requestBody.temperature = provider.temperature;
        requestBody.max_tokens = settings.maxTokens;
    } else {
         // For DeepSeek R1 on OpenRouter, recommended temperature is 0.7
         if (isDeepSeekReasoner) {
             requestBody.temperature = 0.7;
         }
    }
    
    const { controller } = getAbortSignal(progressReporter, signal);
    let response;

    try {
        await cancellableDelay(1, progressReporter); // Yield
        progressReporter.log(`[OpenRouter] Calling API: ${url} with model ${modelName}`);
        
        try {
            response = await requestRuntimeUrlWithDesktopFallback('OpenRouter', {
                url: url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`,
                    'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD', // Required by OpenRouter
                    'X-Title': 'Notemd Obsidian Plugin' // Required by OpenRouter
                },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
             handleApiError('OpenRouter', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        progressReporter.log(`[OpenRouter] Received response status: ${response.status}`);

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");

        const responseText = response.text; // Read body as text first
        progressReporter.log(`[OpenRouter] Read response text (length: ${responseText.length}).`);
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after reading response text."); // Check again

        if (response.status < 200 || response.status >= 300) {
             // Pass response object (which still has .status and .text)
             handleApiError('OpenRouter', response, progressReporter, settings.enableApiErrorDebugMode);
        }

        // Now attempt to parse the text as JSON
        let data;
        try {
            data = JSON.parse(responseText); // Use already read text
            progressReporter.log(`[OpenRouter] Successfully parsed JSON response.`);
        } catch (jsonError: unknown) {
            progressReporter.log(`[OpenRouter] Failed to parse JSON response, status was ${response.status}.`);
            progressReporter.log(`[OpenRouter] Raw response text: ${responseText}`); // Log raw text on parse failure
            // Fallback: If JSON parsing fails on 200 OK, maybe the raw text is the content?
            progressReporter.log(`[OpenRouter] Warning: JSON parsing failed despite 200 OK. Using raw response text as potential content.`);
            return responseText; // Use raw text as fallback content
        }

        // --- Check for errors *within* the successfully parsed JSON response ---
        const choice = data.choices?.[0];
        if (choice && (choice.finish_reason === 'error' || choice.error)) {
            const errorMessage = choice.error?.message || `OpenRouter reported finish_reason: error`;
            const errorCode = choice.error?.code || 'N/A';
            progressReporter.log(`[OpenRouter] Error reported in JSON response: Code ${errorCode}, Message: ${errorMessage}`);
            // Throw specific error based on JSON content
            throw new Error(`OpenRouter API reported an error: ${errorMessage} (Code: ${errorCode})`);
        }
        // --- End JSON error check ---

        // Check expected structure - Primary: content field
        let responseContent = data.choices?.[0]?.message?.content;

        // Fallback: Check reasoning field if content is empty/null
        if (!responseContent && data.choices?.[0]?.message?.reasoning) {
            progressReporter.log(`[OpenRouter] 'content' field empty, using 'reasoning' field as fallback.`);
            responseContent = data.choices?.[0]?.message?.reasoning;
        }

        // Final check: If still no content, throw error
        if (!responseContent) {
            progressReporter.log(`[OpenRouter] Unexpected JSON structure or empty content/reasoning: ${JSON.stringify(data)}`); // Log unexpected structure
            throw new Error(`Unexpected response format or empty content from OpenRouter`);
        }

        progressReporter.log(`[OpenRouter] API call successful (using ${data.choices?.[0]?.message?.content ? 'content' : 'reasoning'} field).`);
        return responseContent;

    } finally {
        // Only clear the reporter's controller if we created it internally
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        }
    }
}

async function executeXaiApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for xAI provider.`);
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    
    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter); // Yield
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback('xAI', {
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError('xAI', error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError('xAI', response, progressReporter, settings.enableApiErrorDebugMode);
        }
        const data = response.json;
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from xAI API`); }
        return data.choices[0].message.content;
    } finally { 
        if (controller && progressReporter.abortController === controller) { 
            progressReporter.abortController = null; 
        } 
    }
}

async function executeOpenAICompatibleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    ensureProviderApiKey(provider);

    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = buildOpenAICompatibleRequestBody(
        provider,
        modelName,
        prompt,
        content,
        settings.maxTokens,
        provider.temperature
    );

    const { controller } = getAbortSignal(progressReporter, signal);

    try {
        await cancellableDelay(1, progressReporter);
        let response;
        try {
            response = await requestRuntimeUrlWithDesktopFallback(provider.name, {
                url,
                method: 'POST',
                headers: buildOpenAICompatibleHeaders(provider),
                body: JSON.stringify(requestBody),
                throw: false
            }, progressReporter, signal);
        } catch (error: any) {
            handleApiError(provider.name, error, progressReporter, settings.enableApiErrorDebugMode);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            handleApiError(provider.name, response, progressReporter, settings.enableApiErrorDebugMode);
        }

        const data = response.json;
        const fallbackText = typeof response.text === 'string' ? response.text : '';
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        return extractOpenAICompatibleText(provider.name, data, fallbackText);
    } finally {
        if (controller && progressReporter.abortController === controller) {
            progressReporter.abortController = null;
        }
    }
}



// --- Exported API Call Functions ---
// Note: These exported functions are primarily used by other parts of the plugin that DON'T pass an external signal (e.g., processFile).
// The callLLM function handles passing the signal when available (e.g., translateFile).

export function callDeepSeekAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeDeepSeekAPI, signal);
}

export function callOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOpenAIApi, signal);
}

export function callAnthropicApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeAnthropicApi, signal);
}

export function callGoogleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeGoogleApi, signal);
}

export function callMistralApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeMistralApi, signal);
}

export function callAzureOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeAzureOpenAIApi, signal);
}

export function callLMStudioApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeLMStudioApi, signal);
}

export function callOllamaApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOllamaApi, signal);
}

export function callOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOpenRouterAPI, signal);
}

export function callXaiApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeXaiApi, signal);
}

export function callOpenAICompatibleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOpenAICompatibleApi, signal);
}

export async function callLLM(
    provider: LLMProviderConfig,
    prompt: string,
    content: string,
    settings: NotemdSettings,
    progressReporter: ProgressReporter,
    modelName?: string,
    signal?: AbortSignal // Add optional signal
): Promise<string> {
    const modelToUse = modelName || provider.model;
    const providerDefinition = getLLMProviderDefinition(provider.name);

    switch (providerDefinition?.transport) {
        case 'openai-compatible':
            return callOpenAICompatibleApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'anthropic':
            return callAnthropicApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'google':
            return callGoogleApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'azure-openai':
            return callAzureOpenAIApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'ollama':
            return callOllamaApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        default:
            throw new Error(`Provider ${provider.name} not supported`);
    }
}
