import { refineMermaidBlocks, deepDebugMermaid, applyDeepDebugToMermaidBlocks } from '../mermaidProcessor';

describe('Table Corruption Reproduction', () => {
    const tableContent = `
| Component | Specification | Typical Value & Unit | Significance |
| : --- | :--- | : --- | : --- |
| Some Item | Some Spec | 100 kg | High |
`;

    const tripleBacktick = '```';

    test('deepDebugMermaid should NOT corrupt markdown tables due to safeguard', () => {
        // deepDebugMermaid now has internal safeguards for lines with :-- :
        const result = deepDebugMermaid(tableContent);
        
        // We expect it to REMAIN UNCHANGED
        expect(result).toBe(tableContent);
        expect(result).not.toContain('| : -- "- |');
    });

    test('applyDeepDebugToMermaidBlocks should not corrupt markdown tables outside mermaid blocks', () => {
        const content = `
# Title

Some text.

${tableContent}

${tripleBacktick}mermaid
graph TD
A --> B
${tripleBacktick}
`;
        const result = applyDeepDebugToMermaidBlocks(content);
        
        // Table should be intact
        expect(result).toContain('| : --- |'); 
        expect(result).not.toContain('| : -- "- |');
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
