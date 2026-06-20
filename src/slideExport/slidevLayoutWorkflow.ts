import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { App } from 'obsidian';
import { exportSlidevHtmlWithOutcome } from './slidevExporter';
import { startLocalServer, stopLocalServer } from './localServer';
import {
	analyzeRenderedSlideMeasurement,
	countSlideDeckSlides,
	NOTEMD_SLOT_ZONE_ATTR,
	patchDeckWithLayoutAudit,
	summarizeLayoutAudits,
	type RenderedSlideMeasurement,
	type SlidevLayoutAudit,
	type SlidevLayoutAuditConfig,
	type SlidevLayoutAuditSummary,
} from './slidevLayoutAudit';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from './platformUtils';
import type { ExportProgressCallback, SlideExportConfig, SlidevExportSource, SlidevHtmlExportOutcome } from './types';

export interface SlidevLayoutCheck {
	slide: number;
	failed: boolean;
	errors: string[];
	screenshotPath: string | null;
	preview: string;
	layoutFindingCount: number;
}

export interface SlidevLayoutPatchAttempt {
	pass: number;
	changed: boolean;
	changedSlides: number[];
	blockedSlides: Array<{ slide: number; reason: string }>;
}

export interface SlidevLayoutConvergenceOptions {
	sampleSlides?: number[] | null;
	writeScreenshots?: boolean;
	auditConfig?: Partial<SlidevLayoutAuditConfig>;
}

export interface SlidevLayoutConvergenceResult {
	exportPath: string;
	htmlExport: SlidevHtmlExportOutcome;
	htmlExportHistory: SlidevHtmlExportOutcome[];
	checks: SlidevLayoutCheck[];
	auditedSlides: number[];
	layoutAudits: SlidevLayoutAudit[];
	layoutAuditSummary: SlidevLayoutAuditSummary;
	layoutPatchAttempts: SlidevLayoutPatchAttempt[];
	auditSkippedReason: string | null;
}

const DEFAULT_LAYOUT_AUDIT_CONFIG: SlidevLayoutAuditConfig = {
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
};
const SLIDEV_LAYOUT_NAVIGATION_TIMEOUT_MS = 60_000;

type PlaywrightRuntime = {
	chromium?: {
		launch(options: { headless: boolean }): Promise<any>;
	};
};

export async function convergeSlidevDeckLayout(
	app: App,
	source: SlidevExportSource,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
	options: SlidevLayoutConvergenceOptions = {},
): Promise<SlidevLayoutConvergenceResult> {
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) {
		throw new Error('Vault root path unavailable');
	}

	const resolvedAuditConfig = {
		...DEFAULT_LAYOUT_AUDIT_CONFIG,
		...options.auditConfig,
	};
	let htmlExport = await exportSlidevHtmlWithOutcome(app, source, config, onProgress);
	const htmlExportHistory = [htmlExport];
	let exportPath = htmlExport.path;
	const initialSummary = summarizeLayoutAudits([], 0);
	const playwright = resolvePlaywrightRuntime();
	if (!playwright?.chromium) {
		const auditSkippedReason = 'Skipping rendered layout audit because the Playwright runtime is unavailable.';
		onProgress?.('layout-audit', auditSkippedReason);
		return {
			exportPath,
			htmlExport,
			htmlExportHistory,
			checks: [],
			auditedSlides: [],
			layoutAudits: [],
			layoutAuditSummary: initialSummary,
			layoutPatchAttempts: [],
			auditSkippedReason,
		};
	}

	const absoluteDeckPath = source.preparedDeckPath ? join(vaultRoot, source.preparedDeckPath) : null;
	let currentDeckMarkdown = absoluteDeckPath && existsSync(absoluteDeckPath)
		? readFileSync(absoluteDeckPath, 'utf8')
		: null;
	let currentExportPath = join(vaultRoot, exportPath);
	let checks: SlidevLayoutCheck[] = [];
	let auditedSlides: number[] = [];
	let layoutAudits: SlidevLayoutAudit[] = [];
	let layoutPatchAttempts: SlidevLayoutPatchAttempt[] = [];
	let retryCount = 0;

	while (true) {
		auditedSlides = resolveSlidesToAudit(options.sampleSlides, currentDeckMarkdown);
		const auditResult = await runPlaywrightLayoutChecks(
			currentExportPath,
			auditedSlides,
			options.writeScreenshots === true,
			playwright,
			resolvedAuditConfig,
		);
		checks = auditResult.checks;
		layoutAudits = auditResult.layoutAudits;

		if (!currentDeckMarkdown || !absoluteDeckPath || retryCount >= resolvedAuditConfig.maxAutoPatchPasses) {
			break;
		}

		const patchResult = patchDeckWithLayoutAudit(currentDeckMarkdown, layoutAudits, resolvedAuditConfig);
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
		writeFileSync(absoluteDeckPath, currentDeckMarkdown, 'utf8');
		retryCount += 1;
		onProgress?.('layout-audit', `Patched deck on slides ${patchResult.changedSlides.join(', ')} and rebuilding...`);
		htmlExport = await exportSlidevHtmlWithOutcome(app, source, config, onProgress);
		htmlExportHistory.push(htmlExport);
		exportPath = htmlExport.path;
		currentExportPath = join(vaultRoot, exportPath);
	}

	return {
		exportPath,
		htmlExport,
		htmlExportHistory,
		checks,
		auditedSlides,
		layoutAudits,
		layoutAuditSummary: summarizeLayoutAudits(layoutAudits, retryCount),
		layoutPatchAttempts,
		auditSkippedReason: null,
	};
}

function resolvePlaywrightRuntime(): PlaywrightRuntime | null {
	const playwrightBrowsersPath = resolvePlaywrightBrowsersPath();
	if (playwrightBrowsersPath && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
		process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightBrowsersPath;
	}

	const playwright = safeRequire('playwright') as PlaywrightRuntime | null;
	return playwright?.chromium ? playwright : null;
}

async function runPlaywrightLayoutChecks(
	htmlPath: string,
	sampleSlides: number[],
	writeScreenshots: boolean,
	playwright: PlaywrightRuntime,
	auditConfig: SlidevLayoutAuditConfig,
): Promise<{ checks: SlidevLayoutCheck[]; layoutAudits: SlidevLayoutAudit[] }> {
	const browser = await playwright.chromium!.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	const checks: SlidevLayoutCheck[] = [];
	const layoutAudits: SlidevLayoutAudit[] = [];
	let serverDirectory: string | null = null;
	let baseUrl: string | null = null;

	try {
		if (htmlPath.endsWith('/index.html')) {
			serverDirectory = dirname(htmlPath);
			const port = await startLocalServer(serverDirectory);
			baseUrl = `http://localhost:${port}/index.html`;
		}

		for (const slide of sampleSlides) {
			const errors: string[] = [];
			page.removeAllListeners('pageerror');
			page.removeAllListeners('console');
			const keepError = (text: string) => !/Wake Lock permission request denied/i.test(text);
			page.on('pageerror', (error: Error) => {
				if (keepError(error.message)) {
					errors.push(error.message);
				}
			});
			page.on('console', (message: { type(): string; text(): string }) => {
				if (message.type() === 'error' && keepError(message.text())) {
					errors.push(message.text());
				}
			});

			const targetUrl = baseUrl ? `${baseUrl}#/${slide}` : `file://${htmlPath}#/${slide}`;
			await openSlideForLayoutAudit(page, targetUrl);
			await page.waitForTimeout(1_000);
			const text = await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '');
			const measurement = await collectRenderedSlideMeasurement(page, slide);
			const layoutAudit = analyzeRenderedSlideMeasurement(measurement, auditConfig);
			let screenshotPath: string | null = null;
			if (writeScreenshots) {
				screenshotPath = join(dirname(htmlPath), `slide-${String(slide).padStart(2, '0')}-workflow.png`);
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
			stopLocalServer(serverDirectory);
		}
	}

	return { checks, layoutAudits };
}

async function openSlideForLayoutAudit(page: any, targetUrl: string): Promise<void> {
	await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: SLIDEV_LAYOUT_NAVIGATION_TIMEOUT_MS });
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
			{ timeout: 15_000 },
		).catch(() => undefined);
	}
}

function resolveSlidesToAudit(sampleSlides: number[] | null | undefined, deckMarkdown: string | null): number[] {
	const deckSlideCount = deckMarkdown ? countSlideDeckSlides(deckMarkdown) : 0;
	const allSlides = Array.from({ length: Math.max(deckSlideCount, 1) }, (_, index) => index + 1);
	if (!Array.isArray(sampleSlides) || sampleSlides.length === 0) {
		return allSlides;
	}

	const filteredSlides = sampleSlides.filter(slide => Number.isFinite(slide) && slide >= 1 && slide <= deckSlideCount);
	return filteredSlides.length > 0 ? filteredSlides : allSlides;
}

async function collectRenderedSlideMeasurement(page: any, slide: number): Promise<RenderedSlideMeasurement> {
	const measurement = await page.evaluate((slotZoneAttr: string) => {
		type BrowserRect = {
			left: number;
			top: number;
			right: number;
			bottom: number;
			width: number;
			height: number;
		};
		const toRect = (rect: DOMRect) => ({
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
		});
		const toTextPreview = (value: string) => value
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 160);
		const overlaps = (a: BrowserRect, b: BrowserRect) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
		const unionRects = (rects: BrowserRect[]) => rects.reduce<BrowserRect | null>((acc, rect) => {
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
		const pickVisibleLargest = (selector: string) => Array.from(document.querySelectorAll(selector))
			.filter(element => element instanceof Element)
			.map(element => ({ element, rect: element.getBoundingClientRect(), style: window.getComputedStyle(element) }))
			.filter(entry => entry.style.display !== 'none' && entry.style.visibility !== 'hidden' && Number(entry.style.opacity || '1') > 0 && entry.rect.width > 2 && entry.rect.height > 2)
			.sort((left, right) => (right.rect.width * right.rect.height) - (left.rect.width * left.rect.height))[0]?.element ?? null;
		const parsePx = (value: string) => {
			const parsed = Number.parseFloat(value);
			return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
		};
		const minMetric = (values: Array<number | null | undefined>) => {
			const numbers = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
			return numbers.length > 0 ? Math.min(...numbers) : null;
		};
		const textMetricSelectors = (kind: string) => {
			switch (kind) {
				case 'mermaid':
					return 'svg text, svg tspan, foreignObject, foreignObject *';
				case 'table':
					return 'caption, th, td';
				case 'code':
					return 'pre, code, .line, span';
				case 'text':
					return 'h1, h2, h3, h4, p, li, blockquote, span';
				default:
					return 'h1, h2, h3, h4, p, li, blockquote, span, div, section, article, aside';
			}
		};
		const collectFontMetrics = (element: Element, kind: string, pageScale: number | null) => {
			const nodes = [element, ...Array.from(element.querySelectorAll(textMetricSelectors(kind)))]
				.filter((node): node is Element => node instanceof Element);
			const fontSamples: number[] = [];
			const svgFontSamples: number[] = [];
			for (const node of nodes) {
				const text = (node.textContent || '').trim();
				if (!text) {
					continue;
				}
				const style = window.getComputedStyle(node);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) {
					continue;
				}
				const fontPx = parsePx(style.fontSize);
				if (fontPx === null) {
					continue;
				}
				const rect = node.getBoundingClientRect();
				if (rect.width < 1 || rect.height < 1) {
					continue;
				}
				fontSamples.push(fontPx);
				if (node.closest('svg')) {
					svgFontSamples.push(fontPx);
				}
			}

			const minFontPx = minMetric(fontSamples);
			const minSvgFontPx = minMetric(svgFontSamples);
			const scale = pageScale && Number.isFinite(pageScale) && pageScale > 0 ? pageScale : 1;
			return {
				minFontPx,
				effectiveMinFontPx: minFontPx !== null ? minFontPx * scale : null,
				svgTextMinFontPx: minSvgFontPx !== null ? minSvgFontPx * scale : null,
				textSampleCount: fontSamples.length,
			};
		};

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
		const zoomRaw = window.getComputedStyle(slideRoot).getPropertyValue('--slidev-slide-zoom-scale').trim()
			|| (window.getComputedStyle(slideRoot) as any).scale
			|| '1';
		const pageScale = Number.parseFloat(zoomRaw);
		const effectivePageScale = Number.isFinite(pageScale) ? pageScale : null;

		const selectors: Array<[string, string]> = [
			['mermaid', '.mermaid, [class*="mermaid"]'],
			['table', 'table'],
			['code', 'pre, .shiki'],
			['image', 'img, svg'],
			['text', 'h1, h2, h3, h4, p, li, blockquote'],
			['other', 'div, section, article, aside, span'],
		];
		const seen = new Set<Element>();
		const measuredElements: Array<{
			ownerElement: Element | null;
			measured: {
				kind: string;
				selector: string;
				slotZone?: string;
				slotOwner?: boolean;
				textLength: number;
				textPreview?: string;
				minFontPx?: number | null;
				effectiveMinFontPx?: number | null;
				svgTextMinFontPx?: number | null;
				textSampleCount?: number;
				scrollWidth: number;
				scrollHeight: number;
				clientWidth: number;
				clientHeight: number;
				rect: BrowserRect;
			};
		}> = [];

		for (const [kind, selector] of selectors) {
			for (const element of Array.from(slideRoot.querySelectorAll(selector))) {
				if (!(element instanceof Element) || seen.has(element)) {
					continue;
				}
				seen.add(element);

				const style = window.getComputedStyle(element);
				if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) {
					continue;
				}

				const rect = toRect(element.getBoundingClientRect());
				const ownerElement = element.closest(`[${slotZoneAttr}]`) as Element | null;
				if (rect.width < 2 || rect.height < 2 || (!ownerElement && !overlaps(rect, slideRootRect))) {
					continue;
				}
				const fontMetrics = collectFontMetrics(element, kind, effectivePageScale);

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
						minFontPx: fontMetrics.minFontPx,
						effectiveMinFontPx: fontMetrics.effectiveMinFontPx,
						svgTextMinFontPx: fontMetrics.svgTextMinFontPx,
						textSampleCount: fontMetrics.textSampleCount,
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
			.map(element => element as Element)
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
			.filter((zone): zone is NonNullable<typeof zone> => zone !== null);

		const contentBounds = unionRects(elements.map(element => element.rect));
		if (contentBounds) {
			contentBounds.width = contentBounds.right - contentBounds.left;
			contentBounds.height = contentBounds.bottom - contentBounds.top;
		}
		const effectiveFontSamples = elements.map(element => element.effectiveMinFontPx).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
		const svgTextFontSamples = elements.map(element => element.svgTextMinFontPx).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
		const tableFontSamples = elements.filter(element => element.kind === 'table').map(element => element.effectiveMinFontPx).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
		const codeFontSamples = elements.filter(element => element.kind === 'code').map(element => element.effectiveMinFontPx).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
		const qualityMargins = contentBounds ? {
			left: contentBounds.left - safeRect.left,
			top: contentBounds.top - safeRect.top,
			right: safeRect.right - contentBounds.right,
			bottom: safeRect.bottom - contentBounds.bottom,
			min: Math.min(
				contentBounds.left - safeRect.left,
				contentBounds.top - safeRect.top,
				safeRect.right - contentBounds.right,
				safeRect.bottom - contentBounds.bottom,
			),
		} : null;
		const contentAreaRatio = contentBounds && safeRect.width > 0 && safeRect.height > 0
			? Math.min(1, (contentBounds.width * contentBounds.height) / (safeRect.width * safeRect.height))
			: null;

		return {
			slideRoot: slideRootRect,
			safeRect,
			contentBounds,
			pageScale: effectivePageScale,
			effectiveMinFontPx: minMetric(effectiveFontSamples),
			svgTextMinFontPx: minMetric(svgTextFontSamples),
			tableBodyMinFontPx: minMetric(tableFontSamples),
			codeMinFontPx: minMetric(codeFontSamples),
			qualityMargins,
			contentAreaRatio,
			elements,
			slotZones,
			errors: [],
		};
	}, NOTEMD_SLOT_ZONE_ATTR);

	return {
		...measurement,
		slide,
	};
}
