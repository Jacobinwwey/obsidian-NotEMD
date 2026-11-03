import { createRequire } from 'module';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';
import { renderReferenceLayoutSvg } from '../diagram/adapters/editableSvg/referenceLayoutRenderer';
import { validateDiagramSpec } from '../diagram/spec';
import { diagnoseDiagramLayout } from '../diagram/layout/layoutDiagnostics';
import type { DiagramSpec } from '../diagram/types';
const { getDiagramAcceptanceCases } = createRequire(__filename)('../../scripts/lib/diagram-acceptance-cases');

test.each(['tree-cycle', 'lane-handoff'])('generates an exportable %s diagram with visible source caveats, not a blocking panel', async id => {
    const entry = getDiagramAcceptanceCases().find((candidate: { id: string }) => candidate.id === id);
    const spec = entry.afterSpec as DiagramSpec;
    const original = JSON.stringify(spec);
    const generated = await generateDiagramArtifact('Source-backed recovery fixture', {
        compatibilityMode: 'best-fit', requestedIntent: spec.intent, requestedRenderTarget: 'editable-html-svg',
        llmInvoker: jest.fn(async () => JSON.stringify(spec))
    });
    expect(generated.artifact.target).toBe('editable-html-svg');
    expect(generated.artifact.previewSvg?.content).toContain('data-source-notice=');
    expect(generated.artifact.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ severity: 'warning', kind: 'source-structure' })]));
    expect(JSON.stringify(spec)).toBe(original);
});

test('preserves a rootless cycle and a self relation without recursion or hidden nodes', () => {
    const spec: DiagramSpec = { schemaVersion: 2, intent: 'tree', title: 'Source relations', nodes: [], payload: { kind: 'tree', nodes: [
        { id: 'first', label: 'First', parentId: 'second' }, { id: 'second', label: 'Second', parentId: 'first' }, { id: 'self', label: 'Self', parentId: 'self' }
    ] } };
    expect(validateDiagramSpec(spec).errors).toEqual([]);
    const svg = renderReferenceLayoutSvg(spec);
    expect(svg.match(/id="reference-tree-node-/g)).toHaveLength(3);
    expect(svg.match(/id="reference-tree-edge-/g)).toHaveLength(3);
    expect(svg.match(/data-source-cycle="true"/g)).toHaveLength(3);
    expect(svg).not.toContain('NaN');
});

test('shows a forest honestly and still rejects an unknown lane coordinate', () => {
    const forest: DiagramSpec = { schemaVersion: 2, intent: 'tree', title: 'Two roots', nodes: [], payload: { kind: 'tree', nodes: [{ id: 'first', label: 'First' }, { id: 'second', label: 'Second' }] } };
    expect(validateDiagramSpec(forest).errors).toEqual([]);
    expect(diagnoseDiagramLayout(forest)).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'source-structure', severity: 'warning' })]));
    const entry = getDiagramAcceptanceCases().find((candidate: { id: string }) => candidate.id === 'lane-handoff');
    const malformed = JSON.parse(JSON.stringify(entry.afterSpec));
    malformed.payload.edges[0].to.stepId = 'undeclared-coordinate';
    expect(validateDiagramSpec(malformed).errors.join(' ')).toContain('unknown cell coordinate');
});
