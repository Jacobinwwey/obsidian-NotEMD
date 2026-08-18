import {
    drawnixRectanglesOverlap,
    drawnixPolylineLength,
    inflateDrawnixRect,
    pointOnDrawnixPolyline
} from '../diagram/adapters/drawnix/drawnixGeometry';

describe('Drawnix geometry primitives', () => {
    test('inflates rectangles without changing their center', () => {
        expect(inflateDrawnixRect({ x: 10, y: 20, width: 30, height: 40 }, 6)).toEqual({
            x: 4,
            y: 14,
            width: 42,
            height: 52
        });
    });

    test('uses strict interior overlap so touching obstacle edges remain valid', () => {
        const obstacle = { x: 10, y: 10, width: 20, height: 20 };

        expect(drawnixRectanglesOverlap(
            { x: 30, y: 10, width: 8, height: 8 },
            obstacle
        )).toBe(false);
        expect(drawnixRectanglesOverlap(
            { x: 29.99, y: 10, width: 8, height: 8 },
            obstacle
        )).toBe(true);
    });

    test('places native relation labels by measured orthogonal path length', () => {
        const points: [number, number][] = [[0, 0], [10, 0], [10, 20]];

        expect(drawnixPolylineLength(points)).toBe(30);
        expect(pointOnDrawnixPolyline(points, 0)).toEqual([0, 0]);
        expect(pointOnDrawnixPolyline(points, 0.25)).toEqual([7.5, 0]);
        expect(pointOnDrawnixPolyline(points, 0.75)).toEqual([10, 12.5]);
        expect(pointOnDrawnixPolyline(points, 1)).toEqual([10, 20]);
    });
});
