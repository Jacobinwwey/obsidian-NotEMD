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

	test('preserves browser text styling and flex alignment for visible native text', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<div id="metric-label" style="width:520px;height:96px;display:flex;align-items:center;justify-content:center;font-family:Arial;font-size:30px;letter-spacing:2px;text-decoration:line-through;color:#111827">
							Editable chart label
						</div>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const label = slide.texts.find((textBox) => textBox.text === 'Editable chart label');
			const runs = label?.richTextParagraphs.flatMap((paragraph) => paragraph.runs) || [];

			expect(label).toEqual(
				expect.objectContaining({
					strike: true,
					align: 'center',
					verticalAlign: 'middle',
					charSpacingPt: expect.any(Number),
				}),
			);
			expect(label?.charSpacingPt).toBeGreaterThan(0);
			expect(runs).toEqual([
				expect.objectContaining({
					text: 'Editable chart label',
					strike: true,
					charSpacingPt: expect.any(Number),
				}),
			]);
		} finally {
			await page.close();
		}
	});

	test('treats syntax token foreground colors as native rich text instead of code-highlight fallback', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<pre class="shiki" style="margin:0;width:640px;background:#0f172a;font-family:Consolas;font-size:24px;line-height:32px;color:#e5e7eb;padding:16px"><code><span class="token keyword" style="color:#93c5fd">const</span><span> answer = </span><span class="token number" style="color:#fde68a">42</span></code></pre>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const codeText = slide.texts.find((textBox) => textBox.sourceKind === 'code');
			const runColors = new Set(
				(codeText?.richTextParagraphs || []).flatMap((paragraph) => paragraph.runs.map((run) => run.color)),
			);

			expect(codeText?.text).toBe('const answer = 42');
			expect(runColors).toEqual(new Set(['93C5FD', 'E5E7EB', 'FDE68A']));
			expect(codeText?.unmodeledRunReasons).not.toContain('syntax-highlight');
			expect(slide.fallbackOnlyElementKinds).not.toContain('code-highlight');
		} finally {
			await page.close();
		}
	});

	test('keeps code-highlight fallback when token paint cannot be represented as native text or solid rectangles', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<pre class="shiki" style="margin:0;width:640px;background:#0f172a;font-family:Consolas;font-size:24px;line-height:32px;color:#e5e7eb;padding:16px"><code><span class="token keyword" style="color:#93c5fd">const</span><span> answer = </span><span class="token number" style="color:#fde68a;background-image:linear-gradient(90deg,#7f1d1d,#1e3a8a)">42</span></code></pre>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const codeText = slide.texts.find((textBox) => textBox.sourceKind === 'code');
			const skipCounts = new Map(
				(slide.decorativePrimitiveDiagnostics?.skipReasonCounts || []).map((item) => [item.reason, item.count]),
			);

			expect(codeText?.unmodeledRunReasons).toContain('syntax-highlight');
			expect(slide.fallbackOnlyElementKinds).toContain('code-highlight');
			expect(skipCounts.get('unsupported-code-root')).toBeGreaterThanOrEqual(1);
		} finally {
			await page.close();
		}
	});

	test('extracts high-confidence code backgrounds as native rectangle primitives', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<pre id="code-block" style="margin:0;width:640px;background:#0f172a;border:2px solid #334155;border-radius:4px;font-family:Consolas;font-size:24px;line-height:32px;color:#e5e7eb;padding:16px"><code><span>const answer = </span><span id="highlight" style="background:#334155">42</span></code></pre>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const codeBackgrounds = slide.shapes?.filter((shape) => shape.sourceKind === 'code-background') || [];
			const codeText = slide.texts.find((textBox) => textBox.sourceKind === 'code');
			const consumedState = await page.$eval('#code-block', (element: Element) => ({
				shape: element.getAttribute('data-notemd-pptx-consumed-shape'),
				fill: element.getAttribute('data-notemd-pptx-consumed-shape-fill'),
			}));

			expect(codeBackgrounds).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						fillColor: '0F172A',
						borderColor: '334155',
						borderWidthPt: expect.any(Number),
						cornerRadiusAdjustment: expect.any(Number),
					}),
					expect.objectContaining({
						fillColor: '334155',
					}),
				]),
			);
			expect(codeBackgrounds.length).toBeGreaterThanOrEqual(2);
			expect(codeBackgrounds.find((shape) => shape.fillColor === '0F172A')?.cornerRadiusAdjustment).toBeGreaterThan(0);
			expect(codeText).toEqual(
				expect.objectContaining({
					text: 'const answer = 42',
					sourceKind: 'code',
				}),
			);
			expect(Math.max(...codeBackgrounds.map((shape) => shape.order))).toBeLessThan(codeText?.order || 0);
			expect(consumedState).toEqual({ shape: 'code-background', fill: '0F172A' });
		} finally {
			await page.close();
		}
	});

	test('extracts high-confidence decorative rectangles and border lines as native primitives', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0;background:#fff">
					<div class="slidev-page" style="width:1280px;height:720px;background:#fff;padding:64px;box-sizing:border-box">
						<div id="metric-card" style="width:360px;height:120px;background:#e0f2fe;border:2px solid #0284c7;border-radius:6px;display:flex;align-items:center;justify-content:center">
							<span style="font-family:Arial;font-size:28px;color:#0f172a">Native metric card</span>
						</div>
						<div id="divider" style="width:480px;height:32px;margin-top:24px;border-top:4px solid #64748b"></div>
						<div id="shadow-card" style="width:200px;height:80px;background:#fee2e2;box-shadow:0 8px 16px rgba(0,0,0,.2)"></div>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const decorativeRectangle = slide.shapes?.find((shape) => shape.sourceKind === 'decorative-rectangle');
			const decorativeLine = slide.shapes?.find((shape) => shape.sourceKind === 'decorative-line');
			const shadowShape = slide.shapes?.find((shape) => shape.fillColor === 'FEE2E2');
			const cardText = slide.texts.find((textBox) => textBox.text === 'Native metric card');
			const unsupportedPaintSkip = slide.decorativePrimitiveDiagnostics?.skipReasonCounts.find(
				(item) => item.reason === 'unsupported-paint',
			);
			const consumedState = await page.$eval('#metric-card', (element: Element) => ({
				shape: element.getAttribute('data-notemd-pptx-consumed-shape'),
				fill: element.getAttribute('data-notemd-pptx-consumed-shape-fill'),
			}));

			expect(decorativeRectangle).toEqual(
				expect.objectContaining({
					fillColor: 'E0F2FE',
					borderColor: '0284C7',
					borderWidthPt: expect.any(Number),
					cornerRadiusAdjustment: expect.any(Number),
				}),
			);
			expect(decorativeLine).toEqual(
				expect.objectContaining({
					fillColor: '64748B',
				}),
			);
			expect(decorativeLine?.h).toBeLessThan(0.06);
			expect(shadowShape).toBeUndefined();
			expect(slide.decorativePrimitiveDiagnostics).toEqual(
				expect.objectContaining({
					acceptedCount: 2,
				}),
			);
			expect(slide.decorativePrimitiveDiagnostics?.candidateCount).toBe(
				(slide.decorativePrimitiveDiagnostics?.acceptedCount || 0) +
					(slide.decorativePrimitiveDiagnostics?.skippedCount || 0),
			);
			expect(unsupportedPaintSkip?.count).toBeGreaterThanOrEqual(1);
			expect(cardText).toEqual(
				expect.objectContaining({
					sourceKind: 'body',
				}),
			);
			expect(decorativeRectangle?.order).toBeLessThan(cardText?.order || 0);
			expect(consumedState).toEqual({ shape: 'decorative-rectangle', fill: 'E0F2FE' });
		} finally {
			await page.close();
		}
	});

	test('reports root-specific decorative primitive skip reasons before widening extraction', async () => {
		if (!browser) {
			console.warn('Skipping PPTX DOM extractor Playwright test:', launchError);
			return;
		}

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0">
					<div class="slidev-page" style="width:1280px;height:720px;padding:64px;box-sizing:border-box">
						<table>
							<tr>
								<td id="diagnostic-table" style="width:100px;height:32px;background:#fde68a">Cell</td>
							</tr>
						</table>
						<pre><code><span id="diagnostic-code" style="display:inline-block;width:100px;height:24px;background-image:linear-gradient(90deg,#111827,#334155)"></span></code></pre>
						<div class="mermaid"><span id="diagnostic-mermaid" style="display:inline-block;width:100px;height:24px;background:#dbeafe"></span></div>
						<svg width="120" height="40">
							<foreignObject width="120" height="40">
								<div xmlns="http://www.w3.org/1999/xhtml" id="diagnostic-svg" style="width:100px;height:24px;background:#dcfce7"></div>
							</foreignObject>
						</svg>
					</div>
				</body>
			`);

			const slide = await extractSlidevPptxSlideFromPage(page, 1);
			const skipCounts = new Map(
				(slide.decorativePrimitiveDiagnostics?.skipReasonCounts || []).map((item) => [item.reason, item.count]),
			);

			expect(slide.decorativePrimitiveDiagnostics?.acceptedCount).toBe(0);
			expect(slide.decorativePrimitiveDiagnostics?.candidateCount).toBe(
				(slide.decorativePrimitiveDiagnostics?.skippedCount || 0) +
					(slide.decorativePrimitiveDiagnostics?.acceptedCount || 0),
			);
			expect(skipCounts.get('unsupported-table-root')).toBeGreaterThanOrEqual(1);
			expect(skipCounts.get('unsupported-code-root')).toBeGreaterThanOrEqual(1);
			expect(skipCounts.get('unsupported-mermaid-root')).toBeGreaterThanOrEqual(1);
			expect(skipCounts.get('unsupported-svg-root')).toBeGreaterThanOrEqual(1);
			expect(skipCounts.has('unsupported-root')).toBe(false);
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
								<td style="padding:10px 18px 12px 14px;border:2px solid #94a3b8;line-height:34px;letter-spacing:2px;text-decoration:line-through;background:#f8fafc">
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
					charSpacingPt: expect.any(Number),
					strike: true,
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
			expect(cell?.charSpacingPt).toBeGreaterThan(0);
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
