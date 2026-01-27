import { DuckDuckGoProvider } from '../search/DuckDuckGoProvider';
import { TavilyProvider } from '../search/TavilyProvider';
import { NotemdSettings, ProgressReporter } from '../types';
import * as obsidian from 'obsidian';

// Mock obsidian requestUrl
jest.mock('obsidian', () => ({
    requestUrl: jest.fn(),
    Notice: jest.fn(),
}));

describe('Search Providers', () => {
    let mockProgressReporter: ProgressReporter;
    let mockSettings: NotemdSettings;

    beforeEach(() => {
        mockProgressReporter = {
            log: jest.fn(),
            updateStatus: jest.fn(),
            requestCancel: jest.fn(),
            clearDisplay: jest.fn(),
            cancelled: false,
            activeTasks: 0,
            updateActiveTasks: jest.fn(),
        };

        mockSettings = {
            ddgMaxResults: 5,
            enableApiErrorDebugMode: false,
            tavilyApiKey: 'test-key',
            tavilyMaxResults: 5,
            tavilySearchDepth: 'basic',
            ddgFetchTimeout: 10,
        } as unknown as NotemdSettings;
    });

    describe('DuckDuckGoProvider', () => {
        it('should parse results using Regex when DOMParser is unavailable', async () => {
            const provider = new DuckDuckGoProvider();
            const htmlContent = `
                <div class="result result--html">
                    <a class="result__a" href="https://example.com">Example Title</a>
                    <a class="result__snippet">Example Snippet</a>
                </div>
            `;

            (obsidian.requestUrl as jest.Mock).mockResolvedValue({
                status: 200,
                text: htmlContent,
            });

            const results = await provider.search('query', mockSettings, mockProgressReporter);

            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Example Title');
            expect(results[0].url).toBe('https://example.com');
            expect(results[0].content).toBe('Example Snippet');
        });

        it('should handle relative URLs correctly', async () => {
            const provider = new DuckDuckGoProvider();
            const htmlContent = `
                <div class="result result--html">
                    <a class="result__a" href="/relative/path">Relative Title</a>
                    <a class="result__snippet">Relative Snippet</a>
                </div>
            `;

            (obsidian.requestUrl as jest.Mock).mockResolvedValue({
                status: 200,
                text: htmlContent,
            });

            const results = await provider.search('query', mockSettings, mockProgressReporter);

            expect(results.length).toBe(1);
            expect(results[0].url).toBe('https://duckduckgo.com/relative/path');
        });

        it('should handle DDG redirect URLs', async () => {
             const provider = new DuckDuckGoProvider();
             const targetUrl = encodeURIComponent('https://target.com');
             const htmlContent = `
                 <div class="result result--html">
                     <a class="result__a" href="/l/?uddg=${targetUrl}">Redirect Title</a>
                     <a class="result__snippet">Redirect Snippet</a>
                 </div>
             `;
 
             (obsidian.requestUrl as jest.Mock).mockResolvedValue({
                 status: 200,
                 text: htmlContent,
             });
 
             const results = await provider.search('query', mockSettings, mockProgressReporter);
 
             expect(results.length).toBe(1);
             expect(results[0].url).toBe('https://target.com');
        });
    });

    describe('TavilyProvider', () => {
        it('should return results from API', async () => {
            const provider = new TavilyProvider();
            const mockResponse = {
                status: 200,
                json: {
                    results: [
                        { title: 'Tavily Title', url: 'https://tavily.com', content: 'Tavily Content' }
                    ]
                }
            };

            (obsidian.requestUrl as jest.Mock).mockResolvedValue(mockResponse);

            const results = await provider.search('query', mockSettings, mockProgressReporter);

            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Tavily Title');
        });
    });
});
