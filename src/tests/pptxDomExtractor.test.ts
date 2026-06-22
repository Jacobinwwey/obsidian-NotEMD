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

	test('preserves anchor href as a PPTX hyperlink target on extracted text runs', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<p style="margin:0;font-family:Arial;font-size:32px;line-height:40px;color:#111827">
							Read the <a href="https://example.com/docs?topic=pptx&amp;phase=hyperlinks" style="color:#2563eb;text-decoration:underline">export docs</a>.
						</p>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const linkRuns = slide.texts
				.flatMap((textBox) => textBox.richTextParagraphs)
				.flatMap((paragraph) => paragraph.runs)
				.filter((run) => run.link);

			expect(linkRuns).toEqual([
				expect.objectContaining({
					text: 'export docs',
					hyperlinkTarget: 'https://example.com/docs?topic=pptx&phase=hyperlinks',
				}),
			]);
			expect(slide.texts.some((textBox) => textBox.unmodeledRunReasons.includes('link'))).toBe(true);
		} finally {
			await page.close();
		}
	});

	test('preserves paragraph, inset, and list layout metadata for native Office text', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<p id="body-copy" style="margin:12px 0 18px;padding:8px 16px 4px 12px;font-family:Arial;font-size:32px;line-height:40px;color:#111827">
							Paragraph contract.
						</p>
						<ul style="margin:0;padding-left:40px;list-style-type:disc">
							<li id="nested-list" style="width:720px;margin:0 0 10px;font-family:Arial;font-size:28px;line-height:36px;color:#111827">
								Native bullet contract.
							</li>
						</ul>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const paragraph = slide.texts.find((textBox) => textBox.text === 'Paragraph contract.');
			const bullet = slide.texts.find((textBox) => textBox.text === 'Native bullet contract.');

			expect(paragraph).toEqual(
				expect.objectContaining({
					lineSpacingPt: expect.any(Number),
					paragraphSpacingBeforePt: expect.any(Number),
					paragraphSpacingAfterPt: expect.any(Number),
					paddingLeftIn: expect.any(Number),
					paddingRightIn: expect.any(Number),
					paddingTopIn: expect.any(Number),
					paddingBottomIn: expect.any(Number),
				}),
			);
			expect(paragraph?.lineSpacingPt).toBeGreaterThan(paragraph?.fontSize || 0);
			expect(paragraph?.paragraphSpacingBeforePt).toBeGreaterThan(0);
			expect(paragraph?.paragraphSpacingAfterPt).toBeGreaterThan(0);
			expect(paragraph?.paddingLeftIn).toBeGreaterThan(0);
			expect(paragraph?.paddingRightIn).toBeGreaterThan(0);
			expect(paragraph?.paddingTopIn).toBeGreaterThan(0);
			expect(paragraph?.paddingBottomIn).toBeGreaterThan(0);
			expect(bullet).toEqual(
				expect.objectContaining({
					bullet: false,
				}),
			);
			expect(bullet).not.toHaveProperty('lineSpacingPt');
			expect(bullet).not.toHaveProperty('paragraphSpacingAfterPt');
		} finally {
			await page.close();
		}
	});

	test('preserves table cell inset and line-height metadata for native Office tables', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<table style="border-collapse:collapse;font-family:Arial;font-size:24px;color:#111827">
							<tr>
								<td style="padding:10px 18px 12px 14px;border:2px solid #94a3b8;line-height:34px;background:#f8fafc">
									布局契约<br>Layout contract
								</td>
							</tr>
						</table>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const cell = slide.tables[0]?.rows[0]?.[0];

			expect(slide.tables[0]).toEqual(
				expect.objectContaining({
					borderModel: 'collapsed',
				}),
			);
			expect(cell).toEqual(
				expect.objectContaining({
					text: '布局契约\nLayout contract',
					lineSpacingPt: expect.any(Number),
					paddingLeftIn: expect.any(Number),
					paddingRightIn: expect.any(Number),
					paddingTopIn: expect.any(Number),
					paddingBottomIn: expect.any(Number),
					textLeftInsetIn: expect.any(Number),
					textRightInsetIn: expect.any(Number),
					textTopInsetIn: expect.any(Number),
					textBottomInsetIn: expect.any(Number),
				}),
			);
			expect(cell?.lineSpacingPt).toBeGreaterThan(cell?.fontSize || 0);
			expect(cell?.paddingLeftIn).toBeGreaterThan(0);
			expect(cell?.paddingRightIn).toBeGreaterThan(0);
			expect(cell?.paddingTopIn).toBeGreaterThan(0);
			expect(cell?.paddingBottomIn).toBeGreaterThan(0);
			expect(cell?.textLeftInsetIn).toBeGreaterThan(0);
			expect(cell?.textRightInsetIn).toBeGreaterThan(0);
			expect(cell?.textTopInsetIn).toBeGreaterThan(0);
			expect(cell?.textBottomInsetIn).toBeGreaterThan(0);
		} finally {
			await page.close();
		}
	});

	test('captures separate table border spacing for table layout diagnostics', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<table style="border-collapse:separate;border-spacing:16px 20px;font-family:Arial;font-size:22px;color:#111827">
							<tr>
								<td style="padding:8px 12px;border:1px solid #94a3b8;background:#fff">
									Separate spacing
								</td>
							</tr>
						</table>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const table = slide.tables[0];

			expect(table).toEqual(
				expect.objectContaining({
					borderModel: 'separate',
					borderSpacingXIn: expect.any(Number),
					borderSpacingYIn: expect.any(Number),
				}),
			);
			expect(table?.borderSpacingXIn).toBeGreaterThan(0);
			expect(table?.borderSpacingYIn).toBeGreaterThan(0);
		} finally {
			await page.close();
		}
	});
});
