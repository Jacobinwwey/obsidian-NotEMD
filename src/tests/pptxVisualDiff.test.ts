import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const {
	evaluateVisualGate,
	pairPngSequences,
	parseCompareMetric,
	summarizePageMetrics,
} = require('../../scripts/lib/pptx-visual-diff');

describe('pptx visual diff helper', () => {
	test('parses ImageMagick normalized RMSE output', () => {
		expect(parseCompareMetric('17068.7 (0.260447)').value).toBeCloseTo(0.260447, 6);
		expect(parseCompareMetric('17068.7 (0.260447)').normalized).toBe(true);
		expect(parseCompareMetric('42').value).toBe(42);
		expect(parseCompareMetric('42').normalized).toBe(false);
	});

	test('pairs PNG sequences by page number rather than lexical order', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visual-diff-'));
		const reference = join(directory, 'reference');
		const rendered = join(directory, 'rendered');
		try {
			require('fs').mkdirSync(reference);
			require('fs').mkdirSync(rendered);
			writeFileSync(join(reference, '1.png'), '');
			writeFileSync(join(reference, '10.png'), '');
			writeFileSync(join(reference, '2.png'), '');
			writeFileSync(join(rendered, 'slide-01.png'), '');
			writeFileSync(join(rendered, 'slide-02.png'), '');
			writeFileSync(join(rendered, 'slide-10.png'), '');

			const pairs = pairPngSequences(reference, rendered);

			expect(pairs.map((pair: { referencePath: string }) => pair.referencePath.split('/').pop())).toEqual(['1.png', '2.png', '10.png']);
			expect(pairs.map((pair: { renderedPath: string }) => pair.renderedPath.split('/').pop())).toEqual(['slide-01.png', 'slide-02.png', 'slide-10.png']);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('summarizes and gates per-page RMSE metrics', () => {
		const summary = summarizePageMetrics([
			{ slide: 1, referencePath: '1.png', renderedPath: 'slide-01.png', rmseNormalized: 0.03, absoluteErrorRatio: 0.1 },
			{ slide: 2, referencePath: '2.png', renderedPath: 'slide-02.png', rmseNormalized: 0.16, absoluteErrorRatio: 0.3 },
		]);

		expect(summary.meanRmse).toBeCloseTo(0.095, 6);
		expect(summary.maxRmse).toBeCloseTo(0.16, 6);
		expect(summary.worstSlides[0].slide).toBe(2);
		expect(evaluateVisualGate(summary, { maxRmse: 0.12, meanRmse: 0.08 }).passed).toBe(false);
		expect(evaluateVisualGate(summary, { maxRmse: 0.2, meanRmse: 0.1 }).passed).toBe(true);
	});
});
