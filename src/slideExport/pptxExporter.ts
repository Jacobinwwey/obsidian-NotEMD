import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import type { App } from 'obsidian';
import { startLocalServer, stopLocalServer } from './localServer';
import { countSlideDeckSlides } from './slidevLayoutAudit';
import { extractSlidevPptxSlideFromPage } from './pptxDomExtractor';
import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxDocument,
	type SlidevPptxExportReport,
	type SlidevPptxExportResult,
	type SlidevPptxImage,
	type SlidevPptxSlide,
} from './pptxModel';
import { writePptxDocument } from './pptxWriter';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from './platformUtils';
import type { ExportProgressCallback, SlideExportConfig, SlidevExportSource } from './types';

type PlaywrightRuntime = {
	chromium?: {
		launch(options: { headless: boolean }): Promise<any>;
	};
};

function resolvePlaywrightRuntime(): PlaywrightRuntime | null {
	const playwrightBrowsersPath = resolvePlaywrightBrowsersPath();
	if (playwrightBrowsersPath && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
		process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightBrowsersPath;
	}

	const playwright = safeRequire('playwright') as PlaywrightRuntime | null;
	return playwright?.chromium ? playwright : null;
}

function resolveSlideCount(source: SlidevExportSource, vaultRoot: string): { slideCount: number; deckPath: string | null } {
	const deckPath = source.preparedDeckPath
		? join(vaultRoot, source.preparedDeckPath)
		: join(vaultRoot, source.inputFilePath);
	if (!existsSync(deckPath)) {
		return { slideCount: 1, deckPath: null };
	}
	const deckMarkdown = readFileSync(deckPath, 'utf8');
	return {
		slideCount: Math.max(1, countSlideDeckSlides(deckMarkdown)),
		deckPath,
	};
}

async function openSlideForPptxExport(page: any, targetUrl: string, timeoutMs: number): Promise<void> {
	await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: Math.min(timeoutMs, 60_000) });
	if (typeof page.waitForLoadState === 'function') {
		await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
	}
	if (typeof page.waitForFunction === 'function') {
		await page.waitForFunction(
			() => {
				const root = document.querySelector('.slidev-page, .slidev-layout, .slidev-slide-content, #app');
				return Boolean(root && (root.textContent || '').trim().length > 0);
			},
			null,
			{ timeout: 20_000 },
		).catch(() => undefined);
	}
	await page.waitForTimeout(500);
}

async function captureSlideBackground(page: any, slideNumber: number): Promise<SlidevPptxImage> {
	const clip = await page.evaluate(() => {
		const candidates = Array.from(document.querySelectorAll('.slidev-page, .slidev-layout, .slidev-slide-content, #app'));
		let best: { x: number; y: number; width: number; height: number; area: number } | null = null;
		for (const candidate of candidates) {
			const style = window.getComputedStyle(candidate);
			if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') < 0.04) {
				continue;
			}
			const rect = candidate.getBoundingClientRect();
			if (rect.width < 2 || rect.height < 2) continue;
			const left = Math.max(0, rect.left);
			const top = Math.max(0, rect.top);
			const right = Math.min(window.innerWidth, rect.right);
			const bottom = Math.min(window.innerHeight, rect.bottom);
			if (right <= left || bottom <= top) continue;
			const area = (right - left) * (bottom - top);
			if (!best || area > best.area) {
				best = { x: left, y: top, width: right - left, height: bottom - top, area };
			}
		}
		return best;
	}) as { x: number; y: number; width: number; height: number; area: number } | null;
	const screenshot = clip
		? await page.screenshot({ type: 'png', clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height } })
		: await page.screenshot({ type: 'png', fullPage: false });
	return {
		data: new Uint8Array(screenshot),
		mimeType: 'image/png',
		x: 0,
		y: 0,
		w: PPTX_SLIDE_WIDTH_IN,
		h: PPTX_SLIDE_HEIGHT_IN,
		name: `Slide ${slideNumber} visual fallback`,
		order: 0,
	};
}

async function extractSlidesFromHtml(
	htmlPath: string,
	slideCount: number,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<SlidevPptxSlide[]> {
	const playwright = resolvePlaywrightRuntime();
	if (!playwright?.chromium) {
		throw new Error('Playwright runtime is unavailable; PPTX export requires Playwright Chromium.');
	}

	const browser = await playwright.chromium.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	let serverDirectory: string | null = null;
	let baseUrl: string | null = null;

	try {
		if (htmlPath.endsWith('/index.html')) {
			serverDirectory = dirname(htmlPath);
			const port = await startLocalServer(serverDirectory);
			baseUrl = `http://localhost:${port}/index.html`;
		}

		const slides: SlidevPptxSlide[] = [];
		for (let slideNumber = 1; slideNumber <= slideCount; slideNumber += 1) {
			onProgress?.('pptx-export', `Extracting editable slide ${slideNumber}/${slideCount}...`);
			const targetUrl = baseUrl
				? `${baseUrl}#/${slideNumber}`
				: `${pathToFileURL(htmlPath).toString()}#/${slideNumber}`;
			await openSlideForPptxExport(page, targetUrl, config.timeoutMs);
			const slide = await extractSlidevPptxSlideFromPage(page, slideNumber);
			slide.backgroundImage = await captureSlideBackground(page, slideNumber);
			slides.push(slide);
		}
		return slides;
	} finally {
		await browser.close();
		if (serverDirectory) {
			stopLocalServer(serverDirectory);
		}
	}
}

function buildReport(
	htmlPath: string,
	deckPath: string | null,
	pptxPath: string,
	reportPath: string,
	slides: SlidevPptxSlide[],
): SlidevPptxExportReport {
	const pagesWithoutEditableText = slides
		.filter(slide => slide.texts.length === 0)
		.map(slide => slide.slideNumber);
	const warnings = slides.flatMap(slide => slide.warnings);
	return {
		formatVersion: 1,
		source: {
			htmlPath,
			deckPath,
		},
		output: {
			pptxPath,
			reportPath,
		},
		slideCount: slides.length,
		textBoxCount: slides.reduce((total, slide) => total + slide.texts.length, 0),
		editableTextSlideCount: slides.length - pagesWithoutEditableText.length,
		pagesWithoutEditableText,
		backgroundImageSlideCount: slides.filter(slide => Boolean(slide.backgroundImage)).length,
		imageFallbackCount: slides.filter(slide => Boolean(slide.backgroundImage)).length,
		warnings,
	};
}

export async function exportSlidevPptxFromHtml(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	htmlExportPath: string,
	onProgress?: ExportProgressCallback,
): Promise<SlidevPptxExportResult> {
	onProgress?.('pptx-export', 'Creating editable PPTX from rendered Slidev HTML...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const absoluteHtmlPath = join(vaultRoot, htmlExportPath);
	const { slideCount, deckPath } = resolveSlideCount(source, vaultRoot);
	const slides = await extractSlidesFromHtml(absoluteHtmlPath, slideCount, config, onProgress);
	const outputPath = join(vaultRoot, config.outputSubfolder, `${source.outputBasename}.pptx`);
	const reportPath = join(vaultRoot, config.outputSubfolder, `${source.outputBasename}.pptx.report.json`);
	const document: SlidevPptxDocument = {
		title: source.sourceLabel || source.outputBasename,
		author: 'NoteMD',
		slides,
	};

	writePptxDocument(outputPath, document);
	const report = buildReport(absoluteHtmlPath, deckPath, outputPath, reportPath, slides);
	writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
	onProgress?.('pptx-export', `PPTX export complete with ${report.textBoxCount} editable text boxes.`);

	return {
		path: `${config.outputSubfolder}/${source.outputBasename}.pptx`,
		reportPath: `${config.outputSubfolder}/${source.outputBasename}.pptx.report.json`,
		report,
	};
}
