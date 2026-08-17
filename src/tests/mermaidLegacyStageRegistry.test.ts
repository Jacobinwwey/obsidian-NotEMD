import mermaid from 'mermaid';
import {
    deepDebugMermaid,
    listMermaidLegacyRepairStages
} from '../mermaidProcessor';
import { extractMermaidBlocks, normalizeMermaidDiagram } from '../diagram/adapters/mermaid/normalize';
import { ensureMermaidInitialized } from '../diagram/adapters/mermaid/runtime';

jest.mock('mermaid');

describe('Mermaid legacy repair contracts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('publishes a unique, ordered stage registry', () => {
        const stages = listMermaidLegacyRepairStages();
        const expectedStageIds = [
            'smart-quotes',
            'pipes',
            'notes',
            'notes-to-nodes',
            'malformed-arrows',
            'invalid-arrows',
            'double-labels',
            'missing-brackets',
            'inline-subgraphs',
            'comments',
            'double-slash-comments',
            'unquoted-node-labels',
            'intermediate-nodes',
            'doubled-ids',
            'excessive-brackets',
            'semicolon-positioning',
            'concatenated-labels',
            'unquoted-labels-with-semicolons',
            'enhanced-note-and-semicolon-cleanup',
            'reverse-arrows',
            'subgraph-direction',
            'duplicate-labels',
            'nested-quotes',
            'quoted-labels-after-semicolon',
            'double-dash-to-arrow',
            'targeted-notes',
            'double-arrow-labels',
            'unquoted-edge-labels',
            'shape-mismatch',
            'placeholder-artifacts',
            'cleanup-empty-pipe-quotes',
            'cleanup-empty-brackets',
            'misplaced-pipes',
            'cleanup-empty-array-label',
            'blank-arrows'
        ];

        expect(stages).toEqual(expectedStageIds);
        expect(new Set(stages).size).toBe(stages.length);
    });

    test('is idempotent for a repaired flowchart and fail-closed for other families', () => {
        const malformedFlowchart = 'graph TD\nA -- "first" -- "second" --> B';
        const once = deepDebugMermaid(malformedFlowchart);

        expect(deepDebugMermaid(once)).toBe(once);

        const sequence = 'sequenceDiagram\nAlice->>Bob: Hello';
        const er = 'erDiagram\nUSER {\n string id\n}';
        expect(deepDebugMermaid(sequence)).toBe(sequence);
        expect(deepDebugMermaid(er)).toBe(er);
    });

    test('extracts fenced blocks with both marker styles without crossing blocks', () => {
        const blocks = extractMermaidBlocks([
            'before',
            '  ```mermaid',
            '  graph TD',
            '  A-->B',
            '  ```',
            'between',
            '~~~mermaid',
            'sequenceDiagram',
            'Alice->>Bob: Hello',
            '~~~',
            'after'
        ].join('\n'));

        expect(blocks).toHaveLength(2);
        expect(blocks[0]).toEqual(expect.objectContaining({ marker: '```', content: '  graph TD\n  A-->B' }));
        expect(blocks[1]).toEqual(expect.objectContaining({ marker: '~~~', content: 'sequenceDiagram\nAlice->>Bob: Hello' }));
        expect(normalizeMermaidDiagram(`${blocks[1].openingLine}\n${blocks[1].content}\n${blocks[1].closingLine}`).family)
            .toBe('sequenceDiagram');
    });

    test('initializes the validation runtime once for one Mermaid initialize function', () => {
        ensureMermaidInitialized();
        ensureMermaidInitialized();

        expect(mermaid.initialize).toHaveBeenCalledTimes(1);
        expect(mermaid.initialize).toHaveBeenCalledWith({
            startOnLoad: false,
            suppressErrorRendering: true
        });
    });
});
