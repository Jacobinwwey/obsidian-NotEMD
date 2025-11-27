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

// Lightweight semaphore
export class Semaphore {
    private queue: Array<() => void> = [];
    private active = 0;
    constructor(private concurrency: number) { }

    async acquire(): Promise<() => void> {
        return new Promise(resolve => {
            const release = () => {
                this.active--;
                const next = this.queue.shift();
                next?.();
            };
            if (this.active < this.concurrency) {
                this.active++;
                resolve(release);
            } else {
                this.queue.push(release);
            }
        });
    }
}

// Helper to introduce a delay *after* an async function call
export async function delayedExecution<T>(fn: () => Promise<T>, intervalMs: number): Promise<T> {
    const result = await fn();
    if (intervalMs > 0) {
        await delay(intervalMs); // Delay AFTER the call
    }
    return result;
}

// Concurrent Processor using a worker pattern
export function createConcurrentProcessor<T, R>(
    concurrency: number,
    apiCallIntervalMs: number,
    progressReporter: ProgressReporter
) {
    return function (tasks: (() => Promise<T>)[]) : Promise<R[]> {
        return new Promise((resolve, reject) => {
            const results: R[] = [];
            const taskQueue = [...tasks]; // Clone queue to manage tasks safely
            let workersActive = 0;
            let taskIndex = 0; // Track original index to maintain result order

            // The recursive worker function
            const processNextTask = async () => {
                // 1. Check Cancellation
                if (progressReporter.cancelled) {
                    // Check if we are the last active worker to shut down
                    if (workersActive === 0) resolve(results);
                    return;
                }

                // 2. Check Queue Exhaustion
                if (taskQueue.length === 0) {
                    if (workersActive === 0) resolve(results);
                    return;
                }

                // 3. Dequeue Next Task
                // Capture index immediately to ensure result order
                const currentTaskIndex = taskIndex++;
                const taskFn = taskQueue.shift();

                if (taskFn) {
                    workersActive++;
                    progressReporter.updateActiveTasks(1);

                    try {
                        // 4. Execute Task (Delay is handled by staggered start + post-task delay)
                        const result = await taskFn();
                        results[currentTaskIndex] = result as unknown as R;
                    } catch (error) {
                        results[currentTaskIndex] = { success: false, error: error } as unknown as R;
                        console.error("Error in concurrent task:", error);
                    } finally {
                        workersActive--;
                        progressReporter.updateActiveTasks(-1);

                        // 5. Chain Next Task with Interval
                        if (!progressReporter.cancelled) {
                             // Apply delay *after* a task finishes, before picking up the next.
                             // This maintains the rhythm established by the staggered start.
                             if (apiCallIntervalMs > 0 && taskQueue.length > 0) {
                                await delay(apiCallIntervalMs);
                             }
                             processNextTask();
                        } else {
                            // If cancelled during task, ensure we check for resolution
                            if (workersActive === 0) resolve(results);
                        }
                    }
                }
            };

            if (tasks.length === 0) {
                resolve([]);
                return;
            }

            // --- KEY FIX: Staggered Start ---
            // Start workers one by one, spaced out by the apiCallIntervalMs.
            // This prevents the "burst" effect at T=delay.
            const actualConcurrency = Math.min(concurrency, tasks.length);
            
            for (let i = 0; i < actualConcurrency; i++) {
                // Worker 0 starts immediately (0ms)
                // Worker 1 starts at 1 * interval ms
                // Worker 2 starts at 2 * interval ms
                const startDelay = i * apiCallIntervalMs;
                
                setTimeout(() => {
                    if (!progressReporter.cancelled) {
                        processNextTask();
                    }
                }, startDelay);
            }
        });
    };
}

// Chunk Array Helper
export function chunkArray<T>(arr: T[], size: number): T[][] {
    return arr.reduce((acc, _, i) => {
        if (i % size === 0) acc.push(arr.slice(i, i + size));
        return acc;
    }, [] as T[][]);
}

// Retry with Exponential Backoff Helper
export async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000, signal?: AbortSignal): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        if (signal?.aborted) throw new Error("Operation aborted during retry.");
        try {
            return await fn();
        } catch (e) {
            if (i === maxRetries - 1) throw e; // Re-throw last error
            await delay(delayMs * Math.pow(2, i)); // Exponential backoff
        }
    }
    throw new Error('Retry exhausted'); // Should not be reached
}
