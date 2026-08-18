import {
    DRAWNIX_RELATION_LABEL_LINE_HEIGHT,
    measureDrawnixRelationLabel
} from '../diagram/adapters/drawnix/drawnixRelationLabelLayout';

describe('Drawnix relation label layout', () => {
    test('keeps short labels at the minimum native label width', () => {
        expect(measureDrawnixRelationLabel('feeds')).toEqual({
            lines: ['feeds'],
            width: 96,
            height: 32,
            lineHeight: DRAWNIX_RELATION_LABEL_LINE_HEIGHT
        });
    });

    test('uses the same wrapped lines and measured dimensions for long labels', () => {
        const metrics = measureDrawnixRelationLabel('x'.repeat(80));

        expect(metrics.lines.length).toBeGreaterThan(1);
        expect(metrics.width).toBeLessThanOrEqual(288);
        expect(metrics.height).toBe(metrics.lines.length * DRAWNIX_RELATION_LABEL_LINE_HEIGHT + 16);
        expect(metrics.lineHeight).toBe(DRAWNIX_RELATION_LABEL_LINE_HEIGHT);
    });
});
