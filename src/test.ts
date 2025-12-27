import { deepDebugMermaid } from './mermaidProcessor';

// User provided example for testing
const input = `graph TD
Start[Start: Measure Rate Constant k at Multiple Temperatures T] --> DataCollect[ T_i, k_i data pairs];
Data --> Transform[Transform data: Calculate 1/T_i, ln k_i];
Transform --> Plot[Plot ln k vs 1/T: "Arrhenius Plot"];
Plot --> Regression[Perform Linear Regression: ln k = ln A - Ea/R1/T];
Regression --> SlopeExtract[ Slope 'm'];
Slope --> Calc_Ea[Calculate Ea = -m * R];
Regression --> InterceptExtract[ Intercept 'c'];
Intercept --> Calc_A[Calculate A = expc];
Calc_Ea --> Results[Output: Ea ± Confidence Interval];
Calc_A --> Results;
Results --> End[End];

style Start fill:#ccf,stroke:#333
style Data fill:#cfc,stroke:#333
style Transform fill:#cfc,stroke:#333
style Plot fill:#ffc,stroke:#333
style Regression fill:#fcc,stroke:#333
style Calc_Ea fill:#cff,stroke:#333
style Calc_A fill:#cff,stroke:#333
style Results fill:#ccf,stroke:#333`;

const expected = `graph TD
Start[Start: Measure Rate Constant k at Multiple Temperatures T] --> DataCollect[ T_i, k_i data pairs];
Data --> Transform[Transform data: Calculate 1/T_i, ln k_i];
Transform --> Plot["Plot ln k vs 1/T: \"Arrhenius Plot\""];
Plot --> Regression["Perform Linear Regression: ln k = ln A - Ea/R1/T"];
Regression --> SlopeExtract[" Slope 'm'"];
Slope --> Calc_Ea["Calculate Ea = -m * R"];
Regression --> InterceptExtract[" Intercept 'c'"];
Intercept --> Calc_A["Calculate A = expc"];
Calc_Ea --> Results["Output: Ea ± Confidence Interval"];
Calc_A --> Results;
Results --> End[End];

style Start fill:#ccf,stroke:#333
style Data fill:#cfc,stroke:#333
style Transform fill:#cfc,stroke:#333
style Plot fill:#ffc,stroke:#333
style Regression fill:#fcc,stroke:#333
style Calc_Ea fill:#cff,stroke:#333
style Calc_A fill:#cff,stroke:#333
style Results fill:#ccf,stroke:#333`;

const result = deepDebugMermaid(input);

console.log("Test Passed:", result.trim() === expected.trim());
if (result.trim() !== expected.trim()) {
    console.log("Expected:\n", expected);
    console.log("Actual:\n", result);
}

