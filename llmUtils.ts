import { Notice } from 'obsidian';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import { cancellableDelay } from './utils';
import { ErrorModal } from './ui/ErrorModal'; // Import ErrorModal
import { DEFAULT_PROMPT_ADD_LINKS } from './constants'; // Import the default prompt

/**
 * Generates the system prompt for the LLM processing task (adding backlinks).
 * @param settings Optional settings object to check for custom prompt
 * @returns The prompt string.
 */
export function getLLMProcessingPrompt(settings?: NotemdSettings): string {
    // If settings are provided and custom prompt is enabled and available, use it
    if (settings?.enableChangePromptWord && settings?.enableChangePromptAddLinks && settings?.customPromptAddLinks) {
        return settings.customPromptAddLinks;
    }
    
    // Otherwise use the default prompt
    return DEFAULT_PROMPT_ADD_LINKS;
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
                 // OpenAI API: Try /models first, fallback to chat/completions
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
                 if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to OpenAI API at ${provider.baseUrl}.` };

            case 'DeepSeek':
                 // DeepSeek API: Try /models first, fallback to chat/completions
                url = `${provider.baseUrl}/models`;
                options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                response = await fetch(url, options);
                // Fallback to chat completion test if /models fails
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

            case 'Mistral':
                 // Mistral API: Try /models first, fallback to chat/completions
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
                 if (!response.ok) throw new Error(`Mistral API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to Mistral API at ${provider.baseUrl}.` };

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
            // console.log(`${provider.name} API Call: Cancellation detected before attempt ${attempt}`);
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
                // console.log(`${provider.name} API Call: Cancellation detected during attempt ${attempt}.`);
                throw new Error("API call cancelled by user."); // Propagate cancellation
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
    if (!provider.apiKey) throw new Error(`API key is missing for DeepSeek provider.`);
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
    if (!provider.apiKey) throw new Error(`API key is missing for OpenAI provider.`);
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
    if (!provider.apiKey) throw new Error(`API key is missing for Anthropic provider.`);
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
    if (!provider.apiKey) throw new Error(`API key is missing for Google provider.`);
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
    if (!provider.apiKey) throw new Error(`API key is missing for Mistral provider.`);
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
    if (!provider.apiKey) throw new Error(`API key is missing for Azure OpenAI provider.`);
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
    // Note: LMStudio might not require an API key, or use a placeholder like 'EMPTY'.
    // No explicit check here, rely on the API call itself to fail if needed.
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
    // Note: Ollama does not use API keys.
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

// Updated executeOpenRouterAPI with safer parsing and enhanced logging
async function executeOpenRouterAPI(provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings): Promise<string> {
    if (!provider.apiKey) throw new Error(`API key is missing for OpenRouter provider.`);
    const url = `${provider.baseUrl}/chat/completions`;
    const requestBody = {
        model: modelName, // User specifies the full model string e.g., "google/gemini-pro"
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: provider.temperature,
        max_tokens: settings.maxTokens
    };
    const controller = new AbortController();
    progressReporter.abortController = controller;
    let response: Response | null = null;

    try {
        await cancellableDelay(1, progressReporter); // Yield
        progressReporter.log(`[OpenRouter] Calling API: ${url} with model ${modelName}`);
        response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD', // Required by OpenRouter
                'X-Title': 'Notemd Obsidian Plugin' // Required by OpenRouter
            },
            body: JSON.stringify(requestBody)
        });
        progressReporter.log(`[OpenRouter] Received response status: ${response.status}`);

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");

        const responseText = await response.text(); // Read body as text first
        progressReporter.log(`[OpenRouter] Read response text (length: ${responseText.length}).`);
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after reading response text."); // Check again

        if (!response.ok) {
            progressReporter.log(`[OpenRouter] API Error Response Text: ${responseText}`); // Log error text
            throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
        }

        // Now attempt to parse the text as JSON
        let data;
        try {
            data = JSON.parse(responseText);
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

    } catch (error) {
         // Log fetch-related errors (network, CORS, abort, etc.)
         if (error instanceof Error && error.name === 'AbortError') {
             progressReporter.log(`[OpenRouter] Fetch aborted.`);
         } else if (error instanceof Error) {
             progressReporter.log(`[OpenRouter] Fetch error: ${error.message}`);
         } else {
             progressReporter.log(`[OpenRouter] Unknown fetch error: ${error}`);
         }
         // Re-throw the error to be handled by callApiWithRetry
         throw error;
    } finally {
        if (progressReporter.abortController === controller) {
            progressReporter.abortController = null;
        }
    }
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
