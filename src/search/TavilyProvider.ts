import { requestUrl } from 'obsidian';
import { NotemdSettings, ProgressReporter, SearchResult, TavilySearchResult } from '../types';
import { SearchProvider } from './SearchProvider';
import { handleApiError } from '../llmUtils';

export class TavilyProvider implements SearchProvider {
    name = 'Tavily';

    async search(query: string, settings: NotemdSettings, progressReporter: ProgressReporter): Promise<SearchResult[]> {
        if (!settings.tavilyApiKey) {
            throw new Error('Tavily API key is not configured.');
        }

        const tavilyUrl = 'https://api.tavily.com/search';
        progressReporter.log(`Searching Tavily for: "${query}"`);

        const tavilyRequestBody = {
            api_key: settings.tavilyApiKey,
            query: query,
            search_depth: settings.tavilySearchDepth,
            include_answer: false,
            include_raw_content: false,
            max_results: settings.tavilyMaxResults
        };

        const tavilyTimeout = settings.ddgFetchTimeout * 1000;
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Tavily API request timed out after ${tavilyTimeout / 1000}s`)), tavilyTimeout)
        );

        const response = await Promise.race([
            requestUrl({ 
                url: tavilyUrl, 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(tavilyRequestBody), 
                throw: false 
            }),
            timeoutPromise
        ]);

        if (!response || typeof response.status !== 'number') {
            throw new Error("Tavily request failed or timed out.");
        }

        if (response.status !== 200) {
            handleApiError('Tavily', response, progressReporter, settings.enableApiErrorDebugMode);
        }

        const tavilyData = response.json;
        if (!tavilyData.results || tavilyData.results.length === 0) {
            progressReporter.log('Tavily returned no results.');
            return [];
        }

        const results: SearchResult[] = tavilyData.results.map((r: TavilySearchResult) => ({
            title: r.title,
            url: r.url,
            content: r.content
        }));

        progressReporter.log(`Fetched ${results.length} results from Tavily.`);
        return results;
    }
}
