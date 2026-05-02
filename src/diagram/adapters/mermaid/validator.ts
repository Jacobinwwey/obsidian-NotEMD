import mermaid from 'mermaid';
import { mermaidFence } from './base';

const MERMAID_FENCE_REGEX = /^(?:```|~~~)\s*mermaid\b[^\n]*\n([\s\S]*?)\n(?:```|~~~)\s*$/i;

function errorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return 'Unknown Mermaid parse error';
}

function sanitizeMermaidContent(definition: string): string {
    // Remove trailing whitespace from each line (common LLM output issue)
    let sanitized = definition.split('\n').map(line => line.trimEnd()).join('\n');

    // Fix ER diagram entity names with trailing spaces (common LLM quirk)
    // Pattern: entity names at the start of lines with trailing space before attributes
    sanitized = sanitized.replace(/^(\s+)([A-Z_][A-Z0-9_]*)\s+$/gm, '$1$2');

    // Fix ER diagram entity attribute indentation
    sanitized = sanitized.replace(/^( {4})([a-z][a-z0-9_]*)\s+([a-z][a-z0-9_]*\b)/gm, '$1$2 $3');

    return sanitized.trim();
}


export function normalizeMermaidDefinition(content: string): string {
    const normalizedContent = content.replace(/\r\n?/g, '\n');
    const trimmed = normalizedContent.trim();
    if (!trimmed) {
        return '';
    }

    const fencedMatch = trimmed.match(MERMAID_FENCE_REGEX);
    const raw = (fencedMatch ? fencedMatch[1] : trimmed).trim();
    return sanitizeMermaidContent(raw);
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
