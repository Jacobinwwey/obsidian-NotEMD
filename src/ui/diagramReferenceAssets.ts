import architecture from '../assets/diagramReference/architecture.png';
import itCurrentState from '../assets/diagramReference/it-state.png';
import flowchart from '../assets/diagramReference/flowchart.png';
import sequence from '../assets/diagramReference/sequence.png';
import stateMachine from '../assets/diagramReference/state.png';
import erDataModel from '../assets/diagramReference/er.png';
import timeline from '../assets/diagramReference/timeline.png';
import swimlane from '../assets/diagramReference/swimlane.png';
import quadrant from '../assets/diagramReference/quadrant.png';
import radar from '../assets/diagramReference/radar.png';
import loop from '../assets/diagramReference/loop.png';
import nested from '../assets/diagramReference/nested.png';
import tree from '../assets/diagramReference/tree.png';
import orgChart from '../assets/diagramReference/org-chart.png';
import layerStack from '../assets/diagramReference/layers.png';
import venn from '../assets/diagramReference/venn.png';
import pyramidFunnel from '../assets/diagramReference/pyramid.png';
import barChart from '../assets/diagramReference/bar.png';
import lineChart from '../assets/diagramReference/line.png';
import gantt from '../assets/diagramReference/gantt.png';
import scatterPlot from '../assets/diagramReference/scatter.png';
import highLevel from '../assets/diagramReference/high-level.png';
import process from '../assets/diagramReference/process.png';
import medallion from '../assets/diagramReference/medallion.png';
import dataFlow from '../assets/diagramReference/data-flow.png';
import dpIntegration from '../assets/diagramReference/dp-integration.png';
import dpSecurityMatrix from '../assets/diagramReference/dp-security-matrix.png';

const DIAGRAM_REFERENCE_ASSETS: Readonly<Record<string, string>> = {
    architecture,
    'it-current-state': itCurrentState,
    flowchart,
    sequence,
    'state-machine': stateMachine,
    'er-data-model': erDataModel,
    timeline,
    swimlane,
    quadrant,
    radar,
    loop,
    nested,
    tree,
    'org-chart': orgChart,
    'layer-stack': layerStack,
    venn,
    'pyramid-funnel': pyramidFunnel,
    'bar-chart': barChart,
    'line-chart': lineChart,
    gantt,
    'scatter-plot': scatterPlot,
    'high-level': highLevel,
    process,
    medallion,
    'data-flow': dataFlow,
    'dp-integration': dpIntegration,
    'dp-security-matrix': dpSecurityMatrix
};

export function getDiagramReferenceAsset(assetId: string): string | undefined {
    return DIAGRAM_REFERENCE_ASSETS[assetId];
}

export function hasDiagramReferenceAsset(assetId: string): boolean {
    return typeof getDiagramReferenceAsset(assetId) === 'string';
}
