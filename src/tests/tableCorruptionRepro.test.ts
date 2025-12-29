import { refineMermaidBlocks, deepDebugMermaid } from '../mermaidProcessor';

describe('Table Corruption Reproduction', () => {
    const tableContent = `
| Component | Specification | Typical Value & Unit | Significance |
| : --- | :--- | : --- | : --- |
| Some Item | Some Spec | 100 kg | High |
`;

    const tripleBacktick = '```';

    test('deepDebugMermaid should corrupt markdown tables (expected behavior for unsafe input)', () => {
        // deepDebugMermaid applies global regexes.
        const result = deepDebugMermaid(tableContent);
        
        // The reported corruption: | : --- | becomes | : -- "- |
        // We expect it to change (corrupt) because deepDebugMermaid is not context-aware on its own.
        // The fix is in refineMermaidBlocks not calling it on non-mermaid content.
        expect(result).not.toBe(tableContent);
        expect(result).toContain('| : -- "- |');
    });

    test('refineMermaidBlocks should not corrupt markdown tables outside mermaid blocks', async () => {
        const content = `
# Title

Some text.

${tableContent}

${tripleBacktick}mermaid
graph TD
A --> B
${tripleBacktick}
`;
        // refineMermaidBlocks calls deepDebugMermaid if errors are found.
        
        const contentWithError = `
# Title

${tableContent}

${tripleBacktick}mermaid
graph TD
A --> B; syntax error here
${tripleBacktick}
`;
        const result = await refineMermaidBlocks(contentWithError);
        
        // console.log("Input Table Content:\n" + JSON.stringify(tableContent));
        // console.log("Result Content:\n" + JSON.stringify(result));

        // We expect the table to remain intact (not corrupted)
        // Check for the specific corruption pattern
        expect(result).not.toContain('| : -- "- |');
        
        // Check that the table header exists
        expect(result).toContain('| Component | Specification | Typical Value & Unit | Significance |');

        // Check that the table row exists (allowing for whitespace differences)
        // The table row | : --- | ... might have variable spaces
        expect(result).toMatch(/\|\s*:\s*---\s*\|\s*:\s*-+\s*\|\s*:\s*-+\s*\|\s*:\s*-+\s*\|/);
    });
});
