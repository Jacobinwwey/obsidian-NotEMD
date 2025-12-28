import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fix Concatenated Labels', () => {

    test('Should fix concatenated node labels (SubdivideSubdivide pattern)', () => {
        const input = `
graph TD
    Root["Root Node<br>Represents initial cube BBox"] --> |"Contains > M_max points?"| SubdivideSubdivide into 8 Octants;
    Subdivide --> C0["Child 0 Octant 0"];
        `;
        
        // Expected behavior:
        // 1. Detects 'Subdivide' is a valid node (from 2nd line).
        // 2. Sees 'SubdivideSubdivide into 8 Octants;' in 1st line.
        // 3. Recognizes 'Subdivide' prefix.
        // 4. Splits into Subdivide["Subdivide into 8 Octants"].
        
        const expected = `
graph TD
    Root["Root Node<br>Represents initial cube BBox"] --> |"Contains > M_max points?"| Subdivide["Subdivide into 8 Octants"];
    Subdivide --> C0["Child 0 Octant 0"];
        `;
        
        // Normalize whitespace for comparison
        const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
        
        expect(normalize(deepDebugMermaid(input))).toBe(normalize(expected));
    });

    test('Should NOT fix valid labels', () => {
        const input = `
graph TD
    A --> B;
    B --> C;
        `;
        const expected = input;
        expect(deepDebugMermaid(input).replace(/\s+/g, ' ').trim()).toBe(expected.replace(/\s+/g, ' ').trim());
    });

    test('Should fix based on known IDs when arrow has label (bypassing fixMissingBrackets)', () => {
         const input = `
graph TD
    A --> |"label"| BLabel Text;
    B --> C;
         `;
         // fixMissingBrackets skips `--> |...|`.
         // fixConcatenatedLabels should catch it.
         // ID 'B' is known. 'BLabel Text' starts with 'B'.
         
         const expected = `
graph TD
    A --> |"label"| B["Label Text"];
    B --> C;
         `;
         
         const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
         expect(normalize(deepDebugMermaid(input))).toBe(normalize(expected));
    });
});
