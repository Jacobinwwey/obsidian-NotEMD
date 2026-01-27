import { NotemdSettings } from '../types';
import { SearchProvider } from './SearchProvider';
import { DuckDuckGoProvider } from './DuckDuckGoProvider';
import { TavilyProvider } from './TavilyProvider';

export class SearchManager {
    static getProvider(settings: NotemdSettings): SearchProvider {
        if (settings.searchProvider === 'tavily') {
            return new TavilyProvider();
        } else {
            return new DuckDuckGoProvider();
        }
    }
}
