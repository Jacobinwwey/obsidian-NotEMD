import * as fs from 'fs';
import * as path from 'path';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import {
    exportDrawnixMindMapProjection,
    stringifyDrawnixMindMapExportedData,
    validateDrawnixMindMapExportedData
} from '../diagram/adapters/drawnix/drawnixExporter';
import { DiagramSpec } from '../diagram/types';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

function createDrawnixSpec(): DiagramSpec {
    return {
        intent: 'drawnixMindmap',
        title: 'Drawnix Knowledge Map',
        nodes: [
            {
                id: 'notemd',
                label: 'Notemd',
                children: [
                    { id: 'renderer', label: 'Renderer' },
                    { id: 'artifact', label: 'Artifact export' }
                ]
            }
        ],
        edges: [
            { from: 'renderer', to: 'artifact', label: 'exports' }
        ]
    };
}

describe('drawnix exporter', () => {
    test('exports a native Drawnix mind-map subset without importing the Drawnix host', () => {
        const projection = buildDrawnixMindMapProjection(createDrawnixSpec());
        const data = exportDrawnixMindMapProjection(projection);

        expect(data.type).toBe('drawnix');
        expect(data.version).toBe(1);
        expect(data.source).toBe('web');
        expect(data.viewport).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 });
        expect(data.elements).toHaveLength(2);
        expect(data.elements[0]).toMatchObject({
            id: 'notemd',
            type: 'mindmap',
            layout: 'standard',
            data: { topic: { type: 'paragraph', children: [{ text: 'Notemd' }] } },
            children: [
                expect.objectContaining({ id: 'renderer', type: 'mind_child' }),
                expect.objectContaining({ id: 'artifact', type: 'mind_child' })
            ]
        });
        expect(data.elements[1]).toMatchObject({
            type: 'arrow-line',
            source: { id: 'renderer' },
            target: { id: 'artifact' },
            data: { source: 'DrawnixMindMapProjection' }
        });
        expect(validateDrawnixMindMapExportedData(data)).toEqual([]);

        const exporterSource = fs.readFileSync(
            path.resolve(__dirname, '..', 'diagram', 'adapters', 'drawnix', 'drawnixExporter.ts'),
            'utf8'
        );
        expect(exporterSource).not.toContain('SemanticFigureModel');
        expect(exporterSource).not.toMatch(/from ['"]@drawnix\//);
        expect(exporterSource).not.toMatch(/from ['"]@plait\//);
        expect(exporterSource).not.toMatch(/from ['"]@plait-board\//);
    });

    test('serializes stable .drawnix JSON and rejects non-mind-map element drift', () => {
        const projection = buildDrawnixMindMapProjection(createDrawnixSpec());
        const data = exportDrawnixMindMapProjection(projection);
        const json = stringifyDrawnixMindMapExportedData(data);

        expect(JSON.parse(json)).toEqual(data);
        expect(stringifyDrawnixMindMapExportedData(data)).toBe(json);
        expect(json).toContain('"type": "drawnix"');
        expect(json).toContain('"elements": [');

        const invalid: unknown = {
            ...data,
            elements: [
                ...data.elements,
                { id: 'freehand-1', type: 'freehand', points: [] }
            ]
        };

        expect(validateDrawnixMindMapExportedData(invalid)).toEqual([
            'cross-relation 2 must use type "arrow-line"'
        ]);
    });

    test('renderer returns Drawnix knowledge-map source with a companion SVG preview artifact', async () => {
        const artifact = await new DrawnixRenderer().render(createDrawnixSpec());

        expect(artifact.target).toBe('drawnix');
        expect(JSON.parse(artifact.content)).toMatchObject({ type: 'drawnix' });
        expect(artifact.previewSvg?.content).toContain('<svg');
        expect(artifact.previewSvg?.content).toContain('notemd-drawnix-mindmap-svg@1.0.0');
    });
});
