import { deepDebugMermaid } from '../mermaidProcessor';
import { refineMermaidBlocks } from '../mermaidProcessor';

describe('basechect', () => {
    test('base syntax', () => {
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

    // Mock checkMermaidErrors to force deepDebug (since we can't easily run mermaid.parse here without headless setup)
    // Or we call deepDebugMermaid directly if we are sure it covers it.
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


    console.log("\n--- Table Corruption Test Case ---");

    const tableInput = `
    | Component | Specification | Typical Value & Unit | Significance |
    | : --- | :--- | :--- | : --- |
    | Some Item | Some Spec | 100 kg | High |


    graph TD
    A --> B;
    `
    ;

    (async () => {
        // deepDebugMermaid on raw table (should corrupt)
        const rawResult = deepDebugMermaid(tableInput);
        const rawCorrupted = rawResult.includes('| : -- "- |');
        console.log("Deep Debug on Raw Text Corrupts Table (Expected):", rawCorrupted);

        // refineMermaidBlocks on file (should NOT corrupt)
        // Note: refineMermaidBlocks might need mocking of checkMermaidErrors if strictly unit testing, 
        // but here we run integration logic. checkMermaidErrors uses mermaid.parse which might fail in node without setup?
        // src/mermaidProcessor.ts imports mermaid.
        // If this script runs in node, mermaid.parse might fail or warn.
        // However, we just want to see if the table is touched.
        // If checkMermaidErrors returns 0, deepDebug isn't called.
        // We need to trigger deepDebug. 
        // We can simulate it by ensuring checkMermaidErrors returns > 0, 
        // or just relying on the fact that refineMermaidBlocks is now SAFER regardless.
        // Actually, refineMermaidBlocks now scopes deepDebug to blocks only.
        // So even if we force deepDebug, it shouldn't touch the table.
        
        // To properly test this in this script without full mock:
        // We can verify that refineMermaidBlocks DOES NOT change the table part.
        try {
            const result = await refineMermaidBlocks(tableInput);
            const tableCorrupted = result.includes('| : -- "- |');
            console.log("refineMermaidBlocks Preserves Table (Expected True):", !tableCorrupted);
            if (tableCorrupted) {
                console.error("FAILED: Table was corrupted!");
                console.log("Result snippet:", result.substring(0, 200));
            } else {
                console.log("PASSED: Table intact.");
            }
        } catch (e) {
            console.error("Error running refineMermaidBlocks:", e);
        }
    })();





    console.log("\n--- Bragg's Law Test Case (New) ---");
    const braggsInput = `graph TD
        subgraph "Bragg's Law Geometry"
            P1["Plane 1"]
            P2["Plane 2"]
            
            IncidentRay1 --> PointA["A"]
            PointA --> ScatteredRay1
            
            IncidentRay2 --> PointB["B"]
            PointB --> ScatteredRay2

            P1 --- P2
            
            note1[/["Path Difference = CB + BD["]]
            note2[/["CB = BD = d sinθ["]]
            note3[/["Total Path Difference = 2d sinθ["]]
            
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
    console.log("Bragg's Result Snippet:\n", resultBraggs);

    const expectedBraggs1 = 'note1["Path Difference = CB + BD"]';
    const expectedBraggs2 = 'note2["CB = BD = d sinθ"]';
    const expectedBraggs3 = 'note3["Total Path Difference = 2d sinθ"]';

    const braggsPassed = resultBraggs.includes(expectedBraggs1) &&
                        resultBraggs.includes(expectedBraggs2) &&
                        resultBraggs.includes(expectedBraggs3);

    console.log("Bragg's Law Test Passed:", braggsPassed);

    if (!braggsPassed) {
        console.error("Failed to match Bragg's Law expected output.");
        if (!resultBraggs.includes(expectedBraggs1)) console.log("Missing 1:", expectedBraggs1);
        if (!resultBraggs.includes(expectedBraggs2)) console.log("Missing 2:", expectedBraggs2);
        if (!resultBraggs.includes(expectedBraggs3)) console.log("Missing 3:", expectedBraggs3);
    }});
});
