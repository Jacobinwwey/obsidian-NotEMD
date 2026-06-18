import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { App } from 'obsidian';
import { exportSlidevHtml } from './slidevExporter';
import { startLocalServer, stopLocalServer } from './localServer';
import {
	analyzeRenderedSlideMeasurement,
	countSlideDeckSlides,
	patchDeckWithLayoutAudit,
	summarizeLayoutAudits,
	type RenderedSlideMeasurement,
	type SlidevLayoutAudit,
	type SlidevLayoutAuditConfig,
	type SlidevLayoutAuditSummary,
} from './slidevLayoutAudit';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from './platformUtils';
import type { ExportProgressCallback, SlideExportConfig, SlidevExportSource } from './types';

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
	checks: SlidevLayoutCheck[];
	auditedSlides: number[];
	layoutAudits: SlidevLayoutAudit[];
	layoutAuditSummary: SlidevLayoutAuditSummary;
	layoutPatchAttempts: SlidevLayoutPatchAttempt[];
	auditSkippedReason: string | null;
}

const DEFAULT_LAYOUT_AUDIT_CONFIG: SlidevLayoutAuditConfig = {
	overflowTolerancePx: 6,
	minReadableScale: 0.24,
	maxAutoPatchPasses: 6,
};

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
	let exportPath = await exportSlidevHtml(app, source, config, onProgress);
	const initialSummary = summarizeLayoutAudits([], 0);
	const playwright = resolvePlaywrightRuntime();
	if (!playwright?.chromium) {
		const auditSkippedReason = 'Skipping rendered layout audit because the Playwright runtime is unavailable.';
		onProgress?.('layout-audit', auditSkippedReason);
		return {
			exportPath,
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
		exportPath = await exportSlidevHtml(app, source, config, onProgress);
		currentExportPath = join(vaultRoot, exportPath);
	}

	return {
		exportPath,
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
			await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
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
	const measurement = await page.evaluate(() => {
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

		const selectors: Array<[string, string]> = [
			['mermaid', '.mermaid, [class*="mermaid"]'],
			['table', 'table'],
			['code', 'pre, .shiki'],
			['image', 'img, svg'],
			['text', 'h1, h2, h3, h4, p, li, blockquote'],
		];
		const seen = new Set<Element>();
		const elements = [];

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
			|| (window.getComputedStyle(slideRoot) as any).scale
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

	return {
		...measurement,
		slide,
	};
}
