import { DuckDuckGoProvider } from '../search/DuckDuckGoProvider';
import { NotemdSettings, ProgressReporter } from '../types';
import * as obsidian from 'obsidian';

// Mock obsidian
jest.mock('obsidian', () => ({
    requestUrl: jest.fn(),
    Notice: jest.fn(),
}));

describe('DuckDuckGo Logic Verification', () => {
    let provider: DuckDuckGoProvider;
    let mockReporter: ProgressReporter;
    let mockSettings: NotemdSettings;

    beforeEach(() => {
        provider = new DuckDuckGoProvider();
        mockReporter = {
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
            enableApiErrorDebugMode: true,
            ddgFetchTimeout: 15,
        } as unknown as NotemdSettings;
    });

    test('Regex parser correctly extracts data from realistic DDG HTML structure', async () => {
        // This simulates a standard HTML response from html.duckduckgo.com
        const realHtmlSnapshot = `
            <!DOCTYPE html>
            <html>
            <body>
                <div class="result result--html">
                    <div class="result__body">
                        <h2 class="result__title">
                            <a class="result__a" href="https://obsidian.md/">Obsidian - Sharpen your thinking</a>
                        </h2>
                        <a class="result__snippet" href="https://obsidian.md/">
                            Obsidian is the private and flexible writing app that adapts to the way you think.
                        </a>
                    </div>
                </div>
                
                <div class="result result--html">
                    <div class="result__body">
                        <h2 class="result__title">
                            <a class="result__a" href="https://en.wikipedia.org/wiki/Obsidian">Obsidian - Wikipedia</a>
                        </h2>
                        <a class="result__snippet" href="https://en.wikipedia.org/wiki/Obsidian">
                            Obsidian is a naturally occurring volcanic glass formed as an extrusive igneous rock.
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Mock the network response
        (obsidian.requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            text: realHtmlSnapshot,
        });

        // Run the search
        const results = await provider.search('Obsidian', mockSettings, mockReporter);

        // Verification
        console.log('Test parsed ' + results.length + ' results.');
        if (results.length > 0) {
            console.log('Result 1:', results[0]);
        }

        expect(results.length).toBe(2);
        
        // Check Result 1
        expect(results[0].title).toBe('Obsidian - Sharpen your thinking');
        expect(results[0].url).toBe('https://obsidian.md/');
        expect(results[0].content).toContain('Obsidian is the private');

        // Check Result 2
        expect(results[1].title).toBe('Obsidian - Wikipedia');
        expect(results[1].url).toBe('https://en.wikipedia.org/wiki/Obsidian');
    });
});
