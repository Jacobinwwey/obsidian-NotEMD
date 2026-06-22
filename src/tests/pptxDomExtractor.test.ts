import { extractSlidevPptxSlideFromPage } from '../slideExport/pptxDomExtractor';

describe('pptxDomExtractor', () => {
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

	test('splits browser-wrapped body text into visible native line boxes', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<p style="width:300px;margin:0;font-family:Arial;font-size:32px;line-height:40px;color:#111827">
							Browser measured text should split into native PowerPoint line boxes.
						</p>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const bodyTextBoxes = slide.texts.filter((textBox) => textBox.sourceKind === 'body');

			expect(bodyTextBoxes.length).toBeGreaterThan(1);
			expect(bodyTextBoxes.every((textBox) => !textBox.text.includes('\n'))).toBe(true);
			expect(bodyTextBoxes.map((textBox) => textBox.text).join(' ')).toContain('Browser measured text');
			expect(new Set(bodyTextBoxes.map((textBox) => textBox.y.toFixed(3))).size).toBeGreaterThan(1);
		} finally {
			await page.close();
		}
	});

	test('keeps wrapped list text as line boxes without rebuilding Office bullets', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<ul style="margin:0;padding-left:40px;list-style-type:square">
							<li style="width:360px;font-family:Arial;font-size:30px;line-height:38px;color:#111827">
								List content should keep the browser marker in the fallback image while editable text follows measured line boxes.
							</li>
						</ul>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const listTextBoxes = slide.texts.filter((textBox) => textBox.sourceKind === 'body');
			const markerState = await page.$eval('li', (element: Element) => ({
				attribute: element.getAttribute('data-notemd-pptx-marker-color'),
				color: (element as HTMLElement).style.getPropertyValue('--notemd-pptx-marker-color'),
			}));

			expect(listTextBoxes.length).toBeGreaterThan(1);
			expect(listTextBoxes.every((textBox) => textBox.bullet === false)).toBe(true);
			expect(listTextBoxes.map((textBox) => textBox.text).join(' ')).toContain('List content should keep');
			expect(new Set(listTextBoxes.map((textBox) => textBox.y.toFixed(3))).size).toBeGreaterThan(1);
			expect(markerState).toEqual({ attribute: '1', color: '#111827' });
		} finally {
			await page.close();
		}
	});
});
