import { renderJsonCanvas } from '../diagram/adapters/canvas/canvasAdapter';
import { DiagramSpec } from '../diagram/types';

describe('json canvas adapter', () => {
    test('renders canvasMap spec into Obsidian-compatible JSON Canvas content', () => {
        const spec: DiagramSpec = {
            intent: 'canvasMap',
            title: 'Knowledge Map',
            nodes: [
                { id: 'root', label: 'Knowledge Map' },
                {
                    id: 'topic-a',
                    label: 'Topic A',
                    children: [{ id: 'detail-a1', label: 'Detail A1' }]
                }
            ],
            edges: [{ from: 'root', to: 'topic-a', label: 'relates to' }]
        };

        const output = renderJsonCanvas(spec);
        const parsed = JSON.parse(output);

        expect(Array.isArray(parsed.nodes)).toBe(true);
        expect(Array.isArray(parsed.edges)).toBe(true);
        expect(parsed.nodes.some((node: any) => node.text === 'Knowledge Map')).toBe(true);
        expect(parsed.nodes.some((node: any) => node.text === 'Detail A1')).toBe(true);
        expect(parsed.edges).toHaveLength(1);
    });
});
