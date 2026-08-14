import {
    assignDrawnixRelationLaneGeometry,
    reserveDrawnixRelationLaneSpace
} from '../diagram/adapters/drawnix/drawnixRelationLaneLayout';

describe('Drawnix relation lane layout', () => {
    test('allocates one deterministic row for every requested relation without a cardinality policy', () => {
        const relations = Array.from({ length: 12 }, (_, index) => ({
            relationId: `relation-${index}`,
            sourceId: 'source',
            targetId: 'target',
            labelSize: { width: 132, height: 32 }
        }));

        const reservationLayout = reserveDrawnixRelationLaneSpace({
            forestWidth: 960,
            relations
        });
        const nodes = [
            { id: 'source', rootId: 'root', x: 360, y: 160, width: 148, height: 56 },
            { id: 'target', rootId: 'root', x: 648, y: 360, width: 148, height: 56 }
        ];
        const input = {
            canvasWidth: reservationLayout.width,
            reservations: reservationLayout.reservations,
            relations,
            nodes
        };
        const resolved = assignDrawnixRelationLaneGeometry(input);
        const repeated = assignDrawnixRelationLaneGeometry(input);
        const { lanes } = resolved;

        expect(lanes.map(lane => lane.relationId)).toEqual(relations.map(relation => relation.relationId));
        expect(new Set(lanes.map(lane => lane.y)).size).toBe(relations.length);
        expect(lanes.every(lane => lane.leftTrackX < lane.rightTrackX)).toBe(true);
        expect(repeated).toEqual(resolved);
    });

    test('reserves a same-side corridor outside every placed branch', () => {
        const relations = [{
            relationId: 'same-side',
            sourceId: 'source',
            targetId: 'target',
            labelSize: { width: 132, height: 32 }
        }];
        const reservationLayout = reserveDrawnixRelationLaneSpace({
            forestWidth: 1080,
            relations
        });
        const root = { id: 'root', rootId: 'root', x: 120, y: 260, width: 200, height: 68 };
        const source = { id: 'source', rootId: 'root', x: 520, y: 160, width: 148, height: 56 };
        const target = { id: 'target', rootId: 'root', x: 744, y: 360, width: 148, height: 56 };
        const lane = assignDrawnixRelationLaneGeometry({
            canvasWidth: reservationLayout.width,
            reservations: reservationLayout.reservations,
            relations,
            nodes: [root, source, target]
        }).lanes[0];
        const forestRight = Math.max(...[root, source, target].map(node => node.x + node.width));

        expect(lane.leftTrackX).toBeGreaterThan(forestRight);
        expect(lane.labelBounds?.x).toBeGreaterThanOrEqual(lane.leftTrackX);
        expect((lane.labelBounds?.x ?? 0) + (lane.labelBounds?.width ?? 0))
            .toBeLessThanOrEqual(lane.rightTrackX);
    });

    test('rejects relation geometry that cannot fit within the supplied canvas', () => {
        const nodes = [
            { id: 'source', rootId: 'root', x: 20, y: 120, width: 48, height: 56 },
            { id: 'target', rootId: 'root', x: 132, y: 220, width: 48, height: 56 }
        ];

        expect(() => assignDrawnixRelationLaneGeometry({
            canvasWidth: 200,
            reservations: [{ relationId: 'oversized-label' }],
            relations: [{
                relationId: 'oversized-label',
                sourceId: 'source',
                targetId: 'target',
                labelSize: { width: 400, height: 32 }
            }],
            nodes
        })).toThrow(/cannot reserve a clear routing corridor/i);
    });
});
