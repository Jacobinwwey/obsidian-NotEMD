import type { DrawnixPoint } from './drawnixMindMapProjection';

export interface DrawnixRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function inflateDrawnixRect(rect: DrawnixRect, clearance: number): DrawnixRect {
    return {
        x: rect.x - clearance,
        y: rect.y - clearance,
        width: rect.width + clearance * 2,
        height: rect.height + clearance * 2
    };
}

export function drawnixRectanglesOverlap(left: DrawnixRect, right: DrawnixRect): boolean {
    return left.x < right.x + right.width
        && left.x + left.width > right.x
        && left.y < right.y + right.height
        && left.y + left.height > right.y;
}

export function pointOnDrawnixPolyline(points: readonly DrawnixPoint[], position: number): DrawnixPoint {
    if (points.length === 0) {
        return [0, 0];
    }
    if (points.length === 1) {
        return points[0];
    }

    const lengths = points.slice(1).map((point, index) => {
        const start = points[index];
        return Math.abs(point[0] - start[0]) + Math.abs(point[1] - start[1]);
    });
    const totalLength = lengths.reduce((total, length) => total + length, 0);
    if (totalLength <= 0) {
        return points[0];
    }

    let remaining = totalLength * Math.max(0, Math.min(1, position));
    for (const [index, length] of lengths.entries()) {
        if (remaining <= length || index === lengths.length - 1) {
            const start = points[index];
            const end = points[index + 1];
            if (length <= 0) {
                return start;
            }
            const ratio = Math.max(0, Math.min(1, remaining / length));
            return [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio
            ];
        }
        remaining -= length;
    }

    return points[points.length - 1];
}
