import type { EntityRelationshipPayload, ErKey, ErRelationship } from '../diagram/adapters/er/entityRelationship';
import { validateDiagramSpec } from '../diagram/spec';
import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';
import { normalizeDiagramSpecPayload } from '../diagram/payloads/legacyPayload';
import { renderErMermaid } from '../diagram/adapters/mermaid/erAdapter';
import { EditableHtmlSvgRenderer } from '../rendering/renderers/editableHtmlSvgRenderer';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { DrawioRenderer } from '../rendering/renderers/drawioRenderer';
import { MermaidRenderer } from '../rendering/renderers/mermaidRenderer';
import { buildDiagramSpecPrompt } from '../diagram/prompts/diagramSpecPrompt';

import { orderSchema } from './fixtures/entityRelationshipFixture';

describe('ER semantic quality boundary', () => {
    test('accepts and preserves a complete typed schema through the response boundary', () => {
        const source = orderSchema();
        const parsed = normalizeDiagramSpecPayload(parseDiagramSpecResponse(JSON.stringify(source)));
        expect(parsed.payload).toEqual(source.payload);
        expect(validateDiagramSpec(parsed)).toEqual({ valid: true, errors: [] });
    });

    test.each([
        ['dangling FK', (payload: EntityRelationshipPayload) => { payload.entities[1].attributes[1].references!.attribute = 'missing'; }],
        ['duplicate attribute', (payload: EntityRelationshipPayload) => { payload.entities[1].attributes[2].name = 'id'; }],
        ['undeclared relationship end', (payload: EntityRelationshipPayload) => { payload.relationships[0].to = 'missing'; }],
        ['unstated cardinality', (payload: EntityRelationshipPayload) => { delete (payload.relationships[0] as Partial<ErRelationship>).toCardinality; }],
        ['foreign key without target', (payload: EntityRelationshipPayload) => { delete payload.entities[1].attributes[1].references; }],
        ['unknown key role', (payload: EntityRelationshipPayload) => { payload.entities[0].attributes[0].keys = ['MAGIC'] as unknown as ErKey[]; }]
    ])('rejects %s at the semantic boundary', (_label, mutate) => {
        const source = orderSchema();
        mutate(source.payload as EntityRelationshipPayload);
        expect(validateDiagramSpec(source).errors.join(' ')).toMatch(/ER /);
    });

    test('does not permit an ER payload to claim another diagram intent', () => {
        expect(validateDiagramSpec({ ...orderSchema(), intent: 'flowchart' }).errors.join(' ')).toMatch(/ER .*intent/);
    });

    test('retains display labels, SQL types, composite keys and independent relationship ends in Mermaid', () => {
        const source = renderErMermaid(orderSchema());
        expect(source).toContain('客户');
        expect(source).toContain('订单');
        expect(source).toContain('PK,FK');
        expect(source).toContain('decimal(12,2)');
        expect(source).toContain('税后总额');
        expect(source).toContain('||..o{');
    });

    test('does not merge legacy entities whose translated labels sanitize to the same identifier', () => {
        const source = renderErMermaid({ intent: 'erDiagram', title: 'Legacy', nodes: [{ id: 'one', label: '用户' }, { id: 'two', label: '订单' }], edges: [{ from: 'one', to: 'two', relation: 'one-to-many' }] });
        expect(source).toContain('用户');
        expect(source).toContain('订单');
        expect(source).not.toContain('string id');
    });

    test.each([new EditableHtmlSvgRenderer(), new HtmlRenderer(), new DrawioRenderer(), new MermaidRenderer()])('%s preserves ER table semantics in preview', async renderer => {
        const artifact = await renderer.render(orderSchema());
        expect(artifact.previewSvg?.content).toContain('data-er-entity=');
        expect(artifact.previewSvg?.content).toContain('customer_id');
        expect(artifact.previewSvg?.content).toContain('decimal(12,2)');
        expect(artifact.previewSvg?.content).toContain('税后总额');
        expect(artifact.previewSvg?.content).toContain('data-er-cardinality="zero-or-many"');
        expect(artifact.previewSvg?.content.match(/data-er-entity=/g)).toHaveLength(2);
    });

    test('exports Draw.io as entity tables with fields and native cardinality markers', async () => {
        const artifact = await new DrawioRenderer().render(orderSchema());
        expect(artifact.content).toContain('shape=table;');
        expect(artifact.content).toContain('customer_id');
        expect(artifact.content).toContain('startArrow=ERmandOne;');
        expect(artifact.content).toContain('endArrow=ERzeroToMany;');
        expect(artifact.content).toContain('dashed=1;');
    });

    test('asks for source-backed typed ER semantics rather than generic child nodes', () => {
        const prompt = buildDiagramSpecPrompt({ requiredIntent: 'erDiagram' });
        expect(prompt).toContain('"kind": "entity-relationship"');
        expect(prompt).toContain('fromCardinality');
        expect(prompt).toContain('references');
        expect(prompt).toContain('Do not invent primary keys');
    });
});
