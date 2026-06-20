import { formatSlideLayoutPlanForPrompt, planSlidevMarkdownLayout } from '../slideExport/slidevLayoutPlan';

describe('slidevLayoutPlan', () => {
	test('preserves dense Mermaid source while marking table and code sections as pre-split candidates', () => {
		const markdown = [
			'# Architecture',
			'',
			'## Runtime Graph',
			'',
			'```mermaid',
			'flowchart TB',
			'  A --> B',
			'  B --> C',
			'  C --> D',
			'  D --> E',
			'  E --> F',
			'  F --> G',
			'  G --> H',
			'  H --> I',
			'  I --> J',
			'  J --> K',
			'  K --> L',
			'  L --> M',
			'  M --> N',
			'  N --> O',
			'  O --> P',
			'  P --> Q',
			'  Q --> R',
			'  R --> S',
			'  S --> T',
			'  T --> U',
			'  U --> V',
			'  V --> W',
			'  W --> X',
			'```',
			'',
			'## Provider Matrix',
			'',
			'| Provider | Model | Runtime | Token Ceiling | Fallback Route | Deployment Notes |',
			'| --- | --- | --- | --- | --- | --- |',
			'| OpenAI | gpt-4o-production | hosted | 16k | primary::north-america::zero-downtime | default hosted profile |',
			'| Anthropic | claude-sonnet-extended | hosted | 64k | secondary::global-router::latency-balanced | long context profile |',
			'',
			'## Export Code',
			'',
			'```ts',
			'const environment = await probeEnvironment();',
			'const slideSource = await prepareSlidevExportSource(app, sourceFile, config, {}, onProgress);',
			'const htmlPath = await exportSlidevHtml(app, slideSource, config, onProgress);',
			'const auditResult = await runPlaywrightChecks(htmlPath, slidesToAudit, true, slideExport);',
			'const patchResult = patchDeckWithLayoutAudit(deckMarkdown, auditResult.layoutAudits, config);',
			'if (patchResult.changed) {',
			'  await exportSlidevHtml(app, slideSource, config, onProgress);',
			'}',
			'```',
		].join('\n');

		const plan = planSlidevMarkdownLayout(markdown, 'architecture');
		const promptText = formatSlideLayoutPlanForPrompt(plan);

		expect(plan.sourceTitle).toBe('Architecture');
		expect(plan.preSplitCount).toBeGreaterThan(0);
		expect(plan.fitReviewCount).toBeGreaterThan(0);
		expect(plan.slides.some(slide => slide.recommendedAction === 'preserve-source-fit')).toBe(true);
		expect(plan.slides.some(slide => slide.recommendedAction === 'pre-split')).toBe(true);
		expect(promptText).toContain('Pre-split candidates:');
		expect(promptText).toContain('Source-preserving fit reviews:');
		expect(promptText).toContain('Mermaid');
		expect(promptText).toContain('preserve Mermaid source');
		expect(promptText).toContain('fit stressors');
		expect(promptText).toContain('split table');
		expect(promptText).toContain('split code');
	});
});
