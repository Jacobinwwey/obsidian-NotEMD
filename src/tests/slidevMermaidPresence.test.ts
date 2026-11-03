import { countSlideDeckMermaidBlocks } from '../slideExport/slidevLayoutAudit';

describe('Slidev Mermaid source expectations', () => {
    test('tracks per-slide diagrams without counting fenced examples or frontmatter as slides', () => {
        const deck = [
            '---', 'theme: default', '---', '# Intro', '---', 'layout: default', '---',
            '```mermaid {scale: 0.8}', 'flowchart TD', 'A --> B', '```',
            '~~~mermaid', 'sequenceDiagram', 'A->>B: Hello', '~~~', '---',
            '````markdown', '```mermaid', 'flowchart TD', '---', '```', '````'
        ].join('\n');
        expect(countSlideDeckMermaidBlocks(deck)).toEqual([0, 2, 0]);
    });
});
