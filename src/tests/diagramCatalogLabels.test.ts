import {
    getExecutableDiagramTypeOptions,
    getLocalizedDiagramTypeLabel
} from '../ui/diagramCatalogLabels';
import { getExecutableDiagramType } from '../diagram/diagramTypeCatalog';

const copy = {
    intentMindmap: 'Mind map',
    intentDrawnixKnowledgeMap: 'Drawnix knowledge map',
    intentFlowchart: 'Flowchart',
    intentSequence: 'Sequence',
    intentClassDiagram: 'Class diagram',
    intentErDiagram: 'ER diagram',
    intentStateDiagram: 'State diagram',
    intentCanvasMap: 'Canvas map',
    intentCircuit: 'Circuit',
    intentDataChart: 'Data chart',
    intentBarChart: 'Bar chart',
    intentLineChart: 'Line chart',
    intentScatterPlot: 'Scatter plot',
    intentRadar: 'Radar',
    intentOrgChart: 'Org chart',
    intentTimeline: 'Timeline',
    intentSwimlane: 'Swimlane',
    intentQuadrant: 'Quadrant',
    intentArchitecture: 'Architecture',
    intentCurrentState: 'Current state',
    intentIntegrationTopology: 'Integration topology',
    intentDataFlow: 'Data flow',
    intentAccessMatrix: 'Access matrix',
    intentGantt: 'Gantt',
    intentLayerStack: 'Layer stack',
    intentSetOverlap: 'Venn',
    intentRankedFunnel: 'Funnel',
    intentLoop: 'Loop',
    intentNested: 'Nested',
    intentTree: 'Tree',
    intentProcess: 'Process',
    intentMedallion: 'Medallion',
    intentHighLevel: 'High-level'
};

describe('diagram catalog UI options', () => {
    test('exposes every catalog type, including distinct quantitative variants', () => {
        const options = getExecutableDiagramTypeOptions(copy);
        const values = options.map(option => option.value);

        expect(options).toHaveLength(33);
        expect(new Set(values).size).toBe(33);
        expect(values).toEqual(expect.arrayContaining(['dataChart', 'bar-chart', 'line-chart', 'scatter-plot']));
        expect(options.find(option => option.value === 'bar-chart')?.label).toBe('Bar chart');
    });

    test('uses a catalog variant label for preview metadata', () => {
        expect(getLocalizedDiagramTypeLabel(getExecutableDiagramType('line-chart'), copy)).toBe('Line chart');
        expect(getLocalizedDiagramTypeLabel(getExecutableDiagramType('data-chart'), copy)).toBe('Data chart');
    });
});
