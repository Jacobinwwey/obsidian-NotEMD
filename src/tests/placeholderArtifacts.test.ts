import { deepDebugMermaid } from '../mermaidProcessor';

describe('Cleanup Placeholder Artifacts', () => {
    test('should remove ___BRACKET_BLOCK_0___ artifacts', () => {
        const input = 'graph TD\nA --> B___BRACKET_BLOCK_0___;';
        const expected = 'graph TD\nA --> B;';
        // deepDebugMermaid might apply other fixes too, but here input is simple.
        // It does trimming or splitting? No, it joins with \n.
        // Let's verify exact output.
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('should remove multiple artifacts with different indices', () => {
        const input = 'A___BRACKET_BLOCK_1___ --> B___BRACKET_BLOCK_25___;';
        const expected = 'A --> B;';
        expect(deepDebugMermaid(input)).toBe(expected);
    });
});
