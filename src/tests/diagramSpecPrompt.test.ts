import { buildDiagramSpecPrompt } from '../diagram/prompts/diagramSpecPrompt';

describe('diagram spec prompt builder', () => {
    test('builds a spec-first prompt instead of direct mermaid output instructions', () => {
        const prompt = buildDiagramSpecPrompt();

        expect(prompt).toMatch(/json/i);
        expect(prompt).toMatch(/DiagramSpec/i);
        expect(prompt).toMatch(/Do not output Mermaid/i);
    });

    test('includes preferred intent and target language guidance when provided', () => {
        const prompt = buildDiagramSpecPrompt({
            preferredIntent: 'flowchart',
            targetLanguage: 'Japanese'
        });

        expect(prompt).toMatch(/flowchart/i);
        expect(prompt).toMatch(/Japanese/i);
    });
});
