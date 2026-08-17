import mermaid from 'mermaid';
import { mermaidFence } from './base';
import { normalizeMermaidDefinition } from './normalize';

export { normalizeMermaidDefinition } from './normalize';

function errorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return 'Unknown Mermaid parse error';
}

export async function validateMermaidDefinition(content: string): Promise<string> {
    const definition = normalizeMermaidDefinition(content);
    if (!definition) {
        throw new Error('Generated Mermaid diagram failed validation: empty definition');
    }

    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });

    try {
        await mermaid.parse(definition);
    } catch (error) {
        throw new Error(`Generated Mermaid diagram failed validation: ${errorMessage(error)}`);
    }

    return mermaidFence(definition.split('\n'));
}
