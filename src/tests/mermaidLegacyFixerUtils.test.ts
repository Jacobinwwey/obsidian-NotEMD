import {
    buildLegacyConnectedNoteLines,
    cleanLegacyTargetedNoteContent,
    protectTopLevelBracketBlocks,
    restoreProtectedBracketBlocks
} from '../diagram/adapters/mermaid/legacyFixerUtils';

describe('mermaid legacy fixer utils', () => {
    test('protects top-level bracket blocks with stable placeholders', () => {
        const result = protectTopLevelBracketBlocks('A --> B["Alpha [Beta]"] --> C');

        expect(result.protectedText).toBe('A --> B___BRACKET_BLOCK_0___ --> C');
        expect(result.blocks).toEqual(['["Alpha [Beta]"]']);
    });

    test('restores protected bracket blocks exactly after mutation of outer text', () => {
        const protectedResult = protectTopLevelBracketBlocks('A --> B["Alpha"] --> C["Gamma"]');
        const mutated = protectedResult.protectedText.replace(/-->/g, '-- "Link" -->');

        expect(restoreProtectedBracketBlocks(mutated, protectedResult.blocks)).toBe(
            'A -- "Link" --> B["Alpha"] -- "Link" --> C["Gamma"]'
        );
    });

    test('keeps trailing unclosed bracket content in protected text', () => {
        const result = protectTopLevelBracketBlocks('A --> B["Alpha"');

        expect(result.protectedText).toBe('A --> B["Alpha"');
        expect(result.blocks).toEqual([]);
    });

    test('builds connected legacy note-node lines from a source node id', () => {
        expect(buildLegacyConnectedNoteLines('Torque', 'General relation')).toEqual([
            'NoteTorque["General relation"]',
            'Torque -.- NoteTorque'
        ]);
    });

    test('cleans targeted note artifacts before rendering note nodes', () => {
        expect(cleanLegacyTargetedNoteContent('Data[""]')).toBe('Data');
        expect(cleanLegacyTargetedNoteContent('Value[\\"\\"\\]')).toBe('Value');
    });
});
