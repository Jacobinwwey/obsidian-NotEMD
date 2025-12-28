import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fix Complex Concatenation', () => {

    test('Should fix Proj1c1 and Point_ff patterns', () => {
        const input = `
graph TD
    subgraph "Hilbert Space H"
        direction LR
        Origin0 --- Basis1[ϕ1]
        Origin --- Basis2[ϕ2]
        Origin --- Basis3[ϕ...]

        Origin -- "Projection c1=⟨f,ϕ1⟩" --> Proj1c1 ϕ1
        Origin -- "Projection c2=⟨f,ϕ2⟩" --> Proj2c2 ϕ2

        Function[f] -- "Represents" --> Point_ff in H

        Point_f -- "Approximation" --> Approx_fN["fN = c1 ϕ1 + c2 ϕ2 + ..."]

        Proj1 -- "+" --> Sum12
        Proj2 -- "+" --> Sum12
        Sum12 -- "+ ..." --> Approx_fN

        style Basis1 fill:#ccf
        style Basis2 fill:#ccf
        style Basis3 fill:#ccf
        style Function fill:#cfc
        style Approx_fN fill:#ffc
    end

    FunctionSpace["Function Space e.g., L^2"] --> HilbertSpace["Hilbert Space H"]
    HilbertSpace --> BasisSet["Basis ϕi"]
    BasisSet -- "Spans" --> HilbertSpace
    BasisSet -- "Used for" --> FunctionRepresentation["Function Representation f = Σ ci ϕi"]
    FunctionRepresentation --> Approximation["Approximation fN = Σi=1 to N ci ϕi"]
    Approximation --> Application["Applications PDEs, Signal Proc., etc."]
        `;
        
        // We expect Proj1c1 ϕ1 -> Proj1["c1 ϕ1"]
        // We expect Proj2c2 ϕ2 -> Proj2["c2 ϕ2"]
        // We expect Point_ff in H -> Point_f["f in H"]
        
        const result = deepDebugMermaid(input);
        
        // Normalize whitespace for easier checking
        const normalized = result.replace(/\s+/g, ' ');
        
        expect(normalized).toContain('Origin -- "Projection c1=⟨f,ϕ1⟩" --> Proj1["c1 ϕ1"]');
        expect(normalized).toContain('Origin -- "Projection c2=⟨f,ϕ2⟩" --> Proj2["c2 ϕ2"]');
        expect(normalized).toContain('Function[f] -- "Represents" --> Point_f["f in H"]');
    });

});
