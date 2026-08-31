import { LAYOUT_SAFETY_VERSION } from '../../diagram/layout/layoutSafety';

export interface SvgSafetyDiagnostic {
    severity: 'warning' | 'error';
    kind: 'svg-malformed' | 'svg-missing-viewport' | 'svg-empty';
    message: string;
}

export interface SvgSafetyResult {
    svg: string;
    diagnostics: SvgSafetyDiagnostic[];
}

export interface SvgPresentationDiagnostic {
    kind: 'svg-text-overlap' | 'svg-text-occluded';
    message: string;
}

interface PresentationRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function isPresentationSurface(element: Element): boolean {
    return element.classList.contains('ref-canvas')
        || element.classList.contains('notemd-canvas-surface')
        || (typeof (element as Element & { hasAttribute?: (name: string) => boolean }).hasAttribute === 'function'
            && ((element as Element).hasAttribute('data-nested-scope-surface')
                || (element as Element).hasAttribute('data-nested-tag-surface')));
}

function presentationRect(element: Element): PresentationRect | null {
    const candidate = element as Element & { getBoundingClientRect?: () => DOMRect };
    if (typeof candidate.getBoundingClientRect !== 'function') return null;
    const rect = candidate.getBoundingClientRect();
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
        || rect.width <= 0 || rect.height <= 0) return null;
    return rect;
}

export function assertMountedSvgPresentationSafety(root: ParentNode, source: string): void {
    const svg = root.querySelector?.('svg');
    if (!svg) {
        throw new Error(`${source} mounted SVG presentation gate found no SVG element.`);
    }
    const rootRect = presentationRect(svg);
    const visibleTextElements = Array.from(svg.querySelectorAll?.('text') ?? [])
        .filter(element => !element.closest('title,desc,defs'));
    const textNodes = visibleTextElements
        .map(element => presentationRect(element))
        .filter((rect): rect is PresentationRect => rect !== null);
    if (!rootRect || (visibleTextElements.length > 0 && textNodes.length === 0)) {
        throw new Error(`${source} mounted SVG presentation gate could not measure visible geometry.`);
    }
    assertSvgPresentationSafety(root, source);
}

function presentationRectsOverlap(first: PresentationRect, second: PresentationRect, padding = 0): boolean {
    return first.x - padding < second.x + second.width
        && first.x + first.width + padding > second.x
        && first.y - padding < second.y + second.height
        && first.y + first.height + padding > second.y;
}

/**
 * Browser-side final presentation check shared by preview consumers. Runtime
 * validators can prove that markup exists, but only a mounted SVG can expose
 * text boxes that collide after fonts, CSS, and browser scaling are applied.
 */
export function collectSvgPresentationDiagnostics(root: ParentNode): SvgPresentationDiagnostic[] {
    const svg = root.querySelector?.('svg');
    if (!svg) return [];
    const textNodes = Array.from(svg.querySelectorAll?.('text') ?? [])
        .map(element => ({ element, rect: presentationRect(element), text: (element.textContent ?? '').trim() }))
        .filter(item => item.rect && item.text && !item.element.closest('title,desc,defs')) as Array<{ element: Element; rect: PresentationRect; text: string }>;
    const diagnostics: SvgPresentationDiagnostic[] = [];
    for (let index = 0; index < textNodes.length; index += 1) {
        for (const other of textNodes.slice(index + 1)) {
            if (presentationRectsOverlap(textNodes[index].rect, other.rect, 0.5)) {
                diagnostics.push({
                    kind: 'svg-text-overlap',
                    message: `Mounted SVG labels overlap: "${textNodes[index].text}" / "${other.text}".`
                });
            }
        }
    }
    const shapes = Array.from(svg.querySelectorAll?.('rect,circle,ellipse,polygon,image') ?? [])
        .map(element => ({ element, rect: presentationRect(element) }))
        .filter(item => item.rect && !isPresentationSurface(item.element)) as Array<{ element: Element; rect: PresentationRect }>;
    for (const text of textNodes) {
        for (const shape of shapes) {
            if (text.element.contains(shape.element) || shape.element.contains(text.element)) continue;
            const relation = text.element.compareDocumentPosition?.(shape.element) ?? 0;
            const shapePaintedAfterText = (relation & 4) !== 0;
            if (shapePaintedAfterText && presentationRectsOverlap(text.rect, shape.rect, 1)) {
                diagnostics.push({
                    kind: 'svg-text-occluded',
                    message: `Mounted SVG shape may occlude label "${text.text}".`
                });
            }
        }
    }
    return diagnostics;
}

export function assertSvgPresentationSafety(root: ParentNode, source: string): void {
    const diagnostics = collectSvgPresentationDiagnostics(root);
    if (diagnostics.length > 0) {
        throw new Error(`${source} mounted SVG failed presentation safety: ${diagnostics.map(diagnostic => diagnostic.message).join(' ')}`);
    }
}

function hasPositiveViewport(svg: string): boolean {
    const root = svg.match(/<svg\b([^>]*)>/i)?.[1] ?? '';
    const viewBox = root.match(/\bviewBox\s*=\s*["']\s*[-+0-9.eE]+[\s,]+[-+0-9.eE]+[\s,]+([-+0-9.eE]+)[\s,]+([-+0-9.eE]+)\s*["']/i);
    if (viewBox) {
        const width = Number(viewBox[1]);
        const height = Number(viewBox[2]);
        return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
    }
    const width = Number((root.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').replace(/px$/i, ''));
    const height = Number((root.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').replace(/px$/i, ''));
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

export function applySvgSafetyContract(svg: string, source: string): SvgSafetyResult {
    const diagnostics: SvgSafetyDiagnostic[] = [];
    if (!/<svg\b[\s\S]*<\/svg>/i.test(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-malformed', message: `${source} preview runtime returned malformed SVG markup.` });
        return { svg, diagnostics };
    }
    if (!hasPositiveViewport(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-missing-viewport', message: `${source} preview SVG has no positive viewBox or intrinsic dimensions.` });
    }
    if (!/<(?:g|path|rect|circle|ellipse|polygon|polyline|line|text|image|use|foreignObject)\b/i.test(svg)) {
        diagnostics.push({ severity: 'error', kind: 'svg-empty', message: `${source} preview SVG contains no drawable content.` });
    }
    const marker = `data-layout-safety="${LAYOUT_SAFETY_VERSION}" data-layout-safety-owner="runtime"`;
    const normalized = svg.replace(/<svg\b([^>]*)>/i, (match, attributes: string) => {
        if (/\bdata-layout-safety\s*=/.test(attributes)) return match;
        return `<svg${attributes} ${marker}>`;
    });
    return { svg: normalized, diagnostics };
}

export function assertSvgSafetyContract(svg: string, source: string): string {
    const result = applySvgSafetyContract(svg, source);
    const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error');
    if (errors.length > 0) {
        throw new Error(errors.map(diagnostic => diagnostic.message).join(' '));
    }
    return result.svg;
}
