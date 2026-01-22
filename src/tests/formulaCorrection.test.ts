import { fixFormulaFormats } from '../formulaFixer';

describe('Simple Formula Format Correction', () => {
    
    test('converts single dollar line to double dollar line', () => {
        const input = '$';
        const expected = '$$';
        expect(fixFormulaFormats(input)).toBe(expected);
    });

    test('preserves leading whitespace', () => {
        const input = '  $';
        const expected = '  $$';
        expect(fixFormulaFormats(input)).toBe(expected);
    });

    test('preserves trailing whitespace', () => {
        const input = '$  ';
        const expected = '$$  ';
        expect(fixFormulaFormats(input)).toBe(expected);
    });

    test('preserves both leading and trailing whitespace', () => {
        const input = '  $  ';
        const expected = '  $$  ';
        expect(fixFormulaFormats(input)).toBe(expected);
    });

    test('handles multiple lines correctly', () => {
        const input = `
$
Some text
  $
End
`;
        const expected = `
$$
Some text
  $$
End
`;
        expect(fixFormulaFormats(input)).toBe(expected);
    });

    test('ignores inline formulas', () => {
        const input = 'This is inline $ E=mc^2 $ formula.';
        expect(fixFormulaFormats(input)).toBe(input);
    });

    test('ignores text with dollar signs', () => {
        const input = 'Price is $100.';
        expect(fixFormulaFormats(input)).toBe(input);
    });

    test('ignores existing double dollar lines', () => {
        const input = '$$';
        // The regex ^(\s*)\$(\s*)$ specifically matches a SINGLE $ character.
        // However, we must ensure it doesn't match part of $$.
        // Regex '$' matches literal $.
        // The pattern matches lines containing ONLY whitespace and a single $.
        // '$$' contains two $, so it should NOT match.
        expect(fixFormulaFormats(input)).toBe(input);
    });

    test('ignores lines with other text', () => {
        const input = ' $ text ';
        expect(fixFormulaFormats(input)).toBe(input);
    });

    test('mixed content file', () => {
        const input = `# Title

Text paragraph.

$
E = mc^2
$

  $
  F = ma
  $

Price $50.
`;
        const expected = `# Title

Text paragraph.

$$
E = mc^2
$$

  $$
  F = ma
  $$

Price $50.
`;
        expect(fixFormulaFormats(input)).toBe(expected);
    });
});
