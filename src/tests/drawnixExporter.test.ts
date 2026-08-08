import * as fs from 'fs';
import * as path from 'path';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import {
    isDrawnixMindMapMetadata,
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
            shape: 'straight',
            source: { id: 'renderer' },
            target: { id: 'artifact' },
            texts: [{
                text: { type: 'paragraph' },
                position: expect.any(Number)
            }],
            strokeColor: '#64748b',
            strokeStyle: 'dashed',
            data: { source: 'DrawnixMindMapProjection' }
        });
        expect((data.elements[1] as { texts: Array<{ position: number }> }).texts[0].position)
            .toBeGreaterThanOrEqual(0);
        expect((data.elements[1] as { texts: Array<{ position: number }> }).texts[0].position)
            .toBeLessThanOrEqual(1);
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

    test('serializes inline Mermaid metadata without companion paths', () => {
        const projection = buildDrawnixMindMapProjection(createDrawnixSpec());
        const data = exportDrawnixMindMapProjection(projection, [{
            id: 'source-visual-inline',
            kind: 'mermaid',
            status: 'resolved',
            sourceHash: 'inline001',
            companionPaths: [],
            embeddedSvg: '<svg><text>Inline Mermaid</text></svg>',
            sourceContent: 'flowchart TD\nA --> B',
            title: 'Mermaid source visual 1',
            lineStart: 1,
            lineEnd: 3
        }]);

        expect(data.metadata?.notemd.sourceVisuals).toEqual([
            expect.objectContaining({
                id: 'source-visual-inline',
                companionPaths: [],
                embeddedSvg: expect.stringContaining('Inline Mermaid'),
                sourceContent: 'flowchart TD\nA --> B'
            })
        ]);
        expect(validateDrawnixMindMapExportedData(data)).toEqual([]);
        expect(isDrawnixMindMapMetadata(data.metadata)).toBe(true);
    });

    test('rejects unsupported or duplicate source-visual metadata at the schema boundary', () => {
        const projection = buildDrawnixMindMapProjection(createDrawnixSpec());
        const data = exportDrawnixMindMapProjection(projection, [{
            id: 'source-visual-inline',
            kind: 'mermaid',
            status: 'resolved',
            sourceHash: 'inline001',
            companionPaths: [],
            embeddedSvg: '<svg><text>Inline Mermaid</text></svg>',
            sourceContent: 'flowchart TD\nA --> B'
        }]);

        const unsupportedVersion = {
            ...data,
            metadata: {
                notemd: {
                    version: 2,
                    sourceVisuals: data.metadata!.notemd.sourceVisuals
                }
            }
        };
        expect(isDrawnixMindMapMetadata(unsupportedVersion.metadata)).toBe(false);
        expect(validateDrawnixMindMapExportedData(unsupportedVersion)).toContain(
            'drawnix export metadata must use the supported notemd source-visual schema version'
        );

        const duplicateMetadata = {
            notemd: {
                version: 1 as const,
                sourceVisuals: [
                    ...data.metadata!.notemd.sourceVisuals,
                    ...data.metadata!.notemd.sourceVisuals
                ]
            }
        };
        expect(isDrawnixMindMapMetadata(duplicateMetadata)).toBe(false);
    });
});
