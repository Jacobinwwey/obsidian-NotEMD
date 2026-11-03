import { renderSequenceMermaid } from '../diagram/adapters/mermaid/sequenceAdapter';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
import { describeTreeConnectivity } from '../diagram/payloads/sourceStructure';
import type { DiagramSpec } from '../diagram/types';

const sequence: DiagramSpec = { intent: 'sequence', title: 'Request', nodes: [{ id: 'api-gateway', label: 'Gateway A' }, { id: 'api_gateway', label: 'Gateway B' }], edges: [{ from: 'api-gateway', to: 'api_gateway', label: 'request' }] };
const cycle: DiagramSpec = { schemaVersion: 2, intent: 'tree', title: 'Source relations', nodes: [], payload: { kind: 'tree', nodes: [{ id: 'root', label: 'Root' }, { id: 'first', label: 'First', parentId: 'second' }, { id: 'second', label: 'Second', parentId: 'first' }] } };
const handoff: DiagramSpec = { schemaVersion: 2, intent: 'process', title: 'Handoff', nodes: [], payload: { kind: 'lane-grid', lanes: [{ id: 'owner', label: 'Owner' }], steps: [{ id: 'draft', label: 'Draft' }, { id: 'review', label: 'Review' }], cells: [{ laneId: 'owner', stepId: 'draft', title: 'Create' }], edges: [{ from: { laneId: 'owner', stepId: 'draft' }, to: { laneId: 'owner', stepId: 'review' }, label: 'submit' }] } };

test('preserves the reviewed sequence presentation for both short and long reading runs', () => {
    expect(renderSequenceMermaid(sequence)).not.toContain('mirrorActors: false');
    expect(renderSequenceMermaid(sequence)).toContain('participant api_gateway as Gateway A');
    expect(renderSequenceMermaid(sequence)).toContain('participant participant_2 as Gateway B');
    const long = { ...sequence, edges: Array.from({ length: 7 }, () => sequence.edges![0]) };
    expect(renderSequenceMermaid(long)).not.toContain('mirrorActors: false');
    expect(renderSequenceMermaid(long).match(/: request/g)).toHaveLength(7);
});

test('keeps cycle peers on the same level', () => {
    if (cycle.payload?.kind !== 'tree') throw new Error('Tree fixture required');
    const topology = describeTreeConnectivity(cycle.payload);
    expect(topology.levels.get('first')).toBe(topology.levels.get('second'));
    const svg = renderReferenceLayoutSvg(cycle);
    expect(Number(svg.match(/height="([0-9.]+)"/)![1])).toBeLessThanOrEqual(300);
    expect(Number(svg.match(/width="([0-9.]+)"/)![1])).toBeLessThanOrEqual(760);
    const routes = [...svg.matchAll(/id="reference-tree-edge-[0-9]+"[^>]* d="([^"]+)"/g)].map(match => match[1]);
    expect(routes).toHaveLength(2);
    expect(routes.every(route => !route.includes(' V '))).toBe(true);
});

test('keeps cycle descendants below the component regardless of input order', () => {
    const payload = { kind: 'tree' as const, nodes: [{ id: 'leaf', label: 'Leaf', parentId: 'second' }, { id: 'first', label: 'First', parentId: 'second' }, { id: 'second', label: 'Second', parentId: 'first' }] };
    const topology = describeTreeConnectivity(payload);
    expect(topology.levels.get('first')).toBe(0);
    expect(topology.levels.get('second')).toBe(0);
    expect(topology.levels.get('leaf')).toBe(1);
});

test('communicates a missing step once without a large warning banner or oversized row', () => {
    const svg = renderReferenceLayoutSvg(handoff);
    expect(Number(svg.match(/height="([0-9.]+)"/)![1])).toBeLessThanOrEqual(280);
    expect(svg.match(/data-source-notice=/g)).toHaveLength(1);
    expect(svg).toContain('Not provided');
    expect(svg).not.toContain('未提供步骤');
    expect(svg).not.toContain('source handoffs retained');
    expect(svg).not.toContain('#fff7ed" stroke="#c2410c');
    expect(renderReferenceLayoutSvg({ ...handoff, outputLanguage: 'zh-CN' })).toContain('未提供步骤');
});
