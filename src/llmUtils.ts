import { Notice, requestUrl } from 'obsidian';
import { LLMProviderConfig, NotemdSettings, ProgressReporter } from './types';
import { cancellableDelay } from './utils';
import { ErrorModal } from './ui/ErrorModal'; // Import ErrorModal



/**
 * Tests the connection to a given LLM provider.
 * @param provider The provider configuration to test.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function testAPI(provider: LLMProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
        let response;
        let url: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let options: any = { method: 'GET' }; // Default to GET

        switch (provider.name) {
            case 'Ollama':
                const ollamaUrl = `${provider.baseUrl}/chat`;
                const ollamaOptions = {
                    url: ollamaUrl,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [{ role: 'user', content: 'Test connection' }],
                        stream: false
                    })
                };
                response = await requestUrl(ollamaOptions);
                if (response.status < 200 || response.status >= 300) {
                    const errorText = response.text;
                    if (errorText.includes("model") && errorText.includes("not found")) {
                        throw new Error(`Ollama API error: Model '${provider.model}' not found. Please make sure it is pulled and available.`);
                    }
                    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
                }
                // No need to call .json() on the response text, it's already parsed
                return { success: true, message: `Successfully connected to Ollama at ${provider.baseUrl} using model '${provider.model}'.` };

            case 'LMStudio':
                const lmStudioUrl = `${provider.baseUrl}/chat/completions`;
                const lmStudioOptions = {
                    url: lmStudioUrl,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: 'This is a connection test.' }
                        ]
                    })
                };
                try {
                    response = await requestUrl(lmStudioOptions);
                    if (response.status >= 200 && response.status < 300) {
                        return { success: true, message: `Successfully connected to LMStudio API at ${provider.baseUrl} using model '${provider.model}'.` };
                    } else {
                        const errorText = response.text;
                        if (errorText.includes("Could not find model")) { throw new Error(`LMStudio API error: Model '${provider.model}' not found or loaded on the server.`); }
                        throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
                    }
                } catch (e: unknown) { // Changed to unknown
                    const message = e instanceof Error ? e.message : String(e);
                    throw new Error(`LMStudio API connection failed: ${message}. Is the server running at ${provider.baseUrl}?`);
                }

            case 'OpenRouter':
                url = `${provider.baseUrl}/chat/completions`;
                options.url = url;
                options.method = 'POST';
                options.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`,
                    'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                    'X-Title': 'Notemd Obsidian Plugin'
                };
                
                const isReasoningRouter = provider.model.includes('deepseek-r1') || provider.model.includes('reasoner') || provider.model.includes('o1') || provider.model.includes('o3');
                const routerBody: any = {
                    model: provider.model,
                    messages: [{ role: 'user', content: 'Test connection' }]
                };
                if (!isReasoningRouter) {
                    routerBody.max_tokens = 1;
                    routerBody.temperature = 0;
                }
                options.body = JSON.stringify(routerBody);
                
                response = await requestUrl(options);
                if (response.status < 200 || response.status >= 300) throw new Error(`OpenRouter API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to OpenRouter API using model '${provider.model}'.` };

            case 'OpenAI':
                 // OpenAI API: Try /models first, fallback to chat/completions
                 url = `${provider.baseUrl}/models`;
                 options.url = url;
                 options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                 try {
                    response = await requestUrl(options);
                 } catch (e) {
                    // Ignore error and try chat completions
                 }

                 if (response && response.status >= 200 && response.status < 300) {
                    return { success: true, message: `Successfully connected to OpenAI API at ${provider.baseUrl}.` };
                 }

                 url = `${provider.baseUrl}/chat/completions`;
                 options.url = url;
                 options.method = 'POST';
                 options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                 
                 const isReasoningOpenAI = provider.model.startsWith('o1') || provider.model.startsWith('o3');
                 const openAIBody: any = { model: provider.model, messages: [{ role: 'user', content: 'Test' }] };
                 if (!isReasoningOpenAI) {
                    openAIBody.max_tokens = 1;
                    openAIBody.temperature = 0;
                 }
                 options.body = JSON.stringify(openAIBody);
                 
                 response = await requestUrl(options);

                 if (response.status < 200 || response.status >= 300) throw new Error(`OpenAI API error: ${response.status} - ${response.text}`);
                 return { success: true, message: `Successfully connected to OpenAI API at ${provider.baseUrl}.` };

            case 'DeepSeek':
                 // DeepSeek API: Try /models first, fallback to chat/completions
                url = `${provider.baseUrl}/models`;
                options.url = url;
                options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                try {
                    response = await requestUrl(options);
                } catch (e) {
                    // Ignore error and try chat completions
                }
                // Fallback to chat completion test if /models fails
                if (response && response.status >= 200 && response.status < 300) {
                    return { success: true, message: `Successfully connected to ${provider.name} API at ${provider.baseUrl}.` };
                }

                url = `${provider.baseUrl}/chat/completions`;
                options.url = url;
                options.method = 'POST';
                options.headers = { ...options.headers, 'Content-Type': 'application/json' };

                // Match the same logic as executeDeepSeekAPI
                const isDeepseekReasonerTest = provider.model === 'deepseek-reasoner' || provider.model.includes('deepseek-reasoner');
                const isReasoningDeepSeek = isDeepseekReasonerTest || provider.model.includes('-r1');
                
                const deepSeekBody: any = { 
                    model: provider.model, 
                    messages: [{ role: 'user', content: 'Test' }],
                    max_completion_tokens: 1
                };
                
                // Only add temperature for non-reasoner models (exclude exact "deepseek-reasoner")
                if (provider.model !== 'deepseek-reasoner' && !isReasoningDeepSeek) {
                    deepSeekBody.temperature = 0;
                }
                
                options.body = JSON.stringify(deepSeekBody);

                response = await requestUrl(options);

                if (response.status < 200 || response.status >= 300) throw new Error(`${provider.name} API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to ${provider.name} API at ${provider.baseUrl}.` };

            case 'Mistral':
                 // Mistral API: Try /models first, fallback to chat/completions
                 url = `${provider.baseUrl}/models`;
                 options.url = url;
                 options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                 try {
                    response = await requestUrl(options);
                 } catch (e) {
                    // Ignore error and try chat completions
                 }
                 if (response && response.status >= 200 && response.status < 300) {
                    return { success: true, message: `Successfully connected to Mistral API at ${provider.baseUrl}.` };
                 }

                 url = `${provider.baseUrl}/chat/completions`;
                 options.url = url;
                 options.method = 'POST';
                 options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                 options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                 response = await requestUrl(options);

                 if (response.status < 200 || response.status >= 300) throw new Error(`Mistral API error: ${response.status} - ${response.text}`);
                 return { success: true, message: `Successfully connected to Mistral API at ${provider.baseUrl}.` };

            case 'Anthropic':
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
                response = await requestUrl(options);
                if (response.status < 200 || response.status >= 300) throw new Error(`Anthropic API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Anthropic API.` };

            case 'Google':
                url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
                options.url = url;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } });
                response = await requestUrl(options);
                if (response.status < 200 || response.status >= 300) throw new Error(`Google API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Google API.` };
            case 'Azure OpenAI':
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
                
                response = await requestUrl(options);
                if (response.status < 200 || response.status >= 300) throw new Error(`Azure OpenAI API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to Azure OpenAI deployment '${provider.model}'.` };
            
            case 'xAI':
                // xAI API: Try /models first, fallback to chat/completions
                url = `${provider.baseUrl}/models`;
                options.url = url;
                options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                try {
                    response = await requestUrl(options);
                } catch (e) {
                    // Ignore error and try chat completions
                }
                if (response && response.status >= 200 && response.status < 300) {
                    return { success: true, message: `Successfully connected to xAI API at ${provider.baseUrl}.` };
                }

                url = `${provider.baseUrl}/chat/completions`;
                options.url = url;
                options.method = 'POST';
                options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                response = await requestUrl(options);

                if (response.status < 200 || response.status >= 300) throw new Error(`xAI API error: ${response.status} - ${response.text}`);
                return { success: true, message: `Successfully connected to xAI API at ${provider.baseUrl}.` };

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
    apiCallFunction: (provider: LLMProviderConfig, modelName: string, prompt: string, content: string, progressReporter: ProgressReporter, settings: NotemdSettings, signal?: AbortSignal) => Promise<string>,
    signal?: AbortSignal // Accept optional signal
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

// Helper function to safely parse error details from API responses
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
            response = await requestUrl({
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify(requestBody)
            });
        } catch (error: any) {
            // requestUrl throws on non-2xx status codes
            // The error object contains the response details
            if (error.status) {
                const errorText = error.text || JSON.stringify(error);
                const detailedMessage = getErrorDetails(errorText);
                progressReporter.log(`[DeepSeek] Request failed with status ${error.status}`);
                progressReporter.log(`[DeepSeek] Error response: ${errorText}`);
                throw new Error(`DeepSeek API error: ${error.status} - ${detailedMessage}`);
            }
            // Network or other error
            const errorMessage = error instanceof Error ? error.message : String(error);
            progressReporter.log(`[DeepSeek] Request failed with error: ${errorMessage}`);
            throw new Error(`DeepSeek API request failed: ${errorMessage}`);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            progressReporter.log(`[DeepSeek] API Error (${response.status}): ${detailedMessage}`);
            progressReporter.log(`[DeepSeek] Response text: ${response.text}`);
            throw new Error(`DeepSeek API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`OpenAI API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-api-key': provider.apiKey, 
                'anthropic-version': '2023-06-01' 
            }, 
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`Anthropic API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: urlWithKey,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`Google API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`Mistral API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': provider.apiKey },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`Azure OpenAI API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}` },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`LMStudio API error: ${response.status} - ${detailedMessage}`);
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`Ollama API error: ${response.status} - ${detailedMessage}`);
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
        response = await requestUrl({
            url: url,
            method: 'POST',
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

        const responseText = response.text; // Read body as text first
        progressReporter.log(`[OpenRouter] Read response text (length: ${responseText.length}).`);
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after reading response text."); // Check again

        if (response.status < 200 || response.status >= 300) {
            progressReporter.log(`[OpenRouter] API Error Response Text: ${responseText}`); // Log error text
            throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
        }

        // Now attempt to parse the text as JSON
        let data;
        try {
            data = response.json;
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
        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
            body: JSON.stringify(requestBody)
        });
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API response.");
        if (response.status < 200 || response.status >= 300) {
            const detailedMessage = getErrorDetails(response.text);
            throw new Error(`xAI API error: ${response.status} - ${detailedMessage}`);
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
    switch (provider.name) {
        case 'DeepSeek':
            return callDeepSeekAPI(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'OpenAI':
            return callOpenAIApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'Anthropic':
            return callAnthropicApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'Google':
            return callGoogleApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'Mistral':
            return callMistralApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'Azure OpenAI':
            return callAzureOpenAIApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'LMStudio':
            return callLMStudioApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'Ollama':
            return callOllamaApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'OpenRouter':
            return callOpenRouterAPI(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        case 'xAI':
            return callXaiApi(provider, modelToUse, prompt, content, progressReporter, settings, signal);
        default:
            throw new Error(`Provider ${provider.name} not supported`);
    }
}
