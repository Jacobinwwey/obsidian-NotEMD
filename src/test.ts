import { deepDebugMermaid } from './mermaidProcessor';

const input = `graph LR
subgraph "Reaction Coordinate Diagram"
Reactants[Initial Solid State<br>Energy E1] -- Barrier1["Activation Energy Ea1"] --> Products[Activated State / Products<br>Energy E2]
ActivatedSolid[Activated Solid State<br>Energy E1'] -- Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"] --> Products
Reactants --> ActivatedSolid["Activation Process<br>e.g., Milling"]

Barrier1 -- "Activation Process Modifies" --> Barrier2
end

style Reactants fill:#ccf,stroke:#333
style ActivatedSolid fill:#fcc,stroke:#333
style Products fill:#cfc,stroke:#333`;

const result = deepDebugMermaid(input);

console.log("Processed Result:\n", result);

const expectedFragment1 = `Reactants[Initial Solid State<br>Energy E1] --> Barrier1["Activation Energy Ea1"]`;
const expectedFragment2 = `Barrier1["Activation Energy Ea1"] --> Products[Activated State / Products<br>Energy E2]`;
// Note: ActivatedSolid gets quoted due to "E1'"
const expectedFragment3 = `ActivatedSolid["Activated Solid State<br>Energy E1'"] --> Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"]`;
const expectedFragment4 = `Barrier2["Lowered Activation Energy Ea2<br>Ea2 < Ea1"] --> Products`;

const passed = result.includes(expectedFragment1) && 
               result.includes(expectedFragment2) && 
               result.includes(expectedFragment3) && 
               result.includes(expectedFragment4);

console.log("Test Passed:", passed);

if (!passed) {
    console.error("Failed to match expected fragments.");
}

const input2 = `graph TD
Start[Activated Solid Sample] --> SplitSplit Sample for Multiple Tests`;
const result2 = deepDebugMermaid(input2);
console.log("\nInput 2 Result:\n", result2);
console.log("Test 2 Passed:", result2.trim().includes("Start[Activated Solid Sample] --> Split[Split Sample for Multiple Tests]"));