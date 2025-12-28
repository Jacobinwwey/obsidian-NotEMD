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
