import {
	analyzeRenderedSlideMeasurement,
	countSlideDeckSlides,
	patchDeckWithLayoutAudit,
	summarizeLayoutAudits,
	type RenderedSlideMeasurement,
	type SlidevLayoutAudit,
} from '../slideExport/slidevLayoutAudit';

function createMeasurement(overrides: Partial<RenderedSlideMeasurement> = {}): RenderedSlideMeasurement {
	return {
		slide: 3,
		slideRoot: { left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720 },
		safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
		contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
		pageScale: 0.45,
		elements: [
			{
				kind: 'mermaid',
				selector: 'svg[id^="mermaid-"]',
				textLength: 0,
				scrollWidth: 1186,
				scrollHeight: 768,
				clientWidth: 1186,
				clientHeight: 768,
				rect: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			},
		],
		slotZones: [],
		errors: [],
		...overrides,
	};
}

describe('slidevLayoutAudit', () => {
	test('reports overflow and recommends a smaller scale for oversized Mermaid slides', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement());

		expect(audit.findings.some((finding) => finding.kind === 'overflow' && finding.target === 'content')).toBe(
			true,
		);
		expect(audit.findings.some((finding) => finding.kind === 'overflow' && finding.target === 'mermaid')).toBe(
			true,
		);
		expect(
			audit.findings.some((finding) => finding.recommendedScale !== null && finding.recommendedScale < 1),
		).toBe(true);
	});

	test('derives fit scale from the verifier safe rectangle instead of the raw slide root', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement());
		const contentFinding = audit.findings.find((finding) => finding.target === 'content');

		expect(contentFinding?.recommendedScale).toBeCloseTo(0.816, 2);
	});

	test('treats safe-rect boundary crossings as quality findings when content remains inside the viewport', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.82,
				contentBounds: { left: 90, top: 80, right: 1180, bottom: 704, width: 1090, height: 624 },
				elements: [
					{
						kind: 'text',
						selector: '.slidev-layout',
						textLength: 320,
						scrollWidth: 1090,
						scrollHeight: 624,
						clientWidth: 1090,
						clientHeight: 624,
						rect: { left: 90, top: 80, right: 1180, bottom: 704, width: 1090, height: 624 },
					},
				],
			}),
		);

		expect(audit.findings.some((finding) => finding.kind === 'overflow')).toBe(false);
		expect(audit.findings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'tight-margin',
					target: 'content',
					recommendedPatch: 'split-slide',
					qualityMarginPx: expect.closeTo(-27.2, 1),
				}),
			]),
		);
	});

	test('reports unreadable scale for non-Mermaid primary content below the readable floor', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.22,
				contentBounds: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
				elements: [
					{
						kind: 'text',
						selector: 'p',
						textLength: 120,
						scrollWidth: 1090,
						scrollHeight: 560,
						clientWidth: 1090,
						clientHeight: 560,
						rect: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
					},
				],
			}),
		);

		expect(audit.findings.some((finding) => finding.kind === 'unreadable-scale')).toBe(true);
	});

	test('keeps low source-preserved Mermaid zoom as review evidence instead of a hard unreadable finding', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.22,
				contentBounds: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
				elements: [
					{
						kind: 'mermaid',
						selector: 'svg[id^="mermaid-"]',
						textLength: 0,
						scrollWidth: 1090,
						scrollHeight: 560,
						clientWidth: 1090,
						clientHeight: 560,
						rect: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
					},
				],
			}),
		);

		expect(audit.findings.some((finding) => finding.kind === 'unreadable-scale')).toBe(false);
		expect(audit.mermaidFit).toEqual(
			expect.objectContaining({
				status: 'manual-review',
				lowZoom: true,
			}),
		);
	});

	test('records Mermaid quality metrics without auto-splitting preserved source diagrams', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.42,
				contentBounds: { left: 100, top: 90, right: 980, bottom: 610, width: 880, height: 520 },
				elements: [
					{
						kind: 'mermaid',
						selector: '.mermaid',
						textLength: 120,
						textPreview: 'Runtime graph',
						minFontPx: 16,
						effectiveMinFontPx: 6.72,
						svgTextMinFontPx: 6.72,
						textSampleCount: 8,
						scrollWidth: 880,
						scrollHeight: 520,
						clientWidth: 880,
						clientHeight: 520,
						rect: { left: 100, top: 90, right: 980, bottom: 610, width: 880, height: 520 },
					},
				],
			}),
		);

		expect(audit.effectiveMinFontPx).toBeCloseTo(6.72, 2);
		expect(audit.svgTextMinFontPx).toBeCloseTo(6.72, 2);
		expect(audit.qualityMargins?.bottom).toBeCloseTo(66.8, 1);
		expect(audit.contentAreaRatio).toBeGreaterThan(0);
		expect(audit.mermaidFit).toEqual(
			expect.objectContaining({
				status: 'manual-review',
				lowZoom: true,
				lowFont: true,
			}),
		);
		expect(audit.mermaidFit?.reason).toContain('preserved Mermaid font');
		expect(audit.findings).toEqual([]);
	});

	test('separates source-preserved Mermaid fit review from manual-review conflicts', () => {
		const fitReviewAudit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.62,
				contentBounds: { left: 110, top: 96, right: 980, bottom: 600, width: 870, height: 504 },
				elements: [
					{
						kind: 'mermaid',
						selector: '.mermaid',
						textLength: 160,
						textPreview: 'Dense but readable Mermaid graph',
						minFontPx: 16,
						effectiveMinFontPx: 10.4,
						svgTextMinFontPx: 10.4,
						textSampleCount: 12,
						scrollWidth: 870,
						scrollHeight: 504,
						clientWidth: 870,
						clientHeight: 504,
						rect: { left: 110, top: 96, right: 980, bottom: 600, width: 870, height: 504 },
					},
				],
			}),
		);
		const manualReviewAudit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 0.3,
				contentBounds: { left: -180, top: 50, right: 1800, bottom: 650, width: 1980, height: 600 },
				elements: [
					{
						kind: 'mermaid',
						selector: '.mermaid',
						textLength: 220,
						textPreview: 'Oversized preserved Mermaid graph',
						minFontPx: 36,
						effectiveMinFontPx: 10.8,
						svgTextMinFontPx: 10.8,
						textSampleCount: 16,
						scrollWidth: 1980,
						scrollHeight: 600,
						clientWidth: 1980,
						clientHeight: 600,
						rect: { left: -180, top: 50, right: 1800, bottom: 650, width: 1980, height: 600 },
					},
				],
			}),
		);

		expect(fitReviewAudit.mermaidFit).toEqual(
			expect.objectContaining({
				status: 'source-preserved-fit-review',
				lowZoom: true,
				lowFont: false,
				tightMargin: false,
			}),
		);
		expect(fitReviewAudit.mermaidFit?.reason).toContain('preserved Mermaid zoom');
		expect(manualReviewAudit.mermaidFit).toEqual(
			expect.objectContaining({
				status: 'manual-review',
				lowFont: false,
			}),
		);
		expect(manualReviewAudit.mermaidFit?.reason).toContain('safe-rect fit would require zoom');
	});

	test('refuses to split Mermaid fences even if a structural code patch is requested', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.08,
			svgTextMinFontPx: 6.5,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'mermaid',
					message: 'Mermaid font is too small',
					recommendedPatch: 'reduce-code',
					recommendedScale: null,
					effectiveFontPx: 6.5,
					fontThresholdPx: 10,
				},
			],
		};
		const mermaidLines = [
			'graph TD',
			'  A[Source Markdown Mermaid Fence] --> B[Prepared Slidev Deck]',
			'  B --> C[Rendered Measurement]',
			'  C --> D[Source-preserved Fit Review]',
			'  D --> E[Manual Review When Needed]',
		];
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'zoom: 0.08',
			'---',
			'',
			'## Mermaid Source Preservation',
			'',
			'```mermaid',
			...mermaidLines,
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).toContain(mermaidLines.join('\n'));
	});

	test('derives a smaller recommended scale from table scroll overflow even when the outer rect fits', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				contentBounds: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
				elements: [
					{
						kind: 'table',
						selector: 'table',
						textLength: 400,
						scrollWidth: 2200,
						scrollHeight: 560,
						clientWidth: 1100,
						clientHeight: 560,
						rect: { left: 70, top: 60, right: 1160, bottom: 620, width: 1090, height: 560 },
					},
				],
			}),
		);

		const tableFinding = audit.findings.find((finding) => finding.target === 'table');
		expect(tableFinding?.recommendedPatch).toBe('split-table');
		expect(tableFinding?.recommendedScale).toBeCloseTo(0.5, 2);
	});

	test('derives slot-zone transform scale from measured zone geometry instead of slide-wide overflow only', () => {
		const audit = analyzeRenderedSlideMeasurement(
			createMeasurement({
				pageScale: 1,
				contentBounds: { left: 80, top: 72, right: 1180, bottom: 620, width: 1100, height: 548 },
				elements: [
					{
						kind: 'other',
						selector: 'div',
						slotZone: 'details',
						textLength: 160,
						textPreview: 'Runtime orchestration detail block',
						scrollWidth: 450,
						scrollHeight: 300,
						clientWidth: 400,
						clientHeight: 260,
						rect: { left: 680, top: 120, right: 1130, bottom: 420, width: 450, height: 300 },
					},
				],
				slotZones: [
					{
						name: 'details',
						textLength: 160,
						textPreview: 'Runtime orchestration detail block',
						ownerRect: { left: 680, top: 120, right: 1080, bottom: 380, width: 400, height: 260 },
						contentBounds: { left: 680, top: 120, right: 1130, bottom: 420, width: 450, height: 300 },
						scrollWidth: 450,
						scrollHeight: 300,
						clientWidth: 400,
						clientHeight: 260,
					},
				],
			}),
		);

		expect(audit.slotZones?.[0]?.recommendedTransformScale).toBeCloseTo(0.866, 2);
	});

	test('patches slide zoom downward when audit recommends a smaller readable scale', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 0.45,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.82,
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
			'zoom: 0.45',
			'---',
			'',
			'## Diagram',
			'',
			'```mermaid',
			'flowchart TB',
			'  A --> B',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.changedSlides).toEqual([2]);
		expect(patched.deckMarkdown).toContain('zoom: 0.369');
	});

	test('blocks zoom patches that would drop below the readable floor', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.3,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.5,
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
			'zoom: 0.30',
			'---',
			'',
			'## Diagram',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([expect.objectContaining({ slide: 2 })]);
	});

	test('fits oversized Mermaid flowcharts below the readable floor without rewriting source diagrams', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.3,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.8,
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
			'zoom: 0.30',
			'---',
			'',
			'## Diagram',
			'',
			'```mermaid',
			'flowchart TB',
			'  Start --> Decision',
			'  Decision -->|yes| PathA',
			'  Decision -->|no| PathB',
			'  subgraph Detail',
			'    PathA --> Review',
			'    Review --> Done',
			'  end',
			'  PathB --> Retry',
			'  Retry --> Done',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.changedSlides).toEqual([2]);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/## Diagram/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).toContain('zoom: 0.24');
		expect(patched.deckMarkdown).toContain('Decision -->|yes| PathA');
		expect(patched.deckMarkdown).toContain('Retry --> Done');
	});

	test('does not rewrite Mermaid diagrams on low effective font without hard overflow', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 110, top: 96, right: 1040, bottom: 590, width: 930, height: 494 },
			pageScale: 0.42,
			effectiveMinFontPx: 6.8,
			svgTextMinFontPx: 6.8,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'mermaid',
					message: 'Mermaid effective font is too small',
					recommendedPatch: 'manual-review',
					recommendedScale: null,
					effectiveFontPx: 6.8,
					fontThresholdPx: 9,
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
			'zoom: 0.42',
			'---',
			'',
			'## Runtime Graph',
			'',
			'```mermaid',
			'flowchart TB',
			'  Start --> Decision',
			'  Decision -->|yes| PathA',
			'  Decision -->|no| PathB',
			'  subgraph Details',
			'    PathA --> Review',
			'    Review --> Done',
			'  end',
			'  PathB --> Retry',
			'  Retry --> Done',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('zoom: 0.42');
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(1);
	});

	test('separates mixed Mermaid and prose while preserving each source Mermaid fence', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 120, top: 96, right: 1080, bottom: 610, width: 960, height: 514 },
			pageScale: 0.42,
			elementKinds: ['mermaid', 'text'],
			mermaidFit: {
				status: 'source-preserved-fit-review',
				reason: 'preserved Mermaid zoom 0.420 is below review scale 0.72',
				pageScale: 0.42,
				fitScale: null,
				nextZoom: null,
				diagramBounds: null,
				effectiveMinFontPx: 8.4,
				svgTextMinFontPx: 8.4,
				qualityMargins: { left: 70, top: 52, right: 80, bottom: 66, min: 52 },
				contentAreaRatio: 0.62,
				lowZoom: true,
				lowFont: false,
				tightMargin: false,
			},
			findings: [],
		};
		const mermaidLines = [
			'```mermaid {scale:0.7}',
			'flowchart LR',
			'  Source --> Transform',
			'  Transform --> Standalone',
			'```',
		];
		const secondMermaidLines = [
			'```mermaid',
			'sequenceDiagram',
			'  participant User',
			'  participant Exporter',
			'  User->>Exporter: preserve original fence',
			'```',
		];
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'zoom: 0.42',
			'---',
			'',
			'## Runtime Shape',
			'',
			...mermaidLines,
			'',
			...secondMermaidLines,
			'',
			'The export path must keep this prose readable without shrinking it together with the diagram.',
			'',
			'- Preserve the source Mermaid fence.',
			'- Move prose onto its own readable slide when needed.',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.changedSlides).toEqual([2]);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.42');
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain(mermaidLines.join('\n'));
		expect(patched.deckMarkdown).toContain(secondMermaidLines.join('\n'));
		expect(patched.deckMarkdown).toContain('```mermaid {scale:0.7}');
		expect(patched.deckMarkdown).toContain('The export path must keep this prose readable');
		expect((patched.deckMarkdown.match(/## Runtime Shape/g) || []).length).toBe(2);
	});

	test('blocks low whole-slide zoom for mixed Mermaid and prose when separation is unsupported', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 1,
			elementKinds: ['mermaid', 'text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.5,
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
			'layout: custom-unpatchable',
			'---',
			'',
			'## Runtime Shape',
			'',
			'```mermaid',
			'flowchart LR',
			'  Source --> Transform',
			'```',
			'',
			'This prose should not be hidden behind low whole-slide zoom.',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit], { mermaidLowZoomReviewScale: 0.72 });

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([
			expect.objectContaining({
				slide: 2,
				reason: expect.stringContaining('mixed Mermaid and primary non-Mermaid content'),
			}),
		]);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.5');
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(1);
	});

	test('fits oversized sequence diagrams instead of splitting Mermaid participants', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.3,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.6,
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
			'zoom: 0.30',
			'---',
			'',
			'## Sequence',
			'',
			'```mermaid',
			'sequenceDiagram',
			'  participant User',
			'  participant Plugin',
			'  User->>Plugin: Export',
			'  alt success',
			'    Plugin-->>User: HTML',
			'  end',
			'  Plugin->>Plugin: Verify layout',
			'  Plugin-->>User: Done',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.changedSlides).toEqual([2]);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect((patched.deckMarkdown.match(/participant User/g) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/participant Plugin/g) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).toContain('zoom: 0.18');
		expect(patched.deckMarkdown).toContain('alt success');
		expect(patched.deckMarkdown).toContain('Plugin->>Plugin: Verify layout');
	});

	test('splits oversized bullet slides when content audit recommends split-slide', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.92,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.92,
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
			'## CLI 边界现实',
			'',
			'- `src/operations/diagramGenerateOperation.ts`',
			'- `src/operations/providerDiagnosticCommand.ts`',
			'- `src/operations/diagramCommandHostAdapter.ts`',
			'- `src/operations/configProfileCommands.ts`',
			'- `src/operations/providerDiagnosticReportPersistence.ts`',
			'- `src/operations/providerDiagnosticCommandHostAdapter.ts`',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/## CLI 边界现实/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('providerDiagnosticReportPersistence');
			expect(patched.deckMarkdown).toContain('providerDiagnosticCommandHostAdapter');
	});

	test('keeps nested record-list children attached to their parent across cross-page splits', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 900, width: 1186, height: 848 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.9,
				},
			],
		};
		// Record-style list: each top-level bullet owns an indented child. A
		// cross-page split must keep parent and child on the same slide.
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'## Module Map',
			'',
			'- Module: `src/translate.ts`',
			'  - Responsibility: Translation pipeline with chunking',
			'- Module: `src/promptUtils.ts`',
			'  - Responsibility: Task-specific prompts',
			'- Module: `src/diagram/`',
			'  - Responsibility: Diagram domain model',
			'- Module: `src/rendering/`',
			'  - Responsibility: Render host, preview, export, theme',
			'- Module: `src/ui/`',
			'  - Responsibility: Settings tab, sidebar, modals',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		// Every "Responsibility" sub-item must remain on the same slide as its
		// parent "- Module" bullet (never the first line of a continuation).
		const slideBodies: string[][] = [];
		let current: string[] = [];
		let sawFrontmatterClose = false;
		for (const line of patched.deckMarkdown.split('\n')) {
			if (line.trim() === '---') {
				if (!sawFrontmatterClose) {
					sawFrontmatterClose = true;
					current = [];
				} else {
					slideBodies.push(current);
					current = [];
				}
				continue;
			}
			current.push(line);
		}
		if (current.some((line) => line.trim().length > 0)) {
			slideBodies.push(current);
		}
		for (const body of slideBodies) {
			const firstSubstantive = body.find(
				(line) => line.trim().length > 0 && !line.startsWith('##') && !line.startsWith('#'),
			);
			if (firstSubstantive !== undefined) {
				expect(firstSubstantive).not.toMatch(/^\s+- Responsibility/);
			}
		}
		expect(patched.deckMarkdown).toContain('  - Responsibility: Translation pipeline with chunking');
		expect(patched.deckMarkdown).toContain('- Module: `src/translate.ts`');
	});


	test('splits oversized Markdown tables when further zoom would become unreadable', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.26,
			elementKinds: ['table'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-table',
					recommendedScale: 0.7,
				},
				{
					kind: 'overflow',
					target: 'table',
					message: 'Table content overflows its scroll box',
					recommendedPatch: 'split-table',
					recommendedScale: 0.7,
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
			'zoom: 0.26',
			'---',
			'',
			'## Provider Matrix',
			'',
			'| Provider | Model | Mode |',
			'| --- | --- | --- |',
			'| OpenAI | gpt-4o | hosted |',
			'| Anthropic | claude-sonnet | hosted |',
			'| Ollama | llama3 | local |',
			'| LMStudio | local-model | local |',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/\| Provider \| Model \| Mode \|/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('| OpenAI | gpt-4o | hosted |');
		expect(patched.deckMarkdown).toContain('| LMStudio | local-model | local |');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.26');
	});

	test('splits wide Markdown tables into column groups when scroll overflow is horizontal', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 780, width: 1186, height: 728 },
			pageScale: 1,
			elementKinds: ['table'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-table',
					recommendedScale: 0.55,
				},
				{
					kind: 'overflow',
					target: 'table',
					message: 'Table content overflows its scroll box',
					recommendedPatch: 'split-table',
					recommendedScale: 0.55,
					scrollOverflow: true,
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
			'## Wide Provider Matrix',
			'',
			'| Provider | Model | Runtime | Token Ceiling | Notes |',
			'| --- | --- | --- | --- | --- |',
			'| OpenAI | gpt-4o | hosted | 16k | default hosted profile |',
			'| Anthropic | claude-sonnet | hosted | 64k | long-context reasoning profile |',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/\| Provider \|/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('| Provider | Model | Runtime |');
		expect(patched.deckMarkdown).toContain('| Provider | Token Ceiling | Notes |');
	});

	test('splits Markdown tables on low effective body font before relying on smaller zoom', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 90, top: 82, right: 1120, bottom: 620, width: 1030, height: 538 },
			pageScale: 0.58,
			tableBodyMinFontPx: 7.8,
			elementKinds: ['table'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'table',
					message: 'Table body font is too small',
					recommendedPatch: 'split-table',
					recommendedScale: null,
					effectiveFontPx: 7.8,
					fontThresholdPx: 10,
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
			'zoom: 0.58',
			'---',
			'',
			'## Provider Matrix',
			'',
			'| Provider | Model | Runtime | Notes |',
			'| --- | --- | --- | --- |',
			'| OpenAI | gpt-4o | hosted | default hosted profile |',
			'| Anthropic | claude-sonnet | hosted | long-context reasoning profile |',
			'| Ollama | llama3 | local | local operator profile |',
			'| LMStudio | local-model | local | desktop profile |',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/\| Provider \| Model \| Runtime \| Notes \|/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.58');
	});

	test('converts pathological width-heavy tables into record slides instead of only repeating column splits', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 780, width: 1186, height: 728 },
			pageScale: 1,
			elementKinds: ['table'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-table',
					recommendedScale: 0.55,
					overflowAxis: 'width',
				},
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
			'## Pathological Table',
			'',
			'| Provider | Model | Runtime | Token Ceiling | Fallback Route | Deployment Notes | Verification Marker |',
			'| --- | --- | --- | --- | --- | --- | --- |',
			'| OpenAI | gpt-4o-production | hosted | 16k | primary::north-america::zero-downtime | default_hosted_profile_with_explicit_operator_guardrails | verify::openai::hosted::success |',
			'| Anthropic | claude-sonnet-extended | hosted | 64k | secondary::global-router::latency-balanced | long_context_reasoning_profile_with_release_evidence_follow_through | verify::anthropic::hosted::success |',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect(patched.deckMarkdown).toContain('- Provider: OpenAI');
		expect(patched.deckMarkdown).toContain('  - Fallback Route: primary::north-america::zero-downtime');
		expect(patched.deckMarkdown).toContain('- Provider: Anthropic');
		expect(patched.deckMarkdown).not.toContain(
			'| Provider | Model | Runtime | Token Ceiling | Fallback Route | Deployment Notes | Verification Marker |',
		);
	});

	test('converts long table cells into record slides instead of preserving cramped rows', () => {
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

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect(patched.deckMarkdown).toContain('- Risk: Provider retry cascade');
		expect(patched.deckMarkdown).toContain('  - Mitigation: Move the details into record-list bullets');
		expect(patched.deckMarkdown).toContain('- Risk: Standalone loader drift');
		expect(patched.deckMarkdown).not.toContain('| Risk | Impact | Mitigation |');
	});

	test('splits oversized code fences when further zoom would become unreadable', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.26,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.7,
				},
				{
					kind: 'overflow',
					target: 'code',
					message: 'Code block content overflows its scroll box',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.7,
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
			'zoom: 0.26',
			'---',
			'',
			'## Export Pipeline',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const patchResult = patchDeckWithLayoutAudit(deckMarkdown, auditResult.layoutAudits, config);',
			'if (patchResult.changed) {',
			'  await exportSlidevHtml(app, slideSource, config, onProgress);',
			'}',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/## Export Pipeline/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('probeEnvironment');
		expect(patched.deckMarkdown).toContain('patchDeckWithLayoutAudit');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.26');
	});

	test('splits tall code fences on vertical scroll overflow before the readable floor is crossed', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 800, width: 1186, height: 748 },
			pageScale: 1,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.8,
				},
				{
					kind: 'overflow',
					target: 'code',
					message: 'Code block overflows its scroll box',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.8,
					scrollOverflow: true,
					overflowAxis: 'height',
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
			'## Tall Export Pipeline',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'const slidesToAudit = resolveSlidesToAudit(args.sampleSlides, currentDeckMarkdown, slideExport);',
			'',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const layoutSummary = summarizeLayoutAudits(auditResult.layoutAudits, retryCount);',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/## Tall Export Pipeline/g) || []).length).toBe(2);
	});

	test('keeps complete code semantic blocks together when splitting dense fences', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.26,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'overflow',
					target: 'code',
					message: 'Code block overflows its scroll box',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.7,
					scrollOverflow: true,
					overflowAxis: 'height',
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
			'zoom: 0.26',
			'---',
			'',
			'## Semantic Code Split',
			'',
			'```ts',
			'// Prepare the source once.',
			'async function prepareDeck() {',
			'  const environment = await probeEnvironment();',
			'  if (!environment.capabilities.html) {',
			'    throw new Error("HTML export is unavailable");',
			'  }',
			'  const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'  await writePreparedDeck(slideSource);',
			'  return slideSource;',
			'}',
			'async function buildDeck(slideSource) {',
			'  const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'  await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'  return htmlPath;',
			'}',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toMatch(
			/\/\/ Prepare the source once\.\nasync function prepareDeck\(\) \{[\s\S]*?return slideSource;\n\}/,
		);
		expect(patched.deckMarkdown).toMatch(/async function buildDeck\(slideSource\) \{[\s\S]*?return htmlPath;\n\}/);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.26');
	});

	test('keeps TypeScript import groups and top-level declarations intact when splitting dense fences', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.08,
			codeMinFontPx: 7.4,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'code',
					message: 'Code font is too small',
					recommendedPatch: 'reduce-code',
					recommendedScale: null,
					effectiveFontPx: 7.4,
					fontThresholdPx: 10,
				},
			],
		};
		const importLines = [
			'import alpha from "./alpha";',
			'import beta from "./beta";',
			'import gamma from "./gamma";',
			'import delta from "./delta";',
			'import epsilon from "./epsilon";',
			'import zeta from "./zeta";',
			'import eta from "./eta";',
			'import type { SlideExportConfig } from "./types";',
		];
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'zoom: 0.08',
			'---',
			'',
			'## TypeScript Split',
			'',
			'```ts',
			...importLines,
			'type ExportMode = {',
			'  format: "html" | "pdf";',
			'  config: SlideExportConfig;',
			'};',
			'export async function runExport(mode: ExportMode) {',
			'  const environment = await alpha.probe();',
			'  const slideSource = await beta.prepare(mode.config);',
			'  return gamma.render(environment, slideSource);',
			'}',
			'export class SlideExportRunner {',
			'  constructor(private readonly mode: ExportMode) {}',
			'  async run() {',
			'    return runExport(this.mode);',
			'  }',
			'}',
			'const exporters = new Map<string, () => Promise<unknown>>([',
			'  ["html", async () => runExport({ format: "html", config })],',
			'  ["pdf", async () => runExport({ format: "pdf", config })],',
			']);',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(5);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(4);
		expect(patched.deckMarkdown).toContain(importLines.join('\n'));
		expect(patched.deckMarkdown).toMatch(/type ExportMode = \{[\s\S]*?config: SlideExportConfig;\n\};/);
		expect(patched.deckMarkdown).toMatch(
			/export async function runExport\(mode: ExportMode\) \{[\s\S]*?return gamma\.render\(environment, slideSource\);\n\}/,
		);
		expect(patched.deckMarkdown).toMatch(
			/export class SlideExportRunner \{[\s\S]*?return runExport\(this\.mode\);\n  \}\n\}/,
		);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.08');
	});

	test('keeps Python imports, decorators, and top-level blocks intact when splitting dense fences', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.08,
			codeMinFontPx: 7.4,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'code',
					message: 'Code font is too small',
					recommendedPatch: 'reduce-code',
					recommendedScale: null,
					effectiveFontPx: 7.4,
					fontThresholdPx: 10,
				},
			],
		};
		const importLines = [
			'from dataclasses import dataclass',
			'from pathlib import Path',
			'import json',
			'import typing as t',
		];
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'zoom: 0.08',
			'---',
			'',
			'## Python Split',
			'',
			'```python',
			...importLines,
			'@dataclass',
			'class ExportJob:',
			'    source: Path',
			'    output: Path',
			'',
			'    def label(self) -> str:',
			'        return self.source.stem',
			'async def load_export_job(path: Path) -> ExportJob:',
			'    payload = json.loads(path.read_text())',
			'    return ExportJob(',
			'        source=Path(payload["source"]),',
			'        output=Path(payload["output"]),',
			'    )',
			'def render_export(job: ExportJob) -> dict[str, str]:',
			'    if not job.source.exists():',
			'        raise FileNotFoundError(job.source)',
			'    return {"label": job.label(), "output": str(job.output)}',
			'if __name__ == "__main__":',
			'    print(render_export(ExportJob(Path("deck.md"), Path("out"))))',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(5);
		expect((patched.deckMarkdown.match(/```python/g) || []).length).toBe(4);
		expect(patched.deckMarkdown).toContain(importLines.join('\n'));
		expect(patched.deckMarkdown).toMatch(/@dataclass\nclass ExportJob:[\s\S]*?return self\.source\.stem/);
		expect(patched.deckMarkdown).toMatch(
			/async def load_export_job\(path: Path\) -> ExportJob:[\s\S]*?output=Path\(payload\["output"\]\),\n    \)/,
		);
		expect(patched.deckMarkdown).toMatch(
			/def render_export\(job: ExportJob\) -> dict\[str, str\]:[\s\S]*?return \{"label": job\.label\(\), "output": str\(job\.output\)\}/,
		);
		expect(patched.deckMarkdown).toMatch(/if __name__ == "__main__":[\s\S]*?print\(render_export/);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.08');
	});

	test('keeps Rust use groups, attributes, and top-level items intact when splitting dense fences', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.08,
			codeMinFontPx: 7.4,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'code',
					message: 'Code font is too small',
					recommendedPatch: 'reduce-code',
					recommendedScale: null,
					effectiveFontPx: 7.4,
					fontThresholdPx: 10,
				},
			],
		};
		const useLines = [
			'use std::collections::BTreeMap;',
			'use std::path::{Path, PathBuf};',
			'use crate::layout::SlideLayoutPlan;',
			'use crate::render::RenderReport;',
		];
		const deck = [
			'---',
			'theme: default',
			'---',
			'',
			'# Intro',
			'',
			'---',
			'zoom: 0.08',
			'---',
			'',
			'## Rust Split',
			'',
			'```rust',
			...useLines,
			'#[derive(Debug, Clone)]',
			'pub struct ExportJob {',
			'    pub source: PathBuf,',
			'    pub metadata: BTreeMap<String, String>,',
			'}',
			'impl ExportJob {',
			'    pub fn from_path(source: &Path) -> Self {',
			'        Self { source: source.into(), metadata: BTreeMap::new() }',
			'    }',
			'    pub fn label(&self) -> String {',
			'        self.source.display().to_string()',
			'    }',
			'}',
			'pub fn render_export(plan: &SlideLayoutPlan, job: &ExportJob) -> RenderReport {',
			'    let label = job.label();',
			'    RenderReport::new(plan.source_title.clone(), label)',
			'}',
			'#[cfg(test)]',
			'mod tests {',
			'    use super::*;',
			'    #[test]',
			'    fn labels_export_jobs() {',
			'        assert!(ExportJob::from_path(Path::new("deck.md")).label().contains("deck.md"));',
			'    }',
			'}',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(5);
		expect((patched.deckMarkdown.match(/```rust/g) || []).length).toBe(4);
		expect(patched.deckMarkdown).toContain(useLines.join('\n'));
		expect(patched.deckMarkdown).toMatch(
			/#\[derive\(Debug, Clone\)\]\npub struct ExportJob \{[\s\S]*?metadata: BTreeMap<String, String>,\n\}/,
		);
		expect(patched.deckMarkdown).toMatch(
			/impl ExportJob \{[\s\S]*?self\.source\.display\(\)\.to_string\(\)\n    \}\n\}/,
		);
		expect(patched.deckMarkdown).toMatch(
			/pub fn render_export\(plan: &SlideLayoutPlan, job: &ExportJob\) -> RenderReport \{[\s\S]*?RenderReport::new\(plan\.source_title\.clone\(\), label\)\n\}/,
		);
		expect(patched.deckMarkdown).toMatch(/#\[cfg\(test\)\]\nmod tests \{[\s\S]*?labels_export_jobs/);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.08');
	});

	test('splits code fences on low effective code font without waiting for scroll overflow', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 88, top: 80, right: 1140, bottom: 610, width: 1052, height: 530 },
			pageScale: 0.62,
			codeMinFontPx: 8.4,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'code',
					message: 'Code font is too small',
					recommendedPatch: 'reduce-code',
					recommendedScale: null,
					effectiveFontPx: 8.4,
					fontThresholdPx: 10,
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
			'zoom: 0.62',
			'---',
			'',
			'## Export Pipeline',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const patchResult = patchDeckWithLayoutAudit(deckMarkdown, auditResult.layoutAudits, config);',
			'if (patchResult.changed) {',
			'  await exportSlidevHtml(app, slideSource, config, onProgress);',
			'}',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.62');
	});

	test('splits code inside supported two-cols slot layouts', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.82,
				},
				{
					kind: 'overflow',
					target: 'code',
					message: 'Code block overflows its scroll box',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.82,
					scrollOverflow: true,
					overflowAxis: 'height',
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
			'layout: two-cols',
			'---',
			'',
			'## Export Workflow',
			'',
			'- Left column context stays duplicated.',
			'',
			'::right::',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const patchResult = patchDeckWithLayoutAudit(currentDeckMarkdown, auditResult.layoutAudits, config);',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/layout: two-cols/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::right::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/Left column context stays duplicated/g) || []).length).toBe(2);
	});

	test('splits code inside explicit default slot markers', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['code'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.82,
				},
				{
					kind: 'overflow',
					target: 'code',
					message: 'Code block overflows its scroll box',
					recommendedPatch: 'reduce-code',
					recommendedScale: 0.82,
					scrollOverflow: true,
					overflowAxis: 'height',
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
			'layout: two-cols',
			'---',
			'',
			'::right::',
			'',
			'- Right slot stays duplicated.',
			'',
			'::default::',
			'',
			'## Export Workflow',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const patchResult = patchDeckWithLayoutAudit(currentDeckMarkdown, auditResult.layoutAudits, config);',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/::default::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::right::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/```ts/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/Right slot stays duplicated/g) || []).length).toBe(2);
	});

	test('splits supported two-cols-header slot layouts by patching the overflowing slot only', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.9,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.9,
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
			'layout: two-cols-header',
			'---',
			'',
			'## Layout Audit Coverage',
			'',
			'::left::',
			'',
			'- Static left column',
			'',
			'::right::',
			'',
			'- Audit visible root',
			'- Preserve Mermaid and report fit review',
			'- Split table columns when width bound',
			'- Split code fences when height bound',
			'- Keep deterministic retry closure',
			'- Preserve host command smoke',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/layout: two-cols-header/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::left::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::right::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/Static left column/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('Split table columns when width bound');
		expect(patched.deckMarkdown).toContain('Preserve host command smoke');
	});

	test('splits generic slot-marked custom layouts when a named slot contains patchable content', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.9,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.9,
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'- Summary remains duplicated.',
			'',
			'::details::',
			'',
			'- First detail',
			'- Second detail',
			'- Third detail',
			'- Fourth detail',
			'- Fifth detail',
			'- Sixth detail',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/layout: custom-grid/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::summary::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/::details::/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/Summary remains duplicated/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('- First detail');
		expect(patched.deckMarkdown).toContain('- Sixth detail');
	});

	test('wraps a component-heavy custom slot zone in Transform when structural splitting is unavailable', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.83,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.83,
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'- Summary stays unscaled.',
			'',
			'::details::',
			'',
			'<div class="space-y-2">',
			'  <MetricCard title="One" value="Alpha" />',
			'  <MetricCard title="Two" value="Beta" />',
			'  <MetricCard title="Three" value="Gamma" />',
			'  <MetricCard title="Four" value="Delta" />',
			'  <MetricCard title="Five" value="Epsilon" />',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('<Transform :scale="0.83" origin="top left">');
		expect(patched.deckMarkdown).toContain('::details::');
		expect(patched.deckMarkdown).toContain('<MetricCard title="Five" value="Epsilon" />');
		expect((patched.deckMarkdown.match(/Summary stays unscaled/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.83');
	});

	test('targets the matching component-heavy slot zone when multiple transformable zones exist', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text', 'other'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.86,
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'other element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.86,
					textPreview:
						'Runtime orchestration detail block 12 with explicit structured text that stays inside a single custom component tree.',
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'<div class="summary-card">',
			'  <p>Short status card</p>',
			'</div>',
			'',
			'::details::',
			'',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 01 with explicit structured text that stays inside a single custom component tree.</div>',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 12 with explicit structured text that stays inside a single custom component tree.</div>',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect((patched.deckMarkdown.match(/<Transform :scale="0.86" origin="top left">/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).toContain('::summary::\n\n<div class="summary-card">');
		expect(patched.deckMarkdown).toContain('::details::\n\n<Transform :scale="0.86" origin="top left">');
	});

	test('prefers slot-zone geometry over noisier descendant counts when attributing a multizone component slide', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'other',
					message: 'summary descendant text overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.92,
					slotZone: 'summary',
					textPreview: 'Short status card',
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'summary descendant text overflows again',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.92,
					slotZone: 'summary',
					textPreview: 'Should remain unscaled',
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'details owner overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.73,
					slotZone: 'details',
					textPreview: 'Runtime orchestration detail block 12 with explicit structured text.',
					overflow: { left: 0, top: 0, right: 18, bottom: 64 },
				},
			],
			slotZones: [
				{
					name: 'summary',
					textPreview: 'Short status card',
					ownerRect: { left: 110, top: 146, right: 520, bottom: 420, width: 410, height: 274 },
					contentBounds: { left: 118, top: 156, right: 506, bottom: 392, width: 388, height: 236 },
					scrollOverflow: false,
					recommendedTransformScale: null,
				},
				{
					name: 'details',
					textPreview: 'Runtime orchestration detail block 12 with explicit structured text.',
					ownerRect: { left: 612, top: 146, right: 1112, bottom: 418, width: 500, height: 272 },
					contentBounds: { left: 612, top: 146, right: 1166, bottom: 448, width: 554, height: 302 },
					scrollOverflow: true,
					overflow: { left: 0, top: 0, right: 18, bottom: 64 },
					recommendedTransformScale: 0.901,
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'<div class="summary-card">',
			'  <p>Short status card</p>',
			'  <p>Should remain unscaled</p>',
			'</div>',
			'',
			'::details::',
			'',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 12 with explicit structured text.</div>',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.deckMarkdown).toContain('::details::\n\n<Transform :scale="0.901" origin="top left">');
		expect(patched.deckMarkdown).not.toContain('::summary::\n\n<Transform :scale="0.901" origin="top left">');
	});

	test('wraps each overflowing component-heavy slot zone when multiple zones independently overflow', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'other',
					message: 'summary zone overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.78,
					slotZone: 'summary',
					textPreview: 'Summary cards',
					overflow: { left: 0, top: 0, right: 20, bottom: 44 },
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'details zone overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.74,
					slotZone: 'details',
					textPreview: 'Detailed orchestration cards',
					overflow: { left: 0, top: 0, right: 26, bottom: 62 },
				},
			],
			slotZones: [
				{
					name: 'summary',
					textPreview: 'Summary cards',
					ownerRect: { left: 110, top: 146, right: 520, bottom: 420, width: 410, height: 274 },
					contentBounds: { left: 110, top: 146, right: 552, bottom: 454, width: 442, height: 308 },
					scrollOverflow: true,
					overflow: { left: 0, top: 0, right: 20, bottom: 44 },
					recommendedTransformScale: 0.928,
				},
				{
					name: 'details',
					textPreview: 'Detailed orchestration cards',
					ownerRect: { left: 612, top: 146, right: 1112, bottom: 418, width: 500, height: 272 },
					contentBounds: { left: 612, top: 146, right: 1166, bottom: 448, width: 554, height: 302 },
					scrollOverflow: true,
					overflow: { left: 0, top: 0, right: 26, bottom: 62 },
					recommendedTransformScale: 0.901,
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'<div class="summary-grid">',
			'  <div class="border rounded px-3 py-2 text-sm">Summary cards</div>',
			'</div>',
			'',
			'::details::',
			'',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Detailed orchestration cards</div>',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect((patched.deckMarkdown.match(/<Transform :scale=/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('::summary::\n\n<Transform :scale="0.928" origin="top left">');
		expect(patched.deckMarkdown).toContain('::details::\n\n<Transform :scale="0.901" origin="top left">');
	});

	test('splits competing component-heavy slot zones when measured transforms would lower text below the font floor', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			effectiveMinFontPx: 16,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'other',
					message: 'summary zone overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.44,
					slotZone: 'summary',
					textPreview: 'Summary cards',
					overflow: { left: 0, top: 0, right: 140, bottom: 44 },
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'details zone overflows',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.48,
					slotZone: 'details',
					textPreview: 'Detailed orchestration cards',
					overflow: { left: 0, top: 0, right: 126, bottom: 62 },
				},
			],
			slotZones: [
				{
					name: 'summary',
					textPreview: 'Summary cards',
					effectiveMinFontPx: 17,
					ownerRect: { left: 110, top: 146, right: 520, bottom: 420, width: 410, height: 274 },
					contentBounds: { left: 110, top: 146, right: 970, bottom: 454, width: 860, height: 308 },
					scrollOverflow: true,
					overflow: { left: 0, top: 0, right: 140, bottom: 44 },
					recommendedTransformScale: 0.44,
					minimumReadableTransformScale: 0.588,
				},
				{
					name: 'details',
					textPreview: 'Detailed orchestration cards',
					effectiveMinFontPx: 16,
					ownerRect: { left: 612, top: 146, right: 1112, bottom: 418, width: 500, height: 272 },
					contentBounds: { left: 612, top: 146, right: 1218, bottom: 448, width: 606, height: 302 },
					scrollOverflow: true,
					overflow: { left: 0, top: 0, right: 126, bottom: 62 },
					recommendedTransformScale: 0.48,
					minimumReadableTransformScale: 0.625,
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'<div data-notemd-slot-zone="summary">',
			'<div class="summary-grid">',
			'  <div class="border rounded px-3 py-2 text-sm">Summary cards</div>',
			'</div>',
			'</div>',
			'',
			'::details::',
			'',
			'<div data-notemd-slot-zone="details">',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Detailed orchestration cards</div>',
			'</div>',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect(patched.deckMarkdown).toContain('data-notemd-slot-zone="summary"');
		expect(patched.deckMarkdown).toContain('data-notemd-slot-zone="details"');
		expect(patched.deckMarkdown).not.toContain('<Transform :scale=');
		expect(patched.deckMarkdown).not.toContain('layout: custom-grid');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.44');
	});

	test('does not retarget a different component-heavy slot after another slot is already wrapped in Transform', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 0.86,
			elementKinds: ['text', 'other'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.9,
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'other element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.9,
					textPreview:
						'Runtime orchestration detail block 12 with explicit structured text that stays inside a single custom component tree.',
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
			'layout: custom-grid',
			'---',
			'',
			'::summary::',
			'',
			'<div class="summary-card">',
			'  <p>Short status card</p>',
			'</div>',
			'',
			'::details::',
			'',
			'<Transform :scale="0.86" origin="top left">',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 01 with explicit structured text that stays inside a single custom component tree.</div>',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block 12 with explicit structured text that stays inside a single custom component tree.</div>',
			'</div>',
			'</Transform>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect((patched.deckMarkdown.match(/<Transform :scale="0.86" origin="top left">/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).not.toContain('::summary::\n\n<Transform :scale=');
	});

	test('removes whole-slide zoom from an already transformed slot when compounded scale lowers text quality', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 78, top: 90, right: 710, bottom: 430, width: 632, height: 340 },
			pageScale: 0.674,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'low-effective-font',
					target: 'text',
					message: 'text effective font is below the quality floor',
					recommendedPatch: 'split-slide',
					recommendedScale: null,
					slotZone: 'details',
					effectiveFontPx: 9.75,
					fontThresholdPx: 10,
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
			'layout: custom-grid',
			'zoom: 0.674',
			'---',
			'',
			'::summary::',
			'',
			'- Summary stays unscaled.',
			'',
			'::details::',
			'',
			'<Transform :scale="0.804" origin="top left">',
			'<div class="space-y-3">',
			'  <div class="border rounded px-3 py-2 text-sm">Runtime orchestration detail block.</div>',
			'</div>',
			'</Transform>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.674');
		expect(patched.deckMarkdown).toContain('::details::\n\n<Transform :scale="0.804" origin="top left">');
		expect(patched.deckMarkdown).toContain('::summary::\n\n- Summary stays unscaled.');
	});

	test('splits first-slide deck headmatter content structurally when per-slide zoom cannot be used', () => {
		const audit: SlidevLayoutAudit = {
			slide: 1,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.92,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.92,
				},
			],
		};
		const deck = [
			'---',
			'theme: default',
			'title: Headmatter Slide',
			'---',
			'',
			'# Headmatter Slide',
			'',
			'- first bullet',
			'- second bullet',
			'- third bullet',
			'- fourth bullet',
			'- fifth bullet',
			'- sixth bullet',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(patched.changedSlides).toEqual([1]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect((patched.deckMarkdown.match(/^title: Headmatter Slide$/gm) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/^theme: default$/gm) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/^# Headmatter Slide$/gm) || []).length).toBe(2);
		expect(patched.deckMarkdown).toContain('- first bullet');
		expect(patched.deckMarkdown).toContain('- sixth bullet');
		expect(patched.deckMarkdown).not.toContain('zoom:');
	});

	test('wraps a component-heavy single-surface slide in Transform before falling back to whole-slide zoom', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.88,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.88,
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
			'layout: default',
			'---',
			'',
			'<div class="space-y-2">',
			'  <StatBlock label="Queue A" value="128" />',
			'  <StatBlock label="Queue B" value="256" />',
			'  <StatBlock label="Queue C" value="512" />',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('<Transform :scale="0.88" origin="top left">');
		expect(patched.deckMarkdown).toContain('<StatBlock label="Queue C" value="512" />');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.88');
	});

	test('wraps a component-heavy custom single-surface layout in Transform without widening structural split support', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.86,
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'component surface exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.86,
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
			'layout: telemetry-shell',
			'---',
			'',
			'<div class="surface-grid">',
			'  <MetricCard title="Queue A" value="128" />',
			'  <MetricCard title="Queue B" value="256" />',
			'  <MetricCard title="Queue C" value="512" />',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('layout: telemetry-shell');
		expect(patched.deckMarkdown).toContain('<Transform :scale="0.86" origin="top left">');
		expect(patched.deckMarkdown).toContain('<MetricCard title="Queue C" value="512" />');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.86');
	});

	test('wraps a multiline Vue component tree surface in Transform without requiring slot owner markers', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1248, bottom: 812, width: 1200, height: 760 },
			pageScale: 1,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.84,
				},
				{
					kind: 'overflow',
					target: 'other',
					message: 'component surface exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.84,
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
			'layout: dashboard-shell',
			'---',
			'',
			'<DashboardGrid',
			'  class="stage10-dashboard"',
			'  :cards="[',
			"    { label: 'Queue A', value: '128', tone: 'teal' },",
			"    { label: 'Queue B', value: '256', tone: 'blue' },",
			'  ]"',
			'>',
			'  <MetricPanel',
			'    label="Queue A"',
			'    value="128"',
			'    tone="teal"',
			'  />',
			'  <template #footer>',
			'    <div class="dashboard-footnote">Vue component tree regression fingerprint remains a single measured surface.</div>',
			'  </template>',
			'</DashboardGrid>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('layout: dashboard-shell');
		expect(patched.deckMarkdown).toContain('<Transform :scale="0.84" origin="top left">');
		expect(patched.deckMarkdown).toContain(':cards="[');
		expect(patched.deckMarkdown).toContain('Vue component tree regression fingerprint');
		expect(patched.deckMarkdown).not.toContain('data-notemd-slot-zone=');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.84');
	});

	test('wraps a component surface with a heading without shrinking the heading', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1248, bottom: 812, width: 1200, height: 760 },
			pageScale: 1,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'other',
					message: 'component surface exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.82,
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
			'layout: dashboard-shell',
			'---',
			'',
			'## Component Surface',
			'',
			'<DashboardGrid class="stage12-dashboard">',
			'  <MetricPanel label="Queue A" value="128" />',
			'</DashboardGrid>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).toContain('## Component Surface\n\n<Transform :scale="0.82" origin="top left">');
		expect(patched.deckMarkdown).toContain('<DashboardGrid class="stage12-dashboard">');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.82');
	});

	test('separates mixed component and Markdown prose instead of applying whole-slide zoom', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1248, bottom: 812, width: 1200, height: 760 },
			pageScale: 1,
			elementKinds: ['other', 'text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.84,
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
			'layout: dashboard-shell',
			'---',
			'',
			'<DashboardGrid class="stage10-dashboard">',
			'  <MetricPanel label="Queue A" value="128" />',
			'</DashboardGrid>',
			'This markdown prose is not part of a bounded component surface.',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect(patched.deckMarkdown).not.toContain('<Transform :scale="0.84"');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.84');
		expect((patched.deckMarkdown.match(/layout: dashboard-shell/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/<DashboardGrid class="stage10-dashboard">/g) || []).length).toBe(1);
		expect((patched.deckMarkdown.match(/<MetricPanel label="Queue A" value="128" \/>/g) || []).length).toBe(1);
		expect(patched.deckMarkdown).toContain('This markdown prose is not part of a bounded component surface.');
	});

	test('blocks whole-slide zoom for mixed component and fenced Markdown content when separation is unsafe', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1248, bottom: 812, width: 1200, height: 760 },
			pageScale: 1,
			elementKinds: ['other', 'code'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.62,
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
			'layout: dashboard-shell',
			'---',
			'',
			'<DashboardGrid class="stage12-dashboard">',
			'  <MetricPanel label="Queue A" value="128" />',
			'</DashboardGrid>',
			'',
			'```ts',
			'const unsafeBoundary = "do not silently shrink this mixed surface";',
			'```',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([
			expect.objectContaining({
				slide: 2,
				reason: expect.stringContaining('mixed component and primary Markdown content'),
			}),
		]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.62');
		expect(patched.deckMarkdown).toContain('const unsafeBoundary');
	});

	test.each([
		{
			name: 'table',
			lines: [
				'| Risk | Mitigation |',
				'| --- | --- |',
				'| unsafe mixed table | do not shrink the component and table together |',
			],
			fingerprint: '| unsafe mixed table |',
		},
		{
			name: 'directive',
			lines: [':::note', 'Directive content is an unsupported component/prose boundary.', ':::'],
			fingerprint: 'Directive content is an unsupported component/prose boundary.',
		},
		{
			name: 'image',
			lines: ['![Unsupported component image boundary regression fingerprint](./assets/boundary-image.svg)'],
			fingerprint: 'Unsupported component image boundary regression fingerprint',
		},
	])(
		'blocks whole-slide zoom for mixed component and $name content when separation is unsafe',
		({ lines, fingerprint }) => {
			const audit: SlidevLayoutAudit = {
				slide: 2,
				safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
				contentBounds: { left: 48, top: 52, right: 1248, bottom: 812, width: 1200, height: 760 },
				pageScale: 1,
				elementKinds: ['other', 'text'],
				findings: [
					{
						kind: 'overflow',
						target: 'content',
						message: 'Slide content exceeds the safe visible rectangle',
						recommendedPatch: 'reduce-zoom',
						recommendedScale: 0.62,
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
				'layout: dashboard-shell',
				'---',
				'',
				'<DashboardGrid class="stage13-dashboard">',
				'  <MetricPanel label="Queue A" value="128" />',
				'</DashboardGrid>',
				'',
				...lines,
			].join('\n');

			const patched = patchDeckWithLayoutAudit(deck, [audit]);

			expect(patched.changed).toBe(false);
			expect(patched.blockedSlides).toEqual([
				expect.objectContaining({
					slide: 2,
					reason: expect.stringContaining('mixed component and primary Markdown content'),
				}),
			]);
			expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(2);
			expect(patched.deckMarkdown).not.toContain('zoom: 0.62');
			expect(patched.deckMarkdown).toContain(fingerprint);
		},
	);

	test('does not compound a single-surface Transform with whole-slide zoom', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 0.86,
			elementKinds: ['other'],
			findings: [
				{
					kind: 'overflow',
					target: 'other',
					message: 'component surface still exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.9,
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
			'layout: telemetry-shell',
			'---',
			'',
			'<Transform :scale="0.86" origin="top left">',
			'<div class="surface-grid">',
			'  <MetricCard title="Queue A" value="128" />',
			'</div>',
			'</Transform>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([
			expect.objectContaining({
				slide: 2,
				reason: 'existing Transform will not be compounded with whole-slide zoom',
			}),
		]);
		expect(patched.deckMarkdown).toContain('<Transform :scale="0.86" origin="top left">');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.774');
	});

	test('blocks component-heavy surface zoom when measured scaling would violate the font floor', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1500, bottom: 820, width: 1452, height: 768 },
			pageScale: 1,
			effectiveMinFontPx: 14,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.5,
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
			'layout: default',
			'---',
			'',
			'<div class="space-y-2">',
			'  <StatBlock label="Queue A" value="128" />',
			'  <StatBlock label="Queue B" value="256" />',
			'</div>',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(false);
		expect(patched.blockedSlides).toEqual([
			expect.objectContaining({
				slide: 2,
				reason: expect.stringContaining('would lower text below 10px'),
			}),
		]);
		expect(patched.deckMarkdown).not.toContain('<Transform :scale=');
		expect(patched.deckMarkdown).not.toContain('zoom: 0.5');
	});

	test('allows supported single-slot built-in layouts to split content without slot markers', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 820, width: 1186, height: 768 },
			pageScale: 1,
			elementKinds: ['text'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-slide',
					recommendedScale: 0.9,
				},
				{
					kind: 'overflow',
					target: 'text',
					message: 'text element exceeds the safe visible rectangle',
					recommendedPatch: 'reduce-zoom',
					recommendedScale: 0.9,
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
			'layout: quote',
			'---',
			'',
			'## Quote Layout Coverage',
			'',
			'- first bullet',
			'- second bullet',
			'- third bullet',
			'- fourth bullet',
			'- fifth bullet',
			'- sixth bullet',
		].join('\n');

		const patched = patchDeckWithLayoutAudit(deck, [audit]);

		expect(patched.changed).toBe(true);
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/layout: quote/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/## Quote Layout Coverage/g) || []).length).toBe(2);
	});

	test('summarizes audit counts across slides', () => {
		const auditWithOverflow = analyzeRenderedSlideMeasurement(createMeasurement());
		const auditWithRenderError = analyzeRenderedSlideMeasurement(
			createMeasurement({
				slideRoot: null,
				safeRect: null,
				contentBounds: null,
				elements: [],
				errors: ['Slide root not found'],
			}),
		);

		const summary = summarizeLayoutAudits([auditWithOverflow, auditWithRenderError], 1);

		expect(summary.slideCount).toBe(2);
		expect(summary.overflowCount).toBeGreaterThan(0);
		expect(summary.hardOverflowCount).toBe(summary.overflowCount);
		expect(summary.unreadableScaleCount).toBe(summary.unreadableCount);
		expect(summary.lowEffectiveFontCount).toBeGreaterThanOrEqual(0);
		expect(summary.qualityMarginWarningCount).toBeGreaterThanOrEqual(0);
		expect(summary.lowContentUtilizationCount).toBeGreaterThanOrEqual(0);
		expect(summary.mermaidSlideCount).toBe(1);
		expect(summary.mermaidFitReviewCount).toBe(1);
		expect(summary.mermaidLowZoomCount).toBe(1);
		expect(summary.mermaidManualReviewCount).toBe(0);
		expect(summary.postPatchCount).toBe(1);
		expect(summary.renderErrorCount).toBe(1);
		expect(summary.retryCount).toBe(1);
	});
});
