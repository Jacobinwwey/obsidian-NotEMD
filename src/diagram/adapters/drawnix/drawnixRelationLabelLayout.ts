import { measureDrawnixText, wrapDrawnixText } from './drawnixTextLayout';

export interface DrawnixRelationLabelSize {
    width: number;
    height: number;
}

export interface DrawnixRelationLabelMetrics extends DrawnixRelationLabelSize {
    lines: string[];
    lineHeight: number;
}

export const DRAWNIX_RELATION_LABEL_MAX_TEXT_WIDTH = 264;
export const DRAWNIX_RELATION_LABEL_HORIZONTAL_PADDING = 12;
export const DRAWNIX_RELATION_LABEL_VERTICAL_PADDING = 8;
export const DRAWNIX_RELATION_LABEL_LINE_HEIGHT = 16;

/**
 * Computes the one label geometry contract shared by lane reservation and
 * projection. Keeping wrapping and measured dimensions together prevents a
 * route from reserving space for a different label shape than the renderer
 * eventually places.
 */
export function measureDrawnixRelationLabel(label: string): DrawnixRelationLabelMetrics {
    const lines = wrapDrawnixText(label, DRAWNIX_RELATION_LABEL_MAX_TEXT_WIDTH);
    const largestLineWidth = Math.max(...lines.map(measureDrawnixText));
    const width = Math.max(
        96,
        Math.min(
            DRAWNIX_RELATION_LABEL_MAX_TEXT_WIDTH + DRAWNIX_RELATION_LABEL_HORIZONTAL_PADDING * 2,
            largestLineWidth + DRAWNIX_RELATION_LABEL_HORIZONTAL_PADDING * 2
        )
    );
    const height = lines.length * DRAWNIX_RELATION_LABEL_LINE_HEIGHT
        + DRAWNIX_RELATION_LABEL_VERTICAL_PADDING * 2;
    return {
        lines,
        width,
        height,
        lineHeight: DRAWNIX_RELATION_LABEL_LINE_HEIGHT
    };
}
