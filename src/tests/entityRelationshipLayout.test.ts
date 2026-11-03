import { buildEntityRelationshipScene, erSegmentCrossesTable } from '../diagram/adapters/er/entityRelationshipLayout';
import { collectEditableSvgAnnotationGaps } from '../rendering/renderers/editableHtmlSvgRenderer';
import { renderEntityRelationshipSvg } from '../diagram/adapters/er/entityRelationshipSvg';
import { exportEntityRelationshipDrawio } from '../diagram/adapters/er/entityRelationshipDrawio';
import { renderErMermaid } from '../diagram/adapters/mermaid/erAdapter';
import { generateDiagramArtifact } from '../diagram/diagramGenerationService';
import type { EntityRelationshipPayload } from '../diagram/adapters/er/entityRelationship';
import { orderSchema } from './fixtures/entityRelationshipFixture';

function schemaPayload(): EntityRelationshipPayload {
    return orderSchema().payload as EntityRelationshipPayload;
}

test('keeps fields within annotated entity ownership and exports XML newlines losslessly', () => {
    const scene = buildEntityRelationshipScene(orderSchema());
    expect(collectEditableSvgAnnotationGaps(renderEntityRelationshipSvg(scene))).toEqual([]);
    expect(exportEntityRelationshipDrawio(scene)).toContain('customer_id&#10;customer.id');
});

test('routes self references, parallel relationships and long crossing links outside every table', () => {
    const payload = schemaPayload();
    payload.entities.push(...Array.from({ length: 7 }, (_unused, index) => ({ id: 'extra_' + index, label: 'Entity ' + index, attributes: [{ name: 'id', type: 'uuid' }] })));
    payload.relationships.push(
        { from: 'customer', to: 'customer', label: 'parent account', fromCardinality: 'zero-or-one', toCardinality: 'zero-or-many' },
        { from: 'customer', to: 'order', label: 'billing contact', fromCardinality: 'one', toCardinality: 'one-or-many' },
        { from: 'extra_6', to: 'extra_0', label: '跨越中间实体的长关联说明', fromCardinality: 'one', toCardinality: 'zero-or-many' }
    );
    const scene = buildEntityRelationshipScene({ ...orderSchema(), payload });
    for (const connection of scene.connections) {
        expect(connection.points.length).toBeGreaterThanOrEqual(2);
        for (let index = 1; index < connection.points.length; index += 1) {
            const start = connection.points[index - 1];
            const end = connection.points[index];
            expect(start.x === end.x || start.y === end.y).toBe(true);
            for (const table of scene.tables) expect(erSegmentCrossesTable(start, end, table)).toBe(false);
        }
    }
    expect(scene.tables.find(table => table.id === 'extra_5')!.height).toBe(84);
});

test('shows unknown semantics natively and refuses to invent them for Mermaid', () => {
    const payload = schemaPayload();
    payload.relationships[0].toCardinality = 'unspecified';
    const spec = { ...orderSchema(), payload };
    expect(renderEntityRelationshipSvg(buildEntityRelationshipScene(spec))).toContain('data-er-cardinality="unspecified"');
    expect(() => renderErMermaid(spec)).toThrow(/cardinality.*HTML\/SVG/);
    payload.relationships[0].toCardinality = 'zero-or-many';
    delete payload.relationships[0].identifying;
    expect(() => renderErMermaid(spec)).toThrow(/identifying status/);
    expect(renderEntityRelationshipSvg(buildEntityRelationshipScene(spec))).toContain('stroke-dasharray="2 5"');
});

test('preserves the typed schema through generation, renderer selection and preview without a live LLM', async () => {
    const spec = orderSchema();
    const llmInvoker = jest.fn(async () => JSON.stringify(spec));
    const generated = await generateDiagramArtifact('# Orders\nCustomer has zero or more orders.', { compatibilityMode: 'best-fit', requestedIntent: 'erDiagram', requestedRenderTarget: 'editable-html-svg', llmInvoker });
    expect(generated.spec.payload).toEqual(spec.payload);
    expect(generated.artifact.target).toBe('editable-html-svg');
    expect(generated.artifact.previewSvg!.content).toContain('decimal(12,2)');
    expect(llmInvoker).toHaveBeenCalledTimes(1);
});

test('does not reject a measured wide ER title using the unrelated fixed-card title budget', async () => {
    const spec = { ...orderSchema(), title: 'A complete source-backed schema title '.repeat(8) };
    const generated = await generateDiagramArtifact('# Schema', { compatibilityMode: 'best-fit', requestedIntent: 'erDiagram', requestedRenderTarget: 'editable-html-svg', llmInvoker: async () => JSON.stringify(spec) });
    expect(generated.artifact.target).toBe('editable-html-svg');
    expect(generated.artifact.previewSvg!.content).toContain(spec.title.trim());
});
