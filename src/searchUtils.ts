import { App, requestUrl, Notice, Editor, MarkdownView } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { estimateTokens, getProviderForTask, getModelForTask } from './utils';
import { callDeepSeekAPI, callOpenAIApi, callAnthropicApi, callGoogleApi, callMistralApi, callAzureOpenAIApi, callLMStudioApi, callOllamaApi, callOpenRouterAPI, getDebugInfo } from './llmUtils';
import { cleanupLatexDelimiters, refineMermaidBlocks } from './mermaidProcessor';
import { ErrorModal } from './ui/ErrorModal';
import { getSystemPrompt } from './promptUtils';
import { SearchManager } from './search/SearchManager';

/**
 * Fetches content from a URL and extracts basic text.
 * @param url The URL to fetch.
 * @param progressReporter For logging.
 * @param debugMode Whether to log detailed debug info on error.
 * @returns A promise resolving to the extracted text content or an error message string.
 */
export async function fetchContentFromUrl(url: string, progressReporter: ProgressReporter, debugMode = false): Promise<string> {
    progressReporter.log(`Fetching content from: ${url}`);
    try {
        const response = await requestUrl({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            throw: false
        });

        if (response.status !== 200) {
            if (debugMode) {
                progressReporter.log(`[DEBUG] Fetch Error Response from ${url}: Status ${response.status}, Body: ${response.text}`);
            }
            throw new Error(`Fetch failed with status ${response.status}`);
        }

        const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
        if (!contentType.includes('text/html')) {
            progressReporter.log(`Skipping non-HTML content (${contentType}) from: ${url}`);
            return `[Content skipped: Not HTML - ${contentType}]`;
        }

        const htmlContent = response.text;
        let text = htmlContent
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        text = text.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&').replace(/"/g, '"').replace(/'/g, "'").replace(/&nbsp;/g, ' ');

        const maxLength = 15000;
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + "... [content truncated]";
            progressReporter.log(`Truncated content from: ${url}`);
        }

        progressReporter.log(`Successfully fetched and extracted text from: ${url}`);
        return text;

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        progressReporter.log(`Error fetching content from ${url}: ${message}`);
        
        if (debugMode) {
            const debugInfo = getDebugInfo(error);
            if (debugInfo) {
                 progressReporter.log(`[DEBUG] Fetch Error Details:\n${debugInfo}`);
            }
        }

        return `[Content skipped: Error fetching - ${message}]`;
    }
}


/**
 * Helper function to perform web research (Tavily or DDG) and return combined context.
 * @param app Obsidian App instance (needed for requestUrl).
 * @param settings Plugin settings.
 * @param topic The topic to research.
 * @param progressReporter For logging progress/errors.
 * @returns A promise resolving to the combined research context string, or null if research fails/yields no results.
 */
export async function _performResearch(app: App, settings: NotemdSettings, topic: string, progressReporter: ProgressReporter): Promise<string | null> {
    progressReporter.log(`Entering _performResearch for topic: "${topic}"`);
    const searchQuery = `${topic} wiki`;
    let combinedContent = '';
    
    try {
        const provider = SearchManager.getProvider(settings);
        const searchSource = provider.name;
        progressReporter.log(`Selected search provider: ${searchSource}.`);

        if (progressReporter.cancelled) throw new Error(`Processing cancelled by user before ${searchSource} search.`);

        progressReporter.log(`Searching ${searchSource} for: "${searchQuery}"`);
        progressReporter.updateStatus(`Searching ${searchSource}...`, 10);

        const searchResults = await provider.search(searchQuery, settings, progressReporter);

        if (progressReporter.cancelled) throw new Error(`Processing cancelled by user during ${searchSource} search.`);
        
        if (!searchResults || searchResults.length === 0) {
             progressReporter.log(`${searchSource} search failed or returned no results.`); 
             return null; 
        }

        let fetchedContents: string[] = [];
        
        // DuckDuckGo results are snippets, so we fetch full content.
        // Tavily results (in current config) are snippets/summaries which we use directly.
        if (searchSource === 'DuckDuckGo') {
            progressReporter.log(`Fetching content for top ${searchResults.length} DuckDuckGo results...`);
            progressReporter.updateStatus('Fetching content...', 30);
            const fetchPromises = searchResults.map(async (result, index) => {
                if (progressReporter.cancelled) throw new Error(`Processing cancelled by user before fetching DDG result ${index + 1}.`);
                const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${result.url}`)), settings.ddgFetchTimeout * 1000));
                try {
                    return await Promise.race([fetchContentFromUrl(result.url, progressReporter, settings.enableApiErrorDebugMode), timeoutPromise]);
                } catch (fetchError: unknown) {
                    const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
                    if (message.includes("cancelled by user")) throw fetchError;
                    return `[Content skipped: Timeout or fetch error for ${result.url}]`;
                }
            });
            const settledResults = await Promise.allSettled(fetchPromises);
            if (progressReporter.cancelled) throw new Error("Processing cancelled by user during DuckDuckGo content fetching.");

            fetchedContents = settledResults.map((result, index) => {
                if (result.status === 'fulfilled') { return result.value; }
                else {
                    if (result.reason?.message?.includes("cancelled by user")) { throw new Error("Processing cancelled by user during DuckDuckGo content fetching."); }
                    return `[Content skipped for ${searchResults[index].url} due to error: ${result.reason?.message}]`;
                }
            });
            progressReporter.log(`Finished fetching content for DuckDuckGo results.`);
        } else { // Tavily
            progressReporter.log(`Using snippets directly from Tavily results.`);
            fetchedContents = searchResults.map(result => result.content);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user before combining content.");

        if (fetchedContents.length > 0) {
            progressReporter.log(`Combining ${fetchedContents.length} fetched/snippet contents.`);
            combinedContent = `Research context for "${searchQuery}" (via ${searchSource}):\n\n`;
            searchResults.forEach((result, index) => {
                combinedContent += `Result ${index + 1}:\n`;
                combinedContent += `Title: ${result.title}\n`;
                combinedContent += `URL: ${result.url}\n`;
                combinedContent += `${searchSource === 'Tavily' ? 'Snippet' : 'Content'}: ${fetchedContents[index] ? fetchedContents[index] : '[No content available]'}\n\n`;
            });

            const estimatedTokensCount = estimateTokens(combinedContent);
            const maxTokens = settings.maxResearchContentTokens;
            progressReporter.log(`Estimated research context tokens: ${estimatedTokensCount}. Limit: ${maxTokens}`);
            if (estimatedTokensCount > maxTokens) {
                const maxChars = maxTokens * 4; // Approximation
                combinedContent = combinedContent.substring(0, maxChars) + "\n\n[...research context truncated due to token limit]";
                progressReporter.log(`Truncated research context to ~${maxTokens} tokens.`);
            }
            return combinedContent.trim();
        } else {
            progressReporter.log('No content could be obtained from search results.');
            return null;
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("cancelled by user")) {
            progressReporter.log(`Research cancelled for "${topic}".`);
            throw error; // Re-throw cancellation
        } else {
            progressReporter.log(`Error in _performResearch catch block for "${topic}": ${message}`);
            console.error(`Error researching "${topic}":`, error);
            return null; // Return null on non-cancellation errors
        }
    }
}



/**
 * Performs web research on a topic (note title or selection) and appends a summary to the editor.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param editor The active editor instance.
 * @param view The active MarkdownView instance.
 * @param progressReporter Interface for reporting progress.
 */
export async function researchAndSummarize(app: App, settings: NotemdSettings, editor: Editor, view: MarkdownView, progressReporter: ProgressReporter): Promise<void> {
    progressReporter.log(`Entering researchAndSummarize function.`);
    const activeFile = view.file;
    if (!activeFile) {
        // This case should ideally be handled by the caller (command/sidebar)
        progressReporter.log("Error: No active file found in researchAndSummarize.");
        return;
    }

    const selectedText = editor.getSelection();
    const topic = selectedText ? selectedText.trim() : activeFile.basename;

    if (!topic || topic.trim() === '') {
        new Notice('Please select the topic text in the editor first, or ensure the note has a title.');
        progressReporter.log("Exiting researchAndSummarize: Topic is empty.");
        progressReporter.updateStatus("No topic selected", -1); // Indicate error state
        return;
    }

    progressReporter.log(`Starting research for topic: "${topic}"`);
    // Note: Status bar updates should be handled by the caller (plugin main class)

    try {
        // --- Perform Research using Helper ---
        progressReporter.log(`Calling _performResearch for topic: "${topic}"`);
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user before research.");
        const researchContext = await _performResearch(app, settings, topic, progressReporter);

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user during research.");

        if (!researchContext) {
            new Notice(`Research for "${topic}" failed or returned no results. Summary not generated.`);
            progressReporter.log(`_performResearch returned null or empty context for "${topic}".`);
            progressReporter.updateStatus('Research failed/No results', -1);
            // Note: Closing modal/reporter handled by caller
            return; // Exit here as no context means no summary
        }
        progressReporter.log(`_performResearch returned context for "${topic}" (length: ${researchContext.length}).`);

        // --- Summarize Research Context ---
        progressReporter.updateStatus('Summarizing research...', 50);

        const provider = getProviderForTask('research', settings);
        if (!provider) {
            progressReporter.log("Error: Could not get provider for 'research' task.");
            throw new Error('No valid LLM provider configured for the "Research & Summarize" task.');
        }
        const modelName = getModelForTask('research', provider, settings);
        progressReporter.log(`Using provider "${provider.name}" and model "${modelName}" for summarization.`);

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user before summarization.");

        progressReporter.log(`Calling ${provider.name} (Model: ${modelName}) for summarization...`);

        const language = settings.useDifferentLanguagesForTasks ? settings.researchSummarizeLanguage : settings.language;

        const finalPrompt = getSystemPrompt(settings, 'researchSummarize', {
            TOPIC: topic,
            LANGUAGE: language,
            SEARCH_RESULTS_CONTEXT: researchContext
        });

        progressReporter.log(`Constructed summary prompt (context length: ${researchContext.length}).`);

        let summary = '';
        switch (provider.name) {
            case 'DeepSeek': summary = await callDeepSeekAPI(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'OpenAI': summary = await callOpenAIApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'Anthropic': summary = await callAnthropicApi(provider, modelName, '', finalPrompt, progressReporter, settings); break; // Prompt in content
            case 'Google': summary = await callGoogleApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'Mistral': summary = await callMistralApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'Azure OpenAI': summary = await callAzureOpenAIApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'LMStudio': summary = await callLMStudioApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'Ollama': summary = await callOllamaApi(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            case 'OpenRouter': summary = await callOpenRouterAPI(provider, modelName, finalPrompt, '', progressReporter, settings); break;
            default: throw new Error(`Unsupported provider for summarization: ${provider.name}`);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after summarization.");

        progressReporter.log(`Generated summary using ${provider.name}.`);
        progressReporter.updateStatus('Applying post-processing...', 85); // Adjusted percentage

        // Apply post-processing
        let finalSummary = summary;
        try {
            finalSummary = cleanupLatexDelimiters(finalSummary);
            if (progressReporter.cancelled) throw new Error("Processing cancelled by user during post-processing.");
            finalSummary = await refineMermaidBlocks(finalSummary);
            progressReporter.log(`Mermaid/LaTeX cleanup applied to summary.`);
        } catch (cleanupError: unknown) {
            const message = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            if (message.includes("cancelled by user")) throw cleanupError;
            progressReporter.log(`Warning: Error during summary cleanup: ${message}`);
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user after post-processing.");

        // Remove \boxed{ wrapper from summary
        let summaryToAppend = finalSummary.trim();
        const summaryLines = summaryToAppend.split('\n');
        if (summaryLines.length > 0 && summaryLines[0].trim() === '\\boxed{') {
            progressReporter.log(`Removing '\\boxed{' wrapper from summary.`);
            summaryLines.shift();
            if (summaryLines.length > 0 && summaryLines[summaryLines.length - 1].trim() === '}') {
                summaryLines.pop();
            }
            summaryToAppend = summaryLines.join('\n');
        }

        if (progressReporter.cancelled) throw new Error("Processing cancelled by user before appending summary.");

        // --- Append Summary to Note ---
        progressReporter.updateStatus('Appending summary...', 90);
        const searchSource = settings.searchProvider === 'tavily' ? 'Tavily' : 'DuckDuckGo';
        const summaryHeader = `\n\n## Research Summary (via ${searchSource}): ${topic}\n\n`;
        editor.replaceSelection(selectedText); // Clear selection if it was used
        const currentContent = editor.getValue();
        editor.setValue(currentContent.trim() + summaryHeader + summaryToAppend); // Use cleaned summary

        progressReporter.updateStatus('Research and summary complete!', 100);
        new Notice(`Research summary for "${topic}" appended.`);
        progressReporter.log(`Research summary for "${topic}" appended successfully.`);
        // Note: Closing modal/reporter handled by caller

    } catch (error: unknown) {
        // Error handling is now primarily done here, propagating cancellation
        const message = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack || message : String(error);
        if (message.includes("cancelled by user")) {
            progressReporter.log(`Research cancelled for "${topic}".`);
            progressReporter.updateStatus('Cancelled', -1);
            // Re-throw cancellation so the caller (command/sidebar) knows
            throw error; // Re-throw cancellation
        } else {
            // Log other errors
            console.error(`Error researching "${topic}":`, errorDetails);
            new Notice(`Error during research: ${message}. See console.`, 10000);
            progressReporter.log(`Error in researchAndSummarize catch block: ${message}`);
            progressReporter.updateStatus('Error occurred', -1);
            new ErrorModal(app, "Research Error", errorDetails).open();
            // Do not re-throw non-cancellation errors here, let the function finish "unsuccessfully"
        }
    }
}
