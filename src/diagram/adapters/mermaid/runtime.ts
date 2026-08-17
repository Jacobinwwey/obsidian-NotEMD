import mermaid from 'mermaid';

const VALIDATION_CONFIG = {
    startOnLoad: false,
    suppressErrorRendering: true
} as const;

let initializedWith: typeof mermaid.initialize | null = null;

/**
 * Mermaid validation configuration is process-global. Reinitializing it for every parse
 * can reset configuration owned by another consumer, so bind it once per runtime function.
 */
export function ensureMermaidInitialized(): void {
    const initialize = mermaid.initialize;
    if (initializedWith === initialize) {
        return;
    }

    initialize(VALIDATION_CONFIG);
    initializedWith = initialize;
}
