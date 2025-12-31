import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fix Chain Preservation', () => {
    test('Should preserve chain with --->', () => {
        const input = 'C --- C1 --- C2 --- C3 --> C4';
        expect(deepDebugMermaid(input)).toBe(input);
    });

    test('Should preserve chain with ---', () => {
        const input = 'A --- B --- D --- C --- C4';
        expect(deepDebugMermaid(input)).toBe(input);
    });
    
    test('Should still fix actual double labels', () => {
        const input = 'A -- "L1" -- "L2" --> B';
        const expected = 'A -- "L1<br>L2" --> B';
        expect(deepDebugMermaid(input)).toBe(expected);
    });
});
