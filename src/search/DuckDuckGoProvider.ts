import { requestUrl } from 'obsidian';
import { NotemdSettings, ProgressReporter, SearchResult } from '../types';
import { SearchProvider } from './SearchProvider';
import { handleApiError } from '../llmUtils';

export class DuckDuckGoProvider implements SearchProvider {
    name = 'DuckDuckGo';

    async search(query: string, settings: NotemdSettings, progressReporter: ProgressReporter): Promise<SearchResult[]> {
        const maxResults = settings.ddgMaxResults;
        const encodedQuery = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
        const results: SearchResult[] = [];

        progressReporter.log(`Querying DuckDuckGo HTML endpoint: ${url}`);

        const response = await requestUrl({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            throw: false
        });

        if (response.status !== 200) {
            handleApiError('DuckDuckGo', response, progressReporter, settings.enableApiErrorDebugMode);
        }

        const htmlContent = response.text;
        progressReporter.log(`Received HTML response from DuckDuckGo (${htmlContent.length} bytes). Parsing...`);

        // Try DOMParser first if available (Browser environment)
        if (typeof DOMParser !== 'undefined') {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');
                const resultNodes = doc.querySelectorAll('.result');
                
                for (let i = 0; i < resultNodes.length && results.length < maxResults; i++) {
                    const node = resultNodes[i];
                    const linkAnchor = node.querySelector('a.result__a');
                    const snippetNode = node.querySelector('a.result__snippet');

                    if (linkAnchor && snippetNode) {
                        let link = linkAnchor.getAttribute('href');
                        const title = linkAnchor.textContent?.trim() || '';
                        const snippet = snippetNode.textContent?.trim() || '';

                        if (link && title) {
                            link = this.processLink(link, progressReporter);
                            if (link) {
                                results.push({ title, url: link, content: snippet });
                            }
                        }
                    }
                }
                
                if (results.length > 0) {
                    progressReporter.log(`Parsed ${results.length} results using DOMParser.`);
                    return results;
                }
            } catch (e) {
                progressReporter.log(`DOMParser failed, falling back to Regex. Error: ${e}`);
            }
        }

        // Fallback to Regex (Split-based for robustness)
        // Split by the start of a result block to isolate contexts
        const resultBlocks = htmlContent.split('<div class="result result--html"');
        
        // Skip the first split (header/pre-content)
        for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
            const block = resultBlocks[i];
            
            // Extract URL and Title
            // Match href="..." and >Title</a> inside result__a
            const linkMatch = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
            // Extract Snippet
            // Match >Snippet</a> inside result__snippet
            const snippetMatch = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(block);

            if (linkMatch && snippetMatch) {
                let link = linkMatch[1];
                const title = linkMatch[2].replace(/<[^>]+>/g, '').trim(); // Remove tags from title
                const snippet = snippetMatch[1].replace(/<[^>]+>/g, '').trim(); // Remove tags from snippet

                const processedLink = this.processLink(link, progressReporter);

                if (processedLink && title && snippet) {
                    results.push({ title, url: processedLink, content: snippet });
                }
            }
        }

        if (results.length === 0) {
            progressReporter.log("Warning: Could not parse any valid results from DuckDuckGo HTML.");
        } else {
            progressReporter.log(`Successfully parsed ${results.length} results from DuckDuckGo (Regex).`);
        }
        return results;
    }

    private processLink(link: string, progressReporter: ProgressReporter): string | null {
        try {
            if (link.startsWith('/l/?uddg=')) {
                const urlParams = new URLSearchParams(link.substring(3));
                const decodedLink = urlParams.get('uddg');
                if (decodedLink) {
                    return decodeURIComponent(decodedLink);
                } else {
                    progressReporter.log(`Warning: Could not decode DDG redirect URL: ${link}`);
                    return `https://duckduckgo.com${link}`;
                }
            } else if (!link.startsWith('http')) {
                const base = new URL('https://duckduckgo.com');
                return new URL(link, base).toString();
            }
            return link;
        } catch (e) {
            progressReporter.log(`Warning: Could not resolve URL: ${link}`);
            return null;
        }
    }
}
