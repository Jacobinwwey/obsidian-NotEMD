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
});

