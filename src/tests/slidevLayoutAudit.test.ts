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
		errors: [],
		...overrides,
	};
}

describe('slidevLayoutAudit', () => {
	test('reports overflow and recommends a smaller scale for oversized Mermaid slides', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement());

		expect(audit.findings.some(finding => finding.kind === 'overflow' && finding.target === 'content')).toBe(true);
		expect(audit.findings.some(finding => finding.kind === 'overflow' && finding.target === 'mermaid')).toBe(true);
		expect(audit.findings.some(finding => finding.recommendedScale !== null && finding.recommendedScale < 1)).toBe(true);
	});

	test('reports unreadable scale when zoom falls below the readable floor', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement({
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
		}));

		expect(audit.findings.some(finding => finding.kind === 'unreadable-scale')).toBe(true);
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
					recommendedPatch: 'split-diagram',
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
		expect(patched.deckMarkdown).toContain('zoom: 0.362');
	});

	test('blocks zoom patches that would drop below the readable floor', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.30,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-diagram',
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
		expect(patched.blockedSlides).toEqual([
			expect.objectContaining({ slide: 2 }),
		]);
	});

	test('splits oversized Mermaid flowcharts into multiple slides before dropping below the readable floor', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.30,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-diagram',
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
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/## Diagram/g) || []).length).toBe(2);
		expect(patched.deckMarkdown).not.toContain('zoom: 0.30');
		expect(patched.deckMarkdown).toContain('Decision -->|yes| PathA');
		expect(patched.deckMarkdown).toContain('Retry --> Done');
	});

	test('repeats sequence participants when splitting oversized sequence diagrams', () => {
		const audit: SlidevLayoutAudit = {
			slide: 2,
			safeRect: { left: 51.2, top: 43.2, right: 1228.8, bottom: 676.8, width: 1177.6, height: 633.6 },
			contentBounds: { left: 48, top: 52, right: 1234, bottom: 920, width: 1186, height: 868 },
			pageScale: 0.30,
			elementKinds: ['mermaid'],
			findings: [
				{
					kind: 'overflow',
					target: 'content',
					message: 'Slide content exceeds the safe visible rectangle',
					recommendedPatch: 'split-diagram',
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
		expect(patched.blockedSlides).toEqual([]);
		expect(countSlideDeckSlides(patched.deckMarkdown)).toBe(3);
		expect((patched.deckMarkdown.match(/participant User/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/participant Plugin/g) || []).length).toBe(2);
		expect((patched.deckMarkdown.match(/```mermaid/g) || []).length).toBe(2);
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

	test('summarizes audit counts across slides', () => {
		const auditWithOverflow = analyzeRenderedSlideMeasurement(createMeasurement());
		const auditWithRenderError = analyzeRenderedSlideMeasurement(createMeasurement({
			slideRoot: null,
			safeRect: null,
			contentBounds: null,
			elements: [],
			errors: ['Slide root not found'],
		}));

		const summary = summarizeLayoutAudits([auditWithOverflow, auditWithRenderError], 1);

		expect(summary.slideCount).toBe(2);
		expect(summary.overflowCount).toBeGreaterThan(0);
		expect(summary.renderErrorCount).toBe(1);
		expect(summary.retryCount).toBe(1);
	});
});
