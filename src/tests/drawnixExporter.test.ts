import * as fs from 'fs';
import * as path from 'path';
import { buildSemanticFigureModel } from '../diagram/adapters/editableSvg/semanticFigureModel';
import {
    exportSemanticFigureModelToDrawnixData,
    stringifyDrawnixExportedData,
    validateDrawnixExportedDataSubset
} from '../diagram/adapters/drawnix/drawnixExporter';
import { DiagramSpec } from '../diagram/types';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

function createDrawnixSpec(): DiagramSpec {
    return {
        intent: 'flowchart',
        title: 'Drawnix Runtime',
        nodes: [
            { id: 'client', label: 'Client <App>', kind: 'actor' },
            { id: 'gateway', label: 'Gateway', kind: 'boundary' }
        ],
        edges: [
            { from: 'client', to: 'gateway', label: 'request' }
        ]
    };
}

describe('drawnix exporter', () => {
    test('exports the supported DrawnixExportedData subset without importing the Drawnix host', () => {
        const model = buildSemanticFigureModel(createDrawnixSpec());
        const data = exportSemanticFigureModelToDrawnixData(model);

        expect(data.type).toBe('drawnix');
        expect(data.version).toBe(1);
        expect(data.source).toBe('web');
        expect(data.viewport).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 });
        expect(data.theme).toBe('default');
        expect(data.elements).toHaveLength(3);
        expect(data.elements[0]).toMatchObject({
            id: 'client',
            type: 'geometry',
            shape: 'rectangle',
            points: [[72, 116], [312, 220]],
            text: { children: [{ text: 'Client <App>' }] },
            data: { notemdRole: 'actor', source: 'SemanticFigureModel' }
        });
        expect(data.elements[2]).toMatchObject({
            id: 'edge-1-client-to-gateway',
            type: 'arrow-line',
            source: { id: 'client' },
            target: { id: 'gateway' },
            text: { children: [{ text: 'request' }] }
        });
        expect(validateDrawnixExportedDataSubset(data)).toEqual([]);

        const exporterSource = fs.readFileSync(
            path.resolve(__dirname, '..', 'diagram', 'adapters', 'drawnix', 'drawnixExporter.ts'),
            'utf8'
        );
        expect(exporterSource).not.toMatch(/from ['"]@drawnix\//);
        expect(exporterSource).not.toMatch(/from ['"]@plait\//);
        expect(exporterSource).not.toMatch(/from ['"]@plait-board\//);
    });

    test('serializes stable .drawnix json and rejects unsupported subset drift', () => {
        const model = buildSemanticFigureModel(createDrawnixSpec());
        const data = exportSemanticFigureModelToDrawnixData(model);
        const json = stringifyDrawnixExportedData(data);

        expect(JSON.parse(json)).toEqual(data);
        expect(stringifyDrawnixExportedData(data)).toBe(json);
        expect(json).toContain('"type": "drawnix"');
        expect(json).toContain('"elements": [');

        const invalid = {
            ...data,
            elements: [
                ...data.elements,
                { id: 'freehand-1', type: 'freehand', points: [] }
            ]
        };

        expect(validateDrawnixExportedDataSubset(invalid)).toEqual([
            'element freehand-1 uses unsupported drawnix subset type "freehand"'
        ]);
    });

    test('renderer returns drawnix source with a companion svg preview artifact', async () => {
        const artifact = await new DrawnixRenderer().render(createDrawnixSpec());

        expect(artifact.target).toBe('drawnix');
        expect(JSON.parse(artifact.content)).toMatchObject({ type: 'drawnix' });
        expect(artifact.previewSvg?.content).toContain('<svg');
        expect(artifact.previewSvg?.content).toContain('data-drawio-type="node"');
    });
});
