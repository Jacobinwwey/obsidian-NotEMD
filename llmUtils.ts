import { Notice } from 'obsidian';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import { cancellableDelay } from './utils';
import { ErrorModal } from './ui/ErrorModal'; // Import ErrorModal

/**
 * Generates the system prompt for the LLM processing task (adding backlinks).
 * @returns The prompt string.
 */
export function getLLMProcessingPrompt(): string {
    // Refined prompt based on PowerShell script rules
    return `Completely decompose and structure the knowledge points in this markdown document, outputting them in markdown format supported by Obsidian. Core knowledge points should be labelled with Obsidian's backlink format [[]]. Do not output anything other than the original text and the requested "Obsidian's backlink format [[]]".

Rules:
1. Only add Obsidian backlinks [[like this]] to core concepts. Do not modify the original text content or formatting otherwise.
2. Skip conventional names (common products, company names, dates, times, individual names) unless they represent a core technical or scientific concept within the text's context.
3. Output the *entire* original content of the chunk, preserving all formatting (headers, lists, code blocks, etc.), with only the added backlinks.
4. Handle duplicate concepts carefully:
    a. If both singular and plural forms of a word/concept appear (e.g., "model" and "models"), only add the backlink to the *first occurrence* of the *singular* form (e.g., [[model]]). Do not link the plural form.
    b. If a single-word concept (e.g., "relaxation") also appears as part of a multi-word concept (e.g., "dielectric relaxation"), only add the backlink to the *multi-word* concept (e.g., [[dielectric relaxation]]). Do not link the standalone single word in this case.
    c. Do not add duplicate backlinks for the exact same concept within this chunk. Link only the first meaningful occurrence.
5. Ignore any "References", "Bibliography", or similar sections, typically found at the end of documents. Do not add backlinks within these sections.`;
}

/**
 * Tests the connection to a given LLM provider.
 * @param provider The provider configuration to test.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function testAPI(provider: LLMProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
        let response: Response;
        let url: string;
        let options: RequestInit = { method: 'GET' }; // Default to GET

        switch (provider.name) {
            case 'Ollama':
                url = `${provider.baseUrl}/tags`;
                options.headers = { 'Content-Type': 'application/json' };
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Ollama API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Ollama at ${provider.baseUrl} and listed models.` };

            case 'LMStudio':
                const lmStudioUrl = `${provider.baseUrl}/chat/completions`;
                const lmStudioOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant' },
                            { role: 'user', content: 'Hello' }
                        ],
                        temperature: 0.7,
                        max_tokens: 10
                    })
                };
                try {
                    response = await fetch(lmStudioUrl, lmStudioOptions);
                    if (response.ok) {
                        try { await response.json(); } catch (jsonError) { console.warn("LMStudio test connection response was not valid JSON, but status was OK. Assuming success."); }
                        return { success: true, message: `Successfully connected to LMStudio API at ${provider.baseUrl} using model '${provider.model}'.` };
                    } else {
                        const errorText = await response.text();
                        if (errorText.includes("Could not find model")) { throw new Error(`LMStudio API error: Model '${provider.model}' not found or loaded on the server.`); }
                        throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
                    }
                } catch (e: unknown) { // Changed to unknown
                    const message = e instanceof Error ? e.message : String(e);
                    throw new Error(`LMStudio API connection failed: ${message}. Is the server running at ${provider.baseUrl}?`);
                }

            case 'OpenRouter':
                url = `${provider.baseUrl}/chat/completions`;
                options.method = 'POST';
                options.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`,
                    'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                    'X-Title': 'Notemd Obsidian Plugin'
                };
                options.body = JSON.stringify({
                    model: provider.model,
                    messages: [{ role: 'user', content: 'Test connection' }],
                    max_tokens: 1,
                    temperature: 0
                });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to OpenRouter API using model '${provider.model}'.` };

            case 'OpenAI':
            case 'Mistral':
            case 'DeepSeek':
                url = `${provider.baseUrl}/models`;
                options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                response = await fetch(url, options);
                if (!response.ok) {
                    url = `${provider.baseUrl}/chat/completions`;
                    options.method = 'POST';
                    options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                    options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                    response = await fetch(url, options);
                }
                if (!response.ok) throw new Error(`${provider.name} API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to ${provider.name} API at ${provider.baseUrl}.` };

            case 'Anthropic':
                url = `${provider.baseUrl}/v1/messages`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' };
                options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Anthropic API.` };

            case 'Google':
                url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Google API.` };

            case 'Azure OpenAI':
                if (!provider.apiVersion || !provider.baseUrl || !provider.model) { throw new Error('Azure requires Base URL, Model (Deployment Name), and API Version.'); }
                url = `${provider.baseUrl}/openai/deployments/${provider.model}/chat/completions?api-version=${provider.apiVersion}`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'api-key': provider.apiKey };
                options.body = JSON.stringify({ messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Azure OpenAI API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Azure OpenAI deployment '${provider.model}'.` };

            default:
                return { success: false, message: `Connection test not implemented for provider: ${provider.name}` };
        }
    } catch (error: unknown) { // Changed to unknown
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Connection test failed for ${provider.name}:`, error);
        return { success: false, message: `Connection failed: ${message}` };
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
    apiCallFunction: (provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings) => Promise<string>
): Promise<string> {
    let lastError: Error | null = null;
    const maxAttempts = settings.enableStableApiCall ? settings.apiCallMaxRetries + 1 : 1;
    const intervalSeconds = settings.enableStableApiCall ? settings.apiCallInterval : 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (progressReporter.cancelled) {
            console.log(`${provider.name} API Call: Cancellation detected before attempt ${attempt}`);
            throw new Error("Processing cancelled by user before API attempt.");
        }

        try {
            // Pass settings to the underlying API call function
            return await apiCallFunction(provider, modelName, prompt, content, progressReporter, settings);
        } catch (error: unknown) { // Changed to unknown
            const errorMessage = error instanceof Error ? error.message : String(error);
            lastError = error instanceof Error ? error : new Error(errorMessage); // Store Error object if possible
            console.warn(`${provider.name} API Call: Attempt ${attempt} failed: ${errorMessage}`);

            // Handle cancellation specifically
            if ((error instanceof Error && error.name === 'AbortError') || errorMessage.includes("cancelled by user")) {
                console.log(`${provider.name} API Call: Cancellation detected during attempt ${attempt}.`);
                throw new Error("API call cancelled by user."); // Propagate cancellation
            }

            // Don't retry on certain fatal errors (e.g., 401, 404) - this logic might need refinement per provider
            const statusMatch = errorMessage.match(/API error: (\d+)/);
            const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;
            if (statusCode && (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404)) {
                throw lastError; // Throw fatal errors immediately
            }

            // Check cancellation again before waiting for retry
            if (progressReporter.cancelled) {
                console.log(`${provider.name} API Call: Cancellation detected after failed attempt ${attempt} (before retry wait).`);
                throw new Error("Processing cancelled by user during API retry sequence.");
            }

            if (attempt < maxAttempts) {
                progressReporter.log(`Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
                await cancellableDelay(intervalSeconds * 1000, progressReporter);
            }
        }
    }

    console.error(`${provider.name} API Call: All ${maxAttempts} attempts failed.`);
    throw lastError || new Error(`${provider.name} API call failed after multiple retries.`);
}


// --- Provider-Specific API Call Implementations ---

async function executeDeepSeekAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from DeepSeek API`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`OpenAI API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from OpenAI API`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeAnthropicApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/v1/messages`;
    // Anthropic combines prompt and content in the user message
    const requestBody = {
        model: modelName,
        messages: [{ role: 'user', content: `${prompt}\n\n${content}` }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Anthropic API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.content?.[0]?.text) { throw new Error(`Unexpected response format from Anthropic API`); }
        return data.content[0].text;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeGoogleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const urlWithKey = `${provider.baseUrl}/models/${modelName}:generateContent?key=${provider.apiKey}`;
    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] }],
        generationConfig: { temperature: provider.temperature, maxOutputTokens: settings.maxTokens }
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(urlWithKey, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Google API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) { throw new Error(`Unexpected response format from Google API`); }
        return data.candidates[0].content.parts[0].text;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeMistralApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Mistral API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Mistral API`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeAzureOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    if (!provider.apiVersion || !provider.baseUrl) { throw new Error('API version and Base URL are required for Azure OpenAI'); }
    const url = `${provider.baseUrl}/openai/deployments/${modelName}/chat/completions?api-version=${provider.apiVersion}`;
    const requestBody = {
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'api-key': provider.apiKey }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Azure OpenAI API`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeLMStudioApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}` }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`LMStudio API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from LMStudio`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeOllamaApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        options: { temperature: provider.temperature, num_predict: settings.maxTokens },
        stream: false
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Ollama API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.message?.content) { throw new Error(`Unexpected response format from Ollama`); }
        return data.message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}

async function executeOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    try {
        await cancellableDelay(1, progressReporter); // Yield
        const response = await fetch(url, {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}`, 'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD', 'X-Title': 'Notemd Obsidian Plugin' }, body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (!response.ok) { const errorText = await response.text(); throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`); }
        const data = await response.json();
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API success.");
        if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from OpenRouter`); }
        return data.choices[0].message.content;
    } finally { if (progressReporter.abortController === controller) { progressReporter.abortController = null; } }
}


// --- Exported API Call Functions ---

export function callDeepSeekAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeDeepSeekAPI);
}

export function callOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOpenAIApi);
}

export function callAnthropicApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    // Note: Anthropic combines prompt and content in user message, so pass empty prompt to execute function
    return callApiWithRetry(provider, modelName, '', `${prompt}\n\n${content}`, settings, progressReporter, executeAnthropicApi);
}

export function callGoogleApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeGoogleApi);
}

export function callMistralApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeMistralApi);
}

export function callAzureOpenAIApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeAzureOpenAIApi);
}

export function callLMStudioApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeLMStudioApi);
}

export function callOllamaApi(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOllamaApi);
}

export function callOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    return callApiWithRetry(provider, modelName, prompt, content, settings, progressReporter, executeOpenRouterAPI);
}
