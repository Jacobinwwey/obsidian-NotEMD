import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid New Fixes', () => {
    
    test('Should fix quoted labels after semicolon (Issue 1)', () => {
        const input = 'Levy --> Stationary; "Increments are stationary"';
        const expected = 'Levy -- "Increments are stationary" --> Stationary;';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should fix nested quotes inside node labels (Issue 2)', () => {
        const input = 'SP --> Martingale["Martingale<br>E["Future | Past"] = Present"];';
        const expected = 'SP --> Martingale["Martingale<br>E[Future | Past] = Present"];';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should fix nested quotes with multiple levels', () => {
        const input = 'Node["Outer ["Inner"] Outer"]';
        const expected = 'Node["Outer [Inner] Outer"]';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should not affect valid simple labels', () => {
        const input = 'A["Simple"] --> B["Label"];';
        expect(deepDebugMermaid(input)).toBe(input);
    });

    test('Should handle multiple fixes in one block', () => {
        const input = `
Levy --> Stationary; "Increments are stationary"
SP --> Martingale["Martingale<br>E["Future | Past"] = Present"];
        `.trim();
        
        const expected = `
Levy -- "Increments are stationary" --> Stationary;
SP --> Martingale["Martingale<br>E[Future | Past] = Present"];
        `.trim();

        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should handle unbalanced brackets gracefully (ignore)', () => {
        // If closing bracket is missing, it should leave it alone or handle best effort
        // Our logic scans for matching bracket. If not found, it keeps original.
        const input = 'A["Unbalanced';
        expect(deepDebugMermaid(input)).toBe(input);
    });
    
    test('Should respect separators and not cross them if valid', () => {
        // Ensure that we don't accidentally treat A[" ... --> B"] as one block if it wasn't intended
        // But if it is quoted `A[" ... --> ... "]`, it IS one block.
        const input = 'A["Text --> Text"]';
        expect(deepDebugMermaid(input)).toBe(input);
    });

});
