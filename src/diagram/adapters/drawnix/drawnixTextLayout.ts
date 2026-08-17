/**
 * Deterministic text geometry used by the native projection. This is an
 * intentionally conservative estimator, not a browser font measurement: the
 * same inputs must produce identical node, header, and relation geometry in
 * SVG and Drawnix serialization paths.
 */
export function measureDrawnixText(value: string): number {
    return Array.from(value).reduce((total, character) => total + measureDrawnixCharacter(character), 0);
}

function measureDrawnixCharacter(character: string): number {
    if (/\s/.test(character)) {
        return 4;
    }
    if ((character.codePointAt(0) ?? 0) > 0x7f) {
        return 15;
    }
    if (/[MW@%]/.test(character)) {
        return 14;
    }
    if (/[mw#&]/.test(character)) {
        return 12;
    }
    if (/[A-Z0-9]/.test(character)) {
        return 11;
    }
    return 8;
}

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
