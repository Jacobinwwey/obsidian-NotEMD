#!/usr/bin/env node
/**
 * Maintainer verification for the real NoteMD Slidev export workflow.
 *
 * This script exercises the production source-preparation and Slidev export
 * modules without starting Obsidian. It intentionally writes the same vault
 * artifacts the UI writes so maintainers can inspect the generated deck and
 * standalone HTML after the command completes.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { buildPptxVisualDiff } = require('./lib/pptx-visual-diff');

const LAYOUT_AUDIT_CONFIG = {
	overflowTolerancePx: 6,
	minReadableScale: 0.28,
	maxAutoPatchPasses: 6,
	minEffectiveFontPx: 10,
	minSvgTextFontPx: 9,
	minTableBodyFontPx: 10,
	minCodeFontPx: 10,
	minQualityMarginPx: 18,
	minContentAreaRatio: 0.18,
	lowContentUtilizationScaleThreshold: 0.55,
	mermaidLowZoomReviewScale: 0.72,
};

function parseArgs(argv) {
	const args = {
		vault: 'docs',
		source: 'architecture.zh-CN.md',
		format: 'html',
		htmlMode: 'standalone',
		outputSubfolder: 'export',
		theme: 'default',
		timeoutMs: 180000,
		requireNativeStandalone: false,
		playwright: true,
		screenshots: true,
		sampleSlides: null,
		pptxVisualDiff: false,
		requirePptxVisualMatch: false,
		pptxVisualMaxRmse: 0.12,
		pptxVisualMeanRmse: 0.08,
		pptxVisualDpi: 150,
		pptxVisualDiffDir: null,
		json: false,
	};

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];
		if (arg === '--vault' && argv[index + 1]) {
			args.vault = argv[++index];
		} else if (arg === '--source' && argv[index + 1]) {
			args.source = argv[++index];
		} else if (arg === '--format' && argv[index + 1]) {
			args.format = argv[++index];
		} else if (arg === '--html-mode' && argv[index + 1]) {
			args.htmlMode = argv[++index];
		} else if (arg === '--output-subfolder' && argv[index + 1]) {
			args.outputSubfolder = argv[++index];
		} else if (arg === '--theme' && argv[index + 1]) {
			args.theme = argv[++index];
		} else if (arg === '--timeout-ms' && argv[index + 1]) {
			args.timeoutMs = Number(argv[++index]);
		} else if (arg === '--require-native-standalone') {
			args.requireNativeStandalone = true;
		} else if (arg === '--sample-slides' && argv[index + 1]) {
			const rawValue = argv[++index].trim().toLowerCase();
			args.sampleSlides = rawValue === 'all'
				? []
				: rawValue.split(',').map(value => Number(value.trim())).filter(Number.isFinite);
		} else if (arg === '--no-playwright') {
			args.playwright = false;
		} else if (arg === '--no-screenshots') {
			args.screenshots = false;
		} else if (arg === '--pptx-visual-diff') {
			args.pptxVisualDiff = true;
		} else if (arg === '--require-pptx-visual-match') {
			args.requirePptxVisualMatch = true;
			args.pptxVisualDiff = true;
		} else if (arg === '--pptx-visual-max-rmse' && argv[index + 1]) {
			args.pptxVisualMaxRmse = Number(argv[++index]);
		} else if (arg === '--pptx-visual-mean-rmse' && argv[index + 1]) {
			args.pptxVisualMeanRmse = Number(argv[++index]);
		} else if (arg === '--pptx-visual-dpi' && argv[index + 1]) {
			args.pptxVisualDpi = Number(argv[++index]);
		} else if (arg === '--pptx-visual-diff-dir' && argv[index + 1]) {
			args.pptxVisualDiffDir = argv[++index];
		} else if (arg === '--json') {
			args.json = true;
		} else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	if (!['html', 'pdf', 'png', 'pptx', 'mp4'].includes(args.format)) {
		throw new Error(`Unsupported --format ${args.format}`);
	}
	if (!['standalone', 'server-script'].includes(args.htmlMode)) {
		throw new Error(`Unsupported --html-mode ${args.htmlMode}`);
	}
	if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
		throw new Error('--timeout-ms must be a positive number');
	}
	if (args.requireNativeStandalone && (args.format !== 'html' || args.htmlMode !== 'standalone')) {
		throw new Error('--require-native-standalone requires --format html --html-mode standalone');
	}
	if (args.pptxVisualDiff && args.format !== 'pptx') {
		throw new Error('--pptx-visual-diff requires --format pptx');
	}
	if (!Number.isFinite(args.pptxVisualMaxRmse) || args.pptxVisualMaxRmse < 0) {
		throw new Error('--pptx-visual-max-rmse must be a non-negative number');
	}
	if (!Number.isFinite(args.pptxVisualMeanRmse) || args.pptxVisualMeanRmse < 0) {
		throw new Error('--pptx-visual-mean-rmse must be a non-negative number');
	}
	if (!Number.isFinite(args.pptxVisualDpi) || args.pptxVisualDpi <= 0) {
		throw new Error('--pptx-visual-dpi must be a positive number');
	}

	return args;
}

function printHelp() {
	console.log([
		'Usage: node scripts/verify-slidev-export-workflow.cjs [options]',
		'',
		'Options:',
		'  --vault <path>             Vault root, default: docs',
		'  --source <path>            Vault-relative source Markdown, default: architecture.zh-CN.md',
		'  --format <html|pdf|png|pptx|mp4> Export format, default: html',
		'  --html-mode <standalone|server-script> HTML mode, default: standalone',
		'  --output-subfolder <path>  Vault-relative output folder, default: export',
		'  --theme <name>             Slidev theme, default: default',
		'  --require-native-standalone Fail if HTML export falls back from native standalone',
		'  --sample-slides <list|all> Comma-separated slide numbers for Playwright, default: all slides',
		'  --no-playwright            Skip browser rendering checks',
		'  --no-screenshots           Do not write Playwright screenshots',
		'  --pptx-visual-diff         Render PPTX back to PNG and compare each page with the PPTX frozen background reference',
		'  --require-pptx-visual-match Fail when PPTX/PNG visual diff exceeds thresholds',
		'  --pptx-visual-max-rmse <n> Max per-slide normalized RMSE, default: 0.12',
		'  --pptx-visual-mean-rmse <n> Mean normalized RMSE, default: 0.08',
		'  --pptx-visual-dpi <n>      LibreOffice/PDF render DPI, default: 150',
		'  --pptx-visual-diff-dir <path> Output directory for visual diff artifacts',
		'  --json                     Print only the final JSON report',
	].join('\n'));
}

async function bundleSlideExportModules() {
	const result = await esbuild.build({
		stdin: {
			contents: [
					"export { probeEnvironment } from './src/slideExport/environmentProber';",
					"export { prepareSlidevExportSource } from './src/slideExport/slidevSourcePreparer';",
					"export { exportSlidevHtml, exportSlidevHtmlWithOutcome, exportSlidevPdf, exportSlidevPng } from './src/slideExport/slidevExporter';",
					"export { exportSlidevPptxFromHtml } from './src/slideExport/pptxExporter';",
					"export { convergeSlidevDeckLayout } from './src/slideExport/slidevLayoutWorkflow';",
					"export { exportVideoMp4 } from './src/slideExport/videoExporter';",
					"export { analyzeRenderedSlideMeasurement, summarizeLayoutAudits, patchDeckWithLayoutAudit, countSlideDeckSlides } from './src/slideExport/slidevLayoutAudit';",
					"export { resolveWorkspaceHomeCandidates } from './src/slideExport/platformUtils';",
					"export { startLocalServer, stopLocalServer } from './src/slideExport/localServer';",
			].join('\n'),
			resolveDir: process.cwd(),
			sourcefile: 'notemd-slidev-workflow-entry.ts',
			loader: 'ts',
		},
		bundle: true,
		platform: 'node',
		format: 'cjs',
		write: false,
		logLevel: 'silent',
		plugins: [obsidianShimPlugin()],
	});

	const code = result.outputFiles[0].text;
	const bundledModule = { exports: {} };
	const evaluate = new Function('require', 'module', 'exports', code);
	evaluate(require, bundledModule, bundledModule.exports);
	return bundledModule.exports;
}

function obsidianShimPlugin() {
	return {
		name: 'notemd-obsidian-shim',
		setup(build) {
			build.onResolve({ filter: /^obsidian$/ }, () => ({
				path: 'obsidian-shim',
				namespace: 'notemd-obsidian-shim',
			}));
			build.onLoad({ filter: /.*/, namespace: 'notemd-obsidian-shim' }, () => ({
				loader: 'js',
				contents: [
					'export const Platform = { isDesktopApp: true };',
					'export class Notice { constructor(message) { this.message = message; } }',
					'export class Modal { constructor(app) { this.app = app; this.contentEl = { empty() {}, createEl() { return this; }, createDiv() { return this; }, appendChild() {}, addClass() {}, setText() {} }; } open() {} close() {} }',
					'export class Setting { constructor() {} setName() { return this; } setDesc() { return this; } addButton() { return this; } addText() { return this; } addDropdown() { return this; } addToggle() { return this; } }',
					'export class Plugin {}',
					'export class PluginSettingTab {}',
					'export class ItemView {}',
					'export class TFile {}',
					'export class TFolder {}',
					'export class MarkdownView {}',
					'export class WorkspaceLeaf {}',
					'export class ButtonComponent {}',
					'export class TextAreaComponent {}',
					'export const requestUrl = async () => { throw new Error("requestUrl unavailable in Slidev export workflow verification"); };',
					'export const getLanguage = () => "en";',
					'export const loadPdfJs = async () => null;',
				].join('\n'),
			}));
		},
	};
}

function createApp(vaultRoot) {
	const adapter = {
		basePath: vaultRoot,
		getBasePath: () => vaultRoot,
		exists: async vaultPath => fs.existsSync(path.join(vaultRoot, vaultPath)),
		mkdir: async vaultPath => fs.mkdirSync(path.join(vaultRoot, vaultPath), { recursive: true }),
		read: async vaultPath => fs.readFileSync(path.join(vaultRoot, vaultPath), 'utf8'),
		list: async vaultPath => {
			const absolutePath = path.join(vaultRoot, vaultPath);
			const entries = fs.existsSync(absolutePath) ? fs.readdirSync(absolutePath, { withFileTypes: true }) : [];
			return {
				files: entries.filter(entry => entry.isFile()).map(entry => path.join(vaultPath, entry.name).replace(/\\/g, '/')),
				folders: entries.filter(entry => entry.isDirectory()).map(entry => path.join(vaultPath, entry.name).replace(/\\/g, '/')),
			};
		},
		stat: async vaultPath => {
			const absolutePath = path.join(vaultRoot, vaultPath);
			if (!fs.existsSync(absolutePath)) {
				return null;
			}
			return fs.statSync(absolutePath);
		},
		write: async (vaultPath, content) => {
			const absolutePath = path.join(vaultRoot, vaultPath);
			fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
			fs.writeFileSync(absolutePath, content, 'utf8');
		},
	};

	return {
		vault: {
			adapter,
			read: async file => fs.readFileSync(path.join(vaultRoot, file.path), 'utf8'),
		},
	};
}

function createSourceFile(vaultRoot, sourcePath) {
	const normalizedSource = sourcePath.replace(/\\/g, '/').replace(/^\/+/, '');
	const absolutePath = path.join(vaultRoot, normalizedSource);
	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Source file does not exist: ${absolutePath}`);
	}

	const extension = path.extname(normalizedSource);
	return {
		path: normalizedSource,
		name: path.basename(normalizedSource),
		basename: path.basename(normalizedSource, extension),
		extension: extension.replace(/^\./, ''),
	};
}

function createConfig(args) {
	return {
		format: args.format,
		withClicks: false,
		outputSubfolder: args.outputSubfolder,
		ffmpegFps: 1,
		ffmpegCrf: 23,
		slidevTheme: args.theme,
		timeoutMs: args.timeoutMs,
		htmlMode: args.htmlMode,
	};
}

function collectDeckSummary(deckPath) {
	if (!deckPath || !fs.existsSync(deckPath)) {
		return null;
	}
	const deck = fs.readFileSync(deckPath, 'utf8');
	const mermaidFences = extractMermaidFenceBlocks(deck);
	return {
		path: deckPath,
		bytes: fs.statSync(deckPath).size,
		theme: (deck.match(/^theme:\s*(.+)$/m) || [])[1] || null,
		mermaidBlocks: mermaidFences.length,
		zoomLines: [...deck.matchAll(/^zoom:\s*(.+)$/gm)].map(match => match[1]),
		containsKnownStaleText: deck.includes('快速定位'),
		containsMissingTheme: deck.includes('seriph'),
	};
}

function collectMermaidSourcePreservation(sourcePath, deckPath) {
	if (!sourcePath || !deckPath || !fs.existsSync(sourcePath) || !fs.existsSync(deckPath)) {
		return null;
	}

	const sourceFences = extractMermaidFenceBlocks(fs.readFileSync(sourcePath, 'utf8'));
	const deckFences = extractMermaidFenceBlocks(fs.readFileSync(deckPath, 'utf8'));
	const changedFenceIndexes = [];
	const comparedCount = Math.max(sourceFences.length, deckFences.length);
	for (let index = 0; index < comparedCount; index++) {
		if (sourceFences[index] !== deckFences[index]) {
			changedFenceIndexes.push(index + 1);
		}
	}

	return {
		required: sourceFences.length > 0,
		passed: changedFenceIndexes.length === 0,
		sourceFenceCount: sourceFences.length,
		deckFenceCount: deckFences.length,
		changedFenceIndexes,
	};
}

function extractMermaidFenceBlocks(markdown) {
	const lines = markdown.split(/\r?\n/);
	const fences = [];
	let activeFence = null;

	for (const line of lines) {
		if (!activeFence) {
			const openingMatch = line.trim().match(/^(```+|~~~+)\s*mermaid(?:\s+\{[^}]+\})?\s*$/i);
			if (openingMatch) {
				activeFence = {
					marker: openingMatch[1],
					lines: [line],
				};
			}
			continue;
		}

		activeFence.lines.push(line);
		if (isClosingFenceLine(line, activeFence.marker)) {
			fences.push(activeFence.lines.join('\n'));
			activeFence = null;
		}
	}

	return fences;
}

function isClosingFenceLine(line, openingMarker) {
	const markerCharacter = openingMarker[0];
	const markerCount = openingMarker.length;
	const escapedMarker = markerCharacter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`^${escapedMarker}{${markerCount},}\\s*$`).test(line.trim());
}

async function collectRenderedSlideMeasurement(page, slide) {
	return page.evaluate(slotZoneAttr => {
		const toRect = rect => ({
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
		});
		const toTextPreview = value => value
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 160);
		const overlaps = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
		const unionRects = rects => rects.reduce((acc, rect) => {
			if (!acc) {
				return { ...rect };
			}
			return {
				left: Math.min(acc.left, rect.left),
				top: Math.min(acc.top, rect.top),
				right: Math.max(acc.right, rect.right),
				bottom: Math.max(acc.bottom, rect.bottom),
				width: Math.max(acc.right, rect.right) - Math.min(acc.left, rect.left),
				height: Math.max(acc.bottom, rect.bottom) - Math.min(acc.top, rect.top),
			};
		}, null);
		const collectTextContentRect = element => {
			const textRects = [];
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			let node = walker.nextNode();
			while (node) {
				if ((node.textContent || '').trim().length > 0) {
					const range = document.createRange();
					range.selectNodeContents(node);
					for (const rect of Array.from(range.getClientRects())) {
						if (rect.width > 1 && rect.height > 1) {
							textRects.push(toRect(rect));
						}
					}
					range.detach();
				}
				node = walker.nextNode();
			}
			return unionRects(textRects);
		};
		const pickVisibleLargest = selector => Array.from(document.querySelectorAll(selector))
			.filter(element => element instanceof Element)
			.map(element => ({ element, rect: element.getBoundingClientRect(), style: window.getComputedStyle(element) }))
			.filter(entry => entry.style.display !== 'none' && entry.style.visibility !== 'hidden' && Number(entry.style.opacity || '1') > 0 && entry.rect.width > 2 && entry.rect.height > 2)
			.sort((left, right) => (right.rect.width * right.rect.height) - (left.rect.width * left.rect.height))[0]?.element ?? null;

		const slideRoot = pickVisibleLargest('.slidev-page')
			|| pickVisibleLargest('.slidev-layout')
			|| pickVisibleLargest('.slidev-slide-content')
			|| document.querySelector('#app');
		if (!slideRoot) {
			return {
				slide: null,
				slideRoot: null,
				safeRect: null,
				contentBounds: null,
				pageScale: null,
				elements: [],
				slotZones: [],
				errors: ['Slide root not found'],
			};
		}

		const slideRootRect = toRect(slideRoot.getBoundingClientRect());
		const safeInsetX = slideRootRect.width * 0.04;
		const safeInsetY = slideRootRect.height * 0.06;
		const safeRect = {
			left: slideRootRect.left + safeInsetX,
			top: slideRootRect.top + safeInsetY,
			right: slideRootRect.right - safeInsetX,
			bottom: slideRootRect.bottom - safeInsetY,
			width: slideRootRect.width - safeInsetX * 2,
			height: slideRootRect.height - safeInsetY * 2,
		};

		const selectors = [
			['mermaid', '.mermaid, [class*="mermaid"]'],
			['table', 'table'],
			['code', 'pre, .shiki'],
			['image', 'img, svg'],
			['text', 'h1, h2, h3, h4, p, li, blockquote'],
			['other', 'div, section, article, aside, span'],
		];
		const seen = new Set();
		const measuredElements = [];

		for (const [kind, selector] of selectors) {
			for (const element of slideRoot.querySelectorAll(selector)) {
				if (!(element instanceof Element) || seen.has(element)) {
					continue;
				}
				seen.add(element);

				const style = window.getComputedStyle(element);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) {
					continue;
				}

				const elementRect = toRect(element.getBoundingClientRect());
				const rect = kind === 'text'
					? collectTextContentRect(element) || elementRect
					: elementRect;
				const ownerElement = element.closest(`[${slotZoneAttr}]`);
				if (rect.width < 2 || rect.height < 2 || (!ownerElement && !overlaps(rect, slideRootRect))) {
					continue;
				}

				const textLength = (element.textContent || '').trim().length;
				if (kind === 'other') {
					const directTextLength = Array.from(element.childNodes)
						.filter(node => node.nodeType === Node.TEXT_NODE)
						.map(node => node.textContent || '')
						.join(' ')
						.trim()
						.length;
					if (directTextLength === 0 || textLength === 0) {
						continue;
					}
				}

				measuredElements.push({
					ownerElement,
					measured: {
						kind,
						selector,
						slotZone: ownerElement?.getAttribute(slotZoneAttr) || undefined,
						slotOwner: element.hasAttribute(slotZoneAttr),
						textLength,
						textPreview: textLength > 0 ? toTextPreview(element.textContent || '') : undefined,
						scrollWidth: element.scrollWidth || rect.width,
						scrollHeight: element.scrollHeight || rect.height,
						clientWidth: element.clientWidth || rect.width,
						clientHeight: element.clientHeight || rect.height,
						rect,
					},
				});
			}
		}

		const elements = measuredElements.map(entry => entry.measured);
		const slotZones = Array.from(slideRoot.querySelectorAll(`[${slotZoneAttr}]`))
			.filter(element => element instanceof Element)
			.map(ownerElement => {
				const ownerRect = toRect(ownerElement.getBoundingClientRect());
				if (ownerRect.width < 2 || ownerRect.height < 2 || !overlaps(ownerRect, slideRootRect)) {
					return null;
				}

				const style = window.getComputedStyle(ownerElement);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) {
					return null;
				}

				const zoneName = ownerElement.getAttribute(slotZoneAttr);
				if (!zoneName) {
					return null;
				}

				const zoneElementRects = measuredElements
					.filter(entry => entry.ownerElement === ownerElement && !entry.measured.slotOwner)
					.map(entry => entry.measured.rect);
				const contentBounds = unionRects(zoneElementRects.length > 0 ? zoneElementRects : [ownerRect]);
				if (contentBounds) {
					contentBounds.width = contentBounds.right - contentBounds.left;
					contentBounds.height = contentBounds.bottom - contentBounds.top;
				}

				const textValue = (ownerElement.textContent || '').trim();
				return {
					name: zoneName,
					textLength: textValue.length,
					textPreview: textValue.length > 0 ? toTextPreview(textValue) : undefined,
					ownerRect,
					contentBounds,
					scrollWidth: ownerElement.scrollWidth || ownerRect.width,
					scrollHeight: ownerElement.scrollHeight || ownerRect.height,
					clientWidth: ownerElement.clientWidth || ownerRect.width,
					clientHeight: ownerElement.clientHeight || ownerRect.height,
				};
			})
			.filter(Boolean);

		const contentBounds = unionRects(elements.map(element => element.rect));
		if (contentBounds) {
			contentBounds.width = contentBounds.right - contentBounds.left;
			contentBounds.height = contentBounds.bottom - contentBounds.top;
		}

		const zoomRaw = window.getComputedStyle(slideRoot).getPropertyValue('--slidev-slide-zoom-scale').trim()
			|| window.getComputedStyle(slideRoot).scale
			|| '1';
		const pageScale = Number.parseFloat(zoomRaw);

		return {
			slideRoot: slideRootRect,
			safeRect,
			contentBounds,
			pageScale: Number.isFinite(pageScale) ? pageScale : null,
			elements,
			slotZones,
			errors: [],
		};
	}, 'data-notemd-slot-zone');
}

function configurePlaywrightBrowserPath(slideExport) {
	if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
		return;
	}

	for (const home of slideExport.resolveWorkspaceHomeCandidates()) {
		const candidate = path.join(home, '.cache', 'ms-playwright');
		try {
			if (fs.existsSync(candidate)) {
				process.env.PLAYWRIGHT_BROWSERS_PATH = candidate;
				return;
			}
		} catch {
			// Try the next candidate.
		}
	}
}

async function runPlaywrightChecks(htmlPath, sampleSlides, writeScreenshots, slideExport) {
	configurePlaywrightBrowserPath(slideExport);
	const { chromium } = require('playwright');
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	const checks = [];
	const layoutAudits = [];
	let serverDirectory = null;
	let baseUrl = null;

	try {
		if (htmlPath.endsWith('/index.html')) {
			serverDirectory = path.dirname(htmlPath);
			const port = await slideExport.startLocalServer(serverDirectory);
			baseUrl = `http://localhost:${port}/index.html`;
		}

		for (const slide of sampleSlides) {
			const errors = [];
			page.removeAllListeners('pageerror');
			page.removeAllListeners('console');
			const keepError = text => !/Wake Lock permission request denied/i.test(text);
			page.on('pageerror', error => {
				if (keepError(error.message)) errors.push(error.message);
			});
			page.on('console', message => {
				if (message.type() === 'error' && keepError(message.text())) errors.push(message.text());
			});

			const targetUrl = baseUrl ? `${baseUrl}#/${slide}` : `file://${htmlPath}#/${slide}`;
			await openSlideForAudit(page, targetUrl);
			await page.waitForTimeout(1000);
			const text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
			const measurement = await collectRenderedSlideMeasurement(page, slide);
			measurement.slide = slide;
			const layoutAudit = slideExport.analyzeRenderedSlideMeasurement(measurement, LAYOUT_AUDIT_CONFIG);
			let screenshotPath = null;
			if (writeScreenshots) {
				screenshotPath = path.join(path.dirname(htmlPath), `slide-${String(slide).padStart(2, '0')}-workflow.png`);
				await page.screenshot({ path: screenshotPath, fullPage: true });
			}
			checks.push({
				slide,
				failed: errors.length > 0 || !text.includes(`${slide} /`),
				errors,
				screenshotPath,
				preview: text.split('\n').filter(Boolean).slice(0, 4).join(' | '),
				layoutFindingCount: layoutAudit.findings.length,
			});
			layoutAudits.push(layoutAudit);
		}
	} finally {
		await browser.close();
		if (serverDirectory) {
			slideExport.stopLocalServer(serverDirectory);
		}
	}

	return { checks, layoutAudits };
}

async function openSlideForAudit(page, targetUrl) {
	await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
	if (typeof page.waitForLoadState === 'function') {
		await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
	}
	if (typeof page.waitForFunction === 'function') {
		await page.waitForFunction(
			() => {
				const root = document.querySelector('.slidev-page, .slidev-layout, .slidev-slide-content, #app');
				return Boolean(root && (root.textContent || '').trim().length > 0);
			},
			null,
			{ timeout: 15000 }
		).catch(() => undefined);
	}
}

function resolveSlidesToAudit(sampleSlides, deckMarkdown, slideExport) {
	const deckSlideCount = deckMarkdown ? slideExport.countSlideDeckSlides(deckMarkdown) : 0;
	const allSlides = Array.from({ length: Math.max(deckSlideCount, 1) }, (_, index) => index + 1);
	if (!Array.isArray(sampleSlides) || sampleSlides.length === 0) {
		return allSlides;
	}

	const filteredSlides = sampleSlides.filter(slide => Number.isFinite(slide) && slide >= 1 && slide <= deckSlideCount);
	return filteredSlides.length > 0 ? filteredSlides : allSlides;
}

function checkGitIgnoreStatus(pathsToCheck) {
	const existingPaths = pathsToCheck.filter(Boolean).filter(filePath => fs.existsSync(filePath));
	if (existingPaths.length === 0) {
		return {
			ignoredOutputs: [],
			unignoredOutputs: [],
			error: null,
		};
	}

	const relativePaths = existingPaths.map(filePath => path.relative(process.cwd(), filePath));
	const result = childProcess.spawnSync('git', ['check-ignore', '-v', '--stdin'], {
		cwd: process.cwd(),
		encoding: 'utf8',
		input: `${relativePaths.join('\n')}\n`,
	});

	const ignoredOutputs = result.stdout
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(Boolean);
	const ignoredRelativePaths = new Set(ignoredOutputs.map(line => {
		const parts = line.split('\t');
		return (parts[parts.length - 1] || line).trim();
	}));

	return {
		ignoredOutputs,
		unignoredOutputs: relativePaths.filter(filePath => !ignoredRelativePaths.has(filePath)),
		error: result.status && result.status > 1 ? (result.stderr || result.stdout || `git check-ignore exited ${result.status}`) : null,
	};
}

function inspectPptx(pptxPath) {
	if (!pptxPath || !fs.existsSync(pptxPath)) {
		return null;
	}
	try {
		const { strFromU8, unzipSync } = require('fflate');
		const entries = unzipSync(new Uint8Array(fs.readFileSync(pptxPath)));
		const names = Object.keys(entries);
		const slideXmlPaths = names
			.filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
			.sort((left, right) => {
				const leftNumber = Number(left.match(/slide(\d+)\.xml$/)?.[1] || 0);
				const rightNumber = Number(right.match(/slide(\d+)\.xml$/)?.[1] || 0);
				return leftNumber - rightNumber;
			});
		const slideTextRuns = slideXmlPaths.map(name => {
			const xml = strFromU8(entries[name]);
			const textRunCount = (xml.match(/<a:t>/g) || []).length;
			const pictureCount = (xml.match(/<p:pic>/g) || []).length;
			const tableCount = (xml.match(/<a:tbl>/g) || []).length;
			return {
				path: name,
				textRunCount,
				pictureCount,
				tableCount,
				hasEditableText: textRunCount > 0,
			};
		});
		return {
			isZip: true,
			entryCount: names.length,
			slideCount: slideXmlPaths.length,
			mediaCount: names.filter(name => /^ppt\/media\/image\d+\.(png|jpg|jpeg)$/.test(name)).length,
			textRunCount: slideTextRuns.reduce((total, slide) => total + slide.textRunCount, 0),
			pictureCount: slideTextRuns.reduce((total, slide) => total + slide.pictureCount, 0),
			tableCount: slideTextRuns.reduce((total, slide) => total + slide.tableCount, 0),
			slidesWithoutEditableText: slideTextRuns.filter(slide => !slide.hasEditableText).map(slide => slide.path),
			slideTextRuns,
		};
	} catch (error) {
		return {
			isZip: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function printProgress(enabled, phase, detail) {
	if (!enabled) return;
	console.log(detail ? `${phase}: ${detail}` : phase);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const vaultRoot = path.resolve(args.vault);
	const app = createApp(vaultRoot);
	const sourceFile = createSourceFile(vaultRoot, args.source);
	const config = createConfig(args);
	const slideExport = await bundleSlideExportModules();
	const progress = [];
	const onProgress = (phase, detail) => {
		progress.push({ phase, detail: detail || '' });
		printProgress(!args.json, phase, detail);
	};

	printProgress(!args.json, 'slidev-workflow', `Vault: ${vaultRoot}`);
	printProgress(!args.json, 'slidev-workflow', `Source: ${sourceFile.path}`);

	const environment = await slideExport.probeEnvironment([vaultRoot]);
	const slideSource = await slideExport.prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);
	let layoutConvergence = null;
	if (args.playwright) {
		layoutConvergence = await slideExport.convergeSlidevDeckLayout(app, slideSource, config, onProgress, {
			sampleSlides: args.sampleSlides,
			writeScreenshots: args.screenshots,
			navigationTimeoutMs: args.timeoutMs,
			auditConfig: LAYOUT_AUDIT_CONFIG,
		});
	}

	let exportPath = layoutConvergence?.exportPath;
	let htmlExport = layoutConvergence?.htmlExport ?? null;
	let htmlExportHistory = layoutConvergence?.htmlExportHistory ?? [];
	let pptxReportPath = null;
	if (args.format === 'pdf') {
		exportPath = await slideExport.exportSlidevPdf(app, slideSource, config, onProgress);
	} else if (args.format === 'png') {
		exportPath = await slideExport.exportSlidevPng(app, slideSource, config, onProgress);
	} else if (args.format === 'pptx') {
		if (!exportPath) {
			htmlExport = await slideExport.exportSlidevHtmlWithOutcome(app, slideSource, config, onProgress);
			htmlExportHistory = [htmlExport];
			exportPath = htmlExport.path;
		}
		const pptxResult = await slideExport.exportSlidevPptxFromHtml(app, slideSource, config, exportPath, onProgress);
		exportPath = pptxResult.path;
		htmlExport = layoutConvergence?.htmlExport ?? htmlExport;
		htmlExportHistory = layoutConvergence?.htmlExportHistory ?? htmlExportHistory;
		pptxReportPath = path.join(vaultRoot, pptxResult.reportPath);
	} else if (args.format === 'mp4') {
		const pngDirectory = await slideExport.exportSlidevPng(app, slideSource, config, onProgress);
		exportPath = await slideExport.exportVideoMp4(app, pngDirectory, slideSource.outputBasename, config, onProgress);
	} else if (!exportPath) {
		htmlExport = await slideExport.exportSlidevHtmlWithOutcome(app, slideSource, config, onProgress);
		htmlExportHistory = [htmlExport];
		exportPath = htmlExport.path;
	}

	let absoluteExportPath = path.join(vaultRoot, exportPath);
	const absoluteDeckPath = slideSource.preparedDeckPath ? path.join(vaultRoot, slideSource.preparedDeckPath) : null;
	let deckSummary = collectDeckSummary(absoluteDeckPath);
	const mermaidSourcePreservation = collectMermaidSourcePreservation(path.join(vaultRoot, sourceFile.path), absoluteDeckPath);
	let playwrightChecks = layoutConvergence?.checks ?? [];
	let layoutAudits = layoutConvergence?.layoutAudits ?? [];
	let layoutAuditSummary = layoutConvergence?.layoutAuditSummary ?? slideExport.summarizeLayoutAudits([], 0);
	let layoutPatchAttempts = layoutConvergence?.layoutPatchAttempts ?? [];
	let auditedSlides = layoutConvergence?.auditedSlides ?? [];
	const pptxInspection = args.format === 'pptx' ? inspectPptx(absoluteExportPath) : null;
	let pptxReferencePngDirectory = null;
	let pptxVisualDiff = null;
	if (args.format === 'pptx' && args.pptxVisualDiff) {
		const visualDiffDirectory = args.pptxVisualDiffDir
			? (path.isAbsolute(args.pptxVisualDiffDir)
				? args.pptxVisualDiffDir
				: path.join(vaultRoot, args.pptxVisualDiffDir))
			: path.join(path.dirname(absoluteExportPath), `${path.basename(absoluteExportPath, path.extname(absoluteExportPath))}-pptx-visual-diff`);
		onProgress('pptx-visual-diff', 'Rendering PPTX back to PNG and comparing pages with frozen background references...');
		try {
			pptxVisualDiff = buildPptxVisualDiff({
				pptxPath: absoluteExportPath,
				outputDirectory: visualDiffDirectory,
				dpi: args.pptxVisualDpi,
				timeoutMs: args.timeoutMs,
				thresholds: {
					maxRmse: args.pptxVisualMaxRmse,
					meanRmse: args.pptxVisualMeanRmse,
				},
			});
			onProgress(
				'pptx-visual-diff',
				pptxVisualDiff.gate?.passed
					? 'PPTX visual diff is within thresholds.'
					: `PPTX visual diff exceeded thresholds: ${(pptxVisualDiff.gate?.failures || []).join('; ')}`,
			);
			pptxReferencePngDirectory = pptxVisualDiff.reference?.referenceDirectory || null;
		} catch (error) {
			pptxVisualDiff = {
				available: false,
				outputDirectory: visualDiffDirectory,
				error: error instanceof Error ? error.message : String(error),
				gate: {
					passed: false,
					failures: [error instanceof Error ? error.message : String(error)],
					thresholds: {
						maxRmse: args.pptxVisualMaxRmse,
						meanRmse: args.pptxVisualMeanRmse,
					},
				},
			};
			onProgress('pptx-visual-diff', `PPTX visual diff failed: ${pptxVisualDiff.error}`);
		}
	}

	const gitIgnoreStatus = checkGitIgnoreStatus([
		absoluteDeckPath,
		absoluteExportPath,
		pptxReportPath,
		pptxReferencePngDirectory,
		pptxVisualDiff?.outputDirectory,
		htmlExport?.standaloneAttempt?.preservedFailurePath
			? path.join(vaultRoot, htmlExport.standaloneAttempt.preservedFailurePath)
			: null,
		htmlExport?.standaloneAttempt?.outputPath
			? path.join(vaultRoot, htmlExport.standaloneAttempt.outputPath)
			: null,
		htmlExport?.fallbackPath
			? path.join(vaultRoot, htmlExport.fallbackPath)
			: null,
		...playwrightChecks.map(check => check.screenshotPath),
	]);
	const ignoredOutputs = gitIgnoreStatus.ignoredOutputs;
	const unignoredOutputs = gitIgnoreStatus.unignoredOutputs;
	const hasLayoutFailures = layoutAudits.some(audit => audit.findings.length > 0);
	const nativeStandalonePassed = htmlExport?.actualMode === 'standalone'
		&& htmlExport?.standaloneAttempt?.accepted === true
		&& fs.existsSync(path.join(vaultRoot, htmlExport.path));
	const standaloneGate = {
		required: args.requireNativeStandalone,
		passed: !args.requireNativeStandalone || nativeStandalonePassed,
		reason: args.requireNativeStandalone && !nativeStandalonePassed
			? `Expected native standalone HTML but actual mode was ${htmlExport?.actualMode || 'unavailable'}`
			: null,
	};
	const pptxVisualDiffExecutionPassed = !args.pptxVisualDiff || Boolean(pptxVisualDiff?.available && !pptxVisualDiff?.error);
	const pptxVisualGate = {
		required: args.requirePptxVisualMatch,
		passed: !args.requirePptxVisualMatch || Boolean(pptxVisualDiff?.gate?.passed),
		failures: args.requirePptxVisualMatch ? (pptxVisualDiff?.gate?.failures || []) : [],
		thresholds: {
			maxRmse: args.pptxVisualMaxRmse,
			meanRmse: args.pptxVisualMeanRmse,
		},
	};

	const report = {
		ok: playwrightChecks.every(check => !check.failed)
			&& environment.capabilities[args.format] === true
			&& fs.existsSync(absoluteExportPath)
			&& !gitIgnoreStatus.error
			&& unignoredOutputs.length === 0
			&& (args.format !== 'pptx' || Boolean(pptxInspection?.isZip && pptxInspection.textRunCount > 0))
			&& pptxVisualDiffExecutionPassed
			&& pptxVisualGate.passed
			&& !hasLayoutFailures
			&& (!deckSummary || (!deckSummary.containsKnownStaleText && !deckSummary.containsMissingTheme))
			&& (!mermaidSourcePreservation || mermaidSourcePreservation.passed)
			&& standaloneGate.passed,
		source: {
			vaultRoot,
			sourcePath: sourceFile.path,
		},
		environment: {
			node: environment.node,
			slidev: environment.slidev,
			playwright: environment.playwright,
			ffmpeg: environment.ffmpeg,
			capabilities: environment.capabilities,
		},
		slideSource: {
			inputFilePath: slideSource.inputFilePath,
			outputBasename: slideSource.outputBasename,
			preparedDeckPath: slideSource.preparedDeckPath || null,
			skillRootPath: slideSource.skillRootPath || null,
			skillReferenceCount: slideSource.skillReferencePaths?.length || 0,
		},
		output: {
			format: args.format,
			path: absoluteExportPath,
			bytes: fs.existsSync(absoluteExportPath) && fs.statSync(absoluteExportPath).isFile()
				? fs.statSync(absoluteExportPath).size
				: null,
			pptxReportPath,
		},
		pptxInspection,
		pptxVisualDiff,
		pptxVisualGate,
		htmlExport,
		htmlExportHistory,
		standaloneGate,
		deck: deckSummary,
		mermaidSourcePreservation,
		playwright: playwrightChecks,
		playwrightSlides: auditedSlides,
		layoutAudit: layoutAudits,
		layoutAuditSummary,
		layoutPatchAttempts,
		ignoredOutputs,
		unignoredOutputs,
		gitIgnoreCheckError: gitIgnoreStatus.error,
		progress,
	};

	if (args.json) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log('\n=== Slidev workflow verification report ===');
		console.log(JSON.stringify(report, null, 2));
	}

	if (!report.ok) {
		process.exitCode = 1;
	}

	if (typeof esbuild.stop === 'function') {
		await esbuild.stop();
	}

	process.exit(process.exitCode || 0);
}

main().catch(error => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
