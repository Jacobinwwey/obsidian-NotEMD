import { fixMisplacedPipes } from '../mermaidProcessor';

describe('fixMisplacedPipes', () => {
    it('should fix misplaced label pipes with -->', () => {
        const input = '>|"Transformation"| Delta_Configuration --> Wye_Configuration';
        const expected = 'Delta_Configuration -->|"Transformation"| Wye_Configuration';
        expect(fixMisplacedPipes(input)).toBe(expected);
    });

    it('should fix misplaced label pipes with ---', () => {
        const input = '>|"Transformation"| Delta_Configuration --- Wye_Configuration';
        const expected = 'Delta_Configuration ---|"Transformation"| Wye_Configuration';
        expect(fixMisplacedPipes(input)).toBe(expected);
    });

    it('should handle spaces gracefully', () => {
        const input = '  >|"Label"|   Source   -->   Target  ';
        const expected = 'Source -->|"Label"| Target';
        expect(fixMisplacedPipes(input)).toBe(expected);
    });

    it('should not affect normal lines', () => {
        const input = 'A -->|"Label"| B';
        expect(fixMisplacedPipes(input)).toBe(input);
    });
    
    it('should handle labels with special characters if quoted', () => {
         const input = '>|"Label with spaces & stuff"| A --> B';
         const expected = 'A -->|"Label with spaces & stuff"| B';
         expect(fixMisplacedPipes(input)).toBe(expected);
    });

    it('should handle escaped quotes inside label', () => {
        // We want the string to include literal backslash+quote: \"
        // In JS string literal '...', \" is just ". We need \\"
        const input = '>|"Label with \\"quote\\""| A --> B';
        const expected = 'A -->|"Label with \\"quote\\""| B';
        
        console.log('Input:', input);
        const result = fixMisplacedPipes(input);
        console.log('Result:', result);
        
        expect(result).toBe(expected);
    });
});
