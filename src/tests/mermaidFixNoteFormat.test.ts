import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fix Note Format', () => {

    test('Should convert note Node "Content" to NoteNode["Content"] and link', () => {
        const input = `
        note L "* General: L = Iω Tensor I[\"\"]"
        note Torque "* General: τ = dL/dt[\"\"]"
        `;
        
        // We expect:
        // NoteL["* General: L = Iω Tensor I"]
        // L -.- NoteL
        // NoteTorque["* General: τ = dL/dt"]
        // Torque -.- NoteTorque

        // Note: The user example had (Tensor I) in output but I assume just stripping ["\\"] is the algorithmic goal
        // unless ["\\"] implies parens? Assuming strip for now.
        // Also note deepDebugMermaid trims and processes the whole block.
        
        const output = deepDebugMermaid(input);
        
        expect(output).toContain('NoteL["* General: L = Iω Tensor I"]');
        expect(output).toContain('L -.- NoteL');
        expect(output).toContain('NoteTorque["* General: τ = dL/dt"]');
        expect(output).toContain('Torque -.- NoteTorque');
        expect(output).not.toContain('note L "');
    });

    test('Should handle valid simple notes', () => {
        const input = 'note MyNode "Some info"';
        const output = deepDebugMermaid(input);
        expect(output).toContain('NoteMyNode["Some info"]');
        expect(output).toContain('MyNode -.- NoteMyNode');
    });

    test('Should clean up ["\"] suffix inside content', () => {
         const input = 'note X "Data[\"\"]"';
         const output = deepDebugMermaid(input);
         expect(output).toContain('NoteX["Data"]');
    });

});
