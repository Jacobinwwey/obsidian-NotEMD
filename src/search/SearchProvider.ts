import { NotemdSettings, ProgressReporter, SearchResult } from '../types';

export interface SearchProvider {
    name: string;
    search(query: string, settings: NotemdSettings, progressReporter: ProgressReporter): Promise<SearchResult[]>;
}
