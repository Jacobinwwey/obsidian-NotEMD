import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Deep Debug - Bragg\'s Law', () => {
    test('Should fix Bragg\'s Law note syntax', () => {
        const braggsInput = `graph TD
    subgraph "Bragg's Law Geometry"
        P1["Plane 1"]
        P2["Plane 2"]
        
        IncidentRay1 --> PointA["A"]
        PointA --> ScatteredRay1
        
        IncidentRay2 --> PointB["B"]
        PointB --> ScatteredRay2

        P1 --- P2
        
        note1[/["Path Difference = CB + BD["/]
        note2[/["CB = BD = d sinθ["/]
        note3[/["Total Path Difference = 2d sinθ["/]
        
        PointA --- C
        PointA --- D
        
        subgraph "Path Difference Calculation"
            direction LR
            C -- "d sinθ" --> B
            B -- "d sinθ" --> D
        end
    end
    
    style P1 fill:#e6f2ff,stroke:#003366
    style P2 fill:#e6f2ff,stroke:#003366
    style note1 fill:#ffffcc
    style note2 fill:#ffffcc
    style note3 fill:#ffffcc`;

        const resultBraggs = deepDebugMermaid(braggsInput);
        
        const expectedBraggs1 = 'note1["Path Difference = CB + BD"]';
        const expectedBraggs2 = 'note2["CB = BD = d sinθ"]';
        const expectedBraggs3 = 'note3["Total Path Difference = 2d sinθ"]';

        expect(resultBraggs).toContain(expectedBraggs1);
        expect(resultBraggs).toContain(expectedBraggs2);
        expect(resultBraggs).toContain(expectedBraggs3);
    });
});
