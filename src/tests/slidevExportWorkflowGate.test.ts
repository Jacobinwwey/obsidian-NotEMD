const {
	buildRenderedLayoutGate,
	buildTableBodyLayoutGate,
} = require('../../scripts/verify-slidev-export-workflow.cjs');

describe('Slidev export workflow layout gates', () => {
	test('fails table/body gate for content findings on table or body-text slides', () => {
		const gate = buildTableBodyLayoutGate([
			{
				slide: 3,
				elementKinds: ['table', 'text'],
				findings: [
					{
						kind: 'overflow',
						target: 'content',
						message: 'Slide content exceeds the safe visible rectangle',
					},
				],
			},
			{
				slide: 4,
				elementKinds: ['text'],
				findings: [
					{
						kind: 'low-effective-font',
						target: 'text',
						message: 'Body text is too small after scaling',
					},
				],
			},
		]);

		expect(gate).toEqual({
			passed: false,
			auditedSlideCount: 2,
			tableSlideCount: 1,
			bodyTextSlideCount: 2,
			failureCount: 2,
			failureSlides: [3, 4],
			failures: [
				expect.objectContaining({
					slide: 3,
					kind: 'overflow',
					target: 'content',
				}),
				expect.objectContaining({
					slide: 4,
					kind: 'low-effective-font',
					target: 'text',
				}),
			],
		});
	});

	test('ignores Mermaid-only review findings for the table/body gate', () => {
		const gate = buildTableBodyLayoutGate([
			{
				slide: 2,
				elementKinds: ['mermaid'],
				findings: [
					{
						kind: 'overflow',
						target: 'mermaid',
						message: 'Mermaid diagram needs fit review',
					},
				],
				mermaidFit: {
					status: 'source-preserved-fit-review',
				},
			},
		]);

		expect(gate.passed).toBe(true);
		expect(gate.auditedSlideCount).toBe(0);
		expect(gate.failureCount).toBe(0);
		expect(gate.failures).toEqual([]);
	});

	test('requires rendered layout audit for strict native standalone verification', () => {
		const gate = buildRenderedLayoutGate({
			required: true,
			auditedSlides: [],
			layoutAudits: [],
			playwrightChecks: [],
			auditSkippedReason: 'Playwright disabled by --no-playwright.',
		});

		expect(gate).toEqual({
			required: true,
			passed: false,
			auditedSlideCount: 0,
			failureCount: 1,
			failures: [
				{
					kind: 'audit-skipped',
					message: 'Playwright disabled by --no-playwright.',
				},
			],
		});
	});

	test('passes rendered layout gate after all audited slides have no findings', () => {
		const gate = buildRenderedLayoutGate({
			required: true,
			auditedSlides: [1, 2],
			layoutAudits: [
				{ slide: 1, findings: [] },
				{ slide: 2, findings: [] },
			],
			playwrightChecks: [
				{ slide: 1, failed: false, errors: [] },
				{ slide: 2, failed: false, errors: [] },
			],
			auditSkippedReason: null,
		});

		expect(gate).toEqual({
			required: true,
			passed: true,
			auditedSlideCount: 2,
			failureCount: 0,
			failures: [],
		});
	});
});
