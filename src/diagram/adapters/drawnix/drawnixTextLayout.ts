import { measureTextWidth } from '../../layout/layoutSafety';

/** Shared deterministic estimator retained under the legacy Drawnix export. */
export const measureDrawnixText = measureTextWidth;

export function wrapDrawnixText(value: string, maxLineWidth: number): string[] {
    const trimmed = value.trim();
    if (!trimmed) {
        return ['Untitled'];
    }

    const words = trimmed.split(/\s+/);
    const lines: string[] = [];
    let line = '';

    const flushLine = (): void => {
        if (line) {
            lines.push(line);
            line = '';
        }
    };

    const appendLongWord = (word: string): void => {
        let chunk = '';
        for (const character of Array.from(word)) {
            const candidate = chunk + character;
            if (chunk && measureDrawnixText(candidate) > maxLineWidth) {
                lines.push(chunk);
                chunk = character;
            } else {
                chunk = candidate;
            }
        }
        line = chunk;
    };

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (measureDrawnixText(candidate) <= maxLineWidth) {
            line = candidate;
            continue;
        }

        flushLine();
        if (measureDrawnixText(word) <= maxLineWidth) {
            line = word;
            continue;
        }

        appendLongWord(word);
    }

    flushLine();
    return lines;
}
