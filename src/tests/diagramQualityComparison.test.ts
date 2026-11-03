import { renderClassMermaid } from '../diagram/adapters/mermaid/classAdapter';
import { renderSequenceMermaid } from '../diagram/adapters/mermaid/sequenceAdapter';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
import { validateDiagramSpec } from '../diagram/spec';
import type { DiagramSpec } from '../diagram/types';

test('keeps translated class names separate instead of merging both into __', () => {
    const content = renderClassMermaid({ intent: 'classDiagram', title: '领域', nodes: [{ id: 'customer', label: '客户' }, { id: 'order', label: '订单' }], edges: [{ from: 'customer', to: 'order', label: 'places' }] });
    expect(content).toContain('客户');
    expect(content).toContain('订单');
    const names = [...content.matchAll(/class (\w+)/g)].map(match => match[1]);
    expect(new Set(names).size).toBe(2);
});

test('keeps sequence participants separate when sanitized source ids collide', () => {
    const content = renderSequenceMermaid({ intent: 'sequence', title: 'Checkout', nodes: [{ id: 'api-gateway', label: 'Gateway A' }, { id: 'api_gateway', label: 'Gateway B' }], edges: [{ from: 'api-gateway', to: 'api_gateway', label: 'request' }] });
    const names = [...content.matchAll(/participant (\w+) as/g)].map(match => match[1]);
    expect(new Set(names).size).toBe(2);
    expect(content).not.toContain('api_gateway->>api_gateway');
});

test('renders a disconnected cycle with an explicit non-tree notice and all source relationships', () => {
    const spec: DiagramSpec = { schemaVersion: 2, intent: 'tree', title: 'Invalid hierarchy', nodes: [], payload: { kind: 'tree', nodes: [
        { id: 'root', label: 'Root' }, { id: 'first', label: 'First', parentId: 'second' }, { id: 'second', label: 'Second', parentId: 'first' }
    ] } };
    expect(validateDiagramSpec(spec).errors).toEqual([]);
    const svg = renderReferenceLayoutSvg(spec);
    expect(svg).toContain('data-source-notice="tree-connectivity"');
    expect(svg).toContain('reference-tree-node-first');
    expect(svg).toContain('reference-tree-node-second');
    expect(svg.match(/data-source-cycle="true"/g)).toHaveLength(2);
});

test('renders a missing lane endpoint as an explicit unknown rather than a fictional step', () => {
    const spec: DiagramSpec = { schemaVersion: 2, intent: 'process', title: 'Handoff', nodes: [], payload: { kind: 'lane-grid', lanes: [{ id: 'owner', label: 'Owner' }], steps: [{ id: 'draft', label: 'Draft' }, { id: 'review', label: 'Review' }], cells: [{ laneId: 'owner', stepId: 'draft', title: 'Create' }], edges: [{ from: { laneId: 'owner', stepId: 'draft' }, to: { laneId: 'owner', stepId: 'review' }, label: 'submit' }] } };
    expect(validateDiagramSpec(spec).errors).toEqual([]);
    const svg = renderReferenceLayoutSvg(spec);
    expect(svg).toContain('data-source-missing="true"');
    expect(svg).toContain('Not provided');
    expect(svg).toContain('reference-lane-edge-path-0');
});

test('expands a broad tree instead of using negative sibling gaps', () => {
    const spec: DiagramSpec = { schemaVersion: 2, intent: 'tree', title: 'Broad hierarchy', nodes: [], payload: { kind: 'tree', nodes: [{ id: 'root', label: 'Root' }, ...Array.from({ length: 10 }, (_unused, index) => ({ id: 'child_' + index, label: 'Child ' + index, parentId: 'root' }))] } };
    const svg = renderReferenceLayoutSvg(spec);
    const positions = [...svg.matchAll(/id="reference-tree-node-child_\d+"><rect[^>]*?\sx="([\d.-]+)"/g)].map(match => Number(match[1]));
    expect(positions).toHaveLength(10);
    for (let index = 1; index < positions.length; index += 1) expect(positions[index] - positions[index - 1]).toBeGreaterThanOrEqual(194);
});
