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

	test('derives fit scale from the verifier safe rectangle instead of the raw slide root', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement());
		const contentFinding = audit.findings.find(finding => finding.target === 'content');

		expect(contentFinding?.recommendedScale).toBeCloseTo(0.816, 2);
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

	test('derives a smaller recommended scale from table scroll overflow even when the outer rect fits', () => {
		const audit = analyzeRenderedSlideMeasurement(createMeasurement({
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
		}));

		const tableFinding = audit.findings.find(finding => finding.target === 'table');
		expect(tableFinding?.recommendedPatch).toBe('split-table');
		expect(tableFinding?.recommendedScale).toBeCloseTo(0.5, 2);
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
		expect(patched.deckMarkdown).toContain('zoom: 0.369');
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
		expect(patched.deckMarkdown).not.toContain('| Provider | Model | Runtime | Token Ceiling | Fallback Route | Deployment Notes | Verification Marker |');
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
			'- Split Mermaid when unreadable',
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
