import { deepDebugMermaid } from '../mermaidProcessor';

describe('Deep Debug: Excessive Brackets and Semicolon Handling', () => {

    test('should ensure final "] is placed before ";" when fixing unquoted labels', () => {
        // User example 1 (Simplified for testing unit logic)
        // Predict -- $y_n+1^[P] $ --> Evaluate1E: Evaluate $f_n+1^[P] = ft_n+1, y_n+1^[P]$;
        // fixMissingBrackets should now catch this because we updated the regex to handle `-- ... -->`.
        
        const input = `graph LR
    Predict -- $y_n+1^[P] $ --> Evaluate1E: Evaluate $f_n+1^[P] = ft_n+1, y_n+1^[P]$;
    Evaluate1 -- $f_n+1^[P]$ --> Correct["C: Correct $y_n+1^[C]$ using AMk with $f_n+1^[P]$"];`;

        const result = deepDebugMermaid(input);

        // Expected transformation:
        // 1. fixMissingBrackets: Evaluate1E: ...; -> Evaluate1E[: Evaluate ...];
        // 2. fixUnquotedNodeLabels: Evaluate1E[: Evaluate ...]; -> Evaluate1E[": Evaluate ..."];
        
        // We expect the semicolon to be OUTSIDE the quotes.
        expect(result).toContain('graph LREvaluate1E[": Evaluate $f_n+1^[P] = ft_n+1, y_n+1^[P]$ "];');
        
        // Also check if excessive brackets were NOT introduced
        expect(result).not.toContain('Evaluate1E[[": Evaluate');
    });

    test('should fix excessive brackets [[" and ["]', () => {
        // Simpler input without the placeholder noise
        const input = `graph TD
        Target -- Result --> PT[["Final Target Pattern<br>P<sub>T</sub><b>r</b>, t<sub>final</sub>["]`;
        
        const result = deepDebugMermaid(input);
        
        // fixExcessiveBrackets should handle [[" -> [" and ["] -> "]
        // Note: the input example ends with ["] which becomes "].
        
        expect(result).toContain('PT["Final Target Pattern<br>P<sub>T</sub><b>r</b>, t<sub>final</sub>"]');
        expect(result).not.toContain('[[');
        expect(result).not.toContain('["]');
    });

    test('should handle semicolon inside unquoted label correctly', () => {
        // Direct test for fixUnquotedNodeLabels logic
        const input = `graph TD
        A --> B[Label with equals = value;]`;
        
        const result = deepDebugMermaid(input);
        
        // Should become B["Label with equals = value"];
        expect(result).toContain('B["Label with equals = value"];');
    });
    
    test('should handle ["; pattern', () => {
         const input = `graph TD
         A --> B["Label[";`;
         
         const result = deepDebugMermaid(input);
         expect(result).toContain('B["Label"];');
    });

});