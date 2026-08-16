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

    test('keeps relations that share an exterior corridor on distinct deterministic rows', () => {
        const relations = [
            { relationId: 'left-first', sourceId: 'a-source', targetId: 'b-target', labelSize: { width: 96, height: 32 } },
            { relationId: 'right', sourceId: 'c-source', targetId: 'd-target', labelSize: { width: 96, height: 32 } },
            { relationId: 'left-second', sourceId: 'a-second-source', targetId: 'b-second-target', labelSize: { width: 96, height: 32 } }
        ];
        const reservationLayout = reserveDrawnixRelationLaneSpace({
            forestWidth: 2300,
            relations
        });
        const nodes = [
            { id: 'a-root', rootId: 'a-root', x: 160, y: 120, width: 180, height: 68 },
            { id: 'a-source', rootId: 'a-root', x: 380, y: 120, width: 136, height: 56 },
            { id: 'a-second-source', rootId: 'a-root', x: 380, y: 224, width: 136, height: 56 },
            { id: 'b-root', rootId: 'b-root', x: 740, y: 120, width: 180, height: 68 },
            { id: 'b-target', rootId: 'b-root', x: 980, y: 120, width: 136, height: 56 },
            { id: 'b-second-target', rootId: 'b-root', x: 980, y: 224, width: 136, height: 56 },
            { id: 'c-root', rootId: 'c-root', x: 1300, y: 120, width: 180, height: 68 },
            { id: 'c-source', rootId: 'c-root', x: 1520, y: 120, width: 136, height: 56 },
            { id: 'd-root', rootId: 'd-root', x: 1860, y: 120, width: 180, height: 68 },
            { id: 'd-target', rootId: 'd-root', x: 2100, y: 120, width: 136, height: 56 }
        ];

        const lanes = assignDrawnixRelationLaneGeometry({
            canvasWidth: reservationLayout.width,
            reservations: reservationLayout.reservations,
            relations,
            nodes
        }).lanes;
        const byId = new Map(lanes.map(lane => [lane.relationId, lane]));

        expect(byId.get('left-first')?.y).not.toBe(byId.get('right')?.y);
        expect(byId.get('left-first')?.y).not.toBe(byId.get('left-second')?.y);
    });

    test('keeps inter-root tracks in one exterior corridor outside the complete router obstacle envelope', () => {
        const relations = [{
            relationId: 'inter-root',
            sourceId: 'left-leaf',
            targetId: 'right-root',
            labelSize: { width: 96, height: 32 }
        }];
        const reservationLayout = reserveDrawnixRelationLaneSpace({
            forestWidth: 1280,
            relations
        });
        const lane = assignDrawnixRelationLaneGeometry({
            canvasWidth: reservationLayout.width,
            reservations: reservationLayout.reservations,
            relations,
            nodes: [
                { id: 'left-root', rootId: 'left-root', x: 120, y: 120, width: 180, height: 68 },
                { id: 'left-leaf', rootId: 'left-root', x: 364, y: 120, width: 136, height: 56 },
                { id: 'right-root', rootId: 'right-root', x: 800, y: 120, width: 180, height: 68 },
                { id: 'right-leaf', rootId: 'right-root', x: 1044, y: 120, width: 136, height: 56 }
            ]
        }).lanes[0];

        const forestLeft = 120;
        const forestRight = 1180;

        const usesWestExteriorCorridor = lane.rightTrackX < forestLeft;
        const usesEastExteriorCorridor = lane.leftTrackX > forestRight;

        expect(usesWestExteriorCorridor || usesEastExteriorCorridor).toBe(true);
        expect(lane.leftTrackX).toBeGreaterThanOrEqual(44);
        expect(lane.rightTrackX).toBeLessThanOrEqual(reservationLayout.width - 44);
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
