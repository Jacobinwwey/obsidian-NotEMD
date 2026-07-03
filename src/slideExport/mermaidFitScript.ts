import postFitSource from './mermaidPostFitScript.txt';

/**
 * Browser-side mermaid fit script. Fits each mermaid SVG's height to the
 * remaining vertical space inside its slide container, so a tall diagram no
 * longer overflows the slide. Runs immediately after layout settles and keeps
 * polling so lazy-rendered mermaids on later slides are refitted.
 *
 * Loaded as raw text so the same source is both:
 *  - evaluated in the Playwright convergence pass, so the rendered audit sees
 *    the corrected mermaid heights and the existing table/text/zone splitters
 *    fire on mermaid-induced overflow; and
 *  - injected into the exported standalone HTML for runtime re-fit.
 */
export const MERMAID_POST_FIT_SCRIPT_SOURCE = postFitSource.trim();

export function injectMermaidPostFitIntoHtml(html: string): string {
	if (html.includes('data-notemd-mermaid-post-fit')) {
		return html;
	}

	const scriptTag = `<script data-notemd-mermaid-post-fit="1">${MERMAID_POST_FIT_SCRIPT_SOURCE}\n</script>`;
	// Replace the LAST (real) </body> tag, not earlier occurrences in JS strings.
	const lastBodyIdx = html.lastIndexOf('</body>');
	if (lastBodyIdx >= 0) {
		return html.slice(0, lastBodyIdx) + scriptTag + '\n' + html.slice(lastBodyIdx);
	}
	return `${html}\n${scriptTag}\n`;
}
