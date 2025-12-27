import { refineMermaidBlocks, cleanupLatexDelimiters } from '../mermaidProcessor';

describe('Mermaid Processor Tests', () => {

    // --- refineMermaidBlocks Tests ---

    test('should add closing ``` for unclosed mermaid block after arrow', async () => {
        const content = "Some text\n```mermaid\ngraph TD;\nA --> B;\nSome other text";
        const expected = "Some text\n```mermaid\ngraph TD;\nA --> B;\n```\nSome other text";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(expected);
    });

    test('should not add closing ``` if already closed', async () => {
        const content = "Some text\n```mermaid\ngraph TD;\nA --> B;\n```\nSome other text";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(content);
    });

    test('should handle multiple mermaid blocks', async () => {
        const content = "Block 1:\n```mermaid\ngraph TD;\nA --> B;\n\nBlock 2:\n```mermaid\ngraph LR;\nC --> D\n```\nEnd";
        const expected = "Block 1:\n```mermaid\ngraph TD;\nA --> B;\n```\n\nBlock 2:\n```mermaid\ngraph LR;\nC --> D\n```\nEnd";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(expected);
    });

     test('should handle mermaid block at end of file', async () => {
        const content = "Start\n```mermaid\ngraph TD;\nA --> B;";
        const expected = "Start\n```mermaid\ngraph TD;\nA --> B;\n```";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(expected);
    });

    test('should handle empty mermaid block', async () => {
        const content = "```mermaid\n```";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(content);
    });

     test('should handle mermaid block with no arrows', async () => {
        const content = "```mermaid\ngraph TD;\nA[Test];\n```";
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(content);
    });

    test('should handle unclosed mermaid block with no arrows', async () => {
        const content = "```mermaid\ngraph TD;\nA[Test];";
        const expected = "```mermaid\n```\ngraph TD;\nA[Test];"; // Defensive closing after start
        const result = await refineMermaidBlocks(content);
        expect(result).toBe(expected);
    });


    // --- cleanupLatexDelimiters Tests ---

    test('should convert \\( \\) to $', () => {
        const content = "This is inline math \\( a = b \\).";
        const expected = "This is inline math $a = b$.";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

    test('should remove \\$', () => {
        const content = "This costs \\$10.";
        const expected = "This costs $10.";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

    test('should remove spaces around single $', () => {
        const content = "Value is $ 10 $ dollars.";
        const expected = "Value is $10$ dollars.";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

     test('should handle multiple spaces around single $', () => {
        const content = "Value is $   10   $ dollars.";
        const expected = "Value is $10$ dollars.";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

    test('should not remove spaces around $$', () => {
        const content = "Display math $$ a = b $$";
        expect(cleanupLatexDelimiters(content)).toBe(content);
    });

    test('should handle mixed delimiters', () => {
        const content = "Inline \\( x \\) and escaped \\$5. Price is $ 10 $. Display $$ y = z $$";
        const expected = "Inline $x$ and escaped $5. Price is $10$. Display $$ y = z $$";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

     test('should handle delimiters at start/end of line', () => {
        const content = "\\( a \\)\n$ b $\n\\$10";
        const expected = "$a$\n$b$\n$10";
        expect(cleanupLatexDelimiters(content)).toBe(expected);
    });

});
