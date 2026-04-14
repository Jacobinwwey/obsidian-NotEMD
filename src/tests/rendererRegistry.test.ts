import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { DiagramSpec } from '../diagram/types';

describe('renderer registry', () => {
    test('resolves a registered renderer for a supported diagram spec', () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const spec: DiagramSpec = {
            intent: 'mindmap',
            title: 'Platform',
            nodes: [{ id: 'core', label: 'Core' }]
        };

        const renderer = registry.resolve(spec);

        expect(renderer).not.toBeNull();
        expect(renderer?.id).toBe('mermaid');
    });

    test('returns null when no registered renderer supports the spec', () => {
        const registry = new RendererRegistry([new MermaidRenderer()]);
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Metrics',
            nodes: [],
            dataSeries: [{ id: 'signups', label: 'Signups', points: [{ x: 'Week 1', y: 12 }] }]
        };

        const renderer = registry.resolve(spec);

        expect(renderer).toBeNull();
    });
});
