import { sanitizeSvgForHost } from './svgHostSanitizer';
import { resolveSvgDimensions } from './pngPreview';

/** Resolve author CSS before svg2pdf, whose selector splitter predates :is/:where. */
export function resolvePdfSvgStyles(root: Element): Element {
    if (!root.querySelector('style')) return root;

    const hostDocument = document;
    const safeSvg = sanitizeSvgForHost(root.outerHTML, hostDocument);
    const dimensions = resolveSvgDimensions(safeSvg);
    const frame = hostDocument.createElement('iframe');
    // An isolated document supplies the browser cascade without Obsidian/theme CSS.
    // Only sanitized SVG enters it; scripts and navigation are not permitted.
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${dimensions.width}px;height:${dimensions.height}px;visibility:hidden;border:0;`;
    hostDocument.body.appendChild(frame);
    try {
        const isolatedDocument = frame.contentDocument;
        const view = frame.contentWindow;
        if (!isolatedDocument || !view) throw new Error('PDF export could not create an isolated SVG style document.');
        isolatedDocument.body.style.margin = '0';
        const template = isolatedDocument.createElement('template');
        template.innerHTML = safeSvg;
        isolatedDocument.body.appendChild(template.content);
        const svg = isolatedDocument.querySelector('svg')!;
        const styles = Array.from(svg.querySelectorAll('style'));
        const rules: CSSStyleRule[] = [];
        const tokenProperty = (property: string) => `--notemd-pdf-${property}`;
        for (const style of styles) {
            for (const rule of Array.from(style.sheet?.cssRules ?? [])) {
                if (rule.type === 1) {
                    rules.push(rule as CSSStyleRule);
                }
            }
        }
        const elements = [svg, ...Array.from(svg.querySelectorAll<SVGElement>('*'))]
            .filter(element => element.localName !== 'style')
            .map(element => ({ element, rules: rules.filter(rule => element.matches(rule.selectorText)) }));
        const propertiesByRule = new Map(rules.map(rule => [rule, Array.from(rule.style)]));
        // Mirror declarations as custom-property tokens in the same rules: the
        // browser resolves specificity/importance while preserving currentColor,
        // relative units and inheritance for <use> instances. Eagerly copying all
        // computed properties would freeze definitions to their uninstanced colors.
        // The generated token wrapper keeps CSS-wide keywords from becoming custom-
        // property inheritance instructions. It is not a source-CSS parser.
        for (const rule of rules) {
            for (const property of propertiesByRule.get(rule)!) {
                rule.style.setProperty(tokenProperty(property), `notemd(${rule.style.getPropertyValue(property)})`, rule.style.getPropertyPriority(property));
            }
        }
        const declarations = elements.map(({ element, rules: matched }) => {
            const computed = view.getComputedStyle(element);
            const properties = new Set(matched.flatMap(rule => propertiesByRule.get(rule)!));
            const resolved: Array<readonly [string, string]> = [];
            for (const property of properties) {
                const inline = element.style.getPropertyValue(property);
                if (inline && (element.style.getPropertyPriority(property) === 'important'
                    || !matched.some(rule => rule.style.getPropertyPriority(property) === 'important'))) continue;
                const token = computed.getPropertyValue(tokenProperty(property)).trim();
                const value = token.startsWith('notemd(') && token.endsWith(')')
                    ? token.slice(7, -1) : computed.getPropertyValue(property);
                resolved.push([property, value]);
            }
            return { element, styles: resolved };
        });
        for (const { element, styles: resolved } of declarations) {
            for (const [property, value] of resolved) element.style.setProperty(property, value);
        }
        for (const style of styles) style.remove();
        return root.ownerDocument.importNode(svg, true);
    } finally {
        frame.remove();
    }
}
