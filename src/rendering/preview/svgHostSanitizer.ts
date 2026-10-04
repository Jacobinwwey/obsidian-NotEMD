import { sanitizeSvgForExport } from './pngPreview';
import createDOMPurify from 'dompurify';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SAFE_RASTER_URI = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;

const STATIC_SVG_PROPERTIES = new Set(('fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color display visibility font font-family font-size font-style font-weight font-variant font-stretch line-height letter-spacing word-spacing text-anchor text-decoration dominant-baseline alignment-baseline baseline-shift white-space direction unicode-bidi writing-mode paint-order vector-effect shape-rendering text-rendering image-rendering marker marker-start marker-mid marker-end clip-path clip-rule mask filter stop-color stop-opacity flood-color flood-opacity lighting-color transform transform-origin transform-box rx ry').split(' '));

function safeCssDeclaration(style: CSSStyleDeclaration): void {
    for (const name of Array.from(style)) {
        const value = style.getPropertyValue(name);
        // CSS escapes can disguise URLs/expressions. Static SVGs do not need
        // positioned overlays, executable CSS or resources outside the graphic.
        if (!STATIC_SVG_PROPERTIES.has(name) || /\\|expression\s*\(|javascript:|@import/i.test(value)
            || /^(?:position|z-index|behavior|-moz-binding|animation(?:-.+)?|transition(?:-.+)?)$/i.test(name)
            || Array.from(value.matchAll(/url\(([^)]*)\)/gi)).some(match => !/^\s*['"]?#[a-z0-9_.:-]+['"]?\s*$/i.test(match[1]))) {
            style.removeProperty(name);
        }
    }
}

function scopeSvgStyles(svg: SVGSVGElement, document: Document): void {
    const scope = 'notemd-' + Math.random().toString(36).slice(2);
    svg.setAttribute('data-notemd-svg-scope', scope);
    const anchor = '[data-notemd-svg-scope="' + scope + '"]';
    const Sheet = document.defaultView?.CSSStyleSheet;
    for (const element of Array.from(svg.querySelectorAll('style')).filter(style => style.closest('svg') === svg)) {
        if (!Sheet) { element.remove(); continue; }
        const sheet = new Sheet();
        try {
            // Keep the validated source selector separately from the receiving scope.
            // Reopen/export cycles must rebind authority without nesting prior wrappers.
            sheet.replaceSync(element.getAttribute('data-notemd-source-css') ?? element.textContent ?? '');
            // Only static style rules belong to the diagram. Imports, font-face,
            // keyframes and document rules cannot acquire host-level authority.
            const sourceRules: string[] = [];
            element.textContent = Array.from(sheet.cssRules).flatMap(rule => {
                if (rule.type !== 1) return [];
                const declaration = rule as CSSStyleRule;
                safeCssDeclaration(declaration.style);
                if (!declaration.style.cssText) return [];
                // A previous sanitation pass may have scoped this rule. Rebind it
                // to this receiving boundary; input scope identifiers have no authority.
                const selectorText = declaration.selectorText.replace(/\[data-notemd-svg-scope\s*=\s*["'][^"']*["']\s*\]/gi, anchor);
                sourceRules.push(selectorText + ' {' + declaration.style.cssText + '}');
                const selector = ':is(' + selectorText + ')';
                return [anchor + selector + ', ' + anchor + ' ' + selector + ' {' + declaration.style.cssText + '}'];
            }).join('\n');
            element.setAttribute('data-notemd-source-css', sourceRules.join('\n'));
        } catch { element.remove(); }
    }
}

/** Untrusted SVGs gain DOM authority only through this browser boundary. */
export function sanitizeSvgForHost(svgSource: string, document: Document): string {
    const view = document.defaultView;
    if (!view) throw new Error('SVG sanitization requires a browser document.');
    const purifier = createDOMPurify(view);
    const xml = new view.DOMParser().parseFromString(sanitizeSvgForExport(svgSource).replace(/<svg\b([^>]*)>/i, (tag, attributes: string) => /\bxmlns\s*=/.test(attributes) ? tag : '<svg xmlns="' + SVG_NAMESPACE + '"' + attributes + '>'), 'image/svg+xml');
    if (xml.querySelector('parsererror')) throw new Error('Preview contains malformed SVG.');
    const fragment = purifier.sanitize(xml.documentElement, {
        USE_PROFILES: { svg: true, svgFilters: true }, ADD_TAGS: ['use'], RETURN_DOM_FRAGMENT: true,
        FORBID_TAGS: ['foreignObject', 'script', 'iframe', 'object', 'embed', 'a', 'animate', 'animateMotion', 'animateTransform', 'set'],
        FORBID_ATTR: ['xml:base', 'target']
    });
    const svg = fragment.querySelector('svg');
    if (!svg || svg.namespaceURI !== SVG_NAMESPACE) throw new Error('Preview contains no safe SVG.');
    // Include the root: querySelectorAll alone misses root events/resources.
    for (const element of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.localName.toLowerCase();
            const value = attribute.value.trim();
            if (name === 'href' || name === 'src') {
                const internal = /^#[a-z0-9_.:-]+$/i.test(value);
                const raster = element.localName === 'image' && SAFE_RASTER_URI.test(value);
                if (!internal && !raster) element.removeAttributeNode(attribute);
            } else if (/^on/i.test(name)
                || (name !== 'style' && name !== 'data-notemd-source-css' && /url\(/i.test(value) && !/^url\(\s*['"]?#[a-z0-9_.:-]+['"]?\s*\)$/i.test(value))) {
                element.removeAttributeNode(attribute);
            }
        }
        if ('style' in element) safeCssDeclaration((element as SVGElement).style);
    }
    for (const graphic of [svg, ...Array.from(svg.querySelectorAll('svg'))]) scopeSvgStyles(graphic as SVGSVGElement, document);
    return svg.outerHTML;
}

export function mountDiagramSvg(container: HTMLElement, svg: string): void {
    // The receiving document owns parsing and adoption, including popout realms.
    const document = container.ownerDocument;
    const template = document.createElement('template');
    template.innerHTML = sanitizeSvgForHost(svg, document);
    container.replaceChildren(template.content);
}
