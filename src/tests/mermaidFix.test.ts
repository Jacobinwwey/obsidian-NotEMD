import { refineMermaidBlocks } from '../mermaidProcessor';

describe('Mermaid Fix Mode Tests', () => {

    test('should fix unquoted labels with nested brackets (Example 1)', () => {
        const content = `\`\`\`mermaid
graph LR
CorpBonds -- "Cost of Capital" --> Investment[Corporate Investment "[企业投资]"];
\`\`\``;
        const expected = `\`\`\`mermaid
graph LR
CorpBonds -- "Cost of Capital" --> Investment["Corporate Investment [企业投资]"];
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });

    test('should fix unquoted labels with nested brackets (Example 2)', () => {
        const content = `\`\`\`mermaid
graph LR
MBS -- "Housing Demand" --> Consumption[Consumption [消费]];
\`\`\``;
        const expected = `\`\`\`mermaid
graph LR
MBS -- "Housing Demand" --> Consumption["Consumption [消费]"];
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });

    test('should fix unquoted labels with nested brackets (Example 3 - White Dwarf)', () => {
        const content = `\`\`\`mermaid
graph TD
PlanetaryNebula --> WhiteDwarf[白矮星 [White Dwarf]];
\`\`\``;
        const expected = `\`\`\`mermaid
graph TD
PlanetaryNebula --> WhiteDwarf["白矮星 [White Dwarf]"];
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });

    test('should NOT fix interference items (already quoted)', () => {
        const content = `\`\`\`mermaid
graph LR
GovCurve -- "Mortgage Rates" --> MBS["MBS Pricing [MBS定价]["];
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(content);
    });

    test('should handle full example block correctly', () => {
        const content = `\`\`\`mermaid
graph LR
subgraph "Monetary Policy Transmission 货币政策传导"
CentralBank["Central Bank Rate 央行利率"] --> Interbank["Interbank Rates 银行间利率"];
Interbank --> GovCurve["Sovereign Yield Curve 国债收益率曲线"];

GovCurve -- "Risk-Free Benchmark" --> CorpBonds["Corporate Bond Yields 公司债收益率"];
GovCurve -- "Mortgage Rates" --> MBS["MBS Pricing [MBS定价]["];

CorpBonds -- "Cost of Capital" --> Investment[Corporate Investment "[企业投资]"];
MBS -- "Housing Demand" --> Consumption[Consumption [消费]];
end

style CentralBank fill:#fff9c4,stroke:#fbc02d
style GovCurve fill:#e0f2f1,stroke:#00695c
\`\`\``;
        
        const expected = `\`\`\`mermaid
graph LR
subgraph "Monetary Policy Transmission 货币政策传导"
CentralBank["Central Bank Rate 央行利率"] --> Interbank["Interbank Rates 银行间利率"];
Interbank --> GovCurve["Sovereign Yield Curve 国债收益率曲线"];

GovCurve -- "Risk-Free Benchmark" --> CorpBonds["Corporate Bond Yields 公司债收益率"];
GovCurve -- "Mortgage Rates" --> MBS["MBS Pricing [MBS定价]["];

CorpBonds -- "Cost of Capital" --> Investment["Corporate Investment [企业投资]"];
MBS -- "Housing Demand" --> Consumption["Consumption [消费]"];
end

style CentralBank fill:#fff9c4,stroke:#fbc02d
style GovCurve fill:#e0f2f1,stroke:#00695c
\`\`\``;
        
        expect(refineMermaidBlocks(content)).toBe(expected);
    });
});
