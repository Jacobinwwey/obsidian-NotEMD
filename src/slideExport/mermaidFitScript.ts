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

const MERMAID_POST_FIT_VUE_MARKER = 'notemd-mermaid-post-fit';

function createMermaidPostFitVueRuntimeScript(): string {
	return [
		`// ${MERMAID_POST_FIT_VUE_MARKER}:start`,
		'if (typeof window !== "undefined" && typeof document !== "undefined") {',
		...MERMAID_POST_FIT_SCRIPT_SOURCE.split('\n').map(line => `\t${line}`),
		'}',
		`// ${MERMAID_POST_FIT_VUE_MARKER}:end`,
	].join('\n');
}

export function createMermaidPostFitGlobalBottomVue(): string {
	return [
		'<script setup>',
		createMermaidPostFitVueRuntimeScript(),
		'</script>',
		'',
		'<template></template>',
		'',
	].join('\n');
}

export function injectMermaidPostFitIntoVueSfc(source: string): string {
	if (source.includes(MERMAID_POST_FIT_VUE_MARKER)) {
		return source;
	}

	const runtimeScript = createMermaidPostFitVueRuntimeScript();
	const setupScriptMatch = source.match(/<script\s+setup(?:\s[^>]*)?>/i);
	if (setupScriptMatch?.index !== undefined) {
		const insertAt = setupScriptMatch.index + setupScriptMatch[0].length;
		return `${source.slice(0, insertAt)}\n${runtimeScript}\n${source.slice(insertAt)}`;
	}

	const scriptMatch = source.match(/<script(?:\s[^>]*)?>/i);
	if (scriptMatch?.index !== undefined) {
		const insertAt = scriptMatch.index + scriptMatch[0].length;
		return `${source.slice(0, insertAt)}\n${runtimeScript}\n${source.slice(insertAt)}`;
	}

	return `${createMermaidPostFitGlobalBottomVue()}\n${source}`;
}

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
