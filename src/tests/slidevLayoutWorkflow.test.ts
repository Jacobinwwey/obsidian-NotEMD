import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { convergeSlidevDeckLayout } from '../slideExport/slidevLayoutWorkflow';
import { exportSlidevHtml } from '../slideExport/slidevExporter';
import { startLocalServer, stopLocalServer } from '../slideExport/localServer';
import { getVaultBasePath, resolvePlaywrightBrowsersPath, safeRequire } from '../slideExport/platformUtils';
import {
	analyzeRenderedSlideMeasurement,
	countSlideDeckSlides,
	patchDeckWithLayoutAudit,
	summarizeLayoutAudits,
} from '../slideExport/slidevLayoutAudit';

jest.mock('../slideExport/slidevExporter', () => ({
	exportSlidevHtml: jest.fn(),
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

const mockExportSlidevHtml = exportSlidevHtml as jest.MockedFunction<typeof exportSlidevHtml>;
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

describe('slidevLayoutWorkflow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.PLAYWRIGHT_BROWSERS_PATH;
		mockSummarizeLayoutAudits.mockImplementation((_audits, retryCount = 0) => createSummary(retryCount));
	});

	test('returns the initial HTML export when the Playwright runtime is unavailable', async () => {
		mockGetVaultBasePath.mockReturnValue('/vault');
		mockExportSlidevHtml.mockResolvedValue('export/demo/index-standalone.html');
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
		expect(result.auditSkippedReason).toContain('Playwright runtime is unavailable');
		expect(result.layoutAudits).toEqual([]);
		expect(result.layoutPatchAttempts).toEqual([]);
		expect(mockExportSlidevHtml).toHaveBeenCalledTimes(1);
		expect(mockPatchDeckWithLayoutAudit).not.toHaveBeenCalled();
	});

	test('patches the prepared deck and rebuilds HTML when rendered audit finds overflow', async () => {
		const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-slidev-layout-workflow-'));
		const deckPath = path.join(vaultRoot, 'export/_slidev-sources/demo.slidev.md');
		fs.mkdirSync(path.dirname(deckPath), { recursive: true });
		fs.writeFileSync(deckPath, 'original deck', 'utf8');

		mockGetVaultBasePath.mockReturnValue(vaultRoot);
		mockExportSlidevHtml.mockResolvedValue('export/demo/index.html');
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

		expect(mockExportSlidevHtml).toHaveBeenCalledTimes(2);
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
		expect(result.checks).toHaveLength(1);
		expect(mockStartLocalServer).toHaveBeenCalled();
		expect(mockStopLocalServer).toHaveBeenCalled();
		expect(process.env.PLAYWRIGHT_BROWSERS_PATH).toBe('/home/user/.cache/ms-playwright');
	});
});
