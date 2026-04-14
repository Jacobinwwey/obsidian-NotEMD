import mermaid from 'mermaid';
import { mermaidFence } from './base';

const MERMAID_FENCE_REGEX = /^(?:```|~~~)\s*mermaid\b[^\n]*\n([\s\S]*?)\n(?:```|~~~)\s*$/i;

function errorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return 'Unknown Mermaid parse error';
}

export function normalizeMermaidDefinition(content: string): string {
    const normalizedContent = content.replace(/\r\n?/g, '\n');
    const trimmed = normalizedContent.trim();
    if (!trimmed) {
        return '';
    }

    const fencedMatch = trimmed.match(MERMAID_FENCE_REGEX);
    return (fencedMatch ? fencedMatch[1] : trimmed).trim();
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
