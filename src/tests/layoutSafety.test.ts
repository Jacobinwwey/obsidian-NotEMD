import {
    LAYOUT_SAFETY_VERSION,
    boxesOverlap,
    boundsToCanvas,
    expandBounds,
    measureTextWidth,
    wrapMeasuredText
} from '../diagram/layout/layoutSafety';

describe('layout safety primitives', () => {
    test('uses one deterministic width estimator for wide and narrow glyphs', () => {
        expect(LAYOUT_SAFETY_VERSION).toBe('notemd-layout-safety@1.0.0');
        expect(measureTextWidth('图')).toBeGreaterThan(measureTextWidth('i'));
        expect(measureTextWidth('A M')).toBe(measureTextWidth('A M'));
    });

    test('wraps CJK and long identifiers without exceeding the measured width', () => {
        const block = wrapMeasuredText('数据处理服务区域ABCDEFGHIJKLMN', 80, 3);
        expect(block.lines.length).toBeLessThanOrEqual(3);
        expect(block.lines.every(line => measureTextWidth(line) <= 80)).toBe(true);
    });

    test('truncates only after preserving a bounded number of lines', () => {
        const block = wrapMeasuredText('one two three four five six', 40, 2);
        expect(block.lines).toHaveLength(2);
        expect(block.truncated).toBe(true);
        expect(block.lines[1].endsWith('...')).toBe(true);
        expect(block.lines.every(line => measureTextWidth(line) <= 40)).toBe(true);
    });

    test('detects padded intersections and computes a padded canvas', () => {
        expect(boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 11, y: 0, width: 10, height: 10 }, 2)).toBe(true);
        const bounds = expandBounds({ minX: 10, minY: 20, maxX: 30, maxY: 40 }, { x: -5, y: 5, width: 8, height: 50 });
        expect(boundsToCanvas(bounds, 4)).toEqual({ x: -9, y: 1, width: 43, height: 58 });
    });
});
