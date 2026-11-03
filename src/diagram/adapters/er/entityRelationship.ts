import type { DiagramSpec } from '../../types';

export const ER_CARDINALITIES = ['one', 'zero-or-one', 'one-or-many', 'zero-or-many', 'unspecified'] as const;
export type ErCardinality = typeof ER_CARDINALITIES[number];
export type ErKey = 'PK' | 'FK' | 'UK';

export interface ErAttribute {
    name: string;
    type?: string;
    keys?: ErKey[];
    comment?: string;
    references?: { entity: string; attribute: string };
}

export interface ErEntity {
    id: string;
    label: string;
    attributes: ErAttribute[];
}

export interface ErRelationship {
    from: string;
    to: string;
    label?: string;
    fromCardinality: ErCardinality;
    toCardinality: ErCardinality;
    identifying?: boolean;
}

export interface EntityRelationshipPayload {
    kind: 'entity-relationship';
    entities: ErEntity[];
    relationships: ErRelationship[];
}

function isRecord(input: unknown): input is Record<string, unknown> {
    return Boolean(input && typeof input === 'object' && !Array.isArray(input));
}

function hasText(input: unknown): input is string {
    return typeof input === 'string' && input.trim().length > 0;
}

export function validateEntityRelationshipPayload(input: unknown): string[] {
    const errors: string[] = [];
    if (!isRecord(input) || !Array.isArray(input.entities) || !Array.isArray(input.relationships)) {
        return ['ER payload requires entities and relationships arrays.'];
    }
    if (input.entities.length < 1 || input.entities.length > 128 || input.relationships.length > 256) {
        errors.push('ER payload requires 1 to 128 entities and at most 256 relationships; split larger schemas into explicit views.');
    }
    const attributesByEntity = new Map<string, Set<string>>();
    for (const entity of input.entities) {
        if (!isRecord(entity) || !hasText(entity.id) || !hasText(entity.label) || !Array.isArray(entity.attributes)) {
            errors.push('ER entity requires a stable id, label and attributes array.');
            continue;
        }
        if (attributesByEntity.has(entity.id)) errors.push('ER entity id "' + entity.id + '" is duplicated.');
        const names = new Set<string>();
        attributesByEntity.set(entity.id, names);
        if (entity.attributes.length > 128) errors.push('ER entity has more than 128 attributes; use explicit schema views.');
        for (const attribute of entity.attributes) {
            if (!isRecord(attribute) || !hasText(attribute.name)) {
                errors.push('ER attribute requires a non-empty name.');
                continue;
            }
            if (names.has(attribute.name)) errors.push('ER attribute "' + entity.id + '.' + attribute.name + '" is duplicated.');
            names.add(attribute.name);
            if (attribute.type !== undefined && !hasText(attribute.type)) errors.push('ER attribute type must be non-empty when supplied.');
            if (attribute.comment !== undefined && typeof attribute.comment !== 'string') errors.push('ER attribute comment must be text.');
            if (attribute.keys !== undefined && (!Array.isArray(attribute.keys)
                || attribute.keys.some(key => !['PK', 'FK', 'UK'].includes(key)) || new Set(attribute.keys).size !== attribute.keys.length)) {
                errors.push('ER attribute keys must contain unique PK, FK or UK roles.');
            }
            if (Array.isArray(attribute.keys) && attribute.keys.includes('FK') && !isRecord(attribute.references)) {
                errors.push('ER foreign key "' + entity.id + '.' + attribute.name + '" requires references.');
            }
        }
    }
    for (const entity of input.entities) {
        if (!isRecord(entity) || !Array.isArray(entity.attributes)) continue;
        for (const attribute of entity.attributes) {
            if (!isRecord(attribute) || attribute.references === undefined) continue;
            const reference = attribute.references;
            if (!isRecord(reference) || !hasText(reference.entity) || !hasText(reference.attribute)
                || !attributesByEntity.get(reference.entity)?.has(reference.attribute)) {
                errors.push('ER attribute reference must resolve to a declared entity and attribute.');
            }
        }
    }
    for (const relationship of input.relationships) {
        if (!isRecord(relationship) || !hasText(relationship.from) || !hasText(relationship.to)
            || !attributesByEntity.has(relationship.from) || !attributesByEntity.has(relationship.to)) {
            errors.push('ER relationship must reference declared entity ids.');
            continue;
        }
        for (const endpoint of ['fromCardinality', 'toCardinality']) {
            if (!(ER_CARDINALITIES as readonly unknown[]).includes(relationship[endpoint])) {
                errors.push('ER relationship requires explicit ' + endpoint + '; use unspecified when the source is silent.');
            }
        }
        if (relationship.label !== undefined && typeof relationship.label !== 'string') errors.push('ER relationship label must be text.');
        if (relationship.identifying !== undefined && typeof relationship.identifying !== 'boolean') errors.push('ER identifying must be a boolean when supplied.');
    }
    return errors;
}

const LEGACY_CARDINALITIES: Record<string, [ErCardinality, ErCardinality]> = {
    'one-to-one': ['one', 'one'],
    'one-to-many': ['one', 'zero-or-many'],
    'many-to-one': ['zero-or-many', 'one'],
    'many-to-many': ['zero-or-many', 'zero-or-many']
};

export function resolveEntityRelationship(spec: DiagramSpec): EntityRelationshipPayload {
    if (spec.payload?.kind === 'entity-relationship') return spec.payload;
    return {
        kind: 'entity-relationship',
        entities: spec.nodes.map(node => ({
            id: node.id, label: node.label,
            attributes: (node.children ?? []).map(child => ({ name: child.label, type: child.kind }))
        })),
        relationships: (spec.edges ?? []).map(edge => {
            const cardinalities = LEGACY_CARDINALITIES[edge.relation?.toLowerCase() ?? ''] ?? ['one', 'zero-or-many'];
            return { from: edge.from, to: edge.to, label: edge.label ?? edge.relation,
                fromCardinality: cardinalities[0], toCardinality: cardinalities[1] };
        })
    };
}

export function escapeErText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
