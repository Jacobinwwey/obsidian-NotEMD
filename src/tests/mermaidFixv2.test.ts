import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fixes V2', () => {

    test('Should fix double dashes ending with semicolon to arrow', () => {
        const input = `
        SurfaceNormal -- "Angle Theta_i" -- IncidentRay;
        SurfaceNormal -- "Angle Theta_r" -- ReflectedRay;
        SurfaceNormal -- "Angle Theta_t" -- RefractedRay;
        `;
        const expected = `
        SurfaceNormal -- "Angle Theta_i" --> IncidentRay;
        SurfaceNormal -- "Angle Theta_r" --> ReflectedRay;
        SurfaceNormal -- "Angle Theta_t" --> RefractedRay;
        `;
        // Normalize whitespace for comparison
        expect(deepDebugMermaid(input).replace(/\s+/g, ' ').trim())
            .toBe(expected.replace(/\s+/g, ' ').trim());
    });

    test('Should fix smart quotes in Note["/.../"] pattern', () => {
        const input = 'Note["/“Sentences”/"]';
        const expected = 'Note["/Sentences/"]';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should collapse duplicate identical labels', () => {
        const input = 'SnellsLaw --> CheckTIR["Is n1 > n2?"]["Is n1 > n2?"]["Is n1 > n2?"]["Is n1 > n2?"]["Is n1 > n2?"];';
        const expected = 'SnellsLaw --> CheckTIR["Is n1 > n2?"];';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should fix excessive closing brackets', () => {
        const input = 'Node["Label"]]';
        const expected = 'Node["Label"]';
        expect(deepDebugMermaid(input)).toBe(expected);
        
        const input2 = 'Node["Label"]];';
        const expected2 = 'Node["Label"];';
        expect(deepDebugMermaid(input2)).toBe(expected2);
    });

    test('Should fix mixed duplicate labels (retain last)', () => {
        // While the user example was identical, general logic implies last one wins
        const input = 'Node["First"]["Second"];';
        const expected = 'Node["Second"];';
        expect(deepDebugMermaid(input)).toBe(expected);
    });
});
