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

    test('should fix broken edge labels with --["...["--> pattern', () => {
        const content = `\`\`\`mermaid
graph LR
CapRate --["Inverse Relationship["--> PropValue;
WACC --["Hurdle Rate["--> Acquisitions;
\`\`\``;
        const expected = `\`\`\`mermaid
graph LR
CapRate -- "Inverse Relationship" --> PropValue;
WACC -- "Hurdle Rate" --> Acquisitions;
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });

    test('should quote labels containing pipe characters', () => {
        const content = `\`\`\`mermaid
graph LR
B -- Explicit Prior pθ --> B_Out[Posterior pθ|D];
\`\`\``;
        const expected = `\`\`\`mermaid
graph LR
B -- Explicit Prior pθ --> B_Out["Posterior pθ|D"];
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });

    test('should convert inline comments to labeled arrows and fix end quotes', () => {
        const content = `\`\`\`mermaid
graph TD
subgraph "Synchronization Approaches"
Kuramoto["Standard Kuramoto Model"]
aPS["a-PS Augmented Phase Sync"]
PLL["Phase-Locked Loop"]
Consensus["Consensus Algorithms"]
end

subgraph "Key Characteristics"
Pairwise["Pairwise Interaction"]
Network["Network Synchronization N > 2"]
Adaptive["Adaptive Coupling / Control"]
HigherOrder["Higher-Order Terms"]
Delay["Explicit Delay Handling"]
Reference["External Reference Tracking"]
StateConv["General State Convergence"]
end

Kuramoto --> Pairwise;
Kuramoto --> Network;

aPS --> Pairwise;
aPS --> Network;
aPS --> Adaptive;
aPS --> HigherOrder;
aPS --> Delay;

PLL --> Pairwise;
PLL --> Reference;

Consensus --> Pairwise;
Consensus --> Network;
Consensus --> StateConv;
Consensus --> Adaptive; # Some advanced consensus
Consensus --> Delay; # Some advanced consensus

style aPS fill:#ccf,stroke:#333,stroke-width:2px
\`\`\``;
        const expected = `\`\`\`mermaid
graph TD
subgraph "Synchronization Approaches"
Kuramoto["Standard Kuramoto Model"]
aPS["a-PS Augmented Phase Sync"]
PLL["Phase-Locked Loop"]
Consensus["Consensus Algorithms"]
end

subgraph "Key Characteristics"
Pairwise["Pairwise Interaction"]
Network["Network Synchronization N > 2"]
Adaptive["Adaptive Coupling / Control"]
HigherOrder["Higher-Order Terms"]
Delay["Explicit Delay Handling"]
Reference["External Reference Tracking"]
StateConv["General State Convergence"]
end

Kuramoto --> Pairwise;
Kuramoto --> Network;

aPS --> Pairwise;
aPS --> Network;
aPS --> Adaptive;
aPS --> HigherOrder;
aPS --> Delay;

PLL --> Pairwise;
PLL --> Reference;

Consensus --> Pairwise;
Consensus --> Network;
Consensus --> StateConv;
Consensus -- "Some advanced consensus" --> Adaptive;
Consensus -- "Some advanced consensus" --> Delay;

style aPS fill:#ccf,stroke:#333,stroke-width:2px
\`\`\``;
        expect(refineMermaidBlocks(content)).toBe(expected);
    });
});
