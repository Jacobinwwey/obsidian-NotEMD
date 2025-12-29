import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Comment Fix Tests', () => {
    test('should merge trailing % comments into the arrow label', () => {
        const content = `graph TD
subgraph "Model Evaluation Workflow"
CalcMetrics -- Metrics for Model A --> ModelA_Metrics;
CalcMetrics -- Metrics for Model B --> ModelB_Metrics; % Assuming comparison context
Decision --> Report;
end`;

        const expected = `graph TD
subgraph "Model Evaluation Workflow"
CalcMetrics -- "Metrics for Model A" --> ModelA_Metrics;
CalcMetrics -- "Metrics for Model B(Assuming comparison context)" --> ModelB_Metrics;
Decision --> Report;
end`;

        // We expect deepDebugMermaid (or a new function called by it) to handle this.
        expect(deepDebugMermaid(content)).toBe(expected);
    });

    test('should handle existing quotes when merging % comments', () => {
        const content = `graph TD
A -- "Label" --> B; % Comment`;
        
        const expected = `graph TD
A -- "Label(Comment)" --> B;`;

        expect(deepDebugMermaid(content)).toBe(expected);
    });
});
