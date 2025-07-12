import { Notice } from 'obsidian';
import { NotemdSettings, LLMProviderConfig, ProgressReporter } from './types';

/**
 * Helper function for delays.
 * @param ms Milliseconds to delay.
 * @returns A promise that resolves after the delay.
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Splits content into chunks based on word count.
 * @param content The string content to split.
 * @param settings The plugin settings containing chunkWordCount.
 * @returns An array of content chunks.
 */
export function splitContent(content: string, settings: NotemdSettings): string[] {
    const maxWords = settings.chunkWordCount;
    const paragraphs = content.split(/(\n\s*\n)/);
    const chunks: string[] = [];
    let currentChunkParts: string[] = [];
    let currentWordCount = 0;

    const countWords = (text: string): number => {
        return text.trim().split(/\s+/).filter(Boolean).length;
    };

    for (let i = 0; i < paragraphs.length; i++) {
        const part = paragraphs[i];
        const partWordCount = countWords(part);

        if (currentWordCount + partWordCount > maxWords && currentChunkParts.length > 0) {
            chunks.push(currentChunkParts.join('').trim());
            currentChunkParts = (part.trim() === '') ? [] : [part];
            currentWordCount = (part.trim() === '') ? 0 : partWordCount;
        } else {
            currentChunkParts.push(part);
            currentWordCount += partWordCount;
        }
    }

    if (currentChunkParts.length > 0) {
        const lastChunk = currentChunkParts.join('').trim();
        if (lastChunk) {
            chunks.push(lastChunk);
        }
    }
    return chunks;
}

/**
 * Normalizes a concept name for use as a file path.
 * @param name The concept name to normalize.
 * @returns A normalized string suitable for file paths.
 */
export function normalizeNameForFilePath(name: string): string {
    let normalized = name;
    normalized = normalized.replace(/[-_]/g, ' ');
    normalized = normalized.replace(/[\\/:*?"<>|#^[\]]/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
}

/**
 * Estimates the number of tokens in a string.
 * @param text The string to estimate tokens for.
 * @returns An estimated token count.
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Simple approximation: 1 token ~ 4 characters
    return Math.ceil(text.length / 4);
}

/**
 * Creates a promise that resolves after a specified delay but rejects immediately
 * if the progressReporter signals cancellation during the delay.
 * @param ms Delay in milliseconds.
 * @param progressReporter The reporter to check for cancellation.
 * @returns A promise that resolves on completion or rejects on cancellation.
 */
export function cancellableDelay(ms: number, progressReporter: ProgressReporter): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            resolve();
        }, ms);

        const intervalId = setInterval(() => {
            if (progressReporter.cancelled) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                reject(new Error("Processing cancelled by user during API retry wait."));
            }
        }, 100); // Check frequently
    });
}

/**
 * Gets the appropriate LLM provider configuration for a specific task.
 * @param taskType The type of task.
 * @param settings The current plugin settings.
 * @returns The LLMProviderConfig or undefined if no valid provider is found.
 */
export function getProviderForTask(taskType: 'addLinks' | 'research' | 'generateTitle' | 'translate', settings: NotemdSettings): LLMProviderConfig | undefined {
    let providerName: string;
    if (settings.useMultiModelSettings) {
        switch (taskType) {
            case 'addLinks': providerName = settings.addLinksProvider; break;
            case 'research': providerName = settings.researchProvider; break;
            case 'generateTitle': providerName = settings.generateTitleProvider; break;
            case 'translate': providerName = settings.translateProvider; break;
            default:
                console.warn(`Unknown task type '${taskType}' in getProviderForTask. Falling back to active provider.`);
                providerName = settings.activeProvider;
        }
    } else {
        providerName = settings.activeProvider;
    }

    const provider = settings.providers.find(p => p.name === providerName);

    if (!provider) {
        const errorMsg = `Provider configuration not found for name: '${providerName}' (Task: ${taskType}).`;
        console.error(errorMsg);
        const fallbackProvider = settings.providers.find(p => p.name === settings.activeProvider);
        if (fallbackProvider && providerName !== settings.activeProvider) {
            new Notice(`${errorMsg} Falling back to active provider '${settings.activeProvider}'.`);
            return fallbackProvider;
        } else {
            new Notice(`${errorMsg} Active provider '${settings.activeProvider}' also not found.`);
            return undefined;
        }
    }
    return provider;
}

/**
 * Gets the appropriate model name for a specific task.
 * @param taskType The type of task.
 * @param provider The LLMProviderConfig determined for this task.
 * @param settings The current plugin settings.
 * @returns The model name string to use.
 */
export function getModelForTask(taskType: 'addLinks' | 'research' | 'generateTitle' | 'translate', provider: LLMProviderConfig, settings: NotemdSettings): string {
    let modelName: string | undefined | null = provider.model;

    if (settings.useMultiModelSettings) {
        switch (taskType) {
            case 'addLinks': modelName = settings.addLinksModel?.trim() || provider.model; break;
            case 'research': modelName = settings.researchModel?.trim() || provider.model; break;
            case 'generateTitle': modelName = settings.generateTitleModel?.trim() || provider.model; break;
            case 'translate': modelName = settings.translateModel?.trim() || provider.model; break;
            default:
                console.warn(`Unknown task type '${taskType}' in getModelForTask. Using provider default.`);
                modelName = provider.model;
        }
    } else {
        modelName = provider.model;
    }

    return modelName || provider.model; // Ensure valid string
}
