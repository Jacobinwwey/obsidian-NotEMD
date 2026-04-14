import { DiagramSpec } from '../diagram/types';
import { RenderArtifact } from '../rendering/types';
import { RenderCache } from '../rendering/cache/renderCache';

describe('render cache', () => {
    const spec: DiagramSpec = {
        intent: 'flowchart',
        title: 'Release Flow',
        nodes: [
            { id: 'validate', label: 'Validate' },
            { id: 'publish', label: 'Publish' }
        ],
        edges: [{ from: 'validate', to: 'publish' }]
    };

    const artifact: RenderArtifact = {
        target: 'mermaid',
        content: 'flowchart TD\nvalidate --> publish',
        mimeType: 'text/vnd.mermaid',
        sourceIntent: 'flowchart'
    };

    test('reuses cached artifacts for the same spec target and theme', () => {
        const cache = new RenderCache();

        cache.set(spec, { target: 'mermaid', theme: 'dark' }, artifact);

        expect(cache.get(spec, { target: 'mermaid', theme: 'dark' })).toBe(artifact);
    });

    test('separates cache entries by theme', () => {
        const cache = new RenderCache();

        cache.set(spec, { target: 'mermaid', theme: 'dark' }, artifact);

        expect(cache.get(spec, { target: 'mermaid', theme: 'light' })).toBeNull();
    });
});
