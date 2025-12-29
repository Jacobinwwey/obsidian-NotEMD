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

console.log("\n--- New Tests ---");

const input3 = `graph TD
subgraph "Experimental Setup: Aging at Constant Pressure"
PressureSource["Pressure Source Pump/Intensifier"] --> PressureControl["Pressure Controller Regulator/Feedback Loop"];
PressureControl --> PressureVessel["High-Pressure Vessel/Chamber"];
PressureSensor["Pressure Sensor"] --> PressureControl;

TempSource["Heating/Cooling System"] --> TempControl["Temperature Controller PID"];
TempControl --> PressureVessel;
TempSensor["Temperature Sensor"] --> TempControl;

Sample["Material Sample"] -- Placed Inside --> PressureVessel;
Sample -- Interaction --> Environment["Controlled Atmosphere/Fluid"];

subgraph "Data Acquisition & Monitoring"
InSitu["In-situ Measurements Optional, e.g., Strain Gauge, AE Sensor"] -- Attached To/Observing --> Sample;
InSitu --> DAQ["Data Acquisition System"];
PressureSensor --> DAQ;
TempSensor --> DAQ;
ExSitu["Ex-situ Characterization Post-test or Interrupted"] <-- Sample;
end

DAQ --> Analysis["Data Analysis & Modeling"];
ExSitu --> Analysis;
end

style PressureVessel fill:#f9f,stroke:#333,stroke-width:2px`;

const result3 = deepDebugMermaid(input3);
console.log("\nInput 3 Result (Reverse Arrow):\n", result3);
const expected3 = `Sample --> ExSitu["Ex-situ Characterization Post-test or Interrupted"];`;
console.log("Test 3 Passed:", result3.includes(expected3));

const input4 = `Thermal --> Optical; // Thermo-optic effect`;
const result4 = deepDebugMermaid(input4);
console.log("\nInput 4 Result (Comments):\n", result4);
const expected4 = `Thermal -- "Thermo-optic effect" --> Optical;`;
console.log("Test 4 Passed:", result4.includes(expected4));

const input5 = `subgraph test
  Direction TB
end`;
const result5 = deepDebugMermaid(input5);
console.log("\nInput 5 Result (Direction):\n", result5);
const expected5 = `direction TB`;
console.log("Test 5 Passed:", result5.includes(expected5));

const input6 = `D --> E["Label"]["Label"]["Label"];`;
const result6 = deepDebugMermaid(input6);
console.log("\nInput 6 Result (Duplicate Labels):\n", result6);
const expected6 = `D --> E["Label"];`;
console.log("Test 6 Passed:", result6.includes(expected6));

console.log("\n--- User Requested Test Case ---");
const userExampleInput = `mermaid
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

// We use refineMermaidBlocks to simulate the full pipeline including checkMermaidErrors
import { refineMermaidBlocks } from './mermaidProcessor';

// Mock checkMermaidErrors to force deepDebug (since we can't easily run mermaid.parse here without headless setup)
// Or we just call deepDebugMermaid directly if we are sure it covers it.
// The user said: "Start only when Mermaid errors still exist ... deep debug function needs to be added."
// refineMermaidBlocks calls deepDebugMermaid if checkMermaidErrors > 0.
// Since we can't easily run real mermaid.parse in this CLI environment without a browser/headless,
// we will verify deepDebugMermaid logic directly.

const resultUser = deepDebugMermaid(userExampleInput);
console.log("\nUser Example Result:\n", resultUser);

// Verification logic
const expectedUserFragment1 = 'B -- "Moderate Energy & Power<br>Balanced Energy/Power<br>Widely Used" --> C["Lithium-ion Battery"]';
const expectedUserFragment2 = 'D -- "Very High Energy, Low Power<br>Grid Scale<br>High Energy Capacity<br>Geographically Limited" --> E["Pumped Hydro / CAES"]';
const expectedUserFragment3 = 'NoteA["Note: Very High Power Density<br>Very Low Energy Density"]';
const expectedUserFragment4 = 'A -.- NoteA';

const userTestPassed = resultUser.includes(expectedUserFragment1) &&
                       resultUser.includes(expectedUserFragment2) &&
                       resultUser.includes(expectedUserFragment3) &&
                       resultUser.includes(expectedUserFragment4);

console.log("User Example Test Passed:", userTestPassed);

if (!userTestPassed) {
    console.log("Missing Fragments:");
    if (!resultUser.includes(expectedUserFragment1)) console.log("- Fragment 1 (Double Dash Chain B)");
    if (!resultUser.includes(expectedUserFragment2)) console.log("- Fragment 2 (Double Dash Chain D)");
    if (!resultUser.includes(expectedUserFragment3)) console.log("- Fragment 3 (Note Definition)");
    if (!resultUser.includes(expectedUserFragment4)) console.log("- Fragment 4 (Note Connection)");
}

console.log("\n--- Triple Dash Test Case ---");
const tripleDashInput = `G -- Label1 -- Label2 --- H;`;
const resultTriple = deepDebugMermaid(tripleDashInput);
console.log("Result Triple:", resultTriple);
const expectedTriple = `G -- "Label1<br>Label2" --- H;`;
const tripleTestPassed = resultTriple.includes(expectedTriple);
console.log("Triple Dash Test Passed:", tripleTestPassed);


