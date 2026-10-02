import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';
import { assertValidDiagramSpec } from '../diagram/spec';

describe('structured summary input boundary', () => {
    test('preserves quoted evidence and every Nested scope in the reading export', async () => {
        const spec = parseDiagramSpecResponse(JSON.stringify({
            schemaVersion: 2, intent: 'nested', title: '中文 café', nodes: [], edges: [],
            evidenceRefs: ['原始引文', { id: 'e1', quote: '保留 <引文> 与 café' }],
            payload: { kind: 'nested', levels: [{ id: 'a', label: '外层范围' }, { id: 'b', label: '中间范围' }, { id: 'c', label: '核心范围', sub: '完整保留' }] }
        }));
        expect(spec.evidenceRefs).toEqual(['原始引文', '保留 <引文> 与 café']);
        const html = (await new HtmlRenderer().render(spec)).content;
        for (const label of ['外层范围', '中间范围', '核心范围', '完整保留', '保留 &lt;引文&gt; 与 café']) expect(html).toContain(label);
        expect(html).not.toContain('[object Object]');
        expect(html).not.toContain('No structural nodes');
    });

    test('rejects unrecognized evidence objects at the parsing boundary', () => {
        expect(() => parseDiagramSpecResponse(JSON.stringify({ intent: 'flowchart', title: 'Test', nodes: [], evidenceRefs: [{ unrelated: 7 }] }))).toThrow(/evidence/i);
    });

    test('direct renderer inputs must establish the string evidence invariant', () => {
        expect(() => assertValidDiagramSpec({ intent: 'flowchart', title: 'Test', nodes: [{ id: 'a', label: 'A' }], evidenceRefs: [{}] } as any)).toThrow(/evidence/i);
    });
});
