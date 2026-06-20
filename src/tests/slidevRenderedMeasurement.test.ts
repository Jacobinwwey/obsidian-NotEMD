import { collectRenderedSlideMeasurement } from '../slideExport/slidevLayoutWorkflow';
import {
	analyzeRenderedSlideMeasurement,
	patchDeckWithLayoutAudit,
	type SlidevLayoutAudit,
} from '../slideExport/slidevLayoutAudit';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderRecordListMarkdownLines(lines: string[]): string {
	const html: string[] = ['<ul class="records">'];
	let topOpen = false;
	let nestedOpen = false;
	for (const line of lines) {
		if (line.startsWith('- ')) {
			if (nestedOpen) {
				html.push('</ul>');
				nestedOpen = false;
			}
			if (topOpen) {
				html.push('</li>');
			}
			html.push(`<li>${escapeHtml(line.slice(2))}`);
			topOpen = true;
			continue;
		}
		if (line.startsWith('  - ')) {
			if (!nestedOpen) {
				html.push('<ul>');
				nestedOpen = true;
			}
			html.push(`<li>${escapeHtml(line.slice(4))}</li>`);
		}
	}
	if (nestedOpen) {
		html.push('</ul>');
	}
	if (topOpen) {
		html.push('</li>');
	}
	html.push('</ul>');
	return html.join('');
}

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

	test('measures record-list table fallback as readable text instead of a cramped table', async () => {
		if (!browser) {
			console.warn('Skipping Playwright rendered measurement test:', launchError);
			return;
		}

		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 780, width: 1186, height: 728 },
			pageScale: 1,
			elementKinds: ['table'],
			findings: [
				{
					kind: 'overflow',
					target: 'table',
					message: 'Table exceeds the safe visible rectangle',
					recommendedPatch: 'split-table',
					recommendedScale: 0.55,
					overflowAxis: 'width',
				},
			],
		};
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'## Risk Register',
			'',
			'| Risk | Impact | Mitigation |',
			'| --- | --- | --- |',
			'| Provider retry cascade | A single dense row with long operator-facing explanation pushes the table past the visible content width before the rest of the deck is audited. | Move the details into record-list bullets so each risk can wrap naturally without shrinking the whole slide. |',
			'| Standalone loader drift | Loader sanity checks can pass locally while a minified binding name changes in the native standalone bundle. | Keep the native gate explicit and preserve failed attempts for inspection instead of accepting fallback output silently. |',
		].join('\n');
		const patched = patchDeckWithLayoutAudit(deck, [audit]);
		const recordLines = patched.deckMarkdown
			.split(/\r?\n/)
			.filter(line => /^- \S/.test(line) || /^  - \S/.test(line));

		expect(recordLines.length).toBeGreaterThanOrEqual(6);
		expect(patched.deckMarkdown).not.toContain('| Risk | Impact | Mitigation |');

		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		try {
			await page.setContent(`
				<body style="margin:0">
					<div class="slidev-page" style="width:1280px;height:720px;--slidev-slide-zoom-scale:1;font-family:Inter,Arial,sans-serif">
						<section style="position:absolute;left:80px;top:72px;width:1040px;color:#111827">
							<h2 style="font-size:28px;line-height:34px;margin:0 0 18px">Risk Register</h2>
							${renderRecordListMarkdownLines(recordLines)}
						</section>
					</div>
					<style>
						.records { font-size: 20px; line-height: 1.28; margin: 0; padding-left: 28px; max-width: 1000px; }
						.records > li { margin: 0 0 14px; }
						.records ul { font-size: 18px; line-height: 1.28; margin: 8px 0 0; padding-left: 28px; }
						.records ul li { margin: 0 0 5px; }
					</style>
				</body>
			`);

			const measurement = await collectRenderedSlideMeasurement(page, 1);
			const layoutAudit = analyzeRenderedSlideMeasurement(measurement);

			expect(measurement.elements.some(element => element.kind === 'table')).toBe(false);
			expect(measurement.elements.some(element => element.kind === 'text' && element.textPreview?.includes('Provider retry cascade'))).toBe(true);
			expect(measurement.effectiveMinFontPx).toBeGreaterThanOrEqual(18);
			expect(layoutAudit.findings.some(finding => finding.kind === 'overflow')).toBe(false);
			expect(layoutAudit.findings.some(finding => finding.kind === 'low-effective-font')).toBe(false);
			expect(layoutAudit.qualityMargins?.min).toBeGreaterThanOrEqual(18);
		} finally {
			await page.close();
		}
	});
});
