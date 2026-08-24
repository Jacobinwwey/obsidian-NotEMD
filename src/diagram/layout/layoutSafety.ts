/**
 * Deterministic geometry primitives shared by diagram renderers.
 *
 * Browser font metrics are not available while a diagram is being generated,
 * so renderers must use one conservative estimator before emitting geometry.
 * The estimator intentionally gives CJK and other wide glyphs more room and
 * splits long no-space tokens; this is safer than allowing a browser to clip
 * an otherwise valid label after the artifact has been persisted.
 */
export const LAYOUT_SAFETY_VERSION = 'notemd-layout-safety@1.0.0';

export interface LayoutRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface MeasuredTextBlock {
    lines: string[];
    width: number;
    height: number;
    truncated: boolean;
}

export interface LayoutBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function measureTextWidth(value: string): number {
    return Array.from(value).reduce((total, character) => total + measureCharacter(character), 0);
}

export function textExceedsWidth(value: string | undefined, maxWidth: number): boolean {
    const trimmed = value?.trim();
    return Boolean(trimmed) && measureTextWidth(trimmed) > Math.max(8, maxWidth);
}

function measureCharacter(character: string): number {
    if (/\s/.test(character)) return 4;
    if ((character.codePointAt(0) ?? 0) > 0x7f) return 15;
    if (/[MW@%]/.test(character)) return 14;
    if (/[mw#&]/.test(character)) return 12;
    if (/[A-Z0-9]/.test(character)) return 11;
    return 8;
}

function splitLongToken(token: string, maxWidth: number): string[] {
    const chunks: string[] = [];
    let chunk = '';
    for (const character of Array.from(token)) {
        const candidate = `${chunk}${character}`;
        if (chunk && measureTextWidth(candidate) > maxWidth) {
            chunks.push(chunk);
            chunk = character;
        } else {
            chunk = candidate;
        }
    }
    if (chunk) chunks.push(chunk);
    return chunks.length > 0 ? chunks : [''];
}

/** Wrap by measured width, including identifiers and CJK text without spaces. */
export function wrapMeasuredText(value: string | undefined, maxWidth: number, maxLines = 3): MeasuredTextBlock {
    const trimmed = value?.trim() || 'Untitled';
    const safeWidth = Math.max(8, maxWidth);
    const tokens = trimmed.split(/\s+/).flatMap(token => splitLongToken(token, safeWidth));
    const lines: string[] = [];
    let current = '';

    for (const token of tokens) {
        const candidate = current ? `${current} ${token}` : token;
        if (current && measureTextWidth(candidate) > safeWidth) {
            lines.push(current);
            current = token;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);

    const boundedLineCount = Math.max(1, maxLines);
    const truncated = lines.length > boundedLineCount;
    const visible = lines.slice(0, boundedLineCount);
    if (truncated) {
        const last = visible[visible.length - 1] || '';
        const ellipsis = '...';
        let shortened = last;
        while (shortened && measureTextWidth(`${shortened}${ellipsis}`) > safeWidth) {
            shortened = Array.from(shortened).slice(0, -1).join('');
        }
        visible[visible.length - 1] = `${shortened || ellipsis}${shortened ? ellipsis : ''}`;
    }

    return {
        lines: visible,
        width: Math.min(safeWidth, Math.max(...visible.map(measureTextWidth), 0)),
        height: visible.length * 16,
        truncated
    };
}

export function boxesOverlap(first: LayoutRect, second: LayoutRect, padding = 0): boolean {
    return first.x - padding < second.x + second.width
        && first.x + first.width + padding > second.x
        && first.y - padding < second.y + second.height
        && first.y + first.height + padding > second.y;
}

export function expandBounds(bounds: LayoutBounds, rect: LayoutRect): LayoutBounds {
    return {
        minX: Math.min(bounds.minX, rect.x),
        minY: Math.min(bounds.minY, rect.y),
        maxX: Math.max(bounds.maxX, rect.x + rect.width),
        maxY: Math.max(bounds.maxY, rect.y + rect.height)
    };
}

export function boundsToCanvas(bounds: LayoutBounds, padding = 24): { x: number; y: number; width: number; height: number } {
    const safePadding = Math.max(0, padding);
    return {
        x: Math.floor(bounds.minX - safePadding),
        y: Math.floor(bounds.minY - safePadding),
        width: Math.ceil(bounds.maxX - bounds.minX + safePadding * 2),
        height: Math.ceil(bounds.maxY - bounds.minY + safePadding * 2)
    };
}
