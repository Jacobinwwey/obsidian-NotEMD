import { validateMermaidDefinition } from '../diagram/adapters/mermaid/validator';

describe('mermaid parse edge cases', () => {
    test('erDiagram with trailing spaces fails parse before sanitization', async () => {
        // This is the exact broken content from the user's file
        const brokenContent = `\`\`\`mermaid
erDiagram
    INITIAL 
        string id
    IDLE 
        string id
    AUTHENTICATING 
        string id
    INITIAL ||--o IDLE : Start
\`\`\``;

        // After sanitization, it should pass
        await expect(validateMermaidDefinition(brokenContent)).resolves.toBeTruthy();
    }, 10000);

    test('proper erDiagram syntax passes', async () => {
        const properContent = `\`\`\`mermaid
erDiagram
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        string date
    }
    CUSTOMER ||--o{ ORDER : places
\`\`\``;

        await expect(validateMermaidDefinition(properContent)).resolves.toBeTruthy();
    }, 10000);
});
