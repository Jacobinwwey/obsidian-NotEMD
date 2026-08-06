/** Shared typography contract for SVG previews and vector PDF export. */
export const PREVIEW_FONT_FAMILY = 'NotoSansSC';
export const PREVIEW_FONT_STACK = `"${PREVIEW_FONT_FAMILY}", "Segoe UI", Arial, sans-serif`;

function normalizeCssFontFamilyDeclarations(css: string): string {
    return css.replace(
        /font-family\s*:\s*[^;}]+/gi,
        `font-family: ${PREVIEW_FONT_STACK}`
    );
}

function escapeXmlAttributeValue(value: string, quote: string): string {
    return quote === '"'
        ? value.replace(/"/g, '&quot;')
        : value.replace(/'/g, '&apos;');
}

export function normalizeSvgFontFamilyDeclarations(svg: string): string {
    let normalized = svg.replace(
        /\sfont-family\s*=\s*(["'])[^"']*\1/gi,
        ` font-family="${PREVIEW_FONT_FAMILY}"`
    );
    normalized = normalized.replace(
        /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
        (_match, open: string, css: string, close: string) => (
            `${open}${normalizeCssFontFamilyDeclarations(css)}${close}`
        )
    );
    normalized = normalized.replace(
        /(\sstyle\s*=\s*)(["'])([\s\S]*?)\2/gi,
        (_match, prefix: string, quote: string, css: string) => {
            const normalizedCss = normalizeCssFontFamilyDeclarations(css);
            return `${prefix}${quote}${escapeXmlAttributeValue(normalizedCss, quote)}${quote}`;
        }
    );

    return normalized.replace(/<svg\b([^>]*)>/i, (rootTag, attributes: string) => {
        if (/\sfont-family\s*=/.test(attributes)) {
            return rootTag;
        }
        return `<svg font-family="${PREVIEW_FONT_FAMILY}"${attributes}>`;
    });
}
