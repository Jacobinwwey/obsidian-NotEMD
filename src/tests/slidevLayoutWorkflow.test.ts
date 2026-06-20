import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { convergeSlidevDeckLayout } from '../slideExport/slidevLayoutWorkflow';
import { exportSlidevHtmlWithOutcome } from '../slideExport/slidevExporter';
import { startLocalServer, stopLocalServer } from '../slideExport/localServer';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from '../slideExport/platformUtils';
import {
	analyzeRenderedSlideMeasurement,
	countSlideDeckSlides,
	patchDeckWithLayoutAudit,
	summarizeLayoutAudits,
} from '../slideExport/slidevLayoutAudit';

jest.mock('../slideExport/slidevExporter', () => ({
	exportSlidevHtmlWithOutcome: jest.fn(),
}));

jest.mock('../slideExport/localServer', () => ({
	startLocalServer: jest.fn(),
	stopLocalServer: jest.fn(),
}));

jest.mock('../slideExport/platformUtils', () => ({
	getVaultBasePath: jest.fn(),
	resolvePlaywrightBrowsersPath: jest.fn(),
	safeRequire: jest.fn(),
}));

jest.mock('../slideExport/slidevLayoutAudit', () => ({
	analyzeRenderedSlideMeasurement: jest.fn(),
	countSlideDeckSlides: jest.fn(),
	patchDeckWithLayoutAudit: jest.fn(),
	summarizeLayoutAudits: jest.fn(),
}));

const mockExportSlidevHtmlWithOutcome = exportSlidevHtmlWithOutcome as jest.MockedFunction<typeof exportSlidevHtmlWithOutcome>;
const mockStartLocalServer = startLocalServer as jest.MockedFunction<typeof startLocalServer>;
const mockStopLocalServer = stopLocalServer as jest.MockedFunction<typeof stopLocalServer>;
const mockGetVaultBasePath = getVaultBasePath as jest.MockedFunction<typeof getVaultBasePath>;
const mockResolvePlaywrightBrowsersPath = resolvePlaywrightBrowsersPath as jest.MockedFunction<typeof resolvePlaywrightBrowsersPath>;
const mockSafeRequire = safeRequire as jest.MockedFunction<typeof safeRequire>;
const mockAnalyzeRenderedSlideMeasurement = analyzeRenderedSlideMeasurement as jest.MockedFunction<typeof analyzeRenderedSlideMeasurement>;
const mockCountSlideDeckSlides = countSlideDeckSlides as jest.MockedFunction<typeof countSlideDeckSlides>;
const mockPatchDeckWithLayoutAudit = patchDeckWithLayoutAudit as jest.MockedFunction<typeof patchDeckWithLayoutAudit>;
const mockSummarizeLayoutAudits = summarizeLayoutAudits as jest.MockedFunction<typeof summarizeLayoutAudits>;

function createSummary(retryCount: number) {
	return {
		slideCount: 1,
		overflowCount: retryCount === 0 ? 1 : 0,
		unreadableCount: 0,
		renderErrorCount: 0,
		retryCount,
	};
}

function createHtmlOutcome(path: string, actualMode: 'standalone' | 'server-script' | 'server-script-fallback' = 'standalone') {
	return {
		path,
		requestedMode: 'standalone' as const,
		actualMode,
		requiresLocalServer: actualMode !== 'standalone',
		fallbackPath: actualMode === 'server-script-fallback' ? path : null,
		standaloneAttempt: {
			attempted: actualMode !== 'server-script',
			accepted: actualMode === 'standalone',
			outputPath: actualMode !== 'server-script' ? path.replace('/index.html', '/index-standalone.html') : null,
			preservedFailurePath: actualMode === 'server-script-fallback' ? path.replace('/index.html', '/index-standalone.failed.html') : null,
			loaderGaps: actualMode === 'server-script-fallback' ? ['$n'] : [],
			failureReason: actualMode === 'server-script-fallback' ? 'loader-gaps' as const : null,
		},
	};
}

describe('slidevLayoutWorkflow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.PLAYWRIGHT_BROWSERS_PATH;
		mockSummarizeLayoutAudits.mockImplementation((_audits, retryCount = 0) => createSummary(retryCount));
	});

	test('returns the initial HTML export when the Playwright runtime is unavailable', async () => {
		mockGetVaultBasePath.mockReturnValue('/vault');
		mockExportSlidevHtmlWithOutcome.mockResolvedValue(createHtmlOutcome('export/demo/index-standalone.html'));
		mockSafeRequire.mockReturnValue(null);

		const result = await convergeSlidevDeckLayout(
			{} as any,
			{
				inputFilePath: 'export/_slidev-sources/demo.slidev.md',
				outputBasename: 'demo',
				sourceLabel: 'demo',
			},
			{
				format: 'html',
				withClicks: false,
				outputSubfolder: 'export',
				ffmpegFps: 1,
				ffmpegCrf: 23,
				slidevTheme: '',
				timeoutMs: 120000,
				htmlMode: 'standalone',
			},
			jest.fn(),
		);

		expect(result.exportPath).toBe('export/demo/index-standalone.html');
		expect(result.htmlExport.actualMode).toBe('standalone');
		expect(result.htmlExportHistory).toHaveLength(1);
		expect(result.auditSkippedReason).toContain('Playwright runtime is unavailable');
		expect(result.layoutAudits).toEqual([]);
		expect(result.layoutPatchAttempts).toEqual([]);
		expect(mockExportSlidevHtmlWithOutcome).toHaveBeenCalledTimes(1);
		expect(mockPatchDeckWithLayoutAudit).not.toHaveBeenCalled();
	});

	test('patches the prepared deck and rebuilds HTML when rendered audit finds overflow', async () => {
		const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-slidev-layout-workflow-'));
		const deckPath = path.join(vaultRoot, 'export/_slidev-sources/demo.slidev.md');
		fs.mkdirSync(path.dirname(deckPath), { recursive: true });
		fs.writeFileSync(deckPath, 'original deck', 'utf8');

		mockGetVaultBasePath.mockReturnValue(vaultRoot);
		mockExportSlidevHtmlWithOutcome.mockResolvedValue(createHtmlOutcome('export/demo/index.html', 'server-script-fallback'));
		mockResolvePlaywrightBrowsersPath.mockReturnValue('/home/user/.cache/ms-playwright');
		mockCountSlideDeckSlides.mockReturnValue(1);
		mockStartLocalServer.mockResolvedValue(8765);
		mockAnalyzeRenderedSlideMeasurement
			.mockReturnValueOnce({
				slide: 1,
				safeRect: null,
				contentBounds: null,
				pageScale: 1,
				findings: [
					{
						kind: 'overflow',
						target: 'content',
						message: 'overflow',
						recommendedPatch: 'split-slide',
						recommendedScale: 0.8,
					},
				],
				elementKinds: ['text'],
			} as any)
			.mockReturnValueOnce({
				slide: 1,
				safeRect: null,
				contentBounds: null,
				pageScale: 1,
				findings: [],
				elementKinds: ['text'],
			} as any);
		mockPatchDeckWithLayoutAudit
			.mockReturnValueOnce({
				deckMarkdown: 'patched deck',
				changed: true,
				changedSlides: [1],
				blockedSlides: [],
			})
			.mockReturnValueOnce({
				deckMarkdown: 'patched deck',
				changed: false,
				changedSlides: [],
				blockedSlides: [],
			});

		const page = {
			removeAllListeners: jest.fn(),
			on: jest.fn(),
			goto: jest.fn(),
			waitForLoadState: jest.fn().mockRejectedValue(new Error('networkidle timeout')),
			waitForFunction: jest.fn().mockResolvedValue(undefined),
			waitForTimeout: jest.fn(),
			locator: jest.fn(() => ({
				innerText: jest.fn().mockResolvedValue('1 / 1'),
			})),
			evaluate: jest.fn().mockResolvedValue({
				slideRoot: { left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720 },
				safeRect: { left: 50, top: 40, right: 1230, bottom: 680, width: 1180, height: 640 },
				contentBounds: { left: 40, top: 40, right: 1240, bottom: 700, width: 1200, height: 660 },
				pageScale: 1,
				elements: [],
				errors: [],
			}),
			screenshot: jest.fn(),
		};
		const browser = {
			newPage: jest.fn().mockResolvedValue(page),
			close: jest.fn(),
		};
		mockSafeRequire.mockImplementation(moduleName => {
			if (moduleName === 'playwright') {
				return {
					chromium: {
						launch: jest.fn().mockResolvedValue(browser),
					},
				};
			}
			return null;
		});

		const result = await convergeSlidevDeckLayout(
			{} as any,
			{
				inputFilePath: 'export/_slidev-sources/demo.slidev.md',
				outputBasename: 'demo',
				sourceLabel: 'demo',
				preparedDeckPath: 'export/_slidev-sources/demo.slidev.md',
			},
			{
				format: 'html',
				withClicks: false,
				outputSubfolder: 'export',
				ffmpegFps: 1,
				ffmpegCrf: 23,
				slidevTheme: '',
				timeoutMs: 120000,
				htmlMode: 'standalone',
			},
			jest.fn(),
			{ writeScreenshots: false }
		);

		expect(mockExportSlidevHtmlWithOutcome).toHaveBeenCalledTimes(2);
		expect(mockPatchDeckWithLayoutAudit).toHaveBeenCalledTimes(2);
		expect(fs.readFileSync(deckPath, 'utf8')).toBe('patched deck');
		expect(result.layoutPatchAttempts).toEqual([
			expect.objectContaining({
				pass: 1,
				changed: true,
				changedSlides: [1],
			}),
			expect.objectContaining({
				pass: 2,
				changed: false,
				changedSlides: [],
			}),
		]);
		expect(result.layoutAuditSummary.retryCount).toBe(1);
		expect(result.htmlExport.actualMode).toBe('server-script-fallback');
		expect(result.htmlExportHistory).toHaveLength(2);
		expect(result.checks).toHaveLength(1);
		expect(page.goto).toHaveBeenCalledWith(expect.any(String), { waitUntil: 'domcontentloaded', timeout: 30_000 });
		expect(page.waitForLoadState).toHaveBeenCalledWith('networkidle', { timeout: 10_000 });
		expect(page.waitForFunction).toHaveBeenCalled();
		expect(mockStartLocalServer).toHaveBeenCalled();
		expect(mockStopLocalServer).toHaveBeenCalled();
		expect(process.env.PLAYWRIGHT_BROWSERS_PATH).toBe('/home/user/.cache/ms-playwright');
	});
});
