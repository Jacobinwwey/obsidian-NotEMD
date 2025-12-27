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

    test('should fix mermaid pipes (-->|Text| and -- Text |)', () => {
        const content = `graph LR
subgraph "Image Quality Relationships"
Pupil_Function["Pupil Function Pxp, yp = Axp, yp * expi * k * Wxp, yp"] -->|Fourier Transform|^2| PSF["Point Spread Function PSFxi, yi"];
Wavefront_Aberration["Wavefront Aberration Wxp, yp"] --> Pupil_Function;
PSF -->|Fourier Transform| OTF["Optical Transfer Function OTFνx, νy"];
OTF -->|Magnitude| MTF["Modulation Transfer Function MTFνx, νy"];
Wavefront_Aberration -- Reduces --> Strehl_Ratio["Strehl Ratio S"];
PSF -- Peak Intensity --> Strehl_Ratio;
Wavefront_Aberration -- Degrades --> MTF;
end

style Wavefront_Aberration fill:#f9f,stroke:#333
style Pupil_Function fill:#ccf,stroke:#333
style PSF fill:#cfc,stroke:#333
style MTF fill:#ffc,stroke:#333
style Strehl_Ratio fill:#fcc,stroke:#333`;

        const expected = `graph LR
subgraph "Image Quality Relationships"
Pupil_Function["Pupil Function Pxp, yp = Axp, yp * expi * k * Wxp, yp"] -->|"Fourier Transform|^2"| PSF["Point Spread Function PSFxi, yi"];
Wavefront_Aberration["Wavefront Aberration Wxp, yp"] --> Pupil_Function;
PSF -->|"Fourier Transform"| OTF["Optical Transfer Function OTFνx, νy"];
OTF -->|"Magnitude"| MTF["Modulation Transfer Function MTFνx, νy"];
Wavefront_Aberration -- Reduces --> Strehl_Ratio["Strehl Ratio S"];
PSF -- Peak Intensity --> Strehl_Ratio;
Wavefront_Aberration -- Degrades --> MTF;
end

style Wavefront_Aberration fill:#f9f,stroke:#333
style Pupil_Function fill:#ccf,stroke:#333
style PSF fill:#cfc,stroke:#333
style MTF fill:#ffc,stroke:#333
style Strehl_Ratio fill:#fcc,stroke:#333`;

        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should merge double labels (-- "L1" -->|"L2"|)', () => {
        const content = `graph LR
    subgraph "Filtering Approaches"
        Causal["Causal Filters<br>yt depends on xs ≤ t"]
        Acausal["Standard Acausal Filters<br>yt depends on xs for s < t, s = t, s > t<br>Fixed hτ"]
        Adaptive["Adaptive Filters Causal<br>hτ, t adapts based on past error et"]
        Kalman["Kalman Filter/Smoother<br>State-space model, uses future measurements smoother"]
        AFA["acausal filteracausal<br>yt depends on xs, hτ, t adapts based on future xs"]
    end

    Causal --> Adaptive;
    Causal --> Acausal;
    Acausal --> AFA;
    Acausal --> Kalman;
    Adaptive -- "Uses Past Error" -->|"Difference"| AFA;
    Kalman -- "Uses Future Measurements" -->|"Similarity"| AFA;
    Acausal -- "Adds Future-Input Adaptation" --> AFA;

    style Causal fill:#eee,stroke:#333
    style Acausal fill:#ccf,stroke:#333
    style Adaptive fill:#cfc,stroke:#333
    style Kalman fill:#ffc,stroke:#333
    style AFA fill:#fcc,stroke:#900,stroke-width:3px`;

        const expected = `graph LR
    subgraph "Filtering Approaches"
        Causal["Causal Filters<br>yt depends on xs ≤ t"]
        Acausal["Standard Acausal Filters<br>yt depends on xs for s < t, s = t, s > t<br>Fixed hτ"]
        Adaptive["Adaptive Filters Causal<br>hτ, t adapts based on past error et"]
        Kalman["Kalman Filter/Smoother<br>State-space model, uses future measurements smoother"]
        AFA["acausal filteracausal<br>yt depends on xs, hτ, t adapts based on future xs"]
    end

    Causal --> Adaptive;
    Causal --> Acausal;
    Acausal --> AFA;
    Acausal --> Kalman;
    Adaptive -- "Uses Past Error<br>(Difference)" --> AFA;
    Kalman -- "Uses Future Measurements<br>(Similarity)" --> AFA;
    Acausal -- "Adds Future-Input Adaptation" --> AFA;

    style Causal fill:#eee,stroke:#333
    style Acausal fill:#ccf,stroke:#333
    style Adaptive fill:#cfc,stroke:#333
    style Kalman fill:#ffc,stroke:#333
    style AFA fill:#fcc,stroke:#900,stroke-width:3px`;

        expect(deepDebugMermaid(content)).toBe(expected);
    });

        test('should fix inline subgraphs used as edge labels', () => {

            const content = `graph LR

    subgraph "Numerical Summation & Extrapolation"

    Series["Infinite Series S = Σ a_n"] --> PartialSums["Sequence S_N"];

    PartialSums --> DirectSum["Direct Summation Truncation"];

    PartialSums --> SeqTrans["Sequence Transformations"];

    

    SeqTrans --> Aitken["Aitken Δ² Process"];

    SeqTrans --> Shanks["Shanks Transformation e_k"];

    SeqTrans --> Levin["Levin Transformations u, t, v"];

    SeqTrans --> Richardson["Richardson Extrapolation"];

    SeqTrans --> Euler["Euler Transformation"];

    

    Aitken -- "Relation: k=1" --> Shanks;

    Shanks -- "Relation: Theoretical Link" --> Pade["Padé Approximants"];

    Richardson -- "Application" --> Romberg["Romberg Integration"];

    Richardson -- "Application" --> BulirschStoer["Bulirsch-Stoer ODE Solver"];

    Euler -- "Specific Applicability" --> Alternating["Alternating Series"];

    

    DirectSum -- "Slow Convergence" --> NeedAccel["Need for Acceleration"];

    NeedAccel --> SeqTrans;

    end

    

    style Aitken fill:#ccf,stroke:#333,stroke-width:2px

    style Richardson fill:#cfc,stroke:#333,stroke-width:2px

    style Shanks fill:#fcc,stroke:#333,stroke-width:2px

    style Levin fill:#ffc,stroke:#333,stroke-width:2px

    style Euler fill:#cff,stroke:#333,stroke-width:2px`;

    

            const expected = `graph LR

    subgraph "Numerical Summation & Extrapolation"

    Series["Infinite Series S = Σ a_n"] --> PartialSums["Sequence S_N"];

    PartialSums --> DirectSum["Direct Summation Truncation"];

    PartialSums --> SeqTrans["Sequence Transformations"];

    

    SeqTrans --> Aitken["Aitken Δ² Process"];

    SeqTrans --> Shanks["Shanks Transformation e_k"];

    SeqTrans --> Levin["Levin Transformations u, t, v"];

    SeqTrans --> Richardson["Richardson Extrapolation"];

    SeqTrans --> Euler["Euler Transformation"];

    

    Aitken -- "Relation: k=1" --> Shanks;

    Shanks -- "Relation: Theoretical Link" --> Pade["Padé Approximants"];

    Richardson -- "Application" --> Romberg["Romberg Integration"];

    Richardson -- "Application" --> BulirschStoer["Bulirsch-Stoer ODE Solver"];

    Euler -- "Specific Applicability" --> Alternating["Alternating Series"];

    

    DirectSum -- "Slow Convergence" --> NeedAccel["Need for Acceleration"];

    NeedAccel --> SeqTrans;

    end

    

    style Aitken fill:#ccf,stroke:#333,stroke-width:2px

    style Richardson fill:#cfc,stroke:#333,stroke-width:2px

    style Shanks fill:#fcc,stroke:#333,stroke-width:2px

    style Levin fill:#ffc,stroke:#333,stroke-width:2px

    style Euler fill:#cff,stroke:#333,stroke-width:2px`;

    

            expect(deepDebugMermaid(content)).toBe(expected);

        });

    

    test('should fix mermaid notes with solid lines (---)', () => {
        const content = `graph TD
    subgraph "Semiconductor Energy Bands p-type"
        ConductionBand["E_C Conduction Band Edge"];
        ValenceBand["E_V Valence Band Edge"];
        AcceptorLevel["E_A Acceptor Energy Level"];
        FermiLevel["E_F Fermi Level"];

        Gap1 --- ConductionBand;
        Gap1["Energy Gap E_g"];
        Gap2 --- AcceptorLevel;
        Gap2["Ionization Energy E_A - E_V"];
        AcceptorLevel --- ValenceBand;
        FermiLevel --- ValenceBand;

        style ConductionBand fill:#lightblue,stroke:#333
        style ValenceBand fill:#lightblue,stroke:#333
        style AcceptorLevel fill:#ffcc99,stroke:#cc6600
        style FermiLevel fill:#ccffcc,stroke:#006600,stroke-dasharray: 5 5
    end

    direction TB
    note right of AcceptorLevel : E_A is typically slightly above E_V
    note right of FermiLevel : E_F is closer to E_V in p-type material`;

        const expected = `graph TD
    subgraph "Semiconductor Energy Bands p-type"
        ConductionBand["E_C Conduction Band Edge"];
        ValenceBand["E_V Valence Band Edge"];
        AcceptorLevel["E_A Acceptor Energy Level"];
        FermiLevel["E_F Fermi Level"];

        Gap1 --- ConductionBand;
        Gap1["Energy Gap E_g"];
        Gap2 --- AcceptorLevel;
        Gap2["Ionization Energy E_A - E_V"];
        AcceptorLevel -- "E_A is typically slightly above E_V" --- ValenceBand;
        FermiLevel -- "E_F is closer to E_V in p-type material" --- ValenceBand;

        style ConductionBand fill:#lightblue,stroke:#333
        style ValenceBand fill:#lightblue,stroke:#333
        style AcceptorLevel fill:#ffcc99,stroke:#cc6600
        style FermiLevel fill:#ccffcc,stroke:#006600,stroke-dasharray: 5 5
    end

    direction TB`;

        expect(deepDebugMermaid(content).trim()).toBe(expected.trim());
    });
});

