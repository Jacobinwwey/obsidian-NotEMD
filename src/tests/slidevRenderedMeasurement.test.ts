import { collectRenderedSlideMeasurement } from '../slideExport/slidevLayoutWorkflow';

describe('slidev rendered measurement', () => {
	jest.setTimeout(60_000);

	let browser: any | null = null;
	let launchError: unknown = null;

	beforeAll(async () => {
		try {
			const playwright = await import('playwright');
			browser = await playwright.chromium.launch({ headless: true });
		} catch (error) {
			launchError = error;
		}
	});

	afterAll(async () => {
		await browser?.close();
	});

	test('includes local CSS transform scale in effective font measurements', async () => {
		if (!browser) {
			console.warn('Skipping Playwright rendered measurement test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0">
					<div class="slidev-page" style="width:1280px;height:720px;--slidev-slide-zoom-scale:0.8">
						<div style="transform:scale(0.5);transform-origin:top left">
							<pre style="font-size:20px;line-height:20px;margin:0"><code>const answer = 42;</code></pre>
						</div>
					</div>
				</body>
			`);

			const measurement = await collectRenderedSlideMeasurement(page, 1);

			expect(measurement.pageScale).toBeCloseTo(0.8, 3);
			expect(measurement.codeMinFontPx).toBeCloseTo(8, 1);
			expect(measurement.effectiveMinFontPx).toBeCloseTo(8, 1);
			expect(measurement.elements.find(element => element.kind === 'code')?.effectiveMinFontPx).toBeCloseTo(8, 1);
		} finally {
			await page.close();
		}
	});
});
