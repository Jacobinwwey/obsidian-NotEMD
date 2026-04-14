import {
    attachDirectionalNoteToConnection,
    buildLegacyConnectedNoteLines,
    cleanLegacyTargetedNoteContent,
    parseDirectionalNoteDirective,
    parseLegacyForOfNoteDirective,
    parseLegacyStandaloneNoteDirective,
    parseLegacyTargetedNoteDirective,
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

    test('parses directional note directives with attached node id and text', () => {
        expect(parseDirectionalNoteDirective('note right of Detect : FID St1, t2 is acquired')).toEqual({
            nodeId: 'Detect',
            text: 'FID St1, t2 is acquired'
        });
    });

    test('attaches directional notes to outgoing or incoming mermaid connections', () => {
        expect(attachDirectionalNoteToConnection('Evol --> Mix[Mixing];', 'Evol', 't1 is systematically incremented')).toBe(
            'Evol -- "t1 is systematically incremented" --> Mix[Mixing];'
        );
        expect(attachDirectionalNoteToConnection('Mix --> Detect["Detection t2"];', 'Detect', 'FID St1, t2 is acquired')).toBe(
            'Mix -- "FID St1, t2 is acquired" --> Detect["Detection t2"];'
        );
    });

    test('parses legacy note for/of directives while trimming bracket artifacts', () => {
        expect(parseLegacyForOfNoteDirective('note for M00 "Gaussian Intensity Profile"]')).toEqual({
            nodeId: 'M00',
            text: 'Gaussian Intensity Profile'
        });
        expect(parseLegacyForOfNoteDirective('note of M01 "Two-Lobe Intensity Profile"')).toEqual({
            nodeId: 'M01',
            text: 'Two-Lobe Intensity Profile'
        });
    });

    test('parses standalone and targeted quoted note directives', () => {
        expect(parseLegacyStandaloneNoteDirective('note : "General relation"')).toBe('General relation');
        expect(parseLegacyTargetedNoteDirective('note Torque "* General: τ = dL/dt[\"\"]"')).toEqual({
            nodeId: 'Torque',
            text: '* General: τ = dL/dt[""]'
        });
    });
});
