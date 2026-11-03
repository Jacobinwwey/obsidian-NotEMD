import type { DiagramSpec } from '../../types';
import { resolveEntityRelationship, type ErAttribute, type ErCardinality } from '../er/entityRelationship';
import { assertMermaidSpecIntent, indent, mermaidFence } from './base';

function quoted(text: string): string {
    return '"' + text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\r\n]/g, ' ') + '"';
}

function renderAttribute(attribute: ErAttribute): string {
    const word = /^[*A-Za-z_\u00c0-\uffff][A-Za-z0-9_\u00c0-\uffff.*(),[\]-]*$/;
    if (!word.test(attribute.name)) {
        throw new Error('Mermaid ER cannot represent attribute name "' + attribute.name + '" losslessly. Select editable HTML/SVG or Draw.io.');
    }
    const type = attribute.type && word.test(attribute.type) ? attribute.type : 'unknown';
    const detail = [attribute.type && type === 'unknown' ? 'SQL type: ' + attribute.type : '', attribute.comment,
        attribute.references ? 'FK: ' + attribute.references.entity + '.' + attribute.references.attribute : ''].filter(Boolean).join(' · ');
    return indent(2) + type + ' ' + attribute.name + (attribute.keys?.length ? ' ' + attribute.keys.join(',') : '') + (detail ? ' ' + quoted(detail) : '');
}

function cardinality(cardinalityValue: ErCardinality, endpoint: 'from' | 'to'): string {
    if (cardinalityValue === 'unspecified') {
        throw new Error('Mermaid ER requires explicit endpoint cardinality. Confirm it from the source or select editable HTML/SVG or Draw.io to show ?; cardinality is never guessed.');
    }
    const from = { one: '||', 'zero-or-one': '|o', 'one-or-many': '}|', 'zero-or-many': '}o' };
    const to = { one: '||', 'zero-or-one': 'o|', 'one-or-many': '|{', 'zero-or-many': 'o{' };
    return endpoint === 'from' ? from[cardinalityValue] : to[cardinalityValue];
}

export function renderErMermaid(spec: DiagramSpec): string {
    assertMermaidSpecIntent(spec, ['erDiagram'], 'ErMermaidAdapter');
    const payload = resolveEntityRelationship(spec);
    if (spec.payload?.kind === 'entity-relationship' && payload.relationships.some(relationship => relationship.identifying === undefined)) {
        throw new Error('Mermaid ER cannot encode unspecified identifying status. Confirm it from the source or select editable HTML/SVG or Draw.io; identifying relationships are never guessed.');
    }
    const names = new Map<string, string>();
    const used = new Set<string>();
    const lines = ['erDiagram'];
    payload.entities.forEach((entity, index) => {
        const candidate = spec.payload?.kind === 'entity-relationship' ? 'er_' + entity.id : entity.label.toUpperCase();
        let name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate) && !used.has(candidate) ? candidate : 'er_entity_' + (index + 1);
        while (used.has(name)) name += '_';
        used.add(name);
        names.set(entity.id, name);
        lines.push(indent(1) + name + '[' + quoted(entity.label) + ']');
        lines.push(indent(1) + name + ' {', ...entity.attributes.map(renderAttribute), indent(1) + '}');
    });
    payload.relationships.forEach(relationship => {
        const relation = cardinality(relationship.fromCardinality, 'from') + (relationship.identifying === false ? '..' : '--') + cardinality(relationship.toCardinality, 'to');
        const label = relationship.label ?? 'relates_to';
        lines.push(indent(1) + names.get(relationship.from) + ' ' + relation + ' ' + names.get(relationship.to) + ' : ' + (/^[A-Za-z0-9_]+$/.test(label) ? label : quoted(label)));
    });
    return mermaidFence(lines);
}
