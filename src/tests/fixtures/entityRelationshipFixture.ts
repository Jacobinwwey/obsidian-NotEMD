import type { DiagramSpec } from '../../diagram/types';

export function orderSchema(): DiagramSpec {
    return {
        schemaVersion: 2, intent: 'erDiagram', title: '订单与客户', nodes: [], edges: [],
        payload: {
            kind: 'entity-relationship',
            entities: [
                { id: 'customer', label: '客户', attributes: [{ name: 'id', type: 'uuid', keys: ['PK'] }] },
                { id: 'order', label: '订单', attributes: [
                    { name: 'id', type: 'uuid', keys: ['PK'] },
                    { name: 'customer_id', type: 'uuid', keys: ['PK', 'FK'], references: { entity: 'customer', attribute: 'id' } },
                    { name: 'amount', type: 'decimal(12,2)', comment: '税后总额' }
                ] }
            ],
            relationships: [{ from: 'customer', to: 'order', label: 'places', fromCardinality: 'one', toCardinality: 'zero-or-many', identifying: false }]
        }
    };
}
