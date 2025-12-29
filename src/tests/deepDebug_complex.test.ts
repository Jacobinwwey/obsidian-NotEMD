import { deepDebugMermaid } from '../mermaidProcessor';

describe('deepDebugMermaid Complex Scenarios', () => {
    test('User Complex Example: Energy Storage', () => {
        const input = `mermaid
graph LR
subgraph "Energy Storage Comparison Log-Log Scale"
direction LR
A[Conventional Capacitor] -- Low Energy, High Power --> BSupercapacitor;
B -- Moderate Energy & Power -- "Balanced Energy/Power<br>Widely Used" --> C["Lithium-ion Battery"];
C -- Higher Energy, Lower Power --> D[Flow Battery];
D -- Very High Energy, Low Power -- "Grid Scale<br>High Energy Capacity<br>Geographically Limited" --> E[Pumped Hydro / CAES];
F[Flywheel] -- Similar to Supercap but Mechanical --> B;

XAxis["Power Density W/kg or W/L"];
YAxis["Energy Density Wh/kg or Wh/L"];

note right of A : Very High Power Density<br>Very Low Energy Density
end
XAxis --- YAxis;`;

        // We expect the function to transform it to a valid state matching the user's desired output structure.
        // Key checks:
        // 1. Double arrows merged: `B -- L1 -- L2 --> C` -> `B -- "L1<br>L2" --> C`
        // 2. Note converted: `note right of A` -> `NoteA[...]` and `A -.- NoteA`
        // 3. Unquoted edge labels fixed: `A -- Low Energy... -->` -> `A -- "Low Energy..." -->`
        // 4. Concatenated ID fixed: `BSupercapacitor` -> `B["Supercapacitor"]` (Implicit check)
        
        const result = deepDebugMermaid(input);

        // Check 1: Double arrows merged
        expect(result).toContain('-- "Moderate Energy & Power<br>Balanced Energy/Power<br>Widely Used" -->');
        expect(result).toContain('-- "Very High Energy, Low Power<br>Grid Scale<br>High Energy Capacity<br>Geographically Limited" -->');
        
        // Check 2: Note converted to Node
        // Note content might be wrapped in quotes
        // We look for the connection `A -.- NoteA` or `A -.- NoteA_...`
        // And definition `NoteA["Note: Very High Power Density<br>Very Low Energy Density"]`
        // The user output has "Note: " prefix. I should probably add that if it helps, or just the content.
        // The user example output: `NoteA["Note: Very High Power Density<br>Very Low Energy Density"]`
        // I will match strictly if I implement strict logic, or loosely.
        expect(result).toMatch(/NoteA\[".*Very High Power Density.*"\]/);
        expect(result).toMatch(/A\s*-.-.*NoteA/);
        
        // Check 3: Unquoted edge labels
        expect(result).toContain('-- "Low Energy, High Power" -->');
        expect(result).toContain('-- "Higher Energy, Lower Power" -->');
        
        // Check 4: Concatenated ID (BSupercapacitor -> B["Supercapacitor"])
        // If BSupercapacitor is fixed, we should see `B["Supercapacitor"]` or similar
        // The input has `BSupercapacitor;`. The output `B["Supercapacitor"]`.
        expect(result).toContain('B["Supercapacitor"]');
    });
});
