import { CircuitikzRenderer } from '../rendering/renderers/circuitikzRenderer';
import { DiagramSpec } from '../diagram/types';

function createCircuitDiagramSpec(): DiagramSpec {
    return {
        intent: 'circuit',
        title: 'CMOS Inverter',
        nodes: [],
        circuitSpec: {
            circuitKind: 'cmos-inverter',
            title: 'CMOS Inverter',
            goldenReferenceId: 'cmos-inverter-v1',
            style: {
                package: 'circuitikz',
                voltageConvention: 'american voltages'
            },
            nets: ['VDD', 'GND', 'vin', 'vout', 'shared_gate', 'shared_drain'],
            components: [
                {
                    id: 'MP',
                    type: 'pmos',
                    label: '$M_P$',
                    terminals: { S: 'VDD', G: 'shared_gate', D: 'shared_drain' }
                },
                {
                    id: 'MN',
                    type: 'nmos',
                    label: '$M_N$',
                    terminals: { D: 'shared_drain', G: 'shared_gate', S: 'GND' }
                }
            ],
            connections: [
                { from: 'VDD', to: 'MP.S' },
                { from: 'MP.D', to: 'MN.D' },
                { from: 'MN.S', to: 'GND' },
                { from: 'vin', to: 'MP.G' },
                { from: 'vin', to: 'MN.G' },
                { from: 'MP.D', to: 'vout' },
                { from: 'MN.D', to: 'vout' }
            ],
            layoutHints: {
                inputSide: 'left',
                outputSide: 'right',
                routingStyle: 'orthogonal'
            }
        }
    };
}

describe('circuitikz renderer', () => {
    test('exports circuitikz TeX source with an Obsidian-viewable SVG companion', async () => {
        const renderer = new CircuitikzRenderer();
        const artifact = await renderer.render(createCircuitDiagramSpec());

        expect(artifact.target).toBe('circuitikz');
        expect(artifact.mimeType).toBe('text/x-tex');
        expect(artifact.content).toContain('\\usepackage{circuitikz}');
        expect(artifact.content).toContain('\\begin{circuitikz}');
        expect(artifact.previewSvg?.mimeType).toBe('image/svg+xml');
        expect(artifact.previewSvg?.content).toContain('<svg');
        expect(artifact.previewSvg?.content).toContain('data-notemd-renderer="notemd-circuitikz-preview-svg@0.2.0"');
        expect(artifact.previewSvg?.content).toContain('class="notemd-circuit-canvas" x="0" y="0" width="720" height="580" fill="#ffffff"');
        expect(artifact.previewSvg?.content).toContain('CMOS Inverter');
        expect(artifact.previewSvg?.content).toContain('vout');
        expect(artifact.previewSvg?.content).not.toContain('v_{out}');
        expect(artifact.previewSvg?.content).toContain('.notemd-circuit-stage text { stroke: none; }');
        expect(artifact.previewSvg?.content).toContain('font: 400 15px');
        expect(artifact.previewSvg?.content).not.toContain('cmos-inverter / cmos-inverter-v1');
    });

    test('refuses non-circuit diagram specs instead of silently drawing a flowchart', async () => {
        const renderer = new CircuitikzRenderer();

        await expect(renderer.render({
            intent: 'flowchart',
            title: 'Wrong Shape',
            nodes: [{ id: 'a', label: 'A' }]
        })).rejects.toThrow(/CircuitSpec/i);
    });
});
