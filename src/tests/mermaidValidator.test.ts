import mermaid from 'mermaid';
import { normalizeMermaidDefinition, validateMermaidDefinition } from '../diagram/adapters/mermaid/validator';

jest.mock('mermaid');

describe('mermaid validator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('normalizes fenced mermaid blocks to plain parser input', () => {
        const definition = normalizeMermaidDefinition('```mermaid\nflowchart TD\nA-->B\n```');

        expect(definition).toBe('flowchart TD\nA-->B');
    });

    test('validates fenced mermaid and preserves fenced output', async () => {
        const result = await validateMermaidDefinition('```mermaid\nflowchart TD\nA-->B\n```');

        expect(result).toBe('```mermaid\nflowchart TD\nA-->B\n```');
        expect(mermaid.initialize).toHaveBeenCalledWith({ startOnLoad: false, suppressErrorRendering: true });
        expect(mermaid.parse).toHaveBeenCalledWith('flowchart TD\nA-->B');
    });

    test('wraps unfenced mermaid definitions before returning them', async () => {
        const result = await validateMermaidDefinition('sequenceDiagram\nAlice->>Bob: Ping');

        expect(result).toBe('```mermaid\nsequenceDiagram\nAlice->>Bob: Ping\n```');
        expect(mermaid.parse).toHaveBeenCalledWith('sequenceDiagram\nAlice->>Bob: Ping');
    });

    test('normalizes windows line endings before validation', async () => {
        const result = await validateMermaidDefinition('```mermaid\r\nflowchart TD\r\nA-->B\r\n```');

        expect(result).toBe('```mermaid\nflowchart TD\nA-->B\n```');
        expect(mermaid.parse).toHaveBeenCalledWith('flowchart TD\nA-->B');
    });

    test('throws explicit validation errors when mermaid parse fails', async () => {
        (mermaid.parse as jest.Mock).mockRejectedValueOnce(new Error('Parse error'));

        await expect(validateMermaidDefinition('flowchart TD\nA-->')).rejects.toThrow(
            'Generated Mermaid diagram failed validation: Parse error'
        );
    });
});
