import { normalizeMermaidDefinition, validateMermaidDefinition } from '../diagram/adapters/mermaid/validator';

describe('mermaid sanitization', () => {
    test('removes trailing spaces from entity names in ER diagrams', () => {
        const input = `\`\`\`mermaid
erDiagram
    INITIAL 
        string id
    IDLE 
        string id
    INITIAL ||--o IDLE : Start
\`\`\``;

        const normalized = normalizeMermaidDefinition(input);
        console.log('Normalized:', normalized);
        
        // Should not have trailing spaces on entity names
        expect(normalized).not.toMatch(/INITIAL $/m);
        expect(normalized).not.toMatch(/IDLE $/m);
    });

    test('removes trailing whitespace from all lines', () => {
        const input = `\`\`\`mermaid
flowchart TD
    start   
    end    
    start --> end  
\`\`\``;

        const normalized = normalizeMermaidDefinition(input);
        expect(normalized).not.toMatch(/ $/m);
    });

    test('passes valid mermaid unchanged', () => {
        const input = `\`\`\`mermaid
flowchart TD
    start[Start]
    end[End]
    start --> end
\`\`\``;

        const normalized = normalizeMermaidDefinition(input);
        expect(normalized).toContain('start[Start]');
        expect(normalized).toContain('end[End]');
    });

    test('validates the fixed ER diagram passes mermaid.parse', async () => {
        const input = `\`\`\`mermaid
erDiagram
    INITIAL 
        string id
    IDLE 
        string id
    INITIAL ||--o IDLE : Start
\`\`\``;

        await expect(validateMermaidDefinition(input)).resolves.toBeTruthy();
    }, 10000);
});
