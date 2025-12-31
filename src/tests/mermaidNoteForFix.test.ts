import { fixNotesToNodes } from '../mermaidProcessor';

describe('Mermaid Note Fixes (note for/of)', () => {
    it('should transform "note for" into linked note nodes', () => {
        const input = `note for M00 "Gaussian Intensity Profile"`;
        const expectedPart1 = `NoteM00[" Gaussian Intensity Profile"]`; // User example has leading space in quotes
        const expectedPart2 = `M00 -.- NoteM00`;

        const result = fixNotesToNodes(input);
        
        // We verify that the result contains the expected parts
        // Note: The current fixNotesToNodes might add "Note: " prefix. 
        // We will adjust the code to match user expectation (no prefix if user didn't show it, or check if existing code forces it).
        // The user example: NoteM00[" Gaussian Intensity Profile"]
        // Existing code: NoteM00["Note: Gaussian Intensity Profile"]
        
        // I will first run this test to see it FAIL (or not run if regex doesn't match).
        expect(result).toContain('NoteM00[" Gaussian Intensity Profile"]');
        expect(result).toContain('M00 -.- NoteM00');
    });

    it('should transform "note of" into linked note nodes', () => {
        const input = `note of M01 "Two-Lobe Intensity Profile"`;
        const result = fixNotesToNodes(input);
        expect(result).toContain('NoteM01[" Two-Lobe Intensity Profile"]');
        expect(result).toContain('M01 -.- NoteM01');
    });
    
    it('should handle multi-line input correctly', () => {
        const input = `
note for M00 "Gaussian Intensity Profile"]

note for M01 "Two-Lobe Intensity Profile"]
`;
        const result = fixNotesToNodes(input);
        expect(result).toContain('NoteM00[" Gaussian Intensity Profile"]');
        expect(result).toContain('M00 -.- NoteM00');
        expect(result).toContain('NoteM01[" Two-Lobe Intensity Profile"]');
        expect(result).toContain('M01 -.- NoteM01');
    });
});