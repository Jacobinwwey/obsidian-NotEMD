import { fixNotesToNodes } from '../mermaidProcessor';

describe('User Example Test', () => {
    it('should handle "note for" syntax with trailing bracket artifact', () => {
        const input = `
note for M00 "Gaussian Intensity Profile"]

note for M01 "Two-Lobe Intensity Profile"]
`;
        const result = fixNotesToNodes(input);
        
        // Expecting leading space in content as per user request/implementation
        expect(result).toContain('NoteM00[" Gaussian Intensity Profile"]');
        expect(result).toContain('M00 -.- NoteM00');
        expect(result).toContain('NoteM01[" Two-Lobe Intensity Profile"]');
        expect(result).toContain('M01 -.- NoteM01');
    });
});
