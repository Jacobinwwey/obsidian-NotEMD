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

const LAYOUT_AUDIT_CONFIG = {
	minReadableScale: 0.24,
	maxAutoPatchPasses: 6,
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
		playwright: true,
		screenshots: true,
		sampleSlides: null,
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
		} else if (arg === '--sample-slides' && argv[index + 1]) {
			const rawValue = argv[++index].trim().toLowerCase();
			args.sampleSlides = rawValue === 'all'
				? []
				: rawValue.split(',').map(value => Number(value.trim())).filter(Number.isFinite);
		} else if (arg === '--no-playwright') {
			args.playwright = false;
		} else if (arg === '--no-screenshots') {
			args.screenshots = false;
		} else if (arg === '--json') {
			args.json = true;
		} else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	if (!['html', 'pdf', 'png', 'mp4'].includes(args.format)) {
		throw new Error(`Unsupported --format ${args.format}`);
	}
	if (!['standalone', 'server-script'].includes(args.htmlMode)) {
		throw new Error(`Unsupported --html-mode ${args.htmlMode}`);
	}
	if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
		throw new Error('--timeout-ms must be a positive number');
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
		'  --format <html|pdf|png|mp4> Export format, default: html',
		'  --html-mode <standalone|server-script> HTML mode, default: standalone',
		'  --output-subfolder <path>  Vault-relative output folder, default: export',
		'  --theme <name>             Slidev theme, default: default',
		'  --sample-slides <list|all> Comma-separated slide numbers for Playwright, default: all slides',
		'  --no-playwright            Skip browser rendering checks',
		'  --no-screenshots           Do not write Playwright screenshots',
		'  --json                     Print only the final JSON report',
	].join('\n'));
}

async function bundleSlideExportModules() {
	const result = await esbuild.build({
		stdin: {
			contents: [
				"export { probeEnvironment } from './src/slideExport/environmentProber';",
				"export { prepareSlidevExportSource } from './src/slideExport/slidevSourcePreparer';",
				"export { exportSlidevHtml, exportSlidevPdf, exportSlidevPng } from './src/slideExport/slidevExporter';",
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
	return {
		path: deckPath,
		bytes: fs.statSync(deckPath).size,
		theme: (deck.match(/^theme:\s*(.+)$/m) || [])[1] || null,
		mermaidBlocks: (deck.match(/```mermaid/g) || []).length,
		zoomLines: [...deck.matchAll(/^zoom:\s*(.+)$/gm)].map(match => match[1]),
		containsKnownStaleText: deck.includes('快速定位'),
		containsMissingTheme: deck.includes('seriph'),
	};
}

async function collectRenderedSlideMeasurement(page, slide) {
	return page.evaluate(() => {
		const toRect = rect => ({
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
		});
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
				width: 0,
				height: 0,
			};
		}, null);
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
		];
		const seen = new Set();
		const elements = [];

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

				const rect = toRect(element.getBoundingClientRect());
				if (rect.width < 2 || rect.height < 2 || !overlaps(rect, slideRootRect)) {
					continue;
				}

				elements.push({
					kind,
					selector,
					textLength: (element.textContent || '').trim().length,
					scrollWidth: element.scrollWidth || rect.width,
					scrollHeight: element.scrollHeight || rect.height,
					clientWidth: element.clientWidth || rect.width,
					clientHeight: element.clientHeight || rect.height,
					rect,
				});
			}
		}

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
			errors: [],
		};
	});
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
			await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
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

function resolveSlidesToAudit(sampleSlides, deckMarkdown, slideExport) {
	const deckSlideCount = deckMarkdown ? slideExport.countSlideDeckSlides(deckMarkdown) : 0;
	const allSlides = Array.from({ length: Math.max(deckSlideCount, 1) }, (_, index) => index + 1);
	if (!Array.isArray(sampleSlides) || sampleSlides.length === 0) {
		return allSlides;
	}

	const filteredSlides = sampleSlides.filter(slide => Number.isFinite(slide) && slide >= 1 && slide <= deckSlideCount);
	return filteredSlides.length > 0 ? filteredSlides : allSlides;
}

function checkIgnored(pathsToCheck) {
	const existingPaths = pathsToCheck.filter(Boolean).filter(filePath => fs.existsSync(filePath));
	if (existingPaths.length === 0) {
		return [];
	}

	const relativePaths = existingPaths.map(filePath => path.relative(process.cwd(), filePath));
	const result = childProcess.spawnSync('git', ['check-ignore', '-v', ...relativePaths], {
		cwd: process.cwd(),
		encoding: 'utf8',
	});

	return result.stdout
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(Boolean);
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

	const environment = await slideExport.probeEnvironment();
	const slideSource = await slideExport.prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);
	let exportPath;

	if (args.format === 'html') {
		exportPath = await slideExport.exportSlidevHtml(app, slideSource, config, onProgress);
	} else if (args.format === 'pdf') {
		exportPath = await slideExport.exportSlidevPdf(app, slideSource, config, onProgress);
	} else if (args.format === 'png') {
		exportPath = await slideExport.exportSlidevPng(app, slideSource, config, onProgress);
	} else if (args.format === 'mp4') {
		const pngDirectory = await slideExport.exportSlidevPng(app, slideSource, config, onProgress);
		exportPath = await slideExport.exportVideoMp4(app, pngDirectory, slideSource.outputBasename, config, onProgress);
	}

	let absoluteExportPath = path.join(vaultRoot, exportPath);
	const absoluteDeckPath = slideSource.preparedDeckPath ? path.join(vaultRoot, slideSource.preparedDeckPath) : null;
	let deckSummary = collectDeckSummary(absoluteDeckPath);
	let playwrightChecks = [];
	let layoutAudits = [];
	let layoutAuditSummary = slideExport.summarizeLayoutAudits([], 0);
	let layoutPatchAttempts = [];
	let auditedSlides = [];
	let retryCount = 0;

	if (args.playwright && args.format === 'html') {
		let currentExportPath = absoluteExportPath;
		let currentDeckMarkdown = absoluteDeckPath && fs.existsSync(absoluteDeckPath)
			? fs.readFileSync(absoluteDeckPath, 'utf8')
			: null;

		while (true) {
			auditedSlides = resolveSlidesToAudit(args.sampleSlides, currentDeckMarkdown, slideExport);
			const auditResult = await runPlaywrightChecks(currentExportPath, auditedSlides, args.screenshots, slideExport);
			playwrightChecks = auditResult.checks;
			layoutAudits = auditResult.layoutAudits;
			layoutAuditSummary = slideExport.summarizeLayoutAudits(layoutAudits, retryCount);

			if (!currentDeckMarkdown || !absoluteDeckPath || retryCount >= LAYOUT_AUDIT_CONFIG.maxAutoPatchPasses) {
				break;
			}

			const patchResult = slideExport.patchDeckWithLayoutAudit(currentDeckMarkdown, layoutAudits, LAYOUT_AUDIT_CONFIG);
			layoutPatchAttempts.push({
				pass: retryCount + 1,
				changed: patchResult.changed,
				changedSlides: patchResult.changedSlides,
				blockedSlides: patchResult.blockedSlides,
			});

			if (!patchResult.changed) {
				break;
			}

			currentDeckMarkdown = patchResult.deckMarkdown;
			fs.writeFileSync(absoluteDeckPath, currentDeckMarkdown, 'utf8');
			retryCount += 1;
			onProgress('layout-audit', `Patched deck on slides ${patchResult.changedSlides.join(', ')} and rebuilding...`);
			exportPath = await slideExport.exportSlidevHtml(app, slideSource, config, onProgress);
			currentExportPath = path.join(vaultRoot, exportPath);
			absoluteExportPath = currentExportPath;
			deckSummary = collectDeckSummary(absoluteDeckPath);
		}
	}

	const ignoredOutputs = checkIgnored([
		absoluteDeckPath,
		absoluteExportPath,
		...playwrightChecks.map(check => check.screenshotPath),
	]);
	const hasLayoutFailures = layoutAudits.some(audit => audit.findings.length > 0);

	const report = {
		ok: playwrightChecks.every(check => !check.failed)
			&& environment.capabilities[args.format] === true
			&& fs.existsSync(absoluteExportPath)
			&& ignoredOutputs.length === 0
			&& !hasLayoutFailures
			&& (!deckSummary || (!deckSummary.containsKnownStaleText && !deckSummary.containsMissingTheme)),
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
		},
		deck: deckSummary,
		playwright: playwrightChecks,
		playwrightSlides: auditedSlides,
		layoutAudit: layoutAudits,
		layoutAuditSummary,
		layoutPatchAttempts,
		ignoredOutputs,
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
