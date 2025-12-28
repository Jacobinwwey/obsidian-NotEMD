import { deepDebugMermaid } from '../mermaidProcessor';

describe('Fix Unquoted Node Labels Tests', () => {

    test('should quote labels with quotes, equals, or math symbols', () => {
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

        // We expect quotes to be added around the content, even if it already contains quotes (nested unescaped quotes).
        // This matches the user's specific request "Transform --> Plot["Plot ln k vs 1/T: "Arrhenius Plot""];"
        const expected = `graph TD
Start[Start: Measure Rate Constant k at Multiple Temperatures T] --> DataCollect[ T_i, k_i data pairs];
Data --> Transform[Transform data: Calculate 1/T_i, ln k_i];
Transform --> Plot["Plot ln k vs 1/T: Arrhenius Plot"];
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

        expect(deepDebugMermaid(input).trim()).toBe(expected.trim());
    });

    test('should NOT quote simple alphanumeric labels or simple punctuation', () => {
        const input = `graph TD
A[Simple Label] --> B[Label with: Colon];
C[Label with, Comma] --> D[Label with / Slash];`;
        // No change expected
        expect(deepDebugMermaid(input)).toBe(input);
    });

    test('should quote labels with minus sign', () => {
        const input = `graph TD
A[Value - 1] --> B;`;
        const expected = `graph TD
A["Value - 1"] --> B;`;
        expect(deepDebugMermaid(input)).toBe(expected);
    });
});