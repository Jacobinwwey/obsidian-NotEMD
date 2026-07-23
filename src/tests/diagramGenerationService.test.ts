import { generateDiagramArtifact } from '../diagram/diagramGenerationService';
import { RendererRegistry } from '../rendering/rendererRegistry';
import { RendererService } from '../rendering/rendererService';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { DiagramRenderer } from '../rendering/types';
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

describe('diagram generation service', () => {
    test('generates mermaid content through the experimental pipeline when spec output is valid', async () => {
        const artifact = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate version' },
                    { id: 'publish', label: 'Publish release' }
                ],
                edges: [
                    { from: 'validate', to: 'publish', label: 'pass' }
                ]
            })
        });

        expect(artifact.plan.legacyCompatibilityMode).toBe(true);
        expect(artifact.artifact.target).toBe('mermaid');
        expect(artifact.artifact.content).toContain('flowchart TD');
    });

    test('throws when the LLM response cannot be parsed into a valid diagram spec', async () => {
        await expect(generateDiagramArtifact('# Notes', {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => 'not-json'
        })).rejects.toThrow(/Unable to parse DiagramSpec/i);
    });

    test('coerces unsupported legacy-mermaid intents into a mermaid-compatible artifact', async () => {
        const artifact = await generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [
                    { id: 'week-1', label: 'Week 1: 12' },
                    { id: 'week-2', label: 'Week 2: 19' }
                ],
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 }
                        ]
                    }
                ]
            })
        });

        expect(artifact.plan.legacyCompatibilityMode).toBe(true);
        expect(artifact.spec.intent).toBe('mindmap');
        expect(artifact.artifact.target).toBe('mermaid');
        expect(artifact.artifact.content).toContain('mindmap');
    });

    test('drops chart-only layout hints when legacy-mermaid compatibility coerces data charts', async () => {
        const artifact = await generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'legacy-mermaid',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [
                    { id: 'week-1', label: 'Week 1: 12' },
                    { id: 'week-2', label: 'Week 2: 19' }
                ],
                layoutHints: { chartType: 'pie' },
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 }
                        ]
                    }
                ]
            })
        });

        expect(artifact.plan.legacyCompatibilityMode).toBe(true);
        expect(artifact.spec.intent).toBe('mindmap');
        expect(artifact.spec.layoutHints?.chartType).toBeUndefined();
        expect(artifact.artifact.target).toBe('mermaid');
    });

    test('falls back to html when the preferred renderer fails in best-fit mode', async () => {
        const failingMermaidRenderer: DiagramRenderer = {
            id: 'failing-mermaid',
            target: 'mermaid',
            supports: (spec) => spec.intent === 'flowchart',
            render: async () => {
                throw new Error('mermaid parse failed');
            }
        };
        const rendererService = new RendererService(new RendererRegistry([
            failingMermaidRenderer,
            new HtmlRenderer()
        ]));

        const result = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            rendererService,
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate version' },
                    { id: 'publish', label: 'Publish release' }
                ],
                edges: [
                    { from: 'validate', to: 'publish', label: 'pass' }
                ]
            })
        });

        expect(result.plan.fallbackTargets).toContain('html');
        expect(result.artifact.target).toBe('html');
        expect(result.artifact.content).toContain('Release Flow');
    });

    test('honors an editable HTML/SVG render target override in best-fit artifact mode', async () => {
        const result = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'best-fit',
            requestedRenderTarget: 'editable-html-svg',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate version' },
                    { id: 'publish', label: 'Publish release' }
                ],
                edges: [
                    { from: 'validate', to: 'publish', label: 'pass' }
                ]
            })
        });

        expect(result.plan.renderTarget).toBe('editable-html-svg');
        expect(result.plan.fallbackTargets).toContain('mermaid');
        expect(result.artifact.target).toBe('editable-html-svg');
        expect(result.artifact.content).toContain('data-notemd-renderer="notemd-editable-html-svg@0.1.0"');
    });

    test('honors the Draw.io render target override with an SVG companion', async () => {
        for (const requestedRenderTarget of ['drawio'] as const) {
            const result = await generateDiagramArtifact(`# Runtime Flow

Client sends work to a queue-backed worker.
`, {
                compatibilityMode: 'best-fit',
                requestedRenderTarget,
                targetLanguage: 'en',
                llmInvoker: async () => JSON.stringify({
                    intent: 'flowchart',
                    title: 'Runtime Flow',
                    nodes: [
                        { id: 'client', label: 'Client', kind: 'actor' },
                        { id: 'worker', label: 'Worker', kind: 'processor' }
                    ],
                    edges: [
                        { from: 'client', to: 'worker', label: 'queue job', relation: 'async' }
                    ]
                })
            });

            expect(result.plan.renderTarget).toBe(requestedRenderTarget);
            expect(result.artifact.target).toBe(requestedRenderTarget);
            expect(result.artifact.previewSvg?.content).toContain('<svg');
        }
    });

    test('generates a Drawnix knowledge map through its dedicated intent and prompt profile', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'drawnixMindmap',
            title: 'Runtime knowledge map',
            nodes: [
                {
                    id: 'runtime',
                    label: 'Runtime',
                    children: [
                        { id: 'llm', label: 'LLM' },
                        { id: 'artifacts', label: 'Artifacts' }
                    ]
                }
            ],
            edges: []
        }));

        const result = await generateDiagramArtifact('# Runtime', {
            compatibilityMode: 'best-fit',
            requestedRenderTarget: 'drawnix',
            targetLanguage: 'en',
            llmInvoker
        });

        expect(result.plan.intent).toBe('drawnixMindmap');
        expect(result.plan.renderTarget).toBe('drawnix');
        expect(result.artifact.target).toBe('drawnix');
        expect(JSON.parse(result.artifact.content).elements[0]).toMatchObject({
            type: 'mindmap',
            id: 'runtime'
        });
        expect(result.artifact.previewSvg?.content).toContain('notemd-drawnix-mindmap-svg@1.0.0');
        expect(llmInvoker.mock.calls[0][0]).toMatch(/Target: editable Drawnix knowledge map/i);
    });

    test('falls back without flattening when a Drawnix knowledge-map response violates its tree contract', async () => {
        const result = await generateDiagramArtifact('# Runtime', {
            compatibilityMode: 'best-fit',
            requestedRenderTarget: 'drawnix',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'drawnixMindmap',
                title: 'Invalid map',
                nodes: [
                    { id: 'first', label: 'First root' },
                    { id: 'second', label: 'Second root' }
                ],
                edges: []
            })
        });

        expect(result.artifact.target).toBe('mermaid');
        expect(result.renderError).toMatch(/exactly one root/i);
        expect(result.artifact.content).toContain('mindmap');
    });

    test('honors circuitikz render target overrides with TeX source and svg companion', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify(createCircuitDiagramSpec()));

        const result = await generateDiagramArtifact(`# CMOS Inverter

Draw a circuitikz schematic with PMOS pull-up, NMOS pull-down, VDD, GND, vin, and vout.
`, {
            compatibilityMode: 'best-fit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'en',
            llmInvoker
        });

        expect(result.plan.renderTarget).toBe('circuitikz');
        expect(result.plan.fallbackTargets).toEqual([]);
        expect(result.spec.intent).toBe('circuit');
        expect(result.artifact.target).toBe('circuitikz');
        expect(result.artifact.content).toContain('\\begin{circuitikz}');
        expect(result.artifact.previewSvg?.content).toContain('<svg');
        expect(llmInvoker.mock.calls[0][0]).toMatch(/circuitSpec/i);
    });

    test('keeps legacy-mermaid output pinned even when a render target override is provided', async () => {
        const result = await generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'legacy-mermaid',
            requestedRenderTarget: 'editable-html-svg',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [
                    { id: 'validate', label: 'Validate version' },
                    { id: 'publish', label: 'Publish release' }
                ],
                edges: [
                    { from: 'validate', to: 'publish', label: 'pass' }
                ]
            })
        });

        expect(result.plan.legacyCompatibilityMode).toBe(true);
        expect(result.plan.renderTarget).toBe('mermaid');
        expect(result.artifact.target).toBe('mermaid');
    });

    test('rejects unsupported data chart layout hints before renderer fallback', async () => {
        await expect(generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [],
                layoutHints: { chartType: 'radar' },
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 }
                        ]
                    }
                ]
            })
        })).rejects.toThrow(/unsupported chartType/i);
    });

    test('rejects unsupported diagram intents before renderer fallback', async () => {
        await expect(generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'radarChart',
                title: 'Weekly Signups',
                nodes: [{ id: 'metrics', label: 'Metrics' }]
            })
        })).rejects.toThrow(/unsupported diagram intent/i);
    });

    test('injects planner chart defaults when the LLM omits chartType', async () => {
        const result = await generateDiagramArtifact(`# Weekly Signups

| Week | Signups |
| --- | --- |
| 1 | 12 |
| 2 | 19 |
| 3 | 27 |
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups',
                nodes: [],
                dataSeries: [
                    {
                        id: 'signups',
                        label: 'Signups',
                        points: [
                            { x: 'Week 1', y: 12 },
                            { x: 'Week 2', y: 19 },
                            { x: 'Week 3', y: 27 }
                        ]
                    }
                ]
            })
        });

        expect(result.plan.preferredChartType).toBe('line');
        expect(result.spec.layoutHints?.chartType).toBe('line');
        expect(JSON.parse(result.artifact.content).mark).toBe('line');
    });

    test('normalizes incomplete chart series metadata before validation', async () => {
        const result = await generateDiagramArtifact(`# Weekly Signups Snapshot

- Monday: 12
- Tuesday: 18
- Wednesday: 9
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Weekly Signups Snapshot',
                nodes: [],
                dataSeries: [
                    {
                        values: [
                            { label: 'Monday', value: '12' },
                            { label: 'Tuesday', value: 18 },
                            { label: 'Wednesday', value: '9' }
                        ]
                    }
                ]
            })
        });

        expect(result.spec.dataSeries).toEqual([
            {
                id: 'weekly-signups-snapshot',
                label: 'Weekly Signups Snapshot',
                points: [
                    { x: 'Monday', y: 12, series: 'Weekly Signups Snapshot' },
                    { x: 'Tuesday', y: 18, series: 'Weekly Signups Snapshot' },
                    { x: 'Wednesday', y: 9, series: 'Weekly Signups Snapshot' }
                ]
            }
        ]);
        expect(result.artifact.target).toBe('vega-lite');
    });

    test('fails fast when the LLM intent escapes the planner render family in best-fit mode', async () => {
        await expect(generateDiagramArtifact(`# Traffic Mix

Organic share: 40%
Paid share: 25%
Referral share: 35%
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Traffic Mix',
                nodes: [{ id: 'mix', label: 'Traffic mix' }]
            })
        })).rejects.toThrow(/does not match planner route "dataChart"/i);
    });

    test('retries then fails when LLM ignores an explicit requested intent', async () => {
        await expect(generateDiagramArtifact(`# Release Checklist

1. Validate version
2. If checks pass, publish release
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'sequence',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'flowchart',
                title: 'Release Flow',
                nodes: [{ id: 'validate', label: 'Validate version' }]
            })
        })).rejects.toThrow(/does not match requested intent "sequence"/i);
    });

    test('falls back to the constrained CMOS inverter template when the LLM ignores an explicit circuit intent', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'mindmap',
            title: 'CMOS Inverter Notes',
            nodes: [{ id: 'topic', label: 'CMOS inverter' }]
        }));

        const result = await generateDiagramArtifact(`
现在用 tikz 写一个 CMOS 反相器
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'circuit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'zh-CN',
            llmInvoker
        });

        expect(llmInvoker).toHaveBeenCalledTimes(2);
        expect(result.spec.intent).toBe('circuit');
        expect(result.spec.circuitSpec?.circuitKind).toBe('cmos-inverter');
        expect(result.spec.circuitSpec?.goldenReferenceId).toBe('cmos-inverter-v1');
        expect(result.artifact.target).toBe('circuitikz');
        expect(result.artifact.content).toContain('\\begin{circuitikz}');
        expect(result.artifact.previewSvg?.content).toContain('<svg');
    });

    test('falls back to a constrained circuit template when the LLM returns an invalid CircuitSpec', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'circuit',
            title: 'Common-source NMOS amplifier',
            nodes: [],
            circuitSpec: {
                circuitKind: 'common-source-amplifier',
                goldenReferenceId: 'common-source-nmos-v1',
                components: [],
                connections: []
            }
        }));

        const result = await generateDiagramArtifact(`
请生成一个共源 NMOS 放大器电路图：VDD 经过漏极电阻 RD 接到 NMOS M1 的漏极，输出 vout 从漏极节点引出；源极接地；输入 vin 接栅极。
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'circuit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'zh-CN',
            llmInvoker
        });

        expect(llmInvoker).toHaveBeenCalledTimes(1);
        expect(result.spec.circuitSpec?.goldenReferenceId).toBe('common-source-nmos-v1');
        expect(result.artifact.content).toContain('\\usepackage{circuitikz}');
        expect(result.artifact.content).toContain('\\begin{document}');
        expect(result.artifact.content).toContain('\\begin{circuitikz}');
        expect(result.artifact.content).toContain('\\end{document}');
    });

    test('falls back before JSON parsing when the model returns raw circuitikz TeX', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(String.raw`\begin{circuitikz}[american voltages]
\draw (3,5) node[vcc]{$V_{DD}$} to[R, l=$R_D$] (3,3);
\end{circuitikz}`);

        const result = await generateDiagramArtifact(`
Draw a common-source NMOS amplifier: VDD through RD to the drain, vout at the drain, vin at the gate, and source to ground.
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'circuit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'en',
            llmInvoker
        });

        expect(result.spec.circuitSpec?.goldenReferenceId).toBe('common-source-nmos-v1');
        expect(result.artifact.content).toContain('\\usepackage{circuitikz}');
        expect(result.artifact.content).toContain('\\begin{circuitikz}');
    });

    test('does not substitute a golden circuit template for an unsupported circuit request', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'mindmap',
            title: 'Operational Amplifier Notes',
            nodes: [{ id: 'topic', label: 'operational amplifier' }]
        }));

        await expect(generateDiagramArtifact(`
Draw a two-stage operational amplifier with frequency compensation in circuitikz.
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'circuit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'en',
            llmInvoker
        })).rejects.toThrow(/does not match requested intent "circuit"/i);

        expect(llmInvoker).toHaveBeenCalledTimes(2);
    });

    test('uses the latest explicit supported circuit request when falling back from an ignored LLM response', async () => {
        const llmInvoker = jest.fn().mockResolvedValue(JSON.stringify({
            intent: 'mindmap',
            title: 'Circuit Notes',
            nodes: [{ id: 'topic', label: 'circuit notes' }]
        }));

        const result = await generateDiagramArtifact(`
Earlier notes mention a CMOS NAND gate and its pull-down network.

Now draw a CMOS inverter in circuitikz.
`, {
            compatibilityMode: 'best-fit',
            requestedIntent: 'circuit',
            requestedRenderTarget: 'circuitikz',
            targetLanguage: 'en',
            llmInvoker
        });

        expect(result.spec.circuitSpec?.circuitKind).toBe('cmos-inverter');
        expect(result.spec.circuitSpec?.goldenReferenceId).toBe('cmos-inverter-v1');
    });

    test('rejects ambiguous multi-series pie specs before renderer fallback', async () => {
        await expect(generateDiagramArtifact(`# Traffic Mix

Organic share: 40%
Paid share: 25%
`, {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async () => JSON.stringify({
                intent: 'dataChart',
                title: 'Traffic Mix',
                nodes: [],
                layoutHints: { chartType: 'pie' },
                dataSeries: [
                    {
                        id: 'current',
                        label: 'Current',
                        points: [{ x: 'Organic', y: 40 }]
                    },
                    {
                        id: 'previous',
                        label: 'Previous',
                        points: [{ x: 'Paid', y: 25 }]
                    }
                ]
            })
        })).rejects.toThrow(/single data series/i);
    });
});
