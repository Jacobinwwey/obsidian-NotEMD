import { deepDebugMermaid } from '../mermaidProcessor';

describe('Deep Debug Mermaid Tests', () => {

    test('should add brackets to nodes missing them after arrow', () => {
        const content = `\
\
\
mermaid
graph TD
MarketDataA[市场 A 数据源 Market Data A] --> SpreadCalc价差计算 Spread Calculation;
MarketDataB[市场 B 数据源 Market Data B] --> SpreadCalc;
\
\
\
`;
        const expected = `\
\
\
mermaid
graph TD
MarketDataA[市场 A 数据源 Market Data A] --> SpreadCalc[价差计算 Spread Calculation];
MarketDataB[市场 B 数据源 Market Data B] --> SpreadCalc;
\
\
\
`;
        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should handle labeled arrows', () => {
        const content = `\
\
\
mermaid
graph TD
RiskCheck -- "Passed" --> Concurrency并发执行 Concurrent Execution;
\
\
\
`;
        const expected = `\
\
\
mermaid
graph TD
RiskCheck -- "Passed" --> Concurrency[并发执行 Concurrent Execution];
\
\
\
`;
        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should handle question marks in labels', () => {
        const content = `\
\
\
mermaid
graph TD
OrderA --> AckA确认成交 A?;
\
\
\
`;
        const expected = `\
\
\
mermaid
graph TD
OrderA --> AckA[确认成交 A?];
\
\
\
`;
        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should NOT modify valid nodes with brackets', () => {
        const content = `\
\
\
mermaid
graph TD
A --> B[Valid Label];
C --> D;
\
\
\
`;
        expect(deepDebugMermaid(content)).toBe(content);
    });

    test('should handle mixed valid and invalid lines', () => {
        const content = `\
\
\
mermaid
graph TD
A --> B错误 Error;
C --> D[Correct];
E --> F;
\
\
\
`;
        const expected = `\
\
\
mermaid
graph TD
A --> B[错误 Error];
C --> D[Correct];
E --> F;
\
\
\
`;
        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should convert note comments to edge labels', () => {
        const content = `graph LR
    subgraph "General 2D NMR Experiment Timeline"
        Prep[Preparation] --> Evol["Evolution t1"];
        Evol --> Mix[Mixing];
        Mix --> Detect["Detection t2"];
    end

    style Prep fill:#ccf,stroke:#333
    style Evol fill:#cfc,stroke:#333
    style Mix fill:#fcf,stroke:#333
    style Detect fill:#ffc,stroke:#333

    note right of Evol: t1 is systematically incremented
    note right of Detect: FID St1, t2 is acquired`;

        // Logic:
        // 1. Evol line: `Evol --> Mix` becomes `Evol -- "t1 is systematically incremented" --> Mix`
        // 2. Detect line: `Mix --> Detect` becomes `Mix -- "FID St1, t2 is acquired" --> Detect` (Target match)
        // 3. Note lines removed.

        const expected = `graph LR
    subgraph "General 2D NMR Experiment Timeline"
        Prep[Preparation] --> Evol["Evolution t1"];
        Evol -- "t1 is systematically incremented" --> Mix[Mixing];
        Mix -- "FID St1, t2 is acquired" --> Detect["Detection t2"];
    end

    style Prep fill:#ccf,stroke:#333
    style Evol fill:#cfc,stroke:#333
    style Mix fill:#fcf,stroke:#333
    style Detect fill:#ffc,stroke:#333

    `; 
        // Note: The empty lines might be tricky depending on how filter works. 
        // The original content has blank lines between styles and notes. 
        // The notes are on the last two lines.
        // My implementation removes the note lines but keeps the preceding blank lines if they were not part of the note regex match (they are not).
        // So expected string should end with the blank line that was before the notes.
        
        // Let's refine the expected string to match exact output behavior
        const expectedClean = `graph LR
    subgraph "General 2D NMR Experiment Timeline"
        Prep[Preparation] --> Evol["Evolution t1"];
        Evol -- "t1 is systematically incremented" --> Mix[Mixing];
        Mix -- "FID St1, t2 is acquired" --> Detect["Detection t2"];
    end

    style Prep fill:#ccf,stroke:#333
    style Evol fill:#cfc,stroke:#333
    style Mix fill:#fcf,stroke:#333
    style Detect fill:#ffc,stroke:#333

    `;
        // The content has a newline after the last style, then a newline (blank line), then the notes.
        // Lines:
        // ...
        // style Detect ...
        // (empty)
        // note right ...
        // note right ...
        
        // The filter removes the last two lines. The empty line remains.
        
        expect(deepDebugMermaid(content).trim()).toBe(expectedClean.trim());
    });

    test('should fix malformed arrow labels ( -->" and "-- )', () => {
        const content = `graph LR
subgraph "Computational Chemistry Methods Spectrum"
QM["Quantum Mechanics Electrons Explicit"] -- Based On --> SEq["Schrödinger Equation"];
Classical["Classical Mechanics Electrons Implicit"] -- Based On --> NewtonEq["Newton's Equations / Classical Potentials"];

QM --> AbInitio["Ab Initio Methods<br>HF, MPn, CC, CI<br>No empirical parameters<br>Systematic improvability"];
QM --> DFT["Density Functional Theory<br>Uses electron density ρr<br>Requires approx.  E<sub>XC</sub> functional"];
QM --> SemiEmpirical["Semi-Empirical Methods<br>HF formalism + parameters<br>Integral approximation"];
QM --> QMC["Quantum Monte Carlo<br>Stochastic sampling<br>Explicit correlation"];

Classical --> MM["Molecular Mechanics / Force Fields<br>Classical potentials<br>Parameterized functions"];

AbInitio -- "High Accuracy / High Cost" --> CostAccuAxis;
DFT -- "Good Balance" --> CostAccuAxis;
SemiEmpirical -- "Lower Accuracy / Low Cost" --> CostAccuAxis;
MM -- "Very Low Cost / Very Large Systems" --> CostAccuAxis;
QMC -- "High Accuracy / High Cost Statistical" --> CostAccuAxis;

AbInitio -- "Related Formalism" --> SemiEmpirical;
AbInitio -- "Conceptual Alternative QM" --> DFT;
AbInitio -- "Conceptual Alternative QM" --> QMC;
AbInitio -- "Provides Parameters For -->" MM;
DFT -- "Provides Parameters For -->" MM;
end`;

        const expected = `graph LR
subgraph "Computational Chemistry Methods Spectrum"
QM["Quantum Mechanics Electrons Explicit"] -- Based On --> SEq["Schrödinger Equation"];
Classical["Classical Mechanics Electrons Implicit"] -- Based On --> NewtonEq["Newton's Equations / Classical Potentials"];

QM --> AbInitio["Ab Initio Methods<br>HF, MPn, CC, CI<br>No empirical parameters<br>Systematic improvability"];
QM --> DFT["Density Functional Theory<br>Uses electron density ρr<br>Requires approx.  E<sub>XC</sub> functional"];
QM --> SemiEmpirical["Semi-Empirical Methods<br>HF formalism + parameters<br>Integral approximation"];
QM --> QMC["Quantum Monte Carlo<br>Stochastic sampling<br>Explicit correlation"];

Classical --> MM["Molecular Mechanics / Force Fields<br>Classical potentials<br>Parameterized functions"];

AbInitio -- "High Accuracy / High Cost" --> CostAccuAxis;
DFT -- "Good Balance" --> CostAccuAxis;
SemiEmpirical -- "Lower Accuracy / Low Cost" --> CostAccuAxis;
MM -- "Very Low Cost / Very Large Systems" --> CostAccuAxis;
QMC -- "High Accuracy / High Cost Statistical" --> CostAccuAxis;

AbInitio -- "Related Formalism" --> SemiEmpirical;
AbInitio -- "Conceptual Alternative QM" --> DFT;
AbInitio -- "Conceptual Alternative QM" --> QMC;
AbInitio -- "Provides Parameters For" --> MM;
DFT -- "Provides Parameters For" --> MM;
end`;

        // We focus on these lines being fixed:
        // AbInitio -- "Provides Parameters For -->" MM;  ->  AbInitio -- "Provides Parameters For" --> MM;
        
        expect(deepDebugMermaid(content)).toBe(expected);
    });
});

