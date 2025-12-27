import { deepDebugMermaid } from '../mermaidProcessor';

describe('Deep Debug: Intermediate Node and Malformed Definition Fixes', () => {

    test('should split edge with intermediate node definition into two edges', () => {
        const input = `graph LR
subgraph "Reaction Coordinate Diagram"
Reactants[Initial Solid State<br>Energy E1] -- Barrier1["Activation Energy Ea1"] --> Products[Activated State / Products<br>Energy E2]
ActivatedSolid[Activated Solid State<br>Energy E1'] -- Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"] --> Products
Reactants --> ActivatedSolid["Activation Process<br>e.g., Milling"]

Barrier1 -- "Activation Process Modifies" --> Barrier2
end`;

        const expectedFragment1 = `Reactants[Initial Solid State<br>Energy E1] --> Barrier1["Activation Energy Ea1"]`;
        const expectedFragment2 = `Barrier1["Activation Energy Ea1"] --> Products[Activated State / Products<br>Energy E2]`;
        // Note: fixUnquotedNodeLabels adds quotes to ActivatedSolid because of the single quote in E1'
        const expectedFragment3 = `ActivatedSolid["Activated Solid State<br>Energy E1'"] --> Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"]`;
        const expectedFragment4 = `Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"] --> Products`;

        const result = deepDebugMermaid(input);

        expect(result).toContain(expectedFragment1);
        expect(result).toContain(expectedFragment2);
        expect(result).toContain(expectedFragment3);
        expect(result).toContain(expectedFragment4);
        // Ensure original lines are gone or transformed
        expect(result).not.toContain(`-- Barrier1["Activation Energy Ea1"] -->`);
        expect(result).not.toContain(`-- Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"] -->`);
    });

    test('should fix malformed node definition "SplitSplit Sample..."', () => {
        const input = `graph TD
Start[Activated Solid Sample] --> SplitSplit Sample for Multiple Tests`;

        const expected = `graph TD
Start[Activated Solid Sample] --> Split[Split Sample for Multiple Tests]`;

        const result = deepDebugMermaid(input);
        expect(result.trim()).toBe(expected.trim());
    });

});
