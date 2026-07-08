import { buildSemanticFigureModel } from '../diagram/adapters/editableSvg/semanticFigureModel';
import {
    collectDrawioVisibleLabelMismatches,
    exportSemanticFigureModelToDrawioXml
} from '../diagram/adapters/drawio/drawioExporter';
import { DiagramSpec } from '../diagram/types';
import { DrawioRenderer } from '../rendering/renderers/drawioRenderer';

function createDrawioSpec(): DiagramSpec {
    return {
        intent: 'flowchart',
        title: 'Runtime <Flow>',
        nodes: [
            { id: 'client', label: 'Client <App>', kind: 'actor' },
            { id: 'gateway', label: 'API Gateway', kind: 'boundary' },
            { id: 'worker', label: 'Worker', kind: 'processor' }
        ],
        edges: [
            { from: 'client', to: 'gateway', label: 'HTTPS <request>' },
            { from: 'gateway', to: 'worker', label: 'queue job', relation: 'async' }
        ]
    };
}

describe('draw.io exporter', () => {
    test('exports deterministic uncompressed draw.io xml from the semantic figure model', () => {
        const model = buildSemanticFigureModel(createDrawioSpec());
        const xml = exportSemanticFigureModelToDrawioXml(model);

        expect(xml).toContain('<mxfile');
        expect(xml).toContain('<diagram id="notemd-runtime-flow" name="Runtime &lt;Flow&gt;">');
        expect(xml).toContain('<mxGraphModel');
        expect(xml).toContain('id="client"');
        expect(xml).toContain('value="Client &lt;App&gt;"');
        expect(xml).toContain('source="client"');
        expect(xml).toContain('target="gateway"');
        expect(xml).toContain('value="HTTPS &lt;request&gt;"');
        expect(xml).not.toContain('<App>');
        expect(xml).not.toContain('<request>');
        expect(exportSemanticFigureModelToDrawioXml(model)).toBe(xml);
    });

    test('reports visible label mismatches for nodes and edges', () => {
        const model = buildSemanticFigureModel(createDrawioSpec());
        const xml = exportSemanticFigureModelToDrawioXml(model);

        expect(collectDrawioVisibleLabelMismatches(xml, model)).toEqual([]);

        const brokenNodeLabel = xml.replace('value="Client &lt;App&gt;"', 'value="Client"');
        expect(collectDrawioVisibleLabelMismatches(brokenNodeLabel, model)).toEqual(
            expect.arrayContaining([
                'node client expected visible label "Client <App>" but found "Client"'
            ])
        );

        const brokenEdgeLabel = xml.replace('value="queue job"', 'value="queued"');
        expect(collectDrawioVisibleLabelMismatches(brokenEdgeLabel, model)).toEqual(
            expect.arrayContaining([
                'edge edge-2-gateway-to-worker expected visible label "queue job" but found "queued"'
            ])
        );
    });

    test('maps supported node roles and edge relations into sampled draw.io styles', () => {
        const model = buildSemanticFigureModel(createDrawioSpec());
        const xml = exportSemanticFigureModelToDrawioXml(model);

        expect(xml).toContain('id="client" value="Client &lt;App&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;"');
        expect(xml).toContain('id="gateway" value="API Gateway" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;"');
        expect(xml).toContain('id="worker" value="Worker" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;"');
        expect(xml).toContain('id="edge-1-client-to-gateway" value="HTTPS &lt;request&gt;" style="endArrow=block;html=1;rounded=1;strokeColor=#64748b;"');
        expect(xml).toContain('id="edge-2-gateway-to-worker" value="queue job" style="endArrow=block;html=1;rounded=1;strokeColor=#64748b;dashed=1;"');
    });

    test('renderer returns draw.io source with a companion svg preview artifact', async () => {
        const artifact = await new DrawioRenderer().render(createDrawioSpec());

        expect(artifact.target).toBe('drawio');
        expect(artifact.content).toContain('<mxfile');
        expect(artifact.previewSvg?.content).toContain('<svg');
        expect(artifact.previewSvg?.content).toContain('data-drawio-type="node"');
    });
});
