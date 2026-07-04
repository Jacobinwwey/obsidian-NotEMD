import * as vm from 'vm';
import {
	injectMermaidPostFitIntoHtml,
	injectMermaidPostFitIntoVueSfc,
	MERMAID_POST_FIT_SCRIPT_SOURCE,
} from '../slideExport/mermaidFitScript';

describe('mermaid post-fit runtime script', () => {
	test('upscales small rendered Mermaid SVGs within the slide viewport', () => {
		const attributes = new Map<string, string>([
			['viewBox', '0 0 320 180'],
		]);
		const svg = {
			hasAttribute: (name: string) => attributes.has(name),
			getAttribute: (name: string) => attributes.get(name) ?? null,
			setAttribute: (name: string, value: string) => attributes.set(name, value),
			removeAttribute: (name: string) => attributes.delete(name),
			getBoundingClientRect: () => ({ width: 320, height: 180 }),
		};
		const slide = {
			clientWidth: 1280,
			clientHeight: 720,
			matches: (selector: string) => selector.includes('.slidev-page'),
			getBoundingClientRect: () => ({ top: 0, bottom: 720, height: 720 }),
			parentElement: null,
		};
		const host = {
			shadowRoot: {
				querySelector: (selector: string) => selector === 'svg' ? svg : null,
			},
			getBoundingClientRect: () => ({ top: 96, width: 320, height: 180 }),
			parentElement: slide,
		};

		vm.runInNewContext(MERMAID_POST_FIT_SCRIPT_SOURCE, {
			window: {},
			document: {
				querySelectorAll: (selector: string) => selector === '.mermaid' ? [host] : [],
			},
			WeakSet,
			isFinite,
			parseFloat,
			Math,
			String,
			setTimeout: () => undefined,
			setInterval: () => undefined,
		});

		expect(Number(attributes.get('height'))).toBeGreaterThan(180);
	});

	test('centers Mermaid hosts even when the natural SVG size already fits', () => {
		const attributes = new Map<string, string>([
			['viewBox', '0 0 920 500'],
		]);
		const svg = {
			hasAttribute: (name: string) => attributes.has(name),
			getAttribute: (name: string) => attributes.get(name) ?? null,
			setAttribute: (name: string, value: string) => attributes.set(name, value),
			removeAttribute: (name: string) => attributes.delete(name),
			getBoundingClientRect: () => ({ width: 920, height: 500 }),
		};
		const slide = {
			clientWidth: 1000,
			clientHeight: 500,
			matches: (selector: string) => selector.includes('.slidev-page'),
			getBoundingClientRect: () => ({ top: 0, bottom: 500, height: 500 }),
			parentElement: null,
		};
		const host = {
			shadowRoot: {
				querySelector: (selector: string) => selector === 'svg' ? svg : null,
			},
			style: {} as Record<string, string>,
			getBoundingClientRect: () => ({ top: 0, width: 920, height: 500 }),
			parentElement: slide,
		};

		vm.runInNewContext(MERMAID_POST_FIT_SCRIPT_SOURCE, {
			window: {},
			document: {
				querySelectorAll: (selector: string) => selector === '.mermaid' ? [host] : [],
			},
			WeakSet,
			isFinite,
			parseFloat,
			Math,
			String,
			setTimeout: () => undefined,
			setInterval: () => undefined,
		});

		expect(host.style.display).toBe('flex');
		expect(host.style.justifyContent).toBe('center');
	});

	test('upgrades stale Vue SFC runtime blocks instead of leaving old post-fit logic in prepared decks', () => {
		const staleSource = [
			'<script setup>',
			'// notemd-mermaid-post-fit:start',
			'const staleMermaidRuntime = true;',
			'// notemd-mermaid-post-fit:end',
			'</script>',
			'',
			'<template></template>',
		].join('\n');

		const injected = injectMermaidPostFitIntoVueSfc(staleSource);

		expect(injected).toContain('querySelectorAll(".mermaid")');
		expect(injected).toContain('justifyContent = "center"');
		expect(injected).not.toContain('staleMermaidRuntime');
		expect(injected.match(/notemd-mermaid-post-fit:start/g)).toHaveLength(1);
	});

	test('upgrades stale standalone HTML post-fit script blocks instead of accepting old bundle output', () => {
		const staleHtml = [
			'<html>',
			'<body>',
			'<main id="app"></main>',
			'<script data-notemd-mermaid-post-fit="1">',
			'const staleMermaidRuntime = true;',
			'</script>',
			'</body>',
			'</html>',
		].join('\n');

		const injected = injectMermaidPostFitIntoHtml(staleHtml);

		expect(injected).toContain('querySelectorAll(".mermaid")');
		expect(injected).toContain('justifyContent = "center"');
		expect(injected).not.toContain('staleMermaidRuntime');
		expect(injected.match(/data-notemd-mermaid-post-fit/g)).toHaveLength(1);
	});
});
