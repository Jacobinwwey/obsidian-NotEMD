import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import type { App } from 'obsidian';
import { startLocalServer, stopLocalServer } from './localServer';
import { countSlideDeckSlides } from './slidevLayoutAudit';
import { extractSlidevPptxSlideFromPage } from './pptxDomExtractor';
import {
	PPTX_SLIDE_HEIGHT_IN,
	PPTX_SLIDE_WIDTH_IN,
	type SlidevPptxEditablePrimitiveCoverage,
	type SlidevPptxDocument,
	type SlidevPptxExportReport,
	type SlidevPptxExportResult,
	type SlidevPptxImage,
	type SlidevPptxSlide,
	type SlidevPptxSlideEditabilitySummary,
	type SlidevPptxTable,
	type SlidevPptxTextBox,
	type SlidevPptxTextSourceKind,
	type SlidevPptxVisibleNativeResidueSamplingSummary,
	type SlidevPptxVisibleNativeSlideResidueSampling,
} from './pptxModel';
import { buildSlidevPptxFontContractSummary, fontFamiliesForSlideSummary } from './pptxFontContract';
import { writePptxDocument, writeVisibleNativeExperimentPptxDocument } from './pptxWriter';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from './platformUtils';
import type { ExportProgressCallback, SlideExportConfig, SlidevExportSource } from './types';

type PlaywrightRuntime = {
	chromium?: {
		launch(options: { headless: boolean }): Promise<any>;
	};
};

const PPTX_CAPTURE_VIEWPORT_WIDTH = 1960;
const PPTX_CAPTURE_VIEWPORT_HEIGHT = 1104;
const PPTX_CAPTURE_DEVICE_SCALE_FACTOR = 2;
const VISIBLE_NATIVE_RESIDUE_COLOR_DISTANCE = 62;
const VISIBLE_NATIVE_RESIDUE_RATIO_THRESHOLD = 0.075;
const VISIBLE_NATIVE_RESIDUE_MIN_TEXT_LIKE_PIXELS = 8;
const VISIBLE_NATIVE_RESIDUE_TEXT_BOX_LIMIT = 24;
const VISIBLE_NATIVE_RESIDUE_TABLE_CELL_LIMIT = 16;
const VISIBLE_NATIVE_BACKGROUND_CAPTURE_ATTEMPTS = 3;

export interface SlidevPptxRenderedHtmlReferencePngSequenceResult {
	path: string;
	absolutePath: string;
	slideCount: number;
	viewport: {
		width: number;
		height: number;
		deviceScaleFactor: number;
	};
}

type VisibleNativeResidueRegion = {
	kind: 'text-box' | 'table-cell';
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
	fontSize: number;
	text: string;
};

type VisibleNativeExperimentBackgroundCapture = {
	visualBackground: SlidevPptxImage;
	residueSampling: SlidevPptxVisibleNativeSlideResidueSampling;
	warnings: string[];
};

function resolvePlaywrightRuntime(): PlaywrightRuntime | null {
	const playwrightBrowsersPath = resolvePlaywrightBrowsersPath();
	if (playwrightBrowsersPath && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
		process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightBrowsersPath;
	}

	const playwright = safeRequire('playwright') as PlaywrightRuntime | null;
	return playwright?.chromium ? playwright : null;
}

function resolveSlideCount(
	source: SlidevExportSource,
	vaultRoot: string,
): { slideCount: number; deckPath: string | null } {
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
	await page.goto(targetUrl, {
		waitUntil: 'domcontentloaded',
		timeout: Math.min(timeoutMs, 60_000),
	});
	if (typeof page.waitForLoadState === 'function') {
		await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
	}
	if (typeof page.waitForFunction === 'function') {
		await page
			.waitForFunction(
				() => {
					const root = document.querySelector('.slidev-page, .slidev-layout, .slidev-slide-content, #app');
					return Boolean(root && (root.textContent || '').trim().length > 0);
				},
				null,
				{ timeout: 20_000 },
			)
			.catch(() => undefined);
	}
	await stabilizeSlideForPptxExport(page);
	await page.waitForTimeout(500);
}

async function stabilizeSlideForPptxExport(page: any): Promise<void> {
	await page.evaluate(async () => {
		document.getElementById('notemd-pptx-freeze-page')?.remove();
		const style = document.createElement('style');
		style.id = 'notemd-pptx-freeze-page';
		style.textContent = [
			'html { scroll-behavior: auto !important; }',
			'*, *::before, *::after {',
			'animation: none !important;',
			'animation-delay: 0s !important;',
			'animation-duration: 0s !important;',
			'animation-play-state: paused !important;',
			'transition: none !important;',
			'transition-delay: 0s !important;',
			'transition-duration: 0s !important;',
			'}',
		].join('\n');
		document.head.appendChild(style);

		try {
			document.getAnimations?.().forEach((animation) => {
				try {
					animation.finish();
				} catch (_finishError) {
					try {
						animation.cancel();
					} catch (_cancelError) {
						// Some browser-managed animations cannot be controlled; the CSS freeze still applies.
					}
				}
			});
		} catch (_animationError) {
			// Animation APIs are best-effort across Slidev/Vue runtime versions.
		}

		try {
			await document.fonts?.ready;
		} catch (_fontError) {
			// Font readiness can reject for blocked external providers; continue with rendered fallback fonts.
		}

		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		void document.body.offsetHeight;
	});
}

async function resetSlidePptxExtractionState(page: any): Promise<void> {
	await page.evaluate(() => {
		document.getElementById('notemd-pptx-hide-text')?.remove();
		for (const element of Array.from(
			document.querySelectorAll('[data-notemd-pptx-hidden-text], [data-notemd-pptx-consumed-table]'),
		)) {
			element.removeAttribute('data-notemd-pptx-hidden-text');
			element.removeAttribute('data-notemd-pptx-consumed-table');
		}
	});
}

async function captureSlideBackground(page: any, slideNumber: number): Promise<SlidevPptxImage> {
	const clip = (await page.evaluate(() => {
		const candidates = Array.from(
			document.querySelectorAll('.slidev-page, .slidev-layout, .slidev-slide-content, #app'),
		);
		let best: {
			x: number;
			y: number;
			width: number;
			height: number;
			area: number;
		} | null = null;
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
				best = {
					x: left,
					y: top,
					width: right - left,
					height: bottom - top,
					area,
				};
			}
		}
		return best;
	})) as {
		x: number;
		y: number;
		width: number;
		height: number;
		area: number;
	} | null;
	const screenshot = clip
		? await page.screenshot({
				type: 'png',
				clip: {
					x: clip.x,
					y: clip.y,
					width: clip.width,
					height: clip.height,
				},
			})
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

async function prepareVisibleNativeExperimentBackground(page: any): Promise<void> {
	await page.evaluate(async () => {
		document.getElementById('notemd-pptx-visible-native-background')?.remove();
		const style = document.createElement('style');
		style.id = 'notemd-pptx-visible-native-background';
		style.textContent = [
			'[data-notemd-pptx-consumed-table="1"],',
			'[data-notemd-pptx-consumed-table="1"] table,',
			'[data-notemd-pptx-consumed-table="1"] tr,',
			'[data-notemd-pptx-consumed-table="1"] td,',
			'[data-notemd-pptx-consumed-table="1"] th {',
			'background-color: transparent !important;',
			'background-image: none !important;',
			'border-color: transparent !important;',
			'box-shadow: none !important;',
			'}',
		].join('\n');
		document.head.appendChild(style);
		void document.body.offsetHeight;
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	});
}

function normalizeResidueColor(value: string): string {
	const normalized = String(value || '')
		.trim()
		.replace(/^#/, '')
		.toUpperCase();
	return /^[0-9A-F]{6}$/.test(normalized) ? normalized : '';
}

function visibleNativeTextResidueRegions(slide: SlidevPptxSlide): VisibleNativeResidueRegion[] {
	return slide.texts
		.map((textBox) => ({
			kind: 'text-box' as const,
			x: textBox.x,
			y: textBox.y,
			w: textBox.w,
			h: textBox.h,
			color: normalizeResidueColor(textBox.color),
			fontSize: textBox.fontSize,
			text: textBox.text,
		}))
		.filter((region) => region.color && region.text.trim().length >= 2 && region.w > 0.05 && region.h > 0.03)
		.sort((left, right) => right.fontSize * right.w * right.h - left.fontSize * left.w * left.h)
		.slice(0, VISIBLE_NATIVE_RESIDUE_TEXT_BOX_LIMIT);
}

function visibleNativeTableResidueRegionsForTable(table: SlidevPptxTable): VisibleNativeResidueRegion[] {
	const regions: VisibleNativeResidueRegion[] = [];
	const rowHeights = table.rowHeights.length > 0 ? table.rowHeights : table.rows.map(() => table.h / table.rows.length);
	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
		const row = table.rows[rowIndex];
		let columnIndex = 0;
		for (const cell of row) {
			const colSpan = Math.max(1, cell.colSpan);
			const rowSpan = Math.max(1, cell.rowSpan);
			const x = table.x + table.colWidths.slice(0, columnIndex).reduce((total, width) => total + width, 0);
			const y = table.y + rowHeights.slice(0, rowIndex).reduce((total, height) => total + height, 0);
			const w = table.colWidths
				.slice(columnIndex, columnIndex + colSpan)
				.reduce((total, width) => total + width, table.colWidths.length > 0 ? 0 : table.w / Math.max(1, colSpan));
			const h = rowHeights.slice(rowIndex, rowIndex + rowSpan).reduce((total, height) => total + height, 0);
			const color = normalizeResidueColor(cell.color);
			if (color && cell.text.trim().length >= 2 && w > 0.05 && h > 0.03) {
				regions.push({
					kind: 'table-cell',
					x,
					y,
					w,
					h,
					color,
					fontSize: cell.fontSize,
					text: cell.text,
				});
			}
			columnIndex += colSpan;
		}
	}
	return regions;
}

function visibleNativeTableResidueRegions(slide: SlidevPptxSlide): VisibleNativeResidueRegion[] {
	return slide.tables
		.flatMap(visibleNativeTableResidueRegionsForTable)
		.sort((left, right) => right.fontSize * right.w * right.h - left.fontSize * left.w * left.h)
		.slice(0, VISIBLE_NATIVE_RESIDUE_TABLE_CELL_LIMIT);
}

async function sampleVisibleNativeResidueFromBackground(
	page: any,
	visualBackground: SlidevPptxImage,
	slide: SlidevPptxSlide,
): Promise<SlidevPptxVisibleNativeSlideResidueSampling> {
	const textRegions = visibleNativeTextResidueRegions(slide);
	const tableRegions = visibleNativeTableResidueRegions(slide);
	const regions = [...textRegions, ...tableRegions];
	if (regions.length === 0) {
		return {
			slideNumber: slide.slideNumber,
			sampledTextBoxCount: 0,
			sampledTableCellCount: 0,
			checkedRegionCount: 0,
			suspiciousRegionCount: 0,
			maxTextLikePixelRatio: 0,
			suspicious: false,
		};
	}

	const dataUrl = `data:${visualBackground.mimeType};base64,${Buffer.from(visualBackground.data).toString('base64')}`;
	const sampled = (await page.evaluate(
		async ({
			dataUrl: sourceDataUrl,
			regions: sourceRegions,
			slideWidthIn,
			slideHeightIn,
			colorDistanceThreshold,
			ratioThreshold,
			minTextLikePixels,
		}: {
			dataUrl: string;
			regions: VisibleNativeResidueRegion[];
			slideWidthIn: number;
			slideHeightIn: number;
			colorDistanceThreshold: number;
			ratioThreshold: number;
			minTextLikePixels: number;
		}) => {
			const parseHexColor = (value: string): { r: number; g: number; b: number } | null => {
				const normalized = String(value || '').trim().replace(/^#/, '');
				if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
				return {
					r: Number.parseInt(normalized.slice(0, 2), 16),
					g: Number.parseInt(normalized.slice(2, 4), 16),
					b: Number.parseInt(normalized.slice(4, 6), 16),
				};
			};
			const colorDistance = (
				left: { r: number; g: number; b: number },
				right: { r: number; g: number; b: number },
			): number => {
				const dr = left.r - right.r;
				const dg = left.g - right.g;
				const db = left.b - right.b;
				return Math.sqrt(dr * dr + dg * dg + db * db);
			};
			const image = new Image();
			await new Promise<void>((resolve, reject) => {
				image.onload = () => resolve();
				image.onerror = () => reject(new Error('Unable to decode visible-native background image.'));
				image.src = sourceDataUrl;
			});
			const width = image.naturalWidth || image.width;
			const height = image.naturalHeight || image.height;
			if (!width || !height) {
				return {
					checkedRegionCount: 0,
					suspiciousRegionCount: 0,
					maxTextLikePixelRatio: 0,
				};
			}
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d', { willReadFrequently: true });
			if (!context) {
				return {
					checkedRegionCount: 0,
					suspiciousRegionCount: 0,
					maxTextLikePixelRatio: 0,
				};
			}
			context.drawImage(image, 0, 0);
			const pixels = context.getImageData(0, 0, width, height).data;
			let checkedRegionCount = 0;
			let suspiciousRegionCount = 0;
			let maxTextLikePixelRatio = 0;

			for (const region of sourceRegions) {
				const target = parseHexColor(region.color);
				if (!target) continue;
				const left = Math.max(0, Math.floor((region.x / slideWidthIn) * width));
				const top = Math.max(0, Math.floor((region.y / slideHeightIn) * height));
				const right = Math.min(width - 1, Math.ceil(((region.x + region.w) / slideWidthIn) * width));
				const bottom = Math.min(height - 1, Math.ceil(((region.y + region.h) / slideHeightIn) * height));
				const regionWidth = right - left;
				const regionHeight = bottom - top;
				if (regionWidth < 4 || regionHeight < 4) continue;
				checkedRegionCount += 1;
				let samples = 0;
				let textLikePixels = 0;
				const columns = Math.min(18, Math.max(3, Math.floor(regionWidth / 3)));
				const rows = Math.min(10, Math.max(3, Math.floor(regionHeight / 3)));
				for (let row = 0; row < rows; row += 1) {
					const y = Math.min(bottom, top + Math.floor(((row + 0.5) * regionHeight) / rows));
					for (let column = 0; column < columns; column += 1) {
						const x = Math.min(right, left + Math.floor(((column + 0.5) * regionWidth) / columns));
						const index = (y * width + x) * 4;
						samples += 1;
						const candidate = {
							r: pixels[index] || 0,
							g: pixels[index + 1] || 0,
							b: pixels[index + 2] || 0,
						};
						if (colorDistance(candidate, target) <= colorDistanceThreshold) {
							textLikePixels += 1;
						}
					}
				}
				const ratio = samples > 0 ? textLikePixels / samples : 0;
				maxTextLikePixelRatio = Math.max(maxTextLikePixelRatio, ratio);
				if (textLikePixels >= minTextLikePixels && ratio >= ratioThreshold) {
					suspiciousRegionCount += 1;
				}
			}

			return {
				checkedRegionCount,
				suspiciousRegionCount,
				maxTextLikePixelRatio,
			};
		},
		{
			dataUrl,
			regions,
			slideWidthIn: PPTX_SLIDE_WIDTH_IN,
			slideHeightIn: PPTX_SLIDE_HEIGHT_IN,
			colorDistanceThreshold: VISIBLE_NATIVE_RESIDUE_COLOR_DISTANCE,
			ratioThreshold: VISIBLE_NATIVE_RESIDUE_RATIO_THRESHOLD,
			minTextLikePixels: VISIBLE_NATIVE_RESIDUE_MIN_TEXT_LIKE_PIXELS,
		},
	)) as {
		checkedRegionCount: number;
		suspiciousRegionCount: number;
		maxTextLikePixelRatio: number;
	};

	const maxTextLikePixelRatio = Number((sampled.maxTextLikePixelRatio || 0).toFixed(6));
	return {
		slideNumber: slide.slideNumber,
		sampledTextBoxCount: textRegions.length,
		sampledTableCellCount: tableRegions.length,
		checkedRegionCount: Math.max(0, Math.round(Number(sampled.checkedRegionCount) || 0)),
		suspiciousRegionCount: Math.max(0, Math.round(Number(sampled.suspiciousRegionCount) || 0)),
		maxTextLikePixelRatio,
		suspicious: (sampled.suspiciousRegionCount || 0) > 0,
	};
}

function summarizeVisibleNativeResidueSampling(
	slides: SlidevPptxVisibleNativeSlideResidueSampling[],
): SlidevPptxVisibleNativeResidueSamplingSummary {
	return {
		slideCount: slides.length,
		sampledSlideCount: slides.filter((slide) => slide.checkedRegionCount > 0).length,
		suspiciousSlideCount: slides.filter((slide) => slide.suspicious).length,
		checkedRegionCount: slides.reduce((total, slide) => total + slide.checkedRegionCount, 0),
		suspiciousRegionCount: slides.reduce((total, slide) => total + slide.suspiciousRegionCount, 0),
		maxTextLikePixelRatio: Number(
			Math.max(0, ...slides.map((slide) => slide.maxTextLikePixelRatio)).toFixed(6),
		),
		threshold: {
			colorDistance: VISIBLE_NATIVE_RESIDUE_COLOR_DISTANCE,
			textLikePixelRatio: VISIBLE_NATIVE_RESIDUE_RATIO_THRESHOLD,
			minTextLikePixels: VISIBLE_NATIVE_RESIDUE_MIN_TEXT_LIKE_PIXELS,
		},
		slides,
	};
}

async function captureVisibleNativeExperimentBackground(
	page: any,
	slide: SlidevPptxSlide,
): Promise<VisibleNativeExperimentBackgroundCapture> {
	let finalBackground: SlidevPptxImage | null = null;
	let finalResidueSampling: SlidevPptxVisibleNativeSlideResidueSampling | null = null;

	for (let attempt = 1; attempt <= VISIBLE_NATIVE_BACKGROUND_CAPTURE_ATTEMPTS; attempt += 1) {
		await prepareVisibleNativeExperimentBackground(page);
		const visualBackground = await captureSlideBackground(page, slide.slideNumber);
		const residueSampling = await sampleVisibleNativeResidueFromBackground(page, visualBackground, slide);
		finalBackground = visualBackground;
		finalResidueSampling = residueSampling;
		if (!residueSampling.suspicious) {
			const warnings =
				attempt > 1
					? [
							`Slide ${slide.slideNumber} visible-native background residue cleared after ${attempt} capture attempts.`,
						]
					: [];
			return { visualBackground, residueSampling, warnings };
		}
	}

	if (!finalBackground || !finalResidueSampling) {
		throw new Error(`Unable to capture visible-native experiment background for slide ${slide.slideNumber}.`);
	}
	return {
		visualBackground: finalBackground,
		residueSampling: finalResidueSampling,
		warnings: [
			`Slide ${slide.slideNumber} visible-native background residue sampling is suspicious after ${VISIBLE_NATIVE_BACKGROUND_CAPTURE_ATTEMPTS} attempts (${finalResidueSampling.suspiciousRegionCount} region(s), max ratio ${finalResidueSampling.maxTextLikePixelRatio}).`,
		],
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
	const page = await browser.newPage({
		viewport: {
			width: PPTX_CAPTURE_VIEWPORT_WIDTH,
			height: PPTX_CAPTURE_VIEWPORT_HEIGHT,
		},
		deviceScaleFactor: PPTX_CAPTURE_DEVICE_SCALE_FACTOR,
	});
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
			await resetSlidePptxExtractionState(page);
			const visualBackground = await captureSlideBackground(page, slideNumber);
			const slide = await extractSlidevPptxSlideFromPage(page, slideNumber);
			slide.backgroundImage = visualBackground;
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

async function capturePptxRenderedHtmlReferenceImages(
	htmlPath: string,
	slideCount: number,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<SlidevPptxImage[]> {
	const playwright = resolvePlaywrightRuntime();
	if (!playwright?.chromium) {
		throw new Error('Playwright runtime is unavailable; PPTX rendered-HTML PNG reference requires Playwright Chromium.');
	}

	const browser = await playwright.chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: {
			width: PPTX_CAPTURE_VIEWPORT_WIDTH,
			height: PPTX_CAPTURE_VIEWPORT_HEIGHT,
		},
		deviceScaleFactor: PPTX_CAPTURE_DEVICE_SCALE_FACTOR,
	});
	let serverDirectory: string | null = null;
	let baseUrl: string | null = null;

	try {
		if (htmlPath.endsWith('/index.html')) {
			serverDirectory = dirname(htmlPath);
			const port = await startLocalServer(serverDirectory);
			baseUrl = `http://localhost:${port}/index.html`;
		}

		const images: SlidevPptxImage[] = [];
		for (let slideNumber = 1; slideNumber <= slideCount; slideNumber += 1) {
			onProgress?.(
				'pptx-rendered-html-reference',
				`Capturing rendered-HTML PNG reference slide ${slideNumber}/${slideCount}...`,
			);
			const targetUrl = baseUrl
				? `${baseUrl}#/${slideNumber}`
				: `${pathToFileURL(htmlPath).toString()}#/${slideNumber}`;
			await openSlideForPptxExport(page, targetUrl, config.timeoutMs);
			await resetSlidePptxExtractionState(page);
			images.push(await captureSlideBackground(page, slideNumber));
		}
		return images;
	} finally {
		await browser.close();
		if (serverDirectory) {
			stopLocalServer(serverDirectory);
		}
	}
}

async function extractVisibleNativeExperimentSlidesFromHtml(
	htmlPath: string,
	slideCount: number,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<{
	slides: SlidevPptxSlide[];
	residueSampling: SlidevPptxVisibleNativeResidueSamplingSummary;
}> {
	const playwright = resolvePlaywrightRuntime();
	if (!playwright?.chromium) {
		throw new Error('Playwright runtime is unavailable; PPTX export requires Playwright Chromium.');
	}

	const browser = await playwright.chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: {
			width: PPTX_CAPTURE_VIEWPORT_WIDTH,
			height: PPTX_CAPTURE_VIEWPORT_HEIGHT,
		},
		deviceScaleFactor: PPTX_CAPTURE_DEVICE_SCALE_FACTOR,
	});
	let serverDirectory: string | null = null;
	let baseUrl: string | null = null;

	try {
		if (htmlPath.endsWith('/index.html')) {
			serverDirectory = dirname(htmlPath);
			const port = await startLocalServer(serverDirectory);
			baseUrl = `http://localhost:${port}/index.html`;
		}

		const slides: SlidevPptxSlide[] = [];
		const residueSlides: SlidevPptxVisibleNativeSlideResidueSampling[] = [];
		for (let slideNumber = 1; slideNumber <= slideCount; slideNumber += 1) {
			onProgress?.(
				'pptx-visible-native-experiment',
				`Extracting visible native slide ${slideNumber}/${slideCount}...`,
			);
			const targetUrl = baseUrl
				? `${baseUrl}#/${slideNumber}`
				: `${pathToFileURL(htmlPath).toString()}#/${slideNumber}`;
			await openSlideForPptxExport(page, targetUrl, config.timeoutMs);
			await resetSlidePptxExtractionState(page);
			const slide = await extractSlidevPptxSlideFromPage(page, slideNumber);
			const backgroundCapture = await captureVisibleNativeExperimentBackground(page, slide);
			slide.backgroundImage = backgroundCapture.visualBackground;
			slide.warnings.push(...backgroundCapture.warnings);
			slides.push(slide);
			residueSlides.push(backgroundCapture.residueSampling);
		}
		return {
			slides,
			residueSampling: summarizeVisibleNativeResidueSampling(residueSlides),
		};
	} finally {
		await browser.close();
		if (serverDirectory) {
			stopLocalServer(serverDirectory);
		}
	}
}

function ratio(count: number, total: number): number {
	return total > 0 ? Number((count / total).toFixed(6)) : 0;
}

function countTableCells(slide: SlidevPptxSlide): number {
	return slide.tables.reduce(
		(tableTotal, table) => tableTotal + table.rows.reduce((rowTotal, row) => rowTotal + row.length, 0),
		0,
	);
}

function countTableCellCharacters(slide: SlidevPptxSlide): number {
	return slide.tables.reduce(
		(tableTotal, table) =>
			tableTotal +
			table.rows.reduce(
				(rowTotal, row) => rowTotal + row.reduce((cellTotal, cell) => cellTotal + cell.text.length, 0),
				0,
			),
		0,
	);
}

function countRichTextRuns(slide: SlidevPptxSlide): number {
	return slide.texts.reduce(
		(total, textBox) =>
			total +
			textBox.richTextParagraphs.reduce((paragraphTotal, paragraph) => paragraphTotal + paragraph.runs.length, 0),
		0,
	);
}

function countRichTextBoxes(slide: SlidevPptxSlide): number {
	return slide.texts.filter((textBox) =>
		textBox.richTextParagraphs.some(
			(paragraph) => paragraph.runs.length > 1 || paragraph.runs.some((run) => run.code || run.link),
		),
	).length;
}

function countRichTextRunCharacters(slide: SlidevPptxSlide): number {
	return slide.texts.reduce(
		(total, textBox) =>
			total +
			textBox.richTextParagraphs.reduce(
				(paragraphTotal, paragraph) =>
					paragraphTotal + paragraph.runs.reduce((runTotal, run) => runTotal + run.text.length, 0),
				0,
			),
		0,
	);
}

function collectUniqueSorted<T extends string>(values: T[]): T[] {
	return Array.from(new Set(values)).sort();
}

function textSourceKindFor(textBox: SlidevPptxTextBox): SlidevPptxTextSourceKind {
	return textBox.sourceKind === 'code' ||
		textBox.sourceKind === 'mermaid-text' ||
		textBox.sourceKind === 'svg-text' ||
		textBox.sourceKind === 'table-cell-overlay'
		? textBox.sourceKind
		: 'body';
}

function countTextBoxesBySource(slide: SlidevPptxSlide, sourceKind: SlidevPptxTextSourceKind): number {
	return slide.texts.filter((textBox) => textSourceKindFor(textBox) === sourceKind).length;
}

function buildSlideEditabilitySummary(slide: SlidevPptxSlide): SlidevPptxSlideEditabilitySummary {
	const fontFamilies = fontFamiliesForSlideSummary(slide);
	return {
		slideNumber: slide.slideNumber,
		editableTextBoxCount: slide.texts.length,
		editableBodyTextBoxCount: countTextBoxesBySource(slide, 'body'),
		editableCodeTextBoxCount: countTextBoxesBySource(slide, 'code'),
		editableMermaidTextBoxCount: countTextBoxesBySource(slide, 'mermaid-text'),
		editableSvgTextBoxCount: countTextBoxesBySource(slide, 'svg-text'),
		editableTableCellOverlayTextBoxCount: countTextBoxesBySource(slide, 'table-cell-overlay'),
		editableTableCount: slide.tables.length,
		editableTableCellCount: countTableCells(slide),
		editableTextCharacterCount: slide.texts.reduce((total, textBox) => total + textBox.text.length, 0),
		editableTableCellCharacterCount: countTableCellCharacters(slide),
		richTextBoxCount: countRichTextBoxes(slide),
		richTextRunCount: countRichTextRuns(slide),
		richTextRunCharacterCount: countRichTextRunCharacters(slide),
		backgroundFallbackPresent: Boolean(slide.backgroundImage),
		fallbackOnlyElementKinds: collectUniqueSorted(slide.fallbackOnlyElementKinds),
		unmodeledTextRunReasons: collectUniqueSorted(slide.texts.flatMap((textBox) => textBox.unmodeledRunReasons)),
		...fontFamilies,
		consumedTableTextCandidateCount: slide.consumedTableTextCandidateCount,
		warnings: slide.warnings,
	};
}

function buildEditablePrimitiveCoverage(
	slideSummaries: SlidevPptxSlideEditabilitySummary[],
): SlidevPptxEditablePrimitiveCoverage {
	const slideCount = slideSummaries.length;
	const editableTextSlideCount = slideSummaries.filter((slide) => slide.editableTextBoxCount > 0).length;
	const editableTableSlideCount = slideSummaries.filter((slide) => slide.editableTableCount > 0).length;
	const backgroundFallbackSlideCount = slideSummaries.filter((slide) => slide.backgroundFallbackPresent).length;
	return {
		editableTextBoxCount: slideSummaries.reduce((total, slide) => total + slide.editableTextBoxCount, 0),
		editableBodyTextBoxCount: slideSummaries.reduce((total, slide) => total + slide.editableBodyTextBoxCount, 0),
		editableCodeTextBoxCount: slideSummaries.reduce((total, slide) => total + slide.editableCodeTextBoxCount, 0),
		editableMermaidTextBoxCount: slideSummaries.reduce(
			(total, slide) => total + slide.editableMermaidTextBoxCount,
			0,
		),
		editableSvgTextBoxCount: slideSummaries.reduce((total, slide) => total + slide.editableSvgTextBoxCount, 0),
		editableTableCellOverlayTextBoxCount: slideSummaries.reduce(
			(total, slide) => total + slide.editableTableCellOverlayTextBoxCount,
			0,
		),
		editableTextSlideCount,
		editableTextSlideRatio: ratio(editableTextSlideCount, slideCount),
		editableTextCharacterCount: slideSummaries.reduce(
			(total, slide) => total + slide.editableTextCharacterCount,
			0,
		),
		editableTableCount: slideSummaries.reduce((total, slide) => total + slide.editableTableCount, 0),
		editableTableSlideCount,
		editableTableSlideRatio: ratio(editableTableSlideCount, slideCount),
		editableTableCellCount: slideSummaries.reduce((total, slide) => total + slide.editableTableCellCount, 0),
		editableTableCellCharacterCount: slideSummaries.reduce(
			(total, slide) => total + slide.editableTableCellCharacterCount,
			0,
		),
		richTextBoxCount: slideSummaries.reduce((total, slide) => total + slide.richTextBoxCount, 0),
		richTextBoxRatio: ratio(
			slideSummaries.reduce((total, slide) => total + slide.richTextBoxCount, 0),
			slideSummaries.reduce((total, slide) => total + slide.editableTextBoxCount, 0),
		),
		richTextRunCount: slideSummaries.reduce((total, slide) => total + slide.richTextRunCount, 0),
		richTextRunCharacterCount: slideSummaries.reduce((total, slide) => total + slide.richTextRunCharacterCount, 0),
		backgroundFallbackSlideCount,
		backgroundFallbackSlideRatio: ratio(backgroundFallbackSlideCount, slideCount),
		fallbackOnlyElementKinds: collectUniqueSorted(
			slideSummaries.flatMap((slide) => slide.fallbackOnlyElementKinds),
		),
		unmodeledTextRunReasons: collectUniqueSorted(slideSummaries.flatMap((slide) => slide.unmodeledTextRunReasons)),
	};
}

export function buildSlidevPptxExportReport(
	htmlPath: string,
	deckPath: string | null,
	pptxPath: string,
	reportPath: string,
	slides: SlidevPptxSlide[],
): SlidevPptxExportReport {
	const pagesWithoutEditableText = slides
		.filter((slide) => slide.texts.length === 0)
		.map((slide) => slide.slideNumber);
	const warnings = slides.flatMap((slide) => slide.warnings);
	const slideSummaries = slides.map(buildSlideEditabilitySummary);
	const editablePrimitiveCoverage = buildEditablePrimitiveCoverage(slideSummaries);
	const fontContract = buildSlidevPptxFontContractSummary(slides);
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
		textBoxCount: editablePrimitiveCoverage.editableTextBoxCount,
		tableCount: editablePrimitiveCoverage.editableTableCount,
		consumedTableCount: editablePrimitiveCoverage.editableTableCount,
		consumedTableTextCandidateCount: slideSummaries.reduce(
			(total, slide) => total + slide.consumedTableTextCandidateCount,
			0,
		),
		richTextBoxCount: editablePrimitiveCoverage.richTextBoxCount,
		richTextRunCount: editablePrimitiveCoverage.richTextRunCount,
		editableTableCellCount: editablePrimitiveCoverage.editableTableCellCount,
		editableBodyTextBoxCount: editablePrimitiveCoverage.editableBodyTextBoxCount,
		editableCodeTextBoxCount: editablePrimitiveCoverage.editableCodeTextBoxCount,
		editableMermaidTextBoxCount: editablePrimitiveCoverage.editableMermaidTextBoxCount,
		editableSvgTextBoxCount: editablePrimitiveCoverage.editableSvgTextBoxCount,
		editableTableCellOverlayTextBoxCount: editablePrimitiveCoverage.editableTableCellOverlayTextBoxCount,
		editableTextSlideCount: slides.length - pagesWithoutEditableText.length,
		pagesWithoutEditableText,
		backgroundImageSlideCount: slides.filter((slide) => Boolean(slide.backgroundImage)).length,
		imageFallbackCount: slides.filter((slide) => Boolean(slide.backgroundImage)).length,
		editablePrimitiveCoverage,
		fontContract,
		fallbackOnlyElementKinds: editablePrimitiveCoverage.fallbackOnlyElementKinds,
		unmodeledTextRunReasons: editablePrimitiveCoverage.unmodeledTextRunReasons,
		slides: slideSummaries,
		visibleTextLayer: 'background-image',
		editableLayerRenderMode: 'transparent-structure',
		warnings,
	};
}

export function buildSlidevVisibleNativePptxExperimentReport(
	htmlPath: string,
	deckPath: string | null,
	pptxPath: string,
	reportPath: string,
	slides: SlidevPptxSlide[],
	residueSampling: SlidevPptxVisibleNativeResidueSamplingSummary,
): SlidevPptxExportReport {
	const report = buildSlidevPptxExportReport(htmlPath, deckPath, pptxPath, reportPath, slides);
	const experimentWarnings = [
		'Visible-native PPTX is experimental; default export keeps frozen background as the visible layer.',
		...slides.flatMap((slide) => slide.warnings),
	];
	return {
		...report,
		visibleTextLayer: 'native-text-experiment',
		editableLayerRenderMode: 'visible-native-experiment',
		visibleNativeExperiment: {
			status: 'experimental',
			nativeLayer: 'visible-text-and-table',
			backgroundCapture: 'after-extracted-dom-hidden',
			visualReference: 'default-frozen-background-required',
			residueSampling,
			warnings: experimentWarnings,
		},
		warnings: experimentWarnings,
	};
}

export async function exportSlidevPptxRenderedHtmlReferencePngSequence(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	htmlExportPath: string,
	onProgress?: ExportProgressCallback,
): Promise<SlidevPptxRenderedHtmlReferencePngSequenceResult> {
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const absoluteHtmlPath = join(vaultRoot, htmlExportPath);
	const { slideCount } = resolveSlideCount(source, vaultRoot);
	const images = await capturePptxRenderedHtmlReferenceImages(
		absoluteHtmlPath,
		slideCount,
		config,
		onProgress,
	);
	const outputDirectory = join(
		vaultRoot,
		config.outputSubfolder,
		`${source.outputBasename}-pptx-rendered-html-reference`,
	);
	rmSync(outputDirectory, { recursive: true, force: true });
	mkdirSync(outputDirectory, { recursive: true });

	for (let index = 0; index < images.length; index += 1) {
		const imagePath = join(outputDirectory, `slide-${String(index + 1).padStart(2, '0')}.png`);
		writeFileSync(imagePath, Buffer.from(images[index].data));
	}
	onProgress?.(
		'pptx-rendered-html-reference',
		`Rendered-HTML PNG reference complete with ${images.length} slide image(s).`,
	);

	return {
		path: `${config.outputSubfolder}/${source.outputBasename}-pptx-rendered-html-reference`,
		absolutePath: outputDirectory,
		slideCount: images.length,
		viewport: {
			width: PPTX_CAPTURE_VIEWPORT_WIDTH,
			height: PPTX_CAPTURE_VIEWPORT_HEIGHT,
			deviceScaleFactor: PPTX_CAPTURE_DEVICE_SCALE_FACTOR,
		},
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
	const report = buildSlidevPptxExportReport(absoluteHtmlPath, deckPath, outputPath, reportPath, slides);
	writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
	onProgress?.(
		'pptx-export',
		`PPTX export complete with ${report.textBoxCount} editable text boxes and ${report.tableCount} native tables.`,
	);

	return {
		path: `${config.outputSubfolder}/${source.outputBasename}.pptx`,
		reportPath: `${config.outputSubfolder}/${source.outputBasename}.pptx.report.json`,
		report,
	};
}

export async function exportSlidevVisibleNativePptxExperimentFromHtml(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	htmlExportPath: string,
	onProgress?: ExportProgressCallback,
): Promise<SlidevPptxExportResult> {
	onProgress?.(
		'pptx-visible-native-experiment',
		'Creating experimental visible-native PPTX from rendered Slidev HTML...',
	);
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const absoluteHtmlPath = join(vaultRoot, htmlExportPath);
	const { slideCount, deckPath } = resolveSlideCount(source, vaultRoot);
	const { slides, residueSampling } = await extractVisibleNativeExperimentSlidesFromHtml(
		absoluteHtmlPath,
		slideCount,
		config,
		onProgress,
	);
	const outputPath = join(
		vaultRoot,
		config.outputSubfolder,
		`${source.outputBasename}.visible-native-experiment.pptx`,
	);
	const reportPath = join(
		vaultRoot,
		config.outputSubfolder,
		`${source.outputBasename}.visible-native-experiment.pptx.report.json`,
	);
	const document: SlidevPptxDocument = {
		title: `${source.sourceLabel || source.outputBasename} visible native experiment`,
		author: 'NoteMD',
		slides,
	};

	writeVisibleNativeExperimentPptxDocument(outputPath, document);
	const report = buildSlidevVisibleNativePptxExperimentReport(
		absoluteHtmlPath,
		deckPath,
		outputPath,
		reportPath,
		slides,
		residueSampling,
	);
	writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
	onProgress?.(
		'pptx-visible-native-experiment',
		`Visible-native experiment complete with ${report.textBoxCount} visible text boxes, ${report.tableCount} visible native tables, and ${residueSampling.suspiciousSlideCount} residue warning slide(s).`,
	);

	return {
		path: `${config.outputSubfolder}/${source.outputBasename}.visible-native-experiment.pptx`,
		reportPath: `${config.outputSubfolder}/${source.outputBasename}.visible-native-experiment.pptx.report.json`,
		report,
	};
}
