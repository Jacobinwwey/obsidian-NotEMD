import {
    attachDirectionalNoteToConnection,
    buildLegacyConnectedNoteLines,
    cleanLegacyTargetedNoteContent,
    mergeLegacyDoubleArrowLabelLine,
    parseLegacyDoubleSlashCommentLine,
    parseDirectionalNoteDirective,
    parseLegacyInlineSubgraphLabelLine,
    parseLegacyMermaidCommentLine,
    parseLegacyForOfNoteDirective,
    parseLegacyStandaloneNoteDirective,
    parseLegacyTargetedNoteDirective,
    protectTopLevelBracketBlocks,
    quoteLegacyUnquotedEdgeLabelLine,
    rewriteLegacyBlankArrowSyntax,
    rewriteLegacyDoubleDashArrow,
    rewriteLegacyDoubleSlashCommentLine,
    rewriteLegacyDuplicateQuotedLabelChain,
    rewriteLegacyInlineSubgraphLabelLine,
    rewriteLegacyInvalidArrowSyntax,
    rewriteLegacyMermaidCommentLine,
    rewriteLegacyMisplacedPipeLine,
    rewriteLegacyPlaceholderArtifacts,
    rewriteLegacyQuotedLabelAfterSemicolonLine,
    rewriteLegacyReverseArrowLine,
    rewriteLegacyShapeMismatch,
    rewriteLegacySubgraphDirectionLine,
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

    test('merges double arrow label segments into a single quoted edge label', () => {
        expect(mergeLegacyDoubleArrowLabelLine('G -- Label1 -- Label2 --- H;')).toBe(
            'G -- "Label1<br>Label2" --- H;'
        );
        expect(mergeLegacyDoubleArrowLabelLine('B -- "Moderate Energy & Power" -- "Balanced Energy/Power<br>Widely Used" --> C;')).toBe(
            'B -- "Moderate Energy & Power<br>Balanced Energy/Power<br>Widely Used" --> C;'
        );
    });

    test('quotes legacy unquoted edge labels without touching valid quoted ones', () => {
        expect(quoteLegacyUnquotedEdgeLabelLine('C -- Higher Energy, Lower Power --> D[Flow Battery];')).toBe(
            'C -- "Higher Energy, Lower Power" --> D[Flow Battery];'
        );
        expect(quoteLegacyUnquotedEdgeLabelLine('C -- "Higher Energy, Lower Power" --> D[Flow Battery];')).toBeNull();
    });

    test('rewrites trailing quoted edge labels that appear after semicolons', () => {
        expect(rewriteLegacyQuotedLabelAfterSemicolonLine('Levy --> Stationary; "Increments are stationary"')).toBe(
            'Levy -- "Increments are stationary" --> Stationary;'
        );
    });

    test('rewrites misplaced leading pipe labels into canonical edge-label placement', () => {
        expect(rewriteLegacyMisplacedPipeLine('>|"Label with \\"quote\\""| A --> B')).toBe(
            'A -->|"Label with \\"quote\\""| B'
        );
    });

    test('parses and rewrites inline subgraph labels used as edge labels', () => {
        expect(parseLegacyInlineSubgraphLabelLine('A --> B; subgraph "Label" end;')).toEqual({
            source: 'A',
            arrow: '-->',
            target: 'B',
            label: 'Label'
        });
        expect(rewriteLegacyInlineSubgraphLabelLine('A --> B; subgraph "Label" end;')).toBe(
            'A -- "Label" --> B;'
        );
        expect(rewriteLegacyInlineSubgraphLabelLine('A --- B; subgraph "Label" end;')).toBe(
            'A -- "Label" --- B;'
        );
    });

    test('parses and rewrites mermaid comment labels while preserving trailing semicolons', () => {
        expect(parseLegacyMermaidCommentLine('A -- Label --> B; % Comment')).toEqual({
            beforeComment: 'A -- Label --> B',
            comment: 'Comment',
            hadTrailingSemicolon: true
        });
        expect(rewriteLegacyMermaidCommentLine('A -- Label --> B; % Comment')).toBe(
            'A -- "Label(Comment)" --> B;'
        );
        expect(rewriteLegacyMermaidCommentLine('A -- "Label" --> B % Comment')).toBe(
            'A -- "Label(Comment)" --> B'
        );
        expect(rewriteLegacyMermaidCommentLine('A -- "100% sure" --> B')).toBeNull();
    });

    test('rewrites malformed and blank arrow syntax without widening scope', () => {
        expect(rewriteLegacyInvalidArrowSyntax('A --|> B')).toBe('A --> B');
        expect(rewriteLegacyBlankArrowSyntax('A -- > B')).toBe('A --> B');
    });

    test('parses and rewrites trailing double-slash arrow comments', () => {
        expect(parseLegacyDoubleSlashCommentLine('Thermal --> Optical; // Thermo-optic effect')).toEqual({
            source: 'Thermal',
            target: 'Optical',
            comment: 'Thermo-optic effect',
            hadTrailingSemicolon: true
        });
        expect(rewriteLegacyDoubleSlashCommentLine('Thermal --> Optical; // Thermo-optic effect')).toBe(
            'Thermal -- "Thermo-optic effect" --> Optical;'
        );
        expect(rewriteLegacyDoubleSlashCommentLine('Thermal --> Optical')).toBeNull();
    });

    test('collapses duplicate quoted label chains and rewrites trailing double-dash arrows', () => {
        expect(rewriteLegacyDuplicateQuotedLabelChain('D --> E["Label"]["Label"]["Label"];')).toBe(
            'D --> E["Label"];'
        );
        expect(rewriteLegacyDoubleDashArrow('A -- B;')).toBe('A --> B;');
        expect(rewriteLegacyDoubleDashArrow('A --- B;')).toBeNull();
    });

    test('rewrites shape mismatches and placeholder artifacts with pure text transforms', () => {
        expect(rewriteLegacyShapeMismatch('note1[/["Path Difference = CB + BD["/]')).toBe(
            'note1["Path Difference = CB + BD"]'
        );
        expect(rewriteLegacyPlaceholderArtifacts('A --> B___BRACKET_BLOCK_0___;')).toBe('A --> B;');
    });

    test('rewrites reverse arrow lines and subgraph direction lines', () => {
        expect(rewriteLegacyReverseArrowLine('ExSitu["Ex-situ..."] <-- Sample;')).toBe(
            'Sample --> ExSitu["Ex-situ..."];'
        );
        expect(rewriteLegacyReverseArrowLine('A --> B')).toBeNull();
        expect(rewriteLegacySubgraphDirectionLine('  Direction TB', true)).toBe('  direction TB');
        expect(rewriteLegacySubgraphDirectionLine('  Direction TB', false)).toBe('  Direction TB');
    });
});
